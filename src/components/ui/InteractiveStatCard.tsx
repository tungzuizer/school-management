"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradientFrom?: string;
  gradientTo?: string;
  iconBg?: string;
  iconColor?: string;
  badgeText?: string;
  badgeColor?: string;
  onClick?: () => void;
  className?: string;
};

export function InteractiveStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradientFrom = "from-blue-500",
  gradientTo = "to-blue-700",
  iconBg = "bg-blue-100",
  iconColor = "text-blue-700",
  badgeText,
  badgeColor = "bg-blue-50 text-blue-800 border-blue-200 font-extrabold",
  onClick,
  className = "",
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-label={`${title}: ${value} ${subtitle ? `(${subtitle})` : ""}`}
      className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 ${
        onClick ? "cursor-pointer active:scale-98" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-extrabold text-slate-700 tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 font-semibold pt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}