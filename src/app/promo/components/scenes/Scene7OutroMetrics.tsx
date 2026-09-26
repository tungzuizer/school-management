"use client";

import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, Award, Heart, ShieldCheck, Download, Play } from "lucide-react";
import Link from "next/link";

interface SceneProps {
  progress: number;
  onOpenScript?: () => void;
  onOpenDeck?: () => void;
}

export default function Scene7OutroMetrics({ progress, onOpenScript, onOpenDeck }: SceneProps) {
  const showMetrics = progress > 0.15;
  const showCta = progress > 0.55;

  const metrics = [
    {
      val: "15 Giây",
      label: "Xếp Thời Khóa Biểu Toàn Trường",
      desc: "Nhanh hơn ~200 lần so với 3-5 ngày xếp tay",
      color: "text-emerald-400",
      border: "border-emerald-500/40",
      bg: "bg-emerald-950/40",
    },
    {
      val: "Kỳ 3",
      label: "Cảnh Báo Học Sinh Sa Sút",
      desc: "Sớm hơn từ 3 đến 6 tháng để can thiệp kịp thời",
      color: "text-cyan-400",
      border: "border-cyan-500/40",
      bg: "bg-cyan-950/40",
    },
    {
      val: "Giảm 90%",
      label: "Chi Phí In Ấn & Sổ Sách",
      desc: "Số hóa toàn bộ hồ sơ, sổ đầu bài, sổ điểm",
      color: "text-purple-400",
      border: "border-purple-500/40",
      bg: "bg-purple-950/40",
    },
    {
      val: "> 500 Giờ",
      label: "Tiết Kiệm Hành Chính / Năm",
      desc: "Giải phóng người thầy để thăng hoa trong chuyên môn",
      color: "text-amber-400",
      border: "border-amber-500/40",
      bg: "bg-amber-950/40",
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 overflow-hidden select-none">
      {/* Background Grids & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#6366f115_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      <div className="absolute w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wider uppercase mb-1.5 animate-pulse">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>Bảng Vàng Định Lượng & Giá Trị Thực Tiễn</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Giải Phóng Người Thầy – Kiến Tạo Tương Lai
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
          Nền tảng quản trị trường học thông minh đa điểm trường: Tiết kiệm thời gian, tối ưu chi phí, nâng tầm chất lượng giáo dục
        </p>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl w-full my-2">
        {metrics.map((m, idx) => (
          <div
            key={m.label}
            className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all duration-700 ${
              m.border
            } ${m.bg} ${
              showMetrics ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
            style={{ transitionDelay: `${idx * 100}ms` }}
          >
            <div>
              <span className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${m.color}`}>
                {m.val}
              </span>
              <h4 className="text-xs md:text-sm font-bold text-white mt-1.5 leading-snug">
                {m.label}
              </h4>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 leading-tight">
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Action CTA Box */}
      <div
        className={`relative z-10 mt-6 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 ${
          showCta ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/40 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Trải Nghiệm Hệ Thống Ngay</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        {onOpenScript && (
          <button
            onClick={onOpenScript}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:scale-105"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Xem Kịch Bản & Pitch Deck</span>
          </button>
        )}
      </div>

      {/* Bottom Humane Tag */}
      <div className="relative z-10 mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
        <span>Bảo đảm quyền được thụ hưởng nền giáo dục công bằng, chất lượng cho học sinh mọi miền Tổ quốc</span>
      </div>
    </div>
  );
}
