"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  FileCheck,
  Search,
  Filter,
  Eye,
  Send,
  XCircle,
  RotateCcw,
  Unlock,
  MessageSquare,
  Paperclip,
  Check,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  FileText,
  Building,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  getApprovalWorkflows,
  confirmCampusStep,
  reviewVicePrincipalStep,
  approvePrincipalStep,
  requestEditWorkflow,
  rejectWorkflow,
  recallWorkflow,
  requestUnlockWorkflow,
  approveUnlockWorkflow,
  addWorkflowComment,
} from "./actions";

interface CommentItem {
  id: string;
  userName?: string | null;
  userRole?: string | null;
  commentType: string;
  commentContent: string;
  attachmentUrl?: string | null;
  createdAt: string | Date;
}

interface WorkflowItem {
  id: string;
  moduleName: string;
  recordId: string;
  title: string;
  campusId?: string | null;
  currentStep: number;
  currentStatus: string;
  submittedBy?: string | null;
  submittedByName?: string | null;
  submittedAt?: string | Date | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | Date | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | Date | null;
  rejectionReason?: string | null;
  isLocked: boolean;
  lockedAt?: string | Date | null;
  version: number;
  dueDate?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  comments: CommentItem[];
}

export default function PendingApprovalsClient({
  initialWorkflows,
}: {
  initialWorkflows: WorkflowItem[];
}) {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(initialWorkflows);
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [activeTab, setActiveTab] = useState<"PENDING" | "LOCKED" | "EDIT" | "ALL">("PENDING");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected item modal state
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [actionModalType, setActionModalType] = useState<"EDIT_REQ" | "REJECT" | "UNLOCK_REQ" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [commentInput, setCommentInput] = useState("");

  // Toast feedback state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const refreshData = () => {
    startTransition(async () => {
      const res = await getApprovalWorkflows();
      if (res.success && res.data) {
        setWorkflows(res.data);
        if (selectedWorkflow) {
          const updated = res.data.find((w: any) => w.id === selectedWorkflow.id);
          if (updated) setSelectedWorkflow(updated);
        }
      }
    });
  };

  // Filtered workflows
  const filteredWorkflows = workflows.filter((w) => {
    // Tab filter
    if (activeTab === "PENDING") {
      if (!["SUBMITTED", "CAMPUS_CONFIRMED", "VP_REVIEWED", "UNLOCK_REQUESTED"].includes(w.currentStatus)) {
        return false;
      }
    } else if (activeTab === "LOCKED") {
      if (w.currentStatus !== "LOCKED" && !w.isLocked) return false;
    } else if (activeTab === "EDIT") {
      if (!["EDIT_REQUESTED", "REJECTED"].includes(w.currentStatus)) return false;
    }

    // Module filter
    if (moduleFilter !== "ALL" && w.moduleName !== moduleFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = w.title.toLowerCase().includes(q);
      const matchSender = (w.submittedByName || "").toLowerCase().includes(q);
      if (!matchTitle && !matchSender) return false;
    }

    return true;
  });

  // Action handlers
  const handleConfirmCampus = (id: string) => {
    startTransition(async () => {
      const res = await confirmCampusStep(id);
      if (res.success) {
        showToast("success", res.message || "Xác nhận cấp phân hiệu thành công");
        refreshData();
      } else {
        showToast("error", res.error || "Thất bại");
      }
    });
  };

  const handleReviewVP = (id: string) => {
    startTransition(async () => {
      const res = await reviewVicePrincipalStep(id);
      if (res.success) {
        showToast("success", res.message || "Phó Hiệu trưởng rà soát thành công");
        refreshData();
      } else {
        showToast("error", res.error || "Thất bại");
      }
    });
  };

  const handleApprovePrincipal = (id: string) => {
    startTransition(async () => {
      const res = await approvePrincipalStep(id);
      if (res.success) {
        showToast("success", res.message || "Phê duyệt & Khóa dữ liệu thành công");
        refreshData();
      } else {
        showToast("error", res.error || "Thất bại");
      }
    });
  };

  const handleActionSubmitWithReason = () => {
    if (!selectedWorkflow || !actionModalType) return;
    if (!reasonInput.trim()) {
      showToast("error", "Vui lòng nhập lý do bắt buộc");
      return;
    }

    startTransition(async () => {
      let res;
      if (actionModalType === "EDIT_REQ") {
        res = await requestEditWorkflow(selectedWorkflow.id, reasonInput);
      } else if (actionModalType === "REJECT") {
        res = await rejectWorkflow(selectedWorkflow.id, reasonInput);
      } else if (actionModalType === "UNLOCK_REQ") {
        res = await requestUnlockWorkflow(selectedWorkflow.id, reasonInput);
      }

      if (res?.success) {
        showToast("success", res.message || "Thao tác thành công");
        setActionModalType(null);
        setReasonInput("");
        refreshData();
      } else {
        showToast("error", res?.error || "Thất bại");
      }
    });
  };

  const handleRecall = (id: string) => {
    startTransition(async () => {
      const res = await recallWorkflow(id);
      if (res.success) {
        showToast("success", res.message || "Rút lại hồ sơ thành công");
        refreshData();
      } else {
        showToast("error", res.error || "Thất bại");
      }
    });
  };

  const handleApproveUnlock = (id: string) => {
    startTransition(async () => {
      const res = await approveUnlockWorkflow(id);
      if (res.success) {
        showToast("success", res.message || "Đã mở khóa thành công");
        refreshData();
      } else {
        showToast("error", res.error || "Thất bại");
      }
    });
  };

  const handleAddComment = () => {
    if (!selectedWorkflow || !commentInput.trim()) return;
    startTransition(async () => {
      const res = await addWorkflowComment(selectedWorkflow.id, commentInput);
      if (res.success) {
        showToast("success", "Đã thêm ý kiến trao đổi");
        setCommentInput("");
        refreshData();
      } else {
        showToast("error", res.error || "Không thể gửi ý kiến");
      }
    });
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string, isLocked: boolean) => {
    if (isLocked || status === "LOCKED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Lock className="w-3 h-3" /> Đã duyệt & Khóa
        </span>
      );
    }

    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <FileText className="w-3 h-3" /> Bản nháp
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3" /> Chờ Phân hiệu xác nhận
          </span>
        );
      case "CAMPUS_CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <UserCheck className="w-3 h-3" /> PH đã xác nhận (Chờ Phó HT)
          </span>
        );
      case "VP_REVIEWED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <ShieldCheck className="w-3 h-3" /> Phó HT đã rà soát (Chờ Hiệu trưởng)
          </span>
        );
      case "EDIT_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3" /> Yêu cầu bổ sung/Sửa
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3" /> Đã từ chối / Trả lại
          </span>
        );
      case "UNLOCK_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <Unlock className="w-3 h-3" /> Yêu cầu mở khóa
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getModuleNameLabel = (name: string) => {
    switch (name) {
      case "QUALITY_OBJECTIVE":
        return "Mục tiêu Chất lượng SMART";
      case "STRATEGY_KPI":
        return "Bộ chỉ số KPI";
      case "MONTHLY_PLAN":
        return "Kế hoạch tháng";
      case "LESSON_PLAN":
        return "Giáo án giảng dạy";
      default:
        return name;
    }
  };

  // Stats calculation
  const pendingCount = workflows.filter((w) =>
    ["SUBMITTED", "CAMPUS_CONFIRMED", "VP_REVIEWED", "UNLOCK_REQUESTED"].includes(w.currentStatus)
  ).length;
  const lockedCount = workflows.filter((w) => w.isLocked || w.currentStatus === "LOCKED").length;
  const editCount = workflows.filter((w) => ["EDIT_REQUESTED", "REJECTED"].includes(w.currentStatus)).length;
  const unlockReqCount = workflows.filter((w) => w.currentStatus === "UNLOCK_REQUESTED").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-pulse ${
            feedback.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {feedback.type === "success" ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              QUY TRÌNH GỬI, PHÊ DUYỆT VÀ KHÓA DỮ LIỆU THỐNG NHẤT
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hồ Sơ Chờ Phê Duyệt & Khóa Dữ Liệu</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Quản lý quy trình 5 bước thẩm định multi-level: Bản nháp ➔ Gửi kiểm tra ➔ Phân hiệu xác nhận ➔ Phó Hiệu trưởng rà soát ➔ Hiệu trưởng phê duyệt & Khóa dữ liệu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isPending}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
              Làm mới dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Hồ sơ chờ xử lý</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{pendingCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Cần duyệt theo phân cấp</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Đã duyệt & Khóa dữ liệu</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">{lockedCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Dữ liệu chính thức chuẩn hóa</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Cần bổ sung / Sửa</p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">{editCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Trả lại yêu cầu điều chỉnh</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Yêu cầu mở khóa</p>
            <p className="text-3xl font-extrabold text-orange-600 mt-1">{unlockReqCount}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Chờ Hiệu trưởng quyết định</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Unlock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Unified Workflow Step Explanation Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Sơ đồ quy trình phê duyệt & khóa dữ liệu 6 cấp độ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { step: 1, title: "1. Bản nháp", desc: "Người lập soạn thảo", icon: FileText, color: "bg-gray-100 text-gray-700" },
            { step: 2, title: "2. Gửi duyệt", desc: "Trình kiểm tra", icon: Send, color: "bg-blue-100 text-blue-800" },
            { step: 3, title: "3. Phân hiệu", desc: "Xác nhận phân hiệu", icon: Building, color: "bg-indigo-100 text-indigo-800" },
            { step: 4, title: "4. Phó Hiệu Trưởng", desc: "Thẩm định rà soát", icon: UserCheck, color: "bg-purple-100 text-purple-800" },
            { step: 5, title: "5. Hiệu Trưởng", desc: "Phê duyệt cuối cùng", icon: CheckCircle2, color: "bg-amber-100 text-amber-800" },
            { step: 6, title: "6. Khóa dữ liệu", desc: "Đóng băng dữ liệu", icon: Lock, color: "bg-emerald-100 text-emerald-800" },
          ].map((item) => (
            <div key={item.step} className={`p-2.5 rounded-lg text-center ${item.color}`}>
              <item.icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <p className="text-xs font-bold">{item.title}</p>
              <p className="text-[10px] opacity-75">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Section with Tabs & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs and Filters Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "PENDING"
                  ? "bg-white text-[#1a237e] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Chờ xử lý ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("LOCKED")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "LOCKED"
                  ? "bg-white text-[#1a237e] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Đã duyệt & Khóa ({lockedCount})
            </button>
            <button
              onClick={() => setActiveTab("EDIT")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "EDIT"
                  ? "bg-white text-[#1a237e] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Cần sửa / Trả lại ({editCount})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "ALL"
                  ? "bg-white text-[#1a237e] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tất cả ({workflows.length})
            </button>
          </div>

          {/* Search & Module filter */}
          <div className="flex items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả loại hồ sơ</option>
              <option value="QUALITY_OBJECTIVE">Mục tiêu SMART</option>
              <option value="STRATEGY_KPI">Bộ chỉ số KPI</option>
              <option value="MONTHLY_PLAN">Kế hoạch tháng</option>
              <option value="LESSON_PLAN">Giáo án giảng dạy</option>
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên hồ sơ, người trình..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Loại hồ sơ</th>
                <th className="py-3 px-4">Tên hồ sơ / Nội dung trình</th>
                <th className="py-3 px-4">Người trình</th>
                <th className="py-3 px-4">Phân hiệu</th>
                <th className="py-3 px-4">Thời gian gửi</th>
                <th className="py-3 px-4">Trạng thái hiện tại</th>
                <th className="py-3 px-4 text-right">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không có hồ sơ nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-blue-900 whitespace-nowrap">
                      {getModuleNameLabel(item.moduleName)}
                      <span className="block text-[10px] text-gray-400 font-normal">v{item.version}.0</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 max-w-xs">
                      <p className="line-clamp-2">{item.title}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                      {item.submittedByName || "Chưa xác định"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {item.campusId ? `Phân hiệu ${item.campusId}` : "Toàn trường"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleDateString("vi-VN")
                        : "Chưa gửi"}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(item.currentStatus, item.isLocked)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedWorkflow(item)}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem & Xử lý
                      </button>

                      {/* Step actions directly in row for fast approval */}
                      {item.currentStatus === "SUBMITTED" && (
                        <button
                          onClick={() => handleConfirmCampus(item.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Phân hiệu duyệt
                        </button>
                      )}

                      {item.currentStatus === "CAMPUS_CONFIRMED" && (
                        <button
                          onClick={() => handleReviewVP(item.id)}
                          className="px-2.5 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Phó HT rà soát
                        </button>
                      )}

                      {item.currentStatus === "VP_REVIEWED" && (
                        <button
                          onClick={() => handleApprovePrincipal(item.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Lock className="w-3.5 h-3.5" /> HT Duyệt & Khóa
                        </button>
                      )}

                      {item.currentStatus === "UNLOCK_REQUESTED" && (
                        <button
                          onClick={() => handleApproveUnlock(item.id)}
                          className="px-2.5 py-1.5 bg-orange-600 text-white hover:bg-orange-700 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <Unlock className="w-3.5 h-3.5" /> HT Duyệt Mở khóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Full Process Execution Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 text-xs text-blue-200">
                  <span>{getModuleNameLabel(selectedWorkflow.moduleName)}</span>
                  <span>•</span>
                  <span>Phiên bản v{selectedWorkflow.version}.0</span>
                </div>
                <h2 className="text-lg font-bold mt-0.5">{selectedWorkflow.title}</h2>
              </div>
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 5-Step Process Indicator */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <p className="text-xs font-bold text-gray-600 uppercase mb-3">
                  Tiến trình phê duyệt & khóa dữ liệu (Cấp độ {selectedWorkflow.currentStep}/6)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {[
                    { step: 1, label: "Bản nháp", statusKey: "DRAFT" },
                    { step: 2, label: "Gửi duyệt", statusKey: "SUBMITTED" },
                    { step: 3, label: "PH Xác nhận", statusKey: "CAMPUS_CONFIRMED" },
                    { step: 4, label: "Phó HT Rà soát", statusKey: "VP_REVIEWED" },
                    { step: 5, label: "HT Phê duyệt", statusKey: "PRINCIPAL_APPROVED" },
                    { step: 6, label: "Đã Khóa", statusKey: "LOCKED" },
                  ].map((s) => {
                    const isDone = selectedWorkflow.currentStep > s.step || selectedWorkflow.isLocked;
                    const isCurrent = selectedWorkflow.currentStep === s.step && !selectedWorkflow.isLocked;
                    return (
                      <div
                        key={s.step}
                        className={`p-2 rounded-lg text-center border text-xs font-medium transition ${
                          isDone
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : isCurrent
                            ? "bg-blue-600 border-blue-600 text-white font-bold shadow-md"
                            : "bg-white border-gray-200 text-gray-400"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>Step {s.step}</span>
                        </div>
                        <p className="text-[11px] mt-0.5">{s.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Notice & Rejection Reason */}
              {selectedWorkflow.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lý do yêu cầu sửa đổi / từ chối trước đó:</p>
                    <p className="mt-0.5">{selectedWorkflow.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Summary Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 border-r border-gray-200 pr-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mã hồ sơ (Record ID):</span>
                    <span className="font-mono text-gray-800 font-semibold">{selectedWorkflow.recordId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Người khởi tạo:</span>
                    <span className="font-semibold text-gray-800">{selectedWorkflow.submittedByName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thời gian trình duyệt:</span>
                    <span>
                      {selectedWorkflow.submittedAt
                        ? new Date(selectedWorkflow.submittedAt).toLocaleString("vi-VN")
                        : "Chưa nộp"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phân hiệu áp dụng:</span>
                    <span>{selectedWorkflow.campusId ? `Phân hiệu ${selectedWorkflow.campusId}` : "Toàn trường"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Trạng thái khóa:</span>
                    <span>
                      {selectedWorkflow.isLocked ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Khóa dữ liệu chính thức
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Đang mở chỉnh sửa</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Người thẩm định / rà soát:</span>
                    <span>{selectedWorkflow.reviewedByName || "Chưa thẩm định"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hiệu trưởng duyệt:</span>
                    <span>{selectedWorkflow.approvedByName || "Chưa duyệt"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Thời gian duyệt khóa:</span>
                    <span>
                      {selectedWorkflow.lockedAt
                        ? new Date(selectedWorkflow.lockedAt).toLocaleString("vi-VN")
                        : "Chưa khóa"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-3">
                <p className="text-xs font-bold text-blue-900 uppercase">Thực hiện thẩm định & Phê duyệt theo thẩm quyền</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWorkflow.currentStatus === "SUBMITTED" && (
                    <button
                      onClick={() => handleConfirmCampus(selectedWorkflow.id)}
                      disabled={isPending}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <UserCheck className="w-4 h-4" /> 1. Phân hiệu Xác nhận
                    </button>
                  )}

                  {selectedWorkflow.currentStatus === "CAMPUS_CONFIRMED" && (
                    <button
                      onClick={() => handleReviewVP(selectedWorkflow.id)}
                      disabled={isPending}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-4 h-4" /> 2. Phó HT Thẩm định
                    </button>
                  )}

                  {selectedWorkflow.currentStatus === "VP_REVIEWED" && (
                    <button
                      onClick={() => handleApprovePrincipal(selectedWorkflow.id)}
                      disabled={isPending}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Lock className="w-4 h-4" /> 3. Hiệu trưởng Duyệt & Khóa
                    </button>
                  )}

                  {!selectedWorkflow.isLocked && selectedWorkflow.currentStatus !== "DRAFT" && (
                    <>
                      <button
                        onClick={() => {
                          setActionModalType("EDIT_REQ");
                          setReasonInput("");
                        }}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <AlertCircle className="w-4 h-4" /> Yêu cầu chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          setActionModalType("REJECT");
                          setReasonInput("");
                        }}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <XCircle className="w-4 h-4" /> Từ chối / Trả lại
                      </button>
                      <button
                        onClick={() => handleRecall(selectedWorkflow.id)}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-4 h-4" /> Rút lại hồ sơ
                      </button>
                    </>
                  )}

                  {selectedWorkflow.isLocked && (
                    <button
                      onClick={() => {
                        setActionModalType("UNLOCK_REQ");
                        setReasonInput("");
                      }}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Unlock className="w-4 h-4" /> Trình yêu cầu Mở khóa Dữ liệu
                    </button>
                  )}

                  {selectedWorkflow.currentStatus === "UNLOCK_REQUESTED" && (
                    <button
                      onClick={() => handleApproveUnlock(selectedWorkflow.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Unlock className="w-4 h-4" /> Hiệu trưởng Duyệt Mở khóa & Tạo v{selectedWorkflow.version + 1}.0
                    </button>
                  )}
                </div>
              </div>

              {/* Mandatory Reason Sub-modal */}
              {actionModalType && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {actionModalType === "EDIT_REQ" && "Nhập lý do yêu cầu chỉnh sửa (Bắt buộc)"}
                    {actionModalType === "REJECT" && "Nhập lý do từ chối / trả lại (Bắt buộc)"}
                    {actionModalType === "UNLOCK_REQ" && "Nhập lý do trình xin mở khóa dữ liệu (Bắt buộc)"}
                  </h3>
                  <textarea
                    rows={3}
                    placeholder="Vui lòng nhập rõ ràng chi tiết căn cứ và yêu cầu..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-xs p-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActionModalType(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleActionSubmitWithReason}
                      disabled={isPending || !reasonInput.trim()}
                      className="px-4 py-1.5 text-xs font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition"
                    >
                      Xác nhận gửi
                    </button>
                  </div>
                </div>
              )}

              {/* Discussion & Audit Log Section */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Lịch sử trao đổi & Audit trail
                </h3>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedWorkflow.comments && selectedWorkflow.comments.length > 0 ? (
                    selectedWorkflow.comments.map((c) => (
                      <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                        <div className="flex items-center justify-between text-gray-500 mb-1">
                          <span className="font-semibold text-gray-800">
                            {c.userName} <span className="text-gray-400 font-normal">({c.userRole})</span>
                          </span>
                          <span className="text-[10px]">{new Date(c.createdAt).toLocaleString("vi-VN")}</span>
                        </div>
                        <p className="text-gray-700">{c.commentContent}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">Chưa có ý kiến trao đổi nào.</p>
                  )}
                </div>

                {/* Add new comment form */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Viết ý kiến hoặc ghi chú cho hồ sơ..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isPending || !commentInput.trim()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedWorkflow(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
