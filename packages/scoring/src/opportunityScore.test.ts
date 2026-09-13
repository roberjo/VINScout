import { describe, expect, it } from "vitest";
import { HistoryStatus } from "@vinscout/domain";
import { scoreOpportunity } from "./opportunityScore";

const perfectFactors = {
  marketPriceAdvantage: 100,
  mileage: 100,
  maintenanceExposure: 100,
  reliabilityPowertrain: 100,
  age: 100,
  trimEquipment: 100,
  dealerListingQuality: 100,
};

describe("scoreOpportunity", () => {
  it("returns null when the vehicle failed the history gate", () => {
    const result = scoreOpportunity(
      { eligible: false, status: HistoryStatus.ACCIDENT, reasons: ["Reported accident"] },
      perfectFactors,
    );
    expect(result.eligible).toBe(false);
    expect(result.score).toBeNull();
  });

  it("scores a perfect vehicle at 100", () => {
    const result = scoreOpportunity(
      { eligible: true, status: HistoryStatus.CLEAN_VERIFIED, reasons: [] },
      perfectFactors,
    );
    expect(result.eligible).toBe(true);
    expect(result.score).toBe(100);
  });

  it("weights market price advantage as the largest factor", () => {
    const weak = { ...perfectFactors, marketPriceAdvantage: 0 };
    const result = scoreOpportunity(
      { eligible: true, status: HistoryStatus.CLEAN_VERIFIED, reasons: [] },
      weak,
    );
    expect(result.score).toBe(70);
  });
});
