"use client";

import React from "react";
import { Sparkles, Laptop, Smartphone, ShieldCheck, Zap, Layers, Server, Globe } from "lucide-react";

interface SceneProps {
  progress: number;
}

export default function Scene2Solution({ progress }: SceneProps) {
  const showCenter = progress > 0.1;
  const showFeatures = progress > 0.4;
  const showComparison = progress > 0.65;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 overflow-hidden select-none">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#6366f118_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header Tag */}
      <div className="relative z-10 flex flex-col items-center text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Bước Chuyển Mình Lịch Sử</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Hệ Thống Quản Lý Nhà Trường Thông Minh
        </h2>
        <p className="text-sm md:text-base text-indigo-200/80 mt-2 max-w-2xl font-medium">
          Nền tảng vận hành trực tiếp, liên tục và tức thì trên không gian số cho các cơ sở giáo dục đa điểm trường
        </p>
      </div>

      {/* Main Core Architecture Animation */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
        {/* Card 1: 100% Trực tuyến */}
        <div
          className={`p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-xl shadow-xl transition-all duration-700 ${
            showFeatures ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-3 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
            Làm Việc Tức Thì 100%
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sổ đầu bài, sổ điểm, chấm công và duyệt báo cáo hoạt động liên tục 24/7 trên môi trường Web, loại bỏ hoàn toàn việc chờ đợi giấy tờ.
          </p>
        </div>

        {/* Card 2: Trung tâm Đa Điểm Trường */}
        <div
          className={`p-5 rounded-2xl bg-gradient-to-b from-indigo-900/50 to-slate-900/90 border border-indigo-400/50 backdrop-blur-xl shadow-2xl transition-all duration-700 delay-100 ${
            showFeatures ? "opacity-100 translate-y-0 scale-105" : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-3 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
            Xóa Nhòa Rào Cản Địa Lý
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed">
            Kết nối liền mạch Điểm trường chính với toàn bộ Điểm lẻ xa xôi. Ban Giám hiệu theo dõi bức tranh toàn cảnh chỉ trên một màn hình duy nhất.
          </p>
        </div>

        {/* Card 3: Thẩm định & Bảo mật */}
        <div
          className={`p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-xl shadow-xl transition-all duration-700 delay-200 ${
            showFeatures ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-1.5">
            Kiểm Toán Số Bất Biến
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Quy trình thẩm định 4 cấp, niêm phong khóa dữ liệu điện tử, chống chỉnh sửa số liệu tùy tiện, chuẩn hóa theo quy chuẩn của Bộ GD&ĐT.
          </p>
        </div>
      </div>

      {/* Breakthrough Banner */}
      <div
        className={`relative z-10 mt-6 max-w-2xl w-full p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-400/40 flex items-center justify-between text-indigo-200 transition-all duration-700 ${
          showComparison ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/40 flex items-center justify-center text-indigo-300 shrink-0 font-black">
            2.0
          </div>
          <span className="text-xs md:text-sm font-semibold text-slate-100">
            Mô hình Quản trị Trường học Số Thế hệ Mới: <strong>Chính xác • Khoa học • Nhân văn</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 shrink-0">
          <Laptop className="w-4 h-4" />
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Đồng bộ Cloud</span>
        </div>
      </div>
    </div>
  );
}
