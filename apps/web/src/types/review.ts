import type { Vehicle } from "@vinscout/domain";

export interface HistoryReportLink {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

export interface ReviewQueueItem extends Vehicle {
  historyReportLinks: HistoryReportLink[];
}

export interface HistoryVerificationInput {
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
  notes?: string;
}
