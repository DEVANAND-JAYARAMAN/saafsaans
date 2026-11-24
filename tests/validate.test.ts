import { describe, expect, it } from "vitest";
import { parseProfile } from "@/lib/validate";

const base = {
  city: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  members: [{ name: "Aarav", persona: "child" }],
  commuteMode: "auto",
  commuteKm: 8,
  cookingFuel: "lpg",
  hasPurifier: false,
  purifierCadr: 0,
  roomAreaSqm: 14,
  roomHeightM: 3,
  outdoorActivityMinutes: 60,
};

describe("parseProfile — rejection", () => {
  it("rejects non-objects", () => {
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile("nope")).toBeNull();
    expect(parseProfile(42)).toBeNull();
  });

  it("rejects out-of-range coordinates", () => {
    expect(parseProfile({ ...base, latitude: 200 })).toBeNull();
    expect(parseProfile({ ...base, longitude: -999 })).toBeNull();
    expect(parseProfile({ ...base, latitude: "abc" })).toBeNull();
  });
});

describe("parseProfile — normalisation", () => {
  it("accepts and normalises a valid profile", () => {
    const p = parseProfile(base);
    expect(p).not.toBeNull();
    expect(p!.city).toBe("Delhi");
    expect(p!.members[0]!.persona).toBe("child");
  });

  it("defaults unknown enums to safe values", () => {
    const p = parseProfile({
      ...base,
      commuteMode: "teleport",
      cookingFuel: "plutonium",
      members: [{ name: "X", persona: "dragon" }],
    });
    expect(p!.commuteMode).toBe("auto");
    expect(p!.cookingFuel).toBe("lpg");
    expect(p!.members[0]!.persona).toBe("adult");
  });

  it("clamps numeric fields into range", () => {
    const hi = parseProfile({ ...base, commuteKm: 9999, roomHeightM: 99 });
    expect(hi!.commuteKm).toBe(200);
    expect(hi!.roomHeightM).toBe(6);
    const lo = parseProfile({ ...base, commuteKm: -5, roomAreaSqm: 0 });
    expect(lo!.commuteKm).toBe(0);
    expect(lo!.roomAreaSqm).toBe(2);
  });

  it("caps members at 10 and truncates long names", () => {
    const many = Array.from({ length: 25 }, () => ({ name: "a".repeat(100), persona: "adult" }));
    const p = parseProfile({ ...base, members: many });
    expect(p!.members.length).toBe(10);
    expect(p!.members[0]!.name.length).toBe(40);
  });

  it("supplies a default member when none are given", () => {
    const p = parseProfile({ ...base, members: [] });
    expect(p!.members.length).toBe(1);
    expect(p!.members[0]!.name).toBe("You");
  });
});
