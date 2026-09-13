# VINScout

Used Vehicle Opportunity Detection & Screening. VINScout discovers used-vehicle listings, normalizes them by VIN, applies a mandatory vehicle-history gate, and ranks only history-approved vehicles by market value, mileage, and maintenance exposure.

See [`Technical _Specs.md`](./Technical%20_Specs.md) for the full spec and [`docs/`](./docs) for how it maps onto this repo.

## Core principle

A vehicle with unverified or unacceptable history (accident, salvage title, flood, etc.) never receives an opportunity score, no matter how good its price looks. Unknown history is not treated as clean.

## Tech Stack

Chosen to run entirely on free tiers at hobby scale:

- **Frontend**: React + Vite + Tailwind, deployed as static assets on Cloudflare Workers — live at [vinscout.johnbroberts.workers.dev](https://vinscout.johnbroberts.workers.dev)
- **Backend**: Cloudflare Workers (Hono for routing), deployed via Wrangler — live at [vinscout-worker.johnbroberts.workers.dev](https://vinscout-worker.johnbroberts.workers.dev)
- **Database**: Cloudflare D1 (SQLite) — provisioned, migrations applied
- **Scheduling**: Cloudflare Cron Triggers — wired up, runs every 6 hours (currently a no-op; see Project Status)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml` needs `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repo secrets to run — deploys so far have been manual via `wrangler`)

> Note: Cloudflare has folded classic "Pages" into the unified Workers platform (static assets + Workers in one deploy), which is what `apps/web`'s `wrangler.jsonc` now uses. Functionally this is the same free-tier static hosting the spec called for.

## Repo Layout

```
apps/
  web/        React + Vite dashboard
  worker/     Cloudflare Worker: API, discovery job, cron trigger
packages/
  domain/     Shared TypeScript types (Vehicle, HistoryStatus, SearchCriteria, ...)
  scoring/    Pure functions: history gate, opportunity score (unit tested)
  adapters/   InventorySource interface for inventory providers
  validation/ Zod schemas for data crossing API/storage boundaries
migrations/   D1 SQL migrations
tests/        Cross-cutting integration tests and shared fixtures
docs/         Architecture, data sources, scoring, and history-gate notes
```

## Getting Started

Install dependencies from the repo root:

```bash
npm install
```

Run the worker (Cloudflare Workers local dev, port 8787) and the web dashboard together:

```bash
npm run dev:worker   # terminal 1
npm run dev:web      # terminal 2
```

The Vite dev server proxies `/api/*` to the worker, so open [http://localhost:5173](http://localhost:5173).

Apply D1 migrations locally (the D1 database itself already exists in Cloudflare — see below):

```bash
cd apps/worker
npx wrangler d1 migrations apply vinscout --local
```

Build/lint/test across every workspace:

```bash
npm run build
npm run lint
npm test
```

### Deploying

Both apps deploy independently via Wrangler (manual for now; GitHub Actions automation is scaffolded but not yet wired to secrets):

```bash
npm run deploy --workspace=@vinscout/worker   # apps/worker/wrangler.toml
npm run deploy --workspace=@vinscout/web      # apps/web/wrangler.jsonc
```

Applying a new migration to production:

```bash
cd apps/worker
npx wrangler d1 migrations apply vinscout --remote
```

## Project Status

Foundational pieces are in place and **deployed**: domain model, history gate, opportunity-score weighting, D1 schema (provisioned + migrated), and a vehicles API/dashboard wired end-to-end and live on Cloudflare. See `Technical _Specs.md` §48 for a step-by-step status against the spec's recommended build order.

Not yet built: inventory adapters (so there's no real listing data yet — the API/dashboard are live but empty), VIN deduplication, history-provider integration, market-value engine, maintenance engine, alerts, and price-history analytics.
