"use client";

import { useState } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Calculator,
  Sun,
  CloudSun,
  Sunset,
  Lightbulb,
} from "lucide-react";

// ---- Types ----
type ScheduleSlot = {
  period: number;
  time: string;
  subjectName: string;
  className: string;
  room: string | null;
  status: "done" | "current" | "upcoming";
};

type AttendanceStudent = {
  id: string;
  name: string;
  status: "PRESENT" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED" | "LATE";
};

// ---- Mock Data (replace with server actions later) ----
const todaySchedule: ScheduleSlot[] = [
  { period: 1, time: "07:00", subjectName: "Toán", className: "9A1", room: "P201", status: "done" },
  { period: 2, time: "07:50", subjectName: "Toán", className: "9A1", room: "P201", status: "done" },
  { period: 3, time: "08:40", subjectName: "Toán", className: "9A2", room: "P305", status: "current" },
  { period: 4, time: "09:40", subjectName: "Toán", className: "9A3", room: "P102", status: "upcoming" },
  { period: 5, time: "10:30", subjectName: "Toán", className: "9A3", room: "P102", status: "upcoming" },
];

const quickStats = {
  totalStudents: 45,
  presentToday: 42,
  absentToday: 2,
  lateToday: 1,
  classesTeaching: 3,
  homeroomClass: "9A1",
};

export default function TeacherMyDay() {
  const { isEasyMode } = useEasyMode();
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);
  const today = new Date();
  const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return { text: "Chào buổi sáng", icon: Sun, color: "text-amber-500" };
    if (hour < 17) return { text: "Chào buổi chiều", icon: CloudSun, color: "text-orange-500" };
    return { text: "Chào buổi tối", icon: Sunset, color: "text-indigo-500" };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
      {/* ===== Greeting + Date ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{greeting.text}!</h1>
            <p className="text-sm text-gray-500">
              {dayNames[today.getDay()]}, {today.toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
        {isEasyMode && (
          <div className="bg-amber-100 text-amber-900 font-semibold px-4 py-2 rounded-xl text-sm border border-amber-200 self-start sm:self-auto animate-pulse flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đang bật Chế độ Dễ dùng</span>
          </div>
        )}
      </div>

      {/* Help Board for Easy Mode */}
      {isEasyMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-amber-100 text-amber-605 rounded-xl shrink-0">
              <Lightbulb className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">Hướng dẫn nhanh cho Thầy/Cô</h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                • <strong>Chọn tiết học bên dưới</strong> để mở nhanh phần <span className="text-teal-800 font-semibold">Điểm danh</span> hoặc <span className="text-indigo-800 font-semibold">Nhập điểm</span> cho lớp đó.<br />
                • Dữ liệu chuyên cần (Có mặt / Vắng / Đi muộn) trong buổi học hiển thị ngay ở trên.<br />
                • Cuối ngày, hãy nhấn nút <strong>"Tạo báo cáo ngày"</strong> màu đỏ ở dưới cùng để báo cáo giải trình về ban giám hiệu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Quick Stats Row ===== */}
      {isEasyMode && (
        <p className="text-xs text-blue-700 bg-blue-50 p-2 rounded-lg flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
          <span><strong>Số liệu chuyên cần:</strong> Thống kê số học sinh có mặt, vắng mặt hoặc đi muộn của toàn bộ các lớp thầy/cô dạy hôm nay.</span>
        </p>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700">{quickStats.presentToday}</p>
          <p className="text-xs text-emerald-600">Có mặt</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-600">{quickStats.absentToday}</p>
          <p className="text-xs text-red-500">Vắng</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-600">{quickStats.lateToday}</p>
          <p className="text-xs text-amber-500">Đi muộn</p>
        </div>
      </div>

      {/* ===== Lịch dạy hôm nay (Timeline) ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Lịch dạy hôm nay
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
            {todaySchedule.length} tiết
          </span>
        </div>

        {isEasyMode && (
          <p className="text-xs text-blue-700 mb-2 bg-blue-50 p-2 rounded-lg flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Cách dùng:</strong> Nhấp (ấn) vào từng tiết học ở dưới để mở rộng các nút chức năng <strong>Điểm danh</strong> hoặc <strong>Nhập điểm</strong>.</span>
          </p>
        )}

        <div className="space-y-2">
          {todaySchedule.map((slot) => (
            <div key={slot.period}>
              <button
                onClick={() =>
                  setExpandedPeriod(expandedPeriod === slot.period ? null : slot.period)
                }
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  slot.status === "current"
                    ? "bg-blue-50 border-blue-300 shadow-sm"
                    : slot.status === "done"
                    ? "bg-gray-50 border-gray-200 opacity-70"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* Period badge */}
                <div
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                    slot.status === "current"
                      ? "bg-blue-600 text-white"
                      : slot.status === "done"
                      ? "bg-gray-300 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <span className="text-[10px] leading-none">Tiết</span>
                  <span className="text-lg font-bold leading-none">{slot.period}</span>
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{slot.subjectName}</span>
                    {slot.status === "current" && (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        ĐANG DẠY
                      </span>
                    )}
                    {slot.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {slot.className} • {slot.time} • {slot.room || "—"}
                  </p>
                </div>

                {/* Expand toggle */}
                {expandedPeriod === slot.period ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Expanded: Quick actions for this period */}
              {expandedPeriod === slot.period && (
                <div className="ml-14 mt-1 mb-2 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/teacher/attendance?class=${slot.className}&period=${slot.period}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-semibold hover:bg-teal-100 transition border border-teal-200"
                    >
                      <Users className="w-4 h-4" />
                      Điểm danh lớp {slot.className}
                    </Link>
                    <Link
                      href={`/teacher/grades?class=${slot.className}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-200"
                    >
                      <Calculator className="w-4 h-4" />
                      Nhập điểm lớp {slot.className}
                    </Link>
                  </div>
                  {isEasyMode && (
                    <div className="text-[11px] text-gray-650 space-y-0.5 bg-gray-50 border border-gray-100 p-2 rounded-lg flex flex-col gap-1">
                      <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" /> <strong>Điểm danh:</strong> Ghi nhận học sinh có mặt lớp {slot.className} hay nghỉ.</p>
                      <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> <strong>Nhập điểm:</strong> Nhận xét và cho điểm số của lớp {slot.className}.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== Lớp chủ nhiệm - Quick Summary ===== */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-emerald-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lớp CN: {quickStats.homeroomClass}
          </h2>
          <Link
            href="/teacher/homeroom"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-800"
          >
            Xem sổ →
          </Link>
        </div>
        {isEasyMode && (
          <p className="text-xs text-teal-800 mb-2 bg-white/60 p-2 rounded-lg flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Đây là lớp chủ nhiệm của thầy/cô. Tổng sĩ số là {quickStats.totalStudents} học sinh.</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/80 rounded-xl p-3">
            <p className="text-2xl font-bold text-gray-800">{quickStats.totalStudents}</p>
            <p className="text-xs text-gray-500">Sĩ số</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3">
            <p className="text-2xl font-bold text-emerald-600">
              {Math.round((quickStats.presentToday / quickStats.totalStudents) * 100)}%
            </p>
            <p className="text-xs text-gray-500">Chuyên cần hôm nay</p>
          </div>
        </div>
      </section>

      {/* ===== Báo cáo ngày ===== */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-rose-500" />
            Báo cáo hôm nay
          </h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
            Chưa gửi
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Bấm tạo báo cáo để AI tổng hợp tình hình lớp trong ngày hôm nay.
        </p>
        {isEasyMode && (
          <p className="text-xs text-rose-700 bg-rose-50/50 p-2 rounded-lg mt-2 font-medium flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>Báo cáo ngày:</strong> Giúp gửi nhanh thông tin kết quả học tập và tình hình chuyên cần hôm nay tới Hiệu Trưởng.</span>
          </p>
        )}
        <Link
          href="/teacher/daily-report"
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition text-sm"
        >
          <FileBarChart className="w-4 h-4" />
          Tạo báo cáo ngày
        </Link>
      </section>
    </div>
  );
}
