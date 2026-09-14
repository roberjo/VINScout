import { describe, expect, it } from "vitest";
import { computeReviewHighlights, type ReviewHighlightInputs } from "./reviewHighlights";

const BASE: ReviewHighlightInputs = {
  marketComparison: null,
  mileageScoreValue: 50,
  trimScoreValue: 50,
  reliabilityScoreValue: null,
  maintenanceScoreValue: null,
};

describe("computeReviewHighlights", () => {
  it("returns nothing for an all-neutral vehicle", () => {
    expect(computeReviewHighlights(BASE)).toEqual([]);
  });

  it("flags a price well below market as good", () => {
    const highlights = computeReviewHighlights({
      ...BASE,
      marketComparison: {
        askingPrice: 18000,
        estimatedMarketPrice: 20000,
        priceDifference: -2000,
        priceDifferencePercent: -12,
        comparableCount: 3,
      },
    });
    expect(highlights).toContainEqual({ label: "12% below market average", tone: "good" });
  });

  it("flags a price well above market as a warning", () => {
    const highlights = computeReviewHighlights({
      ...BASE,
      marketComparison: {
        askingPrice: 22000,
        estimatedMarketPrice: 20000,
        priceDifference: 2000,
        priceDifferencePercent: 12,
        comparableCount: 3,
      },
    });
    expect(highlights).toContainEqual({ label: "12% above market average", tone: "warning" });
  });

  it("does not flag a price close to market", () => {
    const highlights = computeReviewHighlights({
      ...BASE,
      marketComparison: {
        askingPrice: 20200,
        estimatedMarketPrice: 20000,
        priceDifference: 200,
        priceDifferencePercent: 1,
        comparableCount: 3,
      },
    });
    expect(highlights).toEqual([]);
  });

  it("flags low mileage as good and high mileage as a warning", () => {
    expect(computeReviewHighlights({ ...BASE, mileageScoreValue: 80 })).toContainEqual({
      label: "Low mileage for its age",
      tone: "good",
    });
    expect(computeReviewHighlights({ ...BASE, mileageScoreValue: 20 })).toContainEqual({
      label: "High mileage for its age",
      tone: "warning",
    });
  });

  it("flags an upper trim as good", () => {
    expect(computeReviewHighlights({ ...BASE, trimScoreValue: 80 })).toContainEqual({
      label: "Well-equipped trim",
      tone: "good",
    });
  });

  it("flags clean vs notable recall history", () => {
    expect(computeReviewHighlights({ ...BASE, reliabilityScoreValue: 90 })).toContainEqual({
      label: "Clean recall history",
      tone: "good",
    });
    expect(computeReviewHighlights({ ...BASE, reliabilityScoreValue: 30 })).toContainEqual({
      label: "Notable recall history",
      tone: "warning",
    });
  });

  it("flags likely-soon maintenance as a warning", () => {
    expect(computeReviewHighlights({ ...BASE, maintenanceScoreValue: 30 })).toContainEqual({
      label: "Maintenance likely due soon",
      tone: "warning",
    });
  });
});
