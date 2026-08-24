"use client";

import { useEffect, useState } from "react";
import { getStudentSchedule, StudentScheduleData, StudentScheduleSlot } from "../actions";
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  User,
  GraduationCap,
  Sparkles,
  Info,
} from "lucide-react";

const PERIOD_TIMES: Record<number, { label: string; time: string }> = {
  1: { label: "Tiết 1", time: "07:00 - 07:45" },
  2: { label: "Tiết 2", time: "07:50 - 08:35" },
  3: { label: "Tiết 3", time: "08:50 - 09:35" },
  4: { label: "Tiết 4", time: "09:40 - 10:25" },
  5: { label: "Tiết 5", time: "13:00 - 13:45" },
  6: { label: "Tiết 6", time: "13:50 - 14:35" },
  7: { label: "Tiết 7", time: "14:50 - 15:35" },
  8: { label: "Tiết 8", time: "15:40 - 16:25" },
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

export default function StudentSchedulePage() {
  const [data, setData] = useState<StudentScheduleData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [loading, setLoading] = useState(true);

  async function loadData(dateStr: string) {
    setLoading(true);
    try {
      const res = await getStudentSchedule(dateStr);
      setData(res);
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
  const afternoonPeriods = [5, 6, 7, 8];

  const daysToRender = data?.days.slice(0, 6) || []; // Monday to Saturday

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-3xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Thời Khóa Biểu Học Sinh
              </span>
              {data?.className && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[11px] font-bold">
                  Lớp {data.className}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Lịch Học Theo Ngày — {data?.studentName || "Học sinh"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              {data?.schoolName || "Trường THCS"} — Cập nhật lịch học thực tế, phòng học, giáo viên & điểm danh hàng ngày.
            </p>
          </div>

          {/* Week Controls & Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/10">
              <button
                onClick={() => changeWeek(-7)}
                className="p-1.5 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(getTodayString())}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Hôm nay
              </button>
              <button
                onClick={() => changeWeek(7)}
                className="p-1.5 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-white/20 rounded-xl text-xs font-bold bg-slate-900/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Notifications & Announcements Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Bell className="w-4 h-4 bell-swing" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                Thông Báo & Nhắc Nhở Học Tập
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] rounded-full border border-amber-500/30 font-bold">
                  {data?.notifications.length || 0} thông báo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Các thông báo mới nhất từ BGH và Giáo viên bộ môn</p>
            </div>
          </div>
        </div>

        {data?.notifications && data.notifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.notifications.map((n) => (
              <div
                key={n.id}
                className="bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 p-3.5 rounded-xl flex flex-col justify-between transition-all hover:bg-slate-800 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-indigo-300 line-clamp-1 flex items-center gap-1.5">
                      {n.isImportant && <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">{n.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{n.content}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <User className="w-3 h-3 text-indigo-400" /> {n.senderName}
                  </span>
                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold">
                    {n.type || "Thông báo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-900/50 rounded-xl border border-slate-800">
            Hiện tại không có thông báo mới nào cho lớp học của bạn.
          </div>
        )}
      </div>

      {/* Timetable Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Thời Khóa Biểu Học Tập Tuần {data?.selectedDateStr ? `(${data.selectedDateStr})` : ""}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Có mặt
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Clock3 className="w-3.5 h-3.5" /> Muộn
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> Vắng
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang cập nhật thời khóa biểu theo ngày...</span>
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
        )}
      </div>
    </div>
  );
}
