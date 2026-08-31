import {
  IAiAnalysisEngine,
  AggregatedSchoolSnapshot,
  RealtimeMonitoringResult,
  SubstituteRecommendationResult,
  EquipmentTransferAdviceResult,
  EquipmentCategory,
  DecisionSupportResult,
  PlanKpiProgressResult,
  OfficialDocumentAnalysisResult,
  PeriodicReportResult,
  EarlyWarningRadarResult,
  ParentFeedbackSynthesisResult,
  AnnouncementDraftResult,
} from "./types";

import { evaluateRealtimeStatus } from "./task-evaluators/realtime-monitor";
import {
  evaluateSubstituteRecommendation,
  evaluateEquipmentTransferAdvice,
} from "./task-evaluators/coordination-dispatch";
import { evaluateDecisionSupport } from "./task-evaluators/decision-support";
import { evaluatePlanAndKpiProgress } from "./task-evaluators/plan-progress";
import {
  evaluateOfficialDocuments,
  generatePeriodicExecutiveReport,
} from "./task-evaluators/docs-reports";
import { evaluateEarlyWarningRadar } from "./task-evaluators/early-warning";
import {
  synthesizeParentFeedback,
  draftExecutiveAnnouncement,
} from "./task-evaluators/communication";

/**
 * Standard Rule-Based Implementation of IAiAnalysisEngine.
 * Can be swapped or augmented with LLM providers without breaking downstream consumers.
 */
export class RuleBasedAiAnalysisEngine implements IAiAnalysisEngine {
  async analyzeRealtimeStatus(
    data: AggregatedSchoolSnapshot
  ): Promise<RealtimeMonitoringResult> {
    return evaluateRealtimeStatus(data);
  }

  async recommendSubstituteTeachers(
    request: { absentTeacherId: string; date: Date; period: number; classId: string },
    data: AggregatedSchoolSnapshot
  ): Promise<SubstituteRecommendationResult> {
    return evaluateSubstituteRecommendation(request, data);
  }

  async recommendEquipmentTransfer(
    request: {
      category: EquipmentCategory;
      targetSchoolPointId: string;
      neededQuantity: number;
    },
    data: AggregatedSchoolSnapshot
  ): Promise<EquipmentTransferAdviceResult> {
    return evaluateEquipmentTransferAdvice(request, data);
  }

  async evaluateDecisionOptions(
    query: string,
    data: AggregatedSchoolSnapshot
  ): Promise<DecisionSupportResult> {
    return evaluateDecisionSupport(query, data);
  }

  async analyzePlanAndKpiProgress(
    data: AggregatedSchoolSnapshot
  ): Promise<PlanKpiProgressResult> {
    return evaluatePlanAndKpiProgress(data);
  }

  async analyzeOfficialDocuments(
    data: AggregatedSchoolSnapshot
  ): Promise<OfficialDocumentAnalysisResult> {
    return evaluateOfficialDocuments(data);
  }

  async generatePeriodicReport(
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1",
    data: AggregatedSchoolSnapshot
  ): Promise<PeriodicReportResult> {
    return generatePeriodicExecutiveReport(period, data);
  }

  async scanEarlyWarnings(
    data: AggregatedSchoolSnapshot
  ): Promise<EarlyWarningRadarResult> {
    return evaluateEarlyWarningRadar(data);
  }

  async synthesizeParentFeedback(
    data: AggregatedSchoolSnapshot
  ): Promise<ParentFeedbackSynthesisResult> {
    return synthesizeParentFeedback(data);
  }

  async draftExecutiveAnnouncement(
    input: {
      topic: string;
      audience: "TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS";
      tone?: string;
    },
    data: AggregatedSchoolSnapshot
  ): Promise<AnnouncementDraftResult> {
    return draftExecutiveAnnouncement(input, data);
  }
}

export const defaultAiAnalysisEngine: IAiAnalysisEngine =
  new RuleBasedAiAnalysisEngine();
