import type { RawListing, SearchCriteria } from "@vinscout/domain";
import type { InventorySource } from "./inventorySource";

// https://docs.auto.dev/v2/products/vehicle-listings — a licensed API
// (spec §12 priority 2, "permitted inventory APIs/feeds"), not a scrape.
// Free plan: 1,000 calls/month, 5 req/sec, 20 listings/page, no card required.
export interface AutoDevListingItem {
  vin?: string;
  vehicle?: {
    vin?: string;
    year?: number;
    // Auto.dev returns these as JSON numbers when the value looks numeric
    // (e.g. Ram's "1500"), so both types are genuinely possible here.
    make?: string | number;
    model?: string | number;
    trim?: string | number;
  };
  retailListing?: {
    vdp?: string;
    price?: number;
    miles?: number;
    dealer?: string;
    city?: string;
    state?: string;
    carfaxUrl?: string;
  };
}

export interface AutoDevInventorySourceConfig {
  apiKey: string;
  /** Auto.dev filters by ZIP + radius, not lat/lon — pick the ZIP for your search area. */
  zip: string;
  distanceMiles?: number;
  /** 20-listing pages to pull per discover() call. Keep low: the free plan caps at 1,000 calls/month total. */
  maxPages?: number;
  fetchImpl?: typeof fetch;
}

const API_BASE = "https://api.auto.dev";
const FREE_PLAN_PAGE_LIMIT = 20;

// Pure and independently testable: maps one API item to our RawListing shape,
// or null if the listing is missing fields we can't persist without.
export function mapAutoDevListingToRaw(item: AutoDevListingItem, fetchedAt: string): RawListing | null {
  const vin = item.vin ?? item.vehicle?.vin;
  const listingUrl = item.retailListing?.vdp;
  const price = item.retailListing?.price;
  const mileage = item.retailListing?.miles;

  if (!vin || !listingUrl || price == null || mileage == null || !item.vehicle?.year || !item.vehicle?.make || !item.vehicle?.model) {
    return null;
  }

  return {
    source: "autodev",
    url: listingUrl,
    fetchedAt,
    raw: {
      vin,
      year: item.vehicle.year,
      // Auto.dev returns purely-numeric model names (e.g. Ram "1500") as a
      // JSON number, not a string — coerce so it doesn't end up as "1500.0".
      make: String(item.vehicle.make),
      model: String(item.vehicle.model),
      trim: item.vehicle.trim != null ? String(item.vehicle.trim) : undefined,
      mileage,
      price,
      dealer_name: item.retailListing?.dealer ?? "Unknown dealer",
      dealer_city: item.retailListing?.city ?? "",
      dealer_state: item.retailListing?.state ?? "",
      listing_url: listingUrl,
      history_report_url: item.retailListing?.carfaxUrl,
    },
  };
}

export class AutoDevInventorySource implements InventorySource {
  name = "autodev";
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: AutoDevInventorySourceConfig) {
    // fetch is an "illegal invocation" in Workers if called detached from
    // its original receiver — bind it rather than storing the bare reference.
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
  }

  async discover(criteria: SearchCriteria): Promise<RawListing[]> {
    const fetchedAt = new Date().toISOString();
    const results: RawListing[] = [];
    const maxPages = this.config.maxPages ?? 1;

    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams({
        zip: this.config.zip,
        distance: String(this.config.distanceMiles ?? 50),
        page: String(page),
        limit: String(FREE_PLAN_PAGE_LIMIT),
      });

      if (criteria.priceMin != null || criteria.priceMax != null) {
        params.set("retailListing.price", `${criteria.priceMin ?? 0}-${criteria.priceMax ?? 999999}`);
      }
      if (criteria.years?.min != null || criteria.years?.max != null) {
        params.set("vehicle.year", `${criteria.years?.min ?? 1900}-${criteria.years?.max ?? 2100}`);
      }
      if (criteria.makes?.length) {
        params.set("vehicle.make", criteria.makes.join(","));
      }
      if (criteria.models?.length) {
        params.set("vehicle.model", criteria.models.join(","));
      }

      const res = await this.fetchImpl(`${API_BASE}/listings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });

      if (!res.ok) {
        console.error(`autodev: request failed with HTTP ${res.status}`);
        break;
      }

      const body = (await res.json()) as { data?: AutoDevListingItem[] };
      const items = body.data ?? [];

      for (const item of items) {
        const raw = mapAutoDevListingToRaw(item, fetchedAt);
        if (raw) results.push(raw);
      }

      if (items.length < FREE_PLAN_PAGE_LIMIT) break;
    }

    return results;
  }

  supportsIncrementalSync(): boolean {
    return false;
  }
}
