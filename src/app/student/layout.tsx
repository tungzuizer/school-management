/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js root layout for `/student/*` (`src/app/student/dashboard/page.tsx`, `src/app/student/grades/page.tsx`, `src/app/student/transcript/page.tsx`, `src/app/student/attendance/page.tsx`, `src/app/student/schedule/page.tsx`, `src/app/student/profile/page.tsx`).
 * 2. Affected APIs: `StudentLayout` default export in `src/app/student/layout.tsx`.
 * 3. Schema: `MenuItem` (`label`: string, `href`: string, `icon`: LucideIcon, `badge`?: string, `description`?: string), `MenuGroup` (`id`: string, `code`: string, `title`: string, `tag`: string, `accent`: "sapphire" | "sky" | "blue", `items`: MenuItem[]).
 * 4. Verbatim User Instruction: "cho cao lên nữa".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleClientSignOut } from "@/lib/client-auth";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Home,
  GraduationCap,
  CalendarCheck,
  Calendar,
  LogOut,
  User,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Flame,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NavTooltip from "@/components/layout/NavTooltip";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { LayoutProvider, useSidebar } from "@/context/LayoutContext";

const FloatingAIChatWidget = dynamic(
  () => import("@/components/ui/FloatingAIChatWidget").then((mod) => mod.FloatingAIChatWidget),
  { ssr: false }
);

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
  accent: "sapphire" | "sky" | "blue";
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    code: "01",
    title: "HỌC TẬP & KẾT QUẢ",
    tag: "Chính",
    accent: "sapphire",
    items: [
      { label: "Góc học tập", href: "/student/dashboard", icon: Home, description: "Tổng quan kết quả & nhắc nhở" },
      { label: "Bảng điểm chi tiết", href: "/student/grades", icon: FileSpreadsheet, description: "Điểm số các môn học" },
      { label: "Học bạ điện tử", href: "/student/transcript", icon: GraduationCap, description: "Xem tổng kết học bạ" },
    ],
  },
  {
    id: "schedule-attendance",
    code: "02",
    title: "LỊCH TRÌNH & CHUYÊN CẦN",
    tag: "Thời khóa biểu",
    accent: "sky",
    items: [
      { label: "Thời khóa biểu tuần", href: "/student/schedule", icon: Calendar, description: "Lịch học theo tuần" },
      { label: "Nhật ký chuyên cần", href: "/student/attendance", icon: CalendarCheck, description: "Theo dõi điểm danh" },
    ],
  },
  {
    id: "account",
    code: "03",
    title: "TÀI KHOẢN CÁ NHÂN",
    tag: "Hồ sơ",
    accent: "blue",
    items: [
      { label: "Hồ sơ cá nhân", href: "/student/profile", icon: User, description: "Thông tin học sinh" },
    ],
  },
];

// Tag badge styles per accent - Academic Sapphire & Ocean Glass Theme
const tagStyles = {
  sapphire: "bg-blue-100/90 text-blue-900 border-blue-300/80 font-bold",
  sky: "bg-sky-100/90 text-sky-900 border-sky-300/80 font-bold",
  blue: "bg-cyan-100/90 text-cyan-900 border-cyan-300/80 font-bold",
};

const codeBadgeStyles = {
  sapphire: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-400/40 shadow-xs font-black",
  sky: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/40 shadow-xs font-black",
  blue: "bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-cyan-400/40 shadow-xs font-black",
};

const miniDotStyles = {
  sapphire: "bg-blue-600 shadow-blue-500/40",
  sky: "bg-sky-500 shadow-sky-500/40",
  blue: "bg-cyan-600 shadow-cyan-500/40",
};

const cardAccentStyles = {
  sapphire: "border-blue-300/60 hover:border-blue-400/90 bg-gradient-to-r from-blue-100/70 via-sky-50/60 to-indigo-50/60 hover:from-blue-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-blue-500/5",
  sky: "border-sky-300/60 hover:border-sky-400/90 bg-gradient-to-r from-sky-100/70 via-blue-50/60 to-cyan-50/60 hover:from-sky-200/80 hover:to-blue-100/80 backdrop-blur-md shadow-xs shadow-sky-500/5",
  blue: "border-cyan-300/60 hover:border-cyan-400/90 bg-gradient-to-r from-cyan-100/70 via-sky-50/60 to-blue-50/60 hover:from-cyan-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-cyan-500/5",
};

function StudentLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, closeMobile } = useSidebar();

  const userName = session?.user?.name || "Học sinh";
  const userEmail = session?.user?.email || "hocsinh@school.edu.vn";

  const currentMatchingGroupId = useMemo(() => {
    for (const group of menuGroups) {
      if (
        group.items.some(
          (item) => pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href))
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
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-blue-100/90 via-sky-50/80 to-indigo-100/70 backdrop-blur-2xl text-blue-950 border-r border-blue-200/80 shadow-2xl shadow-blue-950/10 transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Profile Header - Student Hub */}
        <div className="p-3.5 border-b border-blue-200/80 bg-gradient-to-r from-blue-100/80 via-sky-50/70 to-indigo-100/60 shrink-0 backdrop-blur-md">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 text-white font-black text-sm ring-2 ring-blue-300/50"
              title={isCollapsed ? `${userName} - Cổng Học Sinh` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-extrabold text-blue-950 truncate leading-snug">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded border border-blue-300/80 truncate flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                    Học sinh
                  </span>
                  <span className="text-[10px] text-blue-800 font-bold truncate">
                    Góc học tập
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Micro Streak Widget */}
          {!isCollapsed && (
            <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-100/90 via-sky-100/70 to-indigo-100/80 border border-blue-300/80 flex items-center justify-between text-xs backdrop-blur-sm">
              <span className="flex items-center gap-1 font-bold text-blue-950 text-[11px]">
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Chuỗi chuyên cần
              </span>
              <span className="font-black text-amber-800 text-[11px] bg-amber-100/90 border border-amber-300/90 px-1.5 py-0.5 rounded-md shadow-2xs">
                🔥 7 Ngày
              </span>
            </div>
          )}
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
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/70 transition-colors text-left group/hdr cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border shrink-0 ${codeBadgeStyles[group.accent]}`}
                      >
                        {group.code}
                      </span>
                      <span className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider truncate">
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
                        <ChevronDown className="w-3.5 h-3.5 text-blue-600 group-hover/hdr:text-blue-700 transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-blue-600/70 group-hover/hdr:text-blue-700 transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {/* Section Menu Items (Single-Active Auto Collapse) */}
                {isExpanded && (
                  <div id={`group-items-${group.id}`} className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      if (isCollapsed) {
                        return (
                          <div key={item.href} className="relative group">
                            <Link
                              href={item.href}
                              prefetch={true}
                              aria-label={item.label}
                              className={`flex items-center justify-center h-10 w-full rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                isActive
                                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-white/40 font-bold"
                                  : "text-blue-900 hover:bg-gradient-to-r hover:from-blue-200/80 hover:to-sky-100/80 hover:text-blue-950"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? "scale-110 text-white" : "text-blue-700 group-hover:scale-110 group-hover:text-blue-950"
                                }`}
                              />
                            </Link>
                            <NavTooltip
                              title={item.label}
                              groupTitle={`${group.code} - ${group.title}`}
                              badge={item.badge}
                              description={item.description}
                              visible={isCollapsed}
                              variant="indigo"
                            />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-white/40"
                              : "text-blue-950 hover:bg-gradient-to-r hover:from-blue-200/80 hover:to-sky-100/80 hover:text-blue-950 font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-blue-700 group-hover:text-blue-950"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-blue-200/80 text-blue-800 border border-blue-300/80"
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
        <div className="p-2.5 border-t border-blue-200/80 bg-gradient-to-r from-blue-100/90 via-sky-100/70 to-indigo-50/80 shrink-0 backdrop-blur-md">
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
              <NavTooltip title="Đăng xuất" visible={isCollapsed} variant="indigo" />
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
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/20 relative">
        {/* Global Unified Header */}
        <Header
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Workspace Subheader with Breadcrumbs */}
        <div className="px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2.5 flex items-center justify-between border-b border-blue-200/60 bg-gradient-to-r from-blue-50/70 via-sky-50/50 to-cyan-50/60 shadow-2xs shrink-0 z-20">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100/90 text-blue-800 border border-blue-200">
              Cổng Thông Tin Học Sinh
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileOpen}
          onClose={closeMobile}
          menuGroups={menuGroups}
          role="STUDENT"
          userName={userName}
          userEmail={userEmail}
        />

        {/* Page content independent scrollable canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-36 lg:pb-8">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Floating Glass Bottom Dock ===== */}
        <MobileBottomNav
          role="STUDENT"
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={isMobileOpen}
        />
      </div>

      <FloatingAIChatWidget userRole="STUDENT" />
    </div>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <StudentLayoutInner>{children}</StudentLayoutInner>
    </LayoutProvider>
  );
}
