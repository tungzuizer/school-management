"use client";

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
    getSchoolPointsList().then((pts) => {
      setSchoolPoints(pts);
      if (pts.length > 0 && !newRequest.schoolPointName) {
        setNewRequest((prev) => ({ ...prev, schoolPointName: pts[0].name }));
      }
    }).catch(console.error);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Multi-Point AI Satellite Dispatcher</span>
            </div>
            <h1 className="text-2xl font-bold">Dieu Chuyen & Bo Tri Day Thay Da Diem Truong</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Khop noi tu dong thoi khoa bieu, chuyen mon, toa do dia ly va khoang cach di chuyen giua cac diem truong khi co giao vien vang dot xuat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 border border-white/20"
            >
              <Plus className="w-4 h-4" />
              Bao nghi diem le
            </button>
            <button
              onClick={handleAutoDispatch}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 text-gray-900 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-gray-900" />
              )}
              {isGenerating ? "AI dang tinh toan khoang cach..." : "AI Tu Dong Dieu Chuyen"}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Tong yeu cau</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Cho Hieu truong duyet</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {plans.filter((p) => p.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Da dieu dong thanh cong</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {plans.filter((p) => p.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Loc theo diem truong</p>
            <select
              value={filterPoint}
              onChange={(e) => setFilterPoint(e.target.value)}
              className="mt-1 text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tat ca diem truong</option>
              {schoolPoints.map((pt) => (
                <option key={pt.name} value={pt.name}>
                  {pt.name} ({pt.distance}km)
                </option>
              ))}
            </select>
          </div>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Phuong An Dieu Chuyen Day Thay & Lo Trinh Di Chuyen AI
          </h2>
          <span className="text-xs text-gray-500">
            Hien thi {filteredPlans.length} ke hoach dieu dong
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Dang tai du lieu...</span>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <UserCheck className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Chua co phan cong dieu chuyen nao.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="p-6 hover:bg-gray-50/80 transition space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          Lop {plan.className} - Mon {plan.subjectName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-100">
                          <MapPin className="w-3 h-3 text-indigo-600" />
                          {plan.schoolPointName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-amber-600" />
                          {plan.distanceKm === 0 ? "Tai cho (0 km)" : `${plan.distanceKm} km`}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          Tiet {plan.period}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                        <span>GV nghi: <strong className="text-gray-900">{plan.originalTeacher}</strong></span>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>GV day thay de xuat: <strong className="text-blue-700">{plan.substituteTeacher}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {plan.status === "APPROVED" || plan.status === "COMPLETED" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        Da Phe Duyet & Phat Lenh
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApprove(plan.id)}
                        disabled={isApproving === plan.id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
                      >
                        {isApproving === plan.id ? "Dang duyet..." : "Phe duyet dieu dong"}
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Recommendation Details */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 rounded-xl border border-indigo-100/70 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Phan tich khoang cach & Phan cong AI:</span>
                  </div>
                  <p className="text-slate-700 pl-5">{plan.aiRecommendation}</p>
                  {plan.reason && (
                    <p className="text-slate-500 pl-5 pt-1 border-t border-indigo-100/50">
                      Ly do bao vang: <em>{plan.reason}</em>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Bao Nghi Tai Diem Truong & Kich Hoat AI</h2>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Giao vien xin nghi</label>
                <input
                  type="text"
                  required
                  placeholder="Ho va ten giao vien"
                  value={newRequest.originalTeacher}
                  onChange={(e) => setNewRequest({ ...newRequest, originalTeacher: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Diem truong</label>
                  <select
                    value={newRequest.schoolPointName}
                    onChange={(e) => setNewRequest({ ...newRequest, schoolPointName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {schoolPoints.map((pt) => (
                      <option key={pt.name} value={pt.name}>
                        {pt.name} ({pt.distance}km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Lop hoc</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 9C1"
                    value={newRequest.className}
                    onChange={(e) => setNewRequest({ ...newRequest, className: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Mon hoc</label>
                  <input
                    type="text"
                    required
                    value={newRequest.subjectName}
                    onChange={(e) => setNewRequest({ ...newRequest, subjectName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tiet hoc</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRequest.period}
                    onChange={(e) => setNewRequest({ ...newRequest, period: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Ly do vang mat</label>
                <textarea
                  rows={2}
                  placeholder="VD: Mua sat lo duong, sot cao dot xuat..."
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? "AI dang tim GV..." : "Kich hoat AI Tim GV Day Thay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
