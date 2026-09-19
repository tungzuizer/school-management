/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`vitest.config.ts`, `npm test`, `npx vitest run`).
 * 2. Affected APIs: `src/lib/auth.ts`, `authOptions.providers[0].authorize`, `DEMO_ACCOUNTS_MAP`, `DEMO_EXEMPT_EMAILS`, `DEMO_ACCEPTED_PASSWORDS`.
 * 3. Data Schemas: NextAuth `authorize` return type (`id`, `email`, `name`, `role`, `isApproved`, `mustChangePassword`, `departmentId`, `districtWardId`, `schoolId`, `campusId`).
 * 4. Verbatim User Instruction: "2. Danh mục 16 Tài khoản Demo chuẩn hóa (Mật khẩu mặc định: 123456) ... --- sao lại sai mk" - Kiểm tra 100% tài khoản demo đăng nhập thành công với mật khẩu 123456.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DEMO_ACCOUNTS_MAP,
  DEMO_EXEMPT_EMAILS,
  DEMO_ACCEPTED_PASSWORDS,
  authOptions,
} from "../auth";

describe("16 Demo Accounts Authentication & Password Verification", () => {
  const credentialsProvider = authOptions.providers.find(
    (p: any) => p.id === "credentials" || p.name === "credentials"
  ) as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("định nghĩa đầy đủ danh mục 16 tài khoản demo nghiệp vụ chuẩn", () => {
    const requiredEmails = [
      "superadmin.vietnam@gmail.com",
      "admin.sogd.laocai@gmail.com",
      "gd.baothang@gmail.com",
      "ubnd.baothang@gmail.com",
      "hieutruong.thpholu@gmail.com",
      "ketoan.thpholu@gmail.com",
      "pht.trungtam@gmail.com",
      "pht.sonha1@gmail.com",
      "pht.sonha2@gmail.com",
      "pht.sonhai@gmail.com",
      "pht.pholu3@gmail.com",
      "pht.antien@gmail.com",
      "to.khoi1@gmail.com",
      "to.dacthu@gmail.com",
      "giaovien.thpholu@gmail.com",
      "hocsinh.thpholu@gmail.com",
    ];

    for (const email of requiredEmails) {
      expect(DEMO_EXEMPT_EMAILS.has(email)).toBe(true);
      expect(DEMO_ACCOUNTS_MAP[email]).toBeDefined();
      expect(DEMO_ACCOUNTS_MAP[email].role).toBeDefined();
      expect(DEMO_ACCOUNTS_MAP[email].name).toBeDefined();
    }
  });

  it("chấp nhận mật khẩu mặc định 123456 trong tập DEMO_ACCEPTED_PASSWORDS", () => {
    expect(DEMO_ACCEPTED_PASSWORDS.has("123456")).toBe(true);
    expect(DEMO_ACCEPTED_PASSWORDS.has("Password@123")).toBe(true);
    expect(DEMO_ACCEPTED_PASSWORDS.has("abc123")).toBe(true);
  });

  it("xác thực fallback thành công cho 16 tài khoản khi mật khẩu là 123456 mà không yêu cầu đổi mật khẩu", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    expect(authorize).toBeDefined();

    const requiredEmails = [
      "superadmin.vietnam@gmail.com",
      "admin.sogd.laocai@gmail.com",
      "gd.baothang@gmail.com",
      "ubnd.baothang@gmail.com",
      "hieutruong.thpholu@gmail.com",
      "ketoan.thpholu@gmail.com",
      "pht.trungtam@gmail.com",
      "pht.sonha1@gmail.com",
      "pht.sonha2@gmail.com",
      "pht.sonhai@gmail.com",
      "pht.pholu3@gmail.com",
      "pht.antien@gmail.com",
      "to.khoi1@gmail.com",
      "to.dacthu@gmail.com",
      "giaovien.thpholu@gmail.com",
      "hocsinh.thpholu@gmail.com",
    ];

    for (const email of requiredEmails) {
      const user = await authorize({
        email,
        password: "123456",
      });

      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
      expect(user?.mustChangePassword).toBe(false);
      expect(user?.role).toBe(DEMO_ACCOUNTS_MAP[email].role);
      expect(user?.name).toBeDefined();
    }
  });

  it("từ chối mật khẩu không hợp lệ cho tài khoản demo", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const user = await authorize({
      email: "hieutruong.thpholu@gmail.com",
      password: "wrong_password_9999",
    });

    expect(user).toBeNull();
  });
});
