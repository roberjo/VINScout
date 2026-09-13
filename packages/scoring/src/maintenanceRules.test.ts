import { describe, expect, it } from "vitest";
import type { MaintenanceRule } from "@vinscout/domain";
import { DEFAULT_MAINTENANCE_RULES, evaluateMaintenanceRisk } from "./maintenanceRules";

describe("evaluateMaintenanceRisk", () => {
  it("always includes the generic wear items as UNKNOWN dueness, regardless of mileage", () => {
    const result = evaluateMaintenanceRisk({ make: "Toyota", model: "Highlander", year: 2019, mileage: 96000 });
    const descriptions = result.upcomingItems.map((i) => i.description);
    expect(descriptions).toEqual(
      expect.arrayContaining([expect.stringContaining("Brake"), expect.stringContaining("Tire")]),
    );
    for (const item of result.upcomingItems) {
      expect(item.dueness).toBe("UNKNOWN");
    }
  });

  it("never invents a schedule-based item for a make/model with no matching rule", () => {
    const result = evaluateMaintenanceRisk({ make: "Toyota", model: "Highlander", year: 2019, mileage: 96000 });
    // Only the two generic wear items — no Toyota-specific rule exists.
    expect(result.upcomingItems).toHaveLength(2);
  });

  it("confidence is always LOW — no vehicle-specific service records exist", () => {
    const result = evaluateMaintenanceRisk({ make: "Toyota", model: "Highlander", year: 2019, mileage: 96000 });
    expect(result.confidence).toBe("LOW");
  });

  describe("Honda Pilot timing belt rule (2009-2015, 105k mi)", () => {
    it("is excluded when mileage is well below the threshold", () => {
      const result = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2012, mileage: 50000 });
      expect(result.upcomingItems.some((i) => i.description.includes("Timing belt"))).toBe(false);
    });

    it("is LIKELY_DUE approaching the threshold", () => {
      const result = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2012, mileage: 96000 });
      const item = result.upcomingItems.find((i) => i.description.includes("Timing belt"));
      expect(item?.dueness).toBe("LIKELY_DUE");
    });

    it("is KNOWN_DUE once mileage passes the threshold", () => {
      const result = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2012, mileage: 110000 });
      const item = result.upcomingItems.find((i) => i.description.includes("Timing belt"));
      expect(item?.dueness).toBe("KNOWN_DUE");
    });

    it("does not apply to a 3rd-gen Pilot outside the rule's year range", () => {
      const result = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2018, mileage: 110000 });
      expect(result.upcomingItems.some((i) => i.description.includes("Timing belt"))).toBe(false);
    });

    it("does not apply to a different make/model even past the same mileage", () => {
      const result = evaluateMaintenanceRisk({ make: "Toyota", model: "Highlander", year: 2012, mileage: 110000 });
      expect(result.upcomingItems.some((i) => i.description.includes("Timing belt"))).toBe(false);
    });
  });

  it("scores a KNOWN_DUE HIGH-severity item lower than an UNKNOWN LOW-severity-only vehicle", () => {
    const clean = evaluateMaintenanceRisk({ make: "Toyota", model: "Highlander", year: 2019, mileage: 96000 });
    const overdueTimingBelt = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2012, mileage: 120000 });
    expect(overdueTimingBelt.score).toBeLessThan(clean.score);
  });

  it("clamps score to [0, 100] even with many stacked high-severity rules", () => {
    const manyHighSeverityRules: MaintenanceRule[] = Array.from({ length: 10 }, (_, i) => ({
      make: "Test",
      model: "Car",
      mileageThreshold: 10000,
      description: `Rule ${i}`,
      estimatedCostLow: 500,
      estimatedCostHigh: 1000,
      severity: "HIGH",
    }));
    const result = evaluateMaintenanceRisk({ make: "Test", model: "Car", year: 2020, mileage: 50000 }, manyHighSeverityRules);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("uses the built-in default rule set when none is passed", () => {
    const result = evaluateMaintenanceRisk({ make: "Honda", model: "Pilot", year: 2012, mileage: 110000 });
    expect(DEFAULT_MAINTENANCE_RULES.some((r) => r.model === "Pilot")).toBe(true);
    expect(result.upcomingItems.some((i) => i.description.includes("Timing belt"))).toBe(true);
  });
});
