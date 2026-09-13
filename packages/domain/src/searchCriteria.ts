// Spec §15 — Search Criteria.
export interface SearchCriteria {
  location: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
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
