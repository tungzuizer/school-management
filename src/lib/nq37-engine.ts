/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/nq37-compliance/actions.ts`, `src/app/admin/support-staff/actions.ts`, `src/app/admin/dashboard/actions.ts`, `src/lib/__tests__/nq37-compliance.test.ts`.
 * 2. Affected APIs: `src/lib/nq37-engine.ts`.
 * 3. Schemas: Prisma ORM models (`School`, `Campus`, `User`, `Teacher`).
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

/**
 * NQ 37/2026/NQ-CP Governance & Quota Calculation Engine
 * Căn cứ: Nghị quyết số 37/2026/NQ-CP ngày 05/08/2026 của Chính phủ
 * Hiệu lực: Từ 05/08/2026 đến hết 30/06/2028
 * Hạn chót sắp xếp: Trước ngày 30/09/2026 (Điều 8)
 * Thời hạn chuyển tiếp chuẩn hóa: 36 tháng kể từ 05/08/2026 (Điều 5.3.a)
 */

export const NQ37_CONSTANTS = {
  RESOLUTION_NUMBER: "37/2026/NQ-CP",
  ISSUED_DATE: "2026-08-05",
  EFFECTIVE_DATE: "2026-08-05",
  EXPIRY_DATE: "2028-06-30",
  ARRANGEMENT_DEADLINE: "2026-09-30", // Điều 8: Hoàn thành bố trí trước 30/09/2026
  STANDARDIZATION_DEADLINE_36M: "2029-08-05", // Điều 5.3.a: 36 tháng
  RELATED_DECREES: {
    SALARY_ALLOWANCE_RETENTION: "Nghị định số 178/2024/NĐ-CP (sửa đổi bởi NĐ 67/2025/NĐ-CP)",
    STAFF_DOWNSIZING: "Nghị định số 154/2025/NĐ-CP",
  },
};

export type SupportStaffRole =
  // Nhóm dùng chung toàn trường (Điều 5.1.a)
  | "ACCOUNTANT" // Kế toán
  | "CLERK" // Văn thư
  | "TREASURER" // Thủ quỹ
  // Nhóm bố trí riêng cho trường chính và từng phân hiệu (Điều 5.1.b)
  | "EQUIPMENT_LAB" // Thiết bị, thí nghiệm
  | "LIBRARY" // Thư viện
  | "ACADEMIC_AFFAIRS" // Giáo vụ
  | "STUDENT_COUNSELING" // Tư vấn học sinh
  | "DISABILITY_SUPPORT" // Hỗ trợ giáo dục người khuyết tật
  | "IT_OFFICE_ADMIN" // Công nghệ thông tin (hoặc quản trị công sở)
  | "MEDICAL_HEALTH"; // Y tế trường học

export const SUPPORT_STAFF_ROLE_LABELS: Record<SupportStaffRole, string> = {
  ACCOUNTANT: "Kế toán",
  CLERK: "Văn thư",
  TREASURER: "Thủ quỹ",
  EQUIPMENT_LAB: "Thiết bị, thí nghiệm",
  LIBRARY: "Thư viện",
  ACADEMIC_AFFAIRS: "Giáo vụ",
  STUDENT_COUNSELING: "Tư vấn học sinh (Tâm lý học đường)",
  DISABILITY_SUPPORT: "Hỗ trợ GD người khuyết tật",
  IT_OFFICE_ADMIN: "CNTT / Quản trị công sở",
  MEDICAL_HEALTH: "Y tế trường học",
};

export type StaffStandardStatus =
  | "QUALIFIED" // Đạt chuẩn chức danh nghề nghiệp
  | "IN_TRAINING_36M" // Đang trong lộ trình bồi dưỡng 36 tháng
  | "UNQUALIFIED_BLOCKED" // Không đạt chuẩn - Nghiêm cấm bố trí (Kế toán, Y tế)
  | "NEEDS_DOWNSIZING"; // Đề xuất tinh giản biên chế (NĐ 154)

export interface LeadershipAuditInput {
  principalCount: number;
  mainCampusViceCount: number;
  branchCampusViceCount: number;
  branchCampusesTotal: number;
}

export interface SharedStaffAuditInput {
  totalClasses: number;
  isBoardingOrDayBoarding: boolean;
  actualAccountants: number;
  actualClerks: number;
  actualTreasurers: number;
}

export interface CampusStaffAuditInput {
  campusId: string;
  campusName: string;
  isMainCampus: boolean;
  staffCounts: Record<SupportStaffRole, number>;
}

export interface StaffMemberInfo {
  id: string;
  name: string;
  role: SupportStaffRole;
  campusId?: string | null;
  campusName?: string;
  degreeName?: string;
  hasMedicalCertificate?: boolean;
  hasAccountingCertificate?: boolean;
  hasPedagogicalCertificate?: boolean; // Nghiệp vụ sư phạm
  isCertified: boolean;
  trainingStartDate?: string;
  salaryAllowanceRetained?: boolean; // Bảo lưu phụ cấp chức vụ NĐ 178
}

export interface ComplianceScorecard {
  schoolId: string;
  schoolName: string;
  overallScore: number; // 0 - 100
  status: "COMPLIANT" | "WARNING" | "CRITICAL_VIOLATION";
  arrangementDeadlineDaysLeft: number;
  standardizationMonthsLeft: number;
  leadershipAudit: {
    principalQuota: number;
    principalActual: number;
    vicePrincipalQuota: number;
    vicePrincipalActual: number;
    isCompliant: boolean;
    excessVicePrincipals: number;
    deficitVicePrincipals: number;
    notes: string[];
  };
  sharedStaffAudit: {
    accountantQuota: number;
    accountantActual: number;
    clerkQuota: number;
    clerkActual: number;
    treasurerQuota: number;
    treasurerActual: number;
    isCompliant: boolean;
    notes: string[];
  };
  campusStaffAudits: Array<{
    campusId: string;
    campusName: string;
    isMainCampus: boolean;
    quotaPerRole: Record<SupportStaffRole, number>;
    actualPerRole: Record<SupportStaffRole, number>;
    isCompliant: boolean;
    violations: string[];
  }>;
  criticalViolations: string[];
  actionRecommendations: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    legalBasis: string;
  }>;
}

/**
 * 1. Calculate Leadership Quota according to Article 4
 */
export function calculateLeadershipQuota(branchCampusesCount: number) {
  const principalQuota = 1;
  const mainCampusViceQuota = 1;
  const branchCampusesViceQuota = Math.max(0, branchCampusesCount);
  const totalViceQuota = mainCampusViceQuota + branchCampusesViceQuota;

  return {
    principalQuota,
    mainCampusViceQuota,
    branchCampusesViceQuota,
    totalViceQuota,
    totalLeadershipQuota: principalQuota + totalViceQuota,
  };
}

/**
 * 2. Calculate Shared Staff Quota according to Article 5.1.a
 */
export function calculateSharedStaffQuota(
  totalClasses: number,
  isBoardingOrDayBoarding: boolean
) {
  // Điểm a Khoản 1 Điều 5: Kế toán tối đa 02 người nếu trường nội trú/bán trú quy mô từ 40 lớp trở lên
  const accountantQuota = isBoardingOrDayBoarding && totalClasses >= 40 ? 2 : 1;
  const clerkQuota = 1;
  const treasurerQuota = 1;

  return {
    accountantQuota,
    clerkQuota,
    treasurerQuota,
    totalSharedQuota: accountantQuota + clerkQuota + treasurerQuota,
  };
}

/**
 * 3. Calculate Campus Specific Staff Quota according to Article 5.1.b
 */
export function calculateCampusStaffQuota() {
  const quotaPerRole: Record<SupportStaffRole, number> = {
    ACCOUNTANT: 0, // Dùng chung
    CLERK: 0, // Dùng chung
    TREASURER: 0, // Dùng chung
    EQUIPMENT_LAB: 1, // 1 người/cơ sở
    LIBRARY: 1, // 1 người/cơ sở
    ACADEMIC_AFFAIRS: 1, // 1 người/cơ sở
    STUDENT_COUNSELING: 1, // 1 người/cơ sở
    DISABILITY_SUPPORT: 1, // 1 người/cơ sở
    IT_OFFICE_ADMIN: 1, // 1 người/cơ sở
    MEDICAL_HEALTH: 1, // 1 người/cơ sở
  };

  const totalPerCampus =
    quotaPerRole.EQUIPMENT_LAB +
    quotaPerRole.LIBRARY +
    quotaPerRole.ACADEMIC_AFFAIRS +
    quotaPerRole.STUDENT_COUNSELING +
    quotaPerRole.DISABILITY_SUPPORT +
    quotaPerRole.IT_OFFICE_ADMIN +
    quotaPerRole.MEDICAL_HEALTH;

  return {
    quotaPerRole,
    totalPerCampus,
  };
}

/**
 * 4. Validate Individual Staff Qualifications (Conditions in Article 5.3)
 */
export function validateStaffQualification(
  staff: StaffMemberInfo
): {
  status: StaffStandardStatus;
  isBlocked: boolean;
  message: string;
} {
  // Điều 5.3.c: Tuyệt đối không bố trí vào vị trí Kế toán nếu không đủ tiêu chuẩn
  if (staff.role === "ACCOUNTANT") {
    if (!staff.hasAccountingCertificate && !staff.isCertified) {
      return {
        status: "UNQUALIFIED_BLOCKED",
        isBlocked: true,
        message:
          "CẢNH BÁO ĐỎ (Điều 5.3.c NQ 37): Không được bố trí vào vị trí Kế toán do chưa đáp ứng tiêu chuẩn/chứng chỉ chuyên môn tài chính - kế toán.",
      };
    }
  }

  // Điều 5.3.b: Tuyệt đối không bố trí vào vị trí Y tế trường học nếu không đáp ứng tiêu chuẩn
  if (staff.role === "MEDICAL_HEALTH") {
    if (!staff.hasMedicalCertificate && !staff.isCertified) {
      return {
        status: "UNQUALIFIED_BLOCKED",
        isBlocked: true,
        message:
          "CẢNH BÁO ĐỎ (Điều 5.3.b NQ 37): Không được bố trí vào vị trí Y tế trường học do chưa có bằng cấp/chứng chỉ chuyên ngành y tế/điều dưỡng.",
      };
    }
  }

  if (staff.isCertified) {
    return {
      status: "QUALIFIED",
      isBlocked: false,
      message: "Đạt chuẩn chức danh nghề nghiệp theo vị trí việc làm.",
    };
  }

  // Điều 5.3.a: Thời hạn 36 tháng để hoàn thiện tiêu chuẩn đào tạo
  return {
    status: "IN_TRAINING_36M",
    isBlocked: false,
    message:
      "Đang trong thời hạn chuyển tiếp 36 tháng bồi dưỡng chuẩn hóa chuyên môn (hạn cuối 05/08/2029).",
  };
}

/**
 * 5. Calculate Countdown Days & Months
 */
export function calculateDeadlines(now: Date = new Date()) {
  const arrangementDate = new Date("2026-09-30T23:59:59Z");
  const standardizationDate = new Date("2029-08-05T23:59:59Z");

  const diffMsArrangement = arrangementDate.getTime() - now.getTime();
  const arrangementDaysLeft = Math.max(
    0,
    Math.ceil(diffMsArrangement / (1000 * 60 * 60 * 24))
  );

  const diffMsStandardization = standardizationDate.getTime() - now.getTime();
  const standardizationMonthsLeft = Math.max(
    0,
    Math.round(diffMsStandardization / (1000 * 60 * 60 * 24 * 30.4375))
  );

  return {
    arrangementDaysLeft,
    standardizationMonthsLeft,
    arrangementDeadlineStr: "30/09/2026",
    standardizationDeadlineStr: "05/08/2029",
  };
}

/**
 * 6. Audit Full School Compliance against NQ 37/2026/NQ-CP
 */
export function auditSchoolNQ37(params: {
  schoolId: string;
  schoolName: string;
  totalClasses: number;
  isBoardingOrDayBoarding: boolean;
  principalCount: number;
  mainCampusViceCount: number;
  branchCampusViceCount: number;
  campuses: Array<{
    id: string;
    name: string;
    isMainCampus: boolean;
    staff: StaffMemberInfo[];
  }>;
  now?: Date;
}): ComplianceScorecard {
  const now = params.now || new Date();
  const deadlines = calculateDeadlines(now);

  const branchCampuses = params.campuses.filter((c) => !c.isMainCampus);
  const leadershipQuota = calculateLeadershipQuota(branchCampuses.length);
  const sharedQuota = calculateSharedStaffQuota(
    params.totalClasses,
    params.isBoardingOrDayBoarding
  );
  const campusStaffQuota = calculateCampusStaffQuota();

  const criticalViolations: string[] = [];
  const actionRecommendations: ComplianceScorecard["actionRecommendations"] = [];

  // 1. Audit Leadership (Điều 4)
  const totalActualVice =
    params.mainCampusViceCount + params.branchCampusViceCount;
  const excessVice = Math.max(
    0,
    totalActualVice - leadershipQuota.totalViceQuota
  );
  const deficitVice = Math.max(
    0,
    leadershipQuota.totalViceQuota - totalActualVice
  );

  const leadershipNotes: string[] = [];
  let leadershipCompliant = true;

  if (params.principalCount !== 1) {
    leadershipCompliant = false;
    leadershipNotes.push(
      `Cơ sở giáo dục hiện có ${params.principalCount} Hiệu trưởng (Quy định: duy nhất 01 Hiệu trưởng).`
    );
    criticalViolations.push(
      "Thừa Hiệu trưởng sau sáp nhập - Cần hoàn tất kiện toàn duy nhất 01 Hiệu trưởng."
    );
  }

  if (params.mainCampusViceCount > 1) {
    leadershipCompliant = false;
    leadershipNotes.push(
      `Trường chính có ${params.mainCampusViceCount} Phó Hiệu trưởng (Vượt định mức 01 người).`
    );
  }

  if (params.branchCampusViceCount > branchCampuses.length) {
    leadershipCompliant = false;
    leadershipNotes.push(
      `Các phân hiệu có ${params.branchCampusViceCount} Phó Hiệu trưởng (Định mức tối đa: 01 người/phân hiệu).`
    );
  }

  if (excessVice > 0) {
    actionRecommendations.push({
      priority: "HIGH",
      title: "Phương án bố trí Phó Hiệu trưởng dôi dư",
      description: `Bố trí ${excessVice} Phó Hiệu trưởng dôi dư sang vị trí việc làm giáo viên hoặc kiêm nhiệm; thực hiện bảo lưu phụ cấp chức vụ lãnh đạo theo Điều 11 Nghị định 178/2024/NĐ-CP hoặc giải quyết tinh giản biên chế theo NĐ 154/2025 nếu có nguyện vọng.`,
      legalBasis: "Điều 4 Khoản 3, 4 Nghị quyết 37/2026/NQ-CP",
    });
  }

  // 2. Audit Shared Staff (Điều 5.1.a)
  const allStaff = params.campuses.flatMap((c) => c.staff);
  const actualAccountants = allStaff.filter(
    (s) => s.role === "ACCOUNTANT"
  ).length;
  const actualClerks = allStaff.filter((s) => s.role === "CLERK").length;
  const actualTreasurers = allStaff.filter(
    (s) => s.role === "TREASURER"
  ).length;

  const sharedNotes: string[] = [];
  let sharedCompliant = true;

  if (actualAccountants > sharedQuota.accountantQuota) {
    sharedCompliant = false;
    sharedNotes.push(
      `Vị trí Kế toán dùng chung: ${actualAccountants} người (Định mức: ${sharedQuota.accountantQuota} người).`
    );
  } else if (actualAccountants < 1) {
    sharedCompliant = false;
    sharedNotes.push("Chưa bố trí vị trí Kế toán dùng chung.");
  }

  if (actualClerks > sharedQuota.clerkQuota) {
    sharedCompliant = false;
    sharedNotes.push(
      `Vị trí Văn thư dùng chung: ${actualClerks} người (Định mức: 1 người).`
    );
  }

  if (actualTreasurers > sharedQuota.treasurerQuota) {
    sharedCompliant = false;
    sharedNotes.push(
      `Vị trí Thủ quỹ dùng chung: ${actualTreasurers} người (Định mức: 1 người).`
    );
  }

  // 3. Audit Campus-specific Staff & Certificates (Điều 5.1.b & Điều 5.3)
  const campusStaffAudits: ComplianceScorecard["campusStaffAudits"] = [];

  for (const campus of params.campuses) {
    const campusViolations: string[] = [];
    const actualPerRole: Record<SupportStaffRole, number> = {
      ACCOUNTANT: 0,
      CLERK: 0,
      TREASURER: 0,
      EQUIPMENT_LAB: 0,
      LIBRARY: 0,
      ACADEMIC_AFFAIRS: 0,
      STUDENT_COUNSELING: 0,
      DISABILITY_SUPPORT: 0,
      IT_OFFICE_ADMIN: 0,
      MEDICAL_HEALTH: 0,
    };

    for (const staff of campus.staff) {
      if (actualPerRole[staff.role] !== undefined) {
        actualPerRole[staff.role]++;
      }

      // Validate certificate restrictions
      const valResult = validateStaffQualification(staff);
      if (valResult.isBlocked) {
        campusViolations.push(
          `[${staff.name} - ${staff.role}] ${valResult.message}`
        );
        criticalViolations.push(
          `Tại ${campus.name}: ${staff.name} vi phạm tiêu chuẩn vị trí ${staff.role}.`
        );
      }
    }

    // Check specific positions per campus
    const rolesToCheck: SupportStaffRole[] = [
      "EQUIPMENT_LAB",
      "LIBRARY",
      "ACADEMIC_AFFAIRS",
      "STUDENT_COUNSELING",
      "DISABILITY_SUPPORT",
      "IT_OFFICE_ADMIN",
      "MEDICAL_HEALTH",
    ];

    for (const r of rolesToCheck) {
      if (actualPerRole[r] > 1) {
        campusViolations.push(
          `Vị trí ${r} có ${actualPerRole[r]} người (Vượt định mức 01 người/cơ sở).`
        );
      }
    }

    campusStaffAudits.push({
      campusId: campus.id,
      campusName: campus.name,
      isMainCampus: campus.isMainCampus,
      quotaPerRole: campusStaffQuota.quotaPerRole,
      actualPerRole,
      isCompliant: campusViolations.length === 0,
      violations: campusViolations,
    });
  }

  // Check 36-month training transition staff
  const staffInTraining = allStaff.filter(
    (s) =>
      validateStaffQualification(s).status === "IN_TRAINING_36M"
  );
  if (staffInTraining.length > 0) {
    actionRecommendations.push({
      priority: "MEDIUM",
      title: "Lập kế hoạch đào tạo, bồi dưỡng chuẩn hóa 36 tháng",
      description: `Có ${staffInTraining.length} nhân sự hỗ trợ giáo dục đang trong lộ trình hoàn thiện chuẩn đào tạo nghề nghiệp. Đề nghị lập danh sách trình UBND cấp tỉnh/Sở GD&ĐT bố trí kinh phí đào tạo theo quy định.`,
      legalBasis: "Điều 5 Khoản 3.a & Điều 6 Khoản 3.b Nghị quyết 37/2026/NQ-CP",
    });
  }

  // Calculate Overall Compliance Score
  let score = 100;
  if (!leadershipCompliant) score -= 25;
  if (!sharedCompliant) score -= 20;
  if (criticalViolations.length > 0) score -= criticalViolations.length * 20;

  const nonCompliantCampuses = campusStaffAudits.filter((c) => !c.isCompliant);
  score -= nonCompliantCampuses.length * 10;
  score = Math.max(0, Math.min(100, score));

  let status: ComplianceScorecard["status"] = "COMPLIANT";
  if (criticalViolations.length > 0) {
    status = "CRITICAL_VIOLATION";
  } else if (score < 90) {
    status = "WARNING";
  }

  return {
    schoolId: params.schoolId,
    schoolName: params.schoolName,
    overallScore: score,
    status,
    arrangementDeadlineDaysLeft: deadlines.arrangementDaysLeft,
    standardizationMonthsLeft: deadlines.standardizationMonthsLeft,
    leadershipAudit: {
      principalQuota: leadershipQuota.principalQuota,
      principalActual: params.principalCount,
      vicePrincipalQuota: leadershipQuota.totalViceQuota,
      vicePrincipalActual: totalActualVice,
      isCompliant: leadershipCompliant,
      excessVicePrincipals: excessVice,
      deficitVicePrincipals: deficitVice,
      notes: leadershipNotes,
    },
    sharedStaffAudit: {
      accountantQuota: sharedQuota.accountantQuota,
      accountantActual: actualAccountants,
      clerkQuota: sharedQuota.clerkQuota,
      clerkActual: actualClerks,
      treasurerQuota: sharedQuota.treasurerQuota,
      treasurerActual: actualTreasurers,
      isCompliant: sharedCompliant,
      notes: sharedNotes,
    },
    campusStaffAudits,
    criticalViolations,
    actionRecommendations,
  };
}
