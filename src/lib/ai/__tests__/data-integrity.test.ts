import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma } = vi.hoisted(() => {
  const mock = {
    studentScore: { findUnique: vi.fn() },
    student: { findUnique: vi.fn() },
    interventionRecord: { findUnique: vi.fn() },
    classRoom: { findUnique: vi.fn() },
    attendance: { findUnique: vi.fn() },
    earlyWarning: { findUnique: vi.fn() },
    studentJourneySnapshot: { findUnique: vi.fn() },
  };
  return { mockPrisma: mock };
});

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
  prisma: mockPrisma,
}));

import {
  extractRecordIds,
  checkIsInsufficientData,
  parseFactAndInference,
  verifyAIGrounding,
  assertAIGrounded,
  injectDataIntegrityPolicy,
  AI_DATA_INTEGRITY_SYSTEM_PROMPT,
} from "@/lib/ai/data-integrity";
import { prisma } from "@/lib/prisma";

describe("AI_DATA_INTEGRITY_POLICY & Grounding Engine Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Record ID Extraction (extractRecordIds)", () => {
    it("should extract IDs from [id=xxx] and [record_id=xxx] format", () => {
      const text = "Điểm Toán: 8.5 [id=score_101] và Hóa: 7.0 [record_id=score_102]";
      const ids = extractRecordIds(text);
      expect(ids).toContain("score_101");
      expect(ids).toContain("score_102");
    });

    it("should extract IDs from table#id=xxx format", () => {
      const text = "Dữ liệu từ student_score#id=sc_998877 và attendance#id=att_445566";
      const ids = extractRecordIds(text);
      expect(ids).toContain("sc_998877");
      expect(ids).toContain("att_445566");
    });

    it("should extract IDs from source blocks (nguồn: id1, id2)", () => {
      const text = "Học sinh vắng 3 buổi có phép (nguồn: att_0001, att_0002)";
      const ids = extractRecordIds(text);
      expect(ids).toContain("att_0001");
      expect(ids).toContain("att_0002");
    });

    it("should extract IDs from explicit record_id: 'xxx' or recordId: xxx", () => {
      const text = 'Hồ sơ can thiệp: record_id: "int_rec_999"';
      const ids = extractRecordIds(text);
      expect(ids).toContain("int_rec_999");
    });

    it("should deduplicate multiple occurrences of the same record ID", () => {
      const text = "Điểm: 9.0 [id=sc_dup_1]. Trích xuất lại từ [id=sc_dup_1].";
      const ids = extractRecordIds(text);
      expect(ids.length).toBe(1);
      expect(ids[0]).toBe("sc_dup_1");
    });
  });

  describe("2. Insufficient Data Detection (checkIsInsufficientData)", () => {
    it("should identify explicit 'không đủ dữ liệu' as INSUFFICIENT_DATA", () => {
      const text = "Không đủ dữ liệu: Học sinh này chỉ có 1 kỳ điểm, chưa đủ 3 kỳ tối thiểu để đánh giá xu hướng.";
      const res = checkIsInsufficientData(text);
      expect(res.isInsufficient).toBe(true);
      expect(res.reason).toContain("chưa đủ 3 kỳ tối thiểu");
    });

    it("should identify 'chưa có dữ liệu' as INSUFFICIENT_DATA", () => {
      const text = "Chưa có dữ liệu điểm danh tháng này.";
      const res = checkIsInsufficientData(text);
      expect(res.isInsufficient).toBe(true);
    });

    it("should identify 'INSUFFICIENT_DATA' token as insufficient", () => {
      const text = "TRẠNG THÁI: INSUFFICIENT_DATA do chưa cập nhật điểm số.";
      const res = checkIsInsufficientData(text);
      expect(res.isInsufficient).toBe(true);
    });

    it("should return isInsufficient: false for well-grounded content", () => {
      const text = "Học sinh Nguyễn Văn A đạt điểm trung bình 8.2 [id=score_1].";
      const res = checkIsInsufficientData(text);
      expect(res.isInsufficient).toBe(false);
    });
  });

  describe("3. Fact vs Inference Partitioning (parseFactAndInference)", () => {
    it("should parse [DỮ KIỆN] and [SUY LUẬN] blocks into separate lists", () => {
      const aiResponse = `
[DỮ KIỆN — có record_id]:
Điểm Toán kỳ 1: 5.2 [id=score_math_1]
Điểm Văn kỳ 1: 6.0 [id=score_lit_1]

[SUY LUẬN — cần con người xác minh]:
Xu hướng học sinh cần phụ đạo môn Toán do có dấu hiệu giảm sút.
      `.trim();

      const parsed = parseFactAndInference(aiResponse);
      expect(parsed.isInsufficientData).toBe(false);
      expect(parsed.facts.length).toBeGreaterThan(0);
      expect(parsed.inferences.length).toBeGreaterThan(0);
      expect(parsed.citedRecordIds).toContain("score_math_1");
      expect(parsed.citedRecordIds).toContain("score_lit_1");
      expect(parsed.inferences[0].hypothesis).toContain("phụ đạo môn Toán");
      expect(parsed.inferences[0].verificationRequired).toBeDefined();
    });

    it("should correctly handle unpartitioned text by extracting bullet points with record IDs", () => {
      const unpartitionedText = `
Thống kê điểm học sinh:
- Điểm kiểm tra 15p: 8.0 [id=score_t1]
- Điểm giữa kỳ: 7.5 [id=score_t2]
      `.trim();

      const parsed = parseFactAndInference(unpartitionedText);
      expect(parsed.facts.length).toBe(2);
      expect(parsed.citedRecordIds).toEqual(["score_t1", "score_t2"]);
    });
  });

  describe("4. Grounding Verification Engine (verifyAIGrounding)", () => {
    it("should mark response as GROUNDED when all cited record IDs exist in tenant DB", async () => {
      // Mock DB lookups
      (prisma.studentScore.findUnique as any).mockResolvedValueOnce({
        id: "score_valid_1",
        schoolId: "school_100",
        campusId: "campus_1",
      });

      const aiText = `[DỮ KIỆN — có record_id]: Điểm Tin học: 9.0 [id=score_valid_1]`;
      const tenantContext = { schoolId: "school_100", campusId: "campus_1" };

      const result = await verifyAIGrounding(aiText, tenantContext);

      expect(result.groundingStatus).toBe("GROUNDED");
      expect(result.hasHallucinations).toBe(false);
      expect(result.verifiedRecordIds).toEqual(["score_valid_1"]);
      expect(result.unverifiedRecordIds).toEqual([]);
      expect(result.facts[0].isValidated).toBe(true);
      expect(result.facts[0].sourceTable).toBe("StudentScore");
    });

    it("should detect hallucinated/non-existent record IDs and set UNVERIFIED_RECORDS status", async () => {
      // Mock DB returning null for fake ID
      (prisma.studentScore.findUnique as any).mockResolvedValue(null);
      (prisma.student.findUnique as any).mockResolvedValue(null);
      (prisma.interventionRecord.findUnique as any).mockResolvedValue(null);
      (prisma.classRoom.findUnique as any).mockResolvedValue(null);
      (prisma.attendance.findUnique as any).mockResolvedValue(null);
      (prisma.earlyWarning.findUnique as any).mockResolvedValue(null);
      (prisma.studentJourneySnapshot.findUnique as any).mockResolvedValue(null);

      const aiText = `[DỮ KIỆN — có record_id]: Điểm Lịch sử: 10.0 [id=score_fabricated_999]`;
      const tenantContext = { schoolId: "school_100" };

      const result = await verifyAIGrounding(aiText, tenantContext);

      expect(result.groundingStatus).toBe("UNVERIFIED_RECORDS");
      expect(result.hasHallucinations).toBe(true);
      expect(result.unverifiedRecordIds).toContain("score_fabricated_999");
      expect(result.verifiedRecordIds).toEqual([]);
      expect(result.facts[0].isValidated).toBe(false);
      expect(result.facts[0].validationError).toContain("không tồn tại");
    });

    it("should reject cross-tenant record IDs (record exists in another school)", async () => {
      // Mock DB record belonging to a different school
      (prisma.studentScore.findUnique as any).mockResolvedValueOnce({
        id: "score_other_school",
        schoolId: "school_FOREIGN",
        campusId: "campus_FOREIGN",
      });
      (prisma.student.findUnique as any).mockResolvedValue(null);
      (prisma.interventionRecord.findUnique as any).mockResolvedValue(null);
      (prisma.classRoom.findUnique as any).mockResolvedValue(null);
      (prisma.attendance.findUnique as any).mockResolvedValue(null);
      (prisma.earlyWarning.findUnique as any).mockResolvedValue(null);
      (prisma.studentJourneySnapshot.findUnique as any).mockResolvedValue(null);

      const aiText = `[DỮ KIỆN — có record_id]: Điểm Hóa: 8.5 [id=score_other_school]`;
      const tenantContext = { schoolId: "school_100" };

      const result = await verifyAIGrounding(aiText, tenantContext);

      expect(result.groundingStatus).toBe("UNVERIFIED_RECORDS");
      expect(result.hasHallucinations).toBe(true);
      expect(result.unverifiedRecordIds).toContain("score_other_school");
    });

    it("should return INSUFFICIENT_DATA status without querying DB when text indicates missing data", async () => {
      const aiText = "Không đủ dữ liệu để kết luận.";
      const tenantContext = { schoolId: "school_100" };

      const result = await verifyAIGrounding(aiText, tenantContext);

      expect(result.groundingStatus).toBe("INSUFFICIENT_DATA");
      expect(result.isInsufficientData).toBe(true);
      expect(result.hasHallucinations).toBe(false);
      expect(prisma.studentScore.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("5. Integrity Assertion (assertAIGrounded)", () => {
    it("should not throw when response has no hallucinations", () => {
      const validResponse = {
        rawText: "OK",
        isInsufficientData: false,
        facts: [],
        inferences: [],
        allCitedRecordIds: ["rec_1"],
        verifiedRecordIds: ["rec_1"],
        unverifiedRecordIds: [],
        hasHallucinations: false,
        groundingStatus: "GROUNDED" as const,
      };

      expect(() => assertAIGrounded(validResponse)).not.toThrow();
    });

    it("should throw an error when hallucinations are detected", () => {
      const hallucinatedResponse = {
        rawText: "Fabricated",
        isInsufficientData: false,
        facts: [],
        inferences: [],
        allCitedRecordIds: ["rec_fake_999"],
        verifiedRecordIds: [],
        unverifiedRecordIds: ["rec_fake_999"],
        hasHallucinations: true,
        groundingStatus: "UNVERIFIED_RECORDS" as const,
      };

      expect(() => assertAIGrounded(hallucinatedResponse)).toThrowError(/AI_DATA_INTEGRITY_VIOLATION/);
    });
  });

  describe("6. System Prompt Injection (injectDataIntegrityPolicy)", () => {
    it("should inject AI Data Integrity Policy if not already present", () => {
      const prompt = "Hãy tư vấn kế hoạch học tập.";
      const injected = injectDataIntegrityPolicy(prompt);

      expect(injected).toContain("QUY TẮC CỐT LÕI VỀ TÍNH TOÀN VẸN DỮ LIỆU");
      expect(injected).toContain("NGUYÊN TẮC TỐI THƯỢNG (RULE 0)");
      expect(injected).toContain("8 HÀNH VI BỊ CẤM TUYỆT ĐỐI");
      expect(injected).toContain("Hãy tư vấn kế hoạch học tập.");
    });

    it("should not duplicate policy if already injected", () => {
      const base = `AI DATA INTEGRITY POLICY\n${AI_DATA_INTEGRITY_SYSTEM_PROMPT}`;
      const res = injectDataIntegrityPolicy(base);
      expect(res).toBe(base);
    });
  });
});
