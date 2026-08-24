"use server";

import prisma from "@/lib/prisma";
import { SchoolType, ManagementBranch } from "@prisma/client";

export async function getSchools(search?: string, schoolType?: string) {
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (schoolType && schoolType !== "ALL") {
    where.schoolType = schoolType as SchoolType;
  }

  return prisma.school.findMany({
    where,
    include: {
      districtWard: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { classRooms: true, campuses: true, users: true } },
    },
    orderBy: [{ schoolType: "asc" }, { name: "asc" }],
  });
}

export async function getWardsAndDepartmentsForSelect() {
  const [wards, departments] = await Promise.all([
    prisma.districtWard.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.educationDepartment.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { wards, departments };
}

export async function createSchool(data: {
  name: string;
  schoolType?: SchoolType;
  branchType?: ManagementBranch;
  districtWardId?: string;
  departmentId?: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  try {
    const schoolType = data.schoolType || SchoolType.THCS;
    const branchType = (schoolType === SchoolType.THPT) ? ManagementBranch.THPT : ManagementBranch.WARD;

    await prisma.school.create({
      data: {
        name: data.name,
        schoolType,
        branchType,
        districtWardId: data.districtWardId || undefined,
        departmentId: data.departmentId || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo trường" };
  }
}

export async function updateSchool(
  id: string,
  data: {
    name: string;
    schoolType?: SchoolType;
    branchType?: ManagementBranch;
    districtWardId?: string;
    departmentId?: string;
    address?: string;
    phone?: string;
    email?: string;
  }
) {
  try {
    const schoolType = data.schoolType || SchoolType.THCS;
    const branchType = (schoolType === SchoolType.THPT) ? ManagementBranch.THPT : ManagementBranch.WARD;

    await prisma.school.update({
      where: { id },
      data: {
        name: data.name,
        schoolType,
        branchType,
        districtWardId: data.districtWardId || null,
        departmentId: data.departmentId || null,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteSchool(id: string) {
  try {
    await prisma.school.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa trường" };
  }
}
