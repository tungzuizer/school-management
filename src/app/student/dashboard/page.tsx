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
} from "lucide-react";
import { StudyStreakWidget } from "@/components/ui/StudyStreakWidget";
import { DailyPositivityWidget } from "@/components/ui/DailyPositivityWidget";
import { LiveClassTimeline } from "@/components/ui/LiveClassTimeline";
import { InteractiveStatCard } from "@/components/ui/InteractiveStatCard";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";
import { FloatingAIChatWidget } from "@/components/ui/FloatingAIChatWidget";

type DashboardData = {
  student: {
    id: string;
    name: string;
    className: string;
    schoolName: string;
    studentCode: string | null;
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 text-lg font-medium">Đang tải bảng điều khiển...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-base font-medium">
          Không tìm thấy thông tin học sinh. Vui lòng liên hệ quản trị viên trường.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-8 animate-fade-in">
      <ConfettiEffect trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Góc Học Sinh Thông Minh
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Xin chào, {data.student.name}! 👋
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-blue-100 text-xs md:text-sm pt-1">
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                <School className="w-4 h-4 text-sky-300 shrink-0" />
                Lớp: <strong className="text-white font-bold">{data.student.className}</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
                Trường: <strong className="text-white font-bold">{data.student.schoolName}</strong>
              </span>
              {data.student.studentCode && (
                <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                  <IdCard className="w-4 h-4 text-amber-300 shrink-0" />
                  Mã HS: <strong className="text-white font-bold">{data.student.studentCode}</strong>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCelebration(true)}
            className="self-start md:self-center bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-extrabold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Award className="w-4 h-4 fill-amber-950" />
            Ăn mừng thành tích 🎉
          </button>
        </div>
      </div>

      {/* Interactive Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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

      {/* Gamification & Positivity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StudyStreakWidget streakDays={7} />
        <DailyPositivityWidget role="student" />
      </div>

            {/* Bảng Vàng Tuyên Dương Khen Thưởng */}
      {data.commendations && data.commendations.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-yellow-300">
                <Award className="w-6 h-6 fill-yellow-300" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight">Bảng Vàng Tuyên Dương 🎉</h2>
                <p className="text-xs text-orange-100 font-medium">Những lời khen thưởng & huy hiệu ghi nhận từ Thầy Cô</p>
              </div>
            </div>
            <span className="bg-yellow-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full shadow-xs">
              {data.commendations.length} Tuyên dương
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.commendations.map((c) => (
              <div key={c.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-1.5 hover:bg-white/20 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-yellow-400 text-amber-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-amber-950" /> Khen thưởng
                  </span>
                  <span className="text-[11px] text-orange-100">
                    {new Date(c.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed mt-1">
                  "{c.description}"
                </p>
                <p className="text-xs text-yellow-200 font-bold">
                  — Thầy/Cô: {c.reportedBy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Lịch học hôm nay */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <h2 className="text-base md:text-lg font-extrabold text-gray-900">Lịch Học Hôm Nay</h2>
            </div>
            <Link href="/student/schedule" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Xem tuần <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <LiveClassTimeline schedule={data.todaySchedule} />
        </div>

        {/* Thông báo mới */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base md:text-lg font-extrabold text-gray-900">Thông Báo Mới Nhất</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
              {data.recentNotifications.length} mới
            </span>
          </div>

          <div>
            {data.recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-10 text-sm font-medium">Không có thông báo mới nào từ nhà trường 🔔</p>
            ) : (
              <div className="space-y-3">
                {data.recentNotifications.map((n) => (
                  <div key={n.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200 group">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm md:text-base group-hover:text-blue-600 transition-colors">{n.title}</h3>
                      <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap mt-0.5 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                        {new Date(n.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 mt-1.5 leading-relaxed line-clamp-2">{n.content}</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-2">Từ: {n.senderName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingAIChatWidget userRole="STUDENT" />
    </div>
  );
}