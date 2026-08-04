"use client";

import { useEffect, useState } from "react";
import { getStudentDashboardData } from "../actions";
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
} from "lucide-react";

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 text-lg">Đang tải...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-yellow-800 text-base">
          Không tìm thấy thông tin học sinh. Vui lòng liên hệ quản trị viên.
        </div>
      </div>
    );
  }

  const ratingColors: Record<string, string> = {
    "Giỏi": "text-green-600 bg-green-50",
    "Khá": "text-blue-600 bg-blue-50",
    "Đạt": "text-yellow-600 bg-yellow-50",
    "Chưa đạt": "text-red-600 bg-red-50",
    "Chưa xếp loại": "text-gray-600 bg-gray-50",
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold">
          Xin chào, {data.student.name}!
        </h1>
        <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-blue-100 text-sm md:text-base">
          <span className="flex items-center gap-1.5">
            <School className="w-4 h-4 shrink-0" />
            Lớp: <strong className="text-white">{data.student.className}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 shrink-0" />
            Trường: <strong className="text-white">{data.student.schoolName}</strong>
          </span>
          {data.student.studentCode && (
            <span className="flex items-center gap-1.5">
              <IdCard className="w-4 h-4 shrink-0" />
              Mã HS: <strong className="text-white">{data.student.studentCode}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Điểm TB</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">
                {data.stats.totalGrades > 0 ? data.stats.avgScore : "—"}
              </p>
            </div>
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Học lực</p>
              <p className={`text-lg md:text-xl font-bold mt-1 px-3 py-1 rounded-full inline-block ${ratingColors[data.stats.academicRating] || "text-gray-600 bg-gray-50"}`}>
                {data.stats.academicRating}
              </p>
            </div>
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Ngày vắng</p>
              <p className={`text-2xl md:text-3xl font-bold mt-1 ${data.stats.absentDays > 3 ? "text-red-600" : "text-gray-800"}`}>
                {data.stats.absentDays}
              </p>
            </div>
            <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <CalendarX2 className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Đi muộn</p>
              <p className={`text-2xl md:text-3xl font-bold mt-1 ${data.stats.lateDays > 3 ? "text-yellow-600" : "text-gray-800"}`}>
                {data.stats.lateDays}
              </p>
            </div>
            <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Lịch hôm nay */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h2 className="text-base md:text-lg font-bold text-gray-800">Lịch học hôm nay</h2>
          </div>
          <div className="p-4">
            {data.todaySchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-base">Hôm nay không có lịch học</p>
            ) : (
              <div className="space-y-2">
                {data.todaySchedule.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3 md:gap-4 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                      Tiết {s.period}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-base">{s.subjectName}</p>
                      <p className="text-sm text-gray-500 truncate">
                        GV: {s.teacherName} {s.room && `• Phòng: ${s.room}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thông báo mới */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <h2 className="text-base md:text-lg font-bold text-gray-800">Thông báo mới nhất</h2>
          </div>
          <div className="p-4">
            {data.recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-base">Không có thông báo mới</p>
            ) : (
              <div className="space-y-3">
                {data.recentNotifications.map((n) => (
                  <div key={n.id} className="p-3 md:p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-800 text-base">{n.title}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mt-1 line-clamp-2">{n.content}</p>
                    <p className="text-sm text-gray-400 mt-1">Từ: {n.senderName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
