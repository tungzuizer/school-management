"use client";

import { useEffect, useState, useCallback } from "react";
import { getWardDashboard } from "./actions";
import { Building2, Users, UserCog, School, Landmark } from "lucide-react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";

interface DashboardData {
  ward: { id: string; name: string; code: string | null } | null;
  departmentName: string;
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  schools: { id: string; name: string; address: string | null; classCount: number; userCount: number; campusCount: number }[];
}

export default function WardDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getWardDashboard();
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
        <div className="grid grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500">Không có dữ liệu. Vui lòng kiểm tra tài khoản.</div>;

  const stats = [
    { label: "Tổng Trường", value: data.totalSchools, icon: School, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "Tổng Học sinh", value: data.totalStudents, icon: Users, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "Tổng Giáo viên", value: data.totalTeachers, icon: UserCog, color: "bg-purple-50 text-purple-700 border-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-sm">
          <Landmark className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.ward?.name || "Phòng GD&ĐT"}</h1>
          <p className="text-xs font-semibold text-slate-500">Thuộc {data.departmentName} • Mã: {data.ward?.code || "—"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-4 ${s.color} border shadow-2xs hover:shadow-md transition-all`}>
            <s.icon className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-extrabold tracking-tight">{s.value.toLocaleString()}</p>
            <p className="text-xs font-semibold mt-1 opacity-90">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Danh sách Trường thuộc Phòng</h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">{data.schools.length} trường</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-5 py-3">Tên trường</th>
              <th className="px-5 py-3">Địa chỉ</th>
              <th className="px-5 py-3 text-center">Cơ sở</th>
              <th className="px-5 py-3 text-center">Lớp</th>
              <th className="px-5 py-3 text-center">Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.schools.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Chưa có trường nào</td></tr>
            ) : data.schools.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-bold text-slate-900">{s.name}</td>
                <td className="px-5 py-3.5 text-slate-500">{s.address || "—"}</td>
                <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{s.campusCount}</td>
                <td className="px-5 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    <Building2 className="w-3 h-3" /> {s.classCount}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center font-semibold text-slate-700">{s.userCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

