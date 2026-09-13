import { Hono } from "hono";
import { watchlistInputSchema, type DiscoveryPreferences } from "@vinscout/validation";
import type { Env } from "../env";

export const watchlists = new Hono<{ Bindings: Env }>();

// Each watchlist runs as its own discovery pass (discoverListings.ts), so
// the count is capped to protect the free-tier API quota — see
// docs/preferences.md and docs/data-sources.md for the budget math.
const MAX_WATCHLISTS = 3;

interface WatchlistRow {
  id: number;
  name: string;
  criteria_json: string;
  created_at: string;
}

function toResponse(row: WatchlistRow) {
  let criteria: DiscoveryPreferences = {};
  try {
    criteria = JSON.parse(row.criteria_json) as DiscoveryPreferences;
  } catch {
    // leave criteria empty rather than fail the whole list on one bad row
  }
  return { id: row.id, name: row.name, criteria, createdAt: row.created_at };
}

watchlists.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM watchlists ORDER BY created_at ASC").all<WatchlistRow>();
  return c.json(results.map(toResponse));
});

watchlists.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = watchlistInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const { count } = (await c.env.DB.prepare("SELECT COUNT(*) as count FROM watchlists").first<{ count: number }>()) ?? {
    count: 0,
  };
  if (count >= MAX_WATCHLISTS) {
    return c.json(
      { error: `Limit of ${MAX_WATCHLISTS} saved searches reached — delete one before adding another.` },
      409,
    );
  }

  const createdAt = new Date().toISOString();
  const result = await c.env.DB.prepare("INSERT INTO watchlists (name, criteria_json, created_at) VALUES (?, ?, ?)")
    .bind(parsed.data.name, JSON.stringify(parsed.data.criteria), createdAt)
    .run();

  return c.json(
    { id: result.meta.last_row_id, name: parsed.data.name, criteria: parsed.data.criteria, createdAt },
    201,
  );
});

watchlists.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json().catch(() => null);
  const parsed = watchlistInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM watchlists WHERE id = ?").bind(id).first<{ id: number }>();
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await c.env.DB.prepare("UPDATE watchlists SET name = ?, criteria_json = ? WHERE id = ?")
    .bind(parsed.data.name, JSON.stringify(parsed.data.criteria), id)
    .run();

  return c.json({ id, name: parsed.data.name, criteria: parsed.data.criteria });
});

watchlists.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const existing = await c.env.DB.prepare("SELECT id FROM watchlists WHERE id = ?").bind(id).first<{ id: number }>();
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }

  await c.env.DB.prepare("DELETE FROM watchlists WHERE id = ?").bind(id).run();
  return c.json({ deleted: true });
});
