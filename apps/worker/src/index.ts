import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { vehicles } from "./api/vehicles";
import { reviewQueue } from "./api/reviewQueue";
import { watchlists } from "./api/watchlists";
import { discoverListings } from "./jobs/discoverListings";

const app = new Hono<{ Bindings: Env }>();

// The dashboard (vinscout.johnbroberts.workers.dev) and this API
// (vinscout-worker.johnbroberts.workers.dev) are different hostnames, each
// behind its own Cloudflare Access application. A wildcard origin can't be
// combined with credentialed requests, so the dashboard's exact origin is
// named explicitly and credentials are allowed through — otherwise the
// browser won't send the Access session cookie cross-origin at all.
app.use(
  "/api/*",
  cors({
    origin: "https://vinscout.johnbroberts.workers.dev",
    credentials: true,
  }),
);
app.route("/api/vehicles", vehicles);
app.route("/api/review-queue", reviewQueue);
app.route("/api/watchlists", watchlists);

app.get("/health", (c) => c.json({ ok: true }));

export default {
  fetch: app.fetch,

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(discoverListings(env));
  },
};
