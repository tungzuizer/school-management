"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Search, LogOut, ChevronDown, ShieldCheck, Menu, KeyRound } from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import dynamic from "next/dynamic";
import ForcePasswordChangeModal from "@/components/auth/ForcePasswordChangeModal";
const CommandPalette = dynamic(() => import("@/components/ui/CommandPalette"), { ssr: false });

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  DEPARTMENT_ADMIN: "Sở GD&ĐT",
  WARD_ADMIN: "Phòng GD&ĐT",
  VICE_PRINCIPAL: "Phó Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
};

interface HeaderProps {
  notificationCount?: number;
  onMobileMenuToggle?: () => void;
}

export default function Header({ notificationCount = 0, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  const userName = session?.user?.name || "Người dùng";
  const userRole = roleLabels[(session?.user as { role?: string })?.role || ""] || "Thành viên";

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
      <header className="h-16 glass-header flex items-center justify-between px-4 md:px-6 shrink-0 z-30 sticky top-0 transition-all duration-300">
        {/* Left: Mobile Menu Trigger & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              aria-label="Mở mục lục điều hướng"
              className="lg:hidden px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 hover:bg-indigo-100 transition-all active-press cursor-pointer flex items-center gap-1.5 shadow-2xs font-extrabold text-xs"
            >
              <Menu className="w-4 h-4 text-indigo-700" aria-hidden="true" />
              <span className="hidden xs:inline">Mục lục</span>
            </button>
          )}
          <img src="/logo.png" alt="Logo Nhà Trường" className="w-8 h-8 object-contain rounded-xl shadow-xs transition-transform duration-300 hover:scale-105" />
        </div>

        {/* Right: Search + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Search Button (Ctrl + K) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Tìm kiếm nhanh (Ctrl K)"
            className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl border border-slate-200/80 bg-slate-50/90 text-slate-700 text-xs hover:bg-white hover:border-indigo-300 hover:text-indigo-900 hover:shadow-xs transition-all active-press cursor-pointer"
          >
            <Search className="w-4 h-4 text-indigo-600" aria-hidden="true" />
            <span className="hidden md:inline font-bold">Tìm nhanh...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-extrabold text-slate-600 bg-white rounded-md border border-slate-200 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            aria-label={`Thông báo ${notificationCount > 0 ? `(${notificationCount} mới)` : ''}`}
            className="relative p-2.5 min-h-[44px] min-w-[44px] rounded-xl text-slate-700 hover:bg-slate-100 hover:text-indigo-900 transition-all bell-swing active-press flex items-center justify-center"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative border-l border-slate-200/80 pl-2.5">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label={`Tài khoản: ${userName}`}
              aria-expanded={userDropdownOpen}
              className="flex items-center gap-2 p-1.5 min-h-[44px] rounded-xl hover:bg-slate-100/80 transition-all active-press cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs ring-2 ring-indigo-100">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">{userName}</p>
                <p className="text-[10px] text-indigo-700 font-bold leading-tight">{userRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:block" aria-hidden="true" />
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
                      <span>Vai trò: <strong className="text-indigo-900 font-extrabold">{userRole}</strong></span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setChangePasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-xs text-indigo-700 font-extrabold rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                      <span>Đổi mật khẩu</span>
                    </button>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
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
      {changePasswordModalOpen && (
        <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />
      )}
      {/* Force Password Change Modal */}
      <ForcePasswordChangeModal />
    </>
  );
}