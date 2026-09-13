export interface Env {
  DB: D1Database;
  ENABLE_FIXTURE_SOURCE: string;
  /** Auto.dev API key (secret) — set via `wrangler secret put AUTODEV_API_KEY` in production. Optional: source is skipped if unset. */
  AUTODEV_API_KEY?: string;
  /**
   * Shared secret required on every /api/* request (see index.ts's middleware).
   * Only the web app's same-origin proxy (apps/web/src/worker.ts) knows this —
   * end users never call this Worker's hostname directly. Set via
   * `wrangler secret put INTERNAL_PROXY_SECRET` in production, and in
   * .dev.vars locally (must match the value the web app's dev proxy sends).
   */
  INTERNAL_PROXY_SECRET: string;
}
