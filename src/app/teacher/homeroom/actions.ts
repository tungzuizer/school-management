"use server";

import { prisma } from "@/lib/prisma";
import { aiChatCompletion } from "@/lib/ai-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStudentEmail } from "@/lib/student-email";
import bcrypt from "bcryptjs";

async function isApprovedUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true },
  });
  return user?.isApproved !== false;
}

// ============ Lấy lớp chủ nhiệm của giáo viên ============
export async function getHomeroomClass(teacherIdParam?: string) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || teacherIdParam;
  if (!userId) return null;
  if (!(await isApprovedUser(userId))) return null;
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });
  if (!teacher) return null;

  let classRoom = await prisma.classRoom.findFirst({
    where: { homeroomTeacherId: teacher.id },
    include: {
      school: true,
      campus: true,
      _count: { select: { students: true } },
    },
  });

  // Auto-create Independent Homeroom Class if teacher doesn't have any class assigned yet
  if (!classRoom) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, schoolId: true } });
    if (user) {
      let schoolId = user.schoolId;
      if (!schoolId) {
        const indepSchool = await prisma.school.create({
          data: {
            name: `Lớp học / Trung tâm Tự do - ${user.name}`,
            schoolType: "THPT",
          },
        });
        schoolId = indepSchool.id;
        await prisma.user.update({ where: { id: userId }, data: { schoolId } });
      }

      classRoom = await prisma.classRoom.create({
        data: {
          name: `Lớp học Tự do 10A1`,
          gradeLevel: 10,
          schoolId,
          homeroomTeacherId: teacher.id,
        },
        include: {
          school: true,
          campus: true,
          _count: { select: { students: true } },
        },
      });

      // Quick setup 4 default groups (Tổ 1..4)
      await prisma.group.createMany({
        data: [
          { classId: classRoom.id, name: "Tổ 1" },
          { classId: classRoom.id, name: "Tổ 2" },
          { classId: classRoom.id, name: "Tổ 3" },
          { classId: classRoom.id, name: "Tổ 4" },
        ],
      });
    }
  }

  return classRoom;
}

// ============ Danh sách học sinh theo lớp ============
export async function getClassStudents(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
  return prisma.student.findMany({
    where: { classId },
    include: {
      user: { select: { name: true, email: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: [
      { isClassMonitor: "desc" },
      { bonusPoints: "desc" },
      { user: { name: "asc" } },
    ],
  });
}

// ============ Thêm Học Sinh mới vào Lớp Chủ Nhiệm ============
export async function addStudentToHomeroomClass(data: {
  classId: string;
  name: string;
  studentCode: string;
  dob?: string;
  gender?: "MALE" | "FEMALE";
  phone?: string;
  email?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");

  const name = data.name.trim();
  const studentCode = data.studentCode.trim();
  if (!name || !studentCode) {
    throw new Error("Họ tên và mã học sinh là bắt buộc");
  }

  // Tự động tạo email học sinh nếu chưa nhập
  const email = (data.email && data.email.trim()) || generateStudentEmail(name, studentCode);

  // Kiểm tra email đã tồn tại hay chưa
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(`Email ${email} đã được đăng ký trong hệ thống.`);
  }

  // Mật khẩu mặc định
  const defaultPassword = "abc123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Tạo User và Student
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      isApproved: true,
      student: {
        create: {
          studentCode,
          classId: data.classId,
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender || null,
          phone: data.phone || null,
        },
      },
    },
    include: {
      student: true,
    },
  });

  return newUser.student;
}

// ============ Phân quyền / Bổ nhiệm Lớp Trưởng ============
export async function setClassMonitor(classId: string, studentId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");

  // Reset tất cả học sinh trong lớp về isClassMonitor = false
  await prisma.student.updateMany({
    where: { classId },
    data: { isClassMonitor: false },
  });

  // Nếu chọn 1 học sinh làm lớp trưởng
  if (studentId) {
    await prisma.student.update({
      where: { id: studentId },
      data: { isClassMonitor: true },
    });
  }

  return { success: true };
}

// ============ Quản lý Tổ (Group) ============
export async function getGroups(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
  return prisma.group.create({ data: { classId, name } });
}

export async function deleteGroup(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
  // Unassign students first
  await prisma.student.updateMany({
    where: { groupId },
    data: { groupId: null },
  });
  return prisma.group.delete({ where: { id: groupId } });
}

export async function assignStudentToGroup(studentId: string, groupId: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
  return prisma.student.update({
    where: { id: studentId },
    data: { groupId },
  });
}

// ============ Sơ đồ chỗ ngồi ============
export async function getSeatingChart(classId: string, month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!(await isApprovedUser(session.user.id))) return null;
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
  return prisma.seatingChart.upsert({
    where: { classId_month_year: { classId, month, year } },
    update: { layoutJson, version: { increment: 1 } },
    create: { classId, month, year, layoutJson },
  });
}

export async function copySeatingChart(/* mutation_guard */ 
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { students: [], subjects: [], grades: [] };
  if (!(await isApprovedUser(session.user.id))) return { students: [], subjects: [], grades: [] };
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
  return prisma.incident.create({
    data: {
      ...data,
      date: new Date(data.date),
    },
  });
}

// ============ Parent Feedback ============
export async function getParentFeedbacks(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");
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

export async function saveAcademicCalendar(/* mutation_guard */ data: {
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

  try {
    const aiRes = await aiChatCompletion({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tư vấn quản lý giáo dục và trợ lý giáo viên chủ nhiệm.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    if (!aiRes.success) {
      return { success: false, error: aiRes.error };
    }

    return {
      success: true,
      reminder: aiRes.text,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("AI Fetch Error:", message);
    return { success: false, error: message };
  }
}

// ============ Kế hoạch tháng & Sinh hoạt tuần ============
export async function getMonthlyPlan(classId: string, month: number, year: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!(await isApprovedUser(session.user.id))) return null;
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

export async function saveMonthlyPlan(/* mutation_guard */ data: {
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

export async function saveWeeklyActivity(/* mutation_guard */ data: {
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

// ============ Phân quyền chức danh học sinh (Lớp trưởng / Lớp phó / Tổ trưởng) ============
export async function setStudentClassRole(studentId: string, role: string | null) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");

  const isMonitor = role === "LOP_TRUONG";

  return prisma.student.update({
    where: { id: studentId },
    data: {
      classRole: role,
      isClassMonitor: isMonitor,
    },
  });
}

// ============ Khởi tạo nhanh 4 Tổ (Tổ 1, Tổ 2, Tổ 3, Tổ 4) ============
export async function quickSetupFourGroups(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");

  const groupNames = ["Tổ 1", "Tổ 2", "Tổ 3", "Tổ 4"];
  const existingGroups = await prisma.group.findMany({
    where: { classId },
    select: { name: true },
  });

  const existingNames = new Set(existingGroups.map((g) => g.name));

  const newGroupsToCreate = groupNames
    .filter((name) => !existingNames.has(name))
    .map((name) => ({ classId, name }));

  if (newGroupsToCreate.length > 0) {
    await prisma.group.createMany({ data: newGroupsToCreate });
  }

  return { success: true };
}

// ============ Đánh giá Tích cực & Cộng điểm Thưởng ============
export async function recordParticipationBonus(data: {
  studentId: string;
  classId: string;
  title: string;
  category?: string;
  points: number;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (!(await isApprovedUser(session.user.id))) throw new Error("Tài khoản chưa được phê duyệt.");

  const points = data.points > 0 ? data.points : 1;

  // 1. Tạo nhật ký hoạt động tích cực
  const record = await prisma.participationRecord.create({
    data: {
      studentId: data.studentId,
      classId: data.classId,
      title: data.title,
      category: data.category || "PHAT_BIEU",
      points: points,
      note: data.note || null,
      createdById: session.user.id,
    },
  });

  // 2. Cộng lũy kế bonusPoints cho học sinh
  await prisma.student.update({
    where: { id: data.studentId },
    data: {
      bonusPoints: { increment: points },
    },
  });

  return record;
}

// ============ Lấy lịch sử hoạt động tích cực ============
export async function getParticipationRecords(classId: string, studentId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  if (!(await isApprovedUser(session.user.id))) return [];

  const where: Record<string, unknown> = { classId };
  if (studentId) {
    where.studentId = studentId;
  }

  return prisma.participationRecord.findMany({
    where,
    include: {
      student: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
