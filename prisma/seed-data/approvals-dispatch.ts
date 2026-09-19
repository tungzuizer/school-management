/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts`, `src/app/api/db-seed/route.ts`, `src/lib/__tests__/academic-business-modules.test.ts`.
 * 2. Uniqueness: Dedicated seed module for TeacherChangeRequest, SubstituteAssignment, ApprovalWorkflow, and ApprovalComment.
 * 3. Data Schemas: Prisma models `TeacherChangeRequest`, `SubstituteAssignment`, `ApprovalWorkflow`, `ApprovalComment`, and enum `SubstituteStatus`.
 * 4. Verbatim User Instruction: "phần điểm thi kế hoạch giảng giạy duyệt yêu bgh chưa có dữ liệu".
 */

import { PrismaClient, SubstituteStatus } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedApprovalsAndDispatch(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n⚖️ Khởi tạo Duyệt yêu cầu Ban Giám Hiệu & Phân công Điều chuyển Dạy thay (TeacherChangeRequest, SubstituteAssignment, ApprovalWorkflow)...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser, vpUsers, teachers } = personnelStruct;
  const { classes } = classesStudents;

  // 1. Khởi tạo Yêu cầu Thay đổi / Dạy thay giáo viên (TeacherChangeRequest)
  console.log("   - Tạo các hồ sơ yêu cầu dạy thay & điều chuyển giáo viên công tác liên phân hiệu...");
  const changeRequestSpecs = [
    {
      teacherIdx: 0,
      substituteIdx: 1,
      classIdx: 0,
      subjectName: "Toán",
      reason: "Giáo viên tham gia bồi dưỡng chuyên đề Phương pháp dạy học STEM tại Sở GD&ĐT Lào Cai (3 ngày)",
      status: SubstituteStatus.APPROVED,
      reviewNote: "Hiệu trưởng đã phê duyệt phân công dạy thay. Giáo viên đi công tác bàn giao giáo án trước ngày 21/09.",
      isApproved: true,
    },
    {
      teacherIdx: 2,
      substituteIdx: 3,
      classIdx: 1,
      subjectName: "Tiếng Việt",
      reason: "Nghỉ phép ốm đột xuất, có giấy xác nhận điều trị của Bệnh viện Đa khoa huyện Bảo Thắng",
      status: SubstituteStatus.APPROVED,
      reviewNote: "Phó Hiệu trưởng Trung tâm đã bố trí giáo viên dạy thay kịp thời, đảm bảo giờ học không bị gián đoạn.",
      isApproved: true,
    },
    {
      teacherIdx: 4,
      substituteIdx: 5,
      classIdx: 20,
      subjectName: "Tiếng Anh",
      reason: "Tăng cường giáo viên dạy môn Ngoại ngữ (Tiếng Anh) từ Trung tâm lên Phân hiệu Sơn Hải (2 buổi/tuần)",
      status: SubstituteStatus.APPROVED,
      reviewNote: "Ban Giám hiệu điều động theo Kế hoạch giáo dục 2026-2027 nhằm bảo đảm 100% học sinh Khối 3-5 được học Tiếng Anh.",
      isApproved: true,
    },
    {
      teacherIdx: 6,
      substituteIdx: 7,
      classIdx: 30,
      subjectName: "Toán",
      reason: "Giáo viên nghỉ chế độ thai sản theo quy định Nhà nước",
      status: SubstituteStatus.APPROVED,
      reviewNote: "Phê duyệt hợp đồng giáo viên thỉnh giảng và phân công giáo viên cơ hữu hỗ trợ chủ nhiệm.",
      isApproved: true,
    },
    {
      teacherIdx: 8,
      substituteIdx: 9,
      classIdx: 45,
      subjectName: "Tin học và Công nghệ",
      reason: "Hỗ trợ giáo viên môn Tin học tại Phân hiệu Phố Lu 3 & Điểm trường An Tiến trong các tuần học thực hành",
      status: SubstituteStatus.PENDING,
      reviewNote: "Đang chờ Ban Giám hiệu họp rà soát định mức tiết dạy toàn trường.",
      isApproved: false,
    },
    {
      teacherIdx: 10,
      substituteIdx: 11,
      classIdx: 60,
      subjectName: "Khoa học",
      reason: "Giáo viên làm nhiệm vụ giám khảo Hội đồng thi Giáo viên dạy giỏi cấp Tỉnh",
      status: SubstituteStatus.PENDING,
      reviewNote: "Hồ sơ vừa nộp, đang chuyển Phó Hiệu trưởng phụ trách chuyên môn thẩm định.",
      isApproved: false,
    },
  ];

  for (const spec of changeRequestSpecs) {
    const currentTeacher = teachers[spec.teacherIdx % teachers.length]?.teacher || teachers[0].teacher;
    const newTeacher = teachers[spec.substituteIdx % teachers.length]?.teacher || teachers[1].teacher;
    const targetClass = classes[spec.classIdx % classes.length] || classes[0];
    const targetSubject = subjects.find((s) => s.name === spec.subjectName) || subjects[0];
    const approver = teachers[0]?.teacher;

    await prisma.teacherChangeRequest.create({
      data: {
        subjectId: targetSubject.id,
        classId: targetClass.id,
        currentTeacherId: currentTeacher.id,
        newTeacherId: newTeacher.id,
        requestedById: currentTeacher.id,
        reason: spec.reason,
        status: spec.status,
        approvedById: spec.isApproved ? approver.id : null,
        reviewNote: spec.reviewNote,
      },
    });
  }

  // 2. Khởi tạo Phân công Dạy thay thông minh có tính toán AI & Khoảng cách (SubstituteAssignment)
  console.log("   - Tạo 18 lượt phân công dạy thay có gợi ý khoảng cách km và thuật toán tối ưu AI...");
  const substituteAssignmentSpecs = [
    {
      origTeacher: "Cô Nguyễn Thị Mai",
      subTeacher: "Thầy Trần Văn Cường",
      campusName: "Điểm trường Trung tâm",
      schoolPointName: "Điểm Trung tâm",
      className: "1A1",
      subjectName: "Toán",
      date: new Date("2026-09-22"),
      period: 1,
      reason: "Dạy thay do GV chính đi tập huấn chuyên môn STEM tại Sở GD&ĐT",
      distanceKm: 0.0,
      aiRecommendation: "AI Match: Giáo viên cùng tổ khối 1, không trùng lịch tiết 1 thứ Ba, khoảng cách 0km. Độ phù hợp 98.5%.",
      status: SubstituteStatus.COMPLETED,
    },
    {
      origTeacher: "Cô Nguyễn Thị Mai",
      subTeacher: "Thầy Trần Văn Cường",
      campusName: "Điểm trường Trung tâm",
      schoolPointName: "Điểm Trung tâm",
      className: "1A1",
      subjectName: "Tiếng Việt",
      date: new Date("2026-09-22"),
      period: 2,
      reason: "Dạy thay do GV chính đi tập huấn chuyên môn STEM tại Sở GD&ĐT",
      distanceKm: 0.0,
      aiRecommendation: "AI Match: Cùng phân hiệu Trung tâm, tối ưu hóa sĩ số và năng lực bộ môn. Độ phù hợp 98.5%.",
      status: SubstituteStatus.COMPLETED,
    },
    {
      origTeacher: "Thầy Lê Văn Hoàng",
      subTeacher: "Cô Phạm Thị Dung",
      campusName: "Phân hiệu Sơn Hà 1",
      schoolPointName: "Điểm Sơn Hà 1",
      className: "2A_SH1",
      subjectName: "Toán",
      date: new Date("2026-09-23"),
      period: 3,
      reason: "Dạy thay hỗ trợ phân hiệu Sơn Hà 1",
      distanceKm: 4.2,
      aiRecommendation: "AI Match: Khoảng cách từ Trung tâm đến Sơn Hà 1 là 4.2km. GV có phương tiện di chuyển thuận lợi. Độ phù hợp 91.0%.",
      status: SubstituteStatus.APPROVED,
    },
    {
      origTeacher: "Cô Hoàng Thị Bích",
      subTeacher: "Thầy Đỗ Văn Long",
      campusName: "Phân hiệu Sơn Hải",
      schoolPointName: "Điểm Sơn Hải",
      className: "4A_SHAI",
      subjectName: "Tiếng Anh",
      date: new Date("2026-09-24"),
      period: 1,
      reason: "Tăng cường dạy Ngoại ngữ phân hiệu vùng cao Sơn Hải",
      distanceKm: 6.8,
      aiRecommendation: "AI Match: GV Tiếng Anh thâm niên 8 năm, có chứng chỉ giảng dạy phương pháp liên trường. Độ phù hợp 89.5%.",
      status: SubstituteStatus.APPROVED,
    },
    {
      origTeacher: "Thầy Vũ Quốc Tuấn",
      subTeacher: "Cô Nguyễn Thị Thu",
      campusName: "Điểm trường An Tiến",
      schoolPointName: "Điểm An Tiến",
      className: "1A_AT",
      subjectName: "Tin học và Công nghệ",
      date: new Date("2026-09-25"),
      period: 4,
      reason: "Dạy thực hành máy tính cho học sinh điểm An Tiến",
      distanceKm: 8.5,
      aiRecommendation: "AI Match: Điều phối giáo viên lưu động hỗ trợ điểm khó khăn An Tiến. Độ phù hợp 87.0%.",
      status: SubstituteStatus.APPROVED,
    },
  ];

  for (const spec of substituteAssignmentSpecs) {
    await prisma.substituteAssignment.create({
      data: {
        originalTeacher: spec.origTeacher,
        substituteTeacher: spec.subTeacher,
        campusName: spec.campusName,
        schoolPointName: spec.schoolPointName,
        className: spec.className,
        subjectName: spec.subjectName,
        date: spec.date,
        period: spec.period,
        status: spec.status,
        reason: spec.reason,
        distanceKm: spec.distanceKm,
        aiRecommendation: spec.aiRecommendation,
      },
    });
  }

  // 3. Khởi tạo Quy trình Phê duyệt Kế hoạch Ban Giám Hiệu (ApprovalWorkflow & ApprovalComment)
  console.log("   - Tạo Quy trình Phê duyệt Kế hoạch BGH & Ý kiến chỉ đạo nghiệp vụ...");
  const workflowSpecs = [
    {
      moduleName: "ANNUAL_PLAN",
      recordId: school.id,
      title: "Phê duyệt Kế hoạch Giáo dục Nhà trường Năm học 2026-2027 (Trường TH Phố Lu & 5 Phân hiệu)",
      campusId: campuses[0]?.campus.id,
      currentStep: 5,
      currentStatus: "PRINCIPAL_APPROVED",
      submittedBy: vpUsers[0]?.id || principalUser.id,
      submittedByName: vpUsers[0]?.name || "ThS. Nguyễn Văn Trung (PHT)",
      reviewedBy: vpUsers[0]?.id || principalUser.id,
      reviewedByName: "ThS. Nguyễn Văn Trung (Phó Hiệu trưởng)",
      reviewedAt: new Date("2026-09-02"),
      approvedBy: principalUser.id,
      approvedByName: principalUser.name,
      approvedAt: new Date("2026-09-04"),
      isLocked: true,
      lockedAt: new Date("2026-09-05"),
      comments: [
        { role: "VICE_PRINCIPAL", name: "ThS. Nguyễn Văn Trung (PHT)", comment: "Đã tổng hợp đầy đủ số liệu 62 lớp và 6 phân hiệu, hồ sơ chuẩn bị hoàn chỉnh.", type: "APPROVE" },
        { role: "PRINCIPAL", name: principalUser.name, comment: "Hiệu trưởng ký quyết định ban hành và chỉ đạo triển khai thực hiện trong toàn trường.", type: "APPROVE" },
      ],
    },
    {
      moduleName: "FACILITY_ESTIMATE",
      recordId: campuses[3]?.campus.id || school.id,
      title: "Tờ trình Mua sắm Bổ sung 25 Bộ máy tính và Thiết bị STEM cho Phân hiệu Sơn Hải & Sơn Hà 2",
      campusId: campuses[3]?.campus.id,
      currentStep: 3,
      currentStatus: "VP_REVIEWED",
      submittedBy: vpUsers[1]?.id || principalUser.id,
      submittedByName: "Thầy Lê Văn Hải (PHT Sơn Hải)",
      reviewedBy: principalUser.id,
      reviewedByName: "Nguyễn Thị Phương Mai (Kế toán trưởng)",
      reviewedAt: new Date("2026-09-10"),
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      isLocked: false,
      comments: [
        { role: "VICE_PRINCIPAL", name: "Thầy Lê Văn Hải (PHT Sơn Hải)", comment: "Phân hiệu Sơn Hải rất cần thêm thiết bị thực hành để đáp ứng số lượng 10 lớp học.", type: "COMMENT" },
        { role: "ACCOUNTANT", name: "Nguyễn Thị Phương Mai (Kế toán trưởng)", comment: "Kế toán đã cân đối nguồn ngân sách chi thường xuyên và kinh phí chương trình mục tiêu.", type: "COMMENT" },
      ],
    },
    {
      moduleName: "LESSON_PLAN_CAMPAIGN",
      recordId: school.id,
      title: "Kế hoạch Tổ chức Ngày hội STEM & Hội thi Giáo viên dạy giỏi cấp Cụm Phân hiệu Tháng 11/2026",
      campusId: campuses[0]?.campus.id,
      currentStep: 5,
      currentStatus: "PRINCIPAL_APPROVED",
      submittedBy: teachers[0]?.user?.id || principalUser.id,
      submittedByName: "Cô Đào Thị Linh (Tổ trưởng Đặc thù)",
      reviewedBy: vpUsers[0]?.id || principalUser.id,
      reviewedByName: "ThS. Nguyễn Văn Trung (PHT)",
      reviewedAt: new Date("2026-09-12"),
      approvedBy: principalUser.id,
      approvedByName: principalUser.name,
      approvedAt: new Date("2026-09-14"),
      isLocked: true,
      lockedAt: new Date("2026-09-14"),
      comments: [
        { role: "SUBJECT_HEAD", name: "Cô Đào Thị Linh (Tổ trưởng)", comment: "Đã xây dựng thể lệ hội thi và tiêu chí chấm giải sản phẩm STEM.", type: "APPROVE" },
        { role: "PRINCIPAL", name: principalUser.name, comment: "Hiệu trưởng phê duyệt và phân công các phân hiệu phối hợp chuẩn bị địa điểm.", type: "APPROVE" },
      ],
    },
    {
      moduleName: "EQUIPMENT_TRANSFER",
      recordId: campuses[5]?.campus.id || school.id,
      title: "Điều chuyển Thiết bị dạy học số và Bàn ghế chuyên dụng sang Điểm trường vùng cao An Tiến",
      campusId: campuses[5]?.campus.id,
      currentStep: 5,
      currentStatus: "PRINCIPAL_APPROVED",
      submittedBy: vpUsers[0]?.id || principalUser.id,
      submittedByName: "Thầy Phạm Văn Tiến (PHT An Tiến)",
      reviewedBy: vpUsers[0]?.id || principalUser.id,
      reviewedByName: "ThS. Nguyễn Văn Trung (PHT)",
      reviewedAt: new Date("2026-09-06"),
      approvedBy: principalUser.id,
      approvedByName: principalUser.name,
      approvedAt: new Date("2026-09-08"),
      isLocked: true,
      lockedAt: new Date("2026-09-08"),
      comments: [
        { role: "VICE_PRINCIPAL", name: "Thầy Phạm Văn Tiến (PHT An Tiến)", comment: "Báo cáo thực trạng CSVC điểm lẻ và đề xuất hỗ trợ từ trường trung tâm.", type: "APPROVE" },
        { role: "PRINCIPAL", name: principalUser.name, comment: "Hiệu trưởng phê duyệt điều chuyển ngay trong tuần 3 của năm học.", type: "APPROVE" },
      ],
    },
  ];

  for (const wf of workflowSpecs) {
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        schoolId: school.id,
        moduleName: wf.moduleName,
        recordId: wf.recordId,
        title: wf.title,
        campusId: wf.campusId,
        currentStep: wf.currentStep,
        currentStatus: wf.currentStatus,
        submittedBy: wf.submittedBy,
        submittedByName: wf.submittedByName,
        reviewedBy: wf.reviewedBy,
        reviewedByName: wf.reviewedByName,
        reviewedAt: wf.reviewedAt,
        approvedBy: wf.approvedBy,
        approvedByName: wf.approvedByName,
        approvedAt: wf.approvedAt,
        isLocked: wf.isLocked,
        lockedAt: wf.lockedAt,
      },
    });

    if (wf.comments && wf.comments.length > 0) {
      for (const cm of wf.comments) {
        await prisma.approvalComment.create({
          data: {
            workflowId: workflow.id,
            userId: principalUser.id,
            userName: cm.name,
            userRole: cm.role,
            commentType: cm.type,
            commentContent: cm.comment,
            createdAt: new Date("2026-09-08"),
          },
        });
      }
    }
  }

  console.log(`   ✅ Đã nạp thành công 6 yêu cầu thay đổi GV, 5 lượt phân công dạy thay và 4 quy trình phê duyệt BGH.`);
}
