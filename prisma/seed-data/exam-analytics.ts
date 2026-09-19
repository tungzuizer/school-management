/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed-data/academic-facilities.ts`, `prisma/seed.ts`, `src/app/api/db-seed/route.ts`.
 * 2. Uniqueness: No existing file seeds multi-year ExamPeriod, StudentScore, and AcademicTranscript for Phố Lu & 5 Campuses.
 * 3. Data Schemas: Prisma models `ExamPeriod`, `StudentScore`, `AcademicTranscript`, `TranscriptSubjectGrade`, `ExamSemester`, `ExamType`.
 * 4. Verbatim User Instruction: "phần điểm thi kế hoạch giảng giạy duyệt yêu bgh chưa có dữ liệu".
 */

import {
  PrismaClient,
  ExamSemester,
  ExamType,
  TranscriptStatus,
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
  console.log("\n📊 Khởi tạo Dữ liệu Điểm thi TT27 đa năm (ExamPeriod, StudentScore, Học bạ số)...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser } = personnelStruct;
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
      examType: ExamType.FINAL,
      name: "Cuối Năm học (2024-2025)",
      orderIndex: 3,
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
      orderIndex: 4,
      startDate: new Date("2025-11-04"),
      endDate: new Date("2025-11-11"),
      isLocked: true,
    },
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK1,
      examType: ExamType.FINAL,
      name: "Cuối Học kỳ 1 (2025-2026)",
      orderIndex: 5,
      startDate: new Date("2026-01-07"),
      endDate: new Date("2026-01-15"),
      isLocked: true,
    },
    {
      schoolYear: "2025-2026",
      semester: ExamSemester.HK2,
      examType: ExamType.FINAL,
      name: "Cuối Năm học (2025-2026)",
      orderIndex: 6,
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
      orderIndex: 7,
      startDate: new Date("2026-11-03"),
      endDate: new Date("2026-11-10"),
      isLocked: false,
    },
    {
      schoolYear: "2026-2027",
      semester: ExamSemester.HK1,
      examType: ExamType.FINAL,
      name: "Cuối Học kỳ 1 (2026-2027)",
      orderIndex: 8,
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

  // 2. Lấy danh sách môn học trọng tâm
  const mathSubject = subjects.find((s) => s.name === "Toán") || subjects[0];
  const tvSubject = subjects.find((s) => s.name === "Tiếng Việt") || subjects[1] || subjects[0];
  const engSubject = subjects.find((s) => s.name === "Tiếng Anh") || subjects[2] || subjects[0];
  const itSubject = subjects.find((s) => s.name === "Tin học và Công nghệ") || subjects[3] || subjects[0];
  const sciSubject = subjects.find((s) => s.name === "Khoa học" || s.name === "Tự nhiên và Xã hội") || subjects[4] || subjects[0];

  const targetSubjects = [mathSubject, tvSubject, engSubject, itSubject, sciSubject];

  // Map classId to campusId
  const classCampusMap = new Map<string, string>();
  for (const cls of classes) {
    classCampusMap.set(cls.id, cls.campusId);
  }

  // 3. Khởi tạo điểm thi StudentScore cho toàn bộ học sinh trên 6 phân hiệu
  console.log(`   - Tạo điểm thi cho ${students.length} học sinh trên ${createdExamPeriods.length} kỳ thi...`);
  const scoreBatchData: any[] = [];

  // Lấy subset kỳ thi chính để tính toán phân tích (2024-2025 Final, 2025-2026 Midterm, Final, 2026-2027 Midterm)
  const activeExamPeriods = createdExamPeriods.filter(
    (p) => p.orderIndex === 2 || p.orderIndex === 4 || p.orderIndex === 5 || p.orderIndex === 6 || p.orderIndex === 7
  );

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const st = students[sIdx];
    const campusId = (st.classId ? classCampusMap.get(st.classId) : null) || campuses[0].campus.id;

    // Biến thiên điểm số thực tế theo năng lực học sinh
    const baseAbility = 6.8 + ((sIdx * 7 + 13) % 30) / 10; // 6.8 -> 9.7

    for (let pIdx = 0; pIdx < activeExamPeriods.length; pIdx++) {
      const period = activeExamPeriods[pIdx];
      // Điểm số có xu hướng cải thiện theo từng năm
      const progressBonus = pIdx * 0.18;

      for (let subIdx = 0; subIdx < targetSubjects.length; subIdx++) {
        const sub = targetSubjects[subIdx];
        const subOffset = ((subIdx * 11 + sIdx) % 15) / 10 - 0.7; // -0.7 -> +0.7
        let score = Math.round((baseAbility + progressBonus + subOffset) * 10) / 10;
        if (score > 10.0) score = 10.0;
        if (score < 4.5) score = 4.5;

        // Cho một số ít trường hợp điểm < 5.0 để AI Early Warning phát hiện nguy cơ học tập
        if (sIdx % 23 === 0 && subIdx === 0 && pIdx === 0) {
          score = 4.0;
        }

        scoreBatchData.push({
          studentId: st.id,
          subjectId: sub.id,
          examPeriodId: period.id,
          schoolId: school.id,
          campusId: campusId,
          score: score,
        });
      }
    }
  }

  // Chia batch nạp nhanh vào SQLite / PostgreSQL
  const BATCH_SIZE = 1000;
  for (let i = 0; i < scoreBatchData.length; i += BATCH_SIZE) {
    const chunk = scoreBatchData.slice(i, i + BATCH_SIZE);
    await prisma.studentScore.createMany({
      data: chunk,
    });
  }

  // 4. Khởi tạo Học bạ số (AcademicTranscript & TranscriptSubjectGrade) cho các học sinh mẫu
  console.log("   - Khởi tạo Học bạ điện tử chuẩn Thông tư 27 cho học sinh...");
  const sampleTranscriptStudents = students.slice(0, 30);

  for (let tIdx = 0; tIdx < sampleTranscriptStudents.length; tIdx++) {
    const st = sampleTranscriptStudents[tIdx];
    const targetClass = classes.find((c) => c.id === st.classId) || classes[0];

    const transcript = await prisma.academicTranscript.create({
      data: {
        studentId: st.id,
        classId: targetClass.id,
        schoolYear: "2025-2026",
        gradeLevel: targetClass.gradeLevel,
        status: TranscriptStatus.APPROVED_LOCKED,
        term1GPA: 8.6,
        term2GPA: 8.9,
        fullYearGPA: 8.8,
        term1Conduct: ConductRating.TOT,
        term2Conduct: ConductRating.TOT,
        fullYearConduct: ConductRating.TOT,
        term1Academic: AcademicRating.GIOI,
        term2Academic: AcademicRating.GIOI,
        fullYearAcademic: AcademicRating.GIOI,
        homeroomTeacherComment: "Học sinh có ý thức tự học cao, tích cực tham gia các phong trào Đội và chuyên đề STEM.",
        promotionStatus: "Hoàn thành chương trình lớp học - Lên lớp",
        rewardsAwarded: "Học sinh Xuất sắc tiêu biểu năm học 2025-2026",
        submittedAt: new Date("2026-05-22"),
        submittedById: principalUser.id,
        approvedAt: new Date("2026-05-25"),
        approvedById: principalUser.id,
      },
    });

    // Môn học trong học bạ
    for (const sub of targetSubjects) {
      const avg1 = 8.0 + ((tIdx * 3 + sub.name.length) % 20) / 10;
      const avg2 = Math.min(10.0, avg1 + 0.3);
      const full = Math.round(((avg1 + avg2 * 2) / 3) * 10) / 10;

      await prisma.transcriptSubjectGrade.create({
        data: {
          transcriptId: transcript.id,
          subjectId: sub.id,
          subjectName: sub.name,
          term1AvgScore: avg1,
          term2AvgScore: avg2,
          fullYearAvgScore: full,
          evaluationComment: "Nắm vững kiến thức kĩ năng, vận dụng sáng tạo vào bài tập thực hành.",
        },
      });
    }
  }

  console.log(`   ✅ Đã nạp thành công ${createdExamPeriods.length} kỳ thi, ${scoreBatchData.length} bản ghi StudentScore và ${sampleTranscriptStudents.length} học bạ số.`);
}
