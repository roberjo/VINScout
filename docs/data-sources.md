# Data Sources

Spec §12 — Source Priority. Initial priority order:

1. Official dealer inventory
2. Permitted inventory APIs/feeds
3. Cars.com
4. AutoTrader
5. CarGurus
6. TrueCar
7. Other aggregators

Each source is implemented as an `InventorySource` (`packages/adapters`) and registered in `apps/worker/src/jobs/discoverListings.ts`. No source is architecturally mandatory — the discovery job simply iterates whatever's registered.

**Status: no adapters implemented yet.** Each one must respect that source's terms of service, robots restrictions, authentication requirements, and API policies before it's added here.
