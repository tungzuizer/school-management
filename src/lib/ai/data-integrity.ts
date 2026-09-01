import { prisma } from "@/lib/prisma";

/**
 * System prompt containing the core AI Data Integrity Policy (Quy tắc cấm AI bịa dữ liệu).
 * Injected into all LLM calls across the Smart School Management system.
 */
export const AI_DATA_INTEGRITY_SYSTEM_PROMPT = `
=== QUY TẮC CỐT LÕI VỀ TÍNH TOÀN VẸN DỮ LIỆU (AI DATA INTEGRITY POLICY) ===
NGUYÊN TẮC TỐI THƯỢNG (RULE 0):
- Bạn chỉ được phép phát biểu những gì CÓ THỂ TRUY VẾT NGƯỢC về một bản ghi thực tế trong cơ sở dữ liệu (Database).
- Nếu không có dữ liệu hoặc dữ liệu không đủ để kết luận, bạn BẮT BUỘC phải trả lời "không đủ dữ liệu" (INSUFFICIENT_DATA) và nêu rõ đang thiếu thông tin gì.
- TUYỆT ĐỐI KHÔNG đoán, KHÔNG tự ý nội suy thành số liệu cụ thể, KHÔNG làm tròn sự thiếu chắc chắn thành một kết luận gọn gàng ("có vẻ ổn" hay "ổn định").

8 HÀNH VI BỊ CẤM TUYỆT ĐỐI:
1. Bịa ra học sinh, lớp học, môn học, giáo viên không có trong dữ liệu cung cấp.
2. Bịa hoặc làm tròn điểm số không có nguồn student_score thật.
3. Nội suy dữ liệu bị thiếu thành một giá trị cụ thể mà không cảnh báo.
4. Bịa kết quả can thiệp (outcomeScoreDelta) khi chưa có kỳ đánh giá tiếp theo.
5. Trích dẫn "theo hồ sơ", "theo ghi nhận" mà không cung cấp record_id cụ thể (ví dụ: [id=xxx] hoặc student_score#id=xxx).
6. Suy diễn nguyên nhân tâm lý/gia đình từ dữ liệu định lượng mà không gắn nhãn SUY LUẬN cần xác minh.
7. Tự động lấy dữ liệu kỳ trước đắp vào kỳ hiện tại khi chưa có số liệu.
8. Trả lời chung chung theo kiến thức ngoài mà không dựa trên dữ liệu hệ thống được cung cấp.

QUY TẮC PHÂN TÁCH BẮT BUỘC GIỮA DỮ KIỆN (FACT) VÀ SUY LUẬN (INFERENCE):
Khi phân tích hoặc đưa ra nhận định về học sinh / lớp học, bạn PHẢI phân tách rõ ràng:
[DỮ KIỆN — có record_id]: Nêu các con số thực tế kèm ID bản ghi nguồn (ví dụ: "Điểm Toán kỳ 1: 5.2 [id=score_123]").
[SUY LUẬN — cần con người xác minh]: Nêu các nhận định xu hướng, giả thuyết hoặc gợi ý cần giáo viên/BGH kiểm chứng trực tiếp.
=============================================================================
`.trim();

/**
 * Injects the AI Data Integrity Policy into any system or user prompt.
 */
export function injectDataIntegrityPolicy(basePrompt: string): string {
  if (basePrompt.includes("AI DATA INTEGRITY POLICY")) {
    return basePrompt;
  }
  return `${AI_DATA_INTEGRITY_SYSTEM_PROMPT}\n\n${basePrompt}`;
}

export interface FactItem {
  statement: string;
  recordIds: string[];
  sourceTable?: string;
  isValidated?: boolean;
  validationError?: string;
}

export interface InferenceItem {
  hypothesis: string;
  verificationRequired: string;
  basisRecordIds?: string[];
}

export interface ParsedFactInference {
  rawText: string;
  isInsufficientData: boolean;
  missingDataReason?: string;
  facts: FactItem[];
  inferences: InferenceItem[];
  citedRecordIds: string[];
}

export interface AIGroundedResponse {
  rawText: string;
  isInsufficientData: boolean;
  missingDataReason?: string;
  facts: FactItem[];
  inferences: InferenceItem[];
  allCitedRecordIds: string[];
  verifiedRecordIds: string[];
  unverifiedRecordIds: string[];
  hasHallucinations: boolean;
  groundingStatus: "GROUNDED" | "INSUFFICIENT_DATA" | "UNVERIFIED_RECORDS" | "REJECTED_HALLUCINATION";
}

/**
 * Extracts cited record IDs from a string.
 * Supports patterns:
 * - [id=xxx]
 * - [record_id=xxx]
 * - student_score#id=xxx
 * - (nguồn: xxx, yyy)
 * - id: "xxx" or id="xxx"
 */
export function extractRecordIds(text: string): string[] {
  const ids = new Set<string>();

  // Pattern 1: [id=...] or [record_id=...]
  const bracketIdRegex = /\[(?:record_)?id\s*=\s*([a-zA-Z0-9_-]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = bracketIdRegex.exec(text)) !== null) {
    if (match[1]) ids.add(match[1].trim());
  }

  // Pattern 2: table#id=xxx (e.g., student_score#id=clx...)
  const tableIdRegex = /(?:[a-zA-Z_]+)#(?:id=)?([a-zA-Z0-9_-]+)/gi;
  while ((match = tableIdRegex.exec(text)) !== null) {
    if (match[1] && !match[1].startsWith("http")) ids.add(match[1].trim());
  }

  // Pattern 3: (nguồn: id1, id2) or (nguồn: student_score#id=xxx)
  const sourceBlockRegex = /\(nguồn:[^)]+\)/gi;
  while ((match = sourceBlockRegex.exec(text)) !== null) {
    const block = match[0];
    const subIdRegex = /(?:id=)?([a-zA-Z0-9_-]{8,})/gi;
    let subMatch: RegExpExecArray | null;
    while ((subMatch = subIdRegex.exec(block)) !== null) {
      if (subMatch[1] && subMatch[1] !== "nguồn") {
        ids.add(subMatch[1].trim());
      }
    }
  }

  // Pattern 4: Explicit record_id: "xxx" or recordId: xxx
  const explicitRecordIdRegex = /record(?:_)?id[:=]\s*["']?([a-zA-Z0-9_-]+)["']?/gi;
  while ((match = explicitRecordIdRegex.exec(text)) !== null) {
    if (match[1]) ids.add(match[1].trim());
  }

  return Array.from(ids);
}

/**
 * Checks if the text indicates an insufficient data condition.
 */
export function checkIsInsufficientData(text: string): { isInsufficient: boolean; reason?: string } {
  const lower = text.toLowerCase();
  const insufficientKeywords = [
    "không đủ dữ liệu",
    "thiếu dữ liệu",
    "chưa đủ dữ liệu",
    "chưa có dữ liệu",
    "insufficient_data",
    "không tìm thấy dữ liệu",
    "chưa có thông tin",
    "chưa đủ 3 kỳ tối thiểu",
  ];

  for (const kw of insufficientKeywords) {
    if (lower.includes(kw)) {
      const lines = text.split("\n");
      const matchedLine = lines.find((l) => l.toLowerCase().includes(kw));
      return {
        isInsufficient: true,
        reason: matchedLine?.trim() || "Dữ liệu hiện tại không đủ để đưa ra đánh giá chắc chắn.",
      };
    }
  }

  return { isInsufficient: false };
}

/**
 * Parses Fact and Inference blocks from AI output.
 */
export function parseFactAndInference(aiText: string): ParsedFactInference {
  const { isInsufficient: isInsufficientData, reason: missingDataReason } = checkIsInsufficientData(aiText);
  const citedRecordIds = extractRecordIds(aiText);

  const facts: FactItem[] = [];
  const inferences: InferenceItem[] = [];

  const lines = aiText.split("\n");
  let currentSection: "NONE" | "FACT" | "INFERENCE" = "NONE";
  let currentFactBuffer: string[] = [];
  let currentInferenceBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed.toUpperCase().includes("[DỮ KIỆN") ||
      trimmed.toUpperCase().includes("[DỮ LIỆU THỰC TẾ") ||
      trimmed.toUpperCase().startsWith("DỮ KIỆN:") ||
      trimmed.toUpperCase().startsWith("FACTS:")
    ) {
      if (currentInferenceBuffer.length > 0) {
        inferences.push({
          hypothesis: currentInferenceBuffer.join(" ").trim(),
          verificationRequired: "Cần giáo viên chủ nhiệm hoặc BGH xác minh trực tiếp với học sinh/phụ huynh.",
          basisRecordIds: extractRecordIds(currentInferenceBuffer.join(" ")),
        });
        currentInferenceBuffer = [];
      }
      currentSection = "FACT";
      const cleanLine = trimmed.replace(/^\[.*?\]:?/i, "").replace(/^(?:DỮ KIỆN|FACTS):/i, "").trim();
      if (cleanLine) currentFactBuffer.push(cleanLine);
      continue;
    }

    if (
      trimmed.toUpperCase().includes("[SUY LUẬN") ||
      trimmed.toUpperCase().includes("[ĐỀ XUẤT") ||
      trimmed.toUpperCase().startsWith("SUY LUẬN:") ||
      trimmed.toUpperCase().startsWith("INFERENCES:")
    ) {
      if (currentFactBuffer.length > 0) {
        const factText = currentFactBuffer.join(" ").trim();
        facts.push({
          statement: factText,
          recordIds: extractRecordIds(factText),
        });
        currentFactBuffer = [];
      }
      currentSection = "INFERENCE";
      const cleanLine = trimmed.replace(/^\[.*?\]:?/i, "").replace(/^(?:SUY LUẬN|INFERENCES):/i, "").trim();
      if (cleanLine) currentInferenceBuffer.push(cleanLine);
      continue;
    }

    if (currentSection === "FACT" && trimmed) {
      currentFactBuffer.push(trimmed);
    } else if (currentSection === "INFERENCE" && trimmed) {
      currentInferenceBuffer.push(trimmed);
    }
  }

  // Flush remaining buffers
  if (currentFactBuffer.length > 0) {
    const factText = currentFactBuffer.join(" ").trim();
    facts.push({
      statement: factText,
      recordIds: extractRecordIds(factText),
    });
  }

  if (currentInferenceBuffer.length > 0) {
    inferences.push({
      hypothesis: currentInferenceBuffer.join(" ").trim(),
      verificationRequired: "Cần giáo viên chủ nhiệm hoặc BGH xác minh trực tiếp.",
      basisRecordIds: extractRecordIds(currentInferenceBuffer.join(" ")),
    });
  }

  // If no explicit [DỮ KIỆN] tag was found, extract bullet points with record IDs as facts
  if (facts.length === 0 && citedRecordIds.length > 0) {
    for (const line of lines) {
      const lineIds = extractRecordIds(line);
      if (lineIds.length > 0) {
        facts.push({
          statement: line.trim(),
          recordIds: lineIds,
        });
      }
    }
  }

  return {
    rawText: aiText,
    isInsufficientData,
    missingDataReason,
    facts,
    inferences,
    citedRecordIds,
  };
}

/**
 * Server-side Grounding Verification Engine:
 * Validates that every record ID cited in the AI output exists in the DB within the tenant scope (schoolId/campusId).
 */
export async function verifyAIGrounding(
  aiOutput: string | ParsedFactInference,
  tenantContext: { schoolId: string; campusId?: string }
): Promise<AIGroundedResponse> {
  const parsed = typeof aiOutput === "string" ? parseFactAndInference(aiOutput) : aiOutput;

  if (parsed.isInsufficientData) {
    return {
      rawText: parsed.rawText,
      isInsufficientData: true,
      missingDataReason: parsed.missingDataReason,
      facts: parsed.facts,
      inferences: parsed.inferences,
      allCitedRecordIds: parsed.citedRecordIds,
      verifiedRecordIds: [],
      unverifiedRecordIds: [],
      hasHallucinations: false,
      groundingStatus: "INSUFFICIENT_DATA",
    };
  }

  const citedIds = parsed.citedRecordIds;
  if (citedIds.length === 0) {
    return {
      rawText: parsed.rawText,
      isInsufficientData: false,
      facts: parsed.facts,
      inferences: parsed.inferences,
      allCitedRecordIds: [],
      verifiedRecordIds: [],
      unverifiedRecordIds: [],
      hasHallucinations: false,
      groundingStatus: "GROUNDED",
    };
  }

  const verifiedRecordIds: string[] = [];
  const unverifiedRecordIds: string[] = [];

  const checkPromises = citedIds.map(async (recordId) => {
    try {
      // 1. Check StudentScore
      const score = await prisma.studentScore.findUnique({
        where: { id: recordId },
        select: { id: true, schoolId: true, campusId: true },
      });
      if (score && score.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "StudentScore" };
      }

      // 2. Check Student
      const student = await prisma.student.findUnique({
        where: { id: recordId },
        include: { classRoom: { select: { schoolId: true, campusId: true } } },
      });
      if (student && student.classRoom?.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "Student" };
      }

      // 3. Check InterventionRecord
      const intervention = await prisma.interventionRecord.findUnique({
        where: { id: recordId },
        select: { id: true, schoolId: true, campusId: true },
      });
      if (intervention && intervention.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "InterventionRecord" };
      }

      // 4. Check ClassRoom
      const classRoom = await prisma.classRoom.findUnique({
        where: { id: recordId },
        select: { id: true, schoolId: true, campusId: true },
      });
      if (classRoom && classRoom.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "ClassRoom" };
      }

      // 5. Check Attendance
      const attendance = await prisma.attendance.findUnique({
        where: { id: recordId },
        include: { classRoom: { select: { schoolId: true, campusId: true } } },
      });
      if (attendance && attendance.classRoom?.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "Attendance" };
      }

      // 6. Check EarlyWarning
      const warning = await prisma.earlyWarning.findUnique({
        where: { id: recordId },
        select: { id: true, campusName: true },
      });
      if (warning) {
        return { recordId, verified: true, table: "EarlyWarning" };
      }

      // 7. Check StudentJourneySnapshot
      const snapshot = await prisma.studentJourneySnapshot.findUnique({
        where: { id: recordId },
        select: { id: true, schoolId: true, campusId: true },
      });
      if (snapshot && snapshot.schoolId === tenantContext.schoolId) {
        return { recordId, verified: true, table: "StudentJourneySnapshot" };
      }

      return { recordId, verified: false };
    } catch {
      return { recordId, verified: false };
    }
  });

  const checkResults = await Promise.all(checkPromises);
  const verifiedMap = new Map<string, { verified: boolean; table?: string }>();

  for (const res of checkResults) {
    if (res.verified) {
      verifiedRecordIds.push(res.recordId);
      verifiedMap.set(res.recordId, { verified: true, table: res.table });
    } else {
      unverifiedRecordIds.push(res.recordId);
      verifiedMap.set(res.recordId, { verified: false });
    }
  }

  const validatedFacts: FactItem[] = parsed.facts.map((fact) => {
    const factIds = fact.recordIds;
    const isAllValid = factIds.length > 0 && factIds.every((id) => verifiedMap.get(id)?.verified);
    const unverified = factIds.filter((id) => !verifiedMap.get(id)?.verified);

    return {
      ...fact,
      isValidated: isAllValid,
      sourceTable: factIds.length > 0 ? verifiedMap.get(factIds[0])?.table : undefined,
      validationError:
        unverified.length > 0
          ? `Bản ghi ID [${unverified.join(", ")}] không tồn tại trong cơ sở dữ liệu trường học.`
          : undefined,
    };
  });

  const hasHallucinations = unverifiedRecordIds.length > 0;
  const groundingStatus = hasHallucinations ? "UNVERIFIED_RECORDS" : "GROUNDED";

  return {
    rawText: parsed.rawText,
    isInsufficientData: false,
    facts: validatedFacts,
    inferences: parsed.inferences,
    allCitedRecordIds: citedIds,
    verifiedRecordIds,
    unverifiedRecordIds,
    hasHallucinations,
    groundingStatus,
  };
}

/**
 * Asserts that an AI response is grounded and contains no fabricated record IDs.
 * Throws a Security/Integrity Error if hallucinations are detected.
 */
export function assertAIGrounded(response: AIGroundedResponse): void {
  if (response.hasHallucinations) {
    throw new Error(
      `[AI_DATA_INTEGRITY_VIOLATION]: Phát hiện ${response.unverifiedRecordIds.length} bản ghi bịa đặt hoặc không có quyền truy cập: ${response.unverifiedRecordIds.join(", ")}`
    );
  }
}
