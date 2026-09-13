import { Hono } from "hono";
import { historyVerificationSchema } from "@vinscout/validation";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";
import { applyHistoryVerification } from "../history/verifyHistory";

interface HistoryEvidenceRow {
  id: number;
  provider: string;
  provider_record_id: string | null;
  event_type: string;
  event_date: string | null;
  description: string | null;
  source_url: string | null;
  retrieved_at: string;
}

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

vehicles.get("/:vin/evidence", async (c) => {
  const vin = c.req.param("vin");

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM history_evidence WHERE vin = ? ORDER BY retrieved_at DESC",
  )
    .bind(vin)
    .all<HistoryEvidenceRow>();

  return c.json(results);
});

// Records a human's manual history review (spec §9-10) — never triggers any
// automated fetch of a third-party report; see docs/history-gate.md.
vehicles.patch("/:vin/history", async (c) => {
  const vin = c.req.param("vin");
  const body = await c.req.json().catch(() => null);
  const parsed = historyVerificationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid body", details: parsed.error.flatten() }, 400);
  }

  const result = await applyHistoryVerification(c.env, vin, parsed.data);
  if (!result) {
    return c.json({ error: "Vehicle not found" }, 404);
  }

  return c.json(result.decision);
});
