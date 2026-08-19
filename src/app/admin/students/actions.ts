"use server";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";

export async function getStudents(search?: string, classId?: string, gradeLevel?: number, schoolId?: string) {
  const where: any = {};

  if (schoolId) {
    where.classRoom = { ...(where.classRoom || {}), schoolId };
  } else {
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) {
        where.classRoom = { ...(where.classRoom || {}), schoolId: ctx.schoolId };
      }
    } catch { /* allow unauthenticated for demo */ }
  }

  if (search) {
    where.user = { name: { contains: search, mode: "insensitive" } };
  }
  if (classId) {
    where.classId = classId;
  }
  if (gradeLevel) {
    where.classRoom = { ...(where.classRoom || {}), gradeLevel };
  }
  return prisma.student.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      classRoom: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          school: { select: { id: true, name: true } },
        },
      },
      group: { select: { id: true, name: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 200,
  });
}

export async function getClassesForSelect(schoolId?: string) {
  const where: any = {};
  if (schoolId) where.schoolId = schoolId;
  return prisma.classRoom.findMany({
    where,
    select: { id: true, name: true, gradeLevel: true, schoolId: true, school: { select: { id: true, name: true } } },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export async function getSchoolsForSelect() {
  return prisma.school.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createStudent(data: {
  name: string;
  email: string;
  password: string;
  studentCode?: string;
  classId?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  ethnicity?: string;
  addressCurrent?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email đã tồn tại" };

    if (data.studentCode) {
      const existingCode = await prisma.student.findFirst({ where: { studentCode: data.studentCode } });
      if (existingCode) return { success: false, error: "Mã học sinh đã tồn tại" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            studentCode: data.studentCode || undefined,
            classId: data.classId || undefined,
            dob: data.dob ? new Date(data.dob) : undefined,
            gender: data.gender as any || undefined,
            phone: data.phone || undefined,
            ethnicity: data.ethnicity || undefined,
            addressCurrent: data.addressCurrent || undefined,
            fatherName: data.fatherName || undefined,
            fatherJob: data.fatherJob || undefined,
            motherName: data.motherName || undefined,
            motherJob: data.motherJob || undefined,
          },
        },
      },
    });
    

    // Audit Log
    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "CREATE", entityName: "Student",
        description: `Tạo học sinh: ${data.name} (${data.email})`,
      });
    } catch { /* skip audit if no session */ }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo học sinh" };
  }
}

export async function updateStudent(
  studentId: string,
  data: {
    name: string;
    email: string;
    studentCode?: string;
    classId?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    ethnicity?: string;
    addressCurrent?: string;
    fatherName?: string;
    fatherJob?: string;
    motherName?: string;
    motherJob?: string;
    status?: string;
  }
) {
  try {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: { name: data.name, email: data.email },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: {
          studentCode: data.studentCode || undefined,
          classId: data.classId || null,
          dob: data.dob ? new Date(data.dob) : undefined,
          gender: data.gender as any || undefined,
          phone: data.phone || undefined,
          ethnicity: data.ethnicity || undefined,
          addressCurrent: data.addressCurrent || undefined,
          fatherName: data.fatherName || undefined,
          fatherJob: data.fatherJob || undefined,
          motherName: data.motherName || undefined,
          motherJob: data.motherJob || undefined,
          status: data.status as any || undefined,
        },
      }),
    ]);
    

    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "UPDATE", entityName: "Student", entityId: studentId,
        description: `Cập nhật học sinh: ${data.name}`,
      });
    } catch { /* skip */ }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteStudent(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.user.delete({ where: { id: student.userId } });
    

    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "DELETE", entityName: "Student", entityId: studentId,
        description: `Xóa học sinh ID: ${studentId}`,
      });
    } catch { /* skip */ }

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xóa học sinh:", error);
    return { success: false, error: error.message || "Không thể xóa học sinh" };
  }
}

export interface BulkStudentInput {
  name: string;
  email?: string;
  studentCode?: string;
  classId?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  ethnicity?: string;
  addressCurrent?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
}

export async function createBulkStudents(studentsData: BulkStudentInput[]) {
  try {
    if (!studentsData || studentsData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const defaultPasswordHash = await bcrypt.hash("123456", 10);

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : ""))
    );

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < studentsData.length; i++) {
      const s = studentsData[i];
      const rowNum = i + 1;

      if (!s.name || !s.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Họ tên`);
        continue;
      }

      let email = s.email?.trim().toLowerCase();
      let code = s.studentCode?.trim();

      if (code && existingCodes.has(code.toLowerCase())) {
        errors.push(`Dòng ${rowNum}: Mã HS "${code}" đã tồn tại trong hệ thống`);
        continue;
      }

      if (!email) {
        const cleanCode = code ? code.toLowerCase() : Math.random().toString(36).substring(2, 7);
        email = `hs.${cleanCode}@school.edu.vn`;
      }

      if (existingEmails.has(email)) {
        errors.push(`Dòng ${rowNum}: Email "${email}" đã tồn tại trong hệ thống`);
        continue;
      }

      try {
        await prisma.user.create({
          data: {
            name: s.name.trim(),
            email,
            password: defaultPasswordHash,
            role: "STUDENT",
            student: {
              create: {
                studentCode: code || undefined,
                classId: s.classId || undefined,
                dob: s.dob ? new Date(s.dob) : undefined,
                gender: (s.gender as any) || undefined,
                phone: s.phone || undefined,
                ethnicity: s.ethnicity || undefined,
                addressCurrent: s.addressCurrent || undefined,
                fatherName: s.fatherName || undefined,
                fatherJob: s.fatherJob || undefined,
                motherName: s.motherName || undefined,
                motherJob: s.motherJob || undefined,
              },
            },
          },
        });

        existingEmails.add(email);
        if (code) existingCodes.add(code.toLowerCase());
        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${s.name}): Lỗi - ${err.message}`);
      }
    }

    
    return {
      success: createdCount > 0,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi nhập hàng loạt", count: 0 };
  }
}
