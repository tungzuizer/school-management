"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTeacherClassesAndStudents(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  const classMap = new Map<string, { id: string; name: string; students: { id: string; name: string; studentCode: string | null }[] }>();

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

  if (classMap.size === 0) {
    const allRooms = await prisma.classRoom.findMany({
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
      take: 25,
    });

    allRooms.forEach((cr) => {
      if (cr.students.length > 0) {
        classMap.set(cr.id, {
          id: cr.id,
          name: cr.name,
          students: cr.students.map((s) => ({
            id: s.id,
            name: s.user.name,
            studentCode: s.studentCode,
          })),
        });
      }
    });
  }

  return {
    classes: Array.from(classMap.values()),
  };
}

export async function createStudentCommendation(data: {
  teacherUserId: string;
  studentId: string;
  category: string;
  badgeTitle: string;
  description: string;
}) {
  try {
    const teacherUser = await prisma.user.findUnique({
      where: { id: data.teacherUserId },
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
      return { success: false, error: "Không tìm thấy học sinh." };
    }

    const fullDescription = `[Tuyên Dương: ${data.category}] - ${data.badgeTitle}: ${data.description}`;

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
        title: `🏆 Tuyên dương khen thưởng: ${data.badgeTitle}!`,
        content: `Chúc mừng ${student.user.name}! Thầy/Cô ${teacherUser.name} vừa gửi lời tuyên dương đến bạn: "${data.description}". Hãy tiếp tục phát huy nhé! 🎉`,
      },
    });

    revalidatePath("/teacher/commendations");
    revalidatePath("/teacher/dashboard");
    revalidatePath("/student/dashboard");

    return { success: true, incidentId: incident.id };
  } catch (error) {
    console.error("Error creating commendation:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo tuyên dương." };
  }
}

export async function getRecentCommendations(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });
  if (!teacher) return [];

  const teacherUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return prisma.incident.findMany({
    where: {
      type: "COMMENDATION",
      reportedBy: teacherUser?.name || undefined,
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
}
