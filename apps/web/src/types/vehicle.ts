import type { Vehicle } from "@vinscout/domain";

export interface MarketComparison {
  askingPrice: number;
  estimatedMarketPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  comparableCount: number;
}

export interface ScoreBreakdownEntry {
  factor: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface VehicleWithListing extends Vehicle {
  price: number | null;
  listingUrl: string | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
  imageUrl: string | null;
  marketComparison: MarketComparison | null;
  scoreBreakdown: ScoreBreakdownEntry[] | null;
}

export interface VehicleFilters {
  make?: string;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
}
