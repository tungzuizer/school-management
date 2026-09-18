"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleClientSignOut } from "@/lib/client-auth";
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

const roleConfig: Record<string, { bg: string; accent: string; mobileAccent: string }> = {
  ADMIN: {
    bg: "bg-blue-600",
    accent: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    mobileAccent: "text-blue-600",
  },
  SUPER_ADMIN: {
    bg: "bg-rose-600",
    accent: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    mobileAccent: "text-rose-600",
  },
  DEPARTMENT_ADMIN: {
    bg: "bg-sky-600",
    accent: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    mobileAccent: "text-sky-600",
  },
  WARD_ADMIN: {
    bg: "bg-teal-600",
    accent: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    mobileAccent: "text-teal-600",
  },
  VICE_PRINCIPAL: {
    bg: "bg-violet-600",
    accent: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    mobileAccent: "text-violet-600",
  },
  TEACHER: {
    bg: "bg-emerald-600",
    accent: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    mobileAccent: "text-emerald-600",
  },
  STUDENT: {
    bg: "bg-indigo-600",
    accent: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    mobileAccent: "text-indigo-600",
  },
};

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  SUPER_ADMIN: "Quản trị viên Hệ thống",
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
        className="hidden md:flex w-64 min-h-screen bg-slate-900 text-white flex-col border-r border-slate-800 shadow-md relative z-20"
      >
        {/* Logo & Brand */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="shrink-0 bg-white/10 p-1.5 rounded-xl border border-white/10 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm tracking-tight truncate text-slate-100">{title}</h2>
              <span className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-md border ${config.accent} font-medium mt-0.5`}>
                {roleLabels[role] || role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar relative">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 relative ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 ${config.bg} rounded-r-sm`} />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Logout */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={() => handleClientSignOut("/login")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors duration-150 cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4 shrink-0" />
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
                  isActive ? `${config.mobileAccent} font-bold` : "text-slate-600 hover:text-slate-900 font-medium"
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
                mobileMenuOpen ? `${config.mobileAccent} font-bold` : "text-slate-600 hover:text-slate-900 font-medium"
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
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
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
                        : "text-slate-700 hover:bg-slate-100"
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
                  onClick={() => handleClientSignOut("/login")}
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
