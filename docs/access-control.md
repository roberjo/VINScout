# Access Control

Every API endpoint originally had zero authentication — any random visitor to `vinscout-worker.johnbroberts.workers.dev` could overwrite or delete saved searches, or (more seriously) submit fake "verified clean" history for any vehicle via `PATCH /api/vehicles/:vin/history`, corrupting the one piece of data the whole app exists to protect. That's fixed now, in two complementary layers.

## Layer 1: Cloudflare Access on the dashboard

`vinscout.johnbroberts.workers.dev` sits behind a Cloudflare Access application (Zero Trust, free tier) — only an allow-listed identity can load the page at all. This is the human-facing gate.

**First attempt used two separate Access applications** (one per hostname, since the dashboard and the API worker are different `*.workers.dev` hostnames) and had the browser call the API cross-origin with `credentials: "include"`. That broke in two ways:

1. Browsers don't send one hostname's session cookie on a `fetch()` to a different hostname without matching CORS + credentials configuration — and even with that fixed, each hostname needs its own Access login, which the browser can't establish via a background `fetch()`. Result: dashboard loads, then every API call fails.
2. Cloudflare Access's login page itself doesn't carry the origin's own CORS headers, so a cross-origin `fetch()` hitting an unauthenticated hostname sees an opaque/blocked response rather than a usable error.

## Layer 2: same-origin proxy + shared secret (the actual fix)

`apps/web/src/worker.ts` is a small Worker script (wired in via `wrangler.jsonc`'s `main` + `assets.run_worker_first: ["/api/*"]`) that runs *inside* the already-Access-protected dashboard Worker. Every `/api/*` request from the browser goes to this same hostname — no cross-origin call, no second Access login — and this script forwards it server-side to the real backend (`vinscout-worker.johnbroberts.workers.dev`), attaching a shared secret header (`X-Internal-Proxy-Key`) that only these two Workers know.

The backend (`apps/worker/src/index.ts`) requires that exact header on every `/api/*` request and rejects anything else with `401` — regardless of whether the caller went through Access or not. This is what actually closes the original hole: the backend's raw hostname is still technically internet-reachable, but every request without the shared secret gets rejected before it reaches any route handler.

**Net effect:** a browser only ever needs to authenticate once, against the single dashboard hostname. The backend Worker is protected independently of Access, by a secret only the proxy holds — so even if someone finds the raw backend URL, they can't do anything with it.

## Local development

Both `.dev.vars` files (gitignored, see `.dev.vars.example` in each app) must have matching `INTERNAL_PROXY_SECRET` values — copy the example files. `apps/web/.dev.vars` also overrides `BACKEND_URL` to `http://localhost:8787` so the local proxy talks to your local `wrangler dev` backend instead of production (without that override, `wrangler.jsonc`'s `vars.BACKEND_URL` — the production URL — is what the `cloudflare()` Vite plugin uses even in local dev, since it runs `apps/web/src/worker.ts` for real inside Vite's dev server).

## What's *not* covered

- **The cron trigger bypasses all of this** — `scheduled()` handlers run outside the HTTP/Access layer entirely, so the discovery job is unaffected by any of the above, as it should be (it's not a browser request).
- **This doesn't add per-user identity inside the app.** Access controls who can reach the dashboard at all; there's no concept of separate app-level users, roles, or permissions beyond that single gate. Fine for a single-user personal project; would need real auth if this ever became multi-user.
