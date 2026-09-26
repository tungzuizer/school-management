"use client";

import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, Shield, Calendar, Sparkles, Navigation, AlertCircle } from "lucide-react";

interface SceneProps {
  progress: number;
}

export default function Scene3Timetable({ progress }: SceneProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (progress < 0.1) {
      setSecondsRemaining(15);
      setIsDone(false);
    } else if (progress < 0.6) {
      const countdown = Math.max(0, Math.round(15 - ((progress - 0.1) / 0.5) * 15));
      setSecondsRemaining(countdown);
      setIsDone(countdown === 0);
    } else {
      setSecondsRemaining(0);
      setIsDone(true);
    }
  }, [progress]);

  const showGrid = progress > 0.2;
  const showSafety = progress > 0.5;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-900 overflow-hidden select-none">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98118_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10 flex flex-col items-center text-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Đột Phá Thuật Toán Xếp TKB Đa Điểm Trường</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
          Xếp Thời Khóa Biểu Tự Động Trong <span className="text-emerald-400">15 Giây</span>
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-xl">
          Tiết kiệm 99% thời gian so với 3–5 ngày xếp tay truyền thống • Triệt tiêu 100% lỗi trùng lịch
        </p>
      </div>

      {/* Main Dynamic Timetable Demo Matrix & Timer */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-2">
        {/* Left: 15s Countdown & Status Dial */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-xl">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Circular track */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-emerald-400 transition-all duration-300"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={264 * (secondsRemaining / 15)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono text-emerald-300 tracking-tight">
                00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {isDone ? "HOÀN TẤT" : "ĐANG XỬ LÝ"}
              </span>
            </div>
          </div>

          <div className="mt-4 w-full flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Trùng lịch:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 0% (Triệt tiêu)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">Tốc độ cải thiện:</span>
              <span className="font-bold text-cyan-400">Nhanh hơn 200x</span>
            </div>
          </div>
        </div>

        {/* Right: Timetable Live Matrix Visual */}
        <div className="md:col-span-8 flex flex-col gap-3">
          {/* Visual Matrix Grid */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Ma Trận TKB Toàn Trường (5 Khối • 3 Điểm Trường)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100% Khả thi
              </span>
            </div>

            {/* Grid Slots */}
            <div className="grid grid-cols-5 gap-2 mt-3 text-center text-xs">
              {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"].map((day, idx) => (
                <div key={day} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">{day}</div>
                  {[1, 2, 3].map((slot) => {
                    const filled = showGrid || isDone;
                    return (
                      <div
                        key={slot}
                        className={`p-1.5 rounded-lg text-[10px] font-medium border transition-all duration-500 ${
                          filled
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200 scale-100"
                            : "bg-slate-800/40 border-slate-700/50 text-slate-600 scale-95"
                        }`}
                      >
                        {filled ? (
                          <div className="truncate">
                            {idx % 2 === 0 ? "Toán (Thầy Nam)" : "Văn (Cô Lan)"}
                          </div>
                        ) : (
                          "..."
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Safety Gom Lịch Feature Box */}
          <div
            className={`p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900/90 border border-emerald-400/40 flex items-center gap-3 transition-all duration-700 ${
              showSafety ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <span>Thuật Toán "Gom Lịch An Toàn" Bảo Vệ Thầy Cô</span>
              </h4>
              <p className="text-slate-300 mt-0.5 leading-tight">
                1 buổi chỉ dạy tại đúng 1 điểm trường duy nhất, không phải chạy xe máy nguy hiểm giữa trưa mưa lũ qua đường đèo dốc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
