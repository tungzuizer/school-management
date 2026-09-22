/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: KPI admin pages (catalog, entry, approval, principal-dashboard)
 * 2. Affected API: CATEGORY_LABELS, DIRECTION_LABELS, FREQUENCY_LABELS, STATUS_LABELS
 * 3. Data schemas: KpiPeriodStatus, KpiCategory, MeasurementDirection, ReportingFrequency
 * 4. Verbatim User Instruction: "bỏ các icon màu mè đi dùng icon đơn giản" -> "theo khuyến nghị của bạn" (Chuẩn hóa toàn diện đơn sắc Monochrome/Slate)
 */

import type { KpiCategory, MeasurementDirection, ReportingFrequency, KpiPeriodStatus } from "@prisma/client";

export const CATEGORY_LABELS: Record<KpiCategory, string> = {
  STRATEGIC: "1. Chiến lược phát triển trường",
  EDUCATIONAL_QUALITY: "2. Chất lượng giáo dục & Đào tạo",
  PROFESSIONAL: "3. Công tác chuyên môn & Giảng dạy",
  STAFF_PERSONNEL: "4. Đội ngũ cán bộ & Giáo viên",
  STUDENT: "5. Công tác học sinh & Rèn luyện",
  DIGITAL_TRANSFORMATION: "6. Chuyển đổi số & CNTT",
  FINANCIAL: "7. Tài chính & Ngân sách",
  ASSETS: "8. Quản lý tài sản & Thiết bị",
  FACILITIES: "9. Cơ sở vật chất & Hạ tầng",
  SCHOOL_SAFETY: "10. An toàn & An ninh trường học",
  SCHOOL_RELATIONS: "11. Quan hệ Gia đình - Nhà trường - Xã hội",
  INNOVATION: "12. Đổi mới sáng tạo & Thi đua",
};

export const DIRECTION_LABELS: Record<MeasurementDirection, string> = {
  HIGHER_BETTER: "Càng cao càng tốt (≥)",
  LOWER_BETTER: "Càng thấp càng tốt (≤)",
  PASS_FAIL: "Đạt / Không đạt (Pass/Fail)",
};

export const FREQUENCY_LABELS: Record<ReportingFrequency, string> = {
  MONTHLY: "Hàng tháng",
  QUARTERLY: "Hàng quý",
  SEMESTER: "Theo học kỳ",
  YEARLY: "Hàng năm",
};

export const STATUS_LABELS: Record<KpiPeriodStatus, { label: string; class: string }> = {
  DRAFT: { label: "Bản nháp", class: "bg-slate-100 text-slate-700 border-slate-200" },
  SUBMITTED: { label: "Đã gửi duyệt (Cấp Phân hiệu)", class: "bg-slate-100 text-slate-800 border-slate-300" },
  CAMPUS_CHECKED: { label: "Đã thẩm định Phân hiệu", class: "bg-slate-100 text-slate-800 border-slate-300" },
  VP_REVIEWED: { label: "Hiệu phó đã thông qua", class: "bg-slate-100 text-slate-800 border-slate-300" },
  APPROVED: { label: "Hiệu trưởng đã phê duyệt (Đã khóa)", class: "bg-slate-900 text-white border-slate-800" },
  UNLOCK_REQUESTED: { label: "Đang chờ mở khóa", class: "bg-slate-100 text-slate-800 border-slate-300" },
};
