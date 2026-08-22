"use server";

import prisma from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";
import { getComprehensiveAIContext } from "@/lib/ai-data-engine";

export async function askPrincipalAI(query: string) {
  const dbContext = await getComprehensiveAIContext(query);

  const prompt = `Bạn là Trợ lý AI Thông minh & Cố vấn Quản lý Giáo dục cho Hiệu trưởng.

DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ CƠ SỞ DỮ LIỆU HỆ THỐNG NGUYÊN BẢN:
${dbContext}

CÂU HỎI / YÊU CẦU CỦA HIỆU TRƯỞNG:
"${query}"

QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
1. Hãy trả lời ĐÚNG TRỌNG TÂM câu hỏi của Hiệu trưởng dựa trên dữ liệu thực tế ở trên. Đi thẳng vào vấn đề, tự nhiên, rõ ràng.
2. Nếu Hiệu trưởng hỏi tra cứu thông tin (như sĩ số, học sinh đi học, vắng mặt, điểm trường, giáo viên), hãy cung cấp ngay con số thực tế trong cơ sở dữ liệu. KHÔNG viết lan man hay tự chế số liệu.
3. Nếu câu hỏi yêu cầu lập kế hoạch/giải pháp chỉ đạo, hãy trình bày rõ các phương án chỉ đạo ở cuối bài dạng:

PHƯƠNG_ÁN_1:
TIÊU_ĐỀ: [Tên phương án 1]
ĐIỂM: [0-100]
ƯU_ĐIỂM: [liệt kê, ngăn cách bằng |]
NHƯỢC_ĐIỂM: [liệt kê, ngăn cách bằng |]

PHƯƠNG_ÁN_2:
TIÊU_ĐỀ: [Tên phương án 2]
ĐIỂM: [0-100]
ƯU_ĐIỂM: [liệt kê, ngăn cách bằng |]
NHƯỢC_ĐIỂM: [liệt kê, ngăn cách bằng |]

CƠ_SỞ_PHÁP_LÝ: [Thông tư / Điều lệ BGDĐT]
BƯỚC_TRIỂN_KHAI: [các bước, ngăn cách bằng |]`;

  const aiRes = await aiChatCompletion({ prompt, max_tokens: 2048 });
  if (!aiRes.success) {
    return { success: false, data: null, error: aiRes.error };
  }

  let aiText = aiRes.text;

  const hasOptions = aiText.includes("PHƯƠNG_ÁN_1");
  const lines = aiText.split("\n");

  const summary = lines.find(l => l.includes("TÓM_TẮT"))?.split(":")[1]?.trim() || aiText.split("PHƯƠNG_ÁN_1")[0].trim();
  const riskLevel = (lines.find(l => l.includes("MỨC_RỦI_RO"))?.split(":")[1]?.trim() || "LOW").toUpperCase();
  const policyNote = lines.find(l => l.includes("CƠ_SỞ_PHÁP_LÝ"))?.split(":")[1]?.trim() || undefined;
  const actionStepsStr = lines.find(l => l.includes("BƯỚC_TRIỂN_KHAI"))?.split(":")[1]?.trim();
  const actionSteps = actionStepsStr ? actionStepsStr.split("|").map(s => s.trim()).filter(Boolean) : [];

  const options: Array<{ title: string; pros: string[]; cons: string[]; score: number }> = [];

  if (hasOptions) {
    for (let i = 1; i <= 3; i++) {
      const titleKey = `PHƯƠNG_ÁN_${i}`;
      const sectionStart = lines.findIndex(l => l.includes(titleKey));
      if (sectionStart === -1) continue;

      const sectionLines = lines.slice(sectionStart, sectionStart + 6);
      const getVal = (key: string) => {
        const line = sectionLines.find(l => l.includes(key));
        return line ? line.split(":").slice(1).join(":").trim() : "";
      };

      const title = getVal("TIÊU_ĐỀ") || `Phương án ${i}`;
      const score = parseInt(getVal("ĐIỂM")) || 75;
      const pros = getVal("ƯU_ĐIỂM") ? getVal("ƯU_ĐIỂM").split("|").map(s => s.trim()).filter(Boolean) : [];
      const cons = getVal("NHƯỢC_ĐIỂM") ? getVal("NHƯỢC_ĐIỂM").split("|").map(s => s.trim()).filter(Boolean) : [];

      options.push({ title, score, pros, cons });
    }

    const optionStartIndex = aiText.indexOf("PHƯƠNG_ÁN_1");
    if (optionStartIndex !== -1) {
      aiText = aiText.substring(0, optionStartIndex).trim();
    }
  }

  aiText = aiText.replace(/^TÓM_TẮT:\s*/i, "").replace(/^MỨC_RỦI_RO:\s*\w+\s*/im, "").trim();

  return {
    success: true,
    data: {
      text: aiText,
      recommendation: hasOptions || actionSteps.length > 0 ? {
        summary: summary.replace(/^TÓM_TẮT:\s*/i, ""),
        riskLevel: (["LOW", "MEDIUM", "HIGH"].includes(riskLevel) ? riskLevel : "LOW") as "LOW" | "MEDIUM" | "HIGH",
        options,
        policyNote,
        actionSteps,
      } : null,
    },
    error: null,
  };
}

export async function saveDecision(input: {
  query: string;
  aiRecommendation: string;
  decisionTaken?: string;
}) {
  try {
    const decision = await prisma.decisionLog.create({
      data: {
        query: input.query,
        aiRecommendation: input.aiRecommendation,
        decisionTaken: input.decisionTaken || null,
      },
    });

    return {
      success: true,
      data: {
        id: decision.id,
        query: decision.query,
        aiRecommendation: decision.aiRecommendation,
        decisionTaken: decision.decisionTaken || "",
        createdAt: decision.createdAt.toLocaleDateString("vi-VN"),
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

export async function getDecisionLogs() {
  const logs = await prisma.decisionLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  return logs.map((d) => ({
    id: d.id,
    query: d.query,
    aiRecommendation: d.aiRecommendation,
    decisionTaken: d.decisionTaken || "",
    createdAt: d.createdAt.toLocaleDateString("vi-VN"),
  }));
}

export async function getSchoolPointsContext() {
  const points = await prisma.schoolPoint.findMany({
    include: {
      campus: true,
      classRooms: {
        include: {
          students: { where: { status: "STUDYING" } },
        },
      },
    },
    orderBy: { distanceKm: "asc" },
  });

  return points.map((p) => ({
    name: p.name,
    distanceKm: p.distanceKm ?? 0,
    studentsCount: p.classRooms.reduce((sum, c) => sum + c.students.length, 0),
    teacherCount: 0,
    campusName: p.campus.name,
  }));
}
