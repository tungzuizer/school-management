import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Tenant context extracted from the current user's session.
 * Used to automatically scope database queries to the user's organization.
 */
export interface TenantContext {
  userId: string;
  userName: string;
  userRole: string;
  userEmail?: string;
  departmentId?: string;   // Sở GD&ĐT
  districtWardId?: string; // Phòng GD&ĐT
  schoolId?: string;       // Trường
  campusId?: string;       // Phân hiệu / Cơ sở
}

/**
 * Retrieves the current user's Tenant Context from NextAuth Session.
 * Throws an error if the user is not authenticated.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
  }

  return {
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    userRole: session.user.role || "STUDENT",
    userEmail: session.user.email || "",
    departmentId: session.user.departmentId,
    districtWardId: session.user.districtWardId,
    schoolId: session.user.schoolId,
    campusId: session.user.campusId,
  };
}

/**
 * Returns the standard Row-Level Security filter (Prisma `where` object)
 * based on the current user's role and scope.
 *
 * Hierarchy:
 *   - SUPER_ADMIN / superadmin@school.com / null schoolId admin: nationwide access ({})
 *   - DEPARTMENT_ADMIN: accesses all schools under their departmentId
 *   - WARD_ADMIN: accesses all schools under their districtWardId
 *   - ADMIN / VICE_PRINCIPAL: accesses only their own schoolId
 *   - TEACHER / STUDENT: accesses only their own schoolId (further narrowed by classId etc.)
 */
export function buildSchoolFilter(ctx: TenantContext): Record<string, any> {
  const isSuperAdmin =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userRole === "SUPER_ADMIN" ||
    (ctx.userRole === "DEPARTMENT_ADMIN" && !ctx.departmentId) ||
    (!ctx.schoolId && (ctx.userRole === "ADMIN" || ctx.userRole === "WARD_ADMIN" || ctx.userRole === "DEPARTMENT_ADMIN"));

  if (isSuperAdmin) {
    return {};
  }

  const role = ctx.userRole;

  if (role === "DEPARTMENT_ADMIN" && ctx.departmentId) {
    return { school: { departmentId: ctx.departmentId } };
  }

  if (role === "WARD_ADMIN" && ctx.districtWardId) {
    return { school: { districtWardId: ctx.districtWardId } };
  }

  if (ctx.schoolId) {
    return { schoolId: ctx.schoolId };
  }

  return {};
}

/**
 * Similar to buildSchoolFilter but for queries on the School model itself.
 */
export function buildSchoolDirectFilter(ctx: TenantContext): Record<string, any> {
  const isSuperAdmin =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userRole === "SUPER_ADMIN" ||
    (ctx.userRole === "DEPARTMENT_ADMIN" && !ctx.departmentId) ||
    (!ctx.schoolId && (ctx.userRole === "ADMIN" || ctx.userRole === "WARD_ADMIN" || ctx.userRole === "DEPARTMENT_ADMIN"));

  if (isSuperAdmin) {
    return {};
  }

  const role = ctx.userRole;

  if (role === "DEPARTMENT_ADMIN" && ctx.departmentId) {
    return { departmentId: ctx.departmentId };
  }

  if (role === "WARD_ADMIN" && ctx.districtWardId) {
    return { districtWardId: ctx.districtWardId };
  }

  if (ctx.schoolId) {
    return { id: ctx.schoolId };
  }

  return {};
}

/**
 * Returns a campus-level filter when the user is scoped to a specific campus.
 */
export function buildCampusFilter(ctx: TenantContext): Record<string, any> | undefined {
  if (ctx.campusId) {
    return { campusId: ctx.campusId };
  }
  return undefined;
}
