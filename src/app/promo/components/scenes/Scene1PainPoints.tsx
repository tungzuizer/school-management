"use client";

import React, { useEffect, useState } from "react";
import { FileText, Clock, MapPin, Award, AlertTriangle, XCircle, TrendingDown } from "lucide-react";

interface SceneProps {
  progress: number; // 0 to 1 inside this scene
}

export default function Scene1PainPoints({ progress }: SceneProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(t);
  }, []);

  const card1Visible = progress > 0.08;
  const card2Visible = progress > 0.25;
  const card3Visible = progress > 0.45;
  const card4Visible = progress > 0.65;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 overflow-hidden select-none">
      {/* Background Animated Fog & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#f43f5e15_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Tag */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wider uppercase mb-2 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Thực Trạng Quản Trị Truyền Thống</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
          5 Nút Thắt Nan Giải Đè Nặng Lên Người Thầy
        </h2>
        <p className="text-sm md:text-base text-slate-400 mt-2 max-w-2xl">
          Khi quản trị trường học còn phụ thuộc vào hồ sơ sổ sách giấy tờ và khoảng cách địa lý chia cắt
        </p>
      </div>

      {/* 4 Pain Points Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
        {/* Pain Point 1: Gánh nặng sổ sách */}
        <div
          className={`p-4 rounded-xl border transition-all duration-700 backdrop-blur-md ${
            card1Visible
              ? "opacity-100 translate-y-0 bg-slate-900/80 border-rose-500/40 shadow-lg shadow-rose-950/50"
              : "opacity-0 translate-y-6 bg-slate-900/30 border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Nút thắt #1
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-100">
                  Gánh Nặng Sổ Sách Giấy Tờ Thủ Công
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Sổ đầu bài, sổ điểm, sổ báo giảng viết tay 100+ trang; gom duyệt chậm trễ, tiêu tốn hàng triệu đồng chi phí in ấn mỗi năm.
              </p>
            </div>
          </div>
        </div>

        {/* Pain Point 2: Xếp TKB 3-5 ngày */}
        <div
          className={`p-4 rounded-xl border transition-all duration-700 backdrop-blur-md ${
            card2Visible
              ? "opacity-100 translate-y-0 bg-slate-900/80 border-amber-500/40 shadow-lg shadow-amber-950/50"
              : "opacity-0 translate-y-6 bg-slate-900/30 border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Nút thắt #2
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-100">
                  Áp Lực Xếp Thời Khóa Biểu Thủ Công
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Mất 3 đến 5 ngày căng thẳng; dễ trùng lịch giáo viên, trùng phòng chức năng và phát sinh xung đột lịch liên trường.
              </p>
            </div>
          </div>
        </div>

        {/* Pain Point 3: Đứt gãy địa lý điểm trường lẻ */}
        <div
          className={`p-4 rounded-xl border transition-all duration-700 backdrop-blur-md ${
            card3Visible
              ? "opacity-100 translate-y-0 bg-slate-900/80 border-cyan-500/40 shadow-lg shadow-cyan-950/50"
              : "opacity-0 translate-y-6 bg-slate-900/30 border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Nút thắt #3
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-100">
                  Chia Cắt Địa Lý & Đứt Gãy Dữ Liệu
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Các điểm trường lẻ phân tán qua đường đèo dốc; BGH không nắm bắt kịp thời sĩ số, chuyên cần và tiến độ giảng dạy hôm nay.
              </p>
            </div>
          </div>
        </div>

        {/* Pain Point 4: Thi đua cảm tính & Phát hiện muộn */}
        <div
          className={`p-4 rounded-xl border transition-all duration-700 backdrop-blur-md ${
            card4Visible
              ? "opacity-100 translate-y-0 bg-slate-900/80 border-purple-500/40 shadow-lg shadow-purple-950/50"
              : "opacity-0 translate-y-6 bg-slate-900/30 border-slate-800"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  Nút thắt #4 & #5
                </span>
                <h3 className="text-sm md:text-base font-bold text-slate-100">
                  Thi Đua Cảm Tính & Sa Sút Phát Hiện Muộn
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                Bình xét dồn cục cuối kỳ; học sinh sa sút học lực chỉ được phát hiện khi đã quá muộn để can thiệp kịp thời.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Impact Metric Pill */}
      <div
        className={`relative z-10 mt-6 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-rose-900/30 border border-rose-500/40 text-rose-300 text-xs md:text-sm font-medium transition-all duration-700 ${
          progress > 0.8 ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>Hậu quả: Lãng phí hơn <strong>500 giờ hành chính/năm</strong> & hàng chục triệu chi phí giấy tờ in ấn</span>
      </div>
    </div>
  );
}
