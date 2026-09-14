import type { MarketComparison } from "@vinscout/domain";

export type HighlightTone = "good" | "warning";

export interface ReviewHighlight {
  label: string;
  tone: HighlightTone;
}

export interface ReviewHighlightInputs {
  marketComparison: MarketComparison | null;
  mileageScoreValue: number;
  trimScoreValue: number;
  reliabilityScoreValue: number | null;
  maintenanceScoreValue: number | null;
}

const PRICE_STRONG_BELOW_PERCENT = -10;
const PRICE_ABOVE_PERCENT = 10;
const MILEAGE_STRONG = 70;
const MILEAGE_WEAK = 30;
const TRIM_STRONG = 80;
const RELIABILITY_STRONG = 80;
const RELIABILITY_WEAK = 40;
const MAINTENANCE_WEAK = 40;

// Pre-history-review signals for the manual review queue (spec's "why is
// this worth my time to review" question) — deliberately separate from
// scoreOpportunity, which only ever runs after history is verified (spec
// §2's "history before value" principle). These are plain factual
// observations about price/mileage/trim/reliability/maintenance exposure;
// none of them say anything about the vehicle's accident/title history, so
// showing them for an UNKNOWN-history vehicle doesn't imply it's been
// cleared. Thresholds are the same first-pass heuristics as the rest of
// this package, not derived from data.
export function computeReviewHighlights(input: ReviewHighlightInputs): ReviewHighlight[] {
  const highlights: ReviewHighlight[] = [];

  if (input.marketComparison) {
    const pct = input.marketComparison.priceDifferencePercent;
    if (pct <= PRICE_STRONG_BELOW_PERCENT) {
      highlights.push({ label: `${Math.abs(pct).toFixed(0)}% below market average`, tone: "good" });
    } else if (pct >= PRICE_ABOVE_PERCENT) {
      highlights.push({ label: `${pct.toFixed(0)}% above market average`, tone: "warning" });
    }
  }

  if (input.mileageScoreValue >= MILEAGE_STRONG) {
    highlights.push({ label: "Low mileage for its age", tone: "good" });
  } else if (input.mileageScoreValue <= MILEAGE_WEAK) {
    highlights.push({ label: "High mileage for its age", tone: "warning" });
  }

  if (input.trimScoreValue >= TRIM_STRONG) {
    highlights.push({ label: "Well-equipped trim", tone: "good" });
  }

  if (input.reliabilityScoreValue != null) {
    if (input.reliabilityScoreValue >= RELIABILITY_STRONG) {
      highlights.push({ label: "Clean recall history", tone: "good" });
    } else if (input.reliabilityScoreValue <= RELIABILITY_WEAK) {
      highlights.push({ label: "Notable recall history", tone: "warning" });
    }
  }

  if (input.maintenanceScoreValue != null && input.maintenanceScoreValue <= MAINTENANCE_WEAK) {
    highlights.push({ label: "Maintenance likely due soon", tone: "warning" });
  }

  return highlights;
}
