/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Calling files: `prisma/seed.ts` (lines 80-120), `src/app/api/db-seed/route.ts` (lines 75-115).
 * 2. Affected APIs: `seedPersonnelAndSubjects`, `PersonnelSubjectsResult`.
 * 3. Data Schemas: `User`, `Teacher`, `SubjectGroup`, `Subject`, `UserRoleScope`.
 * 4. Verbatim User Instruction: "hãy xóa hết dữ liệu của TRƯỜNG TIỂU HỌC PHỐ LU và hãy cập nhập và lấy dữ liệu ở đây C:\Users\tungh\Desktop\school-management\docs\dulieu"
 */

import { PrismaClient, Role, ScopeType } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import * as fs from "fs";
import * as path from "path";

export interface PersonnelSubjectsResult {
  principalUser: any;
  accountantUser?: any;
  vpUsers: any[];
  subjectGroups: any[];
  subjects: any[];
  teachers: Array<{
    user: any;
    teacher: any;
    name: string;
    specialty: string;
    campusId: string;
    stt: number;
    duty?: string;
  }>;
  sampleTeacherUser: any;
  sampleTeacher: any;
}

export async function seedPersonnelAndSubjects(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  standardPassword: string,
  deptId: string,
  wardId: string
): Promise<PersonnelSubjectsResult> {
  console.log("\n👨🏫 [4/6] Khởi tạo Ban Giám Hiệu, Tổ Chuyên môn và 125 Cán bộ Giáo viên thực tế từ QĐ 01/QĐ-THPL...");
  const { school, campuses } = schoolStruct;
  const mainCampus = campuses[0].campus;

  // Read staff.json
  const staffJsonPath = path.join(process.cwd(), "prisma", "real-data", "staff.json");
  let staffList: any[] = [];
  if (fs.existsSync(staffJsonPath)) {
    staffList = JSON.parse(fs.readFileSync(staffJsonPath, "utf-8"));
  }

  // 1. Hiệu trưởng Toàn trường: ThS. Trần Thị Thanh Hà (STT 1)
  const principalStaff = staffList.find((s) => s.stt === 1) || {
    name: "Trần Thị Thanh Hà",
    degree: "Thạc sĩ",
  };

  const principalUser = await prisma.user.create({
    data: {
      name: `${principalStaff.name} (Hiệu trưởng Trường TH Phố Lu)`,
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

  // 2. Kế toán trưởng: Nguyễn Minh Phương (STT 68)
  const accountantStaff = staffList.find((s) => s.stt === 68) || {
    name: "Nguyễn Minh Phương",
  };
  const accountantUser = await prisma.user.create({
    data: {
      name: `${accountantStaff.name} (Kế toán trưởng TH Phố Lu)`,
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

  // 3. 5 Phó Hiệu trưởng phụ trách các Phân hiệu
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

  // 4. Khởi tạo 6 Tổ Chuyên môn Cấp Tiểu học
  const subjectGroupDefs = [
    { name: "Tổ Chuyên môn Khối 1", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 1 GDPT 2018", headEmail: "to.khoi1@gmail.com", headName: "Trần Thị Bích Hạnh" },
    { name: "Tổ Chuyên môn Khối 2", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 2 GDPT 2018", headEmail: "to.khoi2@gmail.com", headName: "Hoàng Thị Huyền" },
    { name: "Tổ Chuyên môn Khối 3", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 3 GDPT 2018", headEmail: "to.khoi3@gmail.com", headName: "Nguyễn Thị Thuý Hoàn" },
    { name: "Tổ Chuyên môn Khối 4", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 4 GDPT 2018", headEmail: "to.khoi4@gmail.com", headName: "Vũ Thị Hải" },
    { name: "Tổ Chuyên môn Khối 5", desc: "Quản lý chuyên môn giảng dạy chương trình lớp 5 GDPT 2018", headEmail: "to.khoi5@gmail.com", headName: "Phạm Thị Giang" },
    { name: "Tổ Đặc thù Ngoại ngữ - Tin học - Nghệ thuật", desc: "Giảng dạy Tiếng Anh, Tin học, Âm nhạc, Mĩ thuật, Thể chất", headEmail: "to.dacthu@gmail.com", headName: "Lê Trọng Tấn" },
  ];

  const createdGroups: any[] = [];
  for (let gIdx = 0; gIdx < subjectGroupDefs.length; gIdx++) {
    const gDef = subjectGroupDefs[gIdx];
    const group = await prisma.subjectGroup.create({
      data: {
        schoolId: school.id,
        name: gDef.name,
        description: gDef.desc,
      },
    });
    createdGroups.push(group);
  }

  // 5. Khởi tạo tất cả 125 Cán bộ, Giáo viên, Nhân viên từ staffList
  const createdTeachers: Array<{
    user: any;
    teacher: any;
    name: string;
    specialty: string;
    campusId: string;
    stt: number;
    duty?: string;
  }> = [];

  let sampleTeacherUser: any = null;
  let sampleTeacher: any = null;

  for (const staff of staffList) {
    const stt = staff.stt;
    const isPrincipal = stt === 1;
    const isVp = stt >= 2 && stt <= 6;
    const isAccountant = stt === 68;
    const isStaff = staff.position === "NV";

    // Determine campus
    let targetCampus = mainCampus;
    const dutyLower = (staff.duty || "").toLowerCase();
    if (dutyLower.includes("sơn hà 1") || dutyLower.includes("sơn hà,1")) {
      targetCampus = campuses.find((c) => c.spec.key === "SON_HA_1")?.campus || mainCampus;
    } else if (dutyLower.includes("sơn hà 2")) {
      targetCampus = campuses.find((c) => c.spec.key === "SON_HA_2")?.campus || mainCampus;
    } else if (dutyLower.includes("sơn hải")) {
      targetCampus = campuses.find((c) => c.spec.key === "SON_HAI")?.campus || mainCampus;
    } else if (dutyLower.includes("an tiến")) {
      targetCampus = campuses.find((c) => c.spec.key === "AN_TIEN")?.campus || mainCampus;
    } else if (dutyLower.includes("tân thành")) {
      targetCampus = campuses.find((c) => c.spec.key === "TAN_THANH")?.campus || mainCampus;
    }

    // Role
    let role: Role = Role.TEACHER;
    if (isPrincipal || isAccountant) role = Role.ADMIN;
    else if (isVp) role = Role.VICE_PRINCIPAL;
    else if (isStaff) role = Role.TEACHER;

    // Email
    let email = `cbgv.${stt}@thpholu.edu.vn`;
    if (stt === 1) email = "hieutruong.thpholu@gmail.com";
    else if (stt === 2) email = "pht.sonha1@gmail.com";
    else if (stt === 3) email = "pht.sonhai@gmail.com";
    else if (stt === 4) email = "pht.trungtam@gmail.com";
    else if (stt === 5) email = "pht.tanthanh@gmail.com";
    else if (stt === 6) email = "pht.sonha2@gmail.com";
    else if (stt === 10) email = "giaovien.thpholu@gmail.com"; // Primary test teacher
    else if (stt === 68) email = "ketoan.thpholu@gmail.com";

    // Check if user already created for principal/accountant/vp
    let user = isPrincipal
      ? principalUser
      : isAccountant
      ? accountantUser
      : vpUsers.find((u) => u.email === email) || null;

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `${staff.name} (${staff.position || "GV"})`,
          email,
          password: standardPassword,
          role,
          isApproved: true,
          schoolId: school.id,
          campusId: targetCampus.id,
        },
      });
    }

    // Specialty & Teacher record
    let specialty = "Giáo viên Tiểu học";
    if (isStaff) specialty = `Nhân viên (${staff.duty?.slice(0, 40) || "Công tác"})`;
    else if (dutyLower.includes("âm nhạc") || dutyLower.includes("đh ân")) specialty = "Giáo viên Âm nhạc";
    else if (dutyLower.includes("mĩ thuật") || dutyLower.includes("đhmt")) specialty = "Giáo viên Mĩ thuật";
    else if (dutyLower.includes("tiếng anh") || dutyLower.includes("đhsp nn")) specialty = "Giáo viên Tiếng Anh";
    else if (dutyLower.includes("tin học") || dutyLower.includes("công nghệ")) specialty = "Giáo viên Tin học & Công nghệ";
    else if (dutyLower.includes("thể dục") || dutyLower.includes("gdtc")) specialty = "Giáo viên Giáo dục thể chất";

    let teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          specialty,
        },
      });
    }

    if (stt === 10) {
      sampleTeacherUser = user;
      sampleTeacher = teacher;
    }

    // Assign to subject group
    let groupIdx = 0;
    if (specialty.includes("Âm nhạc") || specialty.includes("Mĩ thuật") || specialty.includes("Tiếng Anh") || specialty.includes("Tin học") || specialty.includes("thể chất")) {
      groupIdx = 5;
    } else {
      const gMatch = (staff.duty || "").match(/khối\s+([1-5])/i) || (staff.duty || "").match(/lớp\s+([1-5])/i);
      if (gMatch) {
        groupIdx = Math.max(0, Math.min(4, parseInt(gMatch[1], 10) - 1));
      }
    }

    await prisma.userRoleScope.create({
      data: {
        userId: user.id,
        role: role === Role.ADMIN ? Role.ADMIN : role === Role.VICE_PRINCIPAL ? Role.VICE_PRINCIPAL : Role.TEACHER,
        scopeType: ScopeType.SUBJECT_GROUP,
        subjectGroupId: createdGroups[groupIdx].id,
      },
    });

    createdTeachers.push({
      user,
      teacher,
      name: staff.name,
      specialty,
      campusId: targetCampus.id,
      stt,
      duty: staff.duty,
    });
  }

  // 6. Danh mục Môn học Cấp Tiểu học GDPT 2018 (Thông tư 27/2020/TT-BGDĐT)
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

  console.log(`   ✅ Đã khởi tạo thành công 125 Cán bộ GV-NV và ${createdSubjects.length} môn học.`);

  return {
    principalUser,
    accountantUser,
    vpUsers,
    subjectGroups: createdGroups,
    subjects: createdSubjects,
    teachers: createdTeachers,
    sampleTeacherUser: sampleTeacherUser || createdTeachers[0].user,
    sampleTeacher: sampleTeacher || createdTeachers[0].teacher,
  };
}
