import { describe, expect, it } from "vitest";
import { trimScore } from "./trimScore";

describe("trimScore", () => {
  it("scores unknown trim as neutral (50), not penalized", () => {
    expect(trimScore(undefined)).toBe(50);
    expect(trimScore(null)).toBe(50);
    expect(trimScore("")).toBe(50);
  });

  it("scores a known but unrecognized trim above neutral", () => {
    expect(trimScore("SE")).toBe(60);
  });

  it("scores a recognized upper-trim keyword higher still", () => {
    expect(trimScore("Limited")).toBe(80);
    expect(trimScore("XLE Premium")).toBe(80);
  });

  it("is case-insensitive", () => {
    expect(trimScore("LIMITED")).toBe(80);
    expect(trimScore("denali")).toBe(80);
  });

  it("recognizes brand-specific upper trims", () => {
    expect(trimScore("Overland")).toBe(80);
    expect(trimScore("Laramie")).toBe(80);
    expect(trimScore("King Ranch")).toBe(80);
  });
});
