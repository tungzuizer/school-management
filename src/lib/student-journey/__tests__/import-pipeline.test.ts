import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reviewMapping,
  commitImportBatch,
  rollbackImportBatch,
} from "../import-pipeline";
import prisma from "@/lib/prisma";

// Mock Prisma with vi.hoisted
const { mockPrismaClient } = vi.hoisted(() => {
  const mockPrismaClient: any = {
    studentImportBatch: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentImportMapping: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    studentImportStaging: {
      findMany: vi.fn(),
    },
    studentScore: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return cb(mockPrismaClient);
      }
      return cb;
    }),
  };
  return { mockPrismaClient };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrismaClient,
  default: mockPrismaClient,
}));

// Mock journey engine batch computation
vi.mock("../journey-engine", () => ({
  batchComputeJourneyForCampus: vi.fn().mockResolvedValue({ totalStudents: 1, computed: 1 }),
}));

describe("Student Import Pipeline, Human Gating & Rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Human Review Gating (commitImportBatch)", () => {
    it("BLOCKS commit when unverified FUZZY or MANUAL_REVIEW mappings exist", async () => {
      // Contains unverified FUZZY mapping (reviewedBy = null, matchConfidence = FUZZY)
      (prisma.studentImportBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        schoolId: "school-1",
        campusId: "campus-1",
        status: "MAPPED",
        mappings: [
          {
            id: "map-1",
            rawName: "Nguyen Van A",
            rawStudentCode: "HS001",
            matchConfidence: "EXACT",
            reviewedBy: "user-1",
            matchedStudentId: "std-1",
            matchedSubjectId: "sub-1",
            matchedPeriodId: "ep-1",
          },
          {
            id: "map-2",
            rawName: "Tran Van B",
            rawStudentCode: "HS002",
            matchConfidence: "FUZZY",
            reviewedBy: null, // NOT reviewed yet
            matchedStudentId: "std-2",
            matchedSubjectId: "sub-1",
            matchedPeriodId: "ep-1",
          },
        ],
        stagings: [],
      });

      await expect(
        commitImportBatch({ batchId: "batch-1", committedById: "user-1" })
      ).rejects.toThrow(/Không thể nạp điểm: Còn 1 bản ghi mapping ở trạng thái FUZZY/);
    });

    it("BLOCKS commit when an unmapped student (matchedStudentId = null) exists", async () => {
      (prisma.studentImportBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        schoolId: "school-1",
        campusId: "campus-1",
        status: "MAPPED",
        mappings: [
          {
            id: "map-1",
            rawName: "Le Van C",
            rawStudentCode: "HS999",
            matchConfidence: "MANUAL_REVIEW",
            reviewedBy: "user-1",
            matchedStudentId: null, // missing student
            matchedSubjectId: "sub-1",
            matchedPeriodId: "ep-1",
          },
        ],
        stagings: [],
      });

      await expect(
        commitImportBatch({ batchId: "batch-1", committedById: "user-1" })
      ).rejects.toThrow(/Không thể nạp điểm: Còn 1 bản ghi mapping/);
    });

    it("ALLOWS commit when all records are verified or EXACT match", async () => {
      (prisma.studentImportBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        fileName: "scores.xlsx",
        schoolId: "school-1",
        campusId: "campus-1",
        status: "MAPPED",
        mappings: [
          {
            id: "map-1",
            rawName: "Nguyen Van A",
            rawStudentCode: "HS001",
            rawClassLabel: "10A1",
            rawSubject: "Toán",
            matchConfidence: "EXACT",
            reviewedBy: "user-1",
            matchedStudentId: "std-1",
            matchedSubjectId: "sub-1",
            matchedPeriodId: "ep-1",
          },
          {
            id: "map-2",
            rawName: "Tran Van B",
            rawStudentCode: "HS002",
            rawClassLabel: "10A1",
            rawSubject: "Toán",
            matchConfidence: "FUZZY",
            reviewedBy: "user-1", // Verified by human
            matchedStudentId: "std-2",
            matchedSubjectId: "sub-1",
            matchedPeriodId: "ep-1",
          },
        ],
        stagings: [
          {
            id: "stg-1",
            rawName: "Nguyen Van A",
            rawStudentCode: "HS001",
            rawClassLabel: "10A1",
            rawSubject: "Toán",
            rawScore: 8.5,
            isValid: true,
          },
          {
            id: "stg-2",
            rawName: "Tran Van B",
            rawStudentCode: "HS002",
            rawClassLabel: "10A1",
            rawSubject: "Toán",
            rawScore: 7.0,
            isValid: true,
          },
        ],
      });

      (mockPrismaClient.studentScore.upsert as any) = vi.fn().mockResolvedValue({});

      const res = await commitImportBatch({ batchId: "batch-1", committedById: "user-1" });
      expect(res.success).toBe(true);
      expect(res.committedScoresCount).toBe(2);
      expect(mockPrismaClient.studentImportBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "batch-1" },
          data: expect.objectContaining({ status: "COMMITTED" }),
        })
      );
    });
  });

  describe("Review Mapping (reviewMapping)", () => {
    it("updates mapping to verified and sets confidence to EXACT when manually confirmed", async () => {
      (prisma.studentImportMapping.findUnique as any).mockResolvedValue({
        id: "map-1",
        matchedStudentId: "std-old",
        matchedSubjectId: "sub-1",
        matchedPeriodId: "ep-1",
      });

      (prisma.studentImportMapping.update as any).mockResolvedValue({
        id: "map-1",
        matchedStudentId: "std-new",
        matchConfidence: "EXACT",
        reviewedBy: "user-1",
      });

      const res = await reviewMapping({
        mappingId: "map-1",
        studentId: "std-new",
        reviewedById: "user-1",
      });

      expect(res.matchConfidence).toBe("EXACT");
      expect(prisma.studentImportMapping.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "map-1" },
          data: expect.objectContaining({
            matchedStudentId: "std-new",
            matchConfidence: "EXACT",
            reviewedBy: "user-1",
          }),
        })
      );
    });
  });

  describe("Atomic Rollback (rollbackImportBatch)", () => {
    it("deletes student scores by importBatchId and updates batch status to ROLLED_BACK", async () => {
      (prisma.studentImportBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        schoolId: "school-1",
        campusId: "campus-1",
        status: "COMMITTED",
      });

      (mockPrismaClient.studentScore.deleteMany as any).mockResolvedValue({ count: 45 });

      const res = await rollbackImportBatch({
        batchId: "batch-1",
        userId: "admin-1",
        reason: "Import nhầm file điểm của năm ngoái",
      });

      expect(res.success).toBe(true);
      expect(res.deletedScoresCount).toBe(45);
      expect(mockPrismaClient.studentScore.deleteMany).toHaveBeenCalledWith({
        where: { importBatchId: "batch-1" },
      });
      expect(mockPrismaClient.studentImportBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "batch-1" },
          data: expect.objectContaining({ status: "ROLLED_BACK" }),
        })
      );
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });

    it("throws error when trying to rollback a batch that is not COMMITTED", async () => {
      (prisma.studentImportBatch.findUnique as any).mockResolvedValue({
        id: "batch-1",
        schoolId: "school-1",
        status: "STAGED",
      });

      await expect(
        rollbackImportBatch({
          batchId: "batch-1",
          userId: "admin-1",
          reason: "Rollback test",
        })
      ).rejects.toThrow(/Chỉ có thể thu hồi \(Rollback\) các đợt import đã được nạp điểm \(COMMITTED\)/);
    });
  });
});
