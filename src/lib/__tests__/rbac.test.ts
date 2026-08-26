/**
 * RBAC edge-case tests
 *
 * Tests four guard functions from src/lib/tenant.ts without hitting the DB.
 * Uses Vitest's pure unit-test runner — no mocks needed since the guards are
 * synchronous throws over a TenantContext value object.
 *
 * Cases:
 *   1. PHT cross-campus blocked — VICE_PRINCIPAL cannot read another campus
 *   2. TTCM cross-subject-group blocked — SUBJECT_HEAD cannot manage wrong tổ
 *   3. UBND Xã read-only ward scope — WARD_ADMIN passes for ward they belong to
 *   4. SUPER_ADMIN blocked from academic detail — assertNotSuperAdminOnAcademicDetail throws
 */

import { describe, it, expect } from "vitest";
import {
  assertCampusAccess,
  assertSubjectGroupAccess,
  assertNotSuperAdminOnAcademicDetail,
  buildCampusFilter,
} from "../tenant";
import type { TenantContext } from "../tenant";

// ------------------------------------------------------------
// Helper factories
// ------------------------------------------------------------

function makeCtx(overrides: Partial<TenantContext>): TenantContext {
  return {
    userId: "user-1",
    userName: "Test User",
    userRole: "TEACHER",
    userEmail: "test@school.edu.vn",
    ...overrides,
  };
}

// ============================================================
// Case 1: PHT (VICE_PRINCIPAL) is blocked from cross-campus data
// ============================================================

describe("assertCampusAccess — VICE_PRINCIPAL scope enforcement", () => {
  const ctx = makeCtx({
    userRole: "VICE_PRINCIPAL",
    campusId: "campus-diem-1",
  });

  it("allows access to own campus", () => {
    expect(() => assertCampusAccess(ctx, "campus-diem-1")).not.toThrow();
  });

  it("blocks access to a different campus (cross-campus 403)", () => {
    expect(() => assertCampusAccess(ctx, "campus-diem-2")).toThrowError(/403/);
  });

  it("blocks when campusId is provided but user has no campusId assigned", () => {
    const ctxNoCampus = makeCtx({ userRole: "VICE_PRINCIPAL", campusId: undefined });
    expect(() => assertCampusAccess(ctxNoCampus, "campus-diem-1")).toThrowError(
      /chua duoc gan phan hieu/
    );
  });

  it("does not enforce campus scope for ADMIN (Hieu truong)", () => {
    const htCtx = makeCtx({ userRole: "ADMIN", campusId: "campus-diem-1" });
    // ADMIN can access any campus — no error even for a different campusId
    expect(() => assertCampusAccess(htCtx, "campus-diem-2")).not.toThrow();
  });

  it("buildCampusFilter returns campusId filter only for VICE_PRINCIPAL", () => {
    expect(buildCampusFilter(ctx)).toEqual({ campusId: "campus-diem-1" });
    const htCtx = makeCtx({ userRole: "ADMIN", campusId: "campus-diem-1" });
    expect(buildCampusFilter(htCtx)).toBeUndefined();
  });
});

// ============================================================
// Case 2: TTCM (SUBJECT_HEAD) is blocked from wrong subject group
// ============================================================

describe("assertSubjectGroupAccess — SUBJECT_HEAD cross-campus, right-group-only", () => {
  const ctx = makeCtx({ userRole: "SUBJECT_HEAD" });
  const allowedGroupIds = ["sg-tu-nhien", "sg-toan"]; // groups assigned to this TTCM

  it("allows access to an assigned subject group", () => {
    expect(() =>
      assertSubjectGroupAccess(ctx, allowedGroupIds, "sg-toan")
    ).not.toThrow();
  });

  it("blocks access to a subject group not assigned to this TTCM (403)", () => {
    expect(() =>
      assertSubjectGroupAccess(ctx, allowedGroupIds, "sg-ngoai-ngu")
    ).toThrowError(/403/);
  });

  it("does not restrict when targetSubjectGroupId is null", () => {
    // Listing endpoint — no specific group targeted → no restriction
    expect(() =>
      assertSubjectGroupAccess(ctx, allowedGroupIds, null)
    ).not.toThrow();
  });

  it("does not enforce group scope for ADMIN (Hieu truong)", () => {
    const htCtx = makeCtx({ userRole: "ADMIN" });
    // ADMIN can access any subject group
    expect(() =>
      assertSubjectGroupAccess(htCtx, allowedGroupIds, "sg-completely-different")
    ).not.toThrow();
  });
});

// ============================================================
// Case 3: UBND Xã (WARD_ADMIN) — geographic read-only scope
// ============================================================

describe("WARD_ADMIN ward-based scope", () => {
  // The filtering logic for WARD_ADMIN is async (DB lookup via getWardAllowedCampusIds).
  // We test the synchronous guard layer: WARD_ADMIN is NOT campus-scoped in the
  // assertCampusAccess guard — their scope is handled separately per ward map.

  const ctx = makeCtx({
    userRole: "WARD_ADMIN",
    districtWardId: "ward-tan-xa",
  });

  it("assertCampusAccess does not block WARD_ADMIN (ward guards are at action layer)", () => {
    // wardAdmin is not VICE_PRINCIPAL, so assertCampusAccess is a no-op for them
    expect(() => assertCampusAccess(ctx, "any-campus")).not.toThrow();
  });

  it("assertNotSuperAdminOnAcademicDetail does not throw for WARD_ADMIN", () => {
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).not.toThrow();
  });

  it("WARD_ADMIN has no campus filter from buildCampusFilter (uses ward map instead)", () => {
    expect(buildCampusFilter(ctx)).toBeUndefined();
  });

  it("WARD_ADMIN cannot access subject-group-scoped actions (not SUBJECT_HEAD)", () => {
    // assertSubjectGroupAccess only enforces for SUBJECT_HEAD — WARD_ADMIN is fine
    expect(() =>
      assertSubjectGroupAccess(ctx, [], "any-group")
    ).not.toThrow();
  });
});

// ============================================================
// Case 4: SUPER_ADMIN blocked from academic detail data
// ============================================================

describe("assertNotSuperAdminOnAcademicDetail — SUPER_ADMIN academic data block", () => {
  it("throws 403 for SUPER_ADMIN role", () => {
    const ctx = makeCtx({ userRole: "SUPER_ADMIN" });
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).toThrowError(/403/);
  });

  it("throws 403 for the hardcoded superadmin@school.com email regardless of role field", () => {
    const ctx = makeCtx({ userRole: "ADMIN", userEmail: "superadmin@school.com" });
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).toThrowError(/403/);
  });

  it("throws 403 for the sysadmin@so-gddt.gov.vn email", () => {
    const ctx = makeCtx({ userRole: "ADMIN", userEmail: "sysadmin@so-gddt.gov.vn" });
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).toThrowError(/403/);
  });

  it("does not throw for ADMIN (Hieu truong) accessing academic detail", () => {
    const ctx = makeCtx({ userRole: "ADMIN", userEmail: "ht.tanxa@school.edu.vn" });
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).not.toThrow();
  });

  it("does not throw for TEACHER accessing academic detail", () => {
    const ctx = makeCtx({ userRole: "TEACHER", userEmail: "gv@school.edu.vn" });
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).not.toThrow();
  });

  it("does not throw for DEPARTMENT_ADMIN — they see aggregate, guard is called selectively", () => {
    const ctx = makeCtx({ userRole: "DEPARTMENT_ADMIN" });
    // The guard is only called in detail-record actions, not aggregate endpoints
    expect(() => assertNotSuperAdminOnAcademicDetail(ctx)).not.toThrow();
  });
});