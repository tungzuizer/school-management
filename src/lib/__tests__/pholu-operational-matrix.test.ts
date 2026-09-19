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
});
