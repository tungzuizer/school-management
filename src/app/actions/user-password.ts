"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validatePasswordPolicy, logSecurityEvent } from "@/lib/security-logger";

export async function changeOwnPassword(newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      logSecurityEvent({
        eventType: "UNAUTHORIZED_ACCESS_ATTEMPT",
        severity: "WARN",
        message: "Attempted password change without valid session",
      });
      return { success: false, error: "Chưa đăng nhập" };
    }

    const trimmed = newPassword.trim();
    const policyResult = validatePasswordPolicy(trimmed);
    if (!policyResult.valid) {
      logSecurityEvent({
        eventType: "PASSWORD_CHANGE_FAILURE",
        severity: "WARN",
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        message: `Password policy violation: ${policyResult.error}`,
      });
      return { success: false, error: policyResult.error };
    }

    const hashedPassword = await bcrypt.hash(trimmed, 10);

    // Kiểm tra nếu user có ID giả từ demo mode (bắt đầu bằng "demo-")
    const isDemoId = session.user.id.startsWith("demo-");

    if (!isDemoId) {
      // User thật trong DB — update trực tiếp bằng ID
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            password: hashedPassword,
            mustChangePassword: false,
          },
        });
      } else {
        logSecurityEvent({
          eventType: "PASSWORD_CHANGE_FAILURE",
          severity: "ERROR",
          userId: session.user.id,
          message: "User ID not found in database during password update",
        });
        return { success: false, error: "Không tìm thấy tài khoản trong hệ thống" };
      }
    } else if (session.user.email) {
      // Demo user — tìm bằng email
      const existingByEmail = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (existingByEmail) {
        await prisma.user.update({
          where: { email: session.user.email },
          data: {
            password: hashedPassword,
            mustChangePassword: false,
          },
        });
      } else {
        // Tạo user mới trong DB cho demo user
        await prisma.user.create({
          data: {
            email: session.user.email,
            password: hashedPassword,
            name: session.user.name || "User",
            role: (session.user.role as any) || "TEACHER",
            mustChangePassword: false,
          },
        });
      }
    } else {
      return { success: false, error: "Không có thông tin email để cập nhật mật khẩu" };
    }

    logSecurityEvent({
      eventType: "PASSWORD_CHANGE_SUCCESS",
      severity: "INFO",
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole: session.user.role,
      message: "User password changed successfully",
    });

    return { success: true };
  } catch (error: any) {
    logSecurityEvent({
      eventType: "PASSWORD_CHANGE_FAILURE",
      severity: "ERROR",
      message: `Exception during password change: ${error.message || error}`,
    });
    return { success: false, error: error.message || "Lỗi khi cập nhật mật khẩu" };
  }
}
