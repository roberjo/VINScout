# Architecture

See [`../Technical _Specs.md`](../Technical%20_Specs.md) for the full spec — this file summarizes how it maps onto the repo.

## Pipeline (spec §2, §5)

```
DISCOVER → NORMALIZE → IDENTIFY VIN → DEDUPLICATE → HISTORY GATE →
ELIGIBILITY FILTER → MARKET VALUE → MAINTENANCE RISK → OPPORTUNITY SCORE →
RANK → ALERT
```

A vehicle that fails the history gate never receives an opportunity score, and unknown history is never treated as clean.

## Repo layout

- `apps/web` — React + Vite dashboard, deployed as static assets on Cloudflare Workers (Cloudflare's unified successor to classic Pages) at [vinscout.johnbroberts.workers.dev](https://vinscout.johnbroberts.workers.dev).
- `apps/worker` — Cloudflare Worker: HTTP API (`src/api`), discovery/normalization/history/scoring logic, and the cron-triggered discovery job (`src/jobs`).
- `packages/domain` — Shared TypeScript types (`Vehicle`, `HistoryStatus`, `NormalizedListing`, `SearchCriteria`, ...).
- `packages/scoring` — Pure scoring functions: the history gate and opportunity score (unit tested, no I/O).
- `packages/adapters` — The `InventorySource` interface that every inventory provider implements.
- `packages/validation` — Runtime (zod) validation for data crossing API/storage boundaries.
- `migrations/` — D1 SQL migrations.

## Why Cloudflare

Chosen to run entirely on free tiers at hobby scale: Pages, Workers, D1, Cron Triggers, and Browser Rendering (for headless scraping where a source requires it) all have generous free allowances and live under one account.
