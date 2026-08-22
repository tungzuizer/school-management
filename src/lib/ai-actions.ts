"use server";

import { aiChatCompletion } from "@/lib/ai-provider";
import { getComprehensiveAIContext } from "@/lib/ai-data-engine";

export async function askGeneralAI(query: string, userRole?: string) {
  if (!query || !query.trim()) {
    return { success: false, text: "", error: "Câu hỏi không được để rỗng." };
  }

  const roleName = userRole || "USER";
  const dbContext = await getComprehensiveAIContext(query);

  const prompt = `Bạn là Trợ lý AI Thông minh & Thân thiện cho Trường Học (Trợ lý Giáo dục & Quản lý).
Vai trò người dùng hiện tại: ${roleName}.

DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ CƠ SỞ DỮ LIỆU HỆ THỐNG:
${dbContext}

YÊU CẦU / CÂU HỎI CỦA NGƯỜI DÙNG:
"${query}"

QUY TẮC PHẢN HỒI:
1. Nếu câu hỏi liên quan đến dữ liệu trường (sĩ số, điểm danh, giáo viên, điểm trường, cảnh báo, tuyên dương), hãy trả lời CHÍNH XÁC dựa trên DỮ LIỆU THỰC TẾ ở trên.
2. Trả lời bằng tiếng Việt chuyên nghiệp, ngắn gọn, nhiệt tình và hữu ích. Sử dụng emoji sinh động phù hợp.`;

  const result = await aiChatCompletion({ prompt, max_tokens: 1500, temperature: 0.7 });
  return result;
}
