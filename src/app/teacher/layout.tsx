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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      {/* ===== Single Unified Top Header ===== */}
      <Header />

      {/* ===== Main Desktop & Responsive Body Layout ===== */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 gap-6">
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

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-modal-pop shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
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
                    const isActive = pathname === item.href || (item.href !== "/teacher/dashboard" && pathname.startsWith(item.href));
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

      {/* Floating AI Assistant Chatbot */}
      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}
