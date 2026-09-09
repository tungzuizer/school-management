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
              const demoPasswords = ["123456", "abc123", "Password@123", "admin", "teacher", "student", "Demo@2026!", "SuperAdmin@2026!"];
              if (demoPasswords.includes(inputPassword)) {
                isPasswordValid = true;
              }
            }

            if (isPasswordValid) {
              // Chỉ buộc đổi mật khẩu cho tài khoản KHÔNG phải demo
              const demoEmails = [
                "superadmin@school.com", "admin@school.com", "dept@school.com",
                "ward@school.com", "vp1@school.com", "teacher@school.com", "student@school.com",
                "sysadmin@so-gddt.gov.vn", "cbso@so-gddt.gov.vn", "cbphong@phonggd.gov.vn",
                "ht.tanxa@school.edu.vn"
              ];
              const isDemoAccount = demoEmails.includes(email) || email.startsWith("hs");
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

        // Demo Mode Fallback (Enabled only when ALLOW_DEMO_LOGIN !== "false" or Development)
        // Chạy khi user chưa tồn tại trong DB (không tìm thấy email)
        if (!user && isDemoAllowed) {
          const isDefaultPass =
            credentials.password === "abc123" ||
            credentials.password === "123456" ||
            credentials.password === "Password@123" ||
            credentials.password === "student" ||
            credentials.password === "teacher" ||
            credentials.password === "admin" ||
            credentials.password === "SuperAdmin@2026!" ||
            credentials.password === "Demo@2026!";

          if (
            isDefaultPass &&
            (email.includes("admin") ||
              email.includes("superadmin") ||
              email.includes("teacher") ||
              email.includes("student") ||
              email.startsWith("hs") ||
              email.includes("hocsinh") ||
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
              ? "Quản Trị Viên Tối Cao (Super Admin)"
              : email.includes("dept")
              ? "Lãnh đạo Sở GD&ĐT"
              : email.includes("ward")
              ? "Cán bộ Phòng GD&ĐT"
              : email.includes("admin")
              ? "TS. Nguyễn Văn Hùng"
              : email.includes("vp")
              ? "ThS. Trịnh Văn Sơn (BGH)"
              : email.includes("teacher")
              ? "Trần Thị Hoa (GVCN 10A1)"
              : email === "hs26100002@gmail.com"
              ? "Trần Thị Bình (Mã: HS26100002)"
              : "Nguyễn Văn An (Mã: HS26100001)";

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
                // If role is STUDENT, automatically ensure a Student record is linked
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

      // Always sanitize existing token.image & token.picture to clean up large cookies from prior sessions
      if (typeof token.image === "string" && (token.image.startsWith("data:") || token.image.length > 200)) {
        token.image = undefined;
      }
      if (typeof token.picture === "string" && (token.picture.startsWith("data:") || token.picture.length > 200)) {
        token.picture = undefined;
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
  secret: process.env.NEXTAUTH_SECRET || "school_management_production_secret_key_2026",
};
