// Spec §19-20 — Maintenance Engine. Distinguishes known/likely/possible/unknown
// due items rather than inventing service history.
export type MaintenanceConfidence = "HIGH" | "MEDIUM" | "LOW";
export type MaintenanceSeverity = "LOW" | "MEDIUM" | "HIGH";
export type MaintenanceDueness = "KNOWN_DUE" | "LIKELY_DUE" | "POSSIBLE_DUE" | "UNKNOWN";

export interface MaintenanceItem {
  description: string;
  dueness: MaintenanceDueness;
  estimatedCostLow: number;
  estimatedCostHigh: number;
  severity: MaintenanceSeverity;
}

export interface MaintenanceRisk {
  score: number;
  upcomingItems: MaintenanceItem[];
  estimatedNearTermCost: number;
  confidence: MaintenanceConfidence;
}

export interface MaintenanceRule {
  make: string;
  model: string;

  yearMin?: number;
  yearMax?: number;

  mileageThreshold?: number;

  description: string;

  estimatedCostLow: number;
  estimatedCostHigh: number;

  severity: MaintenanceSeverity;
}
