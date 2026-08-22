"use server";

import { aiChatCompletion } from "@/lib/ai-provider";

export async function askGeneralAI(query: string, userRole?: string) {
  if (!query || !query.trim()) {
    return { success: false, text: "", error: "Câu hỏi không được để rỗng." };
  }

  const roleName = userRole || "USER";
  const prompt = `Bạn là Trợ lý AI Thông minh & Thân thiện cho Trường Học (Trợ lý Giáo dục & Quản lý).
Vai trò người dùng hiện tại: ${roleName}.

YÊU CẦU / CÂU HỎI:
"${query}"

Hãy trả lời bằng tiếng Việt dễ hiểu, chuyên nghiệp, ngắn gọn, hữu ích và mang tính hỗ trợ cao. Dùng các biểu tượng cảm xúc (emoji) trực quan phù hợp.`;

  const result = await aiChatCompletion({ prompt, max_tokens: 1500, temperature: 0.7 });
  return result;
}
