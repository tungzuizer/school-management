"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  CalendarDays,
  NotebookPen,
  LogOut,
  User,
  BookOpen,
  FileSpreadsheet,
  ClipboardCheck,
  Calculator,
  FileBarChart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Home,
  Users,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type MenuGroup = {
  title: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Tổng quan",
    icon: Home,
    color: "text-gray-400",
    items: [
      { label: "Hôm nay", href: "/teacher/dashboard", icon: CalendarDays },
    ],
  },
  {
    title: "GVCN - Giáo viên chủ nhiệm",
    icon: Users,
    color: "text-emerald-400",
    items: [
      { label: "Sổ chủ nhiệm", href: "/teacher/homeroom", icon: NotebookPen },
      { label: "Điểm danh", href: "/teacher/attendance", icon: ClipboardCheck },
      { label: "Báo cáo ngày", href: "/teacher/daily-report", icon: Sparkles },
    ],
  },
  {
    title: "GVBT - Giáo viên bộ môn",
    icon: BookOpen,
    color: "text-blue-400",
    items: [
      { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
      { label: "Giáo án", href: "/teacher/lesson-plans", icon: BookOpen },
      { label: "Nhập điểm", href: "/teacher/grades", icon: Calculator },
    ],
  },
  {
    title: "Cá nhân",
    icon: User,
    color: "text-gray-400",
    items: [
      { label: "Hồ sơ của tôi", href: "/teacher/profile", icon: User },
    ],
  },
];

// For mobile bottom nav - show key items from each section
const mobileMainTabs = [
  { label: "Hôm nay", href: "/teacher/dashboard", icon: CalendarDays },
  { label: "GVCN", href: "/teacher/homeroom", icon: Users },
  { label: "GVBT", href: "/teacher/journal", icon: BookOpen },
  { label: "Tôi", href: "/teacher/profile", icon: User },
];

// Group pages by category for mobile active detection
const gvcnPaths = ["/teacher/homeroom", "/teacher/attendance", "/teacher/daily-report"];
const gvbtPaths = ["/teacher/journal", "/teacher/lesson-plans", "/teacher/grades"];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const userName = session?.user?.name || "Giáo viên";

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Check if current path belongs to a group (for mobile tab highlighting)
  const isGvcnActive = gvcnPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isGvbtActive = gvbtPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== Sidebar - Desktop ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">Giáo viên</h1>
              <p className="text-xs text-gray-400">Hệ thống quản lý</p>
            </div>
          </div>
        </div>

        {/* Menu groups */}
        <nav className="flex-1 overflow-auto py-3 px-3 space-y-1">
          {menuGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title];
            const GroupIcon = group.icon;
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + "/")
            );

            return (
              <div key={group.title}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    hasActiveItem
                      ? "text-emerald-600 bg-emerald-50/50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 shrink-0 ${group.color}`} />
                  <span className="flex-1 text-left">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="mt-0.5 ml-2 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 font-semibold"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                          }`}
                        >
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-emerald-600">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{userName}</p>
              <p className="text-xs text-gray-400">Giáo viên</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ===== Mobile: Top bar + Hamburger ===== */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">{userName}</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5">Giáo viên</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-base font-bold text-gray-800">Giáo viên</h1>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-auto py-3 px-3 space-y-3">
                {menuGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title}>
                      <div className="flex items-center gap-2 px-3 mb-1.5">
                        <GroupIcon className={`w-4 h-4 ${group.color}`} />
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {group.title}
                        </p>
                      </div>
                      <div className="space-y-0.5 ml-2">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-600">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{userName}</p>
                    <p className="text-xs text-gray-400">Giáo viên</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 lg:pb-6">{children}</main>

        {/* ===== Mobile Bottom Tab Bar ===== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
            {mobileMainTabs.map((tab) => {
              const Icon = tab.icon;
              // Special active logic for GVCN and GVBT tabs
              let isActive = false;
              if (tab.label === "GVCN") {
                isActive = isGvcnActive;
              } else if (tab.label === "GVBT") {
                isActive = isGvbtActive;
              } else {
                isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center py-3 px-4 min-w-[70px] relative transition-colors ${
                    isActive
                      ? "text-emerald-600"
                      : "text-gray-400 active:text-gray-600"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 w-10 h-1 bg-emerald-500 rounded-b-full" />
                  )}
                  <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className={`text-[11px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            {/* Menu button for full navigation */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-3 px-4 min-w-[70px] text-gray-400 active:text-gray-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
              <span className="text-[11px] mt-1 font-medium">Menu</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
