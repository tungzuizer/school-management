"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isApprovedUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true },
  });
  return user?.isApproved !== false;
}

// Get teacher's teaching assignments (class + subject combos)
export async function getMyAssignments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userApproved = await isApprovedUser(session.user.id);
  if (!userApproved) return [];

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });

  if (teacher) {
    const assignments = await prisma.teachingAssignment.findMany({
      where: { teacherId: teacher.id },
      include: { classRoom: true, subject: true },
      orderBy: [{ classRoom: { gradeLevel: "asc" } }, { classRoom: { name: "asc" } }],
    });

    if (assignments.length > 0) {
      return assignments.map((a) => ({
        id: a.id,
        classId: a.classRoom.id,
        className: a.classRoom.name,
        gradeLevel: a.classRoom.gradeLevel,
        subjectId: a.subject.id,
        subjectName: a.subject.name,
      }));
    }
  }

  // If teacher has no explicit assignments or is unapproved, return empty array
  return [];
}

// Get students with their grades for a class+subject+term
export async function getStudentGrades(classId: string, subjectId: string, term: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userApproved = await isApprovedUser(session.user.id);
  if (!userApproved) return [];

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
    const oralList = studentGrades.filter((g) => g.type === "ORAL");
    const fifteenMinList = studentGrades.filter((g) => g.type === "FIFTEEN_MIN");
    const midterm = studentGrades.find((g) => g.type === "MIDTERM");
    const final_ = studentGrades.find((g) => g.type === "FINAL");

    const avgOral = oralList.length
      ? oralList.reduce((sum, g) => sum + g.score, 0) / oralList.length
      : null;
    const avg15Min = fifteenMinList.length
      ? fifteenMinList.reduce((sum, g) => sum + g.score, 0) / fifteenMinList.length
      : null;

    // Calculate average using all regular scores + midterm(weight 2) + final(weight 3)
    let average: number | null = null;
    const regularGrades = [...oralList, ...fifteenMinList];
    let totalWeight = regularGrades.length;
    let weightedSum = regularGrades.reduce((sum, g) => sum + g.score, 0);

    if (midterm) {
      weightedSum += midterm.score * 2;
      totalWeight += 2;
    }
    if (final_) {
      weightedSum += final_.score * 3;
      totalWeight += 3;
    }

    if (totalWeight > 0) {
      average = Math.round((weightedSum / totalWeight) * 100) / 100;
    }

    return {
      studentId: s.id,
      studentName: s.user.name,
      studentCode: (s as any).studentCode || null,
      oral: avgOral !== null ? Math.round(avgOral * 100) / 100 : null,
      fifteenMin: avg15Min !== null ? Math.round(avg15Min * 100) / 100 : null,
      midterm: midterm?.score ?? null,
      final: final_?.score ?? null,
      average,
      oralId: oralList[0]?.id || null,
      fifteenMinId: fifteenMinList[0]?.id || null,
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

  const userApproved = await isApprovedUser(session.user.id);
  if (!userApproved) {
    return { success: false, error: "Tài khoản của bạn đang chờ Hiệu trưởng phê duyệt và cấp quyền dữ liệu." };
  }

  if (score < 0 || score > 10) return { success: false, error: "Điểm phải từ 0 đến 10" };

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { classRoom: true },
    });
    if (!student) return { success: false, error: "Không tìm thấy thông tin học sinh" };

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher && session.user.role !== "ADMIN" && session.user.role !== "PRINCIPAL") {
      return { success: false, error: "Không tìm thấy hồ sơ giáo viên" };
    }

    if (teacher) {
      const isHomeroom = student.classRoom?.homeroomTeacherId === teacher.id;
      const isAssigned = await prisma.teachingAssignment.findFirst({
        where: { teacherId: teacher.id, classId: student.classId || undefined, subjectId },
      });
      if (!isAssigned && !isHomeroom && session.user.role !== "ADMIN" && session.user.role !== "PRINCIPAL") {
        return { success: false, error: "Bạn không được phân công giảng dạy môn học này cho lớp của học sinh." };
      }
    }

    if (student?.classRoom?.schoolId) {
      const isLocked = await prisma.dataLock.findFirst({
        where: {
          schoolId: student.classRoom.schoolId,
          lockType: `GRADE_HK${term}`,
          isLocked: true,
        },
      });
      if (isLocked) {
        return { success: false, error: `Dữ liệu điểm Học kỳ ${term} đã bị khóa sổ` };
      }
    }

    if (existingId) {
      await prisma.grade.update({
        where: { id: existingId },
        data: { score },
      });
    } else {
      const existing = await prisma.grade.findFirst({
        where: {
          studentId,
          subjectId,
          term,
          type: type as any,
        },
      });

      if (existing) {
        await prisma.grade.update({
          where: { id: existing.id },
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

  const userApproved = await isApprovedUser(session.user.id);
  if (!userApproved) {
    return { success: false, error: "Tài khoản của bạn đang chờ Hiệu trưởng phê duyệt và cấp quyền dữ liệu." };
  }

  try {
    for (const g of grades) {
      const res = await saveGrade(g.studentId, subjectId, term, g.type, g.score, g.existingId);
      if (!res.success) return res;
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi lưu điểm" };
  }
}
