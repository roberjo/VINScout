export interface DiscoveryPreferences {
  makes?: string[];
  models?: string[];
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  yearMin?: number;
  yearMax?: number;
  /** 5-digit ZIP code. Falls back to the app-wide default search area when unset. */
  zip?: string;
  radiusMiles?: number;
}

export interface Watchlist {
  id: number;
  name: string;
  criteria: DiscoveryPreferences;
  createdAt?: string;
}
