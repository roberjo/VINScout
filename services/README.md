# Services

Backend application services live here as npm workspace packages, one directory per service — e.g. `services/scraper-worker`, `services/api`, `services/deal-scorer`.

## Adding a new service

1. Create `services/<name>/` with its own `package.json` (name it `@vinscout/<name>`) so it's picked up as an npm workspace automatically.
2. Depend on shared code via workspace packages, e.g. `"@vinscout/shared-types": "*"` in `dependencies`.
3. Add `dev`/`build`/`lint` scripts as applicable — the root `npm run build` and `npm run lint` run across all workspaces automatically.
4. Give the service its own README describing what it does and how to run it.

## Conventions

- Domain types shared across services and the web app go in `packages/shared-types`, not duplicated per-service.
- Services should be independently runnable/deployable — avoid reaching into another service's internals; share code through `packages/*` instead.
