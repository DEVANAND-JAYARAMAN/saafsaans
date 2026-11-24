// Small formatting helpers shared across UI and engine.

export function round(value: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

export function fmtMass(ug: number): string {
  if (ug >= 1000) return `${round(ug / 1000, 2)} mg`;
  return `${round(ug, 1)} µg`;
}

export function fmtPercent(fraction: number): string {
  return `${round(fraction * 100)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
