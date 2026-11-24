import { VENTILATION_M3_PER_H } from "./personas";
import type { ActivityLevel, CommuteMode } from "./types";
import { clamp, round } from "./format";

/**
 * SaafSaans deterministic health-exposure engine.
 *
 * Every impact number the app shows a user is computed here from transparent,
 * citable relationships — never invented by the language model. The GenAI layer
 * only *narrates* these numbers. This is what lets us honestly claim to "clearly
 * explain the direct impact of a user's choices".
 *
 * Core references:
 *  - Inhaled dose: dose(µg) = concentration(µg/m³) × ventilation(m³/h) × time(h).
 *  - Ventilation rates: US EPA Exposure Factors Handbook (2011), Ch.6.
 *  - Cigarette equivalence: Berkeley Earth (Muller, 2015) — inhaling ~440 µg of
 *    PM2.5 is roughly one cigarette's particulate load; equivalently a 24h average
 *    of ~22 µg/m³ ≈ 1 cigarette/day.
 *  - Indoor mass-balance steady state: Cin/Cout = P·a / (a + k + λ), where
 *    P = penetration, a = air exchange (infiltration), k = deposition,
 *    λ = CADR/Volume (clean-air delivery). (Standard indoor-aerosol physics,
 *    e.g. Nazaroff 2004; Corsi-Rosenthal community literature.)
 */

/** µg of inhaled PM2.5 that approximates one cigarette's particulate load. */
export const UG_PER_CIGARETTE = 440;

/** Inhaled PM2.5 dose in micrograms. */
export function inhaledDose(
  concentrationUgM3: number,
  activity: ActivityLevel,
  minutes: number,
): number {
  const ventilation = VENTILATION_M3_PER_H[activity];
  const hours = minutes / 60;
  return concentrationUgM3 * ventilation * hours;
}

/** Convert an inhaled PM2.5 dose (µg) to cigarette-equivalents. */
export function cigaretteEquivalent(doseUg: number): number {
  return doseUg / UG_PER_CIGARETTE;
}

export interface IndoorModelInput {
  outdoorPm25: number;
  roomVolumeM3: number;
  purifierCadr: number; // m3/h, 0 = none
  windowsOpen?: boolean;
}

export interface IndoorModelResult {
  indoorPm25: number;
  reductionFraction: number; // vs outdoor
  achFromPurifier: number;
  totalAch: number;
  recommendedCadr: number; // for a "clean air" target of 5 ACH
}

/**
 * Steady-state indoor PM2.5 using the mass-balance model.
 * Defaults reflect a typical urban dwelling with windows shut during smog.
 */
export function indoorPm25(input: IndoorModelInput): IndoorModelResult {
  const P = input.windowsOpen ? 1.0 : 0.7; // penetration factor
  const a = input.windowsOpen ? 2.0 : 0.5; // infiltration / air-exchange (1/h)
  const k = 0.2; // PM2.5 deposition rate (1/h)
  const volume = Math.max(input.roomVolumeM3, 1);
  const lambda = input.purifierCadr > 0 ? input.purifierCadr / volume : 0; // clean air delivery (1/h)

  const ratio = (P * a) / (a + k + lambda);
  const indoor = input.outdoorPm25 * ratio;
  const reduction = clamp(1 - indoor / Math.max(input.outdoorPm25, 0.0001), 0, 1);

  // Target of 5 air changes per hour of CLEAN air is a common "smog room" goal.
  const recommendedCadr = round(5 * volume, 0);

  return {
    indoorPm25: round(indoor, 1),
    reductionFraction: round(reduction, 3),
    achFromPurifier: round(lambda, 2),
    totalAch: round(a + k + lambda, 2),
    recommendedCadr,
  };
}

interface ModeProfile {
  label: string;
  speedKmh: number;
  exposureRatio: number; // in-cabin PM2.5 relative to ambient roadside
  activity: ActivityLevel;
  emoji: string;
}

/**
 * Commute mode profiles. Exposure ratios are drawn from in-vehicle vs ambient
 * PM studies (e.g. Int. Panis et al. 2010 for active modes; cabin-filtration and
 * recirculation studies for cars). Active modes carry extra inhaled dose because
 * of elevated ventilation, which the dose formula captures via `activity`.
 */
const MODE: Record<CommuteMode, ModeProfile> = {
  walk: { label: "Walk", speedKmh: 5, exposureRatio: 1.0, activity: "moderate", emoji: "🚶" },
  cycle: { label: "Cycle", speedKmh: 15, exposureRatio: 1.0, activity: "vigorous", emoji: "🚴" },
  bike: {
    label: "Motorbike",
    speedKmh: 25,
    exposureRatio: 1.15,
    activity: "sedentary",
    emoji: "🏍️",
  },
  auto: {
    label: "Auto-rickshaw",
    speedKmh: 20,
    exposureRatio: 1.2,
    activity: "sedentary",
    emoji: "🛺",
  },
  bus: { label: "Bus", speedKmh: 18, exposureRatio: 0.9, activity: "sedentary", emoji: "🚌" },
  metro: { label: "Metro", speedKmh: 32, exposureRatio: 0.75, activity: "sedentary", emoji: "🚇" },
  car_fresh: {
    label: "Car (windows/fresh air)",
    speedKmh: 24,
    exposureRatio: 0.85,
    activity: "sedentary",
    emoji: "🚗",
  },
  car_recirc: {
    label: "Car (recirc + cabin filter)",
    speedKmh: 24,
    exposureRatio: 0.4,
    activity: "sedentary",
    emoji: "🚙",
  },
};

export const COMMUTE_MODES = Object.keys(MODE) as CommuteMode[];

export interface CommuteResult {
  mode: CommuteMode;
  label: string;
  emoji: string;
  minutes: number;
  inCabinPm25: number;
  doseUg: number;
  cigarettes: number;
}

/** Compute inhaled PM2.5 for a single commute mode over a given distance. */
export function commuteExposure(
  mode: CommuteMode,
  ambientPm25: number,
  distanceKm: number,
): CommuteResult {
  const profile = MODE[mode];
  const minutes = (distanceKm / profile.speedKmh) * 60;
  const inCabin = ambientPm25 * profile.exposureRatio;
  const dose = inhaledDose(inCabin, profile.activity, minutes);
  return {
    mode,
    label: profile.label,
    emoji: profile.emoji,
    minutes: round(minutes, 0),
    inCabinPm25: round(inCabin, 1),
    doseUg: round(dose, 1),
    cigarettes: round(cigaretteEquivalent(dose), 2),
  };
}

/** Rank every commute mode cleanest-first for a trip. */
export function rankCommute(ambientPm25: number, distanceKm: number): CommuteResult[] {
  return COMMUTE_MODES.map((m) => commuteExposure(m, ambientPm25, distanceKm)).sort(
    (a, b) => a.doseUg - b.doseUg,
  );
}

export interface ActivitySwap {
  concentration: number;
  activity: ActivityLevel;
  minutes: number;
}

/** Avoided inhaled dose (µg) from choosing `alternative` over `baseline`. */
export function avoidedDose(baseline: ActivitySwap, alternative: ActivitySwap): number {
  const a = inhaledDose(baseline.concentration, baseline.activity, baseline.minutes);
  const b = inhaledDose(alternative.concentration, alternative.activity, alternative.minutes);
  return round(a - b, 1);
}

/**
 * Household daily avoided dose when the family follows SaafSaans guidance vs a
 * naive baseline. Returns both µg and cigarette-equivalents. Deterministic and
 * explainable — used to seed the "Breath Ledger".
 */
export interface LedgerInput {
  outdoorPm25: number;
  indoorPm25: number;
  members: number;
  outdoorMinutesBaseline: number; // naive outdoor exertion during smog
  outdoorMinutesGuided: number; // reduced/shifted exertion
}

export interface LedgerResult {
  perPersonUg: number;
  householdUg: number;
  householdCigarettes: number;
  note: string;
}

export function dailyLedger(input: LedgerInput): LedgerResult {
  // Baseline: exertion outdoors at outdoor concentration (moderate activity),
  // remaining waking hours indoors WITHOUT protective behaviour (windows logic
  // folded into indoor concentration already supplied by caller as `indoorPm25`).
  const baselineOutdoor = inhaledDose(input.outdoorPm25, "moderate", input.outdoorMinutesBaseline);
  const guidedOutdoor = inhaledDose(input.outdoorPm25, "moderate", input.outdoorMinutesGuided);

  // Indoor portion: baseline assumes outdoor-equivalent indoor air (no mitigation),
  // guided assumes the modelled, filtered indoor concentration for 14 waking indoor hours.
  const indoorHoursMinutes = 14 * 60 - input.outdoorMinutesGuided;
  const baselineIndoor = inhaledDose(
    input.outdoorPm25,
    "sedentary",
    14 * 60 - input.outdoorMinutesBaseline,
  );
  const guidedIndoor = inhaledDose(input.indoorPm25, "sedentary", Math.max(indoorHoursMinutes, 0));

  const perPerson = baselineOutdoor + baselineIndoor - (guidedOutdoor + guidedIndoor);
  const household = perPerson * Math.max(input.members, 1);
  return {
    perPersonUg: round(perPerson, 1),
    householdUg: round(household, 1),
    householdCigarettes: round(cigaretteEquivalent(household), 2),
    note: "Compares a smog-unaware day with a SaafSaans-guided day (shifted outdoor exertion + filtered indoor air).",
  };
}
