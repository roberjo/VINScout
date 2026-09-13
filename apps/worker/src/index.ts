import { Hono } from "hono";
import type { Env } from "./env";
import { vehicles } from "./api/vehicles";
import { reviewQueue } from "./api/reviewQueue";
import { watchlists } from "./api/watchlists";
import { discoverListings } from "./jobs/discoverListings";

const app = new Hono<{ Bindings: Env }>();

// This Worker's hostname is never called directly by a browser anymore —
// the web app proxies /api/* same-origin (apps/web/src/worker.ts) so there's
// no cross-origin cookie/CORS problem for Cloudflare Access to solve. Access
// protects the dashboard hostname; this shared-secret check is what protects
// *this* hostname, since anyone who finds this raw URL would otherwise
// bypass Access entirely (see docs/access-control.md).
app.use("/api/*", async (c, next) => {
  if (c.req.header("X-Internal-Proxy-Key") !== c.env.INTERNAL_PROXY_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

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
