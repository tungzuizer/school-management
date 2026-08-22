"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { checkIsSubjectHead } from "./subject-head/actions";
import { FloatingAIChatWidget } from "@/components/ui/FloatingAIChatWidget";
import Header from "@/components/layout/Header";
import {
  Home,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  User,
  Sparkles,
  ClipboardCheck,
  NotebookPen,
  FileSpreadsheet,
  Calculator,
  CheckSquare,
  LogOut,
  Menu,
  X,
  Compass,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
};

type WorkspaceMode = {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: string;
  items: NavItem[];
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubjectHead, setIsSubjectHead] = useState(false);
  const userName = session?.user?.name || "Giáo viên";
  const userEmail = session?.user?.email || "";

  useEffect(() => {
    checkIsSubjectHead()
      .then((res) => setIsSubjectHead(res.isSubjectHead))
      .catch(() => setIsSubjectHead(false));
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const workspaces: WorkspaceMode[] = [
    {
      id: "overview",
      title: "Trung tâm Điều hành",
      icon: Compass,
      gradient: "from-blue-600 to-indigo-600",
      items: [
        { label: "Bảng điều khiển 360°", href: "/teacher/dashboard", icon: Home, description: "Tổng quan lịch dạy & tác vụ" },
        { label: "Thời khóa biểu giảng dạy", href: "/teacher/schedule", icon: Calendar, description: "Ma trận lịch dạy tuần" },
      ],
    },
    {
      id: "homeroom",
      title: "Góc Lớp Chủ Nhiệm",
      icon: Users,
      gradient: "from-emerald-600 to-teal-600",
      items: [
        { label: "Sổ chủ nhiệm", href: "/teacher/homeroom", icon: NotebookPen, description: "Quản lý nếp sống & thi đua" },
        { label: "Điểm danh học sinh", href: "/teacher/attendance", icon: ClipboardCheck, description: "Báo cáo sĩ số hằng ngày" },
        { label: "Báo cáo ngày BGH", href: "/teacher/daily-report", icon: Sparkles, description: "Nộp tổng kết ngày" },
      ],
    },
    {
      id: "teaching",
      title: "Giảng Dạy Bộ Môn",
      icon: BookOpen,
      gradient: "from-indigo-600 to-purple-600",
      items: [
        { label: "Sổ đầu bài điện tử", href: "/teacher/journal", icon: FileSpreadsheet, description: "Ghi tiết dạy & điểm danh tiết" },
        { label: "Giáo án & Bài dạy AI", href: "/teacher/lesson-plans", icon: BookOpen, description: "Kế hoạch bài dạy AI" },
        { label: "Sổ nhập điểm", href: "/teacher/grades", icon: Calculator, description: "Nhập & tổng kết điểm" },
      ],
    },
    ...(isSubjectHead
      ? [
          {
            id: "subject-head",
            title: "Tổ Chuyên Môn",
            icon: UserCheck,
            gradient: "from-amber-500 to-orange-600",
            items: [
              { label: "Duyệt giáo án Tổ CM", href: "/teacher/subject-head", icon: CheckSquare, badge: "Cần duyệt", description: "Phê duyệt bài dạy giáo viên" },
            ],
          } as WorkspaceMode,
        ]
      : []),
    {
      id: "account",
      title: "Hồ Sơ Cá Nhân",
      icon: User,
      gradient: "from-slate-700 to-slate-800",
      items: [
        { label: "Hồ sơ giáo viên", href: "/teacher/profile", icon: User, description: "Thông tin cá nhân & phân công" },
      ],
    },
  ];

  // Find active item for mobile header context
  const allItems = workspaces.flatMap((w) => w.items);
  const activeItem = allItems.find(
    (item) => pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href))
  ) || allItems[0];
  const ActiveIcon = activeItem?.icon || Home;

  // Bottom Nav Bar items
  const bottomTabs = [
    { label: "Tổng quan", href: "/teacher/dashboard", icon: Home },
    { label: "Lịch dạy", href: "/teacher/schedule", icon: Calendar },
    { label: "Điểm danh", href: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
    { label: "Nhập điểm", href: "/teacher/grades", icon: Calculator },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      {/* ===== Single Unified Top Header ===== */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Mobile Top Quick Context Bar */}
      <div className="lg:hidden relative z-10 px-4 py-2.5 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Trang hiện tại</span>
            <h2 className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{activeItem?.label}</h2>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active-press cursor-pointer shrink-0"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Mục lục</span>
        </button>
      </div>

      {/* ===== Main Desktop & Responsive Body Layout ===== */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-5 sticky top-20">
            {/* Teacher Identity Badge */}
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-extrabold text-slate-900 truncate">{userName}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 mt-0.5">
                  <Zap className="w-2.5 h-2.5 text-indigo-600" />
                  {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
                </span>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-4">
              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-2 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                      <WsIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{ws.title}</span>
                    </div>

                    <div className="space-y-1">
                      {ws.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                              isActive
                                ? "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/20"
                                : "bg-slate-50/60 border border-slate-200/50 text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-900 hover:border-indigo-200 hover:translate-x-1"
                            }`}
                          >
                            <div className={`p-1.5 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200 group-hover:text-indigo-600"} transition-colors`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold truncate block">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs animate-pulse">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Logout Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xs pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ===== Mobile Bottom Navigation Bar ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around max-w-md mx-auto px-2 py-1.5">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/teacher/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-200 flex-1 ${
                  isActive
                    ? "text-indigo-600 font-extrabold bg-indigo-50/80"
                    : "text-slate-500 font-medium hover:text-slate-800"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full shadow-xs" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5] text-indigo-600 scale-110" : ""} transition-transform`} />
                <span className={`text-[10px] mt-0.5 tracking-tight truncate ${isActive ? "font-extrabold text-indigo-900" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-500 hover:text-indigo-600 font-medium transition-all flex-1 cursor-pointer active-press"
          >
            <Menu className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] mt-0.5 font-bold text-slate-700 tracking-tight">Mục lục</span>
          </button>
        </div>
      </nav>

      {/* ===== Mobile Menu Drawer ("Mục lục" Full Slide-Over Sheet) ===== */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Left Slide-out Sheet Panel */}
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl overflow-hidden animate-modal-pop border-r border-slate-200/80">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-sm flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold truncate text-white">{userName}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-2xs">
                    <Zap className="w-2.5 h-2.5 text-indigo-600" />
                    {isSubjectHead ? "Tổ trưởng chuyên môn" : "Giáo viên bộ môn"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active-press shrink-0 ml-2"
                title="Đóng mục lục"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Menu Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-slate-50/50">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  Mục lục Chức Năng
                </span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {allItems.length} mục
                </span>
              </div>

              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                      <WsIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{ws.title}</span>
                    </div>

                    <div className="space-y-1.5">
                      {ws.items.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-2xl text-xs transition-all duration-200 ${
                              isActive
                                ? "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/20"
                                : "bg-white border border-slate-200/80 text-slate-800 hover:bg-indigo-50/80 hover:border-indigo-200 font-semibold shadow-2xs"
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-extrabold block truncate">{item.label}</span>
                              {item.description && (
                                <span className={`text-[10px] block truncate font-medium mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge ? (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs animate-pulse shrink-0">
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white/80" : "text-slate-300"}`} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all active-press cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Assistant Chatbot */}
      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}
