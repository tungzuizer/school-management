"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyAssignments, getStudentGrades, saveGrade } from "./actions";
import { useToast } from "@/components/ui/Toast";

interface Assignment {
  id: string;
  classId: string;
  className: string;
  gradeLevel: number;
  subjectId: string;
  subjectName: string;
}

interface StudentGrade {
  studentId: string;
  studentName: string;
  studentCode: string | null;
  oral: number | null;
  fifteenMin: number | null;
  midterm: number | null;
  final: number | null;
  average: number | null;
  oralId: string | null;
  fifteenMinId: string | null;
  midtermId: string | null;
  finalId: string | null;
}

const GRADE_COLUMNS = [
  { key: "oral", label: "Miệng", type: "ORAL", idKey: "oralId", weight: 1 },
  { key: "fifteenMin", label: "15 phút", type: "FIFTEEN_MIN", idKey: "fifteenMinId", weight: 1 },
  { key: "midterm", label: "Giữa kỳ", type: "MIDTERM", idKey: "midtermId", weight: 2 },
  { key: "final", label: "Cuối kỳ", type: "FINAL", idKey: "finalId", weight: 3 },
];

function getRating(avg: number | null): { label: string; color: string } {
  if (avg === null) return { label: "—", color: "text-gray-400" };
  if (avg >= 8) return { label: "Giỏi", color: "text-green-600" };
  if (avg >= 6.5) return { label: "Khá", color: "text-blue-600" };
  if (avg >= 5) return { label: "Đạt", color: "text-yellow-600" };
  return { label: "Chưa đạt", color: "text-red-600" };
}

export default function GradesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [term, setTerm] = useState(1);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  // Load assignments
  useEffect(() => {
    getMyAssignments().then((data) => {
      setAssignments(data);
      if (data.length > 0) setSelectedAssignment(data[0].id);
    });
  }, []);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);

  // Load grades when assignment/term changes
  const loadGrades = useCallback(async () => {
    if (!currentAssignment) return;
    setLoading(true);
    const data = await getStudentGrades(
      currentAssignment.classId,
      currentAssignment.subjectId,
      term
    );
    setStudents(data as StudentGrade[]);
    setLoading(false);
  }, [currentAssignment, term]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  // Handle cell edit
  const handleCellBlur = async (
    studentId: string,
    colKey: string,
    type: string,
    existingId: string | null,
    value: string
  ) => {
    if (!currentAssignment) return;
    const score = parseFloat(value);
    if (isNaN(score) || value.trim() === "") return;
    if (score < 0 || score > 10) {
      showToast("Điểm phải từ 0 đến 10", "error");
      return;
    }

    const cellKey = `${studentId}-${colKey}`;
    setSavingCell(cellKey);

    const result = await saveGrade(
      studentId,
      currentAssignment.subjectId,
      term,
      type,
      score,
      existingId
    );

    setSavingCell(null);

    if (result.success) {
      // Reload to recalculate averages
      await loadGrades();
    } else {
      showToast(result.error || "Lỗi khi lưu", "error");
    }
  };

  // Stats
  const totalStudents = students.length;
  const completedStudents = students.filter((s) => s.average !== null).length;
  const avgScore = students.filter((s) => s.average !== null).length > 0
    ? (students.reduce((sum, s) => sum + (s.average || 0), 0) / completedStudents).toFixed(2)
    : "—";

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhập điểm</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lớp - Môn</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 min-w-[250px]"
            >
              {assignments.length === 0 && <option value="">Chưa có phân công</option>}
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.className} (K{a.gradeLevel}) — {a.subjectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
            <select
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {students.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
            <span className="text-sm text-gray-500">Sĩ số:</span>
            <span className="font-bold">{totalStudents}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
            <span className="text-sm text-gray-500">Đã đủ điểm:</span>
            <span className="font-bold text-green-600">{completedStudents}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
            <span className="text-sm text-gray-500">TB lớp:</span>
            <span className="font-bold text-blue-600">{avgScore}</span>
          </div>
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase w-10">STT</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Mã HS</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase min-w-[180px]">Họ tên</th>
                {GRADE_COLUMNS.map((col) => (
                  <th key={col.key} className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-24">
                    {col.label}
                    <div className="text-[10px] text-gray-400 font-normal">HS: {col.weight}</div>
                  </th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-20 bg-blue-50">TB</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase w-24 bg-blue-50">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {assignments.length === 0 ? "Bạn chưa được phân công giảng dạy" : "Lớp chưa có học sinh"}
                </td></tr>
              ) : (
                students.map((s, idx) => {
                  const rating = getRating(s.average);
                  return (
                    <tr key={s.studentId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{s.studentCode || "—"}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{s.studentName}</td>
                      {GRADE_COLUMNS.map((col) => {
                        const cellKey = `${s.studentId}-${col.key}`;
                        const currentValue = s[col.key as keyof StudentGrade] as number | null;
                        const existingId = s[col.idKey as keyof StudentGrade] as string | null;
                        return (
                          <td key={col.key} className="px-1 py-1 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.25}
                              defaultValue={currentValue !== null ? currentValue : ""}
                              onBlur={(e) => handleCellBlur(s.studentId, col.key, col.type, existingId, e.target.value)}
                              className={`w-full text-center px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                                savingCell === cellKey ? "bg-yellow-50" : ""
                              } ${currentValue !== null ? "bg-green-50/50" : "bg-white"}`}
                              placeholder="—"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center bg-blue-50/50">
                        <span className="font-bold text-gray-900">
                          {s.average !== null ? s.average.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-center font-medium bg-blue-50/50 ${rating.color}`}>
                        {rating.label}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn</h3>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• Nhập điểm trực tiếp vào ô, nhấn <kbd className="px-1 bg-gray-100 rounded">Tab</kbd> hoặc click ra ngoài để lưu</li>
          <li>• Điểm từ 0 - 10, có thể nhập lẻ 0.25 (ví dụ: 7.5, 8.25)</li>
          <li>• Công thức TB: (Miệng×1 + 15p×1 + GK×2 + CK×3) ÷ 7</li>
          <li>• Xếp loại: Giỏi (≥8) | Khá (≥6.5) | Đạt (≥5) | Chưa đạt (&lt;5)</li>
        </ul>
      </div>
    </div>
  );
}
