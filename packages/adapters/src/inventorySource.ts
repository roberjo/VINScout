import type { RawListing, SearchCriteria } from "@vinscout/domain";

// Spec §11 — Inventory Source Adapter. Every inventory provider (dealer
// site, marketplace, permitted feed) implements this interface.
export interface InventorySource {
  name: string;

  discover(criteria: SearchCriteria): Promise<RawListing[]>;

  getListing?(url: string): Promise<RawListing>;

  supportsIncrementalSync(): boolean;
}
