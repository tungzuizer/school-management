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
  UserPlus,
  Film,
  Award,
  GraduationCap,
  FileCheck,
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
  accentClass: string;
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

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const workspaces: WorkspaceMode[] = [
    {
      id: "overview",
      title: "Trung tâm Điều hành",
      icon: Compass,
      accentClass: "text-indigo-600",
      items: [
        { label: "Bảng điều khiển 360°", href: "/teacher/dashboard", icon: Home, description: "Tổng quan lịch dạy & tác vụ" },
        { label: "Thời khóa biểu giảng dạy", href: "/teacher/schedule", icon: Calendar, description: "Ma trận lịch dạy tuần" },
      ],
    },
    {
      id: "students-manage",
      title: "Quản Lý Học Sinh",
      icon: UserPlus,
      accentClass: "text-purple-600",
      items: [
        { label: "Thêm & Danh sách học sinh", href: "/teacher/students", icon: UserPlus, description: "Thêm mới cá nhân & Excel hàng loạt", badge: "Mới" },
      ],
    },
    {
      id: "cinema-eval",
      title: "Sơ Đồ Cinema & Đánh Giá",
      icon: Film,
      accentClass: "text-rose-600",
      items: [
        { label: "Sơ đồ chỗ ngồi rạp chiếu phim", href: "/teacher/seating-cinema", icon: Film, description: "Đánh giá & cộng điểm theo chỗ ngồi", badge: "Rạp phim" },
        { label: "Cộng điểm & Tuyên dương", href: "/teacher/commendations", icon: Award, description: "Cộng điểm rèn luyện & Phát biểu bài", badge: "Cộng điểm" },
      ],
    },
    {
      id: "homeroom",
      title: "Góc Lớp Chủ Nhiệm",
      icon: Users,
      accentClass: "text-emerald-600",
      items: [
        { label: "Sổ chủ nhiệm", href: "/teacher/homeroom", icon: NotebookPen, description: "Quản lý nếp sống & tổ lớp" },
        { label: "Điểm danh sĩ số", href: "/teacher/attendance", icon: ClipboardCheck, description: "Báo cáo sĩ số hằng ngày" },
        { label: "Học bạ điện tử", href: "/teacher/transcript", icon: GraduationCap, description: "Tổng kết & nộp học bạ" },
        { label: "Báo cáo ngày BGH", href: "/teacher/daily-report", icon: FileCheck, description: "Nộp tổng kết ngày" },
      ],
    },
    {
      id: "teaching",
      title: "Giảng Dạy Bộ Môn",
      icon: BookOpen,
      accentClass: "text-blue-600",
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
            accentClass: "text-amber-600",
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
      accentClass: "text-slate-500",
      items: [
        { label: "Hồ sơ giáo viên", href: "/teacher/profile", icon: User, description: "Thông tin cá nhân & phân công" },
      ],
    },
  ];

  const allItems = workspaces.flatMap((w) => w.items);
  const activeItem = allItems.find(
    (item) => pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href))
  ) || allItems[0];
  const ActiveIcon = activeItem?.icon || Home;

  const bottomTabs = [
    { label: "Tổng quan", href: "/teacher/dashboard", icon: Home },
    { label: "Học sinh", href: "/teacher/students", icon: UserPlus },
    { label: "Sơ đồ Cinema", href: "/teacher/seating-cinema", icon: Film },
    { label: "Điểm danh", href: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "var(--background)" }}>
      {/* Warm ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-48 w-[600px] h-[600px] bg-blue-200/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 w-[500px] h-[500px] bg-violet-200/10 rounded-full blur-3xl" />
      </div>

      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Mobile context strip */}
      <div className="lg:hidden relative z-10 px-4 py-2 flex items-center justify-between bg-white/95 backdrop-blur-lg border-b border-slate-200/70 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0 shadow-sm">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Trang hiện tại</span>
            <h1 className="text-xs font-black text-slate-800 truncate mt-0.5">{activeItem?.label}</h1>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
          className="px-3.5 py-2 min-h-[44px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/30 active-press cursor-pointer shrink-0"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </div>

      {/* Main workspace */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0" aria-label="Điều hướng chính">
          <div className="sticky top-20 space-y-3">
            {/* Identity card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-5 text-white shadow-xl shadow-indigo-800/30">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-base flex items-center justify-center shadow-lg">
                    {getInitials(userName)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-indigo-700 shadow-sm pulse-dot" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate text-white leading-tight">{userName}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    <Zap className="w-2.5 h-2.5 text-indigo-700" />
                    {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
                  </span>
                </div>
              </div>
            </div>

            {/* Grouped nav */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-3 shadow-lg shadow-slate-200/60 space-y-4">
              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-0.5">
                    <div className={`flex items-center gap-1.5 px-2 py-1.5 font-black text-[10px] uppercase tracking-widest ${ws.accentClass}`}>
                      <WsIcon className="w-3.5 h-3.5" />
                      <span>{ws.title}</span>
                    </div>
                    {ws.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          aria-current={isActive ? "page" : undefined}
                          className={`nav-item-in group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                              : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                        >
                          <div className={`p-1.5 rounded-xl shrink-0 transition-all ${
                            isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 group-hover:scale-110"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-black truncate flex-1 ${isActive ? "text-white" : ""}`}>
                            {item.label}
                          </span>
                          {item.badge ? (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-sm shrink-0 animate-badge-pop">
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? "text-white/70" : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500"}`} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  aria-label="Đăng xuất"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-black text-xs transition-all active-press cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-lg shadow-slate-200/60 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav aria-label="Điều hướng di động" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-3 mb-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-400/20">
          <div className="flex items-stretch justify-around px-1 py-1.5">
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || (tab.href !== "/teacher/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-2xl relative transition-all duration-200 flex-1 ${
                    isActive ? "text-indigo-700 bg-indigo-50/80" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {isActive && <span className="absolute top-0 w-6 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-b-full" />}
                  <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? "stroke-[2.5] scale-110 text-indigo-700" : ""}`} style={{ width: "1.125rem", height: "1.125rem" }} />
                  <span className={`text-[9.5px] mt-0.5 tracking-tight truncate font-bold ${isActive ? "text-indigo-700" : ""}`}>{tab.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
              className="flex flex-col items-center justify-center py-2 px-2 rounded-2xl text-slate-500 flex-1 cursor-pointer transition-colors hover:text-indigo-700 active-press"
            >
              <Menu className="w-4 h-4" style={{ width: "1.125rem", height: "1.125rem" }} />
              <span className="text-[9.5px] mt-0.5 font-black text-slate-700 tracking-tight">Menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mục lục giáo viên"
            className="absolute inset-y-0 left-0 w-80 max-w-[88vw] bg-white z-50 flex flex-col shadow-2xl overflow-hidden animate-slide-in-left"
          >
            {/* Drawer header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-lg">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black truncate text-white">{userName}</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    <Zap className="w-2.5 h-2.5 text-indigo-700" />
                    {isSubjectHead ? "Tổ trưởng chuyên môn" : "Giáo viên bộ môn"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu"
                className="relative p-2.5 min-h-[44px] min-w-[44px] rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer active-press shrink-0 ml-2 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                Mục lục chức năng — {allItems.length} mục
              </p>

              {workspaces.map((ws) => {
                const WsIcon = ws.icon;
                return (
                  <div key={ws.id} className="space-y-1.5">
                    <div className={`flex items-center gap-1.5 px-1 font-black text-[11px] uppercase tracking-widest ${ws.accentClass}`}>
                      <WsIcon className="w-3.5 h-3.5" />
                      <span>{ws.title}</span>
                    </div>
                    {ws.items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20"
                              : "bg-white border border-slate-200/80 text-slate-900 hover:bg-slate-50 shadow-sm"
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-black block truncate">{item.label}</span>
                            {item.description && (
                              <span className={`text-[10px] block truncate font-semibold mt-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.badge ? (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shrink-0">
                              {item.badge}
                            </span>
                          ) : (
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white/70" : "text-slate-400"}`} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Đăng xuất"
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-black text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Đăng xuất hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}