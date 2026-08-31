import {
  PrismaClient,
  Role,
  Gender,
  AttendanceStatus,
  GradeType,
  StudentStatus,
  LessonPlanStatus,
  KpiCategory,
  MeasurementDirection,
  ReportingFrequency,
  KpiPeriodStatus,
  QualityCategory,
  QualityObjectiveStatus,
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
  DocumentType,
  DocumentUrgency,
  DocumentStatus,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseCsvContent(content: string) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const columns: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        columns.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    if (columns.length >= 2) {
      rows.push(columns);
    }
  }
  return rows;
}

function readCsvFile(filename: string): string[][] {
  const possiblePaths = [
    path.join("C:", "Users", "tungh", "Downloads", filename),
    path.join(process.cwd(), "..", "Downloads", filename),
    path.join(process.cwd(), filename),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`📖 Reading CSV file from: ${p}`);
      const content = fs.readFileSync(p, "utf-8");
      return parseCsvContent(content);
    }
  }
  throw new Error(`CSV file ${filename} not found in any expected location.`);
}

async function main() {
  console.log("🌱 Seeding database with 3 schools & 5 classes each from CSV files...");

  // Clean existing data in reverse dependency order
  await prisma.aiAnalysisLog.deleteMany();
  await prisma.aiReportSummary.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.aiAlert.deleteMany();
  await prisma.aiConfigThreshold.deleteMany();
  await prisma.equipmentTransfer.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.officialDocument.deleteMany();

  await prisma.fileAuditLog.deleteMany();
  await prisma.systemEvidenceFile.deleteMany();
  await prisma.approvalComment.deleteMany();
  await prisma.approvalWorkflow.deleteMany();

  await prisma.qualityObjectiveHistory.deleteMany();
  await prisma.qualityObjectiveEvidence.deleteMany();
  await prisma.qualityObjective.deleteMany();

  await prisma.kpiUnlockLog.deleteMany();
  await prisma.kpiApprovalLog.deleteMany();
  await prisma.kpiEvidence.deleteMany();
  await prisma.kpiValue.deleteMany();
  await prisma.kpiTarget.deleteMany();
  await prisma.kpiAssignment.deleteMany();
  await prisma.kpiPeriod.deleteMany();
  await prisma.kpiCatalog.deleteMany();

  await prisma.weeklyActivity.deleteMany();
  await prisma.monthlyPlan.deleteMany();
  await prisma.academicCalendar.deleteMany();
  await prisma.decisionLog.deleteMany();
  await prisma.earlyWarning.deleteMany();
  await prisma.substituteAssignment.deleteMany();
  await prisma.classJournalEntry.deleteMany();
  await prisma.lessonPlan.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.seatingChart.deleteMany();
  await prisma.parentFeedback.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.conductRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.schoolPoint.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
  await prisma.districtWard.deleteMany();
  await prisma.educationDepartment.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);

  // ==================== 0. EDUCATION DEPARTMENT & DISTRICT WARD ====================
  const dept = await prisma.educationDepartment.create({
    data: {
      name: "Sở GD&ĐT Hà Nội",
      code: "HN_DOET",
    },
  });

  const ward = await prisma.districtWard.create({
    data: {
      departmentId: dept.id,
      name: "Phòng GD&ĐT Thạch Thất",
      code: "THACH_THAT",
    },
  });

  // ==================== 1. SYSTEM BASE USERS ====================
  const adminUser = await prisma.user.create({
    data: {
      name: "TS. Nguyễn Văn Hùng",
      email: "admin@school.com",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const vpUser1 = await prisma.user.create({
    data: {
      name: "ThS. Trịnh Văn Sơn",
      email: "vp1@school.com",
      password: hashedPassword,
      role: Role.VICE_PRINCIPAL,
    },
  });

  const vpUser2 = await prisma.user.create({
    data: {
      name: "ThS. Nguyễn Thị Thu",
      email: "vp2@school.com",
      password: hashedPassword,
      role: Role.VICE_PRINCIPAL,
    },
  });

  // Base demo teacher
  const defaultTeacherUser = await prisma.user.create({
    data: {
      name: "Trần Thị Hoa",
      email: "teacher@school.com",
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });

  // ==================== 2. SUBJECTS ====================
  const mathSubject = await prisma.subject.create({ data: { name: "Toán", gradeLevel: 6 } });
  const physicsSubject = await prisma.subject.create({ data: { name: "Vật Lý", gradeLevel: 6 } });
  const literatureSubject = await prisma.subject.create({ data: { name: "Ngữ Văn", gradeLevel: 6 } });
  const englishSubject = await prisma.subject.create({ data: { name: "Tiếng Anh", gradeLevel: 6 } });
  const historySubject = await prisma.subject.create({ data: { name: "Lịch Sử", gradeLevel: 6 } });

  // ==================== 3. 3 SCHOOLS CONFIGURATION ====================
  const schoolsConfig = [
    {
      code: "TX",
      name: "Trường THCS Tân Xã",
      districtWardId: ward.id,
      branchType: "WARD" as const,
      address: "Xã Tân Xã, Huyện Thạch Thất, Hà Nội",
      phone: "024-3383-1111",
      email: "thcs.tanxa@hanoi.edu.vn",
      csvFile: "THCS_Tan_Xa-DanhSachHocSinh.csv",
    },
    {
      code: "HB",
      name: "Trường THCS Hạ Bằng",
      districtWardId: ward.id,
      branchType: "WARD" as const,
      address: "Xã Hạ Bằng, Huyện Thạch Thất, Hà Nội",
      phone: "024-3383-2222",
      email: "thcs.habang@hanoi.edu.vn",
      csvFile: "THCS_Ha_Bang-DanhSachHocSinh.csv",
    },
    {
      code: "FPT",
      name: "Trường THCS FPT",
      districtWardId: ward.id,
      branchType: "WARD" as const,
      address: "Khu Khu CN Hi-Tech FPT, Huyện Thạch Thất, Hà Nội",
      phone: "024-3383-3333",
      email: "thcs.fpt@fpt.edu.vn",
      csvFile: "THCS_FPT-DanhSachHocSinh.csv",
    },
  ];

  const classSpecs = [
    { name: "6A1", gradeLevel: 6, startIndex: 0, endIndex: 40 },
    { name: "6A2", gradeLevel: 6, startIndex: 40, endIndex: 80 },
    { name: "7A1", gradeLevel: 7, startIndex: 80, endIndex: 120 },
    { name: "8A1", gradeLevel: 8, startIndex: 120, endIndex: 160 },
    { name: "9A1", gradeLevel: 9, startIndex: 160, endIndex: 200 },
  ];

  let mainClass6A1: any = null; // For default teacher homeroom reference
  let defaultTeacherObj: any = null;
  let firstStudentCreated = false;

  for (let sIdx = 0; sIdx < schoolsConfig.length; sIdx++) {
    const sConf = schoolsConfig[sIdx];
    console.log(`\n🏫 Creating ${sConf.name}...`);

    const school = await prisma.school.create({
      data: {
        departmentId: dept.id,
        districtWardId: sConf.districtWardId,
        branchType: sConf.branchType,
        name: sConf.name,
        address: sConf.address,
        phone: sConf.phone,
        email: sConf.email,
      },
    });

    const campus = await prisma.campus.create({
      data: {
        schoolId: school.id,
        name: `Cơ sở ${sConf.name.replace("Trường THCS ", "")}`,
        address: sConf.address,
      },
    });

    let schoolPoint;
    if (sIdx === 0) {
      // Create 4 distinct school points for THCS Tân Xã (Primary Multi-Campus Demo)
      schoolPoint = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: "Điểm trường Trung tâm",
          address: "Trung tâm Xã Tân Xã, Huyện Thạch Thất",
          distanceKm: 0,
          managerName: "ThS. Trịnh Văn Sơn",
          phone: "024-3383-1111",
        },
      });

      const pointBanMo = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: "Điểm trường Bản Mó",
          address: "Bản Mó, Xã Tân Xã (Vùng khó khăn)",
          distanceKm: 4.5,
          managerName: "Thầy Lò Văn Quyết",
          phone: "0912-345-001",
        },
      });

      const pointBanPun = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: "Điểm trường Bản Pún",
          address: "Bản Pún, Xã Tân Xã (Đường đèo dốc)",
          distanceKm: 8.2,
          managerName: "Thầy Cầm Văn Nam",
          phone: "0912-345-002",
        },
      });

      const pointPhiaXam = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: "Điểm trường Phia Xam",
          address: "Bản Phia Xam, Xã Tân Xã (Điểm xa nhất)",
          distanceKm: 12.5,
          managerName: "Thầy Lữ Văn Sơn",
          phone: "0912-345-003",
        },
      });

      // Seed satellite teachers
      const satelliteTeacherData = [
        { name: "Lò Văn Quyết", specialty: "Toán học", slug: "quyet", pointId: pointBanMo.id },
        { name: "Hà Thị Dung", specialty: "Ngữ văn", slug: "dung", pointId: pointBanMo.id },
        { name: "Cầm Văn Nam", specialty: "Tiếng Anh", slug: "nam", pointId: pointBanPun.id },
        { name: "Vi Thị Mai", specialty: "Vật lý", slug: "mai", pointId: pointBanPun.id },
        { name: "Lữ Văn Sơn", specialty: "Toán học", slug: "son", pointId: pointPhiaXam.id },
      ];

      for (const st of satelliteTeacherData) {
        const u = await prisma.user.create({
          data: {
            name: `${st.name} (GV ${st.specialty})`,
            email: `teacher.sat.${st.slug}@school.com`,
            password: hashedPassword,
            role: Role.TEACHER,
            schoolId: school.id,
            departmentId: dept.id,
            districtWardId: sConf.districtWardId,
          },
        });
        await prisma.teacher.create({
          data: {
            userId: u.id,
            specialty: st.specialty,
            phone: "0987654321",
            degree: "Cử nhân",
          },
        });
      }

      // Seed Equipment for 4 points
      const eqCategories = [
        { code: "PC-TT-01", name: "Dàn máy tính phòng Lab 1", cat: EquipmentCategory.COMPUTER, pt: schoolPoint.id, qty: 25, cond: EquipmentCondition.GOOD },
        { code: "PJ-TT-01", name: "Máy chiếu hội trường", cat: EquipmentCategory.PROJECTOR, pt: schoolPoint.id, qty: 5, cond: EquipmentCondition.GOOD },
        { code: "PC-BM-01", name: "Máy tính dạy học Bản Mó", cat: EquipmentCategory.COMPUTER, pt: pointBanMo.id, qty: 6, cond: EquipmentCondition.GOOD },
        { code: "PJ-BM-01", name: "Máy chiếu di động Bản Mó", cat: EquipmentCategory.PROJECTOR, pt: pointBanMo.id, qty: 1, cond: EquipmentCondition.POOR },
        { code: "PC-BP-01", name: "Máy tính thực hành Bản Pún", cat: EquipmentCategory.COMPUTER, pt: pointBanPun.id, qty: 4, cond: EquipmentCondition.GOOD },
        { code: "LK-BP-01", name: "Bộ đồ dùng KHTN Bản Pún", cat: EquipmentCategory.LAB_KIT, pt: pointBanPun.id, qty: 2, cond: EquipmentCondition.GOOD },
        { code: "PC-PX-01", name: "Máy vi tính văn phòng Phia Xam", cat: EquipmentCategory.COMPUTER, pt: pointPhiaXam.id, qty: 2, cond: EquipmentCondition.GOOD },
      ];

      for (const eq of eqCategories) {
        await prisma.equipment.create({
          data: {
            code: eq.code,
            name: eq.name,
            category: eq.cat,
            schoolId: school.id,
            schoolPointId: eq.pt,
            totalQuantity: eq.qty,
            availableQuantity: eq.qty,
            condition: eq.cond,
          },
        });
      }

      // Seed Official Documents
      await prisma.officialDocument.createMany({
        data: [
          {
            docNumber: "142/SGDĐT-GDTrH",
            title: "Chỉ đạo khẩn cấp ứng phó mưa lũ, sạt lở đất và đảm bảo an toàn tại các điểm trường vùng cao",
            issuer: "Sở GD&ĐT Hà Nội",
            docType: DocumentType.INCOMING,
            urgency: DocumentUrgency.URGENT,
            status: DocumentStatus.PROCESSING,
            issueDate: new Date(),
            deadline: new Date(Date.now() + 24 * 3600 * 1000), // 24h
            summary: "Yêu cầu các trường có điểm lẻ kiểm tra đường sá, ngập úng, cho học sinh nghỉ học nếu nguy hiểm.",
            actionRequired: "Hiệu trưởng kiểm tra 3 điểm lẻ Bản Mó, Bản Pún, Phia Xam và báo cáo trong ngày.",
            schoolId: school.id,
          },
          {
            docNumber: "88/PGDĐT-TCCB",
            title: "Rà soát định biên giáo viên và tình hình cơ sở vật chất năm học 2026-2027",
            issuer: "Phòng GD&ĐT Thạch Thất",
            docType: DocumentType.INCOMING,
            urgency: DocumentUrgency.HIGH,
            status: DocumentStatus.PENDING,
            issueDate: new Date(),
            deadline: new Date(Date.now() + 48 * 3600 * 1000), // 48h
            summary: "Báo cáo tổng hợp số liệu thừa/thiếu giáo viên môn Tiếng Anh và Tin học theo điểm trường.",
            actionRequired: "Tổng hợp số liệu từ các phân hiệu gửi Phòng trước 17h00 ngày mai.",
            schoolId: school.id,
          },
        ],
      });

      // Seed Default AI Config Thresholds
      const defaultThresholdList = [
        { metricKey: "MAX_UNEXCUSED_ABSENT_DAYS", name: "Số buổi nghỉ học không phép tối đa", val: 2.0, group: AiTaskGroup.EARLY_WARNING, sev: AiAlertSeverity.HIGH },
        { metricKey: "MAX_TOTAL_ABSENT_DAYS", name: "Số buổi nghỉ học có phép tối đa trong tháng", val: 3.0, group: AiTaskGroup.EARLY_WARNING, sev: AiAlertSeverity.MEDIUM },
        { metricKey: "ATTENDANCE_CRITICAL_RATE", name: "Tỷ lệ chuyên cần mức báo động đỏ (%)", val: 85.0, group: AiTaskGroup.REALTIME_MONITORING, sev: AiAlertSeverity.CRITICAL },
        { metricKey: "ATTENDANCE_WARNING_RATE", name: "Tỷ lệ chuyên cần mức cần chú ý (%)", val: 92.0, group: AiTaskGroup.REALTIME_MONITORING, sev: AiAlertSeverity.MEDIUM },
        { metricKey: "TEACHER_MAX_WEEKLY_PERIODS", name: "Định mức tiết dạy tối đa/tuần của GV", val: 23.0, group: AiTaskGroup.COORDINATION_DISPATCH, sev: AiAlertSeverity.MEDIUM },
        { metricKey: "MAX_TRAVEL_DISTANCE_KM", name: "Khoảng cách di chuyển dạy thay tối đa (km)", val: 15.0, group: AiTaskGroup.COORDINATION_DISPATCH, sev: AiAlertSeverity.LOW },
        { metricKey: "LESSON_PLAN_DELAY_DAYS", name: "Số ngày chậm nộp giáo án cho phép", val: 2.0, group: AiTaskGroup.PLAN_PROGRESS, sev: AiAlertSeverity.MEDIUM },
        { metricKey: "DOC_EXPIRING_HOURS", name: "Thời gian cảnh báo công văn sắp đến hạn (giờ)", val: 48.0, group: AiTaskGroup.DOCS_PERIODIC_REPORTS, sev: AiAlertSeverity.HIGH },
        { metricKey: "PARENT_FEEDBACK_RESPONSE_HOURS", name: "Thời gian tối đa phản hồi ý kiến phụ huynh (giờ)", val: 48.0, group: AiTaskGroup.COMMUNICATION_FEEDBACK, sev: AiAlertSeverity.MEDIUM },
      ];

      for (const t of defaultThresholdList) {
        await prisma.aiConfigThreshold.create({
          data: {
            schoolId: school.id,
            taskGroup: t.group,
            metricKey: t.metricKey,
            metricName: t.name,
            thresholdValue: t.val,
            severity: t.sev,
            comparisonOp: "GTE",
          },
        });
      }

      // Seed Initial AI Alerts
      await prisma.aiAlert.createMany({
        data: [
          {
            schoolId: school.id,
            schoolPointId: pointBanMo.id,
            taskGroup: AiTaskGroup.EARLY_WARNING,
            severity: AiAlertSeverity.HIGH,
            status: AiAlertStatus.ACTIVE,
            title: "Học sinh Lò Văn Tuấn vắng học 4 buổi liên tiếp không phép",
            description: "Học sinh Lò Văn Tuấn (Điểm Bản Mó) vắng mặt 4 ngày liên tiếp không rõ lý do. Gia đình làm nương xa, có nguy cơ bỏ học giữa chừng.",
            suggestedAction: "Đề nghị GVCN và Ban quản lý thôn Bản Mó đến trực tiếp gia đình xác minh, động viên học sinh trở lại trường.",
            targetEntity: "Student:mock-ban-mo-1",
            targetName: "Lò Văn Tuấn (Lớp 6A1 - Điểm Bản Mó)",
          },
          {
            schoolId: school.id,
            schoolPointId: pointPhiaXam.id,
            taskGroup: AiTaskGroup.COORDINATION_DISPATCH,
            severity: AiAlertSeverity.CRITICAL,
            status: AiAlertStatus.ACTIVE,
            title: "Thiếu giáo viên Toán tại Điểm Phia Xam (Cách trung tâm 12.5 km)",
            description: "Thầy Lữ Văn Sơn nghỉ ốm đột xuất 3 ngày. Điểm Phia Xam không có giáo viên Toán dự phòng.",
            suggestedAction: "Kích hoạt điều phối dạy thay: Phân công thầy Lò Văn Quyết (Bản Mó, 8km) hoặc thầy Cầm Văn Nam tăng cường.",
            targetEntity: "SchoolPoint:" + pointPhiaXam.id,
            targetName: "Điểm trường Phia Xam",
          },
        ],
      });
    } else {
      schoolPoint = await prisma.schoolPoint.create({
        data: {
          campusId: campus.id,
          name: `Điểm trường chính - ${sConf.name.replace("Trường THCS ", "")}`,
          address: sConf.address,
          distanceKm: 0,
          managerName: sConf.name,
          phone: sConf.phone,
        },
      });
    }

    // Create 5 unique subject-specialist teachers per school
    const schoolTeacherSpecs = [
      [
        { name: "Trần Thị Hoa", specialty: "Toán học", slug: "toan" },
        { name: "Nguyễn Văn An", specialty: "Vật lý", slug: "vatly" },
        { name: "Đỗ Thị Bích", specialty: "Ngữ văn", slug: "nguvan" },
        { name: "Hoàng Đức Anh", specialty: "Tiếng Anh", slug: "tienganh" },
        { name: "Nguyễn Thị Chúc", specialty: "Lịch sử", slug: "lichsu" },
      ],
      [
        { name: "Phạm Văn Minh", specialty: "Toán học", slug: "toan" },
        { name: "Trần Thị Thanh", specialty: "Vật lý", slug: "vatly" },
        { name: "Lê Hoàng Mai", specialty: "Ngữ văn", slug: "nguvan" },
        { name: "Phạm Minh Đức", specialty: "Tiếng Anh", slug: "tienganh" },
        { name: "Vũ Phương Thảo", specialty: "Lịch sử", slug: "lichsu" },
      ],
      [
        { name: "Nguyễn Đức Trung", specialty: "Toán học", slug: "toan" },
        { name: "Lê Thị Hải", specialty: "Vật lý", slug: "vatly" },
        { name: "Trịnh Thu Trang", specialty: "Ngữ văn", slug: "nguvan" },
        { name: "Vũ Hoàng Long", specialty: "Tiếng Anh", slug: "tienganh" },
        { name: "Lý Ngọc Diệp", specialty: "Lịch sử", slug: "lichsu" },
      ],
    ];
    const teacherSpecs = schoolTeacherSpecs[sIdx] || schoolTeacherSpecs[0];

    const schoolTeachers = [];
    for (let tIdx = 0; tIdx < teacherSpecs.length; tIdx++) {
      const spec = teacherSpecs[tIdx];
      let teacherUser;
      if (sIdx === 0 && tIdx === 0) {
        // Math teacher is the default demo teacher for THCS Tân Xã
        teacherUser = await prisma.user.update({
          where: { id: defaultTeacherUser.id },
          data: {
            name: "Trần Thị Hoa (GV Toán)",
            schoolId: school.id,
            departmentId: dept.id,
            districtWardId: sConf.districtWardId,
          },
        });
      } else {
        teacherUser = await prisma.user.create({
          data: {
            name: `${spec.name} (${spec.specialty})`,
            email: `teacher.${sConf.code.toLowerCase()}.${spec.slug}@school.com`,
            password: hashedPassword,
            role: Role.TEACHER,
            schoolId: school.id,
            departmentId: dept.id,
            districtWardId: sConf.districtWardId,
          },
        });
      }

      const teacher = await prisma.teacher.create({
        data: {
          userId: teacherUser.id,
          specialty: spec.specialty,
          phone: `090${sIdx}${tIdx}12345`,
          degree: "Cử nhân",
        },
      });

      if (sIdx === 0 && tIdx === 0) {
        defaultTeacherObj = teacher;
      }

      schoolTeachers.push(teacher);
    }

    // Read CSV student data
    const studentRows = readCsvFile(sConf.csvFile);
    console.log(`   📄 Parsed ${studentRows.length} students from ${sConf.csvFile}`);

    // Create 5 classes & populate students (40 per class)
    for (let cIdx = 0; cIdx < classSpecs.length; cIdx++) {
      const cSpec = classSpecs[cIdx];
      const homeroomTeacher = schoolTeachers[cIdx];

      const classRoom = await prisma.classRoom.create({
        data: {
          name: cSpec.name,
          gradeLevel: cSpec.gradeLevel,
          schoolId: school.id,
          campusId: campus.id,
          schoolPointId: schoolPoint.id,
          homeroomTeacherId: homeroomTeacher.id,
        },
      });

      if (sIdx === 0 && cIdx === 0) {
        mainClass6A1 = classRoom;
      }

      // Create Groups (Tổ 1, Tổ 2, Tổ 3, Tổ 4) for class
      const group1 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 1" } });
      const group2 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 2" } });
      const group3 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 3" } });
      const group4 = await prisma.group.create({ data: { classId: classRoom.id, name: "Tổ 4" } });
      const groups = [group1, group2, group3, group4];

      // Assign slice of students (40 students) in parallel using Promise.all
      const classStudents = studentRows.slice(cSpec.startIndex, cSpec.endIndex);
      
      await Promise.all(
        classStudents.map(async (row, stIdx) => {
          const origCode = row[0] || `HS${stIdx + 1}`;
          const name = row[1] || `Học sinh ${stIdx + 1}`;
          let email = row[2] || `${sConf.code.toLowerCase()}_st${cSpec.startIndex + stIdx}@school.com`;
          const dobStr = row[3] || "2014-01-01";
          const genderStr = row[4];
          const phone = row[5] || "0987654321";
          const ethnicity = row[6] || "Kinh";
          const address = row[7] || "Hà Nội";

          if (sIdx === 0 && cIdx === 0 && stIdx === 0 && !firstStudentCreated) {
            email = "student@school.com";
            firstStudentCreated = true;
          }

          const user = await prisma.user.create({
            data: {
              name: name,
              email: email,
              password: hashedPassword,
              role: Role.STUDENT,
            },
          });

          const studentCode = `${sConf.code}-${origCode}`;
          const targetGroup = groups[stIdx % groups.length];

          await prisma.student.create({
            data: {
              userId: user.id,
              studentCode: studentCode,
              classId: classRoom.id,
              groupId: targetGroup.id,
              status: StudentStatus.STUDYING,
              dob: new Date(dobStr),
              gender: genderStr === "Nam" ? Gender.MALE : Gender.FEMALE,
              ethnicity: ethnicity,
              nationality: "Việt Nam",
              addressCurrent: address,
              parentName: `Phụ huynh ${name}`,
              parentPhone: phone,
            },
          });
        })
      );

      console.log(`   ✅ Lớp ${cSpec.name}: Seeded ${classStudents.length} học sinh (Chủ nhiệm: ${homeroomTeacher.userId})`);
    }

    // Create Teaching Assignments & Schedule Matrix for this School's classes
    const schoolClasses = await prisma.classRoom.findMany({ where: { schoolId: school.id } });
    const allSubjects = [mathSubject, physicsSubject, literatureSubject, englishSubject, historySubject];

    for (let cIdx = 0; cIdx < schoolClasses.length; cIdx++) {
      const cls = schoolClasses[cIdx];
      // Create teaching assignments for each subject (strictly assigned to subject specialist teacher)
      for (let sIdxSub = 0; sIdxSub < allSubjects.length; sIdxSub++) {
        const sub = allSubjects[sIdxSub];
        const assignedTeacher = schoolTeachers[sIdxSub % schoolTeachers.length]; // Specialist teacher!

        await prisma.teachingAssignment.create({
          data: {
            classId: cls.id,
            subjectId: sub.id,
            teacherId: assignedTeacher.id,
          },
        });
      }

      // Create Timetable Schedules (Monday=1 to Friday=5, Periods 1 to 5)
      for (let day = 1; day <= 5; day++) {
        for (let p = 1; p <= 5; p++) {
          const subIdx = (cIdx + day + p) % allSubjects.length;
          const sub = allSubjects[subIdx];
          // Always pick teacher matching the subject specialty (Toán -> Toán, Ngữ Văn -> Ngữ Văn)
          const teacher = schoolTeachers[subIdx % schoolTeachers.length];

          await prisma.schedule.create({
            data: {
              classId: cls.id,
              subjectId: sub.id,
              teacherId: teacher.id,
              dayOfWeek: day,
              period: p,
              room: `Phòng ${cls.name}`,
            },
          });
        }
      }
    }
  }

  // ==================== 4. QUALITY OBJECTIVES & KPIS ====================
  const kpiCatalogData = [
    { code: "KPI-001", name: "Tỷ lệ Chuyên cần Học sinh toàn trường", category: KpiCategory.STUDENT, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 10.0, baselineValue: 95.0, targetValue: 98.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-002", name: "Tỷ lệ Học sinh Xếp loại Học lực Khá & Giỏi", category: KpiCategory.EDUCATIONAL_QUALITY, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 12.0, baselineValue: 60.0, targetValue: 75.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-003", name: "Tỷ lệ Giáo án Phê duyệt Đúng hạn", category: KpiCategory.PROFESSIONAL, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 8.0, baselineValue: 85.0, targetValue: 100.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
  ];

  for (const kpiData of kpiCatalogData) {
    await prisma.kpiCatalog.create({
      data: {
        code: kpiData.code,
        name: kpiData.name,
        category: kpiData.category,
        unit: kpiData.unit,
        direction: kpiData.direction,
        weight: kpiData.weight,
        baselineValue: kpiData.baselineValue,
        targetValue: kpiData.targetValue,
        responsiblePerson: kpiData.responsiblePerson,
        frequency: ReportingFrequency.SEMESTER,
        isActive: true,
      },
    });
  }

  // Sample Lesson Plan & Class Journal Entry for demo
  if (mainClass6A1 && defaultTeacherObj) {
    await prisma.lessonPlan.create({
      data: {
        teacherId: defaultTeacherObj.id,
        subjectId: mathSubject.id,
        classId: mainClass6A1.id,
        weekNumber: 1,
        periodStart: 1,
        periodEnd: 2,
        title: "Số tự nhiên - Tập hợp và phần tử",
        objectives: "Học sinh hiểu được khái niệm tập hợp, phần tử của tập hợp.",
        content: "1. Khái niệm tập hợp\n2. Cách viết tập hợp",
        activities: "Giảng bài + thảo luận nhóm",
        materials: "SGK Toán 6, máy chiếu",
        status: LessonPlanStatus.APPROVED,
        reviewNote: "Giáo án xuất sắc, chuẩn bị công phu.",
        reviewedBy: "ThS. Trịnh Văn Sơn",
        reviewedAt: new Date("2026-09-02"),
      },
    });

    const journalDate = new Date();
    journalDate.setDate(journalDate.getDate() - 1);

    await prisma.classJournalEntry.create({
      data: {
        classId: mainClass6A1.id,
        subjectId: mathSubject.id,
        teacherId: defaultTeacherObj.id,
        date: journalDate,
        dayOfWeek: 2,
        period: 1,
        lessonTitle: "Tập hợp và phần tử",
        content: "Đã dạy xong lý thuyết và bài tập 1, 2.",
        absentees: "Không có",
        notes: "Lớp học nghiêm túc, phát biểu sôi nổi.",
        isConfirmed: true,
        confirmedAt: journalDate,
      },
    });
  }

  // Seed all 7-role RBAC hierarchy accounts
  await seedRbacAccounts();

  console.log("\n✅ Seed process completed successfully!");
  console.log("🏫 3 Trường đã khởi tạo:");
  console.log("   1. Trường THCS Tân Xã (5 lớp: 6A1, 6A2, 7A1, 8A1, 9A1 - 200 học sinh)");
  console.log("   2. Trường THCS Hạ Bằng (5 lớp: 6A1, 6A2, 7A1, 8A1, 9A1 - 200 học sinh)");
  console.log("   3. Trường THCS FPT (5 lớp: 6A1, 6A2, 7A1, 8A1, 9A1 - 200 học sinh)");
  console.log("\n📧 Tài khoản demo:");
  console.log("   👑 Hiệu trưởng (Admin):      admin@school.com   / 123456");
  console.log("   👔 Phó Hiệu trưởng:         vp1@school.com     / 123456");
  console.log("   👩🏫 Giáo viên Chủ nhiệm:     teacher@school.com / 123456 (Chủ nhiệm 6A1 THCS Tân Xã)");
  console.log("   👨🎓 Học sinh:                 student@school.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



// ============================================================
// RBAC DEMO ACCOUNTS SEEDER
// Creates 7 demo accounts covering all roles in the hierarchy.
// Run: npx prisma db seed
// ============================================================

async function seedRbacAccounts() {
  const pw = await bcrypt.hash("Demo@2026!", 10);

  // 1. SUPER_ADMIN — System Admin (infrastructure only)
  const superAdmin = await prisma.user.upsert({
    where: { email: "sysadmin@so-gddt.gov.vn" },
    update: {},
    create: {
      email: "sysadmin@so-gddt.gov.vn",
      password: pw,
      name: "Quan Tri He Thong",
      role: "SUPER_ADMIN" as Role,
      isApproved: true,
    },
  });
  await (prisma as any).userRoleScope.upsert({
    where: { id: `scope-superadmin-${superAdmin.id}` },
    update: {},
    create: {
      id: `scope-superadmin-${superAdmin.id}`,
      userId: superAdmin.id,
      role: "SUPER_ADMIN" as Role,
      scopeType: "GLOBAL" as any,
    },
  });
  console.log("  [1] SUPER_ADMIN: sysadmin@so-gddt.gov.vn / Demo@2026!");

  // 2. DEPARTMENT_ADMIN — So GD&DT officer (aggregate read)
  const dept = await prisma.user.upsert({
    where: { email: "cbso@so-gddt.gov.vn" },
    update: {},
    create: {
      email: "cbso@so-gddt.gov.vn",
      password: pw,
      name: "Can Bo So GD&DT",
      role: "DEPARTMENT_ADMIN" as Role,
      isApproved: true,
    },
  });
  await (prisma as any).userRoleScope.upsert({
    where: { id: `scope-dept-${dept.id}` },
    update: {},
    create: {
      id: `scope-dept-${dept.id}`,
      userId: dept.id,
      role: "DEPARTMENT_ADMIN" as Role,
      scopeType: "GLOBAL" as any,
    },
  });
  console.log("  [2] DEPARTMENT_ADMIN: cbso@so-gddt.gov.vn / Demo@2026!");

  // 3. DISTRICT_ADMIN — Phong GD&DT officer
  const district = await prisma.user.upsert({
    where: { email: "cbphong@phonggd.gov.vn" },
    update: {},
    create: {
      email: "cbphong@phonggd.gov.vn",
      password: pw,
      name: "Can Bo Phong GD&DT",
      role: "DISTRICT_ADMIN" as Role,
      isApproved: true,
    },
  });
  await (prisma as any).userRoleScope.upsert({
    where: { id: `scope-district-${district.id}` },
    update: {},
    create: {
      id: `scope-district-${district.id}`,
      userId: district.id,
      role: "DISTRICT_ADMIN" as Role,
      scopeType: "GLOBAL" as any,
    },
  });
  console.log("  [3] DISTRICT_ADMIN: cbphong@phonggd.gov.vn / Demo@2026!");

  // 4. WARD_ADMIN — UBND Xa commune officer (geographic read-only)
  const wardUser = await prisma.user.upsert({
    where: { email: "vhxh.tanxa@diaphuong.gov.vn" },
    update: {},
    create: {
      email: "vhxh.tanxa@diaphuong.gov.vn",
      password: pw,
      name: "Can Bo Van Hoa Xa Tan Xa",
      role: "WARD_ADMIN" as Role,
      isApproved: true,
    },
  });
  console.log("  [4] WARD_ADMIN: vhxh.tanxa@diaphuong.gov.vn / Demo@2026!");
  console.log("      (Assign ward in UserRoleScope after CampusWardMap is populated)");

  // 5. ADMIN — Hieu truong (full school access)
  const hieut = await prisma.user.upsert({
    where: { email: "ht.tanxa@school.edu.vn" },
    update: {},
    create: {
      email: "ht.tanxa@school.edu.vn",
      password: pw,
      name: "Hieu Truong THCS Tan Xa",
      role: "ADMIN" as Role,
      isApproved: true,
    },
  });
  await (prisma as any).userRoleScope.upsert({
    where: { id: `scope-admin-${hieut.id}` },
    update: {},
    create: {
      id: `scope-admin-${hieut.id}`,
      userId: hieut.id,
      role: "ADMIN" as Role,
      scopeType: "GLOBAL" as any,
    },
  });
  console.log("  [5] ADMIN (Hieu truong): ht.tanxa@school.edu.vn / Demo@2026!");

  // 6. VICE_PRINCIPAL — Pho Hieu truong phu trach Diem 1
  const vp = await prisma.user.upsert({
    where: { email: "pht.diem1.tanxa@school.edu.vn" },
    update: {},
    create: {
      email: "pht.diem1.tanxa@school.edu.vn",
      password: pw,
      name: "Pho Hieu Truong Diem 1",
      role: "VICE_PRINCIPAL" as Role,
      isApproved: true,
    },
  });
  // VICE_PRINCIPAL scope is tied to a specific campusId.
  // Left without campusId here — assign campusId after campus is created.
  console.log("  [6] VICE_PRINCIPAL (Diem 1): pht.diem1.tanxa@school.edu.vn / Demo@2026!");
  console.log("      (Assign campusId to this user + UserRoleScope after campus seeding)");

  // 7. SUBJECT_HEAD — To truong chuyen mon Toan
  const ttcm = await prisma.user.upsert({
    where: { email: "ttcm.toan.tanxa@school.edu.vn" },
    update: {},
    create: {
      email: "ttcm.toan.tanxa@school.edu.vn",
      password: pw,
      name: "To Truong Chuyen Mon Toan",
      role: "SUBJECT_HEAD" as Role,
      isApproved: true,
    },
  });
  // SUBJECT_HEAD scope is tied to a SubjectGroup.
  // Left without subjectGroupId here — assign after SubjectGroup is populated.
  console.log("  [7] SUBJECT_HEAD (Toan): ttcm.toan.tanxa@school.edu.vn / Demo@2026!");
  console.log("      (Assign subjectGroupId in UserRoleScope after SubjectGroup seeding)");

  // 8. TEACHER demo account
  const teacher = await prisma.user.upsert({
    where: { email: "gv.hoa.tanxa@school.edu.vn" },
    update: {},
    create: {
      email: "gv.hoa.tanxa@school.edu.vn",
      password: pw,
      name: "Tran Thi Hoa",
      role: "TEACHER" as Role,
      isApproved: true,
    },
  });
  console.log("  [8] TEACHER: gv.hoa.tanxa@school.edu.vn / Demo@2026!");

  console.log("\n  All RBAC demo passwords: Demo@2026!");
  console.log("  Run 'npx prisma migrate dev' first, then 'npx prisma db seed'");
}