import { describe, expect, it } from "vitest";
import { PLEDGES, tallyPledges } from "@/lib/community";

describe("community pledge tally", () => {
  it("sums CO2 and PM2.5 across selected pledges", () => {
    const t = tallyPledges(["metro_week", "no_burning"]);
    expect(t.co2Kg).toBeCloseTo(18.5, 5);
    expect(t.pm25Grams).toBeCloseTo(10.8, 5);
  });

  it("ignores unknown ids and returns zero for none", () => {
    expect(tallyPledges([]).co2Kg).toBe(0);
    expect(tallyPledges(["does_not_exist"]).co2Kg).toBe(0);
  });

  it("derives a non-negative tree equivalent", () => {
    const t = tallyPledges(PLEDGES.map((p) => p.id));
    expect(t.treeEquivalent).toBeGreaterThan(0);
  });
});
