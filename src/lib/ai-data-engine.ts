import prisma from "@/lib/prisma";

/**
 * Dynamic Database Context Engine
 * Synthesizes real-time metrics, attendance, classes, teachers, students,
 * substitute assignments, early warnings, and commendations for the AI.
 */
export async function getComprehensiveAIContext(query: string): Promise<string> {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalStudents,
      totalClasses,
      totalTeachers,
      schoolPoints,
      presentRecords,
      absentExcusedRecords,
      absentUnexcusedRecords,
      lateRecords,
      substitutes,
      warnings,
      recentCommendations,
    ] = await Promise.all([
      prisma.student.count({ where: { status: "STUDYING" } }),
      prisma.classRoom.count(),
      prisma.teacher.count(),
      prisma.schoolPoint.findMany({
        include: { campus: true },
        orderBy: { distanceKm: "asc" },
      }),
      prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "PRESENT" },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "ABSENT_EXCUSED" },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "ABSENT_UNEXCUSED" },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "LATE" },
        select: { studentId: true },
        distinct: ["studentId"],
      }),
      prisma.substituteAssignment.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        take: 10,
      }),
      prisma.earlyWarning.findMany({
        where: { isResolved: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.incident.findMany({
        where: { type: "COMMENDATION" },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    const presentCount = presentRecords.length;
    const absentExcusedCount = absentExcusedRecords.length;
    const absentUnexcusedCount = absentUnexcusedRecords.length;
    const totalAbsent = absentExcusedCount + absentUnexcusedCount;
    const lateCount = lateRecords.length;

    let entityContext = "";
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("lớp") || lowerQuery.includes("sĩ số")) {
      const classesInfo = await prisma.classRoom.findMany({
        include: {
          homeroomTeacher: { include: { user: { select: { name: true } } } },
          _count: { select: { students: true } },
        },
        take: 10,
      });
      entityContext += "\n--- CHI TIẾT CÁC LỚP HỌC ---\n" +
        classesInfo.map((c) => `- Lớp ${c.name}: Sĩ số ${c._count.students} học sinh, GVCN: ${c.homeroomTeacher?.user?.name || "Chưa phân công"}`).join("\n");
    }

    if (lowerQuery.includes("học sinh") || lowerQuery.includes("em ") || lowerQuery.includes("khen")) {
      const topStudents = await prisma.student.findMany({
        take: 10,
        include: {
          user: { select: { name: true } },
          classRoom: { select: { name: true } },
        },
      });
      entityContext += "\n--- DANH SÁCH HỌC SINH ---\n" +
        topStudents.map((s) => `- HS ${s.user.name} (${s.classRoom?.name || "Chưa phân lớp"})`).join("\n");
    }

    if (lowerQuery.includes("giáo viên") || lowerQuery.includes("thầy") || lowerQuery.includes("cô")) {
      const teachersInfo = await prisma.teacher.findMany({
        take: 10,
        include: {
          user: { select: { name: true } },
        },
      });
      entityContext += "\n--- CÁN BỘ GIÁO VIÊN ---\n" +
        teachersInfo.map((t) => `- GV: ${t.user.name}`).join("\n");
    }

    const schoolPointCtx = schoolPoints
      .map((sp) => `- Điểm ${sp.name} (${sp.campus.name}): ${sp.distanceKm ?? 0}km, Quản lý: ${sp.managerName || "N/A"}`)
      .join("\n");

    const warningsCtx = warnings.length > 0
      ? warnings.map((w) => `- [Mức ${w.level}] ${w.title} (${w.category})`).join("\n")
      : "Không có cảnh báo hoạt động nào.";

    const subsCtx = substitutes.length > 0
      ? substitutes.map((s) => `- Tiết ${s.period} môn ${s.subjectName}: GV ${s.originalTeacher} nghỉ -> GV ${s.substituteTeacher} dạy thay (${s.status})`).join("\n")
      : "Hôm nay chưa có điều chuyển dạy thay.";

    const commendCtx = recentCommendations.length > 0
      ? recentCommendations.map((c) => `- HS ${c.student.user.name}: "${c.description}" (bởi ${c.reportedBy})`).join("\n")
      : "Chưa có ghi nhận tuyên dương gần đây.";

    return `=== CƠ SỞ DỮ LIỆU HỆ THỐNG TRƯỜNG HỌC REAL-TIME (${new Date().toLocaleDateString("vi-VN")}) ===
1. QUY MÔ & TỔNG QUAN:
- Tổng số Học sinh chính thức: ${totalStudents} em
- Tổng số Lớp học: ${totalClasses} lớp
- Tổng số Giáo viên: ${totalTeachers} thầy/cô
- Tổng số Điểm trường vệ tinh: ${schoolPoints.length} điểm

2. SĨ SỐ & ĐIỂM DANH HÔM NAY (${new Date().toLocaleDateString("vi-VN")}):
- Đã có mặt: ${presentCount} học sinh
- Vắng mặt: ${totalAbsent} học sinh (Có phép: ${absentExcusedCount}, Không phép: ${absentUnexcusedCount})
- Đi muộn: ${lateCount} học sinh

3. ĐIỂM TRƯỜNG & KHOẢNG CÁCH:
${schoolPointCtx}

4. ĐIỀU CHUYỂN DẠY THAY HÔM NAY:
${subsCtx}

5. CẢNH BÁO SỚM & AN NINH:
${warningsCtx}

6. TUYÊN DƯƠNG KHEN THƯỞNG GẦN ĐÂY:
${commendCtx}
${entityContext}`;
  } catch (err) {
    console.error("Error in getComprehensiveAIContext:", err);
    return "Không thể trích xuất dữ liệu thực tế hệ thống.";
  }
}
