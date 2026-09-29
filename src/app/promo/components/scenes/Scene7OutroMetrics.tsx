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
} from "lucide-react";
import Link from "next/link";
import WebBrowserFrame from "../WebBrowserFrame";
import SmartCursor from "../SmartCursor";

interface SceneProps {
  progress: number;
  onOpenScript?: () => void;
  onOpenDeck?: () => void;
}

export default function Scene7OutroMetrics({
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

  if (progress < 0.35) {
    const t = progress / 0.35;
    cursorX = 75 - t * 50; // moves to ~25 (ROI metric)
    cursorY = 22 + t * 16; // moves to ~38
    cursorLabel = "Tiết Kiệm 99% Thời Gian";
    isClicking = progress > 0.22 && progress < 0.26;
  } else if (progress < 0.7) {
    const t = (progress - 0.35) / 0.35;
    cursorX = 25 + t * 35; // moves to ~60 (Author & QR Card)
    cursorY = 38 + t * 30; // moves to ~68
    cursorLabel = "Tác Giả: Nguyễn Việt Tùng • qlthvn.com";
    isClicking = progress > 0.52 && progress < 0.56;
  } else {
    const t = (progress - 0.7) / 0.3;
    cursorX = 60 + t * 26; // moves to ~86 (Vào hệ thống CTA)
    cursorY = 68 + t * 4;  // moves to ~72
    cursorLabel = "Trải Nghiệm Trực Tiếp qlthvn.com";
    isClicking = progress > 0.82 && progress < 0.86;
  }

  const metrics = [
    {
      val: "15 Giây",
      label: "Xếp Thời Khóa Biểu AI",
      desc: "Nhanh hơn ~200x so với 3–5 ngày thủ công",
      color: "text-emerald-700",
      border: "border-emerald-200",
      bg: "bg-emerald-50/70",
      badge: "AI Solver",
    },
    {
      val: "Kỳ 3",
      label: "Cảnh Báo Sớm Sa Sút",
      desc: "Sớm 3–6 tháng bằng mô hình hồi quy OLS",
      color: "text-sky-700",
      border: "border-sky-200",
      bg: "bg-sky-50/70",
      badge: "Gauss & OLS",
    },
    {
      val: "Giảm 90%",
      label: "Chi Phí Sổ Sách Giấy Tờ",
      desc: "Số hóa 100% hồ sơ, sổ đầu bài, sổ điểm",
      color: "text-indigo-700",
      border: "border-indigo-200",
      bg: "bg-indigo-50/70",
      badge: "Không Giấy Tờ",
    },
    {
      val: "> 500 Giờ",
      label: "Tiết Kiệm Hành Chính / Năm",
      desc: "Giải phóng toàn diện thời gian cho giảng dạy",
      color: "text-amber-800",
      border: "border-amber-200",
      bg: "bg-amber-50/70",
      badge: "Hiệu Quả",
    },
  ];

  return (
    <WebBrowserFrame
      urlPath="/executive/roi-summary"
      activeNav="dashboard"
      campusName="Trường TH Phố Lu • Tổng Kết Giá Trị & Hiệu Quả"
    >
      <div className="relative w-full h-full flex flex-col justify-between p-3.5 sm:p-4 bg-slate-50 text-slate-900 overflow-hidden select-none font-sans">
        {/* Animated Smart Cursor */}
        <SmartCursor
          x={cursorX}
          y={cursorY}
          label={cursorLabel}
          isClicking={isClicking}
          visible={progress > 0.05}
        />

        {/* 1. Authentic Executive Header Bar */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-xs">
                <Award className="w-3 h-3 text-emerald-200" />
                Tổng Kết Giá Trị Định Lượng & ROI Thực Tiễn
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                Trường TH Phố Lu • 6 Phân Hiệu
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Hiệu Quả Chuyển Đổi Số Toàn Diện Trường Học
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                ROI Vượt Trội
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">
              Giải phóng người thầy khỏi áp lực hành chính • Kết nối 6 phân hiệu • 1.700 học sinh • 126 giáo viên
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              Hiệu Suất Vượt Bậc
            </span>
          </div>
        </div>

        {/* 2. 4 Core Quantitative Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-auto">
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between shadow-xs transition-all duration-500 ${
                m.border
              } ${m.bg} ${
                showMetrics ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
              }`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-base sm:text-xl font-black font-mono tracking-tight ${m.color}`}>
                    {m.val}
                  </span>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                    {m.badge}
                  </span>
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 mt-1 leading-snug">
                  {m.label}
                </h4>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 leading-tight">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 3. Author & System Identity & CTA Section */}
        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-xs transition-all duration-500 ${
            showCta ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Author Badge */}
          <div className="md:col-span-5 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0">
              NVT
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 truncate">
                  Tác giả: Nguyễn Việt Tùng
                </span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                  Kỹ Sư Hệ Thống
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Nền tảng Quản Lý Trường Học Số • https://qlthvn.com
              </p>
            </div>
          </div>

          {/* QR Code & Web Link Card */}
          <div className="md:col-span-3 flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 p-0.5 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <QrCode className="w-full h-full text-slate-800" />
            </div>
            <div className="text-[10px] leading-tight min-w-0">
              <div className="font-bold text-slate-800 truncate">Quét mã trải nghiệm</div>
              <span className="text-sky-700 font-mono text-[9px] font-bold">qlthvn.com</span>
            </div>
          </div>

          {/* CTA Actions */}
          <div className="md:col-span-4 flex items-center justify-end gap-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>Vào Hệ Thống</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {onOpenScript && (
              <button
                onClick={onOpenScript}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Kịch Bản</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Bottom Humane Bar */}
        <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[10px] text-slate-600 shadow-xs">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span className="font-medium">Bảo đảm quyền thụ hưởng giáo dục công bằng, chất lượng cao cho học sinh mọi miền Tổ quốc</span>
          </div>
          <span className="text-sky-700 font-mono font-bold">Trường TH Phố Lu, Bảo Thắng, Lào Cai</span>
        </div>
      </div>
    </WebBrowserFrame>
  );
}
