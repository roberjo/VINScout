import type { Vehicle } from "@vinscout/domain";

export interface HistoryReportLink {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

export interface ReviewQueueItem extends Vehicle {
  historyReportLinks: HistoryReportLink[];
  price: number | null;
  listingUrl: string | null;
  imageUrl: string | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
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
