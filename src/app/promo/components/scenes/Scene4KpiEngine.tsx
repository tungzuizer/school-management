"use client";

import React from "react";
import { Trophy, Activity, Radio, AlertTriangle, CheckCircle, TrendingUp, Users, Award } from "lucide-react";

interface SceneProps {
  progress: number;
}

export default function Scene4KpiEngine({ progress }: SceneProps) {
  const showTelemetry = progress > 0.15;
  const showPodium = progress > 0.45;
  const showSensors = progress > 0.7;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-amber-950/40 to-slate-900 overflow-hidden select-none">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#f59e0b15_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-1.5">
          <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Real-Time Emulation Engine</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Cockpit Điều Hành & Động Cơ Thi Đua <span className="text-amber-400">0 – 105đ</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Quét sống 8 cảm biến dữ liệu • Xóa bỏ bình xét dồn cục cảm tính • Bảng vàng minh bạch 360 độ
        </p>
      </div>

      {/* Main Grid: Telemetry & Podium */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-2">
        {/* Left: 8 Live Telemetry Sensors Matrix */}
        <div className="md:col-span-6 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>8 Cảm Biến Telemetry Quét Sống (Real-Time)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              {[
                { name: "Chuyên cần toàn trường", val: "98.6%", status: "OK", color: "text-emerald-400" },
                { name: "Tỷ lệ đi học muộn", val: "0.4%", status: "Tốt", color: "text-emerald-400" },
                { name: "Sổ đầu bài cập nhật", val: "100%", status: "Đạt", color: "text-cyan-400" },
                { name: "Vi phạm kỷ luật", val: "0 ca", status: "An toàn", color: "text-emerald-400" },
                { name: "Tiết dạy chuyên môn", val: "48/48", status: "Đủ", color: "text-amber-400" },
                { name: "Khen thưởng đột xuất", val: "+5 phiếu", status: "Thưởng", color: "text-amber-300" },
                { name: "Cơ sở vật chất", val: "100% OK", status: "Ổn định", color: "text-emerald-400" },
                { name: "Cảnh báo nề nếp", val: "1 lớp", status: "Lưu ý", color: "text-amber-400" },
              ].map((s, idx) => (
                <div
                  key={s.name}
                  className={`p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between transition-all duration-500 ${
                    showTelemetry ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <span className="text-[11px] text-slate-400 truncate">{s.name}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-sm font-black font-mono ${s.color}`}>{s.val}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700/80 text-slate-300">
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Podium Top 3 & Emulation Class Rankings */}
        <div className="md:col-span-6 flex flex-col gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Bảng Vàng Thi Đua Nề Nếp Hôm Nay</span>
              </div>
              <span className="text-[11px] font-mono text-amber-300">Thang 0 - 105đ</span>
            </div>

            {/* Podium Visual */}
            <div className="flex items-end justify-center gap-3 pt-6 pb-2 px-4">
              {/* 2nd Place */}
              <div
                className={`flex flex-col items-center transition-all duration-700 ${
                  showPodium ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-400 flex items-center justify-center text-xs font-bold text-white shadow-lg mb-1">
                  2
                </div>
                <span className="text-xs font-bold text-slate-200">Lớp 8B</span>
                <span className="text-[11px] font-mono font-bold text-slate-300">99.0đ</span>
                <div className="w-16 h-16 rounded-t-lg bg-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-100 mt-1">
                  Tốt
                </div>
              </div>

              {/* 1st Place (Champion) */}
              <div
                className={`flex flex-col items-center transition-all duration-700 delay-150 ${
                  showPodium ? "opacity-100 translate-y-0 scale-105" : "opacity-0 translate-y-12"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-amber-500 border border-amber-300 flex items-center justify-center text-sm font-black text-slate-950 shadow-lg shadow-amber-500/30 mb-1">
                  👑 1
                </div>
                <span className="text-xs font-bold text-amber-300">Lớp 9A</span>
                <span className="text-xs font-mono font-black text-amber-400">103.5đ</span>
                <div className="w-20 h-24 rounded-t-lg bg-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-200 mt-1 shadow-lg">
                  Xuất Sắc
                </div>
              </div>

              {/* 3rd Place */}
              <div
                className={`flex flex-col items-center transition-all duration-700 delay-300 ${
                  showPodium ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-800 border border-amber-600 flex items-center justify-center text-xs font-bold text-amber-100 shadow-lg mb-1">
                  3
                </div>
                <span className="text-xs font-bold text-slate-200">Lớp 7A</span>
                <span className="text-[11px] font-mono font-bold text-amber-500">96.5đ</span>
                <div className="w-16 h-12 rounded-t-lg bg-amber-950/70 flex items-center justify-center text-xs font-bold text-amber-400 mt-1">
                  Xuất Sắc
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
