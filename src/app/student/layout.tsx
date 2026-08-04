"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Bell } from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Học sinh";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-sm block leading-tight">{userName}</span>
            <span className="text-[11px] text-gray-400 leading-tight">Học sinh</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content - single scroll page, no navigation needed */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
