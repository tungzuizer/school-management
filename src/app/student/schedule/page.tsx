/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Student Portal Navigation (`src/app/student/schedule/page.tsx`), `src/app/student/layout.tsx:80`, `src/components/layout/MobileBottomNav.tsx:98`.
 * 2. Affected APIs: `getStudentSchedule` (`src/app/student/actions.ts`).
 * 3. Schema: `StudentScheduleData`, `StudentScheduleSlot`, `Schedule`, `Subject`, `ClassRoom`.
 * 4. Verbatim User Instruction: "chữ trên điện thoại vẫn đang hơi to" -> "theo khuyến nghị của bạn".
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { getStudentSchedule, StudentScheduleData, StudentScheduleSlot } from "../actions";
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  GraduationCap,
  Sparkles,
  Layers,
  CalendarDays,
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

export default function StudentSchedulePage() {
  const [data, setData] = useState<StudentScheduleData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"DAY" | "WEEK">("DAY");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData(dateStr: string) {
    setLoading(true);
    try {
      const res = await getStudentSchedule(dateStr);
      setData(res);
      // Auto select current day of week if in week
      if (res?.days) {
        const todayHeader = res.days.find((d) => d.isToday);
        if (todayHeader) {
          setSelectedDayOfWeek(todayHeader.dayOfWeek);
        } else {
          setSelectedDayOfWeek(1); // Monday default
        }
      }
    } catch (err) {
      console.error("Lỗi tải thời khóa biểu học sinh:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const changeWeek = (daysOffset: number) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const getSlot = (dayOfWeek: number, period: number): StudentScheduleSlot | undefined => {
    return data?.schedules.find((s) => s.dayOfWeek === dayOfWeek && s.period === period);
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
    const slots: { period: number; slot?: StudentScheduleSlot; timeInfo: { label: string; time: string; shift: "MORNING" | "AFTERNOON" } }[] = [];
    for (let p = 1; p <= 10; p++) {
      const s = getSlot(selectedDayOfWeek, p);
      if (s || p <= 5) {
        // Show all morning + active afternoon slots
        slots.push({
          period: p,
          slot: s,
          timeInfo: PERIOD_TIMES[p],
        });
      }
    }
    return slots;
  }, [selectedDayOfWeek, data?.schedules]);

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto px-1 sm:px-4 pb-28 lg:pb-8">
      {/* Compact Luminous Glass Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-lg shadow-blue-500/15 border border-white/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-white/20 border border-white/30 rounded-full text-white text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 backdrop-blur-md">
                <Calendar className="w-3 h-3 text-sky-200" />
                Thời Khóa Biểu Học Sinh
              </span>
              {data?.className && (
                <span className="px-2.5 py-0.5 bg-emerald-400/30 border border-emerald-300/40 rounded-full text-emerald-100 text-[10px] sm:text-[11px] font-black">
                  Lớp {data.className}
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-2xl font-black tracking-tight truncate">
              {data?.studentName || "Học sinh"} — Lịch Học Tuần
            </h1>
            <p className="text-[10.5px] sm:text-xs text-blue-100/90 truncate">
              {data?.schoolName || "Trường học"} • Cập nhật lịch học, giáo viên & điểm danh
            </p>
          </div>

          {/* Week Controls & Date Filter */}
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
              className="px-2.5 py-1 bg-white text-indigo-900 font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
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

      {/* Expandable / Collapsible Announcements Bar (Compact on Mobile by Default) */}
      {data?.notifications && data.notifications.length > 0 && (
        <div className="bg-white/85 backdrop-blur-xl border border-blue-200/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-blue-50/50 transition-colors cursor-pointer"
            aria-expanded={isNotificationsOpen}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-amber-500/15 text-amber-600 rounded-lg border border-amber-500/30 shrink-0">
                <Bell className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  Thông Báo & Nhắc Nhở Học Tập
                  <span className="px-2 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-black border border-amber-200">
                    {data.notifications.length}
                  </span>
                </span>
                {!isNotificationsOpen && (
                  <p className="text-[11px] text-slate-500 truncate max-w-[280px] sm:max-w-md">
                    {data.notifications[0]?.title}: {data.notifications[0]?.content}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 shrink-0">
              <span>{isNotificationsOpen ? "Thu gọn" : "Xem chi tiết"}</span>
              {isNotificationsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {isNotificationsOpen && (
            <div className="p-3 border-t border-blue-100 bg-blue-50/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white border border-blue-200/60 p-3 rounded-xl flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <span className="text-xs font-bold text-blue-900 line-clamp-1 flex items-center gap-1">
                        {n.isImportant && <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />}
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.content}</p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3 h-3 text-indigo-500" /> {n.senderName}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">
                      {n.type || "Thông báo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Switcher: DAY VIEW (Default on mobile) vs WEEK MATRIX */}
      <div className="flex items-center justify-between gap-2 bg-white/90 backdrop-blur-xl border border-blue-200/70 p-1.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode("DAY")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "DAY"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Theo Ngày (Hôm nay)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("WEEK")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "WEEK"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cả Tuần (Ma trận)</span>
          </button>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-600 pr-2">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-3 h-3" /> Có mặt
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Clock3 className="w-3 h-3" /> Muộn
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <XCircle className="w-3 h-3" /> Vắng
          </span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3 bg-white/80 rounded-2xl border border-blue-200/60 shadow-xs">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600">Đang tải lịch học chi tiết...</span>
        </div>
      ) : viewMode === "DAY" ? (
        /* ===== DAY VIEW: Perfect for iPhone Mobile Viewport ===== */
        <div className="space-y-3">
          {/* Day of week pill selector */}
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
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-600 shadow-md shadow-blue-600/25 scale-[1.02]"
                      : d.isToday
                      ? "bg-blue-50 text-blue-900 border-blue-300 font-black"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-[10px] sm:text-xs font-black uppercase ${isSelected ? "text-white" : ""}`}>
                    {d.label}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-bold mt-0.5 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {d.formattedDate}
                  </span>
                  {d.isToday && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Info Badge */}
          <div className="px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-sky-50 border border-blue-200/80 rounded-xl flex items-center justify-between text-[11px] sm:text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-950">
                {currentDayHeader?.label} ({currentDayHeader?.formattedDate})
              </span>
              {currentDayHeader?.isToday && (
                <span className="px-1.5 sm:px-2 py-0.5 bg-blue-600 text-white rounded-md text-[9px] sm:text-[10px] font-black">
                  HÔM NAY
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
              {currentDaySlots.filter((s) => s.slot).length} tiết học
            </span>
          </div>

          {/* Period cards list */}
          <div className="space-y-2">
            {currentDaySlots.map(({ period, slot, timeInfo }) => {
              const style = slot ? getSubjectBadgeStyle(slot.subjectName) : null;

              if (!slot) {
                return (
                  <div
                    key={period}
                    className="p-2.5 sm:p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-slate-400"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="w-12 sm:w-14 text-center px-1.5 py-0.5 bg-slate-200/60 rounded text-[10px] sm:text-[11px] font-bold text-slate-500">
                        {timeInfo.label}
                      </span>
                      <span className="text-[10.5px] sm:text-xs italic">— Tiết trống (Không có lịch) —</span>
                    </div>
                    <span className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium">{timeInfo.time}</span>
                  </div>
                );
              }

              return (
                <div
                  key={period}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 bg-white shadow-2xs hover:shadow-sm ${style?.border}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className={`w-1.5 sm:w-2 h-9 sm:h-10 rounded-full ${style?.accent}`} />
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-slate-900">{slot.subjectName}</span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-extrabold ${style?.bg} ${style?.text}`}>
                            {timeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 sm:gap-3 mt-1 text-[10px] sm:text-[11px] text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                            {slot.teacherName}
                          </span>
                          {slot.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {slot.room}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9.5px] sm:text-[10px] text-slate-500 font-bold">{timeInfo.time}</span>
                      {slot.attendanceStatus === "PRESENT" ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Có mặt
                        </span>
                      ) : slot.attendanceStatus === "LATE" ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-300">
                          <Clock3 className="w-3 h-3 text-amber-600" /> Đi muộn
                        </span>
                      ) : slot.attendanceStatus?.includes("ABSENT") ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-extrabold text-rose-700 bg-rose-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" /> Vắng mặt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          Chưa học
                        </span>
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
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Thời Khóa Biểu Học Tập Tuần {data?.selectedDateStr ? `(${data.selectedDateStr})` : ""}</span>
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
                        d.isToday ? "bg-blue-50/80 text-blue-900 font-black border-b-2 border-b-blue-600" : ""
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
                <tr className="bg-blue-50/60 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                  <td colSpan={7} className="py-1.5 px-4 text-left border-y border-blue-100">
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
                            d.isToday ? "bg-blue-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                </div>

                                <div className="text-[10px] text-slate-700 font-bold mt-1.5 space-y-0.5">
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <GraduationCap className="w-3 h-3 text-slate-400" />
                                    <span className="truncate">{slot.teacherName}</span>
                                  </div>
                                  {slot.room && (
                                    <div className="flex items-center gap-1 text-slate-500">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{slot.room}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Student Attendance Status */}
                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                {slot.attendanceStatus === "PRESENT" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Có mặt
                                  </span>
                                ) : slot.attendanceStatus === "LATE" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                    <Clock3 className="w-3 h-3 text-amber-600" /> Đi muộn
                                  </span>
                                ) : slot.attendanceStatus?.includes("ABSENT") ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                    <XCircle className="w-3 h-3 text-rose-600" /> Vắng mặt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                    Chưa học
                                  </span>
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
                            d.isToday ? "bg-blue-50/10" : ""
                          }`}
                        >
                          {slot ? (
                            <div
                              className={`h-full p-2.5 rounded-xl border ${style?.bg} ${style?.border} flex flex-col justify-between shadow-2xs transition-transform hover:scale-[1.01]`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-black ${style?.text}`}>{slot.subjectName}</span>
                                </div>

                                <div className="text-[10px] text-slate-700 font-bold mt-1.5 space-y-0.5">
                                  <div className="flex items-center gap-1 text-slate-600">
                                    <GraduationCap className="w-3 h-3 text-slate-400" />
                                    <span className="truncate">{slot.teacherName}</span>
                                  </div>
                                  {slot.room && (
                                    <div className="flex items-center gap-1 text-slate-500">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{slot.room}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Student Attendance Status */}
                              <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                                {slot.attendanceStatus === "PRESENT" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Có mặt
                                  </span>
                                ) : slot.attendanceStatus === "LATE" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                    <Clock3 className="w-3 h-3 text-amber-600" /> Đi muộn
                                  </span>
                                ) : slot.attendanceStatus?.includes("ABSENT") ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                    <XCircle className="w-3 h-3 text-rose-600" /> Vắng mặt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                    Chưa học
                                  </span>
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
