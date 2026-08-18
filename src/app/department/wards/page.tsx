"use client";

import { useEffect, useState, useCallback } from "react";
import { getDepartmentWards } from "../dashboard/actions";
import { Landmark, Building2 } from "lucide-react";

interface WardRow {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  _count: { schools: number; users: number };
}

export default function DepartmentWardsPage() {
  const [wards, setWards] = useState<WardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getDepartmentWards();
    setWards(res as unknown as WardRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Landmark className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Danh sách Phòng GD&ĐT</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên Phòng</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mã</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Số trường</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : wards.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Chưa có Phòng GD&ĐT nào</td></tr>
            ) : wards.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{w.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{w.code || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{w.address || "—"}</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                    <Building2 className="w-3 h-3" /> {w._count.schools}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">{w._count.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

