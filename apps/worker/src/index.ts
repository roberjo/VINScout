import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { vehicles } from "./api/vehicles";
import { reviewQueue } from "./api/reviewQueue";
import { preferences } from "./api/preferences";
import { discoverListings } from "./jobs/discoverListings";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());
app.route("/api/vehicles", vehicles);
app.route("/api/review-queue", reviewQueue);
app.route("/api/preferences", preferences);

app.get("/health", (c) => c.json({ ok: true }));

export default {
  fetch: app.fetch,

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(discoverListings(env));
  },
};
