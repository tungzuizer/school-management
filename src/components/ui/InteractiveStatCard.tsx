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
  gradientTo = "to-indigo-600",
  iconBg = "bg-blue-100",
  iconColor = "text-blue-600",
  badgeText,
  badgeColor = "bg-blue-50 text-blue-700 border-blue-200",
  onClick,
  className = "",
}: Props) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white border border-gray-200/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300/80 ${
        onClick ? "cursor-pointer active:scale-98" : ""
      } ${className}`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-semibold text-gray-500 tracking-wide">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {value}
            </span>
            {badgeText && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${badgeColor}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium pt-0.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
