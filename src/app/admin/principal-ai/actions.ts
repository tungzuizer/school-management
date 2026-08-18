"use server";

import prisma from "@/lib/prisma";


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

  const prompt = `Bạn là Trợ lý AI Tư vấn Ra Quyết định cho Hiệu trưởng trường phổ thông có nhiều điểm trường vệ tinh phân tán theo địa hình vùng cao.

DỮ LIỆU THỰC TẾ HỆ THỐNG:

1. HỆ THỐNG ĐIỂM TRƯỜNG (${schoolPoints.length} điểm):
${pointsContext}

2. TỔNG HỌC SINH ĐANG HỌC: ${totalStudents}

3. CẢNH BÁO SỚM ĐANG HOẠT ĐỘNG:
${warningsContext}

4. ĐIỀU CHUYỂN DẠY THAY GẦN ĐÂY:
${assignmentsContext}

5. QUYẾT ĐỊNH CHỈ ĐẠO GẦN ĐÂY:
${decisionsContext}

CÂU HỎI CỦA HIỆU TRƯỞNG:
"${query}"

Hãy phân tích và đưa ra khuyến nghị chiến lược. Trả lời bằng tiếng Việt có dấu, chuyên nghiệp. Format:

TÓM_TẮT: [Tóm tắt khuyến nghị tối ưu, 1-2 câu]
MỨC_RỦI_RO: [LOW hoặc MEDIUM hoặc HIGH]

PHƯƠNG_ÁN_1:
TIÊU_ĐỀ: [Tên phương án]
ĐIỂM: [0-100]
ƯU_ĐIỂM: [liệt kê, ngăn cách bằng |]
NHƯỢC_ĐIỂM: [liệt kê, ngăn cách bằng |]

PHƯƠNG_ÁN_2:
TIÊU_ĐỀ: [Tên phương án (nếu có)]
ĐIỂM: [0-100]
ƯU_ĐIỂM: [liệt kê, ngăn cách bằng |]
NHƯỢC_ĐIỂM: [liệt kê, ngăn cách bằng |]

CƠ_SỞ_PHÁP_LÝ: [Trích dẫn văn bản quy phạm liên quan nếu có]
BƯỚC_TRIỂN_KHAI: [các bước, ngăn cách bằng |]`;

  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "http://localhost:20128/v1";

  if (!apiKey) {
    return {
      success: false,
      data: null,
      error: "Chưa cấu hình OPENAI_API_KEY.",
    };
  }

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, data: null, error: `API lỗi: ${response.status} - ${err}` };
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content || "";

    // Parse structured response
    const lines = aiText.split("\n");
    const getValue = (key: string) => {
      const line = lines.find((l: string) => l.includes(key));
      return line ? line.split(":").slice(1).join(":").trim() : "";
    };

    const summary = getValue("TÓM_TẮT") || aiText.substring(0, 200);
    const riskLevel = (getValue("MỨC_RỦI_RO") || "MEDIUM").toUpperCase();
    const policyNote = getValue("CƠ_SỞ_PHÁP_LÝ") || undefined;
    const actionSteps = getValue("BƯỚC_TRIỂN_KHAI")
      ? getValue("BƯỚC_TRIỂN_KHAI").split("|").map((s: string) => s.trim()).filter(Boolean)
      : ["Xem xét và phê duyệt khuyến nghị"];

    // Parse options
    const options: Array<{
      title: string;
      pros: string[];
      cons: string[];
      score: number;
    }> = [];

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
      const pros = getVal("ƯU_ĐIỂM") ? getVal("ƯU_ĐIỂM").split("|").map((s: string) => s.trim()).filter(Boolean) : ["Cần phân tích thêm"];
      const cons = getVal("NHƯỢC_ĐIỂM") ? getVal("NHƯỢC_ĐIỂM").split("|").map((s: string) => s.trim()).filter(Boolean) : ["Cần đánh giá thêm"];

      options.push({ title, score, pros, cons });
    }

    if (options.length === 0) {
      options.push({
        title: "Khuyến nghị AI",
        score: 85,
        pros: [summary],
        cons: ["Cần Hiệu trưởng xem xét thêm bối cảnh thực tế"],
      });
    }

    return {
      success: true,
      data: {
        text: aiText,
        recommendation: {
          summary,
          riskLevel: (["LOW", "MEDIUM", "HIGH"].includes(riskLevel) ? riskLevel : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH",
          options,
          policyNote,
          actionSteps,
        },
      },
      error: null,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, data: null, error: `Không thể kết nối AI: ${msg}` };
  }
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
