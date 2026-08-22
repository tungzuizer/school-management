"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper: lấy student từ session user (có fallback nếu chưa gán student)
async function getStudentFromSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    let student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        classRoom: {
          include: {
            school: true,
          },
        },
      },
    });



    if (!student) return null;

    return { student, userId: session.user.id };
  } catch (error) {
    console.error("Error in getStudentFromSession:", error);
    return null;
  }
}

// Dashboard data
export async function getStudentDashboardData() {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student, userId } = result;

    // Lấy điểm trung bình tất cả môn
    const grades = await prisma.grade.findMany({
      where: { studentId: student.id },
    });

    let avgScore = 0;
    if (grades.length > 0) {
      avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
    }

    // Đếm ngày vắng (30 ngày gần nhất)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const absentDays = await prisma.attendance.count({
      where: {
        studentId: student.id,
        status: { in: ["ABSENT_EXCUSED" as const, "ABSENT_UNEXCUSED" as const] },
        date: { gte: thirtyDaysAgo },
      },
    });

    const lateDays = await prisma.attendance.count({
      where: {
        studentId: student.id,
        status: "LATE" as const,
        date: { gte: thirtyDaysAgo },
      },
    });

    // Xếp loại học lực (dựa trên điểm TB)
    let academicRating = "Chưa xếp loại";
    if (grades.length > 0) {
      if (avgScore >= 8.0) academicRating = "Giỏi";
      else if (avgScore >= 6.5) academicRating = "Khá";
      else if (avgScore >= 5.0) academicRating = "Đạt";
      else academicRating = "Chưa đạt";
    }

        // Danh sách tuyên dương khen thưởng của học sinh
    const commendations = await prisma.incident.findMany({
      where: {
        studentId: student.id,
        type: "COMMENDATION",
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Thông báo mới nhất
    const recentNotifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sender: { select: { name: true, role: true } },
      },
    });

    // Lịch hôm nay
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=CN, 1=T2...
    const todaySchedule = student.classId
      ? await prisma.schedule.findMany({
          where: {
            classId: student.classId,
            dayOfWeek: dayOfWeek,
          },
          include: {
            subject: true,
            teacher: { include: { user: true } },
          },
          orderBy: { period: "asc" },
        })
      : [];

    return {
      student: {
        id: student.id,
        name: student.user.name,
        className: student.classRoom?.name || "Chưa phân lớp",
        schoolName: student.classRoom?.school?.name || "",
        studentCode: (student as Record<string, unknown>).studentCode as string | null,
      },
      stats: {
        avgScore: Math.round(avgScore * 100) / 100,
        absentDays,
        lateDays,
        academicRating,
        totalGrades: grades.length,
      },
            commendations: commendations.map((c) => ({
        id: c.id,
        description: c.description,
        date: c.date.toISOString(),
        reportedBy: c.reportedBy || "Giáo viên",
      })),
      recentNotifications: recentNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        senderName: n.sender?.name || "Hệ thống",
        createdAt: n.createdAt.toISOString(),
      })),
      todaySchedule: todaySchedule.map((s) => ({
        period: s.period,
        subjectName: s.subject.name,
        teacherName: s.teacher?.user?.name || "Giáo viên",
        room: s.room,
      })),
    };
  } catch (error) {
    console.error("Error in getStudentDashboardData:", error);
    return null;
  }
}

// Bảng điểm
export async function getStudentGrades(term?: number) {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student } = result;

    const whereClause: Record<string, unknown> = { studentId: student.id };
    if (term) whereClause.term = term;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
      orderBy: [{ subject: { name: "asc" } }, { type: "asc" }],
    });

    // Nhóm theo môn học
    const gradesBySubject: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        grades: { type: string; score: number; term: number }[];
        avgScore: number;
      }
    > = {};

    grades.forEach((g) => {
      if (!gradesBySubject[g.subjectId]) {
        gradesBySubject[g.subjectId] = {
          subjectId: g.subjectId,
          subjectName: g.subject.name,
          grades: [],
          avgScore: 0,
        };
      }
      gradesBySubject[g.subjectId].grades.push({
        type: g.type,
        score: g.score,
        term: g.term,
      });
    });

    // Tính điểm TB từng môn (có hệ số)
    Object.values(gradesBySubject).forEach((subject) => {
      let totalWeighted = 0;
      let totalWeight = 0;
      subject.grades.forEach((g) => {
        let weight = 1;
        if (g.type === "MIDTERM") weight = 2;
        if (g.type === "FINAL") weight = 3;
        totalWeighted += g.score * weight;
        totalWeight += weight;
      });
      subject.avgScore =
        totalWeight > 0
          ? Math.round((totalWeighted / totalWeight) * 100) / 100
          : 0;
    });

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "",
      subjects: Object.values(gradesBySubject),
    };
  } catch (error) {
    console.error("Error in getStudentGrades:", error);
    return null;
  }
}

// Điểm danh
export async function getStudentAttendance(month?: number, year?: number) {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student } = result;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: "asc" }, { period: "asc" }],
    });

    // Thống kê
    const totalPresent = attendances.filter(
      (a) => String(a.status) === "PRESENT"
    ).length;
    const totalAbsentExcused = attendances.filter(
      (a) => String(a.status) === "ABSENT_EXCUSED"
    ).length;
    const totalAbsentUnexcused = attendances.filter(
      (a) => String(a.status) === "ABSENT_UNEXCUSED"
    ).length;
    const totalLate = attendances.filter(
      (a) => String(a.status) === "LATE"
    ).length;

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "",
      month: targetMonth,
      year: targetYear,
      records: attendances.map((a) => ({
        id: a.id,
        date: a.date.toISOString().split("T")[0],
        period: a.period,
        status: String(a.status),
        note: a.note,
      })),
      summary: {
        total: attendances.length,
        present: totalPresent,
        absentExcused: totalAbsentExcused,
        absentUnexcused: totalAbsentUnexcused,
        late: totalLate,
        attendanceRate:
          attendances.length > 0
            ? Math.round((totalPresent / attendances.length) * 100)
            : 100,
      },
    };
  } catch (error) {
    console.error("Error in getStudentAttendance:", error);
    return null;
  }
}

// Thời khóa biểu
export async function getStudentSchedule() {
  try {
    const result = await getStudentFromSession();
    if (!result?.student || !result.student.classId) return null;
    const { student } = result;

    const schedules = await prisma.schedule.findMany({
      where: { classId: student.classId! },
      include: {
        subject: true,
        teacher: { include: { user: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
    });

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "",
      schedules: schedules.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        period: s.period,
        subjectName: s.subject.name,
        teacherName: s.teacher?.user?.name || "Giáo viên",
        room: s.room,
      })),
    };
  } catch (error) {
    console.error("Error in getStudentSchedule:", error);
    return null;
  }
}
