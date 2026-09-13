import { describe, expect, it } from "vitest";
import { HistoryStatus } from "@vinscout/domain";
import { evaluateHistory, type HistoryDecision } from "./historyGate";

const clean = {
  accidentReported: false,
  damageReported: false,
  structuralDamage: false,
  airbagDeployment: false,
  totalLoss: false,
  salvageTitle: false,
  rebuiltTitle: false,
  floodDamage: false,
  lemonBuyback: false,
  odometerProblem: false,
  historyStatus: HistoryStatus.CLEAN_REPORTED,
};

describe("evaluateHistory", () => {
  it("passes a vehicle with no red flags and verified history", () => {
    const decision: HistoryDecision = evaluateHistory(clean);
    expect(decision.eligible).toBe(true);
    expect(decision.status).toBe(HistoryStatus.CLEAN_VERIFIED);
    expect(decision.reasons).toEqual([]);
  });

  it("rejects a vehicle with unknown history even if no flags are set", () => {
    const decision = evaluateHistory({ ...clean, historyStatus: HistoryStatus.UNKNOWN });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons).toContain("History not verified");
  });

  it("rejects a vehicle with an accident even if priced well under market", () => {
    const decision = evaluateHistory({ ...clean, accidentReported: true });
    expect(decision.eligible).toBe(false);
    expect(decision.status).toBe(HistoryStatus.CLEAN_REPORTED);
    expect(decision.reasons).toEqual(["Reported accident"]);
  });

  it("collects every applicable reason, not just the first", () => {
    const decision = evaluateHistory({
      ...clean,
      salvageTitle: true,
      odometerProblem: true,
    });
    expect(decision.reasons).toEqual(["Salvage title", "Odometer problem"]);
  });
});
