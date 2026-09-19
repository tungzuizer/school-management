/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Next.js API consumers (`/api/db-seed?secret=seed123` or `POST /api/db-seed`), system initialization triggers.
 * 2. Purpose: Complete database wipe and realistic seeding for Trường Tiểu học Phố Lu & 5 Phân hiệu (Lào Cai):
 *    - Đơn vị chủ quản: Sở GD&ĐT Lào Cai & UBND Xã Bảo Thắng
 *    - Trường pháp nhân: Trường Tiểu học Phố Lu (SchoolType.TIEU_HOC)
 *    - 5 Phân hiệu & Điểm trường: Trung tâm (20 lớp), Sơn Hà 1 (12 lớp), Sơn Hà 2 (10 lớp), Sơn Hải (10 lớp), Phố Lu 3 (8 lớp), Điểm An Tiến (2 lớp)
 *    - Quy mô: 62 lớp, 1.706 học sinh, 120 CB-GV-NV, 80 phòng học/chức năng
 *    - Mật khẩu mặc định: 123456
 * 3. Schemas: All Prisma ORM models with multi-campus scoping, TT27 evaluations, timetable, equipment, KPIs.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "hãy xóa hết các dữ liệu cũ và thay bằng các dữ liệu mới của 5 phân hiệu này".
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEFAULT_PASSWORD_PLAIN, hashPassword } from "../../../../prisma/seed-data/constants";
import { seedAdministrativeHierarchy } from "../../../../prisma/seed-data/administrative";
import { seedSchoolStructure } from "../../../../prisma/seed-data/school-structure";
import { seedPersonnelAndSubjects } from "../../../../prisma/seed-data/personnel-subjects";
import { seedClassesAndStudents } from "../../../../prisma/seed-data/classes-students";
import { seedAcademicAndFacilities } from "../../../../prisma/seed-data/academic-facilities";

async function runSeed() {
  // 1. Wipe database
  try {
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `;
    const tables = tablenames
      .map(({ tablename }) => `"${tablename}"`)
      .filter((name) => name !== '"_prisma_migrations"')
      .join(", ");
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  } catch (error) {
    console.warn("⚠️ TRUNCATE CASCADE gặp giới hạn quyền, dọn dẹp qua Prisma deleteMany...");
    await Promise.allSettled([
      prisma.officialDocument.deleteMany(),
      prisma.equipmentTransfer.deleteMany(),
      prisma.equipment.deleteMany(),
      prisma.aiConfigThreshold.deleteMany(),
      prisma.qualityObjective.deleteMany(),
      prisma.kpiCatalog.deleteMany(),
      prisma.seatingChart.deleteMany(),
      prisma.parentFeedback.deleteMany(),
      prisma.incident.deleteMany(),
      prisma.conductRecord.deleteMany(),
      prisma.grade.deleteMany(),
      prisma.attendance.deleteMany(),
      prisma.schedule.deleteMany(),
      prisma.curriculum.deleteMany(),
      prisma.teachingAssignment.deleteMany(),
      prisma.teacherChangeRequest.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.studentScore.deleteMany(),
      prisma.examPeriod.deleteMany(),
      prisma.student.deleteMany(),
      prisma.group.deleteMany(),
      prisma.classRoom.deleteMany(),
      prisma.subject.deleteMany(),
      prisma.subjectGroup.deleteMany(),
      prisma.teacher.deleteMany(),
      prisma.userRoleScope.deleteMany(),
      prisma.user.deleteMany(),
      prisma.campusWardMap.deleteMany(),
      prisma.schoolPoint.deleteMany(),
      prisma.campus.deleteMany(),
      prisma.school.deleteMany(),
      prisma.districtWard.deleteMany(),
      prisma.educationDepartment.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.dataLock.deleteMany(),
      prisma.loginAttempt.deleteMany(),
      prisma.systemSetting.deleteMany(),
    ]);
  }

  const standardPassword = await hashPassword(DEFAULT_PASSWORD_PLAIN);

  // 2. Admin hierarchy
  const adminHier = await seedAdministrativeHierarchy(prisma, standardPassword);

  // 3. School structure
  const schoolStruct = await seedSchoolStructure(
    prisma,
    adminHier.deptLaoCai.id,
    adminHier.wardCommuneBaoThang.id
  );

  // 4. Personnel & subjects
  const personnelStruct = await seedPersonnelAndSubjects(
    prisma,
    schoolStruct,
    standardPassword,
    adminHier.deptLaoCai.id,
    adminHier.wardCommuneBaoThang.id
  );

  // 5. Classes & students
  const classesStudents = await seedClassesAndStudents(
    prisma,
    schoolStruct,
    personnelStruct,
    standardPassword
  );

  // 6. Facilities & academics
  await seedAcademicAndFacilities(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  return {
    school: schoolStruct.school.name,
    campusesCount: schoolStruct.campuses.length,
    classesCount: classesStudents.classes.length,
    studentsCount: classesStudents.students.length,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (process.env.NODE_ENV === "production" && secret !== "seed123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runSeed();
    return NextResponse.json({
      success: true,
      message: "Khởi tạo thành công dữ liệu mẫu Trường Tiểu học Phố Lu & 5 Phân hiệu (Lào Cai)!",
      data: result,
      sampleAccounts: {
        superAdmin: "superadmin.vietnam@gmail.com / 123456",
        departmentAdmin: "admin.sogd.laocai@gmail.com / 123456",
        wardAdmin: "ubnd.baothang@gmail.com / 123456",
        districtAdmin: "gd.baothang@gmail.com / 123456",
        principal: "hieutruong.thpholu@gmail.com / 123456",
        vicePrincipalSonHa1: "pht.sonha1@gmail.com / 123456",
        vicePrincipalSonHa2: "pht.sonha2@gmail.com / 123456",
        vicePrincipalSonHai: "pht.sonhai@gmail.com / 123456",
        vicePrincipalPhoLu3: "pht.pholu3@gmail.com / 123456",
        vicePrincipalAnTien: "pht.antien@gmail.com / 123456",
        teacher: "giaovien.thpholu@gmail.com / 123456",
        student: "hocsinh.thpholu@gmail.com / 123456",
      },
    });
  } catch (error: any) {
    console.error("Lỗi khi chạy db-seed API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
