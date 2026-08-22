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

    const schoolPoint = await prisma.schoolPoint.create({
      data: {
        campusId: campus.id,
        name: `Điểm trường chính - ${sConf.name.replace("Trường THCS ", "")}`,
        address: sConf.address,
        distanceKm: 0,
        managerName: sConf.name,
        phone: sConf.phone,
      },
    });

    // Create 5 subject-specialist teachers for this school
    const teacherSpecs = [
      { name: "Toán", specialty: "Toán học" },
      { name: "Vật Lý", specialty: "Vật lý" },
      { name: "Ngữ Văn", specialty: "Ngữ văn" },
      { name: "Tiếng Anh", specialty: "Tiếng Anh" },
      { name: "Lịch Sử", specialty: "Lịch sử" },
    ];

    const schoolTeachers = [];
    for (let tIdx = 0; tIdx < teacherSpecs.length; tIdx++) {
      const spec = teacherSpecs[tIdx];
      let teacherUser;
      if (sIdx === 0 && tIdx === 2) {
        // Literature teacher is the default demo teacher
        teacherUser = defaultTeacherUser;
      } else {
        teacherUser = await prisma.user.create({
          data: {
            name: `GV. ${sConf.code} Cô/Thầy (${spec.name})`,
            email: `teacher.${sConf.code.toLowerCase()}.${spec.name.toLowerCase().replace(/ /g, "")}@school.com`,
            password: hashedPassword,
            role: Role.TEACHER,
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

      if (sIdx === 0 && tIdx === 2) {
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
