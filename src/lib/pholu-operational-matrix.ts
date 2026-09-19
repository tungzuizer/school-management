/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/lib/__tests__/pholu-operational-matrix.test.ts`, `prisma/seed-data/academic-facilities.ts`, Principal Dashboard & Reports components.
 * 2. Search Verification: Searched `src/lib/*`. No single module aggregated all operational constants, legal bases, quality targets, inclusive matrix, and 35-week schedule for Trường TH Phố Lu.
 * 3. Data Schemas: `LegalBasisItem`, `SchoolStats`, `QualityTargetItem`, `AcademicWeekSchedule`, `HolidayMakeupSchedule`, `CampusInclusiveStats`.
 * 4. Verbatim User Instruction: "đọc lại file tên KẾ HOẠCH GIÁO DỤC 2026-2027 và hãy upadte và cập nhập thêm dữ liệu" - Số hóa và đồng bộ ma trận vận hành chi tiết năm học 2026-2027.
 */

export interface LegalBasisItem {
  code: string;
  title: string;
  issuedBy: string;
  issueDate: string;
  scope: string;
  summary: string;
}

export interface SchoolStats {
  schoolName: string;
  schoolCode: string;
  academicYear: string;
  totalCampuses: number;
  totalClasses: number;
  totalStudents: number;
  totalStaff: number;
  totalTeachers: number;
  totalManagers: number;
  totalEmployees: number;
  inclusiveStudents: number;
  ethnicMinorityStudents: number;
  poorNearPoorStudents: number;
  standardSchoolLevel: string;
  qualityAccreditationLevel: string;
}

export interface QualityTargetItem {
  code: string;
  title: string;
  metric: string;
  targetPercent: number;
  benchmarkTT27: string;
  responsibleRole: string;
}

export interface AcademicWeekSchedule {
  term: 1 | 2;
  totalWeeks: number;
  startDate: string;
  endDate: string;
  midtermAssessmentWeek: number;
  finalAssessmentWeek: number;
  concludingWeek: number;
}

export interface HolidayMakeupSchedule {
  id: string;
  holidayName: string;
  fromDate: string;
  toDate: string;
  totalDaysOff: number;
  makeupDate: string;
  makeupSession: string;
  note: string;
}

export interface CampusInclusiveStats {
  campusKey: string;
  campusName: string;
  inclusiveCount: number;
  gradeDistribution: {
    grade1: number;
    grade2: number;
    grade3: number;
    grade4: number;
    grade5: number;
  };
  individualPlanStatus: "100%_APPROVED" | "IN_PROGRESS";
}

// 1. Căn cứ pháp lý cốt lõi năm học 2026-2027
export const PHO_LU_LEGAL_BASIS: LegalBasisItem[] = [
  {
    code: "LUAT-GD-43/2019/QH14",
    title: "Luật Giáo dục số 43/2019/QH14",
    issuedBy: "Quốc hội Nước CHXHCN Việt Nam",
    issueDate: "14/06/2019",
    scope: "Toàn quốc",
    summary: "Quy định hệ thống giáo dục quốc dân, mục tiêu, nguyên lý, quyền và nghĩa vụ của người dạy và người học.",
  },
  {
    code: "TT-28/2020/TT-BGDĐT",
    title: "Thông tư số 28/2020/TT-BGDĐT ban hành Điều lệ trường tiểu học",
    issuedBy: "Bộ Giáo dục và Đào tạo",
    issueDate: "04/09/2020",
    scope: "Cấp Tiểu học",
    summary: "Quy định cơ cấu tổ chức nhà trường, Hội đồng trường, Ban Giám hiệu, tổ chuyên môn và mạng lưới phân hiệu.",
  },
  {
    code: "TT-27/2020/TT-BGDĐT",
    title: "Thông tư số 27/2020/TT-BGDĐT quy định đánh giá học sinh tiểu học",
    issuedBy: "Bộ Giáo dục và Đào tạo",
    issueDate: "04/09/2020",
    scope: "Cấp Tiểu học",
    summary: "Đánh giá thường xuyên và định kỳ vì sự tiến bộ của học sinh; kết hợp lượng hóa điểm số môn học với nhận xét năng lực, phẩm chất.",
  },
  {
    code: "TT-32/2018/TT-BGDĐT",
    title: "Thông tư số 32/2018/TT-BGDĐT ban hành Chương trình GDPT 2018",
    issuedBy: "Bộ Giáo dục và Đào tạo",
    issueDate: "26/12/2018",
    scope: "Toàn quốc",
    summary: "Chương trình Giáo dục Phổ thông 2018 định hướng phát triển toàn diện phẩm chất và năng lực học sinh Tiểu học.",
  },
  {
    code: "CV-2345/BGDĐT-GDTH",
    title: "Công văn số 2345/BGDĐT-GDTH về việc xây dựng kế hoạch giáo dục của nhà trường",
    issuedBy: "Bộ Giáo dục và Đào tạo",
    issueDate: "07/06/2021",
    scope: "Cấp Tiểu học",
    summary: "Khung hướng dẫn xây dựng Kế hoạch giáo dục nhà trường, kế hoạch dạy học các môn học và kế hoạch bài dạy (giáo án).",
  },
  {
    code: "CV-909/BGDĐT-GDTH",
    title: "Công văn số 909/BGDĐT-GDTH hướng dẫn tổ chức hoạt động giáo dục STEM cấp Tiểu học",
    issuedBy: "Bộ Giáo dục và Đào tạo",
    issueDate: "08/03/2023",
    scope: "Cấp Tiểu học",
    summary: "Tích hợp bài học STEM, hoạt động trải nghiệm STEM và ngày hội sáng tạo khoa học kỹ thuật cấp trường.",
  },
  {
    code: "QD-2796/QD-UBND",
    title: "Quyết định số 2796/QĐ-UBND ban hành khung kế hoạch thời gian năm học 2026-2027",
    issuedBy: "Ủy ban nhân dân tỉnh Lào Cai",
    issueDate: "15/08/2026",
    scope: "Tỉnh Lào Cai",
    summary: "Quy định ngày tựu trường, khai giảng 05/09, khung 35 tuần thực học (HK1: 18 tuần, HK2: 17 tuần) và kết thúc năm học trước 31/05/2027.",
  },
  {
    code: "CV-458/PGDDT-TH",
    title: "Công văn số 458/PGDĐT-TH hướng dẫn thực hiện nhiệm vụ năm học 2026-2027 cấp Tiểu học",
    issuedBy: "Phòng GD&ĐT huyện Bảo Thắng",
    issueDate: "28/08/2026",
    scope: "Huyện Bảo Thắng",
    summary: "Hướng dẫn chỉ tiêu chuyên môn, bảo đảm phổ cập GDTH mức độ 3, nâng cao chất lượng dạy học phân hiệu và điểm lẻ.",
  },
];

// 2. Thống kê tổng hợp quy mô năm học 2026-2027
export const PHO_LU_SCHOOL_STATS: SchoolStats = {
  schoolName: "Trường Tiểu học Phố Lu",
  schoolCode: "TH_PHOLU_24001",
  academicYear: "2026-2027",
  totalCampuses: 6, // 1 Điểm TT + 4 Phân hiệu + 1 Điểm lẻ An Tiến
  totalClasses: 62,
  totalStudents: 1706,
  totalStaff: 120,
  totalTeachers: 98,
  totalManagers: 6, // 1 HT + 5 PHT
  totalEmployees: 16, // Kế toán, Y tế, Văn thư, Thiết bị, Bảo vệ, Phục vụ
  inclusiveStudents: 37,
  ethnicMinorityStudents: 682, // 39.98% (Tày, Nùng, Dao, Mông, Giáy)
  poorNearPoorStudents: 245,
  standardSchoolLevel: "Mức độ 2",
  qualityAccreditationLevel: "Cấp độ 3",
};

// 3. Khung thời gian năm học 35 tuần thực học (Quyết định 2796/QĐ-UBND)
export const PHO_LU_ACADEMIC_WEEKS: AcademicWeekSchedule[] = [
  {
    term: 1,
    totalWeeks: 18,
    startDate: "2026-09-08",
    endDate: "2027-01-15",
    midtermAssessmentWeek: 9, // Tuần 9 (Tháng 11/2026)
    finalAssessmentWeek: 18, // Tuần 18 (Tháng 01/2027)
    concludingWeek: 18,
  },
  {
    term: 2,
    totalWeeks: 17,
    startDate: "2027-01-18",
    endDate: "2027-05-25",
    midtermAssessmentWeek: 28, // Tuần 28 (Tháng 03/2027)
    finalAssessmentWeek: 35, // Tuần 35 (Tháng 05/2027)
    concludingWeek: 35,
  },
];

// 4. Lịch dạy bù 5 đợt nghỉ lễ trong năm học 2026-2027
export const PHO_LU_HOLIDAY_MAKEUP_SCHEDULES: HolidayMakeupSchedule[] = [
  {
    id: "HOLIDAY_01_QUOC_KHANH",
    holidayName: "Nghỉ Lễ Quốc khánh 02/09/2026",
    fromDate: "2026-09-01",
    toDate: "2026-09-04",
    totalDaysOff: 4,
    makeupDate: "2026-09-12",
    makeupSession: "Thứ Bảy (Buổi sáng & chiều theo TKB Thứ Tư)",
    note: "Dạy bù đầy đủ các tiết theo đúng tiến độ phân phối chương trình.",
  },
  {
    id: "HOLIDAY_02_TET_DUONG_LICH",
    holidayName: "Nghỉ Tết Dương lịch 2027",
    fromDate: "2027-01-01",
    toDate: "2027-01-01",
    totalDaysOff: 1,
    makeupDate: "2027-01-09",
    makeupSession: "Thứ Bảy (Học bù theo TKB Thứ Sáu)",
    note: "Đảm bảo kết thúc đúng khung tuần 17 Học kỳ 1.",
  },
  {
    id: "HOLIDAY_03_TET_NGUYEN_DAN",
    holidayName: "Nghỉ Tết Nguyên đán Đinh Mùi 2027 (14 ngày)",
    fromDate: "2027-02-08",
    toDate: "2027-02-21",
    totalDaysOff: 14,
    makeupDate: "2027-02-27",
    makeupSession: "Thứ Bảy kết hợp ôn tập trực tuyến & trực tiếp sau Tết",
    note: "Kỳ nghỉ Tết trọn vẹn 2 tuần theo quy định của UBND tỉnh Lào Cai cho học sinh vùng cao.",
  },
  {
    id: "HOLIDAY_04_GIO_TO_HUNG_VUONG",
    holidayName: "Nghỉ Lễ Giỗ tổ Hùng Vương (10/3 Âm lịch)",
    fromDate: "2027-04-16",
    toDate: "2027-04-16",
    totalDaysOff: 1,
    makeupDate: "2027-04-24",
    makeupSession: "Thứ Bảy (Dạy bù TKB Thứ Sáu)",
    note: "Kết hợp sinh hoạt chuyên đề giáo dục truyền thống dựng nước và giữ nước.",
  },
  {
    id: "HOLIDAY_05_30_THANG_4_VA_1_THANG_5",
    holidayName: "Nghỉ Lễ 30/4 & Quốc tế Lao động 01/5",
    fromDate: "2027-04-30",
    toDate: "2027-05-03",
    totalDaysOff: 4,
    makeupDate: "2027-05-08",
    makeupSession: "Thứ Bảy (Dạy bù TKB Thứ Hai và Thứ Sáu)",
    note: "Hoàn tất chuẩn bị cho kỳ kiểm tra đánh giá cuối năm học (Tuần 35).",
  },
];

// 5. 10 Mục tiêu chất lượng giáo dục năm học 2026-2027
export const PHO_LU_QUALITY_TARGETS: QualityTargetItem[] = [
  {
    code: "MTCL-2026-01",
    title: "Huy động trẻ 6 tuổi vào lớp 1 và duy trì sĩ số học sinh 6-11 tuổi",
    metric: "Tỷ lệ huy động và duy trì sĩ số",
    targetPercent: 100.0,
    benchmarkTT27: "Đạt chuẩn Phổ cập GDTH Mức độ 3",
    responsibleRole: "Ban Giám hiệu & Giáo viên chủ nhiệm",
  },
  {
    code: "MTCL-2026-02",
    title: "Tỷ lệ học sinh hoàn thành chương trình lớp học",
    metric: "Tỷ lệ hoàn thành chương trình lớp học",
    targetPercent: 99.2,
    benchmarkTT27: "Mức Hoàn thành Tốt (T) và Hoàn thành (H)",
    responsibleRole: "Phó Hiệu trưởng phụ trách chuyên môn & Tổ trưởng",
  },
  {
    code: "MTCL-2026-03",
    title: "Tỷ lệ học sinh lớp 5 hoàn thành chương trình tiểu học (xét công nhận tốt nghiệp)",
    metric: "Tỷ lệ hoàn thành CTTH Lớp 5",
    targetPercent: 100.0,
    benchmarkTT27: "100% học sinh lớp 5 đủ điều kiện vào lớp 6 THCS",
    responsibleRole: "Tổ Chuyên môn Khối 5 & Ban Giám hiệu",
  },
  {
    code: "MTCL-2026-04",
    title: "Khen thưởng học sinh Xuất sắc và Tiêu biểu cuối năm",
    metric: "Tỷ lệ khen thưởng theo Thông tư 27/2020",
    targetPercent: 65.0,
    benchmarkTT27: "Học sinh Xuất sắc >= 35%, Học sinh Tiêu biểu >= 30%",
    responsibleRole: "Hội đồng Thi đua Khen thưởng",
  },
  {
    code: "MTCL-2026-05",
    title: "Giáo dục học sinh khuyết tật học hòa nhập (37 học sinh)",
    metric: "Tỷ lệ học sinh hòa nhập có kế hoạch cá nhân & được đánh giá vì sự tiến bộ",
    targetPercent: 100.0,
    benchmarkTT27: "Đánh giá vì sự tiến bộ (Điều 11 TT 27/2020)",
    responsibleRole: "Tổ Chuyên môn & Ban Chăm sóc GD hòa nhập",
  },
  {
    code: "MTCL-2026-06",
    title: "Triển khai giáo dục STEM và ngày hội Sáng tạo khoa học",
    metric: "Tỷ lệ lớp học thực hiện bài học STEM (tối thiểu 1 chủ đề/học kỳ)",
    targetPercent: 100.0,
    benchmarkTT27: "Công văn 909/BGDĐT-GDTH",
    responsibleRole: "Tổ Đặc thù, Tổ Khối 1-5 & Câu lạc bộ STEM",
  },
  {
    code: "MTCL-2026-07",
    title: "Dạy học Ngoại ngữ 1 (Tiếng Anh) và Tin học cho học sinh từ Lớp 3 đến Lớp 5",
    metric: "Tỷ lệ học sinh khối 3, 4, 5 được học Tiếng Anh và Tin học",
    targetPercent: 100.0,
    benchmarkTT27: "Chương trình GDPT 2018 bắt buộc",
    responsibleRole: "Tổ Đặc thù (Tiếng Anh, Tin học)",
  },
  {
    code: "MTCL-2026-08",
    title: "Chuyển đổi số, Học bạ số, Sổ điểm điện tử và Giáo án điện tử",
    metric: "Tỷ lệ áp dụng Học bạ số và Sổ điện tử toàn trường",
    targetPercent: 100.0,
    benchmarkTT27: "Đồng bộ Cơ sở dữ liệu ngành GD&ĐT",
    responsibleRole: "Tổ Công nghệ Thông tin & Ban Thư ký số",
  },
  {
    code: "MTCL-2026-09",
    title: "Trình độ đào tạo chuẩn và trên chuẩn của Đội ngũ Cán bộ - Giáo viên",
    metric: "Tỷ lệ CB-GV đạt chuẩn Đại học trở lên (Luật GD 2019)",
    targetPercent: 95.8,
    benchmarkTT27: "Luật Giáo dục 2019",
    responsibleRole: "Ban Giám hiệu & Chi bộ Nhà trường",
  },
  {
    code: "MTCL-2026-10",
    title: "Giáo viên dạy giỏi cấp trường và tham gia cấp huyện",
    metric: "Tỷ lệ giáo viên dạy giỏi cấp trường",
    targetPercent: 80.0,
    benchmarkTT27: "Thông tư 22/2019/TT-BGDĐT",
    responsibleRole: "Công đoàn & Ban Giám hiệu",
  },
];

// 6. Ma trận phân bổ 37 học sinh khuyết tật học hòa nhập theo phân hiệu
export const PHO_LU_INCLUSIVE_STATS: CampusInclusiveStats[] = [
  {
    campusKey: "TRUNG_TAM",
    campusName: "Điểm trường Trung tâm",
    inclusiveCount: 14,
    gradeDistribution: { grade1: 3, grade2: 3, grade3: 3, grade4: 3, grade5: 2 },
    individualPlanStatus: "100%_APPROVED",
  },
  {
    campusKey: "SON_HA_1",
    campusName: "Phân hiệu Sơn Hà 1",
    inclusiveCount: 8,
    gradeDistribution: { grade1: 2, grade2: 2, grade3: 2, grade4: 1, grade5: 1 },
    individualPlanStatus: "100%_APPROVED",
  },
  {
    campusKey: "SON_HA_2",
    campusName: "Phân hiệu Sơn Hà 2",
    inclusiveCount: 6,
    gradeDistribution: { grade1: 1, grade2: 1, grade3: 2, grade4: 1, grade5: 1 },
    individualPlanStatus: "100%_APPROVED",
  },
  {
    campusKey: "SON_HAI",
    campusName: "Phân hiệu Sơn Hải",
    inclusiveCount: 5,
    gradeDistribution: { grade1: 1, grade2: 1, grade3: 1, grade4: 1, grade5: 1 },
    individualPlanStatus: "100%_APPROVED",
  },
  {
    campusKey: "PHO_LU_3",
    campusName: "Phân hiệu Phố Lu 3",
    inclusiveCount: 3,
    gradeDistribution: { grade1: 1, grade2: 1, grade3: 0, grade4: 1, grade5: 0 },
    individualPlanStatus: "100%_APPROVED",
  },
  {
    campusKey: "AN_TIEN",
    campusName: "Điểm trường An Tiến",
    inclusiveCount: 1,
    gradeDistribution: { grade1: 1, grade2: 0, grade3: 0, grade4: 0, grade5: 0 },
    individualPlanStatus: "100%_APPROVED",
  },
];

// Helper functions để tra cứu dữ liệu kế hoạch
export function getCampusInclusiveStats(campusKey: string): CampusInclusiveStats | undefined {
  return PHO_LU_INCLUSIVE_STATS.find((c) => c.campusKey === campusKey);
}

export function getTotalInclusiveStudents(): number {
  return PHO_LU_INCLUSIVE_STATS.reduce((acc, curr) => acc + curr.inclusiveCount, 0);
}

export function getQualityObjectiveByCode(code: string): QualityTargetItem | undefined {
  return PHO_LU_QUALITY_TARGETS.find((q) => q.code === code);
}
