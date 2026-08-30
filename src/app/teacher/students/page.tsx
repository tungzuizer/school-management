"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTeacherClassesAndStudents,
  createSingleStudent,
  importBulkStudents,
  resetStudentPasswordTeacher,
  deleteStudentTeacher,
  TeacherStudentData,
  BulkStudentRow,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
  UserPlus,
  Users,
  Search,
  FileSpreadsheet,
  Plus,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  School,
  GraduationCap,
  Grid,
  List,
  UploadCloud,
  FileText,
} from "lucide-react";

export default function TeacherStudentsPage() {
  const [classes, setClasses] = useState<{ id: string; name: string; gradeLevel: number; isHomeroom: boolean }[]>([]);
  const [students, setStudents] = useState<TeacherStudentData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"LIST" | "BULK">("LIST");

  // Single Add Form state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    classId: "",
    name: "",
    studentCode: "",
    dob: "",
    gender: "MALE" as "MALE" | "FEMALE",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk Excel import state
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [parsedRows, setParsedRows] = useState<BulkStudentRow[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Password reset & Delete modal state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentData | null>(null);
  const [newPwdInput, setNewPwdInput] = useState("abc123");
  const [resettingPwd, setResettingPwd] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<TeacherStudentData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getTeacherClassesAndStudents();
    setClasses(res.classes);
    setStudents(res.students);
    if (res.classes.length > 0 && !form.classId) {
      setForm((f) => ({ ...f, classId: res.classes[0].id }));
      setBulkClassId(res.classes[0].id);
    }
    setLoading(false);
  }, [form.classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Parse bulk text whenever bulkText changes
  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedRows([]);
      return;
    }
    const lines = bulkText.split("\n").filter((l) => l.trim().length > 0);
    const rows: BulkStudentRow[] = [];

    lines.forEach((line) => {
      // Split by tab (Excel paste) or comma/semicolon
      const cols = line.includes("\t") ? line.split("\t") : line.split(/[,;]/);
      if (cols.length >= 1) {
        const name = cols[0]?.trim();
        if (name && name !== "Họ và tên" && name !== "Họ tên") {
          rows.push({
            name,
            studentCode: cols[1]?.trim() || "",
            gender: cols[2]?.trim() || "",
            dob: cols[3]?.trim() || "",
            phone: cols[4]?.trim() || "",
            email: cols[5]?.trim() || "",
          });
        }
      }
    });

    setParsedRows(rows);
  }, [bulkText]);

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Vui lòng nhập họ và tên học sinh", "error");
      return;
    }
    if (!form.classId) {
      showToast("Vui lòng chọn lớp học", "error");
      return;
    }

    setSubmitting(true);
    const res = await createSingleStudent(form);
    setSubmitting(false);

    if (res.success) {
      showToast("Thêm học sinh mới thành công!", "success");
      setAddModalOpen(false);
      setForm((f) => ({ ...f, name: "", studentCode: "", dob: "", phone: "", email: "" }));
      loadData();
    } else {
      showToast(res.error || "Thêm học sinh thất bại", "error");
    }
  };

  const handleBulkImport = async () => {
    if (!bulkClassId) {
      showToast("Vui lòng chọn lớp học để nhập danh sách", "error");
      return;
    }
    if (parsedRows.length === 0) {
      showToast("Chưa có danh sách học sinh hợp lệ", "error");
      return;
    }

    setBulkSubmitting(true);
    const res = await importBulkStudents(bulkClassId, parsedRows);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã thêm thành công ${res.count} học sinh!`, "success");
      setBulkText("");
      setParsedRows([]);
      loadData();
    } else {
      showToast(res.error || "Lỗi khi nhập danh sách", "error");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedStudent) return;
    setResettingPwd(true);
    const res = await resetStudentPasswordTeacher(selectedStudent.id, newPwdInput);
    setResettingPwd(false);

    if (res.success) {
      showToast(`Đã đổi mật khẩu cho HS ${selectedStudent.user.name} thành "${newPwdInput}"`, "success");
      setPwdModalOpen(false);
      setSelectedStudent(null);
    } else {
      showToast(res.error || "Không thể đổi mật khẩu", "error");
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    const res = await deleteStudentTeacher(deletingStudent.id);
    setDeleting(false);

    if (res.success) {
      showToast("Đã xóa học sinh khỏi hệ thống", "success");
      setDeleteModalOpen(false);
      setDeletingStudent(null);
      loadData();
    } else {
      showToast(res.error || "Không thể xóa học sinh", "error");
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClassId === "ALL" || s.classRoom?.id === selectedClassId;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      s.user.name.toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
      s.user.email.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {ToastComponent}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-purple-200">
              <UserPlus className="w-3.5 h-3.5 text-purple-300" />
              <span>Phân hệ Quản lý Học sinh Giáo viên</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Thêm & Quản Lý Học Sinh</h1>
            <p className="text-sm text-purple-100/80 max-w-xl">
              Thêm mới cá nhân nhanh chóng hoặc nhập danh sách học sinh hàng loạt từ Excel chỉ trong một cú nhấp chuột.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("LIST");
                setAddModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-white text-purple-900 font-extrabold text-sm shadow-lg hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-700" />
              <span>Thêm Học Sinh Mới</span>
            </button>
            <button
              onClick={() => setActiveTab("BULK")}
              className="px-5 py-3 rounded-2xl bg-purple-500/30 hover:bg-purple-500/40 border border-white/20 text-white font-extrabold text-sm backdrop-blur-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-200" />
              <span>Nhập Hàng Loạt (Excel)</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-purple-200 block">Tổng sĩ số quản lý</span>
            <span className="text-2xl font-black mt-1 block">{students.length} HS</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-purple-200 block">Lớp học phân công</span>
            <span className="text-2xl font-black mt-1 block">{classes.length} Lớp</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-purple-200 block">Lớp Chủ nhiệm</span>
            <span className="text-2xl font-black mt-1 block text-emerald-300">
              {classes.find((c) => c.isHomeroom)?.name || "Chưa phân công"}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="text-xs font-semibold text-purple-200 block">Lớp trưởng / Cán sự</span>
            <span className="text-2xl font-black mt-1 block text-amber-300">
              {students.filter((s) => s.isClassMonitor).length} HS
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("LIST")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === "LIST"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách & Quản Lý Học Sinh</span>
        </button>
        <button
          onClick={() => setActiveTab("BULK")}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
            activeTab === "BULK"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>Nhập Excel Hàng Loạt</span>
          {parsedRows.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-400 text-slate-900">
              {parsedRows.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: LIST & SEARCH */}
      {activeTab === "LIST" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, mã HS, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            {/* Class Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
              <button
                onClick={() => setSelectedClassId("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedClassId === "ALL"
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả các lớp
              </button>
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedClassId === c.id
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                  {c.isHomeroom && <span className="text-[10px] bg-emerald-400 text-slate-900 px-1.5 py-0.2 rounded font-black">CN</span>}
                </button>
              ))}
            </div>

            {/* View Mode Switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "GRID" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "TABLE" ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Content List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <p className="text-sm font-bold text-slate-500">Đang tải danh sách học sinh...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Không tìm thấy học sinh nào</h3>
                <p className="text-xs text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc chọn lớp khác.</p>
              </div>
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md hover:bg-purple-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Học Sinh Ngay</span>
              </button>
            </div>
          ) : viewMode === "GRID" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shrink-0">
                        {s.user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate flex items-center gap-1.5">
                          <span>{s.user.name}</span>
                          {s.isClassMonitor && (
                            <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full shrink-0">
                              Lớp trưởng
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {s.studentCode || "Chưa có mã HS"} • {s.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 block">Lớp học</span>
                      <span className="font-bold text-slate-700 truncate block mt-0.5">
                        {s.classRoom?.name || "Chưa phân"}
                      </span>
                    </div>
                    <div className="bg-purple-50 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-600 block">Điểm khen thưởng</span>
                      <span className="font-extrabold text-purple-700 block mt-0.5">
                        +{s.bonusPoints || 0} điểm
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(s);
                        setPwdModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Đổi MK</span>
                    </button>
                    <button
                      onClick={() => {
                        setDeletingStudent(s);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Xóa học sinh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Mã Học Sinh</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Lớp</th>
                      <th className="p-4">Điểm Thưởng</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                              {s.user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{s.user.name}</span>
                              {s.isClassMonitor && (
                                <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded">
                                  Lớp trưởng
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">{s.studentCode || "---"}</td>
                        <td className="p-4 text-slate-600">{s.user.email}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                            {s.classRoom?.name || "Chưa phân"}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-purple-700">+{s.bonusPoints || 0}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setPwdModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Đổi MK</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeletingStudent(s);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer inline-flex"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK EXCEL IMPORT */}
      {activeTab === "BULK" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Nhập Danh Sách Học Sinh Từ Excel / Text</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dán trực tiếp dữ liệu từ bảng Excel (các cột: Họ tên, Mã HS, Giới tính, Ngày sinh, SĐT) hoặc nhập dạng văn bản. Hệ thống tự động phân tách dữ liệu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn Lớp Học Nhập Vào *</label>
                <select
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isHomeroom ? "(Lớp chủ nhiệm)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Cấu trúc cột khi dán từ Excel:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-purple-800 font-medium">
                  <li>Cột 1: Họ và tên (Bắt buộc)</li>
                  <li>Cột 2: Mã học sinh (Tự tạo nếu trống)</li>
                  <li>Cột 3: Giới tính (Nam / Nữ)</li>
                  <li>Cột 4: Ngày sinh (YYYY-MM-DD)</li>
                  <li>Cột 5: Số điện thoại</li>
                </ol>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dán Dữ Liệu Từ Excel (Copy & Paste vào ô bên dưới)
                </label>
                <textarea
                  rows={8}
                  placeholder={`Nguyễn Văn A\tHS1001\tNam\t2008-05-12\t0987654321\nTrần Thị B\tHS1002\tNữ\t2008-08-20\t0912345678`}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                />
              </div>

              {/* Preview parsed rows */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">
                      Xem trước ({parsedRows.length} học sinh hợp lệ)
                    </span>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkSubmitting}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {bulkSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                      <span>Xác Nhận Nhập {parsedRows.length} Học Sinh</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">STT</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5">Mã HS</th>
                          <th className="p-2.5">Giới tính</th>
                          <th className="p-2.5">Ngày sinh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{r.name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{r.studentCode || "Tự tạo"}</td>
                            <td className="p-2.5 text-slate-600">{r.gender || "---"}</td>
                            <td className="p-2.5 text-slate-600">{r.dob || "---"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ADD MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Thêm Học Sinh Mới">
        <form onSubmit={handleSingleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lớp Học *</label>
            <select
              value={form.classId}
              onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
              required
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isHomeroom ? "(Lớp chủ nhiệm)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên *</label>
            <input
              type="text"
              placeholder="VD: Nguyễn Văn Anh"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã Học Sinh</label>
              <input
                type="text"
                placeholder="Để trống để tự tạo"
                value={form.studentCode}
                onChange={(e) => setForm((f) => ({ ...f, studentCode: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "MALE" | "FEMALE" }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Sinh</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
              <input
                type="text"
                placeholder="VD: 0912345678"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu Học Sinh</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* PASSWORD RESET MODAL */}
      <Modal isOpen={pwdModalOpen} onClose={() => setPwdModalOpen(false)} title="Đổi Mật Khẩu Học Sinh">
        {selectedStudent && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Cấp lại mật khẩu cho học sinh <strong className="text-slate-900">{selectedStudent.user.name}</strong> ({selectedStudent.user.email}):
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="text"
                value={newPwdInput}
                onChange={(e) => setNewPwdInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setPwdModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resettingPwd}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {resettingPwd && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác Nhận Đổi Mật Khẩu</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Xóa Học Sinh">
        {deletingStudent && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa học sinh <strong className="text-slate-900">{deletingStudent.user.name}</strong> khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
