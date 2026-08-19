"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export async function getApprovalItems() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { lessonPlans: [], changeRequests: [] };

    const isAllowed =
      session.user.role === Role.ADMIN || session.user.role === "VICE_PRINCIPAL";

    if (!isAllowed) return { lessonPlans: [], changeRequests: [] };

    const [lessonPlans, changeRequests] = await Promise.all([
      prisma.lessonPlan.findMany({
        include: {
          teacher: { include: { user: { select: { name: true, email: true } } } },
          subject: { select: { name: true } },
          classRoom: { select: { name: true, gradeLevel: true } },
          reviews: { orderBy: { createdAt: "desc" } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      }),
      prisma.teacherChangeRequest.findMany({
        include: {
          subject: { select: { name: true } },
          classRoom: { select: { name: true, gradeLevel: true } },
          currentTeacher: { include: { user: { select: { name: true } } } },
          newTeacher: { include: { user: { select: { name: true } } } },
          requestedBy: { include: { user: { select: { name: true } } } },
          approvedBy: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      lessonPlans: lessonPlans.map((p) => ({
        id: p.id,
        type: "LESSON_PLAN" as const,
        title: p.title,
        teacherName: p.teacher?.user?.name || "Giáo viên",
        subjectName: p.subject?.name || "Môn học",
        className: p.classRoom?.name || "Lớp học",
        weekNumber: p.weekNumber,
        status: p.status,
        driveFileUrl: p.driveFileUrl || null,
        reviewNote: p.reviewNote || null,
        reviewedBy: p.reviewedBy || null,
        createdAt: p.createdAt.toISOString(),
      })),
      changeRequests: changeRequests.map((r) => ({
        id: r.id,
        type: "CHANGE_REQUEST" as const,
        title: `Đổi giáo viên môn ${r.subject.name} - Lớp ${r.classRoom.name}`,
        teacherName: r.currentTeacher.user.name,
        newTeacherName: r.newTeacher.user.name,
        subjectName: r.subject.name,
        className: r.classRoom.name,
        reason: r.reason || "Không có lý do",
        status: r.status,
        reviewNote: r.reviewNote || null,
        approvedByName: r.approvedBy?.user?.name || null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error in getApprovalItems:", error);
    return { lessonPlans: [], changeRequests: [] };
  }
}

export async function processApproval(data: {
  itemId: string;
  itemType: "LESSON_PLAN" | "CHANGE_REQUEST";
  action: "APPROVE" | "REJECT";
  reviewNote?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const isAllowed =
      session.user.role === Role.ADMIN || session.user.role === "VICE_PRINCIPAL";

    if (!isAllowed) {
      return { success: false, error: "Không có quyền thực hiện chức năng này" };
    }

    const reviewerName = session.user.name || (session.user.role === Role.ADMIN ? "Hiệu trưởng" : "Phó Hiệu trưởng");
    const reviewerRole = session.user.role === Role.ADMIN ? "ADMIN" : "VICE_PRINCIPAL";

    if (data.itemType === "LESSON_PLAN") {
      const plan = await prisma.lessonPlan.findUnique({ where: { id: data.itemId } });
      if (!plan) return { success: false, error: "Không tìm thấy giáo án" };

      const newStatus = data.action === "APPROVE" ? LessonPlanStatus.APPROVED : LessonPlanStatus.REJECTED;

      await prisma.$transaction([
        prisma.lessonPlan.update({
          where: { id: data.itemId },
          data: {
            status: newStatus,
            reviewNote: data.reviewNote || (data.action === "APPROVE" ? "Đã phê duyệt" : "Đã từ chối"),
            reviewedBy: reviewerName,
            reviewedAt: new Date(),
          },
        }),
        prisma.lessonPlanReview.create({
          data: {
            lessonPlanId: data.itemId,
            reviewerName,
            reviewerRole,
            action: newStatus,
            comment: data.reviewNote || (data.action === "APPROVE" ? "Đã phê duyệt" : "Đã từ chối"),
          },
        }),
      ]);

      await recordAuditLog({
        userId: session.user.id,
        userName: reviewerName,
        userRole: reviewerRole,
        action: data.action,
        entityName: "LessonPlan",
        entityId: data.itemId,
        description: `${reviewerName} ${data.action === "APPROVE" ? "phê duyệt" : "từ chối"} giáo án: ${plan.title}`,
      });
    } else if (data.itemType === "CHANGE_REQUEST") {
      const req = await prisma.teacherChangeRequest.findUnique({ where: { id: data.itemId } });
      if (!req) return { success: false, error: "Không tìm thấy yêu cầu" };

      const newStatus = data.action === "APPROVE" ? "APPROVED" : "CANCELLED";

      await prisma.teacherChangeRequest.update({
        where: { id: data.itemId },
        data: {
          status: newStatus,
          reviewNote: data.reviewNote || (data.action === "APPROVE" ? "Đã phê duyệt" : "Đã từ chối"),
          approvedById: session.user.id,
        },
      });

      if (data.action === "APPROVE") {
        // Cập nhật phân công giảng dạy
        await prisma.teachingAssignment.updateMany({
          where: {
            classId: req.classId,
            subjectId: req.subjectId,
          },
          data: {
            teacherId: req.newTeacherId,
          },
        });
      }

      await recordAuditLog({
        userId: session.user.id,
        userName: reviewerName,
        userRole: reviewerRole,
        action: data.action,
        entityName: "TeacherChangeRequest",
        entityId: data.itemId,
        description: `${reviewerName} ${data.action === "APPROVE" ? "phê duyệt" : "từ chối"} yêu cầu đổi GV`,
      });
    }

    revalidatePath("/admin/approvals");
    revalidatePath("/admin/lesson-plans");
    revalidatePath("/vice-principal/lesson-plans");
    revalidatePath("/teacher/subject-head");
    revalidatePath("/teacher/lesson-plans");

    return { success: true };
  } catch (error: any) {
    console.error("Error in processApproval:", error);
    return { success: false, error: "Lỗi hệ thống: " + (error.message || "") };
  }
}
