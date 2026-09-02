/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js Root Admin Layout for `/admin/*`.
 * 2. Affected APIs: `src/app/admin/layout.tsx`.
 * 3. Schemas: `MenuItem`, `MenuGroup`, `AdminProfile`.
 * 4. Verbatim User Instruction: "sửa lại cấu trúc Bảng Điều Khiển Ban Giám Hiệu cho logic và phù hợp với những gì tôi mô tả về dự án"
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getCurrentAdminProfile, AdminProfile } from "./actions";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
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
    title: "👑 Quản trị Tối cao",
    icon: Crown,
    items: [
      { label: "Bảng điều khiển Tối cao", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Hiệu trưởng & Cán bộ", href: "/admin/principals", icon: Landmark, badge: "FULL" },
      { label: "Tất cả Trường học", href: "/admin/schools", icon: Building2 },
      { label: "Trung tâm Phê duyệt", href: "/admin/approvals", icon: ShieldCheck },
    ],
  },
  {
    title: "⚖️ Tuân thủ Nghị quyết 37/2026/NQ-CP",
    icon: ShieldCheck,
    items: [
      { label: "Thẩm định Định mức NQ 37", href: "/admin/nq37-compliance", icon: ShieldCheck, badge: "NQ 37" },
      { label: "Nhân sự Hỗ trợ & Chuẩn hóa 36T", href: "/admin/support-staff", icon: UserCheck, badge: "36 Tháng" },
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
      { label: "AI Executive Cố vấn BGH", href: "/admin/principal-ai", icon: Bot, badge: "AI" },
      { label: "Cảnh báo sớm Toàn ngành", href: "/admin/early-warnings", icon: Zap },
      { label: "Bố trí dạy thay", href: "/admin/substitute-teaching", icon: UserCheck },
      { label: "Trợ lý AI Đa điểm trường", href: "/admin/ai-assistant", icon: Sparkles },
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

// Menu Group for School Principal (BGH - Ban Giám Hiệu & Hiệu Trưởng Trường Đa Cơ Sở)
const principalMenuGroups: MenuGroup[] = [
  {
    title: "🏛️ Trung tâm Điều hành BGH",
    icon: LayoutDashboard,
    items: [
      { label: "Bảng điều khiển Ban Giám hiệu", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Điều hành Liên phân hiệu", href: "/admin/multi-school", icon: Globe },
      { label: "Báo cáo Ngày Toàn trường", href: "/admin/daily-reports", icon: FileBarChart },
      { label: "Quản trị Chiến lược & KPI", href: "/admin/strategy", icon: Sparkles },
    ],
  },
  {
    title: "⚖️ Tuân thủ Nghị quyết 37/2026/NQ-CP",
    icon: ShieldCheck,
    items: [
      { label: "Thẩm định Định mức NQ 37", href: "/admin/nq37-compliance", icon: ShieldCheck, badge: "NQ 37" },
      { label: "Nhân sự Hỗ trợ & Chuẩn hóa 36T", href: "/admin/support-staff", icon: UserCheck, badge: "36 Tháng" },
    ],
  },
  {
    title: "👥 Quản trị Đội ngũ & Nhân sự",
    icon: UserCog,
    items: [
      { label: "Hiệu trưởng & Ban Giám hiệu", href: "/admin/principals", icon: Landmark },
      { label: "Đội ngũ Giáo viên", href: "/admin/teachers", icon: UserCog },
      { label: "Tổ Chuyên môn", href: "/admin/subject-groups", icon: Users },
      { label: "Điều động Dạy thay Thông minh", href: "/admin/substitute-teaching", icon: Zap },
    ],
  },
  {
    title: "🏫 Quản lý Dạy học & Học sinh",
    icon: School,
    items: [
      { label: "Lớp học theo Cơ sở", href: "/admin/classes", icon: School },
      { label: "Hồ sơ Học sinh", href: "/admin/students", icon: Users },
      { label: "Môn học & Chương trình", href: "/admin/subjects", icon: BookOpen },
      { label: "Thời khóa biểu Liên cơ sở", href: "/admin/schedule", icon: CalendarDays },
      { label: "Quản lý & Duyệt Giáo án", href: "/admin/lesson-plans", icon: BookOpen },
      { label: "Sổ đầu bài Điện tử", href: "/admin/journals", icon: FileBarChart },
    ],
  },
  {
    title: "🛡️ Kiểm soát & Phê duyệt",
    icon: Lock,
    items: [
      { label: "Trung tâm Phê duyệt BGH", href: "/admin/approvals", icon: ShieldCheck },
      { label: "Phê duyệt & Khóa Học bạ", href: "/admin/transcripts", icon: Lock },
      { label: "Bảng tin & Thông báo Khẩn", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    title: "🤖 Trợ lý AI Cố vấn Hiệu trưởng",
    icon: Bot,
    items: [
      { label: "AI Cố vấn Ra Quyết định", href: "/admin/principal-ai", icon: Bot, badge: "AI BGH" },
      { label: "Radar Cảnh báo sớm AI", href: "/admin/early-warnings", icon: Zap },
      { label: "Trợ lý AI Đa điểm trường", href: "/admin/ai-assistant", icon: Sparkles },
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
    (session?.user as { role?: string })?.role === "SUPER_ADMIN";

  const menuGroups = isSuperAdmin ? superAdminMenuGroups : principalMenuGroups;

  const userName = profile?.name || session?.user?.name || (isSuperAdmin ? "Ban Quản Trị Hệ Thống Toàn Thành Phố" : "Thầy Đoàn Thái Sơn");
  const userEmail = profile?.email || session?.user?.email || "";

  const schoolDisplay = profile?.schoolName || (isSuperAdmin ? "Toàn bộ các Trường (Hệ thống TP. Hải Phòng)" : "Trường THPT Chuyên Trần Phú");
  const wardDisplay = profile?.districtWardName || (isSuperAdmin ? "Tất cả các Quận/Huyện" : "Quận Hải An - TP. Hải Phòng");
  const deptDisplay = profile?.departmentName || (isSuperAdmin ? "Bộ GD&ĐT & Sở GD&ĐT TP. Hải Phòng" : "Sở GD&ĐT TP. Hải Phòng");

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
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient background mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* ===== Sidebar - Desktop ===== */}
      <aside
        className={`hidden lg:flex flex-col w-72 text-white shrink-0 shadow-2xl transition-all border-r relative z-20 ${
          isSuperAdmin
            ? "bg-slate-950 border-r border-amber-500/20"
            : "bg-slate-950 border-r border-slate-800/80"
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-0 right-0 h-44 bg-gradient-to-b pointer-events-none ${
            isSuperAdmin
              ? "from-amber-500/15 via-amber-500/5 to-transparent"
              : "from-indigo-500/15 via-indigo-500/5 to-transparent"
          }`}
        />

        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ring-2 shadow-lg transition-transform duration-300 hover:scale-105 ${
                isSuperAdmin
                  ? "bg-gradient-to-br from-amber-500 to-amber-700 ring-amber-400/60 text-white"
                  : "bg-blue-600 ring-blue-400/50 text-white"
              }`}
            >
              {isSuperAdmin ? (
                <Crown className="w-5 h-5 text-amber-100 animate-pulse" />
              ) : (
                <span className="text-sm font-extrabold text-white">
                  {getInitials(userName)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                {userName}
              </p>
              <p className="text-[10px] text-slate-300 truncate">{userEmail}</p>

              {isSuperAdmin ? (
                <div className="mt-2 pt-1.5 border-t border-amber-400/20 text-[10px] space-y-1">
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-md text-[9px] uppercase tracking-wider inline-flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3 text-slate-950" /> QUẢN TRỊ VIÊN TỐI CAO
                  </span>
                  <p className="truncate font-bold text-amber-200 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-amber-300 shrink-0" /> {schoolDisplay}
                  </p>
                </div>
              ) : (
                <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                  <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30 rounded text-[9px] uppercase tracking-wider inline-block mb-0.5">
                    BGH - Hiệu Trưởng
                  </span>
                  <p className="truncate font-bold text-slate-200 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-indigo-300 shrink-0" /> {schoolDisplay}
                  </p>
                </div>
              )}
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
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    hasActiveItem
                      ? isSuperAdmin
                        ? "text-amber-300 bg-amber-500/15 border border-amber-500/30 shadow-xs"
                        : "text-white bg-white/10 border border-white/10 shadow-xs"
                      : isSuperAdmin
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <GroupIcon className={`w-4 h-4 shrink-0 ${isSuperAdmin && hasActiveItem ? "text-amber-400" : hasActiveItem ? "text-indigo-400" : "text-slate-400"}`} />
                  <span className="flex-1 text-left truncate">{group.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                {/* Group items */}
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
                              ? isSuperAdmin
                                ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20"
                                : "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-900/30"
                              : isSuperAdmin
                              ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isSuperAdmin ? "text-slate-950" : "text-white") : isSuperAdmin ? "text-amber-400/80" : "text-slate-400"}`} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 font-extrabold rounded text-[9px] uppercase tracking-wider ${
                              isActive
                                ? "bg-slate-950 text-amber-300"
                                : "bg-amber-400 text-slate-950"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {isActive && !item.badge && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSuperAdmin ? "bg-slate-950" : "bg-white"}`} />
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
        <div className="p-3 border-t border-slate-800/80 relative">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:text-rose-200 hover:bg-rose-500/20 rounded-xl transition-all font-bold cursor-pointer active-press group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-300" />
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
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              isSuperAdmin
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-indigo-100 text-indigo-900 border border-indigo-200"
            }`}>
              <Sparkles className="w-3 h-3" />
              {isSuperAdmin ? "Cổng Điều hành Toàn quốc" : "Không gian Quản trị Nhà trường"}
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
              {/* Drawer header */}
              <div className="px-4 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSuperAdmin ? "bg-amber-500 text-slate-950 font-bold" : "bg-indigo-600 text-white font-bold"}`}>
                    {isSuperAdmin ? <Crown className="w-5 h-5" /> : getInitials(userName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-[11px] text-slate-300 truncate">{userEmail}</p>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-extrabold rounded text-[9px] uppercase tracking-wider inline-block mt-1">
                        👑 Super Admin Tối Cao
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-2 custom-scrollbar">
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
                                  ? isSuperAdmin
                                    ? "bg-amber-400 text-slate-950 font-extrabold shadow-md"
                                    : "bg-indigo-600 text-white font-extrabold shadow-md"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isSuperAdmin ? "text-slate-950" : "text-white") : isSuperAdmin ? "text-amber-400/80" : "text-slate-400"}`} />
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
                      ? isSuperAdmin ? "text-amber-600 font-extrabold" : "text-indigo-600 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full shadow-xs ${
                      isSuperAdmin ? "bg-amber-500" : "bg-indigo-600"
                    }`} />
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
