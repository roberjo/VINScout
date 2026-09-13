import type { HistoryStatus } from "./historyStatus";

export type VehicleStatus = "ACTIVE" | "SOLD" | "REMOVED" | "REJECTED";

// Spec §7 — Domain Model.
export interface Vehicle {
  vin: string;

  year: number;
  make: string;
  model: string;
  trim?: string;

  engine?: string;
  transmission?: string;
  drivetrain?: "FWD" | "RWD" | "AWD" | "4WD" | "UNKNOWN";

  mileage: number;

  firstSeenAt: string;
  lastSeenAt: string;

  historyStatus: HistoryStatus;

  accidentReported: boolean;
  damageReported: boolean;
  structuralDamage: boolean;
  airbagDeployment: boolean;
  totalLoss: boolean;
  salvageTitle: boolean;
  rebuiltTitle: boolean;
  floodDamage: boolean;
  lemonBuyback: boolean;
  odometerProblem: boolean;

  ownerCount?: number;

  valueScore?: number;
  maintenanceScore?: number;
  opportunityScore?: number;

  status: VehicleStatus;
}
