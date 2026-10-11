import { Hono } from "hono";
import { historyVerificationSchema } from "@vinscout/validation";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";
import { applyHistoryVerification } from "../history/verifyHistory";
import { CURRENT_LISTING_CTE, LISTING_JOIN_SELECT, type ListingJoinFields } from "../db/currentListing";
import { fetchVehicleFacets } from "../db/vehicleFacets";

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

export const vehicles = new Hono<{ Bindings: Env }>();

// Whitelisted rather than taking the column name straight off the query
// string — this goes directly into ORDER BY, which can't be parameterized
// like a value can, so an unvalidated column name would be a SQL injection
// vector.
const SORTABLE_COLUMNS: Record<string, string> = {
  opportunityScore: "v.opportunity_score",
  price: "cl.price",
  mileage: "v.mileage",
  year: "v.year",
  firstSeenAt: "v.first_seen_at",
};
const DEFAULT_SORT = "opportunityScore";

// Only ACTIVE, history-approved vehicles are eligible for an opportunity
// score in the first place (see @vinscout/scoring's history gate).
const BASE_CONDITION = "v.status = 'ACTIVE' AND v.opportunity_score IS NOT NULL";

// Make/model dropdown options for the filter bar — scoped to the same base
// condition as the listing query below (never offers a make/model with zero
// results here), but deliberately ignores the *other* filters currently
// selected, so picking a make never makes every other make disappear from
// its own dropdown.
vehicles.get("/facets", async (c) => {
  const facets = await fetchVehicleFacets(c.env, BASE_CONDITION, []);
  return c.json(facets);
});

// No sort/filter/pagination combination here can ever surface a rejected
// vehicle — that gate is enforced in the WHERE clause, independent of
// whatever the user chose to sort or filter by.
vehicles.get("/", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 25) || 25, 100);
  const offset = Math.max(Number(c.req.query("offset") ?? 0) || 0, 0);
  const make = c.req.query("make");
  const model = c.req.query("model");
  const priceMin = c.req.query("priceMin");
  const priceMax = c.req.query("priceMax");
  const mileageMax = c.req.query("mileageMax");
  const yearMin = c.req.query("yearMin");
  const yearMax = c.req.query("yearMax");

  const sortByParam = c.req.query("sortBy") ?? DEFAULT_SORT;
  const sortColumn = SORTABLE_COLUMNS[sortByParam] ?? SORTABLE_COLUMNS[DEFAULT_SORT];
  const sortDir = c.req.query("sortDir") === "asc" ? "ASC" : "DESC";

  const conditions = [BASE_CONDITION];
  const params: (string | number)[] = [];

  if (make) {
    conditions.push("v.make = ?");
    params.push(make);
  }
  if (model) {
    conditions.push("v.model = ?");
    params.push(model);
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
  if (yearMin) {
    conditions.push("v.year >= ?");
    params.push(Number(yearMin));
  }
  if (yearMax) {
    conditions.push("v.year <= ?");
    params.push(Number(yearMax));
  }

  const whereClause = conditions.join(" AND ");

  const [{ results }, countRow] = await Promise.all([
    c.env.DB.prepare(
      `${CURRENT_LISTING_CTE}
       SELECT v.*, ${LISTING_JOIN_SELECT}
       FROM vehicles v
       LEFT JOIN current_listing cl ON cl.vin = v.vin AND cl.rn = 1
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDir} NULLS LAST, v.vin
       LIMIT ? OFFSET ?`,
    )
      .bind(...params, limit, offset)
      .all<VehicleWithListingRow>(),
    c.env.DB.prepare(
      `${CURRENT_LISTING_CTE}
       SELECT COUNT(*) AS total
       FROM vehicles v
       LEFT JOIN current_listing cl ON cl.vin = v.vin AND cl.rn = 1
       WHERE ${whereClause}`,
    )
      .bind(...params)
      .first<{ total: number }>(),
  ]);

  return c.json({
    items: results.map(vehicleRowWithListingToDomain),
    total: countRow?.total ?? 0,
    limit,
    offset,
  });
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
