/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/admin/wards`, navigation from `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `AdminWardsPage` default export component.
 * 3. Schemas: `getAdminWardsData`, `WardsClient`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Khắc phục triệt để lỗi 404 cho mục Quản lý Tỉnh & Khu vực (/admin/wards).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminWardsData } from "./actions";
import WardsClient from "./WardsClient";
import { MapPin } from "lucide-react";

export const metadata = {
  title: "Quản Lý Tỉnh & Khu Vực - Hệ Thống Giáo Dục Toàn Quốc",
  description: "Trung tâm quản trị 63 Tỉnh/Thành phố, Sở GD&ĐT và mạng lưới Phòng GD&ĐT quận huyện trực thuộc.",
};

export default async function AdminWardsPage(props: {
  searchParams?: Promise<{ departmentId?: string }>;
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
    session.user.email === "superadmin@gmail.com" ||
    session.user.email === "superadmin.vietnam@gmail.com" ||
    session.user.email === "superadmin.ninhbinh@gmail.com" ||
    session.user.email === "superadmin.demo@gmail.com" ||
    session.user.email === "superadmin@school.com";

  if (!isAuthorized) {
    redirect("/admin/dashboard");
  }

  const searchParams = await props.searchParams;
  const initialData = await getAdminWardsData(searchParams?.departmentId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Tỉnh & Khu Vực Địa Lý
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mạng lưới 63 Tỉnh/Thành phố, Sở Giáo Dục & Đào Tạo và các Phòng GD&ĐT trực thuộc toàn quốc
              </p>
            </div>
          </div>
        </div>
      </div>

      <WardsClient
        initialWards={initialData.wards || []}
        departments={initialData.departments || []}
        stats={initialData.stats}
      />
    </div>
  );
}
