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
  { key: "ai_reminder", label: "Trợ lý AI Nhắc việc" },
  { key: "overview", label: "Tổng quan lớp" },
  { key: "groups", label: "Tổ chức tổ" },
  { key: "seating", label: "Sơ đồ chỗ ngồi" },
  { key: "conduct", label: "Rèn luyện & Học tập" },
  { key: "grades", label: "Bảng điểm lớp" },
  { key: "incidents", label: "Vi phạm / Khen thưởng" },
  { key: "feedback", label: "Phối hợp phụ huynh" },
  { key: "monthly_plan", label: "Kế hoạch tháng & Sinh hoạt tuần" },
] as const;

const TAB_ICONS: Record<string, React.ElementType> = {
  overview: Users,
  groups: LayoutGrid,
  seating: ClipboardList,
  conduct: BarChart3,
  grades: ClipboardList,
  incidents: AlertTriangle,
  feedback: MessageSquare,
  ai_reminder: Sparkles,
  monthly_plan: FileText,
};

const PERIODS = [
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
  const [tab, setTab] = useState<string>("ai_reminder");
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-905 flex items-center gap-2">
           <BookOpen className="w-6 h-6 text-emerald-600" /> Sổ Chủ Nhiệm Điện Tử
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
          <span className="flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> Lớp: {classInfo.name}</span>
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-gray-400" /> Khối: {classInfo.gradeLevel}</span>
          <span className="flex items-center gap-1"><Building className="w-4 h-4 text-gray-400" /> Trường: {classInfo.school.name}</span>
          {classInfo.campus && <span className="flex items-center gap-1"><Building className="w-4 h-4 text-gray-400" /> Phân hiệu: {classInfo.campus.name}</span>}
          <span className="flex items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> Sĩ số: {classInfo._count.students} học sinh</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="border-b overflow-x-auto bg-gray-50/50">
          <div className="flex">
            {TABS.map((t) => {
              const Icon = TAB_ICONS[t.key] || Users;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                    tab === t.key
                      ? "border-blue-600 text-blue-700 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab === t.key ? "text-blue-605" : "text-gray-450"}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {tab === "overview" && <OverviewTab classId={classInfo.id} students={students} />}
          {tab === "groups" && <GroupsTab classId={classInfo.id} students={students} showToast={showToast} onReload={loadData} />}
          {tab === "seating" && <SeatingTab classId={classInfo.id} students={students} showToast={showToast} />}
          {tab === "conduct" && <ConductTab classId={classInfo.id} showToast={showToast} />}
          {tab === "grades" && <GradesTab classId={classInfo.id} />}
          {tab === "incidents" && <IncidentsTab classId={classInfo.id} students={students} showToast={showToast} />}
          {tab === "feedback" && <FeedbackTab classId={classInfo.id} students={students} showToast={showToast} />}
          {tab === "ai_reminder" && <AIReminderTab schoolId={classInfo.schoolId} className={classInfo.name} showToast={showToast} />}
          {tab === "monthly_plan" && <MonthlyPlanTab classId={classInfo.id} showToast={showToast} />}
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

// ============ OVERVIEW TAB ============
function OverviewTab({ classId, students }: { classId: string; students: StudentItem[] }) {
  const [periodData, setPeriodData] = useState<Array<{
    period: string;
    total: number;
    conduct: Record<string, number>;
    academic: Record<string, number>;
  }>>([]);

  useEffect(() => {
    getClassSizeByPeriods(classId).then(setPeriodData);
  }, [classId]);

  return (
    <div className="space-y-6">
      {/* Danh sách HS */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Danh sách học sinh ({students.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left w-10">STT</th>
                <th className="border p-2 text-left">Họ tên</th>
                <th className="border p-2 text-left">Mã HS</th>
                <th className="border p-2 text-left">Tổ</th>
                <th className="border p-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2 font-medium">{s.user.name}</td>
                  <td className="border p-2 text-gray-500">{s.studentCode || "—"}</td>
                  <td className="border p-2">{s.group?.name || "Chưa xếp tổ"}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      s.status === "STUDYING" ? "bg-green-100 text-green-700" :
                      s.status === "TRANSFERRED" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {s.status === "STUDYING" ? "Đang học" :
                       s.status === "TRANSFERRED" ? "Chuyển trường" :
                       s.status === "DROPPED_OUT" ? "Nghỉ học" : "Tốt nghiệp"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tình hình sĩ số */}
      {periodData.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-3">Tình hình theo giai đoạn</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
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
                  <tr key={pd.period} className="hover:bg-gray-50">
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
      {/* Create group */}
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Tên tổ mới</label>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="VD: Tổ 1"
            className="border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleCreateGroup}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          + Tạo tổ
        </button>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-blue-700">{g.name} ({g.students.length} HS)</h4>
              <button
                onClick={() => handleDeleteGroup(g.id)}
                className="text-red-500 text-xs hover:underline"
              >
                Xóa tổ
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {g.students.map((s) => (
                <li key={s.id} className="flex justify-between items-center">
                  <span>{s.user.name}</span>
                  <button
                    onClick={() => handleAssign(s.id, null)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                    title="Bỏ khỏi tổ"
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Unassigned students */}
      {unassigned.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-700 mb-3">Chưa xếp tổ ({unassigned.length} HS)</h4>
          <div className="space-y-2">
            {unassigned.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{s.user.name}</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleAssign(s.id, e.target.value);
                  }}
                  defaultValue=""
                  className="border rounded px-2 py-1 text-xs"
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

// ============ SEATING TAB ============
function SeatingTab({
  classId,
  students,
  showToast,
}: {
  classId: string;
  students: StudentItem[];
  showToast: (m: string) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, month, year]);

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

  function handleCellClick(r: number, c: number) {
    const current = grid[r]?.[c];
    // Get list of placed student ids
    const placed = new Set(grid.flat().filter(Boolean));
    const available = students.filter((s) => !placed.has(s.id) || s.id === current);

    if (current) {
      // Remove student
      const newGrid = grid.map((row) => [...row]);
      newGrid[r][c] = null;
      setGrid(newGrid);
    } else {
      // Show prompt to select student
      const sel = prompt(
        "Chọn số thứ tự học sinh:\n" +
        available.filter((s) => !placed.has(s.id)).map((s, i) => `${i + 1}. ${s.user.name}`).join("\n")
      );
      if (sel) {
        const idx = parseInt(sel) - 1;
        const avail = available.filter((s) => !placed.has(s.id));
        if (avail[idx]) {
          const newGrid = grid.map((row) => [...row]);
          if (!newGrid[r]) newGrid[r] = Array(cols).fill(null);
          newGrid[r][c] = avail[idx].id;
          setGrid(newGrid);
        }
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    await saveSeatingChart(classId, month, year, JSON.stringify({ grid, rows, cols }));
    setSaving(false);
    showToast("Đã lưu sơ đồ chỗ ngồi");
  }

  async function handleCopy() {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    try {
      await copySeatingChart(classId, prevMonth, prevYear, month, year);
      await loadChart();
      showToast("Đã sao chép từ tháng trước");
    } catch {
      showToast("Không tìm thấy sơ đồ tháng trước");
    }
  }

  function getStudentName(id: string | null) {
    if (!id) return null;
    return students.find((s) => s.id === id)?.user.name || "?";
  }

  function handleResize() {
    const newGrid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => grid[r]?.[c] || null)
    );
    setGrid(newGrid);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Tháng</label>
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border rounded px-2 py-1 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Năm</label>
          <input type="number" value={year} onChange={(e) => setYear(+e.target.value)} className="border rounded px-2 py-1 text-sm w-20" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Hàng</label>
          <input type="number" min={1} max={12} value={rows} onChange={(e) => setRows(+e.target.value)} className="border rounded px-2 py-1 text-sm w-16" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Cột</label>
          <input type="number" min={1} max={12} value={cols} onChange={(e) => setCols(+e.target.value)} className="border rounded px-2 py-1 text-sm w-16" />
        </div>
        <button onClick={handleResize} className="bg-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-300">Cập nhật kích thước</button>
        <button onClick={handleCopy} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"> Sao chép tháng trước</button>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Đang lưu..." : " Lưu"}
        </button>
      </div>

      {/* Grid - Bảng giáo */}
      <div className="text-center text-xs text-gray-500 font-semibold bg-gray-200 py-1 rounded-t">BẢNG</div>
      <div className="overflow-x-auto">
        <div className="inline-block">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex">
              {Array.from({ length: cols }).map((_, c) => {
                const studentId = grid[r]?.[c];
                const name = getStudentName(studentId);
                return (
                  <div
                    key={c}
                    onClick={() => handleCellClick(r, c)}
                    className={`w-24 h-16 border border-gray-300 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                      name ? "bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium" : "bg-white hover:bg-gray-100 text-gray-400"
                    }`}
                    title={name ? `Click để xóa: ${name}` : "Click để thêm HS"}
                  >
                    {name || "+"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">Click vào ô trống để thêm học sinh, click vào ô có tên để xóa.</p>
    </div>
  );
}

// ============ CONDUCT TAB ============
function ConductTab({
  classId,
  showToast,
}: {
  classId: string;
  showToast: (m: string) => void;
}) {
  const [period, setPeriod] = useState("MID_HK1");
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
      period: period as "MID_HK1" | "HK1" | "MID_HK2" | "HK2" | "FULL_YEAR",
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
            <tr className="bg-gray-50">
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
    <tr className="hover:bg-gray-50">
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
            <tr className="bg-gray-50">
              <th className="border p-2 sticky left-0 bg-gray-50 z-10">STT</th>
              <th className="border p-2 sticky left-8 bg-gray-50 z-10 min-w-[150px]">Họ tên</th>
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
                <tr key={st.id} className="hover:bg-gray-50">
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
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
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
        {incidents.length === 0 && <p className="text-gray-500 text-sm">Chưa có ghi nhận nào.</p>}
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
              <span className="text-xs text-gray-500">{new Date(inc.date).toLocaleDateString("vi-VN")}</span>
            </div>
            <p className="text-sm mt-1 text-gray-700">{inc.description}</p>
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
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow"
            >
              {loadingAI ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
          <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50/50 p-4 rounded-lg border">
            {aiReminder}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-dashed rounded-xl p-6">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-gray-600 font-medium">Chưa có bản tổng hợp nhắc việc AI</h4>
          <p className="text-xs text-gray-400 mt-1">
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
          <p className="text-xs text-gray-500 mt-0.5">
            Lập kế hoạch làm việc tháng và chuẩn bị nội dung sinh hoạt chủ nhiệm theo từng tuần.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-600">Tháng:</label>
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
            <label className="text-xs font-medium text-gray-600">Năm:</label>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Tuần {wNum}
                  </button>
                ))}
              </div>

              {/* Weekly Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">
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
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
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
        {feedbacks.length === 0 && <p className="text-gray-500 text-sm">Chưa có phản hồi nào.</p>}
        {feedbacks.map((fb) => (
          <div key={fb.id} className="border rounded-lg p-3 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-medium">{fb.student.user.name}</span>
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{fb.channel}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(fb.date).toLocaleDateString("vi-VN")}</span>
            </div>
            <p className="text-sm mt-1 text-gray-700">{fb.content}</p>
            {fb.response && (
              <p className="text-sm mt-1 text-green-700 italic">↳ {fb.response}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
