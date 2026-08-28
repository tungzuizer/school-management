"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function updateUserAvatar(imageDataUrl: string) {
  try {
    const ctx = await getTenantContext();

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return { success: false, error: "Dữ liệu hình ảnh không hợp lệ." };
    }

    // Safety check: payload length limit (max ~500KB to prevent huge base64 abuse)
    if (imageDataUrl.length > 500 * 1024) {
      return { success: false, error: "Kích thước ảnh sau nén vẫn vượt quá giới hạn cho phép." };
    }

    const updatedUser = await prisma.user.update({
      where: { id: ctx.userId },
      data: { image: imageDataUrl },
      select: { id: true, image: true },
    });

    return { success: true, image: updatedUser.image };
  } catch (error: any) {
    console.error("Lỗi khi cập nhật avatar:", error);
    return {
      success: false,
      error: error.message || "Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.",
    };
  }
}
