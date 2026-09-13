import { Hono } from "hono";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";

export const reviewQueue = new Hono<{ Bindings: Env }>();

interface ReportLinkRow {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

interface ListingRow {
  price: number | null;
  listing_url: string | null;
  primary_image_url: string | null;
  dealer_name: string | null;
  dealer_city: string | null;
  dealer_state: string | null;
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
      const [{ results: links }, listing] = await Promise.all([
        c.env.DB.prepare(
          `SELECT provider, source_url, retrieved_at FROM history_evidence
           WHERE vin = ? AND event_type = 'REPORT_LINK' ORDER BY retrieved_at DESC`,
        )
          .bind(row.vin)
          .all<ReportLinkRow>(),
        c.env.DB.prepare(
          `SELECT price, listing_url, primary_image_url, dealer_name, dealer_city, dealer_state
           FROM listings WHERE vin = ? AND active = 1 ORDER BY last_seen_at DESC LIMIT 1`,
        )
          .bind(row.vin)
          .first<ListingRow>(),
      ]);

      return {
        ...vehicleRowToDomain(row),
        historyReportLinks: links,
        price: listing?.price ?? null,
        listingUrl: listing?.listing_url ?? null,
        imageUrl: listing?.primary_image_url ?? null,
        dealerName: listing?.dealer_name ?? null,
        dealerCity: listing?.dealer_city ?? null,
        dealerState: listing?.dealer_state ?? null,
      };
    }),
  );

  return c.json(vehicles);
});
