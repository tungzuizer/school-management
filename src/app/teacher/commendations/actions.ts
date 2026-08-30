"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function isApprovedUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true },
  });
  return user?.isApproved !== false;
}

export async function getTeacherClassesAndStudents(userIdParam?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || userIdParam;
    if (!userId) return { classes: [] };

    if (!(await isApprovedUser(userId))) {
      return { classes: [] };
    }

    const teacherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, schoolId: true },
    });

    if (!teacherUser) return { classes: [] };

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });

    const classMap = new Map<
      string,
      {
        id: string;
        name: string;
        students: { id: string; name: string; studentCode: string | null }[];
      }
    >();

    if (teacher) {
      const homeroomClass = await prisma.classRoom.findFirst({
        where: { homeroomTeacherId: teacher.id },
        include: {
          students: {
            where: { status: "STUDYING" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { user: { name: "asc" } },
          },
        },
      });

      const assignments = await prisma.teachingAssignment.findMany({
        where: { teacherId: teacher.id },
        include: {
          classRoom: {
            include: {
              students: {
                where: { status: "STUDYING" },
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { user: { name: "asc" } },
              },
            },
          },
        },
      });

      if (homeroomClass) {
        classMap.set(homeroomClass.id, {
          id: homeroomClass.id,
          name: `${homeroomClass.name} (Chủ nhiệm)`,
          students: homeroomClass.students.map((s) => ({
            id: s.id,
            name: s.user.name,
            studentCode: s.studentCode,
          })),
        });
      }

      assignments.forEach((a) => {
        if (a.classRoom && !classMap.has(a.classRoom.id)) {
          classMap.set(a.classRoom.id, {
            id: a.classRoom.id,
            name: a.classRoom.name,
            students: a.classRoom.students.map((s) => ({
              id: s.id,
              name: s.user.name,
              studentCode: s.studentCode,
            })),
          });
        }
      });
    }

    // Fallback cho giáo viên tự do / giáo viên chưa phân công lớp
    if (classMap.size === 0) {
      const schoolWhere = teacherUser.schoolId ? { schoolId: teacherUser.schoolId } : {};
      const fallbackClasses = await prisma.classRoom.findMany({
        where: schoolWhere,
        include: {
          students: {
            where: { status: "STUDYING" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { user: { name: "asc" } },
          },
        },
        orderBy: { name: "asc" },
        take: 20,
      });

      fallbackClasses.forEach((c) => {
        classMap.set(c.id, {
          id: c.id,
          name: c.name,
          students: c.students.map((s) => ({
            id: s.id,
            name: s.user.name,
            studentCode: s.studentCode,
          })),
        });
      });
    }

    return {
      classes: Array.from(classMap.values()),
    };
  } catch (error) {
    console.error("Error in getTeacherClassesAndStudents:", error);
    return { classes: [] };
  }
}

export async function createStudentCommendation(data: {
  teacherUserId: string;
  studentId: string;
  category: string;
  badgeTitle: string;
  description: string;
  points?: number;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || data.teacherUserId;
  if (!userId) return { success: false, error: "Bạn chưa đăng nhập." };

  if (!(await isApprovedUser(userId))) {
    return { success: false, error: "Tài khoản của bạn đang chờ phê duyệt." };
  }

  try {
    const teacherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!teacherUser) {
      return { success: false, error: "Không tìm thấy thông tin giáo viên." };
    }

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        user: { select: { id: true, name: true } },
        classRoom: { select: { id: true, name: true } },
      },
    });
    if (!student || !student.classRoom) {
      return { success: false, error: "Không tìm thấy thông tin học sinh." };
    }

    const pts = data.points && data.points > 0 ? data.points : 2;

    // Cộng điểm thưởng tích cực
    await prisma.student.update({
      where: { id: student.id },
      data: { bonusPoints: { increment: pts } },
    });

    const fullDescription = `[Cộng Điểm Rèn Luyện: ${data.category}] - ${data.badgeTitle}: ${data.description} (+${pts} điểm)`;

    const incident = await prisma.incident.create({
      data: {
        studentId: student.id,
        classId: student.classRoom.id,
        date: new Date(),
        type: "COMMENDATION",
        description: fullDescription,
        reportedBy: teacherUser.name,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: teacherUser.id,
        receiverId: student.user.id,
        title: `⭐ Đánh giá & Cộng +${pts} điểm tích cực: ${data.badgeTitle}!`,
        content: `Chúc mừng ${student.user.name}! Thầy/Cô ${teacherUser.name} vừa tuyên dương tinh thần học tập: "${data.description}" (+${pts} điểm rèn luyện). Hãy tiếp tục phát huy nhé! 🎉`,
      },
    });

    revalidatePath("/teacher/commendations");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/student/dashboard");

    return { success: true, incidentId: incident.id, addedPoints: pts };
  } catch (error) {
    console.error("Error creating commendation:", error);
    return { success: false, error: "Đã xảy ra lỗi khi cộng điểm học sinh." };
  }
}

export async function getRecentCommendations(userIdParam?: string) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || userIdParam;
    if (!userId) return [];

    if (!(await isApprovedUser(userId))) return [];

    const teacherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!teacherUser) return [];

    const incidents = await prisma.incident.findMany({
      where: {
        type: "COMMENDATION",
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        classRoom: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    return incidents.map((inc) => ({
      id: inc.id,
      description: inc.description,
      date: inc.date.toISOString(),
      reportedBy: inc.reportedBy || teacherUser.name,
      studentName: inc.student.user.name,
      className: inc.classRoom?.name || "Lớp học",
    }));
  } catch (error) {
    console.error("Error in getRecentCommendations:", error);
    return [];
  }
}
