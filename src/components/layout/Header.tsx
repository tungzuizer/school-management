"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, Lightbulb, Search, LogOut, ChevronDown, User, ShieldCheck } from "lucide-react";
import { useEasyMode } from "@/lib/useEasyMode";
import Breadcrumb from "@/components/ui/Breadcrumb";
import CommandPalette from "@/components/ui/CommandPalette";

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
}

export default function Header({ notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isEasyMode, toggleEasyMode } = useEasyMode();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

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
      <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 sticky top-0 backdrop-blur-md bg-white/90">
        {/* Left: Breadcrumbs & Page Context */}
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
          <Breadcrumb />
        </div>

        {/* Right: Search + Notifications + Easy Mode + User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Button (Ctrl + K) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline font-medium">Tìm nhanh...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white rounded border border-slate-200 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* Easy Mode Toggle */}
          <button
            onClick={toggleEasyMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              isEasyMode
                ? "bg-amber-100 border-amber-400 text-amber-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
            title="Bật/Tắt hướng dẫn tiếng Việt chi tiết và phím to dễ bấm"
          >
            <Lightbulb className={`w-3.5 h-3.5 ${isEasyMode ? "text-amber-700 animate-pulse" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Dễ dùng:</span>
            <span className={`font-bold ${isEasyMode ? "text-amber-700" : "text-slate-500"}`}>
              {isEasyMode ? "BẬT" : "TẮT"}
            </span>
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative border-l border-slate-200 pl-2.5">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
                <p className="text-[10px] text-indigo-600 font-semibold leading-tight">{userRole}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{userName}</p>
                    <p className="text-[10px] text-slate-400">{session?.user?.email || "Account"}</p>
                  </div>
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Vai trò: <strong>{userRole}</strong></span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
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
    </>
  );
}
