"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function UnapprovedBanner() {
  const { data: session } = useSession();

  if (!session?.user || session.user.isApproved !== false) {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-50/95 border border-amber-300/80 text-amber-900 shadow-sm relative overflow-hidden">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-700 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-amber-950">
              Tài khoản đang chờ phê duyệt từ Quản trị viên / Ban Giám hiệu
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-200/80 text-amber-800 border border-amber-300">
              Chưa có dữ liệu
            </span>
          </div>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            Bạn đã đăng nhập thành công. Do tài khoản chưa được <strong>phê duyệt chính thức</strong>, bạn chưa thể xem dữ liệu ngành (học sinh, giáo viên, báo cáo, phân công...).
            Dữ liệu sẽ <strong>tự động đồng bộ và hiển thị đầy đủ</strong> ngay khi Quản trị viên duyệt tài khoản của bạn.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0 cursor-pointer"
          title="Tải lại trang để kiểm tra trạng thái phê duyệt"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Kiểm tra lại</span>
        </button>
      </div>
    </div>
  );
}
