/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js root layout for `/teacher/*` (e.g. `src/app/teacher/dashboard/page.tsx`, `src/app/teacher/students/page.tsx`, `src/app/teacher/seating-cinema/page.tsx`, `src/app/teacher/commendations/page.tsx`, `src/app/teacher/homeroom/page.tsx`, `src/app/teacher/attendance/page.tsx`, `src/app/teacher/transcript/page.tsx`, `src/app/teacher/daily-report/page.tsx`, `src/app/teacher/journal/page.tsx`, `src/app/teacher/lesson-plans/page.tsx`, `src/app/teacher/grades/page.tsx`, `src/app/teacher/subject-head/page.tsx`, `src/app/teacher/profile/page.tsx`).
 * 2. Affected APIs: `TeacherLayout` default export in `src/app/teacher/layout.tsx`.
 * 3. Schema: `NavItem` (`label`: string, `href`: string, `icon`: LucideIcon, `badge`?: string, `description`?: string), `WorkspaceMode` (`id`: string, `code`: string, `title`: string, `tag`: string, `accent`: "indigo" | "emerald" | "blue" | "sky" | "purple", `items`: NavItem[]).
 * 4. Verbatim User Instruction: "update giao diện sáng và dễ nhìn hơn và khi mở thì nhưng cái phụ sẽ thu bé lại".
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
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

const tagStyles = {
  indigo: "bg-indigo-900/80 text-indigo-200 border-indigo-600/60",
  emerald: "bg-emerald-900/80 text-emerald-200 border-emerald-600/60",
  blue: "bg-blue-900/80 text-blue-200 border-blue-600/60",
  sky: "bg-sky-900/80 text-sky-200 border-sky-600/60",
  purple: "bg-purple-900/80 text-purple-200 border-purple-600/60",
};

const codeBadgeStyles = {
  indigo: "bg-indigo-600 text-white border-indigo-400/50 shadow-xs",
  emerald: "bg-emerald-600 text-white border-emerald-400/50 shadow-xs",
  blue: "bg-blue-600 text-white border-blue-400/50 shadow-xs",
  sky: "bg-sky-600 text-white border-sky-400/50 shadow-xs",
  purple: "bg-purple-600 text-white border-purple-400/50 shadow-xs",
};

const miniDotStyles = {
  indigo: "bg-indigo-400 shadow-indigo-500/50",
  emerald: "bg-emerald-400 shadow-emerald-500/50",
  blue: "bg-blue-400 shadow-blue-500/50",
  sky: "bg-sky-400 shadow-sky-500/50",
  purple: "bg-purple-400 shadow-purple-500/50",
};

const cardAccentStyles = {
  indigo: "border-slate-800 hover:border-indigo-700/60 bg-slate-900/80",
  emerald: "border-slate-800 hover:border-emerald-700/60 bg-slate-900/80",
  blue: "border-slate-800 hover:border-blue-700/60 bg-slate-900/80",
  sky: "border-slate-800 hover:border-sky-700/60 bg-slate-900/80",
  purple: "border-slate-800 hover:border-purple-700/60 bg-slate-900/80",
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

  const bottomTabs = [
    { label: "Tổng quan", href: "/teacher/dashboard", icon: Home },
    { label: "Học sinh", href: "/teacher/students", icon: UserPlus },
    { label: "Sơ đồ lớp", href: "/teacher/seating-cinema", icon: LayoutGrid },
    { label: "Điểm danh", href: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-slate-50 text-slate-900 font-sans relative">
      {/* ===== Sidebar - Desktop (Collapsible w-72 <-> w-20) ===== */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#0c1322] text-white border-r border-slate-800 shadow-2xl transition-[width] duration-300 ease-in-out relative z-30 select-none overflow-hidden ${
          isCollapsed ? "w-20" : "w-72"
        }`}
      >
        {/* User Identity Header */}
        <div className="p-3.5 border-b border-slate-800/90 bg-[#080d18] shrink-0">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-600 text-white font-extrabold text-sm shadow-md ring-2 ring-indigo-400/20"
              title={isCollapsed ? `${userName} - ${isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}` : undefined}
            >
              {getInitials(userName)}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-200">
                <p className="text-sm font-bold text-white truncate leading-snug">
                  {userName}
                </p>
                <p className="text-[11px] text-indigo-400 font-semibold truncate">
                  {isSubjectHead ? "Tổ trưởng Chuyên môn" : "Giáo viên Giảng dạy"}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Không gian Sư phạm
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu - Domain Hubs with Single-Active Collapsible Accordion */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar">
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
                    aria-label={`Thu gọn/mở rộng ${ws.title}`}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left group/hdr cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider border shrink-0 ${codeBadgeStyles[ws.accent]}`}
                      >
                        {ws.code}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-100 group-hover/hdr:text-white uppercase tracking-wider truncate">
                        {ws.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase border ${tagStyles[ws.accent]}`}
                      >
                        {ws.tag}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-300 group-hover/hdr:text-white transition-transform" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/hdr:text-white transition-transform" />
                      )}
                    </div>
                  </button>
                )}

                {/* Section Menu Items (Auto-collapses when another group is active) */}
                {isExpanded && (
                  <div className="space-y-0.5 mt-1">
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
                              className={`flex items-center justify-center h-10 w-full rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-bold"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 transition-transform ${
                                  isActive ? "scale-110 text-white" : "text-slate-400 group-hover:scale-110 group-hover:text-indigo-300"
                                }`}
                              />
                            </Link>
                            <NavTooltip
                              title={item.label}
                              groupTitle={`${ws.code} - ${ws.title}`}
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
                              ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-300"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-800 text-indigo-300 border border-slate-700"
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
              {isSubjectHead ? "Tổ Trưởng Chuyên Môn" : "Không Gian Giáo Viên"}
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-600 text-white font-bold text-xs">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{userName}</p>
                    <p className="text-[10px] text-indigo-400 font-semibold truncate">
                      {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
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
                {workspaces.map((ws) => {
                  const isExpanded = activeGroupId === ws.id;

                  return (
                    <div
                      key={ws.id}
                      className={`rounded-2xl p-2 border ${cardAccentStyles[ws.accent]}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(ws.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1 mb-1 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-black border ${codeBadgeStyles[ws.accent]}`}
                          >
                            {ws.code}
                          </span>
                          <p className="text-[10px] font-extrabold text-slate-100 uppercase tracking-widest truncate">
                            {ws.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase border ${tagStyles[ws.accent]}`}
                          >
                            {ws.tag}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-0.5">
                          {ws.items.map((item) => {
                            const isActive =
                              pathname === item.href ||
                              (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                prefetch={true}
                                onClick={closeMobile}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                                  isActive
                                    ? "bg-indigo-600 text-white font-bold"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-300"}`} />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider bg-slate-800 text-indigo-300 font-semibold">
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
            {bottomTabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] relative transition-transform duration-200 active:scale-95 ${
                    isActive
                      ? "text-indigo-600 font-bold border-t-2 border-indigo-600"
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
