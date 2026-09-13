// Spec §17 — Value Engine.
export interface MarketComparison {
  askingPrice: number;
  estimatedMarketPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  comparableCount: number;
}
