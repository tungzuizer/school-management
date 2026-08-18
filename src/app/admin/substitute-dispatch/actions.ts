"use server";

import prisma from "@/lib/prisma";


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
    const msg = error instanceof Error ? error.message : "Loi khong xac dinh";
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
        reason: input.reason || "Xin nghi dot xuat",
        aiRecommendation: aiResult.recommendation,
        status: "PENDING",
      },
    });

    
    return { success: true, data: assignment };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Loi khong xac dinh";
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
      ? existingToday.map((a) => `- ${a.originalTeacher} nghi, ${a.substituteTeacher} day thay tai ${a.schoolPointName} tiet ${a.period}`).join("\n")
      : "Chua co phan cong nao hom nay.";

    const prompt = `Ban la tro ly AI dieu chuyen giao vien day thay cho truong pho thong co nhieu diem truong ve tinh.

DANH SACH GIAO VIEN THUC TE TRONG HE THONG:
${teachersContext}

HE THONG DIEM TRUONG:
${schoolPointsContext}

TINH HINH PHAN CONG HOM NAY (${today.toLocaleDateString("vi-VN")}):
${existingContext}

Hay de xuat 1 phuong an dieu chuyen day thay moi dua tren tinh hinh thuc te. Phan tich:
1. Giao vien nao co the trong tiet va gan nhat (tinh theo khoang cach km)
2. Thoi gian di chuyen du kien
3. Danh gia muc do toi uu (0-100)

Tra loi bang tieng Viet, ngan gon. Format:
GIAO_VIEN_NGHI: [ten]
GIAO_VIEN_DAY_THAY: [ten]
DIEM_TRUONG: [ten diem truong]
MON_HOC: [mon]
LOP: [lop]
TIET: [so tiet]
KHUYEN_NGHI: [phan tich chi tiet]`;

    const apiKey = process.env.OPENAI_API_KEY;
    const apiBase = process.env.OPENAI_API_BASE || "http://localhost:20128/v1";
    if (!apiKey) {
      return { success: false, error: "Chua cau hinh OPENAI_API_KEY" };
    }

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `API loi: ${response.status} - ${err}` };
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content || "";

    // Parse AI response to create assignment
    const lines = aiText.split("\n");
    const getValue = (key: string) => {
      const line = lines.find((l: string) => l.includes(key));
      return line ? line.split(":").slice(1).join(":").trim() : "";
    };

    const originalTeacher = getValue("GIAO_VIEN_NGHI") || "GV duoc AI phat hien vang";
    const substituteTeacher = getValue("GIAO_VIEN_DAY_THAY") || "GV duoc AI de xuat";
    const pointName = getValue("DIEM_TRUONG") || schoolPoints[0]?.name || "";
    const subjectName = getValue("MON_HOC") || "Mon hoc";
    const className = getValue("LOP") || "Lop";
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
        reason: "AI tu dong phat hien va dieu chuyen",
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
    const msg = error instanceof Error ? error.message : "Loi khong xac dinh";
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
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE || "http://localhost:20128/v1";

  if (!apiKey) {
    return {
      substituteTeacher: "Chua xac dinh (thieu API key)",
      recommendation: `AI dang quet lich day toan he thong de chon GV cung bo mon o ban kinh gan nhat (${input.distanceKm} km tu Trung Tam). Vui long cau hinh OPENAI_API_KEY.`,
    };
  }

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

  const prompt = `Ban la tro ly AI dieu chuyen giao vien day thay. Hay de xuat giao vien day thay tot nhat:

DANH SACH GIAO VIEN THUC TE TRONG HE THONG:
${teachersContext}

THONG TIN YEU CAU:
- GV xin nghi: ${input.originalTeacher}
- Diem truong: ${input.schoolPointName} (cach Trung Tam ${input.distanceKm}km)
- Lop: ${input.className}
- Mon: ${input.subjectName}
- Ngay: ${input.date}
- Tiet: ${input.period}

HE THONG DIEM TRUONG:
${schoolPoints.map((sp) => `- ${sp.name} (${sp.distanceKm ?? 0}km)`).join("\n")}

Hay de xuat:
1. Ten GV day thay phu hop nhat (gia dinh co GV cung chuyen mon o diem truong gan nhat)
2. Khoang cach di chuyen va thoi gian du kien
3. Danh gia muc do toi uu (0-100)

Tra loi ngan gon, chi 2-3 cau. Format:
GV_DAY_THAY: [Ten GV] ([Chuyen mon] - [Diem truong])
KHUYEN_NGHI: [Phan tich ngan gon]`;

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return {
        substituteTeacher: "Dang phan tich AI...",
        recommendation: `AI dang quet lich day toan he thong de chon GV cung bo mon o ban kinh gan nhat (${input.distanceKm} km tu Trung Tam).`,
      };
    }

    const result = await response.json();
    const aiText = result.choices?.[0]?.message?.content || "";

    const lines = aiText.split("\n");
    const teacherLine = lines.find((l: string) => l.includes("GV_DAY_THAY"));
    const recLine = lines.find((l: string) => l.includes("KHUYEN_NGHI"));

    return {
      substituteTeacher: teacherLine ? teacherLine.split(":").slice(1).join(":").trim() : "GV duoc AI de xuat",
      recommendation: recLine ? recLine.split(":").slice(1).join(":").trim() : aiText,
    };
  } catch {
    return {
      substituteTeacher: "Dang phan tich AI...",
      recommendation: `AI dang quet lich day toan he thong de chon GV cung bo mon o ban kinh gan nhat (${input.distanceKm} km tu Trung Tam).`,
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
