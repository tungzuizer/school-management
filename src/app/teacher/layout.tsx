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
  activeBg: string;
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
      activeBg: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20",
      items: [
        { label: "Bảng điều khiển 360°", href: "/teacher/dashboard", icon: Home, description: "Tổng quan lịch dạy & tác vụ" },
      ],
    },
    {
      id: "homeroom",
      title: "Góc Lớp Chủ Nhiệm",
      icon: Users,
      gradient: "from-emerald-600 to-teal-600",
      activeBg: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20",
      items: [
        { label: "Sổ chủ nhiệm", href: "/teacher/homeroom", icon: NotebookPen, description: "Quản lý nếp sống & thi đua" },
        { label: "Điểm danh học sinh", href: "/teacher/attendance", icon: ClipboardCheck, description: "Báo cáo sĩ số hằng ngày" },
        { label: "Báo cáo ngày BGH", href: "/teacher/daily-report", icon: Sparkles, description: "Nộp tổng kết ngày" },
      ],
    },
    {
      id: "teaching",
      title: "Góc Giảng Dạy Bộ Môn",
      icon: BookOpen,
      gradient: "from-indigo-600 to-purple-600",
      activeBg: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20",
      items: [
        { label: "Sổ đầu bài điện tử", href: "/teacher/journal", icon: FileSpreadsheet, description: "Ghi tiết dạy & điểm danh tiết" },
        { label: "Giáo án & Bài dạy", href: "/teacher/lesson-plans", icon: BookOpen, description: "Kế hoạch bài dạy AI" },
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
            activeBg: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20",
            items: [
              { label: "Duyệt giáo án Tổ CM", href: "/teacher/subject-head", icon: CheckSquare, badge: "Cần duyệt", description: "Phê duyệt bài dạy giáo viên" },
            ],
          } as WorkspaceMode,
        ]
      : []),
    {
      id: "account",
      title: "Hồ Sơ & Cá Nhân",
      icon: User,
      gradient: "from-slate-700 to-slate-800",
      activeBg: "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-md",
      items: [
        { label: "Hồ sơ giáo viên", href: "/teacher/profile", icon: User, description: "Thông tin cá nhân & phân công" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Soft Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl" />
      </div>

      {/* ===== Top Header Bar ===== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
          {/* Logo & Teacher Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-2 ring-white transition-transform duration-300 hover:scale-105">
              <span className="text-sm font-extrabold text-white">{getInitials(userName)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">{userName}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[180px] sm:max-w-xs">{userEmail || "Hệ thống Quản lý Giáo dục"}</p>
            </div>
          </div>

          {/* Center Quick Switch Tabs for Desktop */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs">
            {workspaces.map((ws) => {
              const isActive = ws.items.some(
                (item) => pathname === item.href || pathname.startsWith(item.href + "/")
              );
              const WsIcon = ws.icon;
              const firstHref = ws.items[0]?.href || "/teacher/dashboard";

              return (
                <Link
                  key={ws.id}
                  href={firstHref}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                    isActive
                      ? ws.activeBg
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  <WsIcon className="w-3.5 h-3.5" />
                  <span>{ws.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Header Integration */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <Header />
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active-press"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main Bright Content Area ===== */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigator */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 shadow-sm space-y-5">
            {workspaces.map((ws) => {
              const WsIcon = ws.icon;
              return (
                <div key={ws.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                    <WsIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{ws.title}</span>
                  </div>
                  <div className="space-y-1">
                    {ws.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`group flex items-start gap-3 p-3 rounded-2xl transition-all duration-200 ${
                            isActive
                              ? `${ws.activeBg} font-bold border border-white/20`
                              : "bg-slate-50/80 border border-slate-200/60 text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-900 hover:border-indigo-200 hover:translate-x-1"
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200 group-hover:text-indigo-600 group-hover:border-indigo-200"} transition-colors`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">{item.label}</span>
                              {item.badge && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className={`text-[10px] leading-tight truncate mt-0.5 ${isActive ? "text-white/90 font-normal" : "text-slate-500"}`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Logout Action */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất hệ thống</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Main Page Workspace Area ===== */}
        <main className="flex-1 min-w-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-modal-pop shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {getInitials(userName)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{userName}</h3>
                  <p className="text-[10px] text-indigo-600 font-semibold">{isSubjectHead ? "Tổ trưởng chuyên môn" : "Giáo viên"}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {workspaces.map((ws) => (
              <div key={ws.id} className="space-y-2">
                <p className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">{ws.title}</p>
                <div className="space-y-1.5">
                  {ws.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot */}
      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}
