"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudentEmail } from "@/lib/student-email";

export interface TeacherStudentData {
  id: string;
  studentCode: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  status: string;
  ethnicity: string | null;
  addressCurrent: string | null;
  fatherName: string | null;
  motherName: string | null;
  isClassMonitor: boolean;
  bonusPoints: number;
  user: { id: string; name: string; email: string };
  classRoom: { id: string; name: string; gradeLevel: number } | null;
  group: { id: string; name: string } | null;
}

export interface BulkStudentRow {
  name: string;
  studentCode?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  email?: string;
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

export async function getTeacherClassesAndStudents() {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { classes: [], students: [] };

    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUser.id },
    });

    let classes: { id: string; name: string; gradeLevel: number; isHomeroom: boolean }[] = [];
    const classIds = new Set<string>();

    if (teacher) {
      // Homeroom class
      const homeroomClass = await prisma.classRoom.findFirst({
        where: { homeroomTeacherId: teacher.id },
        select: { id: true, name: true, gradeLevel: true },
      });

      if (homeroomClass) {
        classes.push({ ...homeroomClass, isHomeroom: true });
        classIds.add(homeroomClass.id);
      }

      // Teaching assignment classes
      const assignments = await prisma.teachingAssignment.findMany({
        where: { teacherId: teacher.id },
        select: {
          classRoom: { select: { id: true, name: true, gradeLevel: true } },
        },
      });

      for (const a of assignments) {
        if (a.classRoom && !classIds.has(a.classRoom.id)) {
          classes.push({ ...a.classRoom, isHomeroom: false });
          classIds.add(a.classRoom.id);
        }
      }
    }

    // Fallback: If teacher has no assigned classes yet, fetch/create independent class
    if (classes.length === 0 && teacherUser.schoolId) {
      const schoolClasses = await prisma.classRoom.findMany({
        where: { schoolId: teacherUser.schoolId },
        select: { id: true, name: true, gradeLevel: true },
        take: 20,
      });

      for (const c of schoolClasses) {
        classes.push({ ...c, isHomeroom: false });
        classIds.add(c.id);
      }
    }

    if (classIds.size === 0) {
      return { classes: [], students: [] };
    }

    const students = await prisma.student.findMany({
      where: {
        classId: { in: Array.from(classIds) },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        classRoom: { select: { id: true, name: true, gradeLevel: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: [
        { isClassMonitor: "desc" },
        { user: { name: "asc" } },
      ],
    });

    const formattedStudents: TeacherStudentData[] = students.map((s) => ({
      id: s.id,
      studentCode: s.studentCode,
      dob: s.dob ? s.dob.toISOString().split("T")[0] : null,
      gender: s.gender,
      phone: s.phone,
      status: s.status,
      ethnicity: s.ethnicity,
      addressCurrent: s.addressCurrent,
      fatherName: s.fatherName,
      motherName: s.motherName,
      isClassMonitor: s.isClassMonitor,
      bonusPoints: s.bonusPoints,
      user: s.user,
      classRoom: s.classRoom,
      group: s.group,
    }));

    return { classes, students: formattedStudents };
  } catch (error) {
    console.error("Error in getTeacherClassesAndStudents:", error);
    return { classes: [], students: [] };
  }
}

export async function createSingleStudent(data: {
  classId: string;
  name: string;
  studentCode?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE";
  phone?: string;
  email?: string;
}) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Tài khoản không đủ quyền." };

    const name = data.name.trim();
    if (!name) return { success: false, error: "Tên học sinh là bắt buộc." };

    const code = (data.studentCode && data.studentCode.trim()) || `HS${Date.now().toString().slice(-6)}`;
    const email = (data.email && data.email.trim()) || generateStudentEmail(name, code);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: `Email ${email} đã tồn tại trên hệ thống.` };
    }

    const defaultPassword = "abc123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        isApproved: true,
        schoolId: teacherUser.schoolId || undefined,
        student: {
          create: {
            studentCode: code,
            classId: data.classId,
            dob: data.dob ? new Date(data.dob) : null,
            gender: data.gender || null,
            phone: data.phone || null,
          },
        },
      },
      include: { student: true },
    });

    return { success: true, studentId: newUser.student?.id };
  } catch (error: any) {
    console.error("Error creating student:", error);
    return { success: false, error: error.message || "Lỗi khi thêm học sinh." };
  }
}

export async function importBulkStudents(classId: string, rows: BulkStudentRow[]) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Tài khoản không đủ quyền.", count: 0 };
    if (!classId) return { success: false, error: "Chưa chọn lớp học.", count: 0 };
    if (!rows || rows.length === 0) return { success: false, error: "Danh sách nhập rỗng.", count: 0 };

    let createdCount = 0;
    const errors: string[] = [];
    const defaultPassword = "abc123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name ? row.name.trim() : "";
      if (!name) continue;

      const code = (row.studentCode && row.studentCode.trim()) || `HS${Date.now().toString().slice(-6)}${i}`;
      const email = (row.email && row.email.trim()) || generateStudentEmail(name, code);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        errors.push(`Dòng ${i + 1}: Email ${email} đã tồn tại.`);
        continue;
      }

      let genderEnum: "MALE" | "FEMALE" | null = null;
      if (row.gender) {
        const g = row.gender.trim().toLowerCase();
        if (g.includes("nam")) genderEnum = "MALE";
        else if (g.includes("nữ") || g.includes("nu")) genderEnum = "FEMALE";
      }

      try {
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "STUDENT",
            isApproved: true,
            schoolId: teacherUser.schoolId || undefined,
            student: {
              create: {
                studentCode: code,
                classId,
                dob: row.dob ? new Date(row.dob) : null,
                gender: genderEnum,
                phone: row.phone || null,
              },
            },
          },
        });
        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 1}: ${err.message || "Lỗi tạo học sinh"}`);
      }
    }

    return {
      success: true,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    console.error("Error bulk importing students:", error);
    return { success: false, error: error.message || "Lỗi nhập danh sách học sinh.", count: 0 };
  }
}

export async function resetStudentPasswordTeacher(studentId: string, newPassword = "abc123") {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Chưa đăng nhập" };

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: student.userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error resetting student password:", error);
    return { success: false, error: "Không thể cấp lại mật khẩu" };
  }
}

export async function deleteStudentTeacher(studentId: string) {
  try {
    const teacherUser = await getTeacherUser();
    if (!teacherUser) return { success: false, error: "Chưa đăng nhập" };

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.user.delete({
      where: { id: student.userId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return { success: false, error: "Không thể xóa học sinh" };
  }
}
