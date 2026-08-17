"use client";

import { useEffect, useState, useCallback } from "react";
import { getWardDashboard } from "./actions";
import { Building2, Users, UserCog, School, Landmark } from "lucide-react";

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

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getWardDashboard();
    setData(res as DashboardData | null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Không có dữ liệu. Vui lòng kiểm tra tài khoản.</div>;

  const stats = [
    { label: "Tổng Trường", value: data.totalSchools, icon: School, color: "bg-emerald-50 text-emerald-700" },
    { label: "Tổng Học sinh", value: data.totalStudents, icon: Users, color: "bg-amber-50 text-amber-700" },
    { label: "Tổng Giáo viên", value: data.totalTeachers, icon: UserCog, color: "bg-purple-50 text-purple-700" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Landmark className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.ward?.name || "Phòng GD&ĐT"}</h1>
          <p className="text-sm text-gray-500">Thuộc {data.departmentName}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-6">Mã đơn vị: {data.ward?.code || "—"}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 ${s.color} border`}>
            <s.icon className="w-6 h-6 mb-2 opacity-70" />
            <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Danh sách Trường thuộc Phòng</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tên trường</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cơ sở</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.schools.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-500">Chưa có trường nào</td></tr>
            ) : data.schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{s.address || "—"}</td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{s.campusCount}</td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    <Building2 className="w-3 h-3" /> {s.classCount}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{s.userCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
