"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Mail,
  Phone,
  BookOpen,
  School,
  LogOut,
  Shield,
  Calendar,
  Camera,
  Star,
  Award,
  Zap,
  ChevronRight,
  Building2,
} from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import { getTeacherProfile } from "./actions";

interface TeacherProfileData {
  name: string;
  email: string;
  phone: string;
  specialty: string;
  homeroomClass: string;
  yearJoined: string;
  schoolName: string;
}

export default function TeacherProfilePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Giáo viên";
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);

  useEffect(() => {
    getTeacherProfile().then((data) => {
      if (data) setProfile(data);
    });
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const yearsOfService = profile?.yearJoined
    ? new Date().getFullYear() - parseInt(profile.yearJoined)
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-6">

      {/* ===== IDENTITY HERO CARD ===== */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl animate-hero-reveal">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(165,180,252,0.25),transparent_55%)]" />
        <div className="absolute -right-16 -top-16 w-52 h-52 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-2xl shadow-indigo-900/40">
                <span className="text-3xl font-black text-white">{getInitials(userName)}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-indigo-700 shadow-sm pulse-dot" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-1">Giáo viên</p>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{userName}</h1>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20">
                  <BookOpen className="w-3.5 h-3.5 text-violet-300" />
                  {profile?.specialty || "Chuyên môn"}
                </span>
                {profile?.homeroomClass && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20">
                    <School className="w-3.5 h-3.5 text-emerald-300" />
                    CN: {profile.homeroomClass}
                  </span>
                )}
                {yearsOfService !== null && yearsOfService >= 0 && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20">
                    <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    {yearsOfService} năm công tác
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Năm vào trường", value: profile?.yearJoined || "—", icon: Calendar },
              { label: "Lớp chủ nhiệm", value: profile?.homeroomClass || "—", icon: Building2 },
              { label: "Chuyên môn", value: profile?.specialty ? profile.specialty.split(" ").slice(-1)[0] : "—", icon: Award },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 space-y-1">
                  <Icon className="w-4 h-4 text-indigo-300 mx-auto" />
                  <p className="text-base font-black text-white">{stat.value}</p>
                  <p className="text-[10px] font-bold text-indigo-300">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== CONTACT INFO CARD ===== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden card-reveal card-reveal-1">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Thông tin liên hệ</h2>
        </div>
        <div className="divide-y divide-slate-50">
          <ProfileRow icon={Mail} iconColor="text-blue-600" iconBg="bg-blue-50" label="Email" value={profile?.email || "—"} />
          <ProfileRow icon={Phone} iconColor="text-emerald-600" iconBg="bg-emerald-50" label="Điện thoại" value={profile?.phone || "—"} />
          <ProfileRow icon={BookOpen} iconColor="text-violet-600" iconBg="bg-violet-50" label="Chuyên môn" value={profile?.specialty || "—"} />
          <ProfileRow icon={School} iconColor="text-indigo-600" iconBg="bg-indigo-50" label="Lớp chủ nhiệm" value={profile?.homeroomClass || "Chưa phân công"} />
          <ProfileRow icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" label="Năm vào trường" value={profile?.yearJoined || "—"} />
        </div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="grid grid-cols-2 gap-3 card-reveal card-reveal-2">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-3 px-4 py-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shrink-0">
            <Shield className="w-4.5 h-4.5 text-indigo-600 group-hover:text-white transition-colors" style={{ width: "1.1rem", height: "1.1rem" }} />
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

      {/* Keyboard shortcut strip */}
      <div className="flex items-center justify-center gap-4 py-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <Zap className="w-3 h-3 text-indigo-400" />
          School Management
        </div>
        <span className="text-slate-200">·</span>
        <span className="text-xs text-slate-400 font-semibold">v1.0</span>
        <span className="text-slate-200">·</span>
        <button className="flex items-center gap-0.5 text-xs text-indigo-500 font-bold hover:text-indigo-700 transition-colors cursor-pointer">
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