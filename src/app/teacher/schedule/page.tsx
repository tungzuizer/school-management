/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Teacher Navigation (`/teacher/schedule`), `src/app/teacher/layout.tsx:90`, `src/components/layout/MobileBottomNav.tsx:91`.
 * 2. Affected APIs: `getTeacherSchedule` (`src/app/teacher/schedule/actions.ts`).
 * 3. Schema: `TeacherScheduleData`, `ScheduleSlot`, `ScheduleDayHeader`, `Schedule`, `Subject`, `ClassRoom`, `Teacher`.
 * 4. Verbatim User Instruction: "bạn hãy xem 2 ảnh ở file C:\\Users\\tungh\\Desktop\\school-management\\anh   thứ 1 tab vụ không trong suốt như Liquid Glass và thứ 2 khi tôi bấm vô lịch khóa biểu nó bị hiên lên những cái kia ở trên web tôi đang thêm web vào màn hình chính trên iphone".
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { getTeacherSchedule, TeacherScheduleData, ScheduleSlot } from "./actions";
import Link from "next/link";
import {
  Calendar,
  BookOpen,
  MapPin,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  User,
  CalendarDays,
  Layers,
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
  9: { label: "Tiết 9", time: "16:30 - 17:15", shift: "AFTERNOON" },
  10: { label: "Tiết 10", time: "17:20 - 18:05", shift: "AFTERNOON" },
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  "Chào cờ": { bg: "bg-rose-500/10", text: "text-rose-700", border: "border-rose-200", accent: "bg-rose-500" },
  "Sinh hoạt": { bg: "bg-purple-500/10", text: "text-purple-700", border: "border-purple-200", accent: "bg-purple-500" },
  Toán: { bg: "bg-indigo-500/10", text: "text-indigo-700", border: "border-indigo-200", accent: "bg-indigo-500" },
  "Ngữ Văn": { bg: "bg-emerald-500/10", text: "text-emerald-700", border: "border-emerald-200", accent: "bg-emerald-500" },
  "Tiếng Anh": { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-500" },
  "Vật Lý": { bg: "bg-sky-500/10", text: "text-sky-700", border: "border-sky-200", accent: "bg-sky-500" },
  "Hóa Học": { bg: "bg-violet-500/10", text: "text-violet-700", border: "border-violet-200", accent: "bg-violet-500" },
  "Sinh Học": { bg: "bg-teal-500/10", text: "text-teal-700", border: "border-teal-200", accent: "bg-teal-500" },
  "Lịch Sử": { bg: "bg-pink-500/10", text: "text-pink-700", border: "border-pink-200", accent: "bg-pink-500" },
  "Địa Lý": { bg: "bg-orange-500/10", text: "text-orange-700", border: "border-orange-200", accent: "bg-orange-500" },
  "Tin Học": { bg: "bg-blue-500/10", text: "text-blue-700", border: "border-blue-200", accent: "bg-blue-500" },
  GDCD: { bg: "bg-cyan-500/10", text: "text-cyan-700", border: "border-cyan-200", accent: "bg-cyan-500" },
};

function getSubjectBadgeStyle(name: string) {
  for (const key of Object.keys(SUBJECT_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return SUBJECT_COLORS[key];
    }
  }
  return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", accent: "bg-slate-500" };
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
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);
  const [viewScope, setViewScope] = useState<"PERSONAL" | "HOMEROOM">("PERSONAL");
  const [displayMode, setDisplayMode] = useState<"DAY" | "WEEK">("DAY");
  const [loading, setLoading] = useState(true);

  async function loadData(dateStr: string, mode: "PERSONAL" | "HOMEROOM") {
    setLoading(true);
    try {
      const res = await getTeacherSchedule(dateStr, mode);
      setData(res);
      if (res?.days) {
        const todayHeader = res.days.find((d) => d.isToday);
        if (todayHeader) {
          setSelectedDayOfWeek(todayHeader.dayOfWeek);
        } else {
          setSelectedDayOfWeek(1);
        }
      }
    } catch (err) {
      console.error("Lỗi tải thời khóa biểu giáo viên:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate, viewScope);
  }, [selectedDate, viewScope]);

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
  const afternoonPeriods = [5, 6, 7, 8, 9, 10];
  const daysToRender = useMemo(() => data?.days.slice(0, 6) || [], [data?.days]);

  // Selected Day Header info
  const currentDayHeader = useMemo(() => {
    return daysToRender.find((d) => d.dayOfWeek === selectedDayOfWeek) || daysToRender[0];
  }, [daysToRender, selectedDayOfWeek]);

  // Selected Day Slots
  const currentDaySlots = useMemo(() => {
    const slots: { period: number; slot?: ScheduleSlot; timeInfo: { label: string; time: string; shift: "MORNING" | "AFTERNOON" } }[] = [];
    for (let p = 1; p <= 10; p++) {
      const s = getSlot(selectedDayOfWeek, p);
      if (s || p <= 5) {
        slots.push({
          period: p,
          slot: s,
          timeInfo: PERIOD_TIMES[p],
        });
      }
    }
    return slots;
  }, [selectedDayOfWeek, data?.slots]);

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto px-1 sm:px-4 pb-28 lg:pb-8">
      {/* Luminous Crystal Emerald Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg shadow-emerald-500/15 border border-white/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-white/20 border border-white/30 rounded-full text-white text-[11px] font-extrabold flex items-center gap-1 backdrop-blur-md">
                <Calendar className="w-3 h-3 text-emerald-100" />
                Thời Khóa Biểu Giảng Dạy
              </span>
              {data?.homeroomClassName && (
                <span className="px-2.5 py-0.5 bg-amber-400/30 border border-amber-300/40 rounded-full text-amber-100 text-[11px] font-black">
                  GVCN Lớp {data.homeroomClassName}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight truncate">
              {viewScope === "HOMEROOM"
                ? `Lớp Chủ Nhiệm ${data?.homeroomClassName || ""}`
                : `Lịch Dạy — ${data?.teacherName || "Giáo Viên"}`}
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 truncate">
              {viewScope === "HOMEROOM"
                ? `Xem toàn bộ lịch học của lớp chủ nhiệm ${data?.homeroomClassName}`
                : `Phân công giảng dạy bộ môn (${data?.specialty || "Bộ môn"}) & trạng thái điểm danh`}
            </p>
          </div>

          {/* Quick Attendance Button & Week Controls */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto bg-black/15 p-1 rounded-xl backdrop-blur-md border border-white/20">
            <button
              type="button"
              onClick={() => changeWeek(-7)}
              className="p-1.5 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer active:scale-95"
              title="Tuần trước"
              aria-label="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayString())}
              className="px-2.5 py-1 bg-white text-emerald-900 font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => changeWeek(7)}
              className="p-1.5 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer active:scale-95"
              title="Tuần sau"
              aria-label="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-white/30 rounded-lg text-[11px] font-bold bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Scope Switcher (Personal vs Homeroom) + View Mode (Day vs Week) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/90 backdrop-blur-xl border border-emerald-200/70 p-1.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewScope("PERSONAL")}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewScope === "PERSONAL"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Lịch Dạy Cá Nhân</span>
          </button>

          {data?.homeroomClassName && (
            <button
              type="button"
              onClick={() => setViewScope("HOMEROOM")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewScope === "HOMEROOM"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lớp Chủ Nhiệm ({data.homeroomClassName})</span>
          </button>
        )}
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={() => setDisplayMode("DAY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              displayMode === "DAY"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
            <span>Theo Ngày</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode("WEEK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              displayMode === "WEEK"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cả Tuần</span>
          </button>
          <Link
            href="/teacher/attendance"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Điểm Danh</span>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3 bg-white/80 rounded-2xl border border-emerald-200/60 shadow-xs">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Đang tải lịch dạy chi tiết...</span>
        </div>
      ) : displayMode === "DAY" ? (
        /* ===== DAY VIEW: Fast, Responsive Mobile View ===== */
        <div className="space-y-3">
          {/* Day of week selector */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2">
            {daysToRender.map((d) => {
              const isSelected = d.dayOfWeek === selectedDayOfWeek;
              return (
                <button
                  key={d.dayOfWeek}
                  type="button"
                  onClick={() => setSelectedDayOfWeek(d.dayOfWeek)}
                  className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md shadow-emerald-600/25 scale-[1.02]"
                      : d.isToday
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-black"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-[11px] sm:text-xs font-black uppercase ${isSelected ? "text-white" : ""}`}>
                    {d.label}
                  </span>
                  <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                    {d.formattedDate}
                  </span>
                  {d.isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Header Info */}
          <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-cyan-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950">
                {currentDayHeader?.label} ({currentDayHeader?.formattedDate})
              </span>
              {currentDayHeader?.isToday && (
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black">
                  HÔM NAY
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {currentDaySlots.filter((s) => s.slot).length} tiết giảng dạy
            </span>
          </div>

          {/* Day Slots List */}
          <div className="space-y-2">
            {currentDaySlots.map(({ period, slot, timeInfo }) => {
              const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

              if (!slot) {
                return (
                  <div
                    key={period}
                    className="p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-slate-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-center px-1.5 py-0.5 bg-slate-200/60 rounded text-[11px] font-bold text-slate-500">
                        {timeInfo.label}
                      </span>
                      <span className="text-xs italic">— Tiết trống (Không có lịch dạy) —</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{timeInfo.time}</span>
                  </div>
                );
              }

              return (
                <div
                  key={period}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 bg-white shadow-2xs hover:shadow-sm ${style?.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-10 rounded-full ${style?.accent}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{slot.subjectName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Lớp {slot.className}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${style?.bg} ${style?.text}`}>
                            {timeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600 font-medium">
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Phòng {slot.room}
                            </span>
                          )}
                          {slot.teacherName && viewScope === "HOMEROOM" && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              GV: {slot.teacherName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-slate-500 font-bold">{timeInfo.time}</span>
                      {slot.isAttendanceDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã điểm danh
                        </span>
                      ) : (
                        <Link
                          href="/teacher/attendance"
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Điểm danh ngay
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== FULL WEEK MATRIX TABLE ===== */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>
                {viewScope === "HOMEROOM"
                  ? `Thời Khóa Biểu Lớp Chủ Nhiệm ${data?.homeroomClassName}`
                  : `Ma Trận Lịch Dạy Tuần (${data?.teacherName || "Giáo Viên"})`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 italic">Dữ liệu đồng bộ trực tiếp</span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
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
                        d.isToday ? "bg-emerald-50/80 text-emerald-900 font-black border-b-2 border-b-emerald-600" : ""
                      }`}
                    >
                      <div>{d.label}</div>
                      <div className="text-[11px] text-slate-500 font-bold mt-0.5">({d.formattedDate})</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {/* Morning Shift */}
                <tr className="bg-emerald-50/60 font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
                  <td colSpan={7} className="py-1.5 px-4 text-left border-y border-emerald-100">
                    Ca Sáng (Tiết 1 – 4)
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
                            d.isToday ? "bg-emerald-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Lớp {slot.className}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-700 font-bold mt-1.5 space-y-0.5">
                                  {slot.room && (
                                    <div className="flex items-center gap-1 text-slate-500">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>Phòng {slot.room}</span>
                                    </div>
                                  )}
                                  {slot.teacherName && viewScope === "HOMEROOM" && (
                                    <div className="flex items-center gap-1 text-slate-600">
                                      <User className="w-3 h-3 text-indigo-500" />
                                      <span className="truncate">{slot.teacherName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                {slot.isAttendanceDone ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã điểm danh
                                  </span>
                                ) : (
                                  <Link
                                    href="/teacher/attendance"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300 transition-colors"
                                  >
                                    <AlertCircle className="w-3 h-3 text-amber-600" /> Điểm danh
                                  </Link>
                                )}
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

                {/* Afternoon Shift */}
                <tr className="bg-teal-50/60 font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                  <td colSpan={7} className="py-1.5 px-4 text-left border-y border-teal-100">
                    Ca Chiều (Tiết 5 – 8)
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
                            d.isToday ? "bg-emerald-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Lớp {slot.className}
                                  </span>
                                </div>

                                <div className="text-[10px] text-slate-700 font-bold mt-1.5 space-y-0.5">
                                  {slot.room && (
                                    <div className="flex items-center gap-1 text-slate-500">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>Phòng {slot.room}</span>
                                    </div>
                                  )}
                                  {slot.teacherName && viewScope === "HOMEROOM" && (
                                    <div className="flex items-center gap-1 text-slate-600">
                                      <User className="w-3 h-3 text-indigo-500" />
                                      <span className="truncate">{slot.teacherName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                {slot.isAttendanceDone ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã điểm danh
                                  </span>
                                ) : (
                                  <Link
                                    href="/teacher/attendance"
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300 transition-colors"
                                  >
                                    <AlertCircle className="w-3 h-3 text-amber-600" /> Điểm danh
                                  </Link>
                                )}
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
        </div>
      )}
    </div>
  );
}
