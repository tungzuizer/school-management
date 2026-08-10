"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPClasses } from "../actions";
import { School, Users, Building2 } from "lucide-react";

type VPClass = Awaited<ReturnType<typeof getVPClasses>>[number];

export default function VPClassesPage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [classes, setClasses] = useState<VPClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      try {
        const data = await getVPClasses(campusId);
        setClasses(data);
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  const filtered = filterGrade === "ALL" 
    ? classes 
    : classes.filter((c) => String(c.gradeLevel) === filterGrade);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Lớp học Phân hiệu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và theo dõi thông tin các lớp học thuộc Phân hiệu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Khối:</label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="ALL">Tất cả khối</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 font-bold">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-medium">
                      Khối {cls.gradeLevel}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{cls._count?.students || 0}</span>
                  <p className="text-[11px] text-gray-400">Học sinh</p>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">GVCN:</span>
                  <span className="font-semibold text-gray-800">
                    {cls.homeroomTeacher?.user?.name || "Chưa phân công"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Trường:</span>
                  <span className="text-xs text-gray-600 truncate max-w-[180px]">
                    {cls.school?.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
