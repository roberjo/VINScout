# VINScout

VINScout aggregates car listings from multiple sources and analyzes them for condition, deal quality, and value — helping surface the listings worth a closer look.

## Goals

- **Aggregate**: pull listings from multiple marketplaces/sources into one place
- **Normalize**: reconcile inconsistent fields (mileage, trim, options, price) across sources
- **Analyze**: score listings on deal quality and value relative to comparable vehicles
- **Filter**: let users search/filter by condition, price, deal score, and other criteria

## Tech Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- npm workspaces monorepo

## Repo Layout

```
apps/
  web/              Next.js frontend (@vinscout/web)
services/           Backend application services (scrapers, API, deal-scoring, ...)
                     — see services/README.md for how to add one
packages/
  shared-types/      Domain types shared across apps and services (@vinscout/shared-types)
```

This structure is meant to grow: new backend services (e.g. a listing scraper, a
deal-scoring worker, a public API) go under `services/` as their own workspace
packages, sharing domain types and utilities via `packages/*` rather than
duplicating them.

## Getting Started

Install dependencies (from the repo root):

```bash
npm install
```

Run the web app in dev mode:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

Build/lint across every workspace:

```bash
npm run build
npm run lint
```

## Project Status

Early scaffolding — architecture and data sources are still being defined.
