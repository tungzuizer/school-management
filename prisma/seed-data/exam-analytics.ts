/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (lines 21, 183-188), `src/app/api/db-seed/route.ts` (lines 22, 167-172).
 * 2. Uniqueness: Dedicated comprehensive seed module for Student Grades & Scores across Phố Lu & 5 Campuses:
 *    - Regular Classroom Assessments (`Grade`: Oral, 15-min, Midterm, Final for Term 1 & 2)
 *    - Periodic Exam Scores (`StudentScore` on `ExamPeriod` across 3 school years)
 *    - Digital Transcripts (`AcademicTranscript` & `TranscriptSubjectGrade` according to Circular 27)
 *    - Transcript Unlock Workflow (`TranscriptUnlockRequest`)
 * 3. Data Schemas: Prisma models `ExamPeriod`, `StudentScore`, `Grade`, `AcademicTranscript`, `TranscriptSubjectGrade`, `TranscriptUnlockRequest`.
 * 4. Verbatim User Instruction: "tôi muốn dữ liệu mô phỏng về điểm của học sinh nữa".
 */

import {
  PrismaClient,
  ExamSemester,
  ExamType,
  GradeType,
  TranscriptStatus,
  UnlockStatus,
  ConductRating,
  AcademicRating,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedExamAnalyticsAndTranscripts(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n📊 Khởi tạo Dữ liệu Điểm số Toàn diện: Điểm thường xuyên (Grade), Điểm định kỳ (StudentScore), Học bạ số (Transcript)...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser, teachers } = personnelStruct;
  const { students, classes } = classesStudents;

  // 1. Tạo các kỳ thi qua 3 năm học (2024-2025, 2025-2026, 2026-2027)
  const examPeriodSpecs = [
    // Năm học 2024-2025
    {
      schoolYear: "2024-2025",
      semester: ExamSemester.HK1,
      examType: ExamType.MIDTERM,
      name: "Giữa Học kỳ 1 (2024-2025)",
      orderIndex: 1,
      startDate: new Date("2024-11-05"),
      endDate: new Date("2024-11-12"),
      isLocked: true,
    },
    {
      schoolYear: "2024-2025",
      semester: ExamSemester.HK1,
      examType: ExamType.FINAL,
      name: "Cuối Học kỳ 1 (2024-2025)",
      orderIndex: 2,
      startDate: new Date("2025-01-08"),
      endDate: new Date("2025-01-16"),
      isLocked: true,
    },
    {
      schoolYear: "2024-2025",
      semester: ExamSemester.HK2,
      examType: ExamType.MIDTERM,
      name: "Giữa Học kỳ 2 (2024-2025)",
      orderIndex: 3,
      startDate: new Date("2025-03-20"),
      endDate: new Date("2025-03-27"),
      isLocked: true,
    },
    {
      schoolYear: "2024-2025",
      semester: ExamSemester.HK2,
      examType: ExamType.FINAL,
      name: "Cuối Năm học (2024-2025)",
      orderIndex: 4,
      startDate: new Date("2025-05-12"),
      endDate: new Date("2025-05-20"),
      isLocked: true,
    },
    // Năm học 2025-2026
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK1,
      examType: ExamType.MIDTERM,
      name: "Giữa Học kỳ 1 (2025-2026)",
      orderIndex: 5,
      startDate: new Date("2025-11-04"),
      endDate: new Date("2025-11-11"),
      isLocked: true,
    },
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK1,
      examType: ExamType.FINAL,
      name: "Cuối Học kỳ 1 (2025-2026)",
      orderIndex: 6,
      startDate: new Date("2026-01-07"),
      endDate: new Date("2026-01-15"),
      isLocked: true,
    },
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK2,
      examType: ExamType.MIDTERM,
      name: "Giữa Học kỳ 2 (2025-2026)",
      orderIndex: 7,
      startDate: new Date("2026-03-19"),
      endDate: new Date("2026-03-26"),
      isLocked: true,
    },
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK2,
      examType: ExamType.FINAL,
      name: "Cuối Năm học (2025-2026)",
      orderIndex: 8,
      startDate: new Date("2026-05-11"),
      endDate: new Date("2026-05-19"),
      isLocked: true,
    },
    // Năm học hiện tại 2026-2027
    {
      schoolYear: "2026-2027",
      semester: ExamSemester.HK1,
      examType: ExamType.MIDTERM,
      name: "Giữa Học kỳ 1 (2026-2027)",
      orderIndex: 9,
      startDate: new Date("2026-11-03"),
      endDate: new Date("2026-11-10"),
      isLocked: false,
    },
    {
      schoolYear: "2026-2027",
      semester: ExamSemester.HK1,
      examType: ExamType.FINAL,
      name: "Cuối Học kỳ 1 (2026-2027)",
      orderIndex: 10,
      startDate: new Date("2027-01-06"),
      endDate: new Date("2027-01-14"),
      isLocked: false,
    },
  ];

  const createdExamPeriods: any[] = [];
  for (const spec of examPeriodSpecs) {
    const period = await prisma.examPeriod.create({
      data: {
        schoolId: school.id,
        schoolYear: spec.schoolYear,
        semester: spec.semester,
        examType: spec.examType,
        name: spec.name,
        orderIndex: spec.orderIndex,
        startDate: spec.startDate,
        endDate: spec.endDate,
        isLocked: spec.isLocked,
      },
    });
    createdExamPeriods.push(period);
  }

  // 2. Lấy danh sách các môn học chính khóa cấp Tiểu học
  const mathSubject = subjects.find((s) => s.name === "Toán") || subjects[0];
  const tvSubject = subjects.find((s) => s.name === "Tiếng Việt") || subjects[1] || subjects[0];
  const engSubject = subjects.find((s) => s.name === "Tiếng Anh") || subjects[2] || subjects[0];
  const itSubject = subjects.find((s) => s.name === "Tin học và Công nghệ") || subjects[3] || subjects[0];
  const sciSubject = subjects.find((s) => s.name === "Khoa học" || s.name === "Tự nhiên và Xã hội") || subjects[4] || subjects[0];
  const histSubject = subjects.find((s) => s.name === "Lịch sử và Địa lí") || subjects[5] || subjects[0];
  const ethicSubject = subjects.find((s) => s.name === "Đạo đức") || subjects[6] || subjects[0];
  const artSubject = subjects.find((s) => s.name === "Mĩ thuật") || subjects[7] || subjects[0];
  const musicSubject = subjects.find((s) => s.name === "Âm nhạc") || subjects[8] || subjects[0];

  const targetSubjects = [
    mathSubject,
    tvSubject,
    engSubject,
    itSubject,
    sciSubject,
    histSubject,
    ethicSubject,
    artSubject,
    musicSubject,
  ].filter(Boolean);

  // Map classId to campusId & classRoom
  const classMap = new Map<string, any>();
  for (const cls of classes) {
    classMap.set(cls.id, cls);
  }

  // 3. Khởi tạo Điểm Đánh Giá Thường Xuyên (Grade) cho toàn bộ học sinh
  console.log(`   - Tạo điểm kiểm tra thường xuyên (Miệng, 15p, Giữa kỳ, Cuối kỳ) cho ${students.length} học sinh...`);
  const gradeBatchData: any[] = [];

  // Môn đánh giá thường xuyên chính: Toán, Tiếng Việt, Tiếng Anh, Tin học, Khoa học, Đạo đức
  const gradeEvaluationSubjects = [mathSubject, tvSubject, engSubject, itSubject, sciSubject, ethicSubject].filter(Boolean);

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const st = students[sIdx];
    // Năng lực nền tảng của học sinh (6.5 đến 9.8)
    const baseStudentAbility = 6.8 + ((sIdx * 13 + 7) % 30) / 10;

    for (let subIdx = 0; subIdx < gradeEvaluationSubjects.length; subIdx++) {
      const sub = gradeEvaluationSubjects[subIdx];
      // Môn học thế mạnh / chênh lệch nhẹ
      const subjectBias = ((subIdx * 17 + sIdx * 5) % 15) / 10 - 0.7; // -0.7 đến +0.7

      for (let term = 1; term <= 2; term++) {
        const termBonus = term === 2 ? 0.2 : 0.0;

        // Điểm Miệng 1
        const oral1 = Math.min(10.0, Math.max(4.0, Math.round((baseStudentAbility + subjectBias + termBonus + (((sIdx * 3 + subIdx) % 11) / 10 - 0.5)) * 10) / 10));
        // Điểm Miệng 2
        const oral2 = Math.min(10.0, Math.max(4.0, Math.round((baseStudentAbility + subjectBias + termBonus + 0.2) * 10) / 10));

        // Điểm 15 phút 1
        const fifteen1 = Math.min(10.0, Math.max(4.0, Math.round((baseStudentAbility + subjectBias + termBonus - 0.1) * 10) / 10));
        // Điểm 15 phút 2
        const fifteen2 = Math.min(10.0, Math.max(4.0, Math.round((baseStudentAbility + subjectBias + termBonus + 0.3) * 10) / 10));

        // Điểm Giữa kỳ (1 tiết)
        const midterm = Math.min(10.0, Math.max(3.5, Math.round((baseStudentAbility + subjectBias + termBonus) * 10) / 10));

        // Điểm Cuối kỳ
        const finalScore = Math.min(10.0, Math.max(4.0, Math.round((baseStudentAbility + subjectBias + termBonus + 0.2) * 10) / 10));

        gradeBatchData.push(
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.ORAL, score: oral1 },
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.ORAL, score: oral2 },
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.FIFTEEN_MIN, score: fifteen1 },
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.FIFTEEN_MIN, score: fifteen2 },
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.MIDTERM, score: midterm },
          { studentId: st.id, subjectId: sub.id, term, type: GradeType.FINAL, score: finalScore }
        );
      }
    }
  }

  // Chia nhỏ batch để nạp nhanh bảng Grade
  const GRADE_BATCH_SIZE = 1500;
  for (let i = 0; i < gradeBatchData.length; i += GRADE_BATCH_SIZE) {
    const chunk = gradeBatchData.slice(i, i + GRADE_BATCH_SIZE);
    await prisma.grade.createMany({
      data: chunk,
    });
  }
  console.log(`   ✅ Đã nạp thành công ${gradeBatchData.length} bản ghi điểm đánh giá thường xuyên (Grade).`);

  // 4. Khởi tạo Điểm kiểm tra định kỳ (StudentScore) trên các kỳ thi ExamPeriod
  console.log(`   - Tạo điểm kiểm tra định kỳ StudentScore trên ${createdExamPeriods.length} kỳ thi qua 3 năm học...`);
  const scoreBatchData: any[] = [];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const st = students[sIdx];
    const targetClass = classMap.get(st.classId);
    const campusId = targetClass?.campusId || campuses[0].campus.id;
    const baseAbility = 6.8 + ((sIdx * 7 + 13) % 30) / 10;

    for (let pIdx = 0; pIdx < createdExamPeriods.length; pIdx++) {
      const period = createdExamPeriods[pIdx];
      const progressBonus = pIdx * 0.12;

      for (let subIdx = 0; subIdx < targetSubjects.length; subIdx++) {
        const sub = targetSubjects[subIdx];
        const subOffset = ((subIdx * 11 + sIdx) % 15) / 10 - 0.7;
        let score = Math.round((baseAbility + progressBonus + subOffset) * 10) / 10;
        if (score > 10.0) score = 10.0;
        if (score < 4.5) score = 4.5;

        // Một số ít trường hợp điểm dưới trung bình để hệ thống cảnh báo sớm AI phát hiện
        if (sIdx % 27 === 0 && subIdx === 0 && pIdx <= 2) {
          score = 4.2;
        }

        scoreBatchData.push({
          studentId: st.id,
          subjectId: sub.id,
          examPeriodId: period.id,
          schoolId: school.id,
          campusId: campusId,
          score,
        });
      }
    }
  }

  for (let i = 0; i < scoreBatchData.length; i += GRADE_BATCH_SIZE) {
    const chunk = scoreBatchData.slice(i, i + GRADE_BATCH_SIZE);
    await prisma.studentScore.createMany({
      data: chunk,
    });
  }
  console.log(`   ✅ Đã nạp thành công ${scoreBatchData.length} bản ghi điểm kiểm tra định kỳ (StudentScore).`);

  // 5. Khởi tạo Học bạ số điện tử toàn diện (AcademicTranscript & TranscriptSubjectGrade)
  console.log("   - Khởi tạo Học bạ số điện tử chuẩn Thông tư 27 cho học sinh qua các năm học...");

  // Tạo học bạ cho 80 học sinh đại diện tất cả các khối 1-5 trên cả 6 phân hiệu
  const transcriptStudents = students.slice(0, 80);
  const createdTranscripts: any[] = [];

  const subjectEvaluationTemplates: Record<string, string[]> = {
    "Toán": [
      "Nắm vững kiến thức trọng tâm, tính toán nhanh, giải toán có lời văn tốt.",
      "Tư duy logic tốt, biết vận dụng công thức vào các bài toán thực tiễn.",
      "Thực hiện thành thạo các phép tính, trình bày bài toán sạch sẽ, khoa học.",
      "Có tiến bộ vượt bậc trong kỹ năng tính nhẩm và giải hình học trực quan.",
    ],
    "Tiếng Việt": [
      "Đọc to rõ ràng, chữ viết đều nét, viết đoạn văn giàu hình ảnh và cảm xúc.",
      "Vốn từ vựng phong phú, sử dụng dấu câu chính xác, diễn đạt mạch lạc.",
      "Đọc hiểu tốt, tích cực đọc sách thư viện và tham gia kể chuyện.",
      "Chính tả chuẩn, kỹ năng nghe viết tốt, câu văn mạch lạc giàu hình tượng.",
    ],
    "Tiếng Anh": [
      "Phát âm chuẩn, giao tiếp tự tin qua các bài hội thoại tình huống.",
      "Nắm chắc từ vựng theo chủ đề, phản xạ nghe nói tốt, tích cực tham gia CLB Tiếng Anh.",
      "Ghi nhớ cấu trúc câu nhanh, phát âm chuẩn ngữ điệu, hoàn thành tốt bài tập.",
      "Tự tin thể hiện kỹ năng nghe nói, yêu thích học ngoại ngữ.",
    ],
    "Tin học và Công nghệ": [
      "Sử dụng bàn phím và chuột máy tính thành thạo, hoàn thành tốt bài thực hành.",
      "Biết tìm kiếm thông tin học tập an toàn trên Internet, vẽ tranh đồ họa sáng tạo.",
      "Thao tác phần mềm học tập nhanh nhẹn, biết bảo quản thiết bị phòng máy.",
      "Hứng thú khám phá công nghệ số, thực hiện đúng quy tắc an toàn máy tính.",
    ],
    "Khoa học": [
      "Ham học hỏi, yêu thích các thí nghiệm khám phá thế giới tự nhiên xung quanh.",
      "Quan sát tốt, biết liên hệ kiến thức bảo vệ môi trường và sức khỏe bản thân.",
      "Tích cực tham gia các dự án trải nghiệm STEM và bảo vệ nguồn nước sạch.",
      "Hiểu rõ các hiện tượng tự nhiên đơn giản, có ý thức giữ gìn vệ sinh môi trường.",
    ],
    "Tự nhiên và Xã hội": [
      "Hiểu biết tốt về gia đình, nhà trường và quê hương Bảo Thắng Lào Cai.",
      "Có ý thức chăm sóc sức khỏe bản thân và thực hiện tốt an toàn giao thông.",
      "Quan sát thế giới xung quanh nhạy bén, tích cực chia sẻ cùng bạn bè.",
      "Biết yêu quý cây xanh, vật nuôi và giữ gìn cảnh quan lớp học xanh sạch đẹp.",
    ],
    "Lịch sử và Địa lí": [
      "Yêu thích tìm hiểu lịch sử dân tộc, ghi nhớ tốt các mốc sự kiện quan trọng.",
      "Biết đọc bản đồ, hiểu rõ đặc điểm địa lý tự nhiên vùng Trung du và Miền núi Bắc Bộ.",
      "Tự hào về truyền thống cách mạng quê hương Lào Cai và các danh lam thắng cảnh.",
      "Nắm chắc kiến thức bài học, trình bày diễn biến các trận đánh lịch sử sinh động.",
    ],
    "Đạo đức": [
      "Kính trọng thầy cô, yêu quý bạn bè, có tinh thần tương thân tương ái.",
      "Luôn trung thực, thật thà, chấp hành tốt nội quy trường lớp và nề nếp kỷ cương.",
      "Tích cực giúp đỡ bạn bè cùng tiến, nhiệt tình tham gia hoạt động Sao nhi đồng.",
      "Lễ phép chào hỏi, có ý thức tự giác cao trong mọi hoạt động tập thể.",
    ],
    "Mĩ thuật": [
      "Khéo tay, phối màu tươi sáng hài hòa, có nhiều ý tưởng sáng tạo độc đáo.",
      "Tác phẩm vẽ tranh sinh động, thể hiện tình yêu quê hương bản làng vùng cao.",
      "Sử dụng vật liệu tái chế khéo léo trong các sản phẩm thủ công và tạo hình.",
      "Yêu thích hội họa, hoàn thành tốt các chủ đề tranh cổ động và lễ hội.",
    ],
    "Âm nhạc": [
      "Hát đúng giai điệu, tự tin biểu diễn trước tập thể và tham gia đội văn nghệ.",
      "Cảm thụ âm nhạc tốt, biết gõ đệm theo tiết tấu bài hát nhịp nhàng.",
      "Hào hứng trong các tiết học hát, giọng hát trong sáng, biểu cảm tốt.",
      "Nhiệt tình tham gia các hội diễn văn nghệ chào mừng ngày 20/11 của trường.",
    ],
  };

  const homeroomComments = [
    "Học sinh chăm ngoan, gương mẫu, luôn hoàn thành xuất sắc các nội dung học tập và rèn luyện. Tích cực tham gia phong trào Đội.",
    "Học sinh có ý thức tự học cao, tư duy nhanh nhẹn, hòa đồng và luôn sẵn lòng giúp đỡ bạn bè cùng tiến bộ.",
    "Em có tinh thần trách nhiệm, tích cực phát biểu xây dựng bài, đạt nhiều tiến bộ vượt bậc trong học tập.",
    "Chăm chỉ, nền nếp kỷ cương tốt, hoàn thành tốt các mục tiêu phẩm chất và năng lực GDPT 2018.",
    "Có năng khiếu nổi bật về các môn nghệ thuật và STEM, lễ phép với thầy cô và thân thiện với bạn bè.",
  ];

  // Nạp học bạ năm học 2025-2026 (Đã khóa) và 2026-2027 (Đang vận hành)
  const schoolYears = [
    { year: "2025-2026", status: TranscriptStatus.APPROVED_LOCKED },
    { year: "2026-2027", status: TranscriptStatus.SUBMITTED },
  ];

  for (const sy of schoolYears) {
    for (let tIdx = 0; tIdx < transcriptStudents.length; tIdx++) {
      const st = transcriptStudents[tIdx];
      const targetClass = classMap.get(st.classId) || classes[0];

      const baseGpa = 7.5 + ((tIdx * 7 + 11) % 25) / 10; // 7.5 -> 9.9
      const term1GPA = Math.round(baseGpa * 10) / 10;
      const term2GPA = sy.year === "2026-2027" ? null : Math.min(10.0, Math.round((baseGpa + 0.2) * 10) / 10);
      const fullYearGPA = sy.year === "2026-2027" ? null : Math.round(((term1GPA + (term2GPA || term1GPA) * 2) / 3) * 10) / 10;

      const academicRating =
        (fullYearGPA || term1GPA) >= 8.5
          ? AcademicRating.GIOI
          : (fullYearGPA || term1GPA) >= 7.0
          ? AcademicRating.KHA
          : AcademicRating.DAT;

      const conductRating = ConductRating.TOT;
      const comment = homeroomComments[tIdx % homeroomComments.length];
      const rewards =
        academicRating === AcademicRating.GIOI
          ? `Học sinh Xuất sắc tiêu biểu năm học ${sy.year}`
          : `Học sinh Tiêu biểu hoàn thành tốt học tập và rèn luyện năm học ${sy.year}`;

      const promoStatus =
        targetClass.gradeLevel === 5
          ? "Hoàn thành chương trình Tiểu học"
          : `Hoàn thành chương trình lớp ${targetClass.gradeLevel} - Lên lớp ${targetClass.gradeLevel + 1}`;

      const transcript = await prisma.academicTranscript.create({
        data: {
          studentId: st.id,
          classId: targetClass.id,
          schoolYear: sy.year,
          gradeLevel: targetClass.gradeLevel,
          status: sy.status,
          term1GPA,
          term2GPA,
          fullYearGPA,
          term1Conduct: conductRating,
          term2Conduct: sy.year === "2026-2027" ? null : conductRating,
          fullYearConduct: sy.year === "2026-2027" ? null : conductRating,
          term1Academic: academicRating,
          term2Academic: sy.year === "2026-2027" ? null : academicRating,
          fullYearAcademic: sy.year === "2026-2027" ? null : academicRating,
          homeroomTeacherComment: comment,
          promotionStatus: sy.year === "2026-2027" ? "Đang học tập" : promoStatus,
          rewardsAwarded: sy.year === "2026-2027" ? null : rewards,
          submittedAt: new Date(sy.year === "2026-2027" ? "2026-09-16" : "2026-05-20"),
          submittedById: principalUser.id,
          approvedAt: sy.status === TranscriptStatus.APPROVED_LOCKED ? new Date("2026-05-25") : null,
          approvedById: sy.status === TranscriptStatus.APPROVED_LOCKED ? principalUser.id : null,
        },
      });

      createdTranscripts.push(transcript);

      // Điểm từng môn học trong học bạ số
      for (let sIdx = 0; sIdx < targetSubjects.length; sIdx++) {
        const sub = targetSubjects[sIdx];
        const subOffset = ((sIdx * 5 + tIdx * 3) % 15) / 10 - 0.7;
        const subT1 = Math.min(10.0, Math.max(5.0, Math.round((baseGpa + subOffset) * 10) / 10));
        const subT2 = sy.year === "2026-2027" ? null : Math.min(10.0, Math.max(5.0, Math.round((subT1 + 0.3) * 10) / 10));
        const subFull = sy.year === "2026-2027" ? null : Math.round(((subT1 + (subT2 || subT1) * 2) / 3) * 10) / 10;

        const evalList = subjectEvaluationTemplates[sub.name] || [
          "Nắm vững kiến thức kĩ năng bài học, tích cực thực hành và hoàn thành tốt nhiệm vụ học tập.",
        ];
        const evalComment = evalList[(tIdx + sIdx) % evalList.length];

        await prisma.transcriptSubjectGrade.create({
          data: {
            transcriptId: transcript.id,
            subjectId: sub.id,
            subjectName: sub.name,
            term1AvgScore: subT1,
            term2AvgScore: subT2,
            fullYearAvgScore: subFull,
            evaluationComment: evalComment,
          },
        });
      }
    }
  }
  console.log(`   ✅ Đã nạp thành công ${createdTranscripts.length} học bạ số điện tử và chi tiết điểm từng môn học.`);

  // 6. Khởi tạo Yêu cầu mở khóa học bạ (TranscriptUnlockRequest)
  console.log("   - Tạo các hồ sơ Yêu cầu mở khóa học bạ TranscriptUnlockRequest mẫu...");
  const sampleLockedTranscripts = createdTranscripts.filter(
    (t) => t.status === TranscriptStatus.APPROVED_LOCKED
  );

  if (sampleLockedTranscripts.length >= 4) {
    const teacherUser1 = teachers[0]?.user || principalUser;
    const teacherUser2 = teachers[1]?.user || principalUser;

    // Yêu cầu 1: Đang chờ BGH duyệt (PENDING)
    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId: sampleLockedTranscripts[0].id,
        requestedById: teacherUser1.id,
        reason: "Cập nhật đính chính điểm kiểm tra cuối kỳ môn Tiếng Anh sau khi đối chiếu lại bài thi phúc khảo của học sinh.",
        status: UnlockStatus.PENDING,
      },
    });

    await prisma.academicTranscript.update({
      where: { id: sampleLockedTranscripts[0].id },
      data: { status: TranscriptStatus.UNLOCK_REQUESTED },
    });

    // Yêu cầu 2: Đang chờ BGH duyệt (PENDING)
    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId: sampleLockedTranscripts[1].id,
        requestedById: teacherUser2.id,
        reason: "Bổ sung thông tin khen thưởng Đạt giải Ba cuộc thi Trạng Nguyên Tiếng Việt cấp Tỉnh vào học bạ năm học 2025-2026.",
        status: UnlockStatus.PENDING,
      },
    });

    await prisma.academicTranscript.update({
      where: { id: sampleLockedTranscripts[1].id },
      data: { status: TranscriptStatus.UNLOCK_REQUESTED },
    });

    // Yêu cầu 3: Đã được Hiệu trưởng phê duyệt (APPROVED)
    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId: sampleLockedTranscripts[2].id,
        requestedById: teacherUser1.id,
        reason: "Điều chỉnh nhận xét môn Mĩ thuật theo đề xuất của giáo viên bộ môn.",
        status: UnlockStatus.APPROVED,
        reviewedById: principalUser.id,
        reviewedAt: new Date("2026-09-10"),
        reviewNote: "Hiệu trưởng phê duyệt mở khóa trong thời hạn 48 giờ để giáo viên chủ nhiệm hoàn tất đính chính.",
      },
    });

    // Yêu cầu 4: Đã từ chối (REJECTED)
    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId: sampleLockedTranscripts[3].id,
        requestedById: teacherUser2.id,
        reason: "Yêu cầu thay đổi toàn bộ điểm tổng kết môn Tin học.",
        status: UnlockStatus.REJECTED,
        reviewedById: principalUser.id,
        reviewedAt: new Date("2026-09-12"),
        reviewNote: "Từ chối yêu cầu do không có biên bản họp hội đồng chấm kiểm tra lại theo quy chế Thông tư 27.",
      },
    });
  }

  console.log(`   ✅ Đã nạp thành công các yêu cầu mở khóa học bạ số (TranscriptUnlockRequest).`);
}
