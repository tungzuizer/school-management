/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router `/admin/students`, Admin layout navigation.
 * 2. Affected APIs: `getStudents`, `getCampusesForSelect`, `getClassesForSelect`, `getSchoolsForSelect`, `createStudent`, `updateStudent`, `resetStudentPassword`, `deleteStudent`, `createBulkStudents`, `getStudentCredentialsOverview`, `getStudentCredentialSlips`, `getNextStudentCodePreviewAction`.
 * 3. Data Schemas: `StudentData`, `ClassOption`, `CampusOption`, `StudentCredentialItem`, `BulkStudentInput`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Chuẩn hóa bộ lọc Phân hiệu / Điểm trường trực thuộc cho 1.706 học sinh và 62 lớp học (Khối 1-5).
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getStudents,
  getCampusesForSelect,
  getClassesForSelect,
  getSchoolsForSelect,
  createStudent,
  updateStudent,
  resetStudentPassword,
  deleteStudent,
  createBulkStudents,
  getStudentCredentialsOverview,
  getStudentCredentialSlips,
  getNextStudentCodePreviewAction,
  StudentCredentialItem,
  BulkStudentInput,
} from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  KeyRound,
  Lock,
  FileSpreadsheet,
  Plus,
  Building2,
  LayoutGrid,
  Table,
  ShieldCheck,
  MapPin,
  Sparkles,
} from "lucide-react";
import StudentCredentialsModal from "./components/StudentCredentialsModal";
import StudentCredentialSlipsModal from "./components/StudentCredentialSlipsModal";

interface StudentData {
  id: string;
  studentCode: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  status: string;
  ethnicity: string | null;
  addressCurrent: string | null;
  fatherName: string | null;
  fatherJob: string | null;
  motherName: string | null;
  motherJob: string | null;
  user: { id: string; name: string; email: string };
  classRoom: {
    id: string;
    name: string;
    gradeLevel: number;
    campusId?: string | null;
    campus?: { id: string; name: string } | null;
    school?: { id: string; name: string } | null;
  } | null;
  group: { id: string; name: string } | null;
}

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: number;
  campusId?: string | null;
  campus?: { id: string; name: string } | null;
}

interface CampusOption {
  id: string;
  name: string;
  schoolId: string;
}

const defaultForm = {
  name: "",
  email: "",
  password: "",
  studentCode: "",
  classId: "",
  dob: "",
  gender: "",
  phone: "",
  ethnicity: "",
  addressCurrent: "",
  fatherName: "",
  fatherJob: "",
  motherName: "",
  motherJob: "",
  status: "STUDYING",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterCampus, setFilterCampus] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Password Reset state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [selectedStudentForPwd, setSelectedStudentForPwd] = useState<StudentData | null>(null);
  const [newPwdInput, setNewPwdInput] = useState("abc123");
  const [resettingPwd, setResettingPwd] = useState(false);

  // Credential Management Hub state (BGH exclusive)
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credentialsList, setCredentialsList] = useState<StudentCredentialItem[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credSlipsModalOpen, setCredSlipsModalOpen] = useState(false);
  const [credSlips, setCredSlips] = useState<any[]>([]);
  const [credSchoolName, setCredSchoolName] = useState("");
  const [credClassName, setCredClassName] = useState<string | undefined>(undefined);

  // Bulk import state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedStudents, setParsedStudents] = useState<BulkStudentInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

  // Khối lớp Tiểu học chuẩn hóa (Khối 1 đến Khối 5)
  const primaryGrades = [1, 2, 3, 4, 5];

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const gradeNum = filterGrade ? Number(filterGrade) : undefined;
    const campusParam = filterCampus !== "ALL" ? filterCampus : undefined;

    const [studentsData, campusesData, classesData, schoolsData] = await Promise.all([
      getStudents(search || undefined, filterClass || undefined, gradeNum, campusParam),
      getCampusesForSelect(),
      getClassesForSelect(campusParam, gradeNum),
      getSchoolsForSelect(),
    ]);

    setStudents(studentsData as unknown as StudentData[]);
    setCampuses(campusesData);
    setClasses(classesData);
    setSchools(schoolsData);
    setLoading(false);
  }, [search, filterCampus, filterGrade, filterClass]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const [codePreview, setCodePreview] = useState<{ studentCode: string; email: string } | null>(null);

  const fetchCodePreview = async (classId?: string) => {
    try {
      const res = await getNextStudentCodePreviewAction(classId);
      if (res.success) {
        setCodePreview({ studentCode: res.studentCode, email: res.email });
        setForm((prev) => ({
          ...prev,
          studentCode: res.studentCode,
          email: res.email,
        }));
      }
    } catch {}
  };

  const openCreate = async () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
    await fetchCodePreview(filterClass || undefined);
  };

  const handleClassChangeInForm = async (newClassId: string) => {
    setForm((prev) => ({ ...prev, classId: newClassId }));
    if (!editing) {
      await fetchCodePreview(newClassId || undefined);
    }
  };

  const safeFormatIsoDate = (val: any): string => {
    if (!val) return "";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const safeFormatDisplayDate = (val: any): string => {
    if (!val) return "—";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("vi-VN");
    } catch {
      return "—";
    }
  };

  const openEdit = (s: StudentData) => {
    setEditing(s);
    setForm({
      name: s.user?.name || "",
      email: s.user?.email || "",
      password: "",
      studentCode: s.studentCode || "",
      classId: s.classRoom?.id || "",
      dob: safeFormatIsoDate(s.dob),
      gender: s.gender || "",
      phone: s.phone || "",
      ethnicity: s.ethnicity || "",
      addressCurrent: s.addressCurrent || "",
      fatherName: s.fatherName || "",
      fatherJob: s.fatherJob || "",
      motherName: s.motherName || "",
      motherJob: s.motherJob || "",
      status: s.status || "STUDYING",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Vui lòng điền tên và email", "error");
      return;
    }
    if (!editing && !form.password) {
      showToast("Vui lòng nhập mật khẩu", "error");
      return;
    }
    setSubmitting(true);

    let result;
    if (editing) {
      result = await updateStudent(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        studentCode: form.studentCode || undefined,
        classId: form.classId || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
        ethnicity: form.ethnicity || undefined,
        addressCurrent: form.addressCurrent || undefined,
        fatherName: form.fatherName || undefined,
        fatherJob: form.fatherJob || undefined,
        motherName: form.motherName || undefined,
        motherJob: form.motherJob || undefined,
        status: form.status || undefined,
      });
    } else {
      result = await createStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        studentCode: form.studentCode || undefined,
        classId: form.classId || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
        ethnicity: form.ethnicity || undefined,
        addressCurrent: form.addressCurrent || undefined,
        fatherName: form.fatherName || undefined,
        fatherJob: form.fatherJob || undefined,
        motherName: form.motherName || undefined,
        motherJob: form.motherJob || undefined,
      });
    }
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm học sinh thành công");
      setModalOpen(false);
      loadData(true);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStudent(id);
    setDeleteConfirm(null);
    if (result.success) {
      showToast("Xóa học sinh thành công");
      loadData(true);
    } else showToast(result.error || "Không thể xóa", "error");
  };

  const openPasswordModal = (s: StudentData) => {
    setSelectedStudentForPwd(s);
    setNewPwdInput("abc123");
    setPwdModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedStudentForPwd) return;
    setResettingPwd(true);
    const res = await resetStudentPassword(selectedStudentForPwd.user.id, newPwdInput);
    setResettingPwd(false);
    if (res.success) {
      showToast(`Đã đặt lại mật khẩu cho ${selectedStudentForPwd.user.name}: ${res.newPassword}`, "success");
      setPwdModalOpen(false);
      if (credModalOpen) {
        openCredentialsHub(true);
      }
    } else {
      showToast(res.error || "Không thể đặt lại mật khẩu", "error");
    }
  };

  const openCredentialsHub = async (silent = false) => {
    if (!silent) setLoadingCreds(true);
    setCredModalOpen(true);
    const res = await getStudentCredentialsOverview({
      campusId: filterCampus !== "ALL" ? filterCampus : undefined,
      classId: filterClass || undefined,
      gradeLevel: filterGrade ? Number(filterGrade) : undefined,
    });
    setLoadingCreds(false);
    if (res.success && res.data) {
      setCredentialsList(res.data);
    } else {
      showToast(res.error || "Không thể tải danh sách tài khoản học sinh", "error");
    }
  };

  const handleOpenSlips = async () => {
    const res = await getStudentCredentialSlips({
      campusId: filterCampus !== "ALL" ? filterCampus : undefined,
      classId: filterClass || undefined,
      gradeLevel: filterGrade ? Number(filterGrade) : undefined,
    });
    if (res.success && res.slips) {
      setCredSchoolName(res.schoolName);
      setCredClassName(res.className);
      setCredSlips(res.slips);
      setCredSlipsModalOpen(true);
    } else {
      showToast(res.error || "Lỗi tạo phiếu bàn giao học sinh", "error");
    }
  };

  const handleResetFromCredModal = (item: StudentCredentialItem) => {
    const matched = students.find((s) => s.id === item.id);
    if (matched) {
      openPasswordModal(matched);
    } else {
      setSelectedStudentForPwd({
        id: item.id,
        studentCode: item.studentCode,
        dob: null,
        gender: null,
        phone: item.phone,
        status: item.status,
        ethnicity: null,
        addressCurrent: null,
        fatherName: item.parentName,
        fatherJob: null,
        motherName: null,
        motherJob: null,
        user: { id: item.userId, name: item.name, email: item.email },
        classRoom: item.classId
          ? {
              id: item.classId,
              name: item.className,
              gradeLevel: item.gradeLevel || 1,
              campus: item.campusName ? { id: item.campusId || "", name: item.campusName } : null,
            }
          : null,
        group: null,
      });
      setNewPwdInput("abc123");
      setPwdModalOpen(true);
    }
  };

  const parseBulkText = (text: string, classId: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedStudents([]);
      return;
    }

    const results: BulkStudentInput[] = [];
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes("họ tên") ||
      firstLineLower.includes("mã hs") ||
      firstLineLower.includes("email")
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.includes("\t") ? line.split("\t") : line.split(",");
      const cleanCols = cols.map((c) => c.trim().replace(/^"(.*)"$/, "$1"));

      if (!cleanCols[0] && !cleanCols[1]) continue;

      let studentCode = cleanCols[0] || "";
      let name = cleanCols[1] || "";
      let email = cleanCols[2] || "";
      let rawDob = cleanCols[3] || "";
      let rawGender = cleanCols[4] || "";
      let phone = cleanCols[5] || "";
      let ethnicity = cleanCols[6] || "";
      let addressCurrent = cleanCols[7] || "";

      if (!name && studentCode && !studentCode.match(/^[A-Z0-9_-]+$/i)) {
        name = studentCode;
        studentCode = "";
      }

      let gender = "";
      if (rawGender.toLowerCase().startsWith("nam") || rawGender.toUpperCase() === "MALE") {
        gender = "MALE";
      } else if (
        rawGender.toLowerCase().startsWith("nữ") ||
        rawGender.toLowerCase() === "nu" ||
        rawGender.toUpperCase() === "FEMALE"
      ) {
        gender = "FEMALE";
      }

      let dob = "";
      if (rawDob) {
        if (rawDob.includes("/")) {
          const parts = rawDob.split("/");
          if (parts.length === 3) {
            dob = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
        } else if (rawDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dob = rawDob;
        }
      }

      results.push({
        studentCode: studentCode || undefined,
        name,
        email: email || undefined,
        classId: classId || undefined,
        dob: dob || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        ethnicity: ethnicity || undefined,
        addressCurrent: addressCurrent || undefined,
      });
    }

    setParsedStudents(results);
  };

  const handleBulkTextChange = (text: string) => {
    setBulkInput(text);
    parseBulkText(text, bulkClassId);
  };

  const handleBulkClassChange = (classId: string) => {
    setBulkClassId(classId);
    parseBulkText(bulkInput, classId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkInput(content);
        parseBulkText(content, bulkClassId);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (parsedStudents.length === 0) {
      showToast("Chưa có dữ liệu hợp lệ để nhập", "error");
      return;
    }
    setBulkSubmitting(true);
    const res = await createBulkStudents(parsedStudents);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} học sinh!`);
      setBulkResult({ count: res.count, errors: res.errors || [] });
      loadData(true);
    } else {
      showToast(res.error || "Nhập thất bại", "error");
      if (res.errors && res.errors.length > 0) {
        setBulkResult({ count: res.count || 0, errors: res.errors });
      }
    }
  };

  const statusLabel: Record<string, string> = {
    STUDYING: "Đang học",
    TRANSFERRED: "Chuyển trường",
    DROPPED_OUT: "Nghỉ học",
  };
  const statusColor: Record<string, string> = {
    STUDYING: "bg-emerald-100 text-emerald-800",
    TRANSFERRED: "bg-amber-100 text-amber-800",
    DROPPED_OUT: "bg-rose-100 text-rose-800",
  };

  const getCampusBadge = (campusName?: string | null) => {
    if (!campusName) return { label: "Điểm Trung tâm", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    if (campusName.includes("Sơn Hà 1")) return { label: "Sơn Hà 1", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (campusName.includes("Sơn Hà 2")) return { label: "Sơn Hà 2", bg: "bg-teal-50 text-teal-700 border-teal-200" };
    if (campusName.includes("Sơn Hải")) return { label: "Sơn Hải", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    if (campusName.includes("Phố Lu 3")) return { label: "Phố Lu 3", bg: "bg-purple-50 text-purple-700 border-purple-200" };
    if (campusName.includes("An Tiến")) return { label: "Điểm lẻ An Tiến", bg: "bg-rose-50 text-rose-700 border-rose-200" };
    return { label: campusName, bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  };

  return (
    <div className="space-y-5">
      {ToastComponent}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ sơ Học sinh</h1>
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              1.706 Học sinh • Khối 1 - 5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý lý lịch học sinh, phân hiệu trực thuộc, mã định danh và tài khoản đăng nhập
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openCredentialsHub(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active-press"
            title="Xem và quản lý tài khoản, mật khẩu học sinh"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Quản lý TK & Mật khẩu</span>
          </button>
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkInput("");
              setParsedStudents([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl hover:bg-emerald-700 flex items-center gap-1.5 text-xs font-bold transition-all active-press"
          >
            <FileSpreadsheet className="w-4 h-4" /> Nhập CSV/Text
          </button>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-1.5 text-xs font-bold transition-all active-press"
          >
            <Plus className="w-4 h-4" /> Thêm học sinh
          </button>
        </div>
      </div>

      {/* Campus Selector Bar (Thanh chọn Phân hiệu & Điểm trường) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Chọn Phân hiệu / Điểm trường trực thuộc để lọc:
          </span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {campuses.length} Phân hiệu & Điểm trường
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilterCampus("ALL");
              setFilterClass("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterCampus === "ALL" || filterCampus === ""
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Toàn trường (Tất cả điểm trường)
          </button>
          {campuses.map((c) => {
            const isSelected = filterCampus === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setFilterCampus(c.id);
                  setFilterClass("");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                    : `bg-white text-slate-700 border-slate-200 hover:bg-slate-50`
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-indigo-500"}`} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Tìm học sinh theo tên, mã định danh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-56 sm:w-64 bg-slate-50/50 shadow-2xs font-medium"
          />

          {/* Lọc Khối 1 - 5 */}
          <select
            value={filterGrade}
            onChange={(e) => {
              setFilterGrade(e.target.value);
              setFilterClass("");
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50/50 shadow-2xs font-semibold text-slate-700"
          >
            <option value="">Tất cả Khối lớp (Khối 1 - 5)</option>
            {primaryGrades.map((g) => (
              <option key={g} value={g}>
                Khối {g}
              </option>
            ))}
          </select>

          {/* Lọc Lớp học theo Phân hiệu & Khối */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50/50 shadow-2xs font-semibold text-slate-700"
          >
            <option value="">Tất cả Lớp học</option>
            {classes
              .filter((c) => !filterGrade || c.gradeLevel === Number(filterGrade))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name} {c.campus?.name ? `(${c.campus.name})` : ""}
                </option>
              ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Dạng Thẻ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">Đang tải danh sách học sinh...</div>
          ) : students.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">Không tìm thấy học sinh nào phù hợp với bộ lọc</div>
          ) : (
            students.map((s) => {
              const campusBadge = getCampusBadge(s.classRoom?.campus?.name);
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {s.user?.name || "Học sinh"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor[s.status] || "bg-slate-100 text-slate-700"}`}>
                        {statusLabel[s.status] || s.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${campusBadge.bg}`}>
                        📍 {campusBadge.label}
                      </span>
                      {s.classRoom && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          Lớp {s.classRoom.name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Mã HS:</span> {s.studentCode || "—"} |{" "}
                      <span className="font-semibold text-slate-700">Giới tính:</span> {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Ngày sinh:</span> {safeFormatDisplayDate(s.dob)}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">Email:</span> {s.user?.email || "—"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                        Chỉnh sửa
                      </button>
                      <button onClick={() => openPasswordModal(s)} className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Đổi MK
                      </button>
                    </div>
                    <button onClick={() => setDeleteConfirm(s.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Mã HS</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Họ tên</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Phân hiệu & Lớp</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Ngày sinh</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Giới tính</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Mật khẩu</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-600 uppercase">Trạng thái</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-600 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Đang tải danh sách học sinh...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Chưa có học sinh nào
                    </td>
                  </tr>
                ) : (
                  students.map((s) => {
                    const campusBadge = getCampusBadge(s.classRoom?.campus?.name);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{s.studentCode || "—"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.user?.name || "Học sinh"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-800">
                              {s.classRoom ? `Lớp ${s.classRoom.name}` : "Chưa phân lớp"}
                            </span>
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border w-fit ${campusBadge.bg}`}>
                              📍 {campusBadge.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{safeFormatDisplayDate(s.dob)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 font-semibold">
                            <KeyRound className="w-3 h-3 text-amber-600" /> abc123
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor[s.status] || ""}`}>
                            {statusLabel[s.status] || s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => openPasswordModal(s)}
                            className="text-amber-700 hover:text-amber-900 font-bold"
                          >
                            Đổi MK
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(s.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa thông tin học sinh" : "Thêm học sinh mới"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {!editing ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>MÃ ĐỊNH DANH & TÀI KHOẢN TỰ ĐỘNG (CỐ ĐỊNH CHUẨN HÓA)</span>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Auto-Generated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    HS
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Mã Học Sinh Cố Định</span>
                    <span className="font-mono font-black text-sm text-indigo-700">
                      {codePreview?.studentCode || form.studentCode || "HS26100001"}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs">
                    @
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-slate-500 block">Email Đăng Nhập Chuẩn Hóa</span>
                    <span className="font-mono font-bold text-xs text-slate-900 truncate block">
                      {codePreview?.email || form.email || "hs26100001@gmail.com"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Mã định danh và Email được cấp phát cố định duy nhất theo Khóa & Khối lớp, gắn liền với học sinh suốt quá trình học tập.</span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 border-b pb-1">Thông tin tài khoản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.studentCode}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-slate-100 text-slate-600 font-mono cursor-not-allowed text-sm"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Cố định - Không được phép sửa đổi</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Thông tin học sinh */}
          <h3 className="font-semibold text-gray-800 border-b pb-1 pt-2">Thông tin cá nhân & Lớp học</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Nguyễn Văn Anh"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp học</label>
              <select
                value={form.classId}
                onChange={(e) => handleClassChangeInForm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Chưa xếp lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.campus?.name ? `(${c.campus.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">Chọn</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dân tộc</label>
              <input
                type="text"
                value={form.ethnicity}
                onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="VD: Tày, Mông, Kinh..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ hiện tại</label>
              <input
                type="text"
                value={form.addressCurrent}
                onChange={(e) => setForm({ ...form, addressCurrent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="VD: Thôn Sơn Hà, Xã Bảo Thắng"
              />
            </div>
          </div>

          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="STUDYING">Đang học</option>
                <option value="TRANSFERRED">Chuyển trường</option>
                <option value="DROPPED_OUT">Nghỉ học</option>
              </select>
            </div>
          )}

          {/* Thông tin gia đình */}
          <h3 className="font-semibold text-gray-800 border-b pb-1 pt-2">Thông tin gia đình</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên cha</label>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp cha</label>
              <input
                type="text"
                value={form.fatherJob}
                onChange={(e) => setForm({ ...form, fatherJob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên mẹ</label>
              <input
                type="text"
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp mẹ</label>
              <input
                type="text"
                value={form.motherJob}
                onChange={(e) => setForm({ ...form, motherJob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold"
            >
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6 text-sm">
          Bạn có chắc muốn xóa học sinh này? Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
            Hủy
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-bold"
          >
            Xóa
          </button>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title={`Đặt lại mật khẩu - ${selectedStudentForPwd?.user.name || ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold mb-1">🔑 Quản lý Mật khẩu Học sinh</p>
            <p>Mật khẩu mặc định hiện tại của tài khoản: <strong className="font-mono text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">abc123</strong></p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="text"
              value={newPwdInput}
              onChange={(e) => setNewPwdInput(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-mono font-medium"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setNewPwdInput("abc123")}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Gán: abc123
            </button>
            <button
              type="button"
              onClick={() => setNewPwdInput("123456")}
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
            >
              Gán: 123456
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setPwdModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs hover:bg-gray-50 font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resettingPwd}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
            >
              {resettingPwd ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Credential Management Modal (BGH Only) */}
      <StudentCredentialsModal
        isOpen={credModalOpen}
        onClose={() => setCredModalOpen(false)}
        credentials={credentialsList}
        classes={classes}
        schools={schools}
        loading={loadingCreds}
        onResetPassword={handleResetFromCredModal}
        onOpenSlips={handleOpenSlips}
      />

      {/* Credential Slips Modal (In Phiếu Giao Nhận) */}
      <StudentCredentialSlipsModal
        isOpen={credSlipsModalOpen}
        onClose={() => setCredSlipsModalOpen(false)}
        schoolName={credSchoolName}
        className={credClassName}
        slips={credSlips}
      />

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách học sinh từ CSV / Văn bản"
        size="lg"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
          <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-2xl text-indigo-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Hướng dẫn định dạng dữ liệu:
            </p>
            <p className="text-slate-600 leading-relaxed">
              Bạn có thể copy paste dữ liệu từ Excel/Google Sheets hoặc tải lên file CSV.
              Cột dữ liệu theo thứ tự: <code className="bg-white px-1.5 py-0.5 rounded border font-bold">Mã HS, Họ tên, Email, Ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY), Giới tính, SĐT, Dân tộc, Địa chỉ</code>
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phân lớp mặc định cho danh sách nhập</label>
            <select
              value={bulkClassId}
              onChange={(e) => handleBulkClassChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">-- Không chọn (xếp lớp sau) --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.campus?.name ? `(${c.campus.name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Dán nội dung bảng (TSV/CSV)</label>
              <label className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Chọn tệp .CSV
                <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              value={bulkInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder="HS26100001	Nguyễn Văn Anh	hs26100001@gmail.com	2019-05-15	Nam	0912345678	Tày	Thôn Sơn Hà"
              rows={6}
              className="w-full px-3 py-2 border rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {parsedStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Xem trước dữ liệu ({parsedStudents.length} học sinh sẵn sàng nhập):
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-xl">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="p-1.5 text-left">Mã HS</th>
                      <th className="p-1.5 text-left">Họ tên</th>
                      <th className="p-1.5 text-left">Email</th>
                      <th className="p-1.5 text-left">Ngày sinh</th>
                      <th className="p-1.5 text-left">Giới tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 font-mono">{s.studentCode || "Tự tạo"}</td>
                        <td className="p-1.5 font-semibold">{s.name}</td>
                        <td className="p-1.5 font-mono">{s.email || "Tự tạo"}</td>
                        <td className="p-1.5">{s.dob || "—"}</td>
                        <td className="p-1.5">{s.gender || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bulkResult && (
            <div className={`p-3 rounded-xl border ${bulkResult.count > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
              <p className="font-bold">Đã tạo thành công {bulkResult.count} học sinh.</p>
              {bulkResult.errors.length > 0 && (
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  {bulkResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50 font-semibold"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting || parsedStudents.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5"
            >
              {bulkSubmitting ? "Đang xử lý..." : `Xác nhận nhập (${parsedStudents.length} HS)`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
