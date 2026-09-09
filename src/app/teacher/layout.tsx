/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js root layout for `/teacher/*` (e.g. `src/app/teacher/dashboard/page.tsx`, `src/app/teacher/students/page.tsx`, `src/app/teacher/seating-cinema/page.tsx`, `src/app/teacher/commendations/page.tsx`, `src/app/teacher/homeroom/page.tsx`, `src/app/teacher/attendance/page.tsx`, `src/app/teacher/transcript/page.tsx`, `src/app/teacher/daily-report/page.tsx`, `src/app/teacher/journal/page.tsx`, `src/app/teacher/lesson-plans/page.tsx`, `src/app/teacher/grades/page.tsx`, `src/app/teacher/subject-head/page.tsx`, `src/app/teacher/profile/page.tsx`).
 * 2. Affected APIs: `TeacherLayout` default export in `src/app/teacher/layout.tsx`.
 * 3. Schema: `NavItem` (`label`: string, `href`: string, `icon`: LucideIcon, `badge`?: string, `description`?: string), `WorkspaceMode` (`id`: string, `code`: string, `title`: string, `tag`: string, `accent`: "indigo" | "emerald" | "blue" | "sky" | "purple", `items`: NavItem[]).
 * 4. Verbatim User Instruction: "tôi muốn màu nó như phần đăng nhập và mỗi tài khoản sẽ 1 sắc thái khác nhua hiệu trưởng giáo viên học sinh".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleClientSignOut } from "@/lib/client-auth";
import { useState, useEffect, useMemo } from "react";
import {
  Home,
  Calendar,
  BookOpen,
  User,
  ClipboardCheck,
  NotebookPen,
  FileSpreadsheet,
  Calculator,
  CheckSquare,
  LogOut,
  UserPlus,
  LayoutGrid,
  GraduationCap,
  FileCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { checkIsSubjectHead } from "./subject-head/actions";
import { FloatingAIChatWidget } from "@/components/ui/FloatingAIChatWidget";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import NavTooltip from "@/components/layout/NavTooltip";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { LayoutProvider, useSidebar } from "@/context/LayoutContext";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
};

type WorkspaceMode = {
  id: string;
  code: string;
  title: string;
  tag: string;
  accent: "indigo" | "emerald" | "blue" | "sky" | "purple";
  items: NavItem[];
};

// Tag badge styles per accent - Luminous Multi-Tone Crystal Glass Emerald Botanic & Teal Theme
const tagStyles = {
  indigo: "bg-teal-100/90 text-teal-800 border-teal-300/80 font-bold",
  emerald: "bg-emerald-100/90 text-emerald-800 border-emerald-300/80 font-bold",
  blue: "bg-teal-100/90 text-teal-800 border-teal-300/80 font-bold",
  sky: "bg-cyan-100/90 text-cyan-800 border-cyan-300/80 font-bold",
  purple: "bg-emerald-100/90 text-emerald-800 border-emerald-300/80 font-bold",
};

const codeBadgeStyles = {
  indigo: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400/40 shadow-xs font-black",
  emerald: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/40 shadow-xs font-black",
  blue: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-teal-400/40 shadow-xs font-black",
  sky: "bg-gradient-to-r from-cyan-500 to-teal-600 text-white border-cyan-400/40 shadow-xs font-black",
  purple: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/40 shadow-xs font-black",
};

const miniDotStyles = {
  indigo: "bg-teal-500 shadow-teal-500/40",
  emerald: "bg-emerald-500 shadow-emerald-500/40",
  blue: "bg-teal-500 shadow-teal-500/40",
  sky: "bg-cyan-500 shadow-cyan-500/40",
  purple: "bg-emerald-500 shadow-emerald-500/40",
};

const cardAccentStyles = {
  indigo: "border-teal-300/60 hover:border-teal-400/90 bg-gradient-to-r from-teal-100/70 via-emerald-50/60 to-cyan-50/60 hover:from-teal-200/80 hover:to-emerald-100/80 backdrop-blur-md shadow-xs shadow-teal-500/5",
  emerald: "border-emerald-300/60 hover:border-emerald-400/90 bg-gradient-to-r from-emerald-100/70 via-teal-50/60 to-mint-50/60 hover:from-emerald-200/80 hover:to-teal-100/80 backdrop-blur-md shadow-xs shadow-emerald-500/5",
  blue: "border-teal-300/60 hover:border-teal-400/90 bg-gradient-to-r from-teal-100/70 via-cyan-50/60 to-emerald-50/60 hover:from-teal-200/80 hover:to-cyan-100/80 backdrop-blur-md shadow-xs shadow-teal-500/5",
  sky: "border-cyan-300/60 hover:border-cyan-400/90 bg-gradient-to-r from-cyan-100/70 via-teal-50/60 to-emerald-50/60 hover:from-cyan-200/80 hover:to-teal-100/80 backdrop-blur-md shadow-xs shadow-cyan-500/5",
  purple: "border-emerald-300/60 hover:border-emerald-400/90 bg-gradient-to-r from-emerald-100/70 via-teal-50/60 to-cyan-50/60 hover:from-emerald-200/80 hover:to-teal-100/80 backdrop-blur-md shadow-xs shadow-emerald-500/5",
};

function TeacherLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen, closeMobile } = useSidebar();
  const [isSubjectHead, setIsSubjectHead] = useState(false);
  const userName = session?.user?.name || "Thầy Cô Giáo Viên";

  useEffect(() => {
    checkIsSubjectHead()
      .then((res) => setIsSubjectHead(res.isSubjectHead))
      .catch(() => setIsSubjectHead(false));
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const workspaces: WorkspaceMode[] = useMemo(() => [
    {
      id: "overview",
      code: "01",
      title: "ĐIỀU HÀNH GIẢNG DẠY",
      tag: "Tổng quan",
      accent: "indigo",
      items: [
        { label: "Bảng điều khiển 360°", href: "/teacher/dashboard", icon: Home, description: "Tổng quan lịch dạy & tác vụ" },
        { label: "Thời khóa biểu tuần", href: "/teacher/schedule", icon: Calendar, description: "Ma trận lịch dạy tuần" },
      ],
    },
    {
      id: "students-manage",
      code: "02",
      title: "QUẢN LÝ HỌC SINH",
      tag: "Học sinh",
      accent: "purple",
      items: [
        { label: "Danh sách học sinh", href: "/teacher/students", icon: UserPlus, description: "Thêm mới & danh sách lớp", badge: "Mới" },
        { label: "Sơ đồ chỗ ngồi lớp", href: "/teacher/seating-cinema", icon: LayoutGrid, description: "Xếp vị trí chỗ ngồi trực quan", badge: "Trực quan" },
        { label: "Cộng điểm rèn luyện", href: "/teacher/commendations", icon: FileCheck, description: "Cộng điểm & phát biểu" },
      ],
    },
    {
      id: "homeroom",
      code: "03",
      title: "LỚP CHỦ NHIỆM",
      tag: "Chủ nhiệm",
      accent: "emerald",
      items: [
        { label: "Sổ chủ nhiệm", href: "/teacher/homeroom", icon: NotebookPen, description: "Quản lý nếp sống & tổ lớp" },
        { label: "Điểm danh sĩ số", href: "/teacher/attendance", icon: ClipboardCheck, description: "Báo cáo sĩ số hằng ngày" },
        { label: "Học bạ điện tử", href: "/teacher/transcript", icon: GraduationCap, description: "Tổng kết & nộp học bạ" },
        { label: "Báo cáo ngày BGH", href: "/teacher/daily-report", icon: FileCheck, description: "Nộp tổng kết ngày" },
      ],
    },
    {
      id: "teaching",
      code: "04",
      title: "GIẢNG DẠY BỘ MÔN",
      tag: "Bộ môn",
      accent: "blue",
      items: [
        { label: "Sổ đầu bài điện tử", href: "/teacher/journal", icon: FileSpreadsheet, description: "Ghi tiết dạy & điểm danh" },
        { label: "Giáo án & Bài dạy AI", href: "/teacher/lesson-plans", icon: BookOpen, description: "Kế hoạch bài dạy AI" },
        { label: "Sổ nhập điểm", href: "/teacher/grades", icon: Calculator, description: "Nhập & tổng kết điểm" },
      ],
    },
    ...(isSubjectHead
      ? [
          {
            id: "subject-head",
            code: "05",
            title: "TỔ CHUYÊN MÔN",
            tag: "Tổ trưởng",
            accent: "sky" as const,
            items: [
              { label: "Duyệt giáo án Tổ CM", href: "/teacher/subject-head", icon: CheckSquare, badge: "Cần duyệt", description: "Phê duyệt bài dạy giáo viên" },
            ],
          },
        ]
      : []),
    {
      id: "account",
      code: isSubjectHead ? "06" : "05",
      title: "HỒ SƠ CÁ NHÂN",
      tag: "Tài khoản",
      accent: "indigo",
      items: [
        { label: "Hồ sơ giáo viên", href: "/teacher/profile", icon: User, description: "Thông tin cá nhân & phân công" },
      ],
    },
  ], [isSubjectHead]);

  // Find initial active group from current route
  const currentMatchingGroupId = useMemo(() => {
    for (const group of workspaces) {
      if (
        group.items.some(
          (item) => pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href))
        )
      ) {
        return group.id;
      }
    }
    return workspaces[0]?.id || "overview";
  }, [pathname, workspaces]);

  // Single active accordion state: expanding one group automatically collapses all secondary groups!
  const [activeGroupId, setActiveGroupId] = useState<string | null>(currentMatchingGroupId);

  // Synchronize active accordion group when navigating routes
  useEffect(() => {
    if (currentMatchingGroupId) {
      setActiveGroupId(currentMatchingGroupId);
    }
  }, [currentMatchingGroupId]);

  const toggleGroup = (groupId: string) => {
    setActiveGroupId((prev) => (prev === groupId ? null : groupId));
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-slate-50 text-slate-900 font-sans relative">
      {/* ===== Sidebar - Desktop (Collapsible w-72 <-> w-20) Luminous Multi-Tone Crystal Glass Theme ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-gradient-to-b from-teal-100/90 via-emerald-50/80 to-teal-100/70 backdrop-blur-2xl text-emerald-950 border-r border-teal-200/80 shadow-2xl shadow-emerald-950/10 transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Identity Header - Teacher Productivity Hub */}
        <div className="p-3.5 border-b border-teal-200/80 bg-gradient-to-r from-teal-100/80 via-emerald-50/70 to-teal-100/60 shrink-0 backdrop-blur-md">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white font-black text-sm shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300/50"
              title={isCollapsed ? `${userName} - ${isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-extrabold text-emerald-950 truncate leading-snug">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-200/80 px-1.5 py-0.5 rounded border border-teal-300/80 truncate">
                    {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên BM"}
                  </span>
                  <span className="text-[10px] text-teal-800 font-bold truncate">
                    Không gian Sư phạm
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
          {workspaces.map((ws) => {
            const isExpanded = isCollapsed || activeGroupId === ws.id;

            return (
              <div
                key={ws.id}
                className={
                  isCollapsed
                    ? "space-y-1 py-1"
                    : `rounded-2xl p-2 border transition-all duration-200 ${cardAccentStyles[ws.accent]}`
                }
              >
                {/* Domain Section Header (Clickable Accordion Trigger) */}
                {isCollapsed ? (
                  <div className="flex justify-center py-1">
                    <span
                      className={`w-2.5 h-1 rounded-full ${miniDotStyles[ws.accent]}`}
                      title={ws.title}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(ws.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`group-items-${ws.id}`}
                    aria-label={`Thu gọn/mở rộng ${ws.title}`}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-white/70 transition-colors text-left group/hdr cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider border shrink-0 ${codeBadgeStyles[ws.accent]}`}
                      >
                        {ws.code}
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider truncate">
                        {ws.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${tagStyles[ws.accent]}`}
                      >
                        {ws.tag}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-emerald-600 group-hover/hdr:text-emerald-700 transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-teal-600/70 group-hover/hdr:text-emerald-700 transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {/* Section Menu Items (Auto-collapses when another group is active) */}
                {isExpanded && (
                  <div id={`group-items-${ws.id}`} className="space-y-0.5 mt-1">
                    {ws.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;

                      if (isCollapsed) {
                        return (
                          <div key={item.href} className="relative group">
                            <Link
                              href={item.href}
                              prefetch={true}
                              aria-label={item.label}
                              className={`flex items-center justify-center h-10 w-full rounded-xl text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                                isActive
                                  ? "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-white/40 font-bold"
                                  : "text-emerald-900 hover:bg-gradient-to-r hover:from-teal-200/80 hover:to-emerald-100/80 hover:text-emerald-950"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? "scale-110 text-white" : "text-teal-700 group-hover:scale-110 group-hover:text-emerald-950"
                                }`}
                              />
                            </Link>
                            <NavTooltip
                              title={item.label}
                              groupTitle={`${ws.code} - ${ws.title}`}
                              badge={item.badge}
                              description={item.description}
                              visible={isCollapsed}
                              variant="emerald"
                            />
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                            isActive
                              ? "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-1 ring-white/40"
                              : "text-emerald-950 hover:bg-gradient-to-r hover:from-teal-200/80 hover:to-emerald-100/80 hover:text-emerald-950 font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-teal-700 group-hover:text-emerald-950"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-teal-200/80 text-teal-800 border border-teal-300/80"
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
        <div className="p-2.5 border-t border-teal-200/80 bg-gradient-to-r from-teal-100/90 via-emerald-100/70 to-teal-50/80 shrink-0 backdrop-blur-md">
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
              <NavTooltip title="Đăng xuất" visible={isCollapsed} variant="emerald" />
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
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 relative">
        {/* Global Unified Header */}
        <Header
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapsed}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />

        {/* Workspace Subheader with Breadcrumbs */}
        <div className="px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2.5 flex items-center justify-between border-b border-teal-200/60 bg-gradient-to-r from-teal-50/70 via-emerald-50/50 to-cyan-50/60 shadow-2xs shrink-0 z-20">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-100/90 text-teal-800 border border-teal-200">
              {isSubjectHead ? "Tổ Trưởng Chuyên Môn" : "Không Gian Giáo Viên"}
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          isOpen={isMobileOpen}
          onClose={closeMobile}
          menuGroups={workspaces}
          role="TEACHER"
          userName={userName}
          userEmail={session?.user?.email || "teacher@school.edu.vn"}
        />

        {/* Page content independent scrollable canvas */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2.5 sm:p-4 md:p-6 pb-24 lg:pb-8">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Floating Glass Bottom Dock ===== */}
        <MobileBottomNav
          role="TEACHER"
          onOpenMenu={() => setMobileOpen(true)}
          isMenuOpen={isMobileOpen}
        />

        {/* Floating AI Teacher Assistant */}
        <FloatingAIChatWidget />
      </div>
    </div>
  );
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <TeacherLayoutInner>{children}</TeacherLayoutInner>
    </LayoutProvider>
  );
}
