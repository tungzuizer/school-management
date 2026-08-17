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

    // Khu vực Admin (Hiệu trưởng trường): ADMIN, DEPARTMENT_ADMIN, WARD_ADMIN
    const adminRoles = ["ADMIN", "DEPARTMENT_ADMIN", "WARD_ADMIN"];
    if (path.startsWith("/admin") && !adminRoles.includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/vice-principal") && token?.role !== "VICE_PRINCIPAL") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/teacher") && token?.role !== "TEACHER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/student") && token?.role !== "STUDENT") {
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
