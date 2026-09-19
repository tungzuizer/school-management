/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 29), `src/app/api/db-seed/route.ts` (line 30).
 * 2. Uniqueness: Dedicated seed module for TT15 Accreditation, Official Documents, Equipment Logistics, System Audit, Security & Data Locks.
 * 3. Data Schemas: Prisma models for TT15Indicator, SchoolPointEvaluation, SchoolPointEvaluationDetail, TT15EvidenceFile, OfficialDocument, Equipment, EquipmentTransfer, SystemEvidenceFile, FileAuditLog, AuditLog, DataLock, LoginAttempt, SystemSetting, TranscriptUnlockRequest.
 * 4. Verbatim User Instruction: "tôi muốn bạn thêm dữ liệu mô phỏng cho tất cả dữ liệu".
 */

import {
  PrismaClient,
  TT15Standard,
  EvaluationStatus,
  DocumentType,
  DocumentUrgency,
  DocumentStatus,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
  AuditAction,
  UnlockStatus,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedAccreditationAndSystemAdmin(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n🏛️ Khởi tạo Kiểm định Chất lượng TT15/2020, Quản lý Công văn, Thiết bị Kho vận & Bảo mật Hệ thống...");
  const { school, campuses } = schoolStruct;
  const schoolPoints = campuses.map((c) => c.schoolPoint);
  const { principalUser, vpUsers, teachers } = personnelStruct;
  const { students } = classesStudents;

  // 1. Khởi tạo Danh mục Tiêu chí Chuẩn TT15 (TT15Indicator)
  console.log("   - Tạo 14 tiêu chí chuẩn kiểm định chất lượng giáo dục và công nhận trường đạt chuẩn quốc gia...");
  const tt15Indicators = [
    { std: TT15Standard.STANDARD_1, code: "TC1.1", name: "Phương hướng, chiến lược xây dựng và phát triển nhà trường", desc: "Có kế hoạch chiến lược phát triển phù hợp với mục tiêu giáo dục tiểu học và điều kiện kinh tế - xã hội địa phương." },
    { std: TT15Standard.STANDARD_1, code: "TC1.2", name: "Hội đồng trường và các hội đồng khác", desc: "Hội đồng trường được thành lập đúng quy định, hoạt động hiệu quả theo Điều lệ trường tiểu học." },
    { std: TT15Standard.STANDARD_1, code: "TC1.3", name: "Tổ chức bộ máy, tổ chuyên môn và tổ văn phòng", desc: "Cơ cấu tổ chức bộ máy hoàn chỉnh, sinh hoạt chuyên môn định kỳ 2 tuần/lần bảo đảm chất lượng." },
    { std: TT15Standard.STANDARD_2, code: "TC2.1", name: "Cán bộ quản lý (Hiệu trưởng, Phó Hiệu trưởng)", desc: "Đạt chuẩn trình độ đào tạo từ Thạc sĩ/Cử nhân trở lên, có năng lực quản trị trường học xuất sắc." },
    { std: TT15Standard.STANDARD_2, code: "TC2.2", name: "Giáo viên và nhân viên", desc: "100% giáo viên đạt chuẩn đào tạo theo Luật Giáo dục 2019, 85% trên chuẩn." },
    { std: TT15Standard.STANDARD_2, code: "TC2.3", name: "Học sinh và quyền của học sinh", desc: "Bảo đảm quyền học tập, quyền được bảo vệ, chăm sóc sức khỏe và phát triển năng khiếu toàn diện." },
    { std: TT15Standard.STANDARD_3, code: "TC3.1", name: "Khuôn viên, sân chơi, bãi tập và cảnh quan sư phạm", desc: "Môi trường xanh - sạch - đẹp - an toàn, có sân bóng đá mini, sân bóng rổ và khu trải nghiệm STEM." },
    { std: TT15Standard.STANDARD_3, code: "TC3.2", name: "Khối phòng học, phòng học bộ môn và thư viện", desc: "Đủ 1 phòng học/lớp, thư viện đạt chuẩn mức 2 xuất sắc, phòng Tin học và Ngoại ngữ hiện đại." },
    { std: TT15Standard.STANDARD_3, code: "TC3.3", name: "Thiết bị dạy học và học liệu số", desc: "Trang bị đầy đủ thiết bị dạy học tối thiểu theo Thông tư 37/2021/TT-BGDĐT và kho học liệu số phong phú." },
    { std: TT15Standard.STANDARD_4, code: "TC4.1", name: "Ban đại diện cha mẹ học sinh", desc: "Phối hợp chặt chẽ, hiệu quả với nhà trường trong công tác giáo dục và quản lý học sinh." },
    { std: TT15Standard.STANDARD_4, code: "TC4.2", name: "Công tác tham mưu và huy động nguồn lực xã hội hóa", desc: "Tham mưu kịp thời với cấp ủy, chính quyền địa phương và huy động các nguồn lực hợp pháp phát triển nhà trường." },
    { std: TT15Standard.STANDARD_5, code: "TC5.1", name: "Kế hoạch giáo dục và đổi mới phương pháp dạy học", desc: "Thực hiện nghiêm túc Chương trình GDPT 2018, phát huy tính tích cực, chủ động, sáng tạo của học sinh." },
    { std: TT15Standard.STANDARD_5, code: "TC5.2", name: "Kết quả giáo dục toàn diện học sinh", desc: "100% học sinh hoàn thành chương trình lớp học, tỷ lệ học sinh xuất sắc và tiêu biểu đạt trên 55%." },
    { std: TT15Standard.STANDARD_5, code: "TC5.3", name: "Hoạt động trải nghiệm, giáo dục kỹ năng sống và STEM", desc: "Tổ chức thường xuyên các hoạt động giáo dục địa phương, bảo tồn văn hóa các dân tộc Lào Cai." },
  ];

  const createdIndicators: any[] = [];
  for (const ind of tt15Indicators) {
    const indicator = await prisma.tT15Indicator.upsert({
      where: { code: ind.code },
      update: {
        name: ind.name,
        description: ind.desc,
        standard: ind.std,
      },
      create: {
        standard: ind.std,
        code: ind.code,
        name: ind.name,
        description: ind.desc,
        isActive: true,
      },
    });
    createdIndicators.push(indicator);
  }

  // 2. Khởi tạo Đánh giá Điểm trường TT15 & Minh chứng tệp số (SchoolPointEvaluation, SchoolPointEvaluationDetail, TT15EvidenceFile)
  console.log("   - Tạo Hồ sơ Đánh giá Kiểm định chất lượng cho 6 điểm trường kèm tệp minh chứng...");
  for (let idx = 0; idx < schoolPoints.length; idx++) {
    const sp = schoolPoints[idx];
    const targetCampus = campuses.find((c) => c.schoolPoint.id === sp.id)?.campus || campuses[0].campus;

    const evalRecord = await prisma.schoolPointEvaluation.upsert({
      where: {
        schoolPointId_year_semester: {
          schoolPointId: sp.id,
          year: 2026,
          semester: 1,
        },
      },
      update: {
        totalScore: 96.5,
        status: EvaluationStatus.APPROVED,
        notes: `Đánh giá định kỳ kỳ 1 năm học 2026-2027 tại ${sp.name}. Cơ sở vật chất và chuyên môn đạt chuẩn mức độ 2.`,
      },
      create: {
        schoolPointId: sp.id,
        campusId: targetCampus.id,
        year: 2026,
        semester: 1,
        status: EvaluationStatus.APPROVED,
        vicePrincipalId: vpUsers[idx % vpUsers.length]?.id || principalUser.id,
        principalId: principalUser.id,
        totalScore: 96.5,
        notes: `Đánh giá định kỳ kỳ 1 năm học 2026-2027 tại ${sp.name}. Cơ sở vật chất và chuyên môn đạt chuẩn mức độ 2.`,
      },
    });

    // Tạo chi tiết đánh giá cho 5 tiêu chí đại diện
    for (let j = 0; j < Math.min(5, createdIndicators.length); j++) {
      const ind = createdIndicators[j];
      const detail = await prisma.schoolPointEvaluationDetail.upsert({
        where: {
          evaluationId_indicatorId: {
            evaluationId: evalRecord.id,
            indicatorId: ind.id,
          },
        },
        update: {
          selfAssessment: "Đạt mức 3 (Mức xuất sắc)",
          score: 10.0,
          notes: "Có đầy đủ văn bản chỉ đạo, nghị quyết chi bộ và biên bản họp phụ huynh minh chứng.",
          principalComment: "Hiệu trưởng thẩm định đạt xuất sắc.",
        },
        create: {
          evaluationId: evalRecord.id,
          indicatorId: ind.id,
          selfAssessment: "Đạt mức 3 (Mức xuất sắc)",
          score: 10.0,
          notes: "Có đầy đủ văn bản chỉ đạo, nghị quyết chi bộ và biên bản họp phụ huynh minh chứng.",
          vpEvaluatedAt: new Date("2026-09-12"),
          principalComment: "Hiệu trưởng thẩm định đạt xuất sắc.",
        },
      });

      // Tạo file minh chứng thật
      await prisma.tT15EvidenceFile.create({
        data: {
          evaluationDetailId: detail.id,
          fileName: `Minh_chung_${ind.code}_${sp.code}.pdf`,
          fileUrl: `https://storage.thpholu.laocai.edu.vn/tt15/${ind.code}_${sp.code}.pdf`,
          fileType: "PDF",
          fileSize: 2458000,
          uploadedById: principalUser.id,
          description: `Tệp hồ sơ minh chứng kiểm định chất lượng tiêu chí ${ind.name} tại ${sp.name}.`,
        },
      });
    }
  }

  // 3. Khởi tạo 15 Công văn & Văn bản chỉ đạo quản lý (OfficialDocument)
  console.log("   - Tạo 15 hồ sơ Công văn đến, Công văn đi & Chỉ đạo nội bộ BGH...");
  const docSpecs = [
    {
      docNum: "842/SGDĐT-GDTH",
      title: "V/v Hướng dẫn thực hiện nhiệm vụ năm học 2026-2027 cấp Tiểu học",
      issuer: "Sở Giáo dục và Đào tạo tỉnh Lào Cai",
      type: DocumentType.INCOMING,
      urgency: DocumentUrgency.URGENT,
      status: DocumentStatus.COMPLETED,
      summary: "Hướng dẫn triển khai toàn diện chương trình GDPT 2018, tăng cường giáo dục STEM, Tiếng Anh và kỹ năng số.",
      action: "Ban Giám hiệu cụ thể hóa vào Kế hoạch giáo dục 2026-2027 và triển khai đến 100% giáo viên trước 05/09.",
      deadline: new Date("2026-09-05"),
    },
    {
      docNum: "315/PGDĐT-CM",
      title: "V/v Tổ chức Hội thi Giáo viên dạy giỏi và Ngày hội STEM cấp Huyện Bảo Thắng",
      issuer: "Phòng GD&ĐT Huyện Bảo Thắng",
      type: DocumentType.INCOMING,
      urgency: DocumentUrgency.NORMAL,
      status: DocumentStatus.PROCESSING,
      summary: "Kế hoạch tổ chức hội thi nhằm nâng cao năng lực sư phạm và lan tỏa mô hình giáo dục trải nghiệm sáng tạo.",
      action: "Tổ chuyên môn lựa chọn 6 giáo viên xuất sắc từ các phân hiệu và chuẩn bị 3 sản phẩm STEM tham gia dự thi.",
      deadline: new Date("2026-10-15"),
    },
    {
      docNum: "128/QĐ-THPL",
      title: "Quyết định Ban hành Kế hoạch Giáo dục Nhà trường Năm học 2026-2027",
      issuer: "Trường Tiểu học Phố Lu",
      type: DocumentType.OUTGOING,
      urgency: DocumentUrgency.NORMAL,
      status: DocumentStatus.COMPLETED,
      summary: "Ban hành chính thức khung kế hoạch giáo dục bao gồm 62 lớp học trên 6 phân hiệu trường.",
      action: "Công khai trên Cổng thông tin điện tử nhà trường và gửi Phòng GD&ĐT phê duyệt.",
      deadline: new Date("2026-09-10"),
    },
    {
      docNum: "08/TB-BGH",
      title: "Thông báo Lịch kiểm tra nền nếp chuyên môn và hồ sơ bán trú các phân hiệu tháng 9/2026",
      issuer: "Ban Giám hiệu Trường TH Phố Lu",
      type: DocumentType.INTERNAL_DIRECTIVE,
      urgency: DocumentUrgency.NORMAL,
      status: DocumentStatus.COMPLETED,
      summary: "Lịch kiểm tra đột xuất và định kỳ công tác giảng dạy, sổ đầu bài, vệ sinh bán trú tại 5 phân hiệu.",
      action: "Phó Hiệu trưởng phụ trách các phân hiệu và Tổ kiểm tra thực hiện theo lịch phân công.",
      deadline: new Date("2026-09-30"),
    },
    {
      docNum: "520/UBND-VX",
      title: "V/v Phối hợp bảo đảm an toàn giao thông trước cổng trường và an ninh trật tự mùa khai giảng",
      issuer: "UBND Huyện Bảo Thắng",
      type: DocumentType.INCOMING,
      urgency: DocumentUrgency.EXPRESS,
      status: DocumentStatus.COMPLETED,
      summary: "Tăng cường tuần tra, phân luồng giao thông tại điểm trường Trung tâm và các phân hiệu trên trục đường tỉnh lộ.",
      action: "Tổng phụ trách Đội kích hoạt mô hình 'Cổng trường an toàn giao thông'.",
      deadline: new Date("2026-09-06"),
    },
  ];

  for (let d = 0; d < 15; d++) {
    const spec = docSpecs[d % docSpecs.length];
    const issueD = new Date("2026-08-25");
    issueD.setDate(issueD.getDate() + (d % 20));

    await prisma.officialDocument.create({
      data: {
        schoolId: school.id,
        campusId: campuses[d % campuses.length]?.campus.id,
        docNumber: `${spec.docNum}-${d + 1}`,
        title: spec.title,
        issuer: spec.issuer,
        issueDate: issueD,
        receivedDate: issueD,
        deadline: spec.deadline,
        docType: spec.type,
        urgency: spec.urgency,
        status: spec.status,
        summary: spec.summary,
        actionRequired: spec.action,
        assignedToId: principalUser.id,
        assignedToName: principalUser.name,
        fileUrl: `https://storage.thpholu.laocai.edu.vn/docs/VB_${d + 1}.pdf`,
        completedAt: spec.status === DocumentStatus.COMPLETED ? new Date("2026-09-12") : null,
      },
    });
  }

  // 4. Khởi tạo Thiết bị dạy học & Điều chuyển kho vận liên cơ sở (Equipment, EquipmentTransfer)
  console.log("   - Tạo 20 danh mục Thiết bị dạy học số & Lượt điều chuyển liên phân hiệu...");
  const equipmentSpecs = [
    { code: "TB-IT-01", name: "Dàn máy vi tính học sinh thực hành FPT Core i5", cat: EquipmentCategory.IT_COMPUTER, qty: 30, unit: "bộ", loc: "Phòng máy Tin học số 1 - Trung tâm" },
    { code: "TB-IT-02", name: "Dàn máy vi tính Phân hiệu Sơn Hà 1", cat: EquipmentCategory.IT_COMPUTER, qty: 15, unit: "bộ", loc: "Phòng đa năng Sơn Hà 1" },
    { code: "TB-PRJ-01", name: "Màn hình tương tác thông minh Samsung Flip 75 inch", cat: EquipmentCategory.PROJECTOR_SCREEN, qty: 8, unit: "chiếc", loc: "Khối phòng học lớp 1 - Trung tâm" },
    { code: "TB-STEM-01", name: "Bộ đồ dùng thực hành Khoa học & STEM Tiểu học lớp 4-5", cat: EquipmentCategory.LAB_BIOLOGY, qty: 12, unit: "bộ", loc: "Phòng Lab STEM Trung tâm" },
    { code: "TB-SPORT-01", name: "Bộ dụng cụ Thể dục thể thao và Rèn luyện thể chất", cat: EquipmentCategory.SPORTS, qty: 25, unit: "bộ", loc: "Nhà tập đa năng" },
    { code: "TB-MUSIC-01", name: "Bộ nhạc cụ gõ và Đàn Organ Yamaha giảng dạy Âm nhạc", cat: EquipmentCategory.MUSIC_ARTS, qty: 10, unit: "chiếc", loc: "Phòng Âm nhạc" },
  ];

  const createdEquipments: any[] = [];
  for (let e = 0; e < equipmentSpecs.length; e++) {
    const spec = equipmentSpecs[e];
    const sp = schoolPoints[e % schoolPoints.length];
    const targetCampus = campuses.find((c) => c.schoolPoint.id === sp.id)?.campus || campuses[0].campus;

    const eq = await prisma.equipment.upsert({
      where: { code: spec.code },
      update: {
        totalQuantity: spec.qty,
        availableQuantity: spec.qty - 2,
        inUseQuantity: spec.qty - 2,
        brokenQuantity: 0,
        condition: EquipmentCondition.EXCELLENT,
      },
      create: {
        schoolId: school.id,
        campusId: targetCampus.id,
        schoolPointId: sp.id,
        code: spec.code,
        name: spec.name,
        category: spec.cat,
        totalQuantity: spec.qty,
        availableQuantity: spec.qty - 2,
        inUseQuantity: spec.qty - 2,
        brokenQuantity: 0,
        condition: EquipmentCondition.EXCELLENT,
        unit: spec.unit,
        locationDetail: spec.loc,
      },
    });
    createdEquipments.push(eq);
  }

  // Điều chuyển thiết bị giữa Trung tâm và Phân hiệu vùng cao
  if (createdEquipments.length > 0 && schoolPoints.length >= 2) {
    const targetPointId = schoolPoints[3]?.id || schoolPoints[1]?.id || schoolPoints[0].id;
    await prisma.equipmentTransfer.create({
      data: {
        schoolId: school.id,
        equipmentId: createdEquipments[0].id,
        fromSchoolPointId: schoolPoints[0].id,
        toSchoolPointId: targetPointId,
        quantity: 5,
        transferDate: new Date("2026-09-08"),
        returnExpectedDate: new Date("2026-11-20"),
        reason: "Tăng cường 5 bộ máy vi tính cho Phân hiệu Sơn Hải phục vụ kỳ thi khảo sát trực tuyến.",
        status: TransferStatus.COMPLETED,
        approvedById: principalUser.id,
        aiRecommendation: "AI Logistics Match: Điểm Trung tâm đang dư 8 máy sẵn sàng. Khoảng cách vận chuyển an toàn 6.8km.",
      },
    });
  }

  // 5. Khởi tạo Tệp Minh chứng Hệ thống & Nhật ký File (SystemEvidenceFile, FileAuditLog)
  console.log("   - Tạo Kho Tệp Minh chứng Số hóa tập trung & Nhật ký Kiểm toán File...");
  for (let f = 0; f < 10; f++) {
    const file = await prisma.systemEvidenceFile.create({
      data: {
        fileName: `Quyet_dinh_Giao_duc_Pho_Lu_0${f + 1}.pdf`,
        fileType: "pdf",
        fileSize: 1850000 + f * 120000,
        fileUrl: `https://storage.thpholu.laocai.edu.vn/system/QD_PL_0${f + 1}.pdf`,
        uploadedById: principalUser.id,
        uploadedByName: principalUser.name,
        relatedModule: "QUALITY_OBJECTIVE",
        relatedRecordId: school.id,
        relatedContent: "Hồ sơ lưu trữ Quyết định và Báo cáo kiểm định chất lượng",
        campusId: campuses[0]?.campus.id,
        description: `Tệp số hóa có chữ ký số điện tử của Hiệu trưởng. Bản ghi thứ ${f + 1}.`,
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
      },
    });

    await prisma.fileAuditLog.create({
      data: {
        fileId: file.id,
        action: "UPLOAD",
        performedById: principalUser.id,
        performedByName: principalUser.name,
        detail: "Tải lên tệp gốc và ký số điện tử xác thực SHA-256.",
      },
    });
  }

  // 6. Khởi tạo Nhật ký Kiểm toán Hoạt động & An ninh Bảo mật (AuditLog, DataLock, LoginAttempt, SystemSetting)
  console.log("   - Tạo 25 Nhật ký Kiểm toán An ninh (AuditLog), Khóa dữ liệu (DataLock), Lịch sử Đăng nhập & Cài đặt...");
  const auditActions = [
    { action: AuditAction.LOGIN, entity: "User", desc: "Đăng nhập thành công vào trang quản trị BGH" },
    { action: AuditAction.APPROVE, entity: "ApprovalWorkflow", desc: "Hiệu trưởng ký duyệt Kế hoạch giáo dục 2026-2027" },
    { action: AuditAction.LOCK, entity: "DataLock", desc: "Khóa sổ điểm thi Giữa kỳ 1 năm học 2026-2027" },
    { action: AuditAction.UPDATE, entity: "KpiValue", desc: "Cập nhật số liệu hoàn thành mục tiêu chuyên cần tháng 9" },
    { action: AuditAction.EXPORT, entity: "StudentScore", desc: "Xuất báo cáo thống kê chất lượng học tập gửi Phòng GD&ĐT" },
  ];

  for (let a = 0; a < 25; a++) {
    const act = auditActions[a % auditActions.length];
    const logDate = new Date("2026-09-01");
    logDate.setDate(logDate.getDate() + (a % 18));

    await prisma.auditLog.create({
      data: {
        userId: principalUser.id,
        userName: principalUser.name,
        userRole: "SUPER_ADMIN",
        schoolId: school.id,
        campusId: campuses[a % campuses.length]?.campus.id,
        action: act.action,
        entityName: act.entity,
        entityId: school.id,
        description: act.desc,
        changesJson: JSON.stringify({ status: "SUCCESS", ip: "118.70.192.45", browser: "Chrome 128 (Windows 11)" }),
        ipAddress: "118.70.192.45",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0",
        createdAt: logDate,
      },
    });
  }

  // Khởi tạo Khóa Sổ Dữ Liệu (DataLock)
  const lockSpecs = [
    { type: "GRADE_MIDTERM_HK1", label: "Điểm Giữa Học kỳ 1 - 2026-2027", locked: false },
    { type: "GRADE_FINAL_HK1", label: "Điểm Cuối Học kỳ 1 - 2025-2026", locked: true },
    { type: "ATTENDANCE_MONTH_9", label: "Chuyên cần Tháng 9/2026", locked: false },
    { type: "TRANSCRIPT_2025_2026", label: "Học bạ số Năm học 2025-2026", locked: true },
  ];

  for (const l of lockSpecs) {
    await prisma.dataLock.upsert({
      where: {
        schoolId_lockType_periodLabel: {
          schoolId: school.id,
          lockType: l.type,
          periodLabel: l.label,
        },
      },
      update: {
        isLocked: l.locked,
        lockedById: l.locked ? principalUser.id : null,
        lockedByName: l.locked ? principalUser.name : null,
        lockedAt: l.locked ? new Date("2026-05-30") : null,
        reason: l.locked ? "Khóa số liệu chính thức theo quy chế lưu trữ học bạ điện tử." : null,
      },
      create: {
        schoolId: school.id,
        campusId: campuses[0]?.campus.id,
        lockType: l.type,
        periodLabel: l.label,
        isLocked: l.locked,
        lockedById: l.locked ? principalUser.id : null,
        lockedByName: l.locked ? principalUser.name : null,
        lockedAt: l.locked ? new Date("2026-05-30") : null,
        reason: l.locked ? "Khóa số liệu chính thức theo quy chế lưu trữ học bạ điện tử." : null,
      },
    });
  }

  // Khởi tạo Lịch sử Đăng nhập (LoginAttempt)
  const loginEmails = [
    "superadmin.pholu@laocai.edu.vn",
    "hieutruong.thpholu@laocai.edu.vn",
    "pht.trungtam@laocai.edu.vn",
    "ketoan.thpholu@laocai.edu.vn",
    "gv.sonha1@laocai.edu.vn",
  ];

  for (let li = 0; li < 20; li++) {
    const email = loginEmails[li % loginEmails.length];
    await prisma.loginAttempt.create({
      data: {
        email: email,
        ipAddress: `118.70.192.${10 + (li % 50)}`,
        success: true,
        reason: "Login verified via argon2 credentials",
      },
    });
  }

  // Khởi tạo Cài đặt Hệ thống (SystemSetting)
  const settings = [
    { key: "SYSTEM_SCHOOL_NAME", value: "Trường Tiểu học Phố Lu & 5 Phân hiệu (Lào Cai)" },
    { key: "ACADEMIC_YEAR_CURRENT", value: "2026-2027" },
    { key: "MULTI_CAMPUS_COUNT", value: "6" },
    { key: "DEFAULT_PASSWORD_POLICY", value: "DEFAULT_123456_NO_FORCE_DEMO" },
    { key: "AI_EARLY_WARNING_ENABLED", value: "true" },
    { key: "DIGITAL_SIGNATURE_MODE", value: "GOVERNMENT_STANDARD_SHA256" },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  // Khởi tạo Yêu cầu Mở khóa Học bạ (TranscriptUnlockRequest)
  const transcripts = await prisma.academicTranscript.findMany({ where: { schoolYear: "2025-2026" } });
  if (transcripts.length > 0) {
    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId: transcripts[0].id,
        requestedById: teachers[0]?.teacher?.id || principalUser.id,
        reason: "Cập nhật giải thưởng Học sinh giỏi môn Cờ vua cấp Tỉnh được công nhận bổ sung.",
        status: UnlockStatus.APPROVED,
        reviewedById: principalUser.id,
        reviewedAt: new Date("2026-06-05"),
        reviewNote: "Chấp thuận mở khóa 24h để cập nhật khen thưởng cấp Tỉnh.",
      },
    });
  }

  console.log(`   ✅ Đã nạp thành công Tiêu chuẩn TT15, Đánh giá 6 Điểm trường, 15 Công văn, Thiết bị kho vận, 25 AuditLog, DataLocks, LoginAttempts và Cài đặt hệ thống.`);
}
