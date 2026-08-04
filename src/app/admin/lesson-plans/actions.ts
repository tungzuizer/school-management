"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus, Role } from "@prisma/client";

// Get all lesson plans for the admin approval portal page
export async function getLessonPlansForAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    throw new Error("Không có quyền thực hiện chức năng này");
  }

  const plans = await prisma.lessonPlan.findMany({
    include: {
      teacher: {
        include: {
          user: { select: { name: true } }
        }
      },
      subject: { select: { name: true } },
      classRoom: { select: { name: true } },
    },
    orderBy: [
      // Sort: SUBMITTED first, then APPROVED, REJECTED, DRAFT
      { status: "asc" }, 
      { createdAt: "desc" }
    ],
  });

  // Filter out DRAFT plans, as admins only need to see SUBMITTED, APPROVED, or REJECTED
  const reviewablePlans = plans.filter(p => p.status !== LessonPlanStatus.DRAFT);

  return reviewablePlans.map(p => ({
    id: p.id,
    teacherName: p.teacher.user.name,
    subjectName: p.subject.name,
    className: p.classRoom.name,
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
    reviewNote: p.reviewNote || "",
    reviewedAt: p.reviewedAt,
    reviewedBy: p.reviewedBy,
  }));
}

// Approve or Reject a lesson plan
export async function reviewLessonPlan(data: {
  planId: string;
  status: "APPROVED" | "REJECTED";
  reviewNote: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return { success: false, error: "Không có quyền thực hiện chức năng này" };
  }

  if (data.status !== "APPROVED" && data.status !== "REJECTED") {
    return { success: false, error: "Trạng thái phê duyệt không hợp lệ" };
  }

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id: data.planId },
    });

    if (!existing) {
      return { success: false, error: "Không tìm thấy giáo án" };
    }

    if (existing.status !== LessonPlanStatus.SUBMITTED) {
      // Allow re-reviewing of already approved/rejected plans if needed, but restrict or handle gracefully
      // Let's allow updating the review as long as it's not draft
    }

    await prisma.lessonPlan.update({
      where: { id: data.planId },
      data: {
        status: data.status === "APPROVED" ? LessonPlanStatus.APPROVED : LessonPlanStatus.REJECTED,
        reviewNote: data.reviewNote,
        reviewedBy: session.user.name || "Ban Giám Hiệu",
        reviewedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing lesson plan:", error);
    return { success: false, error: "Không thể phê duyệt giáo án lỗi hệ thống: " + error.message };
  }
}
