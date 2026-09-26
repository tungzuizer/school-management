"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, FileText, CheckCircle2, Award, Clock } from "lucide-react";
import { VIDEO_SCENES } from "./video-data";

export default function PitchDeckView() {
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const current = VIDEO_SCENES[activeSlide];

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 select-none">
      {/* Slide Screen Viewport */}
      <div className="relative w-full aspect-video rounded-3xl bg-slate-950 border border-slate-800 p-8 md:p-12 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e512_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header of Slide */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              SM
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                HỆ THỐNG QUẢN LÝ NHÀ TRƯỜNG THÔNG MINH ĐA ĐIỂM TRƯỜNG
              </h4>
              <p className="text-[11px] text-slate-400">Executive Marketing & Pitch Deck</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              Slide {activeSlide + 1} / {VIDEO_SCENES.length}
            </span>
          </div>
        </div>

        {/* Center Main Content */}
        <div className="relative z-10 my-auto py-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-3 bg-slate-900/80 text-indigo-300 border-indigo-500/40">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{current.badge}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug">
            {current.title}
          </h2>
          <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
            {current.subtitle}
          </p>

          {/* Keypoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            {current.keyPoints.map((point, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 backdrop-blur-md"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Speaker Notes / Voiceover Preview */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400">
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
