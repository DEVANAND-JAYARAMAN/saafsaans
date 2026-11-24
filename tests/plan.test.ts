import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateDailyPlan } from "@/lib/gemini";
import { demoSnapshot } from "@/lib/airquality";
import type { HouseholdProfile } from "@/lib/types";

const profile: HouseholdProfile = {
  city: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  members: [
    { id: "m1", name: "Aarav", persona: "child" },
    { id: "m2", name: "Dadi", persona: "senior" },
  ],
  commuteMode: "auto",
  commuteKm: 8,
  cookingFuel: "lpg",
  hasPurifier: false,
  purifierCadr: 0,
  roomAreaSqm: 14,
  roomHeightM: 3,
  outdoorActivityMinutes: 60,
  updatedAt: 0,
};

describe("deterministic plan fallback (no API key)", () => {
  let savedKey: string | undefined;

  beforeAll(() => {
    savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    if (savedKey !== undefined) process.env.GEMINI_API_KEY = savedKey;
  });

  it("returns a complete, grounded plan without calling any model", async () => {
    const air = demoSnapshot(profile.latitude, profile.longitude, profile.city);
    const plan = await generateDailyPlan(profile, air);

    expect(plan.engine).toBe("deterministic");
    expect(plan.greeting).toContain("Delhi");
    expect(plan.blocks.length).toBe(5);
    expect(plan.indoorHacks.length).toBeGreaterThan(0);
    expect(plan.sustainableSwaps.length).toBeGreaterThan(0);
  });

  it("names the most sensitive members in the risk summary", async () => {
    const air = demoSnapshot(profile.latitude, profile.longitude, profile.city);
    const plan = await generateDailyPlan(profile, air);
    expect(plan.riskSummary).toMatch(/Aarav|Dadi/);
  });

  it("includes a quantified impact in every block", async () => {
    const air = demoSnapshot(profile.latitude, profile.longitude, profile.city);
    const plan = await generateDailyPlan(profile, air);
    for (const block of plan.blocks) {
      expect(block.impact.length).toBeGreaterThan(0);
    }
  });
});
