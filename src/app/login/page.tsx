"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Mail, Lock, Loader2, ShieldCheck, BookOpen, User, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectByRole = async (targetEmail?: string) => {
    let session = await getSession();
    if (!session?.user?.role) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      session = await getSession();
    }
    const role = session?.user?.role;
    if (role === "ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    } else if (role === "TEACHER") {
      window.location.href = "/teacher/dashboard";
      return;
    } else if (role === "VICE_PRINCIPAL") {
      window.location.href = "/vice-principal/dashboard";
      return;
    } else if (role === "STUDENT") {
      window.location.href = "/student/dashboard";
      return;
    }

    const checkEmail = (targetEmail || email).toLowerCase();
    if (checkEmail.includes("admin")) {
      window.location.href = "/admin/dashboard";
    } else if (checkEmail.includes("vp")) {
      window.location.href = "/vice-principal/dashboard";
    } else if (checkEmail.includes("teacher")) {
      window.location.href = "/teacher/dashboard";
    } else if (checkEmail.includes("student")) {
      window.location.href = "/student/dashboard";
    } else {
      window.location.href = "/admin/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        // Auto-seed database if demo accounts do not exist yet in remote database
        try {
          const seedRes = await fetch("/api/db-seed?secret=seed123");
          if (seedRes.ok) {
            result = await signIn("credentials", { email, password, redirect: false });
          }
        } catch {
          // ignore fetch error
        }
      }

      if (result?.error) {
        setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      await redirectByRole(email);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    setLoading(true);
    setError("");
    try {
      let result = await signIn("credentials", { email: demoEmail, password: "123456", redirect: false });
      if (result?.error) {
        // Auto-seed database if demo accounts do not exist yet
        try {
          const seedRes = await fetch("/api/db-seed?secret=seed123");
          if (seedRes.ok) {
            result = await signIn("credentials", { email: demoEmail, password: "123456", redirect: false });
          }
        } catch {
          // ignore seed fetch error
        }
      }

      if (result?.error) {
        setError("Không thể đăng nhập tài khoản demo. Vui lòng kiểm tra lại cơ sở dữ liệu.");
        setLoading(false);
        return;
      }

      await redirectByRole(demoEmail);
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-8 sm:px-8 sm:py-10 text-center">
            <div className="mx-auto w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-white/30 shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Quản lý Trường học
            </h1>
            <p className="text-indigo-200 text-base mt-2">Đăng nhập để tiếp tục</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-base flex items-center gap-2">
                <span className="shrink-0 w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-base font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.com"
                    required
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-base"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-base font-semibold text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-base"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            {/* Quick Demo Login */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-400 text-center mb-4 font-semibold uppercase tracking-wider">
                Đăng nhập nhanh (demo)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => quickLogin("admin@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50 group"
                >
                  <ShieldCheck className="w-7 h-7 text-indigo-500 group-hover:text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-indigo-700">Hiệu trưởng</span>
                </button>
                <button
                  onClick={() => quickLogin("vp1@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50 group"
                >
                  <Building2 className="w-7 h-7 text-teal-500 group-hover:text-teal-600" />
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-teal-700">Phó Hiệu trưởng</span>
                </button>
                <button
                  onClick={() => quickLogin("teacher@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 group"
                >
                  <BookOpen className="w-7 h-7 text-emerald-500 group-hover:text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-emerald-700">Giáo viên</span>
                </button>
                <button
                  onClick={() => quickLogin("student@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50 group"
                >
                  <User className="w-7 h-7 text-amber-500 group-hover:text-amber-600" />
                  <span className="text-sm font-semibold text-gray-600 group-hover:text-amber-700">Học sinh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
