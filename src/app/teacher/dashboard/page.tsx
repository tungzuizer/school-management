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
import UnapprovedBanner from "@/components/ui/UnapprovedBanner";
import {
  Users, CheckCircle2, AlertTriangle, Clock, Calendar, BookOpen,
  ChevronRight, Bell, RefreshCw,
  ClipboardCheck, Zap,
  NotebookPen, Calculator, Sparkles, Award, MessageSquare,
} from "lucide-react";

interface HomeroomClass { id: string; name: string; gradeLevel: number; schoolName: string; campusName: string | null; totalStudents: number; }
interface AttendanceData { totalStudents: number; presentCount: number; absentCount: number; lateCount: number; unmarkedCount: number; absentList: { name: string; status: string; note: string | null }[]; lateList: { name: string; note: string | null }[]; attendanceRate: number; }
interface ScheduleSlot { period: number; time: string; subjectName: string; className: string; room: string | null; status: "done" | "current" | "upcoming"; }
interface AcademicRisk { id: string; name: string; avgScore: number; failedSubjects: number; }
interface ViolationRisk { id: string; name: string; count: number; latest: string; }
interface CounselingNeed { id: string; studentId: string; studentName: string; type: string; riskScore: number; description: string; }
interface UnreadFeedback { id: string; studentName: string; content: string; channel: string | null; date: string; }
interface DailyReportState { exists: boolean; status: string | null; sentAt: string | null; }
interface CompetitionStats { weekAttendanceRate: number; weekAbsences: number; weekViolations: number; }
interface WeekGridItem { period: number; time: { start: string; end: string }; slots: ({ subjectName: string; className: string; room: string | null } | null)[]; }
interface CourseItem { subjectId: string; subjectName: string; classes: { classId: string; className: string; gradeLevel: number }[]; }
interface IncompleteItem { label: string; count: number; href: string; }

export default function TeacherDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Thầy/Cô";
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"360" | "timetable" | "courses" | "homeroom">("360");
  const [homeroom, setHomeroom] = useState<HomeroomClass | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [academicRisks, setAcademicRisks] = useState<AcademicRisk[]>([]);
  const [violationRisks, setViolationRisks] = useState<ViolationRisk[]>([]);
  const [counselingNeeds, setCounselingNeeds] = useState<CounselingNeed[]>([]);
  const [unreadFeedbacks, setUnreadFeedbacks] = useState<UnreadFeedback[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReportState>({ exists: false, status: null, sentAt: null });
  const [competition, setCompetition] = useState<CompetitionStats | null>(null);
  const [incompleteList, setIncompleteList] = useState<IncompleteItem[]>([]);
  const [weekGrid, setWeekGrid] = useState<WeekGridItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isApproved, setIsApproved] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const dbData = await getTeacherDashboardData(session.user.id);
      if (!dbData) { setLoading(false); return; }
      if (dbData.isApproved === false || session?.user?.isApproved === false) { setIsApproved(false); setLoading(false); return; }
      setIsApproved(true);
      setHomeroom(dbData.homeroomClass);
      const cId = dbData.homeroomClass?.id;
      const [schedData, weekData, courseData, homeroomResults] = await Promise.all([
        getTodaySchedule(dbData.teacherId),
        getWeekSchedule(dbData.teacherId),
        getTeacherCourses(dbData.teacherId),
        cId ? Promise.all([getTodayAttendance(cId), getAtRiskAcademic(cId), getAtRiskViolations(cId), getStudentsNeedingCounseling(cId), getUnreadParentFeedbacks(cId), getDailyReportStatus(cId), getClassCompetitionStats(cId), getIncompleteRecords(cId)]) : Promise.resolve(null),
      ]);
      setSchedules(schedData);
      setWeekGrid(weekData.grid as unknown as WeekGridItem[]);
      setCourses(courseData);
      if (homeroomResults) {
        const [attData, acadData, violData, counselData, feedData, repData, compData, incData] = homeroomResults;
        setAttendance(attData); setAcademicRisks(acadData); setViolationRisks(violData);
        setCounselingNeeds(counselData as CounselingNeed[]); setUnreadFeedbacks(feedData);
        setDailyReport(repData); setCompetition(compData); setIncompleteList(incData);
      }
    } catch (err) { console.error("Dashboard error:", err); } finally { setLoading(false); }
  }, [session]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
        <div className="flex gap-1.5">
          <span className="dot-bounce-1 w-2 h-2 rounded-full bg-indigo-600 inline-block" />
          <span className="dot-bounce-2 w-2 h-2 rounded-full bg-violet-500 inline-block" />
          <span className="dot-bounce-3 w-2 h-2 rounded-full bg-slate-400 inline-block" />
        </div>
        <p className="text-sm font-black text-slate-500">Dang khoi tao Khong gian Giang day 360 deg...</p>
      </div>
    );
  }

  const currentPeriodItem = schedules.find((s) => s.status === "current");
  const totalRisks = academicRisks.length + violationRisks.length + counselingNeeds.length;

  const TABS = [
    { key: "360" as const, label: "Tổng quan", icon: Zap },
    { key: "timetable" as const, label: "Thời khóa biểu tuần", icon: Calendar },
    { key: "courses" as const, label: "Môn giảng dạy", icon: BookOpen },
    ...(homeroom ? [{ key: "homeroom" as const, label: `Chủ nhiệm ${homeroom.name}`, icon: Users }] : []),
  ];

  return (
    <div className="space-y-5 animate-fade-in">

      {(!isApproved || session?.user?.isApproved === false) && (
        <div className="relative overflow-hidden bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-lg space-y-4">
          <div className="absolute right-0 top-0 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="p-3.5 bg-amber-500/15 text-amber-700 rounded-2xl shrink-0"><Clock className="w-8 h-8 animate-pulse" /></div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-200/80 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider border border-amber-300">
                Da Dang Ki Thanh Cong — Cho Hieu Truong Phe Duyet
              </span>
              <h2 className="text-xl font-black text-amber-950">Tai khoan cua Thay/Co dang trong hang cho phe duyet cua Ban Giam Hieu</h2>
              <p className="text-sm text-amber-800 font-medium">Chao mung Thay/Co <strong>{userName}</strong>! Tai khoan dang o trang thai <strong>Cho phe duyet</strong>.</p>
              <button onClick={() => loadDashboardData()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4" /> Kiem tra lai trang thai duyet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Modern Executive Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
              Giáo viên
            </span>
            {homeroom && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
                GVCN Lớp {homeroom.name}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Xin chào, {userName}
          </h1>
          <p className="text-xs text-slate-500">
            {schedules.length > 0
              ? `Hôm nay có ${schedules.length} tiết giảng dạy. ${currentPeriodItem ? `Hiện tại đang diễn ra tiết ${currentPeriodItem.period} môn ${currentPeriodItem.subjectName}.` : "Chúc Thầy/Cô một ngày làm việc hiệu quả!"}`
              : "Hôm nay không có lịch dạy trên thời khóa biểu."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {homeroom && (
            <Link
              href="/teacher/attendance"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Điểm danh {homeroom.name}</span>
            </Link>
          )}
          <Link
            href="/teacher/grades"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Sổ điểm
          </Link>
          <Link
            href="/teacher/lesson-plans"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Giáo án
          </Link>
          <button
            onClick={() => loadDashboardData()}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "360" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { label: "Tiết dạy hôm nay", value: `${schedules.length} tiết`, sub: currentPeriodItem ? `Đang học: Tiết ${currentPeriodItem.period}` : "Không có tiết đang diễn ra", icon: Clock, iconBg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-slate-900" },
              ...(homeroom && attendance ? [{ label: `Hiện diện lớp ${homeroom.name}`, value: `${attendance.attendanceRate}%`, sub: `${attendance.presentCount}/${attendance.totalStudents} có mặt (${attendance.absentCount} vắng)`, icon: CheckCircle2, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" }] : [{ label: "Vai trò", value: "Bộ môn", sub: "Chưa phân công chủ nhiệm", icon: BookOpen, iconBg: "bg-slate-50", iconColor: "text-slate-600", valueColor: "text-slate-900" }]),
              { label: "Cần hỗ trợ", value: `${totalRisks} học sinh`, sub: "Cảnh báo học tập & nề nếp", icon: AlertTriangle, iconBg: "bg-rose-50", iconColor: "text-rose-600", valueColor: "text-rose-700" },
              { label: "Tác vụ cần xử lý", value: `${incompleteList.length} việc`, sub: "Nhắc nhở công việc ngày", icon: Bell, iconBg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-slate-900" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-1">{card.label}</p>
                      <h3 className={`text-xl sm:text-2xl font-bold ${card.valueColor}`}>{card.value}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">{card.sub}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${card.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Lịch giảng dạy hôm nay</h2>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
                </span>
              </div>
              {schedules.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">Hôm nay không có tiết dạy theo thời khóa biểu.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {schedules.map((s) => (
                    <div key={s.period} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${s.status === "current" ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/15" : s.status === "done" ? "bg-slate-50/50 border-slate-100 opacity-55" : "bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm"}`}>
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${s.status === "current" ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md" : s.status === "done" ? "bg-slate-200 text-slate-500" : "bg-slate-100 text-indigo-700"}`}>T{s.period}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{s.subjectName}</h4>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">Lop {s.className}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">Gio: {s.time} • Phong: {s.room || "Chua xep"}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {s.status === "current" && <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black shadow-sm">Dang day</span>}
                        {s.status === "done" && <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">Da day</span>}
                        <Link href="/teacher/journal" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-700 hover:border-indigo-200 transition" title="Vao so dau bai"><NotebookPen className="w-4 h-4" /></Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center"><Bell className="w-4 h-4 text-amber-600" /></div>
                  <h3 className="text-sm font-black text-slate-900">Nhac Nho Cong Viec Ngay</h3>
                </div>
                {incompleteList.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>Thay/Co da hoan thanh day du bao cao & diem danh!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incompleteList.map((item, idx) => (
                      <Link key={idx} href={item.href} className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 hover:bg-amber-100 transition group">
                        <span className="text-xs font-bold truncate">{item.label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">{item.count}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Zap className="w-4 h-4 text-indigo-600" /></div>
                  <h3 className="text-sm font-black text-slate-900">Thao Tac Nhanh</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: "/teacher/attendance", icon: ClipboardCheck, label: "Diem danh", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200", color: "text-emerald-600" },
                    { href: "/teacher/journal", icon: NotebookPen, label: "So dau bai", bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200", color: "text-indigo-600" },
                    { href: "/teacher/grades", icon: Calculator, label: "Nhap diem", bg: "bg-violet-50 hover:bg-violet-100 border-violet-200", color: "text-violet-600" },
                    { href: "/teacher/daily-report", icon: Sparkles, label: "Bao cao ngay", bg: "bg-amber-50 hover:bg-amber-100 border-amber-200", color: "text-amber-600" },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.href} href={action.href} className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border ${action.bg} transition-all group`}>
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"><Icon className={`w-4 h-4 ${action.color}`} /></div>
                        <p className="text-xs font-black text-slate-800 text-center">{action.label}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "timetable" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md"><Calendar className="w-4 h-4 text-white" /></div>
              <h2 className="text-base font-black text-slate-900">Thoi Khoa Bieu Giang Day Tuan</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">Thu 2 -- Chu Nhat</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead><tr className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3 w-16">Tiet</th>
                {["Thu 2","Thu 3","Thu 4","Thu 5","Thu 6","Thu 7","Chu Nhat"].map(d => <th key={d} className="p-3">{d}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {weekGrid.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-slate-500 font-semibold">Chua co du lieu thoi khoa bieu tuan.</td></tr>
                ) : weekGrid.map((row) => (
                  <tr key={row.period} className="hover:bg-slate-50/50">
                    <td className="p-3 font-black text-slate-700 bg-slate-50/80 border-r border-slate-200">T{row.period}</td>
                    {row.slots.map((slot, idx) => (
                      <td key={idx} className="p-2 border-r border-slate-100">
                        {slot ? <div className="p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-left space-y-0.5"><p className="font-black text-xs text-indigo-900">{slot.subjectName}</p><p className="text-[10px] text-indigo-600 font-bold">Lop {slot.className}</p>{slot.room && <p className="text-[9px] text-slate-500 font-semibold">P. {slot.room}</p>}</div> : <span className="text-slate-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md"><BookOpen className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-black text-slate-900">Danh Sach Mon Giang Day</h2>
          </div>
          {courses.length === 0 ? <div className="py-12 text-center text-slate-500 font-semibold">Chua co du lieu mon phan cong.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c, i) => (
                <div key={c.subjectId} className={`card-reveal card-reveal-${(i % 6) + 1} bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3 hover:shadow-md hover:border-indigo-200 transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md"><BookOpen className="w-5 h-5" /></div>
                    <div><h3 className="text-sm font-black text-slate-900">{c.subjectName}</h3><p className="text-xs text-slate-500 font-semibold">{c.classes.length} lop giang day</p></div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    {c.classes.map((cls) => (
                      <div key={cls.classId} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 hover:border-indigo-200 transition-colors">
                        <span>Lop {cls.className} (Khoi {cls.gradeLevel})</span>
                        <Link href="/teacher/grades" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">So diem <ChevronRight className="w-3 h-3" /></Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "homeroom" && homeroom && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Lop Chu Nhiem", value: homeroom.name, sub: `Si so: ${homeroom.totalStudents} hoc sinh`, icon: Users, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-700", delay: "card-reveal-1" },
              competition ? { label: "Chuyen Can Tuan Nay", value: `${competition.weekAttendanceRate}%`, sub: `${competition.weekAbsences} luot vang - ${competition.weekViolations} vi pham`, icon: Award, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", valueColor: "text-indigo-700", delay: "card-reveal-2" } : { label: "Chuyen Can", value: "-", sub: "Chua co du lieu", icon: Award, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", valueColor: "text-indigo-700", delay: "card-reveal-2" },
              { label: "Bao Cao Ngay BGH", value: dailyReport.exists ? "Da gui" : "Chua nop", sub: dailyReport.status || "Chua khoi tao", icon: Sparkles, iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: dailyReport.exists ? "text-emerald-600" : "text-amber-600", delay: "card-reveal-3" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`card-reveal ${card.delay} bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className="flex items-start justify-between">
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{card.label}</p><h3 className={`text-xl font-black ${card.valueColor}`}>{card.value}</h3><p className="text-[11px] text-slate-500 font-semibold mt-1">{card.sub}</p></div>
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${card.iconColor}`} /></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md"><MessageSquare className="w-4 h-4 text-white" /></div>
              <h3 className="text-base font-black text-slate-900">Phan Hoi Phu Huynh Chua Xu Ly</h3>
              {unreadFeedbacks.length > 0 && <span className="ml-auto text-xs bg-rose-100 text-rose-700 font-black px-2.5 py-1 rounded-full border border-rose-200 animate-badge-pop">{unreadFeedbacks.length} moi</span>}
            </div>
            {unreadFeedbacks.length === 0 ? (
              <div className="py-8 text-center space-y-2"><CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" /><p className="text-xs text-slate-500 italic font-semibold">Khong co tin nhan phan hoi moi tu phu huynh.</p></div>
            ) : (
              <div className="space-y-3">
                {unreadFeedbacks.map((f) => (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:bg-blue-50/40 hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">HS: {f.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-white px-2 py-0.5 rounded-lg border border-slate-200">{new Date(f.date).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{f.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}