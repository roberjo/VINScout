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
  model?: string;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  yearMin?: number;
  yearMax?: number;
}

// Whitelisted server-side too (apps/worker/src/api/vehicles.ts's
// SORTABLE_COLUMNS) — keep this list in sync with that one.
export type VehicleSortColumn = "opportunityScore" | "price" | "mileage" | "year" | "firstSeenAt";

export interface VehicleSort {
  sortBy: VehicleSortColumn;
  sortDir: "asc" | "desc";
}

export interface PagedVehicles {
  items: VehicleWithListing[];
  total: number;
  limit: number;
  offset: number;
}
