"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
  Bot,
  UserCheck,
  ScrollText,
  Lock,
  HardDrive,
  Sparkles,
  X,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
}

const commands: CommandItem[] = [
  { id: "dashboard", label: "Dashboard Quản trị", category: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard, keywords: ["tong quan", "home", "trang chu"] },
  { id: "multi-school", label: "Tổng hợp Liên trường", category: "Tổng quan", href: "/admin/multi-school", icon: Globe, keywords: ["lien truong", "truong hoc"] },
  { id: "daily-reports", label: "Báo cáo ngày", category: "Tổng quan", href: "/admin/daily-reports", icon: FileBarChart, keywords: ["bao cao", "ngay"] },
  { id: "schools", label: "Quản lý Trường học", category: "Quản lý", href: "/admin/schools", icon: Building2, keywords: ["truong", "danh sach"] },
  { id: "classes", label: "Quản lý Lớp học", category: "Quản lý", href: "/admin/classes", icon: School, keywords: ["lop", "hoc sinh"] },
  { id: "teachers", label: "Quản lý Giáo viên", category: "Quản lý", href: "/admin/teachers", icon: UserCog, keywords: ["giao vien", "can bo"] },
  { id: "students", label: "Quản lý Học sinh", category: "Quản lý", href: "/admin/students", icon: Users, keywords: ["hoc sinh", "sinh vien"] },
  { id: "subjects", label: "Quản lý Môn học", category: "Quản lý", href: "/admin/subjects", icon: BookOpen, keywords: ["mon hoc", "chuong trinh"] },
  { id: "subject-groups", label: "Quản lý Tổ chuyên môn", category: "Quản lý", href: "/admin/subject-groups", icon: Users, keywords: ["to chuyen mon", "to truong"] },
  { id: "schedule", label: "Thời khóa biểu", category: "Hệ thống", href: "/admin/schedule", icon: CalendarDays, keywords: ["thoi khoa bieu", "lich day"] },
  { id: "notifications", label: "Thông báo chung", category: "Hệ thống", href: "/admin/notifications", icon: Bell, keywords: ["thong bao", "tin tuc"] },
  { id: "journals", label: "Sổ đầu bài", category: "Hồ sơ sổ sách", href: "/admin/journals", icon: FileBarChart, keywords: ["so dau bai", "lop"] },
  { id: "lesson-plans", label: "Giáo án & Phê duyệt", category: "Hồ sơ sổ sách", href: "/admin/lesson-plans", icon: BookOpen, keywords: ["giao an", "phe duyet"] },
  { id: "drive-config", label: "Cấu hình Google Drive & Kỳ nộp", category: "Hồ sơ sổ sách", href: "/admin/drive-config", icon: HardDrive, keywords: ["drive", "ky nop", "han nop"] },
  { id: "principal-ai", label: "Tư vấn & Cảnh báo AI", category: "Trợ lý AI", href: "/admin/principal-ai", icon: Bot, keywords: ["ai", "canh bao", "tu van"] },
  { id: "substitute-dispatch", label: "Bố trí dạy thay AI", category: "Trợ lý AI", href: "/admin/substitute-dispatch", icon: UserCheck, keywords: ["day thay", "phan cong"] },
  { id: "audit-log", label: "Nhật ký kiểm toán", category: "Bảo mật & Kiểm soát", href: "/admin/audit-log", icon: ScrollText, keywords: ["nhat ky", "kiet toan", "audit"] },
  { id: "data-lock", label: "Khóa sổ dữ liệu", category: "Bảo mật & Kiểm soát", href: "/admin/data-lock", icon: Lock, keywords: ["khoa so", "cuoi ky"] },
  { id: "strategy", label: "Quản trị chiến lược", category: "Chiến lược", href: "/admin/strategy", icon: Sparkles, keywords: ["chien luoc", "kpi"] },
];

export default function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchLabel = c.label.toLowerCase().includes(q);
    const matchCat = c.category.toLowerCase().includes(q);
    const matchKw = c.keywords?.some((k) => k.includes(q));
    return matchLabel || matchCat || matchKw;
  });

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
      setQuery("");
    },
    [router, onClose]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex].href);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, filtered, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-indigo-500 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm nhanh chức năng hoặc gõ từ khóa (VD: Lớp học, Nhật ký, Drive)..."
            className="w-full py-4 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Xóa từ khóa tìm kiếm"
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Không tìm thấy chức năng nào phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected ? "bg-indigo-600 text-white font-bold shadow-xs" : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{cmd.label}</p>
                      <p className={`text-[11px] font-medium ${isSelected ? "text-white/90" : "text-slate-600"}`}>{cmd.category}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? "opacity-100 translate-x-0 text-white" : "opacity-0 -translate-x-2"}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Sử dụng phím <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs font-semibold">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs font-semibold">↓</kbd> để di chuyển</span>
          <span>Nhấn <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs font-semibold">Enter</kbd> để chọn</span>
        </div>
      </div>
    </div>
  );
}
