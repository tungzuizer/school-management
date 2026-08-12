"use server";

import { prisma } from "@/lib/prisma";

// ============ Lấy lớp chủ nhiệm của giáo viên ============
export async function getHomeroomClass(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherId },
  });
  if (!teacher) return null;

  const classRoom = await prisma.classRoom.findFirst({
    where: { homeroomTeacherId: teacher.id },
    include: {
      school: true,
      campus: true,
      _count: { select: { students: true } },
    },
  });
  return classRoom;
}

// ============ Danh sách học sinh theo lớp ============
export async function getClassStudents(classId: string) {
  return prisma.student.findMany({
    where: { classId },
    include: {
      user: { select: { name: true, email: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

// ============ Quản lý Tổ (Group) ============
export async function getGroups(classId: string) {
  return prisma.group.findMany({
    where: { classId },
    include: {
      students: {
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createGroup(classId: string, name: string) {
  return prisma.group.create({ data: { classId, name } });
}

export async function deleteGroup(groupId: string) {
  // Unassign students first
  await prisma.student.updateMany({
    where: { groupId },
    data: { groupId: null },
  });
  return prisma.group.delete({ where: { id: groupId } });
}

export async function assignStudentToGroup(studentId: string, groupId: string | null) {
  return prisma.student.update({
    where: { id: studentId },
    data: { groupId },
  });
}

// ============ Sơ đồ chỗ ngồi ============
export async function getSeatingChart(classId: string, month: number, year: number) {
  return prisma.seatingChart.findUnique({
    where: { classId_month_year: { classId, month, year } },
  });
}

export async function saveSeatingChart(
  classId: string,
  month: number,
  year: number,
  layoutJson: string
) {
  return prisma.seatingChart.upsert({
    where: { classId_month_year: { classId, month, year } },
    update: { layoutJson, version: { increment: 1 } },
    create: { classId, month, year, layoutJson },
  });
}

export async function copySeatingChart(
  classId: string,
  fromMonth: number,
  fromYear: number,
  toMonth: number,
  toYear: number
) {
  const source = await prisma.seatingChart.findUnique({
    where: { classId_month_year: { classId, month: fromMonth, year: fromYear } },
  });
  if (!source) throw new Error("Không tìm thấy sơ đồ nguồn");

  return prisma.seatingChart.upsert({
    where: { classId_month_year: { classId, month: toMonth, year: toYear } },
    update: { layoutJson: source.layoutJson, version: { increment: 1 } },
    create: { classId, month: toMonth, year: toYear, layoutJson: source.layoutJson },
  });
}

// ============ Tình hình lớp - Conduct Records ============
export async function getConductRecords(classId: string, period?: string) {
  const where: Record<string, unknown> = {
    student: { classId },
  };
  if (period) {
    where.period = period;
  }

  return prisma.conductRecord.findMany({
    where,
    include: {
      student: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { student: { user: { name: "asc" } } },
  });
}

export async function saveConductRecord(data: {
  studentId: string;
  period:
    | "MONTH_9"
    | "MONTH_10"
    | "MONTH_11"
    | "MONTH_12"
    | "MONTH_1"
    | "MONTH_2"
    | "MONTH_3"
    | "MONTH_4"
    | "MONTH_5"
    | "MID_HK1"
    | "HK1"
    | "MID_HK2"
    | "HK2"
    | "FULL_YEAR";
  conductRating?: "TOT" | "KHA" | "DAT" | "CHUA_DAT" | null;
  academicRating?: "GIOI" | "KHA" | "DAT" | "CHUA_DAT" | null;
  note?: string;
}) {
  return prisma.conductRecord.upsert({
    where: {
      studentId_period: {
        studentId: data.studentId,
        period: data.period,
      },
    },
    update: {
      conductRating: data.conductRating,
      academicRating: data.academicRating,
      note: data.note,
    },
    create: {
      studentId: data.studentId,
      period: data.period,
      conductRating: data.conductRating,
      academicRating: data.academicRating,
      note: data.note,
    },
  });
}

// ============ Sĩ số theo mốc thời gian ============
export async function getClassSizeByPeriods(classId: string) {
  const periods = [
    "MONTH_9",
    "MONTH_10",
    "MONTH_11",
    "MONTH_12",
    "MONTH_1",
    "MONTH_2",
    "MONTH_3",
    "MONTH_4",
    "MONTH_5",
    "MID_HK1",
    "HK1",
    "MID_HK2",
    "HK2",
    "FULL_YEAR",
  ] as const;
  const results = [];

  for (const period of periods) {
    const total = await prisma.student.count({ where: { classId } });
    const conductCounts = await prisma.conductRecord.groupBy({
      by: ["conductRating"],
      where: { student: { classId }, period },
      _count: true,
    });
    const academicCounts = await prisma.conductRecord.groupBy({
      by: ["academicRating"],
      where: { student: { classId }, period },
      _count: true,
    });

    results.push({
      period,
      total,
      conduct: Object.fromEntries(conductCounts.map((c) => [c.conductRating, c._count])),
      academic: Object.fromEntries(academicCounts.map((c) => [c.academicRating, c._count])),
    });
  }

  return results;
}

// ============ Bảng điểm lớp ============
export async function getClassGradeBoard(classId: string, term: number) {
  // Get all students in class
  const students = await prisma.student.findMany({
    where: { classId },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  // Get all subjects for this class grade level
  const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
  if (!classRoom) return { students: [], subjects: [], grades: [] };

  const subjects = await prisma.subject.findMany({
    where: {
      OR: [{ gradeLevel: classRoom.gradeLevel }, { gradeLevel: null }],
    },
    orderBy: { name: "asc" },
  });

  // Get all grades
  const grades = await prisma.grade.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      subjectId: { in: subjects.map((s) => s.id) },
      term,
    },
  });

  return {
    students: students.map((s) => ({
      id: s.id,
      name: s.user.name,
      studentCode: s.studentCode,
    })),
    subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
    grades: grades.map((g) => ({
      studentId: g.studentId,
      subjectId: g.subjectId,
      type: g.type,
      score: g.score,
    })),
  };
}

// ============ Incidents (vi phạm / khen thưởng) ============
export async function getIncidents(classId: string, dateFrom?: string, dateTo?: string) {
  const where: Record<string, unknown> = { classId };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
  }

  return prisma.incident.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createIncident(data: {
  studentId: string;
  classId: string;
  date: string;
  type: "VIOLATION" | "COMMENDATION";
  description: string;
  reportedBy?: string;
}) {
  return prisma.incident.create({
    data: {
      ...data,
      date: new Date(data.date),
    },
  });
}

// ============ Parent Feedback ============
export async function getParentFeedbacks(classId: string) {
  return prisma.parentFeedback.findMany({
    where: { student: { classId } },
    include: {
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export async function createParentFeedback(data: {
  studentId: string;
  date: string;
  channel?: string;
  content: string;
  handledBy?: string;
  response?: string;
}) {
  return prisma.parentFeedback.create({
    data: {
      ...data,
      date: new Date(data.date),
    },
  });
}

// ============ Lịch năm học & AI Nhắc việc ============
export async function getAcademicCalendar(schoolId: string, schoolYear: string) {
  return prisma.academicCalendar.findUnique({
    where: { schoolId_schoolYear: { schoolId, schoolYear } },
  });
}

export async function saveAcademicCalendar(data: {
  schoolId: string;
  schoolYear: string;
  title: string;
  content: string;
  fileUrl?: string;
}) {
  return prisma.academicCalendar.upsert({
    where: {
      schoolId_schoolYear: {
        schoolId: data.schoolId,
        schoolYear: data.schoolYear,
      },
    },
    update: {
      title: data.title,
      content: data.content,
      fileUrl: data.fileUrl,
    },
    create: data,
  });
}

export async function getAIMonthlyReminder(params: {
  schoolId: string;
  schoolYear: string;
  month: number;
  year: number;
  className?: string;
}) {
  const calendar = await getAcademicCalendar(params.schoolId, params.schoolYear);

  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "http://localhost:20128/v1";

  const calendarContent = calendar
    ? calendar.content
    : "Chưa có kế hoạch năm học chi tiết được tải lên cho trường.";

  const prompt = `Bạn là trợ lý AI thông minh cho giáo viên chủ nhiệm.
Dưới đây là Kế hoạch/Lịch năm học (${params.schoolYear}):
---
${calendarContent}
---

Hãy tổng hợp và gợi ý các công việc trọng tâm, nhiệm vụ quan trọng mà giáo viên chủ nhiệm lớp ${
    params.className || ""
  } cần chuẩn bị và thực hiện trong **Tháng ${params.month}/${params.year}**.

Yêu cầu output:
- Viết bằng tiếng Việt, rõ ràng, khoa học.
- Chia thành các mục chính:
  1. Nhiệm vụ trọng tâm của GVCN trong tháng ${params.month}
  2. Các mốc thời gian / sự kiện quan trọng cần nhớ
  3. Nội dung cần nhắc nhở và đôn đốc học sinh / phụ huynh
  4. Lời khuyên & gợi ý nâng cao hiệu quả quản lý lớp`;

  if (!apiKey) {
    // Fallback if no API key set
    return {
      success: true,
      reminder: `[Chưa cấu hình OPENAI_API_KEY - Gợi ý tự động cho Tháng ${params.month}/${params.year}]\n\n` +
        `1. Nhiệm vụ trọng tâm:\n` +
        `- Ổn định nếp sống, sĩ số và kỷ luật lớp học.\n` +
        `- Cập nhật thông tin sổ liên lạc và rèn luyện của học sinh.\n` +
        `- Kiểm tra tình hình học tập và chuẩn bị cho các kỳ kiểm tra.\n\n` +
        `2. Sự kiện & Mốc thời gian:\n` +
        `- Sinh hoạt chủ nhiệm hàng tuần.\n` +
        `- Họp giao ban chủ nhiệm cấp trường/khối.\n\n` +
        `3. Nhắc nhở học sinh & Phụ huynh:\n` +
        `- Thực hiện nghiêm túc nội quy trường lớp.\n` +
        `- Tăng cường phối hợp giữa gia đình và nhà trường.`,
    };
  }

  try {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        messages: [
          {
            role: "system",
            content: "Bạn là chuyên gia tư vấn quản lý giáo dục và trợ lý giáo viên chủ nhiệm.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("AI API Error:", errText);
      return { success: false, error: `Lỗi AI API (${res.status}): ${errText}` };
    }

    const data = await res.json();
    const reminder = data.choices?.[0]?.message?.content || "Không nhận được phản hồi từ AI.";
    return { success: true, reminder };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI Fetch Error:", message);
    return { success: false, error: message };
  }
}

// ============ Kế hoạch tháng & Sinh hoạt tuần ============
export async function getMonthlyPlan(classId: string, month: number, year: number) {
  return prisma.monthlyPlan.findUnique({
    where: {
      classId_month_year: { classId, month, year },
    },
    include: {
      weeklyActivities: {
        orderBy: { weekNumber: "asc" },
      },
    },
  });
}

export async function saveMonthlyPlan(data: {
  classId: string;
  month: number;
  year: number;
  planContent: string;
}) {
  return prisma.monthlyPlan.upsert({
    where: {
      classId_month_year: {
        classId: data.classId,
        month: data.month,
        year: data.year,
      },
    },
    update: {
      planContent: data.planContent,
    },
    create: data,
  });
}

export async function saveWeeklyActivity(data: {
  monthlyPlanId: string;
  weekNumber: number;
  content?: string;
  notes?: string;
}) {
  return prisma.weeklyActivity.upsert({
    where: {
      monthlyPlanId_weekNumber: {
        monthlyPlanId: data.monthlyPlanId,
        weekNumber: data.weekNumber,
      },
    },
    update: {
      content: data.content,
      notes: data.notes,
    },
    create: data,
  });
}
