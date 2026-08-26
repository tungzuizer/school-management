import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

const isDemoAllowed = process.env.ALLOW_DEMO_LOGIN === "true" || process.env.NODE_ENV !== "production";

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

        const email = credentials.email.trim().toLowerCase();

        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { email },
          });
        } catch (err) {
          console.error("Auth DB Query Error:", err);
        }

        // Production Mode: Verify hashed password against Database user
        if (user) {
          try {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
            if (isPasswordValid) {
              // Chá»‰ buá»™c Ä‘á»•i máº­t kháº©u cho tĂ i khoáº£n KHĂ”NG pháº£i demo
              // Demo accounts (abc123/123456) khĂ´ng cáº§n buá»™c Ä‘á»•i
              const demoEmails = [
                "superadmin@school.com", "admin@school.com", "dept@school.com",
                "ward@school.com", "vp1@school.com", "teacher@school.com", "student@school.com",
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
                isApproved: user.isApproved,
                mustChangePassword: isDefaultPassword,
                departmentId: user.departmentId || undefined,
                districtWardId: user.districtWardId || undefined,
                schoolId: user.schoolId || undefined,
                campusId: user.campusId || undefined,
              };
            }
          } catch (err) {
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
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
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
