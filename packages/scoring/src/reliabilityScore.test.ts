import { describe, expect, it } from "vitest";
import { reliabilityScoreFromRecallCount } from "./reliabilityScore";

describe("reliabilityScoreFromRecallCount", () => {
  it("scores zero recalls at 100", () => {
    expect(reliabilityScoreFromRecallCount(0)).toBe(100);
  });

  it("scores lower with more recalls", () => {
    expect(reliabilityScoreFromRecallCount(1)).toBeLessThan(reliabilityScoreFromRecallCount(0));
    expect(reliabilityScoreFromRecallCount(3)).toBeLessThan(reliabilityScoreFromRecallCount(1));
  });

  it("caps the penalty so a heavily-recalled model doesn't hit 0", () => {
    expect(reliabilityScoreFromRecallCount(50)).toBe(30);
    expect(reliabilityScoreFromRecallCount(1000)).toBe(30);
  });
});
