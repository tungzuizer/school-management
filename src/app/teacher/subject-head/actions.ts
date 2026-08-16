"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
