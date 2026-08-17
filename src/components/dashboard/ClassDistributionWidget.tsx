"use client";

import { useState } from "react";
import { Users, School, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface ClassItemData {
  id?: string;
  classId?: string;
  className: string;
  gradeLevel: number;
  studentCount: number;
  teacherName?: string;
  avgScore?: number;
  attendanceRate?: number;
  maxCapacity?: number;
}

const COLORS = ["#6366f1", "#0284c7", "#0d9488", "#16a34a", "#ca8a04", "#d97706", "#dc2626", "#9333ea"];

export default function ClassDistributionWidget({
  classes = [],
  onSelectClass,
}: {
  classes: ClassItemData[];
  onSelectClass?: (classId: string, className: string) => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState<number | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "CHART">("GRID");

  // Extract unique grades
  const grades = Array.from(new Set(classes.map((c) => c.gradeLevel).filter(Boolean))).sort(
    (a, b) => a - b
  );

  // Filter classes
  const filteredClasses = classes.filter((c) => {
    if (selectedGrade === "ALL") return true;
    return c.gradeLevel === selectedGrade;
  });

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);
  const avgStudentsPerClass = classes.length > 0 ? Math.round(totalStudents / classes.length) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4 sm:space-y-5 transition-all duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Phân Bổ Học Sinh Theo Lớp Học</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng số <span className="font-extrabold text-slate-800">{totalStudents}</span> học sinh trong{" "}
            <span className="font-extrabold text-slate-800">{classes.length}</span> lớp • Trung bình{" "}
            <span className="font-extrabold text-indigo-600">{avgStudentsPerClass}</span> HS/lớp
          </p>
        </div>

        {/* Mode Toggle & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grade Filter Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedGrade("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all active-press shrink-0 ${
                selectedGrade === "ALL"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg transition-all active-press shrink-0 ${
                  selectedGrade === g
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("GRID")}
              className={`px-2.5 py-1.5 rounded-lg transition-all active-press ${
                viewMode === "GRID"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎴 Dạng Thẻ
            </button>
            <button
              onClick={() => setViewMode("CHART")}
              className={`px-2.5 py-1.5 rounded-lg transition-all active-press ${
                viewMode === "CHART"
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 Biểu Đồ
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 text-xs">
              Không tìm thấy lớp học nào thuộc khối đã chọn.
            </div>
          ) : (
            filteredClasses.map((item, idx) => {
              const maxCap = item.maxCapacity || 40;
              const percent = Math.min(100, Math.round((item.studentCount / maxCap) * 100));

              // Capacity status color
              let barColor = "bg-gradient-to-r from-emerald-400 to-emerald-600";
              let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
              let statusText = "Sĩ số chuẩn";

              if (percent >= 100) {
                barColor = "bg-gradient-to-r from-rose-400 to-rose-600";
                badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
                statusText = "Đầy chỉ tiêu";
              } else if (percent >= 85) {
                barColor = "bg-gradient-to-r from-amber-400 to-amber-600";
                badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                statusText = "Gần đầy";
              } else if (percent < 50) {
                barColor = "bg-gradient-to-r from-sky-400 to-sky-600";
                badgeBg = "bg-sky-50 text-sky-700 border-sky-200";
                statusText = "Số lượng ít";
              }

              return (
                <div
                  key={item.id || idx}
                  className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 hover-lift space-y-3 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header: Class Name + Grade Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                          {item.className}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          Khối {item.gradeLevel}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Teacher info */}
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="font-semibold text-slate-700">GVCN:</span>{" "}
                      {item.teacherName || "Chưa phân công"}
                    </p>

                    {/* Progress Bar & Student Count */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-500" /> Sĩ số:
                        </span>
                        <span className="font-bold text-slate-900">
                          {item.studentCount} / {maxCap} HS
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 relative ${barColor}`}
                          style={{ width: `${percent}%` }}
                        >
                          <div className="absolute inset-0 animate-shimmer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action button if handler provided */}
                  {onSelectClass && (
                    <button
                      onClick={() => onSelectClass(item.classId || item.id || "", item.className)}
                      className="w-full mt-2 pt-2 border-t border-slate-200/60 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 group-hover:underline active-press"
                    >
                      <span>Xem danh sách HS</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Horizontal Bar Chart View */}
      {viewMode === "CHART" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Biểu đồ so sánh sĩ số học sinh giữa các lớp học:</p>
          <ResponsiveContainer width="100%" height={Math.max(260, filteredClasses.length * 35)}>
            <BarChart layout="vertical" data={filteredClasses} margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" fontSize={11} tickLine={false} />
              <YAxis dataKey="className" type="category" fontSize={11} tickLine={false} width={70} />
              <Tooltip formatter={(val) => [`${val} Học sinh`, "Sĩ số"]} />
              <Bar dataKey="studentCount" radius={[0, 6, 6, 0]}>
                {filteredClasses.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
