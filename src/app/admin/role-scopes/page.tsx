/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/admin/role-scopes`, navigation from `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `AdminRoleScopesPage` default export component.
 * 3. Schemas: `getRoleScopesData`, `RoleScopesClient`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Khắc phục triệt để lỗi 404 cho mục Ma trận Phân quyền & Quản trị Scope (/admin/role-scopes).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoleScopesData } from "./actions";
import RoleScopesClient from "./RoleScopesClient";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Ma Trận Phân Quyền & Quản Trị Scope - Hệ Thống Giáo Dục Toàn Quốc",
  description: "Cấu hình phạm vi quản lý và phân quyền RBAC phân cấp cho cán bộ, giáo viên toàn quốc.",
};

export default async function AdminRoleScopesPage(props: {
  searchParams?: Promise<{ role?: string; scopeType?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role;
  const isAuthorized =
    role === "SUPER_ADMIN" ||
    role === "DEPARTMENT_ADMIN" ||
    role === "WARD_ADMIN" ||
    role === "ADMIN" ||
    role === "VICE_PRINCIPAL" ||
    session.user.email === "superadmin@gmail.com" ||
    session.user.email === "superadmin.vietnam@gmail.com" ||
    session.user.email === "superadmin.ninhbinh@gmail.com" ||
    session.user.email === "superadmin.demo@gmail.com" ||
    session.user.email === "superadmin@school.com";

  if (!isAuthorized) {
    redirect("/admin/dashboard");
  }

  const searchParams = await props.searchParams;
  const initialData = await getRoleScopesData({
    role: searchParams?.role,
    scopeType: searchParams?.scopeType,
    search: searchParams?.search,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Ma Trận Phân Quyền & Quản Trị Scope
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Thiết lập phạm vi quyền hạn (RBAC Scoping) theo Cơ sở, Tổ Chuyên Môn, Khu Vực và Toàn Cục
              </p>
            </div>
          </div>
        </div>
      </div>

      <RoleScopesClient
        initialScopes={initialData.scopes || []}
        users={initialData.users || []}
        campuses={initialData.campuses || []}
        wards={initialData.wards || []}
        subjectGroups={initialData.subjectGroups || []}
        stats={initialData.stats}
      />
    </div>
  );
}
