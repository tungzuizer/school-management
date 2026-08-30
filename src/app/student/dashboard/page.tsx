"use client";

import { useEffect, useState } from "react";
import { getStudentDashboardData } from "../actions";
import Link from "next/link";
import {
  BarChart3,
  Trophy,
  CalendarX2,
  Clock,
  School,
  Building2,
  IdCard,
  CalendarDays,
  Bell,
  Sparkles,
  Award,
  ChevronRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { StudyStreakWidget } from "@/components/ui/StudyStreakWidget";
import { DailyPositivityWidget } from "@/components/ui/DailyPositivityWidget";
import { LiveClassTimeline } from "@/components/ui/LiveClassTimeline";
import { InteractiveStatCard } from "@/components/ui/InteractiveStatCard";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";

type DashboardData = {
  student: {
    id: string;
    name: string;
    className: string;
    schoolName: string;
    studentCode: string | null;
    seatPosition?: string;
    bonusPoints?: number;
  };
  stats: {
    avgScore: number;
    absentDays: number;
    lateDays: number;
    academicRating: string;
    totalGrades: number;
  };
  commendations?: {
    id: string;
    description: string;
    date: string;
    reportedBy: string;
  }[];
  recentNotifications: {
    id: string;
    title: string;
    content: string;
    senderName: string;
    createdAt: string;
  }[];
  todaySchedule: {
    period: number;
    subjectName: string;
    teacherName: string;
    room: string | null;
  }[];
};

export default function StudentDashboardPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentDashboardData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        </div>
        <div className="flex gap-1.5">
          <span className="dot-bounce-1 w-2 h-2 rounded-full bg-blue-600 inline-block" />
          <span className="dot-bounce-2 w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          <span className="dot-bounce-3 w-2 h-2 rounded-full bg-violet-500 inline-block" />
        </div>
        <p className="text-sm font-bold text-slate-500">Đang tải bảng học tập...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-900 text-sm font-semibold text-center">
          Không tìm thấy thông tin học sinh. Vui lòng liên hệ quản trị viên trường.
        </div>
      </div>
    );
  }

  const scoreColor = data.stats.avgScore >= 8 ? "text-emerald-600" : data.stats.avgScore >= 6.5 ? "text-blue-600" : "text-amber-600";

  return (
    <div className="space-y-6 md:space-y-8 pb-8 animate-fade-in">
      <ConfettiEffect trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* ===== HERO IDENTITY BANNER ===== */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl animate-hero-reveal">
        {/* Layered gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
        {/* Decorative orbs */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Greeting */}
              <div>
                <p className="text-blue-200 text-sm font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Chào mừng trở lại
                </p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {data.student.name} 👋
                </h1>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 shadow-sm">
                  <School className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  Lớp <strong className="text-white ml-0.5">{data.student.className}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/20 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  {data.student.schoolName}
                </span>
                {data.student.seatPosition && (
                  <span className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500/30 to-purple-500/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-extrabold text-rose-200 border border-rose-400/40 shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                    Chỗ ngồi Cinema: <strong className="text-white ml-0.5">{data.student.seatPosition}</strong>
                  </span>
                )}
                {data.student.bonusPoints !== undefined && (
                  <span className="flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-200 border border-emerald-400/30 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                    Số lần khen thưởng tích cực: <strong className="text-emerald-300 ml-0.5">{data.student.bonusPoints} lần</strong>
                  </span>
                )}
              </div>

              {/* Quick score indicator */}
              {data.stats.totalGrades > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 w-fit">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-xs font-bold text-white/80">Điểm TB hiện tại:</span>
                  <span className={`text-lg font-black ${scoreColor === "text-emerald-600" ? "text-emerald-300" : scoreColor === "text-blue-600" ? "text-sky-200" : "text-amber-300"}`}>
                    {data.stats.avgScore}
                  </span>
                  <span className="text-xs font-bold text-white/60">/ 10</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCelebration(true)}
              className="self-start md:self-center relative overflow-hidden bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-amber-950 font-black text-xs md:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-amber-400/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer shimmer-h"
            >
              <Award className="w-4 h-4 fill-amber-950 relative z-10" />
              <span className="relative z-10">Ăn mừng thành tích 🎉</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card-reveal card-reveal-1">
          <InteractiveStatCard
            title="Điểm Trung Bình"
            value={data.stats.totalGrades > 0 ? data.stats.avgScore : "—"}
            subtitle={`${data.stats.totalGrades} cột điểm đã nhập`}
            icon={BarChart3}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            gradientFrom="from-blue-500"
            gradientTo="to-indigo-600"
            badgeText={data.stats.avgScore >= 8 ? "Xuất sắc 🌟" : "Đang cố gắng 👍"}
            badgeColor={data.stats.avgScore >= 8 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}
          />
        </div>
        <div className="card-reveal card-reveal-2">
          <InteractiveStatCard
            title="Học Lực"
            value={data.stats.academicRating}
            subtitle="Xếp loại hiện tại"
            icon={Trophy}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-600"
            badgeText="Chất lượng"
            badgeColor="bg-purple-50 text-purple-700 border-purple-200"
          />
        </div>
        <div className="card-reveal card-reveal-3">
          <InteractiveStatCard
            title="Số Ngày Vắng"
            value={data.stats.absentDays}
            subtitle={data.stats.absentDays === 0 ? "Chuyên cần 100%" : "Buổi nghỉ học"}
            icon={CalendarX2}
            iconBg="bg-rose-100"
            iconColor="text-rose-600"
            gradientFrom="from-rose-500"
            gradientTo="to-pink-600"
            badgeText={data.stats.absentDays === 0 ? "Tuyệt vời ✨" : "Lưu ý"}
            badgeColor={data.stats.absentDays === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}
          />
        </div>
        <div className="card-reveal card-reveal-4">
          <InteractiveStatCard
            title="Số Lần Đi Muộn"
            value={data.stats.lateDays}
            subtitle="Chỉ số đúng giờ"
            icon={Clock}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            gradientFrom="from-amber-500"
            gradientTo="to-orange-600"
            badgeText={data.stats.lateDays === 0 ? "Đúng giờ ⏰" : "Cần chú ý"}
            badgeColor={data.stats.lateDays === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}
          />
        </div>
      </div>

      {/* ===== GAMIFICATION ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card-reveal card-reveal-5">
          <StudyStreakWidget streakDays={7} />
        </div>
        <div className="card-reveal card-reveal-6">
          <DailyPositivityWidget role="student" />
        </div>
      </div>

      {/* ===== COMMENDATIONS ===== */}
      {data.commendations && data.commendations.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.15),transparent_55%)]" />
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Award className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Bảng Vàng Tuyên Dương 🎉</h2>
                  <p className="text-xs text-orange-100 font-semibold">Những lời khen thưởng từ Thầy Cô</p>
                </div>
              </div>
              <span className="bg-yellow-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-sm">
                {data.commendations.length} Tuyên dương
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.commendations.map((c) => (
                <div key={c.id} className="bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-2 hover:bg-white/20 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black bg-yellow-400 text-amber-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-amber-950" /> Khen thưởng
                    </span>
                    <span className="text-[11px] text-orange-100">
                      {new Date(c.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">"{c.description}"</p>
                  <p className="text-xs text-yellow-200 font-bold">— Thầy/Cô: {c.reportedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE & NOTIFICATIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-400/30">
                <CalendarDays className="w-4.5 h-4.5" style={{ width: "1.1rem", height: "1.1rem" }} />
              </div>
              <h2 className="text-base font-black text-slate-900">Lịch Học Hôm Nay</h2>
            </div>
            <Link href="/student/schedule" className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
              Xem tuần <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <LiveClassTimeline schedule={data.todaySchedule} />
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-400/30">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">Thông Báo Mới Nhất</h2>
            </div>
            {data.recentNotifications.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-full border border-amber-200 animate-badge-pop">
                {data.recentNotifications.length} mới
              </span>
            )}
          </div>

          {data.recentNotifications.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Không có thông báo mới</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 group cursor-default"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-black text-slate-900 text-sm group-hover:text-blue-700 transition-colors">{n.title}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap mt-0.5 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">{n.content}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-2">Từ: {n.senderName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== QUICK LINKS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/student/grades", label: "Bảng điểm", icon: BarChart3, color: "from-blue-500 to-indigo-500", bg: "bg-blue-50", text: "text-blue-700" },
          { href: "/student/attendance", label: "Chuyên cần", icon: CalendarX2, color: "from-rose-500 to-pink-500", bg: "bg-rose-50", text: "text-rose-700" },
          { href: "/student/schedule", label: "Thời khóa biểu", icon: CalendarDays, color: "from-amber-500 to-orange-500", bg: "bg-amber-50", text: "text-amber-700" },
          { href: "/student/transcript", label: "Học bạ điện tử", icon: Zap, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-700" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`card-reveal card-reveal-${i + 1} group flex flex-col items-center justify-center gap-2.5 p-5 ${item.bg} border border-transparent hover:border-slate-200 rounded-3xl text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:bg-white`}
            >
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-black ${item.text} group-hover:text-slate-800 transition-colors`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}