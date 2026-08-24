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
      <div className={`p-8 text-center bg-slate-50/80 rounded-2xl border border-slate-200/80 ${className}`}>
        <CalendarDays className="w-10 h-10 text-slate-400 mx-auto mb-2" aria-hidden="true" />
        <p className="text-slate-800 font-extrabold text-sm">Hôm nay bạn không có lịch học nào!</p>
        <p className="text-xs text-slate-600 font-semibold mt-1">Hãy tận dụng thời gian để nghỉ ngơi hoặc ôn tập nhé ✨</p>
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
            className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
              isActive
                ? "bg-indigo-50/80 border-indigo-300 shadow-xs ring-2 ring-indigo-400/30"
                : isPast
                ? "bg-slate-50/70 border-slate-200/70"
                : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-2xs"
            }`}
          >
            {isActive && (
              <div className="absolute top-0 right-0 bg-indigo-700 text-white text-[11px] font-extrabold px-3 py-1 rounded-bl-xl shadow-2xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                ĐANG DIỄN RA
              </div>
            )}

            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold shrink-0 transition-transform ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : isPast
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    : "bg-indigo-50 text-indigo-900 border border-indigo-100"
                }`}
              >
                <span className="text-[10px] uppercase opacity-90">Tiết</span>
                <span className="text-lg leading-none">{item.period}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base md:text-lg truncate">
                    {item.subjectName}
                  </h3>
                  {isPast && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-slate-700 mt-1 font-semibold">
                  <span className="flex items-center gap-1 font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    <Clock className="w-3.5 h-3.5 text-indigo-700" aria-hidden="true" />
                    {timeSlot.start} - {timeSlot.end}
                  </span>
                  <span className="flex items-center gap-1 text-slate-700 font-bold">
                    <User className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    {item.teacherName}
                  </span>
                  {item.room && (
                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
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