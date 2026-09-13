import type { RawListing } from "@vinscout/domain";
import type { InventorySource } from "./inventorySource";

// A source with no live inventory to point at yet, used to prove out the
// discover -> normalize -> VIN dedup -> history gate -> persist pipeline
// without depending on (or needing permission for) any real dealer/marketplace.
const FIXTURE_RAW_DATA = [
  {
    vin: "5TDBZRFH1KS000001",
    year: 2019,
    make: "Toyota",
    model: "Highlander",
    trim: "XLE",
    mileage: 96000,
    price: 23400,
    dealer_name: "Example Toyota",
    dealer_city: "Newnan",
    dealer_state: "GA",
    listing_url: "https://example-dealer.test/inventory/5TDBZRFH1KS000001",
    // Demonstrates link detection — dealers commonly publish a free
    // Carfax/AutoCheck link right on the listing page.
    history_report_url: "https://www.carfax.com/vehicle/5TDBZRFH1KS000001",
  },
  {
    vin: "5FNYF6H07KB000002",
    year: 2020,
    make: "Honda",
    model: "Pilot",
    trim: "EX-L",
    mileage: 42000,
    price: 27800,
    dealer_name: "Example Honda",
    dealer_city: "LaGrange",
    dealer_state: "GA",
    listing_url: "https://example-dealer.test/inventory/5FNYF6H07KB000002",
  },
] as const;

export class FixtureInventorySource implements InventorySource {
  name = "fixture";

  async discover(): Promise<RawListing[]> {
    const fetchedAt = new Date().toISOString();
    return FIXTURE_RAW_DATA.map((raw) => ({
      source: this.name,
      url: raw.listing_url,
      fetchedAt,
      raw,
    }));
  }

  supportsIncrementalSync(): boolean {
    return false;
  }
}
