"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";

// Get all lesson plans for the admin (Hiệu trưởng) approval portal
// Hiệu trưởng có quyền xem tất cả giáo án ở các trạng thái
export async function getLessonPlansForAdmin() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== Role.ADMIN) {
      return [];
    }

    const plans = await prisma.lessonPlan.findMany({
      where: {
        status: {
          in: [
            LessonPlanStatus.SUBMITTED,
            LessonPlanStatus.HEAD_APPROVED,
            LessonPlanStatus.VP_APPROVED,
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
    console.error("Error fetching lesson plans for admin:", error);
    return [];
  }
}

// Hiệu trưởng phê duyệt cuối cùng (Cho phép duyệt từ VP_APPROVED, HEAD_APPROVED hoặc SUBMITTED)
export async function reviewLessonPlan(data: {
  planId: string;
  status: "APPROVED" | "REJECTED";
  reviewNote: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return { success: false, error: "Không có quyền thực hiện chức năng này" };
  }

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id: data.planId },
    });
    if (!existing) return { success: false, error: "Không tìm thấy giáo án" };

    if (existing.status === LessonPlanStatus.DRAFT) {
      return { success: false, error: "Giáo án đang ở bản nháp, giáo viên chưa gửi nộp." };
    }

    const newStatus = data.status === "APPROVED" ? LessonPlanStatus.APPROVED : LessonPlanStatus.REJECTED;

    await prisma.$transaction([
      prisma.lessonPlan.update({
        where: { id: data.planId },
        data: {
          status: newStatus,
          reviewNote: data.reviewNote,
          reviewedBy: session.user.name || "Hiệu trưởng",
          reviewedAt: new Date(),
        },
      }),
      prisma.lessonPlanReview.create({
        data: {
          lessonPlanId: data.planId,
          reviewerName: session.user.name || "Hiệu trưởng",
          reviewerRole: "ADMIN",
          action: newStatus,
          comment: data.reviewNote,
        },
      }),
    ]);

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "",
      userRole: "ADMIN",
      action: data.status === "APPROVED" ? "APPROVE" : "REJECT",
      entityName: "LessonPlan",
      entityId: data.planId,
      description: `Hiệu trưởng ${data.status === "APPROVED" ? "phê duyệt" : "từ chối"} giáo án: ${existing.title}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống: " + error.message };
  }
}
