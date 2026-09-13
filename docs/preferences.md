# Search Preferences (Watchlists)

Spec §3 lists "Watchlists" as in-scope; spec §14 defines a `watchlists` table (`id`, `name`, `criteria_json`, `created_at`) for saved searches. What's built is a single active preference set stored in that table under `name = 'default'` — not yet the full multi-named-watchlist UI the table's schema supports.

## Why this exists

Manual history verification (`docs/history-gate.md`) is the one deliberate human-in-the-loop step in the pipeline — but before this feature, *every* discovered vehicle landed in "Needs Review" regardless of whether it matched what you'd actually consider buying. That made the dashboard "a way to get a human to do the Carfax check for you" for cars you never wanted in the first place.

## How it works

- `PUT /api/preferences` / `GET /api/preferences` (`apps/worker/src/api/preferences.ts`) validate against `discoveryPreferencesSchema` (`packages/validation/src/discoveryPreferences.ts` — makes, models, priceMin/Max, mileageMax, yearMin/Max) and upsert the single `default` row in `watchlists`.
- `discoverListings.ts` loads that saved record at the start of every cron run and merges it into the `SearchCriteria` passed to `source.discover()` — location and the `requireClean*` flags stay fixed; only the taste attributes are user-controlled.
- `AutoDevInventorySource` already mapped `priceMin`/`priceMax`/`years`/`makes`/`models` to Auto.dev's query params; this added `mileageMax` → `retailListing.miles` (range syntax, verified against the live API the same way `retailListing.price` was).
- The web app's `PreferencesPanel` (`apps/web/src/components/PreferencesPanel.tsx`) is a collapsible form on the dashboard.

**Net effect:** a vehicle outside your saved preferences is never pulled from Auto.dev in the first place — it doesn't just get hidden in the UI, it never uses API quota or enters the database.

## What this is *not*

- **Not the same as the Opportunities list's `FilterBar`.** That's a client-side/query-time filter over vehicles *already scored* — ephemeral, per-view. This is a server-side, persisted filter applied *before discovery even happens*.
- **Not retroactive.** Saving new preferences doesn't remove or hide vehicles already sitting in "Needs Review" from before you saved them — it only affects the next discovery run (every 6 hours).
- **Not multiple named watchlists yet.** One active preference set. The `watchlists` table's `name` column already supports more; extending to multiple saved searches (and running one Auto.dev call per watchlist) is future work, bounded by the free-tier call budget (`docs/data-sources.md`).
