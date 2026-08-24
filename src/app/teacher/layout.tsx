"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
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
  const drawerRef = useRef<HTMLDivElement>(null);

  const userName = session?.user?.name || "Giáo viên";

  useEffect(() => {
    checkIsSubjectHead()
      .then((res) => setIsSubjectHead(res.isSubjectHead))
      .catch(() => setIsSubjectHead(false));
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

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
      gradient: "from-blue-700 to-purple-600",
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans ">
      {/* Background Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-100/40 rounded-full blur-2xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-100/40 rounded-full blur-2xl" />
      </div>

      {/* Unified Top Header */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Mobile Top Quick Context Bar */}
      <div className="lg:hidden relative z-10 px-4 py-2.5 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-50/80 border border-indigo-200 text-indigo-900 shrink-0">
            <ActiveIcon className="w-4 h-4 text-indigo-800" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block leading-none">Trang hiện tại</span>
            <h1 className="text-xs font-black text-slate-800 truncate mt-0.5">{activeItem?.label}</h1>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở mục lục menu chức năng"
          className="px-3.5 py-2 min-h-[44px] bg-indigo-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs active-press cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4 text-white" aria-hidden="true" />
          <span>Mục lục</span>
        </button>
      </div>

      {/* Main Desktop & Responsive Body Layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-4" aria-label="Thanh điều hướng chính">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 shadow-2xs space-y-5 sticky top-20">
            {/* Teacher Identity Badge */}
            <div className="p-3.5 bg-blue-50/80 border border-indigo-200 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs shrink-0">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 truncate">{userName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded-full border border-indigo-200 mt-0.5">
                  <Zap className="w-2.5 h-2.5 text-indigo-700" aria-hidden="true" />
                  {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
                </span>
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="space-y-4" aria-label="Danh mục công việc giáo viên">
              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-2 text-indigo-900 font-black text-[10px] uppercase tracking-wider">
                      <WsIcon className="w-3.5 h-3.5 text-indigo-700" aria-hidden="true" />
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
                            aria-current={isActive ? "page" : undefined}
                            className={`group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-2xl transition-all duration-200 ${
                              isActive
                                ? "bg-indigo-600 text-white font-black shadow-xs"
                                : "bg-slate-50 border border-slate-200/80 text-slate-800 font-extrabold hover:bg-slate-100 hover:text-blue-950 hover:border-blue-200"
                            }`}
                          >
                            <div className={`p-1.5 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-blue-50/80 text-indigo-800 border border-indigo-100 group-hover:text-indigo-900"} transition-colors`}>
                              <Icon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs truncate block">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
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
            </nav>

            {/* Logout Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Đăng xuất khỏi hệ thống"
                className="w-full flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-extrabold text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-2xs pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ergonomic Touch Targets ≥44px) */}
      <nav aria-label="Thanh điều hướng nhanh di động" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around max-w-md mx-auto px-2 py-1">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/teacher/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] min-w-[44px] rounded-2xl relative transition-all duration-200 flex-1 ${
                  isActive
                    ? "text-indigo-700 font-black bg-blue-50/80"
                    : "text-slate-700 font-bold hover:text-slate-800"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full shadow-2xs" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5] text-indigo-700 scale-105" : ""} transition-transform`} aria-hidden="true" />
                <span className={`text-[10px] mt-0.5 tracking-tight truncate ${isActive ? "font-black text-slate-800" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở mục lục danh mục di động"
            className="flex flex-col items-center justify-center py-1.5 px-2.5 min-h-[44px] min-w-[44px] rounded-2xl text-slate-700 hover:text-indigo-700 font-bold transition-all flex-1 cursor-pointer active-press"
          >
            <Menu className="w-5 h-5 text-slate-800" aria-hidden="true" />
            <span className="text-[10px] mt-0.5 font-extrabold text-slate-800 tracking-tight">Mục lục</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer Sheet ("Mục lục" Accessible Dialog) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Left Slide-out Sheet Panel */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mục lục chức năng giáo viên"
            className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl overflow-hidden animate-modal-pop border-r border-slate-200/90"
          >
            {/* Drawer Header */}
            <div className="bg-indigo-700 p-5 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 text-white font-black text-sm flex items-center justify-center shrink-0 border border-white/30 shadow-2xs">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black truncate text-white">{userName}</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-800 bg-white px-2 py-0.5 rounded-full mt-1 shadow-2xs">
                    <Zap className="w-2.5 h-2.5 text-indigo-700" aria-hidden="true" />
                    {isSubjectHead ? "Tổ trưởng chuyên môn" : "Giáo viên bộ môn"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng mục lục điều hướng"
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active-press shrink-0 ml-2 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" aria-hidden="true" />
              </button>
            </div>

            {/* Drawer Menu Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-slate-50/50">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/80">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-700" aria-hidden="true" />
                  Mục lục Chức Năng
                </span>
                <span className="text-[10px] font-extrabold text-blue-950 bg-blue-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
                  {allItems.length} mục
                </span>
              </div>

              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-2">
                    <div className="flex items-center gap-1.5 px-1 text-slate-800 font-black text-[11px] uppercase tracking-wider">
                      <WsIcon className="w-3.5 h-3.5 text-indigo-700" aria-hidden="true" />
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
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-center gap-3 p-3 min-h-[44px] rounded-2xl text-xs transition-all duration-200 ${
                              isActive
                                ? "bg-indigo-600 text-white font-black shadow-xs"
                                : "bg-white border border-slate-200/80 text-slate-900 hover:bg-slate-100 hover:text-blue-950 font-bold shadow-2xs"
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-blue-50/80 text-indigo-800 border border-indigo-100"}`}>
                              <Icon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-black block truncate">{item.label}</span>
                              {item.description && (
                                <span className={`text-[10px] block truncate font-semibold mt-0.5 ${isActive ? "text-indigo-100" : "text-indigo-900"}`}>
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge ? (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs shrink-0">
                                {item.badge}
                              </span>
                            ) : (
                              <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white/80" : "text-slate-500"}`} aria-hidden="true" />
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
                aria-label="Đăng xuất khỏi hệ thống"
                className="w-full flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-extrabold text-xs transition-all active-press cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" aria-hidden="true" />
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