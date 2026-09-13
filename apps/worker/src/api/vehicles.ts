import { Hono } from "hono";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";

export const vehicles = new Hono<{ Bindings: Env }>();

// Only ACTIVE, history-approved vehicles are eligible for an opportunity
// score in the first place (see @vinscout/scoring's history gate), so
// ordering by opportunity_score here never surfaces a rejected vehicle.
vehicles.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM vehicles
     WHERE status = 'ACTIVE' AND opportunity_score IS NOT NULL
     ORDER BY opportunity_score DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all<VehicleRow>();

  return c.json(results.map(vehicleRowToDomain));
});

vehicles.get("/:vin", async (c) => {
  const vin = c.req.param("vin");

  const row = await c.env.DB.prepare("SELECT * FROM vehicles WHERE vin = ?")
    .bind(vin)
    .first<VehicleRow>();

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(vehicleRowToDomain(row));
});
