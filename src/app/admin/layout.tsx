/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js Root Admin Layout for `/admin/*` (`src/app/admin/dashboard/page.tsx`, `src/app/admin/tt15-evaluation/page.tsx`, etc.).
 * 2. Uniqueness: Dual-Scroll independent workspace canvas with collapsible sidebar (w-72 <-> w-20), single active accordion auto-collapsing secondary items, and floating tooltips.
 * 3. Schema: `AdminProfile` (`id`, `name`, `email`, `isSuperAdmin`, `schoolName`, `departmentName`), `MenuGroup`, `MenuItem`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn nhưng superadmin là quản lý toàn bộ web chứ không phải mỗi ninh bình bạn hiểu không là là tất cả mọi thứ ý".
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
  Globe,
  Trophy,
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

// Menu Group for Super Admin - Global Platform Root (Toàn Bộ Nền Tảng Website)
const superAdminMenuGroups: MenuGroup[] = [
  {
    id: "executive",
    code: "01",
    title: "ĐIỀU HÀNH NỀN TẢNG",
    tag: "Toàn Nền Tảng",
    accent: "blue",
    icon: Activity,
    items: [
      { label: "Bảng chỉ huy Toàn nền tảng", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Giám sát KPI Toàn Mạng Lưới", href: "/admin/kpi/principal-dashboard", icon: Target, badge: "KPI" },
      { label: "Bảng vàng Thi đua Nề nếp", href: "/admin/emulation", icon: Trophy, badge: "Thi Đua" },
      { label: "Radar cảnh báo rủi ro AI", href: "/admin/early-warnings", icon: AlertCircle, badge: "AI" },
      { label: "Điểm thi & Hành trình OLS", href: "/admin/exam-analytics", icon: BarChart2, badge: "AI OLS" },
      { label: "Báo cáo điều hành tổng hợp", href: "/admin/daily-reports", icon: FileText },
      { label: "Chiến lược & Mục tiêu KPI", href: "/admin/strategy", icon: Target },
      { label: "Đánh giá chuẩn TT 15/2026", href: "/admin/tt15-evaluation", icon: Target, badge: "TT 15" },
    ],
  },
  {
    id: "regional_schools",
    code: "02",
    title: "MẠNG LƯỚI & ĐA ĐƠN VỊ",
    tag: "Toàn Mạng Lưới",
    accent: "emerald",
    icon: School,
    items: [
      { label: "Quản lý Tỉnh & Khu vực", href: "/admin/wards", icon: Building2 },
      { label: "Mạng lưới Tất cả Trường", href: "/admin/schools", icon: School },
      { label: "Cơ sở & Phân hiệu trực thuộc", href: "/admin/campuses", icon: Building2 },
      { label: "Cơ cấu Lớp học toàn hệ thống", href: "/admin/classes", icon: Layers },
      { label: "Hồ sơ Học sinh toàn nền tảng", href: "/admin/students", icon: GraduationCap },
      { label: "Thời khóa biểu & Lịch dạy", href: "/admin/schedule", icon: Calendar, badge: "AI" },
      { label: "Kế hoạch bài dạy (Giáo án)", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Sổ đầu bài & Tiến độ dạy", href: "/admin/journals", icon: ClipboardList },
    ],
  },
  {
    id: "users_matrix",
    code: "03",
    title: "TÀI KHOẢN & MA TRẬN QUYỀN",
    tag: "Identity & RBAC",
    accent: "indigo",
    icon: Users,
    items: [
      { label: "Tổng kho Tài khoản (@gmail.com)", href: "/admin/users-manager", icon: ShieldCheck, badge: "VIP" },
      { label: "Ma trận Phân quyền & Scope", href: "/admin/role-scopes", icon: ShieldAlert },
      { label: "Ban Giám Hiệu các Trường", href: "/admin/principals", icon: UserCheck },
      { label: "Đội ngũ Giáo viên toàn hệ thống", href: "/admin/teachers", icon: Users },
      { label: "Định mức & Biên chế NQ 37", href: "/admin/nq37-compliance", icon: Scale, badge: "NQ 37" },
      { label: "Nhân sự hỗ trợ 36T", href: "/admin/support-staff", icon: UserCheck },
    ],
  },
  {
    id: "governance",
    code: "04",
    title: "LÕI HỆ THỐNG & BẢO MẬT",
    tag: "Hạ Tầng Lõi",
    accent: "sky",
    icon: ShieldCheck,
    items: [
      { label: "Trung tâm Phê duyệt Cấp cao", href: "/admin/approvals", icon: CheckSquare },
      { label: "Danh mục & Quản lý KPI", href: "/admin/kpi", icon: ClipboardList },
      { label: "Khóa sổ dữ liệu & Cổng thi", href: "/admin/data-lock", icon: ShieldCheck },
      { label: "Học bạ số & CSDL Quốc gia", href: "/admin/transcripts", icon: FileSpreadsheet },
      { label: "Thiết bị số & Cơ sở vật chất", href: "/admin/equipment", icon: Building2 },
      { label: "Nhật ký kiểm toán & Bảo mật", href: "/admin/audit-log", icon: ShieldAlert },
      { label: "Thông báo & Chỉ đạo toàn website", href: "/admin/notifications", icon: Bell },
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
      { label: "Giám sát KPI Điểm Trường", href: "/admin/kpi/principal-dashboard", icon: Target, badge: "KPI" },
      { label: "Bảng vàng Thi đua Nề nếp", href: "/admin/emulation", icon: Trophy, badge: "Thi Đua" },
      { label: "Điểm thi & Hành trình OLS", href: "/admin/exam-analytics", icon: BarChart2, badge: "AI OLS" },
      { label: "Radar cảnh báo", href: "/admin/early-warnings", icon: AlertCircle },
      { label: "Báo cáo ngày", href: "/admin/daily-reports", icon: FileText },
      { label: "Đánh giá TT 15", href: "/admin/tt15-evaluation", icon: Target, badge: "TT 15" },
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
      { label: "Tài khoản trường", href: "/admin/users-manager", icon: ShieldCheck, badge: "VIP" },
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
      { label: "Danh mục & Phê duyệt KPI", href: "/admin/kpi", icon: ClipboardList },
      { label: "Chiến lược & Mục tiêu KPI", href: "/admin/strategy", icon: Target },
      { label: "Khóa sổ dữ liệu", href: "/admin/data-lock", icon: ShieldCheck },
      { label: "Duyệt học bạ", href: "/admin/transcripts", icon: FileSpreadsheet },
      { label: "Cơ sở & Phân hiệu", href: "/admin/campuses", icon: Building2 },
      { label: "Thiết bị số & CSVC", href: "/admin/equipment", icon: Building2 },
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
    session?.user?.email === "superadmin@gmail.com" ||
    session?.user?.email === "superadmin.vietnam@gmail.com" ||
    session?.user?.email === "superadmin.ninhbinh@gmail.com" ||
    session?.user?.email === "superadmin.demo@gmail.com" ||
    session?.user?.email === "superadmin@school.com" ||
    session?.user?.email?.includes("superadmin") ||
    (session?.user as { role?: string })?.role === "SUPER_ADMIN" ||
    (session?.user as { role?: string })?.role === "DEPARTMENT_ADMIN";

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

  const userName = profile?.name || session?.user?.name || (isSuperAdmin ? "Ban Quản Trị Toàn Quốc" : "Ban Giám Hiệu");
  const schoolDisplay = profile?.schoolName || (isSuperAdmin ? "Hệ thống Giáo Dục Toàn Quốc" : "Trường trực thuộc");

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
                    {isSuperAdmin ? "Quản Trị Toàn Nền Tảng" : "Ban Giám Hiệu"}
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
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-36 lg:pb-8">
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
