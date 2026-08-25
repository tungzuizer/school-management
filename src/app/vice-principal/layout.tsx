"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import ForcePasswordChangeModal from "@/components/auth/ForcePasswordChangeModal";
import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  FileBarChart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Home,
  ClipboardCheck,
  Building2,
  User,
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
    title: "Tổng quan",
    icon: Home,
    items: [
      { label: "Bảng điều khiển", href: "/vice-principal/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Quản lý phân hiệu",
    icon: Building2,
    items: [
      { label: "Lớp học", href: "/vice-principal/classes", icon: School },
      { label: "Học sinh", href: "/vice-principal/students", icon: Users },
      { label: "Điểm danh", href: "/vice-principal/attendance", icon: ClipboardCheck },
    ],
  },
  {
    title: "Hồ sơ sổ sách",
    icon: FileBarChart,
    items: [
      { label: "Sổ đầu bài", href: "/vice-principal/journals", icon: FileBarChart },
      { label: "Duyệt giáo án", href: "/vice-principal/lesson-plans", icon: BookOpen },
      { label: "Cảnh báo", href: "/vice-principal/warnings", icon: AlertTriangle },
    ],
  },
];

const mobileMainTabs = [
  { label: "Tổng quan", href: "/vice-principal/dashboard", icon: Home },
  { label: "Lớp học", href: "/vice-principal/classes", icon: School },
  { label: "Duyệt giáo án", href: "/vice-principal/lesson-plans", icon: BookOpen },
  { label: "Sổ đầu bài", href: "/vice-principal/journals", icon: FileBarChart },
];

export default function VicePrincipalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const userName = session?.user?.name || "Phó Hiệu trưởng";
  const userEmail = session?.user?.email || "";

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* ===== Sidebar - Desktop ===== */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white shrink-0 shadow-2xl transition-all border-r border-slate-800">
        {/* User Profile Header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/30 text-white flex items-center justify-center shrink-0 ring-2 ring-teal-400/40 shadow-lg font-bold text-base">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-[11px] text-slate-300 truncate">{userEmail}</p>
              <div className="mt-1 pt-1 border-t border-white/10 text-[10px] text-teal-200 font-medium">
                <span className="px-1.5 py-0.5 bg-teal-500/30 text-teal-100 font-bold rounded text-[9px] uppercase tracking-wider inline-block">
                  Phó Hiệu Trưởng
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {menuGroups.map((group) => {
            const hasActiveItem = group.items.some(
              (item) => pathname === item.href || pathname.startsWith(item.href + "/")
            );
            const isCollapsed = collapsedGroups[group.title] ?? !hasActiveItem;
            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    hasActiveItem
                      ? "text-teal-300 bg-teal-500/15 border border-teal-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <GroupIcon className="w-4 h-4 shrink-0 text-teal-400" />
                  <span className="flex-1 text-left truncate">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="mt-1 ml-1 space-y-0.5 border-l-2 border-slate-700/50 pl-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-teal-600 text-white font-bold shadow-md"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-teal-400/80"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Logout */}
        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-300 hover:text-white hover:bg-rose-500/30 rounded-xl transition-all font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center">
              {getInitials(userName)}
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">{userName}</h1>
              <p className="text-[10px] text-teal-300 font-semibold">Phó Hiệu trưởng</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 bg-slate-900 border-r border-slate-800 z-50 lg:hidden flex flex-col shadow-2xl text-white">
              <div className="px-4 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
                {menuGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title} className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <GroupIcon className="w-4 h-4 text-teal-400" />
                        <p className="text-[11px] font-extrabold text-teal-300 uppercase tracking-wider truncate">
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
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                isActive
                                  ? "bg-teal-600 text-white font-bold shadow-md"
                                  : "text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-teal-400/80"}`} />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="px-3 py-3 border-t border-slate-800">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-400 hover:bg-rose-500/20 rounded-xl transition font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 p-4 md:p-6 bg-slate-50">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.4)]">
          <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
            {mobileMainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2.5 px-4 min-w-[68px] relative transition-colors ${
                    isActive
                      ? "text-teal-400"
                      : "text-slate-400 active:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 w-10 h-[3px] bg-teal-400 rounded-b-full" />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className={`text-[10px] mt-0.5 ${isActive ? "font-extrabold" : "font-medium"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2.5 px-4 min-w-[68px] text-slate-400 active:text-slate-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">Menu</span>
            </button>
          </div>
        </nav>
      </div>
      <ForcePasswordChangeModal />
    </div>
  );
}
