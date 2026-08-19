import prisma from "@/lib/prisma";

export interface AIChatParams {
  prompt?: string;
  messages?: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface AIChatResult {
  success: boolean;
  text: string;
  error: string | null;
}

export async function getAISettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["OMNIROUTE_API_BASE", "OMNIROUTE_API_KEY", "OMNIROUTE_MODEL"] },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      apiBase:
        settingsMap["OMNIROUTE_API_BASE"] ||
        process.env.OMNIROUTE_API_BASE ||
        process.env.OPENAI_API_BASE ||
        "http://127.0.0.1:20128/v1",
      apiKey:
        settingsMap["OMNIROUTE_API_KEY"] ||
        process.env.OMNIROUTE_API_KEY ||
        process.env.OPENAI_API_KEY ||
        "sk-omniroute-default",
      model:
        settingsMap["OMNIROUTE_MODEL"] ||
        process.env.OMNIROUTE_MODEL ||
        process.env.OPENAI_MODEL ||
        "gpt-4o-mini",
    };
  } catch {
    return {
      apiBase: process.env.OMNIROUTE_API_BASE || process.env.OPENAI_API_BASE || "http://127.0.0.1:20128/v1",
      apiKey: process.env.OMNIROUTE_API_KEY || process.env.OPENAI_API_KEY || "sk-omniroute-default",
      model: process.env.OMNIROUTE_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }
}

/**
 * Universal AI Completion function targeting OmniRoute API or OpenAI Compatible Endpoints
 */
export async function aiChatCompletion(params: AIChatParams): Promise<AIChatResult> {
  const currentSettings = await getAISettings();

  // 1. Resolve API Key
  const apiKey = currentSettings.apiKey;

  // 2. Resolve Base URL
  let rawBase = currentSettings.apiBase.trim().replace(/\/$/, "");

  const endpoint = rawBase.endsWith("/chat/completions")
    ? rawBase
    : rawBase.endsWith("/v1")
    ? `${rawBase}/chat/completions`
    : `${rawBase}/v1/chat/completions`;

  // 3. Resolve Model Name
  const model = params.model || currentSettings.model;

  const messages =
    params.messages ||
    (params.prompt ? [{ role: "user" as const, content: params.prompt }] : []);

  if (messages.length === 0) {
    return {
      success: false,
      text: "",
      error: "Nội dung yêu cầu (prompt/messages) bị rỗng.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: params.max_tokens || 2048,
        temperature: params.temperature ?? 0.7,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[OmniRoute AI Error] (${endpoint}) Status:`, response.status, errBody);
      return {
        success: false,
        text: "",
        error: `API OmniRoute phản hồi lỗi [${response.status}]: ${errBody.substring(0, 300)}`,
      };
    }

    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    if (!text) {
      return {
        success: false,
        text: "",
        error: "AI trả về phản hồi rỗng. Vui lòng kiểm tra lại OmniRoute API.",
      };
    }

    return { success: true, text, error: null };
  } catch (error: any) {
    console.error(`[OmniRoute Connection Error] (${endpoint}):`, error);
    return {
      success: false,
      text: "",
      error: `Không thể kết nối đến máy chủ OmniRoute API (${endpoint}). Chi tiết: ${error.message || "Lỗi mạng"}`,
    };
  }
}
