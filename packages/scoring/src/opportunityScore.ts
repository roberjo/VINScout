import type { HistoryDecision } from "./historyGate";

// Spec §18 — Opportunity Score. Only history-approved vehicles may receive
// a score; everything else is rejected outright, regardless of price.
export const OPPORTUNITY_WEIGHTS = {
  marketPriceAdvantage: 0.3,
  mileage: 0.2,
  maintenanceExposure: 0.15,
  reliabilityPowertrain: 0.15,
  age: 0.05,
  trimEquipment: 0.1,
  dealerListingQuality: 0.05,
} as const;

export interface OpportunityFactors {
  /** Each factor is a 0-100 sub-score; higher is always better. */
  marketPriceAdvantage: number;
  mileage: number;
  maintenanceExposure: number;
  reliabilityPowertrain: number;
  age: number;
  trimEquipment: number;
  dealerListingQuality: number;
}

export type OpportunityScoreResult =
  | { eligible: true; score: number }
  | { eligible: false; score: null; reasons: string[] };

export function scoreOpportunity(
  history: HistoryDecision,
  factors: OpportunityFactors,
): OpportunityScoreResult {
  if (!history.eligible) {
    return { eligible: false, score: null, reasons: history.reasons };
  }

  const score = (Object.keys(OPPORTUNITY_WEIGHTS) as Array<keyof OpportunityFactors>).reduce(
    (total, key) => total + factors[key] * OPPORTUNITY_WEIGHTS[key],
    0,
  );

  return { eligible: true, score: Math.round(score * 100) / 100 };
}
