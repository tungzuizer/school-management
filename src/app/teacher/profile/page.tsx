"use client";

import { useSession, signOut } from "next-auth/react";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  School,
  LogOut,
  Settings,
  Shield,
  Calendar,
} from "lucide-react";

export default function TeacherProfilePage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Giáo viên";
  const userEmail = session?.user?.email || "";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <span className="text-3xl font-bold text-emerald-600">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">{userName}</h1>
        <p className="text-sm text-gray-500">Giáo viên</p>
      </div>

      {/* Info cards */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl border-gray-200 divide-y divide-gray-100">
        <InfoRow icon={Mail} label="Email" value={userEmail || "—"} />
        <InfoRow icon={Phone} label="Điện thoại" value="—" />
        <InfoRow icon={BookOpen} label="Chuyên môn" value="—" />
        <InfoRow icon={School} label="Lớp chủ nhiệm" value="—" />
        <InfoRow icon={Calendar} label="Năm vào trường" value="—" />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl border-gray-200 text-gray-700 hover:bg-slate-950/80 transition">
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Cài đặt tài khoản</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl border-gray-200 text-gray-700 hover:bg-slate-950/80 transition">
          <Shield className="w-5 h-5 text-gray-400" />
          <span className="font-medium">Đổi mật khẩu</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 rounded-xl border border-red-200 text-red-600 hover:bg-red-100 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>

      {/* App version */}
      <p className="text-center text-xs text-gray-400 pt-2">
        School Management v1.0
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
