"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarDays,
  NotebookPen,
  LogOut,
  User,
  BookOpen,
  FileSpreadsheet,
} from "lucide-react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Giáo viên";

  // Navigation tabs - Simple and clean bottom bar
  const tabs = [
    { label: "Hôm nay", href: "/teacher/dashboard", icon: CalendarDays },
    { label: "Sổ đầu bài", href: "/teacher/journal", icon: FileSpreadsheet },
    { label: "Giáo án", href: "/teacher/lesson-plans", icon: BookOpen },
    { label: "Sổ CN", href: "/teacher/homeroom", icon: NotebookPen },
    { label: "Tôi", href: "/teacher/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar - minimal, just name + logout */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-gray-800 text-sm">{userName}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main content - takes remaining space */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom tab bar - always visible, 3 tabs only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center py-3 px-6 min-w-[80px] transition-colors ${
                  isActive
                    ? "text-emerald-600"
                    : "text-gray-400 active:text-gray-600"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 w-12 h-1 bg-emerald-500 rounded-b-full" />
                )}
                <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className={`text-xs mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
