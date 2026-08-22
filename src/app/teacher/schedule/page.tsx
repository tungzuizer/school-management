"use client";

import { useEffect, useState } from "react";
import { getTeacherSchedule, TeacherScheduleData, ScheduleSlot } from "./actions";
import Link from "next/link";
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Users,
  Award,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { day: 1, label: "Thứ 2", short: "T2" },
  { day: 2, label: "Thứ 3", short: "T3" },
  { day: 3, label: "Thứ 4", short: "T4" },
  { day: 4, label: "Thứ 5", short: "T5" },
  { day: 5, label: "Thứ 6", short: "T6" },
  { day: 6, label: "Thứ 7", short: "T7" },
];

const PERIOD_TIMES: Record<number, { label: string; time: string; shift: "MORNING" | "AFTERNOON" }> = {
  1: { label: "Tiết 1", time: "07:00 - 07:45", shift: "MORNING" },
  2: { label: "Tiết 2", time: "07:50 - 08:35", shift: "MORNING" },
  3: { label: "Tiết 3", time: "08:50 - 09:35", shift: "MORNING" },
  4: { label: "Tiết 4", time: "09:40 - 10:25", shift: "MORNING" },
  5: { label: "Tiết 5", time: "13:00 - 13:45", shift: "AFTERNOON" },
  6: { label: "Tiết 6", time: "13:50 - 14:35", shift: "AFTERNOON" },
  7: { label: "Tiết 7", time: "14:50 - 15:35", shift: "AFTERNOON" },
  8: { label: "Tiết 8", time: "15:40 - 16:25", shift: "AFTERNOON" },
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Toán: { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200" },
  "Ngữ Văn": { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200" },
  "Tiếng Anh": { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200" },
  "Vật Lý": { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-200" },
  "Hóa Học": { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200" },
  "Sinh Học": { bg: "bg-teal-500/10", text: "text-teal-700", border: "border-teal-200" },
  "Lịch Sử": { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200" },
  "Địa Lý": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-200" },
  "Tin Học": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200" },
  GDCD: { bg: "bg-pink-500/10", text: "text-pink-700", border: "border-pink-200" },
};

function getSubjectBadgeStyle(name: string) {
  for (const key of Object.keys(SUBJECT_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return SUBJECT_COLORS[key];
    }
  }
  return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" };
}

export default function TeacherSchedulePage() {
  const [data, setData] = useState<TeacherScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getTeacherSchedule();
        setData(res);
      } catch (err) {
        console.error("Lỗi tải thời khóa biểu giáo viên:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getSlot = (dayOfWeek: number, period: number): ScheduleSlot | undefined => {
    return data?.slots.find((s) => s.dayOfWeek === dayOfWeek && s.period === period);
  };

  const morningPeriods = [1, 2, 3, 4];
  const afternoonPeriods = [5, 6, 7, 8];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-3xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Thời Khóa Biểu Giảng Dạy
              </span>
              {data?.homeroomClassName && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-[11px] font-bold">
                  GVCN Lớp {data.homeroomClassName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Lịch Dạy Cá Nhân — {data?.teacherName || "Giáo Viên"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Tổng hợp phân công tiết dạy hàng tuần, danh sách lớp phụ trách và lối tắt điểm danh nhanh.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/teacher/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Sổ Điểm Danh</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Tổng tiết dạy / tuần</p>
              <p className="text-lg font-extrabold text-slate-900">{data.totalPeriods} tiết</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Số lớp phụ trách</p>
              <p className="text-lg font-extrabold text-slate-900">{data.classesCount} lớp</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Chuyên môn môn học</p>
              <p className="text-xs font-extrabold text-slate-900 truncate max-w-[120px]">
                {data.specialty || "Bộ môn"}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Lớp chủ nhiệm</p>
              <p className="text-xs font-extrabold text-slate-900">
                {data.homeroomClassName ? `Lớp ${data.homeroomClassName}` : "Không"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Ma Trận Thời Khóa Biểu Giảng Dạy Tuần</span>
          </div>
          <span className="text-[11px] text-slate-400 italic">Tự động cập nhật theo phân công BGH</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải ma trận thời khóa biểu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <th className="py-3 px-3 w-32 border-r border-slate-200 text-center uppercase tracking-wider">
                    Tiết / Giờ
                  </th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th key={d.day} className="py-3 px-3 text-center border-r border-slate-200 last:border-0">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {/* Morning Shift Banner */}
                <tr className="bg-indigo-50/60 font-bold text-indigo-900 text-[11px] uppercase tracking-wider">
                  <td colSpan={7} className="py-1.5 px-4 text-left border-y border-indigo-100">
                    ☀️ Ca Sáng (Tiết 1 – 4)
                  </td>
                </tr>

                {morningPeriods.map((period) => (
                  <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 bg-slate-50/80 border-r border-slate-200 text-center font-bold text-slate-700">
                      <div className="text-slate-900 font-extrabold">{PERIOD_TIMES[period].label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{PERIOD_TIMES[period].time}</div>
                    </td>

                    {DAYS_OF_WEEK.map((d) => {
                      const slot = getSlot(d.day, period);
                      const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

                      return (
                        <td
                          key={d.day}
                          className="p-2 border-r border-slate-200 last:border-0 align-top h-24 w-1/6 transition-all hover:bg-indigo-50/20"
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.02]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-md">
                                    Lớp {slot.className}
                                  </span>
                                </div>
                                {slot.room && (
                                  <div className="text-[10px] text-slate-600 font-bold mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" /> {slot.room}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 pt-1 border-t border-slate-200/50 flex items-center justify-end">
                                <Link
                                  href="/teacher/attendance"
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                >
                                  <ClipboardCheck className="w-3 h-3" /> Điểm danh
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">
                              — TRỐNG —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Afternoon Shift Banner */}
                <tr className="bg-amber-50/60 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                  <td colSpan={7} className="py-1.5 px-4 text-left border-y border-amber-100">
                    🌙 Ca Chiều (Tiết 5 – 8)
                  </td>
                </tr>

                {afternoonPeriods.map((period) => (
                  <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 bg-slate-50/80 border-r border-slate-200 text-center font-bold text-slate-700">
                      <div className="text-slate-900 font-extrabold">{PERIOD_TIMES[period].label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{PERIOD_TIMES[period].time}</div>
                    </td>

                    {DAYS_OF_WEEK.map((d) => {
                      const slot = getSlot(d.day, period);
                      const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

                      return (
                        <td
                          key={d.day}
                          className="p-2 border-r border-slate-200 last:border-0 align-top h-24 w-1/6 transition-all hover:bg-amber-50/20"
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.02]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-md">
                                    Lớp {slot.className}
                                  </span>
                                </div>
                                {slot.room && (
                                  <div className="text-[10px] text-slate-600 font-bold mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" /> {slot.room}
                                  </div>
                                )}
                              </div>

                              <div className="mt-2 pt-1 border-t border-slate-200/50 flex items-center justify-end">
                                <Link
                                  href="/teacher/attendance"
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                >
                                  <ClipboardCheck className="w-3 h-3" /> Điểm danh
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-400 italic">
                              — TRỐNG —
                            </div>
                          )}
                        </td>
                      );
                    })}
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
