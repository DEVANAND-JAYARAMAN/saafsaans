import { GoogleGenAI, Type } from "@google/genai";
import type { AirSnapshot, HouseholdProfile } from "./types";
import { PERSONAS } from "./personas";
import { dailyLedger, indoorPm25, rankCommute } from "./health";
import { round } from "./format";

/**
 * The GenAI narration layer.
 *
 * Design principle — "grounded generation": we compute every quantitative claim
 * with the deterministic engine (lib/health.ts) and pass those numbers to Gemini
 * as FACTS. Gemini personalizes tone, ordering and language for the specific
 * household but is instructed never to invent or alter numbers. If no API key is
 * configured, or the call fails, we return a fully deterministic plan so the
 * product is always usable and always truthful.
 */

export interface PlanBlock {
  period: string;
  headline: string;
  action: string;
  why: string;
  impact: string;
}

export interface DailyPlan {
  greeting: string;
  riskSummary: string;
  blocks: PlanBlock[];
  indoorHacks: string[];
  sustainableSwaps: string[];
  closing: string;
  engine: "gemini" | "deterministic";
  model?: string;
}

interface GroundingFacts {
  city: string;
  aqi: number;
  category: string;
  dominant: string | null;
  pm25: number;
  cleanestCommute: { label: string; cigarettes: number };
  dirtiestCommute: { label: string; cigarettes: number };
  indoorNow: number;
  indoorWithPurifier: number;
  recommendedCadr: number;
  ledgerCigarettes: number;
  sensitiveMembers: string[];
}

function buildFacts(profile: HouseholdProfile, air: AirSnapshot): GroundingFacts {
  const pm25 = air.pollutants.pm2_5 ?? 0;
  const ranked = rankCommute(pm25, profile.commuteKm || 8);
  const cleanest = ranked[0]!;
  const dirtiest = ranked[ranked.length - 1]!;
  const volume = Math.max(profile.roomAreaSqm * profile.roomHeightM, 1);

  const indoorNoPurifier = indoorPm25({ outdoorPm25: pm25, roomVolumeM3: volume, purifierCadr: 0 });
  const indoorWithPurifier = indoorPm25({
    outdoorPm25: pm25,
    roomVolumeM3: volume,
    purifierCadr: profile.purifierCadr > 0 ? profile.purifierCadr : indoorNoPurifier.recommendedCadr,
  });

  const ledger = dailyLedger({
    outdoorPm25: pm25,
    indoorPm25: indoorWithPurifier.indoorPm25,
    members: profile.members.length || 1,
    outdoorMinutesBaseline: profile.outdoorActivityMinutes || 60,
    outdoorMinutesGuided: Math.round((profile.outdoorActivityMinutes || 60) * 0.4),
  });

  const sensitive = profile.members
    .filter((m) => PERSONAS[m.persona].sensitivity >= 1.5)
    .map((m) => `${m.name} (${PERSONAS[m.persona].label})`);

  return {
    city: profile.city,
    aqi: air.aqi.index,
    category: air.aqi.category,
    dominant: air.aqi.dominant,
    pm25: round(pm25, 0),
    cleanestCommute: { label: cleanest.label, cigarettes: cleanest.cigarettes },
    dirtiestCommute: { label: dirtiest.label, cigarettes: dirtiest.cigarettes },
    indoorNow: indoorNoPurifier.indoorPm25,
    indoorWithPurifier: indoorWithPurifier.indoorPm25,
    recommendedCadr: indoorNoPurifier.recommendedCadr,
    ledgerCigarettes: ledger.householdCigarettes,
    sensitiveMembers: sensitive,
  };
}

const planSchema = {
  type: Type.OBJECT,
  properties: {
    greeting: { type: Type.STRING },
    riskSummary: { type: Type.STRING },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING },
          headline: { type: Type.STRING },
          action: { type: Type.STRING },
          why: { type: Type.STRING },
          impact: { type: Type.STRING },
        },
        required: ["period", "headline", "action", "why", "impact"],
      },
    },
    indoorHacks: { type: Type.ARRAY, items: { type: Type.STRING } },
    sustainableSwaps: { type: Type.ARRAY, items: { type: Type.STRING } },
    closing: { type: Type.STRING },
  },
  required: ["greeting", "riskSummary", "blocks", "indoorHacks", "sustainableSwaps", "closing"],
};

const SYSTEM_INSTRUCTION = `You are SaafSaans, a warm, calm air-quality companion for Indian families facing winter smog.
RULES:
1. You are given FACTS with exact numbers computed by a verified engine. Use those numbers verbatim. NEVER invent, round differently, or change any number, pollutant value, or cigarette-equivalent.
2. Be specific and practical. Tailor advice to the named family members and their sensitivities.
3. Explain the DIRECT impact of each choice using the provided numbers (e.g. cigarettes-equivalent avoided, indoor PM2.5 reduction).
4. Never give medical diagnoses. For emergencies defer to doctors and official advisories.
5. Keep each field concise. Indian context (CPCB AQI, local realities like auto-rickshaws, incense, cooking fuel).`;

function factPrompt(facts: GroundingFacts, profile: HouseholdProfile): string {
  return `FACTS (use these numbers exactly):
City: ${facts.city}
Current CPCB AQI: ${facts.aqi} (${facts.category}), dominant pollutant: ${facts.dominant ?? "n/a"}
Outdoor PM2.5: ${facts.pm25} µg/m³
Cleanest commute for their ${profile.commuteKm} km trip: ${facts.cleanestCommute.label} (~${facts.cleanestCommute.cigarettes} cigarette-equivalents inhaled)
Most polluting commute option: ${facts.dirtiestCommute.label} (~${facts.dirtiestCommute.cigarettes} cigarette-equivalents)
Indoor PM2.5 with no mitigation: ${facts.indoorNow} µg/m³
Indoor PM2.5 with a right-sized purifier: ${facts.indoorWithPurifier} µg/m³
Recommended clean-air purifier CADR for their room: ${facts.recommendedCadr} m³/h
Estimated household PM2.5 avoided by following this plan today: ~${facts.ledgerCigarettes} cigarette-equivalents
Cooking fuel: ${profile.cookingFuel}; Has purifier: ${profile.hasPurifier}
Most sensitive members: ${facts.sensitiveMembers.length ? facts.sensitiveMembers.join(", ") : "none flagged"}
Family: ${profile.members.map((m) => `${m.name} [${PERSONAS[m.persona].label}]`).join(", ")}

Produce a JSON daily plan with morning/afternoon/evening/night blocks plus indoor hacks and sustainable swaps. Weave the family members' names in naturally.`;
}

/**
 * Candidate models, tried in order. "lite" aliases are listed as resilient
 * fallbacks because the full-flash tiers can return transient 503 "high demand"
 * errors on the free tier. Aliases (…-latest) never 404 when the underlying
 * model is retired, so the app keeps working long after submission.
 */
function modelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const defaults = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.5-flash-lite"];
  const list = configured ? [configured, ...defaults] : defaults;
  return [...new Set(list)];
}

export async function generateDailyPlan(
  profile: HouseholdProfile,
  air: AirSnapshot,
): Promise<DailyPlan> {
  const facts = buildFacts(profile, air);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return deterministicPlan(facts, profile);

  const ai = new GoogleGenAI({ apiKey });
  const contents = factPrompt(facts, profile);
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: planSchema,
    temperature: 0.7,
    maxOutputTokens: 2048,
  } as const;

  for (const model of modelCandidates()) {
    try {
      const response = await ai.models.generateContent({ model, contents, config });
      const text = response.text;
      if (!text) continue;
      const parsed = JSON.parse(text) as Omit<DailyPlan, "engine" | "model">;
      return { ...parsed, engine: "gemini", model };
    } catch {
      // Try the next candidate (e.g. on 503/404) before giving up.
    }
  }

  return deterministicPlan(facts, profile);
}

/** Transparent deterministic fallback — always truthful, always available. */
export function deterministicPlan(
  facts: ReturnType<typeof buildFacts>,
  profile: HouseholdProfile,
): DailyPlan {
  const names = profile.members.map((m) => m.name).filter(Boolean);
  const who = names.length ? names.join(", ") : "your family";
  const sensitiveLine = facts.sensitiveMembers.length
    ? `Extra care today for ${facts.sensitiveMembers.join(", ")}.`
    : "";

  return {
    engine: "deterministic",
    greeting: `Good morning, ${who}. Here is your air-smart plan for ${facts.city}.`,
    riskSummary: `CPCB AQI is ${facts.aqi} (${facts.category}) with PM2.5 near ${facts.pm25} µg/m³. ${sensitiveLine}`,
    blocks: [
      {
        period: "Morning",
        headline: "Delay outdoor exertion",
        action: "Shift workouts and outdoor play to indoors, or wait for the wind to pick up after mid-morning.",
        why: "PM2.5 peaks overnight and early morning during winter inversions.",
        impact: `Cutting hard outdoor exertion today saves the household roughly ${facts.ledgerCigarettes} cigarette-equivalents of PM2.5.`,
      },
      {
        period: "Commute",
        headline: `Prefer ${facts.cleanestCommute.label}`,
        action: `For your ${profile.commuteKm} km trip, ${facts.cleanestCommute.label} is cleanest; avoid ${facts.dirtiestCommute.label} if you can.`,
        why: "Enclosed, filtered or lower-traffic modes cut in-cabin PM2.5.",
        impact: `${facts.cleanestCommute.label}: ~${facts.cleanestCommute.cigarettes} vs ${facts.dirtiestCommute.label}: ~${facts.dirtiestCommute.cigarettes} cigarette-equivalents.`,
      },
      {
        period: "Afternoon",
        headline: "Open windows only if wind clears the air",
        action: "Check the live reading before ventilating; keep windows shut while AQI stays Poor or worse.",
        why: `Indoor PM2.5 can sit near ${facts.indoorNow} µg/m³ without mitigation.`,
        impact: `A right-sized purifier (CADR ${facts.recommendedCadr} m³/h) brings indoor PM2.5 down to about ${facts.indoorWithPurifier} µg/m³.`,
      },
      {
        period: "Evening",
        headline: "Protect cooking and lamp-lighting hours",
        action:
          profile.cookingFuel === "wood" || profile.cookingFuel === "kerosene"
            ? "Switch to LPG/induction where possible and ventilate the kitchen mechanically."
            : "Use the kitchen exhaust and avoid incense/dhoop indoors during smog.",
        why: "Combustion indoors spikes PM2.5 right where the family gathers.",
        impact: "Cleaner cooking removes a major indoor PM2.5 source at its origin.",
      },
      {
        period: "Night",
        headline: "Create a clean-air sleep room",
        action: "Run the purifier in the bedroom with the door shut an hour before sleep.",
        why: "You breathe ~8 hours here; it is the highest-leverage room to clean.",
        impact: `Target ~${facts.indoorWithPurifier} µg/m³ for restful, lower-dose sleep.`,
      },
    ],
    indoorHacks: [
      `Build a Corsi-Rosenthal box fan filter (~₹2,000) for a DIY CADR near ${facts.recommendedCadr} m³/h.`,
      "Seal window/door gaps with weather-strip tape to cut smog infiltration.",
      "Keep indoor plants for wellbeing, but don't rely on them to clean PM2.5 — physics favours filters.",
      "Damp-mop instead of dry-sweeping to avoid re-suspending settled dust.",
    ],
    sustainableSwaps: [
      "Car-pool or combine errands to cut both your exposure and tailpipe emissions.",
      "Choose the metro for longer trips — lower exposure and lower per-km emissions.",
      "Replace a wood/kerosene stove with LPG or induction.",
      "Join a neighbourhood no-burn pledge to tackle the airshed, not just your room.",
    ],
    closing: "Small, timed choices compound. Breathe easy, stay safe.",
  };
}
