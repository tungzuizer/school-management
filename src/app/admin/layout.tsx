"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
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
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Bot,
  UserCheck,
  AlertTriangle,
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
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Trợ lý AI Hiệu Trưởng",
    items: [
      { label: "Tư vấn ra quyết định", href: "/admin/principal-ai", icon: Bot },
      { label: "Bố trí dạy thay & Điều chuyển", href: "/admin/substitute-dispatch", icon: UserCheck },
      { label: "Cảnh báo sớm học sinh/lớp", href: "/admin/early-warnings", icon: AlertTriangle },
      { label: "Tổng hợp báo cáo ngày", href: "/admin/daily-summary", icon: Sparkles },
    ],
  },
  {
    title: "Tổng quan",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Liên trường", href: "/admin/multi-school", icon: Globe },
      { label: "Báo cáo ngày", href: "/admin/daily-reports", icon: FileBarChart },
    ],
  },
  {
    title: "Quản lý",
    items: [
      { label: "Trường học", href: "/admin/schools", icon: Building2 },
      { label: "Lớp học", href: "/admin/classes", icon: School },
      { label: "Giáo viên", href: "/admin/teachers", icon: UserCog },
      { label: "Học sinh", href: "/admin/students", icon: Users },
      { label: "Môn học", href: "/admin/subjects", icon: BookOpen },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { label: "Thời khóa biểu", href: "/admin/schedule", icon: CalendarDays },
      { label: "Thông báo", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "Hồ sơ sổ sách",
    items: [
      { label: "Sổ đầu bài", href: "/admin/journals", icon: FileBarChart },
      { label: "Giáo án phê duyệt", href: "/admin/lesson-plans", icon: BookOpen },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = session?.user?.name || "Admin";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ===== Sidebar - Desktop ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
           <h1 className="text-lg font-bold text-gray-800">Quản lý trường học</h1>
          <p className="text-xs text-gray-400 mt-0.5">Hiệu trưởng</p>
        </div>

        {/* Menu groups */}
        <nav className="flex-1 overflow-auto py-3 px-3 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-blue-600">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{userName}</p>
              <p className="text-xs text-gray-400">Hiệu trưởng</p>
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
          <h1 className="text-base font-bold text-gray-800">Quản lý trường học</h1>
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
                <h1 className="text-lg font-bold text-gray-800">Quản lý trường học</h1>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-auto py-3 px-3 space-y-4">
                {menuGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">
                      {group.title}
                    </p>
                    <div className="space-y-0.5">
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
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="px-4 py-3 border-t border-gray-100">
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
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
