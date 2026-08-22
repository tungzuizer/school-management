"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { FloatingAIChatWidget } from "@/components/ui/FloatingAIChatWidget";
import {
  Home,
  Award,
  CalendarCheck,
  Calendar,
  LogOut,
  Menu,
  X,
  Compass,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userName = session?.user?.name || "Học sinh";

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navItems: NavItem[] = [
    { label: "Góc Học Tập 360°", href: "/student/dashboard", icon: Home, description: "Tổng quan kết quả & động lực" },
    { label: "Bảng Điểm Môn Học", href: "/student/grades", icon: Award, description: "Chi tiết điểm số các môn" },
    { label: "Nhật Ký Chuyên Cần", href: "/student/attendance", icon: CalendarCheck, description: "Xem lịch sử điểm danh do Thầy/Cô ghi" },
    { label: "Thời Khóa Biểu Tuần", href: "/student/schedule", icon: Calendar, description: "Lịch học & giáo viên bộ môn" },
  ];

  const activeItem = navItems.find(
    (item) => pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href))
  ) || navItems[0];
  const ActiveIcon = activeItem?.icon || Home;

  const bottomTabs = [
    { label: "Trang chủ", href: "/student/dashboard", icon: Home },
    { label: "Bảng điểm", href: "/student/grades", icon: Award },
    { label: "Chuyên cần", href: "/student/attendance", icon: CalendarCheck },
    { label: "Thời khóa biểu", href: "/student/schedule", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Mobile Top Context Bar */}
      <div className="lg:hidden relative z-10 px-4 py-2.5 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Đang xem</span>
            <h2 className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{activeItem?.label}</h2>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active-press cursor-pointer shrink-0"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Mục lục</span>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-4">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-5 sticky top-20">
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-extrabold text-slate-900 truncate">{userName}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                  Học sinh
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-2 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider mb-2">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <span>Mục lục Học tập</span>
              </div>

              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20"
                        : "bg-slate-50/60 border border-slate-200/50 text-slate-700 hover:bg-blue-50/80 hover:text-blue-900 hover:border-blue-200 hover:translate-x-1"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200 group-hover:text-blue-600"} transition-colors`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold truncate block">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around max-w-md mx-auto px-2 py-1.5">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href || (tab.href !== "/student/dashboard" && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-200 flex-1 ${
                  isActive
                    ? "text-blue-600 font-extrabold bg-blue-50/80"
                    : "text-slate-500 font-medium hover:text-slate-800"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-xs" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5] text-blue-600 scale-110" : ""} transition-transform`} />
                <span className={`text-[10px] mt-0.5 tracking-tight truncate ${isActive ? "font-extrabold text-blue-900" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-500 hover:text-blue-600 font-medium transition-all flex-1 cursor-pointer active-press"
          >
            <Menu className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] mt-0.5 font-bold text-slate-700 tracking-tight">Mục lục</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Sheet ("Mục lục") */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl overflow-hidden animate-modal-pop border-r border-slate-200/80">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white font-extrabold text-sm flex items-center justify-center shrink-0 border border-white/30 shadow-xs">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold truncate text-white">{userName}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                    Học sinh THPT
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  Mục lục Học Sinh
                </span>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-2xl text-xs transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/20"
                          : "bg-white border border-slate-200/80 text-slate-800 hover:bg-blue-50/80 hover:border-blue-200 font-semibold shadow-2xs"
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-extrabold block truncate">{item.label}</span>
                        {item.description && (
                          <span className={`text-[10px] block truncate font-medium mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                            {item.description}
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white/80" : "text-slate-300"}`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all active-press cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot */}
      <FloatingAIChatWidget userRole="STUDENT" />
    </div>
  );
}
