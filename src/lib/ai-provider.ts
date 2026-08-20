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

    let apiBase =
      settingsMap["OMNIROUTE_API_BASE"] ||
      process.env.OMNIROUTE_API_BASE ||
      process.env.OPENAI_API_BASE ||
      "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1";

    // If running on Vercel Cloud, auto-fallback localhost/127.0.0.1 to active ngrok URL
    if (
      (apiBase.includes("localhost") || apiBase.includes("127.0.0.1")) &&
      (process.env.VERCEL === "1" || process.env.NODE_ENV === "production")
    ) {
      apiBase = "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1";
    }

    return {
      apiBase,
      apiKey:
        settingsMap["OMNIROUTE_API_KEY"] ||
        process.env.OMNIROUTE_API_KEY ||
        process.env.OPENAI_API_KEY ||
        "sk-f3574d44ab943de1-9647e3-1d702ffe",
      model:
        settingsMap["OMNIROUTE_MODEL"] ||
        process.env.OMNIROUTE_MODEL ||
        process.env.OPENAI_MODEL ||
        "antigravity/gemini-2.5-flash-lite",
    };
  } catch {
    let apiBase = process.env.OMNIROUTE_API_BASE || process.env.OPENAI_API_BASE || "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1";
    if (
      (apiBase.includes("localhost") || apiBase.includes("127.0.0.1")) &&
      (process.env.VERCEL === "1" || process.env.NODE_ENV === "production")
    ) {
      apiBase = "https://epicedial-fixtureless-imogene.ngrok-free.dev/v1";
    }

    return {
      apiBase,
      apiKey: process.env.OMNIROUTE_API_KEY || process.env.OPENAI_API_KEY || "sk-f3574d44ab943de1-9647e3-1d702ffe",
      model: process.env.OMNIROUTE_MODEL || process.env.OPENAI_MODEL || "antigravity/gemini-2.5-flash-lite",
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
        "bypass-tunnel-reminder": "true",
        "ngrok-skip-browser-warning": "true",
        "User-Agent": "SchoolManagementAI/1.0",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.max_tokens || 2048,
        temperature: params.temperature ?? 0.7,
        stream: false,
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
    const isLocal = endpoint.includes("127.0.0.1") || endpoint.includes("localhost");
    const localHint = isLocal
      ? " 💡 LƯU Ý: Web đang chạy trên Vercel Cloud nên máy chủ đám mây không thể kết nối trực tiếp đến IP 127.0.0.1 / localhost trên máy tính cá nhân của bạn. Vui lòng chạy lệnh 'ngrok http 20128' hoặc dùng Cloudflare Tunnel để tạo URL công khai cho OmniRoute, sau đó dán URL đó vào trang /admin/ai-config."
      : "";

    return {
      success: false,
      text: "",
      error: `Không thể kết nối đến máy chủ OmniRoute API (${endpoint}). Chi tiết: ${error.message || "fetch failed"}.${localHint}`,
    };
  }
}
