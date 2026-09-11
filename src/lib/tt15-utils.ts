/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/tt15-evaluation/actions.ts line 253, src/app/admin/tt15-evaluation/TT15EvaluationClient.tsx line 19
 * 2. Search check: No existing utility file provides Thông tư 15/2026 ranking computation.
 * 3. Data structure: Input: details array of { selfAssessment: string, principalAssessment: string, score: number }; Output: { rank: string, level: number, totalScore: number, averageScore: number, stats: { total: number, tot: number, kha: number, dat: number, chuaDat: number, pctDat: number, pctKha: number, pctTot: number } }
 * 4. Verbatim User Instruction: "phần kpi tôi đang thấy nó làm cho có, tôi cần phải cần làm kỹ phần kpi rõ ràng phó hiệu trưởng đánh giá từng trường, hiệu trưởng đánh giá các trường ở trong phân hiệu của hiệu trưởng và phải làm thật sự chứ không phải làm cho có và dự trên Thông tư 15/2026/TT-BGDĐT ban hành Điều lệ trường tiểu học, trung học cơ sở, trung học phổ thông và trường phổ thông có nhiều cấp học, có hiệu lực từ ngày 10/5/2026."
 */

export const STANDARD_TITLES: Record<string, string> = {
  STANDARD_1: "Tiêu chuẩn 1: Tổ chức và quản lý nhà trường",
  STANDARD_2: "Tiêu chuẩn 2: Cán bộ quản lý, giáo viên, nhân viên và học sinh",
  STANDARD_3: "Tiêu chuẩn 3: Cơ sở vật chất và thiết bị dạy học",
  STANDARD_4: "Tiêu chuẩn 4: Quan hệ giữa nhà trường, gia đình và xã hội",
  STANDARD_5: "Tiêu chuẩn 5: Hoạt động giáo dục và kết quả giáo dục",
};

/**
 * Logic xếp loại tự động theo chuẩn Thông tư 15/2026/TT-BGDĐT
 * - Tốt (Cấp độ 3): 100% tiêu chí >= Mức 1 (Đạt), >= 80% tiêu chí đạt Mức 2 (Khá), >= 50% tiêu chí đạt Mức 3 (Tốt).
 * - Khá (Cấp độ 2): 100% tiêu chí >= Mức 1 (Đạt), >= 60% tiêu chí đạt Mức 2 (Khá).
 * - Đạt (Cấp độ 1): 100% tiêu chí >= Mức 1 (Đạt).
 * - Chưa đạt: Có bất kỳ tiêu chí nào chưa đạt hoặc chưa đánh giá.
 */
export function calculateTT15Ranking(details: { selfAssessment?: string | null; principalAssessment?: string | null; score?: number | null }[]) {
  if (!details || details.length === 0) {
    return {
      rank: "Chưa đánh giá",
      level: 0,
      totalScore: 0,
      averageScore: 0,
      stats: { total: 0, tot: 0, kha: 0, dat: 0, chuaDat: 0, pctDat: 0, pctKha: 0, pctTot: 0 }
    };
  }

  const total = details.length;
  let tot = 0;
  let kha = 0;
  let dat = 0;
  let chuaDat = 0;
  let totalScore = 0;

  for (const d of details) {
    const val = d.principalAssessment || d.selfAssessment;
    totalScore += (d.score || (val === "Tốt" ? 3 : val === "Khá" ? 2 : val === "Đạt" ? 1 : 0));
    if (val === "Tốt") {
      tot++;
      kha++;
      dat++;
    } else if (val === "Khá") {
      kha++;
      dat++;
    } else if (val === "Đạt") {
      dat++;
    } else {
      chuaDat++;
    }
  }

  const pctDat = total > 0 ? (dat / total) * 100 : 0;
  const pctKha = total > 0 ? (kha / total) * 100 : 0;
  const pctTot = total > 0 ? (tot / total) * 100 : 0;

  let rank = "Chưa đạt";
  let level = 0;

  if (pctDat === 100 && pctKha >= 80 && pctTot >= 50) {
    rank = "Tốt (Cấp độ 3)";
    level = 3;
  } else if (pctDat === 100 && pctKha >= 60) {
    rank = "Khá (Cấp độ 2)";
    level = 2;
  } else if (pctDat === 100) {
    rank = "Đạt (Cấp độ 1)";
    level = 1;
  } else {
    rank = "Chưa đạt";
    level = 0;
  }

  return {
    rank,
    level,
    totalScore,
    averageScore: +(totalScore / total).toFixed(2),
    stats: { total, tot, kha, dat, chuaDat, pctDat, pctKha, pctTot }
  };
}
