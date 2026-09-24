"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Route: /admin/kpi/daily
 * 2. Component: DailyKpiPage (renders DailyKpiConsole with Executive Header & Breadcrumb)
 * 3. Purpose: Dedicated direct route for Principal Daily KPI Evaluation (NQ 37 & TT 15)
 */

import Link from "next/link";
import { ArrowLeft, Target, Calendar, Sparkles } from "lucide-react";
import DailyKpiConsole from "./DailyKpiConsole";

export default function DailyKpiPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* Top Breadcrumb & Executive Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/kpi"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Trở về Khung KPI Tổng Thể</span>
              </Link>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-md border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Đo Lường Hàng Ngày (NQ 37 & TT 15)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
              <Target className="w-6 h-6 text-emerald-400" />
              Console Đánh Giá & Chấm Điểm KPI Hàng Ngày
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Thu thập số liệu chuyên cần, nề nếp, sổ đầu bài tự động theo thời gian thực; hỗ trợ Ban Giám hiệu theo dõi và khóa sổ thi đua định kỳ.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/kpi/principal-dashboard"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              Dashboard BGH
            </Link>
            <Link
              href="/admin/kpi/catalog"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
            >
              Danh mục chỉ số
            </Link>
          </div>
        </div>
      </div>

      {/* Main Console Component */}
      <DailyKpiConsole />
    </div>
  );
}
