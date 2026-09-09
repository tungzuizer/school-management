/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin navigation (`src/app/admin/schedule/page.tsx`).
 * 2. Affected APIs: `getScheduleData`, `getScheduleFormData`, `createScheduleEntry`, `updateScheduleEntry`, `deleteScheduleEntry`, `clearClassSchedule`, `bulkImportSchedules`, `getTimetableMatrixAction`, `generateAiTimetableAction`, `swapScheduleSlotsAction`, `validateScheduleSwapAction`, `getTeacherWorkloadStatsAction`.
 * 3. Schema: `Schedule`, `ClassRoom`, `Teacher`, `Subject`, `TeachingAssignment`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getScheduleData,
  getScheduleFormData,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  clearClassSchedule,
  bulkImportSchedules,
  getTimetableMatrixAction,
  ScheduleDayHeader,
} from "./actions";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  FileSpreadsheet,
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
  Layers,
  ArrowLeftRight,
  Activity,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { StatCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { parseSpreadsheetBuffer, mapRowsToSchedules } from "@/lib/excel-parser";
import AiScheduleModal from "./components/AiScheduleModal";
import ScheduleSwapModal from "./components/ScheduleSwapModal";
import TeacherWorkloadDrawer from "./components/TeacherWorkloadDrawer";
import TimetableMatrixView, { ScheduleItem } from "./components/TimetableMatrixView";

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
  { num: 1, label: "Tiết 1", time: "07:15 - 08:00" },
  { num: 2, label: "Tiết 2", time: "08:05 - 08:50" },
  { num: 3, label: "Tiết 3", time: "09:05 - 09:50" },
  { num: 4, label: "Tiết 4", time: "09:55 - 10:40" },
];

const AFTERNOON_PERIODS = [
  { num: 5, label: "Tiết 5", time: "13:30 - 14:15" },
  { num: 6, label: "Tiết 6", time: "14:20 - 15:05" },
  { num: 7, label: "Tiết 7", time: "15:20 - 16:05" },
];

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
  "chao co": { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-900 dark:text-amber-200", border: "border-amber-300 dark:border-amber-700" },
  "sinh hoat": { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-900 dark:text-blue-200", border: "border-blue-300 dark:border-blue-700" },
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
type ClassOption = {
  id: string;
  name: string;
  gradeLevel: number;
  school?: { id: string; name: string };
  homeroomTeacherId?: string | null;
  homeroomTeacher?: { id: string; user: { name: string } } | null;
};
type SubjectOption = { id: string; name: string; code?: string | null };
type TeacherOption = {
  id: string;
  specialty: string | null;
  user: { id: string; name: string; email: string };
  homeroomClasses?: { school?: { id: string; name: string } }[];
  teachingAssignments?: {
    subjectId: string;
    classRoom?: { school?: { id: string; name: string } };
  }[];
  currentShiftsCount?: number;
  isOptimalForNewShift?: boolean;
};

interface SoftWarningState {
  isOpen: boolean;
  message: string;
  currentShifts?: number;
  newShifts?: number;
  aiSuggestions?: Array<{
    type: "TEACHER" | "SLOT";
    title: string;
    description: string;
    teacherId?: string;
    teacherName?: string;
    dayOfWeek?: number;
    period?: number;
  }>;
}

function getTeacherSchoolName(t: TeacherOption): string {
  const hrSchool = t.homeroomClasses?.[0]?.school?.name;
  if (hrSchool) return hrSchool;
  const taSchool = t.teachingAssignments?.find((ta) => ta.classRoom?.school?.name)?.classRoom?.school?.name;
  if (taSchool) return taSchool;
  return "";
}

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SchedulePage() {
  const { isEasyMode } = useEasyMode();
  const [isPending, startTransition] = useTransition();

  // Navigation View State
  const [activeMainTab, setActiveMainTab] = useState<"CLASS_VIEW" | "MATRIX_VIEW">("CLASS_VIEW");
  const [matrixSubView, setMatrixSubView] = useState<"CLASS" | "TEACHER" | "ALL_CLASSES">("CLASS");
  const [matrixSelectedTeacherId, setMatrixSelectedTeacherId] = useState("");

  // Base Options
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<number | "ALL">("ALL");

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);

  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Matrix View Data State
  const [matrixSchedules, setMatrixSchedules] = useState<ScheduleItem[]>([]);
  const [matrixClasses, setMatrixClasses] = useState<{ id: string; name: string; gradeLevel?: number | null }[]>([]);
  const [matrixTeachers, setMatrixTeachers] = useState<{ id: string; name: string; specialty?: string | null }[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [days, setDays] = useState<ScheduleDayHeader[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assistant & AI Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [workloadDrawerOpen, setWorkloadDrawerOpen] = useState(false);
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  // Swap Modal State
  const [swapModalState, setSwapModalState] = useState<{
    isOpen: boolean;
    classId: string;
    className: string;
    sourceSlot: { dayOfWeek: number; period: number; subjectName?: string; teacherName?: string; isFixed?: boolean } | null;
    targetSlot: { dayOfWeek: number; period: number; subjectName?: string; teacherName?: string; isFixed?: boolean } | null;
  }>({
    isOpen: false,
    classId: "",
    className: "",
    sourceSlot: null,
    targetSlot: null,
  });

  // Entry Form Modal States
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    room: "",
  });

  const [softWarning, setSoftWarning] = useState<SoftWarningState | null>(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [submittingForm, setSubmittingForm] = useState(false);

  const [onlyMatchedTeachers, setOnlyMatchedTeachers] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const changeWeek = (daysOffset: number) => {
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + daysOffset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(newDateStr);
    loadData(selectedClassId, selectedSchoolId, newDateStr);
  };

  const handleDateChange = (newDateStr: string) => {
    setSelectedDate(newDateStr);
    loadData(selectedClassId, selectedSchoolId, newDateStr);
  };

  async function loadData(classId?: string, schoolId?: string, dateStr?: string) {
    setLoading(true);
    const activeDateStr = dateStr || selectedDate;
    try {
      const scheduleRes = await getScheduleData(classId, schoolId, activeDateStr);
      const activeSchoolId = schoolId || scheduleRes.selectedClass?.school?.id || "";

      const formOptions = await getScheduleFormData(activeSchoolId);

      setSchools(scheduleRes.schools);
      setClasses(scheduleRes.classes);
      setSchedules(scheduleRes.schedules as ScheduleEntry[]);
      setSelectedClassId(scheduleRes.selectedClassId);
      setSelectedClass(scheduleRes.selectedClass as any);
      setDays(scheduleRes.days);
      if (activeSchoolId) {
        setSelectedSchoolId(activeSchoolId);
      }
      setSubjects(formOptions.subjects);
      setTeachers(formOptions.teachers as any);

      // Also preload matrix data for BGH Assistant
      loadMatrixData(activeSchoolId, scheduleRes.selectedClassId);
    } catch (err) {
      console.error("Error loading schedule page data:", err);
      setToast({ message: "Không thể tải dữ liệu thời khóa biểu", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function loadMatrixData(schoolId?: string, classId?: string, teacherId?: string) {
    try {
      const matrixRes = await getTimetableMatrixAction({
        schoolId: schoolId && schoolId !== "ALL" ? schoolId : undefined,
        classId: classId || undefined,
        teacherId: teacherId || undefined,
      });

      if (matrixRes && !("error" in matrixRes)) {
        const mappedSchedules: ScheduleItem[] = (matrixRes.schedules || []).map((s: any) => ({
          id: s.id,
          classId: s.classId,
          className: s.classRoom?.name || "",
          subjectId: s.subjectId,
          subjectName: s.subject?.name || "",
          teacherId: s.teacherId,
          teacherName: s.teacher?.user?.name || "",
          dayOfWeek: s.dayOfWeek,
          period: s.period,
          room: s.room,
          isFixed:
            (s.dayOfWeek === 1 && s.period === 1) ||
            (s.dayOfWeek === 5 && (s.period === 4 || s.period === 7)),
        }));

        setMatrixSchedules(mappedSchedules);
        setMatrixClasses(matrixRes.classes.map((c: any) => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel })));
        setMatrixTeachers(
          matrixRes.teachers.map((t: any) => ({
            id: t.id,
            name: t.user.name,
            specialty: t.user.specialty,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load matrix data:", err);
    }
  }

  const handleSchoolChange = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setRefreshing(true);
    try {
      const scheduleRes = await getScheduleData(undefined, schoolId, selectedDate);
      const activeSchoolId = schoolId || scheduleRes.selectedClass?.school?.id || "";

      setClasses(scheduleRes.classes);
      setSchedules(scheduleRes.schedules as ScheduleEntry[]);
      setSelectedClassId(scheduleRes.selectedClassId);
      setSelectedClass(scheduleRes.selectedClass as any);
      setDays(scheduleRes.days);

      const formOptions = await getScheduleFormData(activeSchoolId);
      setSubjects(formOptions.subjects);
      setTeachers(formOptions.teachers as any);

      loadMatrixData(activeSchoolId, scheduleRes.selectedClassId);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setRefreshing(true);
    try {
      const data = await getScheduleData(classId, selectedSchoolId, selectedDate);
      setSchedules(data.schedules as ScheduleEntry[]);
      setSelectedClass(data.selectedClass as any);
      setDays(data.days);

      const activeSchoolId = data.selectedClass?.school?.id || selectedSchoolId;
      if (activeSchoolId) {
        const formOptions = await getScheduleFormData(activeSchoolId);
        setSubjects(formOptions.subjects);
        setTeachers(formOptions.teachers as any);
      }

      loadMatrixData(activeSchoolId, classId);
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
    setSelectedSlot({ day, period });
    setSoftWarning(null);
    setShowAiSuggestions(true);

    if (existing) {
      setEditingEntry(existing);
      setFormData({
        subjectId: existing.subject.id,
        teacherId: existing.teacher.id,
        room: existing.room || "",
      });
      setOnlyMatchedTeachers(false);
    } else {
      setEditingEntry(null);
      // If Monday Period 1 (Chào Cờ) or Friday Period 7 (Sinh Hoạt), pre-suggest subject and GVCN
      let defaultSubjId = "";
      let defaultTeacherId = "";

      if (day === 1 && period === 1) {
        const chaoCoSubj = subjects.find(
          (s) =>
            s.name.toLowerCase().includes("chào cờ") ||
            s.name.toLowerCase().includes("sinh hoạt dưới cờ") ||
            s.name.toLowerCase().includes("hoạt động trải nghiệm")
        );
        if (chaoCoSubj) defaultSubjId = chaoCoSubj.id;
        if (selectedClass?.homeroomTeacher?.id) {
          defaultTeacherId = selectedClass.homeroomTeacher.id;
        } else if (selectedClass?.homeroomTeacherId) {
          defaultTeacherId = selectedClass.homeroomTeacherId;
        }
      } else if (day === 5 && period === 7) {
        const shlSubj = subjects.find(
          (s) =>
            s.name.toLowerCase().includes("sinh hoạt") ||
            s.name.toLowerCase().includes("hoạt động trải nghiệm")
        );
        if (shlSubj) defaultSubjId = shlSubj.id;
        if (selectedClass?.homeroomTeacher?.id) {
          defaultTeacherId = selectedClass.homeroomTeacher.id;
        } else if (selectedClass?.homeroomTeacherId) {
          defaultTeacherId = selectedClass.homeroomTeacherId;
        }
      }

      setFormData({
        subjectId: defaultSubjId,
        teacherId: defaultTeacherId,
        room: "",
      });
      setOnlyMatchedTeachers(defaultSubjId ? true : false);
    }
    setTeacherSearch("");
    setShowEntryModal(true);
  }

  const handleSubjectChange = (subjectId: string) => {
    const selectedSubj = subjects.find((s) => s.id === subjectId);
    let suggestedTeacherId = "";

    if (selectedSubj) {
      // If it's Chào cờ or Sinh hoạt lớp, suggest homeroom teacher
      const isChaoCo =
        selectedSubj.name.toLowerCase().includes("chào cờ") ||
        (selectedSlot?.day === 1 && selectedSlot?.period === 1);
      const isSinhHoat =
        selectedSubj.name.toLowerCase().includes("sinh hoạt") ||
        (selectedSlot?.day === 5 && selectedSlot?.period === 7);

      if ((isChaoCo || isSinhHoat) && (selectedClass?.homeroomTeacher?.id || selectedClass?.homeroomTeacherId)) {
        suggestedTeacherId = (selectedClass.homeroomTeacher?.id || selectedClass.homeroomTeacherId)!;
      } else {
        const matched = teachers.filter((t) => {
          const isAssigned = t.teachingAssignments?.some((ta) => ta.subjectId === selectedSubj.id);
          if (isAssigned) return true;
          if (!t.specialty) return false;
          const normSpec = normalizeStr(t.specialty);
          const normSubj = normalizeStr(selectedSubj.name);
          return normSpec.includes(normSubj) || normSubj.includes(normSpec);
        });

        if (matched.length > 0) {
          // Prefer teacher with optimal shifts (< 5 sessions)
          const optimal = matched.find((t) => t.isOptimalForNewShift);
          suggestedTeacherId = optimal ? optimal.id : matched[0].id;
        }
      }
    }

    setFormData({
      ...formData,
      subjectId,
      teacherId: suggestedTeacherId || formData.teacherId,
    });
    setOnlyMatchedTeachers(true);
    setSoftWarning(null);
  };

  const handleApplyAiSuggestion = (suggestion: {
    type: "TEACHER" | "SLOT";
    teacherId?: string;
    teacherName?: string;
    dayOfWeek?: number;
    period?: number;
  }) => {
    if (suggestion.type === "TEACHER" && suggestion.teacherId) {
      setFormData((prev) => ({ ...prev, teacherId: suggestion.teacherId! }));
      setToast({
        message: `Đã chọn giáo viên thay thế theo AI: ${suggestion.teacherName}`,
        type: "success",
      });
      setSoftWarning(null);
    } else if (suggestion.type === "SLOT" && suggestion.dayOfWeek && suggestion.period) {
      setSelectedSlot({ day: suggestion.dayOfWeek, period: suggestion.period });
      setToast({
        message: `Đã đổi sang khung giờ tối ưu: ${DAY_LABELS[suggestion.dayOfWeek]} - Tiết ${suggestion.period}`,
        type: "success",
      });
      setSoftWarning(null);
    }
  };

  async function handleSubmitForm(overrideShiftCap: boolean = false) {
    if (!selectedSlot || !formData.subjectId || !formData.teacherId) {
      setToast({ message: "Vui lòng chọn môn học và giáo viên phụ trách", type: "error" });
      return;
    }

    setSubmittingForm(true);

    try {
      if (editingEntry) {
        const res = await updateScheduleEntry(editingEntry.id, {
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
          room: formData.room,
          overrideShiftCap,
        });

        if (res.softWarning) {
          const warnMsg = res.error || "Cảnh báo: Giáo viên vượt quá định mức 5 buổi/tuần.";
          setSoftWarning({
            isOpen: true,
            message: warnMsg,
            currentShifts: res.currentShifts,
            newShifts: res.newShifts,
            aiSuggestions: res.aiSuggestions,
          });
          setShowAiSuggestions(true);
          setToast({ message: warnMsg, type: "error" });
          setSubmittingForm(false);
          return;
        }

        if (res.error) {
          setToast({ message: res.error, type: "error" });
          setSubmittingForm(false);
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
          overrideShiftCap,
        });

        if (res.softWarning) {
          const warnMsg = res.error || "Cảnh báo: Giáo viên vượt quá định mức 5 buổi/tuần.";
          setSoftWarning({
            isOpen: true,
            message: warnMsg,
            currentShifts: res.currentShifts,
            newShifts: res.newShifts,
            aiSuggestions: res.aiSuggestions,
          });
          setShowAiSuggestions(true);
          setToast({ message: warnMsg, type: "error" });
          setSubmittingForm(false);
          return;
        }

        if (res.error) {
          setToast({ message: res.error, type: "error" });
          setSubmittingForm(false);
          return;
        }
        setToast({ message: "Đã thêm tiết học mới thành công!", type: "success" });
      }

      setSoftWarning(null);
      setShowAiSuggestions(false);
      setShowEntryModal(false);
      handleClassChange(selectedClassId);
    } catch (err: any) {
      setToast({ message: err.message || "Lỗi khi lưu tiết học", type: "error" });
    } finally {
      setSubmittingForm(false);
    }
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

      {/* Hero Header & Executive Actions */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-sky-500/20 border border-sky-400/30 rounded-full text-sky-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Trợ Lý AI Ban Giám Hiệu
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[11px] font-bold">
                GDPT 2018
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản Lý & Xếp Thời Khóa Biểu Thông Minh
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Khóa cứng Chào cờ & Sinh hoạt, giới hạn 5 buổi/tuần, tối đa 7 tiết/ngày & đổi tiết không xung đột
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-sky-600/30 hover:scale-[1.02] active:scale-[0.98] border border-sky-400/30"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>Xếp TKB Bằng AI</span>
            </button>

            <button
              onClick={() => setWorkloadDrawerOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-sm"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Phân Tích Tải Trọng GV</span>
            </button>

            <button
              onClick={() => setExcelModalOpen(true)}
              className="px-3 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-emerald-400/30 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs (Executive Switcher) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMainTab("CLASS_VIEW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeMainTab === "CLASS_VIEW"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lịch Chi Tiết Theo Lớp</span>
          </button>

          <button
            onClick={() => {
              setActiveMainTab("MATRIX_VIEW");
              loadMatrixData(selectedSchoolId, selectedClassId);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeMainTab === "MATRIX_VIEW"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ma Trận TKB Ban Giám Hiệu & Đổi Tiết</span>
          </button>
        </div>

        {selectedClass && activeMainTab === "CLASS_VIEW" && (
          <button
            onClick={handleClearSchedule}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            title="Xóa thời khóa biểu lớp này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa TKB Lớp</span>
          </button>
        )}
      </div>

      {/* MATRIX VIEW CONTAINER */}
      {activeMainTab === "MATRIX_VIEW" ? (
        <div className="space-y-4">
          <TimetableMatrixView
            schedules={matrixSchedules}
            classes={matrixClasses}
            teachers={matrixTeachers}
            viewMode={matrixSubView}
            selectedClassId={selectedClassId}
            selectedTeacherId={matrixSelectedTeacherId}
            onSelectClass={(id) => {
              handleClassChange(id);
              loadMatrixData(selectedSchoolId, id);
            }}
            onSelectTeacher={(id) => {
              setMatrixSelectedTeacherId(id);
              loadMatrixData(selectedSchoolId, undefined, id);
            }}
            onOpenSwapModal={(source, target) => {
              setSwapModalState({
                isOpen: true,
                classId: source.classId,
                className: source.className,
                sourceSlot: source,
                targetSlot: target,
              });
            }}
          />
        </div>
      ) : (
        /* SINGLE CLASS DETAILED VIEW */
        <div className="space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Tổng số tiết học</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {schedules.length} / 35 tiết
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Giáo viên phụ trách</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {new Set(schedules.map((s) => s.teacherId)).size} Giáo viên
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Số phòng sử dụng</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {new Set(schedules.map((s) => s.room).filter(Boolean)).size || 1} Phòng
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-xl shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Mức độ hoàn thành</p>
                <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">
                  {Math.min(100, Math.round((schedules.length / 30) * 100))}%
                </p>
              </div>
            </div>
          </div>

          {/* Easy Mode Guidance Banner */}
          {isEasyMode && (
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Quy định sư phạm tự động áp dụng:</span>
              </div>
              <p>
                1. <b>Thứ 2 Tiết 1</b>: Luôn là tiết Chào cờ của GVCN.
              </p>
              <p>
                2. <b>Thứ 6 Tiết 7</b>: Luôn là tiết Sinh hoạt lớp của GVCN.
              </p>
              <p>
                3. Bấm vào ô bất kỳ để sửa hoặc thêm tiết. Hệ thống sẽ tự động đối chiếu giáo viên đúng bộ môn!
              </p>
            </div>
          )}

          {/* School & Grade & Class Selector Toolbar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
            {/* Week & Date Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-100">
                  Thời Khóa Biểu Tuần:{" "}
                  <span className="text-indigo-700 dark:text-indigo-300">
                    {days.length > 0 ? `${days[0].formattedDate} — ${days[days.length - 1].formattedDate}` : ""}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <button
                    onClick={() => changeWeek(-7)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Tuần trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDateChange(getTodayString())}
                    className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-md text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Hôm Nay
                  </button>
                  <button
                    onClick={() => changeWeek(7)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Tuần sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                />
              </div>
            </div>

            {/* School Selector */}
            {schools.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <School className="w-3.5 h-3.5 text-indigo-600" /> Trường:
                </span>
                <button
                  onClick={() => handleSchoolChange("")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    !selectedSchoolId
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
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
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {sch.name}
                  </button>
                ))}
              </div>
            )}

            {/* Grade Filters & Class Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">Khối:</span>
                <button
                  onClick={() => setSelectedGrade("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                    selectedGrade === "ALL"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200"
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
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-200"
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
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold">
                  Lịch Học Tuần — Lớp {selectedClass?.name || "..."}
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Bấm vào ô bất kỳ để chỉnh sửa hoặc chuyển sang tab Ma Trận để hoán đổi tiết
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs uppercase font-extrabold">
                    <th className="p-3 w-28 text-center border-r border-slate-200 dark:border-slate-700">Tiết / Ca</th>
                    {(days.length > 0
                      ? days.slice(0, 6)
                      : DAYS.map((d) => ({ dayOfWeek: d, label: DAY_LABELS[d], formattedDate: "", isToday: false }))
                    ).map((d) => (
                      <th
                        key={d.dayOfWeek}
                        className={`p-3 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                          d.isToday
                            ? "bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-black border-b-2 border-b-indigo-600"
                            : ""
                        }`}
                      >
                        <div className="text-indigo-700 dark:text-indigo-400 font-extrabold text-sm">{d.label}</div>
                        {d.formattedDate && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                            ({d.formattedDate})
                          </div>
                        )}
                        {d.isToday && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-600 text-white font-extrabold text-[9px] rounded-full uppercase tracking-wider">
                            Hôm nay
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs">
                  {/* MORNING SHIFT */}
                  <tr className="bg-amber-500/10 border-b border-amber-200/60 dark:border-amber-900/40">
                    <td
                      colSpan={7}
                      className="px-4 py-1.5 text-[11px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider"
                    >
                      ☀️ Buổi Sáng (Tiết 1 - Tiết 4)
                    </td>
                  </tr>

                  {MORNING_PERIODS.map((periodObj) => (
                    <tr key={`period-${periodObj.num}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 text-center font-bold bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">
                        <div className="text-slate-900 dark:text-slate-100 font-extrabold">{periodObj.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {periodObj.time}
                        </div>
                      </td>

                      {DAYS.map((day) => {
                        const entry = getEntry(day, periodObj.num);
                        const isFixedSlot = day === 1 && periodObj.num === 1;

                        return (
                          <td
                            key={`cell-${day}-${periodObj.num}`}
                            onClick={() => handleCellClick(day, periodObj.num)}
                            className="p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 h-20 align-top relative group cursor-pointer transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
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
                                    {isFixedSlot ? (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-[10px] font-bold text-amber-900 dark:text-amber-100 flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> Khóa
                                      </span>
                                    ) : entry.room ? (
                                      <span className="px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {entry.room}
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{entry.teacher.user.name}</span>
                                  </p>
                                </div>

                                {!isFixedSlot && (
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    <span className="p-1 bg-white dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-2xs">
                                      <Edit3 className="w-3 h-3" />
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
                                <Plus className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* AFTERNOON SHIFT */}
                  <tr className="bg-indigo-500/10 border-b border-indigo-200/60 dark:border-indigo-900/40">
                    <td
                      colSpan={7}
                      className="px-4 py-1.5 text-[11px] font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider"
                    >
                      🌙 Buổi Chiều (Tiết 5 - Tiết 7)
                    </td>
                  </tr>

                  {AFTERNOON_PERIODS.map((periodObj) => (
                    <tr key={`period-${periodObj.num}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-3 text-center font-bold bg-slate-50/80 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">
                        <div className="text-slate-900 dark:text-slate-100 font-extrabold">{periodObj.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {periodObj.time}
                        </div>
                      </td>

                      {DAYS.map((day) => {
                        const entry = getEntry(day, periodObj.num);
                        const isFixedSlot = day === 5 && periodObj.num === 7;

                        return (
                          <td
                            key={`cell-${day}-${periodObj.num}`}
                            onClick={() => handleCellClick(day, periodObj.num)}
                            className="p-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0 h-20 align-top relative group cursor-pointer transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30"
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
                                    {isFixedSlot ? (
                                      <span className="px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-900 text-[10px] font-bold text-blue-900 dark:text-blue-100 flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> Khóa
                                      </span>
                                    ) : entry.room ? (
                                      <span className="px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {entry.room}
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{entry.teacher.user.name}</span>
                                  </p>
                                </div>

                                {!isFixedSlot && (
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    <span className="p-1 bg-white dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-2xs">
                                      <Edit3 className="w-3 h-3" />
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">
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
        </div>
      )}

      {/* MODALS & DRAWERS */}

      {/* 1. AI Timetable Solver Modal */}
      {aiModalOpen && (
        <AiScheduleModal
          isOpen={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          schools={schools}
          selectedSchoolId={selectedSchoolId}
          onSuccess={() => {
            setToast({ message: "Đã hoàn thành xếp thời khóa biểu thông minh bằng AI!", type: "success" });
            handleClassChange(selectedClassId);
            loadMatrixData(selectedSchoolId, selectedClassId);
          }}
        />
      )}

      {/* 2. Teacher Workload Drawer */}
      {workloadDrawerOpen && (
        <TeacherWorkloadDrawer
          isOpen={workloadDrawerOpen}
          onClose={() => setWorkloadDrawerOpen(false)}
          schoolId={selectedSchoolId}
          onSelectTeacher={(teacherId) => {
            setActiveMainTab("MATRIX_VIEW");
            setMatrixSubView("TEACHER");
            setMatrixSelectedTeacherId(teacherId);
            loadMatrixData(selectedSchoolId, undefined, teacherId);
          }}
        />
      )}

      {/* 3. Schedule Swap Modal */}
      {swapModalState.isOpen && swapModalState.sourceSlot && swapModalState.targetSlot && (
        <ScheduleSwapModal
          isOpen={swapModalState.isOpen}
          onClose={() => setSwapModalState({ ...swapModalState, isOpen: false })}
          classId={swapModalState.classId}
          className={swapModalState.className}
          sourceSlot={swapModalState.sourceSlot}
          targetSlot={swapModalState.targetSlot}
          onSuccess={() => {
            setToast({ message: "Hoán đổi tiết học thành công không xảy ra xung đột!", type: "success" });
            handleClassChange(selectedClassId);
            loadMatrixData(selectedSchoolId, selectedClassId);
          }}
        />
      )}

      {/* 4. Add / Edit Schedule Entry Modal */}
      {showEntryModal && selectedSlot && (
        <Modal
          isOpen={showEntryModal}
          onClose={() => {
            setShowEntryModal(false);
            setSoftWarning(null);
          }}
          title={
            editingEntry
              ? `Chỉnh Sửa Tiết Học (${DAY_LABELS[selectedSlot.day]} - Tiết ${selectedSlot.period})`
              : `Thêm Tiết Học Mới (${DAY_LABELS[selectedSlot.day]} - Tiết ${selectedSlot.period})`
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <div>
                Lớp: <strong className="text-slate-900 dark:text-slate-100">{selectedClass?.name}</strong>
                {selectedClass?.homeroomTeacher && (
                  <span className="ml-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                    (GVCN: {selectedClass.homeroomTeacher.user.name})
                  </span>
                )}
              </div>
              <div>
                Thời gian:{" "}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {DAY_LABELS[selectedSlot.day]}, Tiết {selectedSlot.period}
                </strong>
              </div>
            </div>

            {/* Special Fixed Slot Notices */}
            {selectedSlot.day === 1 && selectedSlot.period === 1 && (
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>👑 Tiết 1 Thứ 2: Tiết Chào cờ cố định toàn trường. Tự động gán và kiểm tra nghiêm ngặt cho Giáo viên Chủ nhiệm ({selectedClass?.homeroomTeacher?.user.name || "GVCN"}).</span>
              </div>
            )}

            {selectedSlot.day === 5 && selectedSlot.period === 7 && (
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>👑 Tiết cuối Thứ 6: Tiết Sinh hoạt lớp cố định. Bắt buộc do Giáo viên Chủ nhiệm ({selectedClass?.homeroomTeacher?.user.name || "GVCN"}) phụ trách.</span>
              </div>
            )}

            {/* Subject Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                1. Chọn Môn Học *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
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
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Chọn Giáo Viên Phụ Trách *</span>
                </label>

                {currentSelectedSubject && (
                  <button
                    type="button"
                    onClick={() => setOnlyMatchedTeachers(!onlyMatchedTeachers)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1"
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

              {currentSelectedSubject && matchedTeachers.length > 0 && onlyMatchedTeachers && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-xl text-xs flex items-center justify-between">
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
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Smart Dropdown with Teaching Sessions and GVCN Badges */}
              <select
                value={formData.teacherId}
                onChange={(e) => {
                  setFormData({ ...formData, teacherId: e.target.value });
                  setSoftWarning(null);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">-- Chọn giáo viên phụ trách --</option>

                {currentSelectedSubject && matchedTeachers.length > 0 && onlyMatchedTeachers ? (
                  <optgroup label={`⭐ GIÁO VIÊN CHUYÊN MÔN (${currentSelectedSubject.name.toUpperCase()})`}>
                    {matchedTeachers
                      .filter((t) => {
                        if (!teacherSearch) return true;
                        const query = teacherSearch.toLowerCase();
                        return (
                          t.user.name.toLowerCase().includes(query) ||
                          (t.specialty && t.specialty.toLowerCase().includes(query)) ||
                          getTeacherSchoolName(t).toLowerCase().includes(query)
                        );
                      })
                      .map((t) => {
                        const isGVCN =
                          t.id === selectedClass?.homeroomTeacherId ||
                          t.id === selectedClass?.homeroomTeacher?.id;
                        const gvcnPrefix = isGVCN ? "👑 [GVCN] " : "";
                        const shiftText =
                          t.currentShiftsCount !== undefined ? ` [${t.currentShiftsCount}/5 buổi]` : "";
                        const optimalText = t.isOptimalForNewShift ? " ✨ Tối ưu" : "";

                        return (
                          <option key={t.id} value={t.id}>
                            ⭐ {gvcnPrefix}
                            {t.user.name}
                            {shiftText}
                            {optimalText}
                            {t.specialty ? ` — [Môn: ${t.specialty}]` : ""}{" "}
                            {getTeacherSchoolName(t) ? `(${getTeacherSchoolName(t)})` : ""}
                          </option>
                        );
                      })}
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
                              (t.specialty && t.specialty.toLowerCase().includes(query)) ||
                              getTeacherSchoolName(t).toLowerCase().includes(query)
                            );
                          })
                          .map((t) => {
                            const isGVCN =
                              t.id === selectedClass?.homeroomTeacherId ||
                              t.id === selectedClass?.homeroomTeacher?.id;
                            const gvcnPrefix = isGVCN ? "👑 [GVCN] " : "";
                            const shiftText =
                              t.currentShiftsCount !== undefined ? ` [${t.currentShiftsCount}/5 buổi]` : "";
                            const optimalText = t.isOptimalForNewShift ? " ✨ Tối ưu" : "";

                            return (
                              <option key={t.id} value={t.id}>
                                ⭐ {gvcnPrefix}
                                {t.user.name}
                                {shiftText}
                                {optimalText}
                                {t.specialty ? ` — [Môn: ${t.specialty}]` : ""}{" "}
                                {getTeacherSchoolName(t) ? `(${getTeacherSchoolName(t)})` : ""}
                              </option>
                            );
                          })}
                      </optgroup>
                    )}

                    <optgroup label="TẤT CẢ GIÁO VIÊN BỘ MÔN KHÁC">
                      {otherTeachers
                        .filter((t) => {
                          if (!teacherSearch) return true;
                          const query = teacherSearch.toLowerCase();
                          return (
                            t.user.name.toLowerCase().includes(query) ||
                            (t.specialty && t.specialty.toLowerCase().includes(query)) ||
                            getTeacherSchoolName(t).toLowerCase().includes(query)
                          );
                        })
                        .map((t) => {
                          const isGVCN =
                            t.id === selectedClass?.homeroomTeacherId ||
                            t.id === selectedClass?.homeroomTeacher?.id;
                          const gvcnPrefix = isGVCN ? "👑 [GVCN] " : "";
                          const shiftText =
                            t.currentShiftsCount !== undefined ? ` [${t.currentShiftsCount}/5 buổi]` : "";

                          return (
                            <option key={t.id} value={t.id}>
                              {gvcnPrefix}
                              {t.user.name}
                              {shiftText}
                              {t.specialty ? ` — [Môn: ${t.specialty}]` : ""}{" "}
                              {getTeacherSchoolName(t) ? `(${getTeacherSchoolName(t)})` : ""}
                            </option>
                          );
                        })}
                    </optgroup>
                  </>
                )}
              </select>
            </div>

            {/* Room Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                3. Phòng Học (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng 201, Phòng Lab 1..."
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* SOFT WARNING: OVER 5 SESSIONS WITH AI SUGGESTIONS & USER OVERRIDE */}
            {softWarning && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      ⚠️ CẢNH BÁO: GIÁO VIÊN VƯỢT ĐỊNH MỨC 5 BUỔI DẠY / TUẦN
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      {softWarning.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200 dark:border-amber-800/80">
                  <button
                    type="button"
                    disabled={submittingForm}
                    onClick={() => handleSubmitForm(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>✓ Vẫn Lưu (Xác Nhận Vượt Định Mức)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      {showAiSuggestions
                        ? "Ẩn gợi ý AI"
                        : `Xem Gợi Ý AI (${softWarning.aiSuggestions?.length || 0})`}
                    </span>
                  </button>
                </div>

                {/* AI Suggestions Dropdown / List */}
                {showAiSuggestions && softWarning.aiSuggestions && softWarning.aiSuggestions.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200 dark:border-amber-800/80 space-y-2">
                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Đề xuất từ AI Co-pilot (Ưu tiên người dùng, AI chỉ là gợi ý):</span>
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {softWarning.aiSuggestions.map((sug, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-2.5 bg-white dark:bg-slate-800/95 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-400 transition"
                        >
                          <div className="text-[11px] space-y-0.5">
                            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                              {sug.type === "TEACHER" ? "👨🏫 Đổi GV:" : "⏰ Chuyển giờ:"} {sug.title}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                              {sug.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyAiSuggestion(sug)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md text-[10px] font-bold shrink-0 transition"
                          >
                            Áp dụng
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              {editingEntry ? (
                <button
                  type="button"
                  onClick={handleDeleteEntry}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Xóa tiết này
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEntryModal(false);
                    setSoftWarning(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={submittingForm}
                  onClick={() => handleSubmitForm(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingForm
                    ? "Đang lưu..."
                    : editingEntry
                    ? "Cập Nhật"
                    : "Thêm Mới"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Excel Upload Modal */}
      {excelModalOpen && (
        <Modal
          isOpen={excelModalOpen}
          onClose={() => setExcelModalOpen(false)}
          title="Nhập Thời Khóa Biểu Hàng Loạt Từ File Excel / CSV"
        >
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Hướng dẫn file Excel/CSV:
              </p>
              <p>
                1. Tệp Excel/CSV cần chứa các cột: <b>Lớp, Thứ, Tiết, Môn Học, Giáo Viên, Phòng Học</b>.
              </p>
              <p>2. Hệ thống tự động ghép môn và giáo viên theo tên tương ứng.</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tải tệp mẫu (.CSV):</span>
              <button
                onClick={downloadSampleTemplate}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Tải File Mẫu
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Chọn file Excel (.xlsx) hoặc CSV từ máy tính
              </p>
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
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
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
