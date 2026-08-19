"use server";

import prisma from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";

// Get homeroom class for current teacher
export async function getHomeroomClass(userId: string) {
  const teacher = await prisma.teacher.findFirst({ where: { userId } });
  if (!teacher) return null;
  return prisma.classRoom.findFirst({
    where: { homeroomTeacherId: teacher.id },
    include: { school: true, campus: true },
  });
}

// Get daily report for a class on a specific date
export async function getDailyReport(classId: string, date: string) {
  return prisma.dailyReport.findFirst({
    where: { classId, date: new Date(date) },
  });
}

// Get all daily reports for a class (history)
export async function getDailyReportHistory(classId: string, limit = 30) {
  return prisma.dailyReport.findMany({
    where: { classId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

// Collect daily data for report generation
export async function collectDailyData(classId: string, date: string) {
  const dateObj = new Date(date);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  // Attendance data
  const attendances = await prisma.attendance.findMany({
    where: {
      classId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: true } } },
  });

  const absent = attendances.filter(
    (a) => a.status === "ABSENT_EXCUSED" || a.status === "ABSENT_UNEXCUSED"
  );
  const late = attendances.filter((a) => a.status === "LATE");

  // Incidents
  const incidents = await prisma.incident.findMany({
    where: {
      classId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: true } } },
  });

  // Parent feedbacks
  const feedbacks = await prisma.parentFeedback.findMany({
    where: {
      student: { classId },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { student: { include: { user: true } } },
  });

  // Total students
  const totalStudents = await prisma.student.count({
    where: { classId, status: "STUDYING" },
  });

  return {
    totalStudents,
    absentCount: absent.length,
    lateCount: late.length,
    absentList: absent.map((a) => ({
      name: a.student.user.name,
      status: a.status,
      note: a.note,
    })),
    lateList: late.map((a) => ({
      name: a.student.user.name,
      note: a.note,
    })),
    violations: incidents
      .filter((i) => i.type === "VIOLATION")
      .map((i) => ({
        name: i.student.user.name,
        description: i.description,
      })),
    commendations: incidents
      .filter((i) => i.type === "COMMENDATION")
      .map((i) => ({
        name: i.student.user.name,
        description: i.description,
      })),
    parentFeedbacks: feedbacks.map((f) => ({
      studentName: f.student.user.name,
      content: f.content,
      channel: f.channel,
    })),
  };
}

// Generate AI report using OpenAI-compatible API (OmniRoute)
export async function generateAIReport(classId: string, date: string) {
  const data = await collectDailyData(classId, date);
  const classInfo = await prisma.classRoom.findUnique({
    where: { id: classId },
    include: { school: true },
  });

  const prompt = `Bạn là trợ lý AI cho giáo viên chủ nhiệm. Hãy viết một báo cáo hàng ngày ngắn gọn, chuyên nghiệp bằng tiếng Việt dựa trên dữ liệu sau:

Lớp: ${classInfo?.name || "N/A"} - Trường: ${classInfo?.school.name || "N/A"}
Ngày: ${new Date(date).toLocaleDateString("vi-VN")}
Tổng sĩ số: ${data.totalStudents}
Số vắng: ${data.absentCount} (${data.absentList.map((a) => `${a.name} - ${a.status === "ABSENT_EXCUSED" ? "có phép" : "không phép"}${a.note ? ` (${a.note})` : ""}`).join("; ") || "không có"})
Số đi muộn: ${data.lateCount} (${data.lateList.map((a) => `${a.name}${a.note ? ` (${a.note})` : ""}`).join("; ") || "không có"})
Vi phạm: ${data.violations.length > 0 ? data.violations.map((v) => `${v.name}: ${v.description}`).join("; ") : "không có"}
Khen thưởng: ${data.commendations.length > 0 ? data.commendations.map((c) => `${c.name}: ${c.description}`).join("; ") : "không có"}
Phản hồi phụ huynh: ${data.parentFeedbacks.length > 0 ? data.parentFeedbacks.map((f) => `PH ${f.studentName} (${f.channel}): ${f.content}`).join("; ") : "không có"}

Yêu cầu:
- Viết theo cấu trúc: 1. Tình hình chuyên cần / 2. Nề nếp - vi phạm / 3. Phối hợp phụ huynh / 4. Đề xuất - lưu ý
- Giọng văn báo cáo hành chính, ngắn gọn
- Nếu có học sinh vắng nhiều ngày liên tục hoặc vi phạm lặp lại, hãy nhấn mạnh
- Tổng cộng không quá 300 từ`;

  try {
    const aiRes = await aiChatCompletion({ prompt, max_tokens: 1024 });
    if (!aiRes.success) {
      return {
        success: false,
        text: null,
        error: aiRes.error,
        data,
      };
    }

    return { success: true, text: aiRes.text, error: null, data };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";
    return {
      success: false,
      text: null,
      error: `Không thể kết nối AI: ${errMsg}`,
      data,
    };
  }
}

// Save daily report
export async function saveDailyReport(input: {
  classId: string;
  date: string;
  absentCount: number;
  lateCount: number;
  incidentSummary?: string;
  parentFeedbackSummary?: string;
  aiGeneratedText?: string;
  editedText?: string;
  status: "DRAFT" | "SENT";
}) {
  const dateObj = new Date(input.date);

  const existing = await prisma.dailyReport.findFirst({
    where: { classId: input.classId, date: dateObj },
  });

  if (existing) {
    return prisma.dailyReport.update({
      where: { id: existing.id },
      data: {
        absentCount: input.absentCount,
        lateCount: input.lateCount,
        incidentSummary: input.incidentSummary,
        parentFeedbackSummary: input.parentFeedbackSummary,
        aiGeneratedText: input.aiGeneratedText,
        editedText: input.editedText,
        status: input.status,
        sentAt: input.status === "SENT" ? new Date() : undefined,
      },
    });
  }

  return prisma.dailyReport.create({
    data: {
      classId: input.classId,
      date: dateObj,
      absentCount: input.absentCount,
      lateCount: input.lateCount,
      incidentSummary: input.incidentSummary,
      parentFeedbackSummary: input.parentFeedbackSummary,
      aiGeneratedText: input.aiGeneratedText,
      editedText: input.editedText,
      status: input.status,
      sentAt: input.status === "SENT" ? new Date() : undefined,
    },
  });
}

// Get all reports for admin view (all classes, specific date)
export async function getAllDailyReports(date: string, schoolId?: string) {
  const dateObj = new Date(date);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    date: { gte: startOfDay, lte: endOfDay },
  };
  if (schoolId) {
    where.classRoom = { schoolId };
  }

  return prisma.dailyReport.findMany({
    where,
    include: {
      classRoom: {
        include: {
          school: true,
          campus: true,
          homeroomTeacher: { include: { user: true } },
        },
      },
    },
    orderBy: [
      { absentCount: "desc" },
    ],
  });
}
