"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { recordAuditLog } from "@/lib/audit-logger";

// Phó Hiệu trưởng (hoặc Hiệu trưởng) lấy danh sách giáo án
export async function getVPLessonPlans() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const isAllowedRole =
    session.user.role === "VICE_PRINCIPAL" || session.user.role === Role.ADMIN;

  if (!isAllowedRole) return [];

  try {
    const plans = await prisma.lessonPlan.findMany({
      where: {
        status: {
          in: [
            LessonPlanStatus.SUBMITTED,
            LessonPlanStatus.HEAD_APPROVED,
            LessonPlanStatus.VP_APPROVED,
            LessonPlanStatus.VP_REJECTED,
            LessonPlanStatus.APPROVED,
            LessonPlanStatus.REJECTED,
          ],
        },
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: { select: { name: true } },
        classRoom: { select: { name: true } },
        reviews: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return plans.map((p) => ({
      id: p.id,
      teacherName: p.teacher?.user?.name || "Giáo viên",
      subjectName: p.subject?.name || "Môn học",
      className: p.classRoom?.name || "Lớp học",
      weekNumber: p.weekNumber,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      title: p.title,
      objectives: p.objectives || "",
      content: p.content || "",
      activities: p.activities || "",
      materials: p.materials || "",
      assessment: p.assessment || "",
      notes: p.notes || "",
      status: p.status,
      driveFileUrl: p.driveFileUrl || null,
      reviewNote: p.reviewNote || "",
      reviewedAt: p.reviewedAt,
      reviewedBy: p.reviewedBy,
      reviews: p.reviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewerName,
        reviewerRole: r.reviewerRole,
        action: r.action,
        comment: r.comment || "",
        createdAt: r.createdAt,
      })),
    }));
  } catch (error) {
    console.error("Error fetching VP lesson plans:", error);
    return [];
  }
}

// Phó Hiệu trưởng (hoặc Hiệu trưởng) duyệt giáo án (HEAD_APPROVED / SUBMITTED → VP_APPROVED / VP_REJECTED)
export async function vpReviewLessonPlan(data: {
  planId: string;
  approved: boolean;
  reviewNote: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const isAllowedRole =
    session.user.role === "VICE_PRINCIPAL" || session.user.role === Role.ADMIN;

  if (!isAllowedRole) {
    return { success: false, error: "Không có quyền thực hiện chức năng này" };
  }

  try {
    const existing = await prisma.lessonPlan.findUnique({ where: { id: data.planId } });
    if (!existing) return { success: false, error: "Không tìm thấy giáo án" };

    if (existing.status === LessonPlanStatus.DRAFT) {
      return { success: false, error: "Giáo án đang ở bản nháp, chưa thể duyệt" };
    }

    const newStatus = data.approved ? LessonPlanStatus.VP_APPROVED : LessonPlanStatus.VP_REJECTED;

    await prisma.$transaction([
      prisma.lessonPlan.update({
        where: { id: data.planId },
        data: {
          status: newStatus,
          reviewNote: data.reviewNote,
          reviewedBy: session.user.name || "Phó Hiệu trưởng",
          reviewedAt: new Date(),
        },
      }),
      prisma.lessonPlanReview.create({
        data: {
          lessonPlanId: data.planId,
          reviewerName: session.user.name || "Phó Hiệu trưởng",
          reviewerRole: session.user.role === Role.ADMIN ? "ADMIN" : "VICE_PRINCIPAL",
          action: newStatus,
          comment: data.reviewNote,
        },
      }),
    ]);

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "",
      userRole: session.user.role === Role.ADMIN ? "ADMIN" : "VICE_PRINCIPAL",
      action: data.approved ? "APPROVE" : "REJECT",
      entityName: "LessonPlan",
      entityId: data.planId,
      description: `Phó HT ${data.approved ? "duyệt" : "từ chối"} giáo án: ${existing.title}`,
    });

    // Revalidate paths for instant UI cache update across all roles
    revalidatePath("/admin/lesson-plans");
    revalidatePath("/vice-principal/lesson-plans");
    revalidatePath("/teacher/subject-head");
    revalidatePath("/admin/dashboard");
    revalidatePath("/teacher/lesson-plans");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống: " + error.message };
  }
}
