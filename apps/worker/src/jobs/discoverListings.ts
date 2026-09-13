import { FixtureInventorySource, type InventorySource } from "@vinscout/adapters";
import type { SearchCriteria } from "@vinscout/domain";
import type { Env } from "../env";
import { normalizeListing } from "../normalization/normalizeListing";
import { persistNormalizedListing } from "./persistListing";

// Spec §16 — default search area (LaGrange/Newnan/Carrollton/Peachtree City, GA).
const DEFAULT_CRITERIA: SearchCriteria = {
  location: { latitude: 33.0201, longitude: -84.7997, radiusMiles: 50 },
  requireCleanHistory: true,
  requireCleanTitle: true,
};

// Spec §12 — Source Priority. Real sources register here as they're built.
// The fixture source is for local pipeline testing only (see wrangler.toml
// and .dev.vars) — it must never run against production D1.
function registeredSources(env: Env): InventorySource[] {
  const sources: InventorySource[] = [];
  if (env.ENABLE_FIXTURE_SOURCE === "true") {
    sources.push(new FixtureInventorySource());
  }
  return sources;
}

export async function discoverListings(env: Env): Promise<void> {
  for (const source of registeredSources(env)) {
    const raw = await source.discover(DEFAULT_CRITERIA);
    console.log(`discoverListings: ${source.name} returned ${raw.length} listing(s)`);

    for (const rawListing of raw) {
      const normalized = normalizeListing(rawListing);
      await persistNormalizedListing(env, normalized);
    }
  }
}
