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
  FileSpreadsheet,
  Calculator,
  TrendingDown,
  ShieldAlert,
  Heart,
  MessageSquare,
  RefreshCw,
  Loader2,
  CalendarDays,
  BookOpen,
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  CheckSquare,
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
  teacherName: string;
  homeroomClass: {
    id: string;
    name: string;
    gradeLevel: number;
    schoolName: string;
    campusName: string | null;
    totalStudents: number;
  } | null;
} | null;

type AttendanceData = Awaited<ReturnType<typeof getTodayAttendance>> | null;
type WeekScheduleData = Awaited<ReturnType<typeof getWeekSchedule>> | null;
type CourseData = Awaited<ReturnType<typeof getTeacherCourses>>;
type AtRiskStudent = { id: string; name: string; avgScore: number; failedSubjects: number };
type ViolationStudent = { id: string; name: string; count: number; latest: string };
type CounselingStudent = { id: string; studentId: string; studentName: string; type: string; riskScore: number; description: string | null };
type ParentFeedback = { id: string; studentName: string; content: string; channel: string | null; date: string };
type ReportStatus = { exists: boolean; status: string | null; sentAt: string | null };
type CompetitionStats = { weekAttendanceRate: number; weekAbsences: number; weekViolations: number };

type ActiveTab = "timetable" | "homeroom" | "warnings" | "courses";

const SUBJECT_COLORS: Record<string, string> = {};
const COLOR_POOL = [
  "bg-blue-500/20 border-blue-500/40 text-blue-300",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  "bg-purple-500/20 border-purple-500/40 text-purple-300",
  "bg-amber-500/20 border-amber-500/40 text-amber-300",
  "bg-rose-500/20 border-rose-500/40 text-rose-300",
  "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
  "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
  "bg-teal-500/20 border-teal-500/40 text-teal-300",
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

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [praiseModalOpen, setPraiseModalOpen] = useState(false);

  // Core State
  const [dashboardData, setDashboardData] = useState<DashboardData>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceData>(null);
  const [weekSchedule, setWeekSchedule] = useState<WeekScheduleData>(null);
  const [courses, setCourses] = useState<CourseData>([]);
  const [atRiskAcademic, setAtRiskAcademic] = useState<AtRiskStudent[]>([]);
  const [atRiskViolations, setAtRiskViolations] = useState<ViolationStudent[]>([]);
  const [studentsCounseling, setStudentsCounseling] = useState<CounselingStudent[]>([]);
  const [parentFeedbacks, setParentFeedbacks] = useState<ParentFeedback[]>([]);
  const [dailyReportStatus, setDailyReportStatus] = useState<ReportStatus | null>(null);
  const [competitionStats, setCompetitionStats] = useState<CompetitionStats | null>(null);
  const [isSubjectHead, setIsSubjectHead] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("timetable");

  // Load all dashboard data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = (session?.user as { id?: string })?.id || "";
      if (!userId) {
        setLoading(false);
        return;
      }

      const dbData = await getTeacherDashboardData(userId);
      setDashboardData(dbData);

      if (dbData?.teacherId) {
        const [sched, crs, isHead] = await Promise.all([
          getWeekSchedule(dbData.teacherId),
          getTeacherCourses(dbData.teacherId),
          checkIsSubjectHead().then((r) => r.isSubjectHead).catch(() => false),
        ]);
        setWeekSchedule(sched);
        setCourses(crs);
        setIsSubjectHead(isHead);
      }

      if (dbData?.homeroomClass?.id) {
        const classId = dbData.homeroomClass.id;
        const [att, academic, viol, couns, fbacks, repStat, comp] = await Promise.all([
          getTodayAttendance(classId),
          getAtRiskAcademic(classId),
          getAtRiskViolations(classId),
          getStudentsNeedingCounseling(classId),
          getUnreadParentFeedbacks(classId),
          getDailyReportStatus(classId),
          getClassCompetitionStats(classId),
        ]);

        setTodayAttendance(att);
        setAtRiskAcademic(academic);
        setAtRiskViolations(viol);
        setStudentsCounseling(couns);
        setParentFeedbacks(fbacks);
        setDailyReportStatus(repStat);
        setCompetitionStats(comp);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu giáo viên:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [loadData, session?.user]);

  const teacherName = session?.user?.name || "Thầy/Cô";
  const homeroom = dashboardData?.homeroomClass;

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold animate-pulse">Đang tải không gian làm việc của Giáo viên...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Confetti celebration on student praise */}
      <ConfettiEffect trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Student Praise Modal */}
      <StudentPraiseModal
        isOpen={praiseModalOpen}
        onClose={() => setPraiseModalOpen(false)}
        teacherUserId={(session?.user as { id?: string })?.id || ""}
        onSuccess={() => setShowCelebration(true)}
      />

      {/* ===== Futuristic Hero Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        {/* Glow Particles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-yellow-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-emerald-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Góc Giáo Viên Smart Workstation 360°</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {teacherName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              {homeroom
                ? `Chủ nhiệm lớp ${homeroom.name} (${homeroom.totalStudents} học sinh) · ${homeroom.schoolName}`
                : "Chúc Thầy/Cô một ngày làm việc hiệu quả và tràn đầy cảm hứng giảng dạy!"}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/teacher/attendance"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Điểm danh ngay</span>
            </Link>

            <Link
              href="/teacher/journal"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs border border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>Ghi sổ đầu bài</span>
            </Link>

            <button
              onClick={() => setPraiseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>Tuyên dương HS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Positivity Quote Widget ===== */}
      <DailyPositivityWidget role="teacher" />

      {/* ===== Quick Metrics & Priority Alerts Hub ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Attendance Today */}
        <div className="glass-card-premium rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sĩ số & Chuyên cần</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white flex items-baseline gap-2">
              {todayAttendance ? todayAttendance.presentCount : homeroom?.totalStudents || 0}
              <span className="text-xs font-semibold text-slate-400">/ {todayAttendance ? todayAttendance.totalStudents : homeroom?.totalStudents || 0} HS có mặt</span>
            </div>
            <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              {todayAttendance && todayAttendance.absentCount > 0
                ? `${todayAttendance.absentCount} học sinh vắng hôm nay`
                : "100% học sinh đi học đầy đủ"}
            </p>
          </div>
        </div>

        {/* Metric 2: Lesson Plan Status */}
        <div className="glass-card-premium rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kế hoạch bài dạy</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              Sẵn sàng
            </div>
            <Link
              href="/teacher/lesson-plans"
              className="text-xs text-indigo-400 font-bold mt-1 flex items-center gap-1 hover:underline"
            >
              <span>Xem giáo án tuần này</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 3: Daily Report Status */}
        <div className="glass-card-premium rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Báo cáo ngày BGH</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {dailyReportStatus?.exists ? "Đã gửi báo cáo" : "Chưa gửi"}
            </div>
            <Link
              href="/teacher/daily-report"
              className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                dailyReportStatus?.exists ? "text-emerald-400" : "text-amber-400 hover:underline"
              }`}
            >
              <span>{dailyReportStatus?.exists ? "Hoàn thành hôm nay" : "Gửi tổng kết nếp sống ngay"}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4: Alerts */}
        <div className="glass-card-premium rounded-3xl p-5 border border-slate-800 bg-slate-900/80 space-y-3 relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cảnh báo học sinh</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">
              {atRiskAcademic.length + atRiskViolations.length} em cần chú ý
            </div>
            <button
              onClick={() => setActiveTab("warnings")}
              className="text-xs text-rose-400 font-bold mt-1 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Xem danh sách hỗ trợ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Command Center Interactive Tabs ===== */}
      <div className="space-y-4">
        {/* Tab Buttons Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("timetable")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "timetable"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <CalendarDays className="w-4 h-4 text-blue-300" />
            <span>Thời khóa biểu & Tiết dạy</span>
          </button>

          <button
            onClick={() => setActiveTab("homeroom")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "homeroom"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>Lớp Chủ Nhiệm ({homeroom?.name || "GVCN"})</span>
          </button>

          <button
            onClick={() => setActiveTab("warnings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "warnings"
                ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <span>Chăm sóc HS & Cảnh báo ({atRiskAcademic.length + atRiskViolations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "courses"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>Phân công Giảng dạy ({courses.length})</span>
          </button>
        </div>

        {/* ===== TAB CONTENT 1: TIMETABLE & SCHEDULE ===== */}
        {activeTab === "timetable" && (
          <div className="glass-card-premium rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400" />
                  Thời khóa biểu giảng dạy tuần này
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {weekSchedule ? `Thời gian: ${formatDateShort(weekSchedule.weekStart)} - ${formatDateShort(weekSchedule.weekEnd)}` : "Lịch giảng dạy phân công"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/teacher/journal"
                  className="px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-xs font-extrabold transition"
                >
                  Sổ đầu bài điện tử →
                </Link>
              </div>
            </div>

            {/* Weekly Schedule Grid */}
            {weekSchedule ? (
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-3 px-3 font-extrabold uppercase w-16">Tiết</th>
                      {weekSchedule.weekDates.map((dStr, idx) => (
                        <th key={dStr} className="py-3 px-3 font-extrabold text-center min-w-[120px]">
                          <div>{DAY_NAMES_SHORT[idx]}</div>
                          <div className="text-[10px] font-medium text-slate-500">{formatDateShort(dStr)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {weekSchedule.grid.map((row) => (
                      <tr key={row.period} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-extrabold text-slate-400">Tiết {row.period}</td>
                        {row.slots.map((slot, idx) => {
                          if (!slot) {
                            return <td key={idx} className="p-1 text-center text-slate-700">-</td>;
                          }
                          const colorClass = getSubjectColor(slot.subjectName);
                          return (
                            <td key={idx} className="p-1">
                              <div className={`p-2 rounded-xl border ${colorClass} space-y-0.5 transition hover:scale-102`}>
                                <p className="font-extrabold text-xs truncate">{slot.subjectName}</p>
                                <p className="text-[10px] opacity-80 font-semibold">{slot.className}</p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                Chưa có thời khóa biểu tuần này.
              </div>
            )}
          </div>
        )}

        {/* ===== TAB CONTENT 2: HOMEROOM COMMAND HUB ===== */}
        {activeTab === "homeroom" && (
          <div className="space-y-6">
            {homeroom ? (
              <div className="glass-card-premium rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Lớp Chủ Nhiệm: {homeroom.name} (Khối {homeroom.gradeLevel})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      Tổng số: {homeroom.totalStudents} học sinh · Trường: {homeroom.schoolName}
                    </p>
                  </div>

                  <Link
                    href="/teacher/homeroom"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 text-xs font-extrabold transition"
                  >
                    Xem Sổ Chủ Nhiệm Chi Tiết →
                  </Link>
                </div>

                {/* Homeroom Competition Stats */}
                {competitionStats && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Tỷ lệ chuyên cần tuần này</p>
                      <p className="text-2xl font-extrabold text-emerald-400">{competitionStats.weekAttendanceRate}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Lượt vắng học tuần này</p>
                      <p className="text-2xl font-extrabold text-amber-400">{competitionStats.weekAbsences} lượt</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <p className="text-xs font-bold text-slate-400">Lượt ghi nếp sống / vi phạm</p>
                      <p className="text-2xl font-extrabold text-purple-400">{competitionStats.weekViolations} lượt</p>
                    </div>
                  </div>
                )}

                {/* Parent Feedbacks list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    Phản hồi mới từ Phụ huynh ({parentFeedbacks.length})
                  </h4>
                  {parentFeedbacks.length > 0 ? (
                    <div className="space-y-2">
                      {parentFeedbacks.map((fb) => (
                        <div key={fb.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-white">{fb.studentName}</p>
                            <p className="text-slate-300 mt-0.5">{fb.content}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium shrink-0">{fb.date}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Không có tin nhắn phản hồi mới từ phụ huynh.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-900/60 rounded-3xl border border-slate-800">
                Thầy/Cô chưa được phân công làm Chủ nhiệm lớp nào trong học kỳ này.
              </div>
            )}
          </div>
        )}

        {/* ===== TAB CONTENT 3: WARNINGS & STUDENT CARE ===== */}
        {activeTab === "warnings" && (
          <div className="glass-card-premium rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Trung tâm Cảnh báo sớm & Chăm sóc Học sinh
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Theo dõi các trường hợp cần hỗ trợ học lực, tư vấn tâm lý hoặc theo dõi nếp sống
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Academic Risk */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Cần hỗ trợ học lực ({atRiskAcademic.length})
                </h4>
                {atRiskAcademic.length > 0 ? (
                  <div className="space-y-2">
                    {atRiskAcademic.map((st) => (
                      <div key={st.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{st.name}</p>
                          <p className="text-slate-400 text-[11px]">ĐTB: {st.avgScore} · Hỏng {st.failedSubjects} môn</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
                          Cần kèm cặp
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Không có học sinh nguy cơ yếu kém.</p>
                )}
              </div>

              {/* Counseling Need */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Cần tư vấn tâm lý / Chăm sóc ({studentsCounseling.length})
                </h4>
                {studentsCounseling.length > 0 ? (
                  <div className="space-y-2">
                    {studentsCounseling.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{c.studentName}</p>
                          <p className="text-slate-400 text-[11px]">{c.description || c.type}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold">
                          Độ rủi ro: {c.riskScore}/10
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Không có học sinh trong danh sách chăm sóc đặc biệt.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB CONTENT 4: COURSES & ASSIGNMENTS ===== */}
        {activeTab === "courses" && (
          <div className="glass-card-premium rounded-3xl p-6 border border-slate-800 bg-slate-900/80 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Các môn học & Lớp học phụ trách
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Danh sách các môn học và lớp được phân công giảng dạy trong năm học
              </p>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {courses.map((crs, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 hover:border-purple-500/40 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                        {crs.subjectName}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        Lớp: {crs.classes.map((c) => c.className).join(", ")}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
                      <Link
                        href="/teacher/grades"
                        className="text-[11px] font-bold text-emerald-400 hover:underline"
                      >
                        Nhập điểm →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                Chưa có thông tin phân công giảng dạy.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating AI Chat Widget */}
      <FloatingAIChatWidget userRole="TEACHER" />
    </div>
  );
}
