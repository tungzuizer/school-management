'use server';

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TranscriptStatus, UnlockStatus, ConductRating, AcademicRating } from "@prisma/client";
import { revalidatePath } from "next/cache";

// 1. Lấy toàn bộ học bạ cá nhân học sinh
export async function getStudentTranscripts(studentId: string) {
  try {
    const transcripts = await prisma.academicTranscript.findMany({
      where: { studentId },
      include: {
        classRoom: {
          select: { name: true, gradeLevel: true, school: { select: { name: true } } },
        },
        subjectGrades: {
          include: {
            subject: true,
          },
          orderBy: { subjectName: "asc" },
        },
        unlockRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { schoolYear: "desc" },
    });
    return { success: true, data: transcripts };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải học bạ học sinh" };
  }
}

// 2. Lấy danh sách học bạ theo lớp & năm học
export async function getClassTranscripts(classId: string, schoolYear: string = "2025-2026") {
  try {
    const transcripts = await prisma.academicTranscript.findMany({
      where: { classId, schoolYear },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        subjectGrades: true,
        unlockRequests: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { student: { user: { name: "asc" } } },
    });
    return { success: true, data: transcripts };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tải học bạ lớp" };
  }
}

// 3. Khởi tạo / Đồng bộ Học bạ từ Điểm số hệ thống cho cả lớp
export async function generateOrSyncClassTranscripts(classId: string, schoolYear: string = "2025-2026") {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Chưa đăng nhập");

    const classRoom = await prisma.classRoom.findUnique({
      where: { id: classId },
      include: { students: { include: { user: true } } },
    });

    if (!classRoom) throw new Error("Không tìm thấy lớp học");

    const subjects = await prisma.subject.findMany();

    for (const student of classRoom.students) {
      let transcript = await prisma.academicTranscript.findUnique({
        where: {
          studentId_schoolYear: {
            studentId: student.id,
            schoolYear,
          },
        },
        include: { subjectGrades: true },
      });

      if (transcript && transcript.status === "APPROVED_LOCKED") {
        continue;
      }

      const grades = await prisma.grade.findMany({
        where: { studentId: student.id },
        include: { subject: true },
      });

      const conductRecords = await prisma.conductRecord.findMany({
        where: { studentId: student.id },
      });

      const term1Conduct = conductRecords.find(r => r.period === "HK1")?.conductRating || null;
      const term2Conduct = conductRecords.find(r => r.period === "HK2")?.conductRating || null;
      const fullYearConduct = conductRecords.find(r => r.period === "FULL_YEAR")?.conductRating || term2Conduct || term1Conduct;

      const term1Academic = conductRecords.find(r => r.period === "HK1")?.academicRating || null;
      const term2Academic = conductRecords.find(r => r.period === "HK2")?.academicRating || null;
      const fullYearAcademic = conductRecords.find(r => r.period === "FULL_YEAR")?.academicRating || term2Academic || term1Academic;

      if (!transcript) {
        transcript = await prisma.academicTranscript.create({
          data: {
            studentId: student.id,
            classId: classRoom.id,
            schoolYear,
            gradeLevel: classRoom.gradeLevel,
            status: "DRAFT",
            term1Conduct,
            term2Conduct,
            fullYearConduct,
            term1Academic,
            term2Academic,
            fullYearAcademic,
            promotionStatus: "Lên lớp",
          },
          include: { subjectGrades: true },
        });
      }

      for (const subject of subjects) {
        const studentSubjectGrades = grades.filter(g => g.subjectId === subject.id);

        const term1Grades = studentSubjectGrades.filter(g => g.term === 1);
        const term2Grades = studentSubjectGrades.filter(g => g.term === 2);

        const calcAvg = (gList: typeof term1Grades) => {
          if (gList.length === 0) return null;
          const sum = gList.reduce((acc, g) => acc + g.score, 0);
          return Math.round((sum / gList.length) * 10) / 10;
        };

        const term1Avg = calcAvg(term1Grades);
        const term2Avg = calcAvg(term2Grades);

        let fullYearAvg: number | null = null;
        if (term1Avg !== null && term2Avg !== null) {
          fullYearAvg = Math.round(((term1Avg + term2Avg * 2) / 3) * 10) / 10;
        } else if (term2Avg !== null) {
          fullYearAvg = term2Avg;
        } else if (term1Avg !== null) {
          fullYearAvg = term1Avg;
        }

        await prisma.transcriptSubjectGrade.upsert({
          where: {
            transcriptId_subjectId: {
              transcriptId: transcript.id,
              subjectId: subject.id,
            },
          },
          update: {
            term1AvgScore: term1Avg,
            term2AvgScore: term2Avg,
            fullYearAvgScore: fullYearAvg,
          },
          create: {
            transcriptId: transcript.id,
            subjectId: subject.id,
            subjectName: subject.name,
            term1AvgScore: term1Avg,
            term2AvgScore: term2Avg,
            fullYearAvgScore: fullYearAvg,
          },
        });
      }

      const allSubGrades = await prisma.transcriptSubjectGrade.findMany({
        where: { transcriptId: transcript.id },
      });

      const calcGPA = (field: "term1AvgScore" | "term2AvgScore" | "fullYearAvgScore") => {
        const valid = allSubGrades.map(s => s[field]).filter((v): v is number => v !== null && v !== undefined);
        if (valid.length === 0) return null;
        const sum = valid.reduce((acc, val) => acc + val, 0);
        return Math.round((sum / valid.length) * 10) / 10;
      };

      await prisma.academicTranscript.update({
        where: { id: transcript.id },
        data: {
          term1GPA: calcGPA("term1AvgScore"),
          term2GPA: calcGPA("term2AvgScore"),
          fullYearGPA: calcGPA("fullYearAvgScore"),
        },
      });
    }

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    return { success: true, message: "Đồng bộ học bạ thành công" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi đồng bộ học bạ" };
  }
}

// 4. Cập nhật thông tin học bạ bởi GVCN
export async function updateHomeroomTeacherTranscript(
  transcriptId: string,
  payload: {
    term1Conduct?: ConductRating | null;
    term2Conduct?: ConductRating | null;
    fullYearConduct?: ConductRating | null;
    term1Academic?: AcademicRating | null;
    term2Academic?: AcademicRating | null;
    fullYearAcademic?: AcademicRating | null;
    homeroomTeacherComment?: string;
    promotionStatus?: string;
    rewardsAwarded?: string;
    subjectGrades?: { subjectId: string; term1AvgScore?: number | null; term2AvgScore?: number | null; fullYearAvgScore?: number | null; evaluationComment?: string }[];
  }
) {
  try {
    const transcript = await prisma.academicTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) throw new Error("Không tìm thấy bản ghi học bạ");
    if (transcript.status === "APPROVED_LOCKED") {
      throw new Error("Học bạ đã được BGH phê duyệt và khóa sổ. Vui lòng gửi Yêu cầu mở khóa nếu cần sửa.");
    }

    await prisma.academicTranscript.update({
      where: { id: transcriptId },
      data: {
        term1Conduct: payload.term1Conduct,
        term2Conduct: payload.term2Conduct,
        fullYearConduct: payload.fullYearConduct,
        term1Academic: payload.term1Academic,
        term2Academic: payload.term2Academic,
        fullYearAcademic: payload.fullYearAcademic,
        homeroomTeacherComment: payload.homeroomTeacherComment,
        promotionStatus: payload.promotionStatus,
        rewardsAwarded: payload.rewardsAwarded,
      },
    });

    if (payload.subjectGrades && payload.subjectGrades.length > 0) {
      for (const sg of payload.subjectGrades) {
        await prisma.transcriptSubjectGrade.updateMany({
          where: { transcriptId, subjectId: sg.subjectId },
          data: {
            term1AvgScore: sg.term1AvgScore,
            term2AvgScore: sg.term2AvgScore,
            fullYearAvgScore: sg.fullYearAvgScore,
            evaluationComment: sg.evaluationComment,
          },
        });
      }
    }

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    revalidatePath("/student/transcript");
    return { success: true, message: "Cập nhật học bạ thành công" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật học bạ" };
  }
}

// 5. Gửi duyệt Học bạ cả lớp (GVCN -> BGH)
export async function submitClassTranscripts(classId: string, schoolYear: string = "2025-2026") {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Chưa đăng nhập");

    await prisma.academicTranscript.updateMany({
      where: {
        classId,
        schoolYear,
        status: "DRAFT",
      },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedById: session.user.id,
      },
    });

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    return { success: true, message: "Đã gửi học bạ trình BGH phê duyệt thành công" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi nộp học bạ" };
  }
}

// 6. BGH Phê duyệt & Khóa sổ Học bạ
export async function approveAndLockTranscripts(transcriptIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Chưa đăng nhập");

    await prisma.academicTranscript.updateMany({
      where: {
        id: { in: transcriptIds },
      },
      data: {
        status: "APPROVED_LOCKED",
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
    });

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    revalidatePath("/student/transcript");
    return { success: true, message: "Đã phê duyệt và khóa sổ học bạ thành công" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi phê duyệt học bạ" };
  }
}

// 7. GVCN Gửi yêu cầu xin Mở khóa Học bạ
export async function requestTranscriptUnlock(transcriptId: string, reason: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Chưa đăng nhập");

    const transcript = await prisma.academicTranscript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) throw new Error("Không tìm thấy học bạ");

    await prisma.transcriptUnlockRequest.create({
      data: {
        transcriptId,
        requestedById: session.user.id,
        reason,
        status: "PENDING",
      },
    });

    await prisma.academicTranscript.update({
      where: { id: transcriptId },
      data: { status: "UNLOCK_REQUESTED" },
    });

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    return { success: true, message: "Đã gửi Yêu cầu mở khóa học bạ lên BGH" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi gửi yêu cầu mở khóa" };
  }
}

// 8. Lấy danh sách Yêu cầu mở khóa chờ duyệt (Cho Admin/Hiệu trưởng)
export async function getPendingUnlockRequests() {
  try {
    const requests = await prisma.transcriptUnlockRequest.findMany({
      where: { status: "PENDING" },
      include: {
        transcript: {
          include: {
            student: { include: { user: true } },
            classRoom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: requests };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy danh sách yêu cầu mở khóa" };
  }
}

// 9. BGH Phê duyệt / Từ chối Yêu cầu mở khóa
export async function reviewUnlockRequest(requestId: string, approve: boolean, reviewNote?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Chưa đăng nhập");

    const req = await prisma.transcriptUnlockRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) throw new Error("Không tìm thấy yêu cầu");

    await prisma.transcriptUnlockRequest.update({
      where: { id: requestId },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    await prisma.academicTranscript.update({
      where: { id: req.transcriptId },
      data: {
        status: approve ? "DRAFT" : "APPROVED_LOCKED",
      },
    });

    revalidatePath("/teacher/transcript");
    revalidatePath("/admin/transcripts");
    return {
      success: true,
      message: approve ? "Đã duyệt mở khóa học bạ (GVCN có thể chỉnh sửa lại)" : "Đã từ chối mở khóa học bạ",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi duyệt yêu cầu mở khóa" };
  }
}
