/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Role Scopes and RBAC Matrix (`src/app/admin/role-scopes/page.tsx`, `src/app/admin/role-scopes/RoleScopesClient.tsx`).
 * 2. Affected APIs: Server actions `getRoleScopesData`, `createUserRoleScope`, `deleteUserRoleScope`.
 * 3. Schemas: Prisma models `UserRoleScope`, `User`, `Campus`, `DistrictWard`, `SubjectGroup`, `School`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Xây dựng trang Ma trận Phân quyền & Quản trị Scope (/admin/role-scopes).
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, ScopeType } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface UserScopeItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  scopeType: ScopeType;
  scopeId: string | null;
  scopeTargetName: string;
  subjectGroupId: string | null;
  subjectGroupName: string | null;
  schoolName: string;
  createdAt: string;
}

export interface ScopeLookupUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId: string | null;
  schoolName: string;
}

export interface ScopeLookupCampus {
  id: string;
  name: string;
  schoolName: string;
}

export interface ScopeLookupWard {
  id: string;
  name: string;
  departmentName: string;
}

export interface ScopeLookupSubjectGroup {
  id: string;
  name: string;
  schoolName: string;
}

export async function getRoleScopesData(filters?: {
  role?: string;
  scopeType?: string;
  search?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập hệ thống",
        scopes: [],
        users: [],
        campuses: [],
        wards: [],
        subjectGroups: [],
        stats: null,
      };
    }

    const where: any = {};
    if (filters?.role && filters.role !== "ALL") {
      where.role = filters.role as Role;
    }
    if (filters?.scopeType && filters.scopeType !== "ALL") {
      where.scopeType = filters.scopeType as ScopeType;
    }

    const [rawScopes, rawUsers, rawCampuses, rawWards, rawSubjectGroups] = await Promise.all([
      prisma.userRoleScope.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              school: { select: { name: true } },
            },
          },
          subjectGroup: {
            select: { id: true, name: true, school: { select: { name: true } } },
          },
        },
        orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      }),
      prisma.user.findMany({
        where: {
          role: {
            in: [
              Role.VICE_PRINCIPAL,
              Role.SUBJECT_HEAD,
              Role.WARD_ADMIN,
              Role.DISTRICT_ADMIN,
              Role.ADMIN,
              Role.TEACHER,
            ],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          schoolId: true,
          school: { select: { name: true } },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
      prisma.campus.findMany({
        select: {
          id: true,
          name: true,
          school: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.districtWard.findMany({
        select: {
          id: true,
          name: true,
          department: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.subjectGroup.findMany({
        select: {
          id: true,
          name: true,
          school: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Create fast lookup maps for scopeTargetName resolution
    const campusMap = new Map<string, string>();
    rawCampuses.forEach((c) => campusMap.set(c.id, `${c.name} (${c.school?.name || "Trường"})`));

    const wardMap = new Map<string, string>();
    rawWards.forEach((w) => wardMap.set(w.id, `${w.name} - ${w.department?.name || "Sở GD&ĐT"}`));

    const scopes: UserScopeItem[] = rawScopes.map((s) => {
      let targetName = "Toàn cục (Global)";
      if (s.scopeType === ScopeType.CAMPUS && s.scopeId) {
        targetName = campusMap.get(s.scopeId) || `Cơ sở ID: ${s.scopeId}`;
      } else if (s.scopeType === ScopeType.WARD && s.scopeId) {
        targetName = wardMap.get(s.scopeId) || `Khu vực ID: ${s.scopeId}`;
      } else if (s.scopeType === ScopeType.SUBJECT_GROUP) {
        targetName = s.subjectGroup
          ? `Tổ: ${s.subjectGroup.name} (${s.subjectGroup.school?.name || "Trường"})`
          : "Tổ chuyên môn liên cơ sở";
      }

      return {
        id: s.id,
        userId: s.userId,
        userName: s.user?.name || "Không rõ",
        userEmail: s.user?.email || "Chưa có email",
        role: s.role,
        scopeType: s.scopeType,
        scopeId: s.scopeId,
        scopeTargetName: targetName,
        subjectGroupId: s.subjectGroupId,
        subjectGroupName: s.subjectGroup?.name || null,
        schoolName: s.user?.school?.name || "Toàn quốc",
        createdAt: s.createdAt.toISOString(),
      };
    });

    const filteredScopes = filters?.search?.trim()
      ? scopes.filter((sc) => {
          const q = filters.search!.trim().toLowerCase();
          return (
            sc.userName.toLowerCase().includes(q) ||
            sc.userEmail.toLowerCase().includes(q) ||
            sc.scopeTargetName.toLowerCase().includes(q) ||
            sc.schoolName.toLowerCase().includes(q)
          );
        })
      : scopes;

    const stats = {
      totalScopes: rawScopes.length,
      campusScopes: rawScopes.filter((s) => s.scopeType === ScopeType.CAMPUS).length,
      subjectGroupScopes: rawScopes.filter((s) => s.scopeType === ScopeType.SUBJECT_GROUP).length,
      wardScopes: rawScopes.filter((s) => s.scopeType === ScopeType.WARD).length,
      globalScopes: rawScopes.filter((s) => s.scopeType === ScopeType.GLOBAL).length,
    };

    return {
      success: true,
      scopes: filteredScopes,
      users: rawUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        schoolId: u.schoolId,
        schoolName: u.school?.name || "Chưa gắn trường",
      })),
      campuses: rawCampuses.map((c) => ({
        id: c.id,
        name: c.name,
        schoolName: c.school?.name || "Chưa gắn trường",
      })),
      wards: rawWards.map((w) => ({
        id: w.id,
        name: w.name,
        departmentName: w.department?.name || "Bộ GD&ĐT",
      })),
      subjectGroups: rawSubjectGroups.map((sg) => ({
        id: sg.id,
        name: sg.name,
        schoolName: sg.school?.name || "Chưa gắn trường",
      })),
      stats,
    };
  } catch (error: any) {
    console.error("Error in getRoleScopesData:", error);
    return {
      success: false,
      error: error.message || "Lỗi tải dữ liệu phân quyền scope",
      scopes: [],
      users: [],
      campuses: [],
      wards: [],
      subjectGroups: [],
      stats: null,
    };
  }
}

export async function createUserRoleScope(data: {
  userId: string;
  role: Role;
  scopeType: ScopeType;
  scopeId?: string;
  subjectGroupId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.userId) return { success: false, error: "Vui lòng chọn tài khoản nhân sự" };
    if (!data.role) return { success: false, error: "Vui lòng chọn vai trò phân quyền" };
    if (!data.scopeType) return { success: false, error: "Vui lòng chọn loại phạm vi (ScopeType)" };

    let resolvedScopeId = data.scopeId?.trim() || null;
    let resolvedSubjectGroupId = data.subjectGroupId?.trim() || null;

    if (data.scopeType === ScopeType.SUBJECT_GROUP && !resolvedSubjectGroupId && resolvedScopeId) {
      resolvedSubjectGroupId = resolvedScopeId;
    }

    const existing = await prisma.userRoleScope.findFirst({
      where: {
        userId: data.userId,
        role: data.role,
        scopeId: resolvedScopeId,
        subjectGroupId: resolvedSubjectGroupId,
      },
    });

    if (existing) {
      return { success: false, error: "Tài khoản này đã được gán phạm vi quyền hạn tương ứng" };
    }

    const newScope = await prisma.userRoleScope.create({
      data: {
        userId: data.userId,
        role: data.role,
        scopeType: data.scopeType,
        scopeId: resolvedScopeId,
        subjectGroupId: resolvedSubjectGroupId,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "UserRoleScope",
      entityId: newScope.id,
      description: `Gán phạm vi quyền ${newScope.role} (${newScope.scopeType}) cho ${newScope.user.email}`,
    });

    revalidatePath("/admin/role-scopes");
    return { success: true, data: newScope };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi gán phạm vi quyền" };
  }
}

export async function deleteUserRoleScope(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const target = await prisma.userRoleScope.findUnique({
      where: { id },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!target) return { success: false, error: "Không tìm thấy bản ghi phân quyền" };

    await prisma.userRoleScope.delete({ where: { id } });

    await recordAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityName: "UserRoleScope",
      entityId: id,
      description: `Hủy phạm vi quyền ${target.role} (${target.scopeType}) của ${target.user.email}`,
    });

    revalidatePath("/admin/role-scopes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi hủy phạm vi quyền" };
  }
}
