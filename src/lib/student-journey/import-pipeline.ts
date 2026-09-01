import { prisma } from "@/lib/prisma";
import {
  ImportBatchStatus,
  MatchConfidence,
  Prisma,
} from "@prisma/client";
import { batchComputeJourneyForCampus } from "./journey-engine";

export interface RawImportRow {
  rowNumber: number;
  studentCode?: string;
  name: string;
  classLabel?: string;
  subjectName: string;
  periodName: string;
  score: number;
}

/**
 * Normalizes text for comparison (removes accents, lowercase, extra spaces)
 */
export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Calculates simple similarity between two normalized strings (0.0 to 1.0)
 */
export function calculateStringSimilarity(a: string, b: string): number {
  const s1 = normalizeText(a);
  const s2 = normalizeText(b);
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }

  // Levenshtein distance
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Step 1: Create a staging batch and validate raw rows
 */
export async function createImportBatch({
  schoolId,
  campusId,
  fileName,
  importedById,
  importedByName,
  rows,
}: {
  schoolId: string;
  campusId?: string;
  fileName: string;
  importedById: string;
  importedByName?: string;
  rows: RawImportRow[];
}) {
  let validRowsCount = 0;
  let invalidRowsCount = 0;

  const stagingData: Array<{
    rowNumber: number;
    rawStudentCode: string | null;
    rawName: string;
    rawClassLabel: string | null;
    rawSubject: string;
    rawPeriod: string;
    rawScore: number | null;
    isValid: boolean;
    errorMessage: string | null;
  }> = [];

  for (const row of rows) {
    let isValid = true;
    const errors: string[] = [];

    if (!row.name || row.name.trim().length === 0) {
      isValid = false;
      errors.push("Tên học sinh không được để trống");
    }

    if (!row.subjectName || row.subjectName.trim().length === 0) {
      isValid = false;
      errors.push("Tên môn học không được để trống");
    }

    if (!row.periodName || row.periodName.trim().length === 0) {
      isValid = false;
      errors.push("Kỳ thi không được để trống");
    }

    if (
      typeof row.score !== "number" ||
      isNaN(row.score) ||
      row.score < 0 ||
      row.score > 10
    ) {
      isValid = false;
      errors.push("Điểm số phải là số từ 0 đến 10");
    }

    if (isValid) {
      validRowsCount++;
    } else {
      invalidRowsCount++;
    }

    stagingData.push({
      rowNumber: row.rowNumber,
      rawStudentCode: row.studentCode?.trim() || null,
      rawName: row.name.trim(),
      rawClassLabel: row.classLabel?.trim() || null,
      rawSubject: row.subjectName.trim(),
      rawPeriod: row.periodName.trim(),
      rawScore: typeof row.score === "number" && !isNaN(row.score) ? row.score : null,
      isValid,
      errorMessage: errors.length > 0 ? errors.join("; ") : null,
    });
  }

  // Create Batch and Staging in transaction
  const batch = await prisma.$transaction(async (tx) => {
    const createdBatch = await tx.studentImportBatch.create({
      data: {
        schoolId,
        campusId: campusId || null,
        fileName,
        totalRows: rows.length,
        validRows: validRowsCount,
        invalidRows: invalidRowsCount,
        status: ImportBatchStatus.STAGED,
        importedById,
        importedByName: importedByName || "Admin",
      },
    });

    await tx.studentImportStaging.createMany({
      data: stagingData.map((s) => ({
        ...s,
        batchId: createdBatch.id,
      })),
    });

    return createdBatch;
  });

  // Step 2: Automatically generate matching records for this batch
  await generateMappingsForBatch(batch.id, schoolId, campusId);

  return batch;
}

/**
 * Step 2: Generate Mapping for unique entities in staging
 */
export async function generateMappingsForBatch(
  batchId: string,
  schoolId: string,
  campusId?: string
) {
  const stagings = await prisma.studentImportStaging.findMany({
    where: { batchId, isValid: true },
  });

  // Fetch existing master data
  const studentWhere: Prisma.StudentWhereInput = {
    classRoom: {
      schoolId,
      ...(campusId ? { campusId } : {}),
    },
  };

  const [students, subjects, examPeriods] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: {
        user: { select: { name: true } },
        classRoom: { select: { name: true } },
      },
    }),
    prisma.subject.findMany(),
    prisma.examPeriod.findMany({
      where: { schoolId },
    }),
  ]);

  // Find unique student entries from staging
  const uniqueStudentKeys = new Map<
    string,
    {
      rawName: string;
      rawStudentCode: string | null;
      rawClassLabel: string | null;
      rawSubject: string;
      rawPeriod: string;
    }
  >();

  for (const s of stagings) {
    const key = `${s.rawName}::${s.rawStudentCode || ""}::${s.rawClassLabel || ""}::${s.rawSubject}::${s.rawPeriod}`;
    if (!uniqueStudentKeys.has(key)) {
      uniqueStudentKeys.set(key, {
        rawName: s.rawName,
        rawStudentCode: s.rawStudentCode,
        rawClassLabel: s.rawClassLabel,
        rawSubject: s.rawSubject,
        rawPeriod: s.rawPeriod,
      });
    }
  }

  const mappingsToCreate: Array<{
    batchId: string;
    rawName: string;
    rawStudentCode: string | null;
    rawClassLabel: string | null;
    rawSubject: string | null;
    matchedStudentId: string | null;
    matchedSubjectId: string | null;
    matchedPeriodId: string | null;
    matchConfidence: MatchConfidence;
    notes: string | null;
  }> = [];

  for (const [, item] of uniqueStudentKeys.entries()) {
    // 1. Match Student
    let matchedStudentId: string | null = null;
    let studentConfidence: MatchConfidence = MatchConfidence.MANUAL_REVIEW;
    let matchNotes = "";

    // Try exact studentCode match
    if (item.rawStudentCode) {
      const foundByCode = students.find(
        (s) => s.studentCode && s.studentCode.trim().toLowerCase() === item.rawStudentCode?.toLowerCase()
      );
      if (foundByCode) {
        matchedStudentId = foundByCode.id;
        studentConfidence = MatchConfidence.EXACT;
        matchNotes = `Khớp chính xác theo mã học sinh: ${item.rawStudentCode}`;
      }
    }

    // If not matched by code, try exact Name + ClassRoom
    if (!matchedStudentId && item.rawClassLabel) {
      const normClass = normalizeText(item.rawClassLabel);
      const normName = normalizeText(item.rawName);

      const foundByClassAndName = students.filter(
        (s) =>
          normalizeText(s.user?.name || "") === normName &&
          normalizeText(s.classRoom?.name || "") === normClass
      );

      if (foundByClassAndName.length === 1) {
        matchedStudentId = foundByClassAndName[0].id;
        studentConfidence = MatchConfidence.EXACT;
        matchNotes = `Khớp chính xác tên và lớp: ${foundByClassAndName[0].user?.name} (${foundByClassAndName[0].classRoom?.name})`;
      } else if (foundByClassAndName.length > 1) {
        studentConfidence = MatchConfidence.MANUAL_REVIEW;
        matchNotes = `Trùng tên ${item.rawName} trong cùng lớp ${item.rawClassLabel} (Cần duyệt thủ công)`;
      }
    }

    // If still not matched, try fuzzy name matching
    if (!matchedStudentId) {
      const normName = normalizeText(item.rawName);
      let bestSim = 0;
      let bestStudent = null;

      for (const s of students) {
        const studentNormName = normalizeText(s.user?.name || "");
        const sim = calculateStringSimilarity(normName, studentNormName);
        if (sim > bestSim) {
          bestSim = sim;
          bestStudent = s;
        }
      }

      if (bestStudent && bestSim >= 0.8) {
        matchedStudentId = bestStudent.id;
        studentConfidence = MatchConfidence.FUZZY;
        matchNotes = `Khớp mờ (${Math.round(bestSim * 100)}%) với học sinh: ${bestStudent.user?.name} (${bestStudent.classRoom?.name || "Chưa xếp lớp"})`;
      } else {
        studentConfidence = MatchConfidence.MANUAL_REVIEW;
        matchNotes = `Không tìm thấy học sinh phù hợp với "${item.rawName}"`;
      }
    }

    // 2. Match Subject
    let matchedSubjectId: string | null = null;
    const normSub = normalizeText(item.rawSubject);
    const foundSubject = subjects.find(
      (sub) => normalizeText(sub.name) === normSub
    );
    if (foundSubject) {
      matchedSubjectId = foundSubject.id;
    }

    // 3. Match ExamPeriod
    let matchedPeriodId: string | null = null;
    const normPeriod = normalizeText(item.rawPeriod);
    const foundPeriod = examPeriods.find(
      (ep) => normalizeText(ep.name) === normPeriod
    );
    if (foundPeriod) {
      matchedPeriodId = foundPeriod.id;
    }

    // If subject or period is missing, force MANUAL_REVIEW
    let finalConfidence = studentConfidence;
    if (!matchedSubjectId || !matchedPeriodId) {
      finalConfidence = MatchConfidence.MANUAL_REVIEW;
      if (!matchedSubjectId) matchNotes += " | Thiếu môn học";
      if (!matchedPeriodId) matchNotes += " | Thiếu kỳ thi";
    }

    mappingsToCreate.push({
      batchId,
      rawName: item.rawName,
      rawStudentCode: item.rawStudentCode,
      rawClassLabel: item.rawClassLabel,
      rawSubject: item.rawSubject,
      matchedStudentId,
      matchedSubjectId,
      matchedPeriodId,
      matchConfidence: finalConfidence,
      notes: matchNotes,
    });
  }

  await prisma.studentImportMapping.createMany({
    data: mappingsToCreate,
  });

  // Update batch status to MAPPED
  await prisma.studentImportBatch.update({
    where: { id: batchId },
    data: { status: ImportBatchStatus.MAPPED },
  });
}

/**
 * Step 3: Human Reviewer resolves or modifies a mapping
 */
export async function reviewMapping({
  mappingId,
  studentId,
  subjectId,
  periodId,
  reviewedById,
  reviewedByName,
  notes,
}: {
  mappingId: string;
  studentId?: string;
  subjectId?: string;
  periodId?: string;
  reviewedById: string;
  reviewedByName?: string;
  notes?: string;
}) {
  const current = await prisma.studentImportMapping.findUnique({
    where: { id: mappingId },
  });

  if (!current) throw new Error("Mapping not found");

  const updated = await prisma.studentImportMapping.update({
    where: { id: mappingId },
    data: {
      matchedStudentId: studentId ?? current.matchedStudentId,
      matchedSubjectId: subjectId ?? current.matchedSubjectId,
      matchedPeriodId: periodId ?? current.matchedPeriodId,
      matchConfidence: MatchConfidence.EXACT, // Human approved
      reviewedBy: reviewedById,
      reviewedByName: reviewedByName || "Reviewer",
      reviewedAt: new Date(),
      notes: notes ? `${current.notes || ""} [Đã duyệt: ${notes}]` : current.notes,
    },
  });

  return updated;
}

/**
 * Step 4: Strict Human Review Gate & Commit to Official Scores
 */
export async function commitImportBatch({
  batchId,
  committedById,
  committedByName,
}: {
  batchId: string;
  committedById: string;
  committedByName?: string;
}) {
  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
      mappings: true,
      stagings: { where: { isValid: true } },
    },
  });

  if (!batch) throw new Error("Batch not found");
  if (batch.status === ImportBatchStatus.COMMITTED) {
    throw new Error("Batch đã được nạp điểm trước đó.");
  }
  if (batch.status === ImportBatchStatus.ROLLED_BACK) {
    throw new Error("Batch đã bị thu hồi (Rolled Back), không thể nạp lại.");
  }

  // STRICT GATING CHECK:
  // Disallow commit if any mapping is still FUZZY or MANUAL_REVIEW without human review!
  const unreviewedMappings = batch.mappings.filter(
    (m) =>
      (!m.reviewedBy && m.matchConfidence !== MatchConfidence.EXACT) ||
      !m.matchedStudentId ||
      !m.matchedSubjectId ||
      !m.matchedPeriodId
  );

  if (unreviewedMappings.length > 0) {
    throw new Error(
      `Không thể nạp điểm: Còn ${unreviewedMappings.length} bản ghi mapping ở trạng thái FUZZY hoặc MANUAL_REVIEW chưa được kiểm duyệt xác nhận.`
    );
  }

  // Create lookup map for fast resolution: rawName+rawSubject+rawPeriod -> mapping
  const mappingMap = new Map<string, typeof batch.mappings[0]>();
  for (const m of batch.mappings) {
    const key = `${m.rawName}::${m.rawStudentCode || ""}::${m.rawClassLabel || ""}::${m.rawSubject || ""}`;
    mappingMap.set(key, m);
  }

  const scoresToCreate: Array<{
    studentId: string;
    subjectId: string;
    examPeriodId: string;
    schoolId: string;
    campusId: string;
    score: number;
    importBatchId: string;
  }> = [];

  for (const st of batch.stagings) {
    if (st.rawScore === null) continue;
    const key = `${st.rawName}::${st.rawStudentCode || ""}::${st.rawClassLabel || ""}::${st.rawSubject || ""}`;
    const m = mappingMap.get(key);

    if (m && m.matchedStudentId && m.matchedSubjectId && m.matchedPeriodId) {
      scoresToCreate.push({
        studentId: m.matchedStudentId,
        subjectId: m.matchedSubjectId,
        examPeriodId: m.matchedPeriodId,
        schoolId: batch.schoolId,
        campusId: batch.campusId || batch.schoolId,
        score: st.rawScore,
        importBatchId: batch.id,
      });
    }
  }

  // Execute in Transaction
  await prisma.$transaction(async (tx) => {
    // Upsert each score
    for (const sc of scoresToCreate) {
      await tx.studentScore.upsert({
        where: {
          studentId_subjectId_examPeriodId: {
            studentId: sc.studentId,
            subjectId: sc.subjectId,
            examPeriodId: sc.examPeriodId,
          },
        },
        update: {
          score: sc.score,
          importBatchId: sc.importBatchId,
        },
        create: sc,
      });
    }

    // Mark batch COMMITTED
    await tx.studentImportBatch.update({
      where: { id: batch.id },
      data: {
        status: ImportBatchStatus.COMMITTED,
        committedAt: new Date(),
      },
    });

    // Audit Log
    await tx.auditLog.create({
      data: {
        userId: committedById,
        userName: committedByName || "Admin",
        userRole: "ADMIN",
        schoolId: batch.schoolId,
        campusId: batch.campusId,
        action: "IMPORT",
        entityName: "StudentScore",
        entityId: batch.id,
        description: `Nạp thành công ${scoresToCreate.length} điểm số từ đợt import ${batch.fileName}`,
        changesJson: JSON.stringify({ batchId: batch.id, scoresCount: scoresToCreate.length }),
      },
    });
  });

  // Automatically trigger batch journey regression computation for the campus
  try {
    await batchComputeJourneyForCampus(batch.schoolId, batch.campusId || undefined);
  } catch (err) {
    console.error("Error running batch journey compute after import commit:", err);
  }

  return {
    success: true,
    committedScoresCount: scoresToCreate.length,
  };
}

/**
 * Step 5: Rollback Batch completely
 */
export async function rollbackImportBatch({
  batchId,
  userId,
  userName,
  reason,
}: {
  batchId: string;
  userId: string;
  userName?: string;
  reason?: string;
}) {
  const batch = await prisma.studentImportBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) throw new Error("Batch not found");
  if (batch.status !== ImportBatchStatus.COMMITTED) {
    throw new Error("Chỉ có thể thu hồi (Rollback) các đợt import đã được nạp điểm (COMMITTED).");
  }

  // Delete all scores created from this batch
  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.studentScore.deleteMany({
      where: { importBatchId: batchId },
    });

    await tx.studentImportBatch.update({
      where: { id: batchId },
      data: {
        status: ImportBatchStatus.ROLLED_BACK,
        rolledBackAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        userName: userName || "Admin",
        userRole: "ADMIN",
        schoolId: batch.schoolId,
        campusId: batch.campusId,
        action: "DELETE",
        entityName: "StudentScore",
        entityId: batchId,
        description: `Thu hồi toàn bộ (Rollback) đợt import ${batch.fileName}. Đã xóa ${deleted.count} điểm số. Lý do: ${reason || "Không có"}`,
      },
    });

    return deleted.count;
  });

  // Re-calculate journey snapshots after rollback
  try {
    await batchComputeJourneyForCampus(batch.schoolId, batch.campusId || undefined);
  } catch (err) {
    console.error("Error recomputing after rollback:", err);
  }

  return {
    success: true,
    deletedScoresCount: result,
  };
}

/**
 * Get batch details with mappings and staging summary
 */
export async function getImportBatchDetails(batchId: string) {
  return prisma.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
      mappings: {
        orderBy: [{ matchConfidence: "desc" }, { rawName: "asc" }],
      },
      stagings: {
        take: 50,
        orderBy: { rowNumber: "asc" },
      },
      _count: {
        select: {
          scores: true,
          mappings: true,
          stagings: true,
        },
      },
    },
  });
}
