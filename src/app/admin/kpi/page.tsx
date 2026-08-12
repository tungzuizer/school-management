"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import KpiCatalogPage from "./catalog/page";
import KpiEntryPage from "./entry/page";
import KpiApprovalPage from "./approval/page";
import { Settings, FileBarChart, UserCheck, Target } from "lucide-react";

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
      <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-300" />
              <h1 className="text-2xl font-extrabold tracking-tight">Quản Lý KPI Toàn Trường</h1>
            </div>
            <p className="text-sm text-blue-100 max-w-2xl">
              Hệ thống quản lý chỉ số hiệu suất KPI tập trung: Khởi tạo danh mục 12 nhóm chỉ số, nhập kết quả thực tế và thẩm định phê duyệt 4 cấp.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap gap-2 border-t border-white/15 pt-4">
          <button
            onClick={() => handleTabChange("catalog")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "catalog"
                ? "bg-white text-[#1a237e] shadow-md scale-[1.02]"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            1. Danh Mục KPI
          </button>

          <button
            onClick={() => handleTabChange("entry")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "entry"
                ? "bg-white text-[#1a237e] shadow-md scale-[1.02]"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            2. Nhập Kết Quả KPI
          </button>

          <button
            onClick={() => handleTabChange("approval")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === "approval"
                ? "bg-white text-[#1a237e] shadow-md scale-[1.02]"
                : "bg-white/10 text-blue-100 hover:bg-white/20 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            3. Phê Duyệt & Thẩm Định (4 Cấp)
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "catalog" && <KpiCatalogPage />}
        {activeTab === "entry" && <KpiEntryPage />}
        {activeTab === "approval" && <KpiApprovalPage />}
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
