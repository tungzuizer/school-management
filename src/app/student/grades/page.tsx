"use client";

import { useEffect, useState } from "react";
import { getStudentGrades } from "../actions";
import { Award, BookOpen, Calculator, CheckCircle2, HelpCircle, Sparkles, Star } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";

type GradeData = {
  studentName: string;
  className: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    grades: { type: string; score: number; term: number }[];
    avgScore: number;
  }[];
};

function getScoreColor(score: number) {
  if (score >= 8) return "text-emerald-700 font-extrabold";
  if (score >= 6.5) return "text-blue-700 font-extrabold";
  if (score >= 5) return "text-amber-700 font-bold";
  return "text-rose-700 font-extrabold";
}

function getRatingBadge(avg: number) {
  if (avg >= 8) return { label: "Giỏi", color: "bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold" };
  if (avg >= 6.5) return { label: "Khá", color: "bg-blue-50 text-blue-800 border-blue-200 font-extrabold" };
  if (avg >= 5) return { label: "Đạt", color: "bg-amber-50 text-amber-800 border-amber-200 font-bold" };
  return { label: "Chưa đạt", color: "bg-rose-50 text-rose-800 border-rose-200 font-extrabold" };
}

export default function StudentGradesPage() {
  const [data, setData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<number | undefined>(undefined);

  const loadData = (term?: number) => {
    setLoading(true);
    getStudentGrades(term).then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData(selectedTerm);
  }, [selectedTerm]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="h-7 w-48 bg-slate-200 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-64 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={8} cols={7} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-800 font-semibold flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Không tìm thấy dữ liệu điểm số. Vui lòng liên hệ Giáo viên chủ nhiệm hoặc BGH.</span>
        </div>
      </div>
    );
  }

  // Calculate Overall Average Score
  const overallAvg = data.subjects.length > 0
    ? data.subjects.reduce((sum, s) => sum + s.avgScore, 0) / data.subjects.length
    : 0;

  const roundedOverall = Math.round(overallAvg * 100) / 100;
  const rating = getRatingBadge(roundedOverall);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-blue-600" />
            Bảng Điểm Cá Nhân Môn Học
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Học sinh: <span className="text-slate-900 font-extrabold">{data.studentName}</span> — Lớp: <span className="text-blue-700 font-extrabold">{data.className}</span>
          </p>
        </div>

        {/* Term Select Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          {[
            { label: "Tất cả học kỳ", value: undefined },
            { label: "Học kỳ I", value: 1 },
            { label: "Học kỳ II", value: 2 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setSelectedTerm(item.value)}
              className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedTerm === item.value
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards */}
      {data.subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">ĐTB Chung Môn Học</p>
              <p className={`text-2xl font-extrabold ${getScoreColor(roundedOverall)}`}>
                {roundedOverall} <span className="text-xs font-semibold text-slate-400">/ 10</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-xs">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Xếp Loại Học Tập</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs border mt-1 shadow-2xs ${rating.color}`}>
                {rating.label}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Số Môn Học Cập Nhật</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {data.subjects.length} <span className="text-xs font-semibold text-slate-400">môn</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grades Table */}
      {data.subjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-60" />
          <p className="text-slate-600 font-bold">Chưa có điểm thành phần nào được cập nhật trong kỳ này.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 min-w-[160px]">Tên Môn Học</th>
                  <th className="px-4 py-3.5 text-center w-24">Miệng (x1)</th>
                  <th className="px-4 py-3.5 text-center w-28">15 Phút (x1)</th>
                  <th className="px-4 py-3.5 text-center w-28">Giữa Kỳ (x2)</th>
                  <th className="px-4 py-3.5 text-center w-28">Cuối Kỳ (x3)</th>
                  <th className="px-4 py-3.5 text-center w-28 bg-blue-50/60 text-blue-800">TB Môn</th>
                  <th className="px-4 py-3.5 text-center w-28 bg-blue-50/60 text-blue-800">Xếp Loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.subjects.map((subject) => {
                  const gradesByType: Record<string, number[]> = {};
                  subject.grades.forEach((g) => {
                    if (!gradesByType[g.type]) gradesByType[g.type] = [];
                    gradesByType[g.type].push(g.score);
                  });

                  const subjectRating = getRatingBadge(subject.avgScore);

                  return (
                    <tr key={subject.subjectId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-extrabold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        {subject.subjectName}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {gradesByType["ORAL"]?.map((s, i) => (
                          <span key={i} className={`inline-block px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 ${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-slate-300 font-semibold">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {gradesByType["FIFTEEN_MIN"]?.map((s, i) => (
                          <span key={i} className={`inline-block px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 ${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-slate-300 font-semibold">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {gradesByType["MIDTERM"]?.map((s, i) => (
                          <span key={i} className={`inline-block px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 ${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-slate-300 font-semibold">—</span>}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {gradesByType["FINAL"]?.map((s, i) => (
                          <span key={i} className={`inline-block px-1.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 ${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-slate-300 font-semibold">—</span>}
                      </td>
                      <td className={`px-4 py-4 text-center bg-blue-50/40 text-sm font-extrabold ${getScoreColor(subject.avgScore)}`}>
                        {subject.avgScore}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${subjectRating.color}`}>
                          {subjectRating.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Guide Footer */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-slate-900">Cách tính Điểm Trung Bình môn học (ĐTB):</p>
          <p>• <strong>ĐTB Môn</strong> = (Miệng×1 + 15 phút×1 + Giữa kỳ×2 + Cuối kỳ×3) ÷ (Tổng hệ số).</p>
          <p>• Xếp loại môn học: <strong>Giỏi</strong> (≥8.0) | <strong>Khá</strong> (6.5 – 7.9) | <strong>Đạt</strong> (5.0 – 6.4) | <strong>Chưa đạt</strong> (&lt;5.0).</p>
        </div>
      </div>
    </div>
  );
}
