import {
  ageScore,
  dealerQualityScore,
  mileageScore,
  scoreOpportunity,
  trimScore,
  OPPORTUNITY_WEIGHTS,
  type HistoryDecision,
  type OpportunityFactors,
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

const FACTOR_LABELS: Record<keyof OpportunityFactors, string> = {
  marketPriceAdvantage: "Market price advantage",
  mileage: "Mileage",
  maintenanceExposure: "Maintenance exposure",
  reliabilityPowertrain: "Reliability/powertrain",
  age: "Age",
  trimEquipment: "Trim/equipment",
  dealerListingQuality: "Dealer/listing quality",
};

export interface ScoreBreakdownEntry {
  factor: string;
  label: string;
  score: number;
  weight: number;
  contribution: number;
}

// Spec §18 — Opportunity Score. Assembles all 7 factors, writes the result
// to vehicles.opportunity_score, and persists a labeled breakdown
// (score_breakdown_json) so the dashboard can explain *why* a vehicle
// scored the way it did instead of showing a bare number. `history` is the
// decision the caller already computed (this only ever runs for an
// eligible vehicle, but scoreOpportunity still takes it as the enforcement
// point). Missing value_score/maintenance_score (e.g. no market
// comparables yet) default to a neutral 50 rather than blocking the score.
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

  const factors: OpportunityFactors = {
    marketPriceAdvantage: vehicle.value_score ?? 50,
    mileage: mileageScore(vehicle.mileage, vehicle.year, currentYear),
    maintenanceExposure: vehicle.maintenance_score ?? 50,
    reliabilityPowertrain: reliability,
    age: ageScore(vehicle.year, currentYear),
    trimEquipment: trimScore(vehicle.trim),
    dealerListingQuality: dealerQualityScore(listing?.photo_count),
  };

  const result = scoreOpportunity(history, factors);

  const breakdown: ScoreBreakdownEntry[] = (Object.keys(factors) as Array<keyof OpportunityFactors>).map((key) => ({
    factor: key,
    label: FACTOR_LABELS[key],
    score: factors[key],
    weight: OPPORTUNITY_WEIGHTS[key],
    contribution: Math.round(factors[key] * OPPORTUNITY_WEIGHTS[key] * 100) / 100,
  }));

  await env.DB.prepare("UPDATE vehicles SET opportunity_score = ?, score_breakdown_json = ? WHERE vin = ?")
    .bind(result.eligible ? result.score : null, JSON.stringify(breakdown), vin)
    .run();
}
