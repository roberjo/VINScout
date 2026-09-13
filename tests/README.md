# Tests

- `tests/unit` — cross-cutting unit tests that don't belong to a single package. Package-local unit tests (e.g. the history gate, opportunity scoring) live next to their source in `packages/*/src/**/*.test.ts` instead.
- `tests/integration` — tests that exercise multiple packages/services together (e.g. discovery → normalization → history gate → D1 persistence), once there's enough built to integrate.
- `tests/fixtures` — sample data (raw listings, VIN decode responses, history-provider payloads) shared across tests. See `sample-raw-listing.json`.
