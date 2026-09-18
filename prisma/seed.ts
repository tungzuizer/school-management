/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Prisma CLI seeder (`npx prisma db seed` / `npx tsx prisma/seed.ts`), package.json prisma.seed.
 * 2. Purpose: Complete database wipe and realistic seeding for Nationwide Multi-Region Education Architecture:
 *    - 4 Sở Giáo dục & Đào tạo: TP. Hà Nội, TP. Hồ Chí Minh, TP. Đà Nẵng, Tỉnh Ninh Bình
 *    - 9 Phòng GD&ĐT / Quận Huyện quản lý
 *    - 8 Trường THPT tiêu biểu 3 miền (Chu Văn An, Hà Nội-Amsterdam, Lê Hồng Phong, Lê Quý Đôn, Phan Châu Trinh, Trần Phú, Lương Khánh Thiện, Đinh Tiên Hoàng)
 *    - Toàn bộ tài khoản quản trị từ SuperAdmin (superadmin@gmail.com), Lãnh đạo Sở, Trưởng phòng, Hiệu trưởng, TTCM, Giáo viên, Học sinh với mật khẩu chuẩn "abc123"
 *    - Đầy đủ Wards, Campuses, SchoolPoints, Equipment, EquipmentTransfer, Schedules (Chào cờ T2 Tiết 1, Sinh hoạt T6 Tiết 4), Multi-year Scores (2023-2026), AI Configs.
 * 3. Schemas: All 75 Prisma ORM models with complete multi-tenant scoping, RBAC, timetables, attendance, multi-year scores, KPIs.
 */

import {
  PrismaClient,
  Role,
  ScopeType,
  ManagementBranch,
  SchoolType,
  Gender,
  StudentStatus,
  AttendanceStatus,
  KpiCategory,
  MeasurementDirection,
  ReportingFrequency,
  QualityCategory,
  QualityObjectiveStatus,
  AiTaskGroup,
  AiAlertSeverity,
  DocumentType,
  DocumentUrgency,
  DocumentStatus,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
  ExamSemester,
  ExamType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đinh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn"
];

const MIDDLE_MALE = [
  "Văn", "Đức", "Hữu", "Gia", "Minh", "Hoàng", "Quốc", "Anh", "Tuấn", "Thanh", "Bảo", "Đình", "Quang"
];

const MIDDLE_FEMALE = [
  "Thị", "Ngọc", "Thu", "Mai", "Phương", "Thanh", "Thảo", "Hải", "Khánh", "Minh", "Bảo", "Quỳnh", "Ánh"
];

const FIRST_MALE = [
  "Hưng", "Long", "Nam", "Khánh", "Duy", "Hải", "Tuấn", "Minh", "Quân", "Bách", "Phúc", "Khang", "Tùng", "Bảo", "Khoa", "Phong", "Triết", "Thịnh", "Đạt"
];

const FIRST_FEMALE = [
  "Anh", "Linh", "Trang", "Hà", "Phương", "Chi", "Nhi", "Mai", "Châu", "Vy", "Hương", "Lan", "Ngọc", "Dương", "Hân", "Thư", "Tú", "Yến", "Ngân"
];

function generateStudentRoster(count: number, gradeLevel: number, schoolCode: string, className: string, startSeq: number = 1, addressBase: string = "Việt Nam") {
  const roster = [];
  const birthYear = 2026 - (gradeLevel + 5);

  for (let i = 1; i <= count; i++) {
    const isMale = i % 2 === 1;
    const lastName = LAST_NAMES[(i * 3 + gradeLevel + startSeq) % LAST_NAMES.length];
    const middleName = isMale
      ? MIDDLE_MALE[(i * 5 + gradeLevel + startSeq) % MIDDLE_MALE.length]
      : MIDDLE_FEMALE[(i * 7 + gradeLevel + startSeq) % MIDDLE_FEMALE.length];
    const firstName = isMale
      ? FIRST_MALE[(i * 11 + gradeLevel + startSeq) % FIRST_MALE.length]
      : FIRST_FEMALE[(i * 13 + gradeLevel + startSeq) % FIRST_FEMALE.length];

    const fullName = `${lastName} ${middleName} ${firstName}`;
    const birthMonth = ((i * 4) % 12) + 1;
    const birthDay = ((i * 7) % 28) + 1;
    const dob = new Date(`${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`);

    const seq = startSeq + i - 1;
    const studentCode = `HS26${schoolCode}${String(gradeLevel).padStart(2, "0")}${String(seq).padStart(4, "0")}`;
    const email = `${studentCode.toLowerCase()}@gmail.com`;

    roster.push({
      index: i,
      name: fullName,
      gender: isMale ? Gender.MALE : Gender.FEMALE,
      dob,
      studentCode,
      email,
      phone: `09${String(10000000 + (startSeq + i) * 12345).slice(0, 8)}`,
      parentName: `${lastName} ${isMale ? "Văn" : "Thị"} ${isMale ? "Hùng" : "Mai"}`,
      parentPhone: `09${String(80000000 + (startSeq + i) * 54321).slice(0, 8)}`,
      address: addressBase,
    });
  }
  return roster;
}

async function main() {
  console.log("🚀 [KHỞI TẠO DỮ LIỆU TOÀN QUỐC 2026] HỆ THỐNG QUẢN TRỊ GIÁO DỤC 63 TỈNH/THÀNH PHỐ");
  console.log("==================================================================================");

  // 1. Wipe all existing database records
  console.log("🧹 [1/7] Đang xóa toàn bộ dữ liệu cũ trong cơ sở dữ liệu Supabase...");
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
      console.log(`   ✅ Đã dọn dẹp sạch sẽ ${tablenames.length} bảng bằng TRUNCATE CASCADE.`);
    }
  } catch (error) {
    console.warn("⚠️ TRUNCATE CASCADE gặp giới hạn quyền, dọn dẹp qua Prisma...");
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
    console.log("   ✅ Đã xóa toàn bộ dữ liệu qua Prisma deleteMany.");
  }

  // Password băm chuẩn cho toàn bộ người dùng: abc123
  const standardPassword = await bcrypt.hash("abc123", 10);

  // 2. Khởi tạo 4 Sở Giáo dục & Đào tạo (Hà Nội, TP.HCM, Đà Nẵng, Ninh Bình)
  console.log("\n🏛️ [2/7] Khởi tạo 4 Sở Giáo dục & Đào tạo đại diện 3 Miền Toàn Quốc...");

  const deptHanoi = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Thành phố Hà Nội",
      code: "HN-SGDDT",
      address: "Số 23 Quang Trung, Phường Trần Hưng Đạo, Quận Hoàn Kiếm, TP. Hà Nội",
      phone: "024-3825-7260",
      email: "sogd.hanoi@gmail.com",
    },
  });

  const deptHCMC = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Thành phố Hồ Chí Minh",
      code: "HCM-SGDDT",
      address: "Số 66-68 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      phone: "028-3829-9140",
      email: "sogd.tphcm@gmail.com",
    },
  });

  const deptDanang = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Thành phố Đà Nẵng",
      code: "DN-SGDDT",
      address: "Tầng 21 Trung tâm Hành chính, Số 24 Trần Phú, Quận Hải Châu, TP. Đà Nẵng",
      phone: "0236-3821-203",
      email: "sogd.danang@gmail.com",
    },
  });

  const deptNinhBinh = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Tỉnh Ninh Bình",
      code: "NB-SGDDT",
      address: "Số 16 Đường Tràng An, Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-005",
      email: "sogd.ninhbinh@gmail.com",
    },
  });

  // 3. Khởi tạo các Phòng GD&ĐT / Quận Huyện quản lý
  console.log("\n📍 [3/7] Khởi tạo các Phòng GD&ĐT / Khu vực quản lý hành chính...");

  // Hà Nội
  const wardCauGiay = await prisma.districtWard.create({
    data: {
      departmentId: deptHanoi.id,
      name: "Phòng GD&ĐT Quận Cầu Giấy",
      code: "HN-CAUGIAY",
      address: "Số 99 Trần Đăng Ninh, Dịch Vọng, Quận Cầu Giấy, TP. Hà Nội",
      phone: "024-3754-0012",
    },
  });

  const wardBaDinh = await prisma.districtWard.create({
    data: {
      departmentId: deptHanoi.id,
      name: "Phòng GD&ĐT Quận Ba Đình",
      code: "HN-BADINH",
      address: "Số 25 Liễu Giai, Phường Liễu Giai, Quận Ba Đình, TP. Hà Nội",
      phone: "024-3845-1234",
    },
  });

  // TP.HCM
  const wardQuan1 = await prisma.districtWard.create({
    data: {
      departmentId: deptHCMC.id,
      name: "Phòng GD&ĐT Quận 1",
      code: "HCM-QUAN1",
      address: "Số 47 Lê Thị Hồng Gấm, Phường Cầu Ông Lãnh, Quận 1, TP. Hồ Chí Minh",
      phone: "028-3822-1122",
    },
  });

  const wardQuan5 = await prisma.districtWard.create({
    data: {
      departmentId: deptHCMC.id,
      name: "Phòng GD&ĐT Quận 5",
      code: "HCM-QUAN5",
      address: "Số 182 An Dương Vương, Phường 9, Quận 5, TP. Hồ Chí Minh",
      phone: "028-3855-3344",
    },
  });

  // Đà Nẵng
  const wardHaiChau = await prisma.districtWard.create({
    data: {
      departmentId: deptDanang.id,
      name: "Phòng GD&ĐT Quận Hải Châu",
      code: "DN-HAICHAU",
      address: "Số 270 Trần Phú, Phường Phước Ninh, Quận Hải Châu, TP. Đà Nẵng",
      phone: "0236-382-5566",
    },
  });

  // Ninh Bình
  const wardTPNinhBinh = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Phòng GD&ĐT Thành phố Ninh Bình",
      code: "NB-TPNB",
      address: "Đường Lê Hồng Phong, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-234",
    },
  });

  const wardTamDiep = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Phòng GD&ĐT Thành phố Tam Điệp",
      code: "NB-TAMDIEP",
      address: "Đường Đồng Giao, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-123",
    },
  });

  const wardHoaLu = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Phòng GD&ĐT Huyện Hoa Lư",
      code: "NB-HOALU",
      address: "Thị trấn Thiên Tôn, Huyện Hoa Lư, Tỉnh Ninh Bình",
      phone: "0229-3622-123",
    },
  });

  // 4. Khởi tạo SuperAdmin & Tài khoản Lãnh đạo Sở / Phòng toàn quốc
  console.log("\n👑 [4/7] Khởi tạo Tài khoản SuperAdmin Toàn Quốc và Lãnh đạo 3 Miền...");

  // SuperAdmin Toàn Quốc
  const superAdminMain = await prisma.user.create({
    data: {
      name: "Ban Quản Trị Nền Tảng Giáo Dục Toàn Quốc (SuperAdmin)",
      email: "superadmin@gmail.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdminMain.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const superAdminVietnam = await prisma.user.create({
    data: {
      name: "Bộ Giáo Dục và Đào Tạo Việt Nam (SuperAdmin)",
      email: "superadmin.vietnam@gmail.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdminVietnam.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const superAdminNinhBinh = await prisma.user.create({
    data: {
      name: "Ban Quản Trị Hệ Thống Tỉnh Ninh Bình (SuperAdmin)",
      email: "superadmin.ninhbinh@gmail.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
      departmentId: deptNinhBinh.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdminNinhBinh.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  // Lãnh đạo 4 Sở GD&ĐT
  const deptAdmins = [
    {
      name: "Giám đốc Sở Giáo dục & Đào tạo TP. Hà Nội",
      email: "sogd.hanoi@gmail.com",
      dept: deptHanoi,
    },
    {
      name: "Giám đốc Sở Giáo dục & Đào tạo TP. Hồ Chí Minh",
      email: "sogd.tphcm@gmail.com",
      dept: deptHCMC,
    },
    {
      name: "Giám đốc Sở Giáo dục & Đào tạo TP. Đà Nẵng",
      email: "sogd.danang@gmail.com",
      dept: deptDanang,
    },
    {
      name: "TS. Phan Thành Công (Giám đốc Sở GD&ĐT Tỉnh Ninh Bình)",
      email: "admin.sogd.ninhbinh@gmail.com",
      dept: deptNinhBinh,
    },
    {
      name: "Văn phòng Sở GD&ĐT Tỉnh Ninh Bình",
      email: "sogd.ninhbinh@gmail.com",
      dept: deptNinhBinh,
    },
  ];

  for (const da of deptAdmins) {
    const u = await prisma.user.create({
      data: {
        name: da.name,
        email: da.email,
        password: standardPassword,
        role: Role.DEPARTMENT_ADMIN,
        isApproved: true,
        departmentId: da.dept.id,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: u.id,
        role: Role.DEPARTMENT_ADMIN,
        scopeType: ScopeType.GLOBAL,
      },
    });
  }

  // Trưởng phòng GD&ĐT các Quận/Huyện
  const districtAdmins = [
    {
      name: "Trưởng phòng GD&ĐT Quận Cầu Giấy (Hà Nội)",
      email: "pgd.caugiay@gmail.com",
      dept: deptHanoi,
      ward: wardCauGiay,
    },
    {
      name: "Trưởng phòng GD&ĐT Quận 1 (TP.HCM)",
      email: "pgd.quan1@gmail.com",
      dept: deptHCMC,
      ward: wardQuan1,
    },
    {
      name: "ThS. Đinh Xuân Cảnh (Trưởng phòng GD TP. Ninh Bình)",
      email: "gd.tpninhbinh@gmail.com",
      dept: deptNinhBinh,
      ward: wardTPNinhBinh,
    },
    {
      name: "ThS. Trịnh Minh Tuấn (Trưởng phòng GD TP. Tam Điệp)",
      email: "gd.tamdiep@gmail.com",
      dept: deptNinhBinh,
      ward: wardTamDiep,
    },
    {
      name: "ThS. Đỗ Quang Huy (Trưởng phòng GD Huyện Hoa Lư)",
      email: "gd.hoalu@gmail.com",
      dept: deptNinhBinh,
      ward: wardHoaLu,
    },
  ];

  for (const dra of districtAdmins) {
    const rUser = await prisma.user.create({
      data: {
        name: dra.name,
        email: dra.email,
        password: standardPassword,
        role: Role.DISTRICT_ADMIN,
        isApproved: true,
        departmentId: dra.dept.id,
        districtWardId: dra.ward.id,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: rUser.id,
        role: Role.DISTRICT_ADMIN,
        scopeType: ScopeType.WARD,
        scopeId: dra.ward.id,
      },
    });
  }

  // 5. Khởi tạo danh sách Trường THPT 3 Miền Toàn Quốc
  console.log("\n🏫 [5/7] Khởi tạo các trường THPT tiêu biểu Toàn Quốc (Hà Nội, TP.HCM, Đà Nẵng, Ninh Bình)...");

  const schoolsData = [
    // --- HÀ NỘI ---
    {
      code: "CVA",
      schoolCode: "CVA",
      name: "Trường THPT Chu Văn An (Hà Nội)",
      address: "Số 10 Thụy Khuê, Phường Thụy Khuê, Quận Tây Hồ, TP. Hà Nội",
      phone: "024-3847-1444",
      email: "thpt.chuvanan.hanoi@gmail.com",
      departmentId: deptHanoi.id,
      districtWardId: wardBaDinh.id,
      principalEmail: "hieutruong.chuvanan@gmail.com",
      principalName: "Thầy Hiệu trưởng (THPT Chu Văn An)",
      vpEmail: "hieupho.chuvanan@gmail.com",
      vpName: "Cô Phó Hiệu trưởng (THPT Chu Văn An)",
      campuses: [
        {
          name: "Cơ sở Chính - Thụy Khuê",
          address: "Số 10 Thụy Khuê, Phường Thụy Khuê, Quận Tây Hồ, TP. Hà Nội",
          pointName: "Khu Giảng đường Bát Giác & Thí nghiệm Quốc gia",
          managerName: "ThS. Nguyễn Văn Chu",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Trung tâm GD Thể chất & Quốc phòng",
          address: "Phường Nhật Tân, Quận Tây Hồ, TP. Hà Nội",
          pointName: "Khu Thể thao Đa năng Hồ Tây",
          managerName: "ThS. Trần Thị An",
          distanceKm: 2.5,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy bộ môn Toán và Tin học nâng cao" },
        { name: "Tổ Vật lí - Công nghệ", desc: "Giảng dạy bộ môn Vật lí và Kỹ thuật" },
        { name: "Tổ Ngữ văn", desc: "Giảng dạy Ngữ văn chuyên" },
        { name: "Tổ Ngoại ngữ", desc: "Giảng dạy Tiếng Anh & Tiếng Pháp" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 12 },
        { name: "10 Toán", gradeLevel: 10, count: 12 },
        { name: "11A1", gradeLevel: 11, count: 12 },
        { name: "12A1", gradeLevel: 12, count: 12 },
      ],
      teachers: [
        { name: "Thầy Đỗ Minh Hoàng", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "cva.toan.hoang" },
        { name: "Cô Nguyễn Thu Hà", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "cva.tin.ha" },
        { name: "Thầy Phạm Quốc Hưng", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "cva.ly.hung" },
        { name: "Cô Trần Thị Mai", specialty: "Ngữ văn", groupIndex: 2, isHead: true, slug: "cva.van.mai" },
        { name: "Cô Lê Khánh Linh", specialty: "Tiếng Anh", groupIndex: 3, isHead: true, slug: "cva.anh.linh" },
      ],
    },
    {
      code: "AMS",
      schoolCode: "AMS",
      name: "Trường THPT Chuyên Hà Nội - Amsterdam",
      address: "Số 1 Hoàng Minh Giám, Phường Trung Hòa, Quận Cầu Giấy, TP. Hà Nội",
      phone: "024-3846-3096",
      email: "thpt.chuyen.amsterdam@gmail.com",
      departmentId: deptHanoi.id,
      districtWardId: wardCauGiay.id,
      principalEmail: "hieutruong.ams@gmail.com",
      principalName: "Thầy Hiệu trưởng (Chuyên Hà Nội - Amsterdam)",
      vpEmail: "hieupho.ams@gmail.com",
      vpName: "Cô Phó Hiệu trưởng (Chuyên Hà Nội - Amsterdam)",
      campuses: [
        {
          name: "Cơ sở Hoàng Minh Giám",
          address: "Số 1 Hoàng Minh Giám, Quận Cầu Giấy, TP. Hà Nội",
          pointName: "Khu Giảng đường STEM & Thí nghiệm Robotics",
          managerName: "TS. Trần Văn Ams",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin Chuyên", desc: "Đào tạo mũi nhọn Toán - Tin" },
        { name: "Tổ KHTN Chuyên", desc: "Vật lí, Hóa học, Sinh học Chuyên" },
        { name: "Tổ Ngoại ngữ Chuyên", desc: "Tiếng Anh, Tiếng Pháp, Tiếng Trung" },
      ],
      classes: [
        { name: "10 Tin", gradeLevel: 10, count: 12 },
        { name: "11 Anh", gradeLevel: 11, count: 12 },
      ],
      teachers: [
        { name: "Thầy Bùi Anh Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "ams.toan.tuan" },
        { name: "Cô Vũ Minh Anh", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "ams.tin.anh" },
        { name: "Thầy Ngô Đức Thắng", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ams.ly.thang" },
        { name: "Cô Đặng Phương Thảo", specialty: "Tiếng Anh", groupIndex: 2, isHead: true, slug: "ams.anh.thao" },
      ],
    },

    // --- TP. HỒ CHÍ MINH ---
    {
      code: "LHP",
      schoolCode: "LHP",
      name: "Trường THPT Chuyên Lê Hồng Phong (TP.HCM)",
      address: "Số 235 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh",
      phone: "028-3839-8506",
      email: "thpt.lehongphong.tphcm@gmail.com",
      departmentId: deptHCMC.id,
      districtWardId: wardQuan5.id,
      principalEmail: "hieutruong.lehongphong@gmail.com",
      principalName: "Thầy Hiệu trưởng (THPT Chuyên Lê Hồng Phong)",
      vpEmail: "hieupho.lehongphong@gmail.com",
      vpName: "Thầy Phó Hiệu trưởng (THPT Chuyên Lê Hồng Phong)",
      campuses: [
        {
          name: "Cơ sở Chính - Nguyễn Văn Cừ",
          address: "Số 235 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh",
          pointName: "Khu Giảng đường Di sản & TT Tin học AI",
          managerName: "ThS. Phạm Lê Phong",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Trung tâm Nghiên cứu Khoa học",
          address: "Phường 4, Quận 5, TP. Hồ Chí Minh",
          pointName: "Khu Thí nghiệm Vi sinh & Vật liệu mới",
          managerName: "ThS. Lê Hồng Quân",
          distanceKm: 1.2,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Bồi dưỡng học sinh giỏi Toán - Tin" },
        { name: "Tổ Khoa học Tự nhiên", desc: "Vật lí, Hóa học, Sinh học" },
        { name: "Tổ Ngoại ngữ", desc: "Tiếng Anh, Tiếng Nhật, Tiếng Hàn" },
      ],
      classes: [
        { name: "10 Chuyên Toán", gradeLevel: 10, count: 12 },
        { name: "10 Chuyên Anh", gradeLevel: 10, count: 12 },
        { name: "11 Chuyên Lý", gradeLevel: 11, count: 12 },
      ],
      teachers: [
        { name: "Thầy Huỳnh Minh Triết", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "lhp.toan.triet" },
        { name: "Cô Trương Thanh Thủy", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "lhp.tin.thuy" },
        { name: "Thầy Trần Hữu Danh", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "lhp.ly.danh" },
        { name: "Cô Nguyễn Ngọc Phương", specialty: "Tiếng Anh", groupIndex: 2, isHead: true, slug: "lhp.anh.phuong" },
      ],
    },
    {
      code: "LQD",
      schoolCode: "LQD",
      name: "Trường THPT Lê Quý Đôn (TP.HCM)",
      address: "Số 110 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh",
      phone: "028-3930-4448",
      email: "thpt.lequydon.hcm@gmail.com",
      departmentId: deptHCMC.id,
      districtWardId: wardQuan1.id,
      principalEmail: "hieutruong.lequydon@gmail.com",
      principalName: "Thầy Hiệu trưởng (THPT Lê Quý Đôn - TP.HCM)",
      vpEmail: "hieupho.lequydon@gmail.com",
      vpName: "Cô Phó Hiệu trưởng (THPT Lê Quý Đôn - TP.HCM)",
      campuses: [
        {
          name: "Cơ sở Nguyễn Thị Minh Khai",
          address: "Số 110 Nguyễn Thị Minh Khai, Quận 3, TP. Hồ Chí Minh",
          pointName: "Khu Giảng đường Cổ kính & STEM Lab",
          managerName: "ThS. Đỗ Quý Đôn",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
        { name: "Tổ Ngữ văn - KHXH", desc: "Giảng dạy Ngữ văn và KHXH" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 12 },
        { name: "11A1", gradeLevel: 11, count: 12 },
      ],
      teachers: [
        { name: "Thầy Phan Quốc Huy", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "lqd.toan.huy" },
        { name: "Cô Hoàng Mỹ Linh", specialty: "Ngữ văn", groupIndex: 1, isHead: true, slug: "lqd.van.linh" },
      ],
    },

    // --- ĐÀ NẴNG ---
    {
      code: "PCT",
      schoolCode: "PCT",
      name: "Trường THPT Phan Châu Trinh (Đà Nẵng)",
      address: "Số 154 Lê Lợi, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng",
      phone: "0236-382-1678",
      email: "thpt.phanchautrinh.danang@gmail.com",
      departmentId: deptDanang.id,
      districtWardId: wardHaiChau.id,
      principalEmail: "hieutruong.phanchautrinh@gmail.com",
      principalName: "Thầy Hiệu trưởng (THPT Phan Châu Trinh)",
      vpEmail: "hieupho.phanchautrinh@gmail.com",
      vpName: "Thầy Phó Hiệu trưởng (THPT Phan Châu Trinh)",
      campuses: [
        {
          name: "Cơ sở Lê Lợi",
          address: "Số 154 Lê Lợi, Quận Hải Châu, TP. Đà Nẵng",
          pointName: "Khu Giảng đường Trung tâm & Phòng AI Lab",
          managerName: "ThS. Phan Đình Trinh",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
        { name: "Tổ KHTN", desc: "Vật lí, Hóa học, Sinh học" },
      ],
      classes: [
        { name: "10/1", gradeLevel: 10, count: 12 },
        { name: "11/1", gradeLevel: 11, count: 12 },
      ],
      teachers: [
        { name: "Thầy Võ Văn Kiệt", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "pct.toan.kiet" },
        { name: "Thầy Đoàn Minh Nhật", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "pct.ly.nhat" },
      ],
    },

    // --- NINH BÌNH ---
    {
      code: "TP",
      schoolCode: "TP",
      name: "Trường THPT Trần Phú (Ninh Bình)",
      address: "Số 26 Đường Đinh Tiên Hoàng, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-648",
      email: "thpt.tranphu.ninhbinh@gmail.com",
      departmentId: deptNinhBinh.id,
      districtWardId: wardTPNinhBinh.id,
      principalEmail: "hieutruong.thpt.tranphu@gmail.com",
      principalName: "Thầy Đinh Văn Khang",
      vpEmail: "hieuphe.thpt.tranphu@gmail.com",
      vpName: "Cô Nguyễn Thị Mai",
      campuses: [
        {
          name: "Cơ sở Chính - Đinh Tiên Hoàng",
          address: "Số 26 Đường Đinh Tiên Hoàng, Phường Đông Thành, TP. Ninh Bình",
          pointName: "Khu Giảng đường Lý thuyết & Thí nghiệm",
          managerName: "ThS. Đinh Văn Khang",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Trung tâm Thể thao & Hướng nghiệp",
          address: "Phường Ninh Khánh, TP. Ninh Bình, Tỉnh Ninh Bình",
          pointName: "Khu Thể thao Đa năng & GD Quốc phòng",
          managerName: "ThS. Nguyễn Thị Mai",
          distanceKm: 1.8,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy bộ môn Toán và Tin học" },
        { name: "Tổ Vật lí - Kỹ thuật công nghệ", desc: "Giảng dạy bộ môn Vật lí và Kỹ thuật" },
        { name: "Tổ Hóa học - Sinh học", desc: "Giảng dạy Hóa học và Sinh học" },
        { name: "Tổ Ngữ văn", desc: "Giảng dạy Ngữ văn và GDPT 2018" },
        { name: "Tổ Ngoại ngữ", desc: "Giảng dạy Tiếng Anh" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "10D1", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Đinh Quốc Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.tuan.tp", emailAlias: "gv.toan.tuan.tp@gmail.com" },
        { name: "Cô Vũ Minh Trang", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.trang.tp", emailAlias: "gv.tin.trang.tp@gmail.com" },
        { name: "Thầy Lê Hoàng Quân", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.quan.tp" },
        { name: "Cô Phạm Thị Minh", specialty: "Ngữ văn", groupIndex: 3, isHead: true, slug: "van.minh.tp" },
        { name: "Cô Hoàng Mai Khanh", specialty: "Tiếng Anh", groupIndex: 4, isHead: true, slug: "anh.khanh.tp" },
      ],
    },
    {
      code: "LKT",
      schoolCode: "LKT",
      name: "Trường THPT Lương Khánh Thiện (Ninh Bình)",
      address: "Số 18 Đường Quang Trung, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-129",
      email: "thpt.luongkhanhthien.ninhbinh@gmail.com",
      departmentId: deptNinhBinh.id,
      districtWardId: wardTamDiep.id,
      principalEmail: "hieutruong.luongkhanhthien@gmail.com",
      principalName: "Thầy Phạm Văn Hưng",
      vpEmail: "hieupho.luongkhanhthien@gmail.com",
      vpName: "Thầy Vũ Hoàng Long",
      campuses: [
        {
          name: "Cơ sở Chính - Quang Trung",
          address: "Số 18 Đường Quang Trung, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Trung tâm LKT",
          managerName: "Thầy Phạm Văn Hưng",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy bộ môn Toán và Tin học" },
        { name: "Tổ Khoa học Tự nhiên", desc: "Giảng dạy Vật lí, Hóa học, Sinh học" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
      ],
      teachers: [
        { name: "Thầy Hoàng Văn Bách", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.bach.lkt" },
        { name: "Thầy Phạm Gia Bảo", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.bao.lkt" },
      ],
    },
    {
      code: "DTH",
      schoolCode: "DTH",
      name: "Trường THPT Đinh Tiên Hoàng (Ninh Bình)",
      address: "Số 89 Đường Đinh Tất Miễn, Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-332",
      email: "thpt.dinhtienhoang.ninhbinh@gmail.com",
      departmentId: deptNinhBinh.id,
      districtWardId: wardTPNinhBinh.id,
      principalEmail: "hieutruong.dinhtienhoang@gmail.com",
      principalName: "Thầy Vũ Trọng Thắng",
      vpEmail: "hieupho.dinhtienhoang@gmail.com",
      vpName: "Cô Trần Thị Thu",
      campuses: [
        {
          name: "Cơ sở Đinh Tất Miễn",
          address: "Số 89 Đường Đinh Tất Miễn, TP. Ninh Bình",
          pointName: "Khu Giảng đường Đinh Tiên Hoàng",
          managerName: "Thầy Vũ Trọng Thắng",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 12 },
      ],
      teachers: [
        { name: "Thầy Đỗ Minh Quân", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.quan.dth" },
      ],
    },
  ];

  let firstSchoolCreated: any = null;
  const createdSchoolsList: any[] = [];
  const createdCampusesList: any[] = [];
  const createdPointsList: any[] = [];
  const createdEquipmentsList: any[] = [];

  for (const sItem of schoolsData) {
    console.log(`\n🏫 Đang tạo dữ liệu trường [${sItem.code}]: ${sItem.name}...`);
    const school = await prisma.school.create({
      data: {
        departmentId: sItem.departmentId,
        districtWardId: sItem.districtWardId,
        branchType: ManagementBranch.THPT,
        schoolType: SchoolType.THPT,
        name: sItem.name,
        address: sItem.address,
        phone: sItem.phone,
        email: sItem.email,
      },
    });

    createdSchoolsList.push(school);
    if (!firstSchoolCreated) {
      firstSchoolCreated = school;
    }

    const createdCampuses = [];
    for (const cInfo of sItem.campuses) {
      const campus = await prisma.campus.create({
        data: {
          schoolId: school.id,
          name: cInfo.name,
          address: cInfo.address,
        },
      });

      const schoolPoint = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: cInfo.pointName,
          address: cInfo.address,
          managerName: cInfo.managerName,
          phone: sItem.phone,
          distanceKm: cInfo.distanceKm,
        },
      });

      await prisma.campusWardMap.create({
        data: {
          campusId: campus.id,
          wardId: sItem.districtWardId,
        },
      });

      createdCampuses.push({ campus, schoolPoint });
      createdCampusesList.push(campus);
      createdPointsList.push(schoolPoint);
    }

    const mainCampus = createdCampuses[0].campus;
    const mainSchoolPoint = createdCampuses[0].schoolPoint;

    // Principal
    const principalUser = await prisma.user.create({
      data: {
        name: `${sItem.principalName} (Hiệu trưởng)`,
        email: sItem.principalEmail,
        password: standardPassword,
        role: Role.ADMIN,
        isApproved: true,
        schoolId: school.id,
        departmentId: sItem.departmentId,
        districtWardId: sItem.districtWardId,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: principalUser.id,
        role: Role.ADMIN,
        scopeType: ScopeType.GLOBAL,
      },
    });

    // Special alias for Tran Phu principal if different
    if (sItem.code === "TP") {
      await prisma.user.upsert({
        where: { email: "hieutruong.tranphu@gmail.com" },
        update: { password: standardPassword, schoolId: school.id },
        create: {
          name: "Thầy Đinh Văn Khang (Hiệu trưởng THPT Trần Phú)",
          email: "hieutruong.tranphu@gmail.com",
          password: standardPassword,
          role: Role.ADMIN,
          isApproved: true,
          schoolId: school.id,
          departmentId: sItem.departmentId,
          districtWardId: sItem.districtWardId,
        },
      });
    }

    // Vice Principal
    const vpUser = await prisma.user.create({
      data: {
        name: `${sItem.vpName}`,
        email: sItem.vpEmail,
        password: standardPassword,
        role: Role.VICE_PRINCIPAL,
        isApproved: true,
        schoolId: school.id,
        campusId: mainCampus.id,
        departmentId: sItem.departmentId,
        districtWardId: sItem.districtWardId,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: vpUser.id,
        role: Role.VICE_PRINCIPAL,
        scopeType: ScopeType.CAMPUS,
        scopeId: mainCampus.id,
      },
    });

    // Subject Groups
    const createdGroups = [];
    for (const sg of sItem.subjectGroups) {
      const group = await prisma.subjectGroup.create({
        data: {
          schoolId: school.id,
          name: sg.name,
          description: sg.desc,
        },
      });
      createdGroups.push(group);
    }

    // Teachers
    const createdTeachers = [];
    for (const tInfo of sItem.teachers) {
      const targetGroup = createdGroups[tInfo.groupIndex] || createdGroups[0];
      const teacherEmail = (tInfo as any).emailAlias || `${tInfo.slug}@gmail.com`;

      const tUser = await prisma.user.create({
        data: {
          name: tInfo.name,
          email: teacherEmail,
          password: standardPassword,
          role: tInfo.isHead ? Role.SUBJECT_HEAD : Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
        },
      });

      const teacher = await prisma.teacher.create({
        data: {
          userId: tUser.id,
          specialty: tInfo.specialty,
        },
      });

      if (tInfo.isHead) {
        await prisma.subjectGroup.update({
          where: { id: targetGroup.id },
          data: { headTeacherId: teacher.id },
        });
      }

      await prisma.userRoleScope.create({
        data: {
          userId: tUser.id,
          role: tInfo.isHead ? Role.SUBJECT_HEAD : Role.TEACHER,
          scopeType: ScopeType.SUBJECT_GROUP,
          subjectGroupId: targetGroup.id,
        },
      });

      createdTeachers.push({ user: tUser, teacher, tInfo });
    }

    // Special Alias for Tran Phu Teacher
    if (sItem.code === "TP") {
      await prisma.user.upsert({
        where: { email: "toan.tuan.tp@gmail.com" },
        update: { password: standardPassword, schoolId: school.id },
        create: {
          name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán)",
          email: "toan.tuan.tp@gmail.com",
          password: standardPassword,
          role: Role.SUBJECT_HEAD,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
        },
      });

      // Kế toán Trần Phú
      await prisma.user.upsert({
        where: { email: "ketoan.tp@gmail.com" },
        update: { password: standardPassword, schoolId: school.id },
        create: {
          name: "Nguyễn Thị Phương Mai (Kế toán trưởng)",
          email: "ketoan.tp@gmail.com",
          password: standardPassword,
          role: Role.ADMIN,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
        },
      });
    }

    // Subjects
    const subjectListDef = [
      { name: "Toán học", groupIndex: 0 },
      { name: "Tin học", groupIndex: 0 },
      { name: "Vật lí", groupIndex: createdGroups.length > 1 ? 1 : 0 },
      { name: "Hóa học", groupIndex: createdGroups.length > 1 ? 1 : 0 },
      { name: "Ngữ văn", groupIndex: createdGroups.length > 2 ? 2 : 0 },
      { name: "Tiếng Anh", groupIndex: createdGroups.length > 3 ? 3 : 0 },
      { name: "Chào cờ", groupIndex: 0 },
      { name: "Sinh hoạt lớp", groupIndex: 0 },
    ];

    const createdSubjects = [];
    for (const subDef of subjectListDef) {
      const targetGroup = createdGroups[subDef.groupIndex] || createdGroups[0];
      const matchingTeacher = createdTeachers.find((t) => t.tInfo.specialty.includes(subDef.name) || subDef.name.includes(t.tInfo.specialty));

      const subject = await prisma.subject.create({
        data: {
          name: subDef.name,
          subjectGroupId: targetGroup.id,
          headTeacherId: matchingTeacher?.teacher.id || null,
        },
      });
      createdSubjects.push(subject);
    }

    const busyTeacherSlots = new Set<string>();
    let classCounter = 0;
    const studentSeqByGrade: Record<number, number> = {};
    const createdStudentsList: Array<{ id: string; name: string; classId: string; gradeLevel: number }> = [];

    for (const clsSpec of sItem.classes) {
      classCounter++;
      const homeroomTeacherObj = createdTeachers[(classCounter - 1) % createdTeachers.length].teacher;

      const classRoom = await prisma.classRoom.create({
        data: {
          name: clsSpec.name,
          gradeLevel: clsSpec.gradeLevel,
          schoolId: school.id,
          campusId: mainCampus.id,
          schoolPointId: mainSchoolPoint.id,
          homeroomTeacherId: homeroomTeacherObj.id,
        },
      });

      const group1 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 1" } });
      const group2 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 2" } });
      const groups = [group1, group2];

      const startGradeSeq = (studentSeqByGrade[clsSpec.gradeLevel] || 0) + 1;
      studentSeqByGrade[clsSpec.gradeLevel] = (studentSeqByGrade[clsSpec.gradeLevel] || 0) + clsSpec.count;

      const roster = generateStudentRoster(clsSpec.count, clsSpec.gradeLevel, sItem.code, clsSpec.name, startGradeSeq, sItem.address);

      for (let sIdx = 0; sIdx < roster.length; sIdx++) {
        const stData = roster[sIdx];
        const stUser = await prisma.user.create({
          data: {
            name: stData.name,
            email: stData.email,
            password: standardPassword,
            role: Role.STUDENT,
            isApproved: true,
            schoolId: school.id,
            campusId: mainCampus.id,
          },
        });

        const student = await prisma.student.create({
          data: {
            userId: stUser.id,
            studentCode: stData.studentCode,
            classId: classRoom.id,
            groupId: groups[sIdx % groups.length].id,
            status: StudentStatus.STUDYING,
            dob: stData.dob,
            gender: stData.gender,
            ethnicity: "Kinh",
            nationality: "Việt Nam",
            phone: stData.phone,
            addressCurrent: stData.address,
            parentName: stData.parentName,
            parentPhone: stData.parentPhone,
            isClassMonitor: sIdx === 0,
            classRole: sIdx === 0 ? "LOP_TRUONG" : sIdx === 1 ? "LOP_PHO" : "THANH_VIEN",
          },
        });

        createdStudentsList.push({
          id: student.id,
          name: stData.name,
          classId: classRoom.id,
          gradeLevel: clsSpec.gradeLevel,
        });

        // Ensure special demo student email aliases for 10A1
        if (sItem.code === "TP" && clsSpec.name === "10A1" && sIdx === 0) {
          await prisma.user.upsert({
            where: { email: "hs26100001@gmail.com" },
            update: { password: standardPassword, schoolId: school.id },
            create: {
              name: "Nguyễn Văn An (Học sinh Mẫu 10A1)",
              email: "hs26100001@gmail.com",
              password: standardPassword,
              role: Role.STUDENT,
              isApproved: true,
              schoolId: school.id,
              campusId: mainCampus.id,
            },
          });
        }
        if (sItem.code === "TP" && clsSpec.name === "10A1" && sIdx === 1) {
          await prisma.user.upsert({
            where: { email: "hs26100002@gmail.com" },
            update: { password: standardPassword, schoolId: school.id },
            create: {
              name: "Trần Thị Bình (Học sinh Mẫu 10A1)",
              email: "hs26100002@gmail.com",
              password: standardPassword,
              role: Role.STUDENT,
              isApproved: true,
              schoolId: school.id,
              campusId: mainCampus.id,
            },
          });
        }
      }

      // Teaching assignments
      const classAssignments = [];
      for (const subject of createdSubjects) {
        const assignedTeacher = createdTeachers.find((t) => t.tInfo.specialty.includes(subject.name) || subject.name.includes(t.tInfo.specialty))?.teacher || createdTeachers[0].teacher;
        classAssignments.push({
          classId: classRoom.id,
          subjectId: subject.id,
          teacherId: assignedTeacher.id,
        });
      }
      if (classAssignments.length > 0) {
        await prisma.teachingAssignment.createMany({ data: classAssignments });
      }

      // Create Timetable Schedules with fixed Flag Salute (T2-Tiết 1) & Homeroom (T6-Tiết 4)
      const chaoCoSub = createdSubjects.find((s) => s.name === "Chào cờ") || createdSubjects[0];
      const sinhHoatSub = createdSubjects.find((s) => s.name === "Sinh hoạt lớp") || createdSubjects[0];
      const regularSubjects = createdSubjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp");
      const classSchedules = [];

      for (let day = 1; day <= 5; day++) {
        for (let p = 1; p <= 4; p++) {
          if (day === 1 && p === 1) {
            busyTeacherSlots.add(`${homeroomTeacherObj.id}-${day}-${p}`);
            classSchedules.push({
              classId: classRoom.id,
              subjectId: chaoCoSub.id,
              teacherId: homeroomTeacherObj.id,
              dayOfWeek: 1,
              period: 1,
              room: "Sân trường",
            });
            continue;
          }

          if (day === 5 && p === 4) {
            busyTeacherSlots.add(`${homeroomTeacherObj.id}-${day}-${p}`);
            classSchedules.push({
              classId: classRoom.id,
              subjectId: sinhHoatSub.id,
              teacherId: homeroomTeacherObj.id,
              dayOfWeek: 5,
              period: 4,
              room: `Phòng ${clsSpec.name}`,
            });
            continue;
          }

          let scheduled = false;
          for (let offset = 0; offset < regularSubjects.length; offset++) {
            const subIdx = (classCounter + day + p + offset) % regularSubjects.length;
            const subject = regularSubjects[subIdx];

            const candidateTeachers = createdTeachers
              .filter((t) => t.tInfo.specialty.includes(subject.name) || subject.name.includes(t.tInfo.specialty))
              .map((t) => t.teacher);

            const availableTeacher = candidateTeachers.find((t) => !busyTeacherSlots.has(`${t.id}-${day}-${p}`))
              || createdTeachers.map((t) => t.teacher).find((t) => !busyTeacherSlots.has(`${t.id}-${day}-${p}`));

            if (availableTeacher) {
              busyTeacherSlots.add(`${availableTeacher.id}-${day}-${p}`);
              classSchedules.push({
                classId: classRoom.id,
                subjectId: subject.id,
                teacherId: availableTeacher.id,
                dayOfWeek: day,
                period: p,
                room: `Phòng ${clsSpec.name}`,
              });
              scheduled = true;
              break;
            }
          }
        }
      }

      if (classSchedules.length > 0) {
        await prisma.schedule.createMany({ data: classSchedules });
      }
    }

    // Attendance Seed (10 recent school days)
    const recentDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12];
    const attendanceBatch = [];
    for (const d of recentDays) {
      const dateObj = new Date(`2026-09-${String(d).padStart(2, "0")}T07:30:00.000Z`);
      for (const st of createdStudentsList) {
        const rand = (st.name.length + d * 7) % 100;
        let attStatus = AttendanceStatus.PRESENT;
        if (rand > 96) attStatus = AttendanceStatus.ABSENT_EXCUSED;
        else if (rand > 93) attStatus = AttendanceStatus.LATE;

        attendanceBatch.push({
          studentId: st.id,
          classId: st.classId,
          date: dateObj,
          status: attStatus,
          period: 1,
        });
      }
    }
    if (attendanceBatch.length > 0) {
      await prisma.attendance.createMany({ data: attendanceBatch });
    }

    // Multi-Year Exam Periods (2023 - 2026)
    const examPeriodSpecs = [
      { name: "Cuối kỳ 1 2023-2024", schoolYear: "2023-2024", semester: ExamSemester.HK1, examType: ExamType.FINAL, orderIndex: 1 },
      { name: "Cuối kỳ 2 2023-2024", schoolYear: "2023-2024", semester: ExamSemester.HK2, examType: ExamType.FINAL, orderIndex: 2 },
      { name: "Cuối kỳ 1 2024-2025", schoolYear: "2024-2025", semester: ExamSemester.HK1, examType: ExamType.FINAL, orderIndex: 3 },
      { name: "Cuối kỳ 2 2024-2025", schoolYear: "2024-2025", semester: ExamSemester.HK2, examType: ExamType.FINAL, orderIndex: 4 },
      { name: "Cuối kỳ 1 2025-2026", schoolYear: "2025-2026", semester: ExamSemester.HK1, examType: ExamType.FINAL, orderIndex: 5 },
    ];

    const createdExamPeriods = [];
    for (const ep of examPeriodSpecs) {
      const createdEp = await prisma.examPeriod.create({
        data: {
          schoolId: school.id,
          campusId: mainCampus.id,
          name: ep.name,
          schoolYear: ep.schoolYear,
          semester: ep.semester,
          examType: ep.examType,
          orderIndex: ep.orderIndex,
          isLocked: true,
        },
      });
      createdExamPeriods.push(createdEp);
    }

    // Multi-Year Exam Scores
    const scoreBatch = [];
    for (let stIdx = 0; stIdx < Math.min(createdStudentsList.length, 25); stIdx++) {
      const st = createdStudentsList[stIdx];
      const baseAbility = 6.0 + (stIdx % 40) * 0.08;
      const growthFactor = (stIdx % 5 === 0) ? 0.35 : (stIdx % 7 === 0) ? -0.25 : 0.12;

      for (const ep of createdExamPeriods) {
        for (const sub of createdSubjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp")) {
          const noise = ((stIdx + ep.orderIndex + sub.name.length) % 11 - 5) * 0.15;
          let finalScore = Math.min(10.0, Math.max(2.5, baseAbility + (ep.orderIndex - 1) * growthFactor + noise));
          finalScore = Math.round(finalScore * 10) / 10;

          scoreBatch.push({
            studentId: st.id,
            subjectId: sub.id,
            examPeriodId: ep.id,
            schoolId: school.id,
            campusId: mainCampus.id,
            score: finalScore,
          });
        }
      }
    }
    if (scoreBatch.length > 0) {
      await prisma.studentScore.createMany({ data: scoreBatch });
    }

    // Equipment Seed
    const equipmentDefs = [
      { code: `${sItem.code}-LAB-01`, name: "Phòng Thực hành Tin học Chuẩn Quốc gia", cat: EquipmentCategory.IT_COMPUTER, qty: 45, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-LAB-02`, name: "Phòng Thí nghiệm Vật lí - Kỹ thuật số", cat: EquipmentCategory.LAB_PHYSICS, qty: 15, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-LAB-03`, name: "Phòng Thí nghiệm Hóa - Sinh công nghệ cao", cat: EquipmentCategory.LAB_CHEMISTRY, qty: 15, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-PROJ-01`, name: "Hệ thống Smart Tivi & Máy chiếu tương tác", cat: EquipmentCategory.PROJECTOR_SCREEN, qty: 30, cond: EquipmentCondition.GOOD },
    ];

    for (const eq of equipmentDefs) {
      const createdEq = await prisma.equipment.create({
        data: {
          code: eq.code,
          name: eq.name,
          category: eq.cat,
          schoolId: school.id,
          schoolPointId: mainSchoolPoint.id,
          totalQuantity: eq.qty,
          availableQuantity: eq.qty,
          condition: eq.cond,
        },
      });
      createdEquipmentsList.push(createdEq);
    }

    // Official Documents
    await prisma.officialDocument.create({
      data: {
        docNumber: `2026/${sItem.code}-KHGD`,
        title: `Kế hoạch Giáo dục Nhà trường GDPT 2018 - Năm học 2026-2027`,
        issuer: sItem.name,
        docType: DocumentType.INCOMING,
        urgency: DocumentUrgency.URGENT,
        status: DocumentStatus.PROCESSING,
        issueDate: new Date("2026-08-20"),
        summary: `Đổi mới phương pháp dạy học, nâng cao chất lượng giáo dục mũi nhọn và chuyển đổi số toàn diện theo chuẩn ${sItem.name}.`,
        schoolId: school.id,
      },
    });

    // AI Alert & Config Thresholds
    await prisma.aiConfigThreshold.create({
      data: {
        schoolId: school.id,
        taskGroup: AiTaskGroup.REALTIME_MONITORING,
        metricKey: "ATTENDANCE_CRITICAL_RATE",
        metricName: "Tỷ lệ chuyên cần mức báo động đỏ (%)",
        thresholdValue: 90.0,
        severity: AiAlertSeverity.CRITICAL,
        comparisonOp: "GTE",
      },
    });

    await prisma.aiConfigThreshold.create({
      data: {
        schoolId: school.id,
        taskGroup: AiTaskGroup.REALTIME_MONITORING,
        metricKey: "ACADEMIC_DECLINE_DROP_PTS",
        metricName: "Mức sụt giảm điểm trung bình cần can thiệp (Điểm)",
        thresholdValue: 1.5,
        severity: AiAlertSeverity.HIGH,
        comparisonOp: "GTE",
      },
    });

    console.log(`   ✅ Đã khởi tạo hoàn tất dữ liệu cho trường: ${sItem.name}`);
  }

  // 6. Khởi tạo Thiết bị Điều chuyển liên cơ sở (Equipment Transfers)
  console.log("\n📦 [6/7] Khởi tạo các giao dịch điều chuyển thiết bị liên cơ sở (Equipment Transfers)...");
  if (createdEquipmentsList.length >= 2 && createdPointsList.length >= 2) {
    const eq1 = createdEquipmentsList[0];
    const p1 = createdPointsList[0];
    const p2 = createdPointsList[1];

    await prisma.equipmentTransfer.create({
      data: {
        equipmentId: eq1.id,
        schoolId: eq1.schoolId,
        fromSchoolPointId: p1.id,
        toSchoolPointId: p2.id,
        quantity: 5,
        transferDate: new Date("2026-09-01"),
        returnExpectedDate: new Date("2026-10-15"),
        reason: "Phục vụ kỳ thi Học sinh Giỏi cấp Tỉnh đợt 1",
        status: TransferStatus?.COMPLETED || "COMPLETED",
        aiRecommendation: "Khuyến nghị điều chuyển: Cơ sở 2 đang thiếu 5 thiết bị cho phòng thi quốc gia.",
      },
    });

    if (createdEquipmentsList.length >= 3) {
      const eq2 = createdEquipmentsList[2];
      await prisma.equipmentTransfer.create({
        data: {
          equipmentId: eq2.id,
          schoolId: eq2.schoolId,
          fromSchoolPointId: p1.id,
          toSchoolPointId: p2.id,
          quantity: 3,
          transferDate: new Date("2026-09-10"),
          returnExpectedDate: new Date("2026-11-30"),
          reason: "Tăng cường trang thiết bị thực hành Công nghệ",
          status: TransferStatus?.IN_TRANSIT || "IN_TRANSIT",
          aiRecommendation: "AI đề xuất phê duyệt: Lịch giảng dạy tại cơ sở 1 không bị trùng lịch.",
        },
      });
    }
  }

  // 7. KPIs & Quality Objectives Toàn Quốc & Tài khoản Demo tương thích
  console.log("\n📊 [7/7] Khởi tạo Bộ chỉ tiêu KPI, Mục tiêu Chất lượng và Tài khoản Demo Tiện ích...");
  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-VN-01",
      name: "Tỷ lệ Học sinh Đỗ Tốt nghiệp THPT & Đại học Toàn quốc",
      category: KpiCategory.EDUCATIONAL_QUALITY,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 20,
      baselineValue: 95.0,
      targetValue: 99.8,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-VN-02",
      name: "Tỷ lệ Giáo viên Đạt Chuẩn Giảng dạy GDPT 2018 và Chuyển Đổi Số",
      category: KpiCategory.PROFESSIONAL,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 25,
      baselineValue: 90.0,
      targetValue: 100.0,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.qualityObjective.create({
    data: {
      code: "QO-VN-2026-01",
      title: "Nâng cao chất lượng giáo dục mũi nhọn và năng lực số cho học sinh",
      category: QualityCategory.ACADEMIC,
      metricName: "Tỷ lệ HS Khá Giỏi",
      unit: "%",
      baselineValue: 91.0,
      targetValue: 96.0,
      actualValue: 97.5,
      direction: MeasurementDirection.HIGHER_BETTER,
      status: QualityObjectiveStatus.EXCEEDED,
      academicYear: "2026-2027",
      reportingFrequency: ReportingFrequency.SEMESTER,
    },
  });

  // Generic fallback accounts for testing
  if (firstSchoolCreated) {
    const demoAccounts = [
      {
        email: "superadmin.demo@gmail.com",
        name: "Quản Trị Viên Tối Cao (Demo)",
        role: Role.SUPER_ADMIN,
        schoolId: null,
      },
      {
        email: "admin@school.com",
        name: "Quản Trị Viên Hệ Thống (Fallback)",
        role: Role.SUPER_ADMIN,
        schoolId: null,
      },
      {
        email: "principal@school.com",
        name: "Hiệu trưởng Mẫu (Fallback)",
        role: Role.ADMIN,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "teacher@school.com",
        name: "Giáo viên Mẫu (Fallback)",
        role: Role.TEACHER,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "student@school.com",
        name: "Học sinh Mẫu (Fallback)",
        role: Role.STUDENT,
        schoolId: firstSchoolCreated.id,
      },
    ];

    for (const acc of demoAccounts) {
      await prisma.user.upsert({
        where: { email: acc.email },
        update: { password: standardPassword, schoolId: acc.schoolId },
        create: {
          name: acc.name,
          email: acc.email,
          password: standardPassword,
          role: acc.role,
          isApproved: true,
          schoolId: acc.schoolId,
        },
      });
    }
  }

  console.log("\n🎉 ==================================================================================");
  console.log("✅ HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU TOÀN QUỐC (HÀ NỘI, TP.HCM, ĐÀ NẴNG, NINH BÌNH)!");
  console.log("   - SuperAdmin: superadmin@gmail.com (Mật khẩu: abc123)");
  console.log("   - Sở GD&ĐT Hà Nội: sogd.hanoi@gmail.com (Mật khẩu: abc123)");
  console.log("   - Sở GD&ĐT TP.HCM: sogd.tphcm@gmail.com (Mật khẩu: abc123)");
  console.log("   - Sở GD&ĐT Đà Nẵng: sogd.danang@gmail.com (Mật khẩu: abc123)");
  console.log("   - Sở GD&ĐT Ninh Bình: sogd.ninhbinh@gmail.com (Mật khẩu: abc123)");
  console.log("   - THPT Chu Văn An: hieutruong.chuvanan@gmail.com (Mật khẩu: abc123)");
  console.log("   - THPT Chuyên Lê Hồng Phong: hieutruong.lehongphong@gmail.com (Mật khẩu: abc123)");
  console.log("   - THPT Phan Châu Trinh: hieutruong.phanchautrinh@gmail.com (Mật khẩu: abc123)");
  console.log("   - THPT Trần Phú: hieutruong.thpt.tranphu@gmail.com (Mật khẩu: abc123)");
  console.log("==================================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi khởi tạo dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
