import { describe, expect, it } from "vitest";
import { ageScore } from "./ageScore";

describe("ageScore", () => {
  it("scores a brand-new (current model year) vehicle at 100", () => {
    expect(ageScore(2026, 2026)).toBe(100);
  });

  it("scores lower the older the vehicle", () => {
    expect(ageScore(2020, 2026)).toBeLessThan(ageScore(2024, 2026));
  });

  it("clamps at 0 for a very old vehicle rather than going negative", () => {
    expect(ageScore(1990, 2026)).toBe(0);
  });

  it("never scores above 100 for a future model year (shouldn't happen, but don't blow up)", () => {
    expect(ageScore(2027, 2026)).toBe(100);
  });
});
