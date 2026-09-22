"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App Router page component src/app/admin/kpi/approval/page.tsx
 * 2. Affected API: KpiApprovalPage (Client Component)
 * 3. Data structures: Campus, KpiPeriod, KpiPeriodStatus, KpiReviewerLog, KpiUnlockLog.
 * 4. Verbatim User Instruction: "bỏ các icon màu mè đi dùng icon đơn giản" -> "theo khuyến nghị của bạn" (Chuẩn hóa toàn diện đơn sắc Monochrome/Slate)
 */

import { useEffect, useState } from "react";
import {
  getCampuses,
  getKpiPeriods,
  getKpiPeriodDetails,
  validateKpiPeriodWeights,
  checkCampusKpiPeriod,
  reviewVpKpiPeriod,
  approvePrincipalKpiPeriod,
  approveUnlockKpiPeriod,
  createKpiPeriod,
  seedDefaultKpiCatalog,
} from "../actions";
import { STATUS_LABELS } from "../kpi-labels";
import { KpiPeriodStatus } from "@prisma/client";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck,
  UserCheck,
  Award,
  History,
  Clock,
  Info,
  Building2,
  X,
} from "lucide-react";

export default function KpiApprovalPage() {
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [periodDetails, setPeriodDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [weightInfo, setWeightInfo] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"CAMPUS" | "VP" | "PRINCIPAL">("CAMPUS");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerComments, setReviewerComments] = useState("");

  const loadPeriods = async (campusId?: string) => {
    setLoading(true);
    const targetCampus = campusId !== undefined ? campusId : selectedCampusId;
    const res = await getKpiPeriods(targetCampus || undefined);
    if (res.success && res.data) {
      setPeriods(res.data);
      if (res.data.length > 0) {
        if (!res.data.some((p: any) => p.id === selectedPeriodId)) {
          setSelectedPeriodId(res.data[0].id);
        }
      } else {
        setSelectedPeriodId("");
        setPeriodDetails(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const cRes = await getCampuses();
      if (cRes.success && cRes.data) {
        setCampuses(cRes.data);
      }
      await loadPeriods();
    };
    init();
  }, []);

  const loadPeriodDetails = async (id: string) => {
    if (!id) return;
    setLoading(true);
    const res = await getKpiPeriodDetails(id);
    if (res.success && res.data) {
      setPeriodDetails(res.data);

      const wRes = await validateKpiPeriodWeights(id);
      if (wRes.success) {
        setWeightInfo(wRes);
      }
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi tải dữ liệu kỳ KPI." });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodDetails(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const handleOpenApproveModal = (action: "CAMPUS" | "VP" | "PRINCIPAL") => {
    setApprovalAction(action);
    setReviewerName(
      action === "CAMPUS"
        ? "Quản lý Phân hiệu"
        : action === "VP"
        ? "Phó Hiệu trưởng Chuyên môn"
        : "Hiệu trưởng"
    );
    setReviewerComments(
      action === "CAMPUS"
        ? "Đã thẩm định tính chính xác của số liệu thực tế Phân hiệu."
        : action === "VP"
        ? "Đã đánh giá chất lượng chỉ số đạt yêu cầu chung."
        : "Chính thức phê duyệt bộ chỉ số KPI. Khóa dữ liệu."
    );
    setShowApproveModal(true);
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) return;

    setProcessing(true);
    let res;
    if (approvalAction === "CAMPUS") {
      res = await checkCampusKpiPeriod(selectedPeriodId, reviewerName, reviewerComments);
    } else if (approvalAction === "VP") {
      res = await reviewVpKpiPeriod(selectedPeriodId, reviewerName, reviewerComments);
    } else {
      res = await approvePrincipalKpiPeriod(selectedPeriodId, reviewerName, reviewerComments);
    }

    if (res.success) {
      setMessage({ type: "success", text: res.message || "Thẩm định/Phê duyệt thành công!" });
      setShowApproveModal(false);
      await loadPeriodDetails(selectedPeriodId);
      await loadPeriods();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi phê duyệt." });
    }
    setProcessing(false);
  };

  const handleApproveUnlock = async (unlockLogId: string) => {
    setProcessing(true);
    const res = await approveUnlockKpiPeriod(unlockLogId, "Hiệu trưởng");
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã phê duyệt mở khóa kỳ KPI!" });
      await loadPeriodDetails(selectedPeriodId);
      await loadPeriods();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi mở khóa." });
    }
    setProcessing(false);
  };

  const handleCampusChange = async (campusId: string) => {
    setSelectedCampusId(campusId);
    await loadPeriods(campusId);
  };

  const currentStatus = periodDetails?.status as KpiPeriodStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-slate-800" />
            <h1 className="text-2xl font-bold text-slate-800">Quy Trình Phê Duyệt & Nhật Ký Mở Khóa KPI</h1>
          </div>
          <p className="text-sm text-slate-500">
            Quy trình phê duyệt 4 cấp (Cán bộ nhập &rarr; Phân hiệu &rarr; Phó Hiệu trưởng &rarr; Hiệu trưởng duyệt khóa sổ).
          </p>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
            message.type === "success"
              ? "bg-slate-50 text-slate-800 border-slate-300"
              : message.type === "warning"
              ? "bg-slate-50 text-slate-800 border-slate-300"
              : "bg-slate-50 text-slate-900 border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-700" />
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs text-slate-600 underline font-semibold cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Period Selection & Filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Campus Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-600">Phân hiệu:</span>
            <select
              value={selectedCampusId}
              onChange={(e) => handleCampusChange(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white min-w-[200px]"
            >
              <option value="">-- Tất cả Phân hiệu --</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-600">Kỳ Đánh Giá:</span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="p-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white min-w-[280px]"
            >
              {periods.length === 0 ? (
                <option value="">-- Không có kỳ KPI phù hợp --</option>
              ) : (
                periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.year}){p.campus ? ` - [${p.campus.name}]` : " - [Toàn trường]"} - {STATUS_LABELS[p.status as KpiPeriodStatus]?.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {periodDetails && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase">Điểm KPI tổng thể</div>
              <div className="text-2xl font-mono font-extrabold text-slate-900">
                {periodDetails.overallScore ?? 0} <span className="text-base font-normal text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  STATUS_LABELS[currentStatus]?.class
                }`}
              >
                {STATUS_LABELS[currentStatus]?.label}
              </span>
              <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {periodDetails.campus?.name || "Toàn trường"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Empty State Banner if no periods exist */}
      {periods.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Chưa có dữ liệu kỳ đánh giá KPI</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hệ thống chưa tìm thấy kỳ KPI nào trong cơ sở dữ liệu. Nhấn nút bên dưới để khởi tạo dữ liệu kỳ KPI mẫu cho năm học 2026.
          </p>
          <button
            onClick={async () => {
              setProcessing(true);
              await seedDefaultKpiCatalog();
              const res = await createKpiPeriod("Kỳ Đánh Giá KPI Học Kỳ 1", 2026, "SEMESTER");
              if (res.success) {
                setMessage({ type: "success", text: "Đã tạo kỳ KPI mẫu thành công!" });
                await loadPeriods();
              } else {
                setMessage({ type: "error", text: res.error || "Không thể tạo kỳ KPI." });
              }
              setProcessing(false);
            }}
            disabled={processing}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Đang khởi tạo..." : "Khởi Tạo Kỳ Đánh Giá KPI Mẫu 2026"}
          </button>
        </div>
      )}

      {/* 4-TIER APPROVAL PIPELINE VISUALIZATION */}
      {periodDetails && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            Tiến Độ Phê Duyệt 4 Cấp
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Submit */}
            <div
              className={`p-5 rounded-2xl border ${
                currentStatus !== "DRAFT"
                  ? "bg-slate-50 border-slate-300"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 1</span>
                {currentStatus !== "DRAFT" ? (
                  <CheckCircle2 className="w-5 h-5 text-slate-800" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Cán bộ nhập liệu</h3>
              <p className="text-xs text-slate-500 mt-1">Hoàn thành số liệu & gửi duyệt</p>
              <div className="mt-3">
                {currentStatus === "DRAFT" ? (
                  <span className="text-xs font-semibold text-slate-600">Đang chờ nhập số liệu</span>
                ) : (
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Đã gửi dữ liệu</span>
                  </span>
                )}
              </div>
            </div>

            {/* Step 2: Campus Check */}
            <div
              className={`p-5 rounded-2xl border ${
                ["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus)
                  ? "bg-slate-50 border-slate-300"
                  : currentStatus === "SUBMITTED"
                  ? "bg-white border-slate-800 ring-2 ring-slate-800/10"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 2</span>
                {["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <CheckCircle2 className="w-5 h-5 text-slate-800" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Quản lý Phân hiệu</h3>
              <p className="text-xs text-slate-500 mt-1">Thẩm định tính chính xác số liệu</p>
              <div className="mt-3">
                {currentStatus === "SUBMITTED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("CAMPUS")}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    Thẩm định Phân hiệu
                  </button>
                ) : ["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Phân hiệu đã duyệt</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>

            {/* Step 3: VP Review */}
            <div
              className={`p-5 rounded-2xl border ${
                ["VP_REVIEWED", "APPROVED"].includes(currentStatus)
                  ? "bg-slate-50 border-slate-300"
                  : currentStatus === "CAMPUS_CHECKED"
                  ? "bg-white border-slate-800 ring-2 ring-slate-800/10"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 3</span>
                {["VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <CheckCircle2 className="w-5 h-5 text-slate-800" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Phó Hiệu trưởng</h3>
              <p className="text-xs text-slate-500 mt-1">Thông qua chất lượng toàn trường</p>
              <div className="mt-3">
                {currentStatus === "CAMPUS_CHECKED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("VP")}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    Phó Hiệu trưởng duyệt
                  </button>
                ) : ["VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>BGH đã thông qua</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>

            {/* Step 4: Principal Approve */}
            <div
              className={`p-5 rounded-2xl border ${
                currentStatus === "APPROVED"
                  ? "bg-slate-900 text-white border-slate-800"
                  : currentStatus === "VP_REVIEWED"
                  ? "bg-white border-slate-800 ring-2 ring-slate-800/10"
                  : "bg-slate-50/50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${currentStatus === "APPROVED" ? "text-slate-400" : "text-slate-500"}`}>CẤP 4</span>
                {currentStatus === "APPROVED" ? (
                  <Award className="w-5 h-5 text-slate-200" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className={`font-bold text-sm ${currentStatus === "APPROVED" ? "text-white" : "text-slate-900"}`}>Hiệu trưởng phê duyệt</h3>
              <p className={`text-xs mt-1 ${currentStatus === "APPROVED" ? "text-slate-300" : "text-slate-500"}`}>Quyết định chính thức & khóa sổ</p>
              <div className="mt-3">
                {currentStatus === "VP_REVIEWED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("PRINCIPAL")}
                    className="w-full py-2 bg-slate-900 text-white font-medium rounded-xl text-xs hover:bg-slate-800 transition shadow-sm cursor-pointer"
                  >
                    Hiệu trưởng Phê Duyệt
                  </button>
                ) : currentStatus === "APPROVED" ? (
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> ĐÃ KHÓA SỔ CHÍNH THỨC
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>
          </div>

          {/* Weight Check Rule Notice */}
          {weightInfo && !weightInfo.isValid && (
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-slate-600 shrink-0" />
              <span>
                <strong>Cảnh báo trọng số:</strong> {weightInfo.message} (Hiện tại: {weightInfo.totalWeight}%). Tổng trọng số phải đúng 100% mới được phê duyệt hoàn tất.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Unlock Requests Audit Log Section */}
      {periodDetails && periodDetails.unlockLogs?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-slate-700" />
            Yêu Cầu Mở Khóa Dữ Liệu KPI ({periodDetails.unlockLogs.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase">
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Người gửi yêu cầu</th>
                  <th className="py-2.5 px-4">Lý do giải trình</th>
                  <th className="py-2.5 px-4 text-center">Trạng thái</th>
                  <th className="py-2.5 px-4 text-right">Thao tác Hiệu trưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodDetails.unlockLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.requestedByName || "---"}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-md">{log.reason}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.status === "APPROVED"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {log.status === "APPROVED" ? "Đã chấp thuận mở" : "Chờ Hiệu trưởng duyệt"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.status === "PENDING" && (
                        <button
                          disabled={processing}
                          onClick={() => handleApproveUnlock(log.id)}
                          className="px-3 py-1.5 bg-slate-900 text-white font-medium rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                        >
                          Chấp Thuận Mở Khóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approval Audit Trail History */}
      {periodDetails && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            Nhật Ký Thẩm Định & Phê Duyệt (Audit Trail)
          </h2>

          {periodDetails.approvalLogs?.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có nhật ký ghi nhận nào.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
              {periodDetails.approvalLogs.map((log: any) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-800 ring-4 ring-white" />
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{log.reviewerName || "Hệ thống"}</span>
                    <span className="font-mono">{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs uppercase">{log.action}</span>
                      <span className="text-xs text-slate-400">&rarr;</span>
                      <span className="text-xs font-semibold text-slate-600">
                        Chuyển sang: {STATUS_LABELS[log.toStatus as KpiPeriodStatus]?.label}
                      </span>
                    </div>
                    {log.comments && (
                      <p className="text-xs text-slate-600 italic">"{log.comments}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approval Action Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {approvalAction === "CAMPUS"
                  ? "Thẩm Định Cấp Phân Hiệu"
                  : approvalAction === "VP"
                  ? "Thông Qua Cấp Phó Hiệu Trưởng"
                  : "Phê Duyệt Chính Thức (Hiệu Trưởng)"}
              </h2>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Người phê duyệt / Chức danh</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ý kiến thẩm định & Nhận xét</label>
                <textarea
                  rows={4}
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-slate-900 text-white font-medium rounded-xl text-sm hover:bg-slate-800 shadow-sm transition cursor-pointer"
                >
                  Xác Nhận Phê Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
