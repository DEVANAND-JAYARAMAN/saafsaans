import { round } from "./format";

/**
 * Community action engine.
 *
 * Each pledge carries a transparent avoided-emissions estimate using published
 * emission factors. CO2 figures use typical Indian passenger-car intensity
 * (~0.17 kg CO2 per km, ARAI/IPCC range) and household fuel-switch estimates.
 * These are per-week estimates to keep the mental model simple.
 */

export interface PledgeDef {
  id: string;
  title: string;
  emoji: string;
  detail: string;
  co2KgPerWeek: number;
  pm25GramsPerWeek: number;
}

export const PLEDGES: PledgeDef[] = [
  {
    id: "car_free_day",
    title: "One car-free day a week",
    emoji: "🚶",
    detail: "Walk, cycle or take the metro for a day instead of driving ~25 km.",
    co2KgPerWeek: 4.3,
    pm25GramsPerWeek: 0.6,
  },
  {
    id: "metro_week",
    title: "Metro instead of car for the week",
    emoji: "🚇",
    detail: "Shift a 10 km daily commute from car to metro for 5 days.",
    co2KgPerWeek: 12.5,
    pm25GramsPerWeek: 1.8,
  },
  {
    id: "no_burning",
    title: "No leaf or waste burning",
    emoji: "🔥",
    detail: "Compost or bag garden/household waste instead of burning it.",
    co2KgPerWeek: 6.0,
    pm25GramsPerWeek: 9.0,
  },
  {
    id: "lpg_switch",
    title: "Cook on LPG/induction, not biomass",
    emoji: "🍳",
    detail: "Replace a wood/kerosene stove for the household's cooking.",
    co2KgPerWeek: 7.0,
    pm25GramsPerWeek: 14.0,
  },
  {
    id: "carpool",
    title: "Car-pool the school/office run",
    emoji: "🚗",
    detail: "Share one vehicle for a trip two of you made separately.",
    co2KgPerWeek: 8.5,
    pm25GramsPerWeek: 1.1,
  },
  {
    id: "diy_filter",
    title: "Build & share a DIY box filter",
    emoji: "🛠️",
    detail: "Protect one more indoor space and show a neighbour how.",
    co2KgPerWeek: 0,
    pm25GramsPerWeek: 0,
  },
];

export interface PledgeTally {
  co2Kg: number;
  pm25Grams: number;
  treeEquivalent: number; // mature trees needed to absorb this CO2 in a year, scaled to the week
}

/**
 * A mature tree absorbs ~21 kg CO2 per year (~0.4 kg/week). We express the weekly
 * CO2 saving as an equivalent number of trees working for that week.
 */
const TREE_CO2_KG_PER_WEEK = 0.4;

export function tallyPledges(selectedIds: string[]): PledgeTally {
  const selected = PLEDGES.filter((p) => selectedIds.includes(p.id));
  const co2 = selected.reduce((s, p) => s + p.co2KgPerWeek, 0);
  const pm = selected.reduce((s, p) => s + p.pm25GramsPerWeek, 0);
  return {
    co2Kg: round(co2, 1),
    pm25Grams: round(pm, 1),
    treeEquivalent: round(co2 / TREE_CO2_KG_PER_WEEK, 0),
  };
}
