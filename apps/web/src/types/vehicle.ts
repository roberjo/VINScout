import type { Vehicle } from "@vinscout/domain";

export interface VehicleWithListing extends Vehicle {
  price: number | null;
  listingUrl: string | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
}

export interface VehicleFilters {
  make?: string;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
}
