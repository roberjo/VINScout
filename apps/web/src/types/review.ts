import type { Vehicle } from "@vinscout/domain";
import type { MarketComparison } from "./vehicle";

export interface HistoryReportLink {
  provider: string;
  source_url: string;
  retrieved_at: string;
}

export interface ReviewHighlight {
  label: string;
  tone: "good" | "warning";
}

export interface ReviewQueueItem extends Vehicle {
  historyReportLinks: HistoryReportLink[];
  price: number | null;
  listingUrl: string | null;
  imageUrl: string | null;
  dealerName: string | null;
  dealerCity: string | null;
  dealerState: string | null;
  marketComparison: MarketComparison | null;
  highlights: ReviewHighlight[];
}

// Whitelisted server-side too (apps/worker/src/api/reviewQueue.ts's
// SORTABLE_COLUMNS) — keep this list in sync with that one. No
// opportunityScore here — nothing in this queue has one yet (spec §2's
// history-before-value gate).
export type ReviewSortColumn = "firstSeenAt" | "price" | "mileage" | "year";

export interface ReviewSort {
  sortBy: ReviewSortColumn;
  sortDir: "asc" | "desc";
}

export interface PagedReviewQueue {
  items: ReviewQueueItem[];
  total: number;
  limit: number;
  offset: number;
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
