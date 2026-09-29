"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { VIDEO_SCENES } from "./video-data";

export default function PitchDeckView() {
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const current = VIDEO_SCENES[activeSlide];

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none">
      {/* Slide Screen Viewport */}
      <div className="relative w-full aspect-video rounded-3xl bg-slate-950 border border-slate-800 p-6 md:p-8 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e512_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 p-1 flex items-center justify-center shadow-md">
              <img
                src="/logo.png"
                alt="QLTHVN Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                QLTHVN • HỆ THỐNG QUẢN LÝ TRƯỜNG HỌC THÔNG MINH ĐA ĐIỂM TRƯỜNG
              </h4>
              <p className="text-[10px] text-indigo-300 font-mono">qlthvn.com • Executive Marketing & Pitch Deck</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              Slide {activeSlide + 1} / {VIDEO_SCENES.length}
            </span>
          </div>
        </div>

        {/* Center Main Content: Split Grid with Real Screenshot */}
        <div className="relative z-10 my-auto py-2 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Key Highlights & Narrative */}
          <div className="md:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold border bg-slate-900/80 text-indigo-300 border-indigo-500/40">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{current.badge}</span>
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
              {current.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              {current.subtitle}
            </p>

            {/* Keypoints Grid */}
            <div className="space-y-2 pt-1">
              {current.keyPoints.slice(0, 4).map((point, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 backdrop-blur-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200 font-medium leading-relaxed">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Real Screenshot of Live Platform */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
              {/* Browser Header Bar */}
              <div className="h-6 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between px-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 truncate max-w-[200px]">
                  https://qlthvn.com
                </div>
                <div className="text-[9px] font-bold text-emerald-400">REAL LIVE</div>
              </div>

              {/* Real Screenshot Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={current.screenshot}
                  alt={current.title}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Bottom Tag */}
              <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-semibold truncate">Giao diện thực tế vận hành Trường TH Phố Lu</span>
                <span className="text-sky-400 font-mono font-bold shrink-0">qlthvn.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Speaker Notes / Voiceover Preview */}
        <div className="relative z-10 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">🎙️ Lời bình gợi ý:</span>
            <span className="italic text-slate-300 line-clamp-1">"{current.voiceover}"</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-cyan-400 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>Thời lượng: {current.duration}s</span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
          disabled={activeSlide === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Slide Trước</span>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {VIDEO_SCENES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2.5 rounded-full transition-all ${
                activeSlide === idx ? "w-8 bg-indigo-500" : "w-2.5 bg-slate-700 hover:bg-slate-600"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setActiveSlide((prev) => Math.min(VIDEO_SCENES.length - 1, prev + 1))}
          disabled={activeSlide === VIDEO_SCENES.length - 1}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
        >
          <span>Slide Kế Tiếp</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
