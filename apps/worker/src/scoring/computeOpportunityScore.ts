import {
  ageScore,
  dealerQualityScore,
  mileageScore,
  scoreOpportunity,
  trimScore,
  type HistoryDecision,
} from "@vinscout/scoring";
import type { Env } from "../env";
import { computeReliabilityScore } from "./computeReliabilitySignal";

interface VehicleRow {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number;
  value_score: number | null;
  maintenance_score: number | null;
}

// Spec §18 — Opportunity Score. Assembles all 7 factors and writes the
// result to vehicles.opportunity_score. `history` is the decision the
// caller already computed (this only ever runs for an eligible vehicle, but
// scoreOpportunity still takes it as the enforcement point). Missing
// value_score/maintenance_score (e.g. no market comparables yet) default to
// a neutral 50 rather than blocking the score entirely.
export async function computeOpportunityScore(env: Env, vin: string, history: HistoryDecision): Promise<void> {
  const vehicle = await env.DB.prepare(
    "SELECT year, make, model, trim, mileage, value_score, maintenance_score FROM vehicles WHERE vin = ?",
  )
    .bind(vin)
    .first<VehicleRow>();
  if (!vehicle) return;

  const listing = await env.DB.prepare(
    "SELECT photo_count FROM listings WHERE vin = ? AND active = 1 ORDER BY last_seen_at DESC LIMIT 1",
  )
    .bind(vin)
    .first<{ photo_count: number | null }>();

  const currentYear = new Date().getFullYear();
  const reliability = await computeReliabilityScore(vehicle.make, vehicle.model, vehicle.year);

  const result = scoreOpportunity(history, {
    marketPriceAdvantage: vehicle.value_score ?? 50,
    mileage: mileageScore(vehicle.mileage, vehicle.year, currentYear),
    maintenanceExposure: vehicle.maintenance_score ?? 50,
    reliabilityPowertrain: reliability,
    age: ageScore(vehicle.year, currentYear),
    trimEquipment: trimScore(vehicle.trim),
    dealerListingQuality: dealerQualityScore(listing?.photo_count),
  });

  await env.DB.prepare("UPDATE vehicles SET opportunity_score = ? WHERE vin = ?")
    .bind(result.eligible ? result.score : null, vin)
    .run();
}
