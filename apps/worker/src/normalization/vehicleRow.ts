import type { Vehicle } from "@vinscout/domain";

// Shape of a row from the `vehicles` table (see migrations/0001_initial.sql).
// D1 stores booleans as INTEGER 0/1 and has no native boolean type.
export interface VehicleRow {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  mileage: number;
  first_seen_at: string;
  last_seen_at: string;
  history_status: string;
  accident_reported: number;
  damage_reported: number;
  structural_damage: number;
  airbag_deployment: number;
  total_loss: number;
  salvage_title: number;
  rebuilt_title: number;
  flood_damage: number;
  lemon_buyback: number;
  odometer_problem: number;
  owner_count: number | null;
  value_score: number | null;
  maintenance_score: number | null;
  opportunity_score: number | null;
  status: string;
}

export function vehicleRowToDomain(row: VehicleRow): Vehicle {
  return {
    vin: row.vin,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim ?? undefined,
    engine: row.engine ?? undefined,
    transmission: row.transmission ?? undefined,
    drivetrain: (row.drivetrain as Vehicle["drivetrain"]) ?? undefined,
    mileage: row.mileage,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    historyStatus: row.history_status as Vehicle["historyStatus"],
    accidentReported: Boolean(row.accident_reported),
    damageReported: Boolean(row.damage_reported),
    structuralDamage: Boolean(row.structural_damage),
    airbagDeployment: Boolean(row.airbag_deployment),
    totalLoss: Boolean(row.total_loss),
    salvageTitle: Boolean(row.salvage_title),
    rebuiltTitle: Boolean(row.rebuilt_title),
    floodDamage: Boolean(row.flood_damage),
    lemonBuyback: Boolean(row.lemon_buyback),
    odometerProblem: Boolean(row.odometer_problem),
    ownerCount: row.owner_count ?? undefined,
    valueScore: row.value_score ?? undefined,
    maintenanceScore: row.maintenance_score ?? undefined,
    opportunityScore: row.opportunity_score ?? undefined,
    status: row.status as Vehicle["status"],
  };
}
