"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  School,
  CalendarDays,
  MapPin,
  Building2,
  Info,
} from "lucide-react";
import {
  getVPDashboardStats,
  getVPAttendanceByWeek,
  getVPGradesByClass,
  getVPClassAttendanceRanking,
  getVPRecentIncidents,
  getVPTodaySummary,
  getVPCampusInfo,
} from "./actions";
import ClassDistributionWidget from "@/components/dashboard/ClassDistributionWidget";
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

type Stats = Awaited<ReturnType<typeof getVPDashboardStats>>;
type WeekData = Awaited<ReturnType<typeof getVPAttendanceByWeek>>;
type ClassGrade = Awaited<ReturnType<typeof getVPGradesByClass>>;
type ClassAttendance = Awaited<ReturnType<typeof getVPClassAttendanceRanking>>;
type IncidentData = Awaited<ReturnType<typeof getVPRecentIncidents>>;
type TodaySummary = Awaited<ReturnType<typeof getVPTodaySummary>>;
type CampusInfo = Awaited<ReturnType<typeof getVPCampusInfo>>;

const COLORS = ["#0d9488", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function VPDashboardPage() {
  const { data: session } = useSession();
  const rawCampusId = session?.user?.campusId;
  const campusId = rawCampusId || "demo-campus";

  const [stats, setStats] = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekData>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance>([]);
  const [incidents, setIncidents] = useState<IncidentData>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [campusInfo, setCampusInfo] = useState<CampusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, w, g, a, i, t, c] = await Promise.all([
          getVPDashboardStats(campusId),
          getVPAttendanceByWeek(campusId),
          getVPGradesByClass(campusId),
          getVPClassAttendanceRanking(campusId),
          getVPRecentIncidents(campusId),
          getVPTodaySummary(campusId),
          getVPCampusInfo(campusId),
        ]);
        setStats(s);
        setWeekData(w);
        setClassGrades(g);
        setClassAttendance(a);
        setIncidents(i);
        setToday(t);
        setCampusInfo(c);
      } catch (err) {
        console.error("Failed to load VP dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [campusId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-700 mx-auto mb-4"></div>
          <p className="text-gray-500">Dang tai du lieu...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Phân hiệu</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{todayStr}</p>
        </div>
        {campusInfo && (
          <div className="bg-teal-50 text-teal-800 font-semibold px-4 py-2 rounded-xl text-sm border border-teal-200 self-start sm:self-auto flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{campusInfo.name}</span>
          </div>
        )}
      </div>

      {/* Unassigned Campus Warning Banner */}
      {!rawCampusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Chưa được gán phân hiệu</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Tài khoản của bạn chưa được gán vào phân hiệu nào. Vui lòng liên hệ Hiệu trưởng để được phân công. (Hệ thống đang hiển thị dữ liệu Phân hiệu thử nghiệm).
            </p>
          </div>
        </div>
      )}

      {/* Campus Info Card */}
      {campusInfo && (
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-teal-200 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{campusInfo.name}</p>
              <p className="text-sm text-teal-200">{campusInfo.address}</p>
              {campusInfo.school && (
                <p className="text-sm text-teal-300 mt-1">Thuoc: {campusInfo.school.name}</p>
              )}
            </div>
          </div>
          {campusInfo.schoolPoints && campusInfo.schoolPoints.length > 0 && (
            <div>
              <p className="text-sm font-medium text-teal-200 mb-2">Diem truong ({campusInfo.schoolPoints.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campusInfo.schoolPoints.map((sp) => (
                  <div key={sp.id} className="bg-white/10 rounded-lg p-3 text-sm">
                    <p className="font-medium">{sp.name}</p>
                    <p className="text-teal-200 text-xs">{sp.address} - {sp.distanceKm}km</p>
                    {sp.managerName && <p className="text-teal-300 text-xs mt-1">Phu trach: {sp.managerName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today Summary Banner */}
      {today && (
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <p className="text-sm font-medium text-gray-400 mb-3">Hom nay</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{today.absentToday}</p>
              <p className="text-sm text-gray-400">Vang</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.lateToday}</p>
              <p className="text-sm text-gray-400">Di muon</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.incidentsToday}</p>
              <p className="text-sm text-gray-400">Su kien</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{today.reportsSubmitted}/{today.totalClasses}</p>
              <p className="text-sm text-gray-400">Bao cao da gui</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {classAttendance.some((c) => c.attendanceRate < 85) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-800 mb-2">Canh bao chuyen can</p>
          <div className="space-y-1">
            {classAttendance
              .filter((c) => c.attendanceRate < 85)
              .map((c, i) => (
                <p key={i} className="text-sm text-red-700">
                  {c.className} — chuyen can {c.attendanceRate}% (7 ngay qua)
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Hoc sinh" value={stats?.totalStudents ?? 0} />
        <MetricCard label="Giao vien" value={stats?.totalTeachers ?? 0} />
        <MetricCard label="Lop hoc" value={stats?.totalClasses ?? 0} />
        <MetricCard label="Diem truong" value={stats?.totalSchoolPoints ?? 0} />
        <MetricCard
          label="Chuyen can (30 ngay)"
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
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Chuyen can theo tuan
          </h2>
          {weekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Co mat" fill="#0d9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Vang" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Di tre" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chua co du lieu diem danh" />
          )}
        </div>

        {/* Grade by Class */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Diem trung binh theo lop
          </h2>
          {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="className" fontSize={10} angle={-25} textAnchor="end" height={50} tickLine={false} />
                <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [Number(value).toFixed(2), "Diem TB"]} />
                <Bar dataKey="avgScore" name="Diem TB" radius={[3, 3, 0, 0]}>
                  {classGrades
                    .filter((c) => c.avgScore > 0)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chua co du lieu diem so" />
          )}
        </div>
      </div>

      {/* Row 2: Attendance ranking + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Ranking */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Xep hang chuyen can (7 ngay)
          </h2>
          {classAttendance.length > 0 ? (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="p-2.5 font-medium w-10">#</th>
                    <th className="p-2.5 font-medium">Lop</th>
                    <th className="p-2.5 font-medium text-center hidden sm:table-cell">Khoi</th>
                    <th className="p-2.5 font-medium text-center hidden sm:table-cell">Si so</th>
                    <th className="p-2.5 font-medium text-right">Chuyen can</th>
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
            <EmptyState message="Chua co du lieu lop hoc" />
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Su kien gan day
          </h2>
          {incidents.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {incidents.map((inc) => (
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
            <EmptyState message="Chua co su kien nao" />
          )}
        </div>
      </div>

      {/* Student Distribution */}
      {classGrades.length > 0 && classGrades.some((c) => c.studentCount > 0) && (
        <ClassDistributionWidget classes={classGrades} />
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
