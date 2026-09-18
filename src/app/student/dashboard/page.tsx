"use client";

import { useEffect, useState } from "react";
import { getStudentDashboardData } from "../actions";
import Link from "next/link";
import {
  CalendarDays,
  Bell,
  Award,
  ChevronRight,
  BarChart3,
  CalendarX2,
  Zap,
} from "lucide-react";
import { LiveClassTimeline } from "@/components/ui/LiveClassTimeline";

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
    <div className="space-y-5 pb-8 animate-fade-in">
      {/* ===== HERO IDENTITY BANNER ===== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              Học sinh
            </span>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
              Lớp {data.student.className}
            </span>
            <span className="text-xs text-slate-500">
              {data.student.schoolName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Xin chào, {data.student.name}
          </h1>
          <p className="text-xs text-slate-500">
            {data.student.seatPosition ? `Vị trí: ${data.student.seatPosition} • ` : ""}
            Mã học sinh: <span className="font-mono text-slate-700">{data.student.studentCode || data.student.id.slice(0, 8)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/schedule"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Thời khóa biểu
          </Link>
          <Link
            href="/student/grades"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Bảng điểm
          </Link>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Điểm trung bình</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {data.stats.totalGrades > 0 ? data.stats.avgScore : "—"}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{data.stats.totalGrades} cột điểm đã nhập</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Học lực</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.stats.academicRating}</p>
          <p className="text-[11px] text-slate-400 mt-1">Xếp loại hiện tại</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Số buổi vắng</p>
          <p className={`text-2xl font-bold mt-1 ${data.stats.absentDays > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {data.stats.absentDays}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{data.stats.absentDays === 0 ? "Chuyên cần đầy đủ" : "Số buổi nghỉ học"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Số lần đi muộn</p>
          <p className={`text-2xl font-bold mt-1 ${data.stats.lateDays > 0 ? "text-amber-600" : "text-slate-900"}`}>
            {data.stats.lateDays}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ghi nhận trong kỳ</p>
        </div>
      </div>

      {/* ===== COMMENDATIONS ===== */}
      {data.commendations && data.commendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Khen thưởng & Tuyên dương</h2>
                <p className="text-xs text-slate-500">Ghi nhận từ Thầy/Cô bộ môn và chủ nhiệm</p>
              </div>
            </div>
            <span className="bg-amber-100 text-amber-800 font-semibold text-xs px-2.5 py-0.5 rounded-md">
              {data.commendations.length} ghi nhận
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.commendations.map((c) => (
              <div key={c.id} className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800">
                    Tuyên dương
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(c.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">"{c.description}"</p>
                <p className="text-[11px] text-slate-500">— Thầy/Cô: {c.reportedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SCHEDULE & NOTIFICATIONS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Lịch học hôm nay</h2>
            </div>
            <Link href="/student/schedule" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition-colors">
              Xem tuần <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <LiveClassTimeline schedule={data.todaySchedule} />
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">Thông báo mới nhất</h2>
            </div>
            {data.recentNotifications.length > 0 && (
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
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