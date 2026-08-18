"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllDepartmentSchools } from "./actions";
import { Building2, School, Filter } from "lucide-react";

interface SchoolRow {
  id: string;
  name: string;
  branchType: string;
  address: string | null;
  districtWard: { name: string } | null;
  _count: { classRooms: number; users: number; campuses: number };
}

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getAllDepartmentSchools(branchFilter || undefined);
    setSchools(res as unknown as SchoolRow[]);
    setLoading(false);
  }, [branchFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tất cả Trường học</h1>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả nhánh</option>
            <option value="WARD">Nhánh Phòng GD&ĐT</option>
            <option value="THPT">Nhánh THPT (Sở)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tên trường</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Nhánh</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Phòng GD&ĐT</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Cơ sở</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Lớp</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Không có trường nào</td></tr>
            ) : schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.branchType === "THPT" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {s.branchType === "THPT" ? "THPT (Sở)" : "Phòng GD&ĐT"}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{s.districtWard?.name || "—"}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{s.address || "—"}</td>
                <td className="px-5 py-3 text-center text-sm text-gray-600">{s._count.campuses}</td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                    <School className="w-3 h-3" /> {s._count.classRooms}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

