/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/dashboard/page.tsx`, `src/app/vice-principal/dashboard/page.tsx`
 * 2. Uniqueness: Modifying existing `src/components/dashboard/ClassDistributionWidget.tsx`.
 * 3. Schema: `ClassItemData` (`className`, `gradeLevel`, `studentCount`, `teacherName`, `avgScore`, `attendanceRate`, `maxCapacity`).
 * 4. Verbatim User Instruction: "giao diện đơn sắc quá và có quá nhiều tab bị không cần thiết, bạn hãy tối ưu lại  và quan tâm đến người dùng bạn hãy là coi mình là người dùng để tối ưu" & "tôi cần bạn xóa bỏ hết các icon và không được dùng cái màu sắc vàng và cái huy chương nó quá thiếu chuyên nghiệp".
 */

"use client";

import { useState } from "react";
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

const COLORS = ["#1e293b", "#0284c7", "#0d9488", "#16a34a", "#2563eb", "#475569", "#dc2626", "#4f46e5"];

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
            <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-800 text-blue-300 rounded text-[10px] font-bold uppercase tracking-wider">
              Cơ Cấu Khối
            </span>
            <h2 className="text-base font-bold text-slate-900">Phân Bổ Học Sinh Theo Lớp Học</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng số <span className="font-bold text-slate-900">{totalStudents}</span> học sinh trong{" "}
            <span className="font-bold text-slate-900">{classes.length}</span> lớp • Trung bình{" "}
            <span className="font-bold text-blue-700">{avgStudentsPerClass}</span> HS/lớp
          </p>
        </div>

        {/* Mode Toggle & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grade Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar border border-slate-200">
            <button
              onClick={() => setSelectedGrade("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedGrade === "ALL"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedGrade === g
                    ? "bg-slate-900 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              onClick={() => setViewMode("GRID")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dạng Thẻ
            </button>
            <button
              onClick={() => setViewMode("CHART")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "CHART"
                  ? "bg-slate-900 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Biểu Đồ
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

              // Capacity status color (strictly without yellow/amber)
              let barColor = "bg-emerald-600";
              let badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
              let statusText = "Sĩ số chuẩn";

              if (percent >= 100) {
                barColor = "bg-rose-600";
                badgeBg = "bg-rose-50 text-rose-800 border-rose-200";
                statusText = "Đầy chỉ tiêu";
              } else if (percent >= 85) {
                barColor = "bg-blue-600";
                badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
                statusText = "Gần đầy";
              } else if (percent < 50) {
                barColor = "bg-slate-500";
                badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
                statusText = "Số lượng ít";
              }

              return (
                <div
                  key={item.id || idx}
                  className="bg-slate-50/80 hover:bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-400 space-y-3 transition flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Header: Class Name + Grade Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {item.className}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          Khối {item.gradeLevel}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Teacher info */}
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">GVCN:</span>{" "}
                      {item.teacherName || "Chưa phân công"}
                    </p>

                    {/* Progress Bar & Student Count */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Sĩ số:</span>
                        <span className="font-bold text-slate-900">
                          {item.studentCount} / {maxCap} HS
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action button if handler provided */}
                  {onSelectClass && (
                    <button
                      onClick={() => onSelectClass(item.classId || item.id || "", item.className)}
                      className="w-full mt-2 pt-2 border-t border-slate-200 text-xs font-bold text-slate-800 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>Xem danh sách HS</span>
                      <span className="text-slate-400 font-mono text-[11px]">[→]</span>
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
              <Bar dataKey="studentCount" radius={[0, 4, 4, 0]}>
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
