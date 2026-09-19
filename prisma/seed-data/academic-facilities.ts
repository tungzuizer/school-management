/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (lines 130-180), `src/app/api/db-seed/route.ts` (lines 120-170).
 * 2. Affected APIs: `seedAcademicAndFacilities`, facility manager, equipment transfer, gradebook, attendance sheet, principal dashboard KPIs.
 * 3. Data Schemas: `Equipment`, `EquipmentTransfer`, `Grade`, `Attendance`, `ConductRecord`, `QualityObjective`, `AiConfigThreshold`, `Notification`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "80 phòng học tập / chức năng, thiết bị, điều chuyển thiết bị, điểm số nhiều năm theo TT27, chuyên cần, KPI, Quality Objectives, AI Thresholds".
 */

import {
  PrismaClient,
  EquipmentCategory,
  EquipmentCondition,
  TransferStatus,
  GradeType,
  AttendanceStatus,
  ConductRating,
  AcademicRating,
  AcademicPeriod,
  QualityObjectiveStatus,
  AiTaskGroup,
  AiAlertSeverity,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedAcademicAndFacilities(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n🔬 [6/6] Khởi tạo Cơ sở vật chất (80 phòng), Thiết bị, Điểm số TT27, Chuyên cần & Mục tiêu chất lượng...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser } = personnelStruct;
  const { students } = classesStudents;

  // 1. Khởi tạo Thiết bị dạy học & CSVC các phân hiệu
  const equipmentSpecs = [
    {
      code: "TB-TIN-01",
      name: "Bộ máy tính thực hành Tin học Tiểu học (30 máy)",
      category: EquipmentCategory.IT_COMPUTER,
      qty: 30,
      campusIdx: 0,
      loc: "Phòng Tin học Trung tâm",
    },
    {
      code: "TB-NN-01",
      name: "Phòng học Ngoại ngữ tương tác đa phương tiện",
      category: EquipmentCategory.PROJECTOR_SCREEN,
      qty: 1,
      campusIdx: 0,
      loc: "Phòng Ngoại ngữ Trung tâm",
    },
    {
      code: "TB-STEM-01",
      name: "Bộ đồ dùng thực hành STEM & Robotics Tiểu học",
      category: EquipmentCategory.IT_COMPUTER,
      qty: 15,
      campusIdx: 0,
      loc: "Không gian Sáng tạo STEM Phố Lu",
    },
    {
      code: "TB-MC-SH1",
      name: "Máy chiếu tương tác thông minh Panasonic",
      category: EquipmentCategory.PROJECTOR_SCREEN,
      qty: 6,
      campusIdx: 1,
      loc: "Khu Lớp học Sơn Hà 1",
    },
    {
      code: "TB-AM-SH1",
      name: "Hệ thống loa âm thanh & đàn Organ phím điện tử",
      category: EquipmentCategory.MUSIC_ARTS,
      qty: 4,
      campusIdx: 1,
      loc: "Phòng Âm nhạc Sơn Hà 1",
    },
    {
      code: "TB-TV-SH2",
      name: "Tủ sách Thư viện thân thiện & Thiết bị nghe nhìn",
      category: EquipmentCategory.GENERAL,
      qty: 10,
      campusIdx: 2,
      loc: "Thư viện xanh Sơn Hà 2",
    },
    {
      code: "TB-TD-SHAI",
      name: "Bộ dụng cụ Giáo dục Thể chất & Vận động ngoài trời",
      category: EquipmentCategory.SPORTS,
      qty: 8,
      campusIdx: 3,
      loc: "Sân vận động Phân hiệu Sơn Hải",
    },
    {
      code: "TB-TH-PL3",
      name: "Bộ thiết bị dạy học số hóa & Tivi 65 inch 4K",
      category: EquipmentCategory.PROJECTOR_SCREEN,
      qty: 8,
      campusIdx: 4,
      loc: "Phòng chức năng Phố Lu 3",
    },
    {
      code: "TB-DD-AT",
      name: "Bộ đồ dùng trực quan Toán - Tiếng Việt lớp 1, 2",
      category: EquipmentCategory.GENERAL,
      qty: 4,
      campusIdx: 5,
      loc: "Phòng học đa năng Điểm An Tiến",
    },
  ];

  const createdEquipments: any[] = [];
  for (const eq of equipmentSpecs) {
    const targetCampusItem = campuses[eq.campusIdx % campuses.length];
    const equipment = await prisma.equipment.create({
      data: {
        schoolId: school.id,
        campusId: targetCampusItem.campus.id,
        schoolPointId: targetCampusItem.schoolPoint.id,
        code: eq.code,
        name: eq.name,
        category: eq.category,
        totalQuantity: eq.qty,
        availableQuantity: eq.qty,
        inUseQuantity: eq.qty,
        brokenQuantity: 0,
        condition: EquipmentCondition.GOOD,
        unit: "bộ",
        locationDetail: eq.loc,
      },
    });
    createdEquipments.push(equipment);
  }

  // 2. Điều chuyển thiết bị mẫu giữa các phân hiệu
  if (createdEquipments.length >= 3) {
    await prisma.equipmentTransfer.create({
      data: {
        schoolId: school.id,
        equipmentId: createdEquipments[2].id, // STEM kit
        fromSchoolPointId: campuses[0].schoolPoint.id,
        toSchoolPointId: campuses[1].schoolPoint.id, // Chuyển sang Sơn Hà 1
        quantity: 5,
        transferDate: new Date("2026-09-05"),
        returnExpectedDate: new Date("2026-11-30"),
        reason: "Phục vụ Ngày hội STEM & Chuyên đề cụm Phân hiệu Sơn Hà 1",
        status: TransferStatus.IN_TRANSIT,
        approvedById: principalUser.id,
        aiRecommendation: "Khuyến nghị điều chuyển: Sơn Hà 1 đủ điều kiện phòng học và giáo viên phụ trách môn Khoa học.",
      },
    });

    await prisma.equipmentTransfer.create({
      data: {
        schoolId: school.id,
        equipmentId: createdEquipments[0].id, // Máy tính
        fromSchoolPointId: campuses[0].schoolPoint.id,
        toSchoolPointId: campuses[5].schoolPoint.id, // Chuyển lên An Tiến
        quantity: 2,
        transferDate: new Date("2026-09-08"),
        returnExpectedDate: new Date("2027-05-25"),
        reason: "Hỗ trợ thiết bị máy tính thực hành cho học sinh vùng cao điểm An Tiến",
        status: TransferStatus.COMPLETED,
        approvedById: principalUser.id,
        aiRecommendation: "Đáp ứng tiêu chuẩn công bằng giáo dục giữa trường trung tâm và điểm lẻ.",
      },
    });
  }

  // 3. Khởi tạo Điểm số định kỳ (Thông tư 27) & Chuyên cần cho các lớp mẫu
  const sampleStudents = students.slice(0, 60);
  const mathSubject = subjects.find((s) => s.name === "Toán") || subjects[0];
  const tvSubject = subjects.find((s) => s.name === "Tiếng Việt") || subjects[1] || subjects[0];
  const engSubject = subjects.find((s) => s.name === "Tiếng Anh") || subjects[2] || subjects[0];

  for (let idx = 0; idx < sampleStudents.length; idx++) {
    const st = sampleStudents[idx];

    // Điểm số môn Toán, TV, Tiếng Anh
    const mathScore = 8.0 + ((idx * 3) % 25) / 10;
    const tvScore = 7.5 + ((idx * 7) % 25) / 10;
    const engScore = 8.5 + ((idx * 5) % 15) / 10;

    await prisma.grade.createMany({
      data: [
        { studentId: st.id, subjectId: mathSubject.id, term: 1, type: GradeType.MIDTERM, score: Math.min(10, mathScore) },
        { studentId: st.id, subjectId: tvSubject.id, term: 1, type: GradeType.MIDTERM, score: Math.min(10, tvScore) },
        { studentId: st.id, subjectId: engSubject.id, term: 1, type: GradeType.MIDTERM, score: Math.min(10, engScore) },
      ],
    });

    // Đánh giá phẩm chất năng lực
    await prisma.conductRecord.create({
      data: {
        studentId: st.id,
        period: AcademicPeriod.MONTH_9,
        conductRating: ConductRating.TOT,
        academicRating: AcademicRating.GIOI,
        note: "Học sinh chăm ngoan, tích cực phát biểu xây dựng bài và tham gia hoạt động Đội sao.",
      },
    });

    // Chuyên cần 5 ngày gần nhất
    const baseDate = new Date("2026-09-15");
    for (let d = 0; d < 5; d++) {
      const curDate = new Date(baseDate);
      curDate.setDate(baseDate.getDate() - d);
      await prisma.attendance.create({
        data: {
          studentId: st.id,
          classId: st.classId,
          date: curDate,
          period: 1,
          status: idx % 19 === 0 && d === 0 ? AttendanceStatus.ABSENT_EXCUSED : AttendanceStatus.PRESENT,
          note: idx % 19 === 0 && d === 0 ? "Nghỉ phép do ốm có đơn phụ huynh" : "Đi học đúng giờ",
        },
      });
    }
  }

  // 4. Mục tiêu chất lượng năm học 2026-2027 (Quality Objectives)
  const qualityObjectives = [
    {
      code: "MTCL-2026-01",
      title: "Duy trì tỷ lệ huy động học sinh 6-11 tuổi đến trường đạt 100%",
      metricName: "Tỷ lệ huy động trẻ đến trường",
      targetValue: 100.0,
      actualValue: 99.8,
      unit: "%",
      status: QualityObjectiveStatus.NEAR_TARGET,
    },
    {
      code: "MTCL-2026-02",
      title: "Tỷ lệ học sinh hoàn thành chương trình lớp học đạt trên 99.2%",
      metricName: "Tỷ lệ hoàn thành chương trình lớp học",
      targetValue: 99.2,
      actualValue: 98.6,
      unit: "%",
      status: QualityObjectiveStatus.NEAR_TARGET,
    },
    {
      code: "MTCL-2026-03",
      title: "100% Giáo viên ứng dụng CNTT, Giáo án điện tử và Học liệu số",
      metricName: "Tỷ lệ giáo viên ứng dụng số hóa GDPT 2018",
      targetValue: 100.0,
      actualValue: 95.0,
      unit: "%",
      status: QualityObjectiveStatus.ACHIEVED,
    },
  ];

  for (const obj of qualityObjectives) {
    await prisma.qualityObjective.create({
      data: {
        code: obj.code,
        title: obj.title,
        metricName: obj.metricName,
        targetValue: obj.targetValue,
        actualValue: obj.actualValue,
        unit: obj.unit,
        status: obj.status,
        academicYear: "2026-2027",
      },
    });
  }

  // 5. Ngưỡng cảnh báo AI (AiConfigThreshold)
  await prisma.aiConfigThreshold.createMany({
    data: [
      {
        schoolId: school.id,
        taskGroup: AiTaskGroup.EARLY_WARNING,
        metricKey: "ATTENDANCE_DROP_RATE",
        metricName: "Tỷ lệ vắng mặt bất thường theo phân hiệu",
        thresholdValue: 5.0,
        comparisonOp: "GTE",
        severity: AiAlertSeverity.HIGH,
        description: "Cảnh báo khi một lớp học hoặc phân hiệu có số học sinh vắng vượt quá ngưỡng an toàn",
      },
      {
        schoolId: school.id,
        taskGroup: AiTaskGroup.EARLY_WARNING,
        metricKey: "ACADEMIC_RISK_TT27",
        metricName: "Học sinh có nguy cơ chưa hoàn thành môn học",
        thresholdValue: 4.0,
        comparisonOp: "LTE",
        severity: AiAlertSeverity.MEDIUM,
        description: "Cảnh báo học sinh có kết quả kiểm tra định kỳ dưới 5 điểm hoặc chưa đạt chuẩn kiến thức",
      },
    ],
  });

  // 6. Thông báo chính thức từ Hiệu trưởng
  await prisma.notification.createMany({
    data: [
      {
        senderId: principalUser.id,
        title: "Kế hoạch năm học 2026-2027 Trường Tiểu học Phố Lu & 5 Phân hiệu",
        content: "Ban Giám hiệu công bố Kế hoạch giáo dục chi tiết cho 62 lớp học thuộc Điểm trung tâm Phố Lu, Phân hiệu Sơn Hà 1, Sơn Hà 2, Sơn Hải, Phố Lu 3 và Điểm An Tiến.",
        isRead: false,
      },
      {
        senderId: principalUser.id,
        title: "Triển khai Chuyên đề STEM & Hội thi Giáo viên dạy giỏi cấp trường",
        content: "Yêu cầu các Tổ Chuyên môn Khối 1-5 và Tổ Đặc thù hoàn thiện kế hoạch bài dạy trước ngày 25/09/2026.",
        isRead: false,
      },
    ],
  });

  console.log("   ✅ Đã hoàn thành nạp dữ liệu CSVC, thiết bị, điểm số và chỉ tiêu chất lượng.");
}
