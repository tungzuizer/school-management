"use client";

import { useEffect, useState } from "react";
import { getTeacherSchedule, TeacherScheduleData, ScheduleSlot, ScheduleDayHeader } from "./actions";
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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  User,
} from "lucide-react";

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

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function TeacherSchedulePage() {
  const [data, setData] = useState<TeacherScheduleData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [viewMode, setViewMode] = useState<"PERSONAL" | "HOMEROOM">("PERSONAL");
  const [loading, setLoading] = useState(true);

  async function loadData(dateStr: string, mode: "PERSONAL" | "HOMEROOM") {
    setLoading(true);
    try {
      const res = await getTeacherSchedule(dateStr, mode);
      setData(res);
    } catch (err) {
      console.error("Lỗi tải thời khóa biểu giáo viên:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

  const changeWeek = (daysOffset: number) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const getSlot = (dayOfWeek: number, period: number): ScheduleSlot | undefined => {
    return data?.slots.find((s) => s.dayOfWeek === dayOfWeek && s.period === period);
  };

  const morningPeriods = [1, 2, 3, 4];
  const afternoonPeriods = [5, 6, 7, 8];

  const daysToRender = data?.days.slice(0, 6) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-3xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Thời Khóa Biểu Giảng Dạy Tuần
              </span>
              {data?.homeroomClassName && (
                <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-[11px] font-bold">
                  GVCN Lớp {data.homeroomClassName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {viewMode === "HOMEROOM"
                ? `Thời Khóa Biểu Lớp Chủ Nhiệm (${data?.homeroomClassName || ""})`
                : `Lịch Dạy Cá Nhân — ${data?.teacherName || "Giáo Viên"}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {viewMode === "HOMEROOM"
                ? `Xem toàn bộ lịch học & giáo viên bộ môn giảng dạy của lớp chủ nhiệm ${data?.homeroomClassName}.`
                : "Theo dõi phân công giảng dạy bộ môn cá nhân ở tất cả các lớp & trạng thái điểm danh."}
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

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-2.5 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewMode("PERSONAL")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === "PERSONAL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Lịch Dạy Cá Nhân (Bộ Môn)</span>
          </button>

          {data?.homeroomClassName && (
            <button
              onClick={() => setViewMode("HOMEROOM")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === "HOMEROOM"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>TKB Lớp Chủ Nhiệm ({data.homeroomClassName})</span>
            </button>
          )}
        </div>

        {/* Week Controls & Date Filter */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => changeWeek(-7)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              onClick={() => changeWeek(7)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
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
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                {viewMode === "HOMEROOM" ? "Tổng tiết học / tuần" : "Tổng tiết dạy / tuần"}
              </p>
              <p className="text-lg font-extrabold text-slate-900">{data.totalPeriods} tiết</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">
                {viewMode === "HOMEROOM" ? "Lớp xem TKB" : "Số lớp phụ trách"}
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {viewMode === "HOMEROOM" ? `Lớp ${data.homeroomClassName}` : `${data.classesCount} lớp`}
              </p>
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
              <p className="text-[10px] text-slate-500 font-bold uppercase">Chủ nhiệm</p>
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
            <span>
              {viewMode === "HOMEROOM"
                ? `Thời Khóa Biểu Chi Tiết Lớp Chủ Nhiệm ${data?.homeroomClassName}`
                : "Ma Trận Lịch Dạy Bộ Môn Cá Nhân"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic">Dữ liệu thời gian thực từ hệ thống</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải dữ liệu thời khóa biểu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <th className="py-3 px-3 w-32 border-r border-slate-200 text-center uppercase tracking-wider">
                    Tiết / Giờ
                  </th>
                  {daysToRender.map((d) => (
                    <th
                      key={d.dayOfWeek}
                      className={`py-3 px-3 text-center border-r border-slate-200 last:border-0 ${
                        d.isToday ? "bg-indigo-50/80 text-indigo-900 font-black border-b-2 border-b-indigo-600" : ""
                      }`}
                    >
                      <div>{d.label}</div>
                      <div className="text-[11px] text-slate-500 font-bold mt-0.5">({d.formattedDate})</div>
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

                    {daysToRender.map((d) => {
                      const slot = getSlot(d.dayOfWeek, period);
                      const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

                      return (
                        <td
                          key={d.dayOfWeek}
                          className={`p-2 border-r border-slate-200 last:border-0 align-top h-32 w-1/6 transition-all ${
                            d.isToday ? "bg-indigo-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01] ${
                                slot.isMySlot ? "ring-2 ring-indigo-500/50" : ""
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-md">
                                    Lớp {slot.className}
                                  </span>
                                </div>

                                {viewMode === "HOMEROOM" ? (
                                  <div className="text-[10px] text-slate-700 font-bold mt-1">
                                    <span className="text-slate-400 font-medium">GV: </span>
                                    <span className={slot.isMySlot ? "text-indigo-700 font-extrabold" : ""}>
                                      {slot.teacherName} {slot.isMySlot ? "(Tôi)" : ""}
                                    </span>
                                  </div>
                                ) : (
                                  slot.room && (
                                    <div className="text-[10px] text-slate-600 font-bold mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" /> {slot.room}
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Real DB Attendance Status Overlay */}
                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1">
                                {slot.isAttendanceDone ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã điểm danh
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300">
                                    <AlertCircle className="w-3 h-3 text-amber-600" /> Chưa điểm danh
                                  </span>
                                )}

                                <Link
                                  href={`/teacher/attendance?classId=${slot.classId}&period=${slot.period}&date=${d.dateStr}`}
                                  className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-900 underline flex items-center gap-0.5"
                                >
                                  Điểm danh
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

                    {daysToRender.map((d) => {
                      const slot = getSlot(d.dayOfWeek, period);
                      const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

                      return (
                        <td
                          key={d.dayOfWeek}
                          className={`p-2 border-r border-slate-200 last:border-0 align-top h-32 w-1/6 transition-all ${
                            d.isToday ? "bg-indigo-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01] ${
                                slot.isMySlot ? "ring-2 ring-indigo-500/50" : ""
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-white font-extrabold text-[10px] rounded-md">
                                    Lớp {slot.className}
                                  </span>
                                </div>

                                {viewMode === "HOMEROOM" ? (
                                  <div className="text-[10px] text-slate-700 font-bold mt-1">
                                    <span className="text-slate-400 font-medium">GV: </span>
                                    <span className={slot.isMySlot ? "text-indigo-700 font-extrabold" : ""}>
                                      {slot.teacherName} {slot.isMySlot ? "(Tôi)" : ""}
                                    </span>
                                  </div>
                                ) : (
                                  slot.room && (
                                    <div className="text-[10px] text-slate-600 font-bold mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-400" /> {slot.room}
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Real DB Attendance Status Overlay */}
                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-1">
                                {slot.isAttendanceDone ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã điểm danh
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300">
                                    <AlertCircle className="w-3 h-3 text-amber-600" /> Chưa điểm danh
                                  </span>
                                )}

                                <Link
                                  href={`/teacher/attendance?classId=${slot.classId}&period=${slot.period}&date=${d.dateStr}`}
                                  className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-900 underline flex items-center gap-0.5"
                                >
                                  Điểm danh
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
