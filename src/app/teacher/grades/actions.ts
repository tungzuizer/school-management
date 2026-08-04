"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get teacher's teaching assignments (class + subject combos)
export async function getMyAssignments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: teacher.id },
    include: { classRoom: true, subject: true },
    orderBy: [{ classRoom: { gradeLevel: "asc" } }, { classRoom: { name: "asc" } }],
  });

  return assignments.map((a) => ({
    id: a.id,
    classId: a.classRoom.id,
    className: a.classRoom.name,
    gradeLevel: a.classRoom.gradeLevel,
    subjectId: a.subject.id,
    subjectName: a.subject.name,
  }));
}

// Get students with their grades for a class+subject+term
export async function getStudentGrades(classId: string, subjectId: string, term: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  // Verify access
  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId, subjectId },
  });
  if (!hasAccess) return [];

  const students = await prisma.student.findMany({
    where: { classId, status: "STUDYING" },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const grades = await prisma.grade.findMany({
    where: {
      subjectId,
      term,
      studentId: { in: students.map((s) => s.id) },
    },
  });

  // Map grades by student
  const gradesByStudent = new Map<string, any[]>();
  grades.forEach((g) => {
    const list = gradesByStudent.get(g.studentId) || [];
    list.push(g);
    gradesByStudent.set(g.studentId, list);
  });

  return students.map((s) => {
    const studentGrades = gradesByStudent.get(s.id) || [];
    const oral = studentGrades.find((g) => g.type === "ORAL");
    const fifteenMin = studentGrades.find((g) => g.type === "FIFTEEN_MIN");
    const midterm = studentGrades.find((g) => g.type === "MIDTERM");
    const final_ = studentGrades.find((g) => g.type === "FINAL");

    // Calculate average: Oral(1) + 15min(1) + Midterm(2) + Final(3) / 7
    let average: number | null = null;
    if (oral && fifteenMin && midterm && final_) {
      average =
        (oral.score * 1 + fifteenMin.score * 1 + midterm.score * 2 + final_.score * 3) / 7;
      average = Math.round(average * 100) / 100;
    }

    return {
      studentId: s.id,
      studentName: s.user.name,
      studentCode: (s as any).studentCode || null,
      oral: oral?.score ?? null,
      fifteenMin: fifteenMin?.score ?? null,
      midterm: midterm?.score ?? null,
      final: final_?.score ?? null,
      average,
      oralId: oral?.id || null,
      fifteenMinId: fifteenMin?.id || null,
      midtermId: midterm?.id || null,
      finalId: final_?.id || null,
    };
  });
}

// Save a single grade
export async function saveGrade(
  studentId: string,
  subjectId: string,
  term: number,
  type: string,
  score: number,
  existingId?: string | null
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  if (score < 0 || score > 10) return { success: false, error: "Điểm phải từ 0 đến 10" };

  try {
    if (existingId) {
      await prisma.grade.update({
        where: { id: existingId },
        data: { score },
      });
    } else {
      await prisma.grade.create({
        data: {
          studentId,
          subjectId,
          term,
          type: type as any,
          score,
        },
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi lưu điểm" };
  }
}

// Save all grades for a class at once (batch)
export async function saveAllGrades(
  subjectId: string,
  term: number,
  grades: {
    studentId: string;
    type: string;
    score: number;
    existingId?: string | null;
  }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  try {
    const operations = grades.map((g) => {
      if (g.existingId) {
        return prisma.grade.update({
          where: { id: g.existingId },
          data: { score: g.score },
        });
      } else {
        return prisma.grade.create({
          data: {
            studentId: g.studentId,
            subjectId,
            term,
            type: g.type as any,
            score: g.score,
          },
        });
      }
    });

    await prisma.$transaction(operations);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi lưu điểm" };
  }
}
