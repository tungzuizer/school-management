/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner executing Security Hardening & Audit Verification
 * 2. Affected APIs: `validatePasswordPolicy`, `logSecurityEvent`, `maskSensitiveValue`, `checkRateLimit`, `checkLoginRateLimit`
 * 3. Purpose: Verifies compliance with OWASP Top 10:2025 (A02, A04, A07) and Vietnamese Decree 13/2023/ND-CP.
 */

import { describe, it, expect, vi } from "vitest";
import {
  validatePasswordPolicy,
  maskSensitiveValue,
  logSecurityEvent,
  WEAK_PASSWORDS_BLACKLIST,
} from "@/lib/security-logger";
import { checkRateLimit, checkLoginRateLimit } from "@/lib/rate-limiter";

describe("Security Hardening & Defense-in-Depth Suite", () => {
  describe("1. Password Complexity & Policy Enforcement (OWASP A07)", () => {
    it("should reject passwords shorter than 8 characters", () => {
      expect(validatePasswordPolicy("").valid).toBe(false);
      expect(validatePasswordPolicy("12345").valid).toBe(false);
      expect(validatePasswordPolicy("abc12").valid).toBe(false);
      expect(validatePasswordPolicy("Abc1234").valid).toBe(false);
    });

    it("should reject passwords without any digits", () => {
      const res = validatePasswordPolicy("Abcdefghijk");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("kết hợp cả chữ cái và số");
    });

    it("should reject passwords without any letters", () => {
      const res = validatePasswordPolicy("987162534012");
      expect(res.valid).toBe(false);
      expect(res.error).toContain("kết hợp cả chữ cái và số");
    });

    it("should reject blacklisted and common weak passwords", () => {
      for (const weak of WEAK_PASSWORDS_BLACKLIST) {
        const res = validatePasswordPolicy(weak);
        expect(res.valid).toBe(false);
      }
    });

    it("should accept strong compliant passwords meeting all policy criteria", () => {
      expect(validatePasswordPolicy("PhoLu@2026").valid).toBe(true);
      expect(validatePasswordPolicy("GiaoVien#1A1").valid).toBe(true);
      expect(validatePasswordPolicy("SecureP@ssw0rd!").valid).toBe(true);
      expect(validatePasswordPolicy("TieuHocPholu2026").valid).toBe(true);
    });
  });

  describe("2. Security Audit Logging & Sensitive Data Masking", () => {
    it("should mask email addresses to prevent PII exposure in logs", () => {
      expect(maskSensitiveValue("admin@school.com")).toBe("ad***@school.com");
      expect(maskSensitiveValue("hieutruong.thpholu@gmail.com")).toBe("hi***@gmail.com");
      expect(maskSensitiveValue("a@b.com")).toBe("*@b.com");
    });

    it("should mask short sensitive non-email tokens", () => {
      expect(maskSensitiveValue("123")).toBe("****");
      expect(maskSensitiveValue("12345678")).toBe("12***78");
    });

    it("should emit structured log entries with correct metadata", () => {
      const spyInfo = vi.spyOn(console, "info").mockImplementation(() => {});

      const log = logSecurityEvent({
        eventType: "AUTH_LOGIN_SUCCESS",
        severity: "INFO",
        userId: "usr_123",
        userEmail: "teacher@school.edu.vn",
        userRole: "TEACHER",
        message: "User logged in successfully",
        metadata: { ip: "127.0.0.1" },
      });

      expect(log.eventType).toBe("AUTH_LOGIN_SUCCESS");
      expect(log.severity).toBe("INFO");
      expect(log.userEmail).toBe("te***@school.edu.vn");
      expect(log.timestamp).toBeDefined();
      expect(spyInfo).toHaveBeenCalled();

      spyInfo.mockRestore();
    });

    it("should route WARN and ERROR severity logs to console.warn/console.error", () => {
      const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const spyError = vi.spyOn(console, "error").mockImplementation(() => {});

      logSecurityEvent({
        eventType: "RATE_LIMIT_TRIGGERED",
        severity: "WARN",
        message: "Rate limit triggered",
      });
      expect(spyWarn).toHaveBeenCalled();

      logSecurityEvent({
        eventType: "UNAUTHORIZED_ACCESS_ATTEMPT",
        severity: "ERROR",
        message: "Unauthorized attempt",
      });
      expect(spyError).toHaveBeenCalled();

      spyWarn.mockRestore();
      spyError.mockRestore();
    });
  });

  describe("3. Rate Limiting & Anti-Brute-Force Guard (OWASP A07)", () => {
    it("should allow requests under the limit threshold", () => {
      const key = `test-limit-${Date.now()}`;
      const res1 = checkRateLimit(key, 3, 5000);
      expect(res1.allowed).toBe(true);
      expect(res1.remaining).toBe(2);

      const res2 = checkRateLimit(key, 3, 5000);
      expect(res2.allowed).toBe(true);
      expect(res2.remaining).toBe(1);
    });

    it("should block requests exceeding the threshold", () => {
      const key = `test-block-${Date.now()}`;
      checkRateLimit(key, 2, 5000);
      checkRateLimit(key, 2, 5000);

      const blockedRes = checkRateLimit(key, 2, 5000);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.retryAfterMs).toBeGreaterThan(0);
    });

    it("should properly enforce login rate limiting per email", () => {
      const uniqueEmail = `victim_${Date.now()}@example.com`;
      for (let i = 0; i < 5; i++) {
        const res = checkLoginRateLimit(uniqueEmail);
        expect(res.allowed).toBe(true);
      }

      const blockedRes = checkLoginRateLimit(uniqueEmail);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.retryAfterMs).toBeGreaterThan(0);
    });
  });
});
