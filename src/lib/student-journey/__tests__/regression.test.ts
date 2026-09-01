import { describe, it, expect } from "vitest";
import {
  calculateOLSRegression,
  calculateResidualVolatility,
  classifyTrend,
  computeJourneyMetrics,
} from "../regression";

describe("Student Journey Regression Engine (OLS & Volatility)", () => {
  describe("calculateOLSRegression", () => {
    it("should return null for less than 2 data points", () => {
      expect(calculateOLSRegression([])).toBeNull();
      expect(calculateOLSRegression([{ orderIndex: 1, score: 8.0 }])).toBeNull();
    });

    it("should accurately compute linear slope and intercept for a straight ascending line", () => {
      // y = 1.0 * x + 5.0
      // Points: (1, 6), (2, 7), (3, 8), (4, 9)
      const points = [
        { orderIndex: 1, score: 6.0 },
        { orderIndex: 2, score: 7.0 },
        { orderIndex: 3, score: 8.0 },
        { orderIndex: 4, score: 9.0 },
      ];

      const res = calculateOLSRegression(points);
      expect(res).not.toBeNull();
      expect(res!.slope).toBeCloseTo(1.0, 4);
      expect(res!.intercept).toBeCloseTo(5.0, 4);
      expect(res!.rSquared).toBeCloseTo(1.0, 4);
    });

    it("should accurately compute linear slope for a descending score trajectory", () => {
      // Points: (1, 9.0), (2, 8.0), (3, 7.0), (4, 6.0)
      const points = [
        { orderIndex: 1, score: 9.0 },
        { orderIndex: 2, score: 8.0 },
        { orderIndex: 3, score: 7.0 },
        { orderIndex: 4, score: 6.0 },
      ];

      const res = calculateOLSRegression(points);
      expect(res).not.toBeNull();
      expect(res!.slope).toBeCloseTo(-1.0, 4);
      expect(res!.intercept).toBeCloseTo(10.0, 4);
      expect(res!.rSquared).toBeCloseTo(1.0, 4);
    });

    it("should return slope = 0 for perfectly flat performance", () => {
      const points = [
        { orderIndex: 1, score: 7.5 },
        { orderIndex: 2, score: 7.5 },
        { orderIndex: 3, score: 7.5 },
      ];

      const res = calculateOLSRegression(points);
      expect(res).not.toBeNull();
      expect(res!.slope).toBeCloseTo(0, 4);
      expect(res!.intercept).toBeCloseTo(7.5, 4);
      expect(res!.rSquared).toBeCloseTo(1.0, 4);
    });

    it("should handle identical orderIndex safely without dividing by zero", () => {
      const points = [
        { orderIndex: 2, score: 6.0 },
        { orderIndex: 2, score: 8.0 },
      ];

      const res = calculateOLSRegression(points);
      expect(res).toBeNull();
    });
  });

  describe("calculateResidualVolatility", () => {
    it("should return 0 when points fit regression line perfectly", () => {
      const points = [
        { orderIndex: 1, score: 5.0 },
        { orderIndex: 2, score: 6.0 },
        { orderIndex: 3, score: 7.0 },
      ];
      const volatility = calculateResidualVolatility(points, 1.0, 4.0);
      expect(volatility).toBeCloseTo(0, 4);
    });

    it("should calculate positive standard error of residuals for fluctuating points", () => {
      // Line: y = 0 * x + 7.0
      // Points: (1, 5.0), (2, 9.0), (3, 5.0), (4, 9.0)
      // Residuals: -2, +2, -2, +2 -> Residual^2: 4, 4, 4, 4 -> Mean: 4 -> sqrt(4) = 2.0
      const points = [
        { orderIndex: 1, score: 5.0 },
        { orderIndex: 2, score: 9.0 },
        { orderIndex: 3, score: 5.0 },
        { orderIndex: 4, score: 9.0 },
      ];
      const volatility = calculateResidualVolatility(points, 0.0, 7.0);
      expect(volatility).toBeCloseTo(2.0, 4);
    });
  });

  describe("classifyTrend", () => {
    const customConfig = {
      increasingSlope: 0.3,
      decliningSlope: 0.3,
      volatilityMax: 1.0,
      minPeriodsRequired: 3,
    };

    it("returns INSUFFICIENT_DATA when count < minPeriodsRequired", () => {
      const label = classifyTrend(0.5, 0.2, 2, customConfig);
      expect(label).toBe("INSUFFICIENT_DATA");
    });

    it("returns VOLATILE when volatility exceeds volatilityMax threshold", () => {
      const label = classifyTrend(0.4, 1.5, 4, customConfig);
      expect(label).toBe("VOLATILE");
    });

    it("returns IMPROVING when slope >= increasingSlope and volatility is acceptable", () => {
      const label = classifyTrend(0.45, 0.3, 4, customConfig);
      expect(label).toBe("IMPROVING");
    });

    it("returns DECLINING when slope <= decliningSlope and volatility is acceptable", () => {
      const label = classifyTrend(-0.5, 0.4, 4, customConfig);
      expect(label).toBe("DECLINING");
    });

    it("returns STABLE when slope is between decliningSlope and increasingSlope and volatility is low", () => {
      const label = classifyTrend(0.1, 0.2, 4, customConfig);
      expect(label).toBe("STABLE");
    });
  });

  describe("computeJourneyMetrics (Full Integration)", () => {
    it("should compute full statistics package and baseline delta correctly", () => {
      const points = [
        { x: 1, score: 6.0, periodId: "p1", periodName: "Kỳ 1" },
        { x: 2, score: 7.0, periodId: "p2", periodName: "Kỳ 2" },
        { x: 3, score: 8.0, periodId: "p3", periodName: "Kỳ 3" },
        { x: 4, score: 8.5, periodId: "p4", periodName: "Kỳ 4" },
      ];

      const result = computeJourneyMetrics(points);
      expect(result.dataPointsCount).toBe(4);
      expect(result.slope).toBeGreaterThan(0.7);
      expect(result.trendLabel).toBe("IMPROVING");
      expect(result.isInsufficientData).toBe(false);
      expect(result.deltaFromBaseline).toBeCloseTo(2.0, 1); // Baseline is avg(6,7) = 6.5 -> 8.5 - 6.5 = 2.0
    });

    it("should return isInsufficientData = true and STABLE trend for insufficient records", () => {
      const points = [
        { x: 1, score: 8.0, periodId: "p1", periodName: "Kỳ 1" },
        { x: 2, score: 8.5, periodId: "p2", periodName: "Kỳ 2" },
      ];

      const result = computeJourneyMetrics(points);
      expect(result.dataPointsCount).toBe(2);
      expect(result.isInsufficientData).toBe(true);
      expect(result.trendLabel).toBe("STABLE");
      expect(result.slope).toBe(0);
    });
  });
});
