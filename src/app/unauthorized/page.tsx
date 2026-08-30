"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-8 text-center text-white space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Không có quyền truy cập</h1>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân hệ này. Vui lòng quay lại bảng điều khiển tương ứng với vai trò của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng điều khiển</span>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đổi tài khoản</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
