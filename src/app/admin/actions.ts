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

    let schoolName = user.school?.name || "Trường THCS Tân Xã";
    let districtWardName = user.districtWard?.name || "Phòng GD&ĐT Thạch Thất";
    let departmentName = user.department?.name || "Sở GD&ĐT Hà Nội";

    if (isSuperAdmin) {
      schoolName = "Toàn bộ các Trường (Hệ thống Toàn quốc)";
      districtWardName = "Tất cả các Phòng GD&ĐT";
      departmentName = "Bộ GD&ĐT & Tất cả các Sở GD&ĐT";
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
