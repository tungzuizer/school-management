"use client";

import React from "react";
import { TrendingUp, AlertOctagon, LineChart, Award, HeartHandshake, CheckCircle2 } from "lucide-react";

interface SceneProps {
  progress: number;
}

export default function Scene5ExamAnalytics({ progress }: SceneProps) {
  const showCurve = progress > 0.15;
  const showAlert = progress > 0.45;
  const showIntervention = progress > 0.7;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-900 overflow-hidden select-none">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d415_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1.5">
          <LineChart className="w-3.5 h-3.5 text-cyan-400" />
          <span>Longitudinal Exam Analytics & Psychometrics</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Khoa Học Phân Tích Điểm Thi & <span className="text-cyan-400">Cảnh Báo Sớm Kỳ 3</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Chuẩn hóa phổ điểm Gauss, đo lường độ lệch chuẩn • Phát hiện học sinh sa sút sớm trước 3–6 tháng
        </p>
      </div>

      {/* Main Grid: Bell Curve & Early Warning */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-2">
        {/* Left: Gaussian Bell Curve SVG */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Phổ Điểm Chuẩn Hóa & Độ Lệch Chuẩn (σ)</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                σ = 1.24 (Phân phối chuẩn)
              </span>
            </div>

            {/* SVG Gaussian Curve */}
            <div className="relative h-44 w-full flex items-center justify-center pt-2">
              <svg className="w-full h-full" viewBox="0 0 320 140">
                {/* Grid lines */}
                <line x1="30" y1="120" x2="300" y2="120" stroke="#334155" strokeWidth="1.5" />
                <line x1="165" y1="20" x2="165" y2="120" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                {/* Shaded Area */}
                <path
                  d="M 30 120 Q 100 115 130 70 Q 165 15 200 70 Q 230 115 300 120 Z"
                  fill="url(#cyanGrad)"
                  opacity={showCurve ? 0.4 : 0}
                  className="transition-opacity duration-1000"
                />

                {/* Bell Curve Line */}
                <path
                  d="M 30 120 Q 100 115 130 70 Q 165 15 200 70 Q 230 115 300 120"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  className="transition-all duration-1000"
                />

                {/* Markers */}
                <circle cx="165" cy="20" r="4" fill="#38bdf8" />
                <text x="165" y="14" fill="#bae6fd" fontSize="9" textAnchor="middle" fontWeight="bold">
                  Trung vị (7.8đ)
                </text>

                {/* Score Labels */}
                <text x="30" y="134" fill="#64748b" fontSize="8">0đ</text>
                <text x="95" y="134" fill="#64748b" fontSize="8">Yếu (4đ)</text>
                <text x="165" y="134" fill="#64748b" fontSize="8">Khá (7đ)</text>
                <text x="235" y="134" fill="#64748b" fontSize="8">Giỏi (9đ)</text>
                <text x="295" y="134" fill="#64748b" fontSize="8">10đ</text>

                <defs>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Early Warning & Intervention Tracking */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {/* Card 1: Cảnh báo sớm Kỳ 3 */}
          <div
            className={`p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-xl shadow-xl transition-all duration-700 ${
              showAlert ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  CẢNH BÁO SỚM KỲ 3
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  Phát Hiện Sớm Trước 3 – 6 Tháng
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  Nhận diện học sinh có quỹ đạo trượt dốc (Declining Trajectory) ngay từ đầu năm thay vì chờ đến cuối kỳ.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Hồ sơ Can thiệp Sư phạm */}
          <div
            className={`p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-slate-900/90 border border-cyan-500/40 backdrop-blur-xl shadow-xl transition-all duration-700 delay-150 ${
              showIntervention ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                  HỒ SƠ CAN THIỆP SƯ PHẠM
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  Kèm Cặp & Ngăn Ngừa Bỏ Học
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  Tự động liên thông GVCN & Phụ huynh để lập kế hoạch phụ đạo 1-1, lấy lại sự tự tin cho học sinh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
