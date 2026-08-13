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

const roleConfig: Record<string, { bg: string; accent: string; sidebarBg: string; mobileAccent: string }> = {
  ADMIN: {
    bg: "bg-indigo-600",
    accent: "bg-indigo-500/20 text-indigo-100 border-indigo-400/30",
    sidebarBg: "bg-slate-900",
    mobileAccent: "text-indigo-600",
  },
  TEACHER: {
    bg: "bg-emerald-600",
    accent: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
    sidebarBg: "bg-slate-900",
    mobileAccent: "text-emerald-600",
  },
  STUDENT: {
    bg: "bg-amber-600",
    accent: "bg-amber-500/20 text-amber-100 border-amber-400/30",
    sidebarBg: "bg-slate-900",
    mobileAccent: "text-amber-600",
  },
};

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
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
        className={`hidden md:flex w-64 min-h-screen ${config.sidebarBg} text-white flex-col border-r border-slate-700/50`}
      >
        {/* Logo & Brand */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="shrink-0 bg-white/10 p-1 rounded-xl border border-slate-700/50 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-lg" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base truncate">{title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded border ${config.accent} font-medium`}>
                {roleLabels[role] || role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-150 relative ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 ${config.bg} rounded-r-full`} />
                )}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Logout */}
        <div className="border-t border-slate-700/50 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ==================== MOBILE BOTTOM NAV ==================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {mobileMainItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 min-w-[64px] relative ${
                  isActive ? config.mobileAccent : "text-gray-400"
                }`}
              >
                {isActive && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 ${config.bg} rounded-b-full`} />
                )}
                <Icon className="w-6 h-6" />
                <span className={`text-[11px] mt-1 font-medium leading-tight text-center ${isActive ? "font-bold" : ""}`}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-[64px] ${
                mobileMenuOpen ? config.mobileAccent : "text-gray-400"
              }`}
            >
              <MoreHorizontal className="w-6 h-6" />
              <span className="text-[11px] mt-1 font-medium">Thêm</span>
            </button>
          )}
        </div>
      </nav>

      {/* ==================== MOBILE "MORE" OVERLAY ==================== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel from bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom)] max-h-[70vh] overflow-y-auto">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
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
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? `bg-gray-100 ${config.mobileAccent} font-bold`
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Logout in mobile menu */}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-6 h-6 shrink-0" />
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
