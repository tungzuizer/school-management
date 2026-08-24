"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function changeOwnPassword(newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const trimmed = newPassword.trim();
    if (!trimmed || trimmed.length < 6) {
      return { success: false, error: "Mật khẩu mới phải từ 6 ký tự trở lên" };
    }

    if (trimmed === "abc123" || trimmed === "123456") {
      return { success: false, error: "Vui lòng chọn mật khẩu mới khác mật khẩu mặc định (abc123 / 123456)" };
    }

    const hashedPassword = await bcrypt.hash(trimmed, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật mật khẩu" };
  }
}
