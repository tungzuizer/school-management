"use client";

import { useEffect, useState, useCallback } from "react";
import { getWardSchools } from "../dashboard/actions";
import { Building2, School } from "lucide-react";

interface SchoolRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  _count: { classRooms: number; users: number; campuses: number };
}

export default function WardSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getWardSchools();
    setSchools(res as unknown as SchoolRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <School className="w-7 h-7 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900">Danh sách Trường thuộc Phòng</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên trường</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cơ sở</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có trường nào</td></tr>
            ) : schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.address || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.phone || "—"}</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">{s._count.campuses}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    <Building2 className="w-3 h-3" /> {s._count.classRooms}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">{s._count.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
