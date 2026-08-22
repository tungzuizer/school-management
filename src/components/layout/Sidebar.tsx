"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LogOut,
  GraduationCap,
  LayoutDashboard,
  Building2,
  School,
  UserCog,
  Users,
  BookOpen,
  CalendarDays,
  Bell,
  Globe,
  FileBarChart,
  ClipboardCheck,
  Calculator,
  NotebookPen,
  BarChart3,
  ClipboardList,
  MoreHorizontal,
  X,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Map icon names to actual components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  School,
  UserCog,
  Users,
  BookOpen,
  CalendarDays,
  Bell,
  Globe,
  FileBarChart,
  ClipboardCheck,
  Calculator,
  NotebookPen,
  BarChart3,
  ClipboardList,
};

export interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
  role: string;
  userName?: string;
}

const roleConfig: Record<string, { bg: string; accent: string; sidebarBg: string; mobileAccent: string; activeGlow: string }> = {
  ADMIN: {
    bg: "bg-gradient-to-r from-indigo-500 to-violet-600",
    accent: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
    sidebarBg: "bg-slate-950",
    mobileAccent: "text-indigo-600",
    activeGlow: "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
  },
  TEACHER: {
    bg: "bg-gradient-to-r from-emerald-500 to-teal-600",
    accent: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    sidebarBg: "bg-slate-950",
    mobileAccent: "text-emerald-600",
    activeGlow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
  },
  STUDENT: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-600",
    accent: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    sidebarBg: "bg-slate-950",
    mobileAccent: "text-amber-600",
    activeGlow: "shadow-[0_0_20px_rgba(245,158,11,0.35)]",
  },
};

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
  DEPARTMENT_ADMIN: "Sở GD&ĐT",
  WARD_ADMIN: "Phòng GD&ĐT",
  VICE_PRINCIPAL: "Phó Hiệu trưởng",
};

export default function Sidebar({ items, title, role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = roleConfig[role] || roleConfig.ADMIN;

  // For mobile bottom nav: show first 4 items + "Thêm" button
  const mobileMainItems = items.slice(0, 4);
  const mobileExtraItems = items.slice(4);
  const hasExtras = mobileExtraItems.length > 0;

  return (
    <>
      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside
        className={`hidden md:flex w-64 min-h-screen ${config.sidebarBg} text-white flex-col border-r border-slate-800/80 shadow-2xl relative z-20`}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Logo & Brand */}
        <div className="p-5 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-3.5">
            <div className="shrink-0 bg-white/10 p-1.5 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-xl" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-base tracking-tight truncate text-slate-100">{title}</h2>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${config.accent} font-bold mt-0.5`}>
                <Sparkles className="w-3 h-3 animate-pulse" />
                {roleLabels[role] || role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar relative">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 relative ${
                  isActive
                    ? `bg-white/15 text-white ${config.activeGlow} border border-white/10 backdrop-blur-md`
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:translate-x-1"
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 ${config.bg} rounded-r-full shadow-md`} />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full min-w-[22px] text-center shadow-sm animate-pulse">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Logout */}
        <div className="border-t border-slate-800/80 p-3 relative">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3.5 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all duration-200 active-press cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-rose-400" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ==================== MOBILE BOTTOM NAV ==================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-header border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {mobileMainItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[64px] relative transition-transform duration-200 active:scale-95 ${
                  isActive ? config.mobileAccent : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {isActive && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 ${config.bg} rounded-b-full shadow-sm`} />
                )}
                <Icon className="w-5 h-5" />
                <span className={`text-[11px] mt-1 font-semibold leading-tight text-center ${isActive ? "font-bold" : ""}`}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* "Thêm" button if there are extra items */}
          {hasExtras && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-[64px] transition-transform duration-200 active:scale-95 ${
                mobileMenuOpen ? config.mobileAccent : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[11px] mt-1 font-semibold">Thêm</span>
            </button>
          )}
        </div>
      </nav>

      {/* ==================== MOBILE "MORE" OVERLAY ==================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel from bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)] max-h-[75vh] overflow-y-auto backdrop-blur-xl border-t border-slate-200/80 animate-modal-pop">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Menu chức năng</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* All menu items */}
            <div className="p-3 space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = iconMap[item.icon] || LayoutDashboard;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? `bg-slate-100 ${config.mobileAccent} font-bold shadow-xs`
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Logout in mobile menu */}
              <div className="border-t border-slate-100 mt-2 pt-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for mobile bottom nav so content isn't hidden behind it */}
      <div className="md:hidden h-[72px] shrink-0" />
    </>
  );
}
