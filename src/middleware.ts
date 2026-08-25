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

    // Khu vực Sở GD&ĐT: Chỉ dành riêng cho DEPARTMENT_ADMIN
    const deptRoles = ["DEPARTMENT_ADMIN"];
    if (path.startsWith("/department") && !deptRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phòng GD&ĐT: Chỉ dành riêng cho WARD_ADMIN
    const wardRoles = ["WARD_ADMIN"];
    if (path.startsWith("/ward") && !wardRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Admin (Hiệu trưởng): Chỉ dành riêng cho ADMIN
    const adminRoles = ["ADMIN"];
    if (path.startsWith("/admin") && !adminRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Phó Hiệu trưởng: Chỉ dành riêng cho VICE_PRINCIPAL
    const vpRoles = ["VICE_PRINCIPAL"];
    if (path.startsWith("/vice-principal") && !vpRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Giáo viên: TEACHER, VICE_PRINCIPAL, ADMIN
    const teacherRoles = ["TEACHER", "VICE_PRINCIPAL", "ADMIN"];
    if (path.startsWith("/teacher") && !teacherRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Khu vực Học sinh: STUDENT, TEACHER, ADMIN, VICE_PRINCIPAL
    const studentRoles = ["STUDENT", "TEACHER", "ADMIN", "VICE_PRINCIPAL"];
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
