"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to resolve effective schoolId for Admin
async function getEffectiveSchoolId() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    if (session.user.schoolId) return session.user.schoolId;

    if (session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { schoolId: true },
      });
      if (dbUser?.schoolId) return dbUser.schoolId;
    }

    const firstSchool = await prisma.school.findFirst({ select: { id: true } });
    if (firstSchool?.id) return firstSchool.id;

    const defaultSchool = await prisma.school.create({
      data: { name: "Trường THPT Trung Tâm" },
    });
    return defaultSchool.id;
  } catch (error) {
    console.error("Error resolving schoolId:", error);
    return null;
  }
}

export async function getSubjectGroups(search?: string, schoolId?: string, hasHead?: string) {
  try {
    const effectiveSchoolId = await getEffectiveSchoolId();
    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    } else if (effectiveSchoolId) {
      where.schoolId = effectiveSchoolId;
    }

    if (hasHead === "YES") {
      where.headTeacherId = { not: null };
    } else if (hasHead === "NO") {
      where.headTeacherId = null;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { headTeacher: { user: { name: { contains: s, mode: "insensitive" } } } },
        { subjects: { some: { name: { contains: s, mode: "insensitive" } } } },
      ];
    }

    return await prisma.subjectGroup.findMany({
      where,
      include: {
        school: { select: { id: true, name: true } },
        headTeacher: { select: { id: true, user: { select: { name: true, email: true } } } },
        subjects: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            _count: { select: { teachingAssignments: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("getSubjectGroups error:", err);
    return [];
  }
}

export async function getSchoolsForSelect() {
  try {
    return await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("getSchoolsForSelect error:", err);
    return [];
  }
}

export async function getTeachersForSelect() {
  try {
    return await prisma.teacher.findMany({
      select: {
        id: true,
        user: { select: { name: true, email: true } },
        specialty: true,
      },
      orderBy: { user: { name: "asc" } },
    });
  } catch (err) {
    console.error("getTeachersForSelect error:", err);
    return [];
  }
}

export async function getAllSubjectsForSelect() {
  try {
    return await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        subjectGroupId: true,
        subjectGroup: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("getAllSubjectsForSelect error:", err);
    return [];
  }
}

export async function getUnassignedSubjects() {
  try {
    return await prisma.subject.findMany({
      where: { subjectGroupId: null },
      select: { id: true, name: true, gradeLevel: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error("getUnassignedSubjects error:", err);
    return [];
  }
}

export async function createSubjectGroup(data: {
  name: string;
  schoolId?: string;
  headTeacherId?: string | null;
  description?: string | null;
  subjectIds?: string[];
}) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) return { success: false, error: "Tên tổ không được để trống" };

    let targetSchoolId = data.schoolId;
    if (!targetSchoolId) {
      targetSchoolId = (await getEffectiveSchoolId()) || undefined;
    }

    if (!targetSchoolId) {
      return { success: false, error: "Không xác định được trường học" };
    }

    const existing = await prisma.subjectGroup.findFirst({
      where: {
        schoolId: targetSchoolId,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return { success: false, error: `Tổ chuyên môn "${trimmedName}" đã tồn tại trong trường này.` };
    }

    const newGroup = await prisma.subjectGroup.create({
      data: {
        schoolId: targetSchoolId,
        name: trimmedName,
        headTeacherId: data.headTeacherId || null,
        description: data.description || null,
      },
    });

    if (data.subjectIds && data.subjectIds.length > 0) {
      await prisma.subject.updateMany({
        where: { id: { in: data.subjectIds } },
        data: { subjectGroupId: newGroup.id },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("createSubjectGroup error:", error);
    return { success: false, error: error.message || "Lỗi khi tạo tổ chuyên môn" };
  }
}

export async function updateSubjectGroup(
  id: string,
  data: {
    name: string;
    schoolId?: string;
    headTeacherId?: string | null;
    description?: string | null;
    subjectIds?: string[];
  }
) {
  try {
    const trimmedName = data.name.trim();
    if (!trimmedName) return { success: false, error: "Tên tổ không được để trống" };

    const updatePayload: any = {
      name: trimmedName,
      headTeacherId: data.headTeacherId || null,
      description: data.description || null,
    };
    if (data.schoolId) {
      updatePayload.schoolId = data.schoolId;
    }

    await prisma.subjectGroup.update({
      where: { id },
      data: updatePayload,
    });

    if (data.subjectIds) {
      // Unlink subjects currently in this group that are not in the new list
      await prisma.subject.updateMany({
        where: { subjectGroupId: id, id: { notIn: data.subjectIds } },
        data: { subjectGroupId: null },
      });

      // Link newly selected subjects
      if (data.subjectIds.length > 0) {
        await prisma.subject.updateMany({
          where: { id: { in: data.subjectIds } },
          data: { subjectGroupId: id },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("updateSubjectGroup error:", error);
    return { success: false, error: error.message || "Lỗi khi cập nhật tổ chuyên môn" };
  }
}

export async function deleteSubjectGroup(id: string) {
  try {
    // Disconnect all subjects first
    await prisma.subject.updateMany({
      where: { subjectGroupId: id },
      data: { subjectGroupId: null },
    });

    await prisma.subjectGroup.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("deleteSubjectGroup error:", error);
    return { success: false, error: error.message || "Lỗi khi xóa tổ chuyên môn" };
  }
}

export async function assignSubjectToGroup(subjectId: string, groupId: string | null) {
  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: { subjectGroupId: groupId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("assignSubjectToGroup error:", error);
    return { success: false, error: error.message || "Lỗi khi gán môn học" };
  }
}

export async function assignBulkSubjectsToGroup(subjectIds: string[], groupId: string | null) {
  try {
    if (!subjectIds || subjectIds.length === 0) {
      return { success: false, error: "Không có môn học nào được chọn" };
    }
    await prisma.subject.updateMany({
      where: { id: { in: subjectIds } },
      data: { subjectGroupId: groupId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("assignBulkSubjectsToGroup error:", error);
    return { success: false, error: error.message || "Lỗi khi gán danh sách môn học" };
  }
}

export interface BulkSubjectGroupInput {
  name: string;
  headTeacherName?: string;
  subjects?: string;
  schoolName?: string;
  description?: string;
}

export async function createBulkSubjectGroups(
  groupsData: BulkSubjectGroupInput[],
  defaultSchoolId?: string
) {
  try {
    if (!groupsData || groupsData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const schools = await prisma.school.findMany({ select: { id: true, name: true } });
    const teachers = await prisma.teacher.findMany({
      select: { id: true, user: { select: { name: true, email: true } } },
    });
    const allSubjects = await prisma.subject.findMany({ select: { id: true, name: true } });

    const fallbackSchoolId =
      defaultSchoolId || (await getEffectiveSchoolId()) || (schools.length > 0 ? schools[0].id : null);

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < groupsData.length; i++) {
      const item = groupsData[i];
      const rowNum = i + 1;

      if (!item.name || !item.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Tên tổ chuyên môn`);
        continue;
      }

      const groupName = item.name.trim();

      // Resolve school
      let resolvedSchoolId: string | null = null;
      if (item.schoolName) {
        const found = schools.find(
          (s) => s.name.toLowerCase() === item.schoolName?.trim().toLowerCase()
        );
        if (found) resolvedSchoolId = found.id;
      }
      if (!resolvedSchoolId) resolvedSchoolId = fallbackSchoolId || null;

      if (!resolvedSchoolId) {
        errors.push(`Dòng ${rowNum} (${groupName}): Không xác định được Trường học`);
        continue;
      }

      // Resolve Head Teacher
      let resolvedTeacherId: string | null = null;
      if (item.headTeacherName) {
        const hName = item.headTeacherName.trim().toLowerCase();
        const found = teachers.find(
          (t) =>
            t.user.name.toLowerCase() === hName ||
            t.user.email.toLowerCase() === hName ||
            t.user.name.toLowerCase().includes(hName)
        );
        if (found) resolvedTeacherId = found.id;
      }

      try {
        // Upsert or create subject group
        let group = await prisma.subjectGroup.findFirst({
          where: {
            schoolId: resolvedSchoolId,
            name: { equals: groupName, mode: "insensitive" },
          },
        });

        if (group) {
          group = await prisma.subjectGroup.update({
            where: { id: group.id },
            data: {
              headTeacherId: resolvedTeacherId || group.headTeacherId,
              description: item.description || group.description,
            },
          });
        } else {
          group = await prisma.subjectGroup.create({
            data: {
              name: groupName,
              schoolId: resolvedSchoolId,
              headTeacherId: resolvedTeacherId || null,
              description: item.description || null,
            },
          });
        }

        // Link subjects if provided
        if (item.subjects && group) {
          const subNames = item.subjects
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          for (const sName of subNames) {
            let matchedSubject = allSubjects.find(
              (sub) => sub.name.toLowerCase() === sName.toLowerCase()
            );

            if (!matchedSubject) {
              // Create subject if not exists
              matchedSubject = await prisma.subject.create({
                data: {
                  name: sName,
                  subjectGroupId: group.id,
                },
              });
              allSubjects.push(matchedSubject);
            } else {
              await prisma.subject.update({
                where: { id: matchedSubject.id },
                data: { subjectGroupId: group.id },
              });
            }
          }
        }

        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${groupName}): Lỗi - ${err.message}`);
      }
    }

    return {
      success: createdCount > 0,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    console.error("createBulkSubjectGroups error:", error);
    return {
      success: false,
      error: error.message || "Lỗi khi nhập hàng loạt tổ chuyên môn",
      count: 0,
    };
  }
}
