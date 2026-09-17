/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App Router route `/admin/multi-school` accessed via SuperAdmin sidebar navigation (`src/components/layout/AdminSidebar.tsx`).
 * 2. Affected APIs: `getMultiSchoolOverview`, `getSchoolTrends`, `getAlerts` from `src/app/admin/multi-school/actions.ts`.
 * 3. Schema: `School`, `EducationDepartment`, `DistrictWard`, `Campus`, `SchoolPoint`, `ClassRoom`, `Student`, `Attendance`, `Grade`.
 * 4. Verbatim User Instruction: "bạn đã sửa toàn bộ giao diện cho phù hợp với admin chưa" - Chuẩn hóa toàn bộ giao diện các trang Quản trị cho SuperAdmin.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getMultiSchoolOverview,
  getSchoolTrends,
  getAlerts,
} from "./actions";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Layers,
  Phone,
  UserCheck,
  ArrowUpDown,
} from "lucide-react";

type SchoolPointDetail = {
  id: string;
  name: string;
  address: string | null;
  distanceKm: number | null;
  managerName: string | null;
  phone: string | null;
  classCount: number;
  studentCount: number;
};

type CampusDetail = {
  id: string;
  name: string;
  address: string | null;
  schoolPoints: SchoolPointDetail[];
};

type SchoolOverview = {
  id: string;
  name: string;
  address: string | null;
  branchType?: string;
  departmentName?: string;
  districtWardName?: string;
  campusCount: number;
  schoolPointsCount?: number;
  classCount: number;
  studentCount: number;
  teacherCount: number;
  attendanceRate: number;
  avgScore: number;
  campusDetails?: CampusDetail[];
};

type Alert = {
  type: "danger" | "warning";
  school: string;
  className?: string;
  message: string;
};

type Trend = {
  label: string;
  attendanceRate: number;
  avgScore: number;
};

export default function MultiSchoolPage() {
  const [overview, setOverview] = useState<SchoolOverview[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<Record<string, Trend[]>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"attendance" | "score">("attendance");
  const [trendPeriod, setTrendPeriod] = useState<"week" | "month">("month");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load data
  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  async function loadData() {
    setLoading(true);
    try {
      const [overviewData, alertsData] = await Promise.all([
        getMultiSchoolOverview(dateFrom || undefined, dateTo || undefined),
        getAlerts(),
      ]);
      setOverview(overviewData);
      setAlerts(alertsData);
      if (overviewData.length > 0 && !selectedSchool) {
        setSelectedSchool(overviewData[0].id);
      }
    } catch (err) {
      console.error("Error loading multi-school data:", err);
    }
    setLoading(false);
  }

  // Load trends when school or period changes
  useEffect(() => {
    if (selectedSchool) {
      loadTrends(selectedSchool);
    }
  }, [selectedSchool, trendPeriod]);

  async function loadTrends(schoolId: string) {
    try {
      const trendData = await getSchoolTrends(schoolId, trendPeriod, 6);
      setTrends((prev) => ({ ...prev, [schoolId]: trendData }));
    } catch (err) {
      console.error("Error loading trends:", err);
    }
  }

  // Sort rankings
  const ranked = useMemo(() => {
    return [...overview].sort((a, b) =>
      sortBy === "attendance"
        ? b.attendanceRate - a.attendanceRate
        : b.avgScore - a.avgScore
    );
  }, [overview, sortBy]);

  // Tổng số liệu
  const totalStudents = overview.reduce((s, o) => s + o.studentCount, 0);
  const totalTeachers = overview.reduce((s, o) => s + o.teacherCount, 0);
  const totalClasses = overview.reduce((s, o) => s + o.classCount, 0);
  const avgAttendance =
    overview.length > 0
      ? Math.round(
          (overview.reduce((s, o) => s + o.attendanceRate, 0) / overview.length) * 10
        ) / 10
      : 0;

  if (loading && overview.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Đang tổng hợp dữ liệu liên trường trên toàn hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Báo Cáo Tổng Hợp Liên Trường & Đa Điểm Trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bảng điều hành tổng quan toàn bộ 6 trường học, phân hiệu và các điểm trường vệ tinh trong khu vực
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent outline-none"
            placeholder="Từ ngày"
          />
          <span className="text-slate-400 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent outline-none"
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Cảnh báo */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                alert.type === "danger"
                  ? "bg-rose-50/80 border-rose-200 text-rose-900"
                  : "bg-amber-50/80 border-amber-200 text-amber-900"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.type === "danger" ? "text-rose-600" : "text-amber-600"
                }`}
              />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">{alert.school}</span>
                {alert.className && (
                  <span className="font-medium text-slate-700"> — Lớp {alert.className}</span>
                )}
                <span className="ml-2 font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thống kê tổng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tổng học sinh"
          value={totalStudents.toLocaleString()}
          icon={GraduationCap}
          color="bg-blue-50/80 text-blue-900 border-blue-200"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Tổng giáo viên"
          value={totalTeachers.toLocaleString()}
          icon={Users}
          color="bg-emerald-50/80 text-emerald-900 border-emerald-200"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Tổng lớp học"
          value={totalClasses.toLocaleString()}
          icon={BookOpen}
          color="bg-purple-50/80 text-purple-900 border-purple-200"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Chuyên cần TB"
          value={`${avgAttendance}%`}
          icon={UserCheck}
          color="bg-amber-50/80 text-amber-900 border-amber-200"
          iconColor="text-amber-600"
        />
      </div>

      {/* Bảng tổng hợp theo trường */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Bảng Tổng Hợp Chi Tiết Từng Trường
          </h2>
          <span className="text-xs text-slate-500 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            {overview.length} đơn vị trường học
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">#</th>
                <th className="px-5 py-3.5">Trường / Đơn vị</th>
                <th className="px-4 py-3.5 text-center">Phân hiệu / Điểm lẻ</th>
                <th className="px-4 py-3.5 text-center">Lớp</th>
                <th className="px-4 py-3.5 text-center">Học sinh</th>
                <th className="px-4 py-3.5 text-center">Giáo viên</th>
                <th className="px-4 py-3.5 text-center">Chuyên cần</th>
                <th className="px-4 py-3.5 text-center">Điểm TB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.map((school, idx) => (
                <tr
                  key={school.id}
                  className={`hover:bg-slate-50/75 cursor-pointer transition ${
                    selectedSchool === school.id ? "bg-indigo-50/40" : ""
                  }`}
                  onClick={() => setSelectedSchool(school.id)}
                >
                  <td className="px-4 py-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {school.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {school.address || "Ninh Bình"} • <span className="text-indigo-600 font-medium">{school.districtWardName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-indigo-700">{school.campusCount} Phân hiệu</span>
                    <span className="text-[10px] text-slate-400 block">({school.schoolPointsCount || 0} điểm lẻ)</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">{school.classCount}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {school.studentCount}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">
                    {school.teacherCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        school.attendanceRate >= 90
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : school.attendanceRate >= 80
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {school.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900">
                    {school.avgScore > 0 ? school.avgScore.toFixed(2) : "—"}
                  </td>
                </tr>
              ))}
              {overview.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500 font-medium">
                    Chưa có dữ liệu trường học nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sơ đồ cây mô hình 3 cấp (Trường -> Phân hiệu -> Điểm trường) */}
      {overview.find((s) => s.id === selectedSchool)?.campusDetails && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Mô Hình Quản Lý Điểm Trường Phân Tán 3 Cấp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cơ cấu điểm trường của đơn vị: <strong className="text-slate-800">{overview.find((s) => s.id === selectedSchool)?.name}</strong>
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
              {overview.find((s) => s.id === selectedSchool)?.campusDetails?.length || 0} phân hiệu
            </span>
          </div>

          <div className="space-y-4">
            {overview
              .find((s) => s.id === selectedSchool)
              ?.campusDetails?.map((campus) => (
                <div key={campus.id} className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">
                        Phân hiệu
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{campus.name}</h4>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {campus.address || "Trụ sở phân hiệu"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campus.schoolPoints.map((sp) => (
                      <div key={sp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{sp.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                              {sp.distanceKm === 0 ? "Điểm trung tâm" : `Cách ${sp.distanceKm} km`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{sp.address || "Điểm lẻ"}</span>
                          </p>
                          <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Phụ trách:</span>
                              <span className="font-bold text-slate-800">{sp.managerName || "Chưa gán"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">SĐT liên hệ:</span>
                              <span className="font-medium text-slate-800 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {sp.phone || "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                          <span>{sp.classCount} Lớp học</span>
                          <span className="font-bold text-indigo-600">{sp.studentCount} Học sinh</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Xu hướng theo thời gian */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Xu Hướng Theo Thời Gian
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                {overview.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={trendPeriod}
                onChange={(e) =>
                  setTrendPeriod(e.target.value as "week" | "month")
                }
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
          </div>
          {trends[selectedSchool] && trends[selectedSchool].length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends[selectedSchool]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" fontSize={11} stroke="#64748B" />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  fontSize={11}
                  stroke="#64748B"
                  label={{
                    value: "Chuyên cần (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 10, fill: "#64748B" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  fontSize={11}
                  stroke="#64748B"
                  label={{
                    value: "Điểm TB",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 10, fill: "#64748B" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#4f46e5"
                  name="Chuyên cần (%)"
                  strokeWidth={2.5}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#10b981"
                  name="Điểm TB"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs font-semibold">
              Chưa có dữ liệu xu hướng
            </div>
          )}
        </div>

        {/* Xếp hạng trường */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-indigo-600" />
              Bảng Xếp Hạng Đơn Vị
            </h3>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "attendance" | "score")
              }
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="attendance">Theo chuyên cần</option>
              <option value="score">Theo điểm TB</option>
            </select>
          </div>
          {ranked.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={ranked}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  domain={sortBy === "attendance" ? [0, 100] : [0, 10]}
                  fontSize={11}
                  stroke="#64748B"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  fontSize={11}
                  stroke="#64748B"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey={
                    sortBy === "attendance" ? "attendanceRate" : "avgScore"
                  }
                  fill={sortBy === "attendance" ? "#4f46e5" : "#10b981"}
                  radius={[0, 4, 4, 0]}
                  name={
                    sortBy === "attendance" ? "Chuyên cần (%)" : "Điểm TB"
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs font-semibold">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  iconColor,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 border shadow-2xs ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-75">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-slate-900">{value}</p>
        </div>
        <div className="p-3 bg-white/80 rounded-xl shadow-2xs">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
