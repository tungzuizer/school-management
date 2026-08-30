"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  LayoutGrid,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Building,
  Calendar,
  Sparkles,
  FileText,
  Upload,
  UserPlus,
  Crown,
  Star,
  X,
} from "lucide-react";
import {
  getHomeroomClass,
  getClassStudents,
  getGroups,
  createGroup,
  deleteGroup,
  assignStudentToGroup,
  getSeatingChart,
  saveSeatingChart,
  copySeatingChart,
  getConductRecords,
  saveConductRecord,
  getClassGradeBoard,
  getIncidents,
  createIncident,
  getParentFeedbacks,
  createParentFeedback,
  getClassSizeByPeriods,
  getAcademicCalendar,
  saveAcademicCalendar,
  getAIMonthlyReminder,
  getMonthlyPlan,
  saveMonthlyPlan,
  saveWeeklyActivity,
  addStudentToHomeroomClass,
  setClassMonitor,
  setStudentClassRole,
  quickSetupFourGroups,
  recordParticipationBonus,
  getParticipationRecords,
} from "./actions";

// ============ Types ============
type ClassInfo = {
  id: string;
  name: string;
  gradeLevel: number;
  schoolId: string;
  school: { name: string };
  campus: { name: string } | null;
  _count: { students: number };
};

type StudentItem = {
  id: string;
  user: { name: string; email: string };
  group: { id: string; name: string } | null;
  studentCode: string | null;
  status: string;
  isClassMonitor?: boolean;
  classRole?: string | null;
  bonusPoints?: number;
};

type GroupItem = {
  id: string;
  name: string;
  students: { id: string; user: { name: string } }[];
};

type IncidentItem = {
  id: string;
  date: Date;
  type: "VIOLATION" | "COMMENDATION";
  description: string;
  reportedBy: string | null;
  student: { user: { name: string } };
};

type FeedbackItem = {
  id: string;
  date: Date;
  channel: string | null;
  content: string;
  response: string | null;
  student: { user: { name: string } };
};

type GradeItem = {
  studentId: string;
  subjectId: string;
  type: string;
  score: number;
};

// Tab definitions
const TABS = [
  { key: "overview", label: "📊 Tổng quan lớp" },
  { key: "students", label: "👥 Danh sách & Thêm Học sinh" },
  { key: "seating", label: "🎬 Sơ đồ Lớp & Tuyên dương" },
  { key: "groups", label: "🚩 Quản lý Tổ" },
  { key: "conduct", label: "⭐ Rèn luyện & Thi đua" },
  { key: "grades", label: "📝 Bảng điểm lớp" },
  { key: "incidents", label: "⚠️ Vi phạm / Tuyên dương" },
  { key: "feedback", label: "💬 Phối hợp phụ huynh" },
  { key: "monthly_plan", label: "📅 Kế hoạch & Sinh hoạt" },
  { key: "ai_reminder", label: "🤖 Trợ lý AI" },
] as const;

const TAB_ICONS: Record<string, React.ElementType> = {
  overview: Users,
  students: UserPlus,
  seating: LayoutGrid,
  groups: Users,
  conduct: Star,
  grades: ClipboardList,
  incidents: AlertTriangle,
  feedback: MessageSquare,
  monthly_plan: FileText,
  ai_reminder: Sparkles,
};

const PERIODS = [
  { value: "MONTH_9", label: "Tháng 9" },
  { value: "MONTH_10", label: "Tháng 10" },
  { value: "MONTH_11", label: "Tháng 11" },
  { value: "MONTH_12", label: "Tháng 12" },
  { value: "MONTH_1", label: "Tháng 1" },
  { value: "MONTH_2", label: "Tháng 2" },
  { value: "MONTH_3", label: "Tháng 3" },
  { value: "MONTH_4", label: "Tháng 4" },
  { value: "MONTH_5", label: "Tháng 5" },
  { value: "MID_HK1", label: "Giữa HKI" },
  { value: "HK1", label: "Cuối HKI" },
  { value: "MID_HK2", label: "Giữa HKII" },
  { value: "HK2", label: "Cuối HKII" },
  { value: "FULL_YEAR", label: "Cả năm" },
];

const CONDUCT_OPTIONS = [
  { value: "TOT", label: "Tốt" },
  { value: "KHA", label: "Khá" },
  { value: "DAT", label: "Đạt" },
  { value: "CHUA_DAT", label: "Chưa đạt" },
];

const ACADEMIC_OPTIONS = [
  { value: "GIOI", label: "Giỏi" },
  { value: "KHA", label: "Khá" },
  { value: "DAT", label: "Đạt" },
  { value: "CHUA_DAT", label: "Chưa đạt" },
];

export default function HomeroomPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<string>("overview");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [autoOpenAdd, setAutoOpenAdd] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      const urlAction = params.get("action");
      if (urlTab) {
        setTab(urlTab);
      }
      if (urlAction === "add-student") {
        setTab("students");
        setAutoOpenAdd(true);
      }
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadData() {
    setLoading(true);
    try {
      const cls = await getHomeroomClass(session!.user!.id);
      if (cls) {
        setClassInfo(cls as unknown as ClassInfo);
        const sts = await getClassStudents(cls.id);
        setStudents(sts as unknown as StudentItem[]);
      }
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-blue-600" />
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h2 className="text-lg font-semibold text-yellow-800">Bạn chưa được phân công chủ nhiệm lớp nào</h2>
        <p className="text-yellow-600 mt-2">Liên hệ quản trị viên để được phân công.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl shadow-sm">
        <h1 className="text-2xl font-bold text-gray-905 flex items-center gap-2">
           <BookOpen className="w-6 h-6 text-emerald-600" /> Sổ Chủ Nhiệm Điện Tử
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
          <span className="flex items-center gap-1"><Users className="w-4 h-4 text-blue-800" /> Lớp: {classInfo.name}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-blue-800" /> Khối: {classInfo.gradeLevel}</span>
          <span className="flex items-center gap-1"><Building className="w-4 h-4 text-blue-800" /> Trường: {classInfo.school.name}</span>
          {classInfo.campus && <span className="flex items-center gap-1"><Building className="w-4 h-4 text-blue-800" /> Phân hiệu: {classInfo.campus.name}</span>}
          <span className="flex items-center gap-1"><Users className="w-4 h-4 text-blue-800" /> Sĩ số: {classInfo._count.students} học sinh</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = TAB_ICONS[t.key] || Users;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-white text-indigo-950 shadow-xs border border-indigo-200"
                    : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-700" : "text-blue-800"}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <OverviewTab
              classId={classInfo.id}
              students={students}
              showToast={showToast}
              onReload={loadData}
            />
          )}
          {tab === "students" && (
            <StudentsTab
              classId={classInfo.id}
              students={students}
              showToast={showToast}
              onReload={loadData}
              initialShowAdd={autoOpenAdd}
            />
          )}
          {tab === "groups" && <GroupsTab classId={classInfo.id} students={students} showToast={showToast} onReload={loadData} />}
          {tab === "seating" && <SeatingTab classId={classInfo.id} students={students} showToast={showToast} onReload={loadData} />}
          {tab === "conduct" && <ConductTab classId={classInfo.id} showToast={showToast} />}
          {tab === "grades" && <GradesTab classId={classInfo.id} />}
          {tab === "incidents" && <IncidentsTab classId={classInfo.id} students={students} showToast={showToast} />}
          {tab === "feedback" && <FeedbackTab classId={classInfo.id} students={students} showToast={showToast} />}
          {tab === "monthly_plan" && <MonthlyPlanTab classId={classInfo.id} showToast={showToast} />}
          {tab === "ai_reminder" && <AIReminderTab schoolId={classInfo.schoolId} className={classInfo.name} showToast={showToast} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// Role definitions
const CLASS_ROLE_OPTIONS = [
  { value: "LOP_TRUONG", label: "👑 Lớp trưởng", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "LOP_PHO_HOC_TAP", label: "📚 Lớp phó Học tập", color: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "LOP_PHO_KY_LUAT", label: "🛡️ Lớp phó Kỷ luật", color: "bg-purple-100 text-purple-900 border-purple-300" },
  { value: "TO_TRUONG", label: "🚩 Tổ trưởng", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { value: "", label: "👤 Học sinh", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

// ============ STUDENTS TAB (Thêm & Quản lý Học sinh) ============
function StudentsTab({
  classId,
  students,
  showToast,
  onReload,
  initialShowAdd = false,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
  onReload: () => void;
  initialShowAdd?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(initialShowAdd);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Bonus Points Modal state
  const [bonusStudent, setBonusStudent] = useState<StudentItem | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(1);
  const [bonusCategory, setBonusCategory] = useState<string>("PHAT_BIEU");
  const [bonusTitle, setBonusTitle] = useState<string>("Phát biểu xây dựng bài");
  const [bonusNote, setBonusNote] = useState<string>("");
  const [savingBonus, setSavingBonus] = useState(false);

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.user.name.toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q))
    );
  });

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !studentCode.trim()) {
      setAddError("Vui lòng nhập Họ tên và Mã học sinh");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      await addStudentToHomeroomClass({
        classId,
        name,
        studentCode,
        dob: dob || undefined,
        gender,
        phone: phone || undefined,
        email: email || undefined,
      });
      showToast(`Đã thêm thành công học sinh ${name}!`);
      setName("");
      setStudentCode("");
      setDob("");
      setPhone("");
      setEmail("");
      setShowAddModal(false);
      onReload();
    } catch (err: any) {
      setAddError(err.message || "Đã xảy ra lỗi khi thêm học sinh");
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(studentId: string, newRole: string) {
    try {
      await setStudentClassRole(studentId, newRole || null);
      const student = students.find((s) => s.id === studentId);
      const roleLabel = CLASS_ROLE_OPTIONS.find((r) => r.value === newRole)?.label || "Học sinh";
      showToast(`Đã cập nhật chức danh ${roleLabel} cho ${student?.user.name}`);
      onReload();
    } catch {
      showToast("Lỗi khi cập nhật chức danh học sinh");
    }
  }

  async function handleSaveBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!bonusStudent) return;
    setSavingBonus(true);
    try {
      await recordParticipationBonus({
        studentId: bonusStudent.id,
        classId,
        title: bonusTitle,
        category: bonusCategory,
        points: bonusPoints,
        note: bonusNote || undefined,
      });
      showToast(`Đã cộng +${bonusPoints} điểm thưởng cho ${bonusStudent.user.name}!`);
      setBonusStudent(null);
      setBonusTitle("Phát biểu xây dựng bài");
      setBonusNote("");
      onReload();
    } catch {
      showToast("Lỗi khi ghi nhận điểm thưởng");
    } finally {
      setSavingBonus(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner & Main Actions */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
            <UserPlus className="w-4 h-4" /> Quản lý danh sách lớp
          </div>
          <h2 className="text-xl font-black">Danh Sách Học Sinh Lớp Chủ Nhiệm</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Thêm mới học sinh, phân công ban cán sự lớp (👑 Lớp trưởng, 📚 Lớp phó) và tuyên dương thưởng điểm.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-105 cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" /> + Thêm Học Sinh Mới
        </button>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-3 pr-8 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
          />
        </div>
        <div className="text-xs font-bold text-slate-600">
          Hiển thị: <span className="text-indigo-600 font-extrabold">{filteredStudents.length}</span> / {students.length} học sinh
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-extrabold border-b border-slate-200">
                <th className="p-3 w-12 text-center">STT</th>
                <th className="p-3">Họ và Tên</th>
                <th className="p-3 w-32">Mã Học Sinh</th>
                <th className="p-3 w-40">Chức Danh Ban Cán Sự</th>
                <th className="p-3 w-28">Tổ</th>
                <th className="p-3 w-32 text-center">Điểm Tích Cực</th>
                <th className="p-3 w-32 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.user.email}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">
                      {s.studentCode || "--"}
                    </td>
                    <td className="p-3">
                      <select
                        value={s.classRole || ""}
                        onChange={(e) => handleRoleChange(s.id, e.target.value)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-bold outline-none cursor-pointer ${
                          CLASS_ROLE_OPTIONS.find((r) => r.value === (s.classRole || ""))?.color ||
                          "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        {CLASS_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {s.group ? s.group.name : <span className="text-slate-400 text-[11px]">Chưa xếp tổ</span>}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 font-black text-xs px-2.5 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        +{s.bonusPoints || 0}đ
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setBonusStudent(s)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-amber-600 fill-amber-400" />
                        + Cộng điểm
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Học Sinh Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Thêm Học Sinh Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và Tên Học Sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập đầy đủ Họ và Tên..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Học Sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: HS10A1-001"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email đăng nhập (Tuỳ chọn)
                </label>
                <input
                  type="email"
                  placeholder="Để trống sẽ tự tạo (VD: nguyenvana.hs10a1@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mật khẩu khởi tạo mặc định cho học sinh mới là <strong className="font-mono text-amber-700">abc123</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {adding ? "Đang lưu..." : "Thêm Học Sinh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đánh giá & Cộng điểm tích cực */}
      {bonusStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Cộng Điểm Tích Cực — {bonusStudent.user.name}
              </h3>
              <button
                onClick={() => setBonusStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung / Hành vi tích cực</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phát biểu chính xác bài toán khó..."
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân loại hoạt động</label>
                <select
                  value={bonusCategory}
                  onChange={(e) => {
                    setBonusCategory(e.target.value);
                    if (e.target.value === "PHAT_BIEU") setBonusTitle("Phát biểu xây dựng bài");
                    else if (e.target.value === "BAI_TAP") setBonusTitle("Bài tập xuất sắc");
                    else if (e.target.value === "HO_TRO") setBonusTitle("Hỗ trợ bạn học");
                    else if (e.target.value === "PHONG_TRAO") setBonusTitle("Tích cực phong trào lớp");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="PHAT_BIEU">🙋♂️ Phát biểu xây dựng bài (+1đ)</option>
                  <option value="BAI_TAP">📝 Bài tập xuất sắc / Sáng tạo (+2đ)</option>
                  <option value="HO_TRO">🤝 Hỗ trợ bạn học (+2đ)</option>
                  <option value="PHONG_TRAO">🏆 Hoạt động phong trào (+5đ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điểm cộng thưởng</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPoints(pts)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        bonusPoints === pts
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      +{pts} Điểm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú bổ sung (Tuỳ chọn)</label>
                <textarea
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="Ghi chú ngắn cho học sinh..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBonusStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingBonus ? "Đang lưu..." : "Xác nhận Cộng điểm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({
  classId,
  students,
  showToast,
  onReload,
  initialShowAdd = false,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
  onReload: () => void;
  initialShowAdd?: boolean;
}) {
  const [periodData, setPeriodData] = useState<Array<{
    period: string;
    total: number;
    conduct: Record<string, number>;
    academic: Record<string, number>;
  }>>([]);

  const [showAddModal, setShowAddModal] = useState(initialShowAdd);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const [name, setName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Bonus Points Modal state
  const [bonusStudent, setBonusStudent] = useState<StudentItem | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(1);
  const [bonusCategory, setBonusCategory] = useState<string>("PHAT_BIEU");
  const [bonusTitle, setBonusTitle] = useState<string>("Phát biểu xây dựng bài");
  const [bonusNote, setBonusNote] = useState<string>("");
  const [savingBonus, setSavingBonus] = useState(false);

  useEffect(() => {
    getClassSizeByPeriods(classId).then(setPeriodData);
  }, [classId]);

  const currentMonitor = students.find((s) => s.isClassMonitor || s.classRole === "LOP_TRUONG");

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !studentCode.trim()) {
      setAddError("Vui lòng nhập Họ tên và Mã học sinh");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      await addStudentToHomeroomClass({
        classId,
        name,
        studentCode,
        dob: dob || undefined,
        gender,
        phone: phone || undefined,
        email: email || undefined,
      });
      showToast(`Đã thêm thành công học sinh ${name}!`);
      setName("");
      setStudentCode("");
      setDob("");
      setPhone("");
      setEmail("");
      setShowAddModal(false);
      onReload();
    } catch (err: any) {
      setAddError(err.message || "Đã xảy ra lỗi khi thêm học sinh");
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(studentId: string, newRole: string) {
    try {
      await setStudentClassRole(studentId, newRole || null);
      const student = students.find((s) => s.id === studentId);
      const roleLabel = CLASS_ROLE_OPTIONS.find((r) => r.value === newRole)?.label || "Học sinh";
      showToast(`Đã cập nhật chức danh ${roleLabel} cho ${student?.user.name}`);
      onReload();
    } catch {
      showToast("Lỗi khi cập nhật chức danh học sinh");
    }
  }

  async function handleSaveBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!bonusStudent) return;
    setSavingBonus(true);
    try {
      await recordParticipationBonus({
        studentId: bonusStudent.id,
        classId,
        title: bonusTitle.trim() || "Hoạt động tích cực",
        category: bonusCategory,
        points: Number(bonusPoints) || 1,
        note: bonusNote.trim() || undefined,
      });
      showToast(`Cộng +${bonusPoints} điểm tích cực cho ${bonusStudent.user.name} thành công!`);
      setBonusStudent(null);
      setBonusNote("");
      onReload();
    } catch {
      showToast("Lỗi khi ghi nhận điểm tích cực");
    } finally {
      setSavingBonus(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar: Sĩ số, Lớp trưởng & Thêm Học sinh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Danh sách học sinh ({students.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Lớp trưởng hiện tại:{" "}
            {currentMonitor ? (
              <span className="font-bold text-amber-700 inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded text-xs border border-amber-200">
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {currentMonitor.user.name}
              </span>
            ) : (
              <span className="italic text-slate-400">Chưa bổ nhiệm</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Thêm học sinh
          </button>
        </div>
      </div>

      {/* Modal Thêm Học Sinh */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Thêm Học Sinh Mới Vào Lớp
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Việt Tùng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: FPT-HS141"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email đăng nhập (Tuỳ chọn)
                </label>
                <input
                  type="email"
                  placeholder="Để trống sẽ tự động tạo (VD: tungnvfpths141@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Mật khẩu khởi tạo mặc định cho học sinh mới là <strong className="font-mono text-amber-700">abc123</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  {adding ? "Đang lưu..." : "Thêm Học Sinh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đánh giá & Cộng điểm tích cực */}
      {bonusStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                Cộng Điểm Tích Cực — {bonusStudent.user.name}
              </h3>
              <button
                onClick={() => setBonusStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung / Hành vi tích cực</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phát biểu chính xác bài toán khó..."
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân loại hoạt động</label>
                <select
                  value={bonusCategory}
                  onChange={(e) => {
                    setBonusCategory(e.target.value);
                    if (e.target.value === "PHAT_BIEU") setBonusTitle("Phát biểu xây dựng bài");
                    else if (e.target.value === "BAI_TAP") setBonusTitle("Bài tập xuất sắc");
                    else if (e.target.value === "HO_TRO") setBonusTitle("Hỗ trợ bạn học");
                    else if (e.target.value === "PHONG_TRAO") setBonusTitle("Tích cực phong trào lớp");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium"
                >
                  <option value="PHAT_BIEU">🙋♂️ Phát biểu xây dựng bài (+1đ)</option>
                  <option value="BAI_TAP">📝 Bài tập xuất sắc / Sáng tạo (+2đ)</option>
                  <option value="HO_TRO">🤝 Hỗ trợ bạn học (+2đ)</option>
                  <option value="PHONG_TRAO">🏆 Hoạt động phong trào (+5đ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điểm cộng thưởng</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPoints(pts)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        bonusPoints === pts
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      +{pts} Điểm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú bổ sung (Tuỳ chọn)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết cho học sinh hoặc phụ huynh..."
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBonusStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {savingBonus ? "Đang lưu..." : `Cộng +${bonusPoints} Điểm`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bảng danh sách học sinh */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
        <table className="w-full text-sm border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="border-b p-3 text-left w-12">STT</th>
              <th className="border-b p-3 text-left">Họ và tên</th>
              <th className="border-b p-3 text-left">Mã HS</th>
              <th className="border-b p-3 text-left">Chức danh / Ban Cán Sự</th>
              <th className="border-b p-3 text-left">Tổ</th>
              <th className="border-b p-3 text-center">Điểm tích cực</th>
              <th className="border-b p-3 text-left">Trạng thái</th>
              <th className="border-b p-3 text-center w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const currentRole = s.classRole || (s.isClassMonitor ? "LOP_TRUONG" : "");
              const activeRoleObj = CLASS_ROLE_OPTIONS.find((r) => r.value === currentRole);

              return (
                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${currentRole ? "bg-amber-50/20" : ""}`}>
                  <td className="border-b p-3 font-medium text-slate-500">{i + 1}</td>
                  <td className="border-b p-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{s.user.name}</span>
                      {activeRoleObj && activeRoleObj.value && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${activeRoleObj.color}`}>
                          {activeRoleObj.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-b p-3 text-slate-600 font-mono text-xs">{s.studentCode || "—"}</td>

                  {/* Phân quyền Chức Danh */}
                  <td className="border-b p-3">
                    <select
                      value={currentRole}
                      onChange={(e) => handleRoleChange(s.id, e.target.value)}
                      className="text-xs font-semibold p-1.5 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {CLASS_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="border-b p-3 text-slate-700">{s.group?.name || "Chưa xếp tổ"}</td>

                  {/* Điểm tích cực & Nút Cộng điểm */}
                  <td className="border-b p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        +{s.bonusPoints || 0}đ
                      </span>
                      <button
                        onClick={() => {
                          setBonusStudent(s);
                          setBonusPoints(1);
                        }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        title="Đánh giá đóng góp tích cực"
                      >
                        + Cộng điểm
                      </button>
                    </div>
                  </td>

                  <td className="border-b p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      s.status === "STUDYING" ? "bg-emerald-100 text-emerald-800" :
                      s.status === "TRANSFERRED" ? "bg-amber-100 text-amber-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {s.status === "STUDYING" ? "Đang học" :
                       s.status === "TRANSFERRED" ? "Chuyển trường" :
                       s.status === "DROPPED_OUT" ? "Nghỉ học" : "Tốt nghiệp"}
                    </span>
                  </td>

                  <td className="border-b p-3 text-center">
                    <button
                      onClick={() => handleRoleChange(s.id, currentRole === "LOP_TRUONG" ? "" : "LOP_TRUONG")}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        currentRole === "LOP_TRUONG"
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {currentRole === "LOP_TRUONG" ? "Hủy Lớp trưởng" : "👑 Đặt Lớp trưởng"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tình hình sĩ số */}
      {periodData.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3">Tình hình theo giai đoạn</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border p-2">Giai đoạn</th>
                  <th className="border p-2">Sĩ số</th>
                  <th className="border p-2">HL Giỏi</th>
                  <th className="border p-2">HL Khá</th>
                  <th className="border p-2">HL Đạt</th>
                  <th className="border p-2">HL Chưa đạt</th>
                  <th className="border p-2">HK Tốt</th>
                  <th className="border p-2">HK Khá</th>
                  <th className="border p-2">HK Đạt</th>
                </tr>
              </thead>
              <tbody>
                {periodData.map((pd) => (
                  <tr key={pd.period} className="hover:bg-slate-50">
                    <td className="border p-2 font-medium">
                      {PERIODS.find((p) => p.value === pd.period)?.label}
                    </td>
                    <td className="border p-2 text-center">{pd.total}</td>
                    <td className="border p-2 text-center">{pd.academic?.GIOI || 0}</td>
                    <td className="border p-2 text-center">{pd.academic?.KHA || 0}</td>
                    <td className="border p-2 text-center">{pd.academic?.DAT || 0}</td>
                    <td className="border p-2 text-center">{pd.academic?.CHUA_DAT || 0}</td>
                    <td className="border p-2 text-center">{pd.conduct?.TOT || 0}</td>
                    <td className="border p-2 text-center">{pd.conduct?.KHA || 0}</td>
                    <td className="border p-2 text-center">{pd.conduct?.DAT || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ GROUPS TAB ============
function GroupsTab({
  classId,
  students,
  showToast,
  onReload,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
  onReload: () => void;
}) {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function loadGroups() {
    const g = await getGroups(classId);
    setGroups(g as unknown as GroupItem[]);
  }

  async function handleQuickSetupFourGroups() {
    setLoading(true);
    try {
      await quickSetupFourGroups(classId);
      await loadGroups();
      onReload();
      showToast("Đã khởi tạo nhanh 4 Tổ (Tổ 1, Tổ 2, Tổ 3, Tổ 4) thành công!");
    } catch {
      showToast("Lỗi khi khởi tạo nhanh 4 tổ");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setLoading(true);
    await createGroup(classId, newGroupName.trim());
    setNewGroupName("");
    await loadGroups();
    setLoading(false);
    showToast("Đã tạo tổ mới");
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm("Xóa tổ này? Học sinh sẽ bị bỏ khỏi tổ.")) return;
    await deleteGroup(groupId);
    await loadGroups();
    onReload();
    showToast("Đã xóa tổ");
  }

  async function handleAssign(studentId: string, groupId: string | null) {
    await assignStudentToGroup(studentId, groupId || null);
    await loadGroups();
    onReload();
    showToast("Đã cập nhật tổ");
  }

  const unassigned = students.filter((s) => !s.group);

  return (
    <div className="space-y-6">
      {/* Quick Setup & Create group */}
      <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên tổ mới</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="VD: Tổ 1"
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            + Tạo tổ
          </button>
        </div>

        <button
          onClick={handleQuickSetupFourGroups}
          disabled={loading}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
          ⚡ Tạo nhanh 4 Tổ (Tổ 1 - Tổ 4)
        </button>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm">{g.name} ({g.students.length} HS)</h4>
              <button
                onClick={() => handleDeleteGroup(g.id)}
                className="text-rose-500 text-xs font-semibold hover:underline cursor-pointer"
              >
                Xóa tổ
              </button>
            </div>
            <ul className="space-y-2 text-xs">
              {g.students.map((s) => (
                <li key={s.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                  <span className="font-semibold text-slate-800">{s.user.name}</span>
                  <button
                    onClick={() => handleAssign(s.id, null)}
                    className="text-slate-400 hover:text-rose-500 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    title="Bỏ khỏi tổ"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Unassigned students */}
      {unassigned.length > 0 && (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Chưa xếp tổ ({unassigned.length} HS)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {unassigned.map((s) => (
              <div key={s.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="flex-1 font-bold text-slate-800 truncate">{s.user.name}</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAssign(s.id, e.target.value);
                  }}
                  defaultValue=""
                  className="border border-slate-300 rounded-lg px-2 py-1 text-xs outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="">Chọn tổ...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CINEMA CLASSROOM SEATING & EVALUATION TAB ============
function SeatingTab({
  classId,
  students,
  showToast,
  onReload,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
  onReload?: () => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [saving, setSaving] = useState(false);

  // Mode: "eval" (default: click to reward bonus points) or "arrange" (click to assign/move seat)
  const [mode, setMode] = useState<"eval" | "arrange">("eval");

  // Seat Arrangement Modal state
  const [targetSeat, setTargetSeat] = useState<{ r: number; c: number } | null>(null);

  // Instant Evaluation Modal state
  const [bonusStudent, setBonusStudent] = useState<StudentItem | null>(null);
  const [bonusPoints, setBonusPoints] = useState<number>(1);
  const [bonusCategory, setBonusCategory] = useState<string>("PHAT_BIEU");
  const [bonusTitle, setBonusTitle] = useState<string>("Phát biểu xây dựng bài");
  const [bonusNote, setBonusNote] = useState<string>("");
  const [savingBonus, setSavingBonus] = useState(false);

  // Timestamped participation history for selected student
  const [studentHistory, setStudentHistory] = useState<Array<{
    id: string;
    title: string;
    category: string;
    points: number;
    note: string | null;
    createdAt: Date | string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, month, year]);

  useEffect(() => {
    if (bonusStudent) {
      setLoadingHistory(true);
      getParticipationRecords(classId, bonusStudent.id)
        .then((records) => {
          setStudentHistory(records as unknown as typeof studentHistory);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [bonusStudent, classId]);

  async function loadChart() {
    const chart = await getSeatingChart(classId, month, year);
    if (chart) {
      try {
        const parsed = JSON.parse(chart.layoutJson);
        setGrid(parsed.grid || []);
        if (parsed.rows) setRows(parsed.rows);
        if (parsed.cols) setCols(parsed.cols);
      } catch {
        initEmptyGrid();
      }
    } else {
      initEmptyGrid();
    }
  }

  function initEmptyGrid() {
    setGrid(Array.from({ length: rows }, () => Array(cols).fill(null)));
  }

  function getStudentObj(id: string | null) {
    if (!id) return null;
    return students.find((s) => s.id === id) || null;
  }

  function handleCellClick(r: number, c: number) {
    const studentId = grid[r]?.[c];
    const studentObj = getStudentObj(studentId);

    if (mode === "eval") {
      if (studentObj) {
        setBonusStudent(studentObj);
        setBonusPoints(1);
        setBonusCategory("PHAT_BIEU");
        setBonusTitle("Phát biểu xây dựng bài");
        setBonusNote("");
      } else {
        setTargetSeat({ r, c });
      }
    } else {
      // Arrange mode
      setTargetSeat({ r, c });
    }
  }

  function handleAssignStudentToSeat(selectedStudentId: string | null) {
    if (!targetSeat) return;
    const { r, c } = targetSeat;
    const newGrid = grid.map((row) => [...row]);
    if (!newGrid[r]) newGrid[r] = Array(cols).fill(null);
    newGrid[r][c] = selectedStudentId;
    setGrid(newGrid);
    setTargetSeat(null);
  }

  async function handleSaveChart() {
    setSaving(true);
    await saveSeatingChart(classId, month, year, JSON.stringify({ grid, rows, cols }));
    setSaving(false);
    showToast("Đã lưu sơ đồ chỗ ngồi lớp học!");
  }

  async function handleCopyPrevMonth() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    try {
      await copySeatingChart(classId, prevMonth, prevYear, month, year);
      await loadChart();
      showToast("Đã sao chép sơ đồ từ tháng trước");
    } catch {
      showToast("Không tìm thấy sơ đồ tháng trước");
    }
  }

  function handleResize() {
    const newGrid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => grid[r]?.[c] || null)
    );
    setGrid(newGrid);
  }

  async function handleSaveBonusSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bonusStudent) return;
    setSavingBonus(true);
    try {
      await recordParticipationBonus({
        studentId: bonusStudent.id,
        classId,
        title: bonusTitle,
        category: bonusCategory,
        points: bonusPoints,
        note: bonusNote || undefined,
      });
      showToast(`Đã tuyên dương và cộng +${bonusPoints}đ cho ${bonusStudent.user.name}!`);

      // Refresh timestamped history list inside modal
      const updatedRecords = await getParticipationRecords(classId, bonusStudent.id);
      setStudentHistory(updatedRecords as unknown as typeof studentHistory);

      if (onReload) onReload();
    } catch {
      showToast("Lỗi khi tuyên dương học sinh");
    } finally {
      setSavingBonus(false);
    }
  }

  // Get list of placed student IDs
  const placedStudentIds = new Set(grid.flat().filter(Boolean));
  const rowLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="space-y-6">
      {/* Header Banner & Mode Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <LayoutGrid className="w-4 h-4" /> Sơ Đồ Lớp Học Kiểu Rạp Chiếu Phim
          </div>
          <h2 className="text-xl font-black text-white">Sơ Đồ Ghế & Tuyên Dương Trực Tiếp</h2>
          <p className="text-xs text-slate-300 mt-1">
            Bấm trực tiếp vào vị trí ghế của học sinh để mở cửa sổ Tuyên Dương, Cộng Điểm và xem Lịch Sử Đánh Giá theo thời gian!
          </p>
        </div>

        {/* Mode Switch Button Group */}
        <div className="flex items-center bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setMode("eval")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "eval"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Star className="w-4 h-4 fill-current" /> ⭐ Chế Độ Tuyên Dương
          </button>
          <button
            onClick={() => setMode("arrange")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "arrange"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> ⚙️ Chế Độ Xếp Ghế
          </button>
        </div>
      </div>

      {/* Grid Size & Date Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Tháng:</label>
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white font-bold outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Năm:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white w-20 font-mono font-bold outline-none"
            />
          </div>

          <div className="h-4 w-[1px] bg-slate-300 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Hàng:</label>
            <input
              type="number"
              min={1}
              max={12}
              value={rows}
              onChange={(e) => setRows(+e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white w-14 font-bold outline-none text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-700">Cột:</label>
            <input
              type="number"
              min={1}
              max={12}
              value={cols}
              onChange={(e) => setCols(+e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-xl bg-white w-14 font-bold outline-none text-center"
            />
          </div>

          <button
            onClick={handleResize}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đổi Kích Thước
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPrevMonth}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            📋 Sao Chép Tháng Trước
          </button>
          <button
            onClick={handleSaveChart}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Đang lưu..." : "💾 Lưu Sơ Đồ Ghế"}
          </button>
        </div>
      </div>

      {/* CINEMA ROOM STAGE / BLACKBOARD */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-800">
        {/* Cinema Screen Curve */}
        <div className="relative mb-8 text-center">
          <div className="bg-gradient-to-r from-slate-950 via-indigo-900 to-slate-950 text-indigo-200 py-3.5 px-6 rounded-2xl border border-indigo-500/30 shadow-inner relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400 via-indigo-300 to-amber-400" />
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-300 flex items-center justify-center gap-2">
              🎬 BỤC GIẢNG / BẢNG ĐEN LỚP HỌC
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              (Góc nhìn màn hình chiếu từ bục giảng xuống các dãy ghế học sinh)
            </p>
          </div>
        </div>

        {/* CINEMA SEATING GRID */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <div className="flex flex-col gap-3 items-center">
              {Array.from({ length: rows }).map((_, r) => {
                const rowLetter = rowLabels[r] || `R${r + 1}`;
                return (
                  <div key={r} className="flex items-center gap-2">
                    {/* Row Label Badge */}
                    <div className="w-8 text-center font-black text-xs text-amber-400 font-mono">
                      {rowLetter}
                    </div>

                    {/* Seat Cards in this row */}
                    <div className="flex items-center gap-2">
                      {Array.from({ length: cols }).map((_, c) => {
                        const studentId = grid[r]?.[c];
                        const student = getStudentObj(studentId);
                        const seatCode = `${rowLetter}${c + 1}`;

                        return (
                          <div
                            key={c}
                            onClick={() => handleCellClick(r, c)}
                            className={`w-28 h-20 rounded-xl p-2 border flex flex-col justify-between transition-all duration-200 cursor-pointer select-none relative ${
                              student
                                ? "bg-gradient-to-b from-slate-800 to-slate-900 border-indigo-500/50 hover:border-amber-400 hover:scale-105 shadow-md group"
                                : "bg-slate-950/60 border-dashed border-slate-700/80 hover:border-indigo-400 hover:bg-slate-800/50 text-slate-500"
                            }`}
                          >
                            {/* Seat Code Top Label */}
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-slate-400 font-bold">{seatCode}</span>
                              {student && (
                                <span className="bg-amber-500/20 text-amber-300 font-black px-1.5 py-0.2 rounded-full border border-amber-500/30 text-[9px]">
                                  ⭐+{student.bonusPoints || 0}đ
                                </span>
                              )}
                            </div>

                            {/* Main Content: Student Name & Role Badge */}
                            {student ? (
                              <div className="space-y-0.5">
                                <div className="font-extrabold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                                  {student.user.name}
                                </div>
                                <div className="text-[10px] text-indigo-300 font-medium truncate flex items-center gap-1">
                                  {student.classRole === "LOP_TRUONG" && "👑 Lớp trưởng"}
                                  {student.classRole === "LOP_PHO_HOC_TAP" && "📚 Lớp phó HT"}
                                  {student.classRole === "LOP_PHO_KY_LUAT" && "🛡️ Lớp phó KL"}
                                  {student.classRole === "TO_TRUONG" && "🚩 Tổ trưởng"}
                                  {!student.classRole && "👤 Học sinh"}
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-[11px] text-slate-500 font-medium">
                                <span>Ghế trống</span>
                                <span className="text-[9px] text-slate-600">+ Chọn HS</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Row Label Badge Right */}
                    <div className="w-8 text-center font-black text-xs text-amber-400 font-mono">
                      {rowLetter}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Xếp Ghế (Seat Assignment Modal) */}
      {targetSeat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                Xếp Ghế Position [{rowLabels[targetSeat.r] || `R${targetSeat.r + 1}`}{targetSeat.c + 1}]
              </h3>
              <button
                onClick={() => setTargetSeat(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs text-slate-600">
                Chọn học sinh cho vị trí ghế <strong className="font-mono text-indigo-600 font-bold">{rowLabels[targetSeat.r] || targetSeat.r + 1}{targetSeat.c + 1}</strong>:
              </p>

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                <button
                  type="button"
                  onClick={() => handleAssignStudentToSeat(null)}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                >
                  🚫 Để ghế trống (Bỏ xếp học sinh)
                </button>

                {students.map((st) => {
                  const isPlaced = placedStudentIds.has(st.id);
                  const isCurrentInSeat = grid[targetSeat.r]?.[targetSeat.c] === st.id;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleAssignStudentToSeat(st.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isCurrentInSeat
                          ? "bg-indigo-600 text-white shadow-sm"
                          : isPlaced
                          ? "bg-slate-50 text-slate-400 border border-slate-100 opacity-60"
                          : "bg-white hover:bg-indigo-50 text-slate-800 border border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <span>{st.user.name} ({st.studentCode || "Chưa có mã"})</span>
                      {isCurrentInSeat && <span className="text-[10px] font-black">✓ Đang ở ghế này</span>}
                      {isPlaced && !isCurrentInSeat && <span className="text-[10px]">Đã xếp ở vị trí khác</span>}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTargetSeat(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tuyên Dương & Đánh Giá Cộng Điểm Kèm Lịch Sử Thời Gian */}
      {bonusStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  ⭐ Đánh Giá & Tuyên Dương Tích Cực
                </div>
                <h3 className="font-black text-lg text-slate-900">
                  {bonusStudent.user.name}
                </h3>
              </div>
              <button
                onClick={() => setBonusStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Points Summary */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Tổng điểm thưởng hiện tại:</span>
              <span className="text-base font-black text-amber-600 bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-xs">
                ⭐ +{bonusStudent.bonusPoints || 0} điểm
              </span>
            </div>

            {/* Form đánh giá mới */}
            <form onSubmit={handleSaveBonusSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nội dung tuyên dương</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phát biểu chính xác câu hỏi nâng cao..."
                  value={bonusTitle}
                  onChange={(e) => setBonusTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phân loại hoạt động</label>
                <select
                  value={bonusCategory}
                  onChange={(e) => {
                    setBonusCategory(e.target.value);
                    if (e.target.value === "PHAT_BIEU") setBonusTitle("Phát biểu xây dựng bài");
                    else if (e.target.value === "BAI_TAP") setBonusTitle("Bài tập xuất sắc");
                    else if (e.target.value === "HO_TRO") setBonusTitle("Hỗ trợ bạn học");
                    else if (e.target.value === "PHONG_TRAO") setBonusTitle("Tích cực phong trào lớp");
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-slate-800"
                >
                  <option value="PHAT_BIEU">🙋♂️ Phát biểu xây dựng bài (+1đ)</option>
                  <option value="BAI_TAP">📝 Bài tập xuất sắc / Sáng tạo (+2đ)</option>
                  <option value="HO_TRO">🤝 Hỗ trợ bạn học (+2đ)</option>
                  <option value="PHONG_TRAO">🏆 Hoạt động phong trào (+5đ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điểm cộng thưởng</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPoints(pts)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        bonusPoints === pts
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      +{pts} Điểm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú bổ sung</label>
                <textarea
                  value={bonusNote}
                  onChange={(e) => setBonusNote(e.target.value)}
                  placeholder="Ghi chú nhận xét ngắn..."
                  rows={2}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBonusStudent(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingBonus}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingBonus ? "Đang lưu..." : "⭐ Tuyên Dương & Lưu"}
                </button>
              </div>
            </form>

            {/* TIMESTAMPED EVALUATION HISTORY LOG */}
            <div className="mt-6 border-t border-slate-200 pt-4 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>⏱️ Lịch Sử Đánh Giá & Tuyên Dương Gần Đây</span>
                <span className="text-[10px] text-slate-400 font-normal">Lưu mốc thời gian chính xác</span>
              </h4>

              {loadingHistory ? (
                <div className="text-center py-4 text-xs text-slate-400">Đang tải lịch sử...</div>
              ) : studentHistory.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Chưa có lịch sử tuyên dương nào cho học sinh này.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {studentHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-amber-600 font-black">+{rec.points}đ</span>
                          <span>{rec.title}</span>
                        </div>
                        {rec.note && <div className="text-[11px] text-slate-500 italic">{rec.note}</div>}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap">
                        {new Date(rec.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ CONDUCT TAB ============

// ============ CONDUCT TAB ============
function ConductTab({
  classId,
  showToast,
}: {
  classId: string;
  showToast: (m: string) => void;
}) {
  const [period, setPeriod] = useState("MONTH_9");
  const [records, setRecords] = useState<Array<{
    id: string;
    studentId: string;
    conductRating: string | null;
    academicRating: string | null;
    note: string | null;
    student: { id: string; user: { name: string } };
  }>>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, period]);

  async function loadData() {
    const [recs, sts] = await Promise.all([
      getConductRecords(classId, period),
      getClassStudents(classId),
    ]);
    setRecords(recs as unknown as typeof records);
    setStudents(sts as unknown as StudentItem[]);
  }

  function getRecord(studentId: string) {
    return records.find((r) => r.studentId === studentId);
  }

  async function handleSave(studentId: string, conduct: string | null, academic: string | null, note: string) {
    setSaving(true);
    await saveConductRecord({
      studentId,
      period: period as any,
      conductRating: conduct as "TOT" | "KHA" | "DAT" | "CHUA_DAT" | null,
      academicRating: academic as "GIOI" | "KHA" | "DAT" | "CHUA_DAT" | null,
      note: note || undefined,
    });
    await loadData();
    setSaving(false);
    showToast("Đã lưu");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium">Giai đoạn:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border p-2 text-left w-10">STT</th>
              <th className="border p-2 text-left">Họ tên</th>
              <th className="border p-2 text-center w-32">Hạnh kiểm</th>
              <th className="border p-2 text-center w-32">Học lực</th>
              <th className="border p-2 text-left">Ghi chú</th>
              <th className="border p-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const rec = getRecord(s.id);
              return (
                <ConductRow
                  key={s.id}
                  index={i + 1}
                  name={s.user.name}
                  conductRating={rec?.conductRating || null}
                  academicRating={rec?.academicRating || null}
                  note={rec?.note || ""}
                  saving={saving}
                  onSave={(c, a, n) => handleSave(s.id, c, a, n)}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConductRow({
  index, name, conductRating, academicRating, note, saving, onSave,
}: {
  index: number;
  name: string;
  conductRating: string | null;
  academicRating: string | null;
  note: string;
  saving: boolean;
  onSave: (c: string | null, a: string | null, n: string) => void;
}) {
  const [c, setC] = useState(conductRating || "");
  const [a, setA] = useState(academicRating || "");
  const [n, setN] = useState(note);
  const changed = c !== (conductRating || "") || a !== (academicRating || "") || n !== note;

  return (
    <tr className="hover:bg-slate-50">
      <td className="border p-2">{index}</td>
      <td className="border p-2 font-medium">{name}</td>
      <td className="border p-1">
        <select value={c} onChange={(e) => setC(e.target.value)} className="w-full border rounded px-1 py-1 text-xs">
          <option value="">--</option>
          {CONDUCT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td className="border p-1">
        <select value={a} onChange={(e) => setA(e.target.value)} className="w-full border rounded px-1 py-1 text-xs">
          <option value="">--</option>
          {ACADEMIC_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </td>
      <td className="border p-1">
        <input type="text" value={n} onChange={(e) => setN(e.target.value)} className="w-full border rounded px-2 py-1 text-xs" placeholder="Ghi chú..." />
      </td>
      <td className="border p-1 text-center">
        {changed && (
          <button
            onClick={() => onSave(c || null, a || null, n)}
            disabled={saving}
            className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700"
          >
            Lưu
          </button>
        )}
      </td>
    </tr>
  );
}

// ============ GRADES TAB ============
function GradesTab({ classId }: { classId: string }) {
  const [term, setTerm] = useState(1);
  const [data, setData] = useState<{
    students: { id: string; name: string; studentCode: string | null }[];
    subjects: { id: string; name: string }[];
    grades: GradeItem[];
  }>({ students: [], subjects: [], grades: [] });

  useEffect(() => {
    getClassGradeBoard(classId, term).then(setData);
  }, [classId, term]);

  function getAvg(studentId: string): number | null {
    const studentGrades = data.grades.filter((g) => g.studentId === studentId && g.type === "FINAL");
    if (studentGrades.length === 0) return null;
    return +(studentGrades.reduce((s, g) => s + g.score, 0) / studentGrades.length).toFixed(1);
  }

  function getGrade(studentId: string, subjectId: string, type: string): number | null {
    const g = data.grades.find(
      (gr) => gr.studentId === studentId && gr.subjectId === subjectId && gr.type === type
    );
    return g ? g.score : null;
  }

  function getRating(avg: number | null): string {
    if (avg === null) return "—";
    if (avg >= 8) return "Giỏi";
    if (avg >= 6.5) return "Khá";
    if (avg >= 5) return "Đạt";
    return "Chưa đạt";
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium">Học kỳ:</label>
        <select value={term} onChange={(e) => setTerm(+e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value={1}>Học kỳ I</option>
          <option value={2}>Học kỳ II</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border p-2 sticky left-0 bg-slate-50 z-10">STT</th>
              <th className="border p-2 sticky left-8 bg-slate-50 z-10 min-w-[150px]">Họ tên</th>
              {data.subjects.map((sub) => (
                <th key={sub.id} className="border p-2 text-center min-w-[60px]">{sub.name}</th>
              ))}
              <th className="border p-2 text-center min-w-[60px] bg-yellow-50">TBC</th>
              <th className="border p-2 text-center min-w-[80px] bg-yellow-50">Xếp loại</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((st, i) => {
              const avg = getAvg(st.id);
              return (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="border p-2 sticky left-0 bg-white">{i + 1}</td>
                  <td className="border p-2 sticky left-8 bg-white font-medium">{st.name}</td>
                  {data.subjects.map((sub) => {
                    const score = getGrade(st.id, sub.id, "FINAL");
                    return (
                      <td key={sub.id} className={`border p-2 text-center ${
                        score !== null && score < 5 ? "text-red-600 font-bold" : ""
                      }`}>
                        {score !== null ? score : "—"}
                      </td>
                    );
                  })}
                  <td className="border p-2 text-center bg-yellow-50 font-bold">
                    {avg !== null ? avg : "—"}
                  </td>
                  <td className={`border p-2 text-center bg-yellow-50 font-medium ${
                    avg !== null && avg < 5 ? "text-red-600" : avg !== null && avg >= 8 ? "text-green-600" : ""
                  }`}>
                    {getRating(avg)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ INCIDENTS TAB ============
function IncidentsTab({
  classId,
  students,
  showToast,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
}) {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    type: "VIOLATION" as "VIOLATION" | "COMMENDATION",
    description: "",
  });

  useEffect(() => {
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function loadIncidents() {
    const data = await getIncidents(classId);
    setIncidents(data as unknown as IncidentItem[]);
  }

  async function handleSubmit() {
    if (!form.studentId || !form.description) return;
    await createIncident({ ...form, classId });
    setShowForm(false);
    setForm({ studentId: "", date: new Date().toISOString().split("T")[0], type: "VIOLATION", description: "" });
    await loadIncidents();
    showToast("Đã ghi nhận");
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
        + Ghi nhận mới
      </button>

      {showForm && (
        <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Học sinh</label>
              <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="">Chọn...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ngày</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Loại</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "VIOLATION" | "COMMENDATION" })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="VIOLATION">Vi phạm</option>
                <option value="COMMENDATION">Khen thưởng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Mô tả</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">Lưu</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-1.5 rounded text-sm hover:bg-gray-300">Hủy</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {incidents.length === 0 && <p className="text-slate-600 text-sm">Chưa có ghi nhận nào.</p>}
        {incidents.map((inc) => (
          <div key={inc.id} className={`border rounded-lg p-3 ${inc.type === "VIOLATION" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  inc.type === "VIOLATION" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                }`}>
                  {inc.type === "VIOLATION" ? "Vi phạm" : "Khen thưởng"}
                </span>
                <span className="ml-2 text-sm font-medium">{inc.student.user.name}</span>
              </div>
              <span className="text-xs text-slate-600">{new Date(inc.date).toLocaleDateString("vi-VN")}</span>
            </div>
            <p className="text-sm mt-1 text-white">{inc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ AI REMINDER TAB ============
function AIReminderTab({
  schoolId,
  className,
  showToast,
}: {
  schoolId: string;
  className: string;
  showToast: (m: string) => void;
}) {
  const [schoolYear, setSchoolYear] = useState("2026-2027");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [calendarTitle, setCalendarTitle] = useState("");
  const [calendarContent, setCalendarContent] = useState("");
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [savingCalendar, setSavingCalendar] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReminder, setAiReminder] = useState("");
  const [showCalendarForm, setShowCalendarForm] = useState(false);

  useEffect(() => {
    if (schoolId) loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, schoolYear]);

  async function loadCalendar() {
    setLoadingCalendar(true);
    const cal = await getAcademicCalendar(schoolId, schoolYear);
    if (cal) {
      setCalendarTitle(cal.title);
      setCalendarContent(cal.content);
    } else {
      setCalendarTitle(`Kế hoạch năm học ${schoolYear}`);
      setCalendarContent("");
    }
    setLoadingCalendar(false);
  }

  async function handleSaveCalendar() {
    if (!schoolId) {
      showToast("Không tìm thấy thông tin trường");
      return;
    }
    setSavingCalendar(true);
    await saveAcademicCalendar({
      schoolId,
      schoolYear,
      title: calendarTitle || `Kế hoạch năm học ${schoolYear}`,
      content: calendarContent,
    });
    setSavingCalendar(false);
    showToast("Đã lưu kế hoạch năm học");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCalendarContent((prev) => (prev ? `${prev}\n\n${text}` : text));
        showToast(`Đã tải nội dung từ file "${file.name}"`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleGenerateAI() {
    setLoadingAI(true);
    setAiReminder("");
    const res = await getAIMonthlyReminder({
      schoolId,
      schoolYear,
      month,
      year,
      className,
    });
    if (res.success && res.reminder) {
      setAiReminder(res.reminder);
      showToast("Đã tạo gợi ý nhắc việc AI!");
    } else {
      showToast(res.error || "Không thể tạo nhắc việc AI");
    }
    setLoadingAI(false);
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header & Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> AI Trợ Lý Nhắc Việc Chủ Nhiệm
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Phân tích kế hoạch năm học & tự động nhắc nhở công việc trọng tâm cho GVCN hàng tháng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-sm w-24 bg-white font-medium"
            />
            <button
              onClick={handleGenerateAI}
              disabled={loadingAI}
              className="bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow"
            >
              {loadingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-white" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Phân tích & Nhắc việc AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Accordion / Toggle for Academic Calendar Input */}
      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-gray-800">Lịch & Kế hoạch năm học của Trường ({schoolYear})</h4>
          </div>
          <button
            onClick={() => setShowCalendarForm(!showCalendarForm)}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            {showCalendarForm ? "Thu gọn" : "Cập nhật / Xem kế hoạch"}
          </button>
        </div>

        {showCalendarForm && (
          <div className="pt-3 border-t space-y-3">
            <div className="flex gap-3 items-center">
              <label className="text-xs font-medium">Năm học:</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="VD: 2026-2027"
                className="border rounded px-2 py-1 text-xs w-32"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tiêu đề kế hoạch</label>
              <input
                type="text"
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
                placeholder="Kế hoạch năm học 2026-2027"
                className="w-full border rounded px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium">Nội dung kế hoạch / Các sự kiện chính trong năm</label>
                <label className="cursor-pointer text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-100 font-medium flex items-center gap-1 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Tải file kế hoạch (.txt, .docx, .csv)
                  <input
                    type="file"
                    accept=".txt,.csv,.md,.docx,.doc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                value={calendarContent}
                onChange={(e) => setCalendarContent(e.target.value)}
                rows={6}
                placeholder="Dán nội dung kế hoạch năm học của nhà trường vào đây hoặc bấm nút tải file ở trên..."
                className="w-full border rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <button
              onClick={handleSaveCalendar}
              disabled={savingCalendar}
              className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-700 disabled:opacity-50 font-medium"
            >
              {savingCalendar ? "Đang lưu..." : "Lưu kế hoạch năm học"}
            </button>
          </div>
        )}
      </div>

      {/* AI Output Display */}
      {aiReminder ? (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h4 className="font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Nhiệm vụ & Gợi ý công việc Tháng {month}/{year}
            </h4>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md font-semibold">
              Tạo bởi AI Trợ lý GVCN
            </span>
          </div>
          <div className="prose max-w-none text-sm text-white whitespace-pre-line leading-relaxed bg-slate-50/50 p-4 rounded-lg border">
            {aiReminder}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed rounded-xl p-6">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-slate-700 font-medium">Chưa có bản tổng hợp nhắc việc AI</h4>
          <p className="text-xs text-blue-800 mt-1">
            Nhấn nút "Phân tích & Nhắc việc AI" ở trên để AI tạo danh sách công việc tự động cho Tháng {month}/{year}.
          </p>
        </div>
      )}
    </div>
  );
}

// ============ MONTHLY PLAN TAB ============
function MonthlyPlanTab({
  classId,
  showToast,
}: {
  classId: string;
  showToast: (m: string) => void;
}) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [planId, setPlanId] = useState<string | null>(null);
  const [planContent, setPlanContent] = useState("");
  const [weeklyActivities, setWeeklyActivities] = useState<
    Array<{ weekNumber: number; content: string; notes: string }>
  >([
    { weekNumber: 1, content: "", notes: "" },
    { weekNumber: 2, content: "", notes: "" },
    { weekNumber: 3, content: "", notes: "" },
    { weekNumber: 4, content: "", notes: "" },
    { weekNumber: 5, content: "", notes: "" },
  ]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingWeek, setSavingWeek] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, month, year]);

  async function loadData() {
    setLoading(true);
    const plan = await getMonthlyPlan(classId, month, year);
    if (plan) {
      setPlanId(plan.id);
      setPlanContent(plan.planContent || "");
      const weeksMap = new Map<number, { content: string; notes: string }>(
        plan.weeklyActivities.map((w) => [w.weekNumber, { content: w.content || "", notes: w.notes || "" }])
      );
      setWeeklyActivities(
        Array.from({ length: 5 }, (_, i) => ({
          weekNumber: i + 1,
          content: weeksMap.get(i + 1)?.content || "",
          notes: weeksMap.get(i + 1)?.notes || "",
        }))
      );
    } else {
      setPlanId(null);
      setPlanContent("");
      setWeeklyActivities(
        Array.from({ length: 5 }, (_, i) => ({
          weekNumber: i + 1,
          content: "",
          notes: "",
        }))
      );
    }
    setLoading(false);
  }

  async function handleSavePlan() {
    setSavingPlan(true);
    const res = await saveMonthlyPlan({ classId, month, year, planContent });
    setPlanId(res.id);
    setSavingPlan(false);
    showToast("Đã lưu kế hoạch tháng!");
  }

  async function handleSaveWeek(weekNum: number) {
    if (!planId) {
      // Create monthly plan first if not existing
      const res = await saveMonthlyPlan({ classId, month, year, planContent });
      setPlanId(res.id);
      const wData = weeklyActivities.find((w) => w.weekNumber === weekNum);
      await saveWeeklyActivity({
        monthlyPlanId: res.id,
        weekNumber: weekNum,
        content: wData?.content,
        notes: wData?.notes,
      });
    } else {
      setSavingWeek(true);
      const wData = weeklyActivities.find((w) => w.weekNumber === weekNum);
      await saveWeeklyActivity({
        monthlyPlanId: planId,
        weekNumber: weekNum,
        content: wData?.content,
        notes: wData?.notes,
      });
      setSavingWeek(false);
    }
    showToast(`Đã lưu nội dung Tuần ${weekNum}!`);
  }

  function updateWeekContent(weekNum: number, field: "content" | "notes", val: string) {
    setWeeklyActivities((prev) =>
      prev.map((w) => (w.weekNumber === weekNum ? { ...w, [field]: val } : w))
    );
  }

  const currentWeekData = weeklyActivities.find((w) => w.weekNumber === activeWeek) || {
    weekNumber: activeWeek,
    content: "",
    notes: "",
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white border rounded-xl p-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Kế Hoạch Tháng & Nội Dung Sinh Hoạt Tuần
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Lập kế hoạch làm việc tháng và chuẩn bị nội dung sinh hoạt chủ nhiệm theo từng tuần.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-700">Tháng:</label>
            <select
              value={month}
              onChange={(e) => setMonth(+e.target.value)}
              className="border rounded-md px-2.5 py-1 text-sm font-medium"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-700">Năm:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="border rounded-md px-2.5 py-1 text-sm w-20 font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kế hoạch tháng */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  📌 Kế Hoạch Tháng {month}/{year}
                </h4>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mục tiêu, nhiệm vụ trọng tâm & hoạt động chủ yếu trong tháng
                </label>
                <textarea
                  value={planContent}
                  onChange={(e) => setPlanContent(e.target.value)}
                  rows={14}
                  placeholder={`- Mục tiêu thi đua trong tháng ${month}...\n- Công tác chuyên môn & học tập...\n- Hoạt động ngoại khóa & phong trào...\n- Phối hợp với gia đình học sinh...`}
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 mt-3 self-end"
            >
              {savingPlan ? "Đang lưu..." : "Lưu kế hoạch tháng"}
            </button>
          </div>

          {/* Sinh hoạt tuần */}
          <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  📋 Nội Dung Sinh Hoạt Tuần
                </h4>
              </div>

              {/* Tabs Tuần 1-5 */}
              <div className="flex border-b gap-1 overflow-x-auto">
                {[1, 2, 3, 4, 5].map((wNum) => (
                  <button
                    key={wNum}
                    onClick={() => setActiveWeek(wNum)}
                    className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                      activeWeek === wNum
                        ? "bg-blue-600 text-white font-black shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Tuần {wNum}
                  </button>
                ))}
              </div>

              {/* Weekly Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nội dung sinh hoạt chủ nhiệm Tuần {activeWeek}
                  </label>
                  <textarea
                    value={currentWeekData.content}
                    onChange={(e) => updateWeekContent(activeWeek, "content", e.target.value)}
                    rows={8}
                    placeholder={`1. Đánh giá tuần qua (sĩ số, học tập, kỷ luật)...\n2. Phổ biến kế hoạch tuần tới...\n3. Sinh hoạt theo chủ điểm...`}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ghi chú & Đánh giá kết quả thực hiện
                  </label>
                  <textarea
                    value={currentWeekData.notes}
                    onChange={(e) => updateWeekContent(activeWeek, "notes", e.target.value)}
                    rows={3}
                    placeholder="Ghi chú công việc phát sinh hoặc tự đánh giá..."
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSaveWeek(activeWeek)}
              disabled={savingWeek}
              className="bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 mt-3 self-end"
            >
              {savingWeek ? "Đang lưu..." : `Lưu Tuần ${activeWeek}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ FEEDBACK TAB ============
function FeedbackTab({
  classId,
  students,
  showToast,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
}) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    channel: "phone",
    content: "",
    response: "",
  });

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function loadFeedbacks() {
    const data = await getParentFeedbacks(classId);
    setFeedbacks(data as unknown as FeedbackItem[]);
  }

  async function handleSubmit() {
    if (!form.studentId || !form.content) return;
    await createParentFeedback(form);
    setShowForm(false);
    setForm({ studentId: "", date: new Date().toISOString().split("T")[0], channel: "phone", content: "", response: "" });
    await loadFeedbacks();
    showToast("Đã lưu phản hồi");
  }

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
        + Thêm phản hồi
      </button>

      {showForm && (
        <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Học sinh</label>
              <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="">Chọn...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ngày</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Kênh liên hệ</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm">
                <option value="phone">Điện thoại</option>
                <option value="email">Email</option>
                <option value="meeting">Gặp trực tiếp</option>
                <option value="zalo">Zalo</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Nội dung phản hồi</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Cách xử lý / phản hồi</label>
            <textarea value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} className="w-full border rounded px-2 py-1.5 text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700">Lưu</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-200 px-4 py-1.5 rounded text-sm hover:bg-gray-300">Hủy</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {feedbacks.length === 0 && <p className="text-slate-600 text-sm">Chưa có phản hồi nào.</p>}
        {feedbacks.map((fb) => (
          <div key={fb.id} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium">{fb.student.user.name}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{fb.channel}</span>
              </div>
              <span className="text-xs text-slate-600">{new Date(fb.date).toLocaleDateString("vi-VN")}</span>
            </div>
            <p className="text-sm mt-1 text-white">{fb.content}</p>
            {fb.response && (
              <p className="text-sm mt-1 text-green-700 italic">↳ {fb.response}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
