"use client";

import { useEffect, useState } from "react";
import { getStudentGrades } from "../actions";

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

const gradeTypeLabels: Record<string, string> = {
  ORAL: "Miệng",
  FIFTEEN_MIN: "15 phút",
  MIDTERM: "Giữa kỳ",
  FINAL: "Cuối kỳ",
};

function getScoreColor(score: number) {
  if (score >= 8) return "text-green-600 font-bold";
  if (score >= 6.5) return "text-blue-600";
  if (score >= 5) return "text-yellow-600";
  return "text-red-600 font-bold";
}

function getRatingLabel(avg: number) {
  if (avg >= 8) return { label: "Giỏi", color: "bg-green-100 text-green-700" };
  if (avg >= 6.5) return { label: "Khá", color: "bg-blue-100 text-blue-700" };
  if (avg >= 5) return { label: "Đạt", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Chưa đạt", color: "bg-red-100 text-red-700" };
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Đang tải bảng điểm...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Không tìm thấy thông tin. Vui lòng liên hệ quản trị viên.
        </div>
      </div>
    );
  }

  // Tính điểm TB tổng
  const overallAvg = data.subjects.length > 0
    ? data.subjects.reduce((sum, s) => sum + s.avgScore, 0) / data.subjects.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800"> Bảng điểm</h1>
          <p className="text-gray-500 mt-1">
            {data.studentName} — Lớp {data.className}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTerm(undefined)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedTerm === undefined
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedTerm(1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedTerm === 1
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Học kỳ 1
          </button>
          <button
            onClick={() => setSelectedTerm(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedTerm === 2
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Học kỳ 2
          </button>
        </div>
      </div>

      {/* Tổng quan */}
      {data.subjects.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-sm text-gray-500">Điểm trung bình chung</p>
              <p className={`text-3xl font-bold ${getScoreColor(overallAvg)}`}>
                {Math.round(overallAvg * 100) / 100}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Xếp loại</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getRatingLabel(overallAvg).color}`}>
                {getRatingLabel(overallAvg).label}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số môn học</p>
              <p className="text-2xl font-bold text-gray-800">{data.subjects.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bảng điểm */}
      {data.subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-lg">Chưa có điểm nào được ghi nhận</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-4 font-semibold text-gray-700">Môn học</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Miệng</th>
                  <th className="text-center p-4 font-semibold text-gray-700">15 phút</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Giữa kỳ</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Cuối kỳ</th>
                  <th className="text-center p-4 font-semibold text-gray-700">TB môn</th>
                  <th className="text-center p-4 font-semibold text-gray-700">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((subject) => {
                  const gradesByType: Record<string, number[]> = {};
                  subject.grades.forEach((g) => {
                    if (!gradesByType[g.type]) gradesByType[g.type] = [];
                    gradesByType[g.type].push(g.score);
                  });

                  const rating = getRatingLabel(subject.avgScore);

                  return (
                    <tr key={subject.subjectId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800">{subject.subjectName}</td>
                      <td className="p-4 text-center">
                        {gradesByType["ORAL"]?.map((s, i) => (
                          <span key={i} className={`${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {gradesByType["FIFTEEN_MIN"]?.map((s, i) => (
                          <span key={i} className={`${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {gradesByType["MIDTERM"]?.map((s, i) => (
                          <span key={i} className={`${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-center">
                        {gradesByType["FINAL"]?.map((s, i) => (
                          <span key={i} className={`${getScoreColor(s)} ${i > 0 ? "ml-1" : ""}`}>
                            {s}
                          </span>
                        )) || <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`p-4 text-center text-lg font-bold ${getScoreColor(subject.avgScore)}`}>
                        {subject.avgScore}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${rating.color}`}>
                          {rating.label}
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

      {/* Chú thích */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2"> Chú thích hệ số:</p>
        <div className="flex flex-wrap gap-4">
          <span>Miệng, 15 phút: hệ số 1</span>
          <span>Giữa kỳ: hệ số 2</span>
          <span>Cuối kỳ: hệ số 3</span>
        </div>
      </div>
    </div>
  );
}
