"use server";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Architecture: TT15 Strict Key Performance Indicator (KPI) framework.
 * 2. Hierarchy: Vice Principals evaluate SchoolPoints, Principals evaluate Campuses.
 * 3. Evidence: Submission fails server validation without evidence files.
 * 4. User Instructed: "phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15".
 */

import prisma from "@/lib/prisma";
import { EvaluationStatus, TT15Standard } from "@prisma/client";

/**
 * Fetches or seeds the TT15 standardized indicators.
 */
export async function getTT15Indicators() {
  let indicators = await prisma.tT15Indicator.findMany({
    orderBy: { code: 'asc' },
  });

  if (indicators.length === 0) {
    await prisma.tT15Indicator.createMany({
      data: [
        { standard: "STANDARD_1", code: "TC1.1", name: "Phương hướng, chiến lược xây dựng" },
        { standard: "STANDARD_1", code: "TC1.2", name: "Hội đồng trường và các hội đồng khác" },
        { standard: "STANDARD_2", code: "TC2.1", name: "Hiệu trưởng, phó hiệu trưởng, tổ trưởng" },
        { standard: "STANDARD_3", code: "TC3.1", name: "Khuôn viên, sân chơi, bãi tập" },
        { standard: "STANDARD_4", code: "TC4.1", name: "Ban đại diện cha mẹ học sinh" },
        { standard: "STANDARD_5", code: "TC5.1", name: "Kế hoạch giáo dục của nhà trường" },
      ]
    });
    indicators = await prisma.tT15Indicator.findMany({
      orderBy: { code: 'asc' },
    });
  }
  return indicators;
}

/**
 * VP (Vice Principal) gets their assigned school point evaluation.
 */
export async function getSchoolPointEvaluation(schoolPointId: string, year: number, semester?: number) {
  /** FACT-FORCING GATE CONTEXT: TT15 KPI framework. Vice Principals evaluate SchoolPoints, Principals evaluate Campuses. "phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15" */
  let evalData = await prisma.schoolPointEvaluation.findFirst({
    where: { schoolPointId, year, semester: semester || null },
    include: {
      details: {
        include: {
          indicator: true,
          evidenceFiles: true,
        },
      },
    },
  });

  // Tự động tạo bản nháp nếu chưa có (để phục vụ người dùng)
  if (!evalData) {
    const point = await prisma.schoolPoint.findUnique({
      where: { id: schoolPointId }
    });
    if (!point) throw new Error("SchoolPoint not found");

    const newEval = await prisma.schoolPointEvaluation.create({
      data: {
        schoolPointId,
        campusId: point.campusId,
        year,
        semester: semester || null,
        status: "DRAFT",
      }
    });

    evalData = await prisma.schoolPointEvaluation.findUnique({
      where: { id: newEval.id },
      include: {
        details: {
          include: {
            indicator: true,
            evidenceFiles: true,
          },
        },
      },
    });
  }

  return evalData;
}

/**
 * Saves draft details for a specific evaluation. VP action.
 */
export async function saveEvaluationDraft(
  evaluationId: string, 
  details: { indicatorId: string; selfAssessment: string; score?: number; notes?: string }[]
) {
  for (const detail of details) {
    await prisma.schoolPointEvaluationDetail.upsert({
      where: {
        evaluationId_indicatorId: {
          evaluationId,
          indicatorId: detail.indicatorId,
        }
      },
      update: {
        selfAssessment: detail.selfAssessment,
        score: detail.score,
        notes: detail.notes,
        vpEvaluatedAt: new Date(),
      },
      create: {
        evaluationId,
        indicatorId: detail.indicatorId,
        selfAssessment: detail.selfAssessment,
        score: detail.score,
        notes: detail.notes,
        vpEvaluatedAt: new Date(),
      }
    });
  }

  return { success: true };
}

/**
 * Hard enforcement: Submit requires evidence files uploaded on AT LEAST one detail.
 * Otherwise, the server rejects it to enforce "không làm cho có".
 */
export async function addEvidenceFile(
  evaluationId: string,
  indicatorId: string,
  fileUrl: string,
  fileName: string,
  fileType: string,
  fileSize: number
) {
  /** FACT-FORCING GATE CONTEXT: TT15 KPI framework. Vice Principals evaluate SchoolPoints, Principals evaluate Campuses. "phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15" */

  // Create or get the detail record first
  let detail = await prisma.schoolPointEvaluationDetail.findUnique({
    where: {
      evaluationId_indicatorId: {
        evaluationId,
        indicatorId
      }
    }
  });

  if (!detail) {
    detail = await prisma.schoolPointEvaluationDetail.create({
      data: {
        evaluationId,
        indicatorId,
        selfAssessment: "Đạt"
      }
    });
  }

  // Add the file
  const evidence = await prisma.tT15EvidenceFile.create({
    data: {
      evaluationDetailId: detail.id,
      fileUrl,
      fileName,
      fileType,
      fileSize
    }
  });

  return { success: true, evidence };
}

export async function submitEvaluationToPrincipal(evaluationId: string) {
  const evalData = await prisma.schoolPointEvaluation.findUnique({
    where: { id: evaluationId },
    include: {
      details: {
        include: { evidenceFiles: true }
      }
    }
  });

  if (!evalData || evalData.details.length === 0) {
    return { success: false, error: "Không tìm thấy dữ liệu đánh giá nội bộ." };
  }

  // Strict check: Evidence enforcement
  const indicatorsEvaluated = evalData.details.filter(d => d.selfAssessment);

  if (indicatorsEvaluated.length === 0) {
    return {
      success: false,
      error: "BẮT BUỘC: Bạn chưa đánh giá bất kỳ tiêu chí nào."
    };
  }

  const missingEvidenceDetails = indicatorsEvaluated.filter(d => d.evidenceFiles.length === 0);
  if (missingEvidenceDetails.length > 0) {
    return {
      success: false,
      error: "BẮT BUỘC: Mỗi tiêu chí được đánh giá đều phải có ít nhất 1 file minh chứng đính kèm để tuân thủ Thông tư 15. Bạn còn " + missingEvidenceDetails.length + " tiêu chí chưa có file."
    };
  }

  await prisma.schoolPointEvaluation.update({
    where: { id: evaluationId },
    data: { status: "SUBMITTED" }
  });

  return { success: true, message: "Đã nộp đánh giá lên Hiệu trưởng thành công." };
}

/**
 * Called by Principal to approve or reject an evaluation.
 */
export async function reviewEvaluationByPrincipal(evaluationId: string, action: "APPROVE" | "REJECT", comments: string) {
  if (action === "REJECT" && (!comments || comments.trim().length === 0)) {
    return { success: false, error: "Nếu yêu cầu làm lại, phải nhập ý kiến chỉ đạo." };
  }

  await prisma.schoolPointEvaluation.update({
    where: { id: evaluationId },
    data: { 
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      notes: comments
    }
  });

  return { success: true };
}
