import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;
    const email = token?.email as string;

    const isSuperAdmin =
      email === "superadmin@school.com" ||
      email === "sysadmin@so-gddt.gov.vn" ||
      role === "SUPER_ADMIN";

    // SUPER_ADMIN: infra only — blocked from academic data routes
    if (isSuperAdmin) {
      const academicPaths = ["/teacher", "/student", "/vice-principal"];
      if (academicPaths.some((p) => path.startsWith(p))) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // /department: So GD&DT only
    if (path.startsWith("/department") && role !== "DEPARTMENT_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /district: Phong GD&DT only
    if (path.startsWith("/district") && role !== "DISTRICT_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /ward: UBND Xa commune only
    if (path.startsWith("/ward") && role !== "WARD_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /admin: Hieu truong only
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /vice-principal: PHT only — also enforced by campusId at action layer
    if (path.startsWith("/vice-principal") && role !== "VICE_PRINCIPAL") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /subject-head: To truong chuyen mon only
    if (path.startsWith("/subject-head") && role !== "SUBJECT_HEAD") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /teacher: TEACHER, VICE_PRINCIPAL, ADMIN, SUBJECT_HEAD
    const teacherRoles = ["TEACHER", "VICE_PRINCIPAL", "ADMIN", "SUBJECT_HEAD"];
    if (path.startsWith("/teacher") && !teacherRoles.includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // /student: STUDENT, TEACHER, ADMIN, VICE_PRINCIPAL
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
    secret: process.env.NEXTAUTH_SECRET || "school_management_production_secret_key_2026",
  }
);

export const config = {
  matcher: [
    "/department/:path*",
    "/district/:path*",
    "/ward/:path*",
    "/admin/:path*",
    "/vice-principal/:path*",
    "/subject-head/:path*",
    "/teacher/:path*",
    "/student/:path*",
  ],
};
