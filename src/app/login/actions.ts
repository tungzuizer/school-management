"use server";

import prisma from "@/lib/prisma";

export async function getUserRoleByEmail(email: string) {
  try {
    if (!email || !email.trim()) return null;
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { role: true, isApproved: true },
    });
    return user?.role || null;
  } catch (error) {
    console.error("Error in getUserRoleByEmail:", error);
    return null;
  }
}
