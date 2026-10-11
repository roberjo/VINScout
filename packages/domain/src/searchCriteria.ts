// Spec §15 — Search Criteria.
export interface SearchCriteria {
  location: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
    /** Auto.dev filters by ZIP, not lat/lon (see AutoDevInventorySource) — set to search around a specific ZIP instead of the app-wide default. */
    zip?: string;
  };

  priceMin?: number;
  priceMax?: number;

  mileageMax?: number;

  years?: {
    min?: number;
    max?: number;
  };

  makes?: string[];
  models?: string[];
  trims?: string[];

  drivetrains?: string[];

  requireCleanHistory: boolean;
  requireCleanTitle: boolean;

  maxOwners?: number;
}
