/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner executing Security Baseline Verification (Phase 4)
 * 2. Affected API: isSuperAdmin, assertCampusAccess, anonymizePIIForAI, extractRecordIds
 * 3. Data Schemas: TenantContext and string parsing regex
 * 4. Verbatim User Instruction: "tiếp tục đi"
 */

import { describe, it, expect } from "vitest";
import { isSuperAdmin, assertCampusAccess, TenantContext } from "@/lib/tenant";
import { anonymizePIIForAI, extractRecordIds, checkIsInsufficientData } from "@/lib/ai/data-integrity";

describe("Security Baseline Verification Suite (Phase 4)", () => {
  describe("1. Privilege Escalation & RBAC Invariant (SEC-01)", () => {
    it("should NOT grant SuperAdmin role based on email containing 'superadmin' substring", () => {
      const attackerContext = {
        role: "TEACHER",
        email: "attacker_superadmin_spoof@gmail.com",
      };
      expect(isSuperAdmin(attackerContext)).toBe(false);
    });

    it("should NOT grant SuperAdmin role to regular teacher with sysadmin in email", () => {
      const fakeContext = {
        role: "TEACHER",
        email: "sysadmin@fake-domain.com",
      };
      expect(isSuperAdmin(fakeContext)).toBe(false);
    });

    it("should strictly grant SuperAdmin only when role is explicitly SUPER_ADMIN", () => {
      const legitimateSuperAdmin = {
        role: "SUPER_ADMIN",
        email: "superadmin@school.com",
      };
      expect(isSuperAdmin(legitimateSuperAdmin)).toBe(true);
    });
  });

  describe("2. Multi-Campus Scoping & IDOR / BOLA Guard (SEC-04)", () => {
    it("should allow Vice Principal to access their own assigned campus", () => {
      const phtCampusA: TenantContext = {
        userId: "usr_pht_01",
        userName: "Phó Hiệu Trưởng Điểm A",
        userRole: "VICE_PRINCIPAL",
        schoolId: "sch_01",
        campusId: "cmp_sonha1",
      };

      expect(() => {
        assertCampusAccess(phtCampusA, "cmp_sonha1");
      }).not.toThrow();
    });

    it("should throw 403 Forbidden when Vice Principal attempts to access another campus (IDOR)", () => {
      const phtCampusA: TenantContext = {
        userId: "usr_pht_01",
        userName: "Phó Hiệu Trưởng Điểm A",
        userRole: "VICE_PRINCIPAL",
        schoolId: "sch_01",
        campusId: "cmp_sonha1",
      };

      expect(() => {
        assertCampusAccess(phtCampusA, "cmp_sonha2");
      }).toThrow(/403/);
    });
  });

  describe("3. AI Safety & PII Scrubbing (SEC-09)", () => {
    it("should mask Vietnamese National ID / CCCD numbers in prompts", () => {
      const rawPrompt = "Học sinh Nguyễn Văn A có số CCCD 001206012345 cần tra cứu kết quả.";
      const scrubbed = anonymizePIIForAI(rawPrompt);
      expect(scrubbed).not.toContain("001206012345");
      expect(scrubbed).toContain("001******345");
    });

    it("should mask phone numbers in prompts", () => {
      const rawPrompt = "Phụ huynh số điện thoại 0912345678 xin nghỉ phép cho con.";
      const scrubbed = anonymizePIIForAI(rawPrompt);
      expect(scrubbed).not.toContain("0912345678");
      expect(scrubbed).toContain("091****678");
    });

    it("should mask personal emails in prompts", () => {
      const rawPrompt = "Liên hệ qua email phuhuynh.nguyenvana@gmail.com để nhận học bạ.";
      const scrubbed = anonymizePIIForAI(rawPrompt);
      expect(scrubbed).not.toContain("phuhuynh.nguyenvana@gmail.com");
      expect(scrubbed).toContain("ph***@gmail.com");
    });
  });

  describe("4. AI Data Integrity & Grounding Engine", () => {
    it("should extract record IDs from structured markdown brackets", () => {
      const text = "Học sinh đạt 8.5 điểm môn Toán [id=score_clx123] và có tiến bộ [record_id=score_clx456].";
      const ids = extractRecordIds(text);
      expect(ids).toContain("score_clx123");
      expect(ids).toContain("score_clx456");
    });

    it("should correctly detect insufficient data keywords", () => {
      const text = "Hiện tại hệ thống chưa đủ dữ liệu 3 kỳ tối thiểu để phân tích hồi quy OLS.";
      const check = checkIsInsufficientData(text);
      expect(check.isInsufficient).toBe(true);
    });
  });
});
