import { TrendLabel } from "@prisma/client";

export interface JourneyDataPoint {
  x: number; // Normalized time/order index (e.g. 1, 2, 3...)
  score: number; // 0.0 - 10.0
  periodId: string;
  periodName: string;
  date?: Date | null;
}

export interface JourneyThresholdParams {
  increasingSlope: number; // e.g. 0.25
  decliningSlope: number; // e.g. 0.25
  volatilityMax: number; // e.g. 1.2
  minPeriodsRequired: number; // e.g. 3
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  volatilityScore: number;
  trendLabel: TrendLabel;
  baselineScore: number;
  currentAvgScore: number;
  deltaFromBaseline: number;
  isInsufficientData: boolean;
  dataPointsCount: number;
  message?: string;
}

export const DEFAULT_JOURNEY_THRESHOLDS: JourneyThresholdParams = {
  increasingSlope: 0.25,
  decliningSlope: 0.25,
  volatilityMax: 1.2,
  minPeriodsRequired: 3,
};

/**
 * Calculates Ordinary Least Squares (OLS) Linear Regression: slope, intercept, and R-squared.
 */
export function calculateOLSRegression(
  points: Array<{ orderIndex: number; score: number }>
): { slope: number; intercept: number; rSquared: number } | null {
  const n = points.length;
  if (n < 2) return null;

  const sumX = points.reduce((acc, p) => acc + p.orderIndex, 0);
  const sumY = points.reduce((acc, p) => acc + p.score, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  let totalSumOfSquares = 0;

  for (const p of points) {
    const dx = p.orderIndex - meanX;
    const dy = p.score - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
    totalSumOfSquares += dy * dy;
  }

  if (denominator === 0) return null;

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  let residualSumOfSquares = 0;
  for (const p of points) {
    const predictedY = intercept + slope * p.orderIndex;
    const residual = p.score - predictedY;
    residualSumOfSquares += residual * residual;
  }

  const rSquared = totalSumOfSquares !== 0
    ? Math.max(0, Math.min(1, 1 - residualSumOfSquares / totalSumOfSquares))
    : 1;

  return { slope, intercept, rSquared };
}

/**
 * Calculates standard deviation of residuals (RMS residual error) from regression line.
 */
export function calculateResidualVolatility(
  points: Array<{ orderIndex: number; score: number }>,
  slope: number,
  intercept: number
): number {
  const n = points.length;
  if (n === 0) return 0;

  let residualSumOfSquares = 0;
  for (const p of points) {
    const predictedY = intercept + slope * p.orderIndex;
    const residual = p.score - predictedY;
    residualSumOfSquares += residual * residual;
  }

  return Math.sqrt(residualSumOfSquares / n);
}

/**
 * Classifies trend based on slope, volatility, and threshold configuration.
 */
export function classifyTrend(
  slope: number,
  volatility: number,
  dataPointsCount: number,
  config: JourneyThresholdParams = DEFAULT_JOURNEY_THRESHOLDS
): TrendLabel | "INSUFFICIENT_DATA" {
  if (dataPointsCount < config.minPeriodsRequired) {
    return "INSUFFICIENT_DATA";
  }

  if (volatility >= config.volatilityMax) {
    return "VOLATILE";
  }

  if (slope >= config.increasingSlope) {
    return "IMPROVING";
  }

  if (slope <= -config.decliningSlope || slope <= config.decliningSlope && config.decliningSlope < 0) {
    return "DECLINING";
  }

  return "STABLE";
}

/**
 * Calculates Simple Ordinary Least Squares Linear Regression and Volatility
 * (Standard deviation of residuals from regression line).
 *
 * Rules:
 * - Only genuine existing data points are used (no zero-interpolation for gaps).
 * - If data points < minPeriodsRequired, returns STABLE + isInsufficientData = true.
 * - Volatility >= volatilityMax => VOLATILE.
 * - Slope > increasingSlope and Volatility < volatilityMax => IMPROVING.
 * - Slope < -decliningSlope and Volatility < volatilityMax => DECLINING.
 * - Otherwise => STABLE.
 */
export function computeJourneyMetrics(
  points: JourneyDataPoint[],
  config: JourneyThresholdParams = DEFAULT_JOURNEY_THRESHOLDS
): RegressionResult {
  const validPoints = points
    .filter((p) => typeof p.score === "number" && !isNaN(p.score) && p.score >= 0 && p.score <= 10)
    .sort((a, b) => a.x - b.x);

  const n = validPoints.length;

  // If no data points at all
  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      r2: 0,
      volatilityScore: 0,
      trendLabel: "STABLE",
      baselineScore: 0,
      currentAvgScore: 0,
      deltaFromBaseline: 0,
      isInsufficientData: true,
      dataPointsCount: 0,
      message: "Chưa có dữ liệu điểm số nào.",
    };
  }

  // Baseline is the average of the first 1-2 periods
  const baselineCount = Math.min(2, n);
  const baselineScore =
    validPoints.slice(0, baselineCount).reduce((acc, p) => acc + p.score, 0) / baselineCount;

  const currentScore = validPoints[n - 1].score;
  const currentAvgScore = validPoints.reduce((acc, p) => acc + p.score, 0) / n;
  const deltaFromBaseline = Math.round((currentScore - baselineScore) * 100) / 100;

  // Insufficient data handling (e.g. fewer than 3 periods)
  if (n < config.minPeriodsRequired) {
    return {
      slope: 0,
      intercept: currentAvgScore,
      r2: 0,
      volatilityScore: 0,
      trendLabel: "STABLE",
      baselineScore: Math.round(baselineScore * 100) / 100,
      currentAvgScore: Math.round(currentAvgScore * 100) / 100,
      deltaFromBaseline,
      isInsufficientData: true,
      dataPointsCount: n,
      message: `Chưa đủ dữ liệu (${n}/${config.minPeriodsRequired} kỳ) để đánh giá xu hướng học tập chính xác.`,
    };
  }

  const olsPoints = validPoints.map((p) => ({ orderIndex: p.x, score: p.score }));
  const ols = calculateOLSRegression(olsPoints);

  if (!ols) {
    return {
      slope: 0,
      intercept: currentAvgScore,
      r2: 0,
      volatilityScore: 0,
      trendLabel: "STABLE",
      baselineScore: Math.round(baselineScore * 100) / 100,
      currentAvgScore: Math.round(currentAvgScore * 100) / 100,
      deltaFromBaseline,
      isInsufficientData: true,
      dataPointsCount: n,
    };
  }

  const { slope, intercept, rSquared } = ols;
  const volatilityScore = calculateResidualVolatility(olsPoints, slope, intercept);

  // Classify Trend Label
  const trend = classifyTrend(slope, volatilityScore, n, config);
  const trendLabel: TrendLabel = trend === "INSUFFICIENT_DATA" ? "STABLE" : trend;

  return {
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 100) / 100,
    r2: Math.round(rSquared * 1000) / 1000,
    volatilityScore: Math.round(volatilityScore * 1000) / 1000,
    trendLabel,
    baselineScore: Math.round(baselineScore * 100) / 100,
    currentAvgScore: Math.round(currentAvgScore * 100) / 100,
    deltaFromBaseline,
    isInsufficientData: false,
    dataPointsCount: n,
  };
}
