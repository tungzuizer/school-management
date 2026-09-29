"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  Sparkles,
  MessageSquare,
  Video,
  Mail,
  Award,
  CheckCircle2,
  TrendingUp,
  Download,
  Globe,
} from "lucide-react";

interface SocialMarketingKitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialMarketingKitModal({
  isOpen,
  onClose,
}: SocialMarketingKitModalProps) {
  const [activeTab, setActiveTab] = useState<
    "facebook" | "zalo" | "tiktok" | "email"
  >("facebook");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── TEMPLATE 1: FACEBOOK / FANPAGE / GROUP GIÁO VIÊN ──
  const facebookPost = `🔥 [ĐỘT PHÁ CÔNG NGHỆ GIÁO DỤC 2026] GIẢI PHÓNG NGƯỜI THẦY KHỎI "BIỂN" SỔ SÁCH GẤP ĐẦU — XẾP TKB 6 PHÂN HIỆU TRONG ĐÚNG 15 GIÂY! 🚀

Thầy cô và các nhà quản lý giáo dục có bao giờ tự hỏi:
👉 Tại sao bước sang kỷ nguyên AI mà chúng ta vẫn phải mất 3-5 ngày ròng rã xếp thời khóa biểu thủ công, vừa nhức đầu vừa dễ trùng lịch?
👉 Tại sao giáo viên vùng cao phải mang vác hàng chục cuốn sổ đầu bài giấy, di chuyển hàng chục cây số đường đèo hiểm trở giữa các điểm trường?
👉 Tại sao dữ liệu thi đua, sổ điểm và đánh giá chuẩn nghề nghiệp vẫn làm trên giấy tờ cồng kềnh, tiềm ẩn rủi ro thất lạc và sai lệch?

💡 CÂU TRẢ LỜI ĐÃ CÓ: Hệ thống Quản trị Trường học Thông minh Đa Điểm trường QLTHVN (https://qlthvn.com) — Nền tảng số hóa toàn diện tiên phong tại Việt Nam!

🌟 6 ĐIỂM MẠNH "SÁT THỦ" ĐÃ ĐƯỢC ĐỊNH LƯỢNG HÓA THỰC TẾ:
1️⃣ ⏱ AI SOLVER XẾP TKB 15 GIÂY: Giải quyết bài toán hàng ngàn ràng buộc phức tạp trong 15s (nhanh gấp 200 lần thủ công), 0% xung đột lịch, tự động gom lịch dạy an toàn cho giáo viên vùng cao.
2️⃣ 🏫 LIÊN THÔNG ĐA PHÂN HIỆU 100%: Đồng bộ dữ liệu thời gian thực giữa điểm trung tâm và toàn bộ 6 phân hiệu trên một màn hình Cockpit chỉ huy duy nhất.
3️⃣ 🔒 SỔ ĐẦU BÀI SỐ & AUDIT LOCK 4 CẤP: Ghi sổ 1 chạm trên điện thoại, quy trình thẩm định 4 cấp (GVBM ➔ GVCN ➔ PHT ➔ HT) và khóa niêm phong bất biến chống sửa số liệu.
4️⃣ 📊 8 CẢM BIẾN TELEMETRY & ĐỘNG CƠ THI ĐUA 0-105Đ: Giám sát nề nếp, chuyên cần 24/7, loại bỏ đánh giá cảm tính, tự động vinh danh Bục vàng Podium hàng tuần.
5️⃣ 📈 KHOA HỌC PHỔ GAUSS CẢNH BÁO SỚM KỲ 3: Phân tích 153.000 bài thi theo đường cong chuẩn hóa Gauss, phát hiện học sinh sa sút trước 3-6 tháng để lập hồ sơ can thiệp sư phạm 1-1.
6️⃣ 💰 TIẾT KIỆM >500 GIỜ HÀNH CHÍNH & CẮT GIẢM 90% CHI PHÍ IN ẤN: Chuẩn hóa 16 vai trò theo Thông tư 15/2024/TT-BGDĐT và chuẩn dữ liệu EMIS quốc gia.

🎬 Xem ngay Video Demo thực tế 25 phút & Video điện ảnh 120s tại:
👉 https://qlthvn.com/promo

💬 Hãy để lại bình luận hoặc nhắn tin trực tiếp để nhận tài khoản trải nghiệm thử nghiệm ngay hôm nay!

#QLTHVN #ChuyenDoiSoGiaoDuc #QuanLyTruongHoc #EdTechVietnam #XepTKBThongMinh #SoDauBaiDienTu #GiaiPhongNguoiThay`;

  // ── TEMPLATE 2: ZALO / BAN GIÁM HIỆU & HIỆU TRƯỞNG ──
  const zaloPost = `Kính gửi Quý Thầy/Cô Ban Giám Hiệu và Lãnh đạo Nhà trường,

Trân trọng gửi đến Quý Thầy/Cô giải pháp "Quản trị Trường học Thông minh Đa Điểm trường QLTHVN" (qlthvn.com) — Nền tảng số hóa đã được kiểm chứng thực tế tại các trường học có nhiều phân hiệu:

🎯 4 LỢI ÍCH TRỌNG TÂM DÀNH CHO LÃNH ĐẠO:
1. XẾP TKB AI TỰ ĐỘNG 15 GIÂY: Giải quyết triệt để nỗi lo xếp TKB đầu năm học và học kỳ mới, gom lịch dạy tối ưu cho giáo viên di chuyển giữa các điểm trường.
2. SỔ SÁCH SỐ & NIÊM PHONG 4 CẤP: Cắt giảm hoàn toàn sổ đầu bài giấy, kiểm toán số bất biến chống sửa số liệu điểm và sổ đầu bài.
3. ĐÁNH GIÁ CHUẨN TT15/2024: Tự động hóa 5 tiêu chuẩn 15 tiêu chí đánh giá chuẩn nghề nghiệp giáo viên, lưu trữ minh chứng số đầy đủ.
4. BÁO CÁO PHÂN TÍCH CHẤT LƯỢNG GAUSS: Phát hiện sớm nguy cơ học sinh sa sút học tập ngay từ Kỳ 3 để chỉ đạo chuyên môn kịp thời.

Quý Thầy/Cô vui lòng xem video giới thiệu chi tiết 25 tính năng và trải nghiệm hệ thống tại:
🌐 https://qlthvn.com/promo

Trân trọng cảm ơn!`;

  // ── TEMPLATE 3: TIKTOK / REELS 30S VIDEO CAPTION & SCRIPT ──
  const tiktokPost = `Bạn có tin 1 trường học 6 phân hiệu, 1.700 học sinh có thể xếp xong THỜI KHÓA BIỂU trong đúng 15 GIÂY? 🤯

Không còn cảnh 3-5 ngày thức trắng xếp tay, không còn lo trùng lịch!
Hệ thống QLTHVN (qlthvn.com) đã giải quyết toàn bộ bài toán quản lý trường học:
⚡ AI Xếp TKB 15 giây
⚡ Sổ đầu bài điện tử 1 chạm trên điện thoại
⚡ Phổ điểm Gauss cảnh báo sa sút học tập sớm
⚡ Khóa niêm phong chống sửa số liệu 4 cấp

👉 Xem full video trải nghiệm tại link bio / qlthvn.com/promo!

#qlthvn #chuyendoisogiaoduc #edtech #thayco #truonghoc #learnontiktok #congnghe`;

  // ── TEMPLATE 4: EMAIL GỬI PHÒNG GD&ĐT / BAN GIÁM HIỆU ──
  const emailTemplate = `Tiêu đề: [Đề xuất Giải pháp] Ứng dụng Nền tảng Quản trị Trường học Thông minh Đa Điểm trường QLTHVN

Kính gửi: Ban Giám Hiệu Trường [Tên Trường] / Lãnh đạo Phòng GD&ĐT [Tên Huyện/Thị xã],

Tôi xin trân trọng gửi tới Quý Cơ quan Bản đề xuất chuyển đổi số giáo dục với Nền tảng Quản trị Trường học Thông minh Đa Điểm trường QLTHVN (website: https://qlthvn.com).

Hệ thống được thiết kế đặc thù nhằm giải quyết dứt điểm các nút thắt trong quản lý trường học hiện nay:
1. Tự động hóa hoàn toàn xếp Thời khóa biểu bằng thuật toán AI trong 15 giây (0% xung đột, tối ưu di chuyển phân hiệu).
2. Số hóa 100% Sổ đầu bài điện tử, Hồ sơ kế hoạch bài dạy, tích hợp quy trình phê duyệt và khóa niêm phong dữ liệu 4 cấp (Audit Lock).
3. Đánh giá chuẩn nghề nghiệp giáo viên theo Thông tư số 15/2024/TT-BGDĐT với kho minh chứng số hóa minh bạch.
4. Ứng dụng mô hình phân tích phổ điểm Gauss trên 153.000 bài thi, cảnh báo sớm học sinh có nguy cơ sa sút học tập từ Kỳ 3.
5. Tiết kiệm ước tính trên 500 giờ làm việc hành chính/năm cho mỗi đơn vị và cắt giảm 90% chi phí in ấn sổ sách.

Kính mời Quý Cơ quan xem Báo cáo video chi tiết và Bộ Slide Pitch Deck tại đường dẫn:
👉 https://qlthvn.com/promo

Chúng tôi rất mong có cơ hội được phối hợp triển khai thử nghiệm tại đơn vị để hỗ trợ Quý Trường nâng cao hiệu quả quản trị và giải phóng áp lực hành chính cho đội ngũ người thầy.

Trân trọng kính thư,
[Họ và tên / Đơn vị phát triển QLTHVN]
Hotline/Zalo: 09xx xxx xxx • Email: contact@qlthvn.com`;

  const activeContent =
    activeTab === "facebook"
      ? facebookPost
      : activeTab === "zalo"
      ? zaloPost
      : activeTab === "tiktok"
      ? tiktokPost
      : emailTemplate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 p-1.5 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Bộ Mẫu Bài Đăng Tiếp Thị Marketing Có Sẵn</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Chuẩn 4 Nền Tảng
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sao chép 1 chạm để đăng ngay lên Facebook, Zalo BGH, TikTok Reels hoặc gửi Email
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeContent, activeTab)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              {copiedId === activeTab ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedId === activeTab ? "Đã sao chép!" : "Sao chép bài này"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-3 bg-slate-950/40 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("facebook")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "facebook"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Facebook / Group GV (Bản Dài)</span>
          </button>

          <button
            onClick={() => setActiveTab("zalo")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "zalo"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Zalo Ban Giám Hiệu</span>
          </button>

          <button
            onClick={() => setActiveTab("tiktok")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "tiktok"
                ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>TikTok / Reels (Viral 30s)</span>
          </button>

          <button
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "email"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Thư Đề Xuất Phòng GD / BGH</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="relative p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <pre className="text-xs sm:text-sm font-sans text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
              {activeContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Đã tích hợp đầy đủ 6 điểm mạnh, số liệu định lượng và hashtag chuẩn SEO</span>
          </div>
          <button
            onClick={() => handleCopy(activeContent, activeTab)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
          >
            {copiedId === activeTab ? "Đã sao chép vào Clipboard!" : "Sao Chép Mẫu Này"}
          </button>
        </div>
      </div>
    </div>
  );
}
