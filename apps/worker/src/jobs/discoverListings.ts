import { AutoDevInventorySource, FixtureInventorySource, type InventorySource } from "@vinscout/adapters";
import type { SearchCriteria } from "@vinscout/domain";
import type { DiscoveryPreferences } from "@vinscout/validation";
import type { Env } from "../env";
import { normalizeListing } from "../normalization/normalizeListing";
import { persistNormalizedListing } from "./persistListing";

// Spec §16 — default search area (LaGrange/Newnan/Carrollton/Peachtree City, GA).
// Fixed regardless of saved watchlists — those only narrow price/mileage/
// year/make/model (see buildCriteria), not the search area.
const BASE_CRITERIA: SearchCriteria = {
  location: { latitude: 33.0201, longitude: -84.7997, radiusMiles: 50 },
  requireCleanHistory: true,
  requireCleanTitle: true,
};

// Auto.dev filters by ZIP, not lat/lon — 30240 is LaGrange, GA (spec §16's
// primary search area). maxPages: 1 keeps each pass at ~4 calls/day; with up
// to 3 watchlists (apps/worker/src/api/watchlists.ts's cap) that's still
// ~360 calls/month, comfortably under the free plan's 1,000/month cap.
const AUTODEV_ZIP = "30240";
const AUTODEV_DISTANCE_MILES = 50;
const AUTODEV_MAX_PAGES = 1;

interface WatchlistRow {
  criteria_json: string;
}

// The user's saved "personal taste" filters (spec §14 watchlists — full CRUD
// at /api/watchlists) — applied at discovery time so a vehicle outside every
// saved watchlist never enters the pipeline, and therefore never reaches
// manual Carfax review. Each watchlist runs as its own discovery pass; with
// none saved, discovery runs unfiltered (today's earlier default).
async function loadWatchlistCriteria(env: Env): Promise<DiscoveryPreferences[]> {
  const { results } = await env.DB.prepare("SELECT criteria_json FROM watchlists").all<WatchlistRow>();

  return results
    .map((row) => {
      try {
        return JSON.parse(row.criteria_json) as DiscoveryPreferences;
      } catch {
        return null;
      }
    })
    .filter((c): c is DiscoveryPreferences => c !== null);
}

function buildCriteria(preferences: DiscoveryPreferences): SearchCriteria {
  return {
    ...BASE_CRITERIA,
    priceMin: preferences.priceMin,
    priceMax: preferences.priceMax,
    mileageMax: preferences.mileageMax,
    years:
      preferences.yearMin != null || preferences.yearMax != null
        ? { min: preferences.yearMin, max: preferences.yearMax }
        : undefined,
    makes: preferences.makes,
    models: preferences.models,
  };
}

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
  const watchlistCriteria = await loadWatchlistCriteria(env);
  // No saved watchlists yet: one unfiltered pass, same as before this feature.
  const criteriaList = watchlistCriteria.length > 0 ? watchlistCriteria.map(buildCriteria) : [buildCriteria({})];

  for (const source of registeredSources(env)) {
    for (const criteria of criteriaList) {
      try {
        const raw = await source.discover(criteria);
        console.log(`discoverListings: ${source.name} returned ${raw.length} listing(s)`);

        for (const rawListing of raw) {
          const normalized = normalizeListing(rawListing);
          await persistNormalizedListing(env, normalized);
        }
      } catch (err) {
        // One source/watchlist failing (rate limit, outage, bad key)
        // shouldn't block the others.
        console.error(`discoverListings: ${source.name} failed`, err);
      }
    }
  }
}
