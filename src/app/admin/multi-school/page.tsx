"use client";

import { useEffect, useState } from "react";
import {
  getMultiSchoolOverview,
  getSchoolTrends,
  getAlerts,
  getSchoolRankings,
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
  const ranked = [...overview].sort((a, b) =>
    sortBy === "attendance"
      ? b.attendanceRate - a.attendanceRate
      : b.avgScore - a.avgScore
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border border-slate-200 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
           Tổng hợp liên trường
        </h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            placeholder="Từ ngày"
          />
          <span className="text-gray-500">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
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
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.type === "danger"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              <span className="text-lg">
                {alert.type === "danger" ? "[!]" : "[!]"}
              </span>
              <div>
                <span className="font-semibold">{alert.school}</span>
                {alert.className && (
                  <span className="text-sm"> — Lớp {alert.className}</span>
                )}
                <span className="text-sm ml-2">{alert.message}</span>
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
          icon="HS"
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Tổng giáo viên"
          value={totalTeachers.toLocaleString()}
          icon="GV"
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Tổng lớp học"
          value={totalClasses.toLocaleString()}
          icon="LH"
          color="bg-purple-50 text-purple-700"
        />
        <StatCard
          label="Chuyên cần TB"
          value={`${avgAttendance}%`}
          icon="CC"
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Bảng tổng hợp theo trường */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Bảng tổng hợp các trường
          </h2>
          <span className="text-sm text-gray-500">
            {overview.length} trường
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Trường</th>
                <th className="px-4 py-3 text-center font-medium">
                  Phân hiệu
                </th>
                <th className="px-4 py-3 text-center font-medium">Lớp</th>
                <th className="px-4 py-3 text-center font-medium">
                  Học sinh
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Giáo viên
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Chuyên cần
                </th>
                <th className="px-4 py-3 text-center font-medium">Điểm TB</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {overview.map((school, idx) => (
                <tr
                  key={school.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedSchool === school.id ? "bg-indigo-50" : ""
                  }`}
                  onClick={() => setSelectedSchool(school.id)}
                >
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {school.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {school.address}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium text-indigo-700">{school.campusCount} PH</span>
                    <span className="text-xs text-gray-400 block">({school.schoolPointsCount || 0} điểm lẻ)</span>
                  </td>
                  <td className="px-4 py-3 text-center">{school.classCount}</td>
                  <td className="px-4 py-3 text-center font-medium">
                    {school.studentCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {school.teacherCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        school.attendanceRate >= 90
                          ? "bg-green-100 text-green-800"
                          : school.attendanceRate >= 80
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {school.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {school.avgScore > 0 ? school.avgScore : "—"}
                  </td>
                </tr>
              ))}
              {overview.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Chưa có dữ liệu trường nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sơ đồ cây mô hình 3 cấp (Trường -> Phân hiệu -> Điểm trường) */}
      {overview.find((s) => s.id === selectedSchool)?.campusDetails && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span>🏰</span> Mô hình Điểm trường Phân tán 3 Cấp
          </h3>
          <div className="space-y-6">
            {overview
              .find((s) => s.id === selectedSchool)
              ?.campusDetails?.map((campus) => (
                <div key={campus.id} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/30">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-md text-xs">
                        Phân hiệu
                      </span>
                      <h4 className="font-bold text-indigo-950 text-base">{campus.name}</h4>
                    </div>
                    <span className="text-xs text-gray-500">📍 {campus.address}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campus.schoolPoints.map((sp) => (
                      <div key={sp.id} className="bg-white p-4 rounded-lg border shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 text-sm">{sp.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                              {sp.distanceKm === 0 ? "Điểm trung tâm" : `Cách ${sp.distanceKm} km`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">📍 {sp.address}</p>
                          <div className="text-xs space-y-1 text-gray-600 bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>Phụ trách:</span>
                              <span className="font-medium text-gray-800">{sp.managerName || "Chưa gán"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SĐT:</span>
                              <span className="font-medium text-gray-800">{sp.phone || "—"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t flex justify-between text-xs text-gray-500">
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
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
               Xu hướng theo thời gian
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
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
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
          </div>
          {trends[selectedSchool] && trends[selectedSchool].length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trends[selectedSchool]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  fontSize={12}
                  label={{
                    value: "Chuyên cần (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11 },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  fontSize={12}
                  label={{
                    value: "Điểm TB",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 11 },
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#4f46e5"
                  name="Chuyên cần (%)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#10b981"
                  name="Điểm TB"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu xu hướng
            </div>
          )}
        </div>

        {/* Xếp hạng trường */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900"> Xếp hạng trường</h3>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "attendance" | "score")
              }
              className="px-2 py-1 border rounded text-sm"
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
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={sortBy === "attendance" ? [0, 100] : [0, 10]}
                  fontSize={12}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  fontSize={12}
                />
                <Tooltip />
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
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* So sánh giữa các trường */}
      {overview.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
             So sánh giữa các trường
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overview}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="studentCount"
                fill="#6366f1"
                name="Học sinh"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="teacherCount"
                fill="#10b981"
                name="Giáo viên"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="classCount"
                fill="#f59e0b"
                name="Lớp học"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
