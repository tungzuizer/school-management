"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard, Landmark, Building2, LogOut, Menu, X,
  ChevronDown, ChevronRight, GraduationCap, School, BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MenuItem = { label: string; href: string; icon: LucideIcon };
type MenuGroup = { title: string; icon: LucideIcon; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    title: "Tổng quan & Điều hành",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard Sở GD&ĐT", href: "/department/dashboard", icon: LayoutDashboard },
      { label: "Bảng Quản trị Trung tâm", href: "/admin/dashboard", icon: GraduationCap },
      { label: "Dashboard Phòng GD&ĐT", href: "/ward/dashboard", icon: Landmark },
    ],
  },
  {
    title: "Quản lý Đơn vị",
    icon: Building2,
    items: [
      { label: "Phòng GD&ĐT thuộc Sở", href: "/department/wards", icon: Landmark },
      { label: "Trường THPT trực thuộc", href: "/department/thpt-schools", icon: School },
      { label: "Tất cả Trường học", href: "/department/all-schools", icon: Building2 },
    ],
  },
  {
    title: "Thống kê",
    icon: BarChart3,
    items: [
      { label: "Báo cáo tổng hợp", href: "/department/reports", icon: BarChart3 },
    ],
  },
];

export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    menuGroups.forEach(g => { map[g.title] = true; });
    return map;
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(p => ({ ...p, [title]: !p[title] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-sm text-gray-900">Sở GD&ĐT</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-600" />
            <div>
              <h2 className="font-bold text-sm text-gray-900">Sở Giáo dục & Đào tạo</h2>
              <p className="text-xs text-gray-500">{session?.user?.name || "Quản trị viên"}</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
          {menuGroups.map(group => (
            <div key={group.title}>
              <button onClick={() => toggleGroup(group.title)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase hover:text-gray-700">
                <div className="flex items-center gap-2">
                  <group.icon className="w-4 h-4" />
                  <span>{group.title}</span>
                </div>
                {openGroups[group.title] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {openGroups[group.title] && group.items.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-100"}`}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition">
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
