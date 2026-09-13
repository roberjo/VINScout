# VINScout

Used Vehicle Opportunity Detection & Screening. VINScout discovers used-vehicle listings, normalizes them by VIN, applies a mandatory vehicle-history gate, and ranks only history-approved vehicles by market value, mileage, and maintenance exposure.

See [`Technical _Specs.md`](./Technical%20_Specs.md) for the full spec and [`docs/`](./docs) for how it maps onto this repo.

## Core principle

A vehicle with unverified or unacceptable history (accident, salvage title, flood, etc.) never receives an opportunity score, no matter how good its price looks. Unknown history is not treated as clean.

## Tech Stack

Chosen to run entirely on free tiers at hobby scale:

- **Frontend**: React + Vite + Tailwind, deployed on Cloudflare Pages
- **Backend**: Cloudflare Workers (Hono for routing), deployed via Wrangler
- **Database**: Cloudflare D1 (SQLite)
- **Scheduling**: Cloudflare Cron Triggers
- **CI/CD**: GitHub Actions

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

Apply D1 migrations locally:

```bash
cd apps/worker
npx wrangler d1 create vinscout   # first time only; paste the resulting id into wrangler.toml
npx wrangler d1 migrations apply vinscout --local
```

Build/lint/test across every workspace:

```bash
npm run build
npm run lint
npm test
```

## Project Status

Foundational pieces are in place: domain model, history gate, opportunity-score weighting, D1 schema, and a vehicles API/dashboard wired end-to-end. No inventory adapters, market-value engine, or maintenance engine exist yet — see `docs/` for what's implemented vs. planned.
