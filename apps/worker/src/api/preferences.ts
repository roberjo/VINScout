import { Hono } from "hono";
import { discoveryPreferencesSchema, type DiscoveryPreferences } from "@vinscout/validation";
import type { Env } from "../env";

export const preferences = new Hono<{ Bindings: Env }>();

// Single saved preferences record — the `watchlists` table (spec §14)
// supports multiple named searches, but with one Auto.dev call already
// capped to conserve the free-tier quota (see discoverListings.ts), a
// single active preference set is what this actually needs right now.
const WATCHLIST_NAME = "default";

preferences.get("/", async (c) => {
  const row = await c.env.DB.prepare("SELECT criteria_json FROM watchlists WHERE name = ?")
    .bind(WATCHLIST_NAME)
    .first<{ criteria_json: string }>();

  if (!row) return c.json({});

  try {
    return c.json(JSON.parse(row.criteria_json) as DiscoveryPreferences);
  } catch {
    return c.json({});
  }
});

preferences.put("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = discoveryPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const criteriaJson = JSON.stringify(parsed.data);
  const existing = await c.env.DB.prepare("SELECT id FROM watchlists WHERE name = ?")
    .bind(WATCHLIST_NAME)
    .first<{ id: number }>();

  if (existing) {
    await c.env.DB.prepare("UPDATE watchlists SET criteria_json = ? WHERE id = ?")
      .bind(criteriaJson, existing.id)
      .run();
  } else {
    await c.env.DB.prepare("INSERT INTO watchlists (name, criteria_json, created_at) VALUES (?, ?, ?)")
      .bind(WATCHLIST_NAME, criteriaJson, new Date().toISOString())
      .run();
  }

  return c.json(parsed.data);
});
