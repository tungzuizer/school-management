import { prisma } from "@/lib/prisma";
import {
  InterventionStatus,
  TriggerSource,
  TrendLabel,
  Prisma,
} from "@prisma/client";

export interface CreateInterventionInput {
  studentId: string;
  schoolId: string;
  campusId: string;
  subjectId?: string;
  triggeredBy: TriggerSource;
  trendLabelAtTrigger: TrendLabel;
  interventionType: string;
  note?: string;
}

/**
 * 1. Create a new intervention (Status: SUGGESTED)
 */
export async function createIntervention(input: CreateInterventionInput) {
  const intervention = await prisma.interventionRecord.create({
    data: {
      studentId: input.studentId,
      schoolId: input.schoolId,
      campusId: input.campusId,
      subjectId: input.subjectId || null,
      triggeredBy: input.triggeredBy,
      trendLabelAtTrigger: input.trendLabelAtTrigger,
      interventionType: input.interventionType,
      note: input.note || null,
      status: InterventionStatus.SUGGESTED,
    },
  });

  return intervention;
}

/**
 * 2. Human Approver (Principal / Head Teacher) approves the intervention (Status: APPROVED)
 */
export async function approveIntervention({
  interventionId,
  approvedById,
  approvedByName,
  note,
}: {
  interventionId: string;
  approvedById: string;
  approvedByName?: string;
  note?: string;
}) {
  const current = await prisma.interventionRecord.findUnique({
    where: { id: interventionId },
  });

  if (!current) throw new Error("Can thiệp không tồn tại.");
  if (current.status !== InterventionStatus.SUGGESTED) {
    throw new Error(`Chỉ có thể duyệt can thiệp đang ở trạng thái ĐỀ XUẤT (SUGGESTED). Trạng thái hiện tại: ${current.status}`);
  }

  const updated = await prisma.interventionRecord.update({
    where: { id: interventionId },
    data: {
      status: InterventionStatus.APPROVED,
      approvedById,
      approvedByName: approvedByName || "Ban Giám Hiệu",
      approvedAt: new Date(),
      note: note ? `${current.note || ""}\n[Phê duyệt]: ${note}` : current.note,
    },
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: approvedById,
      userName: approvedByName || "Ban Giám Hiệu",
      userRole: "ADMIN",
      schoolId: current.schoolId,
      campusId: current.campusId,
      action: "APPROVE",
      entityName: "InterventionRecord",
      entityId: interventionId,
      description: `Phê duyệt can thiệp "${current.interventionType}" cho học sinh`,
    },
  });

  return updated;
}

/**
 * Reject an intervention proposal (Status: REJECTED)
 */
export async function rejectIntervention({
  interventionId,
  rejectedById,
  rejectedByName,
  reason,
}: {
  interventionId: string;
  rejectedById: string;
  rejectedByName?: string;
  reason: string;
}) {
  const current = await prisma.interventionRecord.findUnique({
    where: { id: interventionId },
  });

  if (!current) throw new Error("Can thiệp không tồn tại.");
  if (current.status !== InterventionStatus.SUGGESTED) {
    throw new Error(`Chỉ có thể từ chối can thiệp đang ở trạng thái ĐỀ XUẤT (SUGGESTED).`);
  }

  const updated = await prisma.interventionRecord.update({
    where: { id: interventionId },
    data: {
      status: InterventionStatus.REJECTED,
      rejectionReason: reason,
      rejectedAt: new Date(),
    },
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: rejectedById,
      userName: rejectedByName || "Ban Giám Hiệu",
      userRole: "ADMIN",
      schoolId: current.schoolId,
      campusId: current.campusId,
      action: "REJECT",
      entityName: "InterventionRecord",
      entityId: interventionId,
      description: `Từ chối can thiệp: ${reason}`,
    },
  });

  return updated;
}

/**
 * 3. Teacher/Specialist marks the intervention as physically APPLIED (Status: APPLIED)
 */
export async function applyIntervention({
  interventionId,
  appliedById,
  appliedByName,
  note,
}: {
  interventionId: string;
  appliedById: string;
  appliedByName?: string;
  note?: string;
}) {
  const current = await prisma.interventionRecord.findUnique({
    where: { id: interventionId },
  });

  if (!current) throw new Error("Can thiệp không tồn tại.");
  if (current.status !== InterventionStatus.APPROVED) {
    throw new Error(`Can thiệp phải được DUYỆT (APPROVED) trước khi bắt đầu triển khai (APPLIED). Trạng thái hiện tại: ${current.status}`);
  }

  const updated = await prisma.interventionRecord.update({
    where: { id: interventionId },
    data: {
      status: InterventionStatus.APPLIED,
      appliedById,
      appliedByName: appliedByName || "Giáo viên",
      appliedAt: new Date(),
      note: note ? `${current.note || ""}\n[Triển khai]: ${note}` : current.note,
    },
  });

  return updated;
}

/**
 * 4. Outcome Measurement & Tracking (Status: OUTCOME_TRACKED)
 */
export async function trackInterventionOutcome({
  interventionId,
  scoreDelta,
  outcomeNote,
  trackedById,
  trackedByName,
}: {
  interventionId: string;
  scoreDelta: number;
  outcomeNote: string;
  trackedById?: string;
  trackedByName?: string;
}) {
  const current = await prisma.interventionRecord.findUnique({
    where: { id: interventionId },
  });

  if (!current) throw new Error("Can thiệp không tồn tại.");
  if (current.status !== InterventionStatus.APPLIED) {
    throw new Error(`Chỉ có thể đánh giá kết quả cho can thiệp đang được TRIỂN KHAI (APPLIED). Trạng thái hiện tại: ${current.status}`);
  }

  const updated = await prisma.interventionRecord.update({
    where: { id: interventionId },
    data: {
      status: InterventionStatus.OUTCOME_TRACKED,
      outcomeScoreDelta: scoreDelta,
      outcomeNote,
      outcomeCheckedAt: new Date(),
    },
  });

  // Audit Log
  if (trackedById) {
    await prisma.auditLog.create({
      data: {
        userId: trackedById,
        userName: trackedByName || "Admin",
        userRole: "TEACHER",
        schoolId: current.schoolId,
        campusId: current.campusId,
        action: "UPDATE",
        entityName: "InterventionRecord",
        entityId: interventionId,
        description: `Ghi nhận kết quả can thiệp: Thay đổi điểm ${scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}đ. Nhận xét: ${outcomeNote}`,
      },
    });
  }

  return updated;
}

/**
 * List interventions for a student
 */
export async function getStudentInterventions(studentId: string) {
  return prisma.interventionRecord.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * List interventions for an entire campus/school with status filtering
 */
export async function listCampusInterventions({
  schoolId,
  campusId,
  status,
  limit = 50,
}: {
  schoolId: string;
  campusId?: string;
  status?: InterventionStatus;
  limit?: number;
}) {
  const whereClause: Prisma.InterventionRecordWhereInput = {
    schoolId,
    ...(campusId ? { campusId } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.interventionRecord.findMany({
    where: whereClause,
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          user: { select: { name: true } },
          classRoom: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
