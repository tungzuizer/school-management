import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createIntervention,
  approveIntervention,
  rejectIntervention,
  applyIntervention,
  trackInterventionOutcome,
} from "../interventions";
import prisma from "@/lib/prisma";

// Mock Prisma with vi.hoisted
const { mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient = {
    interventionRecord: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };
  return { mockPrismaClient };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

describe("Student Intervention 4-Step Lifecycle State Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Step 1: Creates an intervention in SUGGESTED status", async () => {
    const mockCreated = {
      id: "inv-1",
      schoolId: "school-1",
      campusId: "campus-1",
      studentId: "student-1",
      triggeredBy: "RADAR_AI_ALERT",
      trendLabelAtTrigger: "DECLINING",
      status: "SUGGESTED",
      interventionType: "ACADEMIC_TUTORING",
      note: "Kèm cặp môn Toán hình",
    };

    (prisma.interventionRecord.create as any).mockResolvedValue(mockCreated);

    const res = await createIntervention({
      schoolId: "school-1",
      campusId: "campus-1",
      studentId: "student-1",
      triggeredBy: "RADAR_AI_ALERT" as any,
      trendLabelAtTrigger: "DECLINING" as any,
      interventionType: "ACADEMIC_TUTORING",
      note: "Kèm cặp môn Toán hình",
    });

    expect(res.status).toBe("SUGGESTED");
    expect(prisma.interventionRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUGGESTED",
          interventionType: "ACADEMIC_TUTORING",
        }),
      })
    );
  });

  it("Step 2: Approves a SUGGESTED intervention -> APPROVED", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "SUGGESTED",
      schoolId: "school-1",
      campusId: "campus-1",
      interventionType: "ACADEMIC_TUTORING",
    });

    (prisma.interventionRecord.update as any).mockResolvedValue({
      id: "inv-1",
      status: "APPROVED",
      approvedById: "approver-user-1",
    });

    const res = await approveIntervention({
      interventionId: "inv-1",
      approvedById: "approver-user-1",
      note: "Đồng ý kế hoạch",
    });

    expect(res.status).toBe("APPROVED");
    expect(prisma.interventionRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: expect.objectContaining({
          status: "APPROVED",
          approvedById: "approver-user-1",
        }),
      })
    );
  });

  it("Step 2 (Alternative): Rejects a SUGGESTED intervention -> REJECTED", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "SUGGESTED",
      schoolId: "school-1",
      campusId: "campus-1",
    });

    (prisma.interventionRecord.update as any).mockResolvedValue({
      id: "inv-1",
      status: "REJECTED",
      rejectionReason: "Chưa cần thiết",
    });

    const res = await rejectIntervention({
      interventionId: "inv-1",
      rejectedById: "rejector-user-1",
      reason: "Chưa cần thiết",
    });

    expect(res.status).toBe("REJECTED");
  });

  it("Step 3: Applies an APPROVED intervention -> APPLIED", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "APPROVED",
      schoolId: "school-1",
    });

    (prisma.interventionRecord.update as any).mockResolvedValue({
      id: "inv-1",
      status: "APPLIED",
    });

    const res = await applyIntervention({
      interventionId: "inv-1",
      appliedById: "teacher-1",
      note: "Bắt đầu triển khai từ tuần 12",
    });
    expect(res.status).toBe("APPLIED");
  });

  it("Step 3 Guard: Throws error when applying a SUGGESTED intervention directly without approval", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "SUGGESTED",
      schoolId: "school-1",
    });

    await expect(
      applyIntervention({
        interventionId: "inv-1",
        appliedById: "teacher-1",
      })
    ).rejects.toThrow(/Can thiệp phải được DUYỆT \(APPROVED\)/);
  });

  it("Step 4: Tracks outcome for an APPLIED intervention -> OUTCOME_TRACKED", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "APPLIED",
      schoolId: "school-1",
      campusId: "campus-1",
    });

    (prisma.interventionRecord.update as any).mockResolvedValue({
      id: "inv-1",
      status: "OUTCOME_TRACKED",
      outcomeScoreDelta: 1.5,
      outcomeNote: "Học sinh tiến bộ vượt bậc",
    });

    const res = await trackInterventionOutcome({
      interventionId: "inv-1",
      scoreDelta: 1.5,
      outcomeNote: "Học sinh tiến bộ vượt bậc",
      trackedById: "teacher-1",
    });

    expect(res.status).toBe("OUTCOME_TRACKED");
    expect(res.outcomeScoreDelta).toBe(1.5);
  });

  it("Step 4 Guard: Throws error when tracking outcome before intervention is APPLIED", async () => {
    (prisma.interventionRecord.findUnique as any).mockResolvedValue({
      id: "inv-1",
      status: "APPROVED",
      schoolId: "school-1",
    });

    await expect(
      trackInterventionOutcome({
        interventionId: "inv-1",
        scoreDelta: 1.0,
        outcomeNote: "Test",
      })
    ).rejects.toThrow(/Chỉ có thể đánh giá kết quả cho can thiệp đang được TRIỂN KHAI \(APPLIED\)/);
  });
});
