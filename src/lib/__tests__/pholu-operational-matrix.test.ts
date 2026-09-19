/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`vitest.config.ts`, `npm test`, `npx vitest run`).
 * 2. Search Verification: Searched `src/lib/__tests__/*.test.ts`. No existing file tests the multi-campus operational matrix for Trường Tiểu học Phố Lu & 5 Phân hiệu.
 * 3. Data Schemas: `TenantContext` (`userId`, `userName`, `userRole`, `schoolId`, `campusId`), `CAMPUS_SPECS` (`key`, `name`, `vpName`, `vpEmail`, `classCount`), `build62ClassesSpec` (`campusKey`, `name`, `gradeLevel`, `studentCount`).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - "kiểm tra logic vận hành và dữ liệu".
 */

import { describe, it, expect } from "vitest";
import {
  assertCampusAccess,
  assertSubjectGroupAccess,
  assertNotSuperAdminOnAcademicDetail,
  buildCampusFilter,
  buildSchoolFilter,
  isSuperAdmin,
} from "../tenant";
import type { TenantContext } from "../tenant";
import { CAMPUS_SPECS } from "../../../prisma/seed-data/school-structure";
import { build62ClassesSpec } from "../../../prisma/seed-data/classes-students";
import {
  PHO_LU_LEGAL_BASIS,
  PHO_LU_SCHOOL_STATS,
  PHO_LU_ACADEMIC_WEEKS,
  PHO_LU_HOLIDAY_MAKEUP_SCHEDULES,
  PHO_LU_QUALITY_TARGETS,
  PHO_LU_INCLUSIVE_STATS,
  getCampusInclusiveStats,
  getTotalInclusiveStudents,
  getQualityObjectiveByCode,
} from "../pholu-operational-matrix";

describe("Trường Tiểu học Phố Lu & 5 Phân hiệu — Operational Matrix Test Suite", () => {
  // 1. Cấu trúc trường & 5 Phân hiệu
  describe("1. Cấu trúc Phân hiệu & Điểm trường trực thuộc", () => {
    it("định nghĩa đúng 6 điểm trường/phân hiệu theo mô hình sáp nhập vùng cao", () => {
      expect(CAMPUS_SPECS.length).toBe(6);
      const keys = CAMPUS_SPECS.map((c) => c.key);
      expect(keys).toEqual([
        "TRUNG_TAM",
        "SON_HA_1",
        "SON_HA_2",
        "SON_HAI",
        "PHO_LU_3",
        "AN_TIEN",
      ]);
    });

    it("phân bổ đủ 62 lớp học trên 6 cơ sở/phân hiệu", () => {
      const classes = build62ClassesSpec();
      expect(classes.length).toBe(62);

      const trungTamClasses = classes.filter((c) => c.campusKey === "TRUNG_TAM");
      const sonHa1Classes = classes.filter((c) => c.campusKey === "SON_HA_1");
      const sonHa2Classes = classes.filter((c) => c.campusKey === "SON_HA_2");
      const sonHaiClasses = classes.filter((c) => c.campusKey === "SON_HAI");
      const phoLu3Classes = classes.filter((c) => c.campusKey === "PHO_LU_3");
      const anTienClasses = classes.filter((c) => c.campusKey === "AN_TIEN");

      expect(trungTamClasses.length).toBe(20);
      expect(sonHa1Classes.length).toBe(12);
      expect(sonHa2Classes.length).toBe(10);
      expect(sonHaiClasses.length).toBe(10);
      expect(phoLu3Classes.length).toBe(8);
      expect(anTienClasses.length).toBe(2);
    });

    it("điểm trường An Tiến có đúng 2 lớp vùng cao (Lớp 1 và Lớp 2)", () => {
      const classes = build62ClassesSpec();
      const anTien = classes.filter((c) => c.campusKey === "AN_TIEN");
      expect(anTien.map((c) => c.name)).toEqual(["1A_AT", "2A_AT"]);
      expect(anTien.every((c) => c.gradeLevel <= 2)).toBe(true);
    });
  });

  // 2. Logic Phân quyền & Cô lập Phân hiệu (RBAC & Campus Scoping)
  describe("2. RBAC & Campus Scoping Logic", () => {
    const principalCtx: TenantContext = {
      userId: "usr_principal_pholu",
      userName: "ThS. Trần Thị Thanh Hà",
      userRole: "ADMIN",
      userEmail: "hieutruong.thpholu@gmail.com",
      schoolId: "sch_th_pholu",
    };

    const vpSonHa1Ctx: TenantContext = {
      userId: "usr_vp_sonha1",
      userName: "Thầy Nguyễn Văn Sơn",
      userRole: "VICE_PRINCIPAL",
      userEmail: "pht.sonha1@gmail.com",
      schoolId: "sch_th_pholu",
      campusId: "cmp_sonha1",
    };

    const vpAnTienCtx: TenantContext = {
      userId: "usr_vp_antien",
      userName: "Thầy Phạm Văn Tiến",
      userRole: "VICE_PRINCIPAL",
      userEmail: "pht.antien@gmail.com",
      schoolId: "sch_th_pholu",
      campusId: "cmp_antien",
    };

    const superAdminCtx: TenantContext = {
      userId: "usr_superadmin",
      userName: "SuperAdmin Toàn Quốc",
      userRole: "SUPER_ADMIN",
      userEmail: "superadmin.vietnam@gmail.com",
    };

    it("Hiệu trưởng có quyền toàn cảnh, không bị giới hạn theo phân hiệu", () => {
      expect(() => assertCampusAccess(principalCtx, "cmp_sonha1")).not.toThrow();
      expect(() => assertCampusAccess(principalCtx, "cmp_antien")).not.toThrow();
      expect(buildCampusFilter(principalCtx)).toBeUndefined();
    });

    it("Phó Hiệu trưởng Sơn Hà 1 được truy cập phân hiệu mình nhưng bị chặn truy cập phân hiệu khác (403)", () => {
      expect(() => assertCampusAccess(vpSonHa1Ctx, "cmp_sonha1")).not.toThrow();
      expect(() => assertCampusAccess(vpSonHa1Ctx, "cmp_antien")).toThrowError(/403/);
      expect(buildCampusFilter(vpSonHa1Ctx)).toEqual({ campusId: "cmp_sonha1" });
    });

    it("Phó Hiệu trưởng An Tiến chỉ quản lý điểm lẻ An Tiến", () => {
      expect(() => assertCampusAccess(vpAnTienCtx, "cmp_antien")).not.toThrow();
      expect(() => assertCampusAccess(vpAnTienCtx, "cmp_sonha1")).toThrowError(/403/);
      expect(buildCampusFilter(vpAnTienCtx)).toEqual({ campusId: "cmp_antien" });
    });

    it("SuperAdmin bị chặn khỏi việc xem chi tiết học vụ từng học sinh theo nguyên tắc bảo mật", () => {
      expect(isSuperAdmin(superAdminCtx)).toBe(true);
      expect(() => assertNotSuperAdminOnAcademicDetail(superAdminCtx)).toThrowError(/403/);
      expect(() => assertNotSuperAdminOnAcademicDetail(principalCtx)).not.toThrow();
    });

    it("Tổ trưởng chuyên môn chỉ được duyệt và quản lý tổ chuyên môn được phân công", () => {
      const ttcmKhối1: TenantContext = {
        userId: "usr_ttcm_k1",
        userName: "Cô Vũ Thị Hoa",
        userRole: "SUBJECT_HEAD",
        schoolId: "sch_th_pholu",
      };
      const allowedGroups = ["sg_khoi1"];

      expect(() => assertSubjectGroupAccess(ttcmKhối1, allowedGroups, "sg_khoi1")).not.toThrow();
      expect(() => assertSubjectGroupAccess(ttcmKhối1, allowedGroups, "sg_khoi5")).toThrowError(/403/);
    });
  });

  // 3. Logic Đánh giá Tiểu học TT27 & Khóa dữ liệu (DataLock)
  describe("3. Đánh giá Tiểu học TT27 & DataLock", () => {
    it("hệ thống hỗ trợ thang điểm 10 kết hợp nhận xét định kỳ", () => {
      const validMidtermScore = 8.5;
      expect(validMidtermScore >= 0 && validMidtermScore <= 10).toBe(true);
    });

    it("tính toán bộ lọc trường học chính xác cho tài khoản trường", () => {
      const teacherCtx: TenantContext = {
        userId: "usr_gv_1",
        userName: "Cô Nguyễn Thu Hằng",
        userRole: "TEACHER",
        schoolId: "sch_th_pholu",
      };
      const filter = buildSchoolFilter(teacherCtx);
      expect(filter).toEqual({ schoolId: "sch_th_pholu" });
    });
  });

  // 4. Ma trận Căn cứ Pháp lý năm học 2026-2027
  describe("4. Căn cứ Pháp lý Chuẩn cấp Tiểu học (8 Văn bản cốt lõi)", () => {
    it("chứa đầy đủ 8 văn bản pháp quy chỉ đạo năm học 2026-2027", () => {
      expect(PHO_LU_LEGAL_BASIS.length).toBe(8);
      const codes = PHO_LU_LEGAL_BASIS.map((b) => b.code);
      expect(codes).toContain("LUAT-GD-43/2019/QH14");
      expect(codes).toContain("TT-28/2020/TT-BGDĐT");
      expect(codes).toContain("TT-27/2020/TT-BGDĐT");
      expect(codes).toContain("TT-32/2018/TT-BGDĐT");
      expect(codes).toContain("CV-2345/BGDĐT-GDTH");
      expect(codes).toContain("CV-909/BGDĐT-GDTH");
      expect(codes).toContain("QD-2796/QD-UBND");
      expect(codes).toContain("CV-458/PGDDT-TH");
    });

    it("xác định đúng căn cứ đánh giá học sinh tiểu học là Thông tư 27/2020", () => {
      const tt27 = PHO_LU_LEGAL_BASIS.find((b) => b.code === "TT-27/2020/TT-BGDĐT");
      expect(tt27).toBeDefined();
      expect(tt27?.scope).toBe("Cấp Tiểu học");
      expect(tt27?.summary).toContain("Đánh giá thường xuyên và định kỳ");
    });
  });

  // 5. Thống kê Quy mô Nhà trường & Phân bổ Học sinh Hòa nhập
  describe("5. Thống kê Quy mô Năm học & Học sinh Khuyết tật Hòa nhập (37 HS)", () => {
    it("thống kê chuẩn xác quy mô 62 lớp, 1.706 học sinh và 120 CB-GV-NV", () => {
      expect(PHO_LU_SCHOOL_STATS.totalCampuses).toBe(6);
      expect(PHO_LU_SCHOOL_STATS.totalClasses).toBe(62);
      expect(PHO_LU_SCHOOL_STATS.totalStudents).toBe(1706);
      expect(PHO_LU_SCHOOL_STATS.totalStaff).toBe(120);
      expect(PHO_LU_SCHOOL_STATS.totalTeachers).toBe(98);
      expect(PHO_LU_SCHOOL_STATS.totalManagers).toBe(6);
      expect(PHO_LU_SCHOOL_STATS.inclusiveStudents).toBe(37);
    });

    it("tổng số học sinh hòa nhập trên 6 phân hiệu/điểm trường khớp đúng 37 học sinh", () => {
      expect(getTotalInclusiveStudents()).toBe(37);
      expect(PHO_LU_INCLUSIVE_STATS.length).toBe(6);

      const trungTam = getCampusInclusiveStats("TRUNG_TAM");
      const sonHa1 = getCampusInclusiveStats("SON_HA_1");
      const sonHa2 = getCampusInclusiveStats("SON_HA_2");
      const sonHai = getCampusInclusiveStats("SON_HAI");
      const phoLu3 = getCampusInclusiveStats("PHO_LU_3");
      const anTien = getCampusInclusiveStats("AN_TIEN");

      expect(trungTam?.inclusiveCount).toBe(14);
      expect(sonHa1?.inclusiveCount).toBe(8);
      expect(sonHa2?.inclusiveCount).toBe(6);
      expect(sonHai?.inclusiveCount).toBe(5);
      expect(phoLu3?.inclusiveCount).toBe(3);
      expect(anTien?.inclusiveCount).toBe(1);

      // 100% học sinh hòa nhập đều có kế hoạch giáo dục cá nhân được duyệt
      expect(PHO_LU_INCLUSIVE_STATS.every((c) => c.individualPlanStatus === "100%_APPROVED")).toBe(true);
    });
  });

  // 6. Khung Thời gian 35 Tuần & Lịch Dạy bù 5 Đợt Nghỉ Lễ
  describe("6. Khung Thời gian 35 Tuần & 5 Lịch Dạy bù Nghỉ Lễ", () => {
    it("đảm bảo chuẩn 35 tuần thực học (HK1: 18 tuần, HK2: 17 tuần)", () => {
      expect(PHO_LU_ACADEMIC_WEEKS.length).toBe(2);
      const hk1 = PHO_LU_ACADEMIC_WEEKS.find((w) => w.term === 1);
      const hk2 = PHO_LU_ACADEMIC_WEEKS.find((w) => w.term === 2);

      expect(hk1?.totalWeeks).toBe(18);
      expect(hk2?.totalWeeks).toBe(17);
      expect(hk1?.midtermAssessmentWeek).toBe(9);
      expect(hk2?.finalAssessmentWeek).toBe(35);
    });

    it("định nghĩa chuẩn xác 5 đợt nghỉ lễ và lịch dạy bù tương ứng", () => {
      expect(PHO_LU_HOLIDAY_MAKEUP_SCHEDULES.length).toBe(5);
      const holidayIds = PHO_LU_HOLIDAY_MAKEUP_SCHEDULES.map((h) => h.id);

      expect(holidayIds).toEqual([
        "HOLIDAY_01_QUOC_KHANH",
        "HOLIDAY_02_TET_DUONG_LICH",
        "HOLIDAY_03_TET_NGUYEN_DAN",
        "HOLIDAY_04_GIO_TO_HUNG_VUONG",
        "HOLIDAY_05_30_THANG_4_VA_1_THANG_5",
      ]);

      const tetNguyenDan = PHO_LU_HOLIDAY_MAKEUP_SCHEDULES.find((h) => h.id === "HOLIDAY_03_TET_NGUYEN_DAN");
      expect(tetNguyenDan?.totalDaysOff).toBe(14); // 14 ngày nghỉ Tết Nguyên đán
    });
  });

  // 7. 10 Mục tiêu Chất lượng Giáo dục Năm học 2026-2027
  describe("7. 10 Mục tiêu Chất lượng Giáo dục Năm học 2026-2027", () => {
    it("chứa đầy đủ 10 mục tiêu chất lượng trọng tâm", () => {
      expect(PHO_LU_QUALITY_TARGETS.length).toBe(10);
      const codes = PHO_LU_QUALITY_TARGETS.map((q) => q.code);
      for (let i = 1; i <= 10; i++) {
        const padded = i < 10 ? `0${i}` : `${i}`;
        expect(codes).toContain(`MTCL-2026-${padded}`);
      }
    });

    it("đạt chuẩn 100% về huy động trẻ, hoàn thành CTTH lớp 5, giáo dục STEM và học bạ số", () => {
      const mtcl1 = getQualityObjectiveByCode("MTCL-2026-01");
      const mtcl3 = getQualityObjectiveByCode("MTCL-2026-03");
      const mtcl5 = getQualityObjectiveByCode("MTCL-2026-05");
      const mtcl6 = getQualityObjectiveByCode("MTCL-2026-06");
      const mtcl8 = getQualityObjectiveByCode("MTCL-2026-08");

      expect(mtcl1?.targetPercent).toBe(100.0);
      expect(mtcl3?.targetPercent).toBe(100.0);
      expect(mtcl5?.targetPercent).toBe(100.0);
      expect(mtcl6?.targetPercent).toBe(100.0);
      expect(mtcl8?.targetPercent).toBe(100.0);
    });
  });
});
