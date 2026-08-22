"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DailyPositivityWidget } from "@/components/ui/DailyPositivityWidget";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";
import { StudentPraiseModal } from "@/components/ui/StudentPraiseModal";
import { FloatingAIChatWidget } from "@/components/ui/FloatingAIChatWidget";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Calculator,
  TrendingDown,
  ShieldAlert,
  Heart,
  MessageSquare,
  ListChecks,
  Trophy,
  FolderOpen,
  RefreshCw,
  Loader2,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Search,
  ChevronDown,
  Sparkles,
  Award,
  Zap,
} from "lucide-react";
import {
  getTeacherDashboardData,
  getTodayAttendance,
  getWeekSchedule,
  getTeacherCourses,
  getAtRiskAcademic,
  getAtRiskViolations,
  getStudentsNeedingCounseling,
  getUnreadParentFeedbacks,
  getDailyReportStatus,
  getClassCompetitionStats,
  getIncompleteRecords,
} from "./actions";
import { checkIsSubjectHead } from "../subject-head/actions";

// ---- Types ----
type DashboardData = {
  teacherId: string;
  homeroomClass: {
    id: string;
    name: string;
    gradeLevel: number;
    schoolName: string;
    campusName: string | null;
    totalStudents: number;
  } | null;
} | null;

type AttendanceData = Awaited<ReturnType<typeof getTodayAttendance>>;
type WeekScheduleData = Awaited<ReturnType<typeof getWeekSchedule>>;
type CourseData = Awaited<ReturnType<typeof getTeacherCourses>>;
type AtRiskStudent = { id: string; name: string; avgScore: number; failedSubjects: number };
type ViolationStudent = { id: string; name: string; count: number; latest: string };
type CounselingStudent = { id: string; studentId: string; studentName: string; type: string; riskScore: number; description: string | null };
type ParentFeedback = { id: string; studentName: string; content: string; channel: string | null; date: string };
type ReportStatus = { exists: boolean; status: string | null; sentAt: string | null };
type CompetitionStats = { weekAttendanceRate: number; weekAbsences: number; weekViolations: number };
type IncompleteRecord = { label: string; count: number; href: string };

// Active tab
type ActiveTab = "timetable" | "courses" | "overview";

// Color palette for timetable cells
const SUBJECT_COLORS: Record<string, string> = {};
const COLOR_POOL = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-teal-50 border-teal-200 text-teal-800",
  "bg-pink-50 border-pink-200 text-pink-800",
];
let colorIndex = 0;
function getSubjectColor(subject: string) {
  if (!SUBJECT_COLORS[subject]) {
    SUBJECT_COLORS[subject] = COLOR_POOL[colorIndex % COLOR_POOL.length];
    colorIndex++;
  }
  return SUBJECT_COLORS[subject];
}

const DAY_NAMES_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_NAMES_FULL = ["Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7", "CN"];

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
  const [praiseModalOpen, setPraiseModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("timetable");

  // Data states
  const [dashData, setDashData] = useState<DashboardData>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleData | null>(null);
  const [courses, setCourses] = useState<CourseData>([]);
  const [atRiskAcademic, setAtRiskAcademic] = useState<AtRiskStudent[]>([]);
  const [atRiskViolations, setAtRiskViolations] = useState<ViolationStudent[]>([]);
  const [counseling, setCounseling] = useState<CounselingStudent[]>([]);
  const [parentFeedbacks, setParentFeedbacks] = useState<ParentFeedback[]>([]);
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [competition, setCompetition] = useState<CompetitionStats | null>(null);
  const [incompleteRecords, setIncompleteRecords] = useState<IncompleteRecord[]>([]);
  const [headInfo, setHeadInfo] = useState<{ isSubjectHead: boolean; pendingCount: number }>({
    isSubjectHead: false,
    pendingCount: 0,
  });

  // Week navigation
  const [weekOffset, setWeekOffset] = useState(0);

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const loadAll = useCallback(async (wOffset = 0) => {
    if (!session?.user?.id) return;
    try {
      const data = await getTeacherDashboardData(session.user.id);
      setDashData(data);
      if (!data) return;

      // Calculate week start date based on offset
      const now = new Date();
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + wOffset * 7);

      // Load week schedule, courses, subject head info and all homeroom widgets IN PARALLEL
      const classId = data.homeroomClass?.id;
      const [sched, crs, hInfo, att, risk, viol, couns, fb, rpt, comp, inc] = await Promise.all([
        getWeekSchedule(data.teacherId, targetDate.toISOString().split("T")[0]),
        getTeacherCourses(data.teacherId),
        checkIsSubjectHead(),
        classId ? getTodayAttendance(classId) : null,
        classId ? getAtRiskAcademic(classId) : [],
        classId ? getAtRiskViolations(classId) : [],
        classId ? getStudentsNeedingCounseling(classId) : [],
        classId ? getUnreadParentFeedbacks(classId) : [],
        classId ? getDailyReportStatus(classId) : null,
        classId ? getClassCompetitionStats(classId) : null,
        classId ? getIncompleteRecords(classId) : [],
      ]);

      setWeekSchedule(sched);
      setCourses(crs);
      setHeadInfo(hInfo);
      setAttendance(att);
      setAtRiskAcademic(risk);
      setAtRiskViolations(viol);
      setCounseling(couns);
      setParentFeedbacks(fb);
      setReportStatus(rpt);
      setCompetition(comp);
      setIncompleteRecords(inc);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadAll(weekOffset).finally(() => setLoading(false));
  }, [loadAll, weekOffset]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll(weekOffset);
    setRefreshing(false);
  }

  function goToPreviousWeek() {
    setWeekOffset((prev) => prev - 1);
  }

  function goToNextWeek() {
    setWeekOffset((prev) => prev + 1);
  }

  function goToCurrentWeek() {
    setWeekOffset(0);
  }

  const userName = session?.user?.name || "Giao vien";
  const userEmail = session?.user?.email || "";
  const hc = dashData?.homeroomClass;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ===== Breadcrumb ===== */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2.5">
        <div className="flex items-center text-xs text-gray-500">
          <Link href="/teacher/dashboard" className="hover:text-blue-600 transition">Home</Link>
          <ChevronRight className="w-3 h-3 mx-1.5" />
          <span className="text-gray-400">Dashboard</span>
          <ChevronRight className="w-3 h-3 mx-1.5" />
          <span className="text-gray-700 font-medium">
            {activeTab === "timetable" ? "Thoi khoa bieu & Diem danh" : activeTab === "courses" ? "Mon hoc hoc ky" : "Tong quan lop"}
          </span>
        </div>
      </div>

            <ConfettiEffect trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* ===== Teacher Inspiration Hero Header ===== */}
      <div className="mx-4 md:mx-6 mt-4 relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 md:p-7 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-blue-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              Cổng Thông Tin Giảng Dạy & Quản Lý
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Kính chào Thầy/Cô, {userName}! 🌟
            </h1>
            <p className="text-blue-100 text-xs md:text-sm font-medium max-w-2xl">
              Chúc Thầy/Cô một ngày giảng dạy tràn đầy cảm hứng, hỗ trợ tốt nhất cho các thế hệ học sinh!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPraiseModalOpen(true)}
              className="bg-yellow-400 hover:bg-yellow-300 text-amber-950 font-extrabold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 fill-amber-950" />
              Tuyên dương học sinh 🎉
            </button>
            <Link
              href="/teacher/attendance"
              className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Điểm danh nhanh
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Header Controls (FPT-style) ===== */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* School/Campus info */}
          {hc && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {hc.campusName || hc.schoolName}
              </span>
            </div>
          )}

          {/* Homeroom class badge */}
          {hc && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                CN: {hc.name} ({hc.totalStudents} HS)
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Week picker */}
          {weekSchedule && (
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousWeek}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                title="Tuan truoc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  weekOffset === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                {formatDateFull(weekSchedule.weekStart)} - {formatDateFull(weekSchedule.weekEnd)}
              </button>
              <button
                onClick={goToNextWeek}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                title="Tuan sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            title="Lam moi"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Subject Head Privilege Banner */}
      {headInfo.isSubjectHead && (
        <div className="mx-4 md:mx-6 mt-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0">
              👑
            </div>
            <div>
              <p className="text-sm font-bold">Bạn là Tổ Trưởng Chuyên Môn</p>
              <p className="text-xs text-indigo-200">
                {headInfo.pendingCount > 0
                  ? `Có ${headInfo.pendingCount} giáo án mới gửi lên đang chờ bạn duyệt chuyên môn.`
                  : "Hiện tại không có giáo án nào chờ duyệt."}
              </p>
            </div>
          </div>
          <Link
            href="/teacher/subject-head"
            className="px-4 py-2 bg-white text-indigo-900 font-bold text-xs rounded-xl hover:bg-indigo-50 transition-colors shrink-0 text-center shadow-xs"
          >
            Đến trang duyệt giáo án →
          </Link>
        </div>
      )}

      {/* ===== Tabs (FPT-style) ===== */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === "timetable"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Thoi khoa bieu
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === "courses"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Mon hoc hoc ky
          </button>
          {hc && (
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition relative ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Tong quan CN
              {incompleteRecords.length > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {incompleteRecords.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ===== Tab Content ===== */}
      <div className="px-4 md:px-6 py-4">
        {/* ===== TAB: TIMETABLE ===== */}
        {activeTab === "timetable" && (
          <div className="space-y-4">
            {/* Search + Total */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tim kiem mon hoc, lop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <span className="text-sm text-gray-500">
                Tong: <strong className="text-gray-700">{weekSchedule?.totalSlots || 0}</strong> tiet/tuan
              </span>
            </div>

            {/* Timetable Grid */}
            {weekSchedule && weekSchedule.grid.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                        <th className="text-white font-semibold px-3 py-3 text-center border-r border-blue-500 w-20">
                          Tiet
                        </th>
                        {weekSchedule.weekDates.map((date, i) => {
                          const isToday = date === new Date().toISOString().split("T")[0];
                          return (
                            <th
                              key={date}
                              className={`text-white font-semibold px-2 py-3 text-center border-r border-blue-500 last:border-r-0 ${
                                isToday ? "bg-blue-800" : ""
                              }`}
                            >
                              <div className="text-xs opacity-80">{DAY_NAMES_FULL[i]}</div>
                              <div className={`text-sm ${isToday ? "font-bold" : ""}`}>
                                {formatDateShort(date)}
                                {isToday && <span className="ml-1 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-bold">Hom nay</span>}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {weekSchedule.grid
                        .filter((row) => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return row.slots.some(
                            (s) =>
                              s &&
                              (s.subjectName.toLowerCase().includes(q) ||
                                s.className.toLowerCase().includes(q))
                          );
                        })
                        .map((row, rowIdx) => (
                          <tr
                            key={row.period}
                            className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30 transition`}
                          >
                            {/* Period cell */}
                            <td className="px-3 py-2 text-center border-r border-gray-200 bg-gray-50">
                              <div className="font-bold text-gray-700">Tiet {row.period}</div>
                              <div className="text-[11px] text-gray-400">
                                {row.time.start}-{row.time.end}
                              </div>
                            </td>
                            {/* Day cells */}
                            {row.slots.map((slot, dayIdx) => {
                              const dateStr = weekSchedule.weekDates[dayIdx];
                              const isToday = dateStr === new Date().toISOString().split("T")[0];
                              return (
                                <td
                                  key={dayIdx}
                                  className={`px-1.5 py-1.5 text-center border-r border-gray-100 last:border-r-0 ${
                                    isToday ? "bg-blue-50/40" : ""
                                  }`}
                                >
                                  {slot ? (
                                    <div className={`rounded-lg border px-2 py-1.5 ${getSubjectColor(slot.subjectName)}`}>
                                      <div className="font-semibold text-xs leading-tight">{slot.subjectName}</div>
                                      <div className="text-[11px] opacity-75 mt-0.5">{slot.className}</div>
                                      {slot.room && (
                                        <div className="text-[10px] opacity-60">P.{slot.room}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-300 text-xs">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-gray-100">
                  {weekSchedule.weekDates.map((date, dayIdx) => {
                    const isToday = date === new Date().toISOString().split("T")[0];
                    const daySlots = weekSchedule.grid
                      .filter((row) => row.slots[dayIdx] !== null)
                      .filter((row) => {
                        if (!searchQuery) return true;
                        const s = row.slots[dayIdx];
                        const q = searchQuery.toLowerCase();
                        return s && (s.subjectName.toLowerCase().includes(q) || s.className.toLowerCase().includes(q));
                      });

                    if (daySlots.length === 0) return null;

                    return (
                      <div key={date} className={`${isToday ? "bg-blue-50/50" : ""}`}>
                        <div className={`px-4 py-2 flex items-center gap-2 ${isToday ? "bg-blue-100/60" : "bg-gray-50"}`}>
                          <span className="font-semibold text-sm text-gray-700">{DAY_NAMES_FULL[dayIdx]}</span>
                          <span className="text-xs text-gray-500">{formatDateShort(date)}</span>
                          {isToday && (
                            <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">Hom nay</span>
                          )}
                          <span className="ml-auto text-xs text-gray-400">{daySlots.length} tiet</span>
                        </div>
                        <div className="px-4 py-2 space-y-1.5">
                          {daySlots.map((row) => {
                            const slot = row.slots[dayIdx]!;
                            return (
                              <div
                                key={row.period}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${getSubjectColor(slot.subjectName)}`}
                              >
                                <div className="text-center shrink-0 w-12">
                                  <div className="text-[10px] opacity-60">Tiet</div>
                                  <div className="font-bold text-lg leading-none">{row.period}</div>
                                  <div className="text-[10px] opacity-60">{row.time.start}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{slot.subjectName}</div>
                                  <div className="text-xs opacity-75">{slot.className} {slot.room ? `| P.${slot.room}` : ""}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {weekSchedule.grid.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Khong co lich day trong tuan nay</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chua co thoi khoa bieu</p>
                <p className="text-xs mt-1">Lien he quan tri vien de duoc phan cong lich day</p>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: COURSES ===== */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Mon hoc duoc phan cong</h2>
              <span className="text-sm text-gray-500">
                <strong className="text-gray-700">{courses.length}</strong> mon hoc
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl text-center py-12 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chua co mon hoc nao duoc phan cong</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {courses.map((course) => (
                  <div
                    key={course.subjectId}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        getSubjectColor(course.subjectName).split(" ").slice(0, 2).join(" ")
                      }`}>
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition">
                          {course.subjectName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {course.classes.length} lop
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.classes.map((cls) => (
                        <span
                          key={cls.classId}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium"
                        >
                          {cls.className}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href="/teacher/grades"
                        className="flex-1 text-center text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg py-1.5 font-medium hover:bg-blue-100 transition"
                      >
                        <Calculator className="w-3 h-3 inline mr-1 -mt-0.5" />
                        Nhap diem
                      </Link>
                      <Link
                        href="/teacher/lesson-plans"
                        className="flex-1 text-center text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg py-1.5 font-medium hover:bg-purple-100 transition"
                      >
                        <FileBarChart className="w-3 h-3 inline mr-1 -mt-0.5" />
                        Giao an
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: OVERVIEW (GVCN) ===== */}
        {activeTab === "overview" && hc && (
          <div className="space-y-4 max-w-4xl">
                        {/* Daily Inspiration Card for Teachers */}
            <DailyPositivityWidget role="teacher" />

            {/* Homeroom class header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Lop {hc.name}</h2>
                  <p className="text-emerald-100 text-sm">
                    {hc.schoolName} {hc.campusName ? `- ${hc.campusName}` : ""} | Khoi {hc.gradeLevel}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{hc.totalStudents}</div>
                  <div className="text-emerald-100 text-xs">Hoc sinh</div>
                </div>
              </div>
            </div>

            {/* Incomplete Records Alert */}
            {incompleteRecords.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Ho so chua hoan thanh ({incompleteRecords.length})
                </h3>
                <div className="space-y-1.5">
                  {incompleteRecords.map((r, i) => (
                    <Link
                      key={i}
                      href={r.href}
                      className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm hover:bg-red-100 transition border border-red-100"
                    >
                      <span className="text-red-700">{r.label}</span>
                      {r.count > 1 && (
                        <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          {r.count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Today */}
            {attendance && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Chuyen can hom nay
                  </h3>
                  <span className="text-xs text-gray-400">Si so: {hc.totalStudents}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-emerald-700">{attendance.presentCount}</p>
                    <p className="text-[10px] text-emerald-600">Co mat</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
                    <XCircle className="w-4 h-4 text-red-500 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-red-600">{attendance.absentCount}</p>
                    <p className="text-[10px] text-red-500">Vang</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                    <p className="text-lg font-bold text-amber-600">{attendance.lateCount}</p>
                    <p className="text-[10px] text-amber-500">Di muon</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                    <div className="w-4 h-4 mx-auto mb-0.5 rounded-full bg-blue-200 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-blue-700">%</span>
                    </div>
                    <p className="text-lg font-bold text-blue-700">{attendance.attendanceRate}%</p>
                    <p className="text-[10px] text-blue-600">Ty le</p>
                  </div>
                </div>

                {attendance.absentList.length > 0 && (
                  <div className="bg-red-50/50 rounded-lg p-2.5 space-y-1">
                    <p className="text-xs font-semibold text-red-700">Hoc sinh vang:</p>
                    {attendance.absentList.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.status === "ABSENT_EXCUSED" ? "bg-orange-200 text-orange-800" : "bg-red-200 text-red-800"
                        }`}>
                          {s.status === "ABSENT_EXCUSED" ? "P" : "KP"}
                        </span>
                        <span className="text-gray-700">{s.name}</span>
                        {s.note && <span className="text-gray-400 italic">- {s.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {attendance.lateList.length > 0 && (
                  <div className="bg-amber-50/50 rounded-lg p-2.5 space-y-1">
                    <p className="text-xs font-semibold text-amber-700">Hoc sinh di muon:</p>
                    {attendance.lateList.map((s, i) => (
                      <div key={i} className="text-xs text-gray-700">
                        {s.name} {s.note && <span className="text-gray-400 italic">- {s.note}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {attendance.unmarkedCount > 0 && (
                  <Link
                    href="/teacher/attendance"
                    className="block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-2 rounded-lg text-center hover:bg-amber-200 transition"
                  >
                    Con {attendance.unmarkedCount} HS chua diem danh - Bam de diem danh
                  </Link>
                )}
              </div>
            )}

            {/* Risk + Competition Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* At-risk Academic */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  Nguy co hoc luc yeu
                </h3>
                {atRiskAcademic.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Khong co HS nguy co</p>
                ) : (
                  <div className="space-y-1.5">
                    {atRiskAcademic.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-red-50 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium text-gray-700">{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold">TBC: {s.avgScore}</span>
                          {s.failedSubjects > 0 && (
                            <span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {s.failedSubjects} mon
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* At-risk Violations */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-orange-500" />
                  Nguy co vi pham
                </h3>
                {atRiskViolations.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Khong co HS vi pham nhieu</p>
                ) : (
                  <div className="space-y-1.5">
                    {atRiskViolations.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs bg-orange-50 rounded-lg px-2.5 py-1.5">
                        <span className="font-medium text-gray-700">{s.name}</span>
                        <span className="bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {s.count} lan
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Counseling */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Can tu van
                </h3>
                {counseling.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">Khong co canh bao</p>
                ) : (
                  <div className="space-y-1.5">
                    {counseling.slice(0, 5).map((s) => (
                      <div key={s.id} className="text-xs bg-pink-50 rounded-lg px-2.5 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">{s.studentName}</span>
                          <span className="bg-pink-200 text-pink-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Muc: {s.riskScore}
                          </span>
                        </div>
                        {s.description && <p className="text-gray-500 mt-0.5 truncate">{s.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competition */}
              {competition && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Thi dua tuan nay
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-700">{competition.weekAttendanceRate}%</p>
                      <p className="text-[10px] text-emerald-600">Chuyen can</p>
                    </div>
                    <div className="text-center bg-red-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-red-600">{competition.weekAbsences}</p>
                      <p className="text-[10px] text-red-500">Vang</p>
                    </div>
                    <div className="text-center bg-orange-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-orange-600">{competition.weekViolations}</p>
                      <p className="text-[10px] text-orange-500">Vi pham</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Parent feedbacks */}
            {parentFeedbacks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Phan hoi PH chua xu ly
                  </h3>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {parentFeedbacks.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {parentFeedbacks.slice(0, 3).map((fb) => (
                    <div key={fb.id} className="bg-blue-50 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">PH {fb.studentName}</span>
                        <span className="text-gray-400">{new Date(fb.date).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <p className="text-gray-600 mt-0.5 line-clamp-2">{fb.content}</p>
                    </div>
                  ))}
                  {parentFeedbacks.length > 3 && (
                    <Link href="/teacher/homeroom" className="block text-xs text-blue-600 font-semibold text-center hover:underline">
                      Xem tat ca ({parentFeedbacks.length})
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Daily Report */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <FileBarChart className="w-4 h-4 text-rose-500" />
                  Bao cao hom nay
                </h3>
                {reportStatus?.exists ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    reportStatus.status === "SENT"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {reportStatus.status === "SENT" ? "Da gui" : "Ban nhap"}
                  </span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                    Chua tao
                  </span>
                )}
              </div>
              {!reportStatus?.exists && (
                <Link
                  href="/teacher/daily-report"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
                >
                  <FileBarChart className="w-4 h-4" />
                  Tao bao cao ngay
                </Link>
              )}
              {reportStatus?.exists && reportStatus.status !== "SENT" && (
                <Link
                  href="/teacher/daily-report"
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200 transition text-sm"
                >
                  Hoan thanh va gui bao cao
                </Link>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link href="/teacher/homeroom" className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center hover:bg-emerald-100 transition">
                <ListChecks className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-emerald-700">So chu nhiem</p>
              </Link>
              <Link href="/teacher/attendance" className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center hover:bg-teal-100 transition">
                <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-teal-700">Diem danh</p>
              </Link>
              <Link href="/teacher/journal" className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center hover:bg-purple-100 transition">
                <FileBarChart className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-purple-700">So dau bai</p>
              </Link>
              <Link href="/teacher/grades" className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center hover:bg-indigo-100 transition">
                <Calculator className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-indigo-700">Nhap diem</p>
              </Link>
            </div>
          </div>
        )}
      </div>
      <FloatingAIChatWidget userRole="TEACHER" />
      {/* Student Praise Modal */}
      {session?.user?.id && (
        <StudentPraiseModal
          isOpen={praiseModalOpen}
          onClose={() => setPraiseModalOpen(false)}
          teacherUserId={session.user.id}
        />
      )}
    </div>
  );
}