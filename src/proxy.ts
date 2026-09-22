/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Next.js Edge Runtime / App Router Proxy automatically mounts and invokes `src/proxy.ts`
 * 2. Purpose: Edge-level route protection and multi-tier RBAC enforcement across 8 educational tiers.
 * 3. Data Schemas: NextAuth JWT token inspection (role, isApproved).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn"
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as string;

    const isSuperAdmin = role === "SUPER_ADMIN";

    // Block unapproved accounts from accessing protected portal routes
    if (token?.isApproved === false) {
      return NextResponse.redirect(new URL("/unauthorized?reason=pending_approval", req.url));
    }

    // SUPER_ADMIN: infra & system management only — blocked from direct academic classroom data routes
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

    // /ward: UBND Xa/Phuong and Phong GD&DT (District)
    if (path.startsWith("/ward") && role !== "WARD_ADMIN" && role !== "DISTRICT_ADMIN") {
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
      authorized: ({ token }) => Boolean(token),
    },
    secret: process.env.NEXTAUTH_SECRET,
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

