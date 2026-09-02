/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `pnpm vitest run src/lib/__tests__/nq37-compliance.test.ts`.
 * 2. Affected APIs: `src/lib/nq37-engine.ts`.
 * 3. Schemas: Synthetic test data for School, Campuses, and StaffMemberInfo.
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

import { describe, it, expect } from "vitest";
import {
  calculateLeadershipQuota,
  calculateSharedStaffQuota,
  calculateCampusStaffQuota,
  validateStaffQualification,
  calculateDeadlines,
  auditSchoolNQ37,
  NQ37_CONSTANTS,
  type StaffMemberInfo,
} from "../nq37-engine";

describe("NQ 37/2026/NQ-CP Compliance & Quota Engine", () => {
  describe("1. calculateLeadershipQuota (Điều 4)", () => {
    it("returns correct quota for single campus school (Trường đơn sở)", () => {
      const quota = calculateLeadershipQuota(0);
      expect(quota.principalQuota).toBe(1);
      expect(quota.mainCampusViceQuota).toBe(1);
      expect(quota.branchCampusesViceQuota).toBe(0);
      expect(quota.totalViceQuota).toBe(1);
      expect(quota.totalLeadershipQuota).toBe(2);
    });

    it("returns correct quota for multi-campus school with 1 branch campus (1 phân hiệu)", () => {
      const quota = calculateLeadershipQuota(1);
      expect(quota.principalQuota).toBe(1);
      expect(quota.mainCampusViceQuota).toBe(1);
      expect(quota.branchCampusesViceQuota).toBe(1);
      expect(quota.totalViceQuota).toBe(2);
      expect(quota.totalLeadershipQuota).toBe(3);
    });

    it("returns correct quota for multi-campus school with 2 branch campuses (2 phân hiệu)", () => {
      const quota = calculateLeadershipQuota(2);
      expect(quota.principalQuota).toBe(1);
      expect(quota.mainCampusViceQuota).toBe(1);
      expect(quota.branchCampusesViceQuota).toBe(2);
      expect(quota.totalViceQuota).toBe(3);
      expect(quota.totalLeadershipQuota).toBe(4);
    });
  });

  describe("2. calculateSharedStaffQuota (Điều 5.1.a)", () => {
    it("returns 1 accountant for normal school under 40 classes", () => {
      const quota = calculateSharedStaffQuota(30, false);
      expect(quota.accountantQuota).toBe(1);
      expect(quota.clerkQuota).toBe(1);
      expect(quota.treasurerQuota).toBe(1);
      expect(quota.totalSharedQuota).toBe(3);
    });

    it("returns 2 accountants for boarding school with >= 40 classes (Trường nội trú/bán trú quy mô lớn)", () => {
      const quota = calculateSharedStaffQuota(45, true);
      expect(quota.accountantQuota).toBe(2);
      expect(quota.clerkQuota).toBe(1);
      expect(quota.treasurerQuota).toBe(1);
      expect(quota.totalSharedQuota).toBe(4);
    });

    it("returns 1 accountant for boarding school under 40 classes", () => {
      const quota = calculateSharedStaffQuota(36, true);
      expect(quota.accountantQuota).toBe(1);
    });
  });

  describe("3. calculateCampusStaffQuota (Điều 5.1.b)", () => {
    it("allocates 1 person per campus for all 7 campus-specific roles", () => {
      const quota = calculateCampusStaffQuota();
      expect(quota.quotaPerRole.EQUIPMENT_LAB).toBe(1);
      expect(quota.quotaPerRole.LIBRARY).toBe(1);
      expect(quota.quotaPerRole.ACADEMIC_AFFAIRS).toBe(1);
      expect(quota.quotaPerRole.STUDENT_COUNSELING).toBe(1);
      expect(quota.quotaPerRole.DISABILITY_SUPPORT).toBe(1);
      expect(quota.quotaPerRole.IT_OFFICE_ADMIN).toBe(1);
      expect(quota.quotaPerRole.MEDICAL_HEALTH).toBe(1);
      expect(quota.totalPerCampus).toBe(7);
      expect(quota.quotaPerRole.ACCOUNTANT).toBe(0); // Shared role
    });
  });

  describe("4. validateStaffQualification (Điều 5.3)", () => {
    it("BLOCKED: Accountant without accounting certificate/qualification (Điều 5.3.c)", () => {
      const staff: StaffMemberInfo = {
        id: "staff-1",
        name: "Nguyễn Văn A",
        role: "ACCOUNTANT",
        isCertified: false,
        hasAccountingCertificate: false,
      };
      const result = validateStaffQualification(staff);
      expect(result.status).toBe("UNQUALIFIED_BLOCKED");
      expect(result.isBlocked).toBe(true);
      expect(result.message).toContain("Điều 5.3.c");
    });

    it("PASS: Accountant with accounting certificate", () => {
      const staff: StaffMemberInfo = {
        id: "staff-2",
        name: "Trần Thị Kế Toán",
        role: "ACCOUNTANT",
        isCertified: true,
        hasAccountingCertificate: true,
      };
      const result = validateStaffQualification(staff);
      expect(result.status).toBe("QUALIFIED");
      expect(result.isBlocked).toBe(false);
    });

    it("BLOCKED: School nurse/health staff without medical certificate (Điều 5.3.b)", () => {
      const staff: StaffMemberInfo = {
        id: "staff-3",
        name: "Lê Văn C",
        role: "MEDICAL_HEALTH",
        isCertified: false,
        hasMedicalCertificate: false,
      };
      const result = validateStaffQualification(staff);
      expect(result.status).toBe("UNQUALIFIED_BLOCKED");
      expect(result.isBlocked).toBe(true);
      expect(result.message).toContain("Điều 5.3.b");
    });

    it("TRANSITIONAL 36M: Equipment staff in 36-month training transition (Điều 5.3.a)", () => {
      const staff: StaffMemberInfo = {
        id: "staff-4",
        name: "Phạm Văn Thiết Bị",
        role: "EQUIPMENT_LAB",
        isCertified: false,
      };
      const result = validateStaffQualification(staff);
      expect(result.status).toBe("IN_TRAINING_36M");
      expect(result.isBlocked).toBe(false);
      expect(result.message).toContain("36 tháng");
    });
  });

  describe("5. calculateDeadlines (Điều 8 & Điều 5.3.a)", () => {
    it("computes countdown to 30/09/2026 and 05/08/2029 correctly", () => {
      const testDate = new Date("2026-09-01T00:00:00Z");
      const deadlines = calculateDeadlines(testDate);
      expect(deadlines.arrangementDaysLeft).toBeGreaterThan(0);
      expect(deadlines.standardizationMonthsLeft).toBeGreaterThan(0);
      expect(deadlines.arrangementDeadlineStr).toBe("30/09/2026");
      expect(deadlines.standardizationDeadlineStr).toBe("05/08/2029");
    });
  });

  describe("6. auditSchoolNQ37 Full School Scorecard", () => {
    it("returns COMPLIANT with score 100 for perfectly staffed multi-campus school", () => {
      const audit = auditSchoolNQ37({
        schoolId: "sch-1",
        schoolName: "THPT Chuyên Trần Phú",
        totalClasses: 36,
        isBoardingOrDayBoarding: false,
        principalCount: 1,
        mainCampusViceCount: 1,
        branchCampusViceCount: 1, // 1 branch campus -> 1 vice
        campuses: [
          {
            id: "c-main",
            name: "Cơ sở Lê Hồng Phong (Trường chính)",
            isMainCampus: true,
            staff: [
              { id: "s1", name: "Nguyễn Thị Kế Toán", role: "ACCOUNTANT", isCertified: true, hasAccountingCertificate: true },
              { id: "s2", name: "Trần Văn Thư", role: "CLERK", isCertified: true },
              { id: "s3", name: "Lê Thủ Quỹ", role: "TREASURER", isCertified: true },
              { id: "s4", name: "Phạm Thiết Bị", role: "EQUIPMENT_LAB", isCertified: true },
              { id: "s5", name: "Đỗ Thư Viện", role: "LIBRARY", isCertified: true },
              { id: "s6", name: "Vũ Giáo Vụ", role: "ACADEMIC_AFFAIRS", isCertified: true },
              { id: "s7", name: "Hoàng Tâm Lý", role: "STUDENT_COUNSELING", isCertified: true },
              { id: "s8", name: "Bùi Khuyết Tật", role: "DISABILITY_SUPPORT", isCertified: true },
              { id: "s9", name: "Ngô CNTT", role: "IT_OFFICE_ADMIN", isCertified: true },
              { id: "s10", name: "Đặng Y Tế", role: "MEDICAL_HEALTH", isCertified: true, hasMedicalCertificate: true },
            ],
          },
          {
            id: "c-branch",
            name: "Cơ sở 2 (Phân hiệu)",
            isMainCampus: false,
            staff: [
              { id: "s11", name: "Lý Thiết Bị 2", role: "EQUIPMENT_LAB", isCertified: true },
              { id: "s12", name: "Trịnh Thư Viện 2", role: "LIBRARY", isCertified: true },
              { id: "s13", name: "Mai Giáo Vụ 2", role: "ACADEMIC_AFFAIRS", isCertified: true },
              { id: "s14", name: "Đinh Tâm Lý 2", role: "STUDENT_COUNSELING", isCertified: true },
              { id: "s15", name: "Lâm Khuyết Tật 2", role: "DISABILITY_SUPPORT", isCertified: true },
              { id: "s16", name: "Dương CNTT 2", role: "IT_OFFICE_ADMIN", isCertified: true },
              { id: "s17", name: "Bạch Y Tế 2", role: "MEDICAL_HEALTH", isCertified: true, hasMedicalCertificate: true },
            ],
          },
        ],
        now: new Date("2026-09-01"),
      });

      expect(audit.overallScore).toBe(100);
      expect(audit.status).toBe("COMPLIANT");
      expect(audit.leadershipAudit.isCompliant).toBe(true);
      expect(audit.sharedStaffAudit.isCompliant).toBe(true);
      expect(audit.criticalViolations.length).toBe(0);
    });

    it("detects surplus Vice Principals and suggests Decree 178 allowance retention", () => {
      const audit = auditSchoolNQ37({
        schoolId: "sch-2",
        schoolName: "THPT Sáp Nhập Mới",
        totalClasses: 30,
        isBoardingOrDayBoarding: false,
        principalCount: 1,
        mainCampusViceCount: 2, // Excess: 2 at main campus
        branchCampusViceCount: 2, // Excess: 2 at 1 branch campus
        campuses: [
          {
            id: "c-main",
            name: "Trường chính",
            isMainCampus: true,
            staff: [],
          },
          {
            id: "c-branch",
            name: "Phân hiệu 1",
            isMainCampus: false,
            staff: [],
          },
        ],
        now: new Date("2026-09-01"),
      });

      expect(audit.leadershipAudit.isCompliant).toBe(false);
      expect(audit.leadershipAudit.excessVicePrincipals).toBe(2);
      expect(audit.actionRecommendations.some((r) => r.legalBasis.includes("Nghị quyết 37"))).toBe(true);
      expect(audit.actionRecommendations.some((r) => r.description.includes("178/2024/NĐ-CP"))).toBe(true);
    });

    it("triggers CRITICAL_VIOLATION when uncertified staff is assigned to Y tế or Kế toán", () => {
      const audit = auditSchoolNQ37({
        schoolId: "sch-3",
        schoolName: "THPT Vi Phạm Tiêu Chuẩn",
        totalClasses: 25,
        isBoardingOrDayBoarding: false,
        principalCount: 1,
        mainCampusViceCount: 1,
        branchCampusViceCount: 0,
        campuses: [
          {
            id: "c-main",
            name: "Trường chính",
            isMainCampus: true,
            staff: [
              {
                id: "s-bad-med",
                name: "Nguyễn Văn Không Bằng Y",
                role: "MEDICAL_HEALTH",
                isCertified: false,
                hasMedicalCertificate: false,
              },
            ],
          },
        ],
        now: new Date("2026-09-01"),
      });

      expect(audit.status).toBe("CRITICAL_VIOLATION");
      expect(audit.criticalViolations.length).toBeGreaterThan(0);
      expect(audit.criticalViolations[0]).toContain("vi phạm tiêu chuẩn");
    });
  });
});
