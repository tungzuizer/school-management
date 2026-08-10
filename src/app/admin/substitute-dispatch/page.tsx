"use client";

import { useState } from "react";
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
} from "lucide-react";

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

const mockPlans: SubstitutePlan[] = [
  {
    id: "sub-1",
    originalTeacher: "Nguyễn Văn An (Toán)",
    substituteTeacher: "Trần Thị Bích (Toán - Điểm Trung Tâm)",
    campusName: "Cụm trường Trung Tâm",
    schoolPointName: "Điểm trường Trung Tâm",
    distanceKm: 0.0,
    className: "10A1",
    subjectName: "Toán học",
    date: "2026-08-10",
    period: 2,
    reason: "Nghỉ bệnh đột xuất",
    aiRecommendation:
      "Cô Bích trống tiết 2, cùng chuyên môn Toán 10 và đang trực tại Điểm Trung Tâm (0km). Tỷ lệ trùng lịch: 0%. Đánh giá tối ưu: 98/100.",
    status: "PENDING",
  },
  {
    id: "sub-2",
    originalTeacher: "Lê Hoàng Nam (Vật lý)",
    substituteTeacher: "Phạm Văn Minh (Vật lý - Điểm Trung Tâm)",
    campusName: "Cụm trường Vùng Cao",
    schoolPointName: "Điểm Bản Mó",
    distanceKm: 5.2,
    className: "11B2",
    subjectName: "Vật lý",
    date: "2026-08-10",
    period: 4,
    reason: "Đi họp PGD&ĐT tuyến huyện",
    aiRecommendation:
      "Thầy Minh kết thúc tiết 2 tại Điểm Trung Tâm, có 45 phút di chuyển xe máy (5.2 km) đến Điểm Bản Mó để dạy tiếp tiết 4. Đường đi khô ráo, thời tiết thuận lợi.",
    status: "APPROVED",
  },
  {
    id: "sub-3",
    originalTeacher: "Hoàng Thị Mai (Tiếng Anh)",
    substituteTeacher: "Đỗ Đức Huy (Tiếng Anh - Điểm Bản Mó)",
    campusName: "Cụm trường Vùng Cao",
    schoolPointName: "Điểm Phia Xam",
    distanceKm: 14.2,
    className: "9C1",
    subjectName: "Tiếng Anh",
    date: "2026-08-11",
    period: 1,
    reason: "Nghỉ thai sản / Bệnh đột xuất",
    aiRecommendation:
      "Điều chuyển tạm thời 2 tuần từ Điểm Bản Mó sang Điểm Phia Xam (14.2 km). AI khuyến nghị hỗ trợ phụ cấp di chuyển vùng khó khăn và xếp tiết tập trung buổi sáng.",
    status: "PENDING",
  },
  {
    id: "sub-4",
    originalTeacher: "Lò Văn Sinh (Ngữ Văn)",
    substituteTeacher: "Lý Thị Mai (Ngữ Văn - Điểm Bản Pún)",
    campusName: "Cụm trường Vùng Cao",
    schoolPointName: "Điểm Bản Pún",
    distanceKm: 8.5,
    className: "8B1",
    subjectName: "Ngữ Văn",
    date: "2026-08-10",
    period: 3,
    reason: "Mưa lũ đường tràn qua suối",
    aiRecommendation:
      "Cô Mai đang có mặt tại Điểm Bản Pún, nhận dạy ghép/dạy thay nối tiết 3 để đảm bảo học sinh không bị trống giờ học.",
    status: "APPROVED",
  },
];

const SATELLITE_SCHOOL_POINTS = [
  { name: "Điểm trường Trung Tâm", distance: 0.0, campus: "Cụm trường Trung Tâm" },
  { name: "Điểm Bản Mó", distance: 5.2, campus: "Cụm trường Vùng Cao" },
  { name: "Điểm Bản Pún", distance: 8.5, campus: "Cụm trường Vùng Cao" },
  { name: "Điểm Phia Xam", distance: 14.2, campus: "Cụm trường Vùng Cao" },
];

export default function SubstituteDispatchPage() {
  const [plans, setPlans] = useState<SubstitutePlan[]>(mockPlans);
  const [filterPoint, setFilterPoint] = useState("ALL");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    originalTeacher: "",
    schoolPointName: "Điểm Bản Mó",
    className: "",
    subjectName: "Toán học",
    date: new Date().toISOString().split("T")[0],
    period: 1,
    reason: "",
  });

  const filteredPlans = plans.filter((p) =>
    filterPoint === "ALL" ? true : p.schoolPointName === filterPoint
  );

  const handleApprove = (id: string) => {
    setPlans(plans.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p)));
  };

  const handleAutoDispatch = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const targetPoint = SATELLITE_SCHOOL_POINTS[1]; // Điểm Bản Mó
      const generated: SubstitutePlan = {
        id: `sub-${Date.now()}`,
        originalTeacher: "Đặng Thu Thảo (Ngữ Văn)",
        substituteTeacher: "Vũ Quốc Việt (Ngữ Văn - Điểm Trung Tâm)",
        campusName: targetPoint.campus,
        schoolPointName: targetPoint.name,
        distanceKm: targetPoint.distance,
        className: "9A2",
        subjectName: "Ngữ Văn",
        date: new Date().toISOString().split("T")[0],
        period: 3,
        reason: "Sự cố di chuyển đường núi",
        aiRecommendation: `AI gợi ý Thầy Việt: Trống tiết 3, di chuyển từ Điểm Trung Tâm lên ${targetPoint.name} (${targetPoint.distance} km). Dự kiến di chuyển 18 phút bằng xe máy. Phản hồi xác nhận tự động qua Zalo.`,
        status: "PENDING",
      };
      setPlans([generated, ...plans]);
    }, 1200);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.originalTeacher || !newRequest.className) return;

    const pointInfo = SATELLITE_SCHOOL_POINTS.find(
      (pt) => pt.name === newRequest.schoolPointName
    ) || SATELLITE_SCHOOL_POINTS[0];

    const newPlan: SubstitutePlan = {
      id: `sub-${Date.now()}`,
      originalTeacher: newRequest.originalTeacher,
      substituteTeacher: "Đang phân tích AI tối ưu vị trí & khoảng cách...",
      campusName: pointInfo.campus,
      schoolPointName: pointInfo.name,
      distanceKm: pointInfo.distance,
      className: newRequest.className,
      subjectName: newRequest.subjectName,
      date: newRequest.date,
      period: Number(newRequest.period),
      reason: newRequest.reason || "Xin nghỉ đột xuất",
      aiRecommendation: `AI đang quét lịch dạy toàn hệ thống để chọn GV cùng bộ môn ở bán kính gần nhất (${pointInfo.distance} km từ Trung Tâm).`,
      status: "PENDING",
    };

    setPlans([newPlan, ...plans]);
    setShowAddModal(false);
    setNewRequest({
      originalTeacher: "",
      schoolPointName: "Điểm Bản Mó",
      className: "",
      subjectName: "Toán học",
      date: new Date().toISOString().split("T")[0],
      period: 1,
      reason: "",
    });
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
            <h1 className="text-2xl font-bold">Điều Chuyển & Bố Trí Dạy Thay Đa Điểm Trường</h1>
            <p className="text-blue-100 text-sm mt-1 max-w-2xl">
              Khớp nối tự động thời khóa biểu, chuyên môn, tọa độ địa lý và khoảng cách di chuyển giữa 4 điểm trường (Trung Tâm, Bản Mó, Bản Pún, Phia Xam) khi có giáo viên vắng đột xuất.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 border border-white/20"
            >
              <Plus className="w-4 h-4" />
              Báo nghỉ điểm lẻ
            </button>
            <button
              onClick={handleAutoDispatch}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-gray-900" />
              {isGenerating ? "AI đang tính toán khoảng cách..." : "AI Tự Động Điều Chuyển"}
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Tổng yêu cầu hôm nay</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Chờ Hiệu trưởng duyệt</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {plans.filter((p) => p.status === "PENDING").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Đã điều động thành công</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {plans.filter((p) => p.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Lọc theo điểm trường</p>
            <select
              value={filterPoint}
              onChange={(e) => setFilterPoint(e.target.value)}
              className="mt-1 text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả 4 điểm trường</option>
              {SATELLITE_SCHOOL_POINTS.map((pt) => (
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
            Phương Án Điều Chuyển Dạy Thay & Lộ Trình Di Chuyển AI
          </h2>
          <span className="text-xs text-gray-500">
            Hiển thị {filteredPlans.length} kế hoạch điều động
          </span>
        </div>

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
                        Lớp {plan.className} - Môn {plan.subjectName}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-100">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        {plan.schoolPointName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-amber-600" />
                        {plan.distanceKm === 0 ? "Tại chỗ (0 km)" : `${plan.distanceKm} km`}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Tiết {plan.period}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 flex-wrap">
                      <span>GV nghỉ: <strong className="text-gray-900">{plan.originalTeacher}</strong></span>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>GV dạy thay đề xuất: <strong className="text-blue-700">{plan.substituteTeacher}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {plan.status === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Đã Phê Duyệt & Phát Lệnh
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApprove(plan.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition"
                    >
                      Phê duyệt điều động
                    </button>
                  )}
                </div>
              </div>

              {/* AI Recommendation Details */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 rounded-xl border border-indigo-100/70 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Phân tích khoảng cách & Phân công AI:</span>
                </div>
                <p className="text-slate-700 pl-5">{plan.aiRecommendation}</p>
                {plan.reason && (
                  <p className="text-slate-500 pl-5 pt-1 border-t border-indigo-100/50">
                    Lý do báo vắng: <em>{plan.reason}</em>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Báo Nghỉ Tại Điểm Trường & Kích Hoạt AI</h2>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Giáo viên xin nghỉ</label>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên giáo viên"
                  value={newRequest.originalTeacher}
                  onChange={(e) => setNewRequest({ ...newRequest, originalTeacher: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Điểm trường</label>
                  <select
                    value={newRequest.schoolPointName}
                    onChange={(e) => setNewRequest({ ...newRequest, schoolPointName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {SATELLITE_SCHOOL_POINTS.map((pt) => (
                      <option key={pt.name} value={pt.name}>
                        {pt.name} ({pt.distance}km)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Lớp học</label>
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
                  <label className="block font-medium text-gray-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    required
                    value={newRequest.subjectName}
                    onChange={(e) => setNewRequest({ ...newRequest, subjectName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Tiết học</label>
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
                <label className="block font-medium text-gray-700 mb-1">Lý do vắng mặt</label>
                <textarea
                  rows={2}
                  placeholder="VD: Mưa sạt lở đường, sốt cao đột xuất..."
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
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                >
                  Kích hoạt AI Tìm GV Dạy Thay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
