"use client";

import React from "react";
import {
  Building2,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { RealtimeMonitoringResult } from "@/lib/ai-assistant/types";

interface CampusOverviewGridProps {
  pointStatuses: RealtimeMonitoringResult["pointStatuses"];
  selectedPointId?: string;
  onSelectPoint?: (pointId: string) => void;
}

export default function CampusOverviewGrid({
  pointStatuses,
  selectedPointId,
  onSelectPoint,
}: CampusOverviewGridProps) {
  const getStatusBadge = (color: "GREEN" | "YELLOW" | "RED") => {
    switch (color) {
      case "GREEN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ỔN ĐỊNH
          </span>
        );
      case "YELLOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            CẦN CHÚ Ý
          </span>
        );
      case "RED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            BÁO ĐỘNG ĐỎ
          </span>
        );
    }
  };

  const getCardBorder = (color: "GREEN" | "YELLOW" | "RED", isSelected: boolean) => {
    if (isSelected) {
      return "ring-3 ring-indigo-600 shadow-xl bg-indigo-50/20";
    }
    switch (color) {
      case "GREEN":
        return "border-slate-200 hover:border-emerald-400 hover:shadow-md";
      case "YELLOW":
        return "border-amber-300 bg-amber-50/10 hover:border-amber-400 hover:shadow-md";
      case "RED":
        return "border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:shadow-lg";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5">
      {pointStatuses.map((point) => {
        const isSelected = selectedPointId === point.schoolPointId;

        return (
          <div
            key={point.schoolPointId}
            onClick={() => onSelectPoint && onSelectPoint(point.schoolPointId)}
            className={`cursor-pointer rounded-2xl bg-white p-5 border transition-all duration-200 flex flex-col justify-between ${getCardBorder(
              point.statusColor,
              isSelected
            )}`}
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <Building2 className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                    {point.schoolPointName}
                  </h3>
                  <p className="text-xs text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    {point.distanceKm === 0
                      ? "Trụ sở chính (0.0 km)"
                      : `Cách trung tâm ${point.distanceKm} km`}
                  </p>
                </div>
                {getStatusBadge(point.statusColor)}
              </div>

              {/* Health Score Gauge Bar */}
              <div className="my-3.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                  <span className="text-slate-700">Chỉ số Sức khỏe (Health Score)</span>
                  <span
                    className={`font-black text-sm ${
                      point.healthScore >= 85
                        ? "text-emerald-700"
                        : point.healthScore >= 70
                        ? "text-amber-700"
                        : "text-rose-700"
                    }`}
                  >
                    {point.healthScore}/100
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      point.healthScore >= 85
                        ? "bg-emerald-500"
                        : point.healthScore >= 70
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(5, point.healthScore)}%` }}
                  />
                </div>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 block text-[11px] font-medium">Chuyên cần</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {point.attendanceRate}%
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    (Vắng: {point.absentCount} HS)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-700 block text-[11px] font-medium">Sổ đầu bài</span>
                  <span
                    className={`font-bold text-sm flex items-center gap-1 mt-0.5 ${
                      point.unrecordedJournals > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    {point.unrecordedJournals > 0 ? `${point.unrecordedJournals} nợ` : "Đã xong"}
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {point.activeAlertsCount > 0
                      ? `⚠️ ${point.activeAlertsCount} cảnh báo`
                      : "0 cảnh báo"}
                  </span>
                </div>
              </div>

              {/* Quick AI advice */}
              <p className="text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100/80 leading-relaxed italic line-clamp-2">
                &ldquo;{point.quickRecommendation}&rdquo;
              </p>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold mt-3">
              <span>Xem phân tích chi tiết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
