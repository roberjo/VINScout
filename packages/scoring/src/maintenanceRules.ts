import type { MaintenanceDueness, MaintenanceRisk, MaintenanceRule, MaintenanceSeverity } from "@vinscout/domain";

// Spec §20 — Model-Specific Maintenance Rules. Intentionally small and
// conservative: a couple of generic wear items every vehicle has (brakes,
// tires — condition-dependent, not on a fixed schedule, so the spec's own
// example lists these as "unknown" dueness regardless of mileage) plus one
// well-documented model-specific rule. This is a starting reference set to
// expand carefully against real manufacturer service schedules, not an
// authoritative maintenance database — do not add a specific claim here
// without being confident it's actually correct for that make/model/year.
export const DEFAULT_MAINTENANCE_RULES: MaintenanceRule[] = [
  {
    make: "*",
    model: "*",
    description: "Brake pads/rotors — wear depends on driving style, not purely mileage",
    estimatedCostLow: 300,
    estimatedCostHigh: 800,
    severity: "LOW",
  },
  {
    make: "*",
    model: "*",
    description: "Tires — wear depends on driving style and road conditions, not purely mileage",
    estimatedCostLow: 600,
    estimatedCostHigh: 1200,
    severity: "LOW",
  },
  {
    make: "Honda",
    model: "Pilot",
    yearMin: 2009,
    yearMax: 2015,
    mileageThreshold: 105000,
    description: "Timing belt (2nd-gen 3.5L V6) — manufacturer interval ~105k mi; missing it risks engine damage",
    estimatedCostLow: 600,
    estimatedCostHigh: 1000,
    severity: "HIGH",
  },
];

export interface MaintenanceTarget {
  make: string;
  model: string;
  year: number;
  mileage: number;
}

// A schedule-based item (has a mileageThreshold) is "coming up" once mileage
// reaches 75% of the threshold, "likely due" past 90%, "known due" once past
// it entirely. Below 75%, it's not worth surfacing yet.
const LIKELY_DUE_RATIO = 0.9;
const POSSIBLE_DUE_RATIO = 0.75;

function classifyScheduledDueness(mileage: number, threshold: number): MaintenanceDueness | null {
  if (mileage >= threshold) return "KNOWN_DUE";
  if (mileage >= threshold * LIKELY_DUE_RATIO) return "LIKELY_DUE";
  if (mileage >= threshold * POSSIBLE_DUE_RATIO) return "POSSIBLE_DUE";
  return null;
}

function ruleApplies(rule: MaintenanceRule, target: MaintenanceTarget): boolean {
  const makeMatches = rule.make === "*" || rule.make.toLowerCase() === target.make.toLowerCase();
  const modelMatches = rule.model === "*" || rule.model.toLowerCase() === target.model.toLowerCase();
  if (!makeMatches || !modelMatches) return false;
  if (rule.yearMin != null && target.year < rule.yearMin) return false;
  if (rule.yearMax != null && target.year > rule.yearMax) return false;
  return true;
}

const SEVERITY_PENALTY: Record<MaintenanceSeverity, number> = { LOW: 10, MEDIUM: 20, HIGH: 30 };
const DUENESS_WEIGHT: Record<MaintenanceDueness, number> = {
  KNOWN_DUE: 1,
  LIKELY_DUE: 0.6,
  POSSIBLE_DUE: 0.3,
  // A wear item we genuinely can't schedule (brakes/tires) still carries some
  // uncertainty penalty — it could need replacement at any mileage — but far
  // less than a known-overdue scheduled item.
  UNKNOWN: 0.2,
};

// Spec §19 — Maintenance Engine. Estimates upcoming exposure from generic
// mileage-based rules; never invents actual service history (spec has none
// to invent from — no VIN-specific maintenance records exist yet), which is
// why confidence is always LOW. `rules` defaults to the built-in set but is
// injectable for testing.
export function evaluateMaintenanceRisk(target: MaintenanceTarget, rules: MaintenanceRule[] = DEFAULT_MAINTENANCE_RULES): MaintenanceRisk {
  const upcomingItems: MaintenanceRisk["upcomingItems"] = [];
  let penalty = 0;
  let nearTermLow = 0;
  let nearTermHigh = 0;

  for (const rule of rules) {
    if (!ruleApplies(rule, target)) continue;

    let dueness: MaintenanceDueness;
    if (rule.mileageThreshold == null) {
      dueness = "UNKNOWN";
    } else {
      const classified = classifyScheduledDueness(target.mileage, rule.mileageThreshold);
      if (!classified) continue; // too far from the threshold to be worth surfacing yet
      dueness = classified;
    }

    upcomingItems.push({
      description: rule.description,
      dueness,
      estimatedCostLow: rule.estimatedCostLow,
      estimatedCostHigh: rule.estimatedCostHigh,
      severity: rule.severity,
    });

    penalty += SEVERITY_PENALTY[rule.severity] * DUENESS_WEIGHT[dueness];
    nearTermLow += rule.estimatedCostLow;
    nearTermHigh += rule.estimatedCostHigh;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(100 - penalty))),
    upcomingItems,
    estimatedNearTermCost: Math.round((nearTermLow + nearTermHigh) / 2),
    confidence: "LOW",
  };
}
