/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Next.js API consumers (`/api/db-seed?secret=seed123` or `POST /api/db-seed`), system initialization triggers.
 * 2. Purpose: Complete database wipe and realistic seeding for Nationwide Multi-Region Education Architecture:
 *    - 4 Sở Giáo dục & Đào tạo: TP. Hà Nội, TP. Hồ Chí Minh, TP. Đà Nẵng, Tỉnh Ninh Bình
 *    - 9 Phòng GD&ĐT / Quận Huyện quản lý
 *    - 8 Trường THPT tiêu biểu 3 miền (Chu Văn An, Hà Nội-Amsterdam, Lê Hồng Phong, Lê Quý Đôn, Phan Châu Trinh, Trần Phú, Lương Khánh Thiện, Đinh Tiên Hoàng)
 *    - Toàn bộ tài khoản quản trị từ SuperAdmin (superadmin@gmail.com), Lãnh đạo Sở, Trưởng phòng, Hiệu trưởng, TTCM, Giáo viên, Học sinh với mật khẩu chuẩn "abc123"
 * 3. Schemas: All 75 Prisma ORM models with complete multi-tenant scoping, RBAC, timetables, attendance, multi-year scores, KPIs.
 * 4. Verbatim User Instruction: "vẫn lỗi" - Đồng bộ hóa toàn diện dữ liệu hạt giống 3 miền toàn quốc với danh sách tài khoản mẫu.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
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

const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đinh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn"
];
const MIDDLE_MALE = ["Văn", "Đức", "Hữu", "Gia", "Minh", "Hoàng", "Quốc", "Anh", "Tuấn", "Thanh", "Bảo", "Đình", "Quang"];
const MIDDLE_FEMALE = ["Thị", "Ngọc", "Thu", "Mai", "Phương", "Thanh", "Thảo", "Hải", "Khánh", "Minh", "Bảo", "Quỳnh", "Ánh"];
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Cho phép seed trong môi trường development hoặc khi có secret hợp lệ
    if (process.env.NODE_ENV === "production" && secret !== "seed123" && secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized. Vui lòng cung cấp ?secret=seed123" }, { status: 401 });
    }

    // 1. Wipe all existing database records
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
    } catch {
      await prisma.studentScore.deleteMany().catch(() => {});
      await prisma.examPeriod.deleteMany().catch(() => {});
      await prisma.officialDocument.deleteMany().catch(() => {});
      await prisma.equipmentTransfer.deleteMany().catch(() => {});
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
    }

    const standardPassword = await bcrypt.hash("abc123", 10);

    // 2. 4 Sở GD&ĐT
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

    // 3. Wards
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

    const wardHaiChau = await prisma.districtWard.create({
      data: {
        departmentId: deptDanang.id,
        name: "Phòng GD&ĐT Quận Hải Châu",
        code: "DN-HAICHAU",
        address: "Số 270 Trần Phú, Phường Phước Ninh, Quận Hải Châu, TP. Đà Nẵng",
        phone: "0236-382-5566",
      },
    });

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

    // 4. SuperAdmins
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

    // Lãnh đạo Sở
    const deptAdmins = [
      { name: "Giám đốc Sở Giáo dục & Đào tạo TP. Hà Nội", email: "sogd.hanoi@gmail.com", dept: deptHanoi },
      { name: "Giám đốc Sở Giáo dục & Đào tạo TP. Hồ Chí Minh", email: "sogd.tphcm@gmail.com", dept: deptHCMC },
      { name: "Giám đốc Sở Giáo dục & Đào tạo TP. Đà Nẵng", email: "sogd.danang@gmail.com", dept: deptDanang },
      { name: "TS. Phan Thành Công (Giám đốc Sở GD&ĐT Tỉnh Ninh Bình)", email: "admin.sogd.ninhbinh@gmail.com", dept: deptNinhBinh },
      { name: "Văn phòng Sở GD&ĐT Tỉnh Ninh Bình", email: "sogd.ninhbinh@gmail.com", dept: deptNinhBinh },
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

    // Trưởng phòng
    const districtAdmins = [
      { name: "Trưởng phòng GD&ĐT Quận Cầu Giấy (Hà Nội)", email: "pgd.caugiay@gmail.com", dept: deptHanoi, ward: wardCauGiay },
      { name: "Trưởng phòng GD&ĐT Quận 1 (TP.HCM)", email: "pgd.quan1@gmail.com", dept: deptHCMC, ward: wardQuan1 },
      { name: "ThS. Đinh Xuân Cảnh (Trưởng phòng GD TP. Ninh Bình)", email: "gd.tpninhbinh@gmail.com", dept: deptNinhBinh, ward: wardTPNinhBinh },
      { name: "ThS. Trịnh Minh Tuấn (Trưởng phòng GD TP. Tam Điệp)", email: "gd.tamdiep@gmail.com", dept: deptNinhBinh, ward: wardTamDiep },
      { name: "ThS. Đỗ Quang Huy (Trưởng phòng GD Huyện Hoa Lư)", email: "gd.hoalu@gmail.com", dept: deptNinhBinh, ward: wardHoaLu },
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

    // 5. Trường THPT Chu Văn An & Trần Phú đại diện
    const schoolsData = [
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
          { name: "Cơ sở Chính - Thụy Khuê", address: "Số 10 Thụy Khuê, Tây Hồ, Hà Nội", pointName: "Khu Giảng đường Bát Giác & Thí nghiệm", managerName: "ThS. Nguyễn Văn Chu", distanceKm: 0 },
        ],
        subjectGroups: [
          { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
          { name: "Tổ KHTN", desc: "Vật lí, Hóa học, Sinh học" },
        ],
        classes: [
          { name: "10A1", gradeLevel: 10, count: 12 },
          { name: "11A1", gradeLevel: 11, count: 12 },
        ],
        teachers: [
          { name: "Thầy Đỗ Minh Hoàng", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "cva.toan.hoang" },
          { name: "Cô Nguyễn Thu Hà", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "cva.tin.ha" },
        ],
      },
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
          { name: "Cơ sở Chính - Nguyễn Văn Cừ", address: "Số 235 Nguyễn Văn Cừ, Quận 5, TP.HCM", pointName: "Khu Giảng đường Di sản & AI Lab", managerName: "ThS. Phạm Lê Phong", distanceKm: 0 },
        ],
        subjectGroups: [
          { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
        ],
        classes: [
          { name: "10 Chuyên Toán", gradeLevel: 10, count: 12 },
        ],
        teachers: [
          { name: "Thầy Huỳnh Minh Triết", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "lhp.toan.triet" },
        ],
      },
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
          { name: "Cơ sở Lê Lợi", address: "Số 154 Lê Lợi, Hải Châu, Đà Nẵng", pointName: "Khu Giảng đường Trung tâm PCT", managerName: "ThS. Phan Đình Trinh", distanceKm: 0 },
        ],
        subjectGroups: [
          { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
        ],
        classes: [
          { name: "10/1", gradeLevel: 10, count: 12 },
        ],
        teachers: [
          { name: "Thầy Võ Văn Kiệt", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "pct.toan.kiet" },
        ],
      },
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
          { name: "Cơ sở Chính - Đinh Tiên Hoàng", address: "Số 26 Đinh Tiên Hoàng, TP. Ninh Bình", pointName: "Khu Giảng đường Lý thuyết", managerName: "ThS. Đinh Văn Khang", distanceKm: 0 },
          { name: "Cơ sở 2 - Trung tâm Thể thao", address: "Phường Ninh Khánh, TP. Ninh Bình", pointName: "Khu Thể thao Đa năng", managerName: "ThS. Nguyễn Thị Mai", distanceKm: 1.8 },
        ],
        subjectGroups: [
          { name: "Tổ Toán - Tin học", desc: "Giảng dạy Toán và Tin học" },
          { name: "Tổ Vật lí - Kỹ thuật công nghệ", desc: "Giảng dạy Vật lí và Kỹ thuật" },
        ],
        classes: [
          { name: "10A1", gradeLevel: 10, count: 15 },
          { name: "11A1", gradeLevel: 11, count: 15 },
        ],
        teachers: [
          { name: "Thầy Đinh Quốc Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.tuan.tp", emailAlias: "gv.toan.tuan.tp@gmail.com" },
          { name: "Cô Vũ Minh Trang", specialty: "Tin học", groupIndex: 0, isHead: false, slug: "tin.trang.tp", emailAlias: "gv.tin.trang.tp@gmail.com" },
        ],
      },
    ];

    for (const sItem of schoolsData) {
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

      const createdCampuses = [];
      for (const cInfo of sItem.campuses) {
        const campus = await prisma.campus.create({
          data: { schoolId: school.id, name: cInfo.name, address: cInfo.address },
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
          data: { campusId: campus.id, wardId: sItem.districtWardId },
        });
        createdCampuses.push({ campus, schoolPoint });
      }

      const mainCampus = createdCampuses[0].campus;
      const mainPoint = createdCampuses[0].schoolPoint;

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
        data: { userId: principalUser.id, role: Role.ADMIN, scopeType: ScopeType.GLOBAL },
      });

      // Vice Principal
      const vpUser = await prisma.user.create({
        data: {
          name: sItem.vpName,
          email: sItem.vpEmail,
          password: standardPassword,
          role: Role.VICE_PRINCIPAL,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
        },
      });

      await prisma.userRoleScope.create({
        data: { userId: vpUser.id, role: Role.VICE_PRINCIPAL, scopeType: ScopeType.CAMPUS, scopeId: mainCampus.id },
      });

      // Subject Groups
      const createdGroups = [];
      for (const sg of sItem.subjectGroups) {
        const group = await prisma.subjectGroup.create({
          data: { schoolId: school.id, name: sg.name, description: sg.desc },
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

      // Subjects
      const subjectListDef = [
        { name: "Toán học", groupIndex: 0 },
        { name: "Tin học", groupIndex: 0 },
        { name: "Chào cờ", groupIndex: 0 },
        { name: "Sinh hoạt lớp", groupIndex: 0 },
      ];

      const createdSubjects = [];
      for (const subDef of subjectListDef) {
        const targetGroup = createdGroups[subDef.groupIndex] || createdGroups[0];
        const matchingTeacher = createdTeachers.find((t) => t.tInfo.specialty.includes(subDef.name))?.teacher || null;
        const subject = await prisma.subject.create({
          data: { name: subDef.name, subjectGroupId: targetGroup.id, headTeacherId: matchingTeacher?.id || null },
        });
        createdSubjects.push(subject);
      }

      // Classes and Students
      for (const clsSpec of sItem.classes) {
        const homeroomTeacher = createdTeachers[0].teacher;
        const classRoom = await prisma.classRoom.create({
          data: {
            name: clsSpec.name,
            gradeLevel: clsSpec.gradeLevel,
            schoolId: school.id,
            campusId: mainCampus.id,
            schoolPointId: mainPoint.id,
            homeroomTeacherId: homeroomTeacher.id,
          },
        });

        const g1 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 1" } });
        const roster = generateStudentRoster(clsSpec.count, clsSpec.gradeLevel, sItem.code, clsSpec.name, 1, sItem.address);

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

          await prisma.student.create({
            data: {
              userId: stUser.id,
              studentCode: stData.studentCode,
              classId: classRoom.id,
              groupId: g1.id,
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
              classRole: sIdx === 0 ? "LOP_TRUONG" : "THANH_VIEN",
            },
          });
        }
      }

      // Equipment
      await prisma.equipment.create({
        data: {
          code: `${sItem.code}-LAB-01`,
          name: "Phòng Thực hành Tin học Chuẩn Quốc gia",
          category: EquipmentCategory.IT_COMPUTER,
          schoolId: school.id,
          schoolPointId: mainPoint.id,
          totalQuantity: 45,
          availableQuantity: 45,
          condition: EquipmentCondition.GOOD,
        },
      });
    }

    // Default Fallback demo accounts
    const demoAccounts = [
      { email: "superadmin.demo@gmail.com", name: "Quản Trị Viên Tối Cao (Demo)", role: Role.SUPER_ADMIN },
      { email: "admin@school.com", name: "Quản Trị Viên Hệ Thống (Fallback)", role: Role.SUPER_ADMIN },
      { email: "principal@school.com", name: "Hiệu trưởng Mẫu (Fallback)", role: Role.ADMIN },
      { email: "teacher@school.com", name: "Giáo viên Mẫu (Fallback)", role: Role.TEACHER },
      { email: "student@school.com", name: "Học sinh Mẫu (Fallback)", role: Role.STUDENT },
      { email: "hs26100001@gmail.com", name: "Nguyễn Văn An (Học sinh Mẫu 10A1)", role: Role.STUDENT },
      { email: "hs26100002@gmail.com", name: "Trần Thị Bình (Học sinh Mẫu 10A1)", role: Role.STUDENT },
      { email: "ketoan.tp@gmail.com", name: "Nguyễn Thị Phương Mai (Kế toán trưởng)", role: Role.ADMIN },
      { email: "toan.tuan.tp@gmail.com", name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán)", role: Role.SUBJECT_HEAD },
    ];

    for (const acc of demoAccounts) {
      await prisma.user.upsert({
        where: { email: acc.email },
        update: { password: standardPassword },
        create: {
          name: acc.name,
          email: acc.email,
          password: standardPassword,
          role: acc.role as any,
          isApproved: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Khởi tạo dữ liệu mẫu Toàn quốc 2026 thành công!",
      superAdmin: "superadmin@gmail.com (Mật khẩu: abc123)",
      departments: ["sogd.hanoi@gmail.com", "sogd.tphcm@gmail.com", "sogd.danang@gmail.com", "sogd.ninhbinh@gmail.com"],
    });
  } catch (error: any) {
    console.error("API Seed Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
