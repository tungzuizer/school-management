import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export interface TenantContext {
  userId: string;
  userName: string;
  userRole: string;
  userEmail?: string;
  isApproved?: boolean;
  departmentId?: string;    // So GD&DT
  districtWardId?: string;  // Phong GD&DT (DISTRICT_ADMIN)
  schoolId?: string;        // Truong
  campusId?: string;        // Phan hieu / Co so (VICE_PRINCIPAL scope)
}

export async function getTenantContext(): Promise<TenantContext> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Phien dang nhap khong hop le. Vui long dang nhap lai.");
  }

  return {
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    userRole: session.user.role || "STUDENT",
    userEmail: session.user.email || "",
    isApproved: session.user.isApproved ?? true,
    departmentId: session.user.departmentId,
    districtWardId: session.user.districtWardId,
    schoolId: session.user.schoolId,
    campusId: session.user.campusId,
  };
}

/**
 * Returns a Prisma `where` clause scoping queries to the user's school.
 *
 * Hierarchy:
 *   SUPER_ADMIN            → {} (all schools; but caller should block academic detail)
 *   UNAPPROVED USER        → { schoolId: "unapproved-no-access-000" } (empty result)
 *   DEPARTMENT_ADMIN       → { school: { departmentId } }
 *   DISTRICT_ADMIN         → { school: { districtWardId } }
 *   WARD_ADMIN             → {} (ward scope is geographic, enforced via CampusWardMap separately)
 *   ADMIN / VICE_PRINCIPAL → { schoolId }
 *   SUBJECT_HEAD / TEACHER / STUDENT → { schoolId }
 */
export function buildSchoolFilter(ctx: TenantContext): Record<string, any> {
  if (ctx.isApproved === false) {
    return { schoolId: "unapproved-no-access-000" };
  }

  const isSuperAdmin =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userEmail === "sysadmin@so-gddt.gov.vn" ||
    ctx.userRole === "SUPER_ADMIN";

  if (isSuperAdmin) return {};

  const role = ctx.userRole;

  if (role === "DEPARTMENT_ADMIN" && ctx.departmentId) {
    return { school: { departmentId: ctx.departmentId } };
  }

  if (role === "DISTRICT_ADMIN" && ctx.districtWardId) {
    return { school: { districtWardId: ctx.districtWardId } };
  }

  if (ctx.schoolId) return { schoolId: ctx.schoolId };

  return {};
}

/**
 * Returns a Prisma `where` clause scoping queries directly on the School model.
 */
export function buildSchoolDirectFilter(ctx: TenantContext): Record<string, any> {
  if (ctx.isApproved === false) {
    return { id: "unapproved-no-access-000" };
  }

  const isSuperAdmin =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userEmail === "sysadmin@so-gddt.gov.vn" ||
    ctx.userRole === "SUPER_ADMIN";

  if (isSuperAdmin) return {};

  const role = ctx.userRole;

  if (role === "DEPARTMENT_ADMIN" && ctx.departmentId) {
    return { departmentId: ctx.departmentId };
  }

  if (role === "DISTRICT_ADMIN" && ctx.districtWardId) {
    return { districtWardId: ctx.districtWardId };
  }

  if (ctx.schoolId) return { id: ctx.schoolId };

  return {};
}

/**
 * Returns a campus-level filter.
 * For VICE_PRINCIPAL this is enforced — they can only see their own campus.
 * For ADMIN / SUPER_ADMIN this returns undefined (no restriction).
 */
export function buildCampusFilter(ctx: TenantContext): Record<string, any> | undefined {
  if (ctx.userRole === "VICE_PRINCIPAL" && ctx.campusId) {
    return { campusId: ctx.campusId };
  }
  // ADMIN and above: no campus restriction
  return undefined;
}

/**
 * Guard: throws 403 if a VICE_PRINCIPAL tries to access data belonging to
 * a different campus. Call this in any Server Action that receives a campusId
 * parameter from the client.
 *
 * Usage in actions:
 *   const ctx = await getTenantContext();
 *   assertCampusAccess(ctx, input.campusId);
 */
export function assertCampusAccess(ctx: TenantContext, targetCampusId: string | null | undefined): void {
  if (ctx.userRole !== "VICE_PRINCIPAL") return; // only PHT is campus-scoped
  if (!ctx.campusId) {
    throw new Error("Tai khoan Pho Hieu truong chua duoc gan phan hieu. Lien he quan tri vien.");
  }
  if (targetCampusId && targetCampusId !== ctx.campusId) {
    throw new Error("Khong co quyen truy cap du lieu phan hieu nay. (403)");
  }
}

/**
 * Guard: throws 403 if a SUBJECT_HEAD tries to manage a subject group they're
 * not assigned to. Pass the subjectGroupId being accessed.
 *
 * Usage:
 *   const scopes = await prisma.userRoleScope.findMany({ where: { userId: ctx.userId, role: "SUBJECT_HEAD" } });
 *   assertSubjectGroupAccess(ctx, scopes, input.subjectGroupId);
 */
export function assertSubjectGroupAccess(
  ctx: TenantContext,
  allowedSubjectGroupIds: string[],
  targetSubjectGroupId: string | null | undefined
): void {
  if (ctx.userRole !== "SUBJECT_HEAD") return;
  if (!targetSubjectGroupId) return;
  if (!allowedSubjectGroupIds.includes(targetSubjectGroupId)) {
    throw new Error("Khong co quyen quan ly to chuyen mon nay. (403)");
  }
}

/**
 * Returns the campus IDs that a WARD_ADMIN (commune officer) can see,
 * by looking up CampusWardMap for their ward.
 * Returns undefined for roles that don't use ward-based filtering.
 */
export async function getWardAllowedCampusIds(
  ctx: TenantContext
): Promise<string[] | undefined> {
  if (ctx.userRole !== "WARD_ADMIN" || !ctx.districtWardId) return undefined;

  // Import prisma here to avoid circular deps at module load
  const { default: prisma } = await import("./prisma");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maps = await (prisma as any).campusWardMap.findMany({
    where: { wardId: ctx.districtWardId },
    select: { campusId: true },
  });
  return (maps as { campusId: string }[]).map((m) => m.campusId);
}

/**
 * Guard: throws 403 if a SUPER_ADMIN tries to access academic detail data.
 * System Admin sees only aggregate/infrastructure data, not individual records.
 */
export function assertNotSuperAdminOnAcademicDetail(ctx: TenantContext): void {
  const isSuperAdmin =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userEmail === "sysadmin@so-gddt.gov.vn" ||
    ctx.userRole === "SUPER_ADMIN";

  if (isSuperAdmin) {
    throw new Error("Quan tri vien he thong khong duoc xem du lieu hoc vu chi tiet. (403)");
  }
}