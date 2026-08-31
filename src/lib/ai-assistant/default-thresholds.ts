import { AiTaskGroup, AiAlertSeverity } from "./types";
import prisma from "@/lib/prisma";

export interface ThresholdDefinition {
  metricKey: string;
  metricName: string;
  taskGroup: AiTaskGroup;
  thresholdValue: number;
  unit: string;
  comparisonOp: "GTE" | "LTE" | "EQ" | "NEQ";
  severity: AiAlertSeverity;
  description: string;
}

export const DEFAULT_AI_THRESHOLDS: Record<string, ThresholdDefinition> = {
  // 1. Giám sát thời gian thực
  ABSENCE_RATE_WARNING: {
    metricKey: "ABSENCE_RATE_WARNING",
    metricName: "Tỷ lệ vắng học mức Cảnh báo",
    taskGroup: AiTaskGroup.REALTIME_MONITORING,
    thresholdValue: 5.0,
    unit: "%",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.MEDIUM,
    description: "Tỷ lệ học sinh vắng trong ngày tại điểm trường đạt mức cần chú ý (mặc định 5%).",
  },
  ABSENCE_RATE_CRITICAL: {
    metricKey: "ABSENCE_RATE_CRITICAL",
    metricName: "Tỷ lệ vắng học mức Nguy hiểm",
    taskGroup: AiTaskGroup.REALTIME_MONITORING,
    thresholdValue: 10.0,
    unit: "%",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.CRITICAL,
    description: "Tỷ lệ học sinh vắng trong ngày tại điểm trường đạt mức báo động đỏ (mặc định 10%).",
  },
  CLASS_ABSENT_SPIKE: {
    metricKey: "CLASS_ABSENT_SPIKE",
    metricName: "Đột biến vắng học trong 1 lớp",
    taskGroup: AiTaskGroup.REALTIME_MONITORING,
    thresholdValue: 4.0,
    unit: "học sinh",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.HIGH,
    description: "Số học sinh vắng trong cùng một lớp trong ngày vượt quá ngưỡng (mặc định 4 HS).",
  },

  // 2. Điều phối & Dạy thay
  TEACHER_MAX_WEEKLY_PERIODS: {
    metricKey: "TEACHER_MAX_WEEKLY_PERIODS",
    metricName: "Định mức số tiết tối đa / tuần",
    taskGroup: AiTaskGroup.COORDINATION_DISPATCH,
    thresholdValue: 23.0,
    unit: "tiết",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.MEDIUM,
    description: "Số tiết dạy tối đa của giáo viên trong tuần trước khi bị xem là quá tải (mặc định 23 tiết).",
  },

  // 4. Kế hoạch & KPI
  LESSON_PLAN_DELAY_DAYS_WARNING: {
    metricKey: "LESSON_PLAN_DELAY_DAYS_WARNING",
    metricName: "Trễ hạn nộp giáo án mức Vàng",
    taskGroup: AiTaskGroup.PLAN_PROGRESS,
    thresholdValue: 3.0,
    unit: "ngày",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.MEDIUM,
    description: "Số ngày quá hạn nộp giáo án theo lịch duyệt của Tổ chuyên môn (mặc định 3 ngày).",
  },
  LESSON_PLAN_DELAY_DAYS_CRITICAL: {
    metricKey: "LESSON_PLAN_DELAY_DAYS_CRITICAL",
    metricName: "Trễ hạn nộp giáo án mức Đỏ",
    taskGroup: AiTaskGroup.PLAN_PROGRESS,
    thresholdValue: 7.0,
    unit: "ngày",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.CRITICAL,
    description: "Số ngày quá hạn nộp giáo án nghiêm trọng cần Ban giám hiệu can thiệp (mặc định 7 ngày).",
  },
  KPI_COMPLETION_AT_RISK: {
    metricKey: "KPI_COMPLETION_AT_RISK",
    metricName: "Ngưỡng KPI có nguy cơ",
    taskGroup: AiTaskGroup.PLAN_PROGRESS,
    thresholdValue: 80.0,
    unit: "%",
    comparisonOp: "LTE",
    severity: AiAlertSeverity.MEDIUM,
    description: "Chỉ số hoàn thành KPI dưới mức này được xếp vào nhóm có nguy cơ (mặc định 80%).",
  },
  KPI_COMPLETION_CRITICAL: {
    metricKey: "KPI_COMPLETION_CRITICAL",
    metricName: "Ngưỡng KPI báo động đỏ",
    taskGroup: AiTaskGroup.PLAN_PROGRESS,
    thresholdValue: 60.0,
    unit: "%",
    comparisonOp: "LTE",
    severity: AiAlertSeverity.CRITICAL,
    description: "Chỉ số hoàn thành KPI dưới mức này bị xếp vào nhóm thất bại/báo động (mặc định 60%).",
  },

  // 5. Văn bản & Báo cáo
  DOC_EXPIRING_HOURS: {
    metricKey: "DOC_EXPIRING_HOURS",
    metricName: "Thời gian nhắc hạn công văn khẩn",
    taskGroup: AiTaskGroup.DOCS_PERIODIC_REPORTS,
    thresholdValue: 48.0,
    unit: "giờ",
    comparisonOp: "LTE",
    severity: AiAlertSeverity.HIGH,
    description: "Công văn đến/chỉ đạo còn hạn xử lý dưới ngưỡng này sẽ được đưa vào hàng đợi ưu tiên (mặc định 48h).",
  },

  // 6. Cảnh báo sớm
  STUDENT_ABSENT_MONTH_WARNING: {
    metricKey: "STUDENT_ABSENT_MONTH_WARNING",
    metricName: "Ngưỡng số buổi vắng học trong tháng",
    taskGroup: AiTaskGroup.EARLY_WARNING,
    thresholdValue: 3.0,
    unit: "buổi",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.HIGH,
    description: "Học sinh vắng từ mức này trở lên trong tháng sẽ được đưa vào Rada nguy cơ bỏ học (mặc định 3 buổi).",
  },
  STUDENT_ABSENT_UNEXCUSED_WARNING: {
    metricKey: "STUDENT_ABSENT_UNEXCUSED_WARNING",
    metricName: "Ngưỡng vắng không phép trong tháng",
    taskGroup: AiTaskGroup.EARLY_WARNING,
    thresholdValue: 2.0,
    unit: "buổi",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.CRITICAL,
    description: "Học sinh vắng không phép từ mức này trở lên sẽ lập tức cảnh báo tới Hiệu trưởng & GVCN (mặc định 2 buổi).",
  },

  // 7. Giao tiếp & Phản hồi
  PARENT_FEEDBACK_WAITING_HOURS_WARNING: {
    metricKey: "PARENT_FEEDBACK_WAITING_HOURS_WARNING",
    metricName: "Thời gian chờ phản hồi phụ huynh mức Vàng",
    taskGroup: AiTaskGroup.COMMUNICATION_FEEDBACK,
    thresholdValue: 24.0,
    unit: "giờ",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.MEDIUM,
    description: "Phản ánh phụ huynh chưa được xử lý sau thời gian này (mặc định 24h).",
  },
  PARENT_FEEDBACK_WAITING_HOURS_CRITICAL: {
    metricKey: "PARENT_FEEDBACK_WAITING_HOURS_CRITICAL",
    metricName: "Thời gian chờ phản hồi phụ huynh mức Đỏ",
    taskGroup: AiTaskGroup.COMMUNICATION_FEEDBACK,
    thresholdValue: 48.0,
    unit: "giờ",
    comparisonOp: "GTE",
    severity: AiAlertSeverity.HIGH,
    description: "Phản ánh phụ huynh tồn đọng quá lâu chưa được giải quyết (mặc định 48h).",
  },
};

/**
 * Loads dynamic thresholds from DB for a given school, merging with default values.
 */
export async function loadSchoolThresholds(schoolId?: string): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  // 1. Populate default values
  for (const [key, def] of Object.entries(DEFAULT_AI_THRESHOLDS)) {
    result[key] = def.thresholdValue;
  }

  if (!schoolId) return result;

  try {
    const customThresholds = await prisma.aiConfigThreshold.findMany({
      where: { schoolId },
    });

    for (const item of customThresholds) {
      if (typeof item.thresholdValue === "number" && !isNaN(item.thresholdValue)) {
        result[item.metricKey] = item.thresholdValue;
      }
    }
  } catch (error) {
    console.warn("Could not load custom AI thresholds from DB, falling back to defaults:", error);
  }

  return result;
}
