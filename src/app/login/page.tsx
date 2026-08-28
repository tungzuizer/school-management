/*
  THESIS: Pristine Luminous Glassmorphism & Vibrant Architectural Mesh ("Sáng sủa, Rực rỡ, Xịn xò & Hiện đại").
  Features: Multi-layer Aurora Orbs, Micro-dot Architectural Mesh, Luminous Floating Node Canvas, Cursor Spotlight Glow & 3D Card Tilt.
*/
"use client";

import { signIn, getSession, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
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
  ShieldCheck,
  Building2,
  FileCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

{/* ── Background Interactive Particle System ── */}
function LuminousBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = { x: width / 2, y: height / 2, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // Generate high-visibility luminous floating nodes
    const count = Math.min(Math.floor((width * height) / 16000), 55);
    const particles = Array.from({ length: count }, () => {
      const colorType = Math.random();
      let rgb = "2, 132, 199"; // Sky-600
      if (colorType > 0.6) rgb = "16, 185, 129"; // Emerald-500
      else if (colorType > 0.3) rgb = "99, 102, 241"; // Indigo-500

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.8 + 1.8,
        alpha: Math.random() * 0.5 + 0.35,
        rgb,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Particle Glow & Shadow
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p1.rgb}, ${p1.alpha})`;
        ctx.shadowColor = `rgba(${p1.rgb}, 0.75)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.25 * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Connect to mouse pointer with vivid beam
        if (mouse.active) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(2, 132, 199, ${0.45 * (1 - dist / 180)})`;
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-90" />;
}

function LoginFormContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Card Tilt & Specular Shine
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 200, y: 150 });
  const [spotlight, setSpotlight] = useState({ x: 500, y: 300 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setSpotlight({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -2; // ±2deg tilt
    const rotateY = ((x - centerX) / centerX) * 2;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleCardMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  useEffect(() => {
    const isRegistered = searchParams.get("registered");
    const registeredEmail = searchParams.get("email");
    if (registeredEmail) setEmail(registeredEmail);
    if (isRegistered === "1") {
      setSuccessNotice("Đăng ký tài khoản thành công! Vui lòng nhập mật khẩu để đăng nhập.");
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
    if (role === "SUPER_ADMIN") { window.location.href = "/admin/dashboard"; return; }
    if (role === "DEPARTMENT_ADMIN") { window.location.href = "/department/dashboard"; return; }
    if (role === "DISTRICT_ADMIN") { window.location.href = "/district/dashboard"; return; }
    if (role === "WARD_ADMIN") { window.location.href = "/ward/dashboard"; return; }
    if (role === "ADMIN") { window.location.href = "/admin/dashboard"; return; }
    if (role === "VICE_PRINCIPAL") { window.location.href = "/vice-principal/dashboard"; return; }
    if (role === "SUBJECT_HEAD") { window.location.href = "/subject-head/dashboard"; return; }
    if (role === "TEACHER") { window.location.href = "/teacher/dashboard"; return; }
    if (role === "STUDENT") { window.location.href = "/student/dashboard"; return; }

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
        setError(
          result.error.includes("phê duyệt")
            ? result.error
            : "Email hoặc mật khẩu không chính xác. Vui lòng thử lại."
        );
        setLoading(false);
        return;
      }
      await redirectByRole(email);
    } catch {
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex items-center gap-3 text-sm font-semibold text-sky-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đã xác thực — Đang chuyển hướng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100/90 via-slate-100 to-emerald-100/70 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans relative overflow-hidden">

      {/* ── Background Architectural Micro-Dot Mesh ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-45"
        style={{
          backgroundImage: "radial-gradient(rgba(2, 132, 199, 0.25) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Floating Luminous Aurora Gradient Orbs ── */}
      <div className="fixed -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-tr from-sky-400/30 to-cyan-300/35 rounded-full blur-3xl pointer-events-none z-0 animate-pulse" />
      <div className="fixed -bottom-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-emerald-300/35 to-teal-200/30 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-12 right-1/4 w-[450px] h-[450px] bg-gradient-to-b from-indigo-300/20 to-sky-300/25 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Canvas Luminous Particles */}
      <LuminousBackground />

      {/* Cursor Spotlight Ambient Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 opacity-70"
        style={{
          background: `radial-gradient(700px circle at ${spotlight.x}px ${spotlight.y}px, rgba(14, 165, 233, 0.18), transparent 75%)`,
        }}
      />

      {/* ── Main Luminous Glass Card with 3D Tilt ── */}
      <div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className="w-full max-w-4xl bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_75px_-15px_rgba(2,132,199,0.18)] overflow-hidden border border-white/90 grid grid-cols-1 lg:grid-cols-12 relative z-10 transition-transform duration-200 ease-out"
      >
        {/* Specular Gloss Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 opacity-60 hidden lg:block"
          style={{
            background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.5), transparent 75%)`,
          }}
        />

        {/* ── LEFT PANEL: Desktop Luminous Brand (Hidden on mobile) ── */}
        <div
          className="hidden lg:flex lg:col-span-5 p-8 lg:p-10 flex-col justify-between text-white relative overflow-hidden"
          style={{ background: "linear-gradient(150deg, #0284C7 0%, #0369A1 50%, #0F172A 100%)" }}
        >
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute -top-16 -left-16 w-60 h-60 bg-sky-400/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-lg shadow-sky-950/20 group hover:rotate-6 transition-transform relative">
                <img src="/logo.png" alt="Logo" className="w-5.5 h-5.5 object-contain filter brightness-0 invert" />
                <Sparkles className="w-3.5 h-3.5 text-sky-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-wider uppercase text-sky-200 flex items-center gap-1.5">
                  <span>CỔNG QUẢN LÝ GIÁO DỤC</span>
                </h2>
                <p className="text-[11px] text-sky-100/70">Hệ thống Điều hành Số hóa</p>
              </div>
            </div>

            {/* Headline */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight text-white mb-2">
                Nền tảng Quản lý <br />
                <span className="text-sky-300">
                  Thông minh & Tin cậy
                </span>
              </h1>
            </div>

            {/* Glass Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 hover:translate-x-1 transition-all duration-300 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-sky-400/20 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-sky-300" />
                </div>
                <span className="text-xs font-semibold text-white/95">Bảo mật & Phân quyền 9 phân hệ</span>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 hover:translate-x-1 transition-all duration-300 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-xs font-semibold text-white/95">Liên thông Sở — Phòng — Trường học</span>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/15 hover:translate-x-1 transition-all duration-300 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-sky-400/20 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-4 h-4 text-sky-300" />
                </div>
                <span className="text-xs font-semibold text-white/95">Chuẩn hóa sổ sách & Báo cáo điện tử</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Tag */}
          <div className="relative z-10 text-[11px] text-sky-200/70 flex items-center justify-between pt-6 border-t border-white/10">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Hệ thống Điều hành Trường học
            </span>
            <span className="font-medium text-sky-200/80">Phiên bản 2026</span>
          </div>
        </div>

        {/* ── RIGHT PANEL: Main Porcelain Form (Full width on mobile, 7 cols on desktop) ── */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-white/90 backdrop-blur-md relative z-20">

          {/* Mobile Header (Shown on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9.5 h-9.5 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-600/20">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain filter brightness-0 invert" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-700 truncate">CỔNG QUẢN LÝ GIÁO DỤC</h2>
              <p className="text-xs text-slate-500 font-medium">Hệ thống Điều hành Trường học</p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1.5">
              Đăng nhập
            </h2>
            <p className="text-sm text-slate-500 font-medium">Nhập tài khoản của bạn để truy cập hệ thống</p>
          </div>

          {/* Banners */}
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-sky-600 transition-colors pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="vudung@truong.edu.vn"
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/15 transition-all duration-200 outline-none shadow-inner shadow-slate-100/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mật khẩu
                </label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-sky-600 transition-colors pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 sm:py-3.5 rounded-xl text-sm font-medium text-slate-900 bg-slate-50/80 border border-slate-200 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/15 transition-all duration-200 outline-none shadow-inner shadow-slate-100/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 p-1.5 rounded-lg transition-all"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* CTA Button with Sheen Effect */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-600 hover:from-sky-500 hover:via-sky-600 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-sky-600/25 hover:shadow-sky-600/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer group relative overflow-hidden mt-2"
            >
              {/* Shimmer Highlight */}
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-600 font-medium">Hoặc</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Secondary Action */}
          <Link
            href="/register"
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-sky-600" />
            <span>Tạo tài khoản Giáo viên mới</span>
          </Link>

          {/* Security Note */}
          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Hệ thống bảo mật chuẩn hóa dành cho Cán bộ & Giáo viên
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
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
