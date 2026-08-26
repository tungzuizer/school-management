"use client";

import { useEffect, useState } from "react";
import {
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
  MessageSquare,
  Clock,
  ChevronRight,
  Info,
} from "lucide-react";

export default function KpiApprovalPage() {
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

  const loadPeriods = async () => {
    setLoading(true);
    const res = await getKpiPeriods();
    if (res.success && res.data) {
      setPeriods(res.data);
      if (res.data.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(res.data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPeriods();
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

  const currentStatus = periodDetails?.status as KpiPeriodStatus;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Quy Trình Phê Duyệt & Nhật Ký Mở Khóa KPI</h1>
          </div>
          <p className="text-sm text-slate-500">
            Quy trình phê duyệt 4 cấp (Cán bộ nhập &rarr; Phân hiệu &rarr; Phó Hiệu trưởng &rarr; Hiệu trưởng duyệt khóa dữ liệu).
          </p>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-semibold">
            Đóng
          </button>
        </div>
      )}

      {/* Period Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Chọn Kỳ Cần Phê Duyệt:</span>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[300px]"
          >
            {periods.length === 0 ? (
              <option value="">-- Chưa có kỳ KPI nào --</option>
            ) : (
              periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.year}) - {STATUS_LABELS[p.status as KpiPeriodStatus]?.label}
                </option>
              ))
            )}
          </select>
        </div>

        {periodDetails && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase">Điểm KPI tổng thể</div>
              <div className="text-2xl font-extrabold text-indigo-600">
                {periodDetails.overallScore ?? 0} / 100
              </div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                STATUS_LABELS[currentStatus]?.class
              }`}
            >
              {STATUS_LABELS[currentStatus]?.label}
            </span>
          </div>
        )}
      </div>

      {/* Empty State Banner if no periods exist */}
      {periods.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
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
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
          >
            {processing ? "Đang khởi tạo..." : "Khởi Tạo Kỳ Đánh Giá KPI Mẫu 2026"}
          </button>
        </div>
      )}

      {/* 4-TIER APPROVAL PIPELINE VISUALIZATION */}
      {periodDetails && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Tiến Độ Phê Duyệt 4 Cấp
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1: Submit */}
            <div
              className={`p-4 rounded-2xl border ${
                currentStatus !== "DRAFT"
                  ? "bg-emerald-50/60 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 1</span>
                {currentStatus !== "DRAFT" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Cán bộ nhập liệu</h3>
              <p className="text-xs text-slate-500 mt-1">Hoàn thành số liệu & gửi duyệt</p>
              <div className="mt-3">
                {currentStatus === "DRAFT" ? (
                  <span className="text-xs font-semibold text-amber-600">Đang chờ nhập số liệu</span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700">✓ Đã gửi dữ liệu</span>
                )}
              </div>
            </div>

            {/* Step 2: Campus Check */}
            <div
              className={`p-4 rounded-2xl border ${
                ["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus)
                  ? "bg-emerald-50/60 border-emerald-200"
                  : currentStatus === "SUBMITTED"
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 2</span>
                {["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Quản lý Phân hiệu</h3>
              <p className="text-xs text-slate-500 mt-1">Thẩm định tính chính xác số liệu</p>
              <div className="mt-3">
                {currentStatus === "SUBMITTED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("CAMPUS")}
                    className="w-full py-1.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition"
                  >
                    Thẩm định Phân hiệu
                  </button>
                ) : ["CAMPUS_CHECKED", "VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <span className="text-xs font-semibold text-emerald-700">✓ Phân hiệu đã duyệt</span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>

            {/* Step 3: VP Review */}
            <div
              className={`p-4 rounded-2xl border ${
                ["VP_REVIEWED", "APPROVED"].includes(currentStatus)
                  ? "bg-emerald-50/60 border-emerald-200"
                  : currentStatus === "CAMPUS_CHECKED"
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-500/20"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 3</span>
                {["VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Phó Hiệu trưởng</h3>
              <p className="text-xs text-slate-500 mt-1">Thông qua chất lượng toàn trường</p>
              <div className="mt-3">
                {currentStatus === "CAMPUS_CHECKED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("VP")}
                    className="w-full py-1.5 bg-purple-600 text-white font-semibold rounded-xl text-xs hover:bg-purple-700 transition"
                  >
                    Phó Hiệu trưởng duyệt
                  </button>
                ) : ["VP_REVIEWED", "APPROVED"].includes(currentStatus) ? (
                  <span className="text-xs font-semibold text-emerald-700">✓ BGH đã thông qua</span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>

            {/* Step 4: Principal Approve */}
            <div
              className={`p-4 rounded-2xl border ${
                currentStatus === "APPROVED"
                  ? "bg-emerald-100/80 border-emerald-300 ring-2 ring-emerald-500/30"
                  : currentStatus === "VP_REVIEWED"
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">CẤP 4</span>
                {currentStatus === "APPROVED" ? (
                  <Award className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Hiệu trưởng phê duyệt</h3>
              <p className="text-xs text-slate-500 mt-1">Quyết định chính thức & khóa sổ</p>
              <div className="mt-3">
                {currentStatus === "VP_REVIEWED" ? (
                  <button
                    disabled={processing}
                    onClick={() => handleOpenApproveModal("PRINCIPAL")}
                    className="w-full py-1.5 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition shadow-sm"
                  >
                    Hiệu trưởng Phê Duyệt
                  </button>
                ) : currentStatus === "APPROVED" ? (
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> ĐÃ KHÓA CHÍNH THỨC
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Chưa đến lượt</span>
                )}
              </div>
            </div>
          </div>

          {/* Weight Check Rule Notice */}
          {weightInfo && !weightInfo.isValid && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Cảnh báo trọng số:</strong> {weightInfo.message} (Hiện tại: {weightInfo.totalWeight}%). Tổng trọng số phải đúng 100% mới được phê duyệt hoàn tất.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Unlock Requests Audit Log Section */}
      {periodDetails && periodDetails.unlockLogs?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-amber-600" />
            Yêu Cầu Mở Khóa Dữ Liệu KPI ({periodDetails.unlockLogs.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
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
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
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
                          className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-xl text-xs hover:bg-amber-700 transition"
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
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Nhật Ký Thẩm Định & Phê Duyệt (Audit Trail)
          </h2>

          {periodDetails.approvalLogs?.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Chưa có nhật ký ghi nhận nào.</p>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
              {periodDetails.approvalLogs.map((log: any) => (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold text-slate-700">{log.reviewerName || "Hệ thống"}</span>
                    <span className="font-mono">{new Date(log.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700 text-xs uppercase">{log.action}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              {approvalAction === "CAMPUS"
                ? "Thẩm Định Cấp Phân Hiệu"
                : approvalAction === "VP"
                ? "Thông Qua Cấp Phó Hiệu Trưởng"
                : "Phê Duyệt Chính Thức (Hiệu Trưởng)"}
            </h2>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Người phê duyệt / Chức danh</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ý kiến thẩm định & Nhận xét</label>
                <textarea
                  rows={4}
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 shadow-sm transition"
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
