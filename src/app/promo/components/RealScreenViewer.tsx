"use client";

import React from "react";
import {
  ShieldCheck,
  Building2,
  ChevronRight,
  School,
  Sparkles,
  CheckCircle2,
  Activity,
  Maximize2,
} from "lucide-react";
import SmartCursor from "./SmartCursor";

export interface SpotlightAnnotation {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width?: number;
  height?: number;
  title: string;
  badge?: string;
  description?: string;
  color?: "sky" | "emerald" | "amber" | "rose" | "indigo" | "purple";
  visibleAfter?: number; // progress threshold (0-1)
}

export interface RealScreenViewerProps {
  imageSrc: string;
  urlPath: string;
  title?: string;
  campusName?: string;
  progress: number;
  // Camera Pan & Zoom settings
  initialScale?: number;
  targetScale?: number;
  initialPanX?: number; // percentage offset
  targetPanX?: number;
  initialPanY?: number;
  targetPanY?: number;
  // Dynamic Cursor
  cursorX?: number;
  cursorY?: number;
  cursorLabel?: string;
  isClicking?: boolean;
  // Spotlight annotations
  annotations?: SpotlightAnnotation[];
  // Bottom summary pill
  bottomPill?: {
    icon?: any;
    label: string;
    value: string;
    subtext?: string;
    badge?: string;
  };
  children?: React.ReactNode;
}

export default function RealScreenViewer({
  imageSrc,
  urlPath,
  title = "Trung Tâm Điều Hành Quản Trị Trường Học Số",
  campusName = "Trường TH Phố Lu (Trung Tâm)",
  progress,
  initialScale = 1.0,
  targetScale = 1.12,
  initialPanX = 0,
  targetPanX = -3,
  initialPanY = 0,
  targetPanY = -5,
  cursorX,
  cursorY,
  cursorLabel,
  isClicking = false,
  annotations = [],
  bottomPill,
  children,
}: RealScreenViewerProps) {
  // Compute smooth camera interpolation
  const currentScale = initialScale + (targetScale - initialScale) * progress;
  const currentPanX = initialPanX + (targetPanX - initialPanX) * progress;
  const currentPanY = initialPanY + (targetPanY - initialPanY) * progress;

  const colorStyles = {
    sky: {
      border: "border-sky-400/80",
      bg: "bg-sky-500/10",
      badge: "bg-sky-600 text-white",
      text: "text-sky-300",
      glow: "shadow-[0_0_25px_rgba(56,189,248,0.4)]",
    },
    emerald: {
      border: "border-emerald-400/80",
      bg: "bg-emerald-500/10",
      badge: "bg-emerald-600 text-white",
      text: "text-emerald-300",
      glow: "shadow-[0_0_25px_rgba(52,211,153,0.4)]",
    },
    amber: {
      border: "border-amber-400/80",
      bg: "bg-amber-500/10",
      badge: "bg-amber-600 text-white",
      text: "text-amber-300",
      glow: "shadow-[0_0_25px_rgba(251,191,36,0.4)]",
    },
    rose: {
      border: "border-rose-400/80",
      bg: "bg-rose-500/10",
      badge: "bg-rose-600 text-white",
      text: "text-rose-300",
      glow: "shadow-[0_0_25px_rgba(244,63,94,0.4)]",
    },
    indigo: {
      border: "border-indigo-400/80",
      bg: "bg-indigo-500/10",
      badge: "bg-indigo-600 text-white",
      text: "text-indigo-300",
      glow: "shadow-[0_0_25px_rgba(129,140,248,0.4)]",
    },
    purple: {
      border: "border-purple-400/80",
      bg: "bg-purple-500/10",
      badge: "bg-purple-600 text-white",
      text: "text-purple-300",
      glow: "shadow-[0_0_25px_rgba(192,132,252,0.4)]",
    },
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl font-sans select-none relative">
      {/* ── 1. Realistic Browser Chrome Top Bar ── */}
      <div className="h-8 sm:h-9 px-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        {/* macOS Traffic Lights & Active Tab */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90 border border-rose-600 shadow-xs" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90 border border-amber-600 shadow-xs" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 border border-emerald-600 shadow-xs" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-t-lg bg-slate-800/90 text-[10px] sm:text-[11px] font-bold text-slate-200 border-t border-x border-slate-700 shadow-xs">
            <img src="/logo.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
            <span className="truncate max-w-[140px] sm:max-w-[210px]">Trường TH Phố Lu • qlthvn.com</span>
          </div>
        </div>

        {/* Center SSL Address Bar */}
        <div className="flex-1 max-w-[210px] sm:max-w-sm md:max-w-md mx-2 sm:mx-4">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-700 text-[10px] sm:text-[11px] font-mono text-slate-300 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-500 hidden sm:inline">https://</span>
            <span className="text-sky-300 font-semibold truncate">qlthvn.com{urlPath}</span>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] shrink-0 text-slate-300">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 font-mono font-bold shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">REAL LIVE WEB</span>
            <span className="sm:hidden">LIVE</span>
          </div>
        </div>
      </div>

      {/* ── 2. Cinematic Real Screenshot Viewport with Pan & Zoom ── */}
      <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center">
        {/* Real Screenshot Image with Ken Burns Transform */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `scale(${currentScale}) translate(${currentPanX}%, ${currentPanY}%)`,
            transformOrigin: "center center",
          }}
        >
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        </div>

        {/* Vignette & Contrast enhancement overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />

        {/* ── 3. Interactive Spotlight Annotations & HUD Callouts ── */}
        {annotations.map((ann) => {
          const isVisible = progress >= (ann.visibleAfter ?? 0);
          const style = colorStyles[ann.color || "sky"];
          if (!isVisible) return null;

          return (
            <div
              key={ann.id}
              className={`absolute transition-all duration-700 ease-out z-10 pointer-events-none ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{
                left: `${ann.x}%`,
                top: `${ann.y}%`,
                width: ann.width ? `${ann.width}%` : undefined,
                height: ann.height ? `${ann.height}%` : undefined,
              }}
            >
              {/* Glowing Highlight Box if dimensions specified */}
              {ann.width && ann.height && (
                <div
                  className={`absolute inset-0 rounded-xl border-2 ${style.border} ${style.bg} ${style.glow} animate-pulse`}
                />
              )}

              {/* Glass Callout Badge with Pin Pointer */}
              <div className="absolute -top-3 left-0 transform -translate-y-full flex flex-col gap-0.5 bg-slate-950/90 backdrop-blur-md border border-slate-700/90 rounded-xl p-2 sm:p-2.5 shadow-2xl min-w-[160px] max-w-[240px]">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-white tracking-tight truncate">
                    {ann.title}
                  </span>
                  {ann.badge && (
                    <span
                      className={`text-[8px] font-mono font-black px-1.5 py-0.2 rounded-md ${style.badge}`}
                    >
                      {ann.badge}
                    </span>
                  )}
                </div>
                {ann.description && (
                  <p className="text-[9px] text-slate-300 leading-tight">
                    {ann.description}
                  </p>
                )}
                {/* Pointer Arrow */}
                <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700 transform rotate-45 absolute -bottom-1 left-4" />
              </div>
            </div>
          );
        })}

        {/* ── 4. Dynamic Smart Cursor ── */}
        {cursorX !== undefined && cursorY !== undefined && (
          <SmartCursor
            x={cursorX}
            y={cursorY}
            label={cursorLabel}
            isClicking={isClicking}
            visible={progress > 0.05}
          />
        )}

        {/* ── 5. Bottom Floating Summary Glass Card ── */}
        {bottomPill && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto z-15 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-2xl text-slate-100 max-w-lg transition-all duration-500">
            {bottomPill.icon ? (
              <div className="w-7 h-7 rounded-lg bg-sky-600/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shrink-0">
                <bottomPill.icon className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-white truncate">
                  {bottomPill.label}
                </span>
                {bottomPill.badge && (
                  <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {bottomPill.badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-300">
                <span className="font-semibold text-sky-300">{bottomPill.value}</span>
                {bottomPill.subtext && (
                  <span className="text-slate-400 text-[9px]">• {bottomPill.subtext}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optional Custom Overlay Content */}
        {children}
      </div>
    </div>
  );
}
