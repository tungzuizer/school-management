"use server";

import prisma from "@/lib/prisma";


// Get all early warnings with optional filters
export async function getWarnings(filters?: {
  category?: string;
  level?: string;
  schoolPointName?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }
  if (filters?.level && filters.level !== "ALL") {
    where.level = filters.level;
  }
  if (filters?.schoolPointName && filters.schoolPointName !== "ALL") {
    where.schoolPointName = filters.schoolPointName;
  }

  const warnings = await prisma.earlyWarning.findMany({
    where,
    orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
  });

  return warnings.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    level: w.level,
    campusName: w.campusName || "",
    schoolPointName: w.schoolPointName || "",
    className: w.className || undefined,
    studentName: w.studentName || undefined,
    description: w.description,
    aiAnalysis: w.aiAnalysis || "",
    isResolved: w.isResolved,
    createdAt: w.createdAt.toISOString().split("T")[0],
  }));
}

// Resolve a warning
export async function resolveWarning(id: string) {
  try {
    await prisma.earlyWarning.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
    
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

// Get all school points for filter dropdown
export async function getSchoolPoints() {
  const points = await prisma.schoolPoint.findMany({
    orderBy: { distanceKm: "asc" },
    select: {
      id: true,
      name: true,
      distanceKm: true,
      campus: { select: { name: true } },
    },
  });

  return points.map((p) => ({
    id: p.id,
    name: p.name,
    distanceKm: p.distanceKm ?? 0,
    campusName: p.campus.name,
  }));
}

// Scan DB for risk signals (absences, violations) and generate AI warnings
export async function scanAndGenerateWarningsAI() {
  try {
    // 1. Find students with multiple absences
    const absentAttendances = await prisma.attendance.findMany({
      where: {
        status: { in: ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] },
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            classRoom: {
              include: {
                campus: { select: { name: true } },
                schoolPoint: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Group by student
    const studentAbsenceMap = new Map<string, typeof absentAttendances>();
    for (const att of absentAttendances) {
      const existing = studentAbsenceMap.get(att.studentId) || [];
      existing.push(att);
      studentAbsenceMap.set(att.studentId, existing);
    }

    // 2. Find incidents / violations
    const violations = await prisma.incident.findMany({
      where: { type: "VIOLATION" },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            classRoom: {
              include: {
                campus: { select: { name: true } },
                schoolPoint: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    let newCreatedCount = 0;

    // Create attendance/dropout warning for students with 2+ absences
    for (const [studentId, atts] of studentAbsenceMap.entries()) {
      if (atts.length >= 1) {
        const student = atts[0].student;
        const studentName = student.user.name;
        const className = student.classRoom?.name || "Lớp N/A";
        const campusName = student.classRoom?.campus?.name || "Trung Tâm";
        const schoolPointName = student.classRoom?.schoolPoint?.name || "Điểm Trung Tâm";

        const title = `Cảnh báo chuyên cần: HS ${studentName} vắng ${atts.length} buổi`;
        const existingWarning = await prisma.earlyWarning.findFirst({
          where: { title, isResolved: false },
        });

        if (!existingWarning) {
          const level = atts.length >= 3 ? "CRITICAL" : atts.length >= 2 ? "HIGH" : "MEDIUM";
          const category = atts.length >= 3 ? "DROPOUT_RISK" : "ATTENDANCE";

          await prisma.earlyWarning.create({
            data: {
              title,
              category,
              level,
              campusName,
              schoolPointName,
              className,
              studentName,
              description: `Học sinh ${studentName} (${className} - ${schoolPointName}) vắng ${atts.length} lượt gần đây. Lý do/Ghi chú: ${atts.map((a) => a.note || a.status).join("; ")}`,
              aiAnalysis: `AI Rada phân tích: Học sinh vắng mặt ${atts.length} lần tại điểm trường xa (${schoolPointName}). Đề nghị GVCN liên hệ gia đình và cán bộ điểm trường xác minh nguy cơ bỏ học.`,
            },
          });
          newCreatedCount++;
        }
      }
    }

    // Create safety/behavior warning for violations
    for (const vio of violations) {
      const studentName = vio.student.user.name;
      const className = vio.student.classRoom?.name || "Lớp N/A";
      const campusName = vio.student.classRoom?.campus?.name || "Trung Tâm";
      const schoolPointName = vio.student.classRoom?.schoolPoint?.name || "Điểm Trung Tâm";

      const title = `Vi phạm nề nếp: HS ${studentName} (${className})`;
      const existingWarning = await prisma.earlyWarning.findFirst({
        where: { title, isResolved: false },
      });

      if (!existingWarning) {
        await prisma.earlyWarning.create({
          data: {
            title,
            category: "SAFETY_INCIDENT",
            level: "HIGH",
            campusName,
            schoolPointName,
            className,
            studentName,
            description: `Ghi nhận vi phạm: ${vio.description}`,
            aiAnalysis: `AI Rada nhận diện vụ việc tại ${schoolPointName}: Cần phối hợp phụ huynh và GVCN để theo dõi sát tâm lý và hành vi của học sinh.`,
          },
        });
        newCreatedCount++;
      }
    }

    
    return { success: true, count: newCreatedCount };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}
