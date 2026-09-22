/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`vitest.config.ts`, `npm test`, `npx vitest run`).
 * 2. Affected APIs: `src/lib/auth.ts`, `authOptions.providers[0].authorize`, `DEMO_ACCOUNTS_MAP`, `DEMO_EXEMPT_EMAILS`, `DEMO_ACCEPTED_PASSWORDS`, `src/lib/prisma.ts`.
 * 3. Data Schemas: NextAuth `authorize` return type (`id`, `email`, `name`, `role`, `isApproved`, `mustChangePassword`, `departmentId`, `districtWardId`, `schoolId`, `campusId`).
 * 4. Verbatim User Instruction: "2. Danh mục 16 Tài khoản Demo chuẩn hóa (Mật khẩu mặc định: 123456) ... --- sao lại sai mk" - Mock Prisma in demo auth unit tests to ensure fast offline execution without network timeout.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }: any) => ({
        id: "mock-user-id",
        ...data,
      })),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(null),
    },
    classRoom: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    student: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue(null),
    },
  },
}));

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
      "to.khoi2@gmail.com",
      "to.khoi3@gmail.com",
      "to.khoi4@gmail.com",
      "to.khoi5@gmail.com",
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
      "to.khoi2@gmail.com",
      "to.khoi3@gmail.com",
      "to.khoi4@gmail.com",
      "to.khoi5@gmail.com",
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
  }, 15000);

  it("từ chối mật khẩu không hợp lệ cho tài khoản demo", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const user = await authorize({
      email: "hieutruong.thpholu@gmail.com",
      password: "wrong_password_9999",
    });

    expect(user).toBeNull();
  });

  it("đảm bảo tài khoản Hiệu trưởng có role ADMIN và tên Hiệu trưởng chuẩn", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const principalEmails = [
      "hieutruong.thpholu@gmail.com",
      "hieutruong@school.edu.vn",
      "hieutruong@gmail.com",
      "principal@school.edu.vn",
      "principal.thpholu@gmail.com",
    ];

    for (const email of principalEmails) {
      const user = await authorize({
        email,
        password: "123456",
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe("ADMIN");
      expect(user?.name).toContain("Hiệu trưởng");
    }
  });

  it("tự động tự sửa lỗi (Self-Healing) khi tài khoản Hiệu trưởng trong DB bị lưu nhầm là STUDENT", async () => {
    const prisma = (await import("../prisma")).default;
    // Giả lập DB có user hiệu trưởng bị lỗi role: "STUDENT"
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: "corrupted-principal-id",
      email: "hieutruong.thpholu@gmail.com",
      password: "$2a$10$invaliddummypasswordhash",
      name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
      role: "STUDENT", // Bị lỗi lưu nhầm
      isApproved: true,
      mustChangePassword: false,
    });

    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const user = await authorize({
      email: "hieutruong.thpholu@gmail.com",
      password: "123456",
    });

    expect(user).not.toBeNull();
    // Role trả về trong session phải được tự sửa về ADMIN
    expect(user?.role).toBe("ADMIN");
    expect(user?.name).toBe("ThS. Trần Thị Thanh Hà (Hiệu trưởng)");
    // Kiểm tra DB đã được gọi cập nhật role: ADMIN
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "corrupted-principal-id" },
        data: expect.objectContaining({
          role: "ADMIN",
        }),
      })
    );
  });

  it("xác thực đúng campusId và role cho 6 Phó Hiệu trưởng phụ trách các điểm trường", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const vpCampuses = [
      { email: "pht.trungtam@gmail.com", campusId: "cmp_trungtam" },
      { email: "pht.sonha1@gmail.com", campusId: "cmp_sonha1" },
      { email: "pht.sonha2@gmail.com", campusId: "cmp_sonha2" },
      { email: "pht.sonhai@gmail.com", campusId: "cmp_sonhai" },
      { email: "pht.pholu3@gmail.com", campusId: "cmp_pholu3" },
      { email: "pht.antien@gmail.com", campusId: "cmp_antien" },
    ];

    for (const item of vpCampuses) {
      const user = await authorize({
        email: item.email,
        password: "123456",
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe("VICE_PRINCIPAL");
      expect(user?.campusId).toBe(item.campusId);
      expect(user?.schoolId).toBe("sch_th_pholu");
    }
  });

  it("xác thực đúng role SUBJECT_HEAD cho tất cả 6 Tổ trưởng Chuyên môn", async () => {
    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const subjectHeadEmails = [
      "to.khoi1@gmail.com",
      "to.khoi2@gmail.com",
      "to.khoi3@gmail.com",
      "to.khoi4@gmail.com",
      "to.khoi5@gmail.com",
      "to.dacthu@gmail.com",
    ];

    for (const email of subjectHeadEmails) {
      const user = await authorize({
        email,
        password: "123456",
      });

      expect(user).not.toBeNull();
      expect(user?.role).toBe("SUBJECT_HEAD");
      expect(user?.schoolId).toBe("sch_th_pholu");
    }
  });

  it("tự động tự sửa lỗi (Self-Healing) khi tài khoản Phó Hiệu trưởng hoặc Tổ trưởng trong DB bị lưu nhầm", async () => {
    const prisma = (await import("../prisma")).default;

    // Giả lập DB có user Phó Hiệu trưởng bị lưu nhầm thành STUDENT
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      id: "corrupted-vp-id",
      email: "pht.sonha1@gmail.com",
      password: "$2a$10$invaliddummypasswordhash",
      name: "Thầy Nguyễn Văn Sơn (PHT Phân hiệu Sơn Hà 1)",
      role: "STUDENT",
      isApproved: true,
      mustChangePassword: false,
    });

    const authorize = credentialsProvider?.options?.authorize || credentialsProvider?.authorize;
    const user = await authorize({
      email: "pht.sonha1@gmail.com",
      password: "123456",
    });

    expect(user).not.toBeNull();
    expect(user?.role).toBe("VICE_PRINCIPAL");
    expect(user?.campusId).toBe("cmp_sonha1");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "corrupted-vp-id" },
        data: expect.objectContaining({
          role: "VICE_PRINCIPAL",
          campusId: "cmp_sonha1",
        }),
      })
    );
  });
});
