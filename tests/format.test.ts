import { describe, expect, it } from "vitest";
import { clamp, fmtMass, fmtPercent, round } from "@/lib/format";

describe("round", () => {
  it("rounds to the given decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
    expect(round(10.9)).toBe(11);
  });
});

describe("fmtMass", () => {
  it("shows micrograms below 1000 and milligrams above", () => {
    expect(fmtMass(500)).toBe("500 µg");
    expect(fmtMass(1500)).toBe("1.5 mg");
  });
});

describe("fmtPercent", () => {
  it("formats a fraction as a whole percentage", () => {
    expect(fmtPercent(0.5)).toBe("50%");
    expect(fmtPercent(0.333)).toBe("33%");
  });
});

describe("clamp", () => {
  it("bounds a value between min and max", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
