export interface Env {
  DB: D1Database;
  ENABLE_FIXTURE_SOURCE: string;
  /** Auto.dev API key (secret) — set via `wrangler secret put AUTODEV_API_KEY` in production. Optional: source is skipped if unset. */
  AUTODEV_API_KEY?: string;
}
