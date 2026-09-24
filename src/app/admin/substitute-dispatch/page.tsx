"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Route: /admin/substitute-dispatch
 * 2. Component: SubstituteDispatchPage
 * 3. Purpose: Điều chuyển & Bố trí Dạy thay Đa Điểm trường thông minh dựa trên AI & Khoảng cách Địa lý
 * 4. UI/UX: Executive Grade, Full Vietnamese Accents, Crisp Slate & Emerald/Indigo Palette.
 */

import { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  BookOpen,
  ArrowRight,
  Filter,
  Plus,
  MapPin,
  Navigation,
  Compass,
  RefreshCw,
  Check,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  getAssignments,
  approveAssignment,
  createAssignment,
  autoDispatchAI,
  getSchoolPointsList,
} from "./actions";

interface SubstitutePlan {
  id: string;
  originalTeacher: string;
  substituteTeacher: string;
  campusName: string;
  schoolPointName: string;
  distanceKm: number;
  className: string;
  subjectName: string;
  date: string;
  period: number;
  reason: string;
  aiRecommendation: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED";
}

interface SchoolPointOption {
  name: string;
  distance: number;
  campus: string;
}

export default function SubstituteDispatchPage() {
  const [plans, setPlans] = useState<SubstitutePlan[]>([]);
  const [schoolPoints, setSchoolPoints] = useState<SchoolPointOption[]>([]);
  const [filterPoint, setFilterPoint] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    originalTeacher: "",
    schoolPointName: "",
    className: "",
    subjectName: "Toán học",
    date: new Date().toISOString().split("T")[0],
    period: 1,
    reason: "",
  });

  // Load school points on mount
  useEffect(() => {
    getSchoolPointsList()
      .then((pts) => {
        setSchoolPoints(pts);
        if (pts.length > 0 && !newRequest.schoolPointName) {
          setNewRequest((prev) => ({ ...prev, schoolPointName: pts[0].name }));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch assignments when filter changes
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAssignments(filterPoint);
      setPlans(data as SubstitutePlan[]);
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filterPoint]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredPlans = plans;

  const handleApprove = async (id: string) => {
    setIsApproving(id);
    try {
      const result = await approveAssignment(id);
      if (result.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p))
        );
      } else {
        alert("Lỗi phê duyệt: " + (result.error || "Không xác định"));
      }
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setIsApproving(null);
    }
  };

  const handleAutoDispatch = async () => {
    setIsGenerating(true);
    try {
      const result = await autoDispatchAI();
      if (result.success && result.data) {
        setPlans((prev) => [result.data as SubstitutePlan, ...prev]);
      } else {
        alert("AI điều chuyển lỗi: " + (result.error || "Không xác định"));
      }
    } catch (err) {
      console.error("Auto dispatch error:", err);
      alert("Lỗi kết nối AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.originalTeacher || !newRequest.className) return;
    setIsCreating(true);
    try {
      const result = await createAssignment({
        originalTeacher: newRequest.originalTeacher,
        schoolPointName: newRequest.schoolPointName,
        className: newRequest.className,
        subjectName: newRequest.subjectName,
        date: newRequest.date,
        period: Number(newRequest.period),
        reason: newRequest.reason || "Xin nghỉ đột xuất",
      });
      if (result.success) {
        await fetchAssignments();
        setShowAddModal(false);
        setNewRequest({
          originalTeacher: "",
          schoolPointName: schoolPoints[0]?.name || "",
          className: "",
          subjectName: "Toán học",
          date: new Date().toISOString().split("T")[0],
          period: 1,
          reason: "",
        });
      } else {
        alert("Lỗi tạo yêu cầu: " + (result.error || "Không xác định"));
      }
    } catch (err) {
      console.error("Create request error:", err);
      alert("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* 1. Executive Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Point AI Satellite Dispatcher</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              Điều Chuyển & Bố Trí Dạy Thay Đa Điểm Trường
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tự động khớp nối thời khóa biểu, chuyên môn bộ môn, tọa độ địa lý và khoảng cách di chuyển giữa 5 phân hiệu khi có giáo viên vắng đột xuất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Báo nghỉ điểm lẻ
            </button>
            <button
              onClick={handleAutoDispatch}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
              {isGenerating ? "AI đang phân tích khoảng cách..." : "AI Tự Động Điều Chuyển"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview Metrics & Point Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng yêu cầu điều động</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{plans.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-1.5">Toàn bộ 5 phân hiệu & điểm trường</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chờ Hiệu trưởng duyệt</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">
            {plans.filter((p) => p.status === "PENDING").length}
          </p>
          <p className="text-xs text-amber-700 font-medium mt-1.5">Cần xác nhận phát lệnh tức thì</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã điều động thành công</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {plans.filter((p) => p.status === "APPROVED" || p.status === "COMPLETED").length}
          </p>
          <p className="text-xs text-emerald-700 font-medium mt-1.5">Đã đồng bộ vào sổ đầu bài</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lọc theo điểm trường</span>
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <select
            value={filterPoint}
            onChange={(e) => setFilterPoint(e.target.value)}
            aria-label="Lọc theo điểm trường"
            className="mt-2 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả phân hiệu & điểm trường</option>
            {schoolPoints.map((pt) => (
              <option key={pt.name} value={pt.name}>
                {pt.name} ({pt.distance === 0 ? "Trung tâm" : `Cách ${pt.distance}km`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main Dispatch Assignment List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm sm:text-base text-white">
              Phương Án Điều Chuyển Dạy Thay & Lộ Trình Di Chuyển AI
            </h2>
          </div>
          <span className="text-xs text-slate-300 font-medium">
            Hiển thị {filteredPlans.length} kế hoạch điều động
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="ml-3 text-slate-600 text-sm font-medium">Đang tải danh sách điều chuyển...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <UserCheck className="w-12 h-12 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Chưa có phương án điều chuyển nào được ghi nhận</p>
            <p className="text-xs text-slate-500">Nhấn &quot;AI Tự Động Điều Chuyển&quot; hoặc &quot;Báo nghỉ điểm lẻ&quot; để tạo mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="p-5 sm:p-6 hover:bg-slate-50/80 transition space-y-3.5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">
                          Lớp {plan.className} – Môn {plan.subjectName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-200">
                          <MapPin className="w-3 h-3 text-indigo-600" />
                          {plan.schoolPointName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-amber-600" />
                          {plan.distanceKm === 0 ? "Tại chỗ (0 km)" : `Cách ${plan.distanceKm} km`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Tiết {plan.period}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Ngày {plan.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap pt-0.5">
                        <span className="text-slate-500">
                          GV xin nghỉ: <strong className="text-slate-900 font-bold">{plan.originalTeacher}</strong>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-500">
                          GV dạy thay đề xuất: <strong className="text-emerald-700 font-bold">{plan.substituteTeacher}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {plan.status === "APPROVED" || plan.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Đã Phê Duyệt & Phát Lệnh
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(plan.id)}
                        disabled={isApproving === plan.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {isApproving === plan.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang duyệt...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Phê duyệt điều động</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Recommendation Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Phân tích khoảng cách & Khuyến nghị điều phối AI:</span>
                  </div>
                  <p className="text-slate-700 pl-5 font-sans leading-relaxed">{plan.aiRecommendation}</p>
                  {plan.reason && (
                    <p className="text-slate-500 pl-5 pt-1 border-t border-slate-200/80">
                      Lý do báo vắng: <span className="italic text-slate-700 font-medium">{plan.reason}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Báo Nghỉ Tại Điểm Trường & Kích Hoạt AI</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ tên giáo viên xin nghỉ</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thầy Nguyễn Văn A"
                  value={newRequest.originalTeacher}
                  onChange={(e) => setNewRequest({ ...newRequest, originalTeacher: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm trường xảy ra vắng</label>
                  <select
                    value={newRequest.schoolPointName}
                    onChange={(e) => setNewRequest({ ...newRequest, schoolPointName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    {schoolPoints.map((pt) => (
                      <option key={pt.name} value={pt.name}>
                        {pt.name} ({pt.distance === 0 ? "Trung tâm" : `Cách ${pt.distance}km`})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp học</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 9A1"
                    value={newRequest.className}
                    onChange={(e) => setNewRequest({ ...newRequest, className: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Toán học"
                    value={newRequest.subjectName}
                    onChange={(e) => setNewRequest({ ...newRequest, subjectName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết học</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRequest.period}
                    onChange={(e) => setNewRequest({ ...newRequest, period: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do vắng mặt</label>
                <textarea
                  rows={2}
                  placeholder="VD: Thời tiết mưa lũ sạt lở đường, sốt cao đột xuất..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI đang tìm GV...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kích hoạt AI Tìm GV Dạy Thay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
