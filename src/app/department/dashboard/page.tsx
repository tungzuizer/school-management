"use client";

import { useEffect, useState, useCallback } from "react";
import { getDepartmentDashboard } from "./actions";
import { Building2, Users, UserCog, School, Landmark, GraduationCap } from "lucide-react";

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

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getDepartmentDashboard();
    setData(res as DashboardData | null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Không có dữ liệu. Vui lòng kiểm tra tài khoản.</div>;

  const stats = [
    { label: "Phòng GD&ĐT", value: data.totalWards, icon: Landmark, color: "bg-indigo-50 text-indigo-700" },
    { label: "Trường (Phòng quản lý)", value: data.totalWardSchools, icon: School, color: "bg-emerald-50 text-emerald-700" },
    { label: "Trường THPT (Sở quản lý)", value: data.totalThptSchools, icon: Building2, color: "bg-blue-50 text-blue-700" },
    { label: "Tổng Học sinh", value: data.totalStudents, icon: Users, color: "bg-amber-50 text-amber-700" },
    { label: "Tổng Giáo viên", value: data.totalTeachers, icon: UserCog, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.department?.name || "Sở Giáo dục & Đào tạo"}</h1>
          <p className="text-sm text-gray-500">Mã đơn vị: {data.department?.code}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 ${s.color} border`}>
            <s.icon className="w-6 h-6 mb-2 opacity-70" />
            <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two Branches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nhánh 1: Phòng GD&ĐT */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Nhánh 1: Phòng GD&ĐT (Quận/Huyện)</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Các trường Tiểu học, THCS do Phòng GD&ĐT quản lý</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.wards.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có Phòng GD&ĐT nào</p>
            ) : data.wards.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-800">{w.name}</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{w.schoolCount} trường</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nhánh 2: THPT */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Nhánh 2: Trường THPT (Trực thuộc Sở)</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">Các trường THPT do Sở GD&ĐT quản lý trực tiếp</p>
          <div className="flex items-center justify-center h-32 bg-blue-50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700">{data.totalThptSchools}</p>
              <p className="text-sm text-blue-600 mt-1">Trường THPT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
