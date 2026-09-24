"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router (route /admin/kpi)
 * 2. Public functions affected: UnifiedKpiPage (Default Export Component)
 * 3. Data schemas: Next.js searchParams
 * 4. Verbatim User Instruction: "sao vẫn còn icon màu mè vậy ?" -> "theo khuyến nghị của bạn" (Chuẩn hóa toàn diện tối giản đơn sắc Monochrome/Slate)
 */

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import KpiCatalogPage from "./catalog/page";
import KpiEntryPage from "./entry/page";
import KpiApprovalPage from "./approval/page";
import PrincipalKpiDashboard from "./principal-dashboard/page";
import DailyKpiConsole from "./daily/DailyKpiConsole";
import { Settings, FileBarChart, UserCheck, Target, Compass, ShieldCheck } from "lucide-react";

function KpiTabContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") || "catalog";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin/kpi?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-7 h-7 text-slate-300" />
              <h1 className="text-2xl font-extrabold tracking-tight">Quản Lý KPI Toàn Trường</h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Hệ thống quản lý chỉ số hiệu suất KPI tập trung: Khởi tạo danh mục 12 nhóm chỉ số, nhập kết quả thực tế và thẩm định phê duyệt 4 cấp.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => handleTabChange("catalog")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "catalog"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            1. Danh Mục KPI
          </button>

          <button
            onClick={() => handleTabChange("entry")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "entry"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            2. Nhập Kết Quả KPI
          </button>

          <button
            onClick={() => handleTabChange("approval")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "approval"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            3. Phê Duyệt & Thẩm Định (4 Cấp)
          </button>

          <button
            onClick={() => handleTabChange("principal_dashboard")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "principal_dashboard"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            4. Giám Sát KPI Hiệu Trưởng
          </button>

          <button
            onClick={() => handleTabChange("daily")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === "daily"
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            5. Đánh Giá Hằng Ngày (Daily KPI)
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "catalog" && <KpiCatalogPage />}
        {activeTab === "entry" && <KpiEntryPage />}
        {activeTab === "approval" && <KpiApprovalPage />}
        {activeTab === "principal_dashboard" && <PrincipalKpiDashboard />}
        {activeTab === "daily" && <DailyKpiConsole />}
      </div>
    </div>
  );
}

export default function UnifiedKpiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Đang tải Quản lý KPI...</div>}>
      <KpiTabContent />
    </Suspense>
  );
}
