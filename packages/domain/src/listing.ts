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

  // A Carfax/AutoCheck link the dealer published on their own listing page,
  // if any. Surfaced for a human to click through and verify manually —
  // never auto-fetched (see docs/history-gate.md for why).
  historyReportUrl?: string;

  // Photo count, when the source reports it — used as a dealer/listing
  // quality proxy (spec §18) since no source gives us anything richer.
  photoCount?: number;

  // The dealer's own primary listing photo, when the source reports one —
  // shown in the dashboard so a listing isn't just a wall of numbers.
  primaryImageUrl?: string;
}
