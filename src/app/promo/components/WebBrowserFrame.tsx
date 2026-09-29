"use client";

import React from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Calendar,
  Activity,
  BarChart2,
  Lock,
  Building2,
  ChevronRight,
  School,
  Trophy,
  CheckCircle2,
  Target,
  FileSpreadsheet,
} from "lucide-react";

interface WebBrowserFrameProps {
  urlPath: string;
  activeNav: "dashboard" | "schedule" | "kpi" | "analytics" | "journal" | "campuses" | "emulation";
  title?: string;
  campusName?: string;
  children: React.ReactNode;
}

export default function WebBrowserFrame({
  urlPath,
  activeNav,
  title = "Trung Tâm Điều Hành Quản Trị Trường Học Số",
  campusName = "Trường TH Phố Lu (Trung Tâm)",
  children,
}: WebBrowserFrameProps) {
  const navGroups = [
    {
      code: "01",
      title: "ĐIỀU HÀNH NỀN TẢNG",
      items: [
        { id: "dashboard", label: "Bảng chỉ huy Toàn trường", icon: LayoutDashboard, href: "/admin/dashboard" },
        { id: "kpi", label: "Giám sát KPI Mạng lưới", icon: Target, href: "/admin/kpi/principal-dashboard", badge: "KPI" },
        { id: "emulation", label: "Bảng vàng Thi đua Nề nếp", icon: Trophy, href: "/admin/emulation", badge: "Thi Đua" },
        { id: "analytics", label: "Điểm thi & Phổ Gauss OLS", icon: BarChart2, href: "/admin/exam-analytics", badge: "AI OLS" },
      ],
    },
    {
      code: "02",
      title: "MẠNG LƯỚI & ĐA ĐƠN VỊ",
      items: [
        { id: "campuses", label: "Cơ sở & 6 Phân hiệu", icon: Building2, href: "/admin/campuses" },
        { id: "schedule", label: "Thời khóa biểu AI Solver", icon: Calendar, href: "/admin/schedule", badge: "AI" },
        { id: "journal", label: "Sổ đầu bài & Niêm phong", icon: Lock, href: "/admin/journals", badge: "4 Cấp" },
      ],
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-900 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl font-sans select-none">
      {/* ── 1. Browser Window Header Bar (macOS / Chrome Style) ── */}
      <div className="h-8 sm:h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        {/* Left Traffic Lights & Active Tab */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* macOS 3 Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 border border-emerald-600" />
          </div>

          {/* Browser Tab */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-t-lg bg-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-800 border-t border-x border-slate-300 shadow-xs">
            <img src="/logo.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
            <span className="truncate max-w-[140px] sm:max-w-[210px]">Trường TH Phố Lu • qlthvn.com</span>
          </div>
        </div>

        {/* Center URL Address Bar with SSL Lock */}
        <div className="flex-1 max-w-[190px] sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] sm:text-[11px] font-mono text-slate-300 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-500 hidden sm:inline">https://</span>
            <span className="text-sky-300 font-semibold truncate">qlthvn.com{urlPath}</span>
          </div>
        </div>

        {/* Right Status Badges & Live Server indicator */}
        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] shrink-0 text-slate-300">
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800 font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">REALTIME CLOUD</span>
            <span className="sm:hidden">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── 2. App Shell (Top App Bar + Sidebar + Main Canvas) ── */}
      <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
        {/* Top In-App Header Bar */}
        <div className="h-9 sm:h-10 px-3 sm:px-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          {/* Breadcrumb & School Branding */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-black text-slate-900 tracking-tight">
              <School className="w-4 h-4 text-sky-600" />
              <span>TRƯỜNG TIỂU HỌC PHỐ LU</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-600 font-medium text-[10px] sm:text-[11px] truncate max-w-[150px] sm:max-w-[260px]">
              {campusName}
            </span>
          </div>

          {/* User Profile & School Year */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-mono">
              NH 2025-2026 • HK II
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                HT
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="font-bold text-[11px] text-slate-800">ThS. Trần Thị Thanh Hà</span>
                <span className="text-[9px] text-slate-500">Hiệu trưởng</span>
              </div>
            </div>
          </div>
        </div>

        {/* App Workspace: Left Sidebar + Main Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Real Sidebar Navigation with Luminous Crystal theme */}
          <aside className="w-36 sm:w-44 md:w-48 bg-gradient-to-b from-sky-50/80 via-white to-slate-50 border-r border-slate-200/90 flex flex-col justify-between p-2 shrink-0 select-none">
            <div className="flex flex-col gap-2.5">
              {navGroups.map((group) => (
                <div key={group.code} className="space-y-0.5">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-black text-slate-400 tracking-wider">
                    <span className="text-sky-600 font-mono">{group.code}</span>
                    <span className="truncate">{group.title}</span>
                  </div>
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between px-2 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-xs font-bold"
                              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[8px] font-black px-1 py-0.2 rounded font-mono shrink-0 ${
                                isActive ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800 border border-sky-200"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>

            {/* Bottom Multi-Campus Status Card */}
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-[10px] space-y-0.5">
              <div className="flex items-center justify-between text-slate-800 font-bold">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-600" />
                  <span>6 Phân Hiệu</span>
                </span>
                <span className="text-[8px] text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded font-bold font-mono">
                  100% Sync
                </span>
              </div>
              <p className="text-[9px] text-slate-500 truncate leading-tight">
                Phố Lu • An Tiến • Sơn Hải • Sơn Hà...
              </p>
            </div>
          </aside>

          {/* Right Main Content Canvas */}
          <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
