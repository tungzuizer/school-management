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
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "DEPARTMENT_ADMIN" ||
      role === "WARD_ADMIN";

    // Quản trị viên tối cao / Admin / Cán bộ Sở / Cán bộ Phòng được phép truy cập tất cả các khu vực điều hành
    if (isSuperAdmin) {
      return NextResponse.next();
    }

    // Khu vực Sở GD&ĐT: DEPARTMENT_ADMIN
    const departmentRoles = ["DEPARTMENT_ADMIN"];
    if (path.startsWith("/department") && !departmentRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phòng GD&ĐT: WARD_ADMIN
    const wardRoles = ["WARD_ADMIN"];
    if (path.startsWith("/ward") && !wardRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Admin: ADMIN, VICE_PRINCIPAL, DEPARTMENT_ADMIN, WARD_ADMIN
    const adminRoles = ["ADMIN", "VICE_PRINCIPAL", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/admin") && !adminRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phó Hiệu trưởng: VICE_PRINCIPAL, ADMIN, DEPARTMENT_ADMIN, WARD_ADMIN
    const vpRoles = ["VICE_PRINCIPAL", "ADMIN", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
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
