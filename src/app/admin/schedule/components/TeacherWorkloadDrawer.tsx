/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`).
 * 2. Affected APIs: `getTeacherWorkloadStatsAction` (`src/app/admin/schedule/actions.ts`).
 * 3. Schema: `Teacher`, `Schedule`, `ClassRoom`, `Subject`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Activity,
  Search,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  X,
} from "lucide-react";
import { getTeacherWorkloadStatsAction } from "../actions";

interface TeacherWorkloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId?: string;
  onSelectTeacher?: (teacherId: string) => void;
}

export default function TeacherWorkloadDrawer({
  isOpen,
  onClose,
  schoolId,
  onSelectTeacher,
}: TeacherWorkloadDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOverloadedOnly, setFilterOverloadedOnly] = useState(false);
  const [data, setData] = useState<{
    teachers: {
      teacherId: string;
      teacherName: string;
      specialty?: string | null;
      totalPeriods: number;
      totalShifts: number;
      isOverloaded: boolean;
      idleGapsCount: number;
      classesTaught: string[];
      shiftsList: string[];
    }[];
    summary: {
      totalTeachers: number;
      totalOverloadedTeachers: number;
      totalIdleGapsInSchool: number;
      averagePeriodsPerTeacher: number | string;
    };
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, schoolId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await getTeacherWorkloadStatsAction(schoolId === "ALL" ? undefined : schoolId);
      if (res && !("error" in res)) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to load teacher workload stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredTeachers = (data?.teachers || []).filter((t) => {
    const matchesSearch =
      t.teacherName.toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty && t.specialty.toLowerCase().includes(search.toLowerCase()));
    if (filterOverloadedOnly) {
      return matchesSearch && (t.isOverloaded || t.idleGapsCount > 0);
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Phân Tích Tải Trọng & Mật Độ Dạy Của Giáo Viên
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Theo dõi quy định tối đa 5 buổi/tuần, số tiết lủng và phân bổ các lớp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-700 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Dashboard Cards */}
        {data && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Tổng số giáo viên
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {data.summary.totalTeachers}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Vượt quá 5 buổi/tuần
              </span>
              <span
                className={`text-lg font-bold ${
                  data.summary.totalOverloadedTeachers > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {data.summary.totalOverloadedTeachers} GV
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Tổng số tiết lủng/rơi
              </span>
              <span
                className={`text-lg font-bold ${
                  data.summary.totalIdleGapsInSchool > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {data.summary.totalIdleGapsInSchool} tiết
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Trung bình tiết / GV
              </span>
              <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                {data.summary.averagePeriodsPerTeacher}
              </span>
            </div>
          </div>
        )}

        {/* Search and Quick Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" />
            <input
              type="text"
              placeholder="Tìm theo tên giáo viên, chuyên môn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-700 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterOverloadedOnly}
              onChange={(e) => setFilterOverloadedOnly(e.target.checked)}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
            />
            <span>Chỉ hiện GV có cảnh báo (vượt ca hoặc có tiết lủng)</span>
          </label>
        </div>

        {/* Teacher List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-700 dark:text-slate-300 space-y-3">
              <Activity className="w-6 h-6 animate-spin text-sky-600" />
              <span className="text-xs font-medium">Đang tải và tính toán số liệu sư phạm...</span>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-16 text-slate-700 dark:text-slate-300">
              <p className="text-sm font-semibold">Không tìm thấy giáo viên phù hợp</p>
              <p className="text-xs mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc.</p>
            </div>
          ) : (
            filteredTeachers.map((t) => (
              <div
                key={t.teacherId}
                className={`p-4 rounded-xl border transition-all ${
                  t.isOverloaded
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                    : t.idleGapsCount > 0
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                    : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {t.teacherName}
                      </h4>
                      {t.specialty && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded">
                          {t.specialty}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Tổng số: <strong className="text-sky-600 dark:text-sky-400">{t.totalPeriods}</strong> tiết/tuần
                      </span>
                      <span>•</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        Dạy tại: {t.classesTaught.length > 0 ? t.classesTaught.join(", ") : "Chưa phân công"}
                      </span>
                    </div>
                  </div>

                  {/* Shifts & Gaps Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        t.totalShifts > 5
                          ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {t.totalShifts > 5 ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {t.totalShifts}/5 buổi dạy
                    </span>

                    {t.idleGapsCount > 0 && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800">
                        {t.idleGapsCount} tiết lủng
                      </span>
                    )}

                    {onSelectTeacher && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTeacher(t.teacherId);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Xem TKB
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Overloaded Warning Explanation */}
                {t.isOverloaded && (
                  <div className="mt-2.5 pt-2.5 border-t border-rose-100 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Giáo viên đang được xếp {t.totalShifts} buổi dạy trong tuần (vượt định mức 5 buổi/tuần theo quy định). Khuyến nghị dồn tiết để gom buổi.
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Đóng bảng phân tích
          </button>
        </div>
      </div>
    </div>
  );
}
