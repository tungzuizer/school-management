"use client";

import { useEffect, useState } from "react";
import { getStudentAttendance } from "../actions";
import { CalendarCheck, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Info } from "lucide-react";
import { TableSkeleton } from "@/components/ui/Skeleton";

type AttendanceRecord = {
  id: string;
  date: string;
  period: number | null;
  status: string;
  note: string | null;
};

type AttendanceData = {
  studentName: string;
  className: string;
  month: number;
  year: number;
  records: AttendanceRecord[];
  summary: { present: number; absentExcused: number; absentUnexcused: number; late: number; total: number; attendanceRate: number };
};

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  PRESENT: { label: "Có mặt", color: "text-emerald-700 font-extrabold", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  ABSENT_EXCUSED: { label: "Vắng CP", color: "text-blue-700 font-extrabold", bg: "bg-blue-50 border-blue-200", icon: Info },
  ABSENT_UNEXCUSED: { label: "Vắng KP", color: "text-rose-700 font-extrabold", bg: "bg-rose-50 border-rose-200", icon: XCircle },
  LATE: { label: "Đi muộn", color: "text-amber-700 font-extrabold", bg: "bg-amber-50 border-amber-200", icon: Clock },
};

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    setLoading(true);
    const [y, m] = month.split("-").map(Number);
    getStudentAttendance(m, y).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [month]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="h-7 w-56 bg-slate-200 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Không tìm thấy dữ liệu điểm danh. Vui lòng liên hệ Giáo viên chủ nhiệm.</span>
        </div>
      </div>
    );
  }

  const attendanceRate = data.summary.total > 0
    ? Math.round((data.summary.present / data.summary.total) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            Nhật Ký Chuyên Cần Cá Nhân
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Học sinh: <span className="text-slate-900 font-extrabold">{data.studentName}</span> — Lớp: <span className="text-emerald-700 font-extrabold">{data.className}</span>
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Tháng:</span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
          />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tổng Số Buổi</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{data.summary.total} <span className="text-xs font-medium text-slate-400">buổi</span></p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Có Mặt</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">{data.summary.present}</p>
        </div>
        <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <p className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Vắng Có Phép</p>
          <p className="text-xl font-extrabold text-blue-700 mt-1">{data.summary.absentExcused}</p>
        </div>
        <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl text-center shadow-2xs">
          <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Vắng Không Phép</p>
          <p className="text-xl font-extrabold text-rose-700 mt-1">{data.summary.absentUnexcused}</p>
        </div>
        <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl text-center shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Đi Muộn</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{data.summary.late}</p>
        </div>
      </div>

      {/* Attendance Rate Progress Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Tỷ Lệ Chuyên Cần Tháng
          </span>
          <span className={`text-base font-extrabold ${attendanceRate >= 90 ? "text-emerald-700" : attendanceRate >= 75 ? "text-amber-700" : "text-rose-700"}`}>
            {attendanceRate}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${attendanceRate >= 90 ? "bg-gradient-to-r from-emerald-500 to-teal-500" : attendanceRate >= 75 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-rose-500 to-pink-500"}`}
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </div>

      {/* Attendance History Table */}
      {data.records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <p className="text-slate-500 font-bold">Chưa có ghi nhận điểm danh nào trong tháng này từ Giáo viên.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Ngày Học</th>
                  <th className="px-4 py-3.5 text-center w-28">Tiết Học</th>
                  <th className="px-4 py-3.5 text-center w-36">Trạng Thái Hiện Diện</th>
                  <th className="px-4 py-3.5">Ghi Chú Của Thầy / Cô</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.records.map((r, idx) => {
                  const st = statusLabels[r.status] || { label: r.status, color: "text-slate-700", bg: "bg-slate-100 border-slate-200", icon: Info };
                  const Icon = st.icon;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-slate-900">
                        {new Date(r.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600">
                        {r.period ? `Tiết ${r.period}` : "Cả ngày"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${st.bg} ${st.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {r.note ? (
                          <span className="italic text-slate-800">"{r.note}"</span>
                        ) : (
                          <span className="text-slate-300 font-semibold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Footer Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-900">Thông tin dành cho Học sinh & Phụ huynh:</p>
          <p>• Dữ liệu chuyên cần được cập nhật tự động từ <strong>Sổ điểm danh hàng ngày của Giáo viên bộ môn & Giáo viên chủ nhiệm</strong>.</p>
          <p>• Nếu có sai sót về trạng thái xin nghỉ phép, vui lòng liên hệ Thầy/Cô chủ nhiệm để điều chỉnh kịp thời.</p>
        </div>
      </div>
    </div>
  );
}
