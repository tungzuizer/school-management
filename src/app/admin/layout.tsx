"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getCurrentAdminProfile, AdminProfile } from "./actions";
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
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Bot,
  UserCheck,
  Sparkles,
  Home,
  Settings,
  Landmark,
  Lock,
  ScrollText,
  HardDrive,
  Crown,
  Building,
  SlidersHorizontal,
  Zap,
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

// Menu Group for Super Admin (Quản Trị Viên Tối Cao / Bộ GD&ĐT & Sở GD&ĐT)
const superAdminMenuGroups: MenuGroup[] = [
  {
    title: "👑 Bộ & Sở GD&ĐT - Quản trị Tối cao",
    icon: Crown,
    items: [
      { label: "Bảng điều khiển Tối cao", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Bảng điều khiển Sở GD&ĐT", href: "/department/dashboard", icon: Landmark },
      { label: "Bảng điều khiển Phòng GD&ĐT", href: "/ward/dashboard", icon: Building },
      { label: "Hiệu trưởng & Cán bộ", href: "/admin/principals", icon: Landmark, badge: "FULL" },
      { label: "Tất cả Trường học", href: "/admin/schools", icon: Building2 },
      { label: "Danh sách Phòng GD&ĐT", href: "/department/wards", icon: Building },
      { label: "Trung tâm Phê duyệt", href: "/admin/approvals", icon: ShieldCheck },
    ],
  },
  {
    title: "📊 Điều hành Chiến lược & Báo cáo",
    icon: Sparkles,
    items: [
      { label: "Liên trường Toàn quốc", href: "/admin/multi-school", icon: Globe },
      { label: "Báo cáo Ngày Toàn ngành", href: "/admin/daily-reports", icon: FileBarChart },
      { label: "Quản trị Chiến lược", href: "/admin/strategy", icon: Sparkles },
      { label: "KPI & Ngân sách", href: "/admin/kpi", icon: SlidersHorizontal },
    ],
  },
  {
    title: "🏫 Giám sát Dữ liệu Trường học",
    icon: Settings,
    items: [
      { label: "Lớp học Toàn quốc", href: "/admin/classes", icon: School },
      { label: "Giáo viên", href: "/admin/teachers", icon: UserCog },
      { label: "Học sinh", href: "/admin/students", icon: Users },
      { label: "Môn học", href: "/admin/subjects", icon: BookOpen },
      { label: "Tổ chuyên môn", href: "/admin/subject-groups", icon: Users },
      { label: "Thời khóa biểu", href: "/admin/schedule", icon: CalendarDays },
      { label: "Duyệt Giáo án", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Sổ đầu bài", href: "/admin/journals", icon: FileBarChart },
    ],
  },
  {
    title: "🤖 Trợ lý AI Executive & Giám sát",
    icon: Bot,
    items: [
      { label: "AI Executive Cấp cao", href: "/admin/principal-ai", icon: Bot },
      { label: "Cảnh báo sớm Toàn ngành", href: "/admin/early-warnings", icon: Zap },
      { label: "Bố trí dạy thay", href: "/admin/substitute-dispatch", icon: UserCheck },
      { label: "Cấu hình AI OmniRoute", href: "/admin/ai-config", icon: Sparkles },
    ],
  },
  {
    title: "🛡️ An ninh, Kiểm toán & Hệ thống",
    icon: ShieldCheck,
    items: [
      { label: "Duyệt & Khóa Học bạ", href: "/admin/transcripts", icon: Lock },
      { label: "Nhật ký Kiểm toán An ninh", href: "/admin/audit-log", icon: ScrollText },
      { label: "Khóa sổ Dữ liệu Toàn ngành", href: "/admin/data-lock", icon: Lock },
      { label: "Cấu hình Drive & Ký nộp", href: "/admin/drive-config", icon: HardDrive },
      { label: "Thông báo Khẩn Toàn hệ thống", href: "/admin/notifications", icon: Bell },
    ],
  },
];

// Menu Group for School Principal (BGH - Hiệu Trưởng Trường)
const principalMenuGroups: MenuGroup[] = [
  {
    title: "Phân hệ I: Quản trị chiến lược",
    icon: Sparkles,
    items: [
      { label: "Quản trị chiến lược", href: "/admin/strategy", icon: Sparkles },
    ],
  },
  {
    title: "Tổng quan",
    icon: Home,
    items: [
      { label: "Bảng điều khiển", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Liên trường", href: "/admin/multi-school", icon: Globe },
      { label: "Báo cáo ngày", href: "/admin/daily-reports", icon: FileBarChart },
    ],
  },
  {
    title: "Quản lý trường học",
    icon: Settings,
    items: [
      { label: "Lớp học", href: "/admin/classes", icon: School },
      { label: "Giáo viên", href: "/admin/teachers", icon: UserCog },
      { label: "Học sinh", href: "/admin/students", icon: Users },
      { label: "Môn học", href: "/admin/subjects", icon: BookOpen },
      { label: "Tổ chuyên môn", href: "/admin/subject-groups", icon: Users },
    ],
  },
  {
    title: "Hệ thống & Vận hành",
    icon: CalendarDays,
    items: [
      { label: "Thời khóa biểu", href: "/admin/schedule", icon: CalendarDays },
      { label: "Phê duyệt Học bạ", href: "/admin/transcripts", icon: Lock },
      { label: "Thông báo", href: "/admin/notifications", icon: Bell },
      { label: "Sổ đầu bài", href: "/admin/journals", icon: FileBarChart },
      { label: "Duyệt giáo án", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Trung tâm Phê duyệt", href: "/admin/approvals", icon: ShieldCheck },
    ],
  },
  {
    title: "Trợ lý AI & Cảnh báo",
    icon: Bot,
    items: [
      { label: "Tư vấn & Cảnh báo AI", href: "/admin/principal-ai", icon: Bot },
      { label: "Bố trí dạy thay", href: "/admin/substitute-dispatch", icon: UserCheck },
    ],
  },
];

// Mobile bottom tabs
const mobileMainTabs = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: Home },
  { label: "Cán bộ", href: "/admin/principals", icon: Landmark },
  { label: "Trường", href: "/admin/schools", icon: Building2 },
  { label: "Phê duyệt", href: "/admin/approvals", icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const p = await getCurrentAdminProfile();
      if (p) setProfile(p);
    }
    fetchProfile();
  }, [session]);

  const isSuperAdmin =
    profile?.isSuperAdmin ||
    session?.user?.email === "superadmin@school.com" ||
    session?.user?.role === "DEPARTMENT_ADMIN" ||
    session?.user?.role === "ADMIN";

  const menuGroups = isSuperAdmin ? superAdminMenuGroups : principalMenuGroups;

  const userName = profile?.name || session?.user?.name || (isSuperAdmin ? "Super Admin Tối Cao" : "Hiệu Trưởng");
  const userEmail = profile?.email || session?.user?.email || "";

  const schoolDisplay = profile?.schoolName || (isSuperAdmin ? "Toàn bộ các Trường (Hệ thống Toàn quốc)" : "Trường THCS Tân Xã");
  const wardDisplay = profile?.districtWardName || (isSuperAdmin ? "Tất cả các Phòng GD&ĐT" : "Phòng GD&ĐT Thạch Thất");
  const deptDisplay = profile?.departmentName || (isSuperAdmin ? "Bộ GD&ĐT & Tất cả các Sở GD&ĐT" : "Sở GD&ĐT Hà Nội");

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
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* ===== Sidebar - Desktop ===== */}
      <aside
        className={`hidden lg:flex flex-col w-72 text-white shrink-0 shadow-2xl transition-all border-r ${
          isSuperAdmin
            ? "bg-slate-900 border-r border-amber-500/20"
            : "bg-slate-900 border-r border-slate-800"
        }`}
      >
        {/* User Profile Header */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-2 shadow-lg ${
                isSuperAdmin
                  ? "bg-gradient-to-br from-amber-500 to-amber-700 ring-amber-400/60 text-white"
                  : "bg-white/20 ring-white/30"
              }`}
            >
              {isSuperAdmin ? (
                <Crown className="w-6 h-6 text-amber-100 animate-pulse" />
              ) : (
                <span className="text-base font-bold text-white">
                  {getInitials(userName)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate flex items-center gap-1">
                {userName}
              </p>
              <p className="text-[11px] text-slate-300 truncate">{userEmail}</p>

              {isSuperAdmin ? (
                <div className="mt-2 pt-1.5 border-t border-amber-400/30 text-[10px] space-y-1">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 font-extrabold rounded-md text-[9px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3 text-amber-950" /> QUẢN TRỊ VIÊN TỐI CAO
                  </span>
                  <p className="truncate font-bold text-amber-200 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-300 shrink-0" /> {schoolDisplay}
                  </p>
                  <p className="truncate text-slate-300 opacity-90">{wardDisplay}</p>
                  <p className="truncate text-slate-400 opacity-75">{deptDisplay}</p>
                </div>
              ) : (
                <div className="mt-1 pt-1 border-t border-white/10 text-[10px] text-teal-200 font-medium space-y-0.5">
                  <span className="px-1.5 py-0.5 bg-indigo-500/40 text-indigo-100 font-bold rounded text-[9px] uppercase tracking-wider inline-block mb-0.5">
                    BGH - Hiệu Trưởng
                  </span>
                  <p className="truncate font-bold text-white flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-teal-300 shrink-0" /> {schoolDisplay}
                  </p>
                  <p className="truncate text-blue-200 opacity-90">{wardDisplay}</p>
                  <p className="truncate text-blue-300 opacity-75">{deptDisplay}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {menuGroups.map((group) => {
            const hasActiveItem = group.items.some(
              item => pathname === item.href || pathname.startsWith(item.href + "/")
            );
            const isCollapsed = collapsedGroups[group.title] ?? !hasActiveItem;
            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="mb-2">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                    hasActiveItem
                      ? isSuperAdmin
                        ? "text-amber-300 bg-amber-500/15 border border-amber-500/30"
                        : "text-white bg-white/15"
                      : isSuperAdmin
                      ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      : "text-blue-300 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 shrink-0 ${isSuperAdmin && hasActiveItem ? "text-amber-400" : ""}`} />
                  <span className="flex-1 text-left truncate">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {/* Group items */}
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
                              ? isSuperAdmin
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                                : "bg-indigo-600 text-white font-bold shadow-md"
                              : isSuperAdmin
                              ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? (isSuperAdmin ? "text-slate-950" : "text-[#1a237e]") : isSuperAdmin ? "text-amber-400/80" : "text-blue-300"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-extrabold rounded text-[9px] uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                          {isActive && !item.badge && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSuperAdmin ? "bg-slate-950" : "bg-[#1a237e]"}`} />
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-rose-300 hover:text-white hover:bg-rose-500/30 rounded-xl transition-all font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất khỏi Hệ thống
          </button>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50 text-slate-900">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSuperAdmin ? "bg-amber-500 text-slate-950 font-bold" : "bg-indigo-600 text-white"}`}>
              {isSuperAdmin ? <Crown className="w-5 h-5" /> : getInitials(userName)}
            </div>
            <div>
              <h1 className="text-xs font-bold text-white flex items-center gap-1">
                {userName}
                {isSuperAdmin && <span className="text-[10px] text-amber-400 font-extrabold">👑 SUPER ADMIN</span>}
              </h1>
              <p className="text-[10px] text-slate-400 truncate">{schoolDisplay}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-amber-400"
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
              {/* Drawer header */}
              <div className="px-4 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSuperAdmin ? "bg-amber-500 text-slate-950 font-bold" : "bg-indigo-600 text-white"}`}>
                    {isSuperAdmin ? <Crown className="w-6 h-6" /> : getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold rounded text-[9px] uppercase tracking-wider inline-block mt-1">
                        👑 Super Admin Tối Cao
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2">
                {menuGroups.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <div key={group.title} className="mb-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <GroupIcon className="w-4 h-4 text-amber-400" />
                        <p className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider truncate">
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
                                  ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                                  : "text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-slate-950" : "text-amber-400/80"}`} />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              {/* Drawer footer */}
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

        {/* ===== Mobile Bottom Tab Bar ===== */}
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
                      ? "text-amber-400"
                      : "text-slate-400 active:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 w-10 h-[3px] bg-amber-400 rounded-b-full" />
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
    </div>
  );
}