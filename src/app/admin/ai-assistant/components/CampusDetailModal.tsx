"use client";

import React from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  UserCheck,
  Laptop,
  ShieldAlert,
  Phone,
  User,
} from "lucide-react";
import type {
  SchoolPointSummary,
  TeacherAvailabilitySnapshot,
  EquipmentSnapshot,
  EarlyWarningItem,
} from "@/lib/ai-assistant/types";

interface CampusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointStatus: {
    schoolPointId: string;
    schoolPointName: string;
    distanceKm: number;
    healthScore: number;
    statusColor: "GREEN" | "YELLOW" | "RED";
    attendanceRate: number;
    absentCount: number;
    unrecordedJournals: number;
    activeAlertsCount: number;
    issues: string[];
    quickRecommendation: string;
  } | null;
  pointSummary?: SchoolPointSummary | null;
  teachers?: TeacherAvailabilitySnapshot[];
  equipment?: EquipmentSnapshot[];
  alerts?: EarlyWarningItem[];
  onNavigateToTab?: (tab: any, subPayload?: any) => void;
}

export default function CampusDetailModal({
  isOpen,
  onClose,
  pointStatus,
  pointSummary,
  teachers = [],
  equipment = [],
  alerts = [],
  onNavigateToTab,
}: CampusDetailModalProps) {
  if (!isOpen || !pointStatus) return null;

  const getStatusBadge = (color: "GREEN" | "YELLOW" | "RED") => {
    switch (color) {
      case "GREEN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            TRẠNG THÁI: ỔN ĐỊNH
          </span>
        );
      case "YELLOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            TRẠNG THÁI: CẦN CHÚ Ý
          </span>
        );
      case "RED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            TRẠNG THÁI: BÁO ĐỘNG ĐỎ
          </span>
        );
    }
  };

  const pointTeachers = teachers.filter(
    (t) =>
      t.schoolPointId === pointStatus.schoolPointId ||
      t.schoolPointName === pointStatus.schoolPointName
  );

  const pointEquipment = equipment.filter(
    (eq) =>
      eq.schoolPointId === pointStatus.schoolPointId ||
      eq.schoolPointName === pointStatus.schoolPointName
  );

  const pointAlerts = alerts.filter(
    (al) =>
      al.schoolPointId === pointStatus.schoolPointId ||
      al.schoolPointName === pointStatus.schoolPointName
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white">
                  {pointStatus.schoolPointName}
                </h2>
                {getStatusBadge(pointStatus.statusColor)}
              </div>
              <p className="text-xs text-indigo-200/80 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {pointStatus.distanceKm === 0
                    ? "Trụ sở Trung tâm"
                    : `Cách điểm trung tâm ${pointStatus.distanceKm} km đèo dốc`}
                </span>
                {pointSummary?.managerName && (
                  <span className="flex items-center gap-1 border-l border-indigo-500/30 pl-2">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    Phụ trách: {pointSummary.managerName}
                  </span>
                )}
                {pointSummary?.phone && (
                  <span className="flex items-center gap-1 border-l border-indigo-500/30 pl-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    {pointSummary.phone}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Section 1: Health Score Radar & Key Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Health Score Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 border border-indigo-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-indigo-900 block">Chỉ số Sức khỏe</span>
              <div className="my-2">
                <span
                  className={`text-3xl font-black ${
                    pointStatus.healthScore >= 85
                      ? "text-emerald-600"
                      : pointStatus.healthScore >= 70
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {pointStatus.healthScore}
                </span>
                <span className="text-xs text-slate-500 font-bold">/100</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pointStatus.healthScore >= 85
                      ? "bg-emerald-500"
                      : pointStatus.healthScore >= 70
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.max(5, pointStatus.healthScore)}%` }}
                />
              </div>
            </div>

            {/* Attendance Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Chuyên cần Học sinh
              </span>
              <div className="my-2">
                <span className="text-2xl font-black text-slate-900">
                  {pointStatus.attendanceRate}%
                </span>
              </div>
              <span className="text-[11px] text-rose-600 font-semibold">
                Vắng: {pointStatus.absentCount} HS {pointSummary ? `(Tổng: ${pointSummary.totalStudents} HS)` : ""}
              </span>
            </div>

            {/* Teaching Journal Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                Sổ đầu bài & Giáo án
              </span>
              <div className="my-2">
                <span
                  className={`text-2xl font-black ${
                    pointStatus.unrecordedJournals > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {pointStatus.unrecordedJournals > 0
                    ? `${pointStatus.unrecordedJournals} Nợ sổ`
                    : "100% Đầy đủ"}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {pointSummary ? `${pointSummary.totalClasses} Lớp học` : "Đã kiểm tra"}
              </span>
            </div>

            {/* Alerts Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Cảnh báo Hiện thời
              </span>
              <div className="my-2">
                <span
                  className={`text-2xl font-black ${
                    pointStatus.activeAlertsCount > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {pointStatus.activeAlertsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium ml-1">vụ việc</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {pointStatus.issues?.length > 0 ? `${pointStatus.issues.length} vấn đề ghi nhận` : "Không có rủi ro"}
              </span>
            </div>
          </div>

          {/* Section 2: AI Deep Diagnosis & Action Plan */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-indigo-50/40 to-slate-50 border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4.5 h-4.5 text-amber-600" />
              <span>Phân tích Chuyên sâu & Khuyến nghị Chỉ đạo từ Trợ lý AI</span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-amber-100 shadow-2xs">
              &ldquo;{pointStatus.quickRecommendation}&rdquo;
            </p>

            {pointStatus.issues?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-700">Các vấn đề cần can thiệp ngay:</span>
                <div className="flex flex-wrap gap-2">
                  {pointStatus.issues.map((issue, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-rose-100/80 text-rose-900 text-xs font-medium rounded-lg border border-rose-200 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Active Alerts for this Point */}
          {pointAlerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Cảnh báo & Rủi ro đang xử lý tại điểm trường ({pointAlerts.length})
              </h4>
              <div className="space-y-2.5">
                {pointAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-rose-950">{alert.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{alert.description}</p>
                    {alert.suggestedAction && (
                      <p className="text-[11px] text-indigo-900 bg-white/80 p-2 rounded-lg border border-indigo-100 font-medium">
                        💡 <strong>Đề xuất xử lý:</strong> {alert.suggestedAction}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Assigned Teachers & Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Teachers List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Đội ngũ Giáo viên ({pointTeachers.length})
                </span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pointTeachers.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                    Chưa có danh sách giáo viên phụ trách cố định.
                  </div>
                ) : (
                  pointTeachers.map((t) => (
                    <div
                      key={t.teacherId}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[11px] text-slate-500">
                          Chuyên môn: {t.specialty || t.subjectNames?.join(", ") || "Chung"}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.isAvailableToday
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.isAvailableToday ? "Có mặt" : "Bận tiết"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Equipment Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  Cơ sở vật chất & Thiết bị ({pointEquipment.length})
                </span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pointEquipment.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                    Chưa có bản ghi thiết bị đặc thù.
                  </div>
                ) : (
                  pointEquipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{eq.name}</span>
                        <span className="text-[11px] text-slate-500">
                          Sẵn sàng: {eq.availableQuantity}/{eq.totalQuantity} {eq.unit}
                          {eq.brokenQuantity > 0 ? ` (Hỏng: ${eq.brokenQuantity})` : ""}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          eq.condition === "GOOD"
                            ? "bg-emerald-100 text-emerald-800"
                            : eq.condition === "FAIR"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {eq.condition === "GOOD" ? "Tốt" : eq.condition === "FAIR" ? "Bình thường" : "Cần sửa"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500">
            Dữ liệu giám sát tự động cập nhật theo thời gian thực.
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onNavigateToTab && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab("COORDINATION_DISPATCH", {
                      pointId: pointStatus.schoolPointId,
                    });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Điều phối Dạy thay
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTab("COORDINATION_DISPATCH", {
                      targetPointId: pointStatus.schoolPointId,
                    });
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                  Điều chuyển Thiết bị
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
