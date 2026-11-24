import { describe, expect, it } from "vitest";
import { categorize, computeAqi, subIndex } from "@/lib/aqi";

describe("CPCB sub-index", () => {
  it("maps PM2.5 breakpoints to the correct band edges", () => {
    expect(subIndex("pm2_5", 0)).toBe(0);
    expect(subIndex("pm2_5", 30)).toBe(50);
    expect(subIndex("pm2_5", 60)).toBe(100);
    expect(subIndex("pm2_5", 90)).toBe(200);
    expect(subIndex("pm2_5", 120)).toBe(300);
  });

  it("interpolates linearly inside a band", () => {
    // 45 µg/m³ sits halfway in the 30-60 → 51-100 band.
    expect(subIndex("pm2_5", 45)).toBe(76);
  });

  it("caps above the top breakpoint at 500", () => {
    expect(subIndex("pm2_5", 9999)).toBe(500);
  });

  it("rejects invalid concentrations", () => {
    expect(subIndex("pm2_5", -1)).toBeNull();
    expect(subIndex("pm2_5", Number.NaN)).toBeNull();
  });
});

describe("overall AQI", () => {
  it("takes the maximum sub-index and reports the dominant pollutant", () => {
    const band = computeAqi({ pm2_5: 40, pm10: 60, no2: 10 });
    // PM2.5=40 → 67, PM10=60 → 61; PM2.5 dominates.
    expect(band.dominant).toBe("pm2_5");
    expect(band.index).toBe(67);
    expect(band.category).toBe("Satisfactory");
  });

  it("returns a no-data band when nothing is provided", () => {
    const band = computeAqi({});
    expect(band.dominant).toBeNull();
    expect(band.index).toBe(0);
  });
});

describe("categorize", () => {
  it("labels the six CPCB categories by index", () => {
    expect(categorize(25).category).toBe("Good");
    expect(categorize(90).category).toBe("Satisfactory");
    expect(categorize(150).category).toBe("Moderate");
    expect(categorize(250).category).toBe("Poor");
    expect(categorize(350).category).toBe("Very Poor");
    expect(categorize(450).category).toBe("Severe");
  });
});
