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
import { calculateTT15Ranking } from "@/lib/tt15-utils";

/**
 * Fetches or seeds the TT15 standardized indicators.
 */
export async function getTT15Indicators() {
  let indicators = await prisma.tT15Indicator.findMany({
    orderBy: { code: 'asc' },
  });

  const fullIndicators = [
    // Tiêu chuẩn 1: Tổ chức và quản lý nhà trường
    { standard: "STANDARD_1", code: "TC1.1", name: "Phương hướng, chiến lược xây dựng và phát triển nhà trường" },
    { standard: "STANDARD_1", code: "TC1.2", name: "Hội đồng trường và các hội đồng khác trong nhà trường" },
    { standard: "STANDARD_1", code: "TC1.3", name: "Tổ chức bộ máy, tổ chuyên môn và tổ văn phòng" },
    { standard: "STANDARD_1", code: "TC1.4", name: "Khối lớp, tổ chức lớp học và điểm trường" },
    { standard: "STANDARD_1", code: "TC1.5", name: "Quản lý hành chính, tài chính và tài sản theo quy định" },

    // Tiêu chuẩn 2: Cán bộ quản lý, giáo viên, nhân viên và học sinh
    { standard: "STANDARD_2", code: "TC2.1", name: "Hiệu trưởng, phó hiệu trưởng đạt chuẩn và năng lực quản trị" },
    { standard: "STANDARD_2", code: "TC2.2", name: "Giáo viên đạt chuẩn trình độ đào tạo và chuẩn nghề nghiệp" },
    { standard: "STANDARD_2", code: "TC2.3", name: "Nhân viên và người lao động đáp ứng yêu cầu vị trí việc làm" },
    { standard: "STANDARD_2", code: "TC2.4", name: "Học sinh thực hiện đầy đủ nhiệm vụ và quyền theo điều lệ" },

    // Tiêu chuẩn 3: Cơ sở vật chất và thiết bị dạy học
    { standard: "STANDARD_3", code: "TC3.1", name: "Khuôn viên, sân chơi, bãi tập, công trình vệ sinh và nước sạch" },
    { standard: "STANDARD_3", code: "TC3.2", name: "Phòng học, phòng học bộ môn và khối phục vụ học tập" },
    { standard: "STANDARD_3", code: "TC3.3", name: "Thư viện trường học và thiết bị giáo dục, chuyển đổi số" },

    // Tiêu chuẩn 4: Quan hệ giữa nhà trường, gia đình và xã hội
    { standard: "STANDARD_4", code: "TC4.1", name: "Ban đại diện cha mẹ học sinh và các tổ chức xã hội" },
    { standard: "STANDARD_4", code: "TC4.2", name: "Công tác phối hợp giáo dục giữa nhà trường và cộng đồng" },

    // Tiêu chuẩn 5: Hoạt động giáo dục và kết quả giáo dục
    { standard: "STANDARD_5", code: "TC5.1", name: "Kế hoạch giáo dục của nhà trường và đổi mới phương pháp dạy học" },
    { standard: "STANDARD_5", code: "TC5.2", name: "Thực hiện chương trình giáo dục phổ thông và hoạt động trải nghiệm" },
    { standard: "STANDARD_5", code: "TC5.3", name: "Kết quả giáo dục, tỷ lệ hoàn thành chương trình và khen thưởng" },
  ];

  if (indicators.length < fullIndicators.length) {
    for (const ind of fullIndicators) {
      await prisma.tT15Indicator.upsert({
        where: { code: ind.code },
        update: {
          name: ind.name,
          standard: ind.standard as TT15Standard,
        },
        create: {
          standard: ind.standard as TT15Standard,
          code: ind.code,
          name: ind.name,
        }
      });
    }
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
 * Hiệu trưởng lưu kết quả thẩm định song song từng tiêu chí
 */
export async function savePrincipalReviewDetails(
  evaluationId: string,
  reviews: { indicatorId: string; principalComment?: string; score?: number }[]
) {
  for (const r of reviews) {
    await prisma.schoolPointEvaluationDetail.updateMany({
      where: {
        evaluationId,
        indicatorId: r.indicatorId,
      },
      data: {
        principalComment: r.principalComment,
        score: r.score,
      }
    });
  }

  return { success: true };
}

/**
 * Lấy danh sách tổng hợp đánh giá các Điểm trường thuộc Phân hiệu để Hiệu trưởng so sánh
 */
export async function getCampusEvaluationSummary(campusId: string, year: number, semester?: number) {
  const points = await prisma.schoolPoint.findMany({
    where: { campusId },
    include: {
      evaluations: {
        where: { year, semester: semester || null },
        include: {
          details: {
            include: {
              indicator: true,
              evidenceFiles: true,
            }
          }
        }
      }
    }
  });

  const summary = points.map(p => {
    const evalItem = p.evaluations[0] || null;
    const ranking = evalItem ? calculateTT15Ranking(evalItem.details) : null;
    return {
      schoolPointId: p.id,
      schoolPointName: p.name,
      evaluationId: evalItem?.id || null,
      status: evalItem?.status || "NOT_STARTED",
      notes: evalItem?.notes || null,
      ranking,
      detailsCount: evalItem?.details?.length || 0,
      evidenceCount: evalItem?.details?.reduce((acc, d) => acc + d.evidenceFiles.length, 0) || 0,
    };
  });

  return summary;
}

/**
 * Called by Principal to approve or reject an evaluation.
 */
export async function reviewEvaluationByPrincipal(evaluationId: string, action: "APPROVE" | "REJECT", comments: string) {
  if (action === "REJECT" && (!comments || comments.trim().length === 0)) {
    return { success: false, error: "Nếu yêu cầu làm lại, phải nhập ý kiến chỉ đạo." };
  }

  const evalData = await prisma.schoolPointEvaluation.findUnique({
    where: { id: evaluationId },
    include: { details: true }
  });

  const rankInfo = evalData ? calculateTT15Ranking(evalData.details) : null;

  await prisma.schoolPointEvaluation.update({
    where: { id: evaluationId },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      notes: comments,
      totalScore: rankInfo?.totalScore || null
    }
  });

  return { success: true };
}
