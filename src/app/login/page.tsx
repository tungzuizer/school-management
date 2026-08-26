"use client";

import { signIn, getSession, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Loader2,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (role === "SUPER_ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    } else if (role === "DEPARTMENT_ADMIN") {
      window.location.href = "/department/dashboard";
      return;
    } else if (role === "DISTRICT_ADMIN") {
      window.location.href = "/district/dashboard";
      return;
    } else if (role === "WARD_ADMIN") {
      window.location.href = "/ward/dashboard";
      return;
    } else if (role === "ADMIN") {
      window.location.href = "/admin/dashboard";
      return;
    } else if (role === "VICE_PRINCIPAL") {
      window.location.href = "/vice-principal/dashboard";
      return;
    } else if (role === "SUBJECT_HEAD") {
      window.location.href = "/subject-head/dashboard";
      return;
    } else if (role === "TEACHER") {
      window.location.href = "/teacher/dashboard";
      return;
    } else if (role === "STUDENT") {
      window.location.href = "/student/dashboard";
      return;
    }

    const checkEmail = (targetEmail || email).toLowerCase();
    if (checkEmail.includes("superadmin") || checkEmail.includes("sysadmin")) {
      window.location.href = "/admin/dashboard";
    } else if (checkEmail.includes("department") || checkEmail.includes("sogd")) {
      window.location.href = "/department/dashboard";
    } else if (checkEmail.includes("district") || checkEmail.includes("phonggd")) {
      window.location.href = "/district/dashboard";
    } else if (checkEmail.includes("ward") || checkEmail.includes("diaphuong")) {
      window.location.href = "/ward/dashboard";
    } else if (checkEmail.includes("admin")) {
      window.location.href = "/admin/dashboard";
    } else if (checkEmail.includes("vp") || checkEmail.includes("pht")) {
      window.location.href = "/vice-principal/dashboard";
    } else if (checkEmail.includes("ttcm")) {
      window.location.href = "/subject-head/dashboard";
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
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <div className="flex items-center gap-3 text-indigo-300 font-semibold text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đã đăng nhập — Đang chuyển hướng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">

      {/* ── DESKTOP LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[56%] relative flex-col justify-between overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #1e40af 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-40 -left-20 w-[440px] h-[440px] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lgrid)" />
          </svg>
          <div
            className="absolute top-1/3 left-0 w-full h-px opacity-10"
            style={{ background: "linear-gradient(90deg, transparent 0%, #a5b4fc 50%, transparent 100%)" }}
          />
        </div>

        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
            >
              <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-white font-bold text-base tracking-tight" style={{ opacity: 0.9 }}>Quản lý Trường học</span>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-4">
          <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#a5b4fc", opacity: 0.8 }}>
            Hệ thống giáo dục
          </p>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Nền tảng quản lý<br />
            <span style={{ color: "#93c5fd" }}>thông minh</span>
          </h2>
          <p className="text-base leading-relaxed max-w-sm" style={{ color: "#c7d2fe", opacity: 0.75 }}>
            Kết nối giáo viên, học sinh và phụ huynh trong một hệ sinh thái giáo dục hiện đại.
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {[
              ["Users", "Quản lý hồ sơ học sinh & giáo viên"],
              ["BookOpen", "Theo dõi kết quả học tập"],
              ["BarChart3", "Báo cáo và thống kê toàn diện"],
              ["GraduationCap", "Kết nối phụ huynh — nhà trường"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(165,180,252,0.12)" }}
                >
                  {key === "Users" && <Users className="w-4 h-4" style={{ color: "#93c5fd" }} />}
                  {key === "BookOpen" && <BookOpen className="w-4 h-4" style={{ color: "#93c5fd" }} />}
                  {key === "BarChart3" && <BarChart3 className="w-4 h-4" style={{ color: "#93c5fd" }} />}
                  {key === "GraduationCap" && <GraduationCap className="w-4 h-4" style={{ color: "#93c5fd" }} />}
                </div>
                <span className="text-sm" style={{ color: "#e0e7ff", opacity: 0.75 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-12 pb-10">
          <div className="h-px w-16 mb-5" style={{ background: "rgba(165,180,252,0.25)" }} />
          <p className="text-xs" style={{ color: "#818cf8", opacity: 0.6 }}>© 2026 Hệ thống Quản lý Giáo dục</p>
        </div>
      </div>

      {/* ── MOBILE: full-screen gradient hero ──────────────────────────── */}
      {/* ── DESKTOP RIGHT: white panel ──────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen relative lg:bg-white lg:justify-center lg:items-center lg:px-6 lg:py-12"
        style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 45%, #1e40af 100%)" }}
      >
        {/* Mobile: decorative blobs */}
        <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/3 -left-16 w-64 h-64 rounded-full opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mgrid)" />
          </svg>
        </div>

        {/* Mobile hero section */}
        <div className="lg:hidden relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-2xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: "#a5b4fc" }}>Hệ thống giáo dục</p>
          <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
            Quản lý<br />
            <span style={{ color: "#93c5fd" }}>Trường học</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#c7d2fe", opacity: 0.8 }}>
            Nền tảng quản lý thông minh cho giáo viên, học sinh và phụ huynh
          </p>
        </div>

        {/* Mobile: bottom sheet form card */}
        <div
          className="lg:hidden relative z-10 w-full px-0 animate-slide-up"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="bg-white w-full px-6 pt-8 pb-8 shadow-[0_-8px_40px_rgba(15,23,42,0.25)]"
            style={{ borderRadius: "32px 32px 0 0" }}
          >
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Đăng nhập</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Nhập thông tin tài khoản để tiếp tục</p>
            </div>

            {successNotice && (
              <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-3 text-sm" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#059669" }} />
                <span className="font-medium leading-snug">{successNotice}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="m-email" className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#94a3b8" }} />
                  <input
                    id="m-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="ten@truong.edu.vn"
                    className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm placeholder-slate-400 transition-all"
                    style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a", minHeight: "52px" }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="m-password" className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#94a3b8" }} />
                  <input
                    id="m-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-4 rounded-2xl text-sm placeholder-slate-400 transition-all"
                    style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a", minHeight: "52px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1"
                    style={{ color: "#94a3b8" }}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 mt-2"
                style={{
                  background: loading ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                  boxShadow: loading ? "none" : "0 6px 20px rgba(79,70,229,0.4)",
                  cursor: loading ? "not-allowed" : "pointer",
                  minHeight: "52px",
                }}
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

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
              <span className="text-xs" style={{ color: "#94a3b8" }}>hoặc</span>
              <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
            </div>

            <Link
              href="/register"
              className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold"
              style={{
                color: "#4f46e5",
                border: "1.5px solid #e0e7ff",
                background: "#f5f3ff",
                minHeight: "48px",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Đăng ký tài khoản mới
            </Link>

            <p className="mt-5 text-center text-xs" style={{ color: "#94a3b8" }}>
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <span className="font-medium cursor-pointer" style={{ color: "#6366f1" }}>điều khoản sử dụng</span>
            </p>
          </div>
        </div>

        {/* ── DESKTOP right panel form (hidden on mobile) ──────────────── */}
        <div className="hidden lg:block w-full max-w-[400px]">

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              Đăng nhập
            </h1>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Nhập thông tin tài khoản để tiếp tục
            </p>
          </div>

          {successNotice && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#059669" }} />
              <span className="font-medium leading-snug">{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#94a3b8" }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="ten@truong.edu.vn"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-slate-400 transition-all"
                  style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4f46e5";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#94a3b8" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm placeholder-slate-400 transition-all"
                  style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#4f46e5";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.12)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "#f8fafc";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded"
                  style={{ color: "#94a3b8", minHeight: "auto", padding: "2px" }}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                boxShadow: loading ? "none" : "0 4px 14px rgba(79,70,229,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
            <span className="text-xs" style={{ color: "#94a3b8" }}>hoặc</span>
            <div className="flex-1 h-px" style={{ background: "#e2e8f0" }} />
          </div>

          <Link
            href="/register"
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold"
            style={{
              color: "#4f46e5",
              border: "1.5px solid #e0e7ff",
              background: "#f5f3ff",
              transition: "all 0.2s ease",
            }}
          >
            <UserPlus className="w-4 h-4" />
            Đăng ký tài khoản mới
          </Link>

          <p className="mt-8 text-center text-xs" style={{ color: "#94a3b8" }}>
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <span className="font-medium cursor-pointer" style={{ color: "#6366f1" }}>điều khoản sử dụng</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-indigo-950">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
