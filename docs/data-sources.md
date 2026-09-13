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

**Status: no real adapter implemented yet.** `FixtureInventorySource` (`packages/adapters/src/fixtureSource.ts`) exists to exercise the pipeline against static sample data — it's not a real source and is gated off in production via the `ENABLE_FIXTURE_SOURCE` var (`false` in `wrangler.toml`, `true` only in local `.dev.vars`), so the live cron never writes fake data into real D1.

Before adding a real adapter, confirm the specific source's terms of service, robots restrictions, authentication requirements, and API policies allow this kind of automated access.
