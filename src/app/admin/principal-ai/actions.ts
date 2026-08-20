"use server";

import prisma from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";


// Ask Principal AI for decision support
export async function askPrincipalAI(query: string) {
  // Gather real context from DB
  const schoolPoints = await prisma.schoolPoint.findMany({
    include: { campus: true },
    orderBy: { distanceKm: "asc" },
  });

  const recentWarnings = await prisma.earlyWarning.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentAssignments = await prisma.substituteAssignment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentDecisions = await prisma.decisionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalStudents = await prisma.student.count({ where: { status: "STUDYING" } });

  // Gather real-time attendance metrics for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const presentToday = await prisma.attendance.count({
    where: {
      createdAt: { gte: todayStart },
      status: "PRESENT",
    },
  });

  const absentToday = await prisma.attendance.count({
    where: {
      createdAt: { gte: todayStart },
      status: { in: ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] },
    },
  });

  const lateToday = await prisma.attendance.count({
    where: {
      createdAt: { gte: todayStart },
      status: "LATE",
    },
  });

  const pointsContext = schoolPoints
    .map((sp) => `- ${sp.name} (${sp.campus.name}): ${sp.distanceKm ?? 0}km, QL: ${sp.managerName || "N/A"}, SĐT: ${sp.phone || "N/A"}`)
    .join("\n");

  const warningsContext = recentWarnings.length > 0
    ? recentWarnings.map((w) => `- [${w.level}] ${w.title} tại ${w.schoolPointName || "N/A"} (${w.category})`).join("\n")
    : "Không có cảnh báo nào đang hoạt động.";

  const assignmentsContext = recentAssignments.length > 0
    ? recentAssignments.map((a) => `- ${a.originalTeacher} nghỉ → ${a.substituteTeacher} dạy thay tại ${a.schoolPointName || "N/A"} (${a.status})`).join("\n")
    : "Không có điều chuyển gần đây.";

  const decisionsContext = recentDecisions.length > 0
    ? recentDecisions.map((d) => `- ${d.query.substring(0, 80)}... (${d.createdAt.toLocaleDateString("vi-VN")})`).join("\n")
    : "Chưa có quyết định nào được ghi nhận.";

  const prompt = `Bạn là Trợ lý AI Thông minh & Cố vấn Quản lý Giáo dục cho Hiệu trưởng.

DỮ LIỆU THỰC TẾ TRÍCH XUẤT TỪ CƠ SỞ DỮ LIỆU HỆ THỐNG HÔM NAY (${new Date().toLocaleDateString("vi-VN")}):

1. HỆ THỐNG ĐIỂM TRƯỜNG (${schoolPoints.length} điểm):
${pointsContext}

2. DỮ LIỆU SĨ SỐ & ĐIỂM DANH HỌC SINH REAL-TIME:
- Tổng số học sinh chính thức (STATUS=STUDYING): ${totalStudents} học sinh
- Số học sinh CÓ MẶT đã điểm danh hôm nay: ${presentToday > 0 ? presentToday + " em" : "0 em (Chưa ghi nhận ca điểm danh có mặt hôm nay)"}
- Số học sinh VẮNG MẶT hôm nay: ${absentToday} em
- Số học sinh ĐI MUỘN hôm nay: ${lateToday} em

3. CẢNH BÁO SỚM ĐANG HOẠT ĐỘNG:
${warningsContext}

4. ĐIỀU CHUYỂN DẠY THAY GẦN ĐÂY:
${assignmentsContext}

5. QUYẾT ĐỊNH CHỈ ĐẠO GẦN ĐÂY:
${decisionsContext}

CÂU HỎI / YÊU CẦU CỦA HIỆU TRƯỞNG:
"${query}"

QUY TẮC PHẢN HỒI (RẤT QUAN TRỌNG):
1. Hãy trả lời ĐÚNG TRỌNG TÂM câu hỏi của Hiệu trưởng. Đi thẳng vào vấn đề, tự nhiên, rõ ràng.
2. Nếu Hiệu trưởng hỏi tra cứu thông tin (như sĩ số, học sinh đi học, vắng mặt, điểm trường, giáo viên), hãy cung cấp ngay con số thực tế ở Mục 2. KHÔNG viết lan man.
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

  // Clean raw tags if any
  const hasOptions = aiText.includes("PHƯƠNG_ÁN_1");
  const lines = aiText.split("\n");

  const getValue = (key: string) => {
    const line = lines.find((l: string) => l.includes(key));
    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

  const summary = getValue("TÓM_TẮT") || aiText.split("PHƯƠNG_ÁN_1")[0].trim();
  const riskLevel = (getValue("MỨC_RỦI_RO") || "LOW").toUpperCase();
  const policyNote = getValue("CƠ_SỞ_PHÁP_LÝ") || undefined;
  const actionSteps = getValue("BƯỚC_TRIỂN_KHAI")
    ? getValue("BƯỚC_TRIỂN_KHAI").split("|").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const options: Array<{
    title: string;
    pros: string[];
    cons: string[];
    score: number;
  }> = [];

  if (hasOptions) {
    for (let i = 1; i <= 3; i++) {
      const titleKey = i === 1 ? "PHƯƠNG_ÁN_1" : i === 2 ? "PHƯƠNG_ÁN_2" : "PHƯƠNG_ÁN_3";
      const sectionStart = lines.findIndex((l: string) => l.includes(titleKey));
      if (sectionStart === -1) continue;

      const sectionLines = lines.slice(sectionStart, sectionStart + 6);
      const getVal = (key: string) => {
        const line = sectionLines.find((l: string) => l.includes(key));
        return line ? line.split(":").slice(1).join(":").trim() : "";
      };

      const title = getVal("TIÊU_ĐỀ") || `Phương án ${i}`;
      const score = parseInt(getVal("ĐIỂM")) || 75;
      const pros = getVal("ƯU_ĐIỂM") ? getVal("ƯU_ĐIỂM").split("|").map((s: string) => s.trim()).filter(Boolean) : [];
      const cons = getVal("NHƯỢC_ĐIỂM") ? getVal("NHƯỢC_ĐIỂM").split("|").map((s: string) => s.trim()).filter(Boolean) : [];

      options.push({ title, score, pros, cons });
    }

    // Strip out the raw PHƯƠNG_ÁN block from main text so text is clean markdown
    const optionStartIndex = aiText.indexOf("PHƯƠNG_ÁN_1");
    if (optionStartIndex !== -1) {
      aiText = aiText.substring(0, optionStartIndex).trim();
    }
  }

  // Clean remaining key labels like TÓM_TẮT:
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

// Save a decision to the log
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

// Get all decision logs
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

// Get school points info for the sidebar context
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
    teacherCount: 0, // Would need a Teacher-SchoolPoint relation
    campusName: p.campus.name,
  }));
}
