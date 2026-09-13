import { HistoryStatus } from "@vinscout/domain";
import { evaluateHistory, type HistoryDecision } from "@vinscout/scoring";
import type { HistoryVerificationInput } from "@vinscout/validation";
import type { Env } from "../env";

export interface VerifyHistoryResult {
  decision: HistoryDecision;
}

// Applies a human's manual review (spec §9-10) to a vehicle: re-runs the
// pure history gate against the submitted flags and persists the outcome.
// Returns null if the VIN isn't known yet (nothing to verify).
export async function applyHistoryVerification(
  env: Env,
  vin: string,
  input: HistoryVerificationInput,
): Promise<VerifyHistoryResult | null> {
  const vehicle = await env.DB.prepare("SELECT vin FROM vehicles WHERE vin = ?").bind(vin).first<{ vin: string }>();
  if (!vehicle) return null;

  const decision = evaluateHistory({
    accidentReported: input.accidentReported,
    damageReported: input.damageReported,
    structuralDamage: input.structuralDamage,
    airbagDeployment: input.airbagDeployment,
    totalLoss: input.totalLoss,
    salvageTitle: input.salvageTitle,
    rebuiltTitle: input.rebuiltTitle,
    floodDamage: input.floodDamage,
    lemonBuyback: input.lemonBuyback,
    odometerProblem: input.odometerProblem,
    // A human read a report to submit this, so history is no longer
    // UNKNOWN even when it turns out not to be clean.
    historyStatus: HistoryStatus.CLEAN_REPORTED,
  });

  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE vehicles SET
       accident_reported = ?, damage_reported = ?, structural_damage = ?, airbag_deployment = ?,
       total_loss = ?, salvage_title = ?, rebuilt_title = ?, flood_damage = ?, lemon_buyback = ?,
       odometer_problem = ?, owner_count = ?, history_status = ?, status = ?
     WHERE vin = ?`,
  )
    .bind(
      input.accidentReported ? 1 : 0,
      input.damageReported ? 1 : 0,
      input.structuralDamage ? 1 : 0,
      input.airbagDeployment ? 1 : 0,
      input.totalLoss ? 1 : 0,
      input.salvageTitle ? 1 : 0,
      input.rebuiltTitle ? 1 : 0,
      input.floodDamage ? 1 : 0,
      input.lemonBuyback ? 1 : 0,
      input.odometerProblem ? 1 : 0,
      input.ownerCount ?? null,
      decision.status,
      decision.eligible ? "ACTIVE" : "REJECTED",
      vin,
    )
    .run();

  await env.DB.prepare(
    `INSERT INTO history_evidence (vin, provider, event_type, description, retrieved_at)
     VALUES (?, 'manual', 'MANUAL_REVIEW', ?, ?)`,
  )
    .bind(vin, input.notes ?? (decision.eligible ? "Manually verified clean" : decision.reasons.join("; ")), now)
    .run();

  if (!decision.eligible) {
    await env.DB.prepare(
      `INSERT INTO rejection_events (vin, rejection_type, reason, source, created_at)
       VALUES (?, 'HISTORY_GATE', ?, 'manual-review', ?)`,
    )
      .bind(vin, decision.reasons.join("; "), now)
      .run();
  }

  return { decision };
}
