/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/lesson-plans/page.tsx`.
 * 2. Affected APIs: Server actions `getLessonPlansForAdmin`, `reviewLessonPlan`.
 * 3. Schema: Prisma `LessonPlan`, `LessonPlanReview`, `Role`, `LessonPlanStatus`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Chuẩn hóa phân quyền phê duyệt giáo án cho SuperAdmin toàn hệ thống.
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";

import { recordAuditLog } from "@/lib/audit-logger";

// Get all lesson plans for admin / superadmin approval portal
export async function getLessonPlansForAdmin(schoolId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const isSuperAdmin =
      session.user.email === "superadmin.ninhbinh@gmail.com" ||
      session.user.email === "superadmin.demo@gmail.com" ||
      session.user.email === "superadmin@school.com" ||
      (session.user as any).role === "SUPER_ADMIN";

    const isAllowed =
      isSuperAdmin ||
      session.user.role === Role.ADMIN ||
      session.user.role === "VICE_PRINCIPAL" ||
      session.user.role === Role.DEPARTMENT_ADMIN ||
      session.user.role === Role.WARD_ADMIN;

    if (!isAllowed) return [];

    const where: any = {
      status: {
        in: [
          LessonPlanStatus.SUBMITTED,
          LessonPlanStatus.HEAD_APPROVED,
          LessonPlanStatus.VP_APPROVED,
          LessonPlanStatus.APPROVED,
          LessonPlanStatus.REJECTED,
        ],
      },
    };

    if (schoolId && schoolId !== "ALL") {
      where.teacher = {
        user: { schoolId },
      };
    }

    const plans = await prisma.lessonPlan.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: { select: { name: true, school: { select: { id: true, name: true } } } },
          },
        },
        subject: { select: { name: true } },
        classRoom: { select: { name: true } },
        reviews: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return plans.map((p) => ({
      id: p.id,
      teacherName: p.teacher?.user?.name || "Giáo viên",
      schoolName: (p.teacher?.user as any)?.school?.name || "Toàn trường",
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
      fileUrl: p.fileUrl || null,
      fileName: p.fileName || null,
      fileSize: p.fileSize || null,
      fileType: p.fileType || null,
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

// Phê duyệt giáo án (SuperAdmin / Hiệu trưởng / Phó hiệu trưởng)
export async function reviewLessonPlan(data: {
  planId: string;
  status: "APPROVED" | "REJECTED";
  reviewNote: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const isSuperAdmin =
    session.user.email === "superadmin.ninhbinh@gmail.com" ||
    session.user.email === "superadmin.demo@gmail.com" ||
    session.user.email === "superadmin@school.com" ||
    (session.user as any).role === "SUPER_ADMIN";

  const isAllowed =
    isSuperAdmin ||
    session.user.role === Role.ADMIN ||
    session.user.role === "VICE_PRINCIPAL" ||
    session.user.role === Role.DEPARTMENT_ADMIN ||
    session.user.role === Role.WARD_ADMIN;

  if (!isAllowed) {
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
      action: data.status === "APPROVED" ? "APPROVE" : "REJECT",
      entityName: "LessonPlan",
      entityId: data.planId,
      description: `Hiệu trưởng ${data.status === "APPROVED" ? "phê duyệt" : "từ chối"} giáo án: ${existing.title}`,
    });

    // Revalidate paths for instant UI cache update across all roles
    
    
    
    
    

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống: " + error.message };
  }
}

// Lấy danh sách các trường học cho bộ lọc SuperAdmin
export async function getAdminSchools() {
  try {
    return await prisma.school.findMany({
      select: { id: true, name: true, schoolType: true, branchType: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching schools for lesson plans:", error);
    return [];
  }
}

