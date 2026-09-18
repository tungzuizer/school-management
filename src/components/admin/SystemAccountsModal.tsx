/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/components/layout/Header.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `SystemAccountsModal` default export component.
 * 3. Schemas: `AccountInfo` (role, name, email, defaultPass, icon, color, highlight).
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Chuẩn hóa tài khoản SuperAdmin toàn quốc superadmin@gmail.com và hiển thị mẫu 3 miền.
 */

"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check, X, Shield, Building2, User, BookOpen, Crown, GraduationCap, Calculator, Users } from "lucide-react";

interface AccountInfo {
  role: string;
  name: string;
  email: string;
  defaultPass: string;
  icon: any;
  color: string;
  highlight?: boolean;
}

const accountsList: AccountInfo[] = [
  {
    role: "Quản Trị Toàn Quốc (SuperAdmin)",
    name: "Ban Quản Trị Nền Tảng Giáo Dục Toàn Quốc",
    email: "superadmin@gmail.com",
    defaultPass: "abc123",
    icon: Crown,
    color: "bg-amber-100 border-amber-300 text-amber-900",
    highlight: true,
  },
  {
    role: "Lãnh đạo Sở GD&ĐT Hà Nội",
    name: "Giám đốc Sở Giáo dục & Đào tạo Hà Nội",
    email: "sogd.hanoi@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-purple-100 border-purple-300 text-purple-900",
    highlight: true,
  },
  {
    role: "Lãnh đạo Sở GD&ĐT TP.HCM",
    name: "Giám đốc Sở Giáo dục & Đào tạo TP. Hồ Chí Minh",
    email: "sogd.tphcm@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-purple-100 border-purple-300 text-purple-900",
  },
  {
    role: "Lãnh đạo Sở GD&ĐT Đà Nẵng",
    name: "Giám đốc Sở Giáo dục & Đào tạo TP. Đà Nẵng",
    email: "sogd.danang@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-purple-100 border-purple-300 text-purple-900",
  },
  {
    role: "Lãnh đạo Sở GD&ĐT Ninh Bình",
    name: "TS. Phan Thành Công (Giám đốc Sở GD&ĐT Ninh Bình)",
    email: "admin.sogd.ninhbinh@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-purple-100 border-purple-300 text-purple-900",
  },
  {
    role: "Phòng GD&ĐT Cầu Giấy (Hà Nội)",
    name: "Trưởng phòng GD&ĐT Quận Cầu Giấy",
    email: "pgd.caugiay@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-rose-100 border-rose-300 text-rose-900",
  },
  {
    role: "Phòng GD&ĐT Quận 1 (TP.HCM)",
    name: "Trưởng phòng GD&ĐT Quận 1",
    email: "pgd.quan1@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-rose-100 border-rose-300 text-rose-900",
  },
  {
    role: "Phòng GD TP. Ninh Bình",
    name: "ThS. Đinh Xuân Cảnh (Trưởng phòng GD TP. Ninh Bình)",
    email: "gd.tpninhbinh@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-rose-100 border-rose-300 text-rose-900",
  },
  {
    role: "Hiệu Trưởng (THPT Chu Văn An - Hà Nội)",
    name: "Thầy Hiệu trưởng (THPT Chu Văn An)",
    email: "hieutruong.chuvanan@gmail.com",
    defaultPass: "abc123",
    icon: Shield,
    color: "bg-indigo-100 border-indigo-300 text-indigo-900",
    highlight: true,
  },
  {
    role: "Hiệu Trưởng (THPT Chuyên Lê Hồng Phong - TP.HCM)",
    name: "Thầy Hiệu trưởng (THPT Chuyên Lê Hồng Phong)",
    email: "hieutruong.lehongphong@gmail.com",
    defaultPass: "abc123",
    icon: Shield,
    color: "bg-indigo-100 border-indigo-300 text-indigo-900",
    highlight: true,
  },
  {
    role: "Hiệu Trưởng (THPT Trần Phú)",
    name: "Thầy Đinh Văn Khang (Hiệu trưởng)",
    email: "hieutruong.thpt.tranphu@gmail.com",
    defaultPass: "abc123",
    icon: Shield,
    color: "bg-indigo-100 border-indigo-300 text-indigo-900",
  },
  {
    role: "Phó Hiệu Trưởng (Chuyên môn)",
    name: "Cô Nguyễn Thị Mai (Phó Hiệu trưởng)",
    email: "hieuphe.thpt.tranphu@gmail.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-teal-100 border-teal-300 text-teal-900",
  },
  {
    role: "Tổ Trưởng Chuyên Môn (Toán)",
    name: "Thầy Đinh Quốc Tuấn (Tổ trưởng Toán)",
    email: "gv.toan.tuan.tp@gmail.com",
    defaultPass: "abc123",
    icon: Users,
    color: "bg-cyan-100 border-cyan-300 text-cyan-900",
  },
  {
    role: "Giáo Viên Bộ Môn (Tin học)",
    name: "Cô Vũ Minh Trang (GV Tin học)",
    email: "gv.tin.trang.tp@gmail.com",
    defaultPass: "abc123",
    icon: BookOpen,
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
  },
  {
    role: "Kế Toán / Nghị quyết 37",
    name: "Nguyễn Thị Phương Mai (Kế toán trưởng)",
    email: "ketoan.tp@gmail.com",
    defaultPass: "abc123",
    icon: Calculator,
    color: "bg-orange-100 border-orange-300 text-orange-900",
  },
  {
    role: "Học sinh Mẫu (10A1)",
    name: "Học sinh Đinh Bảo Châu (Mã: HS26TP100001)",
    email: "hs26tp100001@gmail.com",
    defaultPass: "abc123",
    icon: GraduationCap,
    color: "bg-blue-100 border-blue-300 text-blue-900",
    highlight: true,
  },
];

interface SystemAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemAccountsModal({ isOpen, onClose }: SystemAccountsModalProps) {
  // Show passwords by default for all demo accounts
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    accountsList.forEach((acc) => {
      initialMap[acc.email] = true;
    });
    return initialMap;
  });

  const [showAll, setShowAll] = useState<boolean>(true);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleShowPassword = (email: string) => {
    setShowPasswords((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const toggleShowAll = () => {
    const nextVal = !showAll;
    setShowAll(nextVal);
    const updated: Record<string, boolean> = {};
    accountsList.forEach((acc) => {
      updated[acc.email] = nextVal;
    });
    setShowPasswords(updated);
  };

  const copyToClipboard = (text: string, email: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Danh Sách Tài Khoản & Mật Khẩu Đăng Nhập</h2>
              <p className="text-xs text-slate-500">Mật khẩu khởi tạo mặc định cho tất cả tài khoản là <strong className="font-mono text-amber-800">abc123</strong> (hoặc <strong className="font-mono text-amber-800">123456</strong>)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng danh sách tài khoản"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global actions bar */}
        <div className="flex items-center justify-between pt-3 pb-1 shrink-0">
          <span className="text-xs font-semibold text-slate-600">Hiển thị mật khẩu tài khoản Demo:</span>
          <button
            onClick={toggleShowAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            {showAll ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
            <span>{showAll ? "Ẩn tất cả" : "Hiện tất cả mật khẩu"}</span>
          </button>
        </div>

        <div className="overflow-y-auto py-2 space-y-3 flex-1 pr-1">
          {accountsList.map((acc) => {
            const Icon = acc.icon;
            const isShown = showPasswords[acc.email] ?? showAll;
            return (
              <div
                key={acc.email}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  acc.highlight
                    ? "border-amber-300/80 bg-amber-50/40 hover:bg-amber-50/70 hover:shadow-md"
                    : "border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${acc.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${acc.color}`}>
                        {acc.role}
                      </span>
                      {acc.highlight && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                          Tài khoản Mẫu
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">{acc.name}</p>
                    <p className="text-xs font-mono text-slate-600">{acc.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 justify-between sm:justify-end">
                  <div className="relative flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-300 min-w-[130px] justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {isShown ? acc.defaultPass : "••••••••"}
                    </span>
                    <button
                      onClick={() => toggleShowPassword(acc.email)}
                      className="ml-2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title={isShown ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {isShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`Email: ${acc.email} | Pass: ${acc.defaultPass}`, acc.email)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Sao chép thông tin đăng nhập"
                  >
                    {copiedEmail === acc.email ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 text-[11px]">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
