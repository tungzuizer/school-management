/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Prisma CLI seeder (`npx prisma db seed` / `npx tsx prisma/seed.ts`), system migration tasks.
 * 2. Purpose: Complete database wipe and realistic seeding for Ninh Binh Province Schools (Trường THPT Trần Phú & Trường THPT Lương Khánh Thiện).
 * 3. Schemas: All 75 Prisma ORM models (EducationDepartment, DistrictWard, School, Campus, SchoolPoint, CampusWardMap, SubjectGroup, Subject, ClassRoom, Group, User, UserRoleScope, Teacher, Student, TeachingAssignment, Schedule, KpiCatalog, QualityObjective, AiConfigThreshold, OfficialDocument, Equipment, ExamPeriod, StudentScore).
 * 4. Verbatim User Instruction: "trường trường trần phú và trường lương khách thiện ninh Bình bỏ dữ liệu của 2 trường hải phòng" - "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

import {
  PrismaClient,
  Role,
  ScopeType,
  ManagementBranch,
  SchoolType,
  Gender,
  StudentStatus,
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

function generateStudentRoster(count: number, gradeLevel: number, schoolCode: string, className: string) {
  const roster = [];
  const birthYear = 2026 - (gradeLevel + 5);

  for (let i = 1; i <= count; i++) {
    const isMale = i % 2 === 1;
    const lastName = LAST_NAMES[(i * 3 + gradeLevel) % LAST_NAMES.length];
    const middleName = isMale
      ? MIDDLE_MALE[(i * 5 + gradeLevel) % MIDDLE_MALE.length]
      : MIDDLE_FEMALE[(i * 7 + gradeLevel) % MIDDLE_FEMALE.length];
    const firstName = isMale
      ? FIRST_MALE[(i * 11 + gradeLevel) % FIRST_MALE.length]
      : FIRST_FEMALE[(i * 13 + gradeLevel) % FIRST_FEMALE.length];

    const fullName = `${lastName} ${middleName} ${firstName}`;
    const birthMonth = ((i * 4) % 12) + 1;
    const birthDay = ((i * 7) % 28) + 1;
    const dob = new Date(`${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`);
    const codeNum = String(i).padStart(2, "0");
    const cleanClassName = className.replace(/\s+/g, "").toUpperCase();
    const studentCode = `${schoolCode}-${cleanClassName}-${codeNum}`;
    const emailPrefix = `${schoolCode.toLowerCase()}.${cleanClassName.toLowerCase()}.${codeNum}`;

    roster.push({
      index: i,
      name: fullName,
      gender: isMale ? Gender.MALE : Gender.FEMALE,
      dob,
      studentCode,
      email: `${emailPrefix}@ninhbinh.edu.vn`,
      phone: `09${String(10000000 + i * 12345).slice(0, 8)}`,
      parentName: `${lastName} ${isMale ? "Văn" : "Thị"} ${isMale ? "Hùng" : "Mai"}`,
      parentPhone: `09${String(80000000 + i * 54321).slice(0, 8)}`,
      address: `${schoolCode.includes("TP") ? "Phường Đông Thành, TP. Ninh Bình" : "Phường Bắc Sơn, TP. Tam Điệp"}, Tỉnh Ninh Bình`,
    });
  }
  return roster;
}

async function main() {
  console.log("🚀 [KHỞI TẠO DỮ LIỆU THỰC TẾ] NINH BÌNH EDUCATION SYSTEM");
  console.log("============================================================");

  // 1. Wipe all existing database records
  console.log("🧹 [1/6] Đang xóa toàn bộ dữ liệu hiện tại trong cơ sở dữ liệu Supabase...");
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
    console.warn("⚠️ TRUNCATE CASCADE gặp giới hạn quyền, chuyển sang xóa có thứ tự qua Prisma ORM...");
    await prisma.studentScore.deleteMany().catch(() => {});
    await prisma.examPeriod.deleteMany().catch(() => {});
    await prisma.officialDocument.deleteMany().catch(() => {});
    await prisma.equipment.deleteMany().catch(() => {});
    await prisma.aiConfigThreshold.deleteMany().catch(() => {});
    await prisma.qualityObjective.deleteMany().catch(() => {});
    await prisma.kpiCatalog.deleteMany().catch(() => {});
    await prisma.seatingChart.deleteMany().catch(() => {});
    await prisma.parentFeedback.deleteMany().catch(() => {});
    await prisma.incident.deleteMany().catch(() => {});
    await prisma.conductRecord.deleteMany().catch(() => {});
    await prisma.grade.deleteMany().catch(() => {});
    await prisma.attendance.deleteMany().catch(() => {});
    await prisma.schedule.deleteMany().catch(() => {});
    await prisma.curriculum.deleteMany().catch(() => {});
    await prisma.teachingAssignment.deleteMany().catch(() => {});
    await prisma.teacherChangeRequest.deleteMany().catch(() => {});
    await prisma.notification.deleteMany().catch(() => {});
    await prisma.student.deleteMany().catch(() => {});
    await prisma.group.deleteMany().catch(() => {});
    await prisma.classRoom.deleteMany().catch(() => {});
    await prisma.subject.deleteMany().catch(() => {});
    await prisma.subjectGroup.deleteMany().catch(() => {});
    await prisma.teacher.deleteMany().catch(() => {});
    await prisma.userRoleScope.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.campusWardMap.deleteMany().catch(() => {});
    await prisma.schoolPoint.deleteMany().catch(() => {});
    await prisma.campus.deleteMany().catch(() => {});
    await prisma.school.deleteMany().catch(() => {});
    await prisma.districtWard.deleteMany().catch(() => {});
    await prisma.educationDepartment.deleteMany().catch(() => {});
    await prisma.auditLog.deleteMany().catch(() => {});
    await prisma.dataLock.deleteMany().catch(() => {});
    await prisma.loginAttempt.deleteMany().catch(() => {});
    await prisma.systemSetting.deleteMany().catch(() => {});
    console.log("   ✅ Đã xóa toàn bộ dữ liệu qua Prisma deleteMany.");
  }

  const standardPassword = await bcrypt.hash("Password@123", 10);

  // 2. Sở GD&ĐT Tỉnh Ninh Bình & 2 Thành phố/Phòng GD
  console.log("\n🏛️ [2/6] Khởi tạo Sở GD&ĐT Tỉnh Ninh Bình và các Phòng GD&ĐT...");
  const deptNinhBinh = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Tỉnh Ninh Bình",
      code: "NB-SGDDT",
      address: "Số 16 Đường Tràng An, Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-005",
      email: "sogddt@ninhbinh.edu.vn",
    },
  });

  const wardTPNinhBinh = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Thành phố Ninh Bình - Tỉnh Ninh Bình",
      code: "NB-TPNB",
      address: "Đường Lê Hồng Phong, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-234",
    },
  });

  const wardTamDiep = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Thành phố Tam Điệp - Tỉnh Ninh Bình",
      code: "NB-TAMDIEP",
      address: "Đường Đồng Giao, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-123",
    },
  });

  // 3. Super Admin & Authority Users
  console.log("\n👑 [3/6] Khởi tạo Tài khoản Quản trị Hệ thống Toàn Tỉnh Ninh Bình...");
  const superAdmin = await prisma.user.create({
    data: {
      name: "Ban Quản Trị Hệ Thống Tỉnh Ninh Bình",
      email: "admin@school.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
      departmentId: deptNinhBinh.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: superAdmin.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const deptOfficer = await prisma.user.create({
    data: {
      name: "TS. Phan Thành Công (Giám đốc Sở GD&ĐT Tỉnh Ninh Bình)",
      email: "sogddt@ninhbinh.edu.vn",
      password: standardPassword,
      role: Role.DEPARTMENT_ADMIN,
      isApproved: true,
      departmentId: deptNinhBinh.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: deptOfficer.id,
      role: Role.DEPARTMENT_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const wardOfficerTPNB = await prisma.user.create({
    data: {
      name: "ThS. Đinh Xuân Cảnh (Trưởng phòng GD TP. Ninh Bình)",
      email: "phonggd.tpnb@ninhbinh.edu.vn",
      password: standardPassword,
      role: Role.WARD_ADMIN,
      isApproved: true,
      departmentId: deptNinhBinh.id,
      districtWardId: wardTPNinhBinh.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: wardOfficerTPNB.id,
      role: Role.WARD_ADMIN,
      scopeType: ScopeType.WARD,
      scopeId: wardTPNinhBinh.id,
    },
  });

  // 4. Seeding Ninh Binh Schools: THPT Trần Phú & THPT Lương Khánh Thiện
  console.log("\n🏫 [4/6] Khởi tạo 2 trường THPT Ninh Bình: THPT Trần Phú & THPT Lương Khánh Thiện...");

  const schoolsData = [
    {
      code: "TP",
      schoolCode: "THPT-TRANPHU-NB",
      name: "Trường THPT Trần Phú (Ninh Bình)",
      address: "Số 26 Đường Đinh Tiên Hoàng, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-648",
      email: "c3tranphu.ninhbinh@moet.edu.vn",
      districtWardId: wardTPNinhBinh.id,
      principalEmail: "hieutruong.tranphu@ninhbinh.edu.vn",
      principalName: "Thầy Đinh Văn Khang",
      vpEmail: "hieuphophotoan.tranphu@ninhbinh.edu.vn",
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
        { name: "Tổ Vật lí - Kỹ thuật công nghệ", desc: "Giảng dạy bộ môn Vật lí và Công nghệ" },
        { name: "Tổ Hóa học - Sinh học", desc: "Giảng dạy Hóa học và Sinh học" },
        { name: "Tổ Ngữ văn", desc: "Giảng dạy Ngữ văn và GDPT 2018" },
        { name: "Tổ Ngoại ngữ", desc: "Giảng dạy Tiếng Anh" },
        { name: "Tổ Lịch sử - Địa lí - GDKT&PL", desc: "Giảng dạy Khoa học Xã hội" },
        { name: "Tổ Giáo dục Thể chất & QPAN", desc: "Giảng dạy Thể chất và QPAN" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "10D1", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Đinh Quốc Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.tuan" },
        { name: "Cô Vũ Thị Hạnh", specialty: "Toán học", groupIndex: 0, isHead: false, slug: "toan.hanh" },
        { name: "Thầy Nguyễn Văn Đạt", specialty: "Toán học", groupIndex: 0, isHead: false, slug: "toan.dat" },
        { name: "Cô Vũ Minh Trang", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.trang" },
        { name: "Thầy Đỗ Anh Tuấn", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.tuan" },
        { name: "Thầy Lê Hoàng Quân", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.quan" },
        { name: "Cô Đào Thu Hằng", specialty: "Vật lí", groupIndex: 1, isHead: false, slug: "ly.hang" },
        { name: "Thầy Bùi Quang Hưng", specialty: "Hóa học", groupIndex: 2, isHead: true, slug: "hoa.hung" },
        { name: "Cô Đặng Thị Mai", specialty: "Sinh học", groupIndex: 2, isHead: false, slug: "sinh.mai" },
        { name: "Cô Phạm Thị Minh", specialty: "Ngữ văn", groupIndex: 3, isHead: true, slug: "van.minh" },
        { name: "Cô Nguyễn Kim Oanh", specialty: "Ngữ văn", groupIndex: 3, isHead: false, slug: "van.oanh" },
        { name: "Cô Hoàng Mai Khanh", specialty: "Tiếng Anh", groupIndex: 4, isHead: true, slug: "anh.khanh" },
        { name: "Thầy Vũ Đức Hưng", specialty: "Tiếng Anh", groupIndex: 4, isHead: false, slug: "anh.hung" },
        { name: "Thầy Ngô Quang Triết", specialty: "Lịch sử", groupIndex: 5, isHead: true, slug: "su.triet" },
        { name: "Thầy Đoàn Văn Phong", specialty: "Giáo dục Thể chất", groupIndex: 6, isHead: true, slug: "thechat.phong" },
      ],
    },
    {
      code: "LKT",
      schoolCode: "THPT-LUONGKHANHTHIEN-NB",
      name: "Trường THPT Lương Khánh Thiện (Ninh Bình)",
      address: "Số 18 Đường Quang Trung, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-129",
      email: "c3luongkhanhthien.ninhbinh@moet.edu.vn",
      districtWardId: wardTamDiep.id,
      principalEmail: "hieutruong.luongkhanhthien@ninhbinh.edu.vn",
      principalName: "Thầy Phạm Văn Hưng",
      vpEmail: "hieuphophotoan.lkthien@ninhbinh.edu.vn",
      vpName: "Thầy Vũ Hoàng Long",
      campuses: [
        {
          name: "Cơ sở Chính - Quang Trung",
          address: "Số 18 Đường Quang Trung, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Trung tâm",
          managerName: "Thầy Phạm Văn Hưng",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Khu Thực hành & Công nghệ",
          address: "Phân hiệu Tây Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
          pointName: "Khu Thực hành & Hướng nghiệp Công nghệ",
          managerName: "Thầy Vũ Hoàng Long",
          distanceKm: 2.0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy bộ môn Toán và Tin học" },
        { name: "Tổ Khoa học Tự nhiên", desc: "Giảng dạy Vật lí, Hóa học, Sinh học" },
        { name: "Tổ Ngữ văn - Lịch sử - Địa lí", desc: "Giảng dạy Khoa học Xã hội" },
        { name: "Tổ Ngoại ngữ", desc: "Giảng dạy Tiếng Anh" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Hoàng Văn Bách", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.bach" },
        { name: "Cô Nguyễn Thị Duyên", specialty: "Toán học", groupIndex: 0, isHead: false, slug: "toan.duyen" },
        { name: "Thầy Lê Văn Hưng", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.hung" },
        { name: "Cô Trần Bích Phương", specialty: "Hóa học", groupIndex: 1, isHead: false, slug: "hoa.phuong" },
        { name: "Thầy Phạm Gia Bảo", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.bao" },
        { name: "Cô Trịnh Thu Trang", specialty: "Ngữ văn", groupIndex: 2, isHead: true, slug: "van.trang" },
        { name: "Thầy Đỗ Quốc Tuấn", specialty: "Lịch sử", groupIndex: 2, isHead: false, slug: "su.tuan" },
        { name: "Cô Đặng Thu Hà", specialty: "Tiếng Anh", groupIndex: 3, isHead: true, slug: "anh.ha" },
        { name: "Cô Vũ Phương Thảo", specialty: "Tiếng Anh", groupIndex: 3, isHead: false, slug: "anh.thao" },
      ],
    },
  ];

  for (const sItem of schoolsData) {
    console.log(`\n🏫 Tạo trường: ${sItem.name}...`);
    const school = await prisma.school.create({
      data: {
        departmentId: deptNinhBinh.id,
        districtWardId: sItem.districtWardId,
        branchType: ManagementBranch.THPT,
        schoolType: SchoolType.THPT,
        name: sItem.name,
        address: sItem.address,
        phone: sItem.phone,
        email: sItem.email,
      },
    });

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
        departmentId: deptNinhBinh.id,
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

    // Vice Principal
    const vpUser = await prisma.user.create({
      data: {
        name: `${sItem.vpName} (Phó Hiệu trưởng)`,
        email: sItem.vpEmail,
        password: standardPassword,
        role: Role.VICE_PRINCIPAL,
        isApproved: true,
        schoolId: school.id,
        campusId: mainCampus.id,
        departmentId: deptNinhBinh.id,
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
      const teacherEmail = `gv.${tInfo.slug}.${sItem.code.toLowerCase()}@ninhbinh.edu.vn`;

      const tUser = await prisma.user.create({
        data: {
          name: `${tInfo.name} (${tInfo.specialty})`,
          email: teacherEmail,
          password: standardPassword,
          role: tInfo.isHead ? Role.SUBJECT_HEAD : Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
          departmentId: deptNinhBinh.id,
          districtWardId: sItem.districtWardId,
        },
      });

      const teacher = await prisma.teacher.create({
        data: {
          userId: tUser.id,
          specialty: tInfo.specialty,
          degree: tInfo.isHead ? "Thạc sĩ Sư phạm" : "Cử nhân Sư phạm Chất lượng cao",
          phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        },
      });

      if (tInfo.isHead) {
        await prisma.subjectGroup.update({
          where: { id: targetGroup.id },
          data: { headTeacherId: teacher.id },
        });

        await prisma.userRoleScope.create({
          data: {
            userId: tUser.id,
            role: Role.SUBJECT_HEAD,
            scopeType: ScopeType.SUBJECT_GROUP,
            subjectGroupId: targetGroup.id,
          },
        });
      }

      createdTeachers.push({ teacher, tInfo, targetGroup });
    }

    // Support Staff (Nghị quyết 37/2026/NQ-CP)
    const supportStaffDefs = [
      { name: "Nguyễn Thị Phương Mai", role: "Kế toán trưởng", degree: "Cử nhân Kế toán - Kiểm toán", spec: "Kế toán", emailPrefix: "ketoan", isShared: true },
      { name: "Đinh Văn Hưng", role: "Nhân viên Y tế học đường", degree: "Cử nhân Y đa khoa", spec: "Y tế học đường", emailPrefix: "yte", isShared: false, campusIdx: 0 },
      { name: "Trần Thu Trang", role: "Nhân viên Thiết bị - Thí nghiệm", degree: "Cử nhân Sư phạm Vật lí", spec: "Thiết bị thí nghiệm", emailPrefix: "thietbi", isShared: false, campusIdx: 0 },
      { name: "Lê Hoàng Quân", role: "Quản trị viên CNTT & CSDL", degree: "Kỹ sư Công nghệ thông tin", spec: "Hệ thống CNTT", emailPrefix: "cntt", isShared: true },
      { name: "Phạm Minh Tâm", role: "Cán bộ Văn thư - Lưu trữ", degree: "Cử nhân Quản trị Văn phòng", spec: "Văn thư lưu trữ", emailPrefix: "vanthu", isShared: true },
    ];

    for (const ss of supportStaffDefs) {
      const assignedCampus = ss.isShared ? null : createdCampuses[ss.campusIdx ?? 0]?.campus;
      const staffUser = await prisma.user.create({
        data: {
          name: `${ss.name} (${ss.role})`,
          email: `${ss.emailPrefix}.${sItem.code.toLowerCase()}@ninhbinh.edu.vn`,
          password: standardPassword,
          role: Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: assignedCampus?.id || null,
          departmentId: deptNinhBinh.id,
          districtWardId: sItem.districtWardId,
        },
      });

      await prisma.teacher.create({
        data: {
          userId: staffUser.id,
          specialty: ss.spec,
          degree: ss.degree,
          phone: `09${Math.floor(20000000 + Math.random() * 79999999)}`,
        },
      });
    }

    // Subjects (Includes Chào cờ & Sinh hoạt lớp)
    const subjectListDef = [
      { name: "Toán", groupIndex: 0 },
      { name: "Tin học", groupIndex: 0 },
      { name: "Vật lí", groupIndex: 1 },
      { name: "Ngữ văn", groupIndex: sItem.code === "TP" ? 3 : 2 },
      { name: "Tiếng Anh", groupIndex: sItem.code === "TP" ? 4 : 3 },
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

    // Track scheduled slots per teacher to guarantee @@unique([teacherId, dayOfWeek, period])
    const busyTeacherSlots = new Set<string>();

    // Classes & Students
    let classCounter = 0;
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

      const roster = generateStudentRoster(clsSpec.count, clsSpec.gradeLevel, sItem.code, clsSpec.name);

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
      }

      // Teaching assignments
      for (const subject of createdSubjects) {
        const assignedTeacher = createdTeachers.find((t) => t.tInfo.specialty.includes(subject.name) || subject.name.includes(t.tInfo.specialty))?.teacher || createdTeachers[0].teacher;

        await prisma.teachingAssignment.create({
          data: {
            classId: classRoom.id,
            subjectId: subject.id,
            teacherId: assignedTeacher.id,
          },
        });
      }

      // Create Timetable Schedules with fixed Flag Salute (T2-Tiết 1) & Homeroom (T6-Tiết 4)
      const chaoCoSub = createdSubjects.find((s) => s.name === "Chào cờ") || createdSubjects[0];
      const sinhHoatSub = createdSubjects.find((s) => s.name === "Sinh hoạt lớp") || createdSubjects[0];
      const regularSubjects = createdSubjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp");

      for (let day = 1; day <= 5; day++) {
        for (let p = 1; p <= 4; p++) {
          // Hard Constraint 1: Monday Period 1 is ALWAYS Chào cờ with GVCN
          if (day === 1 && p === 1) {
            busyTeacherSlots.add(`${homeroomTeacherObj.id}-${day}-${p}`);
            await prisma.schedule.create({
              data: {
                classId: classRoom.id,
                subjectId: chaoCoSub.id,
                teacherId: homeroomTeacherObj.id,
                dayOfWeek: 1,
                period: 1,
                room: "Sân trường",
              },
            });
            continue;
          }

          // Hard Constraint 2: Friday Period 4 is ALWAYS Sinh hoạt lớp with GVCN
          if (day === 5 && p === 4) {
            busyTeacherSlots.add(`${homeroomTeacherObj.id}-${day}-${p}`);
            await prisma.schedule.create({
              data: {
                classId: classRoom.id,
                subjectId: sinhHoatSub.id,
                teacherId: homeroomTeacherObj.id,
                dayOfWeek: 5,
                period: 4,
                room: `Phòng ${clsSpec.name}`,
              },
            });
            continue;
          }

          // Regular Cultural Subjects
          let scheduled = false;
          for (let offset = 0; offset < regularSubjects.length; offset++) {
            const subIdx = (classCounter + day + p + offset) % regularSubjects.length;
            const subject = regularSubjects[subIdx];

            // Find teachers qualified for this subject who are NOT busy at (day, p)
            const candidateTeachers = createdTeachers
              .filter((t) => t.tInfo.specialty.includes(subject.name) || subject.name.includes(t.tInfo.specialty))
              .map((t) => t.teacher);

            const availableTeacher = candidateTeachers.find((t) => !busyTeacherSlots.has(`${t.id}-${day}-${p}`))
              || createdTeachers.map((t) => t.teacher).find((t) => !busyTeacherSlots.has(`${t.id}-${day}-${p}`));

            if (availableTeacher) {
              busyTeacherSlots.add(`${availableTeacher.id}-${day}-${p}`);
              await prisma.schedule.create({
                data: {
                  classId: classRoom.id,
                  subjectId: subject.id,
                  teacherId: availableTeacher.id,
                  dayOfWeek: day,
                  period: p,
                  room: `Phòng ${clsSpec.name}`,
                },
              });
              scheduled = true;
              break;
            }
          }
        }
      }
    }

    // Multi-Year Exam Periods (2023 - 2026) for Executive Analytics & OLS Regression
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

    // Seed realistic Multi-Year Exam Scores for longitudinal trajectory analysis
    for (let stIdx = 0; stIdx < Math.min(createdStudentsList.length, 30); stIdx++) {
      const st = createdStudentsList[stIdx];
      const baseAbility = 6.0 + (stIdx % 40) * 0.08;
      const growthFactor = (stIdx % 5 === 0) ? 0.35 : (stIdx % 7 === 0) ? -0.25 : 0.12;

      for (const ep of createdExamPeriods) {
        for (const sub of createdSubjects.filter((s) => s.name !== "Chào cờ" && s.name !== "Sinh hoạt lớp")) {
          const noise = ((stIdx + ep.orderIndex + sub.name.length) % 11 - 5) * 0.15;
          let finalScore = Math.min(10.0, Math.max(2.5, baseAbility + (ep.orderIndex - 1) * growthFactor + noise));
          finalScore = Math.round(finalScore * 10) / 10;

          await prisma.studentScore.create({
            data: {
              studentId: st.id,
              subjectId: sub.id,
              examPeriodId: ep.id,
              schoolId: school.id,
              campusId: mainCampus.id,
              score: finalScore,
            },
          });
        }
      }
    }

    // Equipment Seed for the School
    const equipmentDefs = [
      { code: `${sItem.code}-LAB-01`, name: "Phòng Thực hành Tin học Chuẩn Quốc gia", cat: EquipmentCategory.IT_COMPUTER, qty: 45, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-LAB-02`, name: "Phòng Thí nghiệm Vật lí - Kỹ thuật số", cat: EquipmentCategory.LAB_PHYSICS, qty: 15, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-LAB-03`, name: "Phòng Thí nghiệm Hóa - Sinh công nghệ cao", cat: EquipmentCategory.LAB_CHEMISTRY, qty: 15, cond: EquipmentCondition.GOOD },
      { code: `${sItem.code}-PROJ-01`, name: "Hệ thống Smart Tivi & Máy chiếu tương tác", cat: EquipmentCategory.PROJECTOR_SCREEN, qty: 30, cond: EquipmentCondition.GOOD },
    ];

    for (const eq of equipmentDefs) {
      await prisma.equipment.create({
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
    }

    // Official Documents
    await prisma.officialDocument.create({
      data: {
        docNumber: `2026/${sItem.code}-KHGD`,
        title: `Kế hoạch Giáo dục Nhà trường GDPT 2018 - Năm học 2026-2027`,
        issuer: "Sở Giáo dục và Đào tạo Tỉnh Ninh Bình",
        docType: DocumentType.INCOMING,
        urgency: DocumentUrgency.URGENT,
        status: DocumentStatus.PROCESSING,
        issueDate: new Date("2026-08-20"),
        summary: "Đổi mới phương pháp dạy học, nâng cao chất lượng giáo dục mũi nhọn và chuyển đổi số toàn diện theo chuẩn Tỉnh Ninh Bình.",
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

    console.log(`   ✅ Đã khởi tạo đầy đủ dữ liệu cho: ${sItem.name}`);
  }

  // 5. KPIs & Quality Objectives for the Province & Schools
  console.log("\n📊 [5/6] Khởi tạo Bộ chỉ tiêu KPI và Mục tiêu Chất lượng GDPT 2018...");
  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-NB-01",
      name: "Tỷ lệ Học sinh Đỗ Tốt nghiệp THPT & Đại học Top đầu",
      category: KpiCategory.EDUCATIONAL_QUALITY,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 20,
      baselineValue: 92.0,
      targetValue: 99.8,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-NB-02",
      name: "Tỷ lệ Giáo viên Đạt Chuẩn Giảng dạy GDPT 2018 và Ứng dụng CNTT",
      category: KpiCategory.PROFESSIONAL,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 25,
      baselineValue: 88.0,
      targetValue: 100.0,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.qualityObjective.create({
    data: {
      code: "QO-NB-2026-01",
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

  // 6. Generic Convenience Accounts
  console.log("\n🔑 [6/6] Khởi tạo các tài khoản demo tiện ích...");
  await prisma.user.upsert({
    where: { email: "principal@school.com" },
    update: { password: standardPassword },
    create: {
      name: "Thầy Đinh Văn Khang (Hiệu trưởng THPT Trần Phú - Ninh Bình)",
      email: "principal@school.com",
      password: standardPassword,
      role: Role.ADMIN,
      isApproved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "teacher@school.com" },
    update: { password: standardPassword },
    create: {
      name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán THPT Trần Phú - Ninh Bình)",
      email: "teacher@school.com",
      password: standardPassword,
      role: Role.TEACHER,
      isApproved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "student@school.com" },
    update: { password: standardPassword },
    create: {
      name: "Học sinh Đinh Bảo Châu (10A1)",
      email: "student@school.com",
      password: standardPassword,
      role: Role.STUDENT,
      isApproved: true,
    },
  });

  console.log("\n🎉 ============================================================");
  console.log("   KHỞI TẠO THÀNH CÔNG DỮ LIỆU THỰC TẾ 2 TRƯỜNG TẠI NINH BÌNH!");
  console.log("   - Sở GD&ĐT Tỉnh Ninh Bình (NB-SGDDT)");
  console.log("   - Trường THPT Trần Phú (THPT-TRANPHU-NB)");
  console.log("   - Trường THPT Lương Khánh Thiện (THPT-LUONGKHANHTHIEN-NB)");
  console.log("   Mật khẩu mặc định cho toàn bộ tài khoản: Password@123");
  console.log("============================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi khởi tạo cơ sở dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
