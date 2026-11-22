import type { TenantContext } from "@/lib/tenant";

export type ReviewStatus = "DRAFT" | "RETURNED" | "SUBMITTED" | "CONFIRMED";
export type ReviewAction = "EDIT" | "SUBMIT" | "RETURN" | "CONFIRM";

export function assertReviewRole(ctx: TenantContext): void {
  if (ctx.isApproved === false || !ctx.schoolId ||
      (ctx.userRole !== "ADMIN" && ctx.userRole !== "VICE_PRINCIPAL")) {
    throw new Error("Không có quyền truy cập hồ sơ rà soát.");
  }
}

export function assertReviewCampus(
  ctx: TenantContext,
  targetSchoolId: string,
  targetCampusId: string,
  allowedCampusIds: readonly string[],
): void {
  assertReviewRole(ctx);
  if (ctx.schoolId !== targetSchoolId) {
    throw new Error("Hồ sơ không thuộc trường của tài khoản.");
  }
  if (ctx.userRole === "VICE_PRINCIPAL" && !allowedCampusIds.includes(targetCampusId)) {
    throw new Error("Không có quyền truy cập cơ sở này.");
  }
}

export function nextReviewStatus(role: string, status: string, action: ReviewAction): ReviewStatus {
  if (action === "EDIT" && role === "VICE_PRINCIPAL" && (status === "DRAFT" || status === "RETURNED")) return status;
  if (action === "SUBMIT" && role === "VICE_PRINCIPAL" && (status === "DRAFT" || status === "RETURNED")) return "SUBMITTED";
  if (action === "RETURN" && role === "ADMIN" && status === "SUBMITTED") return "RETURNED";
  if (action === "CONFIRM" && role === "ADMIN" && status === "SUBMITTED") return "CONFIRMED";
  throw new Error("Thao tác không hợp lệ với vai trò hoặc trạng thái hiện tại.");
}

export function cleanReviewText(value: string, maxLength: number, required = false): string {
  const result = value.trim();
  if ((required && !result) || result.length > maxLength) {
    throw new Error(`Nội dung phải có từ ${required ? 1 : 0} đến ${maxLength} ký tự.`);
  }
  return result;
}

export function parseSupplementalTasks(value: string): string[] {
  const tasks = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (tasks.length > 30 || tasks.some((task) => task.length > 200)) {
    throw new Error("Tối đa 30 công việc bổ sung, mỗi dòng không quá 200 ký tự.");
  }
  return tasks;
}
