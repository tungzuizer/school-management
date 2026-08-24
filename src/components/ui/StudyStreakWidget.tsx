"use client";

import React, { useState, useEffect } from "react";
import { Flame, Trophy, Star, CheckCircle2, Zap } from "lucide-react";
import { ConfettiEffect } from "./ConfettiEffect";

type Props = {
  streakDays?: number;
  className?: string;
};

export function StudyStreakWidget({ streakDays = 7, className = "" }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(streakDays);
  const [checkedToday, setCheckedToday] = useState(false);

  useEffect(() => {
    try {
      const todayKey = `study_streak_checkin_${new Date().toISOString().split("T")[0]}`;
      const savedCheckin = localStorage.getItem(todayKey);
      if (savedCheckin === "true") {
        setCheckedToday(true);
      }

      const savedStreak = localStorage.getItem("study_streak_count");
      if (savedStreak) {
        setCurrentStreak(parseInt(savedStreak, 10));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCheckIn = () => {
    setShowConfetti(true);
    if (!checkedToday) {
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setCheckedToday(true);
      try {
        const todayKey = `study_streak_checkin_${new Date().toISOString().split("T")[0]}`;
        localStorage.setItem(todayKey, "true");
        localStorage.setItem("study_streak_count", newStreak.toString());
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${className}`}>
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-yellow-300 shadow-inner hover:scale-105 transition-transform">
            <Flame className="w-7 h-7 fill-yellow-400 stroke-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded-full text-yellow-100">
                Chuỗi học tập
              </span>
              <span className="text-xs bg-yellow-400 text-amber-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Star className="w-3 h-3 fill-amber-950" /> Cực sung
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white mt-1 flex items-baseline gap-1.5">
              <span>{currentStreak} ngày liên tục!</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleCheckIn}
          className="bg-white text-orange-700 hover:bg-yellow-50 active:scale-95 font-black text-xs md:text-sm px-4 py-2.5 min-h-[44px] rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-orange-500" />
          {checkedToday ? "Ăn mừng 🔥" : "Điểm danh ngay!"}
        </button>
      </div>
      <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-300" />
          <span>Mục tiêu tuần: <strong>{Math.min(currentStreak, 7)}/7 ngày</strong></span>
        </div>
        <span className="flex items-center gap-1 font-semibold text-yellow-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> {checkedToday ? "Đã điểm danh hôm nay" : "Chưa điểm danh"}
        </span>
      </div>
    </div>
  );
}