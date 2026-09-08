/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Sidebar items across layouts (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/department/layout.tsx`, `src/app/student/layout.tsx`).
 * 2. Uniqueness: Floating accessible tooltip component for mini/collapsed sidebar mode.
 * 3. Schema: `NavTooltipProps` (`title`: string, `groupTitle`?: string, `badge`?: string | number, `description`?: string, `visible`?: boolean).
 * 4. Verbatim User Instruction: "tôi muố menu có thể thu gọn và tách menu và giao diện chính độc lập giao diện khác nhau".
 */

"use client";

import React from "react";

interface NavTooltipProps {
  title: string;
  groupTitle?: string;
  badge?: string | number;
  description?: string;
  visible?: boolean;
}

export default function NavTooltip({
  title,
  groupTitle,
  badge,
  description,
  visible = true,
}: NavTooltipProps) {
  if (!visible) return null;

  return (
    <div
      role="tooltip"
      className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-2 bg-slate-950 text-white rounded-xl border border-slate-800 shadow-2xl pointer-events-none z-50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 min-w-max hidden lg:block"
    >
      {/* Tooltip Arrow */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-slate-950 border-l border-t border-slate-800 rotate-[-45deg] pointer-events-none" />

      {/* Tooltip Content */}
      <div className="relative z-10 space-y-0.5">
        {groupTitle && (
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
            {groupTitle}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white leading-tight">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800/80">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[10px] text-slate-400 font-medium leading-tight max-w-[200px] mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
