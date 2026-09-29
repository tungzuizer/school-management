"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Award,
  Heart,
  ShieldCheck,
  Download,
  Play,
  TrendingUp,
  User,
  QrCode,
  ExternalLink,
  Zap,
  Building2,
  FileCheck2,
  BarChart3,
  Clock,
  Layers,
} from "lucide-react";
import Link from "next/link";
import WebBrowserFrame from "../WebBrowserFrame";
import SmartCursor from "../SmartCursor";

interface SceneProps {
  progress: number;
  onOpenScript?: () => void;
  onOpenDeck?: () => void;
}

export default function Scene6SavingsTT15({
  progress,
  onOpenScript,
  onOpenDeck,
}: SceneProps) {
  const showMetrics = progress > 0.15;
  const showCta = progress > 0.45;

  // Calculate dynamic cursor trajectory
  let cursorX = 75;
  let cursorY = 22;
  let cursorLabel = "";
  let isClicking = false;

  if (progress < 0.3) {
    const t = progress / 0.3;
    cursorX = 75 - t * 50; // moves to ~25 (ROI metric)
    cursorY = 22 + t * 16; // moves to ~38
    cursorLabel = "Tiết Kiệm >500 Giờ Hành Chính/Năm";
    isClicking = progress > 0.18 && progress < 0.24;
  } else if (progress < 0.6) {
    const t = (progress - 0.3) / 0.3;
    cursorX = 25 + t * 35; // moves to ~60 (TT15 Standard)
    cursorY = 38 + t * 25; // moves to ~63
    cursorLabel = "Chuẩn Hóa 16 Vai Trò Theo TT15/2024 & EMIS";
    isClicking = progress > 0.45 && progress < 0.52;
  } else {
    const t = (progress - 0.6) / 0.4;
    cursorX = 60 + t * 26; // moves to ~86 (CTA)
    cursorY = 63 + t * 8;  // moves to ~71
    cursorLabel = "Trải Nghiệm Trực Tiếp qlthvn.com";
    isClicking = progress > 0.82 && progress < 0.88;
  }

  const metrics = [
    {
      val: "15 Giây",
      label: "AI Xếp Thời Khóa Biểu",
      desc: "Nhanh gấp 200 lần xếp thủ công, 0% xung đột",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/40",
      badge: "AI Solver",
    },
    {
      val: "6 Phân Hiệu",
      label: "Liên Thông 100% Realtime",
      desc: "Đồng bộ 1.700 HS, 126 GV trên Cockpit chỉ huy",
      color: "text-sky-400",
      border: "border-sky-500/30",
      bg: "bg-sky-950/40",
      badge: "Đa Điểm Trường",
    },
    {
      val: "Cắt Giảm 90%",
      label: "Chi Phí Sổ Sách In Ấn",
      desc: "Audit Lock 4 cấp, số hóa sổ đầu bài & giáo án",
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-950/40",
      badge: "Audit Lock 4 Cấp",
    },
    {
      val: "> 500 Giờ",
      label: "Tiết Kiệm Hành Chính / Năm",
      desc: "Chuẩn hóa 16 vai trò theo TT15/2024 & EMIS",
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-950/40",
      badge: "Định Lượng Thực Tế",
    },
  ];

  return (
    <WebBrowserFrame
      urlPath="/admin/dashboard"
      activeNav="dashboard"
      title="Tổng Kết 6 Điểm Mạnh Sát Thủ & ROI Định Lượng"
      campusName="QLTHVN • Nền Tảng Quản Trị Trường Học Số"
    >
      <div className="relative w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 p-4 md:p-6 flex flex-col justify-between overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Top Header ── */}
        <div className="relative z-10 text-center space-y-1.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Điểm Mạnh #6: Hiệu Quả Định Lượng & Chuẩn Hóa Quốc Gia</span>
          </div>
          <h2 className="text-lg md:text-2xl font-black text-white tracking-tight">
            Giải Phóng Toàn Diện Người Thầy • Chuẩn Hóa Thông Tư 15/2024
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mx-auto line-clamp-1">
            Chuyển giao quyền lực từ thủ công giấy tờ sang nền tảng số hóa tự động hóa minh bạch
          </p>
        </div>

        {/* ── 4 Key Quantified ROI Cards ── */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 my-auto">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border ${m.border} ${m.bg} backdrop-blur-md flex flex-col justify-between transition-all duration-500 transform shadow-lg ${
                showMetrics
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-700/60">
                  {m.badge}
                </span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${m.color}`} />
              </div>

              <div>
                <div className={`text-lg md:text-xl font-black ${m.color} tracking-tight`}>
                  {m.val}
                </div>
                <div className="text-xs font-bold text-white mt-0.5">{m.label}</div>
                <div className="text-[10px] text-slate-300 mt-1 leading-tight line-clamp-2">
                  {m.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Author, TT15 Badge & Action CTAs ── */}
        <div
          className={`relative z-10 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl transition-all duration-700 shadow-2xl ${
            showCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Author info & TT15 certification */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  Tác giả: Nguyễn Việt Tùng
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800">
                  TT15/2024 & EMIS
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                Chuyên gia CĐS Giáo Dục • Nền tảng QLTHVN (qlthvn.com)
              </p>
            </div>
          </div>

          {/* Interactive CTAs */}
          <div className="flex items-center gap-2">
            {onOpenScript && (
              <button
                onClick={onOpenScript}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xem Kịch Bản</span>
              </button>
            )}

            {onOpenDeck && (
              <button
                onClick={onOpenDeck}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Pitch Deck</span>
              </button>
            )}

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <span>Vào Hệ Thống Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dynamic Cursor Simulation */}
        <SmartCursor
          x={cursorX}
          y={cursorY}
          label={cursorLabel}
          isClicking={isClicking}
        />
      </div>
    </WebBrowserFrame>
  );
}
