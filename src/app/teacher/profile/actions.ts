"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getTeacherProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      school: { select: { name: true } },
    },
  });

  if (!user) return null;

  let teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      homeroomClasses: { select: { id: true, name: true } },
    },
  });

  if (!teacher && (user.role === "TEACHER" || user.role === "ADMIN" || user.role === "VICE_PRINCIPAL")) {
    try {
      teacher = await prisma.teacher.create({
        data: {
          userId: user.id,
          phone: null,
          specialty: "Toán",
        },
        include: {
          homeroomClasses: { select: { id: true, name: true } },
        },
      });
    } catch {
      // Ignore concurrent creation error
    }
  }

  const homeroomClassName = teacher?.homeroomClasses?.map((c) => c.name).join(", ") || "—";
  const yearJoined = (teacher?.createdAt || user.createdAt).getFullYear().toString();

  return {
    name: user.name,
    email: user.email,
    phone: teacher?.phone || "—",
    specialty: teacher?.specialty || "—",
    homeroomClass: homeroomClassName,
    yearJoined,
    schoolName: user.school?.name || "Trường học",
  };
}

export async function updateTeacherProfile(data: { phone?: string; specialty?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  let teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: {
        userId: session.user.id,
        phone: data.phone?.trim() || null,
        specialty: data.specialty?.trim() || "Toán",
      },
    });
  } else {
    teacher = await prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        phone: data.phone !== undefined ? (data.phone.trim() || null) : teacher.phone,
        specialty: data.specialty !== undefined ? (data.specialty.trim() || null) : teacher.specialty,
      },
    });
  }

  return { success: true };
}
