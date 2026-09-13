import { evaluateMaintenanceRisk } from "@vinscout/scoring";
import type { Env } from "../env";

interface TargetRow {
  make: string;
  model: string;
  year: number;
  mileage: number;
}

// Spec §19-20 — Maintenance Engine. Runs the generic mileage-based rule set
// against a vehicle and stores the resulting 0-100 sub-score on
// vehicles.maintenance_score. No-ops when the vehicle isn't known.
export async function computeMaintenanceRisk(env: Env, vin: string): Promise<void> {
  const target = await env.DB.prepare("SELECT make, model, year, mileage FROM vehicles WHERE vin = ?")
    .bind(vin)
    .first<TargetRow>();
  if (!target) return;

  const risk = evaluateMaintenanceRisk(target);

  await env.DB.prepare("UPDATE vehicles SET maintenance_score = ? WHERE vin = ?").bind(risk.score, vin).run();
}
