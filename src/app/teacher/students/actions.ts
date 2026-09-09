/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/teacher/students/page.tsx`, `src/app/teacher/students/components/TeacherAddStudentModal.tsx`, `src/app/teacher/students/components/TeacherBulkImportModal.tsx`.
 * 2. Affected APIs: `createSingleStudent`, `importBulkStudents`, `getTeacherClassesAndStudents`.
 * 3. Data Schemas: Prisma models `User`, `Student`, `ClassRoom`.
 * 4. Verbatim User Instruction: "tôi cần tọa thuật toán tự động hóa thêm học sinh hay giáo viên sẽ tự tạo tài khoản".
 */

"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudentEmail } from "@/lib/student-email";
import { resolveUniqueStudentCodeAndEmail, previewNextStudentCodeAndEmail, DEFAULT_INITIAL_PASSWORD } from "@/lib/account-automation";

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

export async function getNextStudentCodePreviewAction(classId?: string, gradeLevel?: number) {
  try {
    let resolvedGrade = gradeLevel;
    if (classId && !resolvedGrade) {
      const cls = await prisma.classRoom.findUnique({
        where: { id: classId },
        select: { gradeLevel: true },
      });
      if (cls?.gradeLevel) resolvedGrade = cls.gradeLevel;
    }

    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : "")).filter(Boolean)
    );

    const preview = previewNextStudentCodeAndEmail(existingCodes, resolvedGrade);
    return { success: true, ...preview };
  } catch (error: any) {
    return { success: false, studentCode: "HS26100001", email: "hs26100001@gmail.com" };
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

    let gradeLevel: number | undefined;
    if (data.classId) {
      const cls = await prisma.classRoom.findUnique({
        where: { id: data.classId },
        select: { gradeLevel: true },
      });
      if (cls?.gradeLevel) gradeLevel = cls.gradeLevel;
    }

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : "")).filter(Boolean)
    );

    const { studentCode: resolvedCode, email: resolvedEmail } = resolveUniqueStudentCodeAndEmail(
      existingCodes,
      existingEmails,
      {
        preferredCode: data.studentCode,
        preferredEmail: data.email,
        name,
        gradeLevel,
      }
    );

    const defaultPassword = DEFAULT_INITIAL_PASSWORD;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: resolvedEmail,
        password: hashedPassword,
        role: "STUDENT",
        isApproved: true,
        mustChangePassword: true,
        schoolId: teacherUser.schoolId || undefined,
        student: {
          create: {
            studentCode: resolvedCode,
            classId: data.classId,
            dob: data.dob ? new Date(data.dob) : null,
            gender: data.gender || null,
            phone: data.phone || null,
          },
        },
      },
      include: { student: true },
    });

    return { success: true, studentId: newUser.student?.id, studentCode: resolvedCode, email: resolvedEmail };
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

    let gradeLevel: number | undefined;
    const cls = await prisma.classRoom.findUnique({
      where: { id: classId },
      select: { gradeLevel: true },
    });
    if (cls?.gradeLevel) gradeLevel = cls.gradeLevel;

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : "")).filter(Boolean)
    );

    let createdCount = 0;
    const errors: string[] = [];
    const defaultPassword = DEFAULT_INITIAL_PASSWORD;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name ? row.name.trim() : "";
      if (!name) continue;

      const { studentCode: resolvedCode, email: resolvedEmail } = resolveUniqueStudentCodeAndEmail(
        existingCodes,
        existingEmails,
        {
          preferredCode: row.studentCode,
          preferredEmail: row.email,
          name,
          gradeLevel,
          startSequence: i + 1,
        }
      );

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
            email: resolvedEmail,
            password: hashedPassword,
            role: "STUDENT",
            isApproved: true,
            mustChangePassword: true,
            schoolId: teacherUser.schoolId || undefined,
            student: {
              create: {
                studentCode: resolvedCode,
                classId,
                dob: row.dob ? new Date(row.dob) : null,
                gender: genderEnum,
                phone: row.phone || null,
              },
            },
          },
        });

        existingEmails.add(resolvedEmail.toLowerCase());
        existingCodes.add(resolvedCode.toLowerCase());
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
