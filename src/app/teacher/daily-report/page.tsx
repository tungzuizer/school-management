"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  getHomeroomClass,
  getDailyReport,
  getDailyReportHistory,
  collectDailyData,
  generateAIReport,
  saveDailyReport,
} from "./actions";
import {
  FileText,
  Clock,
  UserX,
  AlertTriangle,
  Award,
  MessageSquare,
  Sparkles,
  Save,
  Send,
  History,
  CheckCircle,
  XCircle,
  FileCheck,
  Building2,
  Calendar,
  Users,
} from "lucide-react";

interface DailyData {
  totalStudents: number;
  absentCount: number;
  lateCount: number;
  absentList: { name: string; status: string; note: string | null }[];
  lateList: { name: string; note: string | null }[];
  violations: { name: string; description: string }[];
  commendations: { name: string; description: string }[];
  parentFeedbacks: { studentName: string; content: string; channel: string | null }[];
}

interface ReportRecord {
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
}

interface ClassInfo {
  id: string;
  name: string;
  school: { name: string };
  campus: { name: string } | null;
}

export default function TeacherDailyReportPage() {
  const { data: session } = useSession();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [reportText, setReportText] = useState("");
  const [aiText, setAiText] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "SENT">("DRAFT");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [existingReport, setExistingReport] = useState<ReportRecord | null>(null);

  // Load homeroom class
  useEffect(() => {
    if (session?.user?.id) {
      getHomeroomClass(session.user.id).then((cls) => {
        if (cls) setClassInfo(cls as ClassInfo);
      });
    }
  }, [session?.user?.id]);

  // Load daily data when date or class changes
  const loadData = useCallback(async () => {
    if (!classInfo) return;
    setLoading(true);
    try {
      const [data, existing, hist] = await Promise.all([
        collectDailyData(classInfo.id, selectedDate),
        getDailyReport(classInfo.id, selectedDate),
        getDailyReportHistory(classInfo.id, 30),
      ]);
      setDailyData(data);
      setHistory(hist as ReportRecord[]);

      if (existing) {
        const ex = existing as ReportRecord;
        setExistingReport(ex);
        setAiText(ex.aiGeneratedText || "");
        setReportText(ex.editedText || ex.aiGeneratedText || "");
        setStatus(ex.status as "DRAFT" | "SENT");
      } else {
        setExistingReport(null);
        setAiText("");
        setReportText("");
        setStatus("DRAFT");
      }
    } catch {
      setMessage({ type: "error", text: "Không thể tải dữ liệu" });
    }
    setLoading(false);
  }, [classInfo, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate AI report
  const handleGenerateAI = async () => {
    if (!classInfo) return;
    setGenerating(true);
    setMessage(null);
    try {
      const result = await generateAIReport(classInfo.id, selectedDate);
      if (result.success && result.text) {
        setAiText(result.text);
        setReportText(result.text);
        setMessage({ type: "success", text: "Đã tạo báo cáo bằng AI thành công!" });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Không thể tạo báo cáo AI. Vui lòng nhập thủ công.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Lỗi khi gọi AI. Vui lòng nhập thủ công." });
    }
    setGenerating(false);
  };

  // Save report
  const handleSave = async (sendStatus: "DRAFT" | "SENT") => {
    if (!classInfo || !dailyData) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveDailyReport({
        classId: classInfo.id,
        date: selectedDate,
        absentCount: dailyData.absentCount,
        lateCount: dailyData.lateCount,
        incidentSummary:
          dailyData.violations.length > 0 || dailyData.commendations.length > 0
            ? JSON.stringify({ violations: dailyData.violations, commendations: dailyData.commendations })
            : undefined,
        parentFeedbackSummary:
          dailyData.parentFeedbacks.length > 0
            ? JSON.stringify(dailyData.parentFeedbacks)
            : undefined,
        aiGeneratedText: aiText || undefined,
        editedText: reportText || undefined,
        status: sendStatus,
      });
      setStatus(sendStatus);
      setMessage({
        type: "success",
        text: sendStatus === "SENT" ? "Đã gửi báo cáo lên hiệu trưởng!" : "Đã lưu bản nháp!",
      });
      loadData();
    } catch {
      setMessage({ type: "error", text: "Lỗi khi lưu báo cáo" });
    }
    setSaving(false);
  };

  if (!classInfo) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-650" /> Báo cáo hàng ngày
        </h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
          Bạn chưa được phân công chủ nhiệm lớp nào. Liên hệ admin để được gán lớp chủ nhiệm.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Báo cáo hàng ngày
          </h1>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>Lớp {classInfo.name} — Trường {classInfo.school.name}
            {classInfo.campus ? ` (${classInfo.campus.name})` : ""}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-xl pl-8 pr-3 py-2 min-h-[44px] text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
            />
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-slate-800 font-semibold rounded-lg transition-colors border border-gray-200"
          >
            <History className="w-4 h-4" />
            {showHistory ? "Ẩn lịch sử" : "Lịch sử"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200 font-medium"
              : "bg-red-50 text-red-700 border border-red-200 font-medium"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Status badge */}
      {existingReport && (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
              status === "SENT"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status === "SENT" ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Đã gửi</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>Bản nháp</span>
              </>
            )}
          </span>
          {existingReport.sentAt && (
            <span className="text-xs text-slate-600 font-medium">
              Thời gian gửi: {new Date(existingReport.sentAt).toLocaleString("vi-VN")}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b border-indigo-500 mx-auto"></div>
          <p className="mt-2 text-slate-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          {/* Daily Data Summary Cards */}
          {dailyData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Sĩ số</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{dailyData.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-gray-450" />
              </div>
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Vắng</p>
                  <p className={`text-2xl font-bold mt-0.5 ${dailyData.absentCount > 0 ? "text-red-600" : "text-green-600"}`}>
                    {dailyData.absentCount}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-400" />
              </div>
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Đi muộn</p>
                  <p className={`text-2xl font-bold mt-0.5 ${dailyData.lateCount > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {dailyData.lateCount}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Vi phạm</p>
                  <p className={`text-2xl font-bold mt-0.5 ${dailyData.violations.length > 0 ? "text-red-650" : "text-green-600"}`}>
                    {dailyData.violations.length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          )}

          {/* Detail sections */}
          {dailyData && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Absent list */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-red-700 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 shrink-0" />
                  <span>Học sinh vắng ({dailyData.absentCount})</span>
                </h3>
                {dailyData.absentList.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {dailyData.absentList.map((a, i) => (
                      <li key={i} className="flex justify-between items-center py-1 border-b last:border-0">
                        <span className="font-medium text-slate-800">{a.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          a.status === "ABSENT_EXCUSED" ? "bg-blue-105 text-blue-700" : "bg-red-105 text-red-700"
                        }`}>
                          {a.status === "ABSENT_EXCUSED" ? "Có phép" : "Không phép"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">Không có học sinh vắng</p>
                )}
              </div>

              {/* Late list */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Đi muộn ({dailyData.lateCount})</span>
                </h3>
                {dailyData.lateList.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {dailyData.lateList.map((a, i) => (
                      <li key={i} className="py-1 border-b last:border-0">
                        <span className="font-medium text-slate-800">{a.name}</span>
                        {a.note && <span className="text-slate-600 text-xs"> — {a.note}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">Không có học sinh đi muộn</p>
                )}
              </div>

              {/* Violations */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Vi phạm ({dailyData.violations.length})</span>
                </h3>
                {dailyData.violations.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {dailyData.violations.map((v, i) => (
                      <li key={i} className="py-1 border-b last:border-0 text-gray-750">
                        <strong className="font-semibold">{v.name}:</strong> {v.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">Không có vi phạm</p>
                )}
              </div>

              {/* Commendations */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-green-700 flex items-center gap-1.5">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Khen thưởng ({dailyData.commendations.length})</span>
                </h3>
                {dailyData.commendations.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {dailyData.commendations.map((c, i) => (
                      <li key={i} className="py-1 border-b last:border-0 text-gray-750">
                        <strong className="font-semibold">{c.name}:</strong> {c.description}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 text-sm">Không có khen thưởng</p>
                )}
              </div>

              {/* Parent feedbacks */}
              {dailyData.parentFeedbacks.length > 0 && (
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl md:col-span-2 shadow-sm">
                  <h3 className="font-semibold text-sm mb-3 text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Phản hồi phụ huynh ({dailyData.parentFeedbacks.length})</span>
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {dailyData.parentFeedbacks.map((f, i) => (
                      <li key={i} className="py-1 border-b last:border-0">
                        <strong>PH {f.studentName}</strong>
                        {f.channel && <span className="text-slate-600"> ({f.channel})</span>}: {f.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Report Generation & Editing */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="font-semibold text-lg">Nội dung báo cáo</h3>
              <button
                onClick={handleGenerateAI}
                disabled={generating || status === "SENT"}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
              >
                {generating ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Đang tạo báo cáo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo báo cáo bằng AI</span>
                  </>
                )}
              </button>
            </div>

            {aiText && aiText !== reportText && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Bản gốc AI:</p>
                <p className="text-xs text-blue-900 whitespace-pre-wrap leading-relaxed">{aiText}</p>
                <button
                  onClick={() => setReportText(aiText)}
                  className="mt-2 text-xs text-blue-600 hover:underline font-semibold"
                >
                  Khôi phục bản gốc AI
                </button>
              </div>
            )}

            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              disabled={status === "SENT"}
              placeholder="Nhập nội dung báo cáo hoặc bấm 'Tạo báo cáo bằng AI' để tự động tạo..."
              className="w-full h-64 border border-gray-200 rounded-lg p-4 text-xs resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed font-medium"
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-slate-500 font-medium">
                {reportText.length > 0 ? `${reportText.split(/\s+/).filter(Boolean).length} từ` : "Chưa có nội dung"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={saving || !reportText || status === "SENT"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-150 hover:bg-gray-200 text-slate-800 font-semibold rounded-lg text-sm disabled:opacity-50 transition-colors border"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Đang lưu..." : "Lưu nháp"}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn gửi báo cáo này lên hiệu trưởng?")) {
                      handleSave("SENT");
                    }
                  }}
                  disabled={saving || !reportText || status === "SENT"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>{saving ? "Đang gửi..." : "Gửi hiệu trưởng"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History */}
      {showHistory && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-1.5">
            <History className="w-5 h-5 text-slate-600" />
            <span>Lịch sử báo cáo</span>
          </h3>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">Chưa có báo cáo nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 font-bold text-gray-600">
                    <th className="text-left p-3">Ngày</th>
                    <th className="text-center p-3">Vắng</th>
                    <th className="text-center p-3">Muộn</th>
                    <th className="text-center p-3">Trạng thái</th>
                    <th className="text-center p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-slate-50 text-slate-800">
                      <td className="p-3 font-medium">{new Date(r.date).toLocaleDateString("vi-VN")}</td>
                      <td className="p-3 text-center">
                        <span className={r.absentCount > 0 ? "text-red-600 font-bold" : ""}>
                          {r.absentCount}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={r.lateCount > 0 ? "text-amber-600 font-bold" : ""}>
                          {r.lateCount}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === "SENT"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-105 text-yellow-700"
                          }`}
                        >
                          {r.status === "SENT" ? "Đã gửi" : "Nháp"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedDate(new Date(r.date).toISOString().split("T")[0]);
                            setShowHistory(false);
                          }}
                          className="text-indigo-650 hover:underline font-bold text-xs"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
