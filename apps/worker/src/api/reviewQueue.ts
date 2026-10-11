import { Hono } from "hono";
import type { MarketComparison } from "@vinscout/domain";
import { computeReviewHighlights, mileageScore, trimScore } from "@vinscout/scoring";
import type { Env } from "../env";
import { vehicleRowToDomain, type VehicleRow } from "../normalization/vehicleRow";
import { CURRENT_LISTING_CTE, LISTING_JOIN_SELECT, type ListingJoinFields } from "../db/currentListing";
import { fetchVehicleFacets } from "../db/vehicleFacets";

export const reviewQueue = new Hono<{ Bindings: Env }>();

interface ReportLinkRow {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

// Not on VehicleRow (see normalization/vehicleRow.ts) — these are
// preview-only fields the review queue needs but the rest of the app
// doesn't, so they're kept local rather than added to the shared row shape.
type VehicleRowWithPreviewFields = VehicleRow &
  ListingJoinFields & {
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

// Whitelisted rather than taking the column name straight off the query
// string — see apps/worker/src/api/vehicles.ts's SORTABLE_COLUMNS for the
// same reasoning (this goes directly into ORDER BY, which can't be
// parameterized like a value can). No opportunityScore here — nothing in
// this queue has one yet (spec §2's history-before-value gate).
const SORTABLE_COLUMNS: Record<string, string> = {
  firstSeenAt: "v.first_seen_at",
  price: "cl.price",
  mileage: "v.mileage",
  year: "v.year",
};
const DEFAULT_SORT = "firstSeenAt";
const BASE_CONDITION = "v.status = 'REJECTED'";

// Make/model dropdown options for the filter bar — scoped to the same base
// condition as the listing query below, but ignores whatever make/model/etc.
// is currently selected so picking one doesn't make every other option
// disappear from its own dropdown.
reviewQueue.get("/facets", async (c) => {
  const facets = await fetchVehicleFacets(c.env, BASE_CONDITION, []);
  return c.json(facets);
});

// Vehicles that failed the history gate (almost always because history is
// still UNKNOWN) and are waiting on a human to review any surfaced
// Carfax/AutoCheck link and record the result via PATCH /api/vehicles/:vin/history.
reviewQueue.get("/", async (c) => {
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

  const [{ results: vehicleRows }, countRow] = await Promise.all([
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
      .all<VehicleRowWithPreviewFields>(),
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

  const currentYear = new Date().getFullYear();

  const vehicles = await Promise.all(
    vehicleRows.map(async (row) => {
      const { results: links } = await c.env.DB.prepare(
        `SELECT provider, source_url, retrieved_at FROM history_evidence
         WHERE vin = ? AND event_type = 'REPORT_LINK' ORDER BY retrieved_at DESC`,
      )
        .bind(row.vin)
        .all<ReportLinkRow>();

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
        price: row.listing_price,
        listingUrl: row.listing_url,
        imageUrl: row.listing_image_url,
        dealerName: row.listing_dealer_name,
        dealerCity: row.listing_dealer_city,
        dealerState: row.listing_dealer_state,
        marketComparison,
        highlights,
      };
    }),
  );

  return c.json({
    items: vehicles,
    total: countRow?.total ?? 0,
    limit,
    offset,
  });
});
