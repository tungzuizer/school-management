    "use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAdminDailyReports,
  getSchoolsForFilter,
  getDailyReportStats,
  getReportDetail,
} from "./actions";

interface ReportItem {
  id: string;
  date: Date;
  absentCount: number;
  lateCount: number;
  status: string;
  aiGeneratedText: string | null;
  editedText: string | null;
  incidentSummary: string | null;
  parentFeedbackSummary: string | null;
  sentAt: Date | null;
  classRoom: {
    id: string;
    name: string;
    school: { id: string; name: string };
    campus: { name: string } | null;
    homeroomTeacher: { user: { name: string | null } } | null;
  };
}

interface Stats {
  totalClasses: number;
  reportedClasses: number;
  unreportedClasses: number;
  totalAbsent: number;
  totalLate: number;
  classesWithIssues: number;
}

interface School {
  id: string;
  name: string;
}

export default function AdminDailyReportsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSchool, setSelectedSchool] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load schools on mount
  useEffect(() => {
    getSchoolsForFilter().then(setSchools);
  }, []);

  // Load data when date or school changes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reps, st] = await Promise.all([
        getAdminDailyReports(selectedDate, selectedSchool || undefined),
        getDailyReportStats(selectedDate),
      ]);
      setReports(reps as ReportItem[]);
      setStats(st);
    } catch (err) {
      console.error("Error loading reports:", err);
    }
    setLoading(false);
  }, [selectedDate, selectedSchool]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open detail view
  const handleViewDetail = async (reportId: string) => {
    const detail = await getReportDetail(reportId);
    if (detail) {
      setSelectedReport(detail as ReportItem);
      setShowDetail(true);
    }
  };

  // Parse incident summary
  const parseIncidents = (summary: string | null) => {
    if (!summary) return { violations: [], commendations: [] };
    try {
      return JSON.parse(summary);
    } catch {
      return { violations: [], commendations: [] };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold"> Báo cáo hàng ngày - Tổng hợp</h1>
          <p className="text-gray-500 text-sm">
            Xem tổng hợp báo cáo hàng ngày từ tất cả các lớp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả trường</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Tổng lớp</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Đã báo cáo</p>
            <p className="text-2xl font-bold text-green-600">{stats.reportedClasses}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Chưa báo cáo</p>
            <p className={`text-2xl font-bold ${stats.unreportedClasses > 0 ? "text-amber-600" : "text-green-600"}`}>
              {stats.unreportedClasses}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Tổng vắng</p>
            <p className={`text-2xl font-bold ${stats.totalAbsent > 0 ? "text-red-600" : "text-green-600"}`}>
              {stats.totalAbsent}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Tổng muộn</p>
            <p className={`text-2xl font-bold ${stats.totalLate > 0 ? "text-amber-600" : "text-green-600"}`}>
              {stats.totalLate}
            </p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase">Lớp có vấn đề</p>
            <p className={`text-2xl font-bold ${stats.classesWithIssues > 0 ? "text-red-600" : "text-green-600"}`}>
              {stats.classesWithIssues}
            </p>
          </div>
        </div>
      )}

      {/* Reports Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Đang tải...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <p className="text-4xl mb-2"></p>
          <p>Chưa có báo cáo nào cho ngày {new Date(selectedDate).toLocaleDateString("vi-VN")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-3 font-medium">Lớp</th>
                  <th className="text-left p-3 font-medium">Trường</th>
                  <th className="text-left p-3 font-medium">GVCN</th>
                  <th className="text-center p-3 font-medium">Vắng</th>
                  <th className="text-center p-3 font-medium">Muộn</th>
                  <th className="text-center p-3 font-medium">Vi phạm</th>
                  <th className="text-center p-3 font-medium">Trạng thái</th>
                  <th className="text-center p-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const incidents = parseIncidents(r.incidentSummary);
                  const hasIssues = r.absentCount >= 3 || incidents.violations?.length > 0;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b hover:bg-gray-50 ${hasIssues ? "bg-red-50/50" : ""}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {hasIssues && (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs" title="Cần chú ý">
                              !
                            </span>
                          )}
                          <span className="font-medium">{r.classRoom.name}</span>
                          {r.classRoom.campus && (
                            <span className="text-xs text-gray-500">({r.classRoom.campus.name})</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{r.classRoom.school.name}</td>
                      <td className="p-3 text-gray-600">
                        {r.classRoom.homeroomTeacher?.user?.name || "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.absentCount >= 3
                            ? "bg-red-100 text-red-700"
                            : r.absentCount > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {r.absentCount}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.lateCount > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {r.lateCount}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {incidents.violations?.length > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {incidents.violations.length}
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === "SENT"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {r.status === "SENT" ? "Đã gửi" : "Nháp"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleViewDetail(r.id)}
                          className="text-indigo-600 hover:underline text-xs font-medium"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">
                  Báo cáo lớp {selectedReport.classRoom.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedReport.date).toLocaleDateString("vi-VN")} —{" "}
                  {selectedReport.classRoom.school.name}
                  {selectedReport.classRoom.campus
                    ? ` (${selectedReport.classRoom.campus.name})`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                X
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Vắng</p>
                  <p className={`text-xl font-bold ${selectedReport.absentCount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {selectedReport.absentCount}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Muộn</p>
                  <p className={`text-xl font-bold ${selectedReport.lateCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {selectedReport.lateCount}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Trạng thái</p>
                  <p className="text-sm font-medium mt-1">
                    {selectedReport.status === "SENT" ? " Đã gửi" : " Nháp"}
                  </p>
                </div>
              </div>

              {/* GVCN info */}
              <div className="text-sm text-gray-600">
                <strong>GVCN:</strong>{" "}
                {selectedReport.classRoom.homeroomTeacher?.user?.name || "Chưa phân công"}
                {selectedReport.sentAt && (
                  <span className="ml-3 text-xs text-gray-400">
                    Gửi lúc: {new Date(selectedReport.sentAt).toLocaleString("vi-VN")}
                  </span>
                )}
              </div>

              {/* Incidents */}
              {selectedReport.incidentSummary && (() => {
                const incidents = parseIncidents(selectedReport.incidentSummary);
                return (
                  <div className="space-y-2">
                    {incidents.violations?.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-700 mb-1">Vi phạm:</p>
                        <ul className="text-sm text-red-900 space-y-1">
                          {incidents.violations.map((v: { name: string; description: string }, i: number) => (
                            <li key={i}>• <strong>{v.name}:</strong> {v.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {incidents.commendations?.length > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-medium text-green-700 mb-1"> Khen thưởng:</p>
                        <ul className="text-sm text-green-900 space-y-1">
                          {incidents.commendations.map((c: { name: string; description: string }, i: number) => (
                            <li key={i}>• <strong>{c.name}:</strong> {c.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Parent feedback */}
              {selectedReport.parentFeedbackSummary && (() => {
                try {
                  const feedbacks = JSON.parse(selectedReport.parentFeedbackSummary);
                  if (feedbacks.length > 0) {
                    return (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-700 mb-1"> Phản hồi phụ huynh:</p>
                        <ul className="text-sm text-blue-900 space-y-1">
                          {feedbacks.map((f: { studentName: string; content: string; channel?: string }, i: number) => (
                            <li key={i}>
                              • <strong>PH {f.studentName}</strong>
                              {f.channel && <span className="text-gray-500"> ({f.channel})</span>}: {f.content}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                } catch {
                  return null;
                }
              })()}

              {/* Report text */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2"> Nội dung báo cáo:</p>
                <div className="p-4 bg-gray-50 border rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedReport.editedText || selectedReport.aiGeneratedText || (
                    <span className="text-gray-400 italic">Chưa có nội dung</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
