import { describe, expect, it } from "vitest";
import { dealerQualityScore } from "./dealerQualityScore";

describe("dealerQualityScore", () => {
  it("scores unknown photo count as neutral (50), not penalized", () => {
    expect(dealerQualityScore(undefined)).toBe(50);
    expect(dealerQualityScore(null)).toBe(50);
  });

  it("scores zero photos at 0", () => {
    expect(dealerQualityScore(0)).toBe(0);
  });

  it("scores 20+ photos at the max", () => {
    expect(dealerQualityScore(20)).toBe(100);
    expect(dealerQualityScore(40)).toBe(100);
  });

  it("scores linearly in between", () => {
    expect(dealerQualityScore(10)).toBe(50);
  });
});
