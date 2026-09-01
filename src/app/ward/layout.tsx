"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  School,
  Landmark,
  Sparkles,
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type MenuGroup = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "🏛️ Điều hành Phòng GD&ĐT",
    icon: LayoutDashboard,
    items: [
      { label: "Bảng điều khiển Phòng GD&ĐT", href: "/ward/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "🏫 Quản lý Trường học Địa bàn",
    icon: Building2,
    items: [
      { label: "Trường MN, Tiểu học & THCS", href: "/ward/schools", icon: School },
    ],
  },
];

const mobileMainTabs = [
  { label: "Tổng quan", href: "/ward/dashboard", icon: Home },
  { label: "Trường học", href: "/ward/schools", icon: School },
];

export default function WardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const userName = session?.user?.name || "Lãnh đạo Phòng GD&ĐT";
  const userEmail = session?.user?.email || "phong.gddt@hanoi.edu.vn";

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative selection:bg-cyan-500 selection:text-white">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* ===== Sidebar - Desktop ===== */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 text-white shrink-0 shadow-2xl transition-all border-r border-slate-800/80 relative z-20">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-cyan-500/15 via-cyan-500/5 to-transparent pointer-events-none" />

        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 ring-2 ring-cyan-400/50 flex items-center justify-center shrink-0 shadow-lg text-white font-extrabold text-sm transition-transform duration-300 hover:scale-105">
              {getInitials(userName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                {userName}
              </p>
              <p className="text-[10px] text-cyan-100/90 truncate">{userEmail}</p>
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/30 rounded text-[9px] uppercase tracking-wider inline-block">
                  Phòng Giáo dục & Đào tạo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scrollbar relative">
          {menuGroups.map((group) => {
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + "/")
            );
            const isCollapsed = collapsedGroups[group.title] ?? !hasActiveItem;
            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    hasActiveItem
                      ? "text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 shadow-xs"
                      : "text-slate-200 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 shrink-0 ${hasActiveItem ? "text-cyan-400" : "text-slate-400"}`} />
                  <span className="flex-1 text-left truncate">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="mt-1 ml-1 space-y-1 border-l-2 border-slate-800 pl-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                            isActive
                              ? "bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-extrabold shadow-lg shadow-cyan-500/25"
                              : "text-slate-200 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-cyan-300"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-cyan-300 text-cyan-950 font-black rounded text-[9px] uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                          {isActive && !item.badge && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
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

        {/* Bottom Logout */}
        <div className="p-3 border-t border-slate-800/80 relative">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-slate-200 hover:text-rose-100 hover:bg-rose-500/25 rounded-xl transition-all font-bold cursor-pointer active-press group"
          >
            <LogOut className="w-4 h-4 text-slate-300 group-hover:text-rose-200" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col min-h-screen z-10 min-w-0">
        {/* Global Unified Header */}
        <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Workspace Subheader with Breadcrumbs */}
        <div className="px-4 md:px-6 pt-3 pb-1 flex items-center justify-between border-b border-slate-200/60 bg-white/40 backdrop-blur-xs">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-100 text-cyan-900 border border-cyan-200">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              Cổng Quản lý Cấp Phòng GD&ĐT
            </span>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 bg-slate-950 border-r border-slate-800 z-50 lg:hidden flex flex-col shadow-2xl text-white animate-slide-in-left">
              <div className="px-4 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-bold flex items-center justify-center">
                    {getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-cyan-200 truncate">{userEmail}</p>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30 rounded text-[9px] uppercase tracking-wider inline-block mt-1">
                      Phòng GD&ĐT
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar">
                {menuGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title} className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <GroupIcon className="w-4 h-4 text-cyan-400" />
                        <p className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider truncate">
                          {group.title}
                        </p>
                      </div>
                      <div className="space-y-1 ml-1">
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
                                  ? "bg-cyan-500 text-white font-extrabold shadow-md"
                                  : "text-slate-200 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-cyan-400/80"}`} />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-800">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-300 hover:bg-rose-500/20 rounded-xl transition font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page content container */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 p-4 md:p-6">
          <div className="max-w-[1680px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* ===== Mobile Bottom Tab Bar ===== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-header border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
            {mobileMainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  prefetch={true}
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] relative transition-transform duration-200 active:scale-95 ${
                    isActive
                      ? "text-cyan-600 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500 rounded-b-full shadow-xs" />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5 leading-tight">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[44px] text-slate-600 hover:text-slate-900 font-medium transition-transform duration-200 active:scale-95 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 leading-tight">Mục lục</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
