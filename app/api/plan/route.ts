import { NextResponse } from "next/server";
import { generateDailyPlan } from "@/lib/gemini";
import { getAirSnapshot } from "@/lib/airquality";
import type { CommuteMode, CookingFuel, FamilyMember, HouseholdProfile, PersonaId } from "@/lib/types";
import { PERSONAS } from "@/lib/personas";
import { COMMUTE_MODES } from "@/lib/health";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 12_000;
const FUELS: CookingFuel[] = ["lpg", "induction", "wood", "kerosene"];

function isPersona(v: unknown): v is PersonaId {
  return typeof v === "string" && v in PERSONAS;
}

/** Strict, fail-closed validation + normalisation of untrusted client input. */
function parseProfile(input: unknown): HouseholdProfile | null {
  if (typeof input !== "object" || input === null) return null;
  const o = input as Record<string, unknown>;

  const lat = Number(o.latitude);
  const lon = Number(o.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;

  const rawMembers = Array.isArray(o.members) ? o.members.slice(0, 10) : [];
  const members: FamilyMember[] = rawMembers
    .map((m, i): FamilyMember | null => {
      if (typeof m !== "object" || m === null) return null;
      const mm = m as Record<string, unknown>;
      const persona = isPersona(mm.persona) ? mm.persona : "adult";
      const name = (typeof mm.name === "string" ? mm.name : "").slice(0, 40) || `Member ${i + 1}`;
      return { id: `m${i}`, name, persona };
    })
    .filter((m): m is FamilyMember => m !== null);

  if (members.length === 0) members.push({ id: "m0", name: "You", persona: "adult" });

  const commuteMode = (COMMUTE_MODES as string[]).includes(String(o.commuteMode))
    ? (o.commuteMode as CommuteMode)
    : "auto";
  const cookingFuel = FUELS.includes(String(o.cookingFuel) as CookingFuel)
    ? (o.cookingFuel as CookingFuel)
    : "lpg";

  const clampNum = (v: unknown, min: number, max: number, dflt: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt;
  };

  return {
    city: (typeof o.city === "string" ? o.city : "Your area").slice(0, 80),
    latitude: lat,
    longitude: lon,
    members,
    commuteMode,
    commuteKm: clampNum(o.commuteKm, 0, 200, 8),
    cookingFuel,
    hasPurifier: Boolean(o.hasPurifier),
    purifierCadr: clampNum(o.purifierCadr, 0, 2000, 0),
    roomAreaSqm: clampNum(o.roomAreaSqm, 2, 200, 14),
    roomHeightM: clampNum(o.roomHeightM, 2, 6, 3),
    outdoorActivityMinutes: clampNum(o.outdoorActivityMinutes, 0, 600, 60),
    updatedAt: Date.now(),
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const profile = parseProfile(body);
  if (!profile) {
    return NextResponse.json({ error: "Invalid household profile." }, { status: 422 });
  }

  const air = await getAirSnapshot(profile.latitude, profile.longitude, profile.city);
  const plan = await generateDailyPlan(profile, air);
  return NextResponse.json({ plan, air });
}
