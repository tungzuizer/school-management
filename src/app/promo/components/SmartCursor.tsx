"use client";

import React from "react";
import { MousePointer2 } from "lucide-react";

interface SmartCursorProps {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  isClicking?: boolean;
  label?: string;
  visible?: boolean;
}

export default function SmartCursor({
  x,
  y,
  isClicking = false,
  label,
  visible = true,
}: SmartCursorProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-300 ease-out flex items-center gap-1.5"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-2px, -2px) scale(${isClicking ? 0.88 : 1})`,
      }}
    >
      {/* Cursor Icon with Neon Glow */}
      <div className="relative">
        <MousePointer2 className="w-5 h-5 text-indigo-400 fill-indigo-600 drop-shadow-[0_2px_8px_rgba(99,102,241,0.8)] filter" />

        {/* Click Ripple Wave */}
        {isClicking && (
          <span className="absolute -inset-2 rounded-full bg-indigo-400/40 border border-indigo-300 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Action Tag Pill if Label Provided */}
      {label && (
        <span className="px-2 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-500/60 text-indigo-200 text-[10px] font-bold font-mono shadow-lg shadow-indigo-950/80 backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-75 duration-150">
          {label}
        </span>
      )}
    </div>
  );
}
