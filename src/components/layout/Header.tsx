/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Root Layouts across Next.js app (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/department/layout.tsx`, `src/app/student/layout.tsx`).
 * 2. Affected APIs: `Header` default export in `src/components/layout/Header.tsx`.
 * 3. Schema: `HeaderProps` (`notificationCount`?: number, `onMobileMenuToggle`?: () => void, `isCollapsed`?: boolean, `onToggleCollapse`?: () => void).
 * 4. Verbatim User Instruction: "chữ trên điện thoại vẫn đang hơi to" -> "theo khuyến nghị của bạn".
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { handleClientSignOut } from "@/lib/client-auth";
import {
  Bell,
  Search,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Menu,
  KeyRound,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import SystemAccountsModal from "@/components/admin/SystemAccountsModal";
import dynamic from "next/dynamic";
import ForcePasswordChangeModal from "@/components/auth/ForcePasswordChangeModal";
const CommandPalette = dynamic(() => import("@/components/ui/CommandPalette"), { ssr: false });

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  SUPER_ADMIN: "Quản trị viên Hệ thống",
  DEPARTMENT_ADMIN: "Sở GD&ĐT",
  WARD_ADMIN: "Phòng GD&ĐT",
  VICE_PRINCIPAL: "Phó Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
};

interface HeaderProps {
  notificationCount?: number;
  onMobileMenuToggle?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Header({
  notificationCount = 0,
  onMobileMenuToggle,
  isCollapsed = false,
  onToggleCollapse,
}: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [systemAccountsModalOpen, setSystemAccountsModalOpen] = useState(false);

  const userName = session?.user?.name || "Người dùng";
  const userRoleRaw = (session?.user as { role?: string })?.role;
  const userRole = roleLabels[userRoleRaw || ""] || "Thành viên";
  const homeHref =
    userRoleRaw === "STUDENT"
      ? "/student/dashboard"
      : userRoleRaw === "TEACHER"
      ? "/teacher/dashboard"
      : userRoleRaw === "DEPARTMENT_ADMIN"
      ? "/department/dashboard"
      : userRoleRaw === "WARD_ADMIN"
      ? "/ward/dashboard"
      : userRoleRaw === "VICE_PRINCIPAL"
      ? "/vice-principal/dashboard"
      : "/admin/dashboard";

  // Ctrl + K listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-3 sm:px-4 md:px-6 shrink-0 z-30 sticky top-0 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        {/* Left: Desktop Collapse Toggle, Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Sidebar Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Mở rộng menu (Ctrl + B)" : "Thu gọn menu (Ctrl + B)"}
              title={isCollapsed ? "Mở rộng menu (Ctrl + B)" : "Thu gọn menu (Ctrl + B)"}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-blue-600" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-600" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Mobile Drawer Trigger */}
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              aria-label="Mở menu điều hướng"
              className="lg:hidden px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              <Menu className="w-4 h-4" aria-hidden="true" />
              <span className="hidden xs:inline">Menu</span>
            </button>
          )}

          <Link
            href={homeHref}
            className="flex items-center gap-2 rounded-lg"
            title="Về Trang tổng quan"
            aria-label="Về Trang tổng quan"
          >
            <img
              src="/logo.png"
              alt="Logo Nhà Trường"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg"
            />
          </Link>
        </div>

        {/* Right: Search + Notifications + User Menu */}
        <div className="flex items-center gap-2">
          {/* Quick Search Button (Ctrl + K) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Tìm kiếm nhanh (Ctrl K)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span className="hidden md:inline font-medium">Tìm nhanh...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            aria-label={`Thông báo ${notificationCount > 0 ? `(${notificationCount} mới)` : ""}`}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-rose-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative border-l border-slate-200 pl-2">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label={`Tài khoản: ${userName}`}
              aria-expanded={userDropdownOpen}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={userName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{userRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" aria-hidden="true" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-2xl border border-slate-200/80 p-2 z-20 animate-modal-pop">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900">{userName}</p>
                    <p className="text-[10px] text-slate-600 font-medium">{session?.user?.email || "Account"}</p>
                  </div>
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[11px] text-slate-700 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>
                        Vai trò: <strong className="text-indigo-900 font-extrabold">{userRole}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setSystemAccountsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs text-slate-800 font-extrabold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-slate-600" aria-hidden="true" />
                      <span>Danh sách TK & Mật khẩu</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setChangePasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs text-blue-700 font-extrabold rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-blue-600" aria-hidden="true" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button
                      onClick={() => handleClientSignOut("/login")}
                      className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs text-rose-700 font-extrabold rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" aria-hidden="true" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Component */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      {/* Change Password Modal */}
      {changePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
      {/* System Accounts & Passwords Modal */}
      <SystemAccountsModal isOpen={systemAccountsModalOpen} onClose={() => setSystemAccountsModalOpen(false)} />
      {/* Force Password Change Modal */}
      <ForcePasswordChangeModal />
    </>
  );
}
