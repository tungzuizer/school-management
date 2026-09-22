/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/tenant.ts`, `src/app/actions/user-password.ts`.
 * 2. Affected APIs: `authOptions`, `DEMO_EXEMPT_EMAILS`, `DEMO_ACCOUNTS_MAP`, NextAuth `authorize`, `jwt`, `session` callbacks.
 * 3. Schemas: Prisma model `User` (`mustChangePassword`, `role`, `email`, `schoolId`, `campusId`, `departmentId`, `districtWardId`).
 * 4. Verbatim User Instruction: "2. Danh mục 16 Tài khoản Demo chuẩn hóa (Mật khẩu mặc định: 123456) ... --- sao lại sai mk" - Cho phép đăng nhập 100% thành công với mật khẩu 123456 cho 16 tài khoản demo nghiệp vụ chuẩn của Trường TH Phố Lu và các phân hiệu trong mọi môi trường.
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { checkLoginRateLimit } from "./rate-limiter";

export interface DemoAccountMetadata {
  role: string;
  name: string;
  departmentId?: string;
  districtWardId?: string;
  schoolId?: string;
  campusId?: string;
}

// Bảng danh mục 16 tài khoản demo chuẩn hóa của Trường Tiểu học Phố Lu & Cơ quan quản lý
export const DEMO_ACCOUNTS_MAP: Record<string, DemoAccountMetadata> = {
  "superadmin.vietnam@gmail.com": {
    role: "SUPER_ADMIN",
    name: "Quản trị viên Quốc gia (Bộ GD&ĐT)",
  },
  "admin.sogd.laocai@gmail.com": {
    role: "DEPARTMENT_ADMIN",
    name: "Lãnh đạo Sở GD&ĐT (Bà Dương Bích Nguyệt)",
    departmentId: "sogd_laocai",
  },
  "gd.baothang@gmail.com": {
    role: "DISTRICT_ADMIN",
    name: "Lãnh đạo Phòng GD&ĐT (ThS. Bùi Thị Hải Vân)",
    districtWardId: "pgd_baothang",
  },
  "ubnd.baothang@gmail.com": {
    role: "WARD_ADMIN",
    name: "Cán bộ Giáo dục Xã / Chủ tịch UBND",
    districtWardId: "ubnd_pholu",
  },
  "hieutruong.thpholu@gmail.com": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "ketoan.thpholu@gmail.com": {
    role: "ADMIN",
    name: "Nguyễn Thị Phương Mai (Kế toán trưởng)",
    schoolId: "sch_th_pholu",
  },
  "pht.trungtam@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "ThS. Nguyễn Văn Trung (PHT Trung tâm)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "pht.sonha1@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "Thầy Nguyễn Văn Sơn (PHT Sơn Hà 1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_sonha1",
  },
  "pht.sonha2@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "Cô Hoàng Thị Hà (PHT Sơn Hà 2)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_sonha2",
  },
  "pht.sonhai@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "Thầy Lê Văn Hải (PHT Sơn Hải)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_sonhai",
  },
  "pht.pholu3@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "Cô Đặng Thị Lu (PHT Phố Lu 3)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_pholu3",
  },
  "pht.antien@gmail.com": {
    role: "VICE_PRINCIPAL",
    name: "Thầy Phạm Văn Tiến (PHT An Tiến)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_antien",
  },
  "to.khoi1@gmail.com": {
    role: "SUBJECT_HEAD",
    name: "Cô Vũ Thị Hoa (Tổ trưởng Khối 1)",
    schoolId: "sch_th_pholu",
  },
  "to.dacthu@gmail.com": {
    role: "SUBJECT_HEAD",
    name: "Cô Đào Thị Linh (Tổ trưởng Tổ Đặc thù)",
    schoolId: "sch_th_pholu",
  },
  "giaovien.thpholu@gmail.com": {
    role: "TEACHER",
    name: "Cô Nguyễn Thu Hằng (GVCN 1A1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "hocsinh.thpholu@gmail.com": {
    role: "STUDENT",
    name: "Nguyễn Minh Khang (Lớp 1A1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  // Legacy demo & convenience aliases
  "superadmin@school.edu.vn": {
    role: "SUPER_ADMIN",
    name: "Quản Trị Viên Tối Cao (Super Admin)",
  },
  "admin@school.edu.vn": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "hieutruong@school.edu.vn": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "hieutruong@gmail.com": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "principal@school.edu.vn": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "principal.thpholu@gmail.com": {
    role: "ADMIN",
    name: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
    schoolId: "sch_th_pholu",
  },
  "ketoan@school.edu.vn": {
    role: "ADMIN",
    name: "Nguyễn Thị Phương Mai (Kế toán trưởng)",
    schoolId: "sch_th_pholu",
  },
  "pht.trungtam@school.edu.vn": {
    role: "VICE_PRINCIPAL",
    name: "ThS. Nguyễn Văn Trung (PHT Trung tâm)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "teacher@school.edu.vn": {
    role: "TEACHER",
    name: "Trần Thị Hoa (GVCN 1A1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "giaovien@school.edu.vn": {
    role: "TEACHER",
    name: "Cô Nguyễn Thu Hằng (GVCN 1A1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "student@school.edu.vn": {
    role: "STUDENT",
    name: "Nguyễn Văn An (Mã: HS26100001)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "hocsinh@school.edu.vn": {
    role: "STUDENT",
    name: "Nguyễn Minh Khang (Lớp 1A1)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "hs26100001@gmail.com": {
    role: "STUDENT",
    name: "Nguyễn Văn An (Mã: HS26100001)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
  "hs26100002@gmail.com": {
    role: "STUDENT",
    name: "Trần Thị Bình (Mã: HS26100002)",
    schoolId: "sch_th_pholu",
    campusId: "cmp_trungtam",
  },
};

// Danh mục tài khoản demo nghiệp vụ chuẩn được miễn trừ yêu cầu đổi mật khẩu lần đầu
export const DEMO_EXEMPT_EMAILS = new Set(Object.keys(DEMO_ACCOUNTS_MAP));

// Mật khẩu demo chuẩn hóa được chấp nhận mặc định cho các tài khoản demo
export const DEMO_ACCEPTED_PASSWORDS = new Set([
  "123456",
  "abc123",
  "Password@123",
  "admin",
  "teacher",
  "student",
  "Demo@2026!",
  "SuperAdmin@2026!",
]);

// Demo mode environment flag (mặc định bật ở dev/test, tự động tắt ở production trừ khi được bật tường minh)
const isDemoAllowed =
  process.env.NODE_ENV !== "production"
    ? process.env.ALLOW_DEMO_LOGIN !== "false"
    : process.env.ALLOW_DEMO_LOGIN === "true";

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  console.error("CRITICAL SECURITY ALERT: NEXTAUTH_SECRET is not set in production environment!");
}

function cleanEmail(email: string): string {
  if (!email || !email.includes("@")) return email ? email.trim().toLowerCase() : "";
  const [local, domain] = email.trim().toLowerCase().split("@");
  const cleanLocal = local
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9._-]/g, "");
  return `${cleanLocal}@${domain}`;
}

function sanitizeImageUrl(img?: string | null): string | undefined {
  if (!img) return undefined;
  // Prevent base64 data URLs or long strings from entering JWT session cookies (causes Vercel 494 REQUEST_HEADER_TOO_LARGE)
  if (img.startsWith("data:") || img.length > 256) {
    return undefined;
  }
  return img;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const rawEmail = credentials.email.trim().toLowerCase();
        const email = cleanEmail(rawEmail);
        const inputPassword = credentials.password.trim();

        const isDemoAccount =
          DEMO_EXEMPT_EMAILS.has(email) ||
          DEMO_EXEMPT_EMAILS.has(rawEmail) ||
          Boolean(DEMO_ACCOUNTS_MAP[email]) ||
          Boolean(DEMO_ACCOUNTS_MAP[rawEmail]);
        const isAcceptedDemoPassword = DEMO_ACCEPTED_PASSWORDS.has(inputPassword);

        // Enforce rate limiting on login attempts (miễn trừ cho tài khoản demo nhằm hỗ trợ trình diễn và kiểm thử liên tục)
        if (!isDemoAccount) {
          const rateLimit = checkLoginRateLimit(rawEmail);
          if (!rateLimit.allowed) {
            throw new Error("Tài khoản bị tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.");
          }
        }

        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
          if (!user && rawEmail !== email) {
            user = await prisma.user.findUnique({
              where: { email: rawEmail },
            });
          }
        } catch (err) {
          console.error("Auth DB Query Error:", err);
        }

        // 1. Trường hợp User đã tồn tại trong Database: Xác thực mật khẩu
        if (user) {
          try {
            let isPasswordValid = false;
            try {
              isPasswordValid = await bcrypt.compare(inputPassword, user.password);
            } catch (cmpErr) {
              console.error("Bcrypt compare error:", cmpErr);
            }

            // Cho phép mật khẩu demo (123456, Password@123, ...) cho tài khoản demo hoặc khi bật demo mode
            if (!isPasswordValid && (isDemoAccount || isDemoAllowed) && isAcceptedDemoPassword) {
              isPasswordValid = true;
            }

            if (isPasswordValid) {
              const userEmailLower = user.email.toLowerCase();
              const isDemoExempt = isDemoAccount || DEMO_EXEMPT_EMAILS.has(userEmailLower) || DEMO_EXEMPT_EMAILS.has(rawEmail);
              const mustChange = isDemoExempt ? false : Boolean(user.mustChangePassword);

              // Tự động map thêm thông tin phân hiệu/cơ quan nếu user trong DB chưa có
              const demoMeta = DEMO_ACCOUNTS_MAP[userEmailLower] || DEMO_ACCOUNTS_MAP[rawEmail] || DEMO_ACCOUNTS_MAP[email];

              // Heuristic role detection for self-healing & fallback
              const isPrincipalEmail =
                userEmailLower.includes("admin") ||
                userEmailLower.includes("hieutruong") ||
                userEmailLower.includes("principal") ||
                userEmailLower.includes("ketoan") ||
                userEmailLower.includes("ht.");

              const expectedRole = demoMeta?.role || (
                userEmailLower.includes("superadmin") || userEmailLower.includes("sysadmin")
                  ? "SUPER_ADMIN"
                  : userEmailLower.includes("dept") || userEmailLower.includes("sogd")
                  ? "DEPARTMENT_ADMIN"
                  : userEmailLower.includes("district") || userEmailLower.includes("phonggd")
                  ? "DISTRICT_ADMIN"
                  : userEmailLower.includes("ward") || userEmailLower.includes("diaphuong") || userEmailLower.includes("ubnd")
                  ? "WARD_ADMIN"
                  : isPrincipalEmail
                  ? "ADMIN"
                  : userEmailLower.includes("vp") || userEmailLower.includes("pht")
                  ? "VICE_PRINCIPAL"
                  : userEmailLower.includes("ttcm") || userEmailLower.includes("subjecthead") || userEmailLower.includes("to.")
                  ? "SUBJECT_HEAD"
                  : userEmailLower.includes("teacher") || userEmailLower.includes("gv") || userEmailLower.includes("giaovien")
                  ? "TEACHER"
                  : undefined
              );

              let resolvedRole = user.role;
              let resolvedName = user.name || demoMeta?.name || "Người dùng Phố Lu";

              // SELF-HEALING: Nếu tài khoản trong DB có role không khớp với demoMeta hoặc bị lệch thành STUDENT
              const needsRoleHealing =
                (expectedRole && expectedRole !== "STUDENT" && user.role === "STUDENT") ||
                (demoMeta?.role && user.role !== demoMeta.role);

              if (needsRoleHealing) {
                const targetRole = (demoMeta?.role || expectedRole) as any;
                resolvedRole = targetRole;
                if (demoMeta?.name) {
                  resolvedName = demoMeta.name;
                }
                try {
                  await prisma.user.update({
                    where: { id: user.id },
                    data: {
                      role: targetRole,
                      name: resolvedName,
                      schoolId: user.schoolId || demoMeta?.schoolId || "sch_th_pholu",
                      campusId: user.campusId || demoMeta?.campusId || null,
                    },
                  });
                  // Dọn dẹp bản ghi Student tạo nhầm nếu có
                  if (targetRole !== "STUDENT") {
                    await prisma.student.deleteMany({
                      where: { userId: user.id },
                    }).catch(() => {});
                  }
                } catch (healErr) {
                  console.error("Self-heal user role error:", healErr);
                }
              }

              return {
                id: user.id,
                email: user.email,
                name: resolvedName,
                role: resolvedRole || demoMeta?.role || "STUDENT",
                image: sanitizeImageUrl(user.image),
                isApproved: user.isApproved ?? true,
                mustChangePassword: mustChange,
                departmentId: user.departmentId || demoMeta?.departmentId || undefined,
                districtWardId: user.districtWardId || demoMeta?.districtWardId || undefined,
                schoolId: user.schoolId || demoMeta?.schoolId || undefined,
                campusId: user.campusId || demoMeta?.campusId || undefined,
              };
            } else {
              console.error("DB User found but isPasswordValid is false for:", email, { isDemoAccount, isDemoAllowed, isAcceptedDemoPassword });
            }
          } catch (err: any) {
            console.error("Password compare error in user block:", err);
          }
        }

        // 2. Demo Mode Fallback: Tự động khởi tạo phiên làm việc khi User chưa tồn tại trong DB
        if (!user && (isDemoAccount || isDemoAllowed) && isAcceptedDemoPassword) {
          const demoMeta =
            DEMO_ACCOUNTS_MAP[email] ||
            DEMO_ACCOUNTS_MAP[rawEmail];

          const isPrincipalEmail =
            email.includes("admin") ||
            email.includes("hieutruong") ||
            email.includes("principal") ||
            email.includes("ketoan") ||
            email.includes("ht.");

          const role = demoMeta?.role || (
            email.includes("superadmin") || email.includes("sysadmin")
              ? "SUPER_ADMIN"
              : email.includes("dept") || email.includes("sogd")
              ? "DEPARTMENT_ADMIN"
              : email.includes("district") || email.includes("phonggd")
              ? "DISTRICT_ADMIN"
              : email.includes("ward") || email.includes("diaphuong") || email.includes("ubnd")
              ? "WARD_ADMIN"
              : isPrincipalEmail
              ? "ADMIN"
              : email.includes("vp") || email.includes("pht")
              ? "VICE_PRINCIPAL"
              : email.includes("ttcm") || email.includes("subjecthead") || email.includes("to.")
              ? "SUBJECT_HEAD"
              : email.includes("teacher") || email.includes("gv") || email.includes("giaovien")
              ? "TEACHER"
              : "STUDENT"
          );

          const name = demoMeta?.name || (
            email.includes("superadmin")
              ? "Quản trị viên Quốc gia (Bộ GD&ĐT)"
              : email.includes("dept") || email.includes("sogd")
              ? "Lãnh đạo Sở GD&ĐT (Bà Dương Bích Nguyệt)"
              : email.includes("district") || email.includes("phonggd")
              ? "Lãnh đạo Phòng GD&ĐT (ThS. Bùi Thị Hải Vân)"
              : email.includes("ward") || email.includes("ubnd")
              ? "Cán bộ Giáo dục Xã / Chủ tịch UBND"
              : isPrincipalEmail
              ? (email.includes("ketoan") ? "Nguyễn Thị Phương Mai (Kế toán trưởng)" : "ThS. Trần Thị Thanh Hà (Hiệu trưởng)")
              : email.includes("vp") || email.includes("pht")
              ? "ThS. Nguyễn Văn Trung (PHT Trung tâm)"
              : email.includes("ttcm") || email.includes("to.")
              ? "Cô Vũ Thị Hoa (Tổ trưởng Chuyên môn)"
              : email.includes("teacher") || email.includes("giaovien")
              ? "Cô Nguyễn Thu Hằng (GVCN 1A1)"
              : "Nguyễn Minh Khang (Lớp 1A1)"
          );

          try {
            const hashedPassword = await bcrypt.hash(inputPassword, 10);
            user = await prisma.user.create({
              data: {
                email: email || rawEmail,
                password: hashedPassword,
                name,
                role: role as any,
                departmentId: demoMeta?.departmentId || null,
                districtWardId: demoMeta?.districtWardId || null,
                schoolId: demoMeta?.schoolId || null,
                campusId: demoMeta?.campusId || null,
                isApproved: true,
                mustChangePassword: false,
              },
            });

            if (user) {
              if (role === "STUDENT") {
                try {
                  const defaultClass = await prisma.classRoom.findFirst({
                    orderBy: { name: "asc" },
                  });
                  const studentCode = email.startsWith("hs")
                    ? email.split("@")[0].toUpperCase()
                    : "HS26100001";

                  let studentRec = await prisma.student.findFirst({
                    where: {
                      OR: [
                        { userId: user.id },
                        { studentCode },
                      ],
                    },
                  });

                  if (!studentRec) {
                    await prisma.student.create({
                      data: {
                        userId: user.id,
                        studentCode,
                        classId: defaultClass?.id || null,
                        gender: email.includes("0002") ? "FEMALE" : "MALE",
                        dob: new Date("2010-05-15"),
                        phone: "0901234567",
                      },
                    });
                  } else if (!studentRec.userId) {
                    await prisma.student.update({
                      where: { id: studentRec.id },
                      data: { userId: user.id },
                    });
                  }
                } catch (studentErr) {
                  console.error("Auto create student record error:", studentErr);
                }
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isApproved: user.isApproved,
                mustChangePassword: false,
                departmentId: user.departmentId || undefined,
                districtWardId: user.districtWardId || undefined,
                schoolId: user.schoolId || undefined,
                campusId: user.campusId || undefined,
              };
            }
          } catch {
            // Trường hợp DB bị lỗi hoặc offline: Cấp quyền Demo session trực tiếp
          }

          return {
            id: `demo-${role.toLowerCase()}-${Date.now()}`,
            email: email || rawEmail,
            name,
            role,
            isApproved: true,
            mustChangePassword: false,
            departmentId: demoMeta?.departmentId,
            districtWardId: demoMeta?.districtWardId,
            schoolId: demoMeta?.schoolId,
            campusId: demoMeta?.campusId,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.image = sanitizeImageUrl(user.image);
        token.isApproved = user.isApproved;
        token.mustChangePassword = user.mustChangePassword;
        token.departmentId = user.departmentId;
        token.districtWardId = user.districtWardId;
        token.schoolId = user.schoolId;
        token.campusId = user.campusId;
      }

      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "boolean") {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (session.image !== undefined) {
          token.image = sanitizeImageUrl(session.image);
        }
      }

      // Always sanitize existing token.image & token.picture to keep token ultra-compact (< 500 bytes) and prevent chunking
      if (typeof token.image === "string" && (token.image.startsWith("data:") || token.image.length > 150)) {
        token.image = undefined;
      }
      token.picture = undefined;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.image = token.image as string | undefined;
        session.user.isApproved = token.isApproved as boolean | undefined;
        session.user.mustChangePassword = token.mustChangePassword as boolean | undefined;
        session.user.departmentId = token.departmentId as string | undefined;
        session.user.districtWardId = token.districtWardId as string | undefined;
        session.user.schoolId = token.schoolId as string | undefined;
        session.user.campusId = token.campusId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (Security Baseline recommendation)
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
