"use server";

import prisma from "@/lib/prisma";


export async function getClasses(search?: string, schoolId?: string, gradeLevel?: number) {
  try {
    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (schoolId) where.schoolId = schoolId;
    if (gradeLevel) where.gradeLevel = gradeLevel;

    return await prisma.classRoom.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        homeroomTeacher: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });
  } catch (err) {
    console.error("getClasses error:", err);
    return [];
  }
}

export async function getSchoolsForSelect() {
  try {
    return await prisma.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  } catch (err) {
    console.error("getSchoolsForSelect error:", err);
    return [];
  }
}

export async function getCampusesForSelect(schoolId?: string) {
  try {
    const where = schoolId ? { schoolId } : {};
    return await prisma.campus.findMany({ where, select: { id: true, name: true, schoolId: true }, orderBy: { name: "asc" } });
  } catch (err) {
    console.error("getCampusesForSelect error:", err);
    return [];
  }
}

export async function getTeachersForSelect() {
  try {
    return await prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
  } catch (err) {
    console.error("getTeachersForSelect error:", err);
    return [];
  }
}

export async function createClass(data: { name: string; gradeLevel: number; schoolId: string; campusId?: string; homeroomTeacherId?: string }) {
  try {
    await prisma.classRoom.create({ data });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo lớp" };
  }
}

export async function updateClass(id: string, data: { name: string; gradeLevel: number; schoolId: string; campusId?: string; homeroomTeacherId?: string }) {
  try {
    await prisma.classRoom.update({ where: { id }, data });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.classRoom.delete({ where: { id } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa lớp" };
  }
}

export interface BulkClassInput {
  name: string;
  gradeLevel?: number;
  schoolId?: string;
  schoolName?: string;
  campusId?: string;
  campusName?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
}

export async function createBulkClasses(classesData: BulkClassInput[], defaultSchoolId?: string) {
  try {
    if (!classesData || classesData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const schools = await prisma.school.findMany({ select: { id: true, name: true } });
    const campuses = await prisma.campus.findMany({ select: { id: true, name: true, schoolId: true } });
    const teachers = await prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true } } },
    });

    const fallbackSchoolId = defaultSchoolId || (schools.length > 0 ? schools[0].id : null);

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < classesData.length; i++) {
      const item = classesData[i];
      const rowNum = i + 1;

      if (!item.name || !item.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Tên lớp`);
        continue;
      }

      const className = item.name.trim();

      // Resolve grade level if not provided
      let gradeLevel = item.gradeLevel;
      if (!gradeLevel || isNaN(gradeLevel)) {
        const match = className.match(/(\d+)/);
        gradeLevel = match ? parseInt(match[1]) : 10;
      }

      // Resolve school
      let resolvedSchoolId = item.schoolId;
      if (!resolvedSchoolId && item.schoolName) {
        const found = schools.find(
          (s) => s.name.toLowerCase() === item.schoolName?.trim().toLowerCase()
        );
        if (found) resolvedSchoolId = found.id;
      }
      if (!resolvedSchoolId) resolvedSchoolId = fallbackSchoolId || undefined;

      if (!resolvedSchoolId) {
        errors.push(`Dòng ${rowNum} (${className}): Không xác định được Trường học`);
        continue;
      }

      // Resolve campus
      let resolvedCampusId = item.campusId;
      if (!resolvedCampusId && item.campusName) {
        const found = campuses.find(
          (c) => c.name.toLowerCase() === item.campusName?.trim().toLowerCase()
        );
        if (found) resolvedCampusId = found.id;
      }

      // Resolve teacher
      let resolvedTeacherId = item.homeroomTeacherId;
      if (!resolvedTeacherId && item.homeroomTeacherName) {
        const found = teachers.find(
          (t) => t.user.name.toLowerCase() === item.homeroomTeacherName?.trim().toLowerCase()
        );
        if (found) resolvedTeacherId = found.id;
      }

      try {
        await prisma.classRoom.create({
          data: {
            name: className,
            gradeLevel,
            schoolId: resolvedSchoolId,
            campusId: resolvedCampusId || undefined,
            homeroomTeacherId: resolvedTeacherId || undefined,
          },
        });
        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${className}): Lỗi - ${err.message}`);
      }
    }

    
    return {
      success: createdCount > 0,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi nhập hàng loạt lớp học", count: 0 };
  }
}
