"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Calculator,
  Sun,
  CloudSun,
  Sunset,
  TrendingDown,
  ShieldAlert,
  Heart,
  MessageSquare,
  ListChecks,
  Trophy,
  FolderOpen,
  RefreshCw,
  Loader2,
} from "lucide-react";
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
  getIncompleteRecords,
} from "./actions";

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
type ScheduleSlot = { period: number; time: string; subjectName: string; className: string; room: string | null; status: "done" | "current" | "upcoming" };
type AtRiskStudent = { id: string; name: string; avgScore: number; failedSubjects: number };
type ViolationStudent = { id: string; name: string; count: number; latest: string };
type CounselingStudent = { id: string; studentId: string; studentName: string; type: string; riskScore: number; description: string | null };
type ParentFeedback = { id: string; studentName: string; content: string; channel: string | null; date: string };
type ReportStatus = { exists: boolean; status: string | null; sentAt: string | null };
type CompetitionStats = { weekAttendanceRate: number; weekAbsences: number; weekViolations: number };
type IncompleteRecord = { label: string; count: number; href: string };

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [dashData, setDashData] = useState<DashboardData>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [atRiskAcademic, setAtRiskAcademic] = useState<AtRiskStudent[]>([]);
  const [atRiskViolations, setAtRiskViolations] = useState<ViolationStudent[]>([]);
  const [counseling, setCounseling] = useState<CounselingStudent[]>([]);
  const [parentFeedbacks, setParentFeedbacks] = useState<ParentFeedback[]>([]);
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null);
  const [competition, setCompetition] = useState<CompetitionStats | null>(null);
  const [incompleteRecords, setIncompleteRecords] = useState<IncompleteRecord[]>([]);

  // UI states
  const [expandedPeriod, setExpandedPeriod] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await getTeacherDashboardData(session.user.id);
      setDashData(data);

      if (!data) return;

      // Load schedule (doesn't need homeroom class)
      const sched = await getTodaySchedule(data.teacherId);
      setSchedule(sched);

      // If teacher has homeroom class, load all GVCN widgets
      if (data.homeroomClass) {
        const classId = data.homeroomClass.id;
        const [att, risk, viol, couns, fb, rpt, comp, inc] = await Promise.all([
          getTodayAttendance(classId),
          getAtRiskAcademic(classId),
          getAtRiskViolations(classId),
          getStudentsNeedingCounseling(classId),
          getUnreadParentFeedbacks(classId),
          getDailyReportStatus(classId),
          getClassCompetitionStats(classId),
          getIncompleteRecords(classId),
        ]);
        setAttendance(att);
        setAtRiskAcademic(risk);
        setAtRiskViolations(viol);
        setCounseling(couns);
        setParentFeedbacks(fb);
        setReportStatus(rpt);
        setCompetition(comp);
        setIncompleteRecords(inc);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  const today = new Date();
  const dayNames = ["Chu nhat", "Thu 2", "Thu 3", "Thu 4", "Thu 5", "Thu 6", "Thu 7"];
  const userName = session?.user?.name || "Giao vien";

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return { text: "Chao buoi sang", icon: Sun, color: "text-amber-500" };
    if (hour < 17) return { text: "Chao buoi chieu", icon: CloudSun, color: "text-orange-500" };
    return { text: "Chao buoi toi", icon: Sunset, color: "text-indigo-500" };
  };
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const hc = dashData?.homeroomClass;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* ===== Greeting + Refresh ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{greeting.text}, {userName}!</h1>
            <p className="text-sm text-gray-500">
              {dayNames[today.getDay()]}, {today.toLocaleDateString("vi-VN")}
              {hc && <span className="ml-2 text-emerald-600 font-semibold">| CN: {hc.name}</span>}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          title="Lam moi"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ===== No homeroom warning ===== */}
      {!hc && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-amber-800 font-semibold">Ban chua duoc phan cong chu nhiem lop nao</p>
          <p className="text-sm text-amber-600 mt-1">Chi hien thi lich day. Lien he quan tri vien de duoc phan cong.</p>
        </div>
      )}

      {/* ===== SECTION: Incomplete Records Alert ===== */}
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

      {/* ===== SECTION: Attendance Today (Widget 1, 2, 3) ===== */}
      {hc && attendance && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Chuyen can hom nay - {hc.name}
            </h3>
            <span className="text-xs text-gray-400">Si so: {hc.totalStudents}</span>
          </div>

          {/* Stats row */}
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

          {/* Absent list */}
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

          {/* Late list */}
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

          {/* Unmarked warning */}
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

      {/* ===== SECTION: Today's Schedule ===== */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Lich day hom nay
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {schedule.length} tiet
          </span>
        </div>

        {schedule.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Hom nay khong co tiet day</p>
        ) : (
          <div className="space-y-1.5">
            {schedule.map((slot) => (
              <div key={slot.period}>
                <button
                  onClick={() => setExpandedPeriod(expandedPeriod === slot.period ? null : slot.period)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    slot.status === "current"
                      ? "bg-blue-50 border-blue-300 shadow-sm"
                      : slot.status === "done"
                      ? "bg-gray-50 border-gray-200 opacity-60"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                    slot.status === "current" ? "bg-blue-600 text-white"
                    : slot.status === "done" ? "bg-gray-300 text-white"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    <span className="text-[9px] leading-none">Tiet</span>
                    <span className="text-base font-bold leading-none">{slot.period}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-sm">{slot.subjectName}</span>
                      {slot.status === "current" && (
                        <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">DANG DAY</span>
                      )}
                      {slot.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <p className="text-xs text-gray-500">{slot.className} | {slot.time} | {slot.room || "—"}</p>
                  </div>
                  {expandedPeriod === slot.period ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedPeriod === slot.period && (
                  <div className="ml-13 mt-1 mb-1.5 flex gap-2 pl-14">
                    <Link href={`/teacher/attendance?class=${slot.className}&period=${slot.period}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 border border-teal-200">
                      <Users className="w-3.5 h-3.5" /> Diem danh
                    </Link>
                    <Link href={`/teacher/grades?class=${slot.className}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 border border-indigo-200">
                      <Calculator className="w-3.5 h-3.5" /> Nhap diem
                    </Link>
                    <Link href={`/teacher/journal?class=${slot.className}&period=${slot.period}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 border border-purple-200">
                      <FileBarChart className="w-3.5 h-3.5" /> So dau bai
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== SECTION: Risk Alerts Grid ===== */}
      {hc && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* At-risk Academic (Widget 5) */}
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
                          {s.failedSubjects} mon yeu
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {atRiskAcademic.length > 5 && (
                  <p className="text-[10px] text-gray-400 text-center">va {atRiskAcademic.length - 5} HS khac...</p>
                )}
              </div>
            )}
          </div>

          {/* At-risk Violations (Widget 6) */}
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

          {/* Students needing counseling (Widget 7) */}
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
                        Rui ro: {s.riskScore}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-gray-500 mt-0.5 truncate">{s.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thi đua (Widget 10) */}
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
      )}

      {/* ===== SECTION: Parent feedbacks (Widget 8) ===== */}
      {hc && parentFeedbacks.length > 0 && (
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
                Xem tat ca ({parentFeedbacks.length}) →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ===== SECTION: Daily Report (Widget 9) ===== */}
      {hc && (
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
            <>
              <p className="text-xs text-gray-500 mt-2">
                Bam tao bao cao de AI tong hop tinh hinh lop trong ngay.
              </p>
              <Link
                href="/teacher/daily-report"
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition text-sm"
              >
                <FileBarChart className="w-4 h-4" />
                Tao bao cao ngay
              </Link>
            </>
          )}
          {reportStatus?.exists && reportStatus.status !== "SENT" && (
            <Link
              href="/teacher/daily-report"
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200 transition text-sm"
            >
              Hoan thanh va gui bao cao →
            </Link>
          )}
        </div>
      )}

      {/* ===== Quick Links ===== */}
      {hc && (
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
      )}
    </div>
  );
}
