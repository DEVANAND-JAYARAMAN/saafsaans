import type { AqiBand, AqiCategory, Pollutants } from "./types";

/**
 * CPCB National Air Quality Index (India), as defined by the Central Pollution
 * Control Board (2014). Each pollutant maps to a sub-index via piecewise-linear
 * interpolation between breakpoints; the overall AQI is the maximum sub-index,
 * and the pollutant responsible is the "dominant" pollutant.
 *
 * Breakpoint tables: CPCB "National Air Quality Index" report (2014), Annexure.
 *
 * Honesty note: Open-Meteo returns modelled hourly concentrations. True CPCB AQI
 * uses pollutant-specific averaging windows (24h for PM, 8h for O3/CO). We treat
 * the hourly value as an *indicative* input and label it as such in the UI — this
 * is an index estimate, not a regulatory measurement.
 */

interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

// Concentration breakpoints in provider units: PM/NO2/O3/SO2 in ug/m3, CO in mg/m3.
const TABLES: Record<keyof Pollutants, Breakpoint[]> = {
  pm2_5: [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },
    { cLow: 30, cHigh: 60, iLow: 51, iHigh: 100 },
    { cLow: 60, cHigh: 90, iLow: 101, iHigh: 200 },
    { cLow: 90, cHigh: 120, iLow: 201, iHigh: 300 },
    { cLow: 120, cHigh: 250, iLow: 301, iHigh: 400 },
    { cLow: 250, cHigh: 500, iLow: 401, iHigh: 500 },
  ],
  pm10: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 100, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 250, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 350, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 430, cHigh: 600, iLow: 401, iHigh: 500 },
  ],
  no2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 80, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 180, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 280, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 400, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
  o3: [
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 50, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 100, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 168, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 208, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 748, cHigh: 1000, iLow: 401, iHigh: 500 },
  ],
  so2: [
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 40, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 80, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 380, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 800, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1600, cHigh: 2000, iLow: 401, iHigh: 500 },
  ],
  co: [
    { cLow: 0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.0, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.0, cHigh: 10, iLow: 101, iHigh: 200 },
    { cLow: 10, cHigh: 17, iLow: 201, iHigh: 300 },
    { cLow: 17, cHigh: 34, iLow: 301, iHigh: 400 },
    { cLow: 34, cHigh: 50, iLow: 401, iHigh: 500 },
  ],
};

const POLLUTANT_LABEL: Record<keyof Pollutants, string> = {
  pm2_5: "PM2.5",
  pm10: "PM10",
  no2: "NO₂",
  o3: "O₃",
  so2: "SO₂",
  co: "CO",
};

export function pollutantLabel(key: keyof Pollutants): string {
  return POLLUTANT_LABEL[key];
}

/** Compute the CPCB sub-index for a single pollutant concentration. */
export function subIndex(pollutant: keyof Pollutants, concentration: number): number | null {
  if (!Number.isFinite(concentration) || concentration < 0) return null;
  const table = TABLES[pollutant];
  for (const bp of table) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const ratio = (bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow);
      return Math.round(bp.iLow + ratio * (concentration - bp.cLow));
    }
  }
  // Above the top breakpoint: cap at 500 (CPCB convention).
  return 500;
}

const CATEGORY_META: { max: number; category: AqiCategory; color: string; label: string }[] = [
  { max: 50, category: "Good", color: "#4caf50", label: "Minimal impact." },
  {
    max: 100,
    category: "Satisfactory",
    color: "#a3c853",
    label: "Minor breathing discomfort for sensitive people.",
  },
  {
    max: 200,
    category: "Moderate",
    color: "#f6d242",
    label: "Breathing discomfort for people with lung/heart disease.",
  },
  {
    max: 300,
    category: "Poor",
    color: "#f99a1c",
    label: "Breathing discomfort for most on prolonged exposure.",
  },
  {
    max: 400,
    category: "Very Poor",
    color: "#e63946",
    label: "Respiratory illness on prolonged exposure.",
  },
  {
    max: 500,
    category: "Severe",
    color: "#8e24aa",
    label: "Serious impact even for healthy people.",
  },
];

export function categorize(index: number): { category: AqiCategory; color: string; label: string } {
  for (const meta of CATEGORY_META) {
    if (index <= meta.max) return { category: meta.category, color: meta.color, label: meta.label };
  }
  const last = CATEGORY_META[CATEGORY_META.length - 1]!;
  return { category: last.category, color: last.color, label: last.label };
}

/** Compute the overall CPCB AQI band from a set of pollutants. */
export function computeAqi(pollutants: Pollutants): AqiBand {
  let worst = -1;
  let dominant: keyof Pollutants | null = null;
  (Object.keys(TABLES) as (keyof Pollutants)[]).forEach((key) => {
    const value = pollutants[key];
    if (value === undefined) return;
    const si = subIndex(key, value);
    if (si !== null && si > worst) {
      worst = si;
      dominant = key;
    }
  });
  if (worst < 0) {
    return {
      index: 0,
      category: "Good",
      dominant: null,
      color: "#9aa4b2",
      label: "No data available.",
    };
  }
  const meta = categorize(worst);
  return { index: worst, category: meta.category, dominant, color: meta.color, label: meta.label };
}
