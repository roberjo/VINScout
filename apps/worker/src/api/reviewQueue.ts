import { Hono } from "hono";
import type { MarketComparison } from "@vinscout/domain";
import { computeReviewHighlights, mileageScore, trimScore } from "@vinscout/scoring";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";

export const reviewQueue = new Hono<{ Bindings: Env }>();

interface ReportLinkRow {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

// Not on VehicleRow (see normalization/vehicleRow.ts) — these two are
// preview-only fields the review queue needs but the rest of the app
// doesn't, so they're kept local rather than added to the shared row shape.
type VehicleRowWithPreviewFields = VehicleRow & {
  market_comparison_json: string | null;
  reliability_score: number | null;
};

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
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
    .all<VehicleRowWithPreviewFields>();

  const currentYear = new Date().getFullYear();

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

      const marketComparison = safeParseJson<MarketComparison>(row.market_comparison_json);
      const highlights = computeReviewHighlights({
        marketComparison,
        mileageScoreValue: mileageScore(row.mileage, row.year, currentYear),
        trimScoreValue: trimScore(row.trim),
        reliabilityScoreValue: row.reliability_score,
        maintenanceScoreValue: row.maintenance_score,
      });

      return {
        ...vehicleRowToDomain(row),
        historyReportLinks: links,
        price: listing?.price ?? null,
        listingUrl: listing?.listing_url ?? null,
        imageUrl: listing?.primary_image_url ?? null,
        dealerName: listing?.dealer_name ?? null,
        dealerCity: listing?.dealer_city ?? null,
        dealerState: listing?.dealer_state ?? null,
        marketComparison,
        highlights,
      };
    }),
  );

  return c.json(vehicles);
});
