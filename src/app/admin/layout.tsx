/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js Root Admin Layout for `/admin/*` (`src/app/admin/dashboard/page.tsx`, `src/app/admin/exam-analytics/page.tsx`, etc.).
 * 2. Uniqueness: Dual-Scroll independent workspace canvas with collapsible sidebar (w-72 <-> w-20), single active accordion auto-collapsing secondary items, and floating tooltips.
 * 3. Schema: `AdminProfile` (`id`, `name`, `email`, `isSuperAdmin`, `schoolName`, `departmentName`), `MenuGroup`, `MenuItem`.
 * 4. Verbatim User Instruction: "tôi muốn màu nó như phần đăng nhập và mỗi tài khoản sẽ 1 sắc thái khác nhua hiệu trưởng giáo viên học sinh".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleClientSignOut } from "@/lib/client-auth";
import { useState, useEffect, useMemo } from "react";
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  BarChart2,
  AlertCircle,
  FileText,
  Bot,
  BookOpen,
  ClipboardList,
  School,
  GraduationCap,
  Calendar,
  Layers,
  Scale,
  UserCheck,
  Users,
  Clock,
  CheckSquare,
  FileSpreadsheet,
  Building2,
  Bell,
  Target,
  ShieldAlert,
  ShieldCheck,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentAdminProfile, AdminProfile } from "./actions";
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
};

type MenuGroup = {
  id: string;
  code: string;
  title: string;
  tag: string;
  accent: "blue" | "emerald" | "indigo" | "sky";
  icon: LucideIcon;
  items: MenuItem[];
};

// Menu Group for Super Admin - 4 Distinct Domain Hubs with Codes & Icons
const superAdminMenuGroups: MenuGroup[] = [
  {
    id: "executive",
    code: "01",
    title: "ĐIỀU HÀNH QUỐC GIA",
    tag: "Thời gian thực",
    accent: "blue",
    icon: Activity,
    items: [
      { label: "Bảng điều khiển", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Điểm thi OLS", href: "/admin/exam-analytics", icon: BarChart2, badge: "OLS" },
      { label: "Radar cảnh báo", href: "/admin/early-warnings", icon: AlertCircle },
      { label: "Báo cáo ngày", href: "/admin/daily-reports", icon: FileText },
      { label: "Chiến lược & KPI", href: "/admin/strategy", icon: Target },
    ],
  },
  {
    id: "academics",
    code: "02",
    title: "TRƯỜNG & CHUYÊN MÔN",
    tag: "Học tập",
    accent: "emerald",
    icon: BookOpen,
    items: [
      { label: "Danh mục trường", href: "/admin/schools", icon: School },
      { label: "Lớp học", href: "/admin/classes", icon: Building2 },
      { label: "Hồ sơ học sinh", href: "/admin/students", icon: GraduationCap },
      { label: "Thời khóa biểu", href: "/admin/schedule", icon: Calendar, badge: "AI" },
      { label: "Kế hoạch bài dạy", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Sổ đầu bài", href: "/admin/journals", icon: ClipboardList },
    ],
  },
  {
    id: "personnel",
    code: "03",
    title: "NHÂN SỰ & NQ 37",
    tag: "NQ 37",
    accent: "indigo",
    icon: Users,
    items: [
      { label: "Định mức NQ 37", href: "/admin/nq37-compliance", icon: Scale, badge: "NQ 37" },
      { label: "Nhân sự 36T", href: "/admin/support-staff", icon: UserCheck },
      { label: "Cán bộ BGH", href: "/admin/principals", icon: ShieldCheck },
      { label: "Đội ngũ giáo viên", href: "/admin/teachers", icon: Users },
    ],
  },
  {
    id: "governance",
    code: "04",
    title: "QUẢN TRỊ & PHÊ DUYỆT",
    tag: "Vận hành",
    accent: "sky",
    icon: ShieldCheck,
    items: [
      { label: "Phê duyệt yêu cầu", href: "/admin/approvals", icon: CheckSquare },
      { label: "Khóa sổ dữ liệu", href: "/admin/data-lock", icon: ShieldCheck },
      { label: "Quản lý học bạ", href: "/admin/transcripts", icon: FileSpreadsheet },
      { label: "Nhật ký kiểm toán", href: "/admin/audit-log", icon: ShieldAlert },
      { label: "Thông báo hệ thống", href: "/admin/notifications", icon: Bell },
    ],
  },
];

// Menu Group for School Principal - 4 Distinct Domain Hubs with Codes & Icons
const principalMenuGroups: MenuGroup[] = [
  {
    id: "executive",
    code: "01",
    title: "ĐIỀU HÀNH NHÀ TRƯỜNG",
    tag: "Thời gian thực",
    accent: "blue",
    icon: Activity,
    items: [
      { label: "Tổng quan BGH", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Điểm thi OLS", href: "/admin/exam-analytics", icon: BarChart2, badge: "Mới" },
      { label: "Radar cảnh báo", href: "/admin/early-warnings", icon: AlertCircle },
      { label: "Báo cáo ngày", href: "/admin/daily-reports", icon: FileText },
      { label: "Trợ lý BGH AI", href: "/admin/principal-ai", icon: Bot },
    ],
  },
  {
    id: "academics",
    code: "02",
    title: "DẠY HỌC & CHUYÊN MÔN",
    tag: "Chuyên môn",
    accent: "emerald",
    icon: BookOpen,
    items: [
      { label: "Kế hoạch bài dạy", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Sổ đầu bài", href: "/admin/journals", icon: ClipboardList },
      { label: "Lớp học", href: "/admin/classes", icon: School },
      { label: "Hồ sơ học sinh", href: "/admin/students", icon: GraduationCap },
      { label: "Thời khóa biểu", href: "/admin/schedule", icon: Calendar, badge: "AI" },
      { label: "Tổ bộ môn", href: "/admin/subject-groups", icon: Layers },
    ],
  },
  {
    id: "personnel",
    code: "03",
    title: "NHÂN SỰ & NQ 37",
    tag: "NQ 37",
    accent: "indigo",
    icon: Users,
    items: [
      { label: "Định mức NQ 37", href: "/admin/nq37-compliance", icon: Scale, badge: "NQ 37" },
      { label: "Nhân sự 36T", href: "/admin/support-staff", icon: UserCheck },
      { label: "Đội ngũ giáo viên", href: "/admin/teachers", icon: Users },
      { label: "Dạy thay khẩn cấp", href: "/admin/substitute-dispatch", icon: Clock },
    ],
  },
  {
    id: "governance",
    code: "04",
    title: "PHÊ DUYỆT & QUẢN TRỊ",
    tag: "Phê duyệt",
    accent: "sky",
    icon: ShieldCheck,
    items: [
      { label: "Duyệt yêu cầu BGH", href: "/admin/approvals", icon: CheckSquare },
      { label: "Khóa sổ dữ liệu", href: "/admin/data-lock", icon: ShieldCheck },
      { label: "Duyệt học bạ", href: "/admin/transcripts", icon: FileSpreadsheet },
      { label: "Cơ sở phân hiệu", href: "/admin/multi-school", icon: Building2 },
      { label: "Thông báo trường", href: "/admin/notifications", icon: Bell },
    ],
  },
];

// Tag badge styles per accent - Luminous Crystal Glass Royal Sky & Multi-Tone Blue Theme
const tagStyles = {
  blue: "bg-sky-100/90 text-sky-800 border-sky-300/80 font-bold",
  emerald: "bg-teal-100/90 text-teal-800 border-teal-300/80 font-bold",
  indigo: "bg-blue-100/90 text-blue-800 border-blue-300/80 font-bold",
  sky: "bg-cyan-100/90 text-cyan-800 border-cyan-300/80 font-bold",
};

// Code badge styles (01, 02, etc.)
const codeBadgeStyles = {
  blue: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-400/40 shadow-xs font-black",
  emerald: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400/40 shadow-xs font-black",
  indigo: "bg-gradient-to-r from-blue-600 to-sky-700 text-white border-blue-400/40 shadow-xs font-black",
  sky: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white border-cyan-400/40 shadow-xs font-black",
};

// Card border highlight per accent - Rich layered multi-tone tinted glass (Not plain white!)
const cardAccentStyles = {
  blue: "border-sky-300/60 hover:border-sky-400/90 bg-gradient-to-r from-sky-100/70 via-blue-50/60 to-cyan-50/60 hover:from-sky-200/80 hover:to-blue-100/80 backdrop-blur-md shadow-xs shadow-sky-500/5",
  emerald: "border-teal-300/60 hover:border-teal-400/90 bg-gradient-to-r from-teal-100/70 via-emerald-50/60 to-cyan-50/60 hover:from-teal-200/80 hover:to-emerald-100/80 backdrop-blur-md shadow-xs shadow-teal-500/5",
  indigo: "border-blue-300/60 hover:border-blue-400/90 bg-gradient-to-r from-blue-100/70 via-sky-50/60 to-cyan-50/60 hover:from-blue-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-blue-500/5",
  sky: "border-cyan-300/60 hover:border-cyan-400/90 bg-gradient-to-r from-cyan-100/70 via-sky-50/60 to-blue-50/60 hover:from-cyan-200/80 hover:to-sky-100/80 backdrop-blur-md shadow-xs shadow-cyan-500/5",
};

// Mini badge accent dot
const miniDotStyles = {
  blue: "bg-sky-500 shadow-sky-500/40",
  emerald: "bg-teal-500 shadow-teal-500/40",
  indigo: "bg-blue-600 shadow-blue-500/40",
  sky: "bg-cyan-500 shadow-cyan-500/40",
};

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const p = await getCurrentAdminProfile();
      if (p) setProfile(p);
    }
    fetchProfile();
  }, [session]);

  const isSuperAdmin =
    profile?.isSuperAdmin ||
    session?.user?.email === "superadmin@school.com" ||
    (session?.user as { role?: string })?.role === "SUPER_ADMIN";

  const menuGroups = useMemo(() => (isSuperAdmin ? superAdminMenuGroups : principalMenuGroups), [isSuperAdmin]);

  // Find initial active group from current route
  const currentMatchingGroupId = useMemo(() => {
    for (const group of menuGroups) {
      if (
        group.items.some(
          (item) => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))
        )
      ) {
        return group.id;
      }
    }
    return menuGroups[0]?.id || "executive";
  }, [pathname, menuGroups]);

  // Single active accordion state: expanding one group automatically collapses all secondary groups!
  const [activeGroupId, setActiveGroupId] = useState<string | null>(currentMatchingGroupId);

  // Synchronize active accordion group when navigating routes
  useEffect(() => {
    if (currentMatchingGroupId) {
      setActiveGroupId(currentMatchingGroupId);
    }
  }, [currentMatchingGroupId]);

  const toggleGroup = (groupId: string) => {
    // If clicking already open group, collapse it; otherwise open it and collapse all other secondary groups!
    setActiveGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const userName = profile?.name || session?.user?.name || (isSuperAdmin ? "Ban Quản Trị Hệ Thống" : "Thầy Đoàn Thái Sơn");
  const schoolDisplay = profile?.schoolName || (isSuperAdmin ? "Hệ thống Toàn quốc" : "THPT Chuyên Trần Phú");

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-gradient-to-br from-sky-50/40 via-slate-50 to-blue-50/30 text-slate-900 font-sans relative">
      {/* ===== Sidebar - Desktop (Collapsible w-72 <-> w-20) Multi-Tone Luminous Crystal Glass Royal Sky Theme ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-sky-100/90 via-sky-50/80 to-blue-100/70 backdrop-blur-2xl text-sky-950 border-r border-sky-200/80 shadow-2xl shadow-sky-900/10 transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Identity Header - Executive Control Deck */}
        <div className="p-3.5 border-b border-sky-200/70 bg-gradient-to-r from-sky-200/60 via-blue-100/50 to-cyan-100/60 shrink-0 backdrop-blur-md">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-sky-500/25 ring-2 ring-sky-400/40"
              title={isCollapsed ? `${userName} - ${isSuperAdmin ? "Quản trị viên" : "BGH"}` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-extrabold text-sky-950 truncate leading-snug">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-extrabold text-sky-900 bg-sky-200/80 px-1.5 py-0.5 rounded border border-sky-300/80 truncate">
                    {isSuperAdmin ? "Quản trị viên" : "Ban Giám Hiệu"}
                  </span>
                  <span className="text-[10px] text-sky-800 font-bold truncate">
                    {schoolDisplay}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu - Domain Hubs with Single-Active Collapsible Accordion */}
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
                {/* Domain Section Header (Clickable Accordion Trigger) */}
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
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/80 transition-colors text-left group/hdr cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Code Prefix Symbol (01, 02, etc.) */}
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

                {/* Section Menu Items (Auto-collapses when another group is active) */}
                {isExpanded && (
                  <div id={`group-items-${group.id}`} className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
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
                            {/* Prefix Icon for each individual item */}
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
              {isSuperAdmin ? "Hệ thống Quản Trị Cấp Cao" : "Ban Giám Hiệu"}
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileOpen}
          onClose={closeMobile}
          menuGroups={menuGroups}
          role={isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
          userName={userName}
          userEmail={session?.user?.email || "admin@school.com"}
        />

        {/* Page content independent scrollable canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-24 lg:pb-8">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Floating Glass Bottom Dock ===== */}
        <MobileBottomNav
          role={isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={isMobileOpen}
        />
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </LayoutProvider>
  );
}
