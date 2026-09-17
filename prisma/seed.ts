/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Prisma CLI seeder (`npx prisma db seed` / `npx tsx prisma/seed.ts`), package.json prisma.seed.
 * 2. Purpose: Complete database wipe and realistic seeding for 3 Regions (TP. Ninh Bình, TP. Tam Điệp, Huyện Hoa Lư)
 *    and 6 independent High Schools in Ninh Binh Province:
 *    - Khu vực 1 (TP. Ninh Bình): THPT Trần Phú, THPT Đinh Tiên Hoàng
 *    - Khu vực 2 (TP. Tam Điệp): THPT Lương Khánh Thiện, THPT Ngô Thì Nhậm
 *    - Khu vực 3 (Huyện Hoa Lư): THPT Hoa Lư A, THPT Sào Nam
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

function generateStudentRoster(count: number, gradeLevel: number, schoolCode: string, className: string, startSeq: number = 1, addressBase: string = "Tỉnh Ninh Bình") {
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
  console.log("🚀 [KHỞI TẠO DỮ LIỆU THỰC TẾ] HỆ THỐNG GIÁO DỤC 3 KHU VỰC - 6 TRƯỜNG THPT ĐỘC LẬP");
  console.log("==================================================================================");

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

  // 2. Sở GD&ĐT Tỉnh Ninh Bình & 3 Khu vực hành chính
  console.log("\n🏛️ [2/6] Khởi tạo Sở GD&ĐT Tỉnh Ninh Bình và 3 Khu vực quản lý...");
  const deptNinhBinh = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Tỉnh Ninh Bình",
      code: "NB-SGDDT",
      address: "Số 16 Đường Tràng An, Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-005",
      email: "sogd.ninhbinh@gmail.com",
    },
  });

  const wardTPNinhBinh = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Khu vực Thành phố Ninh Bình",
      code: "NB-TPNB",
      address: "Đường Lê Hồng Phong, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-234",
    },
  });

  const wardTamDiep = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Khu vực Thành phố Tam Điệp",
      code: "NB-TAMDIEP",
      address: "Đường Đồng Giao, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-123",
    },
  });

  const wardHoaLu = await prisma.districtWard.create({
    data: {
      departmentId: deptNinhBinh.id,
      name: "Khu vực Huyện Hoa Lư",
      code: "NB-HOALU",
      address: "Thị trấn Thiên Tôn, Huyện Hoa Lư, Tỉnh Ninh Bình",
      phone: "0229-3622-123",
    },
  });

  // 3. Super Admin & Authority Users
  console.log("\n👑 [3/6] Khởi tạo Tài khoản Quản trị Toàn tỉnh & 3 Cán bộ Khu vực...");
  const superAdmin = await prisma.user.create({
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
      userId: superAdmin.id,
      role: Role.SUPER_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const deptOfficer = await prisma.user.create({
    data: {
      name: "TS. Phan Thành Công (Giám đốc Sở GD&ĐT Tỉnh Ninh Bình)",
      email: "admin.sogd.ninhbinh@gmail.com",
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

  // 3 Khu vực Admins
  const regionalAdmins = [
    {
      name: "ThS. Đinh Xuân Cảnh (Trưởng phòng GD TP. Ninh Bình)",
      email: "gd.tpninhbinh@gmail.com",
      ward: wardTPNinhBinh,
    },
    {
      name: "ThS. Trịnh Minh Tuấn (Trưởng phòng GD TP. Tam Điệp)",
      email: "gd.tamdiep@gmail.com",
      ward: wardTamDiep,
    },
    {
      name: "ThS. Đỗ Quang Huy (Trưởng phòng GD Huyện Hoa Lư)",
      email: "gd.hoalu@gmail.com",
      ward: wardHoaLu,
    },
  ];

  for (const ra of regionalAdmins) {
    const rUser = await prisma.user.create({
      data: {
        name: ra.name,
        email: ra.email,
        password: standardPassword,
        role: Role.DISTRICT_ADMIN,
        isApproved: true,
        departmentId: deptNinhBinh.id,
        districtWardId: ra.ward.id,
      },
    });

    await prisma.userRoleScope.create({
      data: {
        userId: rUser.id,
        role: Role.DISTRICT_ADMIN,
        scopeType: ScopeType.WARD,
        scopeId: ra.ward.id,
      },
    });
  }

  // 4. Seeding 6 Independent High Schools across 3 Regions
  console.log("\n🏫 [4/6] Khởi tạo 6 trường THPT độc lập cho 3 Khu vực...");

  const schoolsData = [
    // --- KHU VỰC 1: TP. NINH BÌNH ---
    {
      code: "TP",
      schoolCode: "TP",
      name: "Trường THPT Trần Phú (Ninh Bình)",
      address: "Số 26 Đường Đinh Tiên Hoàng, Phường Đông Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3871-648",
      email: "thpt.tranphu.ninhbinh@gmail.com",
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
        { name: "Tổ Vật lí - Kỹ thuật công nghệ", desc: "Giảng dạy bộ môn Vật lí và Công nghệ" },
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
        { name: "Thầy Đinh Quốc Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.tuan" },
        { name: "Cô Vũ Thị Hạnh", specialty: "Toán học", groupIndex: 0, isHead: false, slug: "toan.hanh" },
        { name: "Cô Vũ Minh Trang", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.trang" },
        { name: "Thầy Lê Hoàng Quân", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.quan" },
        { name: "Thầy Bùi Quang Hưng", specialty: "Hóa học", groupIndex: 2, isHead: true, slug: "hoa.hung" },
        { name: "Cô Phạm Thị Minh", specialty: "Ngữ văn", groupIndex: 3, isHead: true, slug: "van.minh" },
        { name: "Cô Hoàng Mai Khanh", specialty: "Tiếng Anh", groupIndex: 4, isHead: true, slug: "anh.khanh" },
      ],
    },
    {
      code: "DTH",
      schoolCode: "DTH",
      name: "Trường THPT Đinh Tiên Hoàng (Ninh Bình)",
      address: "Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
      phone: "0229-3873-112",
      email: "thpt.dinhtienhoang.ninhbinh@gmail.com",
      districtWardId: wardTPNinhBinh.id,
      principalEmail: "hieutruong.thpt.dinhtienhoang@gmail.com",
      principalName: "Thầy Lê Văn Hùng",
      vpEmail: "hieuphe.thpt.dinhtienhoang@gmail.com",
      vpName: "Thầy Vũ Quốc Tuấn",
      campuses: [
        {
          name: "Cơ sở Chính - Tân Thành",
          address: "Phường Tân Thành, TP. Ninh Bình, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Trung tâm",
          managerName: "Thầy Lê Văn Hùng",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Tự nhiên (Toán - Lý - Hóa - Tin)", desc: "Giảng dạy bộ môn KHTN & Công nghệ" },
        { name: "Tổ Xã hội (Văn - Sử - Địa - Anh)", desc: "Giảng dạy bộ môn KHXH & Ngoại ngữ" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Phan Đình Trọng", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.trong" },
        { name: "Thầy Tạ Văn Minh", specialty: "Vật lí", groupIndex: 0, isHead: false, slug: "ly.minh" },
        { name: "Cô Đỗ Thị Kim", specialty: "Hóa học", groupIndex: 0, isHead: false, slug: "hoa.kim" },
        { name: "Cô Dương Thu Hà", specialty: "Ngữ văn", groupIndex: 1, isHead: true, slug: "van.ha" },
        { name: "Cô Lý Thanh Mai", specialty: "Tiếng Anh", groupIndex: 1, isHead: false, slug: "anh.mai" },
      ],
    },

    // --- KHU VỰC 2: TP. TAM ĐIỆP ---
    {
      code: "LKT",
      schoolCode: "LKT",
      name: "Trường THPT Lương Khánh Thiện (Ninh Bình)",
      address: "Số 18 Đường Quang Trung, Phường Bắc Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-129",
      email: "thpt.luongkhanhthien.ninhbinh@gmail.com",
      districtWardId: wardTamDiep.id,
      principalEmail: "hieutruong.thpt.luongkhanhthien@gmail.com",
      principalName: "Thầy Phạm Văn Hưng",
      vpEmail: "hieuphe.thpt.luongkhanhthien@gmail.com",
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
        { name: "Thầy Phạm Gia Bảo", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.bao" },
        { name: "Cô Trần Bích Phương", specialty: "Hóa học", groupIndex: 1, isHead: false, slug: "hoa.phuong" },
        { name: "Cô Trịnh Thu Trang", specialty: "Ngữ văn", groupIndex: 2, isHead: true, slug: "van.trang" },
        { name: "Cô Đặng Thu Hà", specialty: "Tiếng Anh", groupIndex: 3, isHead: true, slug: "anh.ha" },
      ],
    },
    {
      code: "NTN",
      schoolCode: "NTN",
      name: "Trường THPT Ngô Thì Nhậm (Ninh Bình)",
      address: "Phường Trung Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
      phone: "0229-3864-556",
      email: "thpt.ngothinham.ninhbinh@gmail.com",
      districtWardId: wardTamDiep.id,
      principalEmail: "hieutruong.thpt.ngothinham@gmail.com",
      principalName: "Cô Nguyễn Thị Lan",
      vpEmail: "hieuphe.thpt.ngothinham@gmail.com",
      vpName: "Thầy Đặng Văn Phúc",
      campuses: [
        {
          name: "Cơ sở Chính - Trung Sơn",
          address: "Phường Trung Sơn, TP. Tam Điệp, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Lý thuyết",
          managerName: "Cô Nguyễn Thị Lan",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Khoa học Tự nhiên", desc: "Giảng dạy Toán, Lí, Hóa, Sinh" },
        { name: "Tổ Khoa học Xã hội", desc: "Giảng dạy Văn, Sử, Địa, Ngoại ngữ" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Vũ Minh Hải", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.hai" },
        { name: "Cô Mai Thị Ngọc", specialty: "Vật lí", groupIndex: 0, isHead: false, slug: "ly.ngoc" },
        { name: "Thầy Đỗ Xuân Bách", specialty: "Hóa học", groupIndex: 0, isHead: false, slug: "hoa.bach" },
        { name: "Cô Nguyễn Phương Linh", specialty: "Ngữ văn", groupIndex: 1, isHead: true, slug: "van.linh" },
        { name: "Thầy Lê Quốc Khánh", specialty: "Tiếng Anh", groupIndex: 1, isHead: false, slug: "anh.khanh" },
      ],
    },

    // --- KHU VỰC 3: HUYỆN HOA LƯ ---
    {
      code: "HLA",
      schoolCode: "HLA",
      name: "Trường THPT Hoa Lư A (Ninh Bình)",
      address: "Thị trấn Thiên Tôn, Huyện Hoa Lư, Tỉnh Ninh Bình",
      phone: "0229-3622-445",
      email: "thpt.hoalua.ninhbinh@gmail.com",
      districtWardId: wardHoaLu.id,
      principalEmail: "hieutruong.thpt.hoalua@gmail.com",
      principalName: "Thầy Hoàng Minh Triết",
      vpEmail: "hieuphe.thpt.hoalua@gmail.com",
      vpName: "Cô Trần Kim Oanh",
      campuses: [
        {
          name: "Cơ sở Chính - Thiên Tôn",
          address: "Thị trấn Thiên Tôn, Huyện Hoa Lư, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Trung tâm",
          managerName: "Thầy Hoàng Minh Triết",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin", desc: "Giảng dạy Toán và Tin học" },
        { name: "Tổ Khoa học Tự nhiên", desc: "Giảng dạy Vật lí, Hóa học, Sinh học" },
        { name: "Tổ Khoa học Xã hội & Ngoại ngữ", desc: "Giảng dạy Ngữ văn, Lịch sử, Tiếng Anh" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Bùi Hữu Phước", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.phuoc" },
        { name: "Thầy Đinh Công Minh", specialty: "Vật lí", groupIndex: 1, isHead: true, slug: "ly.minh" },
        { name: "Cô Phạm Thanh Thúy", specialty: "Hóa học", groupIndex: 1, isHead: false, slug: "hoa.thuy" },
        { name: "Cô Ngô Minh Nguyệt", specialty: "Ngữ văn", groupIndex: 2, isHead: true, slug: "van.nguyet" },
        { name: "Thầy Hoàng Tuấn Tú", specialty: "Tiếng Anh", groupIndex: 2, isHead: false, slug: "anh.tu" },
      ],
    },
    {
      code: "SN",
      schoolCode: "SN",
      name: "Trường THPT Sào Nam (Ninh Bình)",
      address: "Xã Ninh Khang, Huyện Hoa Lư, Tỉnh Ninh Bình",
      phone: "0229-3622-889",
      email: "thpt.saonam.ninhbinh@gmail.com",
      districtWardId: wardHoaLu.id,
      principalEmail: "hieutruong.thpt.saonam@gmail.com",
      principalName: "Thầy Bùi Quang Đạt",
      vpEmail: "hieuphe.thpt.saonam@gmail.com",
      vpName: "Thầy Ngô Văn Phong",
      campuses: [
        {
          name: "Cơ sở Chính - Ninh Khang",
          address: "Xã Ninh Khang, Huyện Hoa Lư, Tỉnh Ninh Bình",
          pointName: "Khu Giảng đường Sào Nam",
          managerName: "Thầy Bùi Quang Đạt",
          distanceKm: 0,
        },
      ],
      subjectGroups: [
        { name: "Tổ Tự nhiên", desc: "Giảng dạy bộ môn Toán, Lý, Hóa, Tin" },
        { name: "Tổ Xã hội", desc: "Giảng dạy bộ môn Văn, Sử, Địa, Anh" },
      ],
      classes: [
        { name: "10A1", gradeLevel: 10, count: 15 },
        { name: "10A2", gradeLevel: 10, count: 15 },
        { name: "11A1", gradeLevel: 11, count: 15 },
        { name: "12A1", gradeLevel: 12, count: 15 },
      ],
      teachers: [
        { name: "Thầy Đào Minh Quang", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.quang" },
        { name: "Cô Nguyễn Thu Thảo", specialty: "Vật lí", groupIndex: 0, isHead: false, slug: "ly.thao" },
        { name: "Thầy Vũ Thanh Sơn", specialty: "Hóa học", groupIndex: 0, isHead: false, slug: "hoa.son" },
        { name: "Cô Lê Thị Thanh", specialty: "Ngữ văn", groupIndex: 1, isHead: true, slug: "van.thanh" },
        { name: "Cô Phạm Thùy Dung", specialty: "Tiếng Anh", groupIndex: 1, isHead: false, slug: "anh.dung" },
      ],
    },
  ];

  let firstSchoolCreated: any = null;

  for (const sItem of schoolsData) {
    console.log(`\n🏫 Đang tạo dữ liệu trường [${sItem.code}]: ${sItem.name}...`);
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
      const teacherEmail = `gv.${tInfo.slug}.${sItem.code.toLowerCase()}@gmail.com`;

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
      { name: "Đinh Văn Hưng", role: "Nhân viên Y tế học đường", degree: "Cử nhân Y đa khoa", spec: "Y tế học đường", emailPrefix: "yte", isShared: false },
      { name: "Lê Hoàng Quân", role: "Quản trị viên CNTT & CSDL", degree: "Kỹ sư Công nghệ thông tin", spec: "Hệ thống CNTT", emailPrefix: "cntt", isShared: true },
    ];

    for (const ss of supportStaffDefs) {
      const staffUser = await prisma.user.create({
        data: {
          name: `${ss.name} (${ss.role})`,
          email: `${ss.emailPrefix}.${sItem.code.toLowerCase()}@gmail.com`,
          password: standardPassword,
          role: Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
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

    // Subjects
    const subjectListDef = [
      { name: "Toán", groupIndex: 0 },
      { name: "Tin học", groupIndex: 0 },
      { name: "Vật lí", groupIndex: 1 },
      { name: "Hóa học", groupIndex: 1 },
      { name: "Ngữ văn", groupIndex: createdGroups.length > 2 ? 2 : 0 },
      { name: "Tiếng Anh", groupIndex: createdGroups.length > 3 ? 3 : 1 },
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
    for (let stIdx = 0; stIdx < Math.min(createdStudentsList.length, 30); stIdx++) {
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

    await prisma.equipment.createMany({
      data: equipmentDefs.map((eq) => ({
        code: eq.code,
        name: eq.name,
        category: eq.cat,
        schoolId: school.id,
        schoolPointId: mainSchoolPoint.id,
        totalQuantity: eq.qty,
        availableQuantity: eq.qty,
        condition: eq.cond,
      })),
    });

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

    console.log(`   ✅ Đã khởi tạo hoàn tất dữ liệu cho trường: ${sItem.name}`);
  }

  // 5. KPIs & Quality Objectives for the Province
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
  if (firstSchoolCreated) {
    const demoAccounts = [
      {
        email: "superadmin.demo@gmail.com",
        name: "Quản Trị Viên Tối Cao (Demo)",
        role: Role.SUPER_ADMIN,
        schoolId: null,
      },
      {
        email: "principal.demo@gmail.com",
        name: "Thầy Đinh Văn Khang (Hiệu trưởng Demo - THPT Trần Phú)",
        role: Role.ADMIN,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "teacher.demo@gmail.com",
        name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán Demo - THPT Trần Phú)",
        role: Role.TEACHER,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "student.demo@gmail.com",
        name: "Học sinh Đinh Bảo Châu (Demo 10A1)",
        role: Role.STUDENT,
        schoolId: firstSchoolCreated.id,
      },
      // Backwards-compatible legacy accounts
      {
        email: "principal@school.com",
        name: "Thầy Đinh Văn Khang (Hiệu trưởng THPT Trần Phú - Ninh Bình)",
        role: Role.ADMIN,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "teacher@school.com",
        name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán THPT Trần Phú - Ninh Bình)",
        role: Role.TEACHER,
        schoolId: firstSchoolCreated.id,
      },
      {
        email: "student@school.com",
        name: "Học sinh Đinh Bảo Châu (10A1)",
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
          departmentId: deptNinhBinh.id,
        },
      });
    }
  }

  console.log("\n🎉 ==================================================================================");
  console.log("✅ HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU THỰC TẾ CHO 3 KHU VỰC & 6 TRƯỜNG THPT NINH BÌNH!");
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
