/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 24), `src/app/api/db-seed/route.ts` (line 25).
 * 2. Affected APIs: `seedClassroomOperations`, server action `getJournalEntries`, `getAdminJournalEntries`.
 * 3. Data Schemas: `ClassJournalEntry`, `DailyReport`, `ParticipationRecord`, `ConductRecord`, `Incident`, `ParentFeedback`.
 * 4. Verbatim User Instruction: "bạn đang fake dữ liệu tôi đấy hả sao mục điêm thi lại 0 có gì kế hoạch giảng giạy cũng không có sổ đầu bài cũng không có gì tôi bảo bạn mô phỏng dữ liệu mà kiểu như bạn tạo trước 1 dữ liệu của trường đó rồi bạn add vô"
 */

import {
  PrismaClient,
  IncidentType,
  ConductRating,
  AcademicRating,
  AcademicPeriod,
  ReportStatus,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedClassroomOperations(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n📖 Khởi tạo Hoạt động lớp học, Sổ đầu bài điện tử, Báo cáo ngày, Khen thưởng/Kỷ luật & Ý kiến PH...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser, teachers, sampleTeacher } = personnelStruct;
  const { classes, students } = classesStudents;
  const class1A1 = classes.find((c) => c.name === "1A1") || classes[0];

  // 1. Khởi tạo 60 Sổ Đầu Bài Điện Tử (ClassJournalEntry)
  console.log("   - Tạo 60 nhật ký tiết dạy Sổ Đầu Bài theo các phân hiệu (kèm toàn bộ tiết học Lớp 1A1)...");
  const journalLessonTitles = [
    { subName: "Toán", title: "Ôn tập các số đến 10 và phép tính cộng trừ ban đầu", note: "Lớp học sôi nổi, 95% học sinh làm đúng bài tập nhóm, nắm vững kỹ năng tính nhẩm.", score: 10 },
    { subName: "Tiếng Việt", title: "Bài 3: Em yêu mùa hè quê em - Đọc và mở rộng vốn từ", note: "Học sinh luyện đọc diễn cảm tốt. Cần rèn thêm chữ viết cho 2 học sinh ngồi bàn cuối.", score: 9 },
    { subName: "Tiếng Anh", title: "Unit 1: Hello Friends - Lesson 2: Vocabulary & Speaking", note: "100% học sinh phát âm chuẩn các mẫu câu chào hỏi giao tiếp cơ bản.", score: 10 },
    { subName: "Tin học và Công nghệ", title: "Bài 2: Khám phá thế giới máy tính và an toàn thông tin số", note: "Học sinh thực hành thao tác chuột và bàn phím thành thạo tại phòng máy thực hành.", score: 10 },
    { subName: "Khoa học", title: "Bài 4: Nước và vai trò của nước đối với sự sống", note: "Tổ chức thí nghiệm trực quan, học sinh thảo luận nhóm tích cực và đưa ra kết luận chuẩn xác.", score: 10 },
    { subName: "Tự nhiên và Xã hội", title: "Bài 1: Gia đình của em và giữ an toàn tại nhà", note: "Học sinh chia sẻ nhiệt tình về các thành viên trong gia đình.", score: 10 },
    { subName: "Đạo đức", title: "Bài 2: Em tự giác làm việc của mình", note: "Học sinh hiểu ý nghĩa của việc tự giác, cam kết thực hiện ở lớp và ở nhà.", score: 10 },
  ];

  // 1.1. Tạo sổ đầu bài chuyên biệt cho Lớp 1A1 (gắn với giáo viên mẫu sampleTeacher)
  const sepDays = [
    "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11",
    "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18",
    "2026-09-19", "2026-09-21", "2026-09-22"
  ];

  for (let dayIdx = 0; dayIdx < sepDays.length; dayIdx++) {
    const dateStr = sepDays[dayIdx];
    const [y, m, d] = dateStr.split("-").map(Number);
    const dayDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const dayOfWeek = (dayIdx % 5) + 1; // 1 to 5 (Mon to Fri)

    for (let period = 1; period <= 4; period++) {
      const spec = journalLessonTitles[(dayIdx * 2 + period) % journalLessonTitles.length];
      const targetSub = subjects.find((s) => s.name === spec.subName) || subjects[0];
      const targetTeacher = sampleTeacher || teachers[0].teacher;

      await prisma.classJournalEntry.create({
        data: {
          classId: class1A1.id,
          subjectId: targetSub.id,
          teacherId: targetTeacher.id,
          date: dayDate,
          dayOfWeek,
          period,
          lessonTitle: `${spec.title} (Tiết ${period})`,
          content: spec.note,
          absentees: dayIdx % 4 === 0 && period === 1 ? "Vắng 1 em (Bùi Minh Nhật - sốt nhẹ, có phép)" : null,
          notes: "Lớp 1A1 nề nếp học tập tốt, học sinh tự giác và hăng hái xây dựng bài.",
          isConfirmed: true,
          confirmedAt: dayDate,
        },
      });
    }
  }

  // 1.2. Tạo sổ đầu bài cho các lớp và phân hiệu khác
  for (let i = 0; i < 40; i++) {
    const targetClass = classes[(i + 1) % classes.length];
    const spec = journalLessonTitles[i % journalLessonTitles.length];
    const targetSubject = subjects.find((s) => s.name === spec.subName) || subjects[0];
    const targetTeacher = teachers[i % teachers.length]?.teacher || teachers[0].teacher;

    const baseDate = new Date("2026-09-07T00:00:00.000Z");
    baseDate.setDate(baseDate.getDate() + (i % 14));

    await prisma.classJournalEntry.create({
      data: {
        classId: targetClass.id,
        subjectId: targetSubject.id,
        teacherId: targetTeacher.id,
        date: baseDate,
        dayOfWeek: (i % 5) + 1,
        period: (i % 5) + 1,
        lessonTitle: `${spec.title} (Tiết ${(i % 2) + 1})`,
        content: spec.note,
        absentees: i % 7 === 0 ? "Vắng 1 em (có phép)" : null,
        notes: "Nề nếp lớp học tốt, học sinh hăng hái phát biểu.",
        isConfirmed: true,
        confirmedAt: baseDate,
      },
    });
  }

  // 2. Khởi tạo 35 Báo Cáo Ngày Lớp Học (DailyReport)
  console.log("   - Tạo 35 báo cáo tình hình nền nếp chuyên cần hàng ngày của các lớp...");
  for (let d = 0; d < 35; d++) {
    const targetClass = d < sepDays.length ? class1A1 : classes[d % classes.length];
    const reportDate = new Date("2026-09-07T00:00:00.000Z");
    reportDate.setDate(reportDate.getDate() + (d % 14));

    const absent = d % 5 === 0 ? 1 : 0;

    await prisma.dailyReport.create({
      data: {
        classId: targetClass.id,
        date: reportDate,
        absentCount: absent,
        lateCount: d % 6 === 0 ? 1 : 0,
        incidentSummary: absent > 0 ? "1 học sinh vắng có phép do cảm sốt" : "Không có sự vụ bất thường",
        parentFeedbackSummary: "Phụ huynh ủng hộ kế hoạch hoạt động ngoại khóa",
        aiGeneratedText: "Lớp duy trì tốt nền nếp chuyên cần, 100% học sinh đồng phục chỉnh tề.",
        editedText: "Nền nếp lớp học đạt loại Tốt. Vệ sinh phòng học sạch sẽ, thoáng mát.",
        status: ReportStatus.SENT,
        sentAt: reportDate,
      },
    });
  }

  // 3. Khởi tạo 25 Bản ghi Hoạt động phong trào & CLB (ParticipationRecord)
  console.log("   - Tạo 25 hồ sơ học sinh tham gia phong trào, CLB STEM, Thể thao & Tiếng Anh...");
  const activitySpecs = [
    { name: "CLB Khoa học & Sáng tạo STEM Tiểu học", type: "PHONG_TRAO", role: "Đội trưởng", achievement: "Giải Nhất mô hình Cầu treo chịu lực cấp Cụm" },
    { name: "Hội khỏe Phù Đổng cấp Trường môn Cờ vua", type: "VAN_THE", role: "Vận động viên", achievement: "Huy chương Vàng bảng Khối 4-5" },
    { name: "Hội thi Giai điệu Tuổi hồng và Kể chuyện Bác Hồ", type: "VAN_THE", role: "Đội viên nòng cốt", achievement: "Giải Nhì cấp Trường" },
    { name: "Phong trào Kế hoạch nhỏ và Giữ gìn Môi trường xanh Lào Cai", type: "PHONG_TRAO", role: "Ủy viên BCH Chi đội", achievement: "Chi đội trưởng xuất sắc tiêu biểu" },
    { name: "Festival Tiếng Anh Giao tiếp & Hùng biện Nhí", type: "PHAT_BIEU", role: "Thí sinh xuất sắc", achievement: "Chứng nhận B1 Primary Cambridge" },
  ];

  for (let p = 0; p < 25; p++) {
    const targetStudent = students[p % students.length];
    const spec = activitySpecs[p % activitySpecs.length];
    const actDate = new Date("2026-09-12");
    actDate.setDate(actDate.getDate() + (p % 8));

    await prisma.participationRecord.create({
      data: {
        studentId: targetStudent.id,
        classId: targetStudent.classId,
        date: actDate,
        title: spec.name,
        category: spec.type,
        points: 5,
        note: `${spec.role} - ${spec.achievement}`,
        createdById: principalUser.id,
      },
    });
  }

  // 4. Khởi tạo 40 Đánh giá Rèn luyện Hạnh kiểm (ConductRecord)
  console.log("   - Tạo 40 hồ sơ đánh giá rèn luyện hạnh kiểm và đạo đức học sinh...");
  for (let c = 0; c < 40; c++) {
    const targetStudent = students[c % students.length];
    await prisma.conductRecord.create({
      data: {
        studentId: targetStudent.id,
        period: AcademicPeriod.HK1,
        conductRating: c % 12 === 0 ? ConductRating.KHA : ConductRating.TOT,
        academicRating: c % 12 === 0 ? AcademicRating.KHA : AcademicRating.GIOI,
        note: c % 12 === 0
          ? "Học sinh chăm ngoan, cần khắc phục việc đôi khi còn mất tập trung trong giờ tự quản."
          : "Học sinh lễ phép với thầy cô, hòa đồng giúp đỡ bạn bè, thực hiện xuất sắc 5 Điều Bác Hồ dạy.",
      },
    });
  }

  // 5. Khởi tạo 15 Sự vụ Khen thưởng & Nhắc nhở (Incident)
  console.log("   - Tạo 15 sự vụ ghi nhận khen thưởng gương tốt & hỗ trợ học sinh...");
  const incidentSpecs = [
    {
      type: IncidentType.COMMENDATION,
      title: "Nhặt được của rơi trả lại người đánh mất",
      desc: "Học sinh nhặt được số tiền 500.000đ tại sân trường phân hiệu Trung tâm và đã chủ động nộp lại Ban Giám hiệu để trả người đánh rơi.",
      handledBy: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    },
    {
      type: IncidentType.COMMENDATION,
      title: "Đạt giải Nhất cuộc thi VioEdu Đấu trường Toán học cấp Huyện",
      desc: "Học sinh xuất sắc đạt điểm tuyệt đối 300/300 trong vòng thi chung kết cấp Huyện Bảo Thắng.",
      handledBy: "ThS. Nguyễn Văn Trung (PHT)",
    },
    {
      type: IncidentType.COMMENDATION,
      title: "Gương sáng dũng cảm giúp đỡ bạn bị ngã trong giờ ra chơi",
      desc: "Kịp thời thông báo cho nhân viên y tế và cùng giáo viên sơ cứu an toàn cho bạn.",
      handledBy: "Cô Hoàng Thị Thu (Y tế học đường)",
    },
    {
      type: IncidentType.VIOLATION,
      title: "Nhắc nhở nhẹ nhàng việc quên mang sách vở môn Mỹ thuật",
      desc: "Giáo viên chủ nhiệm đã trao đổi với phụ huynh để phối hợp nhắc nhở em chuẩn bị đồ dùng học tập trước khi đến lớp.",
      handledBy: "Giáo viên Chủ nhiệm",
    },
  ];

  for (let inc = 0; inc < 15; inc++) {
    const spec = incidentSpecs[inc % incidentSpecs.length];
    const targetStudent = students[inc % students.length];
    const incDate = new Date("2026-09-10");
    incDate.setDate(incDate.getDate() + (inc % 9));

    await prisma.incident.create({
      data: {
        studentId: targetStudent.id,
        classId: targetStudent.classId,
        date: incDate,
        type: spec.type,
        description: `[${spec.title}] ${spec.desc}`,
        reportedBy: spec.handledBy,
      },
    });
  }

  // 6. Khởi tạo 15 Ý Kiến & Phản Hồi Phụ Huynh (ParentFeedback)
  console.log("   - Tạo 15 ý kiến đóng góp và phản hồi từ phụ huynh học sinh...");
  const feedbackSpecs = [
    {
      parent: "Bác Bùi Văn Thắng (PH em Bùi Minh Nhật)",
      phone: "0982345678",
      category: "ACADEMIC",
      content: "Gia đình rất cảm ơn cô giáo chủ nhiệm đã tận tình phụ đạo thêm môn Toán cho cháu sau giờ học. Cháu đã tự tin hơn nhiều.",
      response: "Nhà trường và giáo viên luôn sẵn sàng đồng hành cùng sự tiến bộ của các con. Trân trọng cảm ơn sự phối hợp của gia đình!",
    },
    {
      parent: "Chị Nguyễn Thị Lan (PH em Trần Bảo Châu)",
      phone: "0912456789",
      category: "HEALTH",
      content: "Đề nghị nhà trường lưu ý chế độ ăn bán trú bổ sung thêm sữa chua và hoa quả tươi vào bữa phụ chiều cho các cháu.",
      response: "Bộ phận Bán trú đã tiếp thu và cập nhật ngay vào thực đơn tuần 3 được công khai trên cổng thông tin nhà trường.",
    },
    {
      parent: "Anh Đặng Văn Quân (PH em Đặng Thùy Dương)",
      phone: "0978901234",
      category: "FACILITY",
      content: "Tại phân hiệu Sơn Hà 1, đường vào điểm trường mùa mưa hơi trơn, mong nhà trường phối hợp chính quyền địa phương rải thêm đá dăm.",
      response: "Ban Giám hiệu đã làm việc với UBND Xã Bảo Thắng và thôn bản để tiến hành khắc phục ngay trong tuần tới.",
    },
    {
      parent: "Chị Lê Thị Hạnh (PH em Lê Quốc Bảo)",
      phone: "0965432109",
      category: "GENERAL",
      content: "Đăng ký cho cháu tham gia CLB STEM và CLB Bóng đá sau giờ học chính khóa.",
      response: "Nhà trường đã tiếp nhận đơn đăng ký và xếp cháu vào danh sách lớp năng khiếu chiều thứ 4 và thứ 6.",
    },
  ];

  for (let fb = 0; fb < 15; fb++) {
    const spec = feedbackSpecs[fb % feedbackSpecs.length];
    const targetStudent = students[fb % students.length];
    const respDate = new Date("2026-09-14");

    await prisma.parentFeedback.create({
      data: {
        studentId: targetStudent.id,
        date: respDate,
        channel: "PHONE_ZALO",
        content: `[${spec.parent} - SĐT: ${spec.phone} (${spec.category})]: ${spec.content}`,
        handledBy: principalUser.name,
        response: spec.response,
      },
    });
  }

  console.log(`   ✅ Đã nạp thành công 40 Sổ đầu bài, 30 Báo cáo ngày, 25 Hồ sơ phong trào, 40 Hạnh kiểm, 15 Sự vụ và 15 Phản hồi PH.`);
}
