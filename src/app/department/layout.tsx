/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js root layout for `/department/*` (`src/app/department/dashboard/page.tsx`, `src/app/department/wards/page.tsx`, `src/app/department/thpt-schools/page.tsx`, `src/app/department/all-schools/page.tsx`, `src/app/department/reports/page.tsx`).
 * 2. Affected APIs: `DepartmentLayout` default export in `src/app/department/layout.tsx`.
 * 3. Schema: `MenuItem` (`label`: string, `href`: string, `icon`: LucideIcon, `badge`?: string, `description`?: string), `MenuGroup` (`id`: string, `code`: string, `title`: string, `tag`: string, `accent`: "sky" | "blue" | "indigo", `icon`: LucideIcon, `items`: MenuItem[]).
 * 4. Verbatim User Instruction: "cho cao lên nữa".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleClientSignOut } from "@/lib/client-auth";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Landmark,
  Building2,
  LogOut,
  School,
  BarChart3,
  Home,
  ChevronDown,
  ChevronRight,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NavTooltip from "@/components/layout/NavTooltip";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { LayoutProvider, useSidebar } from "@/context/LayoutContext";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
};

type MenuGroup = {
  id: string;
  code: string;
  title: string;
  tag: string;
  accent: "sky" | "blue" | "indigo";
  icon: LucideIcon;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    code: "01",
    title: "ĐIỀU HÀNH SỞ GD&ĐT",
    tag: "Tổng quan",
    accent: "sky",
    icon: Home,
    items: [
      { label: "Bảng điều khiển Sở", href: "/department/dashboard", icon: LayoutDashboard, description: "Chỉ số toàn ngành GD&ĐT" },
    ],
  },
  {
    id: "units",
    code: "02",
    title: "QUẢN LÝ ĐƠN VỊ",
    tag: "Đơn vị",
    accent: "blue",
    icon: Building2,
    items: [
      { label: "Phòng GD&ĐT trực thuộc", href: "/department/wards", icon: Landmark, description: "Các Phòng GD Quận/Huyện" },
      { label: "Trường THPT trực thuộc", href: "/department/thpt-schools", icon: School, description: "Hệ thống các trường THPT" },
      { label: "Tất cả trường liên cấp", href: "/department/all-schools", icon: Layers, description: "Mầm non, TH, THCS, THPT" },
    ],
  },
  {
    id: "reports",
    code: "03",
    title: "BÁO CÁO & THỐNG KÊ",
    tag: "Báo cáo",
    accent: "indigo",
    icon: BarChart3,
    items: [
      { label: "Báo cáo tổng hợp ngành", href: "/department/reports", icon: FileSpreadsheet, description: "Số liệu phổ cập & thi đua" },
    ],
  },
];

const tagStyles = {
  sky: "bg-cyan-100/90 text-cyan-800 border-cyan-300/80 font-bold",
  blue: "bg-sky-100/90 text-sky-800 border-sky-300/80 font-bold",
  indigo: "bg-blue-100/90 text-blue-800 border-blue-300/80 font-bold",
};

const codeBadgeStyles = {
  sky: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white border-cyan-400/40 shadow-xs font-black",
  blue: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/40 shadow-xs font-black",
  indigo: "bg-gradient-to-r from-blue-600 to-sky-700 text-white border-blue-400/40 shadow-xs font-black",
};

const miniDotStyles = {
  sky: "bg-cyan-500 shadow-cyan-500/40",
  blue: "bg-sky-500 shadow-sky-500/40",
  indigo: "bg-blue-600 shadow-blue-500/40",
};

const cardAccentStyles = {
  sky: "border-cyan-300/60 hover:border-cyan-400/90 bg-gradient-to-r from-cyan-100/70 via-sky-50/60 to-blue-50/60 hover:from-cyan-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-cyan-500/5",
  blue: "border-sky-300/60 hover:border-sky-400/90 bg-gradient-to-r from-sky-100/70 via-blue-50/60 to-cyan-50/60 hover:from-sky-200/80 hover:to-blue-100/80 backdrop-blur-md shadow-xs shadow-sky-500/5",
  indigo: "border-blue-300/60 hover:border-blue-400/90 bg-gradient-to-r from-blue-100/70 via-sky-50/60 to-cyan-50/60 hover:from-blue-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-blue-500/5",
};

function DepartmentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, closeMobile } = useSidebar();

  const userName = session?.user?.name || "Lãnh đạo Sở GD&ĐT";
  const userEmail = session?.user?.email || "so.gddt@hanoi.edu.vn";

  const currentMatchingGroupId = useMemo(() => {
    for (const group of menuGroups) {
      if (
        group.items.some(
          (item) => pathname === item.href || (item.href !== "/department/dashboard" && pathname.startsWith(item.href))
        )
      ) {
        return group.id;
      }
    }
    return menuGroups[0]?.id || "overview";
  }, [pathname]);

  // Single active accordion state: expanding one group automatically collapses all secondary groups!
  const [activeGroupId, setActiveGroupId] = useState<string | null>(currentMatchingGroupId);

  useEffect(() => {
    if (currentMatchingGroupId) {
      setActiveGroupId(currentMatchingGroupId);
    }
  }, [currentMatchingGroupId]);

  const toggleGroup = (groupId: string) => {
    setActiveGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-slate-50 text-slate-900 font-sans relative">
      {/* ===== Sidebar - Desktop (Collapsible w-72 <-> w-20) Luminous Multi-Tone Crystal Glass Theme ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-sky-100/90 via-sky-50/80 to-blue-100/70 backdrop-blur-2xl text-sky-950 border-r border-sky-200/80 shadow-2xl shadow-sky-950/10 transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Profile Header */}
        <div className="p-3.5 border-b border-sky-200/80 bg-gradient-to-r from-sky-100/80 via-blue-50/70 to-cyan-100/60 shrink-0 backdrop-blur-md">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/30 text-white font-black text-sm ring-2 ring-cyan-300/50"
              title={isCollapsed ? `${userName} - Sở GD&ĐT` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-extrabold text-sky-950 truncate leading-snug">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-200/80 px-1.5 py-0.5 rounded border border-sky-300/80 truncate">
                    Sở GD&ĐT
                  </span>
                  <span className="text-[10px] text-sky-800 font-bold truncate">
                    Cấp Tỉnh/Thành
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar"
        >
          {menuGroups.map((group) => {
            const isExpanded = isCollapsed || activeGroupId === group.id;

            return (
              <div
                key={group.id}
                className={
                  isCollapsed
                    ? "space-y-1 py-1"
                    : `rounded-2xl p-2 border transition-all duration-200 ${cardAccentStyles[group.accent]}`
                }
              >
                {/* Domain Section Header with Accordion Toggle */}
                {isCollapsed ? (
                  <div className="flex justify-center py-1">
                    <span
                      className={`w-2.5 h-1 rounded-full ${miniDotStyles[group.accent]}`}
                      title={group.title}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`group-items-${group.id}`}
                    aria-label={`Thu gọn/mở rộng ${group.title}`}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/70 transition-colors text-left group/hdr cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border shrink-0 ${codeBadgeStyles[group.accent]}`}
                      >
                        {group.code}
                      </span>
                      <span className="text-[11px] font-extrabold text-sky-950 uppercase tracking-wider truncate">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${tagStyles[group.accent]}`}
                      >
                        {group.tag}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-sky-600 group-hover/hdr:text-sky-700 transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-sky-600/70 group-hover/hdr:text-sky-700 transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {/* Section Menu Items (Auto-collapses when another group is opened) */}
                {isExpanded && (
                  <div id={`group-items-${group.id}`} className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/department/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      if (isCollapsed) {
                        return (
                          <div key={item.href} className="relative group">
                            <Link
                              href={item.href}
                              prefetch={true}
                              aria-label={item.label}
                              className={`flex items-center justify-center h-10 w-full rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                                isActive
                                  ? "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-white/40 font-bold"
                                  : "text-sky-900 hover:bg-gradient-to-r hover:from-sky-200/80 hover:to-blue-100/80 hover:text-sky-950"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? "scale-110 text-white" : "text-sky-700 group-hover:scale-110 group-hover:text-sky-950"
                                }`}
                              />
                            </Link>
                            <NavTooltip
                              title={item.label}
                              groupTitle={`${group.code} - ${group.title}`}
                              badge={item.badge}
                              description={item.description}
                              visible={isCollapsed}
                              variant="sky"
                            />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                            isActive
                              ? "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-sky-600/30 ring-1 ring-white/40"
                              : "text-sky-950 hover:bg-gradient-to-r hover:from-sky-200/80 hover:to-blue-100/80 hover:text-sky-950 font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-sky-700 group-hover:text-sky-950"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-sky-200/80 text-sky-800 border border-sky-300/80"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom System Identity & Fast Logout */}
        <div className="p-2.5 border-t border-sky-200/80 bg-gradient-to-r from-sky-100/90 via-blue-100/70 to-sky-50/80 shrink-0 backdrop-blur-md">
          {isCollapsed ? (
            <div className="relative group">
              <button
                type="button"
                onClick={() => handleClientSignOut("/login")}
                aria-label="Đăng xuất"
                className="w-full flex items-center justify-center h-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <NavTooltip title="Đăng xuất" visible={isCollapsed} variant="sky" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleClientSignOut("/login")}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200/60 hover:border-rose-300 bg-white/70 rounded-xl transition font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shadow-2xs"
            >
              <span>Đăng xuất tài khoản</span>
            </button>
          )}
        </div>
      </aside>

      {/* ===== Main Independent Workspace Canvas ===== */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/30 to-blue-50/20 relative">
        {/* Global Unified Header */}
        <Header
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Workspace Subheader with Breadcrumbs */}
        <div className="px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2.5 flex items-center justify-between border-b border-sky-200/60 bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-cyan-50/60 shadow-2xs shrink-0 z-20">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100/90 text-sky-800 border border-sky-200">
              Cổng Quản Lý Cấp Sở GD&ĐT
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileOpen}
          onClose={closeMobile}
          menuGroups={menuGroups}
          role="DEPARTMENT_ADMIN"
          userName={userName}
          userEmail={userEmail}
        />

        {/* Page content independent scrollable canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-32 lg:pb-8">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Floating Glass Bottom Dock ===== */}
        <MobileBottomNav
          role="DEPARTMENT_ADMIN"
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={isMobileOpen}
        />
      </div>
    </div>
  );
}

export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <DepartmentLayoutInner>{children}</DepartmentLayoutInner>
    </LayoutProvider>
  );
}
