import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;
    const email = token?.email as string;

    const isSuperAdmin =
      email === "superadmin@school.com" ||
      role === "SUPER_ADMIN";

    // Quản trị viên tối cao (Super Admin) được phép truy cập tất cả các phân hệ
    if (isSuperAdmin) {
      return NextResponse.next();
    }

    // Khu vực Sở GD&ĐT: Chỉ dành cho DEPARTMENT_ADMIN
    if (path.startsWith("/department") && role !== "DEPARTMENT_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Khu vực Phòng GD&ĐT: Chỉ dành cho WARD_ADMIN
    if (path.startsWith("/ward") && role !== "WARD_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Khu vực Admin (Hiệu trưởng): Chỉ dành cho ADMIN
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phó Hiệu trưởng: VICE_PRINCIPAL hoặc ADMIN
    const vpRoles = ["VICE_PRINCIPAL", "ADMIN"];
    if (path.startsWith("/vice-principal") && !vpRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Giáo viên: TEACHER, ADMIN, VICE_PRINCIPAL
    const teacherRoles = ["TEACHER", "ADMIN", "VICE_PRINCIPAL"];
    if (path.startsWith("/teacher") && !teacherRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Học sinh: STUDENT, TEACHER, ADMIN, VICE_PRINCIPAL, DEPARTMENT_ADMIN, WARD_ADMIN
    const studentRoles = ["STUDENT", "TEACHER", "ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/student") && !studentRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/department/:path*",
    "/ward/:path*",
    "/admin/:path*",
    "/vice-principal/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
