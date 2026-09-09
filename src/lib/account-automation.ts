/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin and Teacher Server Actions (`src/app/admin/students/actions.ts`, `src/app/admin/teachers/actions.ts`, `src/app/teacher/students/actions.ts`, `src/app/teacher/homeroom/actions.ts`), Vitest test suite (`src/lib/__tests__/account-automation.test.ts`).
 * 2. Affected APIs: Student & Teacher Account Creation Automation Engine, Code Generator, Email Generator, Collision Resolver (`generateStructuredStudentCode`, `generateStudentEmailFromCode`, `generateStructuredTeacherCode`, `generateTeacherEmailFromName`, `resolveUniqueStudentCodeAndEmail`, `resolveUniqueTeacherEmail`).
 * 3. Data Schemas: Prisma models `User`, `Student`, `Teacher`, `School`, `ClassRoom`.
 * 4. Verbatim User Instruction: "tôi cần tọa thuật toán tự động hóa thêm học sinh hay giáo viên sẽ tự tạo tài khoản".
 */

export const DEFAULT_INITIAL_PASSWORD = "abc123";

/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt, chuẩn hóa chuỗi
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Thuật toán sinh Mã Học Sinh có cấu trúc:
 * Cấu trúc: HS + [Năm 2 số] + [Khối lớp 2 số] + [Số thứ tự 4 số]
 * Ví dụ: Năm 2026, Khối 10, STT 1 -> HS26100001
 */
export function generateStructuredStudentCode(options?: {
  year?: number;
  gradeLevel?: number;
  sequence?: number;
}): string {
  const currentYear = options?.year || new Date().getFullYear();
  const year2Digits = String(currentYear % 100).padStart(2, "0");
  const grade = options?.gradeLevel ? String(options.gradeLevel).padStart(2, "0") : "10";
  const seq = options?.sequence ? Math.max(1, options.sequence) : 1;
  const seq4Digits = String(seq).padStart(4, "0");

  return `HS${year2Digits}${grade}${seq4Digits}`;
}

/**
 * Thuật toán sinh Email Học Sinh chuẩn từ Mã Học Sinh:
 * Cấu trúc: <mã_học_sinh_chữ_thường>@gmail.com
 * Ví dụ: HS26100001 -> hs26100001@gmail.com
 */
export function generateStudentEmailFromCode(studentCode: string): string {
  const cleanCode = removeVietnameseTones(studentCode);
  if (!cleanCode) return "student@gmail.com";
  return `${cleanCode}@gmail.com`;
}

/**
 * Thuật toán sinh Mã Giáo Viên có cấu trúc:
 * Cấu trúc: GV + [Mã trường viết tắt] + [Số thứ tự 3 số]
 * Ví dụ: Trường THPT Trần Phú (TP), STT 1 -> GVTP001
 */
export function generateStructuredTeacherCode(options?: {
  schoolCode?: string;
  sequence?: number;
}): string {
  const schoolPrefix = options?.schoolCode
    ? options.schoolCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)
    : "SCH";
  const seq = options?.sequence ? Math.max(1, options.sequence) : 1;
  const seq3Digits = String(seq).padStart(3, "0");

  return `GV${schoolPrefix}${seq3Digits}`;
}

/**
 * Thuật toán sinh Email Giáo Viên chuẩn ngành sư phạm:
 * Cấu trúc: gv.<tên_không_dấu><chữ_cái_đầu_họ_đệm><hậu_tố_nếu_trùng>@<tên_miền_trường>
 * Ví dụ: "Nguyễn Văn An" -> gv.annv@school.edu.vn
 */
export function generateTeacherEmailFromName(
  name: string,
  schoolDomain: string = "school.edu.vn",
  suffix?: number
): string {
  if (!name || !name.trim()) return `gv.giaovien${suffix ? suffix : ""}@${schoolDomain}`;

  const unaccented = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();

  const parts = unaccented.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return `gv.giaovien${suffix ? suffix : ""}@${schoolDomain}`;

  const firstName = parts[parts.length - 1].replace(/[^a-z0-9]/g, "");
  const initials = parts
    .slice(0, parts.length - 1)
    .map((p) => p[0])
    .join("")
    .replace(/[^a-z0-9]/g, "");

  const suffixStr = suffix && suffix > 1 ? String(suffix) : "";
  return `gv.${firstName}${initials}${suffixStr}@${schoolDomain}`;
}

/**
 * Thuật toán xử lý Xung đột và Tự động cấp Mã & Email duy nhất cho Học Sinh
 */
export function resolveUniqueStudentCodeAndEmail(
  existingCodes: Set<string>,
  existingEmails: Set<string>,
  options?: {
    preferredCode?: string;
    preferredEmail?: string;
    name?: string;
    gradeLevel?: number;
    year?: number;
    startSequence?: number;
  }
): { studentCode: string; email: string } {
  let code = options?.preferredCode?.trim();

  // 1. Tự sinh mã nếu chưa có hoặc xử lý nếu mã đã tồn tại
  if (!code) {
    let seq = options?.startSequence || existingCodes.size + 1;
    do {
      code = generateStructuredStudentCode({
        year: options?.year,
        gradeLevel: options?.gradeLevel,
        sequence: seq,
      });
      seq++;
    } while (existingCodes.has(code.toLowerCase()));
  } else if (existingCodes.has(code.toLowerCase())) {
    // Nếu mã người dùng nhập đã tồn tại, tự tăng hậu tố
    let counter = 1;
    let newCode = `${code}_${counter}`;
    while (existingCodes.has(newCode.toLowerCase())) {
      counter++;
      newCode = `${code}_${counter}`;
    }
    code = newCode;
  }

  // 2. Tự sinh email theo mã học sinh
  let email = options?.preferredEmail?.trim().toLowerCase();
  if (!email) {
    email = generateStudentEmailFromCode(code);
  }

  // 3. Xử lý trùng email nếu có
  if (existingEmails.has(email)) {
    const [local, domain] = email.split("@");
    let counter = 1;
    let newEmail = `${local}${counter}@${domain || "gmail.com"}`;
    while (existingEmails.has(newEmail)) {
      counter++;
      newEmail = `${local}${counter}@${domain || "gmail.com"}`;
    }
    email = newEmail;
  }

  return { studentCode: code, email };
}

/**
 * Dự đoán trước Mã học sinh và Email chuẩn hóa tiếp theo cho giao diện (Read-only Preview)
 */
export function previewNextStudentCodeAndEmail(
  existingCodes: Set<string>,
  gradeLevel?: number,
  year?: number
): { studentCode: string; email: string } {
  let seq = existingCodes.size + 1;
  let code = "";
  do {
    code = generateStructuredStudentCode({
      year,
      gradeLevel,
      sequence: seq,
    });
    seq++;
  } while (existingCodes.has(code.toLowerCase()));

  const email = generateStudentEmailFromCode(code);
  return { studentCode: code, email };
}

/**
 * Thuật toán xử lý Xung đột và Tự động cấp Email duy nhất cho Giáo Viên
 */
export function resolveUniqueTeacherEmail(
  existingEmails: Set<string>,
  name: string,
  preferredEmail?: string,
  schoolDomain: string = "school.edu.vn"
): string {
  if (preferredEmail && preferredEmail.trim()) {
    const cleanPref = preferredEmail.trim().toLowerCase();
    if (!existingEmails.has(cleanPref)) {
      return cleanPref;
    }
  }

  let suffix = 1;
  let email = generateTeacherEmailFromName(name, schoolDomain);
  while (existingEmails.has(email)) {
    suffix++;
    email = generateTeacherEmailFromName(name, schoolDomain, suffix);
  }

  return email;
}
