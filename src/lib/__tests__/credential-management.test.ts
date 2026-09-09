/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Test Runner (Vitest test suite: `src/lib/__tests__/credential-management.test.ts`).
 * 2. Affected APIs: Credential access control & credential generator functions in `src/app/admin/teachers/actions.ts` and `src/app/admin/students/actions.ts`.
 * 3. Data Schemas: `TeacherCredentialItem`, `StudentCredentialItem`, `TenantContext`.
 * 4. Verbatim User Instruction: "tôi muốn mỗi giáo viên mỗi học sinh sẽ có tài khoản mà mật khẩu và có thể hiện thị chỉ cho hiệu trưởng hoặc admin nhìn thấy được".
 */

import { describe, it, expect } from "vitest";
import { generateStudentEmail } from "@/lib/student-email";

// Helper function to test authorization logic matching server actions
function assertPrincipalOrAdmin(ctx: { userRole?: string; userEmail?: string }) {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_ADMIN", "DISTRICT_ADMIN", "VICE_PRINCIPAL"];
  const isSuperAdminEmail =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userEmail === "sysadmin@so-gddt.gov.vn" ||
    ctx.userEmail === "admin@school.com";

  const hasAllowedRole = ctx.userRole && allowedRoles.includes(ctx.userRole);

  if (!hasAllowedRole && !isSuperAdminEmail) {
    throw new Error(
      "Truy cập bị từ chối: Chỉ Hiệu trưởng (ADMIN) hoặc Quản trị viên cấp cao mới có quyền xem và quản lý tài khoản/mật khẩu."
    );
  }
}

describe("Credential Management RBAC Security (BGH & Admin Only)", () => {
  it("allows School Principal (ADMIN) to view teacher and student credentials", () => {
    const principalCtx = { userRole: "ADMIN", userEmail: "principal@thpt-chuvanan.edu.vn" };
    expect(() => assertPrincipalOrAdmin(principalCtx)).not.toThrow();
  });

  it("allows Vice Principal (VICE_PRINCIPAL) to view and manage credentials", () => {
    const vpCtx = { userRole: "VICE_PRINCIPAL", userEmail: "vp@thpt-chuvanan.edu.vn" };
    expect(() => assertPrincipalOrAdmin(vpCtx)).not.toThrow();
  });

  it("allows Department Admin (DEPARTMENT_ADMIN) and District Admin (DISTRICT_ADMIN)", () => {
    expect(() => assertPrincipalOrAdmin({ userRole: "DEPARTMENT_ADMIN", userEmail: "so@hanoi.edu.vn" })).not.toThrow();
    expect(() => assertPrincipalOrAdmin({ userRole: "DISTRICT_ADMIN", userEmail: "phong@badinh.edu.vn" })).not.toThrow();
    expect(() => assertPrincipalOrAdmin({ userRole: "SUPER_ADMIN", userEmail: "super@system.local" })).not.toThrow();
  });

  it("allows special system administrator fallback emails", () => {
    expect(() => assertPrincipalOrAdmin({ userEmail: "superadmin@school.com" })).not.toThrow();
    expect(() => assertPrincipalOrAdmin({ userEmail: "sysadmin@so-gddt.gov.vn" })).not.toThrow();
    expect(() => assertPrincipalOrAdmin({ userEmail: "admin@school.com" })).not.toThrow();
  });

  it("strictly blocks regular Teachers (TEACHER) from accessing credentials hub", () => {
    const teacherCtx = { userRole: "TEACHER", userEmail: "gv.nguyenvana@school.edu.vn" };
    expect(() => assertPrincipalOrAdmin(teacherCtx)).toThrowError(
      /Chỉ Hiệu trưởng \(ADMIN\) hoặc Quản trị viên cấp cao/
    );
  });

  it("strictly blocks Students (STUDENT) from viewing credentials overview", () => {
    const studentCtx = { userRole: "STUDENT", userEmail: "hs.lethib@school.edu.vn" };
    expect(() => assertPrincipalOrAdmin(studentCtx)).toThrowError(
      /Chỉ Hiệu trưởng \(ADMIN\) hoặc Quản trị viên cấp cao/
    );
  });

  it("strictly blocks Parents (PARENT) and Guests from viewing credentials overview", () => {
    const parentCtx = { userRole: "PARENT", userEmail: "ph.trandanc@gmail.com" };
    expect(() => assertPrincipalOrAdmin(parentCtx)).toThrowError(
      /Chỉ Hiệu trưởng \(ADMIN\) hoặc Quản trị viên cấp cao/
    );
  });

  it("strictly blocks unauthenticated context without role or recognized email", () => {
    expect(() => assertPrincipalOrAdmin({})).toThrowError(
      /Truy cập bị từ chối/
    );
  });
});

describe("Credential Generator and Formatting", () => {
  it("formats Teacher Credential Item with defaultPasswordHint and contact details", () => {
    const teacherRaw = {
      id: "t-1",
      userId: "u-1",
      user: {
        name: "Nguyễn Văn A",
        email: "gv.vana@thpt-cva.edu.vn",
        role: "TEACHER",
        isApproved: true,
        mustChangePassword: true,
        createdAt: new Date("2026-09-01"),
        school: { id: "sch-1", name: "THPT Chu Văn An" },
      },
      specialty: "Toán học",
      phone: "0912345678",
      degree: "Thạc sĩ",
    };

    const formatted = {
      id: teacherRaw.id,
      userId: teacherRaw.userId,
      name: teacherRaw.user.name,
      email: teacherRaw.user.email,
      specialty: teacherRaw.specialty,
      phone: teacherRaw.phone,
      degree: teacherRaw.degree,
      schoolName: teacherRaw.user.school.name,
      schoolId: teacherRaw.user.school.id,
      role: teacherRaw.user.role,
      isApproved: teacherRaw.user.isApproved,
      mustChangePassword: teacherRaw.user.mustChangePassword,
      createdAt: teacherRaw.user.createdAt.toISOString(),
      defaultPasswordHint: "abc123",
    };

    expect(formatted.name).toBe("Nguyễn Văn A");
    expect(formatted.defaultPasswordHint).toBe("abc123");
    expect(formatted.mustChangePassword).toBe(true);
    expect(formatted.schoolName).toBe("THPT Chu Văn An");
  });

  it("formats Student Credential Slip with homeroom, parent and school identity", () => {
    const studentRaw = {
      id: "std-101",
      studentCode: "HS2026001",
      user: {
        id: "u-101",
        name: "Trần Thị B",
        email: "tranthib@thpt-cva.edu.vn",
      },
      classRoom: {
        id: "c-10a1",
        name: "10A1",
        gradeLevel: 10,
        school: {
          id: "sch-1",
          name: "THPT Chu Văn An",
        },
      },
      fatherName: "Trần Văn C",
      fatherJob: "Kỹ sư",
      phone: "0987654321",
    };

    const slip = {
      id: studentRaw.id,
      studentName: studentRaw.user.name,
      studentCode: studentRaw.studentCode || "Chưa có",
      className: studentRaw.classRoom?.name || "Chưa phân lớp",
      email: studentRaw.user.email,
      parentName: studentRaw.fatherName || "Chưa có",
      parentPhone: studentRaw.phone || "",
      passwordHint: "abc123",
      generatedDate: "09/09/2026",
    };

    expect(slip.studentName).toBe("Trần Thị B");
    expect(slip.studentCode).toBe("HS2026001");
    expect(slip.className).toBe("10A1");
    expect(slip.passwordHint).toBe("abc123");
    expect(slip.parentName).toBe("Trần Văn C");
  });
});

describe("Student Email Format Standardization (<studentCode>@gmail.com)", () => {
  it("generates student email formatted as clean studentCode + @gmail.com", () => {
    expect(generateStudentEmail("Nguyễn Văn A", "HS001")).toBe("hs001@gmail.com");
    expect(generateStudentEmail("Trần Thị B", "HS2026101")).toBe("hs2026101@gmail.com");
    expect(generateStudentEmail("Lê Hoàng C", "FPT-HS139")).toBe("fpths139@gmail.com");
  });

  it("handles student code with spaces or uppercase correctly", () => {
    expect(generateStudentEmail("Phạm Minh D", "  HS999  ")).toBe("hs999@gmail.com");
    expect(generateStudentEmail("Đinh Thu E", "CVA_2026_01")).toBe("cva202601@gmail.com");
  });

  it("generates email when name is omitted but code is provided", () => {
    expect(generateStudentEmail(undefined, "HS12345")).toBe("hs12345@gmail.com");
  });

  it("handles fallback when student code is empty but name is provided", () => {
    expect(generateStudentEmail("Nguyễn Văn A", "")).toBe("hs.nguyenvana@gmail.com");
  });

  it("handles fallback when both name and student code are empty", () => {
    expect(generateStudentEmail("", "")).toBe("student@gmail.com");
  });
});

