"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Copy, Check, X, Shield, Building2, User, BookOpen, Crown } from "lucide-react";
import { generateStudentEmail } from "@/lib/student-email";

interface AccountInfo {
  role: string;
  name: string;
  email: string;
  defaultPass: string;
  icon: any;
  color: string;
  highlight?: boolean;
}

const student1Email = generateStudentEmail("Nguyễn Việt Tùng", "FPT-HS139");
const student2Email = generateStudentEmail("Bùi Quốc Vũ", "FPT-HS140");

const accountsList: AccountInfo[] = [
  {
    role: "Quản Trị Viên Tối Cao",
    name: "Quản Trị Viên Tối Cao (Super Admin)",
    email: "superadmin@school.com",
    defaultPass: "abc123",
    icon: Crown,
    color: "bg-amber-100 border-amber-300 text-amber-900",
    highlight: true,
  },
  {
    role: "Hiệu Trưởng",
    name: "TS. Nguyễn Văn Hùng",
    email: "admin@school.com",
    defaultPass: "abc123",
    icon: Shield,
    color: "bg-indigo-100 border-indigo-300 text-indigo-900",
    highlight: true,
  },
  {
    role: "Lãnh đạo Sở GD&ĐT",
    name: "Lãnh đạo Sở GD&ĐT",
    email: "dept@school.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-purple-100 border-purple-300 text-purple-900",
  },
  {
    role: "Cán bộ Phòng GD&ĐT",
    name: "Cán bộ Phòng GD&ĐT",
    email: "ward@school.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-amber-100 border-amber-300 text-amber-900",
  },
  {
    role: "Phó Hiệu trưởng",
    name: "ThS. Trịnh Văn Sơn",
    email: "vp1@school.com",
    defaultPass: "abc123",
    icon: Building2,
    color: "bg-teal-100 border-teal-300 text-teal-900",
  },
  {
    role: "Giáo viên",
    name: "Trần Thị Hoa (Giáo viên)",
    email: "teacher@school.com",
    defaultPass: "abc123",
    icon: BookOpen,
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    highlight: true,
  },
  {
    role: "Học sinh (VD 1)",
    name: "Nguyễn Việt Tùng (Mã: FPT-HS139)",
    email: student1Email,
    defaultPass: "abc123",
    icon: User,
    color: "bg-blue-100 border-blue-300 text-blue-900",
    highlight: true,
  },
  {
    role: "Học sinh (VD 2)",
    name: "Bùi Quốc Vũ (Mã: FPT-HS140)",
    email: student2Email,
    defaultPass: "abc123",
    icon: User,
    color: "bg-blue-100 border-blue-300 text-blue-900",
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
