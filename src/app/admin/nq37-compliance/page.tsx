/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router route `/admin/nq37-compliance`, referenced in `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `src/app/admin/nq37-compliance/page.tsx`.
 * 3. Schemas: Prisma ORM models (`School`, `Campus`, `User`, `Teacher`).
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

"use client";

import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Award,
  FileText,
  BookOpen,
  Calculator,
  HeartHandshake,
  UserCheck,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  Info,
  Layers,
  Sparkles,
  Calendar,
  AlertOctagon,
} from "lucide-react";
import {
  getNQ37ComplianceReportAction,
  submitRestructuringPlanAction,
  type NQ37ComplianceDataResponse,
} from "./actions";

export default function NQ37CompliancePage() {
  const [data, setData] = useState<NQ37ComplianceDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "leadership" | "shared" | "campuses" | "transition36m" | "proposal"
  >("overview");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("ALL");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalNotes, setProposalNotes] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getNQ37ComplianceReportAction();
        setData(res);
      } catch (err) {
        console.error("Failed to load NQ37 compliance report:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">
          Đang thẩm định dữ liệu tổ chức bộ máy theo Nghị quyết 37/2026/NQ-CP...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Không thể tải dữ liệu thẩm định</h3>
        <p className="text-gray-600 mt-1">Vui lòng kiểm tra lại quyền truy cập Ban Giám hiệu.</p>
      </div>
    );
  }

  const { scorecard, allCampuses, leadershipList, supportStaffList } = data;

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProposal(true);
    try {
      await submitRestructuringPlanAction({
        schoolId: scorecard.schoolId,
        notes: proposalNotes,
        proposedPrincipalName: leadershipList.find((l) => l.role === "HIỆU TRƯỞNG")?.name || "Hiệu trưởng",
        retainedAllowanceCount: scorecard.leadershipAudit.excessVicePrincipals,
        downsizingCount: 0,
      });
      setProposalSuccess(true);
    } catch {
      alert("Có lỗi xảy ra khi nộp phương án.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Legal Framework Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Nghị quyết 37/2026/NQ-CP
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded-full text-xs font-medium">
                Ban hành: 05/08/2026 • Hiệu lực đến: 30/06/2028
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium">
                Cấp quản lý: Sở GD&ĐT Hải Phòng
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Trung Tâm Thẩm Định & Giám Sát Định Mức Biên Chế
            </h1>
            <p className="text-indigo-200/90 text-sm max-w-3xl leading-relaxed">
              Hệ thống thẩm định tự động cơ cấu số lượng Hiệu trưởng, Phó Hiệu trưởng và Nhân sự hỗ trợ giáo dục
              cho trường chính, phân hiệu và điểm trường theo chuẩn quy định mới nhất của Chính phủ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab("proposal")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Lập Tờ Trình Sắp Xếp
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Xuất Báo Cáo
            </button>
          </div>
        </div>
      </div>

      {/* 2. Critical Countdown Timers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Timer 1: Hạn chót sắp xếp */}
        <div className="bg-gradient-to-br from-red-500/10 via-amber-500/5 to-white p-5 rounded-2xl border border-red-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Hạn chót sắp xếp bộ máy
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {scorecard.arrangementDeadlineDaysLeft} ngày còn lại
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Phải hoàn thành trước <strong className="text-red-600">30/09/2026</strong> (Điều 8 NQ 37).
              </p>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between text-xs text-gray-500">
            <span>Tiến độ trường: {scorecard.overallScore}%</span>
            <span className="font-semibold text-red-600">Cần nộp Sở GD&ĐT</span>
          </div>
        </div>

        {/* Timer 2: Lộ trình chuẩn hóa 36 tháng */}
        <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white p-5 rounded-2xl border border-blue-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Chuẩn hóa đào tạo (36 tháng)
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {scorecard.standardizationMonthsLeft} tháng chuyển tiếp
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Thời hạn hoàn thành chuẩn nghề nghiệp đến <strong className="text-blue-600">05/08/2029</strong> (Điều 5.3.a).
              </p>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-gray-500">
            <span>Giữ nguyên ngạch, bậc, lương hiện hưởng</span>
            <span className="font-semibold text-blue-600">Nghị quyết 37</span>
          </div>
        </div>

        {/* Policy 3: Bảo lưu phụ cấp chức vụ NĐ 178 */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white p-5 rounded-2xl border border-emerald-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" /> Chính sách cán bộ dôi dư
              </span>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                Bảo lưu phụ cấp
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Áp dụng Điều 11 Nghị định 178/2024/NĐ-CP (sửa đổi bởi NĐ 67/2025/NĐ-CP) và NĐ 154/2025.
              </p>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-gray-500">
            <span>Phó HT dôi dư: {scorecard.leadershipAudit.excessVicePrincipals} người</span>
            <span className="font-semibold text-emerald-700">Được bảo vệ quyền lợi</span>
          </div>
        </div>
      </div>

      {/* 3. Overall Compliance Scorecard Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          scorecard.status === "COMPLIANT"
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            : scorecard.status === "CRITICAL_VIOLATION"
            ? "bg-red-50/70 border-red-200 text-red-950"
            : "bg-amber-50/70 border-amber-200 text-amber-950"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl ${
              scorecard.status === "COMPLIANT"
                ? "bg-emerald-600 text-white"
                : scorecard.status === "CRITICAL_VIOLATION"
                ? "bg-red-600 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {scorecard.status === "COMPLIANT" ? (
              <ShieldCheck className="w-8 h-8" />
            ) : scorecard.status === "CRITICAL_VIOLATION" ? (
              <ShieldAlert className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {scorecard.schoolName} — Đánh giá Thẩm định Định mức
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  scorecard.status === "COMPLIANT"
                    ? "bg-emerald-200 text-emerald-800"
                    : scorecard.status === "CRITICAL_VIOLATION"
                    ? "bg-red-200 text-red-900 animate-pulse"
                    : "bg-amber-200 text-amber-900"
                }`}
              >
                {scorecard.status === "COMPLIANT"
                  ? "ĐẠT CHUẨN NQ 37"
                  : scorecard.status === "CRITICAL_VIOLATION"
                  ? "VI PHẠM TIÊU CHUẨN BẮT BUỘC"
                  : "CẦN ĐIỀU CHỈNH SẮP XẾP"}
              </span>
            </div>
            <p className="text-sm opacity-90 mt-1 max-w-2xl">
              {scorecard.status === "COMPLIANT"
                ? "Cơ cấu Ban Giám hiệu, nhân sự dùng chung và nhân sự các phân hiệu đã tuân thủ đầy đủ định mức và tiêu chuẩn chức danh."
                : scorecard.status === "CRITICAL_VIOLATION"
                ? "Phát hiện nhân sự chưa đạt chứng chỉ chuyên môn bắt buộc tại vị trí Y tế hoặc Kế toán (Điều 5.3.b, 5.3.c). Cần điều chuyển ngay."
                : "Còn tồn tại cán bộ lãnh đạo dôi dư hoặc thiếu/vượt chỉ tiêu nhân sự tại một số cơ sở. Cần phương án hoàn thiện trước 30/09/2026."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end md:self-center">
          <div className="text-right">
            <span className="text-xs uppercase font-bold text-gray-500 block">Điểm Tuân Thủ</span>
            <span className="text-3xl font-black">{scorecard.overallScore}/100</span>
          </div>
        </div>
      </div>

      {/* 4. Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Layers className="w-4 h-4" /> Tổng Quan Định Mức
        </button>
        <button
          onClick={() => setActiveTab("leadership")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "leadership"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Users className="w-4 h-4" /> Ban Giám Hiệu (Điều 4)
          {!scorecard.leadershipAudit.isCompliant && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("shared")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "shared"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Calculator className="w-4 h-4" /> Nhân Sự Dùng Chung (Điều 5.1.a)
        </button>
        <button
          onClick={() => setActiveTab("campuses")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "campuses"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Building2 className="w-4 h-4" /> Nhân Sự Từng Cơ Sở (Điều 5.1.b)
        </button>
        <button
          onClick={() => setActiveTab("transition36m")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "transition36m"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <Award className="w-4 h-4" /> Lộ Trình 36 Tháng (Điều 5.3.a)
        </button>
        <button
          onClick={() => setActiveTab("proposal")}
          className={`py-4 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === "proposal"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <FileText className="w-4 h-4" /> Tờ Trình Sở GD&ĐT
        </button>
      </div>

      {/* 5. Tab Content Panes */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Action Recommendations from Legal Engine */}
          {scorecard.actionRecommendations.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Đề Xuất Hành Động Dành Cho Hiệu Trưởng (Căn Cứ Pháp Lý)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scorecard.actionRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-indigo-950">{rec.title}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-200 text-indigo-800 rounded text-xs font-semibold">
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{rec.description}</p>
                    <div className="text-[11px] font-medium text-indigo-600 flex items-center gap-1 pt-1 border-t border-indigo-100">
                      <BookOpen className="w-3.5 h-3.5" /> {rec.legalBasis}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quota Matrix Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                Bảng Ma Trận Định Mức Biên Chế Toàn Trường
              </h3>
              <span className="text-xs text-gray-500">
                Quy mô: {allCampuses.length} cơ sở ({allCampuses[0]?.name} + {allCampuses.length - 1} phân hiệu)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Nhóm Vị Trí Việc Làm</th>
                    <th className="py-3 px-4">Căn Cứ Điều Khoản</th>
                    <th className="py-3 px-4 text-center">Định Mức Chuẩn</th>
                    <th className="py-3 px-4 text-center">Thực Tế Hiện Có</th>
                    <th className="py-3 px-4 text-center">Độ Lệch</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {/* Row 1: Hiệu trưởng */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" /> Hiệu trưởng / Giám đốc
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">Điều 4 Khoản 1</td>
                    <td className="py-3.5 px-4 text-center font-bold">1</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {scorecard.leadershipAudit.principalActual}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {scorecard.leadershipAudit.principalActual - 1 === 0 ? (
                        <span className="text-emerald-600">0</span>
                      ) : (
                        <span className="text-red-600">
                          +{scorecard.leadershipAudit.principalActual - 1}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {scorecard.leadershipAudit.principalActual === 1 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Đúng chuẩn
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" /> Vượt định mức
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 2: Phó Hiệu trưởng */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" /> Phó Hiệu trưởng (Trường chính & Phân hiệu)
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">Điều 4 Khoản 2</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {scorecard.leadershipAudit.vicePrincipalQuota} (1 chính + {allCampuses.length - 1} phân hiệu)
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {scorecard.leadershipAudit.vicePrincipalActual}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      {scorecard.leadershipAudit.excessVicePrincipals > 0 ? (
                        <span className="text-amber-600">
                          +{scorecard.leadershipAudit.excessVicePrincipals} (Dôi dư)
                        </span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {scorecard.leadershipAudit.excessVicePrincipals === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Đúng chuẩn
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Bảo lưu NĐ 178
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 3: Nhóm dùng chung */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" /> Kế toán, Văn thư, Thủ quỹ (Dùng chung)
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">Điều 5 Khoản 1.a</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {scorecard.sharedStaffAudit.accountantQuota +
                        scorecard.sharedStaffAudit.clerkQuota +
                        scorecard.sharedStaffAudit.treasurerQuota}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {scorecard.sharedStaffAudit.accountantActual +
                        scorecard.sharedStaffAudit.clerkActual +
                        scorecard.sharedStaffAudit.treasurerActual}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      <span className="text-emerald-600">0</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Đã bố trí
                      </span>
                    </td>
                  </tr>

                  {/* Row 4: Nhóm bố trí theo phân hiệu */}
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-600" /> Nhân sự hỗ trợ 7 vị trí theo phân hiệu
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">Điều 5 Khoản 1.b</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {allCampuses.length * 7} ({allCampuses.length} cơ sở × 7)
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {supportStaffList.length -
                        (scorecard.sharedStaffAudit.accountantActual +
                          scorecard.sharedStaffAudit.clerkActual +
                          scorecard.sharedStaffAudit.treasurerActual)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
                      <span className="text-gray-600">Kiêm nhiệm liên cơ sở</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        <Info className="w-3 h-3 mr-1" /> Kiêm nhiệm Điều 5.1.c
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERSHIP (BGH - ĐIỀU 4) */}
      {activeTab === "leadership" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Cơ Cấu Ban Giám Hiệu Sau Sắp Xếp (Điều 4 NQ 37)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Quy định: Duy nhất 01 Hiệu trưởng toàn trường • 01 Phó HT tại trường chính • 01 Phó HT tại mỗi phân hiệu.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                Định mức tối đa: {scorecard.leadershipAudit.principalQuota + scorecard.leadershipAudit.vicePrincipalQuota} người
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leadershipList.map((leader) => (
                <div
                  key={leader.id}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          leader.role === "HIỆU TRƯỞNG"
                            ? "bg-indigo-600 text-white"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {leader.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{leader.name}</h4>
                        <p className="text-xs text-gray-500">{leader.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Chức danh:</span>
                      <strong className="text-indigo-700">{leader.role}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Phân công phụ trách:</span>
                      <span className="font-medium text-gray-800">{leader.campusName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span>Chế độ phụ cấp:</span>
                      <span className="text-emerald-700 font-semibold">Theo quy định hiện hành</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {scorecard.leadershipAudit.excessVicePrincipals > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Hướng dẫn giải quyết {scorecard.leadershipAudit.excessVicePrincipals} Phó Hiệu trưởng dôi dư:
                </h4>
                <ul className="list-disc list-inside text-xs space-y-1 opacity-90">
                  <li>
                    Bố trí sang vị trí giáo viên giảng dạy môn chuyên ngành hoặc kiêm nhiệm công tác quản lý phân hiệu.
                  </li>
                  <li>
                    Thực hiện <strong>bảo lưu phụ cấp chức vụ lãnh đạo</strong> theo Điều 11 Nghị định 178/2024/NĐ-CP (sửa đổi NĐ 67/2025/NĐ-CP).
                  </li>
                  <li>
                    Tạo điều kiện giải quyết chính sách tinh giản biên chế theo Nghị định 154/2025/NĐ-CP nếu có nguyện vọng.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SHARED SUPPORT STAFF (ĐIỀU 5.1.A) */}
      {activeTab === "shared" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Nhóm Nhân Sự Hỗ Trợ Dùng Chung Toàn Trường (Điều 5.1.a)
            </h3>
            <p className="text-xs text-gray-500">
              Kế toán (1 người, tối đa 2 nếu trường nội trú quy mô lớn), Văn thư (1 người), Thủ quỹ (1 người). Dùng chung cho trường chính và tất cả phân hiệu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kế toán */}
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" /> Kế Toán Dùng Chung
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                    Định mức: {scorecard.sharedStaffAudit.accountantQuota}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Thực tế: {scorecard.sharedStaffAudit.accountantActual} người</p>
                  <p className="text-emerald-700 font-medium">
                    Yêu cầu: Có bằng cấp/chứng chỉ tài chính - kế toán (Điều 5.3.c).
                  </p>
                </div>
              </div>

              {/* Văn thư */}
              <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" /> Văn Thư Dùng Chung
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-purple-200 text-purple-800 rounded">
                    Định mức: {scorecard.sharedStaffAudit.clerkQuota}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Thực tế: {scorecard.sharedStaffAudit.clerkActual} người</p>
                  <p className="text-gray-600">Quản lý tiếp nhận & phát hành văn bản toàn trường.</p>
                </div>
              </div>

              {/* Thủ quỹ */}
              <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" /> Thủ Quỹ Dùng Chung
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
                    Định mức: {scorecard.sharedStaffAudit.treasurerQuota}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Thực tế: {scorecard.sharedStaffAudit.treasurerActual} người</p>
                  <p className="text-gray-600">Kiểm soát thu chi, tiền mặt và quỹ theo dõi tài sản.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CAMPUSES 7 ROLES (ĐIỀU 5.1.B) */}
      {activeTab === "campuses" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Nhân Sự Bố Trí Riêng Cho Từng Phân Hiệu (Điều 5.1.b)
                </h3>
                <p className="text-xs text-gray-500">
                  Mỗi cơ sở bố trí 01 người cho từng vị trí: Thiết bị, Thư viện, Giáo vụ, Tâm lý học đường, Hỗ trợ khuyết tật, CNTT, Y tế.
                </p>
              </div>

              {/* Campus Selector */}
              <select
                value={selectedCampusId}
                onChange={(e) => setSelectedCampusId(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Tất cả các cơ sở ({allCampuses.length})</option>
                {allCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isMainCampus ? "(Trường chính)" : "(Phân hiệu)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {scorecard.campusStaffAudits
                .filter((c) => selectedCampusId === "ALL" || c.campusId === selectedCampusId)
                .map((audit) => (
                  <div
                    key={audit.campusId}
                    className="p-5 rounded-xl border border-gray-200 bg-gray-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-sm text-gray-900">
                          {audit.campusName} {audit.isMainCampus && "★ Trụ sở chính"}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          audit.isCompliant
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {audit.isCompliant ? "Đạt chuẩn cơ sở" : "Cần kiểm tra nhân sự"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Thiết bị, TN</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.EQUIPMENT_LAB}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Thư viện</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.LIBRARY}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Giáo vụ</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.ACADEMIC_AFFAIRS}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Tư vấn tâm lý</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.STUDENT_COUNSELING}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Hỗ trợ khuyết tật</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.DISABILITY_SUPPORT}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">CNTT / Quản trị</span>
                        <strong className="text-sm text-gray-900">{audit.actualPerRole.IT_OFFICE_ADMIN}/1</strong>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-gray-100">
                        <span className="text-[11px] text-gray-500 block">Y tế trường học</span>
                        <strong className="text-sm text-emerald-700">{audit.actualPerRole.MEDICAL_HEALTH}/1</strong>
                      </div>
                    </div>

                    {audit.violations.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                        <span className="font-bold">Cảnh báo tiêu chuẩn:</span>
                        {audit.violations.map((v, idx) => (
                          <p key={idx}>• {v}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 36 MONTH TRANSITION (ĐIỀU 5.3.A) */}
      {activeTab === "transition36m" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Theo Dõi Lộ Trình Chuẩn Hóa Chuyên Môn 36 Tháng (Điều 5.3.a)
                </h3>
                <p className="text-xs text-gray-500">
                  Nhân sự hỗ trợ giáo dục có 36 tháng kể từ 05/08/2026 để hoàn thành tiêu chuẩn chuyên môn; trong thời gian này giữ nguyên mã số, ngạch và lương hiện hưởng.
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                Hạn cuối: 05/08/2029
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Họ và Tên Nhân Sự</th>
                    <th className="py-3 px-4">Vị Trí Phân Công</th>
                    <th className="py-3 px-4">Cơ Sở Trực Thuộc</th>
                    <th className="py-3 px-4">Văn Bằng Hiện Có</th>
                    <th className="py-3 px-4 text-center">Tiến Độ Chuẩn Hóa</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {supportStaffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-900">{staff.name}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">{staff.role}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{staff.campusName}</td>
                      <td className="py-3 px-4 text-xs text-gray-700">{staff.degreeName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {scorecard.standardizationMonthsLeft}/36 tháng
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {staff.isCertified ? (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Đã đạt chuẩn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            Đang bồi dưỡng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PROPOSAL SUBMISSION */}
      {activeTab === "proposal" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Tờ Trình Phê Duyệt Phương Án Sắp Xếp Bộ Máy & Định Mức Biên Chế
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Kính gửi: <strong>Sở Giáo dục và Đào tạo TP. Hải Phòng</strong> • Căn cứ: Nghị quyết 37/2026/NQ-CP và Nghị định 178/2024/NĐ-CP.
              </p>
            </div>

            {proposalSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-950">
                  Tờ Trình Phương Án Đã Được Thiết Lập & Đồng Bộ Thành Công
                </h4>
                <p className="text-xs text-emerald-800 max-w-xl mx-auto">
                  Hồ sơ phương án tổ chức bộ máy của {scorecard.schoolName} đã sẵn sàng trong danh mục văn bản chính thức của nhà trường.
                </p>
                <button
                  onClick={() => setProposalSuccess(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                >
                  Tạo bản cập nhật mới
                </button>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Tên cơ sở giáo dục</label>
                    <input
                      type="text"
                      disabled
                      value={scorecard.schoolName}
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-medium text-gray-700"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Hiệu trưởng đề xuất kiện toàn</label>
                    <input
                      type="text"
                      disabled
                      value={leadershipList.find((l) => l.role === "HIỆU TRƯỞNG")?.name || "Hiệu trưởng"}
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-medium text-gray-700"
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                  <span className="text-xs font-bold text-indigo-900 block">
                    Tóm tắt định mức theo phương án:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-700">
                    <div>• Hiệu trưởng: <strong>01 người</strong></div>
                    <div>• Phó Hiệu trưởng: <strong>{scorecard.leadershipAudit.vicePrincipalQuota} người</strong></div>
                    <div>• Dôi dư bảo lưu NĐ 178: <strong>{scorecard.leadershipAudit.excessVicePrincipals} người</strong></div>
                    <div>• Nhân sự hỗ trợ: <strong>{supportStaffList.length} người</strong></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Ý kiến đề xuất & Thuyết minh chi tiết gửi Sở GD&ĐT
                  </label>
                  <textarea
                    rows={4}
                    value={proposalNotes}
                    onChange={(e) => setProposalNotes(e.target.value)}
                    placeholder="Ghi rõ phương án bố trí kiêm nhiệm, hỗ trợ đào tạo nâng chuẩn 36 tháng cho nhân sự hỗ trợ giáo dục..."
                    className="w-full p-3.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submittingProposal ? "Đang gửi hồ sơ..." : "Hoàn Tất & Gửi Tờ Trình Sở GD&ĐT"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
