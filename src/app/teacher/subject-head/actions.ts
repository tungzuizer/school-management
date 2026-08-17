"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { LessonPlanStatus } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";

export async function getHeadSubjectsAndRequests() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { headSubjects: [], requests: [] };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!teacher) {
    return { headSubjects: [], requests: [] };
  }

  // Fetch headSubjects and change requests concurrently in parallel
  const [headSubjects, requests] = await Promise.all([
    prisma.subject.findMany({
      where: { headTeacherId: teacher.id },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        _count: { select: { teachingAssignments: true } }
      }
    }),
    prisma.teacherChangeRequest.findMany({
      where: {
        subject: { headTeacherId: teacher.id }
      },
      select: {
        id: true,
        reason: true,
        status: true,
        reviewNote: true,
        createdAt: true,
        subject: { select: { id: true, name: true } },
        classRoom: { select: { id: true, name: true, gradeLevel: true } },
        currentTeacher: { select: { id: true, user: { select: { name: true } } } },
        newTeacher: { select: { id: true, user: { select: { name: true } } } },
        requestedBy: { select: { id: true, user: { select: { name: true } } } },
        approvedBy: { select: { id: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { headSubjects, requests };
}

export async function reviewTeacherChangeRequest(input: {
  requestId: string;
  approved: boolean;
  reviewNote?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Bạn chưa đăng nhập" };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!teacher) {
    return { success: false, error: "Không tìm thấy hồ sơ giáo viên" };
  }

  const changeRequest = await prisma.teacherChangeRequest.findUnique({
    where: { id: input.requestId },
    include: { subject: true }
  });

  if (!changeRequest) {
    return { success: false, error: "Không tìm thấy yêu cầu đổi giáo viên" };
  }

  if (changeRequest.subject.headTeacherId !== teacher.id) {
    return { success: false, error: "Bạn không phải Trưởng bộ môn của môn học này" };
  }

  const status = input.approved ? "APPROVED" : "CANCELLED";

  // Process transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update request status
    await tx.teacherChangeRequest.update({
      where: { id: input.requestId },
      data: {
        status,
        approvedById: teacher.id,
        reviewNote: input.reviewNote || null,
      }
    });

    // 2. If approved, update teaching assignment
    if (input.approved) {
      const assignment = await tx.teachingAssignment.findFirst({
        where: {
          subjectId: changeRequest.subjectId,
          classId: changeRequest.classId,
          teacherId: changeRequest.currentTeacherId,
        }
      });

      if (assignment) {
        await tx.teachingAssignment.update({
          where: { id: assignment.id },
          data: { teacherId: changeRequest.newTeacherId }
        });
      } else {
        await tx.teachingAssignment.create({
          data: {
            subjectId: changeRequest.subjectId,
            classId: changeRequest.classId,
            teacherId: changeRequest.newTeacherId
          }
        });
      }
    }
  });

  revalidatePath("/teacher/subject-head");
  revalidatePath("/admin/subjects");

  return { success: true };
}

export async function createTeacherChangeRequest(input: {
  subjectId: string;
  classId: string;
  currentTeacherId: string;
  newTeacherId: string;
  reason?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Bạn chưa đăng nhập" };
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });

  if (!teacher) {
    return { success: false, error: "Không tìm thấy hồ sơ giáo viên" };
  }

  try {
    await prisma.teacherChangeRequest.create({
      data: {
        subjectId: input.subjectId,
        classId: input.classId,
        currentTeacherId: input.currentTeacherId,
        newTeacherId: input.newTeacherId,
        requestedById: teacher.id,
        reason: input.reason || null,
        status: "PENDING",
      }
    });

    revalidatePath("/teacher/subject-head");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi gửi yêu cầu đổi giáo viên" };
  }
}

// ==================== GIÁO ÁN: Tổ trưởng chuyên môn phê duyệt ====================

// Lấy danh sách giáo án SUBMITTED thuộc các môn mà giáo viên này làm Tổ trưởng
export async function getHeadLessonPlans() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) return [];

  // Tìm môn mà giáo viên này là headTeacher
  const headSubjects = await prisma.subject.findMany({
    where: { headTeacherId: teacher.id },
    select: { id: true },
  });

  if (headSubjects.length === 0) return [];
  const subjectIds = headSubjects.map(s => s.id);

  try {
    const plans = await prisma.lessonPlan.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: {
          in: [
            LessonPlanStatus.SUBMITTED,
            LessonPlanStatus.HEAD_APPROVED,
            LessonPlanStatus.HEAD_REJECTED,
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

    return plans.map(p => ({
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
      reviews: p.reviews.map(r => ({
        id: r.id,
        reviewerName: r.reviewerName,
        reviewerRole: r.reviewerRole,
        action: r.action,
        comment: r.comment || "",
        createdAt: r.createdAt,
      })),
    }));
  } catch (error) {
    console.error("Error fetching head lesson plans:", error);
    return [];
  }
}

// Tổ trưởng duyệt giáo án (SUBMITTED → HEAD_APPROVED / HEAD_REJECTED)
export async function headReviewLessonPlan(data: {
  planId: string;
  approved: boolean;
  reviewNote: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) return { success: false, error: "Không tìm thấy giáo viên" };

  try {
    const plan = await prisma.lessonPlan.findUnique({
      where: { id: data.planId },
      include: { subject: { select: { headTeacherId: true } } },
    });
    if (!plan) return { success: false, error: "Không tìm thấy giáo án" };

    if (plan.subject.headTeacherId !== teacher.id) {
      return { success: false, error: "Bạn không phải Tổ trưởng chuyên môn của môn học này" };
    }

    if (plan.status !== LessonPlanStatus.SUBMITTED) {
      return { success: false, error: "Giáo án không ở trạng thái chờ Tổ trưởng duyệt" };
    }

    const newStatus = data.approved ? LessonPlanStatus.HEAD_APPROVED : LessonPlanStatus.HEAD_REJECTED;

    await prisma.$transaction([
      prisma.lessonPlan.update({
        where: { id: data.planId },
        data: {
          status: newStatus,
          reviewNote: data.reviewNote,
          reviewedBy: session.user.name || "Tổ trưởng CM",
          reviewedAt: new Date(),
        },
      }),
      prisma.lessonPlanReview.create({
        data: {
          lessonPlanId: data.planId,
          reviewerName: session.user.name || "Tổ trưởng CM",
          reviewerRole: "SUBJECT_HEAD",
          action: newStatus,
          comment: data.reviewNote,
        },
      }),
    ]);

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "",
      userRole: "SUBJECT_HEAD",
      action: data.approved ? "APPROVE" : "REJECT",
      entityName: "LessonPlan",
      entityId: data.planId,
      description: `Tổ trưởng CM ${data.approved ? "duyệt" : "từ chối"} giáo án: ${plan.title}`,
    });

    revalidatePath("/teacher/subject-head");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hệ thống: " + error.message };
  }
}
