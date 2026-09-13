import { describe, expect, it } from "vitest";
import { mileageScore } from "./mileageScore";

describe("mileageScore", () => {
  it("scores exactly-expected mileage (12k/year) at 50", () => {
    // 4 years old, 48,000 miles = exactly 12k/year.
    expect(mileageScore(48000, 2022, 2026)).toBe(50);
  });

  it("scores below-average mileage higher than 50", () => {
    expect(mileageScore(20000, 2022, 2026)).toBeGreaterThan(50);
  });

  it("scores above-average mileage lower than 50", () => {
    expect(mileageScore(80000, 2022, 2026)).toBeLessThan(50);
  });

  it("clamps at 100 for extremely low mileage", () => {
    expect(mileageScore(100, 2022, 2026)).toBe(100);
  });

  it("clamps at 0 for extremely high mileage", () => {
    expect(mileageScore(500000, 2022, 2026)).toBe(0);
  });

  it("doesn't divide by zero for the current model year", () => {
    expect(() => mileageScore(500, 2026, 2026)).not.toThrow();
  });
});
