/**
 * Công thức tạo Email học sinh chuẩn theo yêu cầu:
 * Email = Tên + Chữ cái đầu của Họ & Đệm + Mã số học sinh + @gmail.com
 * Ví dụ: Nguyễn Việt Tùng & FPT-HS139 -> tungnvfpths139@gmail.com
 */
export function generateStudentEmail(name: string, studentCode: string): string {
  if (!name || !studentCode) return "student@gmail.com";

  // Loại bỏ dấu tiếng Việt, chuyển chữ thường
  const unaccented = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();

  const parts = unaccented.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "student@gmail.com";

  // Tên = từ cuối cùng (VD: "tung")
  const firstName = parts[parts.length - 1];

  // Ký tự đầu của Họ và Đệm (VD: "nguyen viet" -> "n", "v" -> "nv")
  const initials = parts.slice(0, parts.length - 1).map((p) => p[0]).join("");

  // Mã số học sinh làm sạch (VD: "FPT-HS139" -> "fpths139")
  const cleanCode = studentCode.toLowerCase().replace(/[^a-z0-9]/g, "");

  return `${firstName}${initials}${cleanCode}@gmail.com`;
}
