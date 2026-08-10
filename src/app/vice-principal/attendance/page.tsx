"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPAttendanceData } from "../actions";
import { ClipboardCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

type VPAttendance = Awaited<ReturnType<typeof getVPAttendanceData>>[number];

export default function VPAttendancePage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [data, setData] = useState<VPAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getVPAttendanceData(campusId);
        setData(res);
      } catch (err) {
        console.error("Failed to load attendance summary:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  const totalPresent = data.reduce((acc, curr) => acc + curr.presentCount, 0);
  const totalAbsent = data.reduce((acc, curr) => acc + curr.absentCount, 0);
  const totalLate = data.reduce((acc, curr) => acc + curr.lateCount, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Điểm danh Phân hiệu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Thống kê chuyên cần hôm nay theo từng lớp thuộc Phân hiệu
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Có mặt hôm nay</p>
            <p className="text-2xl font-bold text-emerald-900">{totalPresent}</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-8 h-8 text-red-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Vắng mặt hôm nay</p>
            <p className="text-2xl font-bold text-red-900">{totalAbsent}</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Đi muộn hôm nay</p>
            <p className="text-2xl font-bold text-amber-900">{totalLate}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Chi tiết Chuyên cần theo Lớp</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải dữ liệu điểm danh...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="p-3 font-medium">Lớp</th>
                  <th className="p-3 font-medium text-center">Khối</th>
                  <th className="p-3 font-medium text-center">Sĩ số</th>
                  <th className="p-3 font-medium text-center">Có mặt</th>
                  <th className="p-3 font-medium text-center">Vắng</th>
                  <th className="p-3 font-medium text-center">Đi muộn</th>
                  <th className="p-3 font-medium text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((item) => (
                  <tr key={item.classId} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{item.className}</td>
                    <td className="p-3 text-center text-gray-600">{item.gradeLevel}</td>
                    <td className="p-3 text-center text-gray-600">{item.totalStudents}</td>
                    <td className="p-3 text-center font-semibold text-emerald-600">{item.presentCount}</td>
                    <td className="p-3 text-center font-semibold text-red-600">{item.absentCount}</td>
                    <td className="p-3 text-center font-semibold text-amber-600">{item.lateCount}</td>
                    <td className="p-3 text-right">
                      <span className={`font-bold ${item.rate >= 95 ? "text-emerald-700" : item.rate >= 85 ? "text-amber-700" : "text-red-600"}`}>
                        {item.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
