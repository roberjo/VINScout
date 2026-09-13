import { describe, expect, it } from "vitest";
import { estimateMarketValue, marketPriceAdvantageScore } from "./marketValue";

describe("estimateMarketValue", () => {
  it("returns null when there are no candidates at all", () => {
    expect(estimateMarketValue({ askingPrice: 23400, mileage: 96000 }, [])).toBeNull();
  });

  it("returns null when every candidate is outside the mileage band", () => {
    const result = estimateMarketValue({ askingPrice: 23400, mileage: 96000 }, [
      { price: 30000, mileage: 20000 }, // way lower mileage
      { price: 15000, mileage: 200000 }, // way higher mileage
    ]);
    expect(result).toBeNull();
  });

  it("matches the spec's worked example (spec §17): $25,800 avg vs $23,400 asking = -9.3%", () => {
    // Three comparables averaging to 25,800, all within the mileage band.
    const result = estimateMarketValue({ askingPrice: 23400, mileage: 96000 }, [
      { price: 25000, mileage: 90000 },
      { price: 26000, mileage: 100000 },
      { price: 26400, mileage: 95000 },
    ]);
    expect(result).toEqual({
      askingPrice: 23400,
      estimatedMarketPrice: 25800,
      priceDifference: -2400,
      priceDifferencePercent: -9.3,
      comparableCount: 3,
    });
  });

  it("excludes out-of-band candidates while keeping in-band ones", () => {
    const result = estimateMarketValue({ askingPrice: 20000, mileage: 50000 }, [
      { price: 22000, mileage: 55000 }, // in band (within 30% of 50k)
      { price: 5000, mileage: 300000 }, // way out of band
    ]);
    expect(result?.comparableCount).toBe(1);
    expect(result?.estimatedMarketPrice).toBe(22000);
  });
});

describe("marketPriceAdvantageScore", () => {
  it("scores exactly-at-market as 50", () => {
    expect(
      marketPriceAdvantageScore({
        askingPrice: 25000,
        estimatedMarketPrice: 25000,
        priceDifference: 0,
        priceDifferencePercent: 0,
        comparableCount: 3,
      }),
    ).toBe(50);
  });

  it("scores below-market higher than 50", () => {
    const score = marketPriceAdvantageScore({
      askingPrice: 23400,
      estimatedMarketPrice: 25800,
      priceDifference: -2400,
      priceDifferencePercent: -9.3,
      comparableCount: 3,
    });
    expect(score).toBeGreaterThan(50);
  });

  it("clamps at 100 for an extreme below-market price", () => {
    const score = marketPriceAdvantageScore({
      askingPrice: 1000,
      estimatedMarketPrice: 30000,
      priceDifference: -29000,
      priceDifferencePercent: -96.7,
      comparableCount: 3,
    });
    expect(score).toBe(100);
  });

  it("clamps at 0 for an extreme above-market price", () => {
    const score = marketPriceAdvantageScore({
      askingPrice: 100000,
      estimatedMarketPrice: 25000,
      priceDifference: 75000,
      priceDifferencePercent: 300,
      comparableCount: 3,
    });
    expect(score).toBe(0);
  });
});
