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

    // Kiểm tra nếu user có ID giả từ demo mode (bắt đầu bằng "demo-")
    const isDemoId = session.user.id.startsWith("demo-");

    if (!isDemoId) {
      // User thật trong DB — update trực tiếp bằng ID
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { password: hashedPassword },
        });
      } else {
        return { success: false, error: "Không tìm thấy tài khoản trong hệ thống" };
      }
    } else if (session.user.email) {
      // Demo user — tìm bằng email
      const existingByEmail = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (existingByEmail) {
        await prisma.user.update({
          where: { email: session.user.email },
          data: { password: hashedPassword },
        });
      } else {
        // Tạo user mới trong DB cho demo user
        await prisma.user.create({
          data: {
            email: session.user.email,
            password: hashedPassword,
            name: session.user.name || "User",
            role: (session.user.role as any) || "TEACHER",
          },
        });
      }
    } else {
      return { success: false, error: "Không có thông tin email để cập nhật mật khẩu" };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật mật khẩu" };
  }
}
