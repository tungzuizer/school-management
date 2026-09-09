/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`).
 * 2. Affected APIs: `getTimetableMatrixAction` (`src/app/admin/schedule/actions.ts`).
 * 3. Schema: `Schedule`, `ClassRoom`, `Teacher`, `Subject`, `TeachingAssignment`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use client";

import React, { useState } from "react";
import {
  Lock,
  Sun,
  Moon,
  ArrowLeftRight,
  User,
  GraduationCap,
  Calendar,
  Building,
  Info,
  Clock,
  Sparkles,
  Layers,
  Search,
} from "lucide-react";

export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  period: number;
  room?: string | null;
  isFixed?: boolean;
}

interface TimetableMatrixViewProps {
  schedules: ScheduleItem[];
  classes: { id: string; name: string; gradeLevel?: number | null }[];
  teachers: { id: string; name: string; specialty?: string | null }[];
  viewMode: "CLASS" | "TEACHER" | "ALL_CLASSES";
  selectedClassId: string;
  selectedTeacherId: string;
  onSelectClass: (id: string) => void;
  onSelectTeacher: (id: string) => void;
  onOpenSwapModal: (
    sourceSlot: {
      classId: string;
      className: string;
      dayOfWeek: number;
      period: number;
      subjectName?: string;
      teacherName?: string;
      isFixed?: boolean;
    },
    targetSlot: {
      classId: string;
      className: string;
      dayOfWeek: number;
      period: number;
      subjectName?: string;
      teacherName?: string;
      isFixed?: boolean;
    }
  ) => void;
}

const DAYS = [
  { key: 1, label: "Thứ 2" },
  { key: 2, label: "Thứ 3" },
  { key: 3, label: "Thứ 4" },
  { key: 4, label: "Thứ 5" },
  { key: 5, label: "Thứ 6" },
  { key: 6, label: "Thứ 7" },
];

const PERIODS = [
  { number: 1, shift: "MORNING", label: "Tiết 1 (07:15 - 08:00)" },
  { number: 2, shift: "MORNING", label: "Tiết 2 (08:05 - 08:50)" },
  { number: 3, shift: "MORNING", label: "Tiết 3 (09:05 - 09:50)" },
  { number: 4, shift: "MORNING", label: "Tiết 4 (09:55 - 10:40)" },
  { number: 5, shift: "AFTERNOON", label: "Tiết 5 (13:30 - 14:15)" },
  { number: 6, shift: "AFTERNOON", label: "Tiết 6 (14:20 - 15:05)" },
  { number: 7, shift: "AFTERNOON", label: "Tiết 7 (15:20 - 16:05)" },
];

export default function TimetableMatrixView({
  schedules,
  classes,
  teachers,
  viewMode,
  selectedClassId,
  selectedTeacherId,
  onSelectClass,
  onSelectTeacher,
  onOpenSwapModal,
}: TimetableMatrixViewProps) {
  // Selected slot for Swap Flow
  const [selectedSwapSlot, setSelectedSwapSlot] = useState<{
    classId: string;
    className: string;
    dayOfWeek: number;
    period: number;
    subjectName?: string;
    teacherName?: string;
    isFixed?: boolean;
  } | null>(null);

  const [classSearch, setClassSearch] = useState("");

  const handleSlotClick = (
    classId: string,
    className: string,
    dayOfWeek: number,
    period: number,
    item?: ScheduleItem
  ) => {
    // If clicking on fixed period (Chào cờ / Sinh hoạt), alert
    if (item?.isFixed) {
      return;
    }

    const currentSlot = {
      classId,
      className,
      dayOfWeek,
      period,
      subjectName: item?.subjectName,
      teacherName: item?.teacherName,
      isFixed: item?.isFixed,
    };

    if (!selectedSwapSlot) {
      // First click: select source slot
      setSelectedSwapSlot(currentSlot);
    } else {
      // Second click: if same slot, deselect
      if (
        selectedSwapSlot.classId === classId &&
        selectedSwapSlot.dayOfWeek === dayOfWeek &&
        selectedSwapSlot.period === period
      ) {
        setSelectedSwapSlot(null);
        return;
      }

      // Check if same class for valid class schedule swap
      if (selectedSwapSlot.classId !== classId) {
        setSelectedSwapSlot(currentSlot);
        return;
      }

      // Launch swap modal
      onOpenSwapModal(selectedSwapSlot, currentSlot);
      setSelectedSwapSlot(null);
    }
  };

  const getSubjectColor = (subjectName: string, isFixed?: boolean) => {
    if (isFixed || subjectName === "Chào cờ" || subjectName === "Sinh hoạt lớp") {
      return "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200";
    }
    if (subjectName.includes("Toán") || subjectName.includes("Tin")) {
      return "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200";
    }
    if (subjectName.includes("Văn") || subjectName.includes("Sử") || subjectName.includes("Địa")) {
      return "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200";
    }
    if (subjectName.includes("Anh") || subjectName.includes("Ngoại ngữ")) {
      return "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200";
    }
    if (subjectName.includes("Lý") || subjectName.includes("Hóa") || subjectName.includes("Sinh")) {
      return "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200";
    }
    if (subjectName.includes("Thể dục") || subjectName.includes("GDQP")) {
      return "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200";
    }
    return "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100";
  };

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <div className="space-y-4">
      {/* Swap Mode Guidance Banner */}
      {selectedSwapSlot && (
        <div className="p-3.5 bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-700 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-600 text-white rounded-lg">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-900 dark:text-sky-100">
                Đang chọn tiết nguồn: Thứ {selectedSwapSlot.dayOfWeek === 1 ? "2" : selectedSwapSlot.dayOfWeek + 1} - Tiết {selectedSwapSlot.period} (
                {selectedSwapSlot.subjectName || "Trống"})
              </span>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                Nhấp vào ô tiết đích bạn muốn hoán đổi để AI kiểm tra xung đột sư phạm và thực hiện đổi lịch.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSwapSlot(null)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          >
            Hủy chọn
          </button>
        </div>
      )}

      {/* VIEW 1: SINGLE CLASS MATRIX */}
      {viewMode === "CLASS" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Class Select Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Thời Khóa Biểu Lớp: {currentClass?.name || "Chọn lớp"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chọn lớp xem:</span>
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} {c.gradeLevel ? `(Khối ${c.gradeLevel})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-28 text-center border-r border-slate-200 dark:border-slate-700">Ca / Tiết</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {PERIODS.map((p) => {
                  const isMorningStart = p.number === 1;
                  const isAfternoonStart = p.number === 5;

                  return (
                    <React.Fragment key={p.number}>
                      {/* Shift Separator Header */}
                      {isMorningStart && (
                        <tr className="bg-sky-50/50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 font-bold text-[11px]">
                          <td colSpan={7} className="px-4 py-1.5 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5" />
                            <span>BUỔI SÁNG (Tiết 1 - Tiết 4) - Tối đa 4 tiết</span>
                          </td>
                        </tr>
                      )}
                      {isAfternoonStart && (
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                          <td colSpan={7} className="px-4 py-1.5 border-t border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5" />
                            <span>BUỔI CHIỀU (Tiết 5 - Tiết 7) - Tối đa 3 tiết</span>
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        {/* Period Label Column */}
                        <td className="p-2.5 text-center font-bold bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700">
                          <span className="text-slate-800 dark:text-slate-200 block text-xs">Tiết {p.number}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal block">
                            {p.number <= 4 ? "Sáng" : "Chiều"}
                          </span>
                        </td>

                        {/* Day Slots */}
                        {DAYS.map((d) => {
                          const item = schedules.find(
                            (s) =>
                              s.classId === selectedClassId &&
                              s.dayOfWeek === d.key &&
                              s.period === p.number
                          );

                          const isSelectedForSwap =
                            selectedSwapSlot?.classId === selectedClassId &&
                            selectedSwapSlot.dayOfWeek === d.key &&
                            selectedSwapSlot.period === p.number;

                          return (
                            <td
                              key={d.key}
                              onClick={() =>
                                handleSlotClick(
                                  selectedClassId,
                                  currentClass?.name || "",
                                  d.key,
                                  p.number,
                                  item
                                )
                              }
                              className={`p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 transition-all cursor-pointer relative ${
                                isSelectedForSwap
                                  ? "ring-2 ring-sky-500 bg-sky-100 dark:bg-sky-950"
                                  : "hover:bg-sky-50/40 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              {item ? (
                                <div
                                  className={`p-2 rounded-lg border text-xs shadow-xs space-y-1 ${getSubjectColor(
                                    item.subjectName,
                                    item.isFixed
                                  )}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {item.subjectName}
                                    </span>
                                    {item.isFixed && (
                                      <span
                                        title="Tiết cố định theo quy định sư phạm (Chào cờ/Sinh hoạt do GVCN phụ trách)"
                                        className="px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold flex items-center gap-1 shrink-0"
                                      >
                                        <Lock className="w-2.5 h-2.5" />
                                        <span>
                                          {item.subjectName.toLowerCase().includes("chào cờ")
                                            ? "👑 GVCN Chào cờ"
                                            : "👑 GVCN Sinh hoạt"}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate flex items-center gap-1">
                                    <User className="w-3 h-3 shrink-0" />
                                    <span>{item.teacherName}</span>
                                  </div>
                                  {item.room && (
                                    <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                                      Phòng: {item.room}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-14 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[11px] hover:border-sky-300 hover:text-sky-500 transition-colors">
                                  <span>Trống</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: TEACHER MATRIX */}
      {viewMode === "TEACHER" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Teacher Select Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lịch Giảng Dạy Giáo Viên: {currentTeacher?.name || "Chọn giáo viên"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chọn giáo viên:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => onSelectTeacher(e.target.value)}
                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.specialty ? `(${t.specialty})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher Timetable Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-28 text-center border-r border-slate-200 dark:border-slate-700">Ca / Tiết</th>
                  {DAYS.map((d) => (
                    <th key={d.key} className="p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {PERIODS.map((p) => {
                  const isMorningStart = p.number === 1;
                  const isAfternoonStart = p.number === 5;

                  return (
                    <React.Fragment key={p.number}>
                      {isMorningStart && (
                        <tr className="bg-sky-50/50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 font-bold text-[11px]">
                          <td colSpan={7} className="px-4 py-1.5 border-b border-sky-100 dark:border-sky-900/50 flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5" />
                            <span>BUỔI SÁNG (Tiết 1 - Tiết 4)</span>
                          </td>
                        </tr>
                      )}
                      {isAfternoonStart && (
                        <tr className="bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                          <td colSpan={7} className="px-4 py-1.5 border-t border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5" />
                            <span>BUỔI CHIỀU (Tiết 5 - Tiết 7)</span>
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="p-2.5 text-center font-bold bg-slate-50/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-700">
                          <span className="text-slate-800 dark:text-slate-200 block text-xs">Tiết {p.number}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-normal block">
                            {p.number <= 4 ? "Sáng" : "Chiều"}
                          </span>
                        </td>

                        {DAYS.map((d) => {
                          const item = schedules.find(
                            (s) =>
                              s.teacherId === selectedTeacherId &&
                              s.dayOfWeek === d.key &&
                              s.period === p.number
                          );

                          return (
                            <td key={d.key} className="p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                              {item ? (
                                <div
                                  className={`p-2 rounded-lg border text-xs shadow-xs space-y-1 ${getSubjectColor(
                                    item.subjectName,
                                    item.isFixed
                                  )}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {item.subjectName}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100 font-bold rounded text-[10px]">
                                      {item.className}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                    {item.room ? `Phòng: ${item.room}` : "Phòng lớp"}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-14 rounded-lg border border-dashed border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[11px]">
                                  <span>Nghỉ</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: ALL CLASSES MATRIX (SCHOOL MASTER VIEW) */}
      {viewMode === "ALL_CLASSES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Ma Trận Toàn Trường ({classes.length} lớp học)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Tổng quan lịch học theo từng lớp giúp BGH bao quát toàn bộ hoạt động giảng dạy
                </p>
              </div>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
              <input
                type="text"
                placeholder="Lọc tên lớp (10A1, 11A2...)"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-600 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {classes
              .filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase()))
              .map((cls) => {
                const classSchedules = schedules.filter((s) => s.classId === cls.id);

                return (
                  <div
                    key={cls.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Lớp {cls.name} {cls.gradeLevel ? `(Khối ${cls.gradeLevel})` : ""}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {classSchedules.length} tiết / tuần
                      </span>
                    </div>

                    <div className="p-3 overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse min-w-[400px]">
                        <thead>
                          <tr className="text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
                            <th className="p-1 w-10 text-center">Tiết</th>
                            {DAYS.map((d) => (
                              <th key={d.key} className="p-1 text-center">
                                {d.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {PERIODS.map((p) => (
                            <tr key={p.number}>
                              <td className="p-1 text-center font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-850">
                                T{p.number}
                              </td>
                              {DAYS.map((d) => {
                                const item = classSchedules.find(
                                  (s) => s.dayOfWeek === d.key && s.period === p.number
                                );
                                return (
                                  <td key={d.key} className="p-1 text-center">
                                    {item ? (
                                      <div
                                        title={`${item.subjectName} - GV: ${item.teacherName}`}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${getSubjectColor(
                                          item.subjectName,
                                          item.isFixed
                                        )}`}
                                      >
                                        {item.subjectName}
                                      </div>
                                    ) : (
                                      <span className="text-slate-600 dark:text-slate-300 text-[10px]">-</span>
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
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
