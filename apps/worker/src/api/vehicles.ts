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

// The vehicle's most recently seen active listing, joined in for display —
// a vehicle can in principle have more than one (multiple sources), but we
// only ever show the freshest one.
interface ListingJoinFields {
  listing_price: number | null;
  listing_url: string | null;
  listing_dealer_name: string | null;
  listing_dealer_city: string | null;
  listing_dealer_state: string | null;
  listing_image_url: string | null;
}

// vehicles.market_comparison_json / score_breakdown_json (migration 0005) —
// written by computeMarketValue/computeOpportunityScore so the dashboard can
// explain *why* a vehicle scored the way it did, not just show a number.
interface ScoreDetailFields {
  market_comparison_json: string | null;
  score_breakdown_json: string | null;
}

type VehicleWithListingRow = VehicleRow & ListingJoinFields & ScoreDetailFields;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function vehicleRowWithListingToDomain(row: VehicleWithListingRow) {
  return {
    ...vehicleRowToDomain(row),
    price: row.listing_price,
    listingUrl: row.listing_url,
    dealerName: row.listing_dealer_name,
    dealerCity: row.listing_dealer_city,
    dealerState: row.listing_dealer_state,
    imageUrl: row.listing_image_url,
    marketComparison: safeParseJson(row.market_comparison_json),
    scoreBreakdown: safeParseJson(row.score_breakdown_json),
  };
}

// Picks each vehicle's single freshest active listing (ROW_NUMBER, not a
// plain JOIN) so a vehicle with more than one active listing doesn't fan out
// into duplicate rows.
const CURRENT_LISTING_CTE = `
  WITH current_listing AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY vin ORDER BY last_seen_at DESC) AS rn
    FROM listings
    WHERE active = 1
  )
`;

const LISTING_JOIN_SELECT = `
  cl.price AS listing_price, cl.listing_url AS listing_url,
  cl.dealer_name AS listing_dealer_name, cl.dealer_city AS listing_dealer_city,
  cl.dealer_state AS listing_dealer_state, cl.primary_image_url AS listing_image_url
`;

export const vehicles = new Hono<{ Bindings: Env }>();

// Only ACTIVE, history-approved vehicles are eligible for an opportunity
// score in the first place (see @vinscout/scoring's history gate), so
// ordering by opportunity_score here never surfaces a rejected vehicle.
vehicles.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const make = c.req.query("make");
  const priceMin = c.req.query("priceMin");
  const priceMax = c.req.query("priceMax");
  const mileageMax = c.req.query("mileageMax");

  const conditions = ["v.status = 'ACTIVE'", "v.opportunity_score IS NOT NULL"];
  const params: (string | number)[] = [];

  if (make) {
    conditions.push("v.make = ?");
    params.push(make);
  }
  if (mileageMax) {
    conditions.push("v.mileage <= ?");
    params.push(Number(mileageMax));
  }
  if (priceMin) {
    conditions.push("cl.price >= ?");
    params.push(Number(priceMin));
  }
  if (priceMax) {
    conditions.push("cl.price <= ?");
    params.push(Number(priceMax));
  }

  params.push(limit);

  const { results } = await c.env.DB.prepare(
    `${CURRENT_LISTING_CTE}
     SELECT v.*, ${LISTING_JOIN_SELECT}
     FROM vehicles v
     LEFT JOIN current_listing cl ON cl.vin = v.vin AND cl.rn = 1
     WHERE ${conditions.join(" AND ")}
     ORDER BY v.opportunity_score DESC
     LIMIT ?`,
  )
    .bind(...params)
    .all<VehicleWithListingRow>();

  return c.json(results.map(vehicleRowWithListingToDomain));
});

vehicles.get("/:vin", async (c) => {
  const vin = c.req.param("vin");

  const row = await c.env.DB.prepare(
    `${CURRENT_LISTING_CTE}
     SELECT v.*, ${LISTING_JOIN_SELECT}
     FROM vehicles v
     LEFT JOIN current_listing cl ON cl.vin = v.vin AND cl.rn = 1
     WHERE v.vin = ?`,
  )
    .bind(vin)
    .first<VehicleWithListingRow>();

  if (!row) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(vehicleRowWithListingToDomain(row));
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
