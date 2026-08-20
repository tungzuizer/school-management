"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiChatCompletion, getAISettings } from "@/lib/ai-provider";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export async function getAISettingsConfig() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const settings = await getAISettings();
  return {
    success: true,
    settings: {
      apiBase: settings.apiBase,
      apiKey: settings.apiKey,
      model: settings.model,
    },
  };
}

export async function saveAISettingsConfig(data: {
  apiBase: string;
  apiKey: string;
  model: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const cleanBase = data.apiBase.trim();
    const cleanKey = data.apiKey.trim();
    const cleanModel = data.model.trim();

    await prisma.$transaction([
      prisma.systemSetting.upsert({
        where: { key: "OMNIROUTE_API_BASE" },
        update: { value: cleanBase },
        create: { key: "OMNIROUTE_API_BASE", value: cleanBase },
      }),
      prisma.systemSetting.upsert({
        where: { key: "OMNIROUTE_API_KEY" },
        update: { value: cleanKey },
        create: { key: "OMNIROUTE_API_KEY", value: cleanKey },
      }),
      prisma.systemSetting.upsert({
        where: { key: "OMNIROUTE_MODEL" },
        update: { value: cleanModel },
        create: { key: "OMNIROUTE_MODEL", value: cleanModel },
      }),
    ]);

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Hiệu trưởng",
      userRole: session.user.role || "ADMIN",
      action: "UPDATE",
      entityName: "SystemSetting",
      entityId: "OMNIROUTE_CONFIG",
      description: `Cập nhật cấu hình OmniRoute AI (URL: ${cleanBase}, Model: ${cleanModel})`,
    });

    revalidatePath("/admin/ai-config");
    revalidatePath("/admin/principal-ai");

    return { success: true };
  } catch (error: any) {
    console.error("Error saving AI settings:", error);
    return { success: false, error: "Lỗi lưu cấu hình: " + (error.message || "") };
  }
}

export async function testAIConnection() {
  const startTime = Date.now();
  const result = await aiChatCompletion({
    prompt: "Xin chào! Bạn là Trợ lý AI Quản lý Giáo dục. Hãy giới thiệu bản thân và xác nhận kết nối hệ thống OmniRoute thành công trong 2-3 câu chuyên nghiệp.",
    max_tokens: 500,
    temperature: 0.7,
  });
  const latencyMs = Date.now() - startTime;

  if (result.success) {
    return {
      success: true,
      text: result.text,
      latencyMs,
    };
  } else {
    return {
      success: false,
      error: result.error || "Lỗi không xác định",
      latencyMs,
    };
  }
}
