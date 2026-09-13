import { HistoryStatus, type Vehicle } from "@vinscout/domain";

// Spec §9 — History Gate. A pure function: a vehicle with unacceptable or
// unverified history must never reach the value/maintenance/opportunity
// scoring stages. UNKNOWN history is treated as a failure, not as clean.
export interface HistoryDecision {
  eligible: boolean;
  status: HistoryStatus;
  reasons: string[];
}

type HistoryGateInput = Pick<
  Vehicle,
  | "accidentReported"
  | "damageReported"
  | "structuralDamage"
  | "airbagDeployment"
  | "totalLoss"
  | "salvageTitle"
  | "rebuiltTitle"
  | "floodDamage"
  | "lemonBuyback"
  | "odometerProblem"
  | "historyStatus"
>;

export function evaluateHistory(vehicle: HistoryGateInput): HistoryDecision {
  const reasons: string[] = [];

  if (vehicle.accidentReported) reasons.push("Reported accident");
  if (vehicle.damageReported) reasons.push("Reported damage");
  if (vehicle.structuralDamage) reasons.push("Structural damage");
  if (vehicle.airbagDeployment) reasons.push("Airbag deployment");
  if (vehicle.totalLoss) reasons.push("Total loss");
  if (vehicle.salvageTitle) reasons.push("Salvage title");
  if (vehicle.rebuiltTitle) reasons.push("Rebuilt title");
  if (vehicle.floodDamage) reasons.push("Flood damage");
  if (vehicle.lemonBuyback) reasons.push("Manufacturer buyback");
  if (vehicle.odometerProblem) reasons.push("Odometer problem");

  if (vehicle.historyStatus === HistoryStatus.UNKNOWN) {
    reasons.push("History not verified");
  }

  return {
    eligible: reasons.length === 0,
    status: reasons.length === 0 ? HistoryStatus.CLEAN_VERIFIED : vehicle.historyStatus,
    reasons,
  };
}
