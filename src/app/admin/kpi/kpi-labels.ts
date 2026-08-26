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
  SUBMITTED: { label: "Đã gửi duyệt (Cấp Phân hiệu)", class: "bg-blue-50 text-blue-700 border-blue-200" },
  CAMPUS_CHECKED: { label: "Đã thẩm định Phân hiệu", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  VP_REVIEWED: { label: "Hiệu phó đã thông qua", class: "bg-purple-50 text-purple-700 border-purple-200" },
  APPROVED: { label: "Hiệu trưởng đã phê duyệt (Đã khóa)", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  UNLOCK_REQUESTED: { label: "Đang chờ mở khóa", class: "bg-amber-50 text-amber-700 border-amber-200" },
};
