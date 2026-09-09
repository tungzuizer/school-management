/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Sidebar items across layouts (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/department/layout.tsx`, `src/app/student/layout.tsx`).
 * 2. Affected APIs: `NavTooltip` default export in `src/components/layout/NavTooltip.tsx`.
 * 3. Schema: `NavTooltipProps` (`title`: string, `groupTitle`?: string, `badge`?: string | number, `description`?: string, `visible`?: boolean, `variant`?: "sky" | "emerald" | "indigo").
 * 4. Verbatim User Instruction: "tôi muốn màu nó như phần đăng nhập và mỗi tài khoản sẽ 1 sắc thái khác nhua hiệu trưởng giáo viên học sinh".
 */

"use client";

import React from "react";

export type NavTooltipVariant = "sky" | "emerald" | "indigo";

interface NavTooltipProps {
  title: string;
  groupTitle?: string;
  badge?: string | number;
  description?: string;
  visible?: boolean;
  variant?: NavTooltipVariant;
}

const variantStyles: Record<
  NavTooltipVariant,
  {
    container: string;
    arrow: string;
    groupTitle: string;
    badge: string;
    description: string;
  }
> = {
  sky: {
    container: "bg-slate-900/95 text-slate-100 border-sky-500/40 shadow-2xl shadow-sky-950/50 backdrop-blur-xl",
    arrow: "bg-slate-900/95 border-sky-500/40",
    groupTitle: "text-sky-400",
    badge: "bg-sky-950/90 text-sky-300 border-sky-500/40",
    description: "text-slate-300/80",
  },
  emerald: {
    container: "bg-[#02221b]/95 text-emerald-50 border-emerald-500/40 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl",
    arrow: "bg-[#02221b]/95 border-emerald-500/40",
    groupTitle: "text-emerald-400",
    badge: "bg-emerald-950/90 text-emerald-300 border-emerald-500/40",
    description: "text-emerald-200/80",
  },
  indigo: {
    container: "bg-[#13112c]/95 text-indigo-50 border-indigo-500/40 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl",
    arrow: "bg-[#13112c]/95 border-indigo-500/40",
    groupTitle: "text-indigo-400",
    badge: "bg-indigo-950/90 text-indigo-300 border-indigo-500/40",
    description: "text-indigo-200/80",
  },
};

export default function NavTooltip({
  title,
  groupTitle,
  badge,
  description,
  visible = true,
  variant = "sky",
}: NavTooltipProps) {
  if (!visible) return null;

  const styles = variantStyles[variant] || variantStyles.sky;

  return (
    <div
      role="tooltip"
      className={`absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3.5 py-2.5 rounded-xl border pointer-events-none z-50 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 transition-all duration-200 min-w-max hidden lg:block ${styles.container}`}
    >
      {/* Tooltip Arrow */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 border-l border-t rotate-[-45deg] pointer-events-none ${styles.arrow}`}
      />

      {/* Tooltip Content */}
      <div className="relative z-10 space-y-0.5">
        {groupTitle && (
          <p className={`text-[9px] font-extrabold uppercase tracking-widest ${styles.groupTitle}`}>
            {groupTitle}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white leading-tight">{title}</span>
          {badge !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${styles.badge}`}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className={`text-[10px] font-medium leading-tight max-w-[210px] mt-0.5 ${styles.description}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
