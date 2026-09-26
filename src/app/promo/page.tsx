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
} from "lucide-react";
import VideoPlayer from "./components/VideoPlayer";
import PitchDeckView from "./components/PitchDeckView";
import ScriptModal from "./components/ScriptModal";

export default function PromoPage() {
  const [activeTab, setActiveTab] = useState<"video" | "deck">("video");
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-white text-base">
              SM
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-300 transition-colors">
              SCHOOL MANAGEMENT
            </span>
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
            <span>Video Cinema (120s)</span>
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
            <span>Slide Pitch Deck</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsScriptModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:scale-105"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Kịch Bản & Lời Bình</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-center gap-10">
        {/* Hero Headings */}
        <div className="flex flex-col items-center text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-emerald-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Chiến Dịch Chuyển Đổi Số Giáo Dục Toàn Diện</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Giải Phóng Người Thầy, <span className="text-cyan-400">Kiến Tạo Tương Lai Số</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
            Khám phá bước chuyển đổi đột phá từ hồ sơ sổ sách giấy tờ sang làm việc trực tiếp, liên tục và tức thì trên nền tảng Quản trị Trường học Thông minh Đa điểm trường.
          </p>
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

        {/* ── Key Quantitative Pillars ── */}
        <section className="w-full max-w-6xl mt-4">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-black text-white">
              Bốn Trụ Cột Đột Phá Đã Được Định Lượng Hóa
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Dựa trên kết quả triển khai thực tế tại các cơ sở giáo dục đa điểm trường
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-emerald-400">15 Giây</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">Xếp TKB Tự Động</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tiết kiệm 99% thời gian so với 3-5 ngày xếp thủ công; 0% xung đột lịch dạy.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Gom lịch bảo vệ an toàn thầy cô
              </div>
            </div>

            {/* Metric 2 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-amber-400">0 – 105đ</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">Động Cơ Thi Đua Nề Nếp</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Quét 8 cảm biến real-time; lượng hóa tự động từng tiết học, minh bạch 360 độ.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Bảng vàng Podium vinh danh hằng ngày
              </div>
            </div>

            {/* Metric 3 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-cyan-400">Kỳ 3</span>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">Cảnh Báo Sớm 3–6 Tháng</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Phân tích phổ điểm Gauss, đo độ lệch chuẩn σ và phát hiện nguy cơ sa sút sớm.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lập Hồ sơ can thiệp sư phạm kịp thời
              </div>
            </div>

            {/* Metric 4 */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black font-mono text-purple-400">&gt; 500h</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <h4 className="font-bold text-white text-sm mt-2">Tiết Kiệm Hành Chính / Năm</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Cắt giảm 90% chi phí giấy tờ, mực in; khóa niêm phong thẩm định 4 cấp bất biến.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% kiểm toán số chống sửa dữ liệu
              </div>
            </div>
          </div>
        </section>

        {/* ── Call To Action Banner ── */}
        <section className="w-full max-w-6xl p-8 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-white">
              Sẵn Sàng Chuyển Đổi Số Toàn Diện Cho Trường Học Của Bạn?
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Trải nghiệm ngay hệ thống quản trị trường học thông minh thế hệ mới hoặc liên hệ với đội ngũ chuyên gia để được tư vấn lộ trình chuyển đổi số chuẩn hóa.
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
        <p>© 2026 Hệ Thống Quản Lý Nhà Trường Thông Minh Đa Điểm Trường (`School Management Platform`). Tác giả: Nguyễn Việt Tùng.</p>
        <p className="mt-1 text-[11px]">Phát triển phục vụ chuyển đổi số giáo dục Việt Nam • Bảo đảm công bằng giáo dục mọi miền Tổ quốc.</p>
      </footer>

      {/* Script & Pitch Deck Modal */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
}
