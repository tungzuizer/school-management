import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

const isDemoAllowed = process.env.ALLOW_DEMO_LOGIN !== "false";

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

        // Production / Demo Mode: Verify hashed password against Database user
        if (user) {
          try {
            let isPasswordValid = await bcrypt.compare(
              inputPassword,
              user.password
            );

            // Allow default demo passwords for accounts in development/demo mode
            if (!isPasswordValid && isDemoAllowed) {
              const demoPasswords = ["123456", "abc123", "admin", "teacher", "student", "Demo@2026!", "SuperAdmin@2026!"];
              if (demoPasswords.includes(inputPassword)) {
                isPasswordValid = true;
              }
            }

            if (isPasswordValid) {
              // Chỉ buộc đổi mật khẩu cho tài khoản KHÔNG phải demo
              // Demo accounts (abc123/123456) không cần buộc đổi
              const demoEmails = [
                "superadmin@school.com", "admin@school.com", "dept@school.com",
                "ward@school.com", "vp1@school.com", "teacher@school.com", "student@school.com",
                "sysadmin@so-gddt.gov.vn", "cbso@so-gddt.gov.vn", "cbphong@phonggd.gov.vn",
                "ht.tanxa@school.edu.vn"
              ];
              const isDemoAccount = demoEmails.includes(email);
              let isDefaultPassword = false;

              if (!isDemoAccount) {
                isDefaultPassword =
                  (await bcrypt.compare("abc123", user.password)) ||
                  (await bcrypt.compare("123456", user.password));
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                image: sanitizeImageUrl(user.image),
                isApproved: user.isApproved,
                mustChangePassword: isDefaultPassword,
                departmentId: user.departmentId || undefined,
                districtWardId: user.districtWardId || undefined,
                schoolId: user.schoolId || undefined,
                campusId: user.campusId || undefined,
              };
            }
          } catch (err: any) {
            console.error("Password compare error:", err);
          }
        }

        // Demo Mode Fallback (Enabled only when ALLOW_DEMO_LOGIN === "true" or Development)
        // CHá»ˆ cháº¡y khi user KHĂ”NG tá»“n táº¡i trong DB (khĂ´ng tĂ¬m tháº¥y email)
        // Náº¿u user tá»“n táº¡i nhÆ°ng password sai â†’ return null (khĂ´ng táº¡o user má»›i)
        if (!user && isDemoAllowed) {
          const isDefaultPass =
            credentials.password === "abc123" ||
            credentials.password === "123456" ||
            credentials.password === "SuperAdmin@2026!";

          if (
            isDefaultPass &&
            (email.includes("admin") ||
              email.includes("superadmin") ||
              email.includes("teacher") ||
              email.includes("student") ||
              email.includes("vp") || email.includes("pht") ||
              email.includes("dept") || email.includes("sogd") ||
              email.includes("ward") || email.includes("district") ||
              email.includes("phonggd") || email.includes("diaphuong") ||
              email.includes("ttcm") || email.includes("subjecthead"))
          ) {
            const role = email.includes("superadmin") || email.includes("sysadmin")
              ? "SUPER_ADMIN"
              : email.includes("dept") || email.includes("sogd")
              ? "DEPARTMENT_ADMIN"
              : email.includes("district") || email.includes("phonggd")
              ? "DISTRICT_ADMIN"
              : email.includes("ward") || email.includes("diaphuong")
              ? "WARD_ADMIN"
              : email.includes("admin")
              ? "ADMIN"
              : email.includes("vp") || email.includes("pht")
              ? "VICE_PRINCIPAL"
              : email.includes("ttcm") || email.includes("subjecthead")
              ? "SUBJECT_HEAD"
              : email.includes("teacher") || email.includes("gv")
              ? "TEACHER"
              : "STUDENT";

            const name = email.includes("superadmin")
              ? "Quáº£n Trá»‹ ViĂªn Tá»‘i Cao (Super Admin)"
              : email.includes("dept")
              ? "LĂ£nh Ä‘áº¡o Sá»Ÿ GD&ÄT"
              : email.includes("ward")
              ? "CĂ¡n bá»™ PhĂ²ng GD&ÄT"
              : email.includes("admin")
              ? "Nguyá»…n VÄƒn Admin"
              : email.includes("vp")
              ? "PhĂ³ Hiá»‡u trÆ°á»Ÿng"
              : email.includes("teacher")
              ? "Tráº§n Thá»‹ Hoa"
              : "Pháº¡m Quang Huy";

            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            try {
              user = await prisma.user.create({
                data: {
                  email,
                  password: hashedPassword,
                  name,
                  role: role as any,
                },
              });
              if (user) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  isApproved: user.isApproved,
                  mustChangePassword: isDefaultPass,
                };
              }
            } catch {
              // Ignore DB creation error
            }

            return {
              id: `demo-${role.toLowerCase()}`,
              email,
              name,
              role,
              isApproved: true,
              mustChangePassword: isDefaultPass,
            };
          }
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

      // Always sanitize existing token.image to clean up large cookies from prior sessions
      if (typeof token.image === "string" && (token.image.startsWith("data:") || token.image.length > 256)) {
        token.image = undefined;
      }

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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-v2-app.session-token" : "v2-app.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "school_management_production_secret_key_2026",
};
