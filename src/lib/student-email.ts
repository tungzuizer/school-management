/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/students/actions.ts`, `src/app/teacher/students/actions.ts`, `src/app/teacher/homeroom/actions.ts`, `src/components/admin/SystemAccountsModal.tsx`, Vitest tests.
 * 2. Affected APIs: `generateStudentEmail` utility function for student account and email generation.
 * 3. Data Schemas: `User` model `email` field in Prisma schema (`prisma.user.email`).
 * 4. Verbatim User Instruction: "tôi muốn tài khoản email là mã sinh viên + @gmail.com".
 */

/**
 * Công thức tạo Email học sinh chuẩn theo yêu cầu:
 * Email = Mã học sinh (chữ thường, làm sạch ký tự) + @gmail.com
 * Ví dụ:
 * - Mã "HS001" -> hs001@gmail.com
 * - Mã "HS2026101" -> hs2026101@gmail.com
 * - Mã "FPT-HS139" -> fpths139@gmail.com
 */
export function generateStudentEmail(name?: string, studentCode?: string): string {
  const code = (studentCode || "").trim();
  if (code) {
    const cleanCode = code.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanCode) {
      return `${cleanCode}@gmail.com`;
    }
  }

  // Fallback nếu chưa có mã số học sinh
  if (name && name.trim()) {
    const unaccented = name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
    if (unaccented) {
      return `hs.${unaccented}@gmail.com`;
    }
  }

  return "student@gmail.com";
}
