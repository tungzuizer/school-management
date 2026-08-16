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
  Home,
  Users,
  Sparkles,
  Clock,
  Settings,
  Bell,
  Mail,
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
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Tong quan",
    icon: Home,
    items: [
      { label: "Dashboard", href: "/teacher/dashboard", icon: Home },
    ],
  },
  {
    title: "GVCN - Chu nhiem",
    icon: Users,
    items: [
      { label: "So chu nhiem", href: "/teacher/homeroom", icon: NotebookPen },
      { label: "Diem danh", href: "/teacher/attendance", icon: ClipboardCheck },
      { label: "Bao cao ngay", href: "/teacher/daily-report", icon: Sparkles },
    ],
  },
  {
    title: "GVBM - Bo mon",
    icon: BookOpen,
    items: [
      { label: "So dau bai", href: "/teacher/journal", icon: FileSpreadsheet },
      { label: "Giao an", href: "/teacher/lesson-plans", icon: BookOpen },
      { label: "Nhap diem", href: "/teacher/grades", icon: Calculator },
    ],
  },
  {
    title: "Ca nhan",
    icon: User,
    items: [
      { label: "Ho so", href: "/teacher/profile", icon: User },
    ],
  },
];

// Mobile bottom tabs
const mobileMainTabs = [
  { label: "Home", href: "/teacher/dashboard", icon: Home },
  { label: "GVCN", href: "/teacher/homeroom", icon: Users },
  { label: "GVBM", href: "/teacher/journal", icon: BookOpen },
  { label: "Ho so", href: "/teacher/profile", icon: User },
];

const gvcnPaths = ["/teacher/homeroom", "/teacher/attendance", "/teacher/daily-report"];
const gvbtPaths = ["/teacher/journal", "/teacher/lesson-plans", "/teacher/grades"];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const userName = session?.user?.name || "Giao vien";
  const userEmail = session?.user?.email || "";

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Get user initials (up to 2 chars)
  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isGvcnActive = gvcnPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isGvbtActive = gvbtPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== Sidebar - Desktop (FPT EduNext Blue Style) ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-[#1a237e] to-[#283593] text-white shrink-0 shadow-xl">
        {/* User Profile Header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 ring-2 ring-white/30">
              <span className="text-base font-bold text-white">
                {getInitials(userName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-blue-200 truncate">{userEmail || "Giao vien"}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-auto py-3 px-2 space-y-0.5">
          {menuGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.title];
            const GroupIcon = group.icon;
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + "/")
            );

            return (
              <div key={group.title} className="mb-1">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                    hasActiveItem
                      ? "text-white bg-white/15"
                      : "text-blue-300 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {/* Group items */}
                {!isCollapsed && (
                  <div className="mt-0.5 ml-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? "bg-white text-[#1a237e] font-semibold shadow-md"
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#1a237e]" : "text-blue-300"}`} />
                          <span>{item.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1a237e]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-300 hover:text-white hover:bg-red-500/30 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Dang xuat
          </button>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-gradient-to-r from-[#1a237e] to-[#283593] px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{getInitials(userName)}</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">{userName}</h1>
              <p className="text-[10px] text-blue-200 -mt-0.5">{userEmail || "Giao vien"}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-white/80 hover:bg-white/10 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#1a237e] to-[#283593] z-50 lg:hidden flex flex-col shadow-2xl">
              {/* Drawer header */}
              <div className="px-4 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                    <span className="text-sm font-bold text-white">{getInitials(userName)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-blue-200 truncate">{userEmail || "Giao vien"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-white/60 hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-auto py-3 px-2 space-y-1">
                {menuGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title} className="mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <GroupIcon className="w-4 h-4 text-blue-300" />
                        <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                          {group.title}
                        </p>
                      </div>
                      <div className="space-y-0.5 ml-1">
                        {group.items.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              prefetch={true}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                isActive
                                  ? "bg-white text-[#1a237e] font-semibold shadow-md"
                                  : "text-blue-100 hover:bg-white/10"
                              }`}
                            >
                              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#1a237e]" : "text-blue-300"}`} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* Drawer footer */}
              <div className="px-3 py-3 border-t border-white/10">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-300 hover:text-white hover:bg-red-500/30 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  Dang xuat
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>

        {/* ===== Mobile Bottom Tab Bar (FPT blue style) ===== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
          <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
            {mobileMainTabs.map((tab) => {
              const Icon = tab.icon;
              let isActive = false;
              if (tab.label === "GVCN") {
                isActive = isGvcnActive;
              } else if (tab.label === "GVBM") {
                isActive = isGvbtActive;
              } else {
                isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2.5 px-4 min-w-[68px] relative transition-colors ${
                    isActive
                      ? "text-[#1a237e]"
                      : "text-gray-400 active:text-gray-600"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 w-10 h-[3px] bg-[#1a237e] rounded-b-full" />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className={`text-[10px] mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2.5 px-4 min-w-[68px] text-gray-400 active:text-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Menu</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
