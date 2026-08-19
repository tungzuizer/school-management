import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

/**
 * Universal AI Completion function targeting OmniRoute API or OpenAI Compatible Endpoints
 */
export async function aiChatCompletion(params: AIChatParams): Promise<AIChatResult> {
  // 1. Resolve API Key (OmniRoute / OpenAI / Custom AI API)
  const apiKey =
    process.env.OMNIROUTE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "sk-omniroute-default";

  // 2. Resolve API Base URL for OmniRoute
  let rawBase = (
    process.env.OMNIROUTE_API_BASE ||
    process.env.OPENAI_API_BASE ||
    process.env.AI_API_BASE ||
    "http://127.0.0.1:20128/v1"
  ).trim();

  rawBase = rawBase.replace(/\/$/, "");

  const endpoint = rawBase.endsWith("/chat/completions")
    ? rawBase
    : rawBase.endsWith("/v1")
    ? `${rawBase}/chat/completions`
    : `${rawBase}/v1/chat/completions`;

  // 3. Resolve Model Name
  const model =
    params.model ||
    process.env.OMNIROUTE_MODEL ||
    process.env.OPENAI_MODEL ||
    process.env.AI_MODEL ||
    "gpt-4o-mini";

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
