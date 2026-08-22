"use server";

import prisma from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";

// Get daily summary stats for a specific date
export async function getDailySummaryStats(date: string) {
  const dateObj = new Date(date);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  // Total students
  const totalStudents = await prisma.student.count({
    where: { status: "STUDYING" },
  });

  // Attendance stats (distinct students per day)
  const absentExcusedList = await prisma.attendance.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay }, status: "ABSENT_EXCUSED" },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  const absentUnexcusedList = await prisma.attendance.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay }, status: "ABSENT_UNEXCUSED" },
    select: { studentId: true },
    distinct: ["studentId"],
  });
  const absentExcused = absentExcusedList.length;
  const absentUnexcused = absentUnexcusedList.length;
  const totalAbsent = absentExcused + absentUnexcused;

  // Teacher substitute assignments
  const substitutes = await prisma.substituteAssignment.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay } },
  });
  const teacherAbsences = substitutes.length;
  const approvedSubs = substitutes.filter((s) => s.status === "APPROVED" || s.status === "COMPLETED").length;

  return {
    date: dateObj.toLocaleDateString("vi-VN"),
    totalStudents,
    totalAbsent,
    absentWithReason: absentExcused,
    absentNoReason: absentUnexcused,
    teacherAbsences,
    substituteFulfilled: `${approvedSubs}/${teacherAbsences} (${teacherAbsences > 0 ? Math.round((approvedSubs / teacherAbsences) * 100) : 100}%)`,
  };
}

// Get school point stats for a specific date
export async function getSchoolPointStats(date: string) {
  const dateObj = new Date(date);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const schoolPoints = await prisma.schoolPoint.findMany({
    include: {
      campus: true,
      classRooms: {
        include: {
          students: { where: { status: "STUDYING" } },
          attendances: { where: { date: { gte: startOfDay, lte: endOfDay } } },
          incidents: { where: { date: { gte: startOfDay, lte: endOfDay } } },
        },
      },
    },
    orderBy: { distanceKm: "asc" },
  });

  // Get substitute assignments for each school point
  const substitutes = await prisma.substituteAssignment.findMany({
    where: { date: { gte: startOfDay, lte: endOfDay } },
  });

  return await Promise.all(
    schoolPoints.map(async (sp) => {
      const totalStudents = sp.classRooms.reduce((sum, c) => sum + c.students.length, 0);
      const spClassIds = sp.classRooms.map((c) => c.id);

      const absentStudentsInSp = await prisma.attendance.findMany({
        where: {
          classId: { in: spClassIds },
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] },
        },
        select: { studentId: true },
        distinct: ["studentId"],
      });

      const absent = absentStudentsInSp.length;
      const present = Math.max(0, totalStudents - absent);
      const presentRate = totalStudents > 0 ? ((present / totalStudents) * 100).toFixed(1) + "%" : "N/A";

      const incidents = sp.classRooms.reduce((sum, c) => sum + c.incidents.length, 0);

      const pointSubs = substitutes.filter((s) => s.schoolPointName === sp.name);
      const substituteNote = pointSubs.length > 0
        ? pointSubs.map((s) => `${s.substituteTeacher} day thay tiet ${s.period} mon ${s.subjectName}`).join("; ")
        : "Khong co dieu chuyen";

      return {
        name: sp.name,
        distanceKm: sp.distanceKm ?? 0,
        manager: sp.managerName || "Chua cap nhat",
        studentsCount: totalStudents,
        presentRate,
        incidents,
        weatherStatus: "Cap nhat tu thuc dia",
        substituteNote,
        note: `${sp.classRooms.length} lop hoc tai diem truong nay.`,
      };
    })
  );
}

// Generate AI briefing for a specific phase
export async function generateAIBriefing(date: string, phase: "MORNING" | "MIDDAY" | "EVENING") {
  const stats = await getDailySummaryStats(date);
  const pointStats = await getSchoolPointStats(date);

  const pointContext = pointStats.map((p) =>
    `- ${p.name} (${p.distanceKm}km): ${p.studentsCount} HS, ty le hien dien ${p.presentRate}, ${p.incidents} su co, day thay: ${p.substituteNote}`
  ).join("\n");

  const phaseLabels = {
    MORNING: "Pha 1 - Dau ca Sang (07:30): Diem danh, chuyen can, dieu chuyen day thay",
    MIDDAY: "Pha 2 - Giua ngay (11:30): Tien do bai hoc, so dau bai dien tu, su co",
    EVENING: "Pha 3 - Bao cao dieu hanh cuoi ngay Ban Giam hieu: Tong ket toan dien 4 diem truong",
  };

  const prompt = `Ban la tro ly AI tong hop bao cao dieu hanh cho Hieu truong truong pho thong co nhieu diem truong ve tinh.

NGAY BAO CAO: ${stats.date}
PHA BAO CAO: ${phaseLabels[phase]}

TONG QUAN:
- Tong hoc sinh: ${stats.totalStudents}
- Vang mat: ${stats.totalAbsent} (co phep: ${stats.absentWithReason}, chua phep: ${stats.absentNoReason})
- GV vang & dieu chuyen: ${stats.teacherAbsences} GV, hoan thanh: ${stats.substituteFulfilled}

CHI TIET TUNG DIEM TRUONG:
${pointContext}

Hay viet bao cao ${phase === "MORNING" ? "dau ca sang" : phase === "MIDDAY" ? "giua ngay" : "cuoi ngay tong ket"} theo dung phong cach hanh chinh giao duc Viet Nam.
${phase === "EVENING" ? "Bao gom: 1. Tong quan 4 diem truong, 2. An ninh & canh bao, 3. Nhiem vu trong tam ngay mai." : ""}
Viet bang tieng Viet co dau, chuyen nghiep, ngan gon. Toi da 400 tu.`;

  const aiRes = await aiChatCompletion({ prompt, max_tokens: 1500 });
  if (!aiRes.success) {
    return { success: false, text: null, error: aiRes.error };
  }
  return { success: true, text: aiRes.text, error: null };
}
