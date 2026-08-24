"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Lock, AlertCircle, CheckCircle2, ShieldAlert, KeyRound } from "lucide-react";
import { changeOwnPassword } from "@/app/actions/user-password";

export default function ForcePasswordChangeModal() {
  const { data: session, update: updateSession } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mustChange = Boolean(session?.user?.mustChangePassword);

  if (!mustChange) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword === "abc123" || newPassword === "123456") {
      setError("Vui lòng đặt mật khẩu mới khác mật khẩu mặc định (abc123/123456)");
      return;
    }

    setLoading(true);
    const res = await changeOwnPassword(newPassword);
    setLoading(false);

    if (res.success) {
      await updateSession({ mustChangePassword: false });
      window.location.reload();
    } else {
      setError(res.error || "Không thể cập nhật mật khẩu");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-amber-200 animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 text-center">
          Yêu cầu Đổi Mật khẩu
        </h2>
        <p className="text-xs text-gray-600 text-center mt-2 leading-relaxed">
          Tài khoản của bạn đang sử dụng <strong className="text-amber-700 font-mono">Mật khẩu khởi tạo mặc định</strong>. Để đảm bảo an toàn bảo mật thông tin giáo dục, vui lòng đổi mật khẩu mới trước khi tiếp tục.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mật khẩu mới *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-medium"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                "Đang lưu..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Cập nhật mật khẩu & Tiếp tục
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-semibold text-xs transition-colors"
            >
              Đăng xuất tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
