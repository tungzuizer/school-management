"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "Quản trị",
  department: "Sở GD&ĐT",
  ward: "Phòng GD&ĐT",
  teacher: "Giáo viên",
  student: "Học sinh",
  "vice-principal": "Phó Hiệu trưởng",
  dashboard: "Tổng quan",
  schools: "Trường học",
  classes: "Lớp học",
  teachers: "Giáo viên",
  students: "Học sinh",
  subjects: "Môn học",
  schedule: "Thời khóa biểu",
  notifications: "Thông báo",
  "multi-school": "Liên trường",
  "daily-reports": "Báo cáo ngày",
  journals: "Sổ đầu bài",
  "lesson-plans": "Giáo án",
  "principal-ai": "Trợ lý AI",
  "substitute-dispatch": "Phân công dạy thay",
  "audit-log": "Nhật ký kiểm toán",
  "data-lock": "Khóa sổ dữ liệu",
  "drive-config": "Cấu hình Drive & Kỳ nộp",
  "subject-groups": "Tổ chuyên môn",
  strategy: "Quản trị chiến lược",
  "thpt-schools": "Trường THPT",
  wards: "Phòng GD&ĐT",
  "all-schools": "Tất cả Trường",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <Link
        href="/admin/dashboard"
        className="hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5 text-slate-400" />
      </Link>
      {segments.map((segment, index) => {
        const url = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labelMap[segment] || segment;

        return (
          <div key={url} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            {isLast ? (
              <span className="text-slate-800 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link href={url} className="hover:text-indigo-600 transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
