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
    const hashedPassword = await bcrypt.hash("123456", 10);

    const defaultDept = await prisma.educationDepartment.findFirst();
    const defaultWard = await prisma.districtWard.findFirst();
    const defaultSchool = await prisma.school.findFirst();

    await prisma.user.upsert({
      where: { email: "admin@school.com" },
      update: {
        password: hashedPassword,
        schoolId: defaultSchool?.id,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
      create: {
        name: "TS. Nguyễn Văn Hùng",
        email: "admin@school.com",
        password: hashedPassword,
        role: Role.ADMIN,
        schoolId: defaultSchool?.id,
        districtWardId: defaultWard?.id,
        departmentId: defaultDept?.id,
      },
    });

    await prisma.user.upsert({
      where: { email: "teacher@school.com" },
      update: { password: hashedPassword },
      create: {
        name: "Trần Thị Hoa",
        email: "teacher@school.com",
        password: hashedPassword,
        role: Role.TEACHER,
      },
    });

    await prisma.user.upsert({
      where: { email: "student@school.com" },
      update: { password: hashedPassword },
      create: {
        name: "Phạm Quang Huy",
        email: "student@school.com",
        password: hashedPassword,
        role: Role.STUDENT,
      },
    });

    await prisma.user.upsert({
      where: { email: "vp1@school.com" },
      update: { password: hashedPassword },
      create: {
        name: "Nguyen Thi VP1",
        email: "vp1@school.com",
        password: hashedPassword,
        role: Role.VICE_PRINCIPAL,
      },
    });

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to seed database" }, { status: 500 });
  }
}
