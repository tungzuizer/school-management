"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Lightbulb } from "lucide-react";
import { useEasyMode } from "@/lib/useEasyMode";

const routeLabels: Record<string, string> = {
  admin: "Quản trị",
  teacher: "Giáo viên",
  student: "Học sinh",
  dashboard: "Tổng quan",
  schools: "Trường học",
  classes: "Lớp học",
  teachers: "Giáo viên",
  students: "Học sinh",
  subjects: "Môn học",
  schedule: "Thời khóa biểu",
  notifications: "Thông báo",
  "multi-school": "Tổng hợp liên trường",
  "daily-reports": "Báo cáo hàng ngày",
  "daily-report": "Báo cáo hàng ngày",
  attendance: "Điểm danh",
  grades: "Điểm số",
  curriculum: "Giáo trình",
  homeroom: "Sổ chủ nhiệm",
  new: "Thêm mới",
  edit: "Chỉnh sửa",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
};

interface HeaderProps {
  notificationCount?: number;
}

export default function Header({ notificationCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const segments = pathname.split("/").filter(Boolean);
  const { isEasyMode, toggleEasyMode } = useEasyMode();

  // Page title = last meaningful segment
  const lastSegment = segments[segments.length - 1] || "dashboard";
  const pageTitle = routeLabels[lastSegment] || lastSegment;

  const userName = session?.user?.name || "";
  const userRole = roleLabels[(session?.user as { role?: string })?.role || ""] || "";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-bold text-gray-800">{pageTitle}</h1>
      </div>

      {/* Right: User info + notifications + Easy Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Easy Mode Toggle */}
        <button
          onClick={toggleEasyMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
            isEasyMode
              ? "bg-amber-100 border-amber-400 text-amber-900 shadow-sm"
              : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
          title="Bật/Tắt hướng dẫn tiếng Việt chi tiết và phím to dễ bấm"
        >
          <Lightbulb className={`w-4 h-4 ${isEasyMode ? "text-amber-700 animate-pulse" : "text-gray-500"}`} />
          <span className="hidden sm:inline">Chế độ Dễ dùng:</span>
          <span className={`font-bold transition-all ${isEasyMode ? "text-amber-700" : "text-gray-500"}`}>
            {isEasyMode ? "BẬT" : "TẮT"}
          </span>
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User info - hidden on very small screens, shown on tablet+ */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-600">
              {userName ? userName.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-700 leading-tight">{userName}</p>
            <p className="text-xs text-gray-400 leading-tight">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
