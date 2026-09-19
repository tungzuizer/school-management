/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`vitest.config.ts`, `npm test`, `npx vitest run`).
 * 2. Uniqueness: No existing file tests the business modules for Exam Analytics, Lesson Plans, and Approvals Dispatch.
 * 3. Data Schemas: Prisma Client models for ExamPeriod, StudentScore, AcademicTranscript, LessonPlanPeriod, LessonPlan, LessonPlanReview, TeacherChangeRequest, SubstituteAssignment, ApprovalWorkflow.
 * 4. Verbatim User Instruction: "phần điểm thi kế hoạch giảng giạy duyệt yêu bgh chưa có dữ liệu".
 */

import { describe, it, expect, vi } from "vitest";
import { seedExamAnalyticsAndTranscripts } from "../../../prisma/seed-data/exam-analytics";
import { seedLessonPlansAndCurriculum } from "../../../prisma/seed-data/lesson-plans";
import { seedApprovalsAndDispatch } from "../../../prisma/seed-data/approvals-dispatch";

describe("Core Academic & Governance Seed Modules Verification", () => {
  // Mock data structure
  const mockSchool = { id: "sch_th_pholu", name: "Trường Tiểu học Phố Lu" };
  const mockCampuses = [
    { campus: { id: "cmp_trungtam", name: "Điểm trường Trung tâm" }, schoolPoint: { id: "sp_trungtam" } },
    { campus: { id: "cmp_sonha1", name: "Phân hiệu Sơn Hà 1" }, schoolPoint: { id: "sp_sonha1" } },
    { campus: { id: "cmp_sonha2", name: "Phân hiệu Sơn Hà 2" }, schoolPoint: { id: "sp_sonha2" } },
    { campus: { id: "cmp_sonhai", name: "Phân hiệu Sơn Hải" }, schoolPoint: { id: "sp_sonhai" } },
    { campus: { id: "cmp_pholu3", name: "Phân hiệu Phố Lu 3" }, schoolPoint: { id: "sp_pholu3" } },
    { campus: { id: "cmp_antien", name: "Điểm trường An Tiến" }, schoolPoint: { id: "sp_antien" } },
  ];

  const mockSubjects = [
    { id: "sub_toan", name: "Toán" },
    { id: "sub_tv", name: "Tiếng Việt" },
    { id: "sub_ta", name: "Tiếng Anh" },
    { id: "sub_tin", name: "Tin học và Công nghệ" },
    { id: "sub_kh", name: "Khoa học" },
  ];

  const mockPrincipal = { id: "usr_principal", name: "ThS. Trần Thị Thanh Hà" };
  const mockVpUsers = [
    { id: "usr_vp_tt", name: "ThS. Nguyễn Văn Trung" },
    { id: "usr_vp_sh1", name: "Thầy Nguyễn Văn Sơn" },
  ];

  const mockTeachers = Array.from({ length: 12 }, (_, i) => ({
    user: { id: `usr_gv_${i}`, name: `Giáo viên ${i + 1}` },
    teacher: { id: `tch_${i}`, userId: `usr_gv_${i}`, campusId: mockCampuses[i % 6].campus.id },
  }));

  const mockClasses = [
    { id: "cls_1a1", name: "1A1", gradeLevel: 1, campusId: "cmp_trungtam" },
    { id: "cls_2a_sh1", name: "2A_SH1", gradeLevel: 2, campusId: "cmp_sonha1" },
    { id: "cls_3a1", name: "3A1", gradeLevel: 3, campusId: "cmp_trungtam" },
    { id: "cls_4a_shai", name: "4A_SHAI", gradeLevel: 4, campusId: "cmp_sonhai" },
    { id: "cls_5a_pl3", name: "5A_PL3", gradeLevel: 5, campusId: "cmp_pholu3" },
    { id: "cls_1a_at", name: "1A_AT", gradeLevel: 1, campusId: "cmp_antien" },
  ];

  const mockStudents = Array.from({ length: 30 }, (_, i) => ({
    id: `st_${i}`,
    studentCode: `HS261000${i + 1 < 10 ? "0" + (i + 1) : i + 1}`,
    classId: mockClasses[i % mockClasses.length].id,
  }));

  const mockSchoolStruct = { school: mockSchool, campuses: mockCampuses, schoolPoints: [] } as any;
  const mockPersonnelStruct = {
    principalUser: mockPrincipal,
    accountantUser: { id: "usr_acc", name: "Kế toán" },
    vpUsers: mockVpUsers,
    teachers: mockTeachers,
    subjects: mockSubjects,
    subjectGroups: [],
  } as any;
  const mockClassesStudents = { classes: mockClasses, students: mockStudents } as any;

  it("1. seedExamAnalyticsAndTranscripts tạo kỳ thi đa năm và bảng điểm học sinh", async () => {
    const createdExamPeriods: any[] = [];
    const createdGrades: any[] = [];
    const createdScores: any[] = [];
    const createdTranscripts: any[] = [];
    const createdSubjectGrades: any[] = [];
    const createdUnlockRequests: any[] = [];

    const mockPrisma = {
      examPeriod: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `ep_${createdExamPeriods.length + 1}`, ...data };
          createdExamPeriods.push(item);
          return item;
        }),
      },
      grade: {
        createMany: vi.fn().mockImplementation(async ({ data }) => {
          createdGrades.push(...data);
          return { count: data.length };
        }),
      },
      studentScore: {
        createMany: vi.fn().mockImplementation(async ({ data }) => {
          createdScores.push(...data);
          return { count: data.length };
        }),
      },
      academicTranscript: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `at_${createdTranscripts.length + 1}`, ...data };
          createdTranscripts.push(item);
          return item;
        }),
        update: vi.fn().mockImplementation(async ({ where, data }) => {
          const found = createdTranscripts.find((t) => t.id === where.id);
          if (found) Object.assign(found, data);
          return found;
        }),
      },
      transcriptSubjectGrade: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `tsg_${createdSubjectGrades.length + 1}`, ...data };
          createdSubjectGrades.push(item);
          return item;
        }),
      },
      transcriptUnlockRequest: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `tur_${createdUnlockRequests.length + 1}`, ...data };
          createdUnlockRequests.push(item);
          return item;
        }),
      },
    } as any;

    await seedExamAnalyticsAndTranscripts(
      mockPrisma,
      mockSchoolStruct,
      mockPersonnelStruct,
      mockClassesStudents
    );

    expect(createdExamPeriods.length).toBe(10);
    expect(createdGrades.length).toBeGreaterThan(0);
    expect(createdScores.length).toBeGreaterThan(0);
    expect(createdTranscripts.length).toBe(60);
    expect(createdSubjectGrades.length).toBeGreaterThan(0);
    expect(createdUnlockRequests.length).toBe(4);
  });

  it("2. seedLessonPlansAndCurriculum tạo đợt nộp giáo án, khung CT và kế hoạch bài dạy", async () => {
    const createdPeriods: any[] = [];
    const createdCurriculums: any[] = [];
    const createdLessonPlans: any[] = [];
    const createdReviews: any[] = [];

    const mockPrisma = {
      lessonPlanPeriod: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `lpp_${createdPeriods.length + 1}`, ...data };
          createdPeriods.push(item);
          return item;
        }),
      },
      curriculum: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `cur_${createdCurriculums.length + 1}`, ...data };
          createdCurriculums.push(item);
          return item;
        }),
      },
      lessonPlan: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `lp_${createdLessonPlans.length + 1}`, ...data };
          createdLessonPlans.push(item);
          return item;
        }),
      },
      lessonPlanReview: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `lpr_${createdReviews.length + 1}`, ...data };
          createdReviews.push(item);
          return item;
        }),
      },
    } as any;

    await seedLessonPlansAndCurriculum(
      mockPrisma,
      mockSchoolStruct,
      mockPersonnelStruct,
      mockClassesStudents
    );

    expect(createdPeriods.length).toBe(4);
    expect(createdCurriculums.length).toBe(5);
    expect(createdLessonPlans.length).toBe(24);
    expect(createdReviews.length).toBeGreaterThan(0);
  });

  it("3. seedApprovalsAndDispatch tạo hồ sơ dạy thay, phân công thông minh và quy trình phê duyệt BGH", async () => {
    const createdChangeRequests: any[] = [];
    const createdAssignments: any[] = [];
    const createdWorkflows: any[] = [];
    const createdComments: any[] = [];

    const mockPrisma = {
      teacherChangeRequest: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `tcr_${createdChangeRequests.length + 1}`, ...data };
          createdChangeRequests.push(item);
          return item;
        }),
      },
      substituteAssignment: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `sub_${createdAssignments.length + 1}`, ...data };
          createdAssignments.push(item);
          return item;
        }),
      },
      approvalWorkflow: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `wf_${createdWorkflows.length + 1}`, ...data };
          createdWorkflows.push(item);
          return item;
        }),
      },
      approvalComment: {
        create: vi.fn().mockImplementation(async ({ data }) => {
          const item = { id: `cm_${createdComments.length + 1}`, ...data };
          createdComments.push(item);
          return item;
        }),
      },
    } as any;

    await seedApprovalsAndDispatch(
      mockPrisma,
      mockSchoolStruct,
      mockPersonnelStruct,
      mockClassesStudents
    );

    expect(createdChangeRequests.length).toBe(6);
    expect(createdAssignments.length).toBe(5);
    expect(createdWorkflows.length).toBe(4);
    expect(createdComments.length).toBeGreaterThan(0);
  });
});
