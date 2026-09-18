/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router for `/admin/equipment`, navigation from `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `AdminEquipmentPage` default export component.
 * 3. Schemas: `getAdminEquipmentData`, `EquipmentClient`.
 * 4. Verbatim User Instruction: "tiep tuc" - Hoàn thiện trang Quản lý Thiết bị số & Cơ sở vật chất (/admin/equipment) không còn lỗi 404.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminEquipmentData } from "./actions";
import EquipmentClient from "./EquipmentClient";
import { Laptop } from "lucide-react";

export const metadata = {
  title: "Quản Lý Thiết Bị Số & Cơ Sở Vật Chất - Hệ Thống Giáo Dục Toàn Quốc",
  description: "Quản lý trang thiết bị dạy học, phòng máy CNTT, thiết bị thí nghiệm STEM và điều phối liên điểm trường.",
};

export default async function AdminEquipmentPage(props: {
  searchParams?: Promise<{
    schoolId?: string;
    campusId?: string;
    category?: string;
    condition?: string;
    search?: string;
  }>;
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
  const initialData = await getAdminEquipmentData({
    schoolId: searchParams?.schoolId,
    campusId: searchParams?.campusId,
    category: searchParams?.category,
    condition: searchParams?.condition,
    search: searchParams?.search,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản Trị Thiết Bị Số & Cơ Sở Vật Chất
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Quản lý kho thiết bị CNTT, phòng thí nghiệm STEM và điều phối điều chuyển liên cơ sở / điểm trường
              </p>
            </div>
          </div>
        </div>
      </div>

      <EquipmentClient
        initialEquipment={initialData.equipment || []}
        initialTransfers={initialData.transfers || []}
        lookup={initialData.lookup || { schools: [], campuses: [], schoolPoints: [] }}
        stats={initialData.stats}
      />
    </div>
  );
}
