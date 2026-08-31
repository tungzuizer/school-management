import {
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
  DocumentType,
  DocumentUrgency,
  DocumentStatus,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
} from "@prisma/client";

export {
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
  DocumentType,
  DocumentUrgency,
  DocumentStatus,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
};

// ==================== 1. DATA SNAPSHOT INTERFACES ====================

export interface SchoolPointSummary {
  id: string;
  campusId: string;
  campusName: string;
  name: string;
  distanceKm: number;
  managerName: string | null;
  phone: string | null;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  absentExcused: number;
  absentUnexcused: number;
  lateStudents: number;
  absentRate: number; // percentage 0-100
  totalClasses: number;
  totalTeachers: number;
  journalsCompleted: number;
  journalsPending: number;
  activeIncidentsCount: number;
  activeWarningsCount: number;
  healthScore: number; // 0 - 100
  statusColor: "GREEN" | "YELLOW" | "RED";
}

export interface TeacherAvailabilitySnapshot {
  teacherId: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  campusId?: string;
  schoolPointId?: string;
  schoolPointName?: string;
  distanceKm?: number;
  specialty: string;
  subjectNames: string[];
  busyPeriods: number[]; // e.g. [1, 2, 4]
  weeklyPeriodsCount: number;
  isAvailableToday: boolean;
}

export interface EquipmentSnapshot {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  schoolPointId: string;
  schoolPointName: string;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  brokenQuantity: number;
  condition: EquipmentCondition;
  unit: string;
  locationDetail?: string | null;
}

export interface LessonPlanSummary {
  totalExpected: number;
  submittedCount: number;
  approvedCount: number;
  rejectedCount: number;
  overdueCount: number;
  submissionRate: number;
  delayedTeachers: Array<{
    teacherId: string;
    teacherName: string;
    subjectName: string;
    delayedDays: number;
    schoolPointName?: string;
  }>;
}

export interface KpiProgressSummary {
  totalKpis: number;
  onTrackCount: number;
  atRiskCount: number;
  criticalCount: number;
  averageScore: number;
  atRiskList: Array<{
    id: string;
    code: string;
    title: string;
    category: string;
    completionRate: number;
    responsiblePerson?: string | null;
    campusScope: string;
  }>;
}

export interface DocumentSummary {
  totalPending: number;
  expiringWithin48h: number;
  overdueCount: number;
  expressCount: number;
  urgentList: Array<{
    id: string;
    docNumber: string;
    title: string;
    issuer: string;
    deadline?: Date | null;
    urgency: DocumentUrgency;
    status: DocumentStatus;
    actionRequired?: string | null;
    assignedToName?: string | null;
  }>;
}

export interface EarlyWarningItem {
  id: string;
  schoolId: string;
  campusId?: string | null;
  schoolPointId?: string | null;
  schoolPointName?: string;
  taskGroup: AiTaskGroup;
  severity: AiAlertSeverity;
  status: AiAlertStatus;
  title: string;
  description: string;
  triggerMetric?: string | null;
  suggestedAction?: string | null;
  impactAnalysis?: string | null;
  targetEntity?: string | null; // e.g. "Student:cuid"
  targetName?: string | null;
  createdAt: Date;
}

export interface ParentFeedbackSummary {
  totalRecent: number;
  unrespondedCount: number;
  positiveCount: number;
  neutralCount: number;
  concernCount: number;
  topConcerns: Array<{
    topic: string;
    count: number;
    schoolPointName?: string;
  }>;
  recentFeedbacks: Array<{
    id: string;
    parentName?: string | null;
    studentName?: string | null;
    className?: string | null;
    content: string;
    sentiment?: string | null;
    isResponded: boolean;
    createdAt: Date;
  }>;
}

export interface AggregatedSchoolSnapshot {
  schoolId: string;
  schoolName: string;
  date: Date;
  schoolPoints: SchoolPointSummary[];
  attendanceTotals: {
    totalStudents: number;
    presentCount: number;
    absentExcusedCount: number;
    absentUnexcusedCount: number;
    lateCount: number;
    overallAttendanceRate: number;
  };
  teachers: TeacherAvailabilitySnapshot[];
  equipment: EquipmentSnapshot[];
  lessonPlans: LessonPlanSummary;
  kpis: KpiProgressSummary;
  documents: DocumentSummary;
  warnings: EarlyWarningItem[];
  parentFeedbacks: ParentFeedbackSummary;
  thresholds: Record<string, number>;
}

// ==================== 2. TASK EVALUATION RESULT INTERFACES ====================

// 1. Giám sát thời gian thực
export interface RealtimeMonitoringResult {
  overallHealthScore: number; // 0-100
  overallStatus: "STABLE" | "ATTENTION_REQUIRED" | "CRITICAL";
  pointStatuses: Array<{
    schoolPointId: string;
    schoolPointName: string;
    distanceKm: number;
    healthScore: number;
    statusColor: "GREEN" | "YELLOW" | "RED";
    attendanceRate: number;
    absentCount: number;
    unrecordedJournals: number;
    activeAlertsCount: number;
    issues: string[];
    quickRecommendation: string;
  }>;
  criticalAlerts: EarlyWarningItem[];
  timestamp: Date;
}

// 2. Điều phối hoạt động & Dạy thay
export interface SubstituteCandidate {
  teacherId: string;
  teacherName: string;
  specialty: string;
  schoolPointId?: string;
  schoolPointName?: string;
  distanceKm: number;
  isSameSubject: boolean;
  isSameSchoolPoint: boolean;
  weeklyLoad: number;
  matchScore: number; // 0-100
  travelAdvice?: string;
  reason: string;
}

export interface SubstituteRecommendationResult {
  absentTeacherId: string;
  absentTeacherName: string;
  classId: string;
  className: string;
  subjectName: string;
  period: number;
  date: Date;
  targetSchoolPointId: string;
  targetSchoolPointName: string;
  recommendedCandidates: SubstituteCandidate[];
  optimalChoice: SubstituteCandidate | null;
  contingencyPlan: string;
}

export interface EquipmentTransferAdviceResult {
  category: EquipmentCategory;
  targetSchoolPointId: string;
  targetSchoolPointName: string;
  neededQuantity: number;
  suggestedSourcePointId?: string;
  suggestedSourcePointName?: string;
  availableInSource: number;
  distanceKm: number;
  feasibilityScore: number; // 0-100
  recommendationText: string;
  transferSteps: string[];
}

// 3. Hỗ trợ ra quyết định (3 Phương án + Pháp lý)
export interface DecisionOption {
  optionNumber: number;
  title: string;
  description: string;
  score: number; // 0-100
  pros: string[];
  cons: string[];
  estimatedCostOrResource: string;
  feasibility: "RẤT CAO" | "CAO" | "TRUNG BÌNH" | "THẤP";
  riskLevel: "THẤP" | "VỪA" | "CAO";
  actionSteps: string[];
}

export interface DecisionSupportResult {
  query: string;
  contextSummary: string;
  options: DecisionOption[];
  recommendedOptionNumber: number;
  executiveSummary: string;
  legalGrounds: Array<{
    code: string; // VD: "Thông tư 32/2020/TT-BGDĐT"
    title: string;
    relevantArticle: string; // VD: "Điều 28, Khoản 2"
    applicability: string;
  }>;
  roadmap: Array<{
    phase: string;
    timeline: string;
    tasks: string[];
  }>;
}

// 4. Quản lý Kế hoạch & KPI
export interface PlanKpiProgressResult {
  academicYear: string;
  currentTerm: string;
  overallLessonPlanRate: number;
  overallKpiScore: number;
  delayedLessonPlanCount: number;
  atRiskKpiCount: number;
  delayedSubjectGroups: Array<{
    subjectGroupName: string;
    submissionRate: number;
    delayedCount: number;
  }>;
  criticalMilestones: Array<{
    title: string;
    deadline: Date;
    status: "ON_TIME" | "DELAYED" | "UPCOMING";
    riskLevel: string;
    actionRequired: string;
  }>;
  summaryAdvice: string;
}

// 5. Quản lý Văn bản & Báo cáo định kỳ
export interface OfficialDocumentAnalysisResult {
  totalPending: number;
  expiringWithin48h: number;
  overdueCount: number;
  urgentDispatches: Array<{
    docNumber: string;
    title: string;
    issuer: string;
    deadline: Date | null;
    urgency: DocumentUrgency;
    status: DocumentStatus;
    remainingDays: number;
    recommendedAction: string;
  }>;
  taskChecklistToday: string[];
}

export interface PeriodicReportResult {
  reportType: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1";
  periodLabel: string;
  schoolName: string;
  executiveBrief: string;
  pointBreakdowns: Array<{
    schoolPointName: string;
    attendanceRate: number;
    disciplineStatus: string;
    academicProgress: string;
    notableIssues: string[];
  }>;
  kpiHighlights: string[];
  nextPeriodPriorities: string[];
  markdownReport: string;
}

// 6. Cảnh báo sớm
export interface EarlyWarningRadarResult {
  totalActiveAlerts: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  alertsByPoint: Record<string, EarlyWarningItem[]>;
  allAlerts: EarlyWarningItem[];
  highRiskStudents: Array<{
    studentId: string;
    studentName: string;
    className: string;
    schoolPointName: string;
    absentDays: number;
    unexcusedDays: number;
    academicAvg?: number;
    riskCategory: string;
    recommendedAction: string;
  }>;
  teacherShortages: Array<{
    schoolPointName: string;
    subjectName: string;
    shortageCount: number;
    reason: string;
  }>;
  summaryHeadline: string;
}

// 7. Giao tiếp & Phản hồi phụ huynh
export interface ParentFeedbackSynthesisResult {
  totalAnalyzed: number;
  unrespondedCount: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    concerned: number;
  };
  keyTopics: Array<{
    topicName: string;
    occurrences: number;
    schoolPointName?: string;
    sampleQuotes: string[];
    suggestedResolution: string;
  }>;
  urgentFeedbackItems: Array<{
    id: string;
    parentName: string;
    studentName: string;
    schoolPointName: string;
    content: string;
    waitingHours: number;
    recommendedReplyDraft: string;
  }>;
}

export interface AnnouncementDraftResult {
  topic: string;
  audience: "TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS";
  tone: string;
  title: string;
  officialAnnouncementBody: string;
  zaloSmsSummary: string;
  actionItemsForRecipients: string[];
}

// ==================== 3. PLUGGABLE ANALYSIS ENGINE CONTRACT ====================

export interface IAiAnalysisEngine {
  // 1. Giám sát thời gian thực
  analyzeRealtimeStatus(data: AggregatedSchoolSnapshot): Promise<RealtimeMonitoringResult>;

  // 2. Điều phối hoạt động & Dạy thay / Thiết bị
  recommendSubstituteTeachers(
    request: { absentTeacherId: string; date: Date; period: number; classId: string },
    data: AggregatedSchoolSnapshot
  ): Promise<SubstituteRecommendationResult>;

  recommendEquipmentTransfer(
    request: { category: EquipmentCategory; targetSchoolPointId: string; neededQuantity: number },
    data: AggregatedSchoolSnapshot
  ): Promise<EquipmentTransferAdviceResult>;

  // 3. Hỗ trợ ra quyết định (3 phương án + Pháp lý)
  evaluateDecisionOptions(
    query: string,
    data: AggregatedSchoolSnapshot
  ): Promise<DecisionSupportResult>;

  // 4. Quản lý Kế hoạch & KPI
  analyzePlanAndKpiProgress(data: AggregatedSchoolSnapshot): Promise<PlanKpiProgressResult>;

  // 5. Quản lý Văn bản & Báo cáo định kỳ
  analyzeOfficialDocuments(data: AggregatedSchoolSnapshot): Promise<OfficialDocumentAnalysisResult>;

  generatePeriodicReport(
    period: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1",
    data: AggregatedSchoolSnapshot
  ): Promise<PeriodicReportResult>;

  // 6. Cảnh báo sớm
  scanEarlyWarnings(data: AggregatedSchoolSnapshot): Promise<EarlyWarningRadarResult>;

  // 7. Giao tiếp & Phản hồi
  synthesizeParentFeedback(data: AggregatedSchoolSnapshot): Promise<ParentFeedbackSynthesisResult>;

  draftExecutiveAnnouncement(
    input: { topic: string; audience: "TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS"; tone?: string },
    data: AggregatedSchoolSnapshot
  ): Promise<AnnouncementDraftResult>;
}
