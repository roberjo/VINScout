// Spec §8 — History Status. UNKNOWN is deliberately distinct from CLEAN:
// unverified history must never be treated as clean.
export const HistoryStatus = {
  UNKNOWN: "UNKNOWN",
  CLEAN_REPORTED: "CLEAN_REPORTED",
  CLEAN_VERIFIED: "CLEAN_VERIFIED",
  ACCIDENT: "ACCIDENT",
  DAMAGE: "DAMAGE",
  STRUCTURAL_DAMAGE: "STRUCTURAL_DAMAGE",
  TOTAL_LOSS: "TOTAL_LOSS",
  SALVAGE: "SALVAGE",
  REBUILT: "REBUILT",
  FLOOD: "FLOOD",
  LEMON: "LEMON",
  ODOMETER: "ODOMETER",
} as const;

export type HistoryStatus = (typeof HistoryStatus)[keyof typeof HistoryStatus];
