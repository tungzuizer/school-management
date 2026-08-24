"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyAssignments, getStudentGrades, saveGrade } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { Calculator, Award, Users, CheckCircle2, HelpCircle } from "lucide-react";

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

function getRating(avg: number | null): { label: string; color: string; bg: string } {
  if (avg === null) return { label: "—", color: "text-slate-400", bg: "bg-slate-100 border-slate-200" };
  if (avg >= 8) return { label: "Giỏi", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200 font-bold" };
  if (avg >= 6.5) return { label: "Khá", color: "text-blue-700", bg: "bg-blue-50 border-blue-200 font-bold" };
  if (avg >= 5) return { label: "Đạt", color: "text-amber-700", bg: "bg-amber-50 border-amber-200 font-bold" };
  return { label: "Chưa đạt", color: "text-rose-700", bg: "bg-rose-50 border-rose-200 font-bold" };
}

export default function GradesPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [term, setTerm] = useState(1);
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    getMyAssignments().then((data) => {
      setAssignments(data);
      if (data.length > 0) setSelectedAssignment(data[0].id);
    });
  }, []);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignment);

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
      await loadGrades();
    } else {
      showToast(result.error || "Lỗi khi lưu", "error");
    }
  };

  const totalStudents = students.length;
  const completedStudents = students.filter((s) => s.average !== null).length;
  const avgScore = students.filter((s) => s.average !== null).length > 0
    ? (students.reduce((sum, s) => sum + (s.average || 0), 0) / completedStudents).toFixed(2)
    : "—";

  return (
    <div className="space-y-6">
      {ToastComponent}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Sổ Nhập Điểm Học Sinh
          </h1>
          <p className="text-xs text-slate-500 mt-1">Cập nhật hệ số điểm thành phần, tự động tính trung bình & xếp loại môn học.</p>
        </div>
      </div>

      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Phân Công Giảng Dạy (Lớp - Môn)</label>
            <select
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
            >
              {assignments.length === 0 && <option value="">Chưa có phân công</option>}
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Lớp {a.className} (Khối {a.gradeLevel}) — Môn {a.subjectName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Học Kỳ</label>
            <select
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
            >
              <option value={1}>Học Kỳ I</option>
              <option value={2}>Học Kỳ II</option>
            </select>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Tổng Sĩ Số</p>
              <p className="text-lg font-extrabold text-slate-900">{totalStudents} học sinh</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Đã Đủ Điểm</p>
              <p className="text-lg font-extrabold text-emerald-600">{completedStudents} / {totalStudents}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">ĐTB Chung Lớp</p>
              <p className="text-lg font-extrabold text-indigo-600">{avgScore}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-12 text-center">STT</th>
                <th className="px-4 py-3.5 w-28">Mã HS</th>
                <th className="px-4 py-3.5 min-w-[180px]">Họ & Tên Học Sinh</th>
                {GRADE_COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3.5 text-center w-28">
                    {col.label}
                    <div className="text-[10px] text-slate-400 font-normal">Hệ số {col.weight}</div>
                  </th>
                ))}
                <th className="px-4 py-3.5 text-center w-24 bg-indigo-50/60 text-indigo-700">ĐTB Môn</th>
                <th className="px-4 py-3.5 text-center w-28 bg-indigo-50/60 text-indigo-700">Xếp Loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Đang tải bảng điểm...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 font-semibold">
                    {assignments.length === 0 ? "Bạn chưa được phân công giảng dạy môn nào." : "Lớp hiện chưa có học sinh."}
                  </td>
                </tr>
              ) : (
                students.map((s, idx) => {
                  const rating = getRating(s.average);
                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{s.studentCode || "—"}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{s.studentName}</td>
                      {GRADE_COLUMNS.map((col) => {
                        const cellKey = `${s.studentId}-${col.key}`;
                        const currentValue = s[col.key as keyof StudentGrade] as number | null;
                        const existingId = s[col.idKey as keyof StudentGrade] as string | null;
                        return (
                          <td key={col.key} className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.25}
                              defaultValue={currentValue !== null ? currentValue : ""}
                              onBlur={(e) => handleCellBlur(s.studentId, col.key, col.type, existingId, e.target.value)}
                              className={`w-full text-center px-2 py-2 min-h-[44px] bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all ${
                                savingCell === cellKey ? "bg-amber-50 text-amber-700" : ""
                              } ${currentValue !== null ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold" : "placeholder-slate-300"}`}
                              placeholder="—"
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3.5 text-center bg-indigo-50/40 font-extrabold text-indigo-700 text-sm">
                        {s.average !== null ? s.average.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${rating.bg} ${rating.color}`}>
                          {rating.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900">Hướng dẫn nhập điểm:</p>
          <p>• Nhập điểm trực tiếp vào ô, nhấn <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700">Tab</kbd> hoặc click ra ngoài để tự động lưu hệ thống.</p>
          <p>• Điểm từ 0 đến 10 (chấp nhận số thập phân lẻ 0.25). Công thức ĐTB Môn: (Miệng×1 + 15p×1 + GiữaKỳ×2 + CuốiKỳ×3) ÷ 7.</p>
        </div>
      </div>
    </div>
  );
}
