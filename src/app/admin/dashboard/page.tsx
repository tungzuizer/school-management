"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  GraduationCap,
  School,
  Users,
  CalendarDays,
  Globe,
  Bell,
  Info,
  Lightbulb,
} from "lucide-react";
import {
  getDashboardStats,
  getAttendanceByWeek,
  getGradesByClass,
  getClassAttendanceRanking,
  getRecentIncidents,
  getTodaySummary,
} from "./actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;
type WeekData = Awaited<ReturnType<typeof getAttendanceByWeek>>;
type ClassGrade = Awaited<ReturnType<typeof getGradesByClass>>;
type ClassAttendance = Awaited<ReturnType<typeof getClassAttendanceRanking>>;
type IncidentData = Awaited<ReturnType<typeof getRecentIncidents>>;
type TodaySummary = Awaited<ReturnType<typeof getTodaySummary>>;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminDashboardPage() {
  const { isEasyMode } = useEasyMode();
  const [stats, setStats] = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekData>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance>([]);
  const [incidents, setIncidents] = useState<IncidentData>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, weekRes, gradesRes, attendanceRes, incidentsRes, todayRes] =
          await Promise.all([
            getDashboardStats(),
            getAttendanceByWeek(),
            getGradesByClass(),
            getClassAttendanceRanking(),
            getRecentIncidents(),
            getTodaySummary(),
          ]);

        setStats(statsData);
        setWeekData(weekRes);
        setClassGrades(gradesRes);
        setClassAttendance(attendanceRes);
        setIncidents(incidentsRes);
        setToday(todayRes);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{todayStr}</p>
        </div>
        {isEasyMode && (
          <div className="bg-amber-100 text-amber-900 font-semibold px-4 py-2 rounded-xl text-sm border border-amber-200 self-start sm:self-auto animate-pulse flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đang bật Chế độ Dễ dùng</span>
          </div>
        )}
      </div>

      {/* Easy Mode Help Board */}
      {isEasyMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-605 shrink-0">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950">Bảng Hướng Dẫn & Thao Tác Nhanh Dành Cho Hiệu Trưởng</h2>
              <p className="text-sm text-amber-800">
                Hãy nhấn các <strong>Nút To dưới đây</strong> để chuyển nhanh đến công việc mong muốn. Mọi phần đều có chú thích Tiếng Việt rõ ràng.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/admin/classes"
              className="flex items-start gap-3 p-4 bg-white hover:bg-sky-50 border border-sky-200 hover:border-sky-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-sky-100 text-sky-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <School className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sky-950 text-base">1. Xem Lớp Học</h3>
                <p className="text-xs text-sky-700 mt-1">Danh sách lớp hiện có, thêm bớt lớp hoặc theo dõi từng lớp học.</p>
              </div>
            </Link>

            <Link
              href="/admin/teachers"
              className="flex items-start gap-3 p-4 bg-white hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-emerald-950 text-base">2. Xem Giáo Viên</h3>
                <p className="text-xs text-emerald-700 mt-1">Hồ sơ giáo viên, thông tin liên lạc và cập nhật danh sách giáo viên.</p>
              </div>
            </Link>

            <Link
              href="/admin/students"
              className="flex items-start gap-3 p-4 bg-white hover:bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-amber-950 text-base">3. Xem Học Sinh</h3>
                <p className="text-xs text-amber-700 mt-1">Danh sách toàn bộ học sinh, tra cứu hồ sơ cá nhân hoặc quản lý chuyển lớp.</p>
              </div>
            </Link>

            <Link
              href="/admin/schedule"
              className="flex items-start gap-3 p-4 bg-white hover:bg-purple-50 border border-purple-200 hover:border-purple-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-purple-950 text-base">4. Thời Khóa Biểu</h3>
                <p className="text-xs text-purple-700 mt-1">Theo dõi hoặc phân chia lịch học, giờ học cho từng lớp học.</p>
              </div>
            </Link>

            <Link
              href="/admin/multi-school"
              className="flex items-start gap-3 p-4 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-rose-950 text-base">5. Liên Trường</h3>
                <p className="text-xs text-rose-700 mt-1">So sánh tình hình chuyên cần và học lực ở tất cả các cơ sở liên kết.</p>
              </div>
            </Link>

            <Link
              href="/admin/notifications"
              className="flex items-start gap-3 p-4 bg-white hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all shadow-sm group"
            >
              <span className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-indigo-950 text-base">6. Thông Báo Chung</h3>
                <p className="text-xs text-indigo-700 mt-1">Tạo và gửi thông tin chỉ đạo chung cho giáo viên, học sinh nhà trường.</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Today Summary Banner */}
      {today && (
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-3">Hôm nay</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{today.absentToday}</p>
              <p className="text-sm text-gray-400">Vắng</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.lateToday}</p>
              <p className="text-sm text-gray-400">Đi muộn</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.incidentsToday}</p>
              <p className="text-sm text-gray-400">Sự kiện</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.reportsSubmitted}/{today.totalClasses}</p>
              <p className="text-sm text-gray-400">Báo cáo đã gửi</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {classAttendance.some((c) => c.attendanceRate < 85) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-800 mb-2">Cảnh báo chuyên cần</p>
          <div className="space-y-1">
            {classAttendance
              .filter((c) => c.attendanceRate < 85)
              .map((c, i) => (
                <p key={i} className="text-sm text-red-700">
                  {c.className} — chuyên cần {c.attendanceRate}% (7 ngày qua)
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Key Metrics - simple number cards without icons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Học sinh" value={stats?.totalStudents ?? 0} />
        <MetricCard label="Giáo viên" value={stats?.totalTeachers ?? 0} />
        <MetricCard label="Lớp học" value={stats?.totalClasses ?? 0} />
        <MetricCard label="Trường" value={stats?.totalSchools ?? 0} />
        <MetricCard
          label="Chuyên cần (30 ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          highlight={
            (stats?.attendanceRate ?? 100) < 90
              ? "text-red-600"
              : "text-green-700"
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance by Week */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Chuyên cần theo tuần
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Biểu đồ này chỉ tỉ lệ chuyên cần (đi học đầy đủ). Cột <strong className="text-green-700">Có mặt</strong> màu xanh lá, cột <strong className="text-red-500 font-bold">Vắng</strong> màu đỏ, cột <strong className="text-yellow-600 font-semibold border-yellow-300">Đi trễ</strong> màu cam. Cần chú ý tuần nào có cột đỏ quá cao.</span>
            </p>
          )}
          {weekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Có mặt" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Vắng" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Đi trễ" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chưa có dữ liệu điểm danh" />
          )}
        </div>

        {/* Grade by Class */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Điểm trung bình theo lớp
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Điểm trung bình học tập của từng lớp trên thang điểm 10. Lớp nào có cột càng cao thì thành tích học tập trung bình càng tốt.</span>
            </p>
          )}
          {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="className" fontSize={10} angle={-25} textAnchor="end" height={50} tickLine={false} />
                <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [Number(value).toFixed(2), "Điểm TB"]} />
                <Bar dataKey="avgScore" name="Điểm TB" radius={[3, 3, 0, 0]}>
                  {classGrades
                    .filter((c) => c.avgScore > 0)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chưa có dữ liệu điểm số" />
          )}
        </div>
      </div>

      {/* Row 2: Attendance ranking + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Ranking */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Xếp hạng chuyên cần (7 ngày)
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Danh sách lớp xếp theo tỷ lệ đi học từ cao xuống thấp. Lớp có tỷ lệ dưới 85% sẽ chuyển thành chữ màu đỏ báo động.</span>
            </p>
          )}
          {classAttendance.length > 0 ? (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="p-2.5 font-medium w-10">#</th>
                    <th className="p-2.5 font-medium">Lớp</th>
                    <th className="p-2.5 font-medium text-center hidden sm:table-cell">Khối</th>
                    <th className="p-2.5 font-medium text-center hidden sm:table-cell">Sĩ số</th>
                    <th className="p-2.5 font-medium text-right">Chuyên cần</th>
                  </tr>
                </thead>
                <tbody>
                  {classAttendance.map((cls, idx) => (
                    <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-2.5 text-gray-400 font-medium">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-gray-900">{cls.className}</td>
                      <td className="p-2.5 text-center text-gray-500 hidden sm:table-cell">{cls.gradeLevel}</td>
                      <td className="p-2.5 text-center text-gray-500 hidden sm:table-cell">{cls.studentCount}</td>
                      <td className="p-2.5 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            cls.attendanceRate >= 95
                              ? "text-green-700"
                              : cls.attendanceRate >= 85
                              ? "text-yellow-700"
                              : "text-red-600"
                          }`}
                        >
                          {cls.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Chưa có dữ liệu lớp học" />
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Sự kiện gần đây
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Nơi ghi nhận các sự kiện lạ hoặc vi phạm được báo cáo trực tiếp từ giáo viên trong ngày hôm nay.</span>
            </p>
          )}
          {incidents.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {incidents.map((inc: IncidentData[number]) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          inc.type === "VIOLATION" ? "bg-red-500" : "bg-green-500"
                        }`}
                      />
                      <span className="font-medium text-sm text-gray-900">
                        {inc.studentName}
                      </span>
                      <span className="text-xs text-gray-400">{inc.className}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(inc.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-4">{inc.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Chưa có sự kiện nào" />
          )}
        </div>
      </div>

      {/* Student Distribution */}
      {classGrades.length > 0 && classGrades.some((c) => c.studentCount > 0) && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Phân bố học sinh theo lớp
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2 rounded-lg flex items-start gap-1">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Biểu đồ biểu thị sĩ số/phân bố học sinh giữa các lớp. Rê chuột trên mỗi phần hình tròn để xem cụ thể.</span>
            </p>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classGrades.filter((c) => c.studentCount > 0)}
                dataKey="studentCount"
                nameKey="className"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {classGrades
                  .filter((c) => c.studentCount > 0)
                  .map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[260px] text-gray-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
