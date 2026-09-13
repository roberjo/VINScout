# VINScout

Used Vehicle Opportunity Detection & Screening. VINScout discovers used-vehicle listings, normalizes them by VIN, applies a mandatory vehicle-history gate, and ranks only history-approved vehicles by market value, mileage, maintenance exposure, reliability, and listing quality.

**Live**: [vinscout.johnbroberts.workers.dev](https://vinscout.johnbroberts.workers.dev) (dashboard) · [vinscout-worker.johnbroberts.workers.dev](https://vinscout-worker.johnbroberts.workers.dev) (API)

See [`Technical _Specs.md`](./Technical%20_Specs.md) for the full spec (§48 tracks build-order status line by line) and [`docs/`](./docs) for how it maps onto this repo.

## Core principle

A vehicle with unverified or unacceptable history (accident, salvage title, flood, etc.) never receives an opportunity score, no matter how good its price looks. Unknown history is not treated as clean — and since there's no free, legal way to automate real history verification (see `docs/history-gate.md`), a human reviews it: the dashboard surfaces any Carfax/AutoCheck link a dealer published, and you record what you actually find.

## Tech Stack

Chosen to run entirely on free tiers at hobby scale:

- **Frontend**: React + Vite + Tailwind, deployed as static assets on Cloudflare Workers
- **Backend**: Cloudflare Workers (Hono for routing), deployed via Wrangler
- **Database**: Cloudflare D1 (SQLite)
- **Scheduling**: Cloudflare Cron Triggers — runs every 6 hours, pulling real inventory
- **Inventory data**: [Auto.dev](https://www.auto.dev)'s Vehicle Listings API (free tier, 1,000 calls/month, no card required)
- **Reliability data**: NHTSA's free public Recalls API (no key needed)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml` needs `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` repo secrets to run — deploys so far have been manual via `wrangler`)

> Note: Cloudflare has folded classic "Pages" into the unified Workers platform (static assets + Workers in one deploy), which is what `apps/web`'s `wrangler.jsonc` uses. Functionally this is the same free-tier static hosting the spec called for.

## What actually works right now

- Every 6 hours, the Worker pulls real listings from Auto.dev around LaGrange, GA (the spec's default search area), dedupes them by VIN, and runs the history gate — every new vehicle starts `UNKNOWN` and is rejected pending review.
- Any Carfax/AutoCheck link a dealer published gets surfaced automatically in the dashboard's "Needs Review" section — nothing is ever auto-fetched or auto-trusted.
- Once you manually review a vehicle and submit the real flags, it's re-scored on all 7 spec-weighted factors (market price vs. comparables, mileage, maintenance exposure, reliability via NHTSA recalls, age, trim, listing photo quality) and — if it passed history — shows up ranked in the "Opportunities" list.

## Repo Layout

```
apps/
  web/        React + Vite dashboard (Opportunities list + Needs Review queue)
  worker/     Cloudflare Worker: API, discovery job, history verification, scoring
packages/
  domain/     Shared TypeScript types (Vehicle, HistoryStatus, SearchCriteria, MaintenanceRisk, ...)
  scoring/    Pure, unit-tested functions: history gate, all 7 opportunity-score factors,
              market-value comparison, maintenance rule engine
  adapters/   InventorySource interface + AutoDevInventorySource (real) + FixtureInventorySource (test-only)
  validation/ Zod schemas for data crossing API/storage boundaries
migrations/   D1 SQL migrations (schema, indexes, history tables, listing photo count)
tests/        Cross-cutting integration tests and shared fixtures
docs/         Architecture, data sources, scoring, and history-gate notes — read these for the "why"
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

To pull real inventory locally, get a free key at [auto.dev](https://www.auto.dev) and add it to `apps/worker/.dev.vars` (copy `.dev.vars.example`):

```
AUTODEV_API_KEY=your-key-here
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

The core pipeline from the spec's build order (§48) is done and running in production: repository, D1 schema, domain models, history gate, VIN deduplication, a real inventory adapter (Auto.dev), manual history verification, the market-value engine, the maintenance engine, and full 7-factor opportunity scoring. Two real vehicles have already been verified end-to-end and appeared correctly ranked in the live dashboard.

**Not yet built**: a second/third inventory adapter (AutoNation, CarGurus, and MarketCheck were all evaluated and rejected — see `docs/data-sources.md`), watchlists, alerts/notifications, and price-history analytics. See `Technical _Specs.md` §48 for the authoritative, line-by-line status.
