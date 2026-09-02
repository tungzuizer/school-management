/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/support-staff/page.tsx`.
 * 2. Affected APIs: `src/app/admin/support-staff/actions.ts`.
 * 3. Schemas: Prisma ORM models (`School`, `Campus`, `User`, `Teacher`).
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import {
  type SupportStaffRole,
  type StaffMemberInfo,
  type StaffStandardStatus,
  validateStaffQualification,
  SUPPORT_STAFF_ROLE_LABELS,
} from "@/lib/nq37-engine";

export interface SupportStaffRecord {
  id: string;
  name: string;
  email: string;
  role: SupportStaffRole;
  roleLabel: string;
  isShared: boolean; // Điều 5.1.a (dùng chung) vs Điều 5.1.b (theo phân hiệu)
  campusId: string | null;
  campusName: string;
  degreeName: string;
  isCertified: boolean;
  hasMedicalCertificate: boolean;
  hasAccountingCertificate: boolean;
  isDualRole: boolean;
  dualRoleNotes?: string;
  qualificationStatus: StaffStandardStatus;
  qualificationMessage: string;
}

export interface SupportStaffPageData {
  staffList: SupportStaffRecord[];
  campuses: Array<{ id: string; name: string; isMainCampus: boolean }>;
  schoolName: string;
  totalClasses: number;
}

/**
 * Get all support staff with classification under NQ 37/2026/NQ-CP
 */
export async function getSupportStaffAction(): Promise<SupportStaffPageData> {
  const ctx = await getTenantContext();
  let schoolId = ctx.schoolId;

  if (!schoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!defaultSchool) {
      throw new Error("Không tìm thấy cơ sở giáo dục nào.");
    }
    schoolId = defaultSchool.id;
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      campuses: {
        orderBy: { createdAt: "asc" },
      },
      classRooms: true,
      users: {
        include: {
          teacher: true,
          campus: true,
        },
      },
    },
  });

  if (!school) {
    throw new Error("Không tìm thấy thông tin trường.");
  }

  const campuses = school.campuses.map((c, index) => ({
    id: c.id,
    name: c.name,
    isMainCampus:
      index === 0 ||
      c.name.toLowerCase().includes("chính") ||
      c.name.toLowerCase().includes("trụ sở") ||
      c.name.toLowerCase().includes("lê hồng phong"),
  }));

  const staffList: SupportStaffRecord[] = [];

  school.users.forEach((u) => {
    const spec = (u.teacher?.specialty || "").toLowerCase();
    const degree = (u.teacher?.degree || "").toLowerCase();
    let staffRole: SupportStaffRole | null = null;

    if (spec.includes("kế toán") || u.email.includes("ketoan")) {
      staffRole = "ACCOUNTANT";
    } else if (spec.includes("văn thư") || u.email.includes("vanthu")) {
      staffRole = "CLERK";
    } else if (spec.includes("thủ quỹ") || u.email.includes("thuquy")) {
      staffRole = "TREASURER";
    } else if (spec.includes("thiết bị") || spec.includes("thí nghiệm") || u.email.includes("thietbi")) {
      staffRole = "EQUIPMENT_LAB";
    } else if (spec.includes("thư viện") || u.email.includes("thuvien")) {
      staffRole = "LIBRARY";
    } else if (spec.includes("giáo vụ") || u.email.includes("giaovu")) {
      staffRole = "ACADEMIC_AFFAIRS";
    } else if (spec.includes("tư vấn") || spec.includes("tâm lý") || u.email.includes("tamly")) {
      staffRole = "STUDENT_COUNSELING";
    } else if (spec.includes("khuyết tật") || spec.includes("hỗ trợ gd")) {
      staffRole = "DISABILITY_SUPPORT";
    } else if (spec.includes("cntt") || spec.includes("công nghệ thông tin") || spec.includes("quản trị") || u.email.includes("cntt")) {
      staffRole = "IT_OFFICE_ADMIN";
    } else if (spec.includes("y tế") || spec.includes("điều dưỡng") || u.email.includes("yte")) {
      staffRole = "MEDICAL_HEALTH";
    }

    if (staffRole) {
      const hasMed =
        degree.includes("y") ||
        degree.includes("bác sĩ") ||
        degree.includes("điều dưỡng") ||
        degree.includes("y sĩ");
      const hasAcc =
        degree.includes("kế toán") ||
        degree.includes("tài chính") ||
        degree.includes("kinh tế");

      const isCertified =
        staffRole === "MEDICAL_HEALTH"
          ? hasMed
          : staffRole === "ACCOUNTANT"
          ? hasAcc
          : true;

      const staffInfo: StaffMemberInfo = {
        id: u.id,
        name: u.name,
        role: staffRole,
        campusId: u.campusId,
        campusName: u.campus?.name || "Toàn trường (Dùng chung)",
        degreeName: u.teacher?.degree || "Cử nhân / Chứng chỉ chuyên ngành",
        isCertified,
        hasMedicalCertificate: hasMed,
        hasAccountingCertificate: hasAcc,
      };

      const validation = validateStaffQualification(staffInfo);
      const isShared = ["ACCOUNTANT", "CLERK", "TREASURER"].includes(staffRole);

      staffList.push({
        id: u.id,
        name: u.name,
        email: u.email,
        role: staffRole,
        roleLabel: SUPPORT_STAFF_ROLE_LABELS[staffRole],
        isShared,
        campusId: u.campusId,
        campusName: isShared ? "Toàn trường (Dùng chung)" : u.campus?.name || "Trường chính",
        degreeName: staffInfo.degreeName || "Đang cập nhật",
        isCertified,
        hasMedicalCertificate: hasMed,
        hasAccountingCertificate: hasAcc,
        isDualRole: spec.includes("kiêm") || !!u.campusId,
        dualRoleNotes: spec.includes("kiêm") ? "Kiêm nhiệm hỗ trợ phân hiệu" : undefined,
        qualificationStatus: validation.status,
        qualificationMessage: validation.message,
      });
    }
  });

  return {
    staffList,
    campuses,
    schoolName: school.name,
    totalClasses: school.classRooms.length || 30,
  };
}

/**
 * Assign / Update support staff role and qualifications under NQ 37/2026/NQ-CP
 */
export async function updateSupportStaffAssignmentAction(params: {
  userId: string;
  role: SupportStaffRole;
  campusId?: string | null;
  degree: string;
  hasMedicalCertificate: boolean;
  hasAccountingCertificate: boolean;
  dualRoleNotes?: string;
}) {
  const ctx = await getTenantContext();
  if (ctx.userRole !== "ADMIN" && ctx.userRole !== "SUPER_ADMIN") {
    throw new Error("Chỉ Ban Giám hiệu mới có quyền phân công nhân sự.");
  }

  // Pre-validate critical qualifications (Điều 5.3.b & Điều 5.3.c)
  if (params.role === "MEDICAL_HEALTH" && !params.hasMedicalCertificate) {
    throw new Error(
      "CẢNH BÁO ĐỎ (Điều 5.3.b NQ 37/2026/NQ-CP): Tuyệt đối không được bố trí nhân sự vào vị trí Y tế trường học nếu chưa có chứng chỉ/bằng cấp chuyên môn y tế."
    );
  }

  if (params.role === "ACCOUNTANT" && !params.hasAccountingCertificate) {
    throw new Error(
      "CẢNH BÁO ĐỎ (Điều 5.3.c NQ 37/2026/NQ-CP): Tuyệt đối không được bố trí nhân sự vào vị trí Kế toán nếu chưa có văn bằng/chứng chỉ chuyên ngành kế toán, tài chính."
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { teacher: true },
  });

  if (!user) {
    throw new Error("Không tìm thấy nhân sự.");
  }

  const specialtyText = `${SUPPORT_STAFF_ROLE_LABELS[params.role]}${
    params.dualRoleNotes ? ` (${params.dualRoleNotes})` : ""
  }`;

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      campusId: params.campusId || null,
    },
  });

  if (user.teacher) {
    await prisma.teacher.update({
      where: { id: user.teacher.id },
      data: {
        specialty: specialtyText,
        degree: params.degree,
      },
    });
  }

  revalidatePath("/admin/support-staff");
  revalidatePath("/admin/nq37-compliance");

  return {
    success: true,
    message: "Cập nhật phân công và hồ sơ chuyên môn nhân sự thành công.",
  };
}
