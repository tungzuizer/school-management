"use client";

import { useEffect, useState } from "react";
import { getStudentAttendance } from "../actions";

type AttendanceRecord = {
  id: string;
  date: string;
  period: number | null;
  status: string;
  note: string | null;
};

type AttendanceData = {
  studentName: string;
  className: string;
  month: number;
  year: number;
  records: AttendanceRecord[];
  summary: { present: number; absentExcused: number; absentUnexcused: number; late: number; total: number; attendanceRate: number };
};

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT: { label: "Có mặt", color: "text-green-700", bg: "bg-green-100" },
  ABSENT_EXCUSED: { label: "Vắng CP", color: "text-blue-700", bg: "bg-blue-100" },
  ABSENT_UNEXCUSED: { label: "Vắng KP", color: "text-red-700", bg: "bg-red-100" },
  LATE: { label: "Đi muộn", color: "text-yellow-700", bg: "bg-yellow-100" },
};

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    setLoading(true);
    const [y, m] = month.split("-").map(Number);
    getStudentAttendance(m, y).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Đang tải điểm danh...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Không tìm thấy thông tin. Vui lòng liên hệ quản trị viên.
        </div>
      </div>
    );
  }

  const attendanceRate = data.summary.total > 0
    ? Math.round((data.summary.present / data.summary.total) * 100)
    : 100;

  // Group by date
  const byDate = new Map<string, AttendanceRecord[]>();
  data.records.forEach((r) => {
    const existing = byDate.get(r.date) || [];
    existing.push(r);
    byDate.set(r.date, existing);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800"> Điểm danh</h1>
          <p className="text-gray-500 mt-1">
            {data.studentName} — Lớp {data.className}
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">Tổng buổi</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.summary.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-sm text-green-600">Có mặt</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{data.summary.present}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <p className="text-sm text-blue-600">Vắng CP</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{data.summary.absentExcused}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
          <p className="text-sm text-red-600">Vắng KP</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{data.summary.absentUnexcused}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-sm text-yellow-600">Đi muộn</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{data.summary.late}</p>
        </div>
      </div>

      {/* Attendance Rate Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Tỷ lệ chuyên cần</span>
          <span className={`text-lg font-bold ${attendanceRate >= 80 ? "text-green-600" : attendanceRate >= 60 ? "text-yellow-600" : "text-red-600"}`}>
            {attendanceRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${attendanceRate >= 80 ? "bg-green-500" : attendanceRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </div>

      {/* Records Table */}
      {data.records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">Không có dữ liệu điểm danh trong tháng này</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">Ngày</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Tiết</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Trạng thái</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r, idx) => {
                  const st = statusLabels[r.status] || { label: r.status, color: "text-gray-700", bg: "bg-gray-100" };
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">
                        {new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {r.period ? `Tiết ${r.period}` : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{r.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
