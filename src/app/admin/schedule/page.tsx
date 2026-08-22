"use client";

import { useEffect, useState } from "react";
import {
  getScheduleData,
  getScheduleFormData,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  clearClassSchedule,
  bulkImportSchedules,
} from "./actions";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  CalendarDays,
  Clock,
  BookOpen,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  FileSpreadsheet,
  HardDrive,
  Download,
  School,
  Building2,
  Info,
  Sparkles,
  RefreshCw,
  Search,
  Upload,
  CheckCircle2,
  Filter,
  Users,
} from "lucide-react";
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { parseSpreadsheetBuffer, mapRowsToSchedules } from "@/lib/excel-parser";

const DAY_LABELS: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
};

const DAYS = [1, 2, 3, 4, 5, 6];

const MORNING_PERIODS = [
  { num: 1, label: "Tiết 1", time: "07:00 - 07:45" },
  { num: 2, label: "Tiết 2", time: "07:50 - 08:35" },
  { num: 3, label: "Tiết 3", time: "08:50 - 09:35" },
  { num: 4, label: "Tiết 4", time: "09:40 - 10:25" },
];

const AFTERNOON_PERIODS = [
  { num: 5, label: "Tiết 5", time: "13:00 - 13:45" },
  { num: 6, label: "Tiết 6", time: "13:50 - 14:35" },
  { num: 7, label: "Tiết 7", time: "14:50 - 15:35" },
  { num: 8, label: "Tiết 8", time: "15:40 - 16:25" },
];

// Helper colors for subject badges
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  toan: { bg: "bg-indigo-50 dark:bg-indigo-950/50", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  "ngu van": { bg: "bg-rose-50 dark:bg-rose-950/50", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  "tieng anh": { bg: "bg-sky-50 dark:bg-sky-950/50", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800" },
  "vat ly": { bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  "hoa hoc": { bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  "sinh hoc": { bg: "bg-teal-50 dark:bg-teal-950/50", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  "lich su": { bg: "bg-orange-50 dark:bg-orange-950/50", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  "dia ly": { bg: "bg-lime-50 dark:bg-lime-950/50", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-800" },
  "tin hoc": { bg: "bg-purple-50 dark:bg-purple-950/50", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  "the duc": { bg: "bg-green-50 dark:bg-green-950/50", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  "cong nghe": { bg: "bg-cyan-50 dark:bg-cyan-950/50", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
};

function normalizeStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getSubjectBadgeColor(name: string) {
  const norm = normalizeStr(name);
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (norm.includes(key)) return val;
  }
  return { bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-200", border: "border-slate-200 dark:border-slate-700" };
}

type ScheduleEntry = {
  id: string;
  dayOfWeek: number;
  period: number;
  room: string | null;
  teacherId: string;
  subject: { id: string; name: string; code?: string | null };
  teacher: { id: string; specialty: string | null; user: { id: string; name: string; email: string } };
  classRoom: { id: string; name: string; gradeLevel: number };
};

type SchoolOption = { id: string; name: string };
type ClassOption = { id: string; name: string; gradeLevel: number; school?: { id: string; name: string } };
type SubjectOption = { id: string; name: string; code?: string | null };
type TeacherOption = {
  id: string;
  specialty: string | null;
  user: { id: string; name: string; email: string };
  teachingAssignments?: { subjectId: string }[];
};

export default function SchedulePage() {
  const { isEasyMode } = useEasyMode();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<number | "ALL">("ALL");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);

  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    room: "",
  });

  const [onlyMatchedTeachers, setOnlyMatchedTeachers] = useState(true);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  async function loadData(classId?: string, schoolId?: string) {
    setLoading(true);
    try {
      const [scheduleRes, formOptions] = await Promise.all([
        getScheduleData(classId, schoolId),
        getScheduleFormData(schoolId),
      ]);

      setSchools(scheduleRes.schools);
      setClasses(scheduleRes.classes);
      setSchedules(scheduleRes.schedules as ScheduleEntry[]);
      setSelectedClassId(scheduleRes.selectedClassId);
      setSelectedClass(scheduleRes.selectedClass as any);
      setSubjects(formOptions.subjects);
      setTeachers(formOptions.teachers as any);
    } catch (err) {
      console.error("Error loading schedule page data:", err);
      setToast({ message: "Không thể tải dữ liệu thời khóa biểu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Handle school filter change
  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setRefreshing(true);
    try {
      const scheduleRes = await getScheduleData(undefined, schoolId);
      setClasses(scheduleRes.classes);
      setSchedules(scheduleRes.schedules as ScheduleEntry[]);
      setSelectedClassId(scheduleRes.selectedClassId);
      setSelectedClass(scheduleRes.selectedClass as any);

      const formOptions = await getScheduleFormData(schoolId);
      setSubjects(formOptions.subjects);
      setTeachers(formOptions.teachers as any);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle class selection
  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setRefreshing(true);
    try {
      const data = await getScheduleData(classId, selectedSchoolId);
      setSchedules(data.schedules as ScheduleEntry[]);
      setSelectedClass(data.selectedClass as any);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  function getEntry(day: number, period: number) {
    return schedules.find((s) => s.dayOfWeek === day && s.period === period);
  }

  function handleCellClick(day: number, period: number) {
    const existing = getEntry(day, period);
    if (existing) {
      setEditingEntry(existing);
      setSelectedSlot({ day, period });
      setFormData({
        subjectId: existing.subject.id,
        teacherId: existing.teacher.id,
        room: existing.room || "",
      });
      setOnlyMatchedTeachers(false); // Show all or matched
    } else {
      setEditingEntry(null);
      setSelectedSlot({ day, period });
      setFormData({ subjectId: "", teacherId: "", room: "" });
      setOnlyMatchedTeachers(true);
    }
    setTeacherSearch("");
    setShowEntryModal(true);
  }

  // Handle subject change & smart auto-select teacher
  const handleSubjectChange = (subjectId: string) => {
    const selectedSubj = subjects.find((s) => s.id === subjectId);
    let suggestedTeacherId = "";

    if (selectedSubj) {
      const matched = teachers.filter((t) => {
        const isAssigned = t.teachingAssignments?.some((ta) => ta.subjectId === selectedSubj.id);
        if (isAssigned) return true;
        if (!t.specialty) return false;
        const normSpec = normalizeStr(t.specialty);
        const normSubj = normalizeStr(selectedSubj.name);
        return normSpec.includes(normSubj) || normSubj.includes(normSpec);
      });

      if (matched.length > 0) {
        suggestedTeacherId = matched[0].id;
      }
    }

    setFormData({
      ...formData,
      subjectId,
      teacherId: suggestedTeacherId || formData.teacherId,
    });
    setOnlyMatchedTeachers(true);
  };

  async function handleSubmitForm() {
    if (!selectedSlot || !formData.subjectId || !formData.teacherId) {
      setToast({ message: "Vui lòng chọn môn học và giáo viên phụ trách", type: "error" });
      return;
    }

    if (editingEntry) {
      const res = await updateScheduleEntry(editingEntry.id, {
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        room: formData.room,
      });

      if (res.error) {
        setToast({ message: res.error, type: "error" });
        return;
      }
      setToast({ message: "Đã cập nhật tiết học thành công!", type: "success" });
    } else {
      const res = await createScheduleEntry({
        classId: selectedClassId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        dayOfWeek: selectedSlot.day,
        period: selectedSlot.period,
        room: formData.room,
      });

      if (res.error) {
        setToast({ message: res.error, type: "error" });
        return;
      }
      setToast({ message: "Đã thêm tiết học mới thành công!", type: "success" });
    }

    setShowEntryModal(false);
    handleClassChange(selectedClassId);
  }

  async function handleDeleteEntry() {
    if (!editingEntry) return;
    if (!confirm("Bạn có chắc chắn muốn xóa tiết học này khỏi thời khóa biểu?")) return;

    const res = await deleteScheduleEntry(editingEntry.id);
    if (res.success) {
      setToast({ message: "Đã xóa tiết học!", type: "success" });
      setShowEntryModal(false);
      handleClassChange(selectedClassId);
    }
  }

  async function handleClearSchedule() {
    if (!selectedClass) return;
    if (
      !confirm(
        `Bạn có chắc muốn XÓA TOÀN BỘ thời khóa biểu của lớp ${selectedClass.name}? Thao tác này không thể hoàn tác!`
      )
    )
      return;

    const res = await clearClassSchedule(selectedClassId);
    if (res.success) {
      setToast({ message: `Đã xóa toàn bộ thời khóa biểu lớp ${selectedClass.name}!`, type: "success" });
      handleClassChange(selectedClassId);
    }
  }

  // Handle Drive Import Confirm
  const handleDriveImportConfirm = async (parsedData: any[]) => {
    const res = await bulkImportSchedules(parsedData, selectedClassId);
    if (res.errors && res.errors.length > 0) {
      setToast({
        message: `Đã nhập ${res.importedCount} tiết. Có ${res.errors.length} cảnh báo (ví dụ: ${res.errors[0]})`,
        type: "error",
      });
    } else {
      setToast({
        message: `Nhập hàng loạt thành công ${res.importedCount} tiết học từ Google Drive!`,
        type: "success",
      });
    }
    handleClassChange(selectedClassId);
  };

  // Direct Excel File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = Buffer.from(evt.target?.result as ArrayBuffer);
        const rawRows = parseSpreadsheetBuffer(buffer);
        const parsedSchedules = mapRowsToSchedules(rawRows);
        const validRows = parsedSchedules.filter((r) => r.isValid);

        if (validRows.length === 0) {
          setToast({ message: "Không tìm thấy dòng dữ liệu hợp lệ nào trong file Excel", type: "error" });
          return;
        }

        const res = await bulkImportSchedules(validRows, selectedClassId);
        if (res.errors && res.errors.length > 0) {
          setToast({
            message: `Đã nhập ${res.importedCount} tiết. Cảnh báo: ${res.errors[0]}`,
            type: "error",
          });
        } else {
          setToast({ message: `Nhập thành công ${res.importedCount} tiết từ file Excel!`, type: "success" });
        }
        setExcelModalOpen(false);
        handleClassChange(selectedClassId);
      } catch (err: any) {
        setToast({ message: err.message || "Lỗi đọc file Excel", type: "error" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Sample CSV Template Generator
  const downloadSampleTemplate = () => {
    const csvContent =
      "" +
      "Lớp,Thứ,Tiết,Môn Học,Giáo Viên,Phòng Học\n" +
      "10A1,Thứ 2,1,Toán,Nguyễn Văn A,Phòng 101\n" +
      "10A1,Thứ 2,2,Ngữ văn,Trần Thị B,Phòng 101\n" +
      "10A1,Thứ 2,3,Tiếng Anh,Lê Văn C,Phòng 101\n" +
      "10A1,Thứ 3,1,Vật lý,Phạm Văn D,Phòng Lab 1\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Mau_Thoi_Khoa_Bieu.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClasses = classes.filter((c) => {
    if (selectedGrade !== "ALL" && c.gradeLevel !== selectedGrade) return false;
    return true;
  });

  const availableGrades = Array.from(new Set(classes.map((c) => c.gradeLevel))).sort((a, b) => a - b);

  // Compute matched vs other teachers for selected subject
  const currentSelectedSubject = subjects.find((s) => s.id === formData.subjectId);
  const matchedTeachers = currentSelectedSubject
    ? teachers.filter((t) => {
        const isAssigned = t.teachingAssignments?.some((ta) => ta.subjectId === currentSelectedSubject.id);
        if (isAssigned) return true;
        if (!t.specialty) return false;
        const normSpec = normalizeStr(t.specialty);
        const normSubj = normalizeStr(currentSelectedSubject.name);
        return normSpec.includes(normSubj) || normSubj.includes(normSpec);
      })
    : [];

  const otherTeachers = teachers.filter((t) => !matchedTeachers.some((mt) => mt.id === t.id));

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <CalendarDays className="w-3.5 h-3.5 text-indigo-400" /> Quản Lý Thời Khóa Biểu
              </span>
              {selectedClass && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[11px] font-bold">
                  Lớp {selectedClass.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Thời Khóa Biểu Toàn Trường</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Phân công giảng dạy, xem lịch theo lớp & nhập thời khóa biểu tự động hàng loạt
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setDriveModalOpen(true)}
              className="px-3.5 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-indigo-400/30 backdrop-blur-md shadow-xs"
            >
              <HardDrive className="w-4 h-4 text-indigo-200" />
              <span>Nhập Từ Drive</span>
            </button>

            <button
              onClick={() => setExcelModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-400/30 backdrop-blur-md shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Nhập File Excel</span>
            </button>

            {selectedClassId && (
              <button
                onClick={handleClearSchedule}
                className="px-3 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                title="Xóa thời khóa biểu lớp này"
              >
                <Trash2 className="w-4 h-4 text-rose-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Tổng số tiết học</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{schedules.length} / 40 tiết</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Giáo viên phụ trách</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {new Set(schedules.map((s) => s.teacherId)).size} Giáo viên
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Số phòng học sử dụng</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {new Set(schedules.map((s) => s.room).filter(Boolean)).size || 1} Phòng
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">Mức độ hoàn thành</p>
            <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
              {Math.min(100, Math.round((schedules.length / 30) * 100))}%
            </p>
          </div>
        </div>
      </div>

      {/* Easy Mode Guidance Banner */}
      {isEasyMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-blue-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Hướng dẫn quản lý thời khóa biểu:</span>
          </div>
          <p>
            1. Chọn <b>Trường</b> và <b>Lớp học</b> ở bảng lọc bên dưới để xem thời khóa biểu của lớp tương ứng.
          </p>
          <p>
            2. <b>Bấm vào bất kỳ ô nào</b> để thêm tiết học mới hoặc sửa/đổi môn và đổi giáo viên.
          </p>
          <p>
            3. Hệ thống sẽ **tự động gợi ý đúng Giáo Viên thuộc tổ/môn đó** để không bị rối mắt!
          </p>
        </div>
      )}

      {/* School & Grade & Class Selector Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        {/* School Selector */}
        {schools.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <School className="w-3.5 h-3.5 text-indigo-600" /> Trường:
            </span>
            <button
              onClick={() => handleSchoolChange("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                !selectedSchoolId
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tất Cả Các Trường
            </button>
            {schools.map((sch) => (
              <button
                key={sch.id}
                onClick={() => handleSchoolChange(sch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  selectedSchoolId === sch.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {sch.name}
              </button>
            ))}
          </div>
        )}

        {/* Grade Filters & Class Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Grade Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Khối:</span>
            <button
              onClick={() => setSelectedGrade("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                selectedGrade === "ALL"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
              }`}
            >
              Tất Cả
            </button>
            {availableGrades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  selectedGrade === g
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          {refreshing && (
            <span className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải lịch...
            </span>
          )}
        </div>

        {/* Classes Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          {filteredClasses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">Không tìm thấy lớp học phù hợp</p>
          ) : (
            filteredClasses.map((cls) => {
              const isSelected = selectedClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => handleClassChange(cls.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lớp {cls.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Timetable Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold">
              Lịch Học Tuần — Lớp {selectedClass?.name || "..."}
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Bấm vào ô bất kỳ để thêm mới hoặc chỉnh sửa tiết học & giáo viên phụ trách
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold">
                <th className="p-3 w-28 text-center border-r border-slate-200">Tiết / Thời Gian</th>
                {DAYS.map((day) => (
                  <th key={day} className="p-3 text-center border-r border-slate-200 last:border-r-0">
                    <span className="text-indigo-700 font-extrabold text-sm">{DAY_LABELS[day]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {/* MORNING SHIFT SECTION */}
              <tr className="bg-amber-500/10 border-b border-amber-200/60">
                <td colSpan={7} className="px-4 py-1.5 text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
                  ☀️ Buổi Sáng (Tiết 1 - Tiết 4)
                </td>
              </tr>

              {MORNING_PERIODS.map((periodObj) => (
                <tr key={`period-${periodObj.num}`} className="hover:bg-slate-50/50 transition-colors">
                  {/* Period Number & Time Column */}
                  <td className="p-3 text-center font-bold bg-slate-50/80 border-r border-slate-200">
                    <div className="text-slate-900 font-extrabold">{periodObj.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{periodObj.time}</div>
                  </td>

                  {/* Days Columns */}
                  {DAYS.map((day) => {
                    const entry = getEntry(day, periodObj.num);
                    return (
                      <td
                        key={`cell-${day}-${periodObj.num}`}
                        onClick={() => handleCellClick(day, periodObj.num)}
                        className="p-2 border-r border-slate-200 last:border-r-0 h-20 align-top relative group cursor-pointer transition-all hover:bg-indigo-50/30"
                      >
                        {entry ? (
                          <div
                            className={`h-full rounded-xl p-2.5 border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                              getSubjectBadgeColor(entry.subject.name).bg
                            } ${getSubjectBadgeColor(entry.subject.name).border}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`font-black text-xs ${
                                    getSubjectBadgeColor(entry.subject.name).text
                                  }`}
                                >
                                  {entry.subject.name}
                                </span>
                                {entry.room && (
                                  <span className="px-1.5 py-0.2 rounded bg-white/80 text-[10px] font-semibold text-slate-600 border border-slate-200">
                                    {entry.room}
                                  </span>
                                )}
                              </div>

                              {/* Teacher Name */}
                              <p className="text-[11px] font-bold text-slate-900 mt-1 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{entry.teacher.user.name}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <span className="p-1 bg-white rounded-md text-slate-600 hover:text-indigo-600 shadow-2xs">
                                <Edit3 className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* AFTERNOON SHIFT SECTION */}
              <tr className="bg-indigo-500/10 border-b border-indigo-200/60">
                <td colSpan={7} className="px-4 py-1.5 text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider">
                  🌙 Buổi Chiều (Tiết 5 - Tiết 8)
                </td>
              </tr>

              {AFTERNOON_PERIODS.map((periodObj) => (
                <tr key={`period-${periodObj.num}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 text-center font-bold bg-slate-50/80 border-r border-slate-200">
                    <div className="text-slate-900 font-extrabold">{periodObj.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{periodObj.time}</div>
                  </td>

                  {DAYS.map((day) => {
                    const entry = getEntry(day, periodObj.num);
                    return (
                      <td
                        key={`cell-${day}-${periodObj.num}`}
                        onClick={() => handleCellClick(day, periodObj.num)}
                        className="p-2 border-r border-slate-200 last:border-r-0 h-20 align-top relative group cursor-pointer transition-all hover:bg-indigo-50/30"
                      >
                        {entry ? (
                          <div
                            className={`h-full rounded-xl p-2.5 border transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                              getSubjectBadgeColor(entry.subject.name).bg
                            } ${getSubjectBadgeColor(entry.subject.name).border}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`font-black text-xs ${
                                    getSubjectBadgeColor(entry.subject.name).text
                                  }`}
                                >
                                  {entry.subject.name}
                                </span>
                                {entry.room && (
                                  <span className="px-1.5 py-0.2 rounded bg-white/80 text-[10px] font-semibold text-slate-600 border border-slate-200">
                                    {entry.room}
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] font-bold text-slate-900 mt-1 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{entry.teacher.user.name}</span>
                              </p>
                            </div>

                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <span className="p-1 bg-white rounded-md text-slate-600 hover:text-indigo-600 shadow-2xs">
                                <Edit3 className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Schedule Entry Modal */}
      {showEntryModal && selectedSlot && (
        <Modal
          isOpen={showEntryModal}
          onClose={() => setShowEntryModal(false)}
          title={
            editingEntry
              ? `Chỉnh Sửa Tiết Học (${DAY_LABELS[selectedSlot.day]} - Tiết ${selectedSlot.period})`
              : `Thêm Tiết Học Mới (${DAY_LABELS[selectedSlot.day]} - Tiết ${selectedSlot.period})`
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                Lớp: <strong className="text-slate-900">{selectedClass?.name}</strong>
              </div>
              <div>
                Thời gian:{" "}
                <strong className="text-indigo-600">
                  {DAY_LABELS[selectedSlot.day]}, Tiết {selectedSlot.period}
                </strong>
              </div>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1. Chọn Môn Học *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Teacher Selection Section */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>2. Chọn Giáo Viên Phụ Trách *</span>
                </label>

                {currentSelectedSubject && (
                  <button
                    type="button"
                    onClick={() => setOnlyMatchedTeachers(!onlyMatchedTeachers)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Filter className="w-3 h-3" />
                    <span>
                      {onlyMatchedTeachers
                        ? `Hiện tất cả (${teachers.length} GV)`
                        : `Chỉ xem GV môn ${currentSelectedSubject.name} (${matchedTeachers.length} GV)`}
                    </span>
                  </button>
                )}
              </div>

              {/* Matched Banner Info */}
              {currentSelectedSubject && matchedTeachers.length > 0 && onlyMatchedTeachers && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Đã lọc {matchedTeachers.length} Giáo Viên đúng môn {currentSelectedSubject.name}</span>
                  </span>
                </div>
              )}

              {/* Filter Teacher Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Gõ tên giáo viên để tìm nhanh..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Smart Dropdown */}
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn giáo viên phụ trách --</option>

                {/* If subject selected & onlyMatched is active */}
                {currentSelectedSubject && matchedTeachers.length > 0 && onlyMatchedTeachers ? (
                  <optgroup label={`⭐ GIÁO VIÊN CHUYÊN MÔN (${currentSelectedSubject.name.toUpperCase()})`}>
                    {matchedTeachers
                      .filter((t) => {
                        if (!teacherSearch) return true;
                        const query = teacherSearch.toLowerCase();
                        return (
                          t.user.name.toLowerCase().includes(query) ||
                          (t.specialty && t.specialty.toLowerCase().includes(query))
                        );
                      })
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          ⭐ {t.user.name} {t.specialty ? `— ${t.specialty}` : ""}
                        </option>
                      ))}
                  </optgroup>
                ) : (
                  <>
                    {matchedTeachers.length > 0 && (
                      <optgroup label={`⭐ GIÁO VIÊN ĐÚNG BỘ MÔN (${currentSelectedSubject?.name?.toUpperCase() || ""})`}>
                        {matchedTeachers
                          .filter((t) => {
                            if (!teacherSearch) return true;
                            const query = teacherSearch.toLowerCase();
                            return (
                              t.user.name.toLowerCase().includes(query) ||
                              (t.specialty && t.specialty.toLowerCase().includes(query))
                            );
                          })
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              ⭐ {t.user.name} {t.specialty ? `— ${t.specialty}` : ""}
                            </option>
                          ))}
                      </optgroup>
                    )}

                    <optgroup label="TẤT CẢ GIÁO VIÊN BỘ MÔN KHÁC">
                      {otherTeachers
                        .filter((t) => {
                          if (!teacherSearch) return true;
                          const query = teacherSearch.toLowerCase();
                          return (
                            t.user.name.toLowerCase().includes(query) ||
                            (t.specialty && t.specialty.toLowerCase().includes(query))
                          );
                        })
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.user.name} {t.specialty ? `(${t.specialty})` : ""}
                          </option>
                        ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>

            {/* Room Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">3. Phòng Học (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng 201, Phòng Lab 1..."
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {editingEntry ? (
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Xóa tiết này
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {editingEntry ? "Cập Nhật" : "Thêm Mới"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        targetType="SCHEDULES"
        title="Nhập Thời Khóa Biểu Hàng Loạt Từ Google Drive"
        onConfirmImport={handleDriveImportConfirm}
      />

      {/* Direct Excel Upload Modal */}
      {excelModalOpen && (
        <Modal
          isOpen={excelModalOpen}
          onClose={() => setExcelModalOpen(false)}
          title="Nhập Thời Khóa Biểu Hàng Loạt Từ File Excel / CSV"
        >
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Hướng dẫn file Excel/CSV:
              </p>
              <p>1. Tệp Excel/CSV cần chứa các cột: <b>Lớp, Thứ, Tiết, Môn Học, Giáo Viên, Phòng Học</b>.</p>
              <p>2. Hệ thống tự động ghép môn và giáo viên theo tên tương ứng.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Tải tệp mẫu (.CSV):</span>
              <button
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Tải File Mẫu
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Chọn file Excel (.xlsx) hoặc CSV từ máy tính</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dung lượng tối đa 10MB</p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setExcelModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
