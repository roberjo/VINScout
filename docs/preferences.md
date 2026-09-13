# Saved Searches (Watchlists)

Spec §3 lists "Watchlists" as in-scope; spec §14 defines a `watchlists` table (`id`, `name`, `criteria_json`, `created_at`) for saved searches. Full CRUD over multiple named watchlists is implemented, always-visible on the dashboard (not hidden behind an edit toggle).

## Why this exists

Manual history verification (`docs/history-gate.md`) is the one deliberate human-in-the-loop step in the pipeline — but before this feature, *every* discovered vehicle landed in "Needs Review" regardless of whether it matched what you'd actually consider buying. That made the dashboard "a way to get a human to do the Carfax check for you" for cars you never wanted in the first place.

## How it works

- `GET/POST /api/watchlists`, `PUT/DELETE /api/watchlists/:id` (`apps/worker/src/api/watchlists.ts`) — full CRUD, validated against `watchlistInputSchema` (`packages/validation/src/discoveryPreferences.ts`: a name plus makes/models/priceMin/Max/mileageMax/yearMin/Max).
- Capped at **3 watchlists** — each one runs as its own discovery pass, so the count directly multiplies API calls. 3 watchlists × ~4 cron ticks/day ≈ 360 calls/month, comfortably under Auto.dev's free 1,000/month. `POST` past the cap returns `409` with a clear message.
- `discoverListings.ts` loads every saved watchlist at the start of each cron run and runs `source.discover()` once per watchlist, merging each one's criteria into the fixed `BASE_CRITERIA` (location and `requireClean*` stay fixed; only the taste attributes are per-watchlist). With zero watchlists saved, discovery runs once, unfiltered — today's original behavior.
- `AutoDevInventorySource` maps `priceMin`/`priceMax`/`years`/`makes`/`models` to Auto.dev's query params, plus `mileageMax` → `retailListing.miles` (range syntax, verified against the live API the same way `retailListing.price` was).
- `apps/web/src/components/WatchlistManager.tsx` lists every saved search **with its filter chips always visible** (`summarizeCriteria.ts` renders e.g. "Toyota, Honda · ≤ $30,000 · ≤ 80,000 mi") — no click-to-reveal. Each has inline Edit/Delete; a shared `WatchlistForm.tsx` handles both create and edit.

**Net effect:** a vehicle outside every saved watchlist is never pulled from Auto.dev in the first place — it doesn't just get hidden in the UI, it never uses API quota or enters the database.

## Verified

End-to-end against the real Auto.dev API: created 3 watchlists (cap enforced correctly on a 4th), updated one, deleted one, and confirmed a discovery run issues one API call per remaining watchlist (log showed each source running twice for two saved watchlists) — resulting review-queue vehicles matched *only* the saved watchlists' makes (Toyota/Honda/Ram), nothing else leaked through.

## What this is *not*

- **Not the same as the Opportunities list's `FilterBar`.** That's a client-side/query-time filter over vehicles *already scored* — ephemeral, per-view, no persistence. This is server-side and persisted, applied *before discovery even happens*.
- **Not retroactive.** Saving or changing a watchlist doesn't remove or hide vehicles already sitting in "Needs Review" from before — it only affects the next discovery run (every 6 hours).
