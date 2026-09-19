/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 25), `src/app/api/db-seed/route.ts` (line 26).
 * 2. Uniqueness: Dedicated seed module for AcademicCalendar, MonthlyPlan, WeeklyActivity, EarlyWarning, and DecisionLog.
 * 3. Data Schemas:
 *    - AcademicCalendar: { id: string, schoolId: string, schoolYear: string, title: string, content: string, fileUrl?: string }
 *    - MonthlyPlan: { id: string, classId: string, month: number, year: number, planContent?: string }
 *    - WeeklyActivity: { id: string, monthlyPlanId: string, weekNumber: number, content?: string, notes?: string }
 *    - EarlyWarning: { id: string, title: string, category: WarningCategory, level: WarningLevel, campusName?: string, schoolPointName?: string, className?: string, studentName?: string, description: string, aiAnalysis?: string, isResolved: boolean }
 *    - DecisionLog: { id: string, principalId?: string, query: string, aiRecommendation: string, decisionTaken?: string }
 * 4. Verbatim User Instruction: "tôi muốn bạn thêm dữ liệu mô phỏng cho tất cả dữ liệu".
 */

import { PrismaClient, WarningLevel, WarningCategory } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedSchoolCalendarAndGovernance(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n📅 Khởi tạo Lịch năm học, Kế hoạch tuần/tháng, Cảnh báo sớm AI & Sổ Quyết định BGH...");
  const { school, campuses } = schoolStruct;
  const { principalUser, vpUsers } = personnelStruct;
  const { classes, students } = classesStudents;

  // 1. Khởi tạo Kế Hoạch Lịch Năm Học Toàn Trường (AcademicCalendar)
  console.log("   - Tạo Khung Kế hoạch Thời gian & Lịch Năm học 2026-2027...");
  const calendarMarkdown = `# KHUNG KẾ HOẠCH THỜI GIAN NĂM HỌC 2026-2027
**Đơn vị:** Trường Tiểu học Phố Lu & 5 Phân hiệu (Sở GD&ĐT Lào Cai - UBND Xã Bảo Thắng)

## I. CÁC MỐC THỜI GIAN QUAN TRỌNG
1. **01/09/2026:** Tựu trường toàn thể 1.706 học sinh tại 6 cơ sở giáo dục.
2. **05/09/2026:** Khai giảng năm học mới đồng loạt 6 điểm trường.
3. **07/09/2026:** Bắt đầu thực hiện chương trình tuần 1 (Học kỳ 1 gồm 18 tuần thực học).
4. **20/09/2026:** Hội nghị Cán bộ, Viên chức, Người lao động năm học 2026-2027.
5. **15/10/2026 - 25/10/2026:** Hội thi Giáo viên dạy giỏi cấp Trường & Ngày hội STEM.
6. **20/11/2026:** Lễ Kỷ niệm 44 năm Ngày Nhà giáo Việt Nam.
7. **25/12/2026 - 08/01/2027:** Kiểm tra định kỳ Cuối Học kỳ 1 theo Thông tư 27.
8. **15/01/2027:** Sơ kết Học kỳ 1, công bố đánh giá chất lượng GDPT 2018.
9. **18/01/2027:** Bắt đầu Học kỳ 2 (gồm 17 tuần thực học).
10. **04/02/2027 - 18/02/2027:** Nghỉ Tết Nguyên đán Đinh Mùi (14 ngày).
11. **26/03/2027:** Ngày hội Thiếu nhi vui khỏe - Tiến bước lên Đoàn & Hội khỏe Phù Đổng.
12. **10/05/2027 - 20/05/2027:** Kiểm tra định kỳ Cuối Học kỳ 2 & Xét hoàn thành chương trình Tiểu học.
13. **28/05/2027:** Lễ Bế giảng Năm học 2026-2027, bàn giao học sinh về sinh hoạt hè tại địa phương.`;

  await prisma.academicCalendar.create({
    data: {
      schoolId: school.id,
      schoolYear: "2026-2027",
      title: "Kế hoạch Thời gian & Khung Lịch Năm học 2026-2027 - Trường Tiểu học Phố Lu & 5 Phân hiệu",
      content: calendarMarkdown,
      fileUrl: "https://storage.thpholu.laocai.edu.vn/calendar/Lich_Nam_Hoc_2026_2027.pdf",
    },
  });

  // 2. Khởi tạo Kế Hoạch Tháng & Sinh Hoạt Tuần (MonthlyPlan & WeeklyActivity)
  console.log("   - Tạo Kế hoạch trọng tâm tháng và 40 hoạt động sinh hoạt tuần chi tiết...");
  const sampleClasses = classes.slice(0, 6); // Đại diện 6 lớp tại 6 điểm trường
  const monthThemes = [
    { month: 9, year: 2026, content: "Chào năm học mới - Ổn định nền nếp kỷ cương và sĩ số 62 lớp." },
    { month: 10, year: 2026, content: "Chăm ngoan học giỏi - Sinh hoạt chuyên môn liên phân hiệu và bồi dưỡng STEM." },
    { month: 11, year: 2026, content: "Tôn sư trọng đạo - Thi đua dạy tốt học tốt chào mừng 20/11." },
    { month: 12, year: 2026, content: "Rà soát kiến thức, kiểm tra định kỳ Cuối HK1 và họp CMHS." },
  ];

  for (const targetClass of sampleClasses) {
    for (const mt of monthThemes) {
      const mPlan = await prisma.monthlyPlan.create({
        data: {
          classId: targetClass.id,
          month: mt.month,
          year: mt.year,
          planContent: `[Kế hoạch Tháng ${mt.month}/${mt.year} - Lớp ${targetClass.name}]: ${mt.content}`,
        },
      });

      for (let w = 1; w <= 4; w++) {
        await prisma.weeklyActivity.create({
          data: {
            monthlyPlanId: mPlan.id,
            weekNumber: w,
            content: `Tuần ${w} (Tháng ${mt.month}): Thực hiện chương trình tuần, rèn chữ giữ vở, duy trì chuyên cần 100%.`,
            notes: "Giáo viên chủ nhiệm đôn đốc nề nếp vệ sinh và kiểm tra đồ dùng học tập.",
          },
        });
      }
    }
  }

  // 3. Khởi tạo 12 Cảnh Báo Sớm AI Điều Hành (EarlyWarning)
  console.log("   - Tạo 12 cảnh báo sớm AI về Chuyên cần, Học lực, Cơ sở vật chất & An toàn trường học...");
  const warningSpecs = [
    {
      title: "Nguy cơ giảm tỷ lệ chuyên cần do mưa lũ tại Điểm trường An Tiến",
      desc: "Hệ thống AI phát hiện 3 học sinh có nguy cơ gián đoạn học tập do đường suối dâng cao vào ngày mưa.",
      level: WarningLevel.HIGH,
      cat: WarningCategory.ATTENDANCE,
      campus: "Điểm trường An Tiến",
      analysis: "Bố trí giáo viên tại chỗ hỗ trợ đưa đón và chuyển tài liệu ôn tập qua nhóm Zalo phụ huynh thôn bản.",
    },
    {
      title: "Nguy cơ sa sút tiến độ học tập môn Toán Khối 4 tại Phân hiệu Phố Lu 3",
      desc: "AI Analytics ghi nhận điểm kiểm tra thường xuyên môn Toán lớp 4 tại Phố Lu 3 thấp hơn bình quân trường 0.8 điểm.",
      level: WarningLevel.MEDIUM,
      cat: WarningCategory.PROGRESS_SLIP,
      campus: "Phân hiệu Phố Lu 3",
      analysis: "Tổ chuyên môn Khối 4 tăng cường sinh hoạt cụm, cử giáo viên cốt cán hỗ trợ chuyên đề phương pháp tính nhanh.",
    },
    {
      title: "Cảnh báo an toàn trật tự cổng trường vào giờ tan học tại Phân hiệu Sơn Hà 1",
      desc: "Lưu lượng xe cộ phụ huynh đưa đón đông, cần củng cố đội cờ đỏ và lực lượng bảo vệ phối hợp công an xã.",
      level: WarningLevel.MEDIUM,
      cat: WarningCategory.SAFETY_INCIDENT,
      campus: "Phân hiệu Sơn Hà 1",
      analysis: "Kích hoạt mô hình 'Cổng trường An toàn Giao thông', phân luồng học sinh theo 2 khung giờ tan học.",
    },
    {
      title: "Cảnh báo nguy cơ bỏ học cục bộ đối với 2 học sinh có hoàn cảnh đặc biệt khó khăn",
      desc: "Học sinh vắng không phép 2 buổi liên tiếp do gia đình vào mùa thu hoạch nông sản tại bản vùng xa.",
      level: WarningLevel.CRITICAL,
      cat: WarningCategory.DROPOUT_RISK,
      campus: "Phân hiệu Sơn Hải",
      analysis: "Ban Giám hiệu phối hợp Hội đồng Đội và Trưởng thôn đến gia đình vận động, trao học bổng đỡ đầu.",
    },
  ];

  for (let wIdx = 0; wIdx < 12; wIdx++) {
    const wSpec = warningSpecs[wIdx % warningSpecs.length];
    const targetStudent = students[wIdx % students.length];
    const targetClass = classes[wIdx % classes.length];

    await prisma.earlyWarning.create({
      data: {
        title: `${wSpec.title} (Đợt ${(wIdx % 3) + 1})`,
        category: wSpec.cat,
        level: wSpec.level,
        campusName: wSpec.campus,
        schoolPointName: wSpec.campus,
        className: targetClass.name,
        studentName: targetStudent.name,
        description: wSpec.desc,
        aiAnalysis: wSpec.analysis,
        isResolved: wIdx % 3 === 0,
        resolvedAt: wIdx % 3 === 0 ? new Date("2026-09-15") : null,
      },
    });
  }

  // 4. Khởi tạo 8 Quyết Định & Tham Vấn Điều Hành BGH (DecisionLog)
  console.log("   - Tạo 8 hồ sơ tham vấn AI & Quyết định điều hành của Ban Giám Hiệu...");
  const decisions = [
    {
      query: "Phương án tối ưu bố trí giáo viên Tiếng Anh và Tin học dạy liên trường giữa Phân hiệu Trung tâm và Phân hiệu Sơn Hải (khoảng cách 6.8km).",
      aiRecommendation: "AI đề xuất gom tiết học thành các buổi sáng thứ 3 và chiều thứ 5, xếp 2 giáo viên dạy cuốn chiếu kết hợp học trực tuyến có trợ giảng.",
      decisionTaken: "Hiệu trưởng ký Quyết định số 128/QĐ-THPL ban hành thời khóa biểu liên trường tối ưu di chuyển cho giáo viên.",
    },
    {
      query: "Đề xuất phân bổ ngân sách mua sắm trang thiết bị phòng STEM và máy tính thực hành cho 5 phân hiệu năm học 2026-2027.",
      aiRecommendation: "Ưu tiên cấp 20 bộ máy tính cho Sơn Hà 1 và 15 bộ cho Sơn Hà 2 do tỷ lệ máy cũ hỏng cao nhất, các điểm còn lại nâng cấp RAM và màn hình.",
      decisionTaken: "Duyệt kế hoạch đấu thầu mua sắm thiết bị dạy học số hóa theo Thông tư 37/2021/TT-BGDĐT.",
    },
    {
      query: "Giải pháp nâng cao tỷ lệ chuyên cần mùa mưa lũ cho điểm trường An Tiến và Sơn Hải.",
      aiRecommendation: "Thiết lập đường dây nóng Zalo với các Trưởng thôn bản, cung cấp bữa trưa bán trú miễn phí cho 100% học sinh nhà xa trên 3km.",
      decisionTaken: "Phê duyệt triển khai mô hình Bán trú Dân nuôi và trích quỹ Chữ thập đỏ hỗ trợ tiền ăn trưa cho 45 em vùng cao.",
    },
    {
      query: "Chiến lược nâng cao tiêu chí Kiểm định Chất lượng Giáo dục Mức độ 3 theo Thông tư 15/2020.",
      aiRecommendation: "Tập trung chuẩn hóa hồ sơ minh chứng Tiêu chuẩn 3 (Cơ sở vật chất) và Tiêu chuẩn 4 (Quan hệ nhà trường - gia đình - xã hội).",
      decisionTaken: "Kiện toàn Hội đồng Tự đánh giá và giao Phó Hiệu trưởng phụ trách trực tiếp từng tiêu chuẩn.",
    },
  ];

  for (let d = 0; d < 8; d++) {
    const dec = decisions[d % decisions.length];
    await prisma.decisionLog.create({
      data: {
        principalId: principalUser.id,
        query: `${dec.query} (Lần ${d + 1})`,
        aiRecommendation: dec.aiRecommendation,
        decisionTaken: dec.decisionTaken,
      },
    });
  }

  console.log(`   ✅ Đã nạp thành công 1 Lịch năm học toàn trường, 24 Kế hoạch tháng, 96 Hoạt động tuần, 12 Cảnh báo AI và 8 Quyết định BGH.`);
}
