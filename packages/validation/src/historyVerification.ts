import { z } from "zod";

// Submitted by a human after reading a report (Carfax/AutoCheck link, NICB
// VINCheck, etc.) themselves — see docs/history-gate.md for why this is a
// manual step rather than an automated fetch.
export const historyVerificationSchema = z.object({
  accidentReported: z.boolean(),
  damageReported: z.boolean(),
  structuralDamage: z.boolean(),
  airbagDeployment: z.boolean(),
  totalLoss: z.boolean(),
  salvageTitle: z.boolean(),
  rebuiltTitle: z.boolean(),
  floodDamage: z.boolean(),
  lemonBuyback: z.boolean(),
  odometerProblem: z.boolean(),
  ownerCount: z.number().int().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export type HistoryVerificationInput = z.infer<typeof historyVerificationSchema>;
