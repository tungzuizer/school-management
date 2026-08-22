"use client";

import React, { useState, useEffect } from "react";
import { Clock, MapPin, User, CheckCircle2, CalendarDays } from "lucide-react";

type ScheduleItem = {
  period: number;
  subjectName: string;
  teacherName: string;
  room: string | null;
};

type Props = {
  schedule: ScheduleItem[];
  className?: string;
};

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "07:30", end: "08:15" },
  2: { start: "08:20", end: "09:05" },
  3: { start: "09:15", end: "10:00" },
  4: { start: "10:05", end: "10:50" },
  5: { start: "11:00", end: "11:45" },
  6: { start: "13:00", end: "13:45" },
  7: { start: "13:50", end: "14:35" },
  8: { start: "14:45", end: "15:30" },
  9: { start: "15:35", end: "16:20" },
};

export function LiveClassTimeline({ schedule, className = "" }: Props) {
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let found: number | null = null;
    Object.entries(PERIOD_TIMES).forEach(([periodStr, time]) => {
      const [sh, sm] = time.start.split(":").map(Number);
      const [eh, em] = time.end.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        found = Number(periodStr);
      }
    });

    setCurrentPeriod(found);
  }, []);

  if (schedule.length === 0) {
    return (
      <div className={`p-8 text-center bg-gray-50/80 rounded-2xl border border-gray-200/60 ${className}`}>
        <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">Hôm nay bạn không có lịch học nào!</p>
        <p className="text-xs text-gray-400 mt-1">Hãy tận dụng thời gian để nghỉ ngơi hoặc ôn tập nhé ✨</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {schedule.map((item) => {
        const timeSlot = PERIOD_TIMES[item.period] || { start: "--:--", end: "--:--" };
        const isActive = currentPeriod === item.period;
        const isPast = currentPeriod !== null && item.period < currentPeriod;

        return (
          <div
            key={item.period}
            className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/50 shadow-md ring-2 ring-blue-400/30 scale-[1.01]"
                : isPast
                ? "bg-gray-50/60 border-gray-200/60 opacity-80"
                : "bg-white border-gray-200/90 hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            {isActive && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ĐANG DIỄN RA
              </div>
            )}

            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 transition-transform ${
                  isActive
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md scale-105"
                    : isPast
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <span className="text-xs opacity-90 uppercase">Tiết</span>
                <span className="text-lg leading-none">{item.period}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-gray-900 text-base md:text-lg truncate">
                    {item.subjectName}
                  </h4>
                  {isPast && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1 font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    {timeSlot.start} - {timeSlot.end}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {item.teacherName}
                  </span>
                  {item.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Phòng {item.room}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
