import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "seed123") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Tải thông tin đơn vị mặc định
    const defaultDept = await prisma.educationDepartment.findFirst();
    const defaultWard = await prisma.districtWard.findFirst();
    const defaultSchool = await prisma.school.findFirst();

    // Mật khẩu mặc định chuẩn hệ thống là abc123
    const defaultPasswordHash = await bcrypt.hash("abc123", 10);

    // 1. Super Admin (Quản Trị Viên Tối Cao)
    await prisma.user.upsert({
      where: { email: "superadmin@school.com" },
      update: {
        name: "Quản Trị Viên Tối Cao (Super Admin)",
        password: defaultPasswordHash,
        role: Role.ADMIN,
        isApproved: true,
        schoolId: null,
        districtWardId: null,
        departmentId: null,
      },
      create: {
        name: "Quản Trị Viên Tối Cao (Super Admin)",
        email: "superadmin@school.com",
        password: defaultPasswordHash,
        role: Role.ADMIN,
        isApproved: true,
        schoolId: null,
        districtWardId: null,
        departmentId: null,
      },
    });

    // 2. Admin (Hiệu Trưởng)
    await prisma.user.upsert({
      where: { email: "admin@school.com" },
      update: {
        password: defaultPasswordHash,
        schoolId: defaultSchool?.id,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
      create: {
        name: "TS. Nguyễn Văn Hùng",
        email: "admin@school.com",
        password: defaultPasswordHash,
        role: Role.ADMIN,
        schoolId: defaultSchool?.id,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
    });

    // 3. Cán bộ Sở GD&ĐT
    await prisma.user.upsert({
      where: { email: "dept@school.com" },
      update: {
        password: defaultPasswordHash,
        departmentId: defaultDept?.id,
      },
      create: {
        name: "Lãnh đạo Sở GD&ĐT",
        email: "dept@school.com",
        password: defaultPasswordHash,
        role: Role.DEPARTMENT_ADMIN,
        departmentId: defaultDept?.id,
      },
    });

    // 4. Cán bộ Phòng GD&ĐT
    await prisma.user.upsert({
      where: { email: "ward@school.com" },
      update: {
        password: defaultPasswordHash,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
      create: {
        name: "Cán bộ Phòng GD&ĐT",
        email: "ward@school.com",
        password: defaultPasswordHash,
        role: Role.WARD_ADMIN,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
    });

    // 5. Phó Hiệu Trưởng
    await prisma.user.upsert({
      where: { email: "vp1@school.com" },
      update: { password: defaultPasswordHash },
      create: {
        name: "Nguyễn Thị Phó Hiệu Trưởng",
        email: "vp1@school.com",
        password: defaultPasswordHash,
        role: Role.VICE_PRINCIPAL,
        schoolId: defaultSchool?.id,
      },
    });

    // 6. Giáo viên
    await prisma.user.upsert({
      where: { email: "teacher@school.com" },
      update: { password: defaultPasswordHash },
      create: {
        name: "Trần Thị Hoa",
        email: "teacher@school.com",
        password: defaultPasswordHash,
        role: Role.TEACHER,
        schoolId: defaultSchool?.id,
      },
    });

    // 7. Học sinh
    await prisma.user.upsert({
      where: { email: "student@school.com" },
      update: { password: defaultPasswordHash },
      create: {
        name: "Phạm Quang Huy",
        email: "student@school.com",
        password: defaultPasswordHash,
        role: Role.STUDENT,
      },
    });

    return NextResponse.json({ success: true, message: "Khởi tạo tài khoản hệ thống thành công với mật khẩu abc123" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Lỗi khi khởi tạo tài khoản hệ thống" }, { status: 500 });
  }
}
