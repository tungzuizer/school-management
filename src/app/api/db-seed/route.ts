import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role, Gender, AttendanceStatus, GradeType, StudentStatus, LessonPlanStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Keep it protected by a simple query key so it cannot be reached by public callers
  if (secret !== "seed123") {
    return NextResponse.json(
      { error: "Không có quyền thực hiện. Vui lòng cung cấp secret chính xác (VD: ?secret=seed123)" },
      { status: 403 }
    );
  }

  try {
    const hashedPassword = await bcrypt.hash("123456", 10);

    // ===== CLEAN EXISTING DATA =====
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
    await prisma.campus.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.school.deleteMany();
    await prisma.user.deleteMany();

    // ===== USERS =====
    const adminUser = await prisma.user.create({
      data: { name: "Nguyễn Văn Admin", email: "admin@school.com", password: hashedPassword, role: Role.ADMIN },
    });

    const teacherUser1 = await prisma.user.create({
      data: { name: "Trần Thị Hoa", email: "teacher@school.com", password: hashedPassword, role: Role.TEACHER },
    });

    const teacherUser2 = await prisma.user.create({
      data: { name: "Lê Văn Minh", email: "teacher2@school.com", password: hashedPassword, role: Role.TEACHER },
    });

    const teacherUser3 = await prisma.user.create({
      data: { name: "Phạm Thị Lan", email: "teacher3@school.com", password: hashedPassword, role: Role.TEACHER },
    });

    const studentUsers = [];
    const studentNames = [
      "Phạm Quang Huy",
      "Nguyễn Thị Mai",
      "Hoàng Đức Anh",
      "Trần Văn Bình",
      "Lê Thị Cúc",
      "Ngô Văn Dũng",
      "Đỗ Thị Hằng",
      "Vũ Minh Tuấn",
      "Bùi Thị Ngọc",
      "Đinh Văn Long",
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

    // ===== SCHOOLS =====
    const school1 = await prisma.school.create({
      data: {
        name: "Trường THCS Nguyễn Huệ",
        address: "123 Trần Phú, Hà Đông, Hà Nội",
        phone: "024-3123-4567",
        email: "thcs.nguyenhue@edu.vn",
      },
    });

    const school2 = await prisma.school.create({
      data: {
        name: "Trường THCS Lê Quý Đôn",
        address: "456 Nguyễn Trãi, Thanh Xuân, Hà Nội",
        phone: "024-3234-5678",
        email: "thcs.lequydon@edu.vn",
      },
    });

    // ===== CAMPUSES (Phân hiệu) =====
    const campus1 = await prisma.campus.create({
      data: { schoolId: school1.id, name: "Phân hiệu 1 - Trần Phú", address: "123 Trần Phú, Hà Đông" },
    });

    const campus2 = await prisma.campus.create({
      data: { schoolId: school1.id, name: "Phân hiệu 2 - Quang Trung", address: "45 Quang Trung, Hà Đông" },
    });

    // ===== SUBJECTS =====
    const mathSubject = await prisma.subject.create({ data: { name: "Toán", gradeLevel: 6 } });
    const physicsSubject = await prisma.subject.create({ data: { name: "Vật Lý", gradeLevel: 6 } });
    const literatureSubject = await prisma.subject.create({ data: { name: "Ngữ Văn", gradeLevel: 6 } });
    const englishSubject = await prisma.subject.create({ data: { name: "Tiếng Anh", gradeLevel: 6 } });
    const historySubject = await prisma.subject.create({ data: { name: "Lịch Sử", gradeLevel: 6 } });
    const biologySubject = await prisma.subject.create({ data: { name: "Sinh Học", gradeLevel: 6 } });

    // ===== TEACHERS =====
    const teacher1 = await prisma.teacher.create({
      data: { userId: teacherUser1.id, specialty: "Toán học", phone: "0901234567", degree: "Thạc sĩ" },
    });

    const teacher2 = await prisma.teacher.create({
      data: { userId: teacherUser2.id, specialty: "Vật Lý", phone: "0912345678", degree: "Cử nhân" },
    });

    const teacher3 = await prisma.teacher.create({
      data: { userId: teacherUser3.id, specialty: "Ngữ Văn", phone: "0923456789", degree: "Thạc sĩ" },
    });

    // ===== CLASSROOMS =====
    const class6A1 = await prisma.classRoom.create({
      data: { name: "6A1", gradeLevel: 6, schoolId: school1.id, campusId: campus1.id, homeroomTeacherId: teacher1.id },
    });

    const class6A2 = await prisma.classRoom.create({
      data: { name: "6A2", gradeLevel: 6, schoolId: school1.id, campusId: campus1.id, homeroomTeacherId: teacher2.id },
    });

    const class7A1 = await prisma.classRoom.create({
      data: { name: "7A1", gradeLevel: 7, schoolId: school1.id, campusId: campus2.id, homeroomTeacherId: teacher3.id },
    });

    // ===== GROUPS (Tổ trong lớp) =====
    const group1 = await prisma.group.create({ data: { classId: class6A1.id, name: "Tổ 1" } });
    const group2 = await prisma.group.create({ data: { classId: class6A1.id, name: "Tổ 2" } });
    const group3 = await prisma.group.create({ data: { classId: class6A2.id, name: "Tổ 1" } });

    // ===== STUDENTS =====
    const students = [];
    const studentData = [
      { userId: studentUsers[0].id, classId: class6A1.id, groupId: group1.id, dob: "2012-05-15", gender: Gender.MALE, fatherName: "Phạm Văn Bình", motherName: "Nguyễn Thị Hạnh", studentCode: "HS2024001" },
      { userId: studentUsers[1].id, classId: class6A1.id, groupId: group1.id, dob: "2012-08-20", gender: Gender.FEMALE, fatherName: "Nguyễn Văn Tùng", motherName: "Trần Thị Lan", studentCode: "HS2024002" },
      { userId: studentUsers[2].id, classId: class6A1.id, groupId: group2.id, dob: "2012-03-10", gender: Gender.MALE, fatherName: "Hoàng Văn Cường", motherName: "Lê Thị Mai", studentCode: "HS2024003" },
      { userId: studentUsers[3].id, classId: class6A1.id, groupId: group2.id, dob: "2012-11-25", gender: Gender.MALE, fatherName: "Trần Văn Đức", motherName: "Phạm Thị Hoa", studentCode: "HS2024004" },
      { userId: studentUsers[4].id, classId: class6A1.id, groupId: group2.id, dob: "2012-07-12", gender: Gender.FEMALE, fatherName: "Lê Văn An", motherName: "Đỗ Thị Hương", studentCode: "HS2024005" },
      { userId: studentUsers[5].id, classId: class6A2.id, groupId: group3.id, dob: "2012-01-05", gender: Gender.MALE, fatherName: "Ngô Văn Hải", motherName: "Vũ Thị Nga", studentCode: "HS2024006" },
      { userId: studentUsers[6].id, classId: class6A2.id, groupId: group3.id, dob: "2012-09-18", gender: Gender.FEMALE, fatherName: "Đỗ Văn Thắng", motherName: "Bùi Thị Liên", studentCode: "HS2024007" },
      { userId: studentUsers[7].id, classId: class6A2.id, groupId: null, dob: "2012-04-22", gender: Gender.MALE, fatherName: "Vũ Văn Minh", motherName: "Đinh Thị Phương", studentCode: "HS2024008" },
      { userId: studentUsers[8].id, classId: class7A1.id, groupId: null, dob: "2011-06-30", gender: Gender.FEMALE, fatherName: "Bùi Văn Tâm", motherName: "Nguyễn Thị Huyền", studentCode: "HS2024009" },
      { userId: studentUsers[9].id, classId: class7A1.id, groupId: null, dob: "2011-12-14", gender: Gender.MALE, fatherName: "Đinh Văn Quang", motherName: "Trần Thị Yến", studentCode: "HS2024010" },
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
          addressCurrent: "Hà Nội",
          fatherName: sd.fatherName,
          fatherJob: "Nhân viên",
          motherName: sd.motherName,
          motherJob: "Nhân viên",
          parentName: sd.fatherName,
          parentPhone: `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        },
      });
      students.push(student);
    }

    // ===== TEACHING ASSIGNMENTS =====
    await prisma.teachingAssignment.createMany({
      data: [
        { teacherId: teacher1.id, subjectId: mathSubject.id, classId: class6A1.id },
        { teacherId: teacher1.id, subjectId: mathSubject.id, classId: class6A2.id },
        { teacherId: teacher2.id, subjectId: physicsSubject.id, classId: class6A1.id },
        { teacherId: teacher2.id, subjectId: physicsSubject.id, classId: class6A2.id },
        { teacherId: teacher3.id, subjectId: literatureSubject.id, classId: class7A1.id },
      ],
    });

    // ===== CURRICULUM =====
    await prisma.curriculum.createMany({
      data: [
        { subjectId: mathSubject.id, title: "Chương 1: Số tự nhiên", content: "Nội dung về số tự nhiên, phép tính cơ bản." },
        { subjectId: mathSubject.id, title: "Chương 2: Số nguyên", content: "Số nguyên âm, phép tính trên số nguyên." },
        { subjectId: physicsSubject.id, title: "Chương 1: Cơ học", content: "Đo độ dài, đo thể tích, đo khối lượng." },
        { subjectId: literatureSubject.id, title: "Chương 1: Truyện và ký", content: "Các tác phẩm truyện ngắn, bút ký." },
      ],
    });

    // ===== SCHEDULE =====
    await prisma.schedule.createMany({
      data: [
        { classId: class6A1.id, subjectId: mathSubject.id, teacherId: teacher1.id, dayOfWeek: 2, period: 1, room: "P201" },
        { classId: class6A1.id, subjectId: mathSubject.id, teacherId: teacher1.id, dayOfWeek: 4, period: 2, room: "P201" },
        { classId: class6A1.id, subjectId: physicsSubject.id, teacherId: teacher2.id, dayOfWeek: 3, period: 3, room: "P202" },
        { classId: class6A2.id, subjectId: mathSubject.id, teacherId: teacher1.id, dayOfWeek: 3, period: 1, room: "P203" },
        { classId: class6A2.id, subjectId: physicsSubject.id, teacherId: teacher2.id, dayOfWeek: 5, period: 2, room: "P203" },
        { classId: class7A1.id, subjectId: literatureSubject.id, teacherId: teacher3.id, dayOfWeek: 2, period: 3, room: "P301" },
      ],
    });

    // ===== ATTENDANCE =====
    const today = new Date();
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const s of students) {
        const isAbsent = i === 3 && s.id === students[0].id;
        const isLate = i === 2 && s.id === students[1].id;
        await prisma.attendance.create({
          data: {
            studentId: s.id,
            classId: s.classId!,
            date,
            period: 1,
            status: isAbsent ? AttendanceStatus.ABSENT_UNEXCUSED : isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
            note: isAbsent ? "Ốm" : isLate ? "Đi muộn 10 phút" : null,
          },
        });
      }
    }

    // ===== GRADES =====
    const gradeData = [
      { studentId: students[0].id, subjectId: mathSubject.id, term: 1, type: GradeType.ORAL, score: 8.0 },
      { studentId: students[0].id, subjectId: mathSubject.id, term: 1, type: GradeType.FIFTEEN_MIN, score: 7.5 },
      { studentId: students[0].id, subjectId: mathSubject.id, term: 1, type: GradeType.MIDTERM, score: 8.5 },
      { studentId: students[0].id, subjectId: mathSubject.id, term: 1, type: GradeType.FINAL, score: 9.0 },
      { studentId: students[1].id, subjectId: mathSubject.id, term: 1, type: GradeType.ORAL, score: 9.0 },
      { studentId: students[1].id, subjectId: mathSubject.id, term: 1, type: GradeType.FIFTEEN_MIN, score: 8.0 },
      { studentId: students[1].id, subjectId: mathSubject.id, term: 1, type: GradeType.MIDTERM, score: 9.5 },
      { studentId: students[1].id, subjectId: mathSubject.id, term: 1, type: GradeType.FINAL, score: 9.0 },
      { studentId: students[5].id, subjectId: physicsSubject.id, term: 1, type: GradeType.ORAL, score: 7.0 },
      { studentId: students[5].id, subjectId: physicsSubject.id, term: 1, type: GradeType.FIFTEEN_MIN, score: 6.5 },
      { studentId: students[5].id, subjectId: physicsSubject.id, term: 1, type: GradeType.MIDTERM, score: 7.5 },
      { studentId: students[5].id, subjectId: physicsSubject.id, term: 1, type: GradeType.FINAL, score: 8.0 },
    ];
    await prisma.grade.createMany({ data: gradeData });

    // ===== LESSON PLANS =====
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
          objectives: "Học sinh hiểu được khái niệm tập hợp, phần tử của tập hợp. Biết viết tập hợp bằng cách liệt kê và chỉ ra tính chất đặc trưng.",
          content: "1. Khái niệm tập hợp\n2. Cách viết tập hợp\n3. Phần tử thuộc / không thuộc tập hợp",
          activities: "- Giới thiệu bài mới (5 phút)\n- Giảng lý thuyết (15 phút)\n- Bài tập nhóm (15 phút)\n- Tổng kết (10 phút)",
          materials: "SGK Toán 6, bảng phụ, phiếu bài tập",
          assessment: "Bài tập trắc nghiệm cuối giờ",
          status: LessonPlanStatus.APPROVED,
          reviewNote: "Giáo án đầy đủ, rõ ràng.",
        },
        {
          teacherId: teacher1.id,
          subjectId: mathSubject.id,
          classId: class6A1.id,
          weekNumber: 2,
          periodStart: 1,
          periodEnd: 2,
          title: "Số tự nhiên - Phép cộng và phép trừ",
          objectives: "Học sinh thực hiện được phép cộng, phép trừ số tự nhiên. Vận dụng tính chất giao hoán, kết hợp.",
          content: "1. Phép cộng số tự nhiên\n2. Tính chất giao hoán, kết hợp\n3. Phép trừ số tự nhiên",
          activities: "- Kiểm tra bài cũ (5 phút)\n- Bài mới (25 phút)\n- Luyện tập (15 phút)",
          materials: "SGK Toán 6, máy chiếu",
          status: LessonPlanStatus.SUBMITTED,
        },
        {
          teacherId: teacher2.id,
          subjectId: physicsSubject.id,
          classId: class6A1.id,
          weekNumber: 1,
          periodStart: 3,
          periodEnd: 4,
          title: "Đo độ dài",
          objectives: "Học sinh biết cách đo độ dài bằng thước, ước lượng độ dài trước khi đo.",
          content: "1. Đơn vị đo độ dài\n2. Dụng cụ đo\n3. Cách đo độ dài",
          activities: "- Thí nghiệm đo độ dài các vật (20 phút)\n- Ghi kết quả và thảo luận (15 phút)\n- Bài tập (10 phút)",
          materials: "Thước kẻ, thước dây, các vật mẫu",
          status: LessonPlanStatus.DRAFT,
        },
        {
          teacherId: teacher3.id,
          subjectId: literatureSubject.id,
          classId: class7A1.id,
          weekNumber: 1,
          periodStart: 1,
          periodEnd: 2,
          title: "Cổng trường mở ra",
          objectives: "Cảm nhận tâm trạng người mẹ trong đêm trước ngày khai trường đầu tiên của con.",
          content: "1. Đọc hiểu văn bản\n2. Phân tích tâm trạng nhân vật\n3. Ý nghĩa văn bản",
          activities: "- Đọc diễn cảm (10 phút)\n- Phân tích nhóm (20 phút)\n- Trình bày và nhận xét (15 phút)",
          materials: "SGK Ngữ văn 7, tranh minh họa",
          status: LessonPlanStatus.APPROVED,
          reviewNote: "Tốt, cần bổ sung thêm câu hỏi mở rộng.",
        },
      ],
    });

    // ===== JOURNAL ENTRIES =====
    const journalDate1 = new Date(today);
    journalDate1.setDate(today.getDate() - 1);
    if (journalDate1.getDay() === 0) journalDate1.setDate(journalDate1.getDate() - 2);
    if (journalDate1.getDay() === 6) journalDate1.setDate(journalDate1.getDate() - 1);

    const journalDate2 = new Date(journalDate1);
    journalDate2.setDate(journalDate1.getDate() - 1);
    if (journalDate2.getDay() === 0) journalDate2.setDate(journalDate2.getDate() - 2);
    if (journalDate2.getDay() === 6) journalDate2.setDate(journalDate2.getDate() - 1);

    await prisma.classJournalEntry.createMany({
      data: [
        {
          classId: class6A1.id,
          subjectId: mathSubject.id,
          teacherId: teacher1.id,
          date: journalDate1,
          dayOfWeek: journalDate1.getDay() === 0 ? 8 : journalDate1.getDay() + 1,
          period: 1,
          lessonTitle: "Số tự nhiên - Tập hợp và phần tử",
          content: "Đã dạy xong phần 1 và 2. Học sinh nắm bài tốt.",
          absentees: "Không có học sinh vắng",
          notes: "Lớp học nghiêm túc, tích cực phát biểu.",
          isConfirmed: true,
          confirmedAt: journalDate1,
        },
        {
          classId: class6A1.id,
          subjectId: physicsSubject.id,
          teacherId: teacher2.id,
          date: journalDate1,
          dayOfWeek: journalDate1.getDay() === 0 ? 8 : journalDate1.getDay() + 1,
          period: 3,
          lessonTitle: "Đo độ dài - Thực hành",
          content: "Thực hành đo độ dài các vật trong phòng thí nghiệm.",
          absentees: "Phạm Quang Huy (ốm)",
          notes: "Cần nhắc nhở tổ 2 giữ trật tự khi thực hành.",
          isConfirmed: false,
        },
        {
          classId: class6A2.id,
          subjectId: mathSubject.id,
          teacherId: teacher1.id,
          date: journalDate2,
          dayOfWeek: journalDate2.getDay() === 0 ? 8 : journalDate2.getDay() + 1,
          period: 1,
          lessonTitle: "Phép cộng và phép trừ số tự nhiên",
          content: "Ôn tập phép cộng, trừ. Làm bài tập SGK trang 15-16.",
          absentees: "Không có học sinh vắng",
          notes: "Lớp tiếp thu bài tốt.",
          isConfirmed: true,
          confirmedAt: journalDate2,
        },
        {
          classId: class7A1.id,
          subjectId: literatureSubject.id,
          teacherId: teacher3.id,
          date: journalDate1,
          dayOfWeek: journalDate1.getDay() === 0 ? 8 : journalDate1.getDay() + 1,
          period: 3,
          lessonTitle: "Cổng trường mở ra - Phân tích",
          content: "Phân tích tâm trạng người mẹ. Thảo luận nhóm về ý nghĩa bài học.",
          absentees: "Đinh Văn Long (phép)",
          notes: "Học sinh hào hứng thảo luận, nhiều ý kiến hay.",
          isConfirmed: true,
          confirmedAt: journalDate1,
        },
      ],
    });

    // ===== NOTIFICATIONS =====
    await prisma.notification.create({
      data: {
        senderId: adminUser.id,
        receiverId: teacherUser1.id,
        title: "Họp hội đồng sư phạm",
        content: "Kính mời các thầy cô tham dự họp hội đồng sư phạm vào thứ 6 tuần này lúc 14h00 tại phòng họp A.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã nạp thành công bộ dữ liệu mẫu tiếng Việt vào database!",
      accounts: {
        admin: "admin@school.com / 123456",
        teacher: "teacher@school.com / 123456",
        student: "student@school.com / 123456",
      },
    });
  } catch (error: any) {
    console.error("Lỗi khi seed database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
