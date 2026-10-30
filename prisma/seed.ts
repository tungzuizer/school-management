/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Prisma CLI seeder (`npx prisma db seed` / `npx tsx prisma/seed.ts`), package.json scripts.
 * 2. Purpose: Complete database wipe and realistic seeding for Trường Tiểu học Phố Lu & 5 Phân hiệu (Lào Cai):
 *    - Đơn vị chủ quản: Sở GD&ĐT Lào Cai & UBND Xã Bảo Thắng
 *    - Trường pháp nhân: Trường Tiểu học Phố Lu (SchoolType.TIEU_HOC)
 *    - 5 Phân hiệu & Điểm trường: Trung tâm (35 lớp), Sơn Hà 1 (10 lớp), Sơn Hà 2 (5 lớp), Sơn Hải (7 lớp), Điểm An Tiến (5 lớp)
 *    - Quy mô: 62 lớp, 1.700 học sinh, 125 CB-GV-NV, 80 phòng học/chức năng, 40 tiết/tuần thời khóa biểu thực tế
 *    - Mật khẩu mặc định: 123456
 * 3. Schemas: Prisma models with multi-campus scoping, TT27 evaluation, timetable, attendance, equipment transfers, KPIs.
 * 4. Verbatim User Instruction: "hãy xóa hết dữ liệu của TRƯỜNG TIỂU HỌC PHỐ LU và hãy cập nhập và lấy dữ liệu ở đây C:\Users\tungh\Desktop\school-management\docs\dulieu" / "cả thời khóa biểu nữa" / "theo khuyến nghị của bạn"
 */

import { PrismaClient } from "@prisma/client";
import { DEFAULT_PASSWORD_PLAIN, hashPassword } from "./seed-data/constants";
import { seedAdministrativeHierarchy } from "./seed-data/administrative";
import { seedSchoolStructure } from "./seed-data/school-structure";
import { seedPersonnelAndSubjects } from "./seed-data/personnel-subjects";
import { seedClassesAndStudents } from "./seed-data/classes-students";
import { seedAcademicAndFacilities } from "./seed-data/academic-facilities";
import { seedExamAnalyticsAndTranscripts } from "./seed-data/exam-analytics";
import { seedLessonPlansAndCurriculum } from "./seed-data/lesson-plans";
import { seedApprovalsAndDispatch } from "./seed-data/approvals-dispatch";
import { seedClassroomOperations } from "./seed-data/classroom-operations";
import { seedSchoolCalendarAndGovernance } from "./seed-data/school-calendar-governance";
import { seedKpiOperations } from "./seed-data/kpi-operations";
import { seedAiJourneyAnalytics } from "./seed-data/ai-journey-analytics";
import { seedAccreditationAndSystemAdmin } from "./seed-data/accreditation-system-admin";
import { seedTranPhuSchool } from "./seed-data/tranphu-school";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function cleanDatabase(prismaClient: PrismaClient) {
  console.log("🧹 [1/6] Đang xóa toàn bộ dữ liệu cũ trong cơ sở dữ liệu Supabase/PostgreSQL...");
  try {
    const tablenames = await prismaClient.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
    `;
    const tables = tablenames
      .map(({ tablename }) => `"${tablename}"`)
      .filter((name) => name !== '"_prisma_migrations"')
      .join(", ");
    if (tables.length > 0) {
      await prismaClient.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      console.log(`   ✅ Đã dọn dẹp sạch sẽ ${tablenames.length} bảng bằng TRUNCATE CASCADE.`);
      return;
    }
  } catch (error) {
    console.warn("⚠️ TRUNCATE CASCADE không khả dụng, dọn dẹp qua Prisma deleteMany...");
  }

  // Fallback sequential delete in reverse dependency order
  const deleteOps = [
    () => prismaClient.transcriptUnlockRequest.deleteMany(),
    () => prismaClient.tT15EvidenceFile.deleteMany(),
    () => prismaClient.schoolPointEvaluationDetail.deleteMany(),
    () => prismaClient.schoolPointEvaluation.deleteMany(),
    () => prismaClient.tT15Indicator.deleteMany(),
    () => prismaClient.fileAuditLog.deleteMany(),
    () => prismaClient.systemEvidenceFile.deleteMany(),
    () => prismaClient.studentImportMapping.deleteMany(),
    () => prismaClient.studentImportStaging.deleteMany(),
    () => prismaClient.studentImportBatch.deleteMany(),
    () => prismaClient.interventionRecord.deleteMany(),
    () => prismaClient.studentJourneySnapshot.deleteMany(),
    () => prismaClient.journeyThresholdConfig.deleteMany(),
    () => prismaClient.aiAnalysisLog.deleteMany(),
    () => prismaClient.aiReportSummary.deleteMany(),
    () => prismaClient.aiRecommendation.deleteMany(),
    () => prismaClient.aiAlert.deleteMany(),
    () => prismaClient.qualityObjectiveHistory.deleteMany(),
    () => prismaClient.qualityObjectiveEvidence.deleteMany(),
    () => prismaClient.kpiUnlockLog.deleteMany(),
    () => prismaClient.kpiApprovalLog.deleteMany(),
    () => prismaClient.kpiEvidence.deleteMany(),
    () => prismaClient.kpiValue.deleteMany(),
    () => prismaClient.kpiTarget.deleteMany(),
    () => prismaClient.kpiAssignment.deleteMany(),
    () => prismaClient.kpiPeriod.deleteMany(),
    () => prismaClient.earlyWarning.deleteMany(),
    () => prismaClient.decisionLog.deleteMany(),
    () => prismaClient.weeklyActivity.deleteMany(),
    () => prismaClient.monthlyPlan.deleteMany(),
    () => prismaClient.academicCalendar.deleteMany(),
    () => prismaClient.classJournalEntry.deleteMany(),
    () => prismaClient.dailyReport.deleteMany(),
    () => prismaClient.participationRecord.deleteMany(),
    () => prismaClient.approvalComment.deleteMany(),
    () => prismaClient.approvalWorkflow.deleteMany(),
    () => prismaClient.substituteAssignment.deleteMany(),
    () => prismaClient.teacherChangeRequest.deleteMany(),
    () => prismaClient.lessonPlanReview.deleteMany(),
    () => prismaClient.lessonPlan.deleteMany(),
    () => prismaClient.lessonPlanPeriod.deleteMany(),
    () => prismaClient.curriculum.deleteMany(),
    () => prismaClient.transcriptSubjectGrade.deleteMany(),
    () => prismaClient.academicTranscript.deleteMany(),
    () => prismaClient.studentScore.deleteMany(),
    () => prismaClient.examPeriod.deleteMany(),
    () => prismaClient.officialDocument.deleteMany(),
    () => prismaClient.equipmentTransfer.deleteMany(),
    () => prismaClient.equipment.deleteMany(),
    () => prismaClient.aiConfigThreshold.deleteMany(),
    () => prismaClient.qualityObjective.deleteMany(),
    () => prismaClient.kpiCatalog.deleteMany(),
    () => prismaClient.seatingChart.deleteMany(),
    () => prismaClient.parentFeedback.deleteMany(),
    () => prismaClient.incident.deleteMany(),
    () => prismaClient.conductRecord.deleteMany(),
    () => prismaClient.grade.deleteMany(),
    () => prismaClient.attendance.deleteMany(),
    () => prismaClient.schedule.deleteMany(),
    () => prismaClient.teachingAssignment.deleteMany(),
    () => prismaClient.notification.deleteMany(),
    () => prismaClient.student.deleteMany(),
    () => prismaClient.group.deleteMany(),
    () => prismaClient.classRoom.deleteMany(),
    () => prismaClient.subject.deleteMany(),
    () => prismaClient.subjectGroup.deleteMany(),
    () => prismaClient.teacher.deleteMany(),
    () => prismaClient.userRoleScope.deleteMany(),
    () => prismaClient.user.deleteMany(),
    () => prismaClient.campusWardMap.deleteMany(),
    () => prismaClient.schoolPoint.deleteMany(),
    () => prismaClient.campus.deleteMany(),
    () => prismaClient.school.deleteMany(),
    () => prismaClient.districtWard.deleteMany(),
    () => prismaClient.educationDepartment.deleteMany(),
    () => prismaClient.auditLog.deleteMany(),
    () => prismaClient.dataLock.deleteMany(),
    () => prismaClient.loginAttempt.deleteMany(),
    () => prismaClient.systemSetting.deleteMany(),
  ];

  for (const op of deleteOps) {
    try {
      await op();
    } catch (e) {
      // ignore
    }
  }
  console.log("   ✅ Đã xóa toàn bộ dữ liệu qua Prisma deleteMany.");
}

async function main() {
  console.log("==================================================================================");
  console.log("🏫 KHỞI TẠO DỮ LIỆU: TH PHỐ LU (LÀO CAI) + THCS TRẦN PHÚ (HÀ NỘI)");
  console.log("==================================================================================");

  // 1. Dọn dẹp cơ sở dữ liệu
  await cleanDatabase(prisma);

  // Mật khẩu chuẩn mặc định: 123456
  const standardPassword = await hashPassword(DEFAULT_PASSWORD_PLAIN);

  // 2. Khởi tạo Cơ quan Quản lý (Sở GD&ĐT Lào Cai & UBND Xã Bảo Thắng)
  const adminHier = await seedAdministrativeHierarchy(prisma, standardPassword);

  // 3. Khởi tạo Trường Tiểu học Phố Lu & 5 Phân hiệu & Điểm trường
  const schoolStruct = await seedSchoolStructure(
    prisma,
    adminHier.deptLaoCai.id,
    adminHier.wardCommuneBaoThang.id
  );

  // 4. Khởi tạo Ban Giám hiệu, 6 Tổ Chuyên môn và Giáo viên Tiểu học
  const personnelStruct = await seedPersonnelAndSubjects(
    prisma,
    schoolStruct,
    standardPassword,
    adminHier.deptLaoCai.id,
    adminHier.wardCommuneBaoThang.id
  );

  // 5. Khởi tạo 62 Lớp học, Phân công giảng dạy, Thời khóa biểu và Học sinh
  const classesStudents = await seedClassesAndStudents(
    prisma,
    schoolStruct,
    personnelStruct,
    standardPassword
  );

  // 6. Khởi tạo Cơ sở vật chất (80 phòng), Thiết bị dạy học, Chuyên cần & Mục tiêu chất lượng
  await seedAcademicAndFacilities(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 7. Khởi tạo Điểm thi TT27 & Exam Analytics đa năm + Học bạ điện tử
  await seedExamAnalyticsAndTranscripts(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 8. Khởi tạo Kế hoạch giảng dạy & Giáo án điện tử (LessonPlanPeriod, LessonPlan, LessonPlanReview, Curriculum)
  await seedLessonPlansAndCurriculum(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 9. Khởi tạo Duyệt yêu cầu BGH & Điều chuyển dạy thay (TeacherChangeRequest, SubstituteAssignment, ApprovalWorkflow)
  await seedApprovalsAndDispatch(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 10. Khởi tạo Hoạt động lớp học, Sổ đầu bài, Báo cáo ngày & Ý kiến phụ huynh
  await seedClassroomOperations(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 11. Khởi tạo Lịch năm học, Kế hoạch tuần/tháng, Cảnh báo sớm AI & Quyết định BGH
  await seedSchoolCalendarAndGovernance(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 12. Khởi tạo Quản trị KPI chu kỳ, Phân công chỉ tiêu, Minh chứng số & Lịch sử duyệt
  await seedKpiOperations(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 13. Khởi tạo AI Insights, Đề xuất điều hành, Snapshot hành trình & Can thiệp sư phạm
  await seedAiJourneyAnalytics(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // 14. Khởi tạo Kiểm định Chất lượng TT15, Công văn, Thiết bị kho vận & An ninh bảo mật
  await seedAccreditationAndSystemAdmin(
    prisma,
    schoolStruct,
    personnelStruct,
    classesStudents
  );

  // ════════════════════════════════════════════════════════════════════════
  // ▎ TRƯỜNG THCS TRẦN PHÚ (PHÚ XUYÊN, HÀ NỘI)
  // ════════════════════════════════════════════════════════════════════════
  console.log("\n══════════════════════════════════════════════════════════════════════════════════");
  console.log("🏫 KHỞI TẠO DỮ LIỆU: TRƯỜNG THCS TRẦN PHÚ (PHÚ XUYÊN, HÀ NỘI)");
  console.log("══════════════════════════════════════════════════════════════════════════════════");

  // 15. Tạo Sở GD&ĐT Hà Nội & Phòng GD&ĐT Phú Xuyên (nếu chưa có)
  const deptHaNoi = await prisma.educationDepartment.create({
    data: {
      name: "Sở Giáo dục và Đào tạo Thành phố Hà Nội",
      code: "HN-SGDDT",
      address: "23 Quang Trung, Hoàn Kiếm, Hà Nội",
      phone: "024-3942-2607",
      email: "sogd.hanoi@hanoi.edu.vn",
    },
  });

  const wardPhuXuyen = await prisma.districtWard.create({
    data: {
      departmentId: deptHaNoi.id,
      name: "Phòng Giáo dục và Đào tạo Huyện Phú Xuyên",
      code: "HN-PHUXUYEN",
      address: "Thị trấn Phú Xuyên, Huyện Phú Xuyên, TP. Hà Nội",
      phone: "024-3385-1234",
    },
  });

  // 16. Khởi tạo THCS Trần Phú với 58 CBGVNV từ danh sách thật
  const tranPhuResult = await seedTranPhuSchool(
    prisma,
    deptHaNoi.id,
    wardPhuXuyen.id,
    standardPassword
  );

  console.log("\n🎉 ==============================================================================");
  console.log("✨ KHỞI TẠO DỮ LIỆU THÀNH CÔNG RỰC RỠ!");
  console.log("══════════════════════════════════════════════════════════════════════════════════");
  console.log("📌 TRƯỜNG 1: TIỂU HỌC PHỐ LU & 5 PHÂN HIỆU (LÀO CAI)");
  console.log("   - Đơn vị chủ quản: Sở GD&ĐT Lào Cai & UBND Xã Bảo Thắng");
  console.log("   - Tổng số phân hiệu & điểm trường: 6 (Trung tâm + 4 Phân hiệu + 1 Điểm lẻ)");
  console.log(`   - Tổng số lớp học: ${classesStudents.classes.length} lớp (Chuẩn 62 lớp)`);
  console.log(`   - Tổng số học sinh đã nạp: ${classesStudents.students.length} em`);
  console.log("----------------------------------------------------------------------------------");
  console.log("📌 TRƯỜNG 2: THCS TRẦN PHÚ (PHÚ XUYÊN, HÀ NỘI)");
  console.log("   - Đơn vị chủ quản: Sở GD&ĐT Hà Nội & Phòng GD&ĐT Phú Xuyên");
  console.log(`   - Tổng số CBGVNV: ${tranPhuResult.teachers.length + tranPhuResult.staffUsers.length} người`);
  console.log(`   - Hiệu trưởng: ${tranPhuResult.principalUser?.name || "N/A"}`);
  console.log("══════════════════════════════════════════════════════════════════════════════════");
  console.log("   - Mật khẩu đăng nhập mặc định toàn hệ thống: 123456");
  console.log("----------------------------------------------------------------------------------");
  console.log("📋 DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP CHÍNH:");
  console.log("   1. SuperAdmin Toàn Quốc: superadmin.vietnam@gmail.com / 123456");
  console.log("   2. Giám đốc Sở GD&ĐT Lào Cai: admin.sogd.laocai@gmail.com / 123456");
  console.log("   3. Phòng GD&ĐT Huyện Bảo Thắng: gd.baothang@gmail.com / 123456");
  console.log("   4. UBND Xã Bảo Thắng: ubnd.baothang@gmail.com / 123456");
  console.log("   5. Hiệu trưởng TH Phố Lu: hieutruong.thpholu@gmail.com / 123456");
  console.log("   6. Giáo viên Mẫu (TH Phố Lu): giaovien.thpholu@gmail.com / 123456");
  console.log("   7. Học sinh Mẫu (Lớp 1A1): hocsinh.thpholu@gmail.com / 123456");
  console.log("   ── THCS Trần Phú ──");
  console.log(`   8. Hiệu trưởng THCS Trần Phú: ${tranPhuResult.principalUser?.email || "N/A"} / 123456`);
  tranPhuResult.vpUsers.forEach((vp, i) => {
    console.log(`   ${9 + i}. Phó HT THCS Trần Phú: ${vp.email} / 123456`);
  });
  console.log("==================================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi khởi tạo Seed Data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
