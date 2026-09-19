/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 28), `src/app/api/db-seed/route.ts` (line 29).
 * 2. Uniqueness: Dedicated seed module for AiConfigThreshold, AiAlert, AiRecommendation, AiReportSummary, AiAnalysisLog, JourneyThresholdConfig, StudentJourneySnapshot, InterventionRecord, StudentImportBatch, StudentImportStaging, StudentImportMapping.
 * 3. Data Schemas: Prisma models for multi-campus AI analytics and student journey intelligence.
 * 4. Verbatim User Instruction: "tôi muốn bạn thêm dữ liệu mô phỏng cho tất cả dữ liệu".
 */

import {
  PrismaClient,
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
  TrendLabel,
  TriggerSource,
  InterventionStatus,
  ImportBatchStatus,
  MatchConfidence,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedAiJourneyAnalytics(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n🤖 Khởi tạo Hệ thống Phân tích AI Insights, Hành trình Học sinh & Can thiệp Thông minh...");
  const { school, campuses } = schoolStruct;
  const schoolPoints = campuses.map((c) => c.schoolPoint);
  const { principalUser, vpUsers, subjects } = personnelStruct;
  const { students, classes } = classesStudents;

  // 1. Khởi tạo Cấu hình Ngưỡng Cảnh báo AI (AiConfigThreshold)
  console.log("   - Tạo 7 cấu hình ngưỡng cảnh báo thông minh theo 7 nhóm tác vụ AI...");
  const thresholdConfigs = [
    {
      taskGroup: AiTaskGroup.REALTIME_MONITORING,
      metricKey: "MAX_ABSENT_RATE_DAILY",
      metricName: "Tỷ lệ vắng mặt học sinh trong ngày",
      val: 5.0,
      op: "GTE",
      sev: AiAlertSeverity.HIGH,
      desc: "Cảnh báo khi tỷ lệ vắng mặt toàn phân hiệu vượt quá 5% tổng số học sinh.",
    },
    {
      taskGroup: AiTaskGroup.COORDINATION_DISPATCH,
      metricKey: "TEACHER_LEAVE_UNCOVERED_HOURS",
      metricName: "Thời gian trống tiết chưa có giáo viên dạy thay",
      val: 2.0,
      op: "GTE",
      sev: AiAlertSeverity.CRITICAL,
      desc: "Kích hoạt điều phối tự động khi có tiết học vắng giáo viên quá 2 giờ chưa được xếp người dạy thay.",
    },
    {
      taskGroup: AiTaskGroup.DECISION_SUPPORT,
      metricKey: "KPI_UNDERPERFORM_CAMPUS_COUNT",
      metricName: "Số phân hiệu có chỉ số KPI chậm tiến độ",
      val: 2.0,
      op: "GTE",
      sev: AiAlertSeverity.MEDIUM,
      desc: "Gợi ý Ban Giám hiệu tổ chức họp giao ban đột xuất khi có từ 2 phân hiệu trở lên chưa đạt chỉ tiêu chất lượng.",
    },
    {
      taskGroup: AiTaskGroup.PLAN_PROGRESS,
      metricKey: "SYLLABUS_PROGRESS_DELAY_WEEKS",
      metricName: "Độ lệch tiến độ phân phối chương trình GDPT 2018",
      val: 1.0,
      op: "GTE",
      sev: AiAlertSeverity.HIGH,
      desc: "Cảnh báo khi tiến độ dạy học của tổ khối lệch chậm từ 1 tuần trở lên so với kế hoạch năm học.",
    },
    {
      taskGroup: AiTaskGroup.DOCS_PERIODIC_REPORTS,
      metricKey: "OFFICIAL_DOC_OVERDUE_HOURS",
      metricName: "Thời hạn văn bản chỉ đạo của Sở/Phòng sắp quá hạn",
      val: 24.0,
      op: "LTE",
      sev: AiAlertSeverity.HIGH,
      desc: "Nhắc nhở văn bản chỉ đạo của cấp trên còn dưới 24 giờ đến hạn báo cáo.",
    },
    {
      taskGroup: AiTaskGroup.EARLY_WARNING,
      metricKey: "STUDENT_DROPOUT_RISK_SCORE",
      metricName: "Điểm số nguy cơ gián đoạn học tập vùng cao",
      val: 75.0,
      op: "GTE",
      sev: AiAlertSeverity.CRITICAL,
      desc: "Phát hiện sớm học sinh có nguy cơ bỏ học do hoàn cảnh gia đình, đi lại xa xôi tại các phân hiệu vùng cao.",
    },
    {
      taskGroup: AiTaskGroup.COMMUNICATION_FEEDBACK,
      metricKey: "UNRESOLVED_PARENT_FEEDBACK_DAYS",
      metricName: "Ý kiến phụ huynh chưa phản hồi quá hạn",
      val: 2.0,
      op: "GTE",
      sev: AiAlertSeverity.MEDIUM,
      desc: "Nhắc nhở Ban Giám hiệu và GVCN khi phản ánh của cha mẹ học sinh chưa được giải quyết sau 48 giờ.",
    },
  ];

  for (const cfg of thresholdConfigs) {
    await prisma.aiConfigThreshold.upsert({
      where: {
        schoolId_metricKey: {
          schoolId: school.id,
          metricKey: cfg.metricKey,
        },
      },
      update: {
        thresholdValue: cfg.val,
        severity: cfg.sev,
        description: cfg.desc,
      },
      create: {
        schoolId: school.id,
        taskGroup: cfg.taskGroup,
        metricKey: cfg.metricKey,
        metricName: cfg.metricName,
        thresholdValue: cfg.val,
        comparisonOp: cfg.op,
        severity: cfg.sev,
        description: cfg.desc,
        isEditable: true,
      },
    });
  }

  // 2. Khởi tạo 12 Cảnh Báo AI Chi Tiết Phân Theo 6 Cơ Sở (AiAlert)
  console.log("   - Tạo 12 bản ghi Cảnh báo thông minh AI theo các phân hiệu...");
  const alertSpecs = [
    {
      campusIdx: 0,
      taskGroup: AiTaskGroup.REALTIME_MONITORING,
      sev: AiAlertSeverity.MEDIUM,
      status: AiAlertStatus.ACTIVE,
      title: "Chuyên cần sụt giảm nhẹ do thời tiết chuyển mùa tại Điểm Trung tâm",
      desc: "Phát hiện 8 học sinh khối 1 nghỉ ốm cảm cúm trong 2 ngày liên tiếp tại các lớp 1A1, 1A2.",
      metric: "Tỷ lệ vắng 2.8% khối 1 (8/285 học sinh)",
      action: "Đề nghị bộ phận Y tế học đường phun khử khuẩn phòng học và gửi tin nhắn Zalo hướng dẫn phòng dịch đến phụ huynh.",
      impact: "Tránh lây lan cảm sốt diện rộng trong trường học.",
      targetEntity: "ClassRoom:cls_1a1",
      targetName: "Khối lớp 1 - Điểm Trung tâm",
    },
    {
      campusIdx: 1,
      taskGroup: AiTaskGroup.COORDINATION_DISPATCH,
      sev: AiAlertSeverity.HIGH,
      status: AiAlertStatus.ACTIVE,
      title: "Thiếu giáo viên Tiếng Anh cục bộ tại Phân hiệu Sơn Hà 1",
      desc: "Giáo viên Tiếng Anh nghỉ ốm 3 ngày, cần bố trí giáo viên từ Điểm Trung tâm tăng cường dạy thay 6 tiết.",
      metric: "6 tiết Tiếng Anh lớp 3, 4, 5 chưa có người dạy",
      action: "AI đề xuất điều động Thầy Đỗ Văn Long (Trung tâm) di chuyển 4.2km sang hỗ trợ trong các buổi sáng thứ 4, 5, 6.",
      impact: "Đảm bảo 100% học sinh không bị mất tiết học ngoại ngữ.",
      targetEntity: "Campus:cmp_sonha1",
      targetName: "Phân hiệu Sơn Hà 1",
    },
    {
      campusIdx: 3,
      taskGroup: AiTaskGroup.EARLY_WARNING,
      sev: AiAlertSeverity.CRITICAL,
      status: AiAlertStatus.ACTIVE,
      title: "Nguy cơ gián đoạn học tập học sinh vùng cao Phân hiệu Sơn Hải",
      desc: "Học sinh Giàng A Páo (Lớp 4A_SHAI) vắng học 3 buổi liên tiếp do mùa gặt và phụ giúp gia đình làm nương.",
      metric: "Vắng 3 buổi không phép trong tuần 3",
      action: "Đề nghị GVCN và Ban Giám hiệu phối hợp Trưởng thôn Bản Pún đến tận nhà vận động gia đình cho em trở lại lớp.",
      impact: "Duy trì tỷ lệ chuyên cần 100% và phổ cập giáo dục tiểu học mức độ 3.",
      targetEntity: `Student:${students[0]?.id || "st_0"}`,
      targetName: "Em Giàng A Páo (Lớp 4A_SHAI)",
    },
    {
      campusIdx: 5,
      taskGroup: AiTaskGroup.PLAN_PROGRESS,
      sev: AiAlertSeverity.MEDIUM,
      status: AiAlertStatus.ACTIVE,
      title: "Tiến độ thực hành Tin học tại Điểm An Tiến chậm 1 tuần",
      desc: "Do đường truyền Internet vùng cao chập chờn sau đợt mưa bão, các bài học trực tuyến bị dời lại.",
      metric: "Chậm 2 tiết thực hành Tin học lớp 3",
      action: "Sử dụng nguồn bài giảng số offline đã nạp sẵn vào máy tính bảng chuyên dụng của nhà trường.",
      impact: "Học sinh hoàn thành đúng phân phối chương trình môn Tin học & Công nghệ.",
      targetEntity: "Campus:cmp_antien",
      targetName: "Điểm trường An Tiến",
    },
  ];

  for (const spec of alertSpecs) {
    const targetCampus = campuses[spec.campusIdx % campuses.length]?.campus;
    const targetPoint = schoolPoints[spec.campusIdx % schoolPoints.length];

    await prisma.aiAlert.create({
      data: {
        schoolId: school.id,
        campusId: targetCampus?.id,
        schoolPointId: targetPoint?.id,
        taskGroup: spec.taskGroup,
        severity: spec.sev,
        status: spec.status,
        title: spec.title,
        description: spec.desc,
        triggerMetric: spec.metric,
        suggestedAction: spec.action,
        impactAnalysis: spec.impact,
        targetEntity: spec.targetEntity,
        targetName: spec.targetName,
        acknowledgedById: principalUser.id,
        acknowledgedAt: new Date("2026-09-15"),
      },
    });
  }

  // 3. Khởi tạo 6 Đề xuất Tư Vấn Chiến Lược AI (AiRecommendation)
  console.log("   - Tạo 6 đề xuất phương án tư vấn của AI kèm căn cứ pháp lý & đánh giá đa chiều...");
  const recSpecs = [
    {
      title: "Phương án tổ chức Dạy học Ngoại ngữ & STEM liên phân hiệu Năm học 2026-2027",
      context: "Nhà trường có 5 phân hiệu vùng khó khăn, thiếu giáo viên chuyên trách môn Tin học & Tiếng Anh.",
      legal: "Căn cứ Thông tư 28/2020/TT-BGDĐT Điều lệ trường tiểu học và Đề án Chuyển đổi số ngành GD&ĐT tỉnh Lào Cai.",
      options: JSON.stringify([
        {
          title: "Phương án 1: Dạy học trực tiếp kết hợp phòng học thông minh trực tuyến (Hybrid)",
          pros: ["Tận dụng tối đa giáo viên cốt cán tại Trung tâm", "Tiết kiệm chi phí đi lại và bảo đảm an toàn"],
          cons: ["Đòi hỏi hạ tầng mạng cáp quang ổn định tại điểm lẻ"],
          score: 94.5,
          feasibility: "Rất cao",
        },
        {
          title: "Phương án 2: Luân chuyển giáo viên lưu động dạy 2 buổi/tuần tại các phân hiệu",
          pros: ["Học sinh được tương tác trực tiếp 100% với thầy cô"],
          cons: ["Thời gian di chuyển xa giữa các thôn bản miền núi"],
          score: 88.0,
          feasibility: "Trung bình",
        },
      ]),
      recOption: "Phương án 1: Dạy học trực tiếp kết hợp phòng học thông minh trực tuyến (Hybrid)",
      actions: JSON.stringify([
        "Bước 1: Nâng cấp băng thông Internet tại Phân hiệu Sơn Hải & Sơn Hà 2 trong tháng 9/2026.",
        "Bước 2: Cài đặt phần mềm giảng dạy tương tác trên 5 phòng máy vi tính.",
        "Bước 3: Tập huấn thao tác kết nối lớp học số cho 100% giáo viên chủ nhiệm.",
      ]),
    },
    {
      title: "Kế hoạch Phụ đạo Học sinh cần Hỗ trợ Tiếp thu Môn Toán và Tiếng Việt Khối 1-2",
      context: "Sau 2 tuần đầu năm học, khảo sát nhanh phát hiện 15 học sinh tại các phân hiệu cần rèn thêm kỹ năng đọc và tính nhẩm.",
      legal: "Căn cứ Thông tư 27/2020/TT-BGDĐT về đánh giá học sinh tiểu học.",
      options: JSON.stringify([
        {
          title: "Tổ chức 'Đôi bạn cùng tiến' kèm cặp 15 phút đầu giờ và 30 phút sau tiết 4",
          pros: ["Tạo không khí học tập thân thiện, học sinh không bị áp lực"],
          cons: ["Cần giáo viên chủ nhiệm hướng dẫn sát sao phương pháp"],
          score: 92.0,
          feasibility: "Cao",
        },
      ]),
      recOption: "Tổ chức 'Đôi bạn cùng tiến' kèm cặp 15 phút đầu giờ và 30 phút sau tiết 4",
      actions: JSON.stringify([
        "Bước 1: Phân công học sinh khá giỏi hỗ trợ bạn trong tổ.",
        "Bước 2: Sử dụng bộ đồ dùng học tập trực quan và trò chơi học tập vui nhộn.",
        "Bước 3: Đánh giá tiến bộ hàng tuần và khen thưởng kịp thời.",
      ]),
    },
  ];

  for (const r of recSpecs) {
    await prisma.aiRecommendation.create({
      data: {
        schoolId: school.id,
        campusId: campuses[0]?.campus.id,
        taskGroup: AiTaskGroup.DECISION_SUPPORT,
        title: r.title,
        contextSummary: r.context,
        optionsJson: r.options,
        recommendedOption: r.recOption,
        legalGrounds: r.legal,
        actionStepsJson: r.actions,
        isApplied: true,
        appliedAt: new Date("2026-09-10"),
        appliedById: principalUser.id,
        appliedNotes: "Hiệu trưởng đã phê duyệt và chỉ đạo triển khai áp dụng từ tuần 3 của năm học.",
      },
    });
  }

  // 4. Khởi tạo Báo Cáo Tổng Hợp Điều Hành AI (AiReportSummary)
  console.log("   - Tạo các Báo cáo tổng hợp điều hành định kỳ của AI...");
  const reportSummaries = [
    {
      type: "WEEKLY_EXECUTIVE",
      period: "Tuần 02 (07/09 - 13/09/2026)",
      summary: "Toàn trường Trường Tiểu học Phố Lu và 5 Phân hiệu vận hành nền nếp, sĩ số 1.486 học sinh duy trì 99.4%. Đã hoàn thành 100% tiết dạy theo thời khóa biểu. 6/6 cơ sở tổ chức tốt công tác bán trú và vệ sinh an toàn thực phẩm.",
      content: JSON.stringify({
        totalStudents: 1486,
        presentRate: "99.4%",
        totalClasses: 62,
        campusesStatus: "Hoạt động ổn định",
        highlights: "Khai mạc thành công Hội thi Tiếng Anh nhí và khởi động CLB STEM tại Phân hiệu Trung tâm.",
      }),
    },
    {
      type: "MONTHLY_STRATEGIC",
      period: "Tháng 09/2026",
      summary: "Kế hoạch giáo dục tháng 9 đã hoàn thành xuất sắc các mục tiêu đề ra. Hoàn thành kiện toàn hồ sơ kiểm định chất lượng Thông tư 15/2020 và chuẩn bị chu đáo điều kiện cơ sở vật chất cho mùa đông vùng cao.",
      content: JSON.stringify({
        qualityProgress: "98.2%",
        kpiCompletion: "96.5%",
        budgetExecution: "100%",
        safetyScore: 10.0,
      }),
    },
  ];

  for (const rep of reportSummaries) {
    await prisma.aiReportSummary.create({
      data: {
        schoolId: school.id,
        campusId: campuses[0]?.campus.id,
        reportType: rep.type,
        periodLabel: rep.period,
        contentJson: rep.content,
        aiExecutiveSummary: rep.summary,
      },
    });
  }

  // 5. Khởi tạo Nhật ký Phân tích AI Pipeline (AiAnalysisLog)
  console.log("   - Tạo 10 bản ghi Nhật ký vận hành AI Pipeline...");
  for (let l = 0; l < 10; l++) {
    await prisma.aiAnalysisLog.create({
      data: {
        schoolId: school.id,
        campusId: campuses[l % campuses.length]?.campus.id,
        triggeredBy: l % 2 === 0 ? "SCHEDULED_CRON" : "MANUAL_PRINCIPAL",
        taskGroup: l % 2 === 0 ? AiTaskGroup.REALTIME_MONITORING : AiTaskGroup.DECISION_SUPPORT,
        status: "SUCCESS",
        alertsGenerated: l % 3 === 0 ? 2 : 0,
        durationMs: 420 + l * 35,
        detailsJson: JSON.stringify({
          nodesScanned: 62,
          recordsProcessed: 1486,
          anomaliesDetected: l % 3 === 0 ? 2 : 0,
          confidenceScore: 0.98,
        }),
      },
    });
  }

  // 6. Khởi tạo Cấu hình Ngưỡng Hành Trình Học Sinh (JourneyThresholdConfig)
  console.log("   - Tạo Cấu hình ngưỡng phân tích xu hướng học tập cho các phân hiệu...");
  for (const cmp of campuses) {
    await prisma.journeyThresholdConfig.upsert({
      where: {
        schoolId_campusId: {
          schoolId: school.id,
          campusId: cmp.campus.id,
        },
      },
      update: {
        increasingSlope: 0.25,
        decliningSlope: 0.25,
        volatilityMax: 1.2,
        minPeriodsRequired: 3,
      },
      create: {
        schoolId: school.id,
        campusId: cmp.campus.id,
        increasingSlope: 0.25,
        decliningSlope: 0.25,
        volatilityMax: 1.2,
        minPeriodsRequired: 3,
      },
    });
  }

  // 7. Khởi tạo Snapshot Xu hướng & Can thiệp Học sinh (StudentJourneySnapshot & InterventionRecord)
  console.log("   - Tạo Snapshot xu hướng học tập (Trend) & Hồ sơ can thiệp sư phạm...");
  const examPeriods = await prisma.examPeriod.findMany({ where: { schoolId: school.id } });
  const sampleStudents = students.slice(0, 30);

  if (examPeriods.length > 0) {
    const latestPeriod = examPeriods[examPeriods.length - 1];
    const targetSubject = subjects[0] || { id: "sub_toan" };

    for (let s = 0; s < sampleStudents.length; s++) {
      const st = sampleStudents[s];
      const targetClass = classes.find((c) => c.id === st.classId) || classes[0];
      const trend: TrendLabel =
        s % 5 === 0 ? TrendLabel.IMPROVING : s % 7 === 0 ? TrendLabel.DECLINING : TrendLabel.STABLE;

      // Tạo snapshot hành trình
      await prisma.studentJourneySnapshot.create({
        data: {
          studentId: st.id,
          subjectId: targetSubject.id,
          examPeriodId: latestPeriod.id,
          schoolId: school.id,
          campusId: targetClass.campusId,
          avgScore: 8.2 + (s % 15) / 10,
          trendSlope: trend === TrendLabel.IMPROVING ? 0.45 : trend === TrendLabel.DECLINING ? -0.35 : 0.05,
          trendLabel: trend,
          volatilityScore: 0.35,
          baselineScore: 7.8,
          deltaFromBaseline: trend === TrendLabel.IMPROVING ? 0.8 : -0.4,
          dataPointsCount: 4,
          isInsufficientData: false,
        },
      });

      // Tạo hồ sơ can thiệp cho học sinh có xu hướng giảm hoặc cần hỗ trợ
      if (trend === TrendLabel.DECLINING || s % 6 === 0) {
        await prisma.interventionRecord.create({
          data: {
            studentId: st.id,
            schoolId: school.id,
            campusId: targetClass.campusId,
            subjectId: targetSubject.id,
            triggeredBy: TriggerSource.AI,
            trendLabelAtTrigger: trend,
            interventionType: "Phụ đạo cá thể hóa & Kèm cặp phương pháp tư duy",
            note: "AI phát hiện điểm số bài kiểm tra chuyên đề giảm nhẹ. GVCN đã lên kế hoạch kèm cặp 2 buổi/tuần.",
            status: InterventionStatus.APPLIED,
            suggestedAt: new Date("2026-09-10"),
            approvedById: principalUser.id,
            approvedByName: principalUser.name,
            approvedAt: new Date("2026-09-11"),
            appliedById: vpUsers[0]?.id || principalUser.id,
            appliedByName: "ThS. Nguyễn Văn Trung (PHT)",
            appliedAt: new Date("2026-09-12"),
            outcomeCheckedAt: new Date("2026-09-18"),
            outcomeScoreDelta: 0.75,
            outcomeNote: "Học sinh đã tiến bộ rõ rệt, đạt điểm 8.5 trong bài kiểm tra 15 phút tuần 3.",
          },
        });
      }
    }
  }

  // 8. Khởi tạo Đợt Import Dữ liệu Mẫu & Staging / Mapping (StudentImportBatch, StudentImportStaging, StudentImportMapping)
  console.log("   - Tạo Đợt import dữ liệu điểm thi thông minh (Batch, Staging & Mapping)...");
  const batch = await prisma.studentImportBatch.create({
    data: {
      schoolId: school.id,
      campusId: campuses[0]?.campus.id,
      fileName: "Danh_sach_Diem_Khao_sat_Dau_nam_2026_TH_Pho_Lu.xlsx",
      totalRows: 30,
      validRows: 30,
      invalidRows: 0,
      status: ImportBatchStatus.COMMITTED,
      importedById: principalUser.id,
      importedByName: "ThS. Trần Thị Thanh Hà",
      committedAt: new Date("2026-09-08"),
    },
  });

  for (let b = 0; b < 10; b++) {
    const st = sampleStudents[b % sampleStudents.length];
    const studentCode = `HS2627-${(b + 1).toString().padStart(4, "0")}`;
    await prisma.studentImportStaging.create({
      data: {
        batchId: batch.id,
        rowNumber: b + 1,
        rawStudentCode: studentCode,
        rawName: st.name || `Học sinh mẫu ${b + 1}`,
        rawClassLabel: "1A1",
        rawSubject: "Toán",
        rawPeriod: "Khảo sát đầu năm",
        rawScore: 9.0,
        isValid: true,
      },
    });

    await prisma.studentImportMapping.create({
      data: {
        batchId: batch.id,
        rawName: st.name || `Học sinh mẫu ${b + 1}`,
        rawStudentCode: studentCode,
        rawClassLabel: "1A1",
        rawSubject: "Toán",
        matchedStudentId: st.id,
        matchedSubjectId: subjects[0]?.id,
        matchedPeriodId: examPeriods[0]?.id,
        matchConfidence: MatchConfidence.EXACT,
        reviewedBy: principalUser.id,
        reviewedByName: principalUser.name,
        reviewedAt: new Date("2026-09-08"),
        notes: "Khớp chính xác mã định danh học sinh cấp Bộ GD&ĐT.",
      },
    });
  }

  console.log(`   ✅ Đã nạp thành công Cấu hình ngưỡng AI, 12 Cảnh báo AI, 6 Đề xuất BGH, Báo cáo tổng hợp, Snapshots hành trình, Hồ sơ can thiệp và Import batch.`);
}
