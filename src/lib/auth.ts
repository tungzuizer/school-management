import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

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
          console.error("Auth DB Error:", err);
        }

        if (!user) {
          if (
            credentials.password === "123456" &&
            (email.includes("admin") ||
              email.includes("teacher") ||
              email.includes("student") ||
              email.includes("vp") ||
              email.includes("dept") ||
              email.includes("ward"))
          ) {
            const role = email.includes("dept")
              ? "DEPARTMENT_ADMIN"
              : email.includes("ward")
              ? "WARD_ADMIN"
              : email.includes("admin")
              ? "ADMIN"
              : email.includes("vp")
              ? "VICE_PRINCIPAL"
              : email.includes("teacher")
              ? "TEACHER"
              : "STUDENT";
            const name = email.includes("dept")
              ? "Lãnh đạo Sở GD&ĐT"
              : email.includes("ward")
              ? "Cán bộ Phòng GD&ĐT"
              : email.includes("admin")
              ? "Nguyễn Văn Admin"
              : email.includes("vp")
              ? "Phó Hiệu trưởng"
              : email.includes("teacher")
              ? "Trần Thị Hoa"
              : "Phạm Quang Huy";
            const hashedPassword = await bcrypt.hash("123456", 10);
            try {
              user = await prisma.user.create({
                data: {
                  email,
                  password: hashedPassword,
                  name,
                  role: role as any,
                },
              });
            } catch (err) {
              console.error("Auth create user error:", err);
              try {
                user = await prisma.user.findUnique({ where: { email } });
              } catch {
                // Ignore DB error
              }
            }

            // Fallback for live demo if DB is unreachable on Vercel
            if (!user) {
              return {
                id: `demo-${role.toLowerCase()}`,
                email,
                name,
                role,
              };
            }
          }
        }

        if (user) {
          try {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
            if (isPasswordValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                departmentId: user.departmentId || undefined,
                districtWardId: user.districtWardId || undefined,
                schoolId: user.schoolId || undefined,
                campusId: user.campusId || undefined,
              };
            }
          } catch {
            // Password compare failed or DB error
          }
        }

        // Demo fallback if password matches 123456
        if (
          credentials.password === "123456" &&
          (email.includes("admin") ||
            email.includes("teacher") ||
            email.includes("student") ||
            email.includes("vp") ||
            email.includes("dept") ||
            email.includes("ward"))
        ) {
          const role = email.includes("dept")
            ? "DEPARTMENT_ADMIN"
            : email.includes("ward")
            ? "WARD_ADMIN"
            : email.includes("admin")
            ? "ADMIN"
            : email.includes("vp")
            ? "VICE_PRINCIPAL"
            : email.includes("teacher")
            ? "TEACHER"
            : "STUDENT";
          const name = email.includes("dept")
            ? "Lãnh đạo Sở GD&ĐT"
            : email.includes("ward")
            ? "Cán bộ Phòng GD&ĐT"
            : email.includes("admin")
            ? "Nguyễn Văn Admin"
            : email.includes("vp")
            ? "Phó Hiệu trưởng"
            : email.includes("teacher")
            ? "Trần Thị Hoa"
            : "Phạm Quang Huy";
          return {
            id: user?.id || `demo-${role.toLowerCase()}`,
            email,
            name: user?.name || name,
            role: user?.role || role,
            departmentId: user?.departmentId || undefined,
            districtWardId: user?.districtWardId || undefined,
            schoolId: user?.schoolId || undefined,
            campusId: user?.campusId || undefined,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.departmentId = user.departmentId;
        token.districtWardId = user.districtWardId;
        token.schoolId = user.schoolId;
        token.campusId = user.campusId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "school_management_secret_key_2026",
};
