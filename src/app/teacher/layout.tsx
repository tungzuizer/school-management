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
  Award,
  CalendarDays,
  Layers,
  ChevronRight,
  ShieldCheck,
  Bot,
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

  // Define workspaces
  const workspaces: WorkspaceMode[] = [
    {
      id: "overview",
      title: "Trung tâm Điều hành",
      icon: Compass,
      gradient: "from-blue-600 via-indigo-600 to-violet-600",
      items: [
        { label: "Bảng điều khiển 360°", href: "/teacher/dashboard", icon: Home, description: "Tổng quan lịch dạy & tác vụ" },
      ],
    },
    {
      id: "homeroom",
      title: "Góc Lớp Chủ Nhiệm",
      icon: Users,
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
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
      gradient: "from-indigo-600 via-purple-600 to-pink-600",
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
            gradient: "from-amber-600 via-orange-600 to-red-600",
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
      gradient: "from-slate-700 to-slate-900",
      items: [
        { label: "Hồ sơ giáo viên", href: "/teacher/profile", icon: User, description: "Thông tin cá nhân & phân công" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Light Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* ===== Top Futuristic Header & Workspace Bar ===== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
          {/* Logo & Teacher Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-white/10 transition-transform duration-300 hover:scale-105">
              <span className="text-sm font-extrabold text-white">{getInitials(userName)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight">{userName}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                  {isSubjectHead ? "Tổ trưởng CM" : "Giáo viên"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-xs">{userEmail || "Hệ thống Quản lý Giáo dục"}</p>
            </div>
          </div>

          {/* Center Quick Switch Tabs for Desktop */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${ws.gradient} text-white shadow-md shadow-indigo-950/50 scale-102`
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
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
            {/* Global Header Wrapper for search & easy mode */}
            <div className="hidden md:block">
              <Header />
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition active-press"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main Dynamic Teacher Layout ===== */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigator */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 shadow-2xl space-y-5">
            {workspaces.map((ws) => {
              const WsIcon = ws.icon;
              return (
                <div key={ws.id} className="space-y-2">
                  <div className="flex items-center gap-2 px-2 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
                    <WsIcon className="w-3.5 h-3.5 text-emerald-400" />
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
                              ? `bg-gradient-to-r ${ws.gradient} text-white shadow-xl shadow-indigo-950/60 font-bold border border-white/10`
                              : "bg-slate-950/40 border border-slate-800/50 text-slate-300 hover:bg-slate-800/80 hover:text-white hover:translate-x-1"
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700"} transition-colors`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">{item.label}</span>
                              {item.badge && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-2xs animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className={`text-[10px] leading-tight truncate mt-0.5 ${isActive ? "text-white/80 font-normal" : "text-slate-400"}`}>
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
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-bold text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất hệ thống</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Main Page Workspace Area ===== */}
        <main className="flex-1 min-w-0 bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-modal-pop shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-white text-xs">
                  {getInitials(userName)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{userName}</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">{isSubjectHead ? "Tổ trưởng chuyên môn" : "Giáo viên"}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {workspaces.map((ws) => (
              <div key={ws.id} className="space-y-2">
                <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">{ws.title}</p>
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
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                            : "bg-slate-950/60 text-slate-300 hover:bg-slate-800"
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

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 text-rose-400 font-bold text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot for Teachers */}
      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}
