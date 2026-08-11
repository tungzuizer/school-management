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

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding comprehensive database for Strategy & School Management System...");

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

  const hashedPassword = await bcrypt.hash("123456", 10);

  // ==================== 1. USERS & ROLES ====================
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

  const teacherUser1 = await prisma.user.create({
    data: {
      name: "Trần Thị Hoa",
      email: "teacher@school.com",
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      name: "Lê Văn Minh",
      email: "teacher2@school.com",
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });

  const teacherUser3 = await prisma.user.create({
    data: {
      name: "Phạm Thị Lan",
      email: "teacher3@school.com",
      password: hashedPassword,
      role: Role.TEACHER,
    },
  });

  const studentUsers = [];
  const studentNames = [
    "Phạm Quang Huy", "Nguyễn Thị Mai", "Hoàng Đức Anh",
    "Trần Văn Bình", "Lê Thị Cúc", "Ngô Văn Dũng",
    "Đỗ Thị Hằng", "Vũ Minh Tuấn", "Bùi Thị Ngọc", "Đinh Văn Long",
  ];
  for (let i = 0; i < studentNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        name: studentNames[i],
        email: i === 0 ? "student@school.com" : `student${i + 1}@school.com`,
        password: hashedPassword,
        role: Role.STUDENT,
      },
    });
    studentUsers.push(user);
  }

  // ==================== 2. SCHOOL & CAMPUSES (1 Trường - 3 Phân hiệu) ====================
  const mainSchool = await prisma.school.create({
    data: {
      name: "Trường PTDTBT THCS Mường Mát",
      address: "Xã Mường Mát, Huyện Kỳ Sơn, Tỉnh Nghệ An",
      phone: "0238-3123-888",
      email: "thcs.muongmat@nghean.edu.vn",
    },
  });

  // Campus 1: Phân hiệu Trung Tâm
  const campusCenter = await prisma.campus.create({
    data: {
      schoolId: mainSchool.id,
      name: "Phân hiệu 1 - Trung Tâm",
      address: "Bản Trung Tâm, Xã Mường Mát",
    },
  });

  // Campus 2: Phân hiệu Sơn Lâm
  const campusSonLam = await prisma.campus.create({
    data: {
      schoolId: mainSchool.id,
      name: "Phân hiệu 2 - Cụm Sơn Lâm",
      address: "Bản Sơn Lâm, Xã Mường Mát",
    },
  });

  // Campus 3: Phân hiệu Khâu Cáp
  const campusKhauCap = await prisma.campus.create({
    data: {
      schoolId: mainSchool.id,
      name: "Phân hiệu 3 - Cụm Khâu Cáp",
      address: "Bản Khâu Cáp, Xã Mường Mát",
    },
  });

  // Assign VPs to Campuses
  await prisma.user.update({ where: { id: vpUser1.id }, data: { campusId: campusCenter.id } });
  await prisma.user.update({ where: { id: vpUser2.id }, data: { campusId: campusSonLam.id } });

  // School Points (Điểm trường lẻ / Vệ tinh)
  const spCenter = await prisma.schoolPoint.create({
    data: { campusId: campusCenter.id, name: "Điểm trường Trung Tâm", address: "Bản Trung Tâm", distanceKm: 0.0, managerName: "TS. Nguyễn Văn Hùng", phone: "0988-111-222" },
  });
  const spBanMo = await prisma.schoolPoint.create({
    data: { campusId: campusCenter.id, name: "Điểm trường Bản Mó", address: "Bản Mó (vùng cao)", distanceKm: 5.2, managerName: "Cô Trần Thị Hoa", phone: "0988-222-333" },
  });
  const spBanPun = await prisma.schoolPoint.create({
    data: { campusId: campusSonLam.id, name: "Điểm trường Bản Pún", address: "Bản Pún (gần suối)", distanceKm: 8.5, managerName: "Thầy Lê Văn Minh", phone: "0988-333-444" },
  });
  const spPhiaXam = await prisma.schoolPoint.create({
    data: { campusId: campusKhauCap.id, name: "Điểm trường Phia Xam", address: "Đỉnh Phia Xam", distanceKm: 14.2, managerName: "Cô Phạm Thị Lan", phone: "0988-444-555" },
  });

  // ==================== 3. SUBJECTS, TEACHERS & CLASSES ====================
  const mathSubject = await prisma.subject.create({ data: { name: "Toán", gradeLevel: 6 } });
  const physicsSubject = await prisma.subject.create({ data: { name: "Vật Lý", gradeLevel: 6 } });
  const literatureSubject = await prisma.subject.create({ data: { name: "Ngữ Văn", gradeLevel: 6 } });
  const englishSubject = await prisma.subject.create({ data: { name: "Tiếng Anh", gradeLevel: 6 } });
  const historySubject = await prisma.subject.create({ data: { name: "Lịch Sử", gradeLevel: 6 } });

  const teacher1 = await prisma.teacher.create({
    data: { userId: teacherUser1.id, specialty: "Toán học", phone: "0901234567", degree: "Thạc sĩ" },
  });
  const teacher2 = await prisma.teacher.create({
    data: { userId: teacherUser2.id, specialty: "Vật Lý", phone: "0912345678", degree: "Cử nhân" },
  });
  const teacher3 = await prisma.teacher.create({
    data: { userId: teacherUser3.id, specialty: "Ngữ Văn", phone: "0923456789", degree: "Thạc sĩ" },
  });

  const class6A1 = await prisma.classRoom.create({
    data: { name: "6A1 (Trung tâm)", gradeLevel: 6, schoolId: mainSchool.id, campusId: campusCenter.id, schoolPointId: spCenter.id, homeroomTeacherId: teacher1.id },
  });
  const class6A2 = await prisma.classRoom.create({
    data: { name: "6A2 (Bản Mó)", gradeLevel: 6, schoolId: mainSchool.id, campusId: campusCenter.id, schoolPointId: spBanMo.id, homeroomTeacherId: teacher2.id },
  });
  const class7A1 = await prisma.classRoom.create({
    data: { name: "7A1 (Bản Pún)", gradeLevel: 7, schoolId: mainSchool.id, campusId: campusSonLam.id, schoolPointId: spBanPun.id, homeroomTeacherId: teacher3.id },
  });

  const group1 = await prisma.group.create({ data: { classId: class6A1.id, name: "Tổ 1" } });
  const group2 = await prisma.group.create({ data: { classId: class6A1.id, name: "Tổ 2" } });
  const group3 = await prisma.group.create({ data: { classId: class6A2.id, name: "Tổ 1" } });

  const students = [];
  const studentData = [
    { userId: studentUsers[0].id, classId: class6A1.id, groupId: group1.id, dob: "2012-05-15", gender: Gender.MALE, fatherName: "Phạm Văn Bình", motherName: "Nguyễn Thị Hạnh", studentCode: "HS2026001" },
    { userId: studentUsers[1].id, classId: class6A1.id, groupId: group1.id, dob: "2012-08-20", gender: Gender.FEMALE, fatherName: "Nguyễn Văn Tùng", motherName: "Trần Thị Lan", studentCode: "HS2026002" },
    { userId: studentUsers[2].id, classId: class6A1.id, groupId: group2.id, dob: "2012-03-10", gender: Gender.MALE, fatherName: "Hoàng Văn Cường", motherName: "Lê Thị Mai", studentCode: "HS2026003" },
    { userId: studentUsers[3].id, classId: class6A1.id, groupId: group2.id, dob: "2012-11-25", gender: Gender.MALE, fatherName: "Trần Văn Đức", motherName: "Phạm Thị Hoa", studentCode: "HS2026004" },
    { userId: studentUsers[4].id, classId: class6A1.id, groupId: group2.id, dob: "2012-07-12", gender: Gender.FEMALE, fatherName: "Lê Văn An", motherName: "Đỗ Thị Hương", studentCode: "HS2026005" },
    { userId: studentUsers[5].id, classId: class6A2.id, groupId: group3.id, dob: "2012-01-05", gender: Gender.MALE, fatherName: "Ngô Văn Hải", motherName: "Vũ Thị Nga", studentCode: "HS2026006" },
    { userId: studentUsers[6].id, classId: class6A2.id, groupId: group3.id, dob: "2012-09-18", gender: Gender.FEMALE, fatherName: "Đỗ Văn Thắng", motherName: "Bùi Thị Liên", studentCode: "HS2026007" },
    { userId: studentUsers[7].id, classId: class6A2.id, groupId: null, dob: "2012-04-22", gender: Gender.MALE, fatherName: "Vũ Văn Minh", motherName: "Đinh Thị Phương", studentCode: "HS2026008" },
    { userId: studentUsers[8].id, classId: class7A1.id, groupId: null, dob: "2011-06-30", gender: Gender.FEMALE, fatherName: "Bùi Văn Tâm", motherName: "Nguyễn Thị Huyền", studentCode: "HS2026009" },
    { userId: studentUsers[9].id, classId: class7A1.id, groupId: null, dob: "2011-12-14", gender: Gender.MALE, fatherName: "Đinh Văn Quang", motherName: "Trần Thị Yến", studentCode: "HS2026010" },
  ];

  for (const sd of studentData) {
    const student = await prisma.student.create({
      data: {
        userId: sd.userId,
        studentCode: sd.studentCode,
        classId: sd.classId,
        groupId: sd.groupId,
        status: StudentStatus.STUDYING,
        dob: new Date(sd.dob),
        gender: sd.gender,
        ethnicity: "Kinh",
        nationality: "Việt Nam",
        addressCurrent: "Nghệ An",
        fatherName: sd.fatherName,
        motherName: sd.motherName,
        parentName: sd.fatherName,
        parentPhone: "0987654321",
      },
    });
    students.push(student);
  }

  // ==================== 4. MODULE I: STRATEGIC QUALITY OBJECTIVES (10 SMART Goals) ====================
  const qualityObjectivesData = [
    {
      code: "MTCL-2026-001",
      title: "Nâng cao Tỷ lệ Học sinh Khá/Giỏi môn Toán toàn trường",
      category: QualityCategory.ACADEMIC,
      metricName: "Tỷ lệ HS xếp loại Khá & Giỏi môn Toán",
      unit: "%",
      baselineValue: 62.5,
      targetValue: 75.0,
      actualValue: 78.5,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2026-12-31"),
      period: ReportingFrequency.SEMESTER,
      responsiblePerson: "ThS. Trịnh Văn Sơn (Phó HT Chuyên môn)",
      dataSource: "Sổ điểm điện tử & Báo cáo Tổng kết HK I",
      reportingFrequency: ReportingFrequency.MONTHLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.EXCEEDED,
      completionRate: 104.7,
      actionPlan: "Tăng cường phụ đạo học sinh yếu kém tại các phân hiệu; tổ chức thi trắc nghiệm định kỳ 2 tuần/lần.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 68.0, target: 80.0, actual: 82.5, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 58.0, target: 70.0, actual: 74.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 55.0, target: 68.0, actual: 70.0, status: "ACHIEVED" },
      ]),
      notes: "Tất cả các phân hiệu đều đạt và vượt chỉ tiêu đề ra.",
    },
    {
      code: "MTCL-2026-002",
      title: "Duy trì Tỷ lệ Chuyên cần Học sinh vùng cao trên 98%",
      category: QualityCategory.ATTENDANCE,
      metricName: "Tỷ lệ điểm danh hiện diện trung bình",
      unit: "%",
      baselineValue: 94.2,
      targetValue: 98.0,
      actualValue: 98.6,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2027-05-31"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "ThS. Nguyễn Thị Thu (Phó HT Cơ sở 2)",
      dataSource: "Hệ thống Điểm danh Smart Attendance",
      reportingFrequency: ReportingFrequency.MONTHLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.EXCEEDED,
      completionRate: 100.6,
      actionPlan: "Phối hợp với chính quyền bản làng vận động học sinh đi học đúng giờ; hỗ trợ suất ăn bán trú.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 97.0, target: 99.0, actual: 99.2, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 93.0, target: 97.5, actual: 98.1, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 91.5, target: 96.5, actual: 97.5, status: "ACHIEVED" },
      ]),
      notes: "Kết quả chuyên cần duy trì xuất sắc suốt mùa mưa lũ.",
    },
    {
      code: "MTCL-2026-003",
      title: "Chuyển đổi số 100% Giáo án và Sổ đầu bài điện tử",
      category: QualityCategory.DIGITAL_TRANSFORMATION,
      metricName: "Tỷ lệ hồ sơ chuyên môn phê duyệt online",
      unit: "%",
      baselineValue: 80.0,
      targetValue: 100.0,
      actualValue: 100.0,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2026-10-31"),
      period: ReportingFrequency.QUARTERLY,
      responsiblePerson: "TS. Nguyễn Văn Hùng (Hiệu trưởng)",
      dataSource: "Modul Quản lý Giáo án & Sổ đầu bài",
      reportingFrequency: ReportingFrequency.MONTHLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.ACHIEVED,
      completionRate: 100.0,
      actionPlan: "Tập huấn 100% giáo viên ký số và nộp giáo án trực tuyến trước Chủ Nhật hàng tuần.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 90.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 75.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 70.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
      ]),
      notes: "Hoàn thành 100% việc số hóa giấy tờ.",
    },
    {
      code: "MTCL-2026-004",
      title: "Nâng Tỷ lệ Học sinh Đạt Tiếng Anh Giao tiếp cơ bản",
      category: QualityCategory.ACADEMIC,
      metricName: "Tỷ lệ HS đạt yêu cầu kiểm tra nói Tiếng Anh",
      unit: "%",
      baselineValue: 50.0,
      targetValue: 70.0,
      actualValue: 66.5,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2027-04-30"),
      period: ReportingFrequency.SEMESTER,
      responsiblePerson: "Cô Phạm Thị Lan (Tổ trưởng Ngoại ngữ)",
      dataSource: "Bảng điểm kiểm tra định kỳ Ngoại ngữ",
      reportingFrequency: ReportingFrequency.MONTHLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.NEAR_TARGET,
      completionRate: 95.0,
      actionPlan: "Thành lập Câu lạc bộ Tiếng Anh cuối tuần; trang bị loa nghe và đĩa CD luyện âm.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 60.0, target: 75.0, actual: 72.0, status: "NEAR_TARGET" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 45.0, target: 65.0, actual: 63.0, status: "NEAR_TARGET" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 40.0, target: 60.0, actual: 58.0, status: "NEAR_TARGET" },
      ]),
      notes: "Cần hỗ trợ thêm môi trường giao tiếp thực tế cho học sinh.",
    },
    {
      code: "MTCL-2026-005",
      title: "Đảm bảo An toàn Trường học & 0% Vi phạm Kỷ luật nghiêm trọng",
      category: QualityCategory.SCHOOL_SAFETY,
      metricName: "Số vụ vi phạm kỷ luật cấp trường",
      unit: "vụ",
      baselineValue: 2.0,
      targetValue: 0.0,
      actualValue: 0.0,
      direction: MeasurementDirection.LOWER_BETTER,
      deadline: new Date("2027-05-31"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "ThS. Trịnh Văn Sơn (Phó HT)",
      dataSource: "Sổ theo dõi Nếp sống & Kỷ luật HS",
      reportingFrequency: ReportingFrequency.MONTHLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.ACHIEVED,
      completionRate: 100.0,
      actionPlan: "Tăng cường công tác tư vấn tâm lý học đường, phối hợp Đoàn thanh niên và Công an xã.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 1.0, target: 0.0, actual: 0.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 1.0, target: 0.0, actual: 0.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 0.0, target: 0.0, actual: 0.0, status: "ACHIEVED" },
      ]),
      notes: "Không ghi nhận vụ vi phạm kỷ luật nặng nào.",
    },
    {
      code: "MTCL-2026-006",
      title: "Tỷ lệ Giáo viên Đạt Chuẩn Chuyên môn Giỏi cấp Trường trên 85%",
      category: QualityCategory.TEACHER_QUALITY,
      metricName: "Tỷ lệ GV đạt Giáo viên Giỏi cấp trường",
      unit: "%",
      baselineValue: 72.0,
      targetValue: 85.0,
      actualValue: 88.0,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2026-11-20"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "TS. Nguyễn Văn Hùng (Hiệu trưởng)",
      dataSource: "Kết quả Hội thi GV Giỏi cấp trường 2026",
      reportingFrequency: ReportingFrequency.QUARTERLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.EXCEEDED,
      completionRate: 103.5,
      actionPlan: "Dự giờ thường xuyên, tổ chức hội thảo chuyên đề phương pháp giảng dạy tích cực.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 80.0, target: 90.0, actual: 92.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 65.0, target: 80.0, actual: 85.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 60.0, target: 75.0, actual: 80.0, status: "ACHIEVED" },
      ]),
      notes: "Chất lượng đội ngũ giáo viên nâng cao rõ rệt.",
    },
    {
      code: "MTCL-2026-007",
      title: "Nâng mức Hài lòng của Phụ huynh đối với Nhà trường lên 95%",
      category: QualityCategory.PARENT_SATISFACTION,
      metricName: "Chỉ số hài lòng Phụ huynh (Parent NPS)",
      unit: "%",
      baselineValue: 88.0,
      targetValue: 95.0,
      actualValue: 96.2,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2027-01-15"),
      period: ReportingFrequency.SEMESTER,
      responsiblePerson: "ThS. Nguyễn Thị Thu (Phó HT)",
      dataSource: "Khảo sát Ý kiến Phụ huynh HK I",
      reportingFrequency: ReportingFrequency.SEMESTER,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.EXCEEDED,
      completionRate: 101.2,
      actionPlan: "Công khai minh bạch các khoản thu bán trú; gửi báo cáo tình hình học tập hàng tuần qua Sổ liên lạc điện tử.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 90.0, target: 96.0, actual: 97.5, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 86.0, target: 94.0, actual: 95.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 84.0, target: 92.0, actual: 94.0, status: "ACHIEVED" },
      ]),
      notes: "Phụ huynh đánh giá cao công tác chăm sóc bán trú.",
    },
    {
      code: "MTCL-2026-008",
      title: "Tỷ lệ Học sinh Hoàn thành Chương trình THCS đạt 100%",
      category: QualityCategory.PROGRAM_COMPLETION,
      metricName: "Tỷ lệ tốt nghiệp THCS",
      unit: "%",
      baselineValue: 98.5,
      targetValue: 100.0,
      actualValue: 99.1,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2027-05-30"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "ThS. Trịnh Văn Sơn (Phó HT)",
      dataSource: "Danh sách xét Tốt nghiệp THCS",
      reportingFrequency: ReportingFrequency.YEARLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.NEAR_TARGET,
      completionRate: 99.1,
      actionPlan: "Lập danh sách học sinh có nguy cơ không đủ điều kiện tốt nghiệp từ tháng 2 để bồi dưỡng riêng.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 100.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 97.5, target: 100.0, actual: 98.5, status: "NEAR_TARGET" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 96.0, target: 100.0, actual: 98.0, status: "NEAR_TARGET" },
      ]),
      notes: "Còn 2 học sinh ở phân hiệu 2 và 3 đang được hỗ trợ đặc biệt.",
    },
    {
      code: "MTCL-2026-009",
      title: "Đạt chuẩn Cơ sở vật chất Tiêu chuẩn Quốc gia Mức độ 1",
      category: QualityCategory.FACILITIES,
      metricName: "Số lượng phòng học bộ môn chuẩn hóa",
      unit: "phòng",
      baselineValue: 4.0,
      targetValue: 6.0,
      actualValue: 5.0,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2026-12-15"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "TS. Nguyễn Văn Hùng (Hiệu trưởng)",
      dataSource: "Biên bản kiểm định CSVC của Sở GD&ĐT",
      reportingFrequency: ReportingFrequency.QUARTERLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.AT_RISK,
      completionRate: 83.3,
      actionPlan: "Đẩy nhanh tiến độ thi công phòng Lab Tin học tại Phân hiệu Sơn Lâm.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 3.0, target: 3.0, actual: 3.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 1.0, target: 2.0, actual: 1.0, status: "AT_RISK" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 0.0, target: 1.0, actual: 1.0, status: "ACHIEVED" },
      ]),
      notes: "Thi công phòng Tin học Phân hiệu 2 chậm tiến độ 3 tuần do nhà thầu.",
    },
    {
      code: "MTCL-2026-010",
      title: "Hỗ trợ 100% Học sinh khó khăn có đủ Đồ dùng & Bán trú",
      category: QualityCategory.SUPPORT_STUDENTS,
      metricName: "Tỷ lệ HS diện chính sách được nhận quà & hỗ trợ",
      unit: "%",
      baselineValue: 90.0,
      targetValue: 100.0,
      actualValue: 100.0,
      direction: MeasurementDirection.HIGHER_BETTER,
      deadline: new Date("2026-09-15"),
      period: ReportingFrequency.YEARLY,
      responsiblePerson: "ThS. Nguyễn Thị Thu (Phó HT)",
      dataSource: "Danh sách phát quà Quỹ Khuyến học & Bán trú",
      reportingFrequency: ReportingFrequency.YEARLY,
      campusScope: "ALL",
      academicYear: "2026-2027",
      status: QualityObjectiveStatus.ACHIEVED,
      completionRate: 100.0,
      actionPlan: "Vận động các nhà tài trợ tài trợ sách vở, chăn ấm và 100% suất ăn bán trú.",
      campusBreakdownJson: JSON.stringify([
        { campusId: campusCenter.id, campusName: "Phân hiệu 1 - Trung Tâm", baseline: 95.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
        { campusId: campusSonLam.id, campusName: "Phân hiệu 2 - Cụm Sơn Lâm", baseline: 88.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
        { campusId: campusKhauCap.id, campusName: "Phân hiệu 3 - Cụm Khâu Cáp", baseline: 85.0, target: 100.0, actual: 100.0, status: "ACHIEVED" },
      ]),
      notes: "Đã trao đầy đủ áo ấm và bộ đồ dùng học tập trước khai giảng.",
    },
  ];

  for (const qo of qualityObjectivesData) {
    await prisma.qualityObjective.create({
      data: {
        code: qo.code,
        title: qo.title,
        category: qo.category,
        metricName: qo.metricName,
        unit: qo.unit,
        baselineValue: qo.baselineValue,
        targetValue: qo.targetValue,
        actualValue: qo.actualValue,
        direction: qo.direction,
        deadline: qo.deadline,
        period: qo.period,
        responsiblePerson: qo.responsiblePerson,
        dataSource: qo.dataSource,
        reportingFrequency: qo.reportingFrequency,
        campusScope: qo.campusScope,
        academicYear: qo.academicYear,
        status: qo.status,
        completionRate: qo.completionRate,
        actionPlan: qo.actionPlan,
        campusBreakdownJson: qo.campusBreakdownJson,
        notes: qo.notes,
        createdById: adminUser.id,
      },
    });
  }

  // ==================== 5. KPI CATALOG, PERIOD & VALUES (20 KPIs) ====================
  const kpiCatalogData = [
    { code: "KPI-001", name: "Tỷ lệ Chuyên cần Học sinh toàn trường", category: KpiCategory.STUDENT, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 10.0, baselineValue: 95.0, targetValue: 98.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-002", name: "Tỷ lệ Học sinh Xếp loại Học lực Khá & Giỏi", category: KpiCategory.EDUCATIONAL_QUALITY, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 12.0, baselineValue: 60.0, targetValue: 75.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-003", name: "Tỷ lệ Giáo án Phê duyệt Đúng hạn", category: KpiCategory.PROFESSIONAL, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 8.0, baselineValue: 85.0, targetValue: 100.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-004", name: "Tỷ lệ Học sinh Đạt Hạnh kiểm Tốt", category: KpiCategory.STUDENT, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 8.0, baselineValue: 88.0, targetValue: 95.0, responsiblePerson: "ThS. Nguyễn Thị Thu" },
    { code: "KPI-005", name: "Tỷ lệ Giáo viên Sử dụng Thiết bị CNTT & Máy chiếu", category: KpiCategory.DIGITAL_TRANSFORMATION, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 6.0, baselineValue: 70.0, targetValue: 90.0, responsiblePerson: "TS. Nguyễn Văn Hùng" },
    { code: "KPI-006", name: "Chỉ số Hài lòng của Phụ huynh (Parent NPS)", category: KpiCategory.SCHOOL_RELATIONS, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 8.0, baselineValue: 85.0, targetValue: 95.0, responsiblePerson: "ThS. Nguyễn Thị Thu" },
    { code: "KPI-007", name: "Số lượng Sáng kiến Kinh nghiệm Cấp Huyện đạt giải", category: KpiCategory.INNOVATION, unit: "SK", direction: MeasurementDirection.HIGHER_BETTER, weight: 5.0, baselineValue: 3.0, targetValue: 5.0, responsiblePerson: "TS. Nguyễn Văn Hùng" },
    { code: "KPI-008", name: "Tỷ lệ Học sinh Yếu kém được Phụ đạo Vượt chuẩn", category: KpiCategory.EDUCATIONAL_QUALITY, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 7.0, baselineValue: 50.0, targetValue: 80.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-009", name: "Tỷ lệ Giải ngân Ngân sách Bán trú Đúng tiến độ", category: KpiCategory.FINANCIAL, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 6.0, baselineValue: 90.0, targetValue: 100.0, responsiblePerson: "TS. Nguyễn Văn Hùng" },
    { code: "KPI-010", name: "Số sự cố An toàn Trường học / Thương tích", category: KpiCategory.SCHOOL_SAFETY, unit: "vụ", direction: MeasurementDirection.LOWER_BETTER, weight: 5.0, baselineValue: 1.0, targetValue: 0.0, responsiblePerson: "ThS. Nguyễn Thị Thu" },
    { code: "KPI-011", name: "Tỷ lệ Cán bộ GV tham gia Đào tạo Bồi dưỡng Chuyên môn", category: KpiCategory.STAFF_PERSONNEL, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 5.0, baselineValue: 80.0, targetValue: 100.0, responsiblePerson: "TS. Nguyễn Văn Hùng" },
    { code: "KPI-012", name: "Tỷ lệ Bảo trì Thiết bị Phòng máy Tin học đúng kỳ", category: KpiCategory.ASSETS, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 4.0, baselineValue: 75.0, targetValue: 95.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-013", name: "Tỷ lệ Học sinh Thi Học sinh giỏi Cấp Huyện Đạt giải", category: KpiCategory.EDUCATIONAL_QUALITY, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 6.0, baselineValue: 40.0, targetValue: 60.0, responsiblePerson: "ThS. Trịnh Văn Sơn" },
    { code: "KPI-014", name: "Tỷ lệ Điểm trường Lẻ có Nguồn nước sạch & Vệ sinh Chuẩn", category: KpiCategory.FACILITIES, unit: "%", direction: MeasurementDirection.HIGHER_BETTER, weight: 5.0, baselineValue: 75.0, targetValue: 100.0, responsiblePerson: "ThS. Nguyễn Thị Thu" },
    { code: "KPI-015", name: "Thời gian Phản hồi Ý kiến Phụ huynh Trung bình", category: KpiCategory.SCHOOL_RELATIONS, unit: "giờ", direction: MeasurementDirection.LOWER_BETTER, weight: 3.0, baselineValue: 24.0, targetValue: 12.0, responsiblePerson: "ThS. Nguyễn Thị Thu" },
  ];

  const createdKpis = [];
  for (const kpiData of kpiCatalogData) {
    const kpi = await prisma.kpiCatalog.create({
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
    createdKpis.push(kpi);
  }

  // Create KpiPeriod (Học kỳ I Năm học 2026-2027)
  const kpiPeriod1 = await prisma.kpiPeriod.create({
    data: {
      title: "KPI Học kỳ I - Năm học 2026-2027",
      year: 2026,
      periodType: ReportingFrequency.SEMESTER,
      status: KpiPeriodStatus.APPROVED,
      overallScore: 94.5,
      createdById: adminUser.id,
    },
  });

  // Create KpiTargets and KpiValues for Period
  for (const kpi of createdKpis) {
    await prisma.kpiTarget.create({
      data: {
        periodId: kpiPeriod1.id,
        kpiId: kpi.id,
        targetValue: kpi.targetValue || 100.0,
        weight: kpi.weight,
      },
    });

    const isExceeded = kpi.code === "KPI-001" || kpi.code === "KPI-003" || kpi.code === "KPI-006";
    const actual = isExceeded
      ? (kpi.targetValue || 100) * 1.05
      : (kpi.targetValue || 100) * 0.96;
    const rate = Math.min(110, Math.round((actual / (kpi.targetValue || 100)) * 1000) / 10);
    const score = Math.round(((rate * kpi.weight) / 100) * 100) / 100;

    await prisma.kpiValue.create({
      data: {
        periodId: kpiPeriod1.id,
        kpiId: kpi.id,
        actualValue: Math.round(actual * 10) / 10,
        completionRate: rate,
        weightedScore: score,
        notes: "Dữ liệu được thẩm định bởi Hội đồng Tự đánh giá nhà trường.",
        createdById: adminUser.id,
      },
    });
  }

  // ==================== 6. APPROVAL WORKFLOWS & COMMENTS (Quy trình 6 bước & Khóa dữ liệu) ====================
  const workflowsData = [
    {
      moduleName: "QUALITY_OBJECTIVE",
      recordId: "MTCL-2026-001",
      title: "Mục tiêu Chất lượng: Nâng cao Tỷ lệ Khá/Giỏi môn Toán HK I",
      currentStep: 6,
      currentStatus: "LOCKED",
      isLocked: true,
      lockedAt: new Date("2026-09-15"),
      submittedByName: "ThS. Trịnh Văn Sơn",
      reviewedByName: "ThS. Nguyễn Thị Thu",
      approvedByName: "TS. Nguyễn Văn Hùng",
    },
    {
      moduleName: "QUALITY_OBJECTIVE",
      recordId: "MTCL-2026-003",
      title: "Mục tiêu Chất lượng: Chuyển đổi số 100% Hồ sơ Chuyên môn",
      currentStep: 5,
      currentStatus: "PRINCIPAL_APPROVED",
      isLocked: false,
      submittedByName: "ThS. Trịnh Văn Sơn",
      reviewedByName: "ThS. Nguyễn Thị Thu",
      approvedByName: "TS. Nguyễn Văn Hùng",
    },
    {
      moduleName: "STRATEGY_KPI",
      recordId: kpiPeriod1.id,
      title: "Bộ Chỉ số KPI Toàn trường Học kỳ I Năm học 2026-2027",
      currentStep: 6,
      currentStatus: "LOCKED",
      isLocked: true,
      lockedAt: new Date("2026-09-20"),
      submittedByName: "ThS. Trịnh Văn Sơn",
      reviewedByName: "ThS. Nguyễn Thị Thu",
      approvedByName: "TS. Nguyễn Văn Hùng",
    },
    {
      moduleName: "QUALITY_OBJECTIVE",
      recordId: "MTCL-2026-009",
      title: "Mục tiêu CSVC: Nâng cấp Phòng máy Tin học Phân hiệu Sơn Lâm",
      currentStep: 3,
      currentStatus: "CAMPUS_CONFIRMED",
      isLocked: false,
      submittedByName: "ThS. Trịnh Văn Sơn",
      reviewedByName: "ThS. Nguyễn Thị Thu",
    },
  ];

  for (const wfData of workflowsData) {
    const wf = await prisma.approvalWorkflow.create({
      data: {
        schoolId: mainSchool.id,
        moduleName: wfData.moduleName,
        recordId: wfData.recordId,
        title: wfData.title,
        currentStep: wfData.currentStep,
        currentStatus: wfData.currentStatus,
        isLocked: wfData.isLocked,
        lockedAt: wfData.lockedAt,
        submittedByName: wfData.submittedByName,
        submittedAt: new Date("2026-09-05"),
        reviewedByName: wfData.reviewedByName,
        reviewedAt: new Date("2026-09-10"),
        approvedByName: wfData.approvedByName,
        approvedAt: wfData.approvedByName ? new Date("2026-09-15") : null,
      },
    });

    // Approval Comments
    await prisma.approvalComment.createMany({
      data: [
        {
          workflowId: wf.id,
          userName: wfData.submittedByName,
          userRole: "VICE_PRINCIPAL",
          commentType: "APPROVE",
          commentContent: "Đã hoàn thành rà soát số liệu thực tế tại các phân hiệu và trình duyệt.",
        },
        {
          workflowId: wf.id,
          userName: "TS. Nguyễn Văn Hùng",
          userRole: "ADMIN",
          commentType: "APPROVE",
          commentContent: "Phê duyệt kế hoạch và yêu cầu tiến hành khóa dữ liệu theo quy định.",
        },
      ],
    });
  }

  // ==================== 7. SYSTEM EVIDENCE FILES & AUDIT LOGS ====================
  const evidencesData = [
    {
      fileName: "Quyet_dinh_Giao_Chieu_tieu_KPI_2026_2027.pdf",
      fileType: "pdf",
      fileSize: 2450000,
      fileUrl: "/evidences/Quyet_dinh_Giao_Chieu_tieu_KPI_2026_2027.pdf",
      uploadedByName: "TS. Nguyễn Văn Hùng",
      relatedModule: "STRATEGY_KPI",
      relatedRecordId: kpiPeriod1.id,
      relatedContent: "Quyết định giao chỉ tiêu KPI toàn trường năm học 2026-2027",
      description: "Quyết định chính thức có dấu đỏ của Hiệu trưởng và Hội đồng Trường.",
      version: 1,
    },
    {
      fileName: "Bao_cao_Tong_ket_Chat_luong_Giao_duc_HK1.docx",
      fileType: "docx",
      fileSize: 1850000,
      fileUrl: "/evidences/Bao_cao_Tong_ket_Chat_luong_Giao_duc_HK1.docx",
      uploadedByName: "ThS. Trịnh Văn Sơn",
      relatedModule: "QUALITY_OBJECTIVE",
      relatedRecordId: "MTCL-2026-001",
      relatedContent: "Báo cáo tổng kết chất lượng giáo dục Học kỳ I",
      description: "Báo cáo số liệu chi tiết kèm phân tích biểu đồ 3 phân hiệu.",
      version: 2,
    },
    {
      fileName: "Bien_ban_Kiem_dinh_CSVC_Phong_Tin_Hoc.pdf",
      fileType: "pdf",
      fileSize: 3120000,
      fileUrl: "/evidences/Bien_ban_Kiem_dinh_CSVC_Phong_Tin_Hoc.pdf",
      uploadedByName: "ThS. Nguyễn Thị Thu",
      relatedModule: "QUALITY_OBJECTIVE",
      relatedRecordId: "MTCL-2026-009",
      relatedContent: "Biên bản thẩm định trang thiết bị phòng máy Tin học",
      description: "Biên bản bàn giao thiết bị phòng máy 20 máy tính mới.",
      version: 1,
    },
  ];

  for (const evData of evidencesData) {
    const file = await prisma.systemEvidenceFile.create({
      data: {
        fileName: evData.fileName,
        fileType: evData.fileType,
        fileSize: evData.fileSize,
        fileUrl: evData.fileUrl,
        uploadedByName: evData.uploadedByName,
        relatedModule: evData.relatedModule,
        relatedRecordId: evData.relatedRecordId,
        relatedContent: evData.relatedContent,
        description: evData.description,
        version: evData.version,
        status: "ACTIVE",
      },
    });

    await prisma.fileAuditLog.create({
      data: {
        fileId: file.id,
        action: "UPLOAD",
        performedByName: evData.uploadedByName,
        detail: `Đã tải lên tệp minh chứng phiên bản v${evData.version} thành công.`,
      },
    });
  }

  // ==================== 8. LESSON PLANS, JOURNALS & NOTIFICATIONS ====================
  await prisma.lessonPlan.createMany({
    data: [
      {
        teacherId: teacher1.id,
        subjectId: mathSubject.id,
        classId: class6A1.id,
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
      {
        teacherId: teacher3.id,
        subjectId: literatureSubject.id,
        classId: class7A1.id,
        weekNumber: 1,
        periodStart: 1,
        periodEnd: 2,
        title: "Cổng trường mở ra",
        objectives: "Cảm nhận tâm trạng người mẹ trong đêm trước ngày khai trường.",
        content: "Phân tích văn bản",
        activities: "Đọc diễn cảm + Phân tích nhóm",
        materials: "SGK Ngữ văn 7",
        status: LessonPlanStatus.APPROVED,
        reviewNote: "Đạt yêu cầu.",
        reviewedBy: "ThS. Trịnh Văn Sơn",
        reviewedAt: new Date("2026-09-02"),
      },
    ],
  });

  const journalDate1 = new Date();
  journalDate1.setDate(journalDate1.getDate() - 1);

  await prisma.classJournalEntry.createMany({
    data: [
      {
        classId: class6A1.id,
        subjectId: mathSubject.id,
        teacherId: teacher1.id,
        date: journalDate1,
        dayOfWeek: 2,
        period: 1,
        lessonTitle: "Tập hợp và phần tử",
        content: "Đã dạy xong lý thuyết và bài tập 1, 2.",
        absentees: "Không có",
        notes: "Lớp học nghiêm túc, phát biểu sôi nổi.",
        isConfirmed: true,
        confirmedAt: journalDate1,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        senderId: adminUser.id,
        receiverId: teacherUser1.id,
        title: "Triển khai Kiểm kê Mục tiêu Chất lượng HK I",
        content: "Đề nghị giáo viên chủ nhiệm và tổ trưởng chuyên môn hoàn thiện hồ sơ minh chứng trước ngày 30.",
      },
      {
        senderId: adminUser.id,
        receiverId: vpUser1.id,
        title: "Họp Giao ban Ban Giám hiệu Mới",
        content: "Kính mời Thầy Sơn tham dự họp giao ban công tác Quản trị chiến lược tuần tới.",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("📧 Demo Accounts & Credentials:");
  console.log("   👑 Hiệu trưởng (Admin):      admin@school.com   / 123456");
  console.log("   👔 Phó HT Phân hiệu 1:       vp1@school.com     / 123456");
  console.log("   👔 Phó HT Phân hiệu 2:       vp2@school.com     / 123456");
  console.log("   👩🏫 Giáo viên Chuyên môn:    teacher@school.com / 123456");
  console.log("   👨🎓 Học sinh:                 student@school.com / 123456");
  console.log(`📊 Total Seeded: 1 Trường, 3 Phân hiệu, 4 Điểm trường, 10 Mục tiêu chất lượng SMART, 15 KPIs, 4 Quy trình phê duyệt & khóa dữ liệu, 3 Tệp minh chứng.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
