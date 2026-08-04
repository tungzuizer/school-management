"use client";

import { useEffect, useState } from "react";
import { getStudentSchedule } from "../actions";

type ScheduleSlot = {
  id: string;
  dayOfWeek: number;
  period: number;
  subjectName: string;
  teacherName: string;
  room: string | null;
};

type ScheduleData = {
  studentName: string;
  className: string;
  schedules: ScheduleSlot[];
};

const dayNames = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const dayColors = [
  "",
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-yellow-50 border-yellow-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-orange-50 border-orange-200",
  "bg-gray-50 border-gray-200",
];

export default function StudentSchedulePage() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentSchedule().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Đang tải thời khóa biểu...</span>
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

  // Build a grid: periods (rows) x days (columns)
  const maxPeriod = Math.max(10, ...data.schedules.map((s) => s.period));
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);
  const days = [2, 3, 4, 5, 6, 7]; // Monday to Saturday

  const scheduleMap = new Map<string, ScheduleSlot>();
  data.schedules.forEach((s) => {
    scheduleMap.set(`${s.dayOfWeek}-${s.period}`, s);
  });

  // Determine today's day of week (JS: 0=Sun, 1=Mon... -> convert to our format 2=Mon...)
  const today = new Date().getDay();
  const todayMapped = today === 0 ? 8 : today + 1; // Sun=8 (not in our grid), Mon=2, Tue=3...

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800"> Thời khóa biểu</h1>
        <p className="text-gray-500 mt-1">
          {data.studentName} — Lớp {data.className}
        </p>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 bg-gray-100 border border-gray-200 text-gray-600 font-semibold text-sm w-20">
                  Tiết
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`p-3 border border-gray-200 font-semibold text-sm text-center ${
                      d === todayMapped
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {dayNames[d]}
                    {d === todayMapped && (
                      <span className="block text-xs font-normal opacity-80">Hôm nay</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const hasAny = days.some((d) => scheduleMap.has(`${d}-${period}`));
                // Show period 1-5 always as morning, 6-10 as afternoon
                const isMorningBreak = period === 5;

                return (
                  <>
                    <tr key={period}>
                      <td className="p-3 bg-gray-50 border border-gray-200 text-center font-bold text-gray-700">
                        {period}
                      </td>
                      {days.map((d) => {
                        const slot = scheduleMap.get(`${d}-${period}`);
                        const isToday = d === todayMapped;

                        if (!slot) {
                          return (
                            <td
                              key={`${d}-${period}`}
                              className={`p-3 border border-gray-200 text-center ${
                                isToday ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <span className="text-gray-300">—</span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={`${d}-${period}`}
                            className={`p-2 border border-gray-200 ${
                              isToday ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className={`rounded-lg p-2 ${dayColors[d]} border`}>
                              <p className="font-semibold text-gray-800 text-sm">
                                {slot.subjectName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {slot.teacherName}
                              </p>
                              {slot.room && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                   {slot.room}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    {isMorningBreak && (
                      <tr key="break">
                        <td
                          colSpan={days.length + 1}
                          className="p-1 bg-orange-50 border border-gray-200 text-center text-xs text-orange-600 font-medium"
                        >
                          — Nghỉ giữa buổi —
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2"> Ghi chú:</p>
        <div className="flex flex-wrap gap-4">
          <span>Tiết 1-5: Buổi sáng</span>
          <span>Tiết 6-10: Buổi chiều</span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-blue-600 rounded"></span> Hôm nay
          </span>
        </div>
      </div>
    </div>
  );
}
