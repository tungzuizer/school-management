"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import dynamic from "next/dynamic";
const FloatingAIChatWidget = dynamic(
  () => import("@/components/ui/FloatingAIChatWidget").then((mod) => mod.FloatingAIChatWidget),
  { ssr: false }
);
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
  User,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  color: string;
  activeColor: string;
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = session?.user?.name || "Học sinh";
  const drawerRef = useRef<HTMLDivElement>(null);

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

  const navItems: NavItem[] = [
    { label: "Góc Học Tập 360°", href: "/student/dashboard", icon: Home, description: "Tổng quan kết quả & động lực", color: "text-blue-600", activeColor: "bg-blue-600" },
    { label: "Bảng Điểm Môn Học", href: "/student/grades", icon: Award, description: "Chi tiết điểm số các môn", color: "text-violet-600", activeColor: "bg-violet-600" },
    { label: "Học Bạ Điện Tử", href: "/student/transcript", icon: GraduationCap, description: "Học bạ chuẩn Bộ GD&ĐT", color: "text-emerald-600", activeColor: "bg-emerald-600" },
    { label: "Nhật Ký Chuyên Cần", href: "/student/attendance", icon: CalendarCheck, description: "Lịch sử điểm danh", color: "text-rose-600", activeColor: "bg-rose-600" },
    { label: "Thời Khóa Biểu Tuần", href: "/student/schedule", icon: Calendar, description: "Lịch học & giáo viên bộ môn", color: "text-amber-600", activeColor: "bg-amber-600" },
    { label: "Hồ Sơ Cá Nhân", href: "/student/profile", icon: User, description: "Thông tin & đổi mật khẩu", color: "text-slate-600", activeColor: "bg-slate-700" },
  ];

  const bottomTabs = [
    { label: "Trang chủ", href: "/student/dashboard", icon: Home },
    { label: "Bảng điểm", href: "/student/grades", icon: Award },
    { label: "Chuyên cần", href: "/student/attendance", icon: CalendarCheck },
    { label: "Thời khóa biểu", href: "/student/schedule", icon: Calendar },
  ];

  const activeItem = navItems.find(
    (item) => pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href))
  ) || navItems[0];
  const ActiveIcon = activeItem?.icon || Home;

  return (
    <div className="min-h-screen text-blue-950 flex flex-col font-sans" style={{ background: "var(--background)" }}>
      {/* Ambient mesh background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-60 -left-60 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-indigo-300/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 left-1/4 w-[700px] h-[700px] bg-violet-200/15 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-emerald-200/10 rounded-full blur-3xl" />
      </div>

      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      {/* Mobile context strip */}
      <div className="lg:hidden relative z-10 px-4 py-2 flex items-center justify-between bg-white/90 backdrop-blur-lg border-b border-slate-200/70 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-blue-100 text-blue-600 shrink-0 shadow-sm">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Đang xem</span>
            <h2 className="text-xs font-black text-blue-950 truncate mt-0.5">{activeItem?.label}</h2>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
          className="px-3.5 py-2 min-h-[44px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/30 active-press cursor-pointer shrink-0"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>
      </div>

      {/* Main workspace */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-[1680px] mx-auto px-4 sm:px-6 py-4 sm:py-6 gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <div className="sticky top-20 space-y-3">
            {/* Identity card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-blue-500/25">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-800/40 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-base flex items-center justify-center shadow-lg">
                    {getInitials(userName)}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-indigo-600 shadow-sm pulse-dot" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate text-white leading-tight">{userName}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                    Học sinh THPT
                  </span>
                </div>
              </div>
            </div>

            {/* Nav card */}
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-3 shadow-lg shadow-slate-200/60">
              <div className="flex items-center gap-1.5 px-2 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <span>Mục lục học tập</span>
              </div>
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`nav-item-in group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                          : "text-slate-700 hover:bg-slate-100/80 hover:text-blue-950"
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl shrink-0 transition-all ${
                        isActive
                          ? "bg-white/20 text-white"
                          : `bg-slate-100 ${item.color} group-hover:scale-110`
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black truncate block flex-1 ${isActive ? "text-white" : ""}`}>
                        {item.label}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? "text-white/70" : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                      }`} />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 font-black text-xs transition-all active-press cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-lg shadow-slate-200/60 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-3 mb-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-400/20">
          <div className="flex items-stretch justify-around px-2 py-1.5">
            {bottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || (tab.href !== "/student/dashboard" && pathname.startsWith(tab.href));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl relative transition-all duration-200 flex-1 ${
                    isActive ? "text-blue-600 bg-blue-50/80" : "text-slate-500 hover:text-blue-950"
                  }`}
                >
                  {isActive && <span className="absolute top-0 w-6 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-full shadow-sm" />}
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? "stroke-[2.5] scale-110 text-blue-600" : ""}`} />
                  <span className={`text-[10px] mt-0.5 tracking-tight truncate font-bold ${isActive ? "text-blue-700" : ""}`}>{tab.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-slate-500 flex-1 cursor-pointer transition-colors hover:text-blue-700 active-press"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-black text-slate-700 tracking-tight">Menu</span>
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
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mục lục học sinh"
            className="absolute inset-y-0 left-0 w-80 max-w-[88vw] bg-white z-50 flex flex-col shadow-2xl overflow-hidden animate-slide-in-left"
          >
            {/* Drawer header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white flex items-center justify-between shrink-0">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-lg">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black truncate text-white">{userName}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-900 bg-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                    Học sinh THPT
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="relative p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer active-press shrink-0 ml-2"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/60">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 pt-1 pb-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                Mục lục học sinh
              </p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/student/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white border border-slate-200/80 text-blue-950 hover:bg-blue-50/80 hover:border-blue-200 shadow-sm"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? "bg-white/20 text-white" : `bg-slate-100 ${item.color}`}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-black block truncate">{item.label}</span>
                      {item.description && (
                        <span className={`text-[10px] block truncate font-semibold mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                          {item.description}
                        </span>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? "text-white/70" : "text-slate-400"}`} />
                  </Link>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200/80 bg-white shrink-0">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 font-black text-xs transition-all active-press cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingAIChatWidget userRole="STUDENT" />
    </div>
  );
}