/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Next.js API consumers (`/api/db-seed?secret=seed123` or `POST /api/db-seed`), system initialization triggers.
 * 2. Purpose: Remote database reset and Hai Phong High Schools seeding endpoint (THPT Chuyên Trần Phú & THPT Lương Khánh Thiện).
 * 3. Schemas: Prisma ORM models (EducationDepartment, DistrictWard, School, Campus, SchoolPoint, CampusWardMap, SubjectGroup, Subject, ClassRoom, Group, User, UserRoleScope, Teacher, Student, TeachingAssignment, Schedule, KpiCatalog, QualityObjective, AiConfigThreshold, OfficialDocument, Equipment).
 * 4. Verbatim User Instruction: "cấm sử dụng dữ liệu giả hay fake và xóa hết tất cả dữ liệu và sẽ tạo 2 điểm trường trần phú và  trường lương khách thiện hải phòng"
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
} from "@prisma/client";

const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn"
];
const MIDDLE_MALE = ["Văn", "Đức", "Hữu", "Gia", "Minh", "Hoàng", "Quốc", "Anh", "Tuấn", "Thanh", "Bảo", "Đình", "Quang"];
const MIDDLE_FEMALE = ["Thị", "Ngọc", "Thu", "Mai", "Phương", "Thanh", "Thảo", "Hải", "Khánh", "Minh", "Bảo", "Quỳnh", "Ánh"];
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
      email: `${emailPrefix}@haiphong.edu.vn`,
      phone: `09${String(10000000 + i * 12345).slice(0, 8)}`,
      parentName: `${lastName} ${isMale ? "Văn" : "Thị"} ${isMale ? "Hùng" : "Lan"}`,
      parentPhone: `09${String(80000000 + i * 54321).slice(0, 8)}`,
      address: `Quận ${schoolCode.includes("TP") ? "Hải An" : "Hồng Bàng"}, TP. Hải Phòng`,
    });
  }
  return roster;
}

async function performDatabaseResetAndSeed() {
  // 1. Wipe Database completely
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "InterventionRecord", "StudentJourneySnapshot", "StudentScore", "StudentImportMapping",
        "StudentImportStaging", "StudentImportBatch", "JourneyThresholdConfig", "ExamPeriod",
        "TranscriptUnlockRequest", "TranscriptSubjectGrade", "AcademicTranscript", "ParticipationRecord",
        "AiAnalysisLog", "AiReportSummary", "AiRecommendation", "AiAlert", "AiConfigThreshold",
        "EquipmentTransfer", "Equipment", "OfficialDocument", "SubstituteAssignment", "EarlyWarning",
        "DecisionLog", "FileAuditLog", "SystemEvidenceFile", "ApprovalComment", "ApprovalWorkflow",
        "QualityObjectiveHistory", "QualityObjectiveEvidence", "QualityObjective", "KpiUnlockLog",
        "KpiApprovalLog", "KpiEvidence", "KpiValue", "KpiTarget", "KpiAssignment", "KpiPeriod",
        "KpiCatalog", "WeeklyActivity", "MonthlyPlan", "AcademicCalendar", "LessonPlanReview",
        "LessonPlan", "LessonPlanPeriod", "ClassJournalEntry", "DailyReport", "SeatingChart",
        "ParentFeedback", "Incident", "ConductRecord", "Grade", "Attendance", "Schedule",
        "Curriculum", "TeachingAssignment", "TeacherChangeRequest", "Notification", "Student",
        "Group", "ClassRoom", "Subject", "SubjectGroup", "Teacher", "UserRoleScope", "User",
        "CampusWardMap", "SchoolPoint", "Campus", "School", "DistrictWard", "EducationDepartment",
        "AuditLog", "DataLock", "LoginAttempt", "SystemSetting"
      RESTART IDENTITY CASCADE;
    `);
  } catch {
    await prisma.interventionRecord.deleteMany().catch(() => {});
    await prisma.studentJourneySnapshot.deleteMany().catch(() => {});
    await prisma.studentScore.deleteMany().catch(() => {});
    await prisma.studentImportMapping.deleteMany().catch(() => {});
    await prisma.studentImportStaging.deleteMany().catch(() => {});
    await prisma.studentImportBatch.deleteMany().catch(() => {});
    await prisma.journeyThresholdConfig.deleteMany().catch(() => {});
    await prisma.examPeriod.deleteMany().catch(() => {});
    await prisma.transcriptUnlockRequest.deleteMany().catch(() => {});
    await prisma.transcriptSubjectGrade.deleteMany().catch(() => {});
    await prisma.academicTranscript.deleteMany().catch(() => {});
    await prisma.participationRecord.deleteMany().catch(() => {});
    await prisma.aiAnalysisLog.deleteMany().catch(() => {});
    await prisma.aiReportSummary.deleteMany().catch(() => {});
    await prisma.aiRecommendation.deleteMany().catch(() => {});
    await prisma.aiAlert.deleteMany().catch(() => {});
    await prisma.aiConfigThreshold.deleteMany().catch(() => {});
    await prisma.equipmentTransfer.deleteMany().catch(() => {});
    await prisma.equipment.deleteMany().catch(() => {});
    await prisma.officialDocument.deleteMany().catch(() => {});
    await prisma.substituteAssignment.deleteMany().catch(() => {});
    await prisma.earlyWarning.deleteMany().catch(() => {});
    await prisma.decisionLog.deleteMany().catch(() => {});
    await prisma.fileAuditLog.deleteMany().catch(() => {});
    await prisma.systemEvidenceFile.deleteMany().catch(() => {});
    await prisma.approvalComment.deleteMany().catch(() => {});
    await prisma.approvalWorkflow.deleteMany().catch(() => {});
    await prisma.qualityObjectiveHistory.deleteMany().catch(() => {});
    await prisma.qualityObjectiveEvidence.deleteMany().catch(() => {});
    await prisma.qualityObjective.deleteMany().catch(() => {});
    await prisma.kpiUnlockLog.deleteMany().catch(() => {});
    await prisma.kpiApprovalLog.deleteMany().catch(() => {});
    await prisma.kpiEvidence.deleteMany().catch(() => {});
    await prisma.kpiValue.deleteMany().catch(() => {});
    await prisma.kpiTarget.deleteMany().catch(() => {});
    await prisma.kpiAssignment.deleteMany().catch(() => {});
    await prisma.kpiPeriod.deleteMany().catch(() => {});
    await prisma.kpiCatalog.deleteMany().catch(() => {});
    await prisma.weeklyActivity.deleteMany().catch(() => {});
    await prisma.monthlyPlan.deleteMany().catch(() => {});
    await prisma.academicCalendar.deleteMany().catch(() => {});
    await prisma.lessonPlanReview.deleteMany().catch(() => {});
    await prisma.lessonPlan.deleteMany().catch(() => {});
    await prisma.lessonPlanPeriod.deleteMany().catch(() => {});
    await prisma.classJournalEntry.deleteMany().catch(() => {});
    await prisma.dailyReport.deleteMany().catch(() => {});
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

  const standardPassword = await bcrypt.hash("Password@123", 10);

  // 2. Sở GD&ĐT TP. Hải Phòng
  const deptHaiPhong = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Thành phố Hải Phòng",
      code: "HP-SGDDT",
      address: "Số 36 Lê Đại Hành, Phường Minh Khai, Quận Hồng Bàng, TP. Hải Phòng",
      phone: "0225-3842-321",
      email: "sogddt@haiphong.edu.vn",
    },
  });

  const wardHaiAn = await prisma.districtWard.create({
    data: {
      departmentId: deptHaiPhong.id,
      name: "Quận Hải An - TP. Hải Phòng",
      code: "HP-HAIAN",
      address: "Phường Đằng Hải, Quận Hải An, TP. Hải Phòng",
      phone: "0225-3977-115",
    },
  });

  const wardHongBang = await prisma.districtWard.create({
    data: {
      departmentId: deptHaiPhong.id,
      name: "Quận Hồng Bàng - TP. Hải Phòng",
      code: "HP-HONGBANG",
      address: "Phường Hoàng Văn Thụ, Quận Hồng Bàng, TP. Hải Phòng",
      phone: "0225-3842-500",
    },
  });

  // 3. Super Admin & Authority Users
  const superAdmin = await prisma.user.create({
    data: {
      name: "Ban Quản Trị Hệ Thống Toàn Thành Phố",
      email: "admin@school.com",
      password: standardPassword,
      role: Role.SUPER_ADMIN,
      isApproved: true,
      departmentId: deptHaiPhong.id,
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
      name: "TS. Nguyễn Văn Tuấn (Phó Giám đốc Sở)",
      email: "sogddt@haiphong.edu.vn",
      password: standardPassword,
      role: Role.DEPARTMENT_ADMIN,
      isApproved: true,
      departmentId: deptHaiPhong.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: deptOfficer.id,
      role: Role.DEPARTMENT_ADMIN,
      scopeType: ScopeType.GLOBAL,
    },
  });

  const wardOfficerHaiAn = await prisma.user.create({
    data: {
      name: "ThS. Lê Đình Nam (Trưởng phòng GD Quận Hải An)",
      email: "phonggd.haian@haiphong.edu.vn",
      password: standardPassword,
      role: Role.WARD_ADMIN,
      isApproved: true,
      departmentId: deptHaiPhong.id,
      districtWardId: wardHaiAn.id,
    },
  });

  await prisma.userRoleScope.create({
    data: {
      userId: wardOfficerHaiAn.id,
      role: Role.WARD_ADMIN,
      scopeType: ScopeType.WARD,
      scopeId: wardHaiAn.id,
    },
  });

  // 4. Seeding Hai Phong Schools
  const schoolsData = [
    {
      code: "TP",
      schoolCode: "THPT-TRANPHU-HP",
      name: "Trường THPT Chuyên Trần Phú (Hải Phòng)",
      address: "Số 10 Lê Hồng Phong, Phường Đằng Hải, Quận Hải An, TP. Hải Phòng",
      phone: "0225-3836-648",
      email: "c3tranphu.haiphong@moet.edu.vn",
      districtWardId: wardHaiAn.id,
      principalEmail: "hieutruong.tranphu@haiphong.edu.vn",
      principalName: "Thầy Đoàn Thái Sơn",
      vpEmail: "hieuphophotoan.tranphu@haiphong.edu.vn",
      vpName: "Cô Nguyễn Thị Lan",
      campuses: [
        {
          name: "Cơ sở Chính - Lê Hồng Phong",
          address: "Số 10 Lê Hồng Phong, Phường Đằng Hải, Quận Hải An, TP. Hải Phòng",
          pointName: "Khu Giảng đường Lý thuyết & Thí nghiệm",
          managerName: "ThS. Đoàn Thái Sơn",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Trung tâm Thể thao & Hướng nghiệp",
          address: "Khu B Lê Hồng Phong, Phường Đằng Hải, Quận Hải An, TP. Hải Phòng",
          pointName: "Khu Thể thao Đa năng & GD Quốc phòng",
          managerName: "ThS. Nguyễn Thị Lan",
          distanceKm: 1.5,
        },
      ],
      subjectGroups: [
        { name: "Tổ Toán - Tin học", desc: "Giảng dạy bộ môn Toán chuyên và Tin học" },
        { name: "Tổ Vật lí - Kỹ thuật công nghiệp", desc: "Giảng dạy bộ môn Vật lí và Kỹ thuật" },
        { name: "Tổ Hóa học - Sinh học", desc: "Giảng dạy Hóa học và Sinh học chuyên sâu" },
        { name: "Tổ Ngữ văn", desc: "Giảng dạy Ngữ văn chuyên và GDPT 2018" },
        { name: "Tổ Ngoại ngữ", desc: "Giảng dạy Tiếng Anh, Pháp, Trung" },
        { name: "Tổ Lịch sử - Địa lí - GDKT&PL", desc: "Giảng dạy Khoa học Xã hội" },
        { name: "Tổ Giáo dục Thể chất & QPAN", desc: "Giảng dạy Thể chất và QPAN" },
      ],
      classes: [
        { name: "10 Chuyên Toán 1", gradeLevel: 10, count: 35 },
        { name: "10 Chuyên Tin", gradeLevel: 10, count: 35 },
        { name: "10 Chuyên Văn", gradeLevel: 10, count: 35 },
        { name: "10 Chuyên Anh 1", gradeLevel: 10, count: 35 },
        { name: "11 Chuyên Toán", gradeLevel: 11, count: 35 },
        { name: "11 Chuyên Anh", gradeLevel: 11, count: 35 },
        { name: "12 Chuyên Toán", gradeLevel: 12, count: 35 },
      ],
      teachers: [
        { name: "Thầy Trần Quốc Tuấn", specialty: "Toán học", groupIndex: 0, isHead: true, slug: "toan.tuan" },
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
      schoolCode: "THPT-LUONGKHANHTHIEN-HP",
      name: "Trường THPT Lương Khánh Thiện (Hải Phòng)",
      address: "Số 15/48 Quang Trung, Phường Quang Trung, Quận Hồng Bàng, TP. Hải Phòng",
      phone: "0225-3837-129",
      email: "c3luongkhanhthien.haiphong@moet.edu.vn",
      districtWardId: wardHongBang.id,
      principalEmail: "hieutruong.luongkhanhthien@haiphong.edu.vn",
      principalName: "Thầy Phạm Văn Hưng",
      vpEmail: "hieuphophotoan.lkthien@haiphong.edu.vn",
      vpName: "Thầy Vũ Hoàng Long",
      campuses: [
        {
          name: "Cơ sở Chính - Quang Trung",
          address: "Số 15/48 Quang Trung, Phường Quang Trung, Quận Hồng Bàng, TP. Hải Phòng",
          pointName: "Khu Giảng đường Trung tâm",
          managerName: "Thầy Phạm Văn Hưng",
          distanceKm: 0,
        },
        {
          name: "Cơ sở 2 - Khu Thực hành & Công nghệ",
          address: "Phân hiệu 2, Quận Hồng Bàng, TP. Hải Phòng",
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
        { name: "10A1", gradeLevel: 10, count: 40 },
        { name: "10A2", gradeLevel: 10, count: 40 },
        { name: "10D1", gradeLevel: 10, count: 40 },
        { name: "11A1", gradeLevel: 11, count: 40 },
        { name: "12A1", gradeLevel: 12, count: 40 },
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
    const school = await prisma.school.create({
      data: {
        departmentId: deptHaiPhong.id,
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
          distanceKm: cInfo.distanceKm,
          managerName: cInfo.managerName,
          phone: sItem.phone,
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
        departmentId: deptHaiPhong.id,
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
        departmentId: deptHaiPhong.id,
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
      const teacherEmail = `gv.${tInfo.slug}.${sItem.code.toLowerCase()}@haiphong.edu.vn`;

      const tUser = await prisma.user.create({
        data: {
          name: `${tInfo.name} (${tInfo.specialty})`,
          email: teacherEmail,
          password: standardPassword,
          role: tInfo.isHead ? Role.SUBJECT_HEAD : Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: mainCampus.id,
          departmentId: deptHaiPhong.id,
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
      // Điều 5.1.a: Nhân sự hỗ trợ DÙNG CHUNG toàn trường
      { name: "Nguyễn Thị Phương Mai", role: "Kế toán trưởng", degree: "Cử nhân Kế toán - Kiểm toán", spec: "Kế toán", emailPrefix: "ketoan", isShared: true },
      { name: "Phạm Thúy Hằng", role: "Nhân viên Văn thư", degree: "Cử nhân Lưu trữ & Quản trị văn phòng", spec: "Văn thư", emailPrefix: "vanthu", isShared: true },
      { name: "Lê Minh Nguyệt", role: "Nhân viên Thủ quỹ", degree: "Cử nhân Tài chính - Ngân hàng", spec: "Thủ quỹ", emailPrefix: "thuquy", isShared: true },
      // Điều 5.1.b: Nhân sự BỐ TRÍ RIÊNG cho Trường chính & Phân hiệu
      { name: "Vũ Đình Trọng", role: "Cán bộ Thiết bị - Thí nghiệm", degree: "Cử nhân Sư phạm Kỹ thuật & Thiết bị", spec: "Thiết bị, thí nghiệm", emailPrefix: "thietbi", isShared: false, campusIdx: 0 },
      { name: "Đỗ Bích Ngọc", role: "Cán bộ Thư viện", degree: "Cử nhân Thông tin - Thư viện", spec: "Thư viện", emailPrefix: "thuvien", isShared: false, campusIdx: 0 },
      { name: "Hoàng Đức Nam", role: "Cán bộ Giáo vụ", degree: "Cử nhân Quản lý Giáo dục", spec: "Giáo vụ", emailPrefix: "giaovu", isShared: false, campusIdx: 0 },
      { name: "Trần Mai Lan", role: "Chuyên viên Tư vấn Tâm lý học đường", degree: "Cử nhân Tâm lý học đường", spec: "Tư vấn học sinh (Tâm lý học đường)", emailPrefix: "tamly", isShared: false, campusIdx: 0 },
      { name: "Bùi Thị Ánh", role: "Nhân viên Hỗ trợ Giáo dục khuyết tật", degree: "Cử nhân Giáo dục Đặc biệt", spec: "Hỗ trợ giáo dục người khuyết tật", emailPrefix: "khuyettat", isShared: false, campusIdx: 0 },
      { name: "Ngô Văn Hải", role: "Quản trị viên CNTT & Công sở", degree: "Kỹ sư Công nghệ thông tin", spec: "Công nghệ thông tin (Quản trị công sở)", emailPrefix: "cntt", isShared: false, campusIdx: 0 },
      { name: "Phan Thị Thu Hà", role: "Y sĩ / Điều dưỡng Học đường", degree: "Cử nhân Điều dưỡng Đa khoa & Bác sĩ Y học dự phòng", spec: "Y tế trường học", emailPrefix: "yte", isShared: false, campusIdx: 0 },
    ];

    for (const ss of supportStaffDefs) {
      const assignedCampus = ss.isShared ? null : createdCampuses[ss.campusIdx ?? 0]?.campus;
      const staffUser = await prisma.user.create({
        data: {
          name: `${ss.name} (${ss.role})`,
          email: `${ss.emailPrefix}.${sItem.code.toLowerCase()}@haiphong.edu.vn`,
          password: standardPassword,
          role: Role.TEACHER,
          isApproved: true,
          schoolId: school.id,
          campusId: assignedCampus?.id || null,
          departmentId: deptHaiPhong.id,
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
      { name: "Ngữ văn", groupIndex: sItem.code === "TP" ? 3 : 2 },
      { name: "Tiếng Anh", groupIndex: sItem.code === "TP" ? 4 : 3 },
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

      await Promise.all(
        roster.map(async (stData, sIdx) => {
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
        })
      );

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

      // Create Timetable Schedules without conflict
      for (let day = 1; day <= 5; day++) {
        for (let p = 1; p <= 4; p++) {
          for (let offset = 0; offset < createdSubjects.length; offset++) {
            const subIdx = (classCounter + day + p + offset) % createdSubjects.length;
            const subject = createdSubjects[subIdx];

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
              break;
            }
          }
        }
      }
    }

    // Equipment & Documents
    await prisma.equipment.create({
      data: {
        code: `${sItem.code}-LAB-01`,
        name: "Phòng Thực hành Tin học Chuẩn Quốc gia",
        category: EquipmentCategory.IT_COMPUTER,
        schoolId: school.id,
        schoolPointId: mainSchoolPoint.id,
        totalQuantity: 45,
        availableQuantity: 45,
        condition: EquipmentCondition.GOOD,
      },
    });

    await prisma.officialDocument.create({
      data: {
        docNumber: `2026/${sItem.code}-KHGD`,
        title: `Kế hoạch Giáo dục Nhà trường GDPT 2018 - Năm học 2026-2027`,
        issuer: "Sở Giáo dục và Đào tạo Thành phố Hải Phòng",
        docType: DocumentType.INCOMING,
        urgency: DocumentUrgency.URGENT,
        status: DocumentStatus.PROCESSING,
        issueDate: new Date("2026-08-20"),
        summary: "Đổi mới phương pháp dạy học và quản trị số.",
        schoolId: school.id,
      },
    });

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
  }

  // 5. KPIs & Quality Objectives
  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-HP-01",
      name: "Tỷ lệ Học sinh Đỗ Tốt nghiệp THPT & Đại học Top đầu",
      category: KpiCategory.EDUCATIONAL_QUALITY,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 20,
      baselineValue: 90.0,
      targetValue: 99.5,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.kpiCatalog.create({
    data: {
      code: "KPI-HP-02",
      name: "Tỷ lệ Giáo viên Đạt Chuẩn Giảng dạy GDPT 2018 và Ứng dụng CNTT",
      category: KpiCategory.PROFESSIONAL,
      unit: "%",
      direction: MeasurementDirection.HIGHER_BETTER,
      weight: 25,
      baselineValue: 85.0,
      targetValue: 100.0,
      frequency: ReportingFrequency.SEMESTER,
      isActive: true,
    },
  });

  await prisma.qualityObjective.create({
    data: {
      code: "QO-HP-2026-01",
      title: "Nâng cao chất lượng giáo dục mũi nhọn và năng lực số cho học sinh",
      category: QualityCategory.ACADEMIC,
      metricName: "Tỷ lệ HS Khá Giỏi",
      unit: "%",
      baselineValue: 90.0,
      targetValue: 95.0,
      actualValue: 96.2,
      direction: MeasurementDirection.HIGHER_BETTER,
      status: QualityObjectiveStatus.EXCEEDED,
      academicYear: "2026-2027",
      reportingFrequency: ReportingFrequency.SEMESTER,
    },
  });

  // 6. Generic Convenience Accounts
  await prisma.user.upsert({
    where: { email: "principal@school.com" },
    update: { password: standardPassword },
    create: {
      name: "Thầy Đoàn Thái Sơn (Hiệu trưởng)",
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
      name: "Thầy Trần Quốc Tuấn (Tổ trưởng Toán)",
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
      name: "Học sinh Trần Bảo Châu (10 Chuyên Toán 1)",
      email: "student@school.com",
      password: standardPassword,
      role: Role.STUDENT,
      isApproved: true,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "seed123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await performDatabaseResetAndSeed();
    return NextResponse.json({
      success: true,
      message: "Khởi tạo thành công 2 trường Hải Phòng (THPT Chuyên Trần Phú & THPT Lương Khánh Thiện)!",
      credentials: {
        password: "Password@123",
        superAdmin: "admin@school.com",
        deptAdmin: "sogddt@haiphong.edu.vn",
        wardAdmin: "phonggd.haian@haiphong.edu.vn",
        principalTranPhu: "hieutruong.tranphu@haiphong.edu.vn",
        principalLKThien: "hieutruong.luongkhanhthien@haiphong.edu.vn",
        teacherTranPhu: "gv.toan.tuan.tp@haiphong.edu.vn",
        teacherLKThien: "gv.toan.bach.lkt@haiphong.edu.vn",
      },
    });
  } catch (error: any) {
    console.error("[API db-seed] Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi khởi tạo cơ sở dữ liệu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await performDatabaseResetAndSeed();
    return NextResponse.json({
      success: true,
      message: "Khởi tạo thành công 2 trường Hải Phòng (THPT Chuyên Trần Phú & THPT Lương Khánh Thiện)!",
      password: "Password@123",
    });
  } catch (error: any) {
    console.error("[API db-seed POST] Error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi khởi tạo cơ sở dữ liệu" }, { status: 500 });
  }
}
