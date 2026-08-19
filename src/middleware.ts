import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Khu vực Sở GD&ĐT: chỉ DEPARTMENT_ADMIN
    if (path.startsWith("/department") && token?.role !== "DEPARTMENT_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phòng GD&ĐT: chỉ WARD_ADMIN
    if (path.startsWith("/ward") && token?.role !== "WARD_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Admin (Hiệu trưởng & Phó Hiệu trưởng): ADMIN, VICE_PRINCIPAL, DEPARTMENT_ADMIN, WARD_ADMIN
    const adminRoles = ["ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/admin") && !adminRoles.includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phó Hiệu trưởng: VICE_PRINCIPAL và ADMIN
    const vpRoles = ["VICE_PRINCIPAL", "ADMIN", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/vice-principal") && !vpRoles.includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Giáo viên: TEACHER và ADMIN
    const teacherRoles = ["TEACHER", "ADMIN", "VICE_PRINCIPAL"];
    if (path.startsWith("/teacher") && !teacherRoles.includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Học sinh: STUDENT, TEACHER, ADMIN, VICE_PRINCIPAL
    const studentRoles = ["STUDENT", "TEACHER", "ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/student") && !studentRoles.includes(token?.role as string)) {
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
