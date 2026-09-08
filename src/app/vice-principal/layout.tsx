/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js root layout for `/vice-principal/*` (`src/app/vice-principal/dashboard/page.tsx`, `src/app/vice-principal/classes/page.tsx`, `src/app/vice-principal/students/page.tsx`, `src/app/vice-principal/attendance/page.tsx`, `src/app/vice-principal/journals/page.tsx`, `src/app/vice-principal/lesson-plans/page.tsx`, `src/app/vice-principal/warnings/page.tsx`).
 * 2. Affected APIs: `VicePrincipalLayout` default export in `src/app/vice-principal/layout.tsx`.
 * 3. Schema: `MenuItem` (`label`: string, `href`: string, `icon`: LucideIcon, `badge`?: string, `description`?: string), `MenuGroup` (`id`: string, `code`: string, `title`: string, `tag`: string, `accent`: "teal" | "emerald" | "sky", `icon`: LucideIcon, `items`: MenuItem[]).
 * 4. Verbatim User Instruction: "update giao diện sáng và dễ nhìn hơn và khi mở thì nhưng cái phụ sẽ thu bé lại".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  FileBarChart,
  LogOut,
  AlertTriangle,
  Home,
  ClipboardCheck,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NavTooltip from "@/components/layout/NavTooltip";
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
  accent: "teal" | "emerald" | "sky";
  icon: LucideIcon;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    id: "overview",
    code: "01",
    title: "TỔNG QUAN PHÂN HIỆU",
    tag: "Tổng quan",
    accent: "teal",
    icon: Home,
    items: [
      { label: "Bảng điều khiển", href: "/vice-principal/dashboard", icon: LayoutDashboard, description: "Tổng quan hoạt động cơ sở" },
    ],
  },
  {
    id: "management",
    code: "02",
    title: "QUẢN LÝ PHÂN HIỆU",
    tag: "Phân hiệu",
    accent: "emerald",
    icon: Building2,
    items: [
      { label: "Lớp học phụ trách", href: "/vice-principal/classes", icon: School, description: "Danh sách lớp học cơ sở" },
      { label: "Hồ sơ học sinh", href: "/vice-principal/students", icon: Users, description: "Danh sách & hồ sơ học sinh" },
      { label: "Quản lý điểm danh", href: "/vice-principal/attendance", icon: ClipboardCheck, description: "Báo cáo chuyên cần cơ sở" },
    ],
  },
  {
    id: "academics",
    code: "03",
    title: "CHUYÊN MÔN & HỒ SƠ",
    tag: "Chuyên môn",
    accent: "sky",
    icon: FileBarChart,
    items: [
      { label: "Theo dõi Sổ đầu bài", href: "/vice-principal/journals", icon: FileBarChart, description: "Tiến độ giảng dạy các lớp" },
      { label: "Duyệt giáo án điện tử", href: "/vice-principal/lesson-plans", icon: BookOpen, description: "Phê duyệt kế hoạch bài dạy" },
      { label: "Cảnh báo học tập", href: "/vice-principal/warnings", icon: AlertTriangle, description: "Cảnh báo nề nếp & học lực" },
    ],
  },
];

const tagStyles = {
  teal: "bg-teal-900/80 text-teal-200 border-teal-600/60",
  emerald: "bg-emerald-900/80 text-emerald-200 border-emerald-600/60",
  sky: "bg-sky-900/80 text-sky-200 border-sky-600/60",
};

const codeBadgeStyles = {
  teal: "bg-teal-600 text-white border-teal-400/50 shadow-xs",
  emerald: "bg-emerald-600 text-white border-emerald-400/50 shadow-xs",
  sky: "bg-sky-600 text-white border-sky-400/50 shadow-xs",
};

const miniDotStyles = {
  teal: "bg-teal-400 shadow-teal-500/50",
  emerald: "bg-emerald-400 shadow-emerald-500/50",
  sky: "bg-sky-400 shadow-sky-500/50",
};

const cardAccentStyles = {
  teal: "border-slate-800 hover:border-teal-700/60 bg-slate-900/80",
  emerald: "border-slate-800 hover:border-emerald-700/60 bg-slate-900/80",
  sky: "border-slate-800 hover:border-sky-700/60 bg-slate-900/80",
};

const mobileMainTabs = [
  { label: "Tổng quan", href: "/vice-principal/dashboard", icon: Home },
  { label: "Lớp học", href: "/vice-principal/classes", icon: School },
  { label: "Giáo án", href: "/vice-principal/lesson-plans", icon: BookOpen },
  { label: "Sổ đầu bài", href: "/vice-principal/journals", icon: FileBarChart },
];

function VicePrincipalLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, closeMobile } = useSidebar();

  const userName = session?.user?.name || "Ban Giám hiệu - Phó HT";
  const userEmail = session?.user?.email || "pho.hieutruong@school.edu.vn";

  const currentMatchingGroupId = useMemo(() => {
    for (const group of menuGroups) {
      if (
        group.items.some(
          (item) => pathname === item.href || (item.href !== "/vice-principal/dashboard" && pathname.startsWith(item.href))
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
      {/* ===== Sidebar - Desktop (Collapsible w-72 <-> w-20) ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0c1322] text-white border-r border-slate-800 shadow-2xl transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Profile Header */}
        <div className="p-3.5 border-b border-slate-800/90 bg-[#080d18] shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-md text-white font-extrabold text-sm ring-2 ring-teal-400/20"
              title={isCollapsed ? `${userName} - Phó Hiệu Trưởng` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-bold text-white truncate leading-snug">
                  {userName}
                </p>
                <p className="text-[11px] text-teal-400 font-semibold truncate">
                  Phó Hiệu Trưởng
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar">
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
                    aria-label={`Thu gọn/mở rộng ${group.title}`}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group/hdr cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider border shrink-0 ${codeBadgeStyles[group.accent]}`}
                      >
                        {group.code}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-100 uppercase tracking-wider truncate group-hover/hdr:text-white">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase border ${tagStyles[group.accent]}`}
                      >
                        {group.tag}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-teal-300 group-hover/hdr:text-white transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/hdr:text-white transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {/* Section Menu Items (Auto-collapses when another group is opened) */}
                {isExpanded && (
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/vice-principal/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      if (isCollapsed) {
                        return (
                          <div key={item.href} className="relative group">
                            <Link
                              href={item.href}
                              prefetch={true}
                              aria-label={item.label}
                              className={`flex items-center justify-center h-10 w-full rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/40 font-bold"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? "scale-110 text-white" : "text-slate-400 group-hover:scale-110 group-hover:text-teal-300"
                                }`}
                              />
                            </Link>
                            <NavTooltip
                              title={item.label}
                              groupTitle={`${group.code} - ${group.title}`}
                              badge={item.badge}
                              description={item.description}
                              visible={isCollapsed}
                            />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                            isActive
                              ? "bg-teal-600 text-white font-bold shadow-md shadow-teal-900/40"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-slate-400 group-hover:text-teal-300"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-800 text-teal-300 border border-slate-700"
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

        {/* Bottom Logout */}
        <div className="p-2.5 border-t border-slate-800/90 bg-[#080d18] shrink-0">
          {isCollapsed ? (
            <div className="relative group">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Đăng xuất"
                className="w-full flex items-center justify-center h-10 text-rose-400 hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <NavTooltip title="Đăng xuất" visible={isCollapsed} />
            </div>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 rounded-xl transition font-semibold cursor-pointer"
            >
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* ===== Main Independent Workspace Canvas ===== */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        {/* Global Unified Header */}
        <Header
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Workspace Subheader with Breadcrumbs */}
        <div className="px-4 md:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 bg-white shadow-2xs shrink-0 z-20">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
              Cổng Ban Giám Hiệu
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
              onClick={closeMobile}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-[#0c1322] border-r border-slate-800 z-50 lg:hidden flex flex-col shadow-2xl text-white">
              {/* Drawer header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d18]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-600 text-white font-bold text-xs">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{userName}</p>
                    <p className="text-[10px] text-teal-400 font-semibold truncate">
                      Phó Hiệu Trưởng
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMobile}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Đóng
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-3 custom-scrollbar">
                {menuGroups.map((group) => {
                  const isExpanded = activeGroupId === group.id;

                  return (
                    <div
                      key={group.id}
                      className={`rounded-2xl p-2 border ${cardAccentStyles[group.accent]}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1 mb-1 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-black border ${codeBadgeStyles[group.accent]}`}
                          >
                            {group.code}
                          </span>
                          <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-widest truncate">
                            {group.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase border ${tagStyles[group.accent]}`}
                          >
                            {group.tag}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-teal-300" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-0.5">
                          {group.items.map((item) => {
                            const isActive =
                              pathname === item.href ||
                              (item.href !== "/vice-principal/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                onClick={closeMobile}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                                  isActive
                                    ? "bg-teal-600 text-white font-bold"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-teal-300"}`} />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider bg-slate-800 text-teal-300 font-semibold">
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

              {/* Drawer footer */}
              <div className="p-3 border-t border-slate-800 bg-[#080d18]">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 rounded-xl transition font-semibold cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page content independent scrollable canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24 lg:pb-8">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Bottom Tab Bar ===== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-sm">
          <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
            {mobileMainTabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] relative transition-transform duration-200 active:scale-95 ${
                    isActive
                      ? "text-teal-600 font-bold border-t-2 border-teal-600"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] leading-tight">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] text-slate-600 hover:text-slate-900 font-medium transition-transform duration-200 active:scale-95 cursor-pointer"
            >
              <span className="text-[10px] leading-tight">Mục lục</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function VicePrincipalLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <VicePrincipalLayoutInner>{children}</VicePrincipalLayoutInner>
    </LayoutProvider>
  );
}
