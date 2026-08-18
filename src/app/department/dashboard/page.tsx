"use client";

import { useEffect, useState, useCallback } from "react";
import { getDepartmentDashboard } from "./actions";
import { Building2, Users, UserCog, School, Landmark, GraduationCap } from "lucide-react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";

interface DashboardData {
  department: { id: string; name: string; code: string } | null;
  totalWards: number;
  totalWardSchools: number;
  totalThptSchools: number;
  totalStudents: number;
  totalTeachers: number;
  wards: { id: string; name: string; schoolCount: number }[];
}

export default function DepartmentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getDepartmentDashboard();
    setData(res as DashboardData | null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton rows={4} cols={2} />
          <TableSkeleton rows={4} cols={2} />
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500">Không có dữ liệu. Vui lòng kiểm tra tài khoản.</div>;

  const stats = [
    { label: "Phòng GD&ĐT", value: data.totalWards, icon: Landmark, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    { label: "Trường (Phòng quản lý)", value: data.totalWardSchools, icon: School, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "Trường THPT (Sở quản lý)", value: data.totalThptSchools, icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "Tổng Học sinh", value: data.totalStudents, icon: Users, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Tổng Giáo viên", value: data.totalTeachers, icon: UserCog, color: "bg-purple-50 text-purple-700 border-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.department?.name || "Sở Giáo dục & Đào tạo"}</h1>
          <p className="text-xs font-semibold text-slate-500">Mã đơn vị: {data.department?.code}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 ${s.color} border shadow-2xs hover:shadow-md transition-all`}>
            <s.icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-extrabold tracking-tight">{s.value.toLocaleString()}</p>
            <p className="text-xs font-semibold mt-1 opacity-90">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nhánh 1: Phòng GD&ĐT */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Nhánh 1: Phòng GD&ĐT (Quận/Huyện)</h2>
          </div>
          <p className="text-xs text-slate-500">Các trường Tiểu học, THCS do Phòng GD&ĐT quản lý trực thuộc</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.wards.length === 0 ? (
              <p className="text-xs text-slate-400">Chưa có Phòng GD&ĐT nào</p>
            ) : data.wards.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors">
                <span className="text-xs font-semibold text-slate-800">{w.name}</span>
                <span className="text-[11px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">{w.schoolCount} trường</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nhánh 2: THPT */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Nhánh 2: Trường THPT (Trực thuộc Sở)</h2>
          </div>
          <p className="text-xs text-slate-500">Các trường THPT do Sở GD&ĐT quản lý trực tiếp</p>
          <div className="flex items-center justify-center h-36 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-blue-700">{data.totalThptSchools}</p>
              <p className="text-xs font-semibold text-blue-600 mt-1">Trường THPT Trực thuộc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

