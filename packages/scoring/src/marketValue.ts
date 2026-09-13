import type { MarketComparison } from "@vinscout/domain";

export interface ComparableVehicle {
  price: number;
  mileage: number;
}

export interface MarketValueTarget {
  askingPrice: number;
  mileage: number;
}

// Comparables must be within +/-30% of the target's mileage. A crude control
// for the fact that mileage moves price a lot within the same make/model/year —
// cheap to compute, no regression model needed for a v1 baseline.
const MILEAGE_BAND_PERCENT = 0.3;

// Spec §17 — Value Engine. `candidates` should already be filtered by the
// caller to the same make/model and a reasonable year range (that's a SQL
// concern); this function does the finer mileage-band filtering and the
// actual average/diff math. Returns null when there's nothing comparable
// close enough in mileage to say anything meaningful.
export function estimateMarketValue(target: MarketValueTarget, candidates: ComparableVehicle[]): MarketComparison | null {
  const mileageLow = target.mileage * (1 - MILEAGE_BAND_PERCENT);
  const mileageHigh = target.mileage * (1 + MILEAGE_BAND_PERCENT);

  const comparables = candidates.filter((c) => c.mileage >= mileageLow && c.mileage <= mileageHigh);

  if (comparables.length === 0) {
    return null;
  }

  const estimatedMarketPrice = comparables.reduce((sum, c) => sum + c.price, 0) / comparables.length;
  const priceDifference = target.askingPrice - estimatedMarketPrice;
  const priceDifferencePercent = (priceDifference / estimatedMarketPrice) * 100;

  return {
    askingPrice: target.askingPrice,
    estimatedMarketPrice: Math.round(estimatedMarketPrice),
    priceDifference: Math.round(priceDifference),
    priceDifferencePercent: Math.round(priceDifferencePercent * 10) / 10,
    comparableCount: comparables.length,
  };
}

// Maps a MarketComparison to the 0-100 "higher is better" sub-score
// scoreOpportunity expects for its marketPriceAdvantage factor. A first-pass
// heuristic, not a derived formula: 3 points per percent under/over market,
// clamped to [0, 100], centered at 50 for "exactly at market."
export function marketPriceAdvantageScore(comparison: MarketComparison): number {
  const score = 50 - comparison.priceDifferencePercent * 3;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}
