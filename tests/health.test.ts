import { describe, expect, it } from "vitest";
import {
  UG_PER_CIGARETTE,
  avoidedDose,
  cigaretteEquivalent,
  commuteExposure,
  inhaledDose,
  indoorPm25,
  rankCommute,
} from "@/lib/health";

describe("inhaled dose", () => {
  it("dose = concentration × ventilation × hours", () => {
    // 100 µg/m³, moderate (1.6 m³/h), 60 min → 160 µg.
    expect(inhaledDose(100, "moderate", 60)).toBeCloseTo(160, 5);
  });

  it("scales with time", () => {
    expect(inhaledDose(50, "rest", 120)).toBeCloseTo(inhaledDose(50, "rest", 60) * 2, 5);
  });
});

describe("cigarette equivalence", () => {
  it("uses the Berkeley Earth ~440 µg per cigarette anchor", () => {
    expect(cigaretteEquivalent(UG_PER_CIGARETTE)).toBeCloseTo(1, 5);
  });
});

describe("indoor mass-balance model", () => {
  it("a purifier lowers indoor PM2.5 and raises reduction", () => {
    const none = indoorPm25({ outdoorPm25: 200, roomVolumeM3: 42, purifierCadr: 0 });
    const withP = indoorPm25({ outdoorPm25: 200, roomVolumeM3: 42, purifierCadr: 300 });
    expect(withP.indoorPm25).toBeLessThan(none.indoorPm25);
    expect(withP.reductionFraction).toBeGreaterThan(none.reductionFraction);
  });

  it("recommends CADR for 5 air changes per hour", () => {
    const m = indoorPm25({ outdoorPm25: 150, roomVolumeM3: 40, purifierCadr: 0 });
    expect(m.recommendedCadr).toBe(200);
  });

  it("open windows during smog increases indoor concentration vs sealed", () => {
    const sealed = indoorPm25({ outdoorPm25: 200, roomVolumeM3: 42, purifierCadr: 0, windowsOpen: false });
    const open = indoorPm25({ outdoorPm25: 200, roomVolumeM3: 42, purifierCadr: 0, windowsOpen: true });
    expect(open.indoorPm25).toBeGreaterThan(sealed.indoorPm25);
  });
});

describe("commute exposure", () => {
  it("ranks a recirculating car cleaner than an open auto-rickshaw", () => {
    const ranked = rankCommute(180, 10);
    const carRecirc = ranked.findIndex((r) => r.mode === "car_recirc");
    const auto = ranked.findIndex((r) => r.mode === "auto");
    expect(carRecirc).toBeLessThan(auto);
  });

  it("returns positive dose and cigarette figures", () => {
    const r = commuteExposure("auto", 180, 10);
    expect(r.doseUg).toBeGreaterThan(0);
    expect(r.cigarettes).toBeGreaterThan(0);
    expect(r.minutes).toBeGreaterThan(0);
  });
});

describe("avoided dose", () => {
  it("is positive when the alternative is cleaner/shorter", () => {
    const saved = avoidedDose(
      { concentration: 200, activity: "moderate", minutes: 60 },
      { concentration: 80, activity: "sedentary", minutes: 60 },
    );
    expect(saved).toBeGreaterThan(0);
  });
});
