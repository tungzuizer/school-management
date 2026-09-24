"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/dashboard/page.tsx, src/app/vice-principal/dashboard/page.tsx
 * 2. Public functions/components: DailyKpiWidget
 * 3. Data flows: getDailyKpiOverviewForWidget
 * 4. User design contract: Clean, minimal, monochrome slate with semantic status highlights.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { getDailyKpiOverviewForWidget } from "@/app/admin/kpi/daily-actions";

export default function DailyKpiWidget({ campusId }: { campusId?: string }) {
  const [data, setData] = useState<{
    todayScore: number;
    attendanceRate: number;
    incidentCount: number;
    journalRate: number;
    evaluationStatus: string;
    warningAlert: boolean;
    campusName: string;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);

  const loadWidgetData = async () => {
    setLoading(true);
    try {
      const res = await getDailyKpiOverviewForWidget(campusId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error("Error loading daily KPI widget", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWidgetData();
  }, [campusId]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
        <div className="h-8 bg-slate-100 rounded w-1/2"></div>
        <div className="h-3 bg-slate-100 rounded w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-slate-700" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Chỉ Số Vận Hành Hôm Nay (Daily KPI)
          </span>
        </div>
        <button
          onClick={loadWidgetData}
          className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
          title="Làm mới"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Score Display */}
      <div className="my-4 flex items-baseline justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900">
              {data.todayScore}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100 điểm</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Phạm vi: {data.campusName}</p>
        </div>

        <div>
          {data.warningAlert ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Cần can thiệp
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ổn định
            </span>
          )}
        </div>
      </div>

      {/* Mini Sensors Breakdown */}
      <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-100 text-center">
        <div className="p-1.5 bg-slate-50 rounded-lg">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Chuyên cần</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5">{data.attendanceRate}%</div>
        </div>
        <div className="p-1.5 bg-slate-50 rounded-lg">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Sự cố an ninh</div>
          <div className={`text-xs font-bold mt-0.5 ${data.incidentCount > 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {data.incidentCount} vụ
          </div>
        </div>
        <div className="p-1.5 bg-slate-50 rounded-lg">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Sổ đầu bài</div>
          <div className="text-xs font-bold text-slate-900 mt-0.5">{data.journalRate}%</div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-3 flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500">
          Trạng thái:{" "}
          <strong className="text-slate-800">
            {data.evaluationStatus === "FINALIZED"
              ? "Đã chốt"
              : data.evaluationStatus === "DRAFT"
              ? "Bản nháp"
              : "Thời gian thực"}
          </strong>
        </span>
        <Link
          href="/admin/kpi?tab=daily"
          className="text-xs font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1 transition"
        >
          Chi tiết & Chốt KPI <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
