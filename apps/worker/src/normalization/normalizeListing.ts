import type { NormalizedListing, RawListing } from "@vinscout/domain";

// Shape every adapter's raw payload must supply once mapped to `raw`.
// A real adapter (dealer feed, marketplace scrape) will need its own
// mapping from that source's native fields to this shape.
interface RawListingFields {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  price: number;
  dealer_name: string;
  dealer_city: string;
  dealer_state: string;
  listing_url: string;
  history_report_url?: string;
  photo_count?: number;
}

export function normalizeListing(raw: RawListing): NormalizedListing {
  const fields = raw.raw as unknown as RawListingFields;

  return {
    vin: fields.vin,
    year: fields.year,
    make: fields.make,
    model: fields.model,
    trim: fields.trim,
    mileage: fields.mileage,
    price: fields.price,
    dealerName: fields.dealer_name,
    dealerCity: fields.dealer_city,
    dealerState: fields.dealer_state,
    listingUrl: fields.listing_url,
    source: raw.source,
    discoveredAt: raw.fetchedAt,
    observedAt: raw.fetchedAt,
    historyReportUrl: fields.history_report_url,
    photoCount: fields.photo_count,
  };
}
