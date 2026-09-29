"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Play,
  Presentation,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  Globe,
  CheckCircle2,
  Share2,
  Clock,
  Layers,
  Copy,
  Check,
  Building2,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Cpu,
  BarChart3,
  BookmarkCheck,
} from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import PitchDeckView from "./components/PitchDeckView";
import ScriptModal from "./components/ScriptModal";
import SocialMarketingKitModal from "./components/SocialMarketingKitModal";

export default function PromoPage() {
  const [activeTab, setActiveTab] = useState<"video" | "deck">("video");
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [isMarketingKitOpen, setIsMarketingKitOpen] = useState<boolean>(false);
  const [copiedQuickId, setCopiedQuickId] = useState<string | null>(null);

  const handleQuickCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuickId(id);
    setTimeout(() => setCopiedQuickId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 p-1.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <img
              src="/logo.png"
              alt="QLTHVN Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                QLTHVN
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                qlthvn.com
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Hệ Thống Quản Lý Trường Học Thông Minh Đa Điểm Trường
            </span>
          </div>
        </Link>

        {/* Center Mode Switcher Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab("video")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "video"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trình Phát Video HD & Cinema</span>
          </button>

          <button
            onClick={() => setActiveTab("deck")}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "deck"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide Pitch Deck (10 Trang)</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMarketingKitOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
            title="Mẫu bài đăng Facebook, Zalo, TikTok, Email"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">Mẫu Bài Đăng Marketing</span>
          </button>

          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:scale-105"
            title="Kịch bản phân cảnh"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="hidden lg:inline">Kịch Bản Lời Bình</span>
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            <span>Đăng Nhập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Main Marketing Hero & Player Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center gap-12">
        {/* Hero Headings */}
        <div className="flex flex-col items-center text-center max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-xs font-bold tracking-wider uppercase shadow-md shadow-indigo-950">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Đột Phá Công Nghệ Giáo Dục Việt Nam 2026</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chuẩn Thông Tư 15/2024 & EMIS Quốc Gia</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Giải Phóng Người Thầy, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
              Xếp TKB 6 Phân Hiệu Trong 15 Giây!
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Nền tảng Quản trị Trường học Thông minh Đa Điểm trường <strong className="text-white">QLTHVN</strong> (qlthvn.com) — Giải pháp số hóa toàn diện giúp xoá bỏ 100% gánh nặng sổ sách giấy tờ, đồng bộ 6 phân hiệu thời gian thực và cảnh báo sớm sa sút học tập từ Kỳ 3.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                setActiveTab("video");
                window.scrollTo({ top: 380, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Xem Video Master 5 Phút (6 Điểm Mạnh)</span>
            </button>

            <button
              onClick={() => setIsMarketingKitOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs sm:text-sm font-bold transition-all hover:scale-105 shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>Lấy Mẫu Bài Đăng Marketing (Copy 1-Chạm)</span>
            </button>

            <button
              onClick={() => setActiveTab("deck")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs sm:text-sm font-bold transition-all hover:scale-105"
            >
              <Presentation className="w-4 h-4 text-indigo-400" />
              <span>Xem Slide Pitch Deck (10 Slide)</span>
            </button>
          </div>
        </div>

        {/* Player / Deck Viewport */}
        <div className="w-full flex justify-center">
          {activeTab === "video" ? (
            <VideoPlayer
              onOpenScript={() => setIsScriptModalOpen(true)}
              onOpenDeck={() => setActiveTab("deck")}
            />
          ) : (
            <PitchDeckView />
          )}
        </div>

        {/* ── SECTION: 6 ĐIỂM MẠNH SÁT THỦ (EXTREME CONTRAST BEFORE VS AFTER) ── */}
        <section className="w-full max-w-6xl mt-4 space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Sức Mạnh Vượt Trội Đã Kiểm Chứng Thực Tế</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              6 Điểm Mạnh "Sát Thủ" Định Lượng Hóa Của QLTHVN
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              So sánh trực tiếp giữa phương pháp quản lý thủ công truyền thống và nền tảng số hóa thông minh
            </p>
          </div>

          {/* 6 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: AI Timetable */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-emerald-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    ĐIỂM MẠNH #1
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                  AI Solver Xếp TKB 15 Giây
                </h3>
                <div className="text-3xl font-black font-mono text-emerald-400 my-2">
                  15s <span className="text-xs font-sans text-slate-400 font-normal">/ 0% xung đột lịch</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    Mất 3–5 ngày thức trắng xếp tay, 15–20% nguy cơ trùng tiết, giáo viên vùng cao phải chạy đi chạy lại đường đèo hiểm trở.
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-300">
                    <span className="font-bold text-emerald-400 block mb-0.5">✅ Với QLTHVN:</span>
                    Thuật toán AI giải hàng ngàn ràng buộc trong đúng 15 giây (nhanh gấp 200 lần), tự động gom lịch an toàn bảo vệ thầy cô.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Thuật toán Constraint Optimization</span>
                <span className="font-bold text-emerald-400">Nhanh gấp 200x</span>
              </div>
            </div>

            {/* Card 2: Multi-Campus Realtime Sync */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-blue-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
                    ĐIỂM MẠNH #2
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                  Liên Thông 6 Phân Hiệu 100%
                </h3>
                <div className="text-3xl font-black font-mono text-blue-400 my-2">
                  1.700 <span className="text-xs font-sans text-slate-400 font-normal">học sinh / 62 lớp / 126 GV</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    6 phân hiệu phân tán cô lập, thông tin gửi qua Zalo/giấy tờ rời rạc, Ban giám hiệu không nắm được tình hình điểm lẻ.
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-blue-300">
                    <span className="font-bold text-blue-400 block mb-0.5">✅ Với QLTHVN:</span>
                    Một màn hình Cockpit điều hành trung tâm đồng bộ 100% thời gian thực toàn bộ 6 phân hiệu, chỉ huy tức thì.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Phố Lu • An Tiến • Sơn Hải...</span>
                <span className="font-bold text-blue-400">Real-time 24/7</span>
              </div>
            </div>

            {/* Card 3: E-Journal & 4-Level Audit Lock */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-indigo-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                    ĐIỂM MẠNH #3
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                  Sổ Đầu Bài Số & Niêm Phong 4 Cấp
                </h3>
                <div className="text-3xl font-black font-mono text-indigo-400 my-2">
                  4 Cấp <span className="text-xs font-sans text-slate-400 font-normal">Audit Lock bất biến</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    Mỗi giáo viên gánh hàng chục cuốn sổ đầu bài giấy cồng kềnh, nguy cơ sửa chữa tẩy xóa số liệu và thất lạc.
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-indigo-300">
                    <span className="font-bold text-indigo-400 block mb-0.5">✅ Với QLTHVN:</span>
                    Ghi sổ 1 chạm trên điện thoại, quy trình thẩm định 4 cấp (GVBM ➔ GVCN ➔ PHT ➔ HT) và khóa niêm phong chống sửa.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Kiểm toán số bất biến</span>
                <span className="font-bold text-indigo-400">Chống sửa 100%</span>
              </div>
            </div>

            {/* Card 4: Telemetry 8 Sensors & Discipline Engine */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-amber-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800">
                    ĐIỂM MẠNH #4
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                  8 Cảm Biến Telemetry & Thi Đua
                </h3>
                <div className="text-3xl font-black font-mono text-amber-400 my-2">
                  0 – 105đ <span className="text-xs font-sans text-slate-400 font-normal">/ Vinh danh Bục Vàng</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    Chấm thi đua nề nếp cảm tính qua sổ tay cờ đỏ, dễ phát sinh tranh cãi và khiếu nại giữa các lớp chủ nhiệm.
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-900/50 text-amber-300">
                    <span className="font-bold text-amber-400 block mb-0.5">✅ Với QLTHVN:</span>
                    8 cảm biến tự động giám sát chuyên cần 24/7, định lượng 0-105đ chuẩn mực, tự động vinh danh Bục vàng Podium.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Giám sát nề nếp 24/7</span>
                <span className="font-bold text-amber-400">Minh bạch 360°</span>
              </div>
            </div>

            {/* Card 5: Gauss Curve & Early Warning */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-sky-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-sky-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800">
                    ĐIỂM MẠNH #5
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-sky-300 transition-colors">
                  Phổ Gauss Cảnh Báo Sớm Kỳ 3
                </h3>
                <div className="text-3xl font-black font-mono text-sky-400 my-2">
                  153.000 <span className="text-xs font-sans text-slate-400 font-normal">bài thi / OLS Regression</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    Đến cuối năm học thi xong mới biết học sinh yếu kém, lúc đó đã quá muộn để can thiệp bồi dưỡng.
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-900/50 text-sky-300">
                    <span className="font-bold text-sky-400 block mb-0.5">✅ Với QLTHVN:</span>
                    Phân tích phổ Gauss & hồi quy OLS phát hiện nguy cơ sa sút sớm trước 3-6 tháng, lập hồ sơ can thiệp 1-1.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Can thiệp sư phạm 1-1</span>
                <span className="font-bold text-sky-400">Báo trước 3–6 tháng</span>
              </div>
            </div>

            {/* Card 6: Time & Cost Savings */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-teal-500/40 backdrop-blur-xl flex flex-col justify-between hover:border-teal-400 transition-all shadow-xl group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 border border-teal-800">
                    ĐIỂM MẠNH #6
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition-colors">
                  Tiết Kiệm & Chuẩn Hóa 16 Vai Trò
                </h3>
                <div className="text-3xl font-black font-mono text-teal-400 my-2">
                  &gt; 500h <span className="text-xs font-sans text-slate-400 font-normal">/ Cắt giảm 90% in ấn</span>
                </div>

                {/* Contrast Box */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                    <span className="font-bold text-rose-400 block mb-0.5">❌ Trước đây (Thủ công):</span>
                    Chi phí in ấn sổ sách hàng chục triệu/năm, giáo viên kiệt sức vì việc hành chính giấy tờ vô bổ.
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-950/40 border border-teal-900/50 text-teal-300">
                    <span className="font-bold text-teal-400 block mb-0.5">✅ Với QLTHVN:</span>
                    Cắt giảm 90% in ấn, tiết kiệm hơn 500 giờ làm việc hành chính/năm, chuẩn hóa 16 vai trò theo TT15/2024.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Chuẩn Thông tư 15/2024</span>
                <span className="font-bold text-teal-400">Tiết kiệm 90% chi phí</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: READY-TO-POST MARKETING KIT BANNER ── */}
        <section className="w-full max-w-6xl p-8 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 backdrop-blur-xl">
          <div className="flex flex-col gap-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-600/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold w-fit">
              <Share2 className="w-3.5 h-3.5" />
              <span>Dành Cho Đội Ngũ Truyền Thông & Tiếp Thị Marketing</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Bộ Mẫu Bài Đăng Tiếp Thị Chuẩn SEO (Copy 1-Chạm)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Chúng tôi đã chuẩn bị sẵn 4 bộ mẫu nội dung tiếp thị được tối ưu hóa cho từng kênh: bài viết dài Facebook Group Giáo viên, tin nhắn Zalo gửi Ban Giám Hiệu, kịch bản video ngắn TikTok/Reels 30s và Thư đề xuất dự án gửi Phòng GD&ĐT.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 border border-blue-800">
                ✓ Facebook / Group GV (Bản Dài)
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800">
                ✓ Zalo Ban Giám Hiệu
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-pink-950 text-pink-300 border border-pink-800">
                ✓ TikTok / Reels 30s
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800">
                ✓ Thư Đề Xuất Phòng GD
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMarketingKitOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/40 transition-all hover:scale-105"
            >
              <Copy className="w-4 h-4" />
              <span>Mở Bộ Mẫu Đăng Bài Marketing</span>
            </button>
          </div>
        </section>

        {/* ── Call To Action Banner ── */}
        <section className="w-full max-w-6xl p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-white">
              Sẵn Sàng Trải Nghiệm Nền Tảng QLTHVN Trực Tiếp?
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Đăng nhập ngay để khám phá hệ thống điều hành 6 phân hiệu thực tế hoặc liên hệ với chúng tôi để nhận tài khoản thử nghiệm toàn diện.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/40 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Đăng Nhập Trải Nghiệm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 lg:px-8 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Hệ Thống Quản Lý Nhà Trường Thông Minh Đa Điểm Trường (QLTHVN — qlthvn.com). Tác giả: Nguyễn Việt Tùng.</p>
        <p className="mt-1 text-[11px]">Phát triển phục vụ chuyển đổi số giáo dục Việt Nam • Bảo đảm công bằng giáo dục mọi miền Tổ quốc.</p>
      </footer>

      {/* Script & Pitch Deck Modal */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />

      {/* Social Marketing Kit Modal */}
      <SocialMarketingKitModal
        isOpen={isMarketingKitOpen}
        onClose={() => setIsMarketingKitOpen(false)}
      />
    </div>
  );
}
