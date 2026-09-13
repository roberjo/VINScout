import { estimateMarketValue, marketPriceAdvantageScore } from "@vinscout/scoring";
import type { Env } from "../env";

interface TargetRow {
  make: string;
  model: string;
  year: number;
  mileage: number;
}

interface ComparableRow {
  price: number;
  mileage: number;
}

// Spec §17 — Value Engine. Compares a vehicle's asking price to other active
// listings for the same make/model within +/-1 model year, then stores the
// resulting 0-100 sub-score on vehicles.value_score. No-ops (leaves
// value_score untouched) when there's no active listing price for this
// vehicle, or no comparables close enough in mileage to say anything
// meaningful — see @vinscout/scoring's estimateMarketValue.
export async function computeMarketValue(env: Env, vin: string): Promise<void> {
  const target = await env.DB.prepare("SELECT make, model, year, mileage FROM vehicles WHERE vin = ?")
    .bind(vin)
    .first<TargetRow>();
  if (!target) return;

  const listing = await env.DB.prepare(
    "SELECT price FROM listings WHERE vin = ? AND active = 1 ORDER BY last_seen_at DESC LIMIT 1",
  )
    .bind(vin)
    .first<{ price: number }>();
  if (!listing) return;

  const { results: candidates } = await env.DB.prepare(
    `SELECT l.price as price, v.mileage as mileage
     FROM listings l
     JOIN vehicles v ON v.vin = l.vin
     WHERE v.make = ? AND v.model = ? AND v.year BETWEEN ? AND ?
       AND l.active = 1 AND v.vin != ?`,
  )
    .bind(target.make, target.model, target.year - 1, target.year + 1, vin)
    .all<ComparableRow>();

  const comparison = estimateMarketValue({ askingPrice: listing.price, mileage: target.mileage }, candidates);
  if (!comparison) return;

  const valueScore = marketPriceAdvantageScore(comparison);

  await env.DB.prepare("UPDATE vehicles SET value_score = ?, market_comparison_json = ? WHERE vin = ?")
    .bind(valueScore, JSON.stringify(comparison), vin)
    .run();
}
