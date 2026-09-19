/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (lines 80-120), `src/app/api/db-seed/route.ts` (lines 75-115).
 * 2. Affected APIs: `seedPersonnelAndSubjects`, user authentication, principal actions, subject head assignments.
 * 3. Data Schemas: `User`, `Teacher`, `SubjectGroup`, `Subject`, `UserRoleScope`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "Khởi tạo đầy đủ danh sách... 120 nhân sự, các phòng học CSVC và tài khoản đăng nhập cho Hiệu trưởng Trần Thị Thanh Hà + 5 Phó Hiệu trưởng".
 */

import { PrismaClient, Role, ScopeType } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";

export interface PersonnelSubjectsResult {
  principalUser: any;
  vpUsers: any[];
  subjectGroups: any[];
  subjects: any[];
  teachers: Array<{
    user: any;
    teacher: any;
    name: string;
    specialty: string;
    campusId: string;
  }>;
}

export async function seedPersonnelAndSubjects(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  standardPassword: string,
  deptId: string,
  wardId: string
): Promise<PersonnelSubjectsResult> {
  console.log("\n👨🏫 [4/6] Khởi tạo Ban Giám Hiệu, 6 Tổ Chuyên môn và Giáo viên Tiểu học...");
  const { school, campuses } = schoolStruct;
  const mainCampus = campuses[0].campus;

  // 1. Hiệu trưởng Toàn trường: ThS. Trần Thị Thanh Hà
  const principalUser = await prisma.user.create({
    data: {
      name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng Trường TH Phố Lu)",
      email: "hieutruong.thpholu@gmail.com",
      password: standardPassword,
      role: Role.ADMIN,
      isApproved: true,
      schoolId: school.id,
      departmentId: deptId,
      districtWardId: wardId,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: principalUser.id,
      role: Role.ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  // Kế toán trưởng
  await prisma.user.create({
    data: {
      name: "Nguyễn Thị Phương Mai (Kế toán trưởng TH Phố Lu)",
      email: "ketoan.thpholu@gmail.com",
      password: standardPassword,
      role: Role.ADMIN,
      isApproved: true,
      schoolId: school.id,
      campusId: mainCampus.id,
      departmentId: deptId,
      districtWardId: wardId,
    },
  });

  // 2. 5 Phó Hiệu trưởng phụ trách 5 Phân hiệu & Điểm trường
  const vpUsers: any[] = [];
  for (const cItem of campuses) {
    const vpUser = await prisma.user.create({
      data: {
        name: cItem.spec.vpName,
        email: cItem.spec.vpEmail,
        password: standardPassword,
        role: Role.VICE_PRINCIPAL,
        isApproved: true,
        schoolId: school.id,
        campusId: cItem.campus.id,
        departmentId: deptId,
        districtWardId: wardId,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: vpUser.id,
        role: Role.VICE_PRINCIPAL,
        scopeType: ScopeType.CAMPUS,
        scopeId: cItem.campus.id,
      },
    });

    vpUsers.push(vpUser);
  }

  // 3. Khởi tạo 6 Tổ Chuyên môn Cấp Tiểu học
  const subjectGroupDefs = [
    { name: "Tổ Chuyên môn Khối 1", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 1 GDPT 2018", headEmail: "to.khoi1@gmail.com", headName: "Cô Vũ Thị Hoa" },
    { name: "Tổ Chuyên môn Khối 2", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 2 GDPT 2018", headEmail: "to.khoi2@gmail.com", headName: "Cô Phạm Thị Lan" },
    { name: "Tổ Chuyên môn Khối 3", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 3 GDPT 2018", headEmail: "to.khoi3@gmail.com", headName: "Thầy Đinh Văn Nam" },
    { name: "Tổ Chuyên môn Khối 4", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 4 GDPT 2018", headEmail: "to.khoi4@gmail.com", headName: "Cô Hoàng Thị Mai" },
    { name: "Tổ Chuyên môn Khối 5", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 5 GDPT 2018", headEmail: "to.khoi5@gmail.com", headName: "Thầy Bùi Quang Hưng" },
    { name: "Tổ Đặc thù Ngoại ngữ - Tin học - Nghệ thuật", desc: "Giảng dạy Tiếng Anh, Tin học, Âm nhạc, Mĩ thuật, Thể chất", headEmail: "to.dacthu@gmail.com", headName: "Cô Đào Thị Linh" },
  ];

  const createdGroups: any[] = [];
  const createdTeachers: any[] = [];

  for (let gIdx = 0; gIdx < subjectGroupDefs.length; gIdx++) {
    const gDef = subjectGroupDefs[gIdx];
    const group = await prisma.subjectGroup.create({
      data: {
        schoolId: school.id,
        name: gDef.name,
        description: gDef.desc,
      },
    });

    // Tạo Tổ trưởng Chuyên môn
    const headUser = await prisma.user.create({
      data: {
        name: `${gDef.headName} (${gDef.name})`,
        email: gDef.headEmail,
        password: standardPassword,
        role: Role.SUBJECT_HEAD,
        isApproved: true,
        schoolId: school.id,
        campusId: mainCampus.id,
      },
    });

    const headTeacher = await prisma.teacher.create({
      data: {
        userId: headUser.id,
        specialty: gIdx < 5 ? `Giáo viên Tiểu học Khối ${gIdx + 1}` : "Giáo viên Bộ môn Đặc thù",
      },
    });

    await prisma.subjectGroup.update({
      where: { id: group.id },
      data: { headTeacherId: headTeacher.id },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: headUser.id,
        role: Role.SUBJECT_HEAD,
        scopeType: ScopeType.SUBJECT_GROUP,
        subjectGroupId: group.id,
      },
    });

    createdTeachers.push({
      user: headUser,
      teacher: headTeacher,
      name: gDef.headName,
      specialty: headTeacher.specialty,
      campusId: mainCampus.id,
    });

    createdGroups.push(group);
  }

  // 3.1. Tạo 62 Giáo viên Chủ nhiệm & Bộ môn Tiểu học (phụ trách 62 lớp)
  for (let i = 1; i <= 62; i++) {
    const campusItem = campuses[i % campuses.length];
    const gradeLevel = ((i - 1) % 5) + 1;
    const email = i === 1 ? "giaovien.thpholu@gmail.com" : `gv.chunhiem.${i}@gmail.com`;
    const name =
      i === 1
        ? "Cô Nguyễn Thu Hằng (Giáo viên Tiểu học Mẫu)"
        : `Thầy/Cô Giáo viên Tiểu học ${i} (Khối ${gradeLevel})`;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: standardPassword,
        role: Role.TEACHER,
        isApproved: true,
        schoolId: school.id,
        campusId: campusItem.campus.id,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        specialty: `Giáo viên Tiểu học Khối ${gradeLevel}`,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: user.id,
        role: Role.TEACHER,
        scopeType: ScopeType.SUBJECT_GROUP,
        subjectGroupId: createdGroups[gradeLevel - 1].id,
      },
    });

    createdTeachers.push({
      user,
      teacher,
      name,
      specialty: teacher.specialty,
      campusId: campusItem.campus.id,
    });
  }

  // 4. Danh mục Môn học Cấp Tiểu học GDPT 2018 (Thông tư 27/2020/TT-BGDĐT)
  const primarySubjectsDef = [
    { name: "Tiếng Việt", groupIdx: 0 },
    { name: "Toán", groupIdx: 0 },
    { name: "Tiếng Anh", groupIdx: 5 },
    { name: "Đạo đức", groupIdx: 1 },
    { name: "Tự nhiên và Xã hội", groupIdx: 2 },
    { name: "Khoa học", groupIdx: 3 },
    { name: "Lịch sử và Địa lí", groupIdx: 4 },
    { name: "Tin học và Công nghệ", groupIdx: 5 },
    { name: "Giáo dục thể chất", groupIdx: 5 },
    { name: "Âm nhạc", groupIdx: 5 },
    { name: "Mĩ thuật", groupIdx: 5 },
    { name: "Hoạt động trải nghiệm", groupIdx: 0 },
    { name: "Chào cờ", groupIdx: 0 },
    { name: "Sinh hoạt lớp", groupIdx: 0 },
  ];

  const createdSubjects: any[] = [];
  for (const sDef of primarySubjectsDef) {
    const targetGroup = createdGroups[sDef.groupIdx] || createdGroups[0];
    const headTeacherObj = createdTeachers.find((t) => t.specialty.includes(sDef.name))?.teacher || createdTeachers[0].teacher;

    const subject = await prisma.subject.create({
      data: {
        name: sDef.name,
        subjectGroupId: targetGroup.id,
        headTeacherId: headTeacherObj.id,
      },
    });

    createdSubjects.push(subject);
  }

  return {
    principalUser,
    vpUsers,
    subjectGroups: createdGroups,
    subjects: createdSubjects,
    teachers: createdTeachers,
  };
}
