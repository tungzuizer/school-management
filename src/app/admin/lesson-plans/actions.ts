/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/lesson-plans/page.tsx`.
 * 2. Affected APIs: Server actions `getLessonPlansForAdmin`, `reviewLessonPlan`, `getAdminCampuses`, `getAdminSchools`.
 * 3. Schema: Prisma `LessonPlan`, `LessonPlanReview`, `Campus`, `ClassRoom`, `School`, `Role`, `LessonPlanStatus`.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu cho Quản lý & Phê duyệt Kế hoạch bài dạy (Giáo án).
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";

// Get all lesson plans for admin / superadmin approval portal
export async function getLessonPlansForAdmin(schoolId?: string, campusId?: string, gradeLevel?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const isSuperAdmin =
      session.user.email === "superadmin@gmail.com" ||
      session.user.email === "superadmin.vietnam@gmail.com" ||
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

    const ctx = await getTenantContext().catch(() => null);

    let targetSchoolId: string | undefined;
    let targetCampusId: string | undefined;

    if (schoolId && schoolId !== "ALL" && schoolId !== "") {
      targetSchoolId = schoolId;
    } else if (ctx?.schoolId && ctx?.userRole !== "SUPER_ADMIN" && ctx?.userRole !== "ADMIN") {
      targetSchoolId = ctx.schoolId;
    }

    if (ctx?.campusId) {
      targetCampusId = ctx.campusId;
    } else if (campusId && campusId !== "ALL" && campusId !== "") {
      targetCampusId = campusId;
    }

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

    const classRoomWhere: any = {};
    if (targetSchoolId) classRoomWhere.schoolId = targetSchoolId;
    if (targetCampusId) classRoomWhere.campusId = targetCampusId;
    if (gradeLevel) classRoomWhere.gradeLevel = gradeLevel;

    if (Object.keys(classRoomWhere).length > 0) {
      where.classRoom = classRoomWhere;
    }

    const plans = await prisma.lessonPlan.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: { select: { name: true, school: { select: { id: true, name: true } }, campus: { select: { id: true, name: true } } } },
          },
        },
        subject: { select: { name: true } },
        classRoom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            campusId: true,
            schoolId: true,
            campus: { select: { id: true, name: true } },
            school: { select: { id: true, name: true } },
          },
        },
        reviews: { orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return plans.map((p) => ({
      id: p.id,
      teacherName: p.teacher?.user?.name || "Giáo viên",
      schoolName: p.classRoom?.school?.name || (p.teacher?.user as any)?.school?.name || "Toàn trường",
      campusId: p.classRoom?.campusId || (p.teacher?.user as any)?.campus?.id || null,
      campusName: p.classRoom?.campus?.name || (p.teacher?.user as any)?.campus?.name || "Điểm Trung tâm",
      subjectName: p.subject?.name || "Môn học",
      className: p.classRoom?.name || "Lớp học",
      gradeLevel: p.classRoom?.gradeLevel || 1,
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

// Lấy danh sách các phân hiệu trực thuộc
export async function getAdminCampuses(schoolId?: string) {
  try {
    const where = schoolId && schoolId !== "ALL" ? { schoolId } : {};
    return await prisma.campus.findMany({
      where,
      select: { id: true, name: true, schoolId: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching campuses for lesson plans:", error);
    return [];
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

