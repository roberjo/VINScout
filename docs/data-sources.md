# Data Sources

Spec §12 — Source Priority. Initial priority order:

1. Official dealer inventory
2. Permitted inventory APIs/feeds
3. Cars.com
4. AutoTrader
5. CarGurus
6. TrueCar
7. Other aggregators

Each source is implemented as an `InventorySource` (`packages/adapters`) and registered in `apps/worker/src/jobs/discoverListings.ts`'s `registeredSources()`. No source is architecturally mandatory — the discovery job simply iterates whatever's registered.

## Status

- **`AutoDevInventorySource`** (`packages/adapters/src/autoDevSource.ts`) — live, priority 2 ("permitted inventory APIs/feeds"). Uses [Auto.dev](https://www.auto.dev)'s Vehicle Listings API (free plan: 1,000 calls/month, no card required), which also returns a `carfaxUrl` field when the dealer's listing has one — no scraping involved. Registers only when `AUTODEV_API_KEY` is set (production secret via `wrangler secret put`, or `apps/worker/.dev.vars` locally); no key means the source is simply skipped. Capped at 1 page (20 listings) per cron run — ~120 calls/month, well under the free cap.
- **`FixtureInventorySource`** (`packages/adapters/src/fixtureSource.ts`) — static sample data for local pipeline testing only. Gated off in production via `ENABLE_FIXTURE_SOURCE` (`false` in `wrangler.toml`, `true` only in local `.dev.vars`) so it never writes fake data into real D1.

## Sources evaluated and rejected

- **AutoNation** (`autonation.com/cars-for-sale`) — `robots.txt` explicitly disallows `/cars-search-results*` (almost certainly the search page's backend endpoint), and the site sits behind Cloudflare's bot-challenge wall — a plain fetch got a 403 challenge page even with a browser user-agent. Building a scraper there would mean deliberately working around both an explicit robots.txt restriction and active anti-bot protection.
- **CarGurus** (`cargurus.com/Cars/developers/`) — the "developer" program is dealer-management tooling (Dealer Reviews, Dealer SMS, Dealer Stats), not a public inventory-search API. One endpoint (`carselector/listingSearch.action`) does return listings, but `robots.txt` explicitly disallows the whole `/Cars/api/` path, and its `affiliatePartner` parameter implies it's built for approved widget-embed partners, not self-serve aggregation. Declined even after being explicitly asked to ignore the robots.txt restriction — that's a site-owner access-control signal, not a courtesy norm to route around.
- **MarketCheck** — legitimate free tier (500 calls/month, self-serve), and an adapter was built and tested against their real documented API. Removed after signup turned out to require a credit card, which is outside this project's zero-budget constraint.

## Before adding another adapter

Confirm the specific source's terms of service, robots restrictions, authentication requirements, and API policies allow this kind of automated access — check `robots.txt` and try an unauthenticated fetch of the target page before writing any scraping code.
