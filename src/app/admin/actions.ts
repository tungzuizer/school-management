/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin navigation bars, layout headers, and profile components (`src/app/admin/layout.tsx`).
 * 2. Affected APIs: `getCurrentAdminProfile`.
 * 3. Schemas: `User`, `School`, `DistrictWard`, `EducationDepartment`.
 * 4. Verbatim User Instruction: "trường trường trần phú và trường lương khách thiện ninh Bình bỏ dữ liệu của 2 trường hải phòng" - "bỏ hết dữ liệu của thanh hóa chưa".
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  isApproved: boolean;
  schoolName: string;
  districtWardName: string;
  departmentName: string;
}

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        school: { select: { id: true, name: true } },
        districtWard: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) return null;

    const isSuperAdmin =
      user.email === "superadmin@school.com" ||
      (user.role as string) === "SUPER_ADMIN";

    let schoolName = user.school?.name || "Trường THPT Trần Phú (Ninh Bình)";
    let districtWardName = user.districtWard?.name || "TP. Ninh Bình - Tỉnh Ninh Bình";
    let departmentName = user.department?.name || "Sở GD&ĐT Tỉnh Ninh Bình";

    if (isSuperAdmin) {
      schoolName = "Toàn bộ các Trường (Hệ thống Tỉnh Ninh Bình)";
      districtWardName = "Tất cả các Thành phố/Huyện";
      departmentName = "Bộ GD&ĐT & Sở GD&ĐT Tỉnh Ninh Bình";
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isSuperAdmin ? "SUPER_ADMIN" : user.role,
      isSuperAdmin,
      isApproved: user.isApproved,
      schoolName,
      districtWardName,
      departmentName,
    };
  } catch (error) {
    console.error("Error in getCurrentAdminProfile:", error);
    return null;
  }
}
