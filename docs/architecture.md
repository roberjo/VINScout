# Architecture

See [`../Technical _Specs.md`](../Technical%20_Specs.md) for the full spec — this file summarizes how it maps onto the repo, and section 48 tracks build-order status line by line.

## Pipeline (spec §2, §5)

```
DISCOVER → NORMALIZE → IDENTIFY VIN → DEDUPLICATE → HISTORY GATE →
ELIGIBILITY FILTER → MARKET VALUE → MAINTENANCE RISK → OPPORTUNITY SCORE →
RANK → ALERT
```

Everything through OPPORTUNITY SCORE is implemented and running end-to-end in production. RANK is the dashboard's sort order; ALERT (watchlists/notifications) is not built yet.

A vehicle that fails the history gate never receives an opportunity score, and unknown history is never treated as clean — enforced in code, not just by convention (see `docs/history-gate.md`).

## Repo layout

- `apps/web` — React + Vite dashboard, deployed as static assets on Cloudflare Workers (Cloudflare's unified successor to classic Pages) at [vinscout.johnbroberts.workers.dev](https://vinscout.johnbroberts.workers.dev). Shows the ranked "Opportunities" list and a "Needs Review" queue for manual history verification.
- `apps/worker` — Cloudflare Worker at [vinscout-worker.johnbroberts.workers.dev](https://vinscout-worker.johnbroberts.workers.dev):
  - `src/api` — HTTP routes (vehicles, review queue, history verification).
  - `src/jobs` — the cron-triggered discovery job and VIN-dedup persistence logic.
  - `src/normalization` — raw adapter payload → `NormalizedListing`, and DB row → domain type mapping.
  - `src/history` — Carfax/AutoCheck link detection and manual verification handling.
  - `src/scoring` — impure glue that reads D1, calls the pure functions in `packages/scoring`, and writes `value_score`/`opportunity_score` back; also the NHTSA recalls lookup.
  - `src/maintenance` — impure glue for `maintenance_score`.
- `packages/domain` — Shared TypeScript types (`Vehicle`, `HistoryStatus`, `NormalizedListing`, `SearchCriteria`, `MaintenanceRisk`/`Rule`, ...).
- `packages/scoring` — Pure, unit-tested functions with no I/O: the history gate, the full 7-factor opportunity-score weighting, the market-value comparison, the maintenance rule engine, and the age/mileage/trim/dealer-quality/reliability sub-scores.
- `packages/adapters` — The `InventorySource` interface plus the two implementations (`AutoDevInventorySource` for real data, `FixtureInventorySource` for local testing).
- `packages/validation` — Runtime (zod) validation for data crossing API/storage boundaries.
- `migrations/` — D1 SQL migrations (schema, indexes, history tables, listing photo count).

## Why Cloudflare

Chosen to run entirely on free tiers at hobby scale: Pages/Workers, D1, and Cron Triggers all have generous free allowances and live under one account. See `docs/data-sources.md` for the same reasoning applied to every external data source this project uses (Auto.dev, NHTSA) and the ones it evaluated and rejected (AutoNation, CarGurus, MarketCheck).
