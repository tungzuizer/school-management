"use client";

import React from "react";
import {
  Activity,
  UserCheck,
  Scale,
  CalendarRange,
  FileText,
  Radar,
  MessageSquareShare,
} from "lucide-react";
import { AiTaskGroup } from "@/lib/ai-assistant/types";

interface TaskTabsNavigationProps {
  activeTab: AiTaskGroup;
  onSelectTab: (tab: AiTaskGroup) => void;
  counts?: {
    alertsCount?: number;
    urgentDocsCount?: number;
    delayedLpCount?: number;
    feedbackCount?: number;
  };
}

export default function TaskTabsNavigation({
  activeTab,
  onSelectTab,
  counts,
}: TaskTabsNavigationProps) {
  const tabs = [
    {
      id: AiTaskGroup.REALTIME_MONITORING,
      label: "1. Giám sát 4 Điểm trường",
      shortLabel: "Giám sát",
      icon: Activity,
      description: "Sĩ số, nề nếp & chỉ số sức khỏe",
      badge: undefined,
    },
    {
      id: AiTaskGroup.COORDINATION_DISPATCH,
      label: "2. Điều phối & Dạy thay",
      shortLabel: "Điều phối",
      icon: UserCheck,
      description: "Dạy thay tối ưu km & thiết bị",
      badge: undefined,
    },
    {
      id: AiTaskGroup.DECISION_SUPPORT,
      label: "3. Hỗ trợ Ra quyết định",
      shortLabel: "Ra quyết định",
      icon: Scale,
      description: "Ma trận 3 phương án & pháp lý",
      badge: undefined,
    },
    {
      id: AiTaskGroup.PLAN_PROGRESS,
      label: "4. Kế hoạch & KPI",
      shortLabel: "Kế hoạch",
      icon: CalendarRange,
      description: "Tiến độ giáo án & chỉ tiêu",
      badge: counts?.delayedLpCount ? `${counts.delayedLpCount} trễ` : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: AiTaskGroup.DOCS_PERIODIC_REPORTS,
      label: "5. Văn bản & Báo cáo",
      shortLabel: "Văn bản & Báo cáo",
      icon: FileText,
      description: "Công văn 48h & báo cáo định kỳ",
      badge: counts?.urgentDocsCount ? `${counts.urgentDocsCount} khẩn` : undefined,
      badgeColor: "bg-indigo-100 text-indigo-800",
    },
    {
      id: AiTaskGroup.EARLY_WARNING,
      label: "6. Rada Cảnh báo sớm",
      shortLabel: "Cảnh báo sớm",
      icon: Radar,
      description: "Nguy cơ bỏ học & thiếu GV",
      badge: counts?.alertsCount ? `${counts.alertsCount} tin` : undefined,
      badgeColor: "bg-rose-100 text-rose-800 animate-pulse",
    },
    {
      id: AiTaskGroup.COMMUNICATION_FEEDBACK,
      label: "7. Giao tiếp & Phản hồi",
      shortLabel: "Giao tiếp",
      icon: MessageSquareShare,
      description: "Ý kiến phụ huynh & thông báo",
      badge: counts?.feedbackCount ? `${counts.feedbackCount} mới` : undefined,
      badgeColor: "bg-sky-100 text-sky-800",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
              />
              <div className="text-left">
                <span className="block font-bold leading-tight">{tab.label}</span>
              </div>
              {tab.badge && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isActive ? "bg-white/20 text-white" : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
