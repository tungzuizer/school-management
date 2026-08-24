"use client";

import { signIn, getSession, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  BookOpen,
  User,
  Building2,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isRegistered = searchParams.get("registered");
    const registeredEmail = searchParams.get("email");

    if (registeredEmail) {
      setEmail(registeredEmail);
    }
    if (isRegistered === "1") {
      setSuccessNotice("Đăng ký tài khoản Giáo viên thành công! Vui lòng nhập mật khẩu để đăng nhập.");
    }
  }, [searchParams]);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      redirectByRole(session.user.email || undefined);
    }
  }, [status, session]);

  const redirectByRole = async (targetEmail?: string) => {
    let session = await getSession();
    if (!session?.user?.role) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      session = await getSession();
    }
    const role = session?.user?.role;
    if (role === "DEPARTMENT_ADMIN") {
      window.location.href = "/department/dashboard";
      return;
    } else if (role === "WARD_ADMIN") {
      window.location.href = "/ward/dashboard";
      return;
    } else if (role === "ADMIN") {
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
    if (checkEmail.includes("department") || checkEmail.includes("sogd")) {
      window.location.href = "/department/dashboard";
    } else if (checkEmail.includes("ward") || checkEmail.includes("phonggd")) {
      window.location.href = "/ward/dashboard";
    } else if (checkEmail.includes("admin")) {
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
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        if (result.error.includes("phê duyệt")) {
          setError(result.error);
        } else {
          setError("Email hoặc mật khẩu không chính xác. Vui lòng thử lại.");
        }
        setLoading(false);
        return;
      }
      await redirectByRole(email);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="flex items-center gap-3 text-indigo-700 font-bold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đã đăng nhập - Đang chuyển hướng...</span>
        </div>
      </div>
    );
  }

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    const demoPassword = "abc123";
    setPassword(demoPassword);
    setLoading(true);
    setError("");
    try {
      // Thử đăng nhập với mật khẩu mặc định abc123
      let result = await signIn("credentials", { email: demoEmail, password: demoPassword, redirect: false });

      // Nếu thất bại, thử với mật khẩu 123456 (từ prisma seed)
      if (result?.error) {
        const fallbackPassword = "123456";
        setPassword(fallbackPassword);
        result = await signIn("credentials", { email: demoEmail, password: fallbackPassword, redirect: false });
      }

      if (result?.error) {
        setError("Không thể đăng nhập tài khoản demo. Hãy chạy seed database trước (npx prisma db seed).");
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
            {/* Registration Success Banner */}
            {successNotice && (
              <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span className="font-medium">{successNotice}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{error}</span>
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

            {/* Teacher Registration Link */}
            <div className="mt-5 text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 text-base font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-4 py-3 rounded-xl w-full transition-colors"
              >
                <UserPlus className="w-5 h-5 text-teal-600" />
                Đăng ký Tài khoản Giáo viên
              </Link>
            </div>

            {/* Quick Demo Login */}
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-400 text-center font-semibold uppercase tracking-wider">
                Đăng nhập nhanh dùng thử (Demo Roles)
              </p>

              {/* Super Admin Highlighted Button */}
              <button
                onClick={() => quickLogin("superadmin@school.com")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl border-2 border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>👑 Quản Trị Viên Tối Cao (Super Admin Toàn Quốc)</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => quickLogin("dept@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-purple-600 group-hover:text-purple-700" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-purple-800">Cán bộ Sở GD&ĐT</span>
                </button>
                <button
                  onClick={() => quickLogin("ward@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-amber-600 group-hover:text-amber-700" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-amber-800">Cán bộ Phòng GD&ĐT</span>
                </button>
                <button
                  onClick={() => quickLogin("admin@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">Hiệu trưởng (Trường)</span>
                </button>
                <button
                  onClick={() => quickLogin("vp1@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-teal-500 group-hover:text-teal-600" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-teal-700">Phó Hiệu trưởng</span>
                </button>
                <button
                  onClick={() => quickLogin("teacher@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-emerald-500 group-hover:text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700">Giáo viên</span>
                </button>
                <button
                  onClick={() => quickLogin("student@school.com")}
                  disabled={loading}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 group cursor-pointer"
                >
                  <User className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700">Học sinh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
