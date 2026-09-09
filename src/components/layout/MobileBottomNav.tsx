/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Root Role Layouts (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/student/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/department/layout.tsx`, `src/app/ward/layout.tsx`).
 * 2. Uniqueness: Modern Floating Liquid Glass Dock Mobile Bottom Bar (iPhone Ultra-Pill circular shape with luminous Apple active dot and synchronized role-based accents).
 * 3. Schema: `MobileBottomNavProps` (`role`: string, `onOpenMenu`: () => void, `isMenuOpen`?: boolean).
 * 4. Verbatim User Instruction: "cho cao lên nữa".
 */

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Calendar,
  GraduationCap,
  CheckSquare,
  Calculator,
  BookOpen,
  Building2,
  FileSpreadsheet,
  Landmark,
  School,
  Users,
  Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface MobileBottomNavProps {
  role?: string;
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
}

// Role-based optical theme styles for mobile bottom dock
const roleThemeStyles: Record<
  string,
  {
    activeText: string;
    activeIcon: string;
    activeDot: string;
    menuOpenBtn: string;
    menuOpenText: string;
  }
> = {
  TEACHER: {
    activeText: "text-emerald-300 font-bold",
    activeIcon: "text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    activeDot: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
    menuOpenBtn: "bg-emerald-600 text-white border-emerald-400/70 shadow-[0_0_20px_rgba(5,150,105,0.8)] scale-105",
    menuOpenText: "text-emerald-400",
  },
  STUDENT: {
    activeText: "text-indigo-300 font-bold",
    activeIcon: "text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.6)]",
    activeDot: "bg-indigo-400 shadow-[0_0_6px_#818cf8]",
    menuOpenBtn: "bg-indigo-600 text-white border-indigo-400/70 shadow-[0_0_20px_rgba(99,102,241,0.8)] scale-105",
    menuOpenText: "text-indigo-400",
  },
  DEFAULT: {
    activeText: "text-sky-300 font-bold",
    activeIcon: "text-sky-400 scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]",
    activeDot: "bg-sky-400 shadow-[0_0_6px_#38bdf8]",
    menuOpenBtn: "bg-sky-600 text-white border-sky-400/70 shadow-[0_0_20px_rgba(2,132,199,0.8)] scale-105",
    menuOpenText: "text-sky-400",
  },
};

export default function MobileBottomNav({
  role = "ADMIN",
  onOpenMenu,
  isMenuOpen = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // Role-customized 4 core quick navigation actions synchronized 100% with sidebar menu icons
  const quickItems = useMemo<QuickNavItem[]>(() => {
    switch (role) {
      case "TEACHER":
        return [
          { label: "Tổng quan", href: "/teacher/dashboard", icon: Home },
          { label: "Lịch dạy", href: "/teacher/schedule", icon: Calendar },
          { label: "Sổ điểm", href: "/teacher/grades", icon: Calculator },
          { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
        ];
      case "STUDENT":
        return [
          { label: "Góc học tập", href: "/student/dashboard", icon: Home },
          { label: "Thời khóa biểu", href: "/student/schedule", icon: Calendar },
          { label: "Bảng điểm", href: "/student/grades", icon: FileSpreadsheet },
          { label: "Học bạ", href: "/student/transcript", icon: GraduationCap },
        ];
      case "VICE_PRINCIPAL":
        return [
          { label: "Tổng quan", href: "/vice-principal/dashboard", icon: LayoutDashboard },
          { label: "Lớp học", href: "/vice-principal/classes", icon: School },
          { label: "Học sinh", href: "/vice-principal/students", icon: Users },
          { label: "Giáo án", href: "/vice-principal/lesson-plans", icon: BookOpen },
        ];
      case "DEPARTMENT_ADMIN":
        return [
          { label: "Tổng quan", href: "/department/dashboard", icon: LayoutDashboard },
          { label: "Phòng GD", href: "/department/wards", icon: Landmark },
          { label: "Trường THPT", href: "/department/thpt-schools", icon: School },
          { label: "Báo cáo", href: "/department/reports", icon: FileSpreadsheet },
        ];
      case "WARD_ADMIN":
        return [
          { label: "Tổng quan", href: "/ward/dashboard", icon: LayoutDashboard },
          { label: "Trường học", href: "/ward/schools", icon: School },
          { label: "Báo cáo", href: "/ward/reports", icon: FileSpreadsheet },
          { label: "Cơ sở", href: "/ward/facilities", icon: Building2 },
        ];
      case "ADMIN":
      case "SUPER_ADMIN":
      default:
        return [
          { label: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Lịch TKB", href: "/admin/schedule", icon: Calendar },
          { label: "Học sinh", href: "/admin/students", icon: GraduationCap },
          { label: "Phê duyệt", href: "/admin/approvals", icon: CheckSquare },
        ];
    }
  }, [role]);

  const theme = roleThemeStyles[role] || roleThemeStyles.DEFAULT;

  // Split into 2 left items and 2 right items around central circular Menu button
  const leftItems = quickItems.slice(0, 2);
  const rightItems = quickItems.slice(2, 4);

  return (
    <nav
      aria-label="Điều hướng nhanh di động"
      className="fixed bottom-3.5 inset-x-3 sm:inset-x-6 sm:bottom-5 z-40 lg:hidden max-w-[390px] mx-auto select-none"
    >
      {/* iPhone Liquid Glass Pill Bar */}
      <div className="bg-slate-950/85 backdrop-blur-3xl border border-white/25 shadow-[0_16px_40px_-6px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.35)] rounded-full px-4 py-2.5 flex items-center justify-between gap-1 text-slate-300">
        {/* Left 2 Quick Items */}
        {leftItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              item.href !== "/teacher/dashboard" &&
              item.href !== "/student/dashboard" &&
              item.href !== "/vice-principal/dashboard" &&
              item.href !== "/department/dashboard" &&
              item.href !== "/ward/dashboard" &&
              pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 active:scale-90 relative group ${
                isActive
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5.5 h-5.5 transition-all duration-300 ${
                  isActive
                    ? theme.activeIcon
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span
                className={`text-[11px] mt-1 tracking-tight truncate max-w-[66px] leading-tight transition-colors duration-200 ${
                  isActive ? theme.activeText : "text-slate-400 group-hover:text-slate-200 font-medium"
                }`}
              >
                {item.label}
              </span>
              {/* Luminous Apple Active Dot Indicator */}
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full absolute -bottom-0.5 ${theme.activeDot}`} />
              )}
            </Link>
          );
        })}

        {/* Center Circular Liquid Glass Orb Menu Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={isMenuOpen ? "Đóng danh mục tính năng" : "Mở danh mục tính năng"}
          aria-expanded={isMenuOpen}
          className="flex-1 flex flex-col items-center justify-center -my-4.5 py-0.5 px-0.5 transition-all duration-200 active:scale-90 cursor-pointer group relative"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border ${
              isMenuOpen
                ? theme.menuOpenBtn
                : "bg-slate-900/90 backdrop-blur-2xl text-slate-200 border-white/35 shadow-[0_10px_24px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Menu
              className={`w-5.5 h-5.5 transition-transform duration-300 ${
                isMenuOpen ? "rotate-90 text-white" : "group-hover:scale-110"
              }`}
            />
          </div>
          <span
            className={`text-[11px] mt-1 font-extrabold tracking-tight transition-colors duration-200 ${
              isMenuOpen ? theme.menuOpenText : "text-slate-300"
            }`}
          >
            Menu
          </span>
        </button>

        {/* Right 2 Quick Items */}
        {rightItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              item.href !== "/teacher/dashboard" &&
              item.href !== "/student/dashboard" &&
              item.href !== "/vice-principal/dashboard" &&
              item.href !== "/department/dashboard" &&
              item.href !== "/ward/dashboard" &&
              pathname.startsWith(item.href + "/"));
          const Icon = item.icon;

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              prefetch={true}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 active:scale-90 relative group ${
                isActive
                  ? "text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`w-5.5 h-5.5 transition-all duration-300 ${
                  isActive
                    ? theme.activeIcon
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span
                className={`text-[11px] mt-1 tracking-tight truncate max-w-[66px] leading-tight transition-colors duration-200 ${
                  isActive ? theme.activeText : "text-slate-400 group-hover:text-slate-200 font-medium"
                }`}
              >
                {item.label}
              </span>
              {/* Luminous Apple Active Dot Indicator */}
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full absolute -bottom-0.5 ${theme.activeDot}`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
