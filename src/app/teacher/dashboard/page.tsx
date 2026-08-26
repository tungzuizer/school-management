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
  Users, CheckCircle2, AlertTriangle, Clock, Calendar, BookOpen, Sparkles,
  MessageSquare, ChevronRight, Bell, RefreshCw, NotebookPen, Calculator,
  ClipboardCheck, Zap, Award,
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
  const userName = session?.user?.name || "Thay / Co";
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"360" | "timetable" | "courses" | "homeroom">("360");
  const [showConfetti, setShowConfetti] = useState(false);
  const [praiseModalOpen, setPraiseModalOpen] = useState(false);
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
        if (attData.attendanceRate >= 95 && repData.exists) setShowConfetti(true);
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
    { key: "360" as const, label: "Bang Dieu Khien 360 deg", icon: Zap, color: "text-slate-900", activeText: "text-slate-900", activeBorder: "border-slate-200" },
    { key: "timetable" as const, label: "Thoi Khoa Bieu Tuan", icon: Calendar, color: "text-blue-600", activeText: "text-blue-700", activeBorder: "border-blue-200" },
    { key: "courses" as const, label: "Mon Giang Day", icon: BookOpen, color: "text-violet-600", activeText: "text-violet-700", activeBorder: "border-violet-200" },
    ...(homeroom ? [{ key: "homeroom" as const, label: `Goc Chu Nhiem ${homeroom.name}`, icon: Users, color: "text-emerald-600", activeText: "text-emerald-700", activeBorder: "border-emerald-200" }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

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

      <div className="relative overflow-hidden rounded-3xl shadow-xl animate-hero-reveal">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(165,180,252,0.2),transparent_55%)]" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/8 rounded-full blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md text-white rounded-xl text-xs font-black border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" /> He Thong Quan Ly Giao Duc Thong Minh
                </span>
                {homeroom && (
                  <span className="px-3 py-1 bg-emerald-500/30 backdrop-blur-md text-emerald-200 rounded-xl text-xs font-black border border-emerald-400/40">
                    GVCN Lop {homeroom.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Kinh chao {userName}! 🌟</h1>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl font-semibold leading-relaxed">
                {schedules.length > 0
                  ? `Hom nay Thay/Co co ${schedules.length} tiet giang day. ${currentPeriodItem ? `Hien tai dang dien ra tiet ${currentPeriodItem.period} mon ${currentPeriodItem.subjectName}.` : "Chuc Thay/Co mot ngay lam viec hieu qua!"}`
                  : "Hom nay Thay/Co khong co lich day tren thoi khoa bieu. Hay danh thoi gian soan bai va dong hanh cung hoc sinh!"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button onClick={() => setPraiseModalOpen(true)} className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-amber-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shimmer-h">
                <Award className="w-4 h-4 text-amber-950 fill-amber-950 relative z-10" />
                <span className="relative z-10">Tuyen Duong Hoc Sinh 🌟</span>
              </button>
              <button onClick={() => loadDashboardData()} className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md text-white transition-all active-press cursor-pointer" title="Lam moi du lieu">
                <RefreshCw className="w-5 h-5" />
              </button>
              {homeroom && (
                <Link href="/teacher/attendance" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-lg hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                  <ClipboardCheck className="w-4 h-4 text-indigo-700" /> <span>Diem Danh Lop {homeroom.name}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <DailyPositivityWidget role="teacher" className="shadow-xs" />

      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive ? `bg-white shadow-sm border ${tab.activeBorder} ${tab.activeText}` : "text-slate-600 hover:text-slate-900 hover:bg-white/60"}`}>
              <Icon className={`w-4 h-4 ${isActive ? tab.color : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "360" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tiet Day Hom Nay", value: `${schedules.length} tiet`, sub: currentPeriodItem ? `Dang hoc: Tiet ${currentPeriodItem.period}` : "Khong co tiet dang day", icon: Clock, iconBg: "bg-indigo-100", iconColor: "text-indigo-600", valueColor: "text-indigo-700", delay: "card-reveal-1" },
              ...(homeroom && attendance ? [{ label: `Hien Dien Lop ${homeroom.name}`, value: `${attendance.attendanceRate}%`, sub: `${attendance.presentCount}/${attendance.totalStudents} co mat (${attendance.absentCount} vang)`, icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-600", delay: "card-reveal-2" }] : [{ label: "Vai Tro Day", value: "Bo mon", sub: "Chua phan cong chu nhiem", icon: BookOpen, iconBg: "bg-blue-100", iconColor: "text-blue-600", valueColor: "text-blue-600", delay: "card-reveal-2" }]),
              { label: "Hoc Sinh Can Ho Tro", value: `${totalRisks} hoc sinh`, sub: "Canh bao hoc tap & thi dua", icon: AlertTriangle, iconBg: "bg-rose-100", iconColor: "text-rose-600", valueColor: "text-rose-600", delay: "card-reveal-3" },
              { label: "Tac Vu Can Xu Ly", value: `${incompleteList.length} viec`, sub: "Nhac nho cong viec ngay", icon: Bell, iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: "text-amber-600", delay: "card-reveal-4" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`card-reveal ${card.delay} bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">{card.label}</p>
                      <h3 className={`text-2xl font-black ${card.valueColor} animate-number-reveal`}>{card.value}</h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-1">{card.sub}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${card.iconColor}`} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md"><Clock className="w-4 h-4 text-white" /></div>
                  <h2 className="text-base font-black text-slate-900">Lich Giang Day Hom Nay</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}</span>
              </div>
              {schedules.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto"><Calendar className="w-6 h-6 text-slate-400" /></div>
                  <p className="text-sm font-semibold text-slate-500">Hom nay khong co tiet day theo thoi khoa bieu.</p>
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

      <StudentPraiseModal isOpen={praiseModalOpen} onClose={() => setPraiseModalOpen(false)} teacherUserId={session?.user?.id || ""} onSuccess={() => setShowConfetti(true)} />
    </div>
  );
}