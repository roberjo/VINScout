export interface Listing {
  id: string;
  vin: string | null;
  source: string;
  sourceListingUrl: string;
  title: string;
  price: number;
  currency: string;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  location: {
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  condition: "new" | "used" | "certified-pre-owned" | "unknown";
  listedAt: string;
  fetchedAt: string;
}

export interface DealScore {
  listingId: string;
  score: number;
  marketValueEstimate: number | null;
  priceDeltaPercent: number | null;
  factors: Record<string, number>;
}
