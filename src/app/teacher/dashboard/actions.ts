"use server";

import prisma from "@/lib/prisma";

// ============ Get teacher info + homeroom class ============
export async function getTeacherDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true, name: true, school: { select: { name: true } } },
  });

  const teacher = await prisma.teacher.findFirst({ where: { userId } });
  if (!teacher) return null;

  if (user && user.isApproved === false) {
    return {
      isApproved: false,
      teacherId: teacher.id,
      schoolName: user.school?.name || null,
      homeroomClass: null,
    };
  }

  // Get homeroom class
  const homeroomClass = await prisma.classRoom.findFirst({
    where: { homeroomTeacherId: teacher.id },
    include: {
      school: true,
      campus: true,
      _count: { select: { students: true } },
    },
  });

  return {
    isApproved: true,
    teacherId: teacher.id,
    teacherName: user?.name || "Giáo viên",
    schoolName: user?.school?.name || homeroomClass?.school?.name || null,
    homeroomClass: homeroomClass
      ? {
          id: homeroomClass.id,
          name: homeroomClass.name,
          gradeLevel: homeroomClass.gradeLevel,
          schoolName: homeroomClass.school.name,
          campusName: homeroomClass.campus?.name || null,
          totalStudents: homeroomClass._count.students,
        }
      : null,
  };
}

// ============ Today's attendance stats for homeroom class ============
export async function getTodayAttendance(classId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalStudents, records] = await Promise.all([
    prisma.student.count({
      where: { classId, status: "STUDYING" },
    }),
    prisma.attendance.findMany({
      where: {
        classId,
        date: { gte: today, lt: tomorrow },
      },
      select: {
        studentId: true,
        status: true,
        note: true,
        student: { select: { user: { select: { name: true } } } },
      },
    }),
  ]);

  // Deduplicate by student (take worst status if multiple periods)
  const studentMap = new Map<string, { name: string; status: string; note: string | null }>();
  for (const r of records) {
    const existing = studentMap.get(r.studentId);
    const priority: Record<string, number> = {
      ABSENT_UNEXCUSED: 4,
      ABSENT_EXCUSED: 3,
      LATE: 2,
      PRESENT: 1,
    };
    if (
      !existing ||
      (priority[r.status] || 0) > (priority[existing.status] || 0)
    ) {
      studentMap.set(r.studentId, {
        name: r.student.user.name,
        status: r.status,
        note: r.note,
      });
    }
  }

  const absentList: { name: string; status: string; note: string | null }[] = [];
  const lateList: { name: string; note: string | null }[] = [];
  let presentCount = 0;

  for (const [, v] of studentMap) {
    if (v.status === "ABSENT_EXCUSED" || v.status === "ABSENT_UNEXCUSED") {
      absentList.push(v);
    } else if (v.status === "LATE") {
      lateList.push(v);
    } else {
      presentCount++;
    }
  }

  // Students with no records at all are "not yet marked"
  const markedStudentIds = new Set(records.map((r) => r.studentId));

  return {
    totalStudents,
    presentCount,
    absentCount: absentList.length,
    lateCount: lateList.length,
    unmarkedCount: totalStudents - markedStudentIds.size,
    absentList,
    lateList,
    attendanceRate:
      totalStudents > 0
        ? Math.round(((totalStudents - absentList.length) / totalStudents) * 100)
        : 0,
  };
}

// ============ Today's schedule for teacher ============
export async function getTodaySchedule(teacherId: string) {
  const today = new Date();
  // dayOfWeek: 1=Monday ... 7=Sunday (match JS: 0=Sun, 1=Mon...)
  const jsDow = today.getDay(); // 0=Sun
  const dbDow = jsDow === 0 ? 7 : jsDow; // convert to 1=Mon...7=Sun

  const schedules = await prisma.schedule.findMany({
    where: { teacherId, dayOfWeek: dbDow },
    include: {
      classRoom: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: { period: "asc" },
  });

  // Determine current period based on time
  const hour = today.getHours();
  const minute = today.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Standard Vietnamese school period times
  const periodTimes: Record<number, { start: number; end: number; label: string }> = {
    1: { start: 420, end: 465, label: "07:00" },   // 7:00-7:45
    2: { start: 470, end: 515, label: "07:50" },   // 7:50-8:35
    3: { start: 520, end: 565, label: "08:40" },   // 8:40-9:25
    4: { start: 580, end: 625, label: "09:40" },   // 9:40-10:25
    5: { start: 630, end: 675, label: "10:30" },   // 10:30-11:15
    6: { start: 780, end: 825, label: "13:00" },   // 13:00-13:45
    7: { start: 830, end: 875, label: "13:50" },   // 13:50-14:35
    8: { start: 880, end: 925, label: "14:40" },   // 14:40-15:25
    9: { start: 940, end: 985, label: "15:40" },   // 15:40-16:25
    10: { start: 990, end: 1035, label: "16:30" }, // 16:30-17:15
  };

  return schedules.map((s) => {
    const pt = periodTimes[s.period] || { start: 0, end: 0, label: `Tiết ${s.period}` };
    let status: "done" | "current" | "upcoming" = "upcoming";
    if (currentMinutes > pt.end) status = "done";
    else if (currentMinutes >= pt.start && currentMinutes <= pt.end) status = "current";

    return {
      period: s.period,
      time: pt.label,
      subjectName: s.subject.name,
      className: s.classRoom.name,
      room: s.room,
      status,
    };
  });
}

// ============ At-risk students (academic) ============
export async function getAtRiskAcademic(classId: string) {
  // Students with average FINAL grade < 5.0 across subjects
  const students = await prisma.student.findMany({
    where: { classId, status: "STUDYING" },
    select: {
      id: true,
      user: { select: { name: true } },
      grades: { where: { type: "FINAL" }, select: { score: true } },
    },
  });

  const atRisk: { id: string; name: string; avgScore: number; failedSubjects: number }[] = [];

  for (const s of students) {
    if (s.grades.length === 0) continue;
    const avg = s.grades.reduce((sum, g) => sum + g.score, 0) / s.grades.length;
    const failedSubjects = s.grades.filter((g) => g.score < 5).length;
    if (avg < 5 || failedSubjects >= 2) {
      atRisk.push({
        id: s.id,
        name: s.user.name,
        avgScore: Math.round(avg * 10) / 10,
        failedSubjects,
      });
    }
  }

  return atRisk.sort((a, b) => a.avgScore - b.avgScore);
}

// ============ At-risk students (violations) ============
export async function getAtRiskViolations(classId: string) {
  // Students with 3+ violations in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const incidents = await prisma.incident.findMany({
    where: {
      classId,
      type: "VIOLATION",
      date: { gte: thirtyDaysAgo },
    },
    select: {
      studentId: true,
      date: true,
      description: true,
      student: { select: { user: { select: { name: true } } } },
    },
  });

  // Count per student
  const countMap = new Map<string, { name: string; count: number; latest: string }>();
  for (const inc of incidents) {
    const existing = countMap.get(inc.studentId);
    if (existing) {
      existing.count++;
      if (new Date(inc.date) > new Date(existing.latest)) {
        existing.latest = inc.description;
      }
    } else {
      countMap.set(inc.studentId, {
        name: inc.student.user.name,
        count: 1,
        latest: inc.description,
      });
    }
  }

  return Array.from(countMap.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count);
}

// ============ Students needing counseling (EarlyWarning) ============
export async function getStudentsNeedingCounseling(classId: string) {
  // EarlyWarning uses className (string) not a relation, and level instead of riskScore
  // First get the class name to filter
  const classRoom = await prisma.classRoom.findUnique({
    where: { id: classId },
    select: { name: true },
  });
  if (!classRoom) return [];

  const levelPriority: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const warnings = await prisma.earlyWarning.findMany({
    where: {
      className: classRoom.name,
      isResolved: false,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return warnings
    .sort((a, b) => (levelPriority[b.level] || 0) - (levelPriority[a.level] || 0))
    .map((w) => ({
      id: w.id,
      studentId: w.id, // no real studentId, use warning id
      studentName: w.studentName || "Không rõ",
      type: w.category,
      riskScore: levelPriority[w.level] || 0,
      description: w.description,
    }));
}

// ============ Unread parent notifications ============
export async function getUnreadParentFeedbacks(classId: string) {
  // Recent feedbacks without response
  const feedbacks = await prisma.parentFeedback.findMany({
    where: {
      student: { classId },
      response: null,
    },
    include: {
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  return feedbacks.map((f) => ({
    id: f.id,
    studentName: f.student.user.name,
    content: f.content,
    channel: f.channel,
    date: f.date.toISOString(),
  }));
}

// ============ Today's daily report status ============
export async function getDailyReportStatus(classId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const report = await prisma.dailyReport.findFirst({
    where: {
      classId,
      date: { gte: today, lt: tomorrow },
    },
  });

  return report
    ? { exists: true, status: report.status, sentAt: report.sentAt?.toISOString() || null }
    : { exists: false, status: null, sentAt: null };
}

// ============ Class competition/thi đua quick stats ============
export async function getClassCompetitionStats(classId: string) {
  // Get this week's attendance rate + violation count
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const totalStudents = await prisma.student.count({
    where: { classId, status: "STUDYING" },
  });

  const weekAbsences = await prisma.attendance.count({
    where: {
      classId,
      date: { gte: startOfWeek },
      status: { in: ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] },
    },
  });

  const weekViolations = await prisma.incident.count({
    where: {
      classId,
      type: "VIOLATION",
      date: { gte: startOfWeek },
    },
  });

  const weekDays = Math.min(
    Math.ceil((new Date().getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)),
    5
  );
  const expectedRecords = totalStudents * Math.max(weekDays, 1);
  const weekAttendanceRate = expectedRecords > 0
    ? Math.round(((expectedRecords - weekAbsences) / expectedRecords) * 100)
    : 100;

  return {
    weekAttendanceRate,
    weekAbsences,
    weekViolations,
  };
}

// ============ Week schedule for timetable view ============
export async function getWeekSchedule(teacherId: string, weekStartDate?: string) {
  // Calculate the Monday of the requested week
  const baseDate = weekStartDate ? new Date(weekStartDate) : new Date();
  const dayOfWeek = baseDate.getDay(); // 0=Sun
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Get all schedule entries for this teacher (they repeat weekly)
  const schedules = await prisma.schedule.findMany({
    where: { teacherId },
    include: {
      classRoom: { select: { name: true } },
      subject: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });

  // Standard Vietnamese school period times
  const periodTimes: Record<number, { start: string; end: string }> = {
    1: { start: "07:00", end: "07:45" },
    2: { start: "07:50", end: "08:35" },
    3: { start: "08:40", end: "09:25" },
    4: { start: "09:40", end: "10:25" },
    5: { start: "10:30", end: "11:15" },
    6: { start: "13:00", end: "13:45" },
    7: { start: "13:50", end: "14:35" },
    8: { start: "14:40", end: "15:25" },
    9: { start: "15:40", end: "16:25" },
    10: { start: "16:30", end: "17:15" },
  };

  // Build week dates array (Mon-Sun)
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  // Transform into timetable grid data
  // Map: period -> { dayOfWeek -> slot }
  const timetable: Record<number, Record<number, {
    subjectName: string;
    className: string;
    room: string | null;
  } | null>> = {};

  // Find all periods that have at least one entry
  const allPeriods = new Set<number>();
  for (const s of schedules) {
    allPeriods.add(s.period);
  }

  // Initialize all periods
  for (const p of allPeriods) {
    timetable[p] = {};
    for (let d = 1; d <= 7; d++) {
      timetable[p][d] = null;
    }
  }

  // Fill in schedule entries
  for (const s of schedules) {
    timetable[s.period][s.dayOfWeek] = {
      subjectName: s.subject.name,
      className: s.classRoom.name,
      room: s.room,
    };
  }

  // Convert to serializable format
  const periods = Array.from(allPeriods).sort((a, b) => a - b);
  const grid = periods.map((period) => ({
    period,
    time: periodTimes[period] || { start: `T${period}`, end: "" },
    slots: Array.from({ length: 7 }, (_, i) => {
      const dayOfWeek = i + 1; // 1=Mon...7=Sun
      return timetable[period]?.[dayOfWeek] || null;
    }),
  }));

  return {
    weekStart: monday.toISOString().split("T")[0],
    weekEnd: sunday.toISOString().split("T")[0],
    weekDates,
    grid,
    totalSlots: schedules.length,
  };
}

// ============ Get teacher's courses/subjects for current term ============
export async function getTeacherCourses(teacherId: string) {
  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId },
    include: {
      subject: { select: { id: true, name: true } },
      classRoom: { select: { id: true, name: true, gradeLevel: true } },
    },
    orderBy: [{ subject: { name: "asc" } }],
  });

  // Group by subject
  const subjectMap = new Map<string, {
    subjectId: string;
    subjectName: string;
    classes: { classId: string; className: string; gradeLevel: number }[];
  }>();

  for (const a of assignments) {
    const existing = subjectMap.get(a.subjectId);
    if (existing) {
      existing.classes.push({
        classId: a.classRoom.id,
        className: a.classRoom.name,
        gradeLevel: a.classRoom.gradeLevel,
      });
    } else {
      subjectMap.set(a.subjectId, {
        subjectId: a.subjectId,
        subjectName: a.subject.name,
        classes: [{
          classId: a.classRoom.id,
          className: a.classRoom.name,
          gradeLevel: a.classRoom.gradeLevel,
        }],
      });
    }
  }

  return Array.from(subjectMap.values());
}

// ============ Incomplete records check ============
export async function getIncompleteRecords(classId: string) {
  const incomplete: { label: string; count: number; href: string }[] = [];

  // Check today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttendanceCount = await prisma.attendance.count({
    where: { classId, date: { gte: today, lt: tomorrow } },
  });
  if (todayAttendanceCount === 0) {
    incomplete.push({ label: "Chưa điểm danh hôm nay", count: 1, href: "/teacher/attendance" });
  }

  // Check daily report
  const todayReport = await prisma.dailyReport.findFirst({
    where: { classId, date: { gte: today, lt: tomorrow } },
  });
  if (!todayReport) {
    incomplete.push({ label: "Chưa có báo cáo ngày", count: 1, href: "/teacher/daily-report" });
  }

  // Check conduct records (current period)
  const totalStudents = await prisma.student.count({
    where: { classId, status: "STUDYING" },
  });
  // Determine current period
  const month = today.getMonth() + 1;
  let currentPeriod = "MID_HK1";
  if (month >= 1 && month <= 2) currentPeriod = "HK1";
  else if (month >= 3 && month <= 4) currentPeriod = "MID_HK2";
  else if (month >= 5 && month <= 6) currentPeriod = "HK2";

  const conductCount = await prisma.conductRecord.count({
    where: { student: { classId }, period: currentPeriod as "MID_HK1" | "HK1" | "MID_HK2" | "HK2" | "FULL_YEAR" },
  });
  const missingConduct = totalStudents - conductCount;
  if (missingConduct > 0) {
    incomplete.push({
      label: `Chưa đánh giá rèn luyện (${currentPeriod})`,
      count: missingConduct,
      href: "/teacher/homeroom",
    });
  }

  // Parent feedbacks without response
  const unreplied = await prisma.parentFeedback.count({
    where: { student: { classId }, response: null },
  });
  if (unreplied > 0) {
    incomplete.push({
      label: "Phản hồi PH chưa xử lý",
      count: unreplied,
      href: "/teacher/homeroom",
    });
  }

  return incomplete;
}
