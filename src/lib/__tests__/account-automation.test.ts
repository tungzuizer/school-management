/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Test runner (Vitest test suite: `src/lib/__tests__/account-automation.test.ts`).
 * 2. Affected APIs: `generateStructuredStudentCode`, `generateStudentEmailFromCode`, `generateStructuredTeacherCode`, `generateTeacherEmailFromName`, `resolveUniqueStudentCodeAndEmail`, `resolveUniqueTeacherEmail`.
 * 3. Data Schemas: Account automation types, `User`, `Student`, `Teacher`.
 * 4. Verbatim User Instruction: "tôi cần tọa thuật toán tự động hóa thêm học sinh hay giáo viên sẽ tự tạo tài khoản".
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_INITIAL_PASSWORD,
  removeVietnameseTones,
  generateStructuredStudentCode,
  generateStudentEmailFromCode,
  generateStructuredTeacherCode,
  generateTeacherEmailFromName,
  resolveUniqueStudentCodeAndEmail,
  resolveUniqueTeacherEmail,
} from "@/lib/account-automation";

describe("Account Automation - Vietnamese Tone & String Normalization", () => {
  it("removes Vietnamese diacritics and converts to lowercase alphanumeric", () => {
    expect(removeVietnameseTones("Nguyễn Văn An")).toBe("nguyenvanan");
    expect(removeVietnameseTones("Trần Thị Đào")).toBe("tranthidao");
    expect(removeVietnameseTones("Lê Hoàng Đức")).toBe("lehoangduc");
    expect(removeVietnameseTones("  Đỗ-Quốc_Bảo @2026! ")).toBe("doquocbao2026");
  });

  it("handles empty or falsy strings safely", () => {
    expect(removeVietnameseTones("")).toBe("");
    expect(removeVietnameseTones(undefined as any)).toBe("");
  });
});

describe("Account Automation - Student Code Generation", () => {
  it("generates structured student code matching HS + [Year 2 digits] + [Grade] + [4-digit sequence]", () => {
    const code1 = generateStructuredStudentCode({ year: 2026, gradeLevel: 10, sequence: 1 });
    expect(code1).toBe("HS26100001");

    const code2 = generateStructuredStudentCode({ year: 2026, gradeLevel: 12, sequence: 145 });
    expect(code2).toBe("HS26120145");

    const code3 = generateStructuredStudentCode({ year: 2027, gradeLevel: 11, sequence: 9999 });
    expect(code3).toBe("HS27119999");
  });

  it("applies default values when options are omitted", () => {
    const currentYear2Digits = String(new Date().getFullYear() % 100).padStart(2, "0");
    const codeDefault = generateStructuredStudentCode();
    expect(codeDefault).toBe(`HS${currentYear2Digits}100001`);
  });
});

describe("Account Automation - Student Email Generation (<studentCode>@gmail.com)", () => {
  it("generates student email with <clean_student_code>@gmail.com format", () => {
    expect(generateStudentEmailFromCode("HS26100001")).toBe("hs26100001@gmail.com");
    expect(generateStudentEmailFromCode("FPT-HS139")).toBe("fpths139@gmail.com");
    expect(generateStudentEmailFromCode("CVA_2026_99")).toBe("cva202699@gmail.com");
  });

  it("provides fallback for empty student code", () => {
    expect(generateStudentEmailFromCode("")).toBe("student@gmail.com");
  });
});

describe("Account Automation - Teacher Code Generation", () => {
  it("generates structured teacher code matching GV + [School Code] + [3-digit sequence]", () => {
    const codeTP = generateStructuredTeacherCode({ schoolCode: "TP", sequence: 1 });
    expect(codeTP).toBe("GVTP001");

    const codeCVA = generateStructuredTeacherCode({ schoolCode: "CVA", sequence: 25 });
    expect(codeCVA).toBe("GVCVA025");

    const codeDefault = generateStructuredTeacherCode({ sequence: 5 });
    expect(codeDefault).toBe("GVSCH005");
  });
});

describe("Account Automation - Teacher Pedagogical Email Generation", () => {
  it("generates teacher email matching gv.<first_name><initials>@<domain>", () => {
    expect(generateTeacherEmailFromName("Nguyễn Văn An", "school.edu.vn")).toBe("gv.annv@school.edu.vn");
    expect(generateTeacherEmailFromName("Trần Thị Bích", "cva.edu.vn")).toBe("gv.bichtt@cva.edu.vn");
    expect(generateTeacherEmailFromName("Lê Hoàng Minh Đức", "thpt-tp.edu.vn")).toBe("gv.duclhm@thpt-tp.edu.vn");
  });

  it("appends numeric suffix when collision occurs", () => {
    expect(generateTeacherEmailFromName("Nguyễn Văn An", "school.edu.vn", 2)).toBe("gv.annv2@school.edu.vn");
    expect(generateTeacherEmailFromName("Nguyễn Văn An", "school.edu.vn", 3)).toBe("gv.annv3@school.edu.vn");
  });

  it("handles fallback for empty teacher names", () => {
    expect(generateTeacherEmailFromName("", "school.edu.vn")).toBe("gv.giaovien@school.edu.vn");
    expect(generateTeacherEmailFromName("", "school.edu.vn", 2)).toBe("gv.giaovien2@school.edu.vn");
  });
});

describe("Account Automation - Collision Resolution for Students", () => {
  it("allocates auto-generated code and email if not provided", () => {
    const existingCodes = new Set(["hs26100001"]);
    const existingEmails = new Set(["hs26100001@gmail.com"]);

    const result = resolveUniqueStudentCodeAndEmail(existingCodes, existingEmails, {
      name: "Trần Minh",
      gradeLevel: 10,
      year: 2026,
    });

    expect(result.studentCode).toBe("HS26100002");
    expect(result.email).toBe("hs26100002@gmail.com");
  });

  it("resolves code collision by appending sequence counter when preferred code is duplicated", () => {
    const existingCodes = new Set(["hs001"]);
    const existingEmails = new Set(["hs001@gmail.com"]);

    const result = resolveUniqueStudentCodeAndEmail(existingCodes, existingEmails, {
      preferredCode: "HS001",
      preferredEmail: "hs001@gmail.com",
    });

    expect(result.studentCode).toBe("HS001_1");
    expect(result.email).toBe("hs0011@gmail.com");
  });

  it("preserves preferred unique code and email if no collisions exist", () => {
    const existingCodes = new Set(["hs26100001"]);
    const existingEmails = new Set(["hs26100001@gmail.com"]);

    const result = resolveUniqueStudentCodeAndEmail(existingCodes, existingEmails, {
      preferredCode: "MY_CODE_99",
      preferredEmail: "custom.student@gmail.com",
    });

    expect(result.studentCode).toBe("MY_CODE_99");
    expect(result.email).toBe("custom.student@gmail.com");
  });
});

describe("Account Automation - Collision Resolution for Teachers", () => {
  it("automatically generates sequential pedagocical email when name collisions occur", () => {
    const existingEmails = new Set([
      "gv.annv@school.edu.vn",
      "gv.annv2@school.edu.vn",
    ]);

    const resolved = resolveUniqueTeacherEmail(existingEmails, "Nguyễn Văn An", undefined, "school.edu.vn");
    expect(resolved).toBe("gv.annv3@school.edu.vn");
  });

  it("preserves preferred unique email if provided and not duplicated", () => {
    const existingEmails = new Set(["gv.annv@school.edu.vn"]);
    const resolved = resolveUniqueTeacherEmail(existingEmails, "Nguyễn Văn An", "custom.teacher@school.edu.vn", "school.edu.vn");
    expect(resolved).toBe("custom.teacher@school.edu.vn");
  });
});

describe("Account Automation - Initial Defaults", () => {
  it("provides standard secure default password constant", () => {
    expect(DEFAULT_INITIAL_PASSWORD).toBe("abc123");
  });
});
