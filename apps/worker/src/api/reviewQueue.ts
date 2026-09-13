import { Hono } from "hono";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";

export const reviewQueue = new Hono<{ Bindings: Env }>();

interface ReportLinkRow {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

// Vehicles that failed the history gate (almost always because history is
// still UNKNOWN) and are waiting on a human to review any surfaced
// Carfax/AutoCheck link and record the result via PATCH /api/vehicles/:vin/history.
reviewQueue.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  const { results: vehicleRows } = await c.env.DB.prepare(
    "SELECT * FROM vehicles WHERE status = 'REJECTED' ORDER BY first_seen_at DESC LIMIT ?",
  )
    .bind(limit)
    .all<VehicleRow>();

  const vehicles = await Promise.all(
    vehicleRows.map(async (row) => {
      const { results: links } = await c.env.DB.prepare(
        `SELECT provider, source_url, retrieved_at FROM history_evidence
         WHERE vin = ? AND event_type = 'REPORT_LINK' ORDER BY retrieved_at DESC`,
      )
        .bind(row.vin)
        .all<ReportLinkRow>();

      return { ...vehicleRowToDomain(row), historyReportLinks: links };
    }),
  );

  return c.json(vehicles);
});
