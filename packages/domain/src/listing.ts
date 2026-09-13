// Spec §11 — Inventory Source Adapter output types.
export interface RawListing {
  source: string;
  url: string;
  raw: Record<string, unknown>;
  fetchedAt: string;
}

export interface NormalizedListing {
  vin: string;

  year: number;
  make: string;
  model: string;
  trim?: string;

  mileage: number;
  price: number;

  dealerName: string;
  dealerCity: string;
  dealerState: string;

  listingUrl: string;

  source: string;

  discoveredAt: string;
  observedAt: string;
}
