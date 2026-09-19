/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts`, `prisma/seed-data/administrative.ts`, `prisma/seed-data/classes-students.ts`, `prisma/seed-data/personnel-subjects.ts`.
 * 2. Search Verification: No existing file in `prisma/seed-data/` exists; constants are currently duplicated inside `prisma/seed.ts` and `src/app/api/db-seed/route.ts`.
 * 3. Data Structure: `GeneratedStudent` schema: index (number), name (string), gender (Gender), dob (Date YYYY-MM-DD), studentCode (string), email (string), phone (string), parentName (string), parentPhone (string), address (string).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" / "hãy xóa hết các dữ liệu cũ và thay bằng các dữ liệu mới của 5 phân hiệu này".
 */

import bcrypt from "bcryptjs";
import { Gender } from "@prisma/client";

export const DEFAULT_PASSWORD_PLAIN = "123456";

export const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đinh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đào", "Đoàn", "Lục", "Nông", "Ma", "Lò"
];

export const MIDDLE_MALE = [
  "Văn", "Đức", "Hữu", "Gia", "Minh", "Hoàng", "Quốc", "Anh", "Tuấn", "Thanh", "Bảo", "Đình", "Quang"
];

export const MIDDLE_FEMALE = [
  "Thị", "Ngọc", "Thu", "Mai", "Phương", "Thanh", "Thảo", "Hải", "Khánh", "Minh", "Bảo", "Quỳnh", "Ánh"
];

export const FIRST_MALE = [
  "Hưng", "Long", "Nam", "Khánh", "Duy", "Hải", "Tuấn", "Minh", "Quân", "Bách",
  "Phúc", "Khang", "Tùng", "Bảo", "Khoa", "Phong", "Triết", "Thịnh", "Đạt", "Sơn", "Tiến"
];

export const FIRST_FEMALE = [
  "Anh", "Linh", "Trang", "Hà", "Phương", "Chi", "Nhi", "Mai", "Châu", "Vy",
  "Hương", "Lan", "Ngọc", "Dương", "Hân", "Thư", "Tú", "Yến", "Ngân", "Hoa", "Cúc"
];

export interface GeneratedStudent {
  index: number;
  name: string;
  gender: Gender;
  dob: Date;
  studentCode: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
}

export function generateStudentRoster(
  count: number,
  gradeLevel: number,
  schoolCode: string,
  className: string,
  startSeq: number = 1,
  addressBase: string = "Xã Bảo Thắng, Tỉnh Lào Cai"
): GeneratedStudent[] {
  const roster: GeneratedStudent[] = [];
  const birthYear = 2026 - (gradeLevel + 5);

  for (let i = 1; i <= count; i++) {
    const isMale = i % 2 === 1;
    const lastName = LAST_NAMES[(i * 3 + gradeLevel + startSeq) % LAST_NAMES.length];
    const middleName = isMale
      ? MIDDLE_MALE[(i * 5 + gradeLevel + startSeq) % MIDDLE_MALE.length]
      : MIDDLE_FEMALE[(i * 7 + gradeLevel + startSeq) % MIDDLE_FEMALE.length];
    const firstName = isMale
      ? FIRST_MALE[(i * 11 + gradeLevel + startSeq) % FIRST_MALE.length]
      : FIRST_FEMALE[(i * 13 + gradeLevel + startSeq) % FIRST_FEMALE.length];

    const fullName = `${lastName} ${middleName} ${firstName}`;
    const birthMonth = ((i * 4) % 12) + 1;
    const birthDay = ((i * 7) % 28) + 1;
    const dob = new Date(
      `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`
    );

    const seq = startSeq + i - 1;
    const studentCode = `HS26${schoolCode}${String(gradeLevel).padStart(2, "0")}${String(seq).padStart(4, "0")}`;
    const email = `${studentCode.toLowerCase()}@gmail.com`;

    roster.push({
      index: i,
      name: fullName,
      gender: isMale ? Gender.MALE : Gender.FEMALE,
      dob,
      studentCode,
      email,
      phone: `09${String(10000000 + (startSeq + i) * 12345).slice(0, 8)}`,
      parentName: `${lastName} ${isMale ? "Văn" : "Thị"} ${isMale ? "Hùng" : "Mai"}`,
      parentPhone: `09${String(80000000 + (startSeq + i) * 54321).slice(0, 8)}`,
      address: addressBase,
    });
  }
  return roster;
}

export async function hashPassword(plain: string = DEFAULT_PASSWORD_PLAIN): Promise<string> {
  return bcrypt.hash(plain, 10);
}
