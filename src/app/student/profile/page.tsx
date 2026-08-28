"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  Mail,
  School,
  LogOut,
  Shield,
  Sparkles,
  ChevronRight,
  Zap,
  Trophy,
  Star,
} from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import AvatarUploader from "@/components/ui/AvatarUploader";

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Học sinh";
  const userEmail = session?.user?.email || "";
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-6">

      {/* ===== IDENTITY HERO CARD ===== */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl animate-hero-reveal">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              <AvatarUploader
                currentImage={session?.user?.image}
                name={userName}
                size="lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-1">Học sinh THPT</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{userName}</h1>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                  Đang học tập
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-400/25 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-200 border border-emerald-400/30">
                  <Star className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300" />
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          {/* Motivation strip */}
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
              <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-300 shrink-0" />
              <p className="text-xs font-bold text-white/90 leading-relaxed">
                "Học hỏi không phải để biết nhiều hơn, mà để sống tốt hơn." — Tiếp tục cố gắng mỗi ngày!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTACT INFO CARD ===== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden card-reveal card-reveal-1">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Thông tin cá nhân</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <ProfileRow icon={Mail} iconColor="text-blue-600" iconBg="bg-blue-50" label="Email" value={userEmail || "—"} />
          <ProfileRow icon={User} iconColor="text-indigo-600" iconBg="bg-indigo-50" label="Họ và tên" value={userName} />
          <ProfileRow icon={School} iconColor="text-emerald-600" iconBg="bg-emerald-50" label="Lớp học" value="—" />
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-2 gap-3 card-reveal card-reveal-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-3 px-4 py-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
            <Shield className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Đổi mật khẩu</p>
            <p className="text-xs text-slate-400 font-semibold">Bảo mật tài khoản</p>
          </div>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-4 bg-rose-50 rounded-3xl border border-rose-200/80 shadow-sm hover:shadow-md hover:bg-rose-100 hover:border-rose-300 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-600 transition-colors shrink-0">
            <LogOut className="w-4 h-4 text-rose-600 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-black text-rose-800">Đăng xuất</p>
            <p className="text-xs text-rose-400 font-semibold">Kết thúc phiên</p>
          </div>
        </button>
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <Zap className="w-3 h-3 text-blue-400" />
          School Management
        </div>
        <span className="text-slate-200">·</span>
        <span className="text-xs text-slate-400 font-semibold">v1.0</span>
        <span className="text-slate-200">·</span>
        <button className="flex items-center gap-0.5 text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors cursor-pointer">
          Trợ giúp <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}