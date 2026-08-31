import {
  AggregatedSchoolSnapshot,
  SubstituteCandidate,
  SubstituteRecommendationResult,
  EquipmentTransferAdviceResult,
  EquipmentCategory,
} from "../types";

/**
 * Task Group 2: Activity Coordination & Dispatch
 * Optimizes substitute teacher allocation across 4 school points with distance weighting,
 * and advises on inter-campus equipment transfers.
 */

export function evaluateSubstituteRecommendation(
  request: { absentTeacherId: string; date: Date; period: number; classId: string },
  data: AggregatedSchoolSnapshot
): SubstituteRecommendationResult {
  const absentTeacher = data.teachers.find((t) => t.teacherId === request.absentTeacherId);
  const targetSubject = absentTeacher?.specialty || "Toán";
  const targetPointId = absentTeacher?.schoolPointId || data.schoolPoints[0]?.id || "sp-trung-tam";
  const targetPoint = data.schoolPoints.find((p) => p.id === targetPointId);
  const targetPointName = targetPoint?.name || "Điểm trung tâm";

  // Filter candidates who are NOT the absent teacher and NOT busy during the requested period
  const candidatePool = (data.teachers || []).filter(
    (t) => t.teacherId !== request.absentTeacherId && !(t.busyPeriods || []).includes(request.period)
  );

  const scoredCandidates: SubstituteCandidate[] = candidatePool.map((t) => {
    const isSameSubject = (t.subjectNames || []).some(
      (s) => s.toLowerCase() === targetSubject.toLowerCase() || (t.specialty || "").toLowerCase() === targetSubject.toLowerCase()
    );
    const isSameSchoolPoint = t.schoolPointId === targetPointId;

    // Calculate physical travel distance between points
    const candPoint = (data.schoolPoints || []).find((p) => p.id === t.schoolPointId);
    const distanceDiff = Math.abs((targetPoint?.distanceKm || 0) - (candPoint?.distanceKm || 0));

    // Matching Score formula (0-100)
    let score = 0;
    // 1. Subject match: up to 50 pts
    score += isSameSubject ? 50 : 20;

    // 2. Proximity & location match: up to 30 pts
    if (isSameSchoolPoint) {
      score += 30;
    } else {
      score += Math.max(0, 30 - distanceDiff * 2.5);
    }

    // 3. Workload balance: up to 20 pts
    score += Math.max(0, 20 - ((t.weeklyPeriodsCount || 0) > 20 ? 10 : 0));

    const finalScore = Math.min(100, Math.round(score));

    // Logistics & travel advice
    let travelAdvice = "Đang có mặt tại cùng điểm trường, sẵn sàng nhận lớp ngay.";
    if (!isSameSchoolPoint) {
      const travelTimeMinutes = Math.round(distanceDiff * 3 + 10); // ~20km/h mountain speed + 10m prep
      travelAdvice = `Cần di chuyển từ ${t.schoolPointName || "Điểm trường khác"} (${distanceDiff.toFixed(1)} km, ước tính ~${travelTimeMinutes} phút).`;
    }

    let reason = `Đúng chuyên môn ${targetSubject}, `;
    if (isSameSchoolPoint) {
      reason += `đang trực tiếp tại ${targetPointName}, không mất thời gian di chuyển.`;
    } else {
      reason += `khoảng cách di chuyển ${distanceDiff.toFixed(1)} km, lịch dạy hiện tại ${t.weeklyPeriodsCount} tiết/tuần.`;
    }

    return {
      teacherId: t.teacherId,
      teacherName: t.name,
      specialty: t.specialty,
      schoolPointId: t.schoolPointId,
      schoolPointName: t.schoolPointName,
      distanceKm: distanceDiff,
      isSameSubject,
      isSameSchoolPoint,
      weeklyLoad: t.weeklyPeriodsCount,
      matchScore: finalScore,
      travelAdvice,
      reason,
    };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);

  const optimalChoice = scoredCandidates[0] || null;

  let contingencyPlan = "Trong trường hợp không thể bố trí giáo viên dạy thay, đề xuất giáo viên chủ nhiệm hoặc ban giám hiệu quản lý lớp tự học/làm bài tập có phiếu hướng dẫn.";
  if (optimalChoice && !optimalChoice.isSameSchoolPoint) {
    contingencyPlan = `Do giáo viên tối ưu (${optimalChoice.teacherName}) ở điểm trường khác (${optimalChoice.distanceKm.toFixed(1)} km), cần thông báo trước ít nhất 30 phút để kịp di chuyển an toàn.`;
  }

  return {
    absentTeacherId: request.absentTeacherId,
    absentTeacherName: absentTeacher?.name || "Giáo viên vắng",
    classId: request.classId,
    className: "Lớp học",
    subjectName: targetSubject,
    period: request.period,
    date: request.date,
    targetSchoolPointId: targetPointId,
    targetSchoolPointName: targetPointName,
    recommendedCandidates: scoredCandidates.slice(0, 5),
    optimalChoice,
    contingencyPlan,
  };
}

export function evaluateEquipmentTransferAdvice(
  request: { category: EquipmentCategory; targetSchoolPointId: string; neededQuantity: number },
  data: AggregatedSchoolSnapshot
): EquipmentTransferAdviceResult {
  const targetPoint = data.schoolPoints.find((p) => p.id === request.targetSchoolPointId);
  const targetPointName = targetPoint?.name || "Điểm trường đích";

  // Find all equipment matching category located at OTHER points with availableQuantity > 0
  const candidateEquipments = data.equipment.filter(
    (eq) => eq.category === request.category && eq.schoolPointId !== request.targetSchoolPointId && eq.availableQuantity > 0
  );

  if (candidateEquipments.length === 0) {
    return {
      category: request.category,
      targetSchoolPointId: request.targetSchoolPointId,
      targetSchoolPointName: targetPointName,
      neededQuantity: request.neededQuantity,
      availableInSource: 0,
      distanceKm: 0,
      feasibilityScore: 20,
      recommendationText: `Không tìm thấy thiết bị thuộc nhóm "${request.category}" còn dư thừa tại các điểm trường khác. Đề xuất đề nghị Phòng GD&ĐT cấp bổ sung hoặc linh hoạt dùng chung theo thời khóa biểu.`,
      transferSteps: [
        "1. Lập tờ trình đề xuất mua sắm bổ sung thiết bị.",
        "2. Điều chỉnh tạm thời lịch học thực hành luân phiên giữa các lớp.",
      ],
    };
  }

  // Pick source point with closest distance and highest available quantity
  let bestSource = candidateEquipments[0];
  let minDistance = 999;

  for (const eq of candidateEquipments) {
    const srcPoint = data.schoolPoints.find((p) => p.id === eq.schoolPointId);
    const dist = Math.abs((targetPoint?.distanceKm || 0) - (srcPoint?.distanceKm || 0));
    if (dist < minDistance || (dist === minDistance && eq.availableQuantity > bestSource.availableQuantity)) {
      minDistance = dist;
      bestSource = eq;
    }
  }

  const srcPoint = data.schoolPoints.find((p) => p.id === bestSource.schoolPointId);
  const srcPointName = srcPoint?.name || "Điểm trung tâm";
  const feasibility = bestSource.availableQuantity >= request.neededQuantity ? 90 : 70;

  return {
    category: request.category,
    targetSchoolPointId: request.targetSchoolPointId,
    targetSchoolPointName: targetPointName,
    neededQuantity: request.neededQuantity,
    suggestedSourcePointId: bestSource.schoolPointId,
    suggestedSourcePointName: srcPointName,
    availableInSource: bestSource.availableQuantity,
    distanceKm: Number(minDistance.toFixed(1)),
    feasibilityScore: feasibility,
    recommendationText: `Đề xuất điều chuyển ${Math.min(request.neededQuantity, bestSource.availableQuantity)} ${bestSource.unit} "${bestSource.name}" từ ${srcPointName} sang ${targetPointName} (khoảng cách ${minDistance.toFixed(1)} km).`,
    transferSteps: [
      `1. Hiệu trưởng duyệt phiếu điều chuyển nội bộ giữa ${srcPointName} và ${targetPointName}.`,
      `2. Cán bộ thiết bị ${srcPointName} lập biên bản bàn giao kèm kiểm tra tình trạng máy.`,
      `3. Vận chuyển qua tuyến đường liên thôn (${minDistance.toFixed(1)} km), bàn giao cho quản lý điểm trường ${targetPointName}.`,
      "4. Cập nhật mã thiết bị vào sổ tài sản điểm trường trên hệ thống.",
    ],
  };
}
