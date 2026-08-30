"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface SeatStudent {
  id: string;
  studentCode: string | null;
  name: string;
  email: string;
  bonusPoints: number;
  isClassMonitor: boolean;
  seatPosition?: string; // e.g. "Hàng A - Ghế 3"
}

export interface EvaluationLog {
  id: string;
  studentId: string;
  studentName: string;
  type: "COMMENDATION" | "VIOLATION";
  description: string;
  reportedBy: string | null;
  date: string;
}

async function getTeacherUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, isApproved: true, schoolId: true },
  });
  if (!user || user.isApproved === false) return null;
  return user;
}

export async function getCinemaClassAndStudents(classIdParam?: string) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { classRoom: null, classes: [], students: [], layoutJson: null, logs: [] };

    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUser.id },
    });

    let classes: { id: string; name: string; gradeLevel: number }[] = [];
    let selectedClassId = classIdParam;

    if (teacher) {
      const homeroomClass = await prisma.classRoom.findFirst({
        where: { homeroomTeacherId: teacher.id },
        select: { id: true, name: true, gradeLevel: true },
      });
      if (homeroomClass) {
        classes.push(homeroomClass);
        if (!selectedClassId) selectedClassId = homeroomClass.id;
      }

      const assignments = await prisma.teachingAssignment.findMany({
        where: { teacherId: teacher.id },
        select: { classRoom: { select: { id: true, name: true, gradeLevel: true } } },
      });

      for (const a of assignments) {
        if (a.classRoom && !classes.some((c) => c.id === a.classRoom.id)) {
          classes.push(a.classRoom);
        }
      }
    }

    // Fallback: If teacher has no homeroom or assignments, query school classes from DB
    if (classes.length === 0) {
      const schoolClasses = await prisma.classRoom.findMany({
        where: teacherUser.schoolId ? { schoolId: teacherUser.schoolId } : undefined,
        select: { id: true, name: true, gradeLevel: true },
        take: 50,
        orderBy: { name: "asc" },
      });

      for (const c of schoolClasses) {
        if (!classes.some((existing) => existing.id === c.id)) {
          classes.push(c);
        }
      }
    }

    if (!selectedClassId && classes.length > 0) {
      // Find the first class that has students in the database
      const classWithStudents = await prisma.student.findFirst({
        where: { classId: { in: classes.map((c) => c.id) } },
        select: { classId: true },
      });
      if (classWithStudents?.classId) {
        selectedClassId = classWithStudents.classId;
      } else {
        selectedClassId = classes[0].id;
      }
    }

    if (!selectedClassId) {
      return { classRoom: null, classes: [], students: [], layoutJson: null, logs: [] };
    }

    const classRoom = await prisma.classRoom.findUnique({
      where: { id: selectedClassId },
      select: { id: true, name: true, gradeLevel: true },
    });

    const dbStudents = await prisma.student.findMany({
      where: { classId: selectedClassId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { isClassMonitor: "desc" },
        { user: { name: "asc" } },
      ],
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const chart = await prisma.seatingChart.findUnique({
      where: { classId_month_year: { classId: selectedClassId, month, year } },
    });

    const incidents = await prisma.incident.findMany({
      where: { classId: selectedClassId },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
      orderBy: { date: "desc" },
      take: 25,
    });

    const students: SeatStudent[] = dbStudents.map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      name: s.user.name,
      email: s.user.email,
      bonusPoints: s.bonusPoints,
      isClassMonitor: s.isClassMonitor,
    }));

    const logs: EvaluationLog[] = incidents.map((inc) => ({
      id: inc.id,
      studentId: inc.studentId,
      studentName: inc.student.user.name,
      type: inc.type as "COMMENDATION" | "VIOLATION",
      description: inc.description,
      reportedBy: inc.reportedBy,
      date: inc.date.toISOString(),
    }));

    return {
      classRoom,
      classes,
      students,
      layoutJson: chart?.layoutJson || null,
      logs,
    };
  } catch (error) {
    console.error("Error in getCinemaClassAndStudents:", error);
    return { classRoom: null, classes: [], students: [], layoutJson: null, logs: [] };
  }
}

export async function saveCinemaSeatingLayout(classId: string, layoutJson: string) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Chưa đăng nhập" };

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.seatingChart.upsert({
      where: { classId_month_year: { classId, month, year } },
      update: { layoutJson, version: { increment: 1 } },
      create: { classId, month, year, layoutJson },
    });

    revalidatePath("/teacher/seating-cinema");
    revalidatePath("/student/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error saving cinema seating chart:", error);
    return { success: false, error: "Không thể lưu sơ đồ chỗ ngồi" };
  }
}

export async function evaluateStudentSeatPoint(data: {
  studentId: string;
  classId: string;
  points: number; // e.g. +5, +3, +2, -1, -2
  category: string; // e.g. "Hát hay/Đóng góp văn nghệ", "Phát biểu xuất sắc", "Giúp đỡ bạn", "Làm bài tốt", "Nhắc nhở"
  badgeTitle: string;
  description: string;
  seatLabel?: string; // e.g. "Hàng A - Ghế 3"
}) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Chưa đăng nhập" };

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    // Update cumulative bonus points
    const updatedBonus = Math.max(0, student.bonusPoints + data.points);
    await prisma.student.update({
      where: { id: data.studentId },
      data: { bonusPoints: updatedBonus },
    });

    const isPositive = data.points >= 0;
    const type = isPositive ? "COMMENDATION" : "VIOLATION";
    const seatInfoStr = data.seatLabel ? ` [Chỗ ngồi: ${data.seatLabel}]` : "";
    const fullDesc = `[Cinema Rạp Phim${seatInfoStr}] ${data.badgeTitle}: ${data.description} (${data.points >= 0 ? "+" : ""}${data.points} điểm)`;

    // Timestamped Incident log
    const now = new Date();
    const incident = await prisma.incident.create({
      data: {
        studentId: student.id,
        classId: data.classId,
        date: now,
        type,
        description: fullDesc,
        reportedBy: teacherUser.name,
      },
    });

    // Notify Student
    await prisma.notification.create({
      data: {
        senderId: teacherUser.id,
        receiverId: student.user.id,
        title: isPositive
          ? `🎬 Tuyên dương Cinema Rạp Phim: +${data.points} điểm!`
          : `⚠️ Nhắc nhở nếp sống Cinema Rạp Phim: ${data.points} điểm`,
        content: `Thầy/Cô ${teacherUser.name} vừa đánh giá tại sơ đồ rạp chiếu phim (${data.seatLabel || "Ghế học"}): "${data.description}". Mốc thời gian: ${now.toLocaleTimeString("vi-VN")} ${now.toLocaleDateString("vi-VN")}.`,
      },
    });

    revalidatePath("/teacher/seating-cinema");
    revalidatePath("/teacher/homeroom");
    revalidatePath("/student/dashboard");

    return { success: true, newPoints: updatedBonus, incidentId: incident.id, timestamp: now.toISOString() };
  } catch (error: any) {
    console.error("Error evaluating student seat point:", error);
    return { success: false, error: "Lỗi khi lưu đánh giá chỗ ngồi" };
  }
}
