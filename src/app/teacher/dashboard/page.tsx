"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getTeacherDashboardData,
  getTodayAttendance,
  getTodaySchedule,
  getAtRiskAcademic,
  getAtRiskViolations,
  getStudentsNeedingCounseling,
  getUnreadParentFeedbacks,
  getDailyReportStatus,
  getClassCompetitionStats,
  getWeekSchedule,
  getTeacherCourses,
  getIncompleteRecords,
} from "./actions";
import { DailyPositivityWidget } from "@/components/ui/DailyPositivityWidget";
import { ConfettiEffect } from "@/components/ui/ConfettiEffect";
import { StudentPraiseModal } from "@/components/ui/StudentPraiseModal";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  BookOpen,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Bell,
  RefreshCw,
  NotebookPen,
  Calculator,
  ClipboardCheck,
  Zap,
  Award,
} from "lucide-react";

interface HomeroomClass {
  id: string;
  name: string;
  gradeLevel: number;
  schoolName: string;
  campusName: string | null;
  totalStudents: number;
}

interface AttendanceData {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  absentList: { name: string; status: string; note: string | null }[];
  lateList: { name: string; note: string | null }[];
  attendanceRate: number;
}

interface ScheduleSlot {
  period: number;
  time: string;
  subjectName: string;
  className: string;
  room: string | null;
  status: "done" | "current" | "upcoming";
}

interface AcademicRisk {
  id: string;
  name: string;
  avgScore: number;
  failedSubjects: number;
}

interface ViolationRisk {
  id: string;
  name: string;
  count: number;
  latest: string;
}

interface CounselingNeed {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  riskScore: number;
  description: string;
}

interface UnreadFeedback {
  id: string;
  studentName: string;
  content: string;
  channel: string | null;
  date: string;
}

interface DailyReportState {
  exists: boolean;
  status: string | null;
  sentAt: string | null;
}

interface CompetitionStats {
  weekAttendanceRate: number;
  weekAbsences: number;
  weekViolations: number;
}

interface WeekGridItem {
  period: number;
  time: { start: string; end: string };
  slots: ({ subjectName: string; className: string; room: string | null } | null)[];
}

interface CourseItem {
  subjectId: string;
  subjectName: string;
  classes: { classId: string; className: string; gradeLevel: number }[];
}

interface IncompleteItem {
  label: string;
  count: number;
  href: string;
}

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Thầy / Cô";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"360" | "timetable" | "courses" | "homeroom">("360");
  const [showConfetti, setShowConfetti] = useState(false);
  const [praiseModalOpen, setPraiseModalOpen] = useState(false);

  // Core States
  const [homeroom, setHomeroom] = useState<HomeroomClass | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);

  // Safety & At-Risk
  const [academicRisks, setAcademicRisks] = useState<AcademicRisk[]>([]);
  const [violationRisks, setViolationRisks] = useState<ViolationRisk[]>([]);
  const [counselingNeeds, setCounselingNeeds] = useState<CounselingNeed[]>([]);

  // Homeroom & Workflows
  const [unreadFeedbacks, setUnreadFeedbacks] = useState<UnreadFeedback[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReportState>({ exists: false, status: null, sentAt: null });
  const [competition, setCompetition] = useState<CompetitionStats | null>(null);
  const [incompleteList, setIncompleteList] = useState<IncompleteItem[]>([]);

  // Extra Views
  const [weekGrid, setWeekGrid] = useState<WeekGridItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isApproved, setIsApproved] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    try {
      const dbData = await getTeacherDashboardData(session.user.id);
      if (!dbData) {
        setLoading(false);
        return;
      }

      if (dbData.isApproved === false || session?.user?.isApproved === false) {
        setIsApproved(false);
        setLoading(false);
        return;
      }
      setIsApproved(true);

      setHomeroom(dbData.homeroomClass);

      const cId = dbData.homeroomClass?.id;

      // Fully parallelized data fetching for sub-second dashboard loading
      const [
        schedData,
        weekData,
        courseData,
        homeroomResults,
      ] = await Promise.all([
        getTodaySchedule(dbData.teacherId),
        getWeekSchedule(dbData.teacherId),
        getTeacherCourses(dbData.teacherId),
        cId
          ? Promise.all([
              getTodayAttendance(cId),
              getAtRiskAcademic(cId),
              getAtRiskViolations(cId),
              getStudentsNeedingCounseling(cId),
              getUnreadParentFeedbacks(cId),
              getDailyReportStatus(cId),
              getClassCompetitionStats(cId),
              getIncompleteRecords(cId),
            ])
          : Promise.resolve(null),
      ]);

      setSchedules(schedData);
      setWeekGrid(weekData.grid as unknown as WeekGridItem[]);
      setCourses(courseData);

      if (homeroomResults) {
        const [
          attData,
          acadData,
          violData,
          counselData,
          feedData,
          repData,
          compData,
          incData,
        ] = homeroomResults;

        setAttendance(attData);
        setAcademicRisks(acadData);
        setViolationRisks(violData);
        setCounselingNeeds(counselData as CounselingNeed[]);
        setUnreadFeedbacks(feedData);
        setDailyReport(repData);
        setCompetition(compData);
        setIncompleteList(incData);

        if (attData.attendanceRate >= 95 && repData.exists) {
          setShowConfetti(true);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải bảng điều khiển:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-extrabold text-slate-700 tracking-wide animate-pulse">
          Đang khởi tạo Không gian Giảng dạy 360°...
        </p>
      </div>
    );
  }

  const currentPeriodItem = schedules.find((s) => s.status === "current");
  const totalRisks = academicRisks.length + violationRisks.length + counselingNeeds.length;

  return (
    <div className="space-y-6">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      {(!isApproved || session?.user?.isApproved === false) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-amber-500/15 text-amber-700 rounded-2xl shrink-0 shadow-inner">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-300">
                  ⏳ Đã Đăng Ký Thành Công — Chờ Hiệu Trưởng Phê Duyệt & Cấp Quyền Dữ Liệu
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-amber-950">
                Tài khoản của Thầy/Cô đang trong hàng chờ phê duyệt của Ban Giám Hiệu
              </h2>
              <p className="text-sm text-amber-800 leading-relaxed font-medium">
                Chào mừng Thầy/Cô <strong>{userName}</strong>! Bạn đã đăng ký và đăng nhập thành công vào hệ thống.
                Hiện tại, tài khoản của bạn đang ở trạng thái <strong>Chờ phê duyệt</strong>.
                Khi Hiệu trưởng/Ban Giám Hiệu nhà trường bấm <strong>"Phê Duyệt & Cấp Quyền Dữ Liệu"</strong>, toàn bộ thông tin phân công giảng dạy, thời khóa biểu và danh sách lớp sẽ tự động được kích hoạt.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => loadDashboardData()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Kiểm tra lại trạng thái duyệt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== GREETING & POSITIVITY HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold tracking-wide uppercase border border-white/20">
                Hệ Thống Quản Lý Giáo Dục Thông Minh
              </span>
              {homeroom && (
                <span className="px-3 py-1 bg-emerald-400/30 backdrop-blur-md text-emerald-100 rounded-full text-xs font-extrabold border border-emerald-300/30">
                  GVCN Lớp {homeroom.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kính chào {userName}! 🌟
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl font-medium leading-relaxed">
              {schedules.length > 0
                ? `Hôm nay Thầy/Cô có ${schedules.length} tiết giảng dạy. ${currentPeriodItem ? `Hiện tại đang diễn ra tiết ${currentPeriodItem.period} môn ${currentPeriodItem.subjectName}.` : "Chúc Thầy/Cô một ngày làm việc hiệu quả và tràn đầy niềm vui!"}`
                : "Hôm nay Thầy/Cô không có lịch dạy trên thời khóa biểu. Hãy dành thời gian soạn bài và đồng hành cùng học sinh!"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setPraiseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold rounded-2xl text-xs shadow-lg shadow-orange-500/30 transition-all duration-200 active-press cursor-pointer hover:scale-105"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>Tuyên Dương Học Sinh 🌟</span>
            </button>

            <button
              onClick={() => loadDashboardData()}
              className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white transition-all active-press cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {homeroom && (
              <Link
                href="/teacher/attendance"
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition-all active-press cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Điểm Danh Lớp {homeroom.name}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ===== DAILY POSITIVITY INSPIRATION ===== */}
      <DailyPositivityWidget role="teacher" className="shadow-xs" />

      {/* ===== NAVIGATION TAB SWITCHER ===== */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab("360")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "360"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>Bảng Điều Khiển 360°</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "timetable"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Thời Khóa Biểu Tuần</span>
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === "courses"
              ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-600" />
          <span>Môn Giảng Dạy</span>
        </button>

        {homeroom && (
          <button
            onClick={() => setActiveTab("homeroom")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === "homeroom"
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Góc Chủ Nhiệm Lớp {homeroom.name}</span>
          </button>
        )}
      </div>

      {/* ===== TAB CONTENT ===== */}
      {activeTab === "360" && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tiết Dạy Hôm Nay</p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{schedules.length} tiết</h3>
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  {currentPeriodItem ? `Đang học: Tiết ${currentPeriodItem.period}` : "Không có tiết đang dạy"}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {homeroom && attendance ? (
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Hiện Diện Lớp {homeroom.name}</p>
                  <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{attendance.attendanceRate}%</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {attendance.presentCount}/{attendance.totalStudents} có mặt ({attendance.absentCount} vắng)
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Vai Trò Dạy</p>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">Giáo viên Bộ môn</h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Chưa phân công chủ nhiệm</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Học Sinh Cần Hỗ Trợ</p>
                <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{totalRisks} học sinh</h3>
                <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Cảnh báo học tập & thi đua</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tác Vụ Cần Xử Lý</p>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{incompleteList.length} việc</h3>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Nhắc nhở công việc ngày</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                <Bell className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Today Schedule & Tasks grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Schedule */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Lịch Giảng Dạy Hôm Nay
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
                </span>
              </div>

              {schedules.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold">Hôm nay không có tiết dạy theo thời khóa biểu.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div
                      key={s.period}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        s.status === "current"
                          ? "bg-indigo-50/80 border-indigo-200 ring-2 ring-indigo-500/20"
                          : s.status === "done"
                          ? "bg-slate-50/50 border-slate-200/60 opacity-60"
                          : "bg-white border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                          s.status === "current"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : s.status === "done"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          T{s.period}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">{s.subjectName}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              Lớp {s.className}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Giờ: {s.time} • Phòng: {s.room || "Chưa xếp"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {s.status === "current" && (
                          <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold animate-pulse">
                            Đang dạy
                          </span>
                        )}
                        {s.status === "done" && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                            Đã dạy
                          </span>
                        )}
                        <Link
                          href="/teacher/journal"
                          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition"
                          title="Vào sổ đầu bài"
                        >
                          <NotebookPen className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Tasks & Quick Actions */}
            <div className="space-y-6">
              {/* Incomplete Tasks */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Bell className="w-4 h-4 text-amber-600" />
                  Nhắc Nhở Công Việc Ngày
                </h3>

                {incompleteList.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Thầy/Cô đã hoàn thành đầy đủ báo cáo & điểm danh!</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {incompleteList.map((item, idx) => (
                      <Link
                        key={idx}
                        href={item.href}
                        className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 hover:bg-amber-100/60 transition group"
                      >
                        <span className="text-xs font-bold truncate">{item.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold">
                            {item.count}
                          </span>
                          <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  Thao Tác Nhanh
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/teacher/attendance"
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition text-center space-y-1 group"
                  >
                    <ClipboardCheck className="w-5 h-5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-extrabold text-slate-800">Điểm danh</p>
                  </Link>

                  <Link
                    href="/teacher/journal"
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition text-center space-y-1 group"
                  >
                    <NotebookPen className="w-5 h-5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-extrabold text-slate-800">Sổ đầu bài</p>
                  </Link>

                  <Link
                    href="/teacher/grades"
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition text-center space-y-1 group"
                  >
                    <Calculator className="w-5 h-5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-extrabold text-slate-800">Nhập điểm</p>
                  </Link>

                  <Link
                    href="/teacher/daily-report"
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition text-center space-y-1 group"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-600 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-extrabold text-slate-800">Báo cáo ngày</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TIMETABLE TAB */}
      {activeTab === "timetable" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Thời Khóa Biểu Giảng Dạy Tuần
            </h2>
            <span className="text-xs font-bold text-slate-500">Thứ 2 — Chủ Nhật</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="p-3 w-16">Tiết</th>
                  <th className="p-3">Thứ 2</th>
                  <th className="p-3">Thứ 3</th>
                  <th className="p-3">Thứ 4</th>
                  <th className="p-3">Thứ 5</th>
                  <th className="p-3">Thứ 6</th>
                  <th className="p-3">Thứ 7</th>
                  <th className="p-3">Chủ Nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {weekGrid.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-slate-500 font-semibold">
                      Chưa có dữ liệu thời khóa biểu tuần.
                    </td>
                  </tr>
                ) : (
                  weekGrid.map((row) => (
                    <tr key={row.period} className="hover:bg-slate-50/50">
                      <td className="p-3 font-extrabold text-slate-700 bg-slate-50/80 border-r border-slate-200">
                        T{row.period}
                      </td>
                      {row.slots.map((slot, idx) => (
                        <td key={idx} className="p-2 border-r border-slate-100">
                          {slot ? (
                            <div className="p-2.5 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-indigo-900 text-left space-y-0.5">
                              <p className="font-extrabold text-xs">{slot.subjectName}</p>
                              <p className="text-[10px] text-indigo-700 font-bold">Lớp {slot.className}</p>
                              {slot.room && <p className="text-[9px] text-slate-500 font-medium">P. {slot.room}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COURSES TAB */}
      {activeTab === "courses" && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Danh Sách Môn Giảng Dạy
          </h2>

          {courses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-semibold">
              Chưa có danh sách môn phân công giảng dạy.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => (
                <div key={c.subjectId} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{c.subjectName}</h3>
                      <p className="text-xs text-slate-500 font-medium">{c.classes.length} lớp giảng dạy</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    {c.classes.map((cls) => (
                      <div key={cls.classId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                        <span>Lớp {cls.className} (Khối {cls.gradeLevel})</span>
                        <Link href="/teacher/grades" className="text-indigo-600 hover:underline">Sổ điểm →</Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOMEROOM CORNER TAB */}
      {activeTab === "homeroom" && homeroom && (
        <div className="space-y-6">
          {/* Homeroom Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Lớp Chủ Nhiệm</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">{homeroom.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Sĩ số: {homeroom.totalStudents} học sinh</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {competition && (
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Chuyên Cần Tuần Này</p>
                  <h3 className="text-xl font-extrabold text-indigo-600 mt-1">{competition.weekAttendanceRate}%</h3>
                  <p className="text-xs text-slate-500 font-medium">{competition.weekAbsences} lượt vắng • {competition.weekViolations} vi phạm</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <Award className="w-6 h-6" />
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Báo Cáo Ngày BGH</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  {dailyReport.exists ? "Đã gửi" : "Chưa nộp"}
                </h3>
                <p className="text-xs text-emerald-600 font-semibold">{dailyReport.status || "Chưa khởi tạo"}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Parent Feedbacks list */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Phản Hồi Phụ Huynh Chưa Xử Lý ({unreadFeedbacks.length})
            </h3>

            {unreadFeedbacks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Không có tin nhắn phản hồi mới từ phụ huynh.</p>
            ) : (
              <div className="space-y-3">
                {unreadFeedbacks.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">HS: {f.studentName}</span>
                      <span className="text-[10px] text-slate-500">{new Date(f.date).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{f.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Praise Modal */}
      <StudentPraiseModal
        isOpen={praiseModalOpen}
        onClose={() => setPraiseModalOpen(false)}
        teacherUserId={session?.user?.id || ""}
        onSuccess={() => setShowConfetti(true)}
      />
    </div>
  );
}
