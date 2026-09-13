import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { vehicles } from "./api/vehicles";
import { discoverListings } from "./jobs/discoverListings";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());
app.route("/api/vehicles", vehicles);

app.get("/health", (c) => c.json({ ok: true }));

export default {
  fetch: app.fetch,

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(discoverListings(env));
  },
};
