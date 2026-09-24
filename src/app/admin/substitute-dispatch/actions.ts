"use server";

import prisma from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";


// Get all substitute assignments with optional school point filter
export async function getAssignments(filterPoint?: string) {
  const where: Record<string, unknown> = {};
  if (filterPoint && filterPoint !== "ALL") {
    where.schoolPointName = filterPoint;
  }

  const assignments = await prisma.substituteAssignment.findMany({
    where,
    orderBy: [{ status: "asc" }, { date: "desc" }, { createdAt: "desc" }],
  });

  return assignments.map((a) => ({
    id: a.id,
    originalTeacher: a.originalTeacher,
    substituteTeacher: a.substituteTeacher,
    campusName: a.campusName || "",
    schoolPointName: a.schoolPointName || "",
    distanceKm: a.distanceKm ?? 0,
    className: a.className,
    subjectName: a.subjectName,
    date: a.date.toISOString().split("T")[0],
    period: a.period,
    reason: a.reason || "",
    aiRecommendation: a.aiRecommendation || "",
    status: a.status,
  }));
}

// Approve a substitute assignment
export async function approveAssignment(id: string) {
  try {
    await prisma.substituteAssignment.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

// Create a new substitute assignment request
export async function createAssignment(input: {
  originalTeacher: string;
  schoolPointName: string;
  className: string;
  subjectName: string;
  date: string;
  period: number;
  reason: string;
}) {
  try {
    // Find school point info
    const schoolPoint = await prisma.schoolPoint.findFirst({
      where: { name: input.schoolPointName },
      include: { campus: true },
    });

    const campusName = schoolPoint?.campus?.name || "";
    const distanceKm = schoolPoint?.distanceKm ?? 0;

    // Use AI to find best substitute teacher
    const aiResult = await findSubstituteAI({
      originalTeacher: input.originalTeacher,
      schoolPointName: input.schoolPointName,
      distanceKm,
      className: input.className,
      subjectName: input.subjectName,
      date: input.date,
      period: input.period,
    });

    const assignment = await prisma.substituteAssignment.create({
      data: {
        originalTeacher: input.originalTeacher,
        substituteTeacher: aiResult.substituteTeacher,
        campusName,
        schoolPointName: input.schoolPointName,
        distanceKm,
        className: input.className,
        subjectName: input.subjectName,
        date: new Date(input.date),
        period: input.period,
        reason: input.reason || "Xin nghỉ đột xuất",
        aiRecommendation: aiResult.recommendation,
        status: "PENDING",
      },
    });

    
    return { success: true, data: assignment };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

// AI auto-dispatch: find optimal substitute teacher
export async function autoDispatchAI() {
  try {
    // Gather context: today's pending needs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get school points for context
    const schoolPoints = await prisma.schoolPoint.findMany({
      include: { campus: true },
      orderBy: { distanceKm: "asc" },
    });

    const schoolPointsContext = schoolPoints
      .map((sp) => `- ${sp.name} (${sp.campus.name}): ${sp.distanceKm ?? 0}km`)
      .join("\n");

    // Get real teachers with specialties and assignments
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { name: true } },
        teachingAssignments: {
          include: {
            subject: { select: { name: true } },
            classRoom: { include: { schoolPoint: true } },
          },
        },
      },
    });

    const teachersContext = teachers.length > 0
      ? teachers
          .map((t) => {
            const subjects = Array.from(
              new Set([
                t.specialty,
                ...t.teachingAssignments.map((ta) => ta.subject.name),
              ])
            ).filter(Boolean).join(", ");
            const points = Array.from(
              new Set(
                t.teachingAssignments
                  .map((ta) => ta.classRoom.schoolPoint?.name)
                  .filter(Boolean)
              )
            ).join(", ");
            return `- ${t.user.name} (Môn dạy: ${subjects || "N/A"}, Điểm trường: ${points || "Điểm Trung Tâm"})`;
          })
          .join("\n")
      : "Chưa có dữ liệu giáo viên.";

    // Get existing assignments today
    const existingToday = await prisma.substituteAssignment.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    });

    const existingContext = existingToday.length > 0
      ? existingToday.map((a) => `- ${a.originalTeacher} nghỉ, ${a.substituteTeacher} dạy thay tại ${a.schoolPointName} tiết ${a.period}`).join("\n")
      : "Chưa có phân công nào hôm nay.";

    const prompt = `Bạn là trợ lý AI điều chuyển giáo viên dạy thay cho trường phổ thông có nhiều phân hiệu/điểm trường vệ tinh.

DANH SÁCH GIÁO VIÊN THỰC TẾ TRONG HỆ THỐNG:
${teachersContext}

HỆ THỐNG ĐIỂM TRƯỜNG:
${schoolPointsContext}

TÌNH HÌNH PHÂN CÔNG HÔM NAY (${today.toLocaleDateString("vi-VN")}):
${existingContext}

Hãy đề xuất 1 phương án điều chuyển dạy thay mới dựa trên tình hình thực tế. Phân tích:
1. Giáo viên nào có thể trống tiết và gần nhất (tính theo khoảng cách km)
2. Thời gian di chuyển dự kiến
3. Đánh giá mức độ tối ưu (0-100)

Trả lời bằng tiếng Việt, ngắn gọn. Định dạng chính xác:
GIAO_VIEN_NGHI: [Họ tên giáo viên nghỉ]
GIAO_VIEN_DAY_THAY: [Họ tên giáo viên dạy thay đề xuất]
DIEM_TRUONG: [Tên điểm trường]
MON_HOC: [Tên môn học]
LOP: [Tên lớp]
TIET: [Số tiết]
KHUYEN_NGHI: [Phân tích chi tiết phương án và lộ trình]`;

    const aiRes = await aiChatCompletion({ prompt, max_tokens: 1024 });
    if (!aiRes.success) {
      return { success: false, error: aiRes.error };
    }

    const aiText = aiRes.text;

    // Parse AI response to create assignment
    const lines = aiText.split("\n");
    const getValue = (key: string) => {
      const line = lines.find((l: string) => l.includes(key));
      return line ? line.split(":").slice(1).join(":").trim() : "";
    };

    const originalTeacher = getValue("GIAO_VIEN_NGHI") || "GV được AI phát hiện vắng";
    const substituteTeacher = getValue("GIAO_VIEN_DAY_THAY") || "GV được AI đề xuất";
    const pointName = getValue("DIEM_TRUONG") || schoolPoints[0]?.name || "";
    const subjectName = getValue("MON_HOC") || "Môn học";
    const className = getValue("LOP") || "Lớp";
    const period = parseInt(getValue("TIET")) || 3;
    const recommendation = getValue("KHUYEN_NGHI") || aiText;

    const point = schoolPoints.find((sp) => pointName.includes(sp.name)) || schoolPoints[0];

    const assignment = await prisma.substituteAssignment.create({
      data: {
        originalTeacher,
        substituteTeacher,
        campusName: point?.campus?.name || "",
        schoolPointName: point?.name || pointName,
        distanceKm: point?.distanceKm ?? 0,
        className,
        subjectName,
        date: today,
        period,
        reason: "AI tự động phát hiện và điều chuyển",
        aiRecommendation: recommendation,
        status: "PENDING",
      },
    });

    
    return {
      success: true,
      data: {
        id: assignment.id,
        originalTeacher: assignment.originalTeacher,
        substituteTeacher: assignment.substituteTeacher,
        campusName: assignment.campusName || "",
        schoolPointName: assignment.schoolPointName || "",
        distanceKm: assignment.distanceKm ?? 0,
        className: assignment.className,
        subjectName: assignment.subjectName,
        date: assignment.date.toISOString().split("T")[0],
        period: assignment.period,
        reason: assignment.reason || "",
        aiRecommendation: assignment.aiRecommendation || "",
        status: assignment.status,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

// Helper: Use AI to find best substitute teacher for a specific request
async function findSubstituteAI(input: {
  originalTeacher: string;
  schoolPointName: string;
  distanceKm: number;
  className: string;
  subjectName: string;
  date: string;
  period: number;
}) {
  // Get all school points for context
  const schoolPoints = await prisma.schoolPoint.findMany({
    include: { campus: true },
    orderBy: { distanceKm: "asc" },
  });

  // Get real teachers with specialties and assignments
  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { name: true } },
      teachingAssignments: {
        include: {
          subject: { select: { name: true } },
          classRoom: { include: { schoolPoint: true } },
        },
      },
    },
  });

  const teachersContext = teachers.length > 0
    ? teachers
        .map((t) => {
          const subjects = Array.from(
            new Set([
              t.specialty,
              ...t.teachingAssignments.map((ta) => ta.subject.name),
            ])
          ).filter(Boolean).join(", ");
          const points = Array.from(
            new Set(
              t.teachingAssignments
                .map((ta) => ta.classRoom.schoolPoint?.name)
                .filter(Boolean)
            )
          ).join(", ");
          return `- ${t.user.name} (Môn dạy: ${subjects || "N/A"}, Điểm trường: ${points || "Điểm Trung Tâm"})`;
        })
        .join("\n")
    : "Chưa có dữ liệu giáo viên.";

  const prompt = `Bạn là trợ lý AI điều chuyển giáo viên dạy thay. Hãy đề xuất giáo viên dạy thay phù hợp nhất:

DANH SÁCH GIÁO VIÊN THỰC TẾ TRONG HỆ THỐNG:
${teachersContext}

THÔNG TIN YÊU CẦU:
- GV xin nghỉ: ${input.originalTeacher}
- Điểm trường: ${input.schoolPointName} (cách Trung Tâm ${input.distanceKm}km)
- Lớp: ${input.className}
- Môn: ${input.subjectName}
- Ngày: ${input.date}
- Tiết: ${input.period}

HỆ THỐNG ĐIỂM TRƯỜNG:
${schoolPoints.map((sp) => `- ${sp.name} (${sp.distanceKm ?? 0}km)`).join("\n")}

Hãy đề xuất:
1. Tên GV dạy thay phù hợp nhất (ưu tiên GV cùng chuyên môn ở điểm trường gần nhất)
2. Khoảng cách di chuyển và thời gian dự kiến
3. Đánh giá mức độ tối ưu (0-100)

Trả lời ngắn gọn bằng tiếng Việt, chỉ 2-3 câu. Định dạng:
GV_DAY_THAY: [Tên GV] ([Chuyên môn] - [Điểm trường])
KHUYEN_NGHI: [Phân tích ngắn gọn]`;

  try {
    const aiRes = await aiChatCompletion({ prompt, max_tokens: 512 });
    if (!aiRes.success) {
      return {
        substituteTeacher: "Tự động phân công",
        recommendation: `AI đang quét lịch dạy toàn hệ thống: ${aiRes.error}`,
      };
    }

    const aiText = aiRes.text;

    const lines = aiText.split("\n");
    const teacherLine = lines.find((l: string) => l.includes("GV_DAY_THAY"));
    const recLine = lines.find((l: string) => l.includes("KHUYEN_NGHI"));

    return {
      substituteTeacher: teacherLine ? teacherLine.split(":").slice(1).join(":").trim() : "GV được AI đề xuất",
      recommendation: recLine ? recLine.split(":").slice(1).join(":").trim() : aiText,
    };
  } catch {
    return {
      substituteTeacher: "Đang phân tích AI...",
      recommendation: `AI đang quét lịch dạy toàn hệ thống để chọn GV cùng bộ môn ở bán kính gần nhất (${input.distanceKm} km từ Trung Tâm).`,
    };
  }
}

// Get school points for UI
export async function getSchoolPointsList() {
  const points = await prisma.schoolPoint.findMany({
    include: { campus: true },
    orderBy: { distanceKm: "asc" },
  });
  return points.map((p) => ({
    name: p.name,
    distance: p.distanceKm ?? 0,
    campus: p.campus.name,
  }));
}
