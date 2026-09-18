/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/admin/campuses`, accessed via Admin Navigation layout.
 * 2. Affected APIs: `AdminCampusesPage` default export Server Component.
 * 3. Schemas: `getAdminCampusesData`, `CampusesClient`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Xây dựng trang Quản lý Cơ sở, Phân hiệu & Điểm trường trực thuộc (/admin/campuses).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminCampusesData } from "./actions";
import CampusesClient from "./CampusesClient";
import { Building } from "lucide-react";

export const metadata = {
  title: "Quản Lý Cơ Sở & Phân Hiệu - Hệ Thống Giáo Dục Toàn Quốc",
  description: "Quản trị danh mục cơ sở, phân hiệu và các điểm trường vệ tinh trực thuộc trên toàn quốc.",
};

export default async function AdminCampusesPage(props: {
  searchParams?: Promise<{ schoolId?: string; search?: string }>;
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
  const initialData = await getAdminCampusesData({
    schoolId: searchParams?.schoolId,
    search: searchParams?.search,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Cơ Sở & Phân Hiệu Trực Thuộc
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mô hình mạng lưới trường học đa cơ sở, điểm trường trung tâm & vệ tinh theo chuẩn Thông tư 15
              </p>
            </div>
          </div>
        </div>
      </div>

      <CampusesClient
        initialCampuses={initialData.campuses || []}
        schools={initialData.schools || []}
        stats={initialData.stats}
      />
    </div>
  );
}
