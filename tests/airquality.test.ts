import { describe, expect, it } from "vitest";
import { demoSnapshot } from "@/lib/airquality";

describe("demo snapshot (offline fallback)", () => {
  const snap = demoSnapshot(28.61, 77.21, "Delhi");

  it("is clearly labelled as a demonstration, not a measurement", () => {
    expect(snap.source.toLowerCase()).toContain("demonstration");
    expect(snap.provenance.toLowerCase()).toContain("demo");
  });

  it("models a severe winter-smog scenario with a computed AQI", () => {
    expect(snap.pollutants.pm2_5).toBeGreaterThan(150);
    expect(snap.aqi.index).toBeGreaterThan(300);
    expect(snap.aqi.dominant).toBe("pm2_5");
  });

  it("echoes the requested location", () => {
    expect(snap.city).toBe("Delhi");
    expect(snap.latitude).toBe(28.61);
  });
});
