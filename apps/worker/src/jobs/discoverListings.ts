import { AutoDevInventorySource, FixtureInventorySource, type InventorySource } from "@vinscout/adapters";
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

// Auto.dev filters by ZIP, not lat/lon — 30240 is LaGrange, GA (spec §16's
// primary search area). maxPages: 1 keeps this at ~4 calls/day (~120/month),
// well inside the free plan's 1,000/month cap.
const AUTODEV_ZIP = "30240";
const AUTODEV_DISTANCE_MILES = 50;
const AUTODEV_MAX_PAGES = 1;

// Spec §12 — Source Priority. Real sources register here as they're built.
// The fixture source is for local pipeline testing only (see wrangler.toml
// and .dev.vars) — it must never run against production D1.
function registeredSources(env: Env): InventorySource[] {
  const sources: InventorySource[] = [];

  if (env.ENABLE_FIXTURE_SOURCE === "true") {
    sources.push(new FixtureInventorySource());
  }

  if (env.AUTODEV_API_KEY) {
    sources.push(
      new AutoDevInventorySource({
        apiKey: env.AUTODEV_API_KEY,
        zip: AUTODEV_ZIP,
        distanceMiles: AUTODEV_DISTANCE_MILES,
        maxPages: AUTODEV_MAX_PAGES,
      }),
    );
  }

  return sources;
}

export async function discoverListings(env: Env): Promise<void> {
  for (const source of registeredSources(env)) {
    try {
      const raw = await source.discover(DEFAULT_CRITERIA);
      console.log(`discoverListings: ${source.name} returned ${raw.length} listing(s)`);

      for (const rawListing of raw) {
        const normalized = normalizeListing(rawListing);
        await persistNormalizedListing(env, normalized);
      }
    } catch (err) {
      // One source failing (rate limit, outage, bad key) shouldn't block others.
      console.error(`discoverListings: ${source.name} failed`, err);
    }
  }
}
