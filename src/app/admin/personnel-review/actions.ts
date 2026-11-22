"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getTenantContext, type TenantContext } from "@/lib/tenant";
import {
  assertReviewCampus,
  assertReviewRole,
  cleanReviewText,
  nextReviewStatus,
  parseSupplementalTasks,
  type ReviewAction,
} from "@/lib/personnel-review";

async function getReviewContext(): Promise<TenantContext> {
  const sessionContext = await getTenantContext();
  const user = await prisma.user.findUnique({
    where: { id: sessionContext.userId },
    select: { role: true, schoolId: true, campusId: true, isApproved: true },
  });
  if (!user) throw new Error("Tài khoản không còn tồn tại.");
  const ctx = { ...sessionContext, userRole: user.role, schoolId: user.schoolId ?? undefined, campusId: user.campusId ?? undefined, isApproved: user.isApproved };
  assertReviewRole(ctx);
  return ctx;
}

async function allowedCampuses(ctx: TenantContext) {
  assertReviewRole(ctx);
  if (ctx.userRole === "ADMIN") {
    return prisma.campus.findMany({ where: { schoolId: ctx.schoolId! }, select: { id: true, name: true, schoolId: true }, orderBy: { name: "asc" } });
  }
  const scopes = await prisma.userRoleScope.findMany({
    where: { userId: ctx.userId, role: "VICE_PRINCIPAL", scopeType: "CAMPUS" },
    select: { scopeId: true },
  });
  const ids = [...new Set([ctx.campusId, ...scopes.map((scope) => scope.scopeId)].filter((id): id is string => Boolean(id)))];
  if (!ids.length) return [];
  return prisma.campus.findMany({
    where: { id: { in: ids }, schoolId: ctx.schoolId! },
    select: { id: true, name: true, schoolId: true },
    orderBy: { name: "asc" },
  });
}

export async function getPersonnelReviewWorkspace() {
  const ctx = await getReviewContext();
  const campuses = await allowedCampuses(ctx);
  const reviews = await prisma.personnelReview.findMany({
    where: { schoolId: ctx.schoolId!, ...(ctx.userRole === "VICE_PRINCIPAL" ? { campusId: { in: campuses.map((campus) => campus.id) } } : {}) },
    include: { campus: { select: { name: true } }, events: { orderBy: { createdAt: "asc" }, select: { id: true, action: true, fromState: true, toState: true, comment: true, createdAt: true, revision: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return { role: ctx.userRole, campuses, reviews };
}

export async function createPersonnelReview(input: { campusId: string; period: string; title: string; dueDate?: string }) {
  const ctx = await getReviewContext();
  assertReviewRole(ctx);
  if (ctx.userRole !== "ADMIN") throw new Error("Chỉ Hiệu trưởng được tạo đợt rà soát.");
  const campuses = await allowedCampuses(ctx);
  const campus = campuses.find((item) => item.id === input.campusId);
  if (!campus) throw new Error("Cơ sở không thuộc trường của tài khoản.");
  const period = cleanReviewText(input.period, 60, true);
  const title = cleanReviewText(input.title, 160, true);
  const dueDate = input.dueDate ? new Date(`${input.dueDate}T23:59:59+07:00`) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) throw new Error("Hạn hoàn thành không hợp lệ.");

  return prisma.$transaction(async (tx) => {
    const [staff, classes, assignments] = await Promise.all([
      tx.user.findMany({ where: { schoolId: ctx.schoolId!, campusId: campus.id, role: { in: ["ADMIN", "VICE_PRINCIPAL", "SUBJECT_HEAD", "TEACHER"] } }, select: { id: true, name: true, role: true, campusId: true }, orderBy: { name: "asc" } }),
      tx.classRoom.findMany({ where: { schoolId: ctx.schoolId!, campusId: campus.id }, select: { id: true, name: true, gradeLevel: true, homeroomTeacherId: true }, orderBy: { name: "asc" } }),
      tx.teachingAssignment.findMany({ where: { classRoom: { schoolId: ctx.schoolId!, campusId: campus.id } }, select: { id: true, teacherId: true, teacher: { select: { user: { select: { id: true, name: true } } } }, subject: { select: { id: true, name: true } }, classRoom: { select: { id: true, name: true } } }, orderBy: { id: "asc" } }),
    ]);
    const assignedClassIds = new Set(assignments.map((item) => item.classRoom.id));
    const warnings = classes.filter((item) => !assignedClassIds.has(item.id)).map((item) => ({ code: "NO_TEACHING_ASSIGNMENT", classId: item.id, message: `Lớp ${item.name} chưa có phân công giảng dạy trong dữ liệu nguồn; cần kiểm tra.` }));
    const sourceSnapshot = { capturedAt: new Date().toISOString(), schoolId: ctx.schoolId, campusId: campus.id, staff, classes, assignments, warnings } as Prisma.InputJsonValue;
    const review = await tx.personnelReview.create({
      data: { schoolId: ctx.schoolId!, campusId: campus.id, period, title, dueDate, sourceSnapshot },
    });
    await tx.personnelReviewEvent.create({ data: { reviewId: review.id, actorId: ctx.userId, action: "CREATE", toState: "DRAFT", revision: 1 } });
    return review.id;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
}

async function mutateReview(id: string, action: ReviewAction, input?: { notes?: string; tasks?: string; reason?: string }) {
  const ctx = await getReviewContext();
  const campuses = await allowedCampuses(ctx);
  const review = await prisma.personnelReview.findUnique({ where: { id } });
  if (!review) throw new Error("Không tìm thấy hồ sơ rà soát.");
  assertReviewCampus(ctx, review.schoolId, review.campusId, campuses.map((campus) => campus.id));
  const next = nextReviewStatus(ctx.userRole, review.status, action);
  const notes = action === "EDIT" ? cleanReviewText(input?.notes ?? "", 5000) : undefined;
  const tasks = action === "EDIT" ? parseSupplementalTasks(input?.tasks ?? "") : undefined;
  const reason = action === "RETURN" ? cleanReviewText(input?.reason ?? "", 1000, true) : undefined;
  if (action === "SUBMIT") {
    const snapshot = review.sourceSnapshot as { warnings?: unknown[] };
    if (snapshot.warnings?.length && !review.notes.trim()) {
      throw new Error("Cần ghi chú kiểm tra các cảnh báo trước khi gửi.");
    }
  }
  return prisma.$transaction(async (tx) => {
    const changed = await tx.personnelReview.updateMany({
      where: { id, schoolId: ctx.schoolId!, campusId: review.campusId, status: review.status, revision: review.revision },
      data: {
        status: next,
        revision: { increment: 1 },
        ...(notes !== undefined ? { notes } : {}),
        ...(tasks !== undefined ? { supplementalTasks: tasks } : {}),
        ...(action === "RETURN" ? { returnReason: reason } : {}),
        ...(action === "SUBMIT" ? { submittedAt: new Date(), returnReason: null } : {}),
        ...(action === "CONFIRM" ? { confirmedAt: new Date() } : {}),
      },
    });
    if (changed.count !== 1) throw new Error("Hồ sơ vừa được người khác cập nhật. Vui lòng tải lại.");
    await tx.personnelReviewEvent.create({
      data: { reviewId: id, actorId: ctx.userId, action, fromState: review.status, toState: next, revision: review.revision + 1, comment: reason ?? null },
    });
    return true;
  });
}

export async function editPersonnelReview(id: string, notes: string, tasks: string) {
  return mutateReview(id, "EDIT", { notes, tasks });
}
export async function submitPersonnelReview(id: string) {
  return mutateReview(id, "SUBMIT");
}
export async function returnPersonnelReview(id: string, reason: string) {
  return mutateReview(id, "RETURN", { reason });
}
export async function confirmPersonnelReview(id: string) {
  return mutateReview(id, "CONFIRM");
}
