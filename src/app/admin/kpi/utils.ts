import { MeasurementDirection } from "@prisma/client";

// Calculate KPI completion rate & weighted score helper
export function calculateKpiScore(
  actual: number,
  target: number,
  weight: number,
  direction: MeasurementDirection
): { completionRate: number; weightedScore: number } {
  let rate = 0;

  if (direction === MeasurementDirection.HIGHER_BETTER) {
    if (target === 0) {
      rate = actual > 0 ? 100 : 0;
    } else {
      rate = (actual / target) * 100;
    }
  } else if (direction === MeasurementDirection.LOWER_BETTER) {
    if (actual === 0) {
      rate = 100;
    } else {
      rate = (target / actual) * 100;
    }
  } else if (direction === MeasurementDirection.PASS_FAIL) {
    rate = actual >= 1 ? 100 : 0;
  }

  // Cap completion rate to reasonable bounds (0 to 200%)
  rate = Math.max(0, Math.min(200, rate));
  const weightedScore = (rate * weight) / 100;

  return {
    completionRate: Number(rate.toFixed(2)),
    weightedScore: Number(weightedScore.toFixed(2)),
  };
}
