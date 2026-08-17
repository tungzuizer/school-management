"use client";

import { useEffect, useState, useCallback } from "react";
import { getDepartmentThptSchools } from "../dashboard/actions";
import { Building2, School } from "lucide-react";

interface SchoolRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  _count: { classRooms: number; users: number };
}

export default function ThptSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getDepartmentThptSchools();
    setSchools(res as unknown as SchoolRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Trường THPT (Trực thuộc Sở)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên trường</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Số lớp</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có trường THPT nào</td></tr>
            ) : schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.address || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{s.phone || "—"}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    <School className="w-3 h-3" /> {s._count.classRooms}
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
