export interface DiscoveryPreferences {
  makes?: string[];
  models?: string[];
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  yearMin?: number;
  yearMax?: number;
}

export interface Watchlist {
  id: number;
  name: string;
  criteria: DiscoveryPreferences;
  createdAt?: string;
}
