"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import { getTeachers, getSchoolsForTeacherSelect, createTeacher, updateTeacher, resetTeacherPassword, deleteTeacher, createBulkTeachers, BulkTeacherInput } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Loader2, KeyRound, Lock, CheckCircle2 } from "lucide-react";

interface TeacherData {
  id: string;
  userId: string;
  specialty: string | null;
  phone: string | null;
  degree: string | null;
  user: { id: string; name: string; email: string; role?: string; isApproved?: boolean; school?: { id: string; name: string } | null };
  homeroomClasses: { id: string; name: string; gradeLevel: number }[];
  teachingAssignments: { id: string; subject: { name: string }; classRoom: { name: string; gradeLevel?: number } }[];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "", phone: "", degree: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Password Reset state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [selectedTeacherForPwd, setSelectedTeacherForPwd] = useState<TeacherData | null>(null);
  const [newPwdInput, setNewPwdInput] = useState("abc123");
  const [resettingPwd, setResettingPwd] = useState(false);

  // Bulk import state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [parsedTeachers, setParsedTeachers] = useState<BulkTeacherInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

  const parseBulkText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedTeachers([]);
      return;
    }

    const results: BulkTeacherInput[] = [];
    let startIndex = 0;

    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes("họ tên") || firstLineLower.includes("tên") || firstLineLower.includes("email")) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cols: string[] = [];
      if (line.includes("\t")) {
        cols = line.split("\t").map((c) => c.trim());
      } else if (line.includes(",")) {
        cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      } else {
        cols = [line];
      }

      if (cols.length > 0 && cols[0]) {
        results.push({
          name: cols[0] || "",
          email: cols[1] || undefined,
          specialty: cols[2] || undefined,
          degree: cols[3] || undefined,
          phone: cols[4] || undefined,
        });
      }
    }
    setParsedTeachers(results);
  };

  const handleBulkTextChange = (text: string) => {
    setBulkInput(text);
    parseBulkText(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setBulkInput(content);
        parseBulkText(content);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "Họ tên,Email,Chuyên môn,Bằng cấp,Số điện thoại\n" +
      "Nguyễn Văn A,nguyenvana@school.edu.vn,Toán,Thạc sĩ,0912345678\n" +
      "Trần Thị B,,Ngữ văn,Cử nhân,0987654321";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_nhap_giao_vien.csv";
    link.click();
  };

  const handleBulkSubmit = async () => {
    if (parsedTeachers.length === 0) {
      showToast("Chưa có dữ liệu hợp lệ để nhập", "error");
      return;
    }
    setBulkSubmitting(true);
    const res = await createBulkTeachers(parsedTeachers);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} giáo viên!`);
      setBulkResult({ count: res.count, errors: res.errors || [] });
      loadData(true);
    } else {
      showToast(res.error || "Nhập hàng loạt thất bại", "error");
      if (res.errors && res.errors.length > 0) {
        setBulkResult({ count: res.count || 0, errors: res.errors });
      }
    }
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [teachersData, schoolsData] = await Promise.all([
      getTeachers(search || undefined, filterSpecialty || undefined, filterSchool || undefined),
      getSchoolsForTeacherSelect(),
    ]);
    setTeachers(teachersData as unknown as TeacherData[]);
    setSchools(schoolsData);
    setLoading(false);
  }, [search, filterSpecialty, filterSchool]);

  const uniqueSpecialties = Array.from(new Set(teachers.map((t) => t.specialty).filter(Boolean))) as string[];
  const uniqueGrades = Array.from(
    new Set(
      teachers.flatMap((t) => [
        ...t.homeroomClasses.map((c) => c.gradeLevel),
        ...t.teachingAssignments.map((a) => (a.classRoom as any)?.gradeLevel),
      ]).filter(Boolean)
    )
  ).sort((a: any, b: any) => a - b);
  const gradeOptions = uniqueGrades.length > 0 ? uniqueGrades : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const filteredTeachers = teachers.filter((t) => {
    if (!filterGrade) return true;
    const gradeNum = Number(filterGrade);
    const inHomeroom = t.homeroomClasses.some((c) => c.gradeLevel === gradeNum);
    const inTeaching = t.teachingAssignments.some((a) => (a.classRoom as any)?.gradeLevel === gradeNum);
    return inHomeroom || inTeaching;
  });

  useEffect(() => { loadData(); }, [loadData]);

  const STANDARD_SPECIALTIES = [
    "Toán học",
    "Ngữ văn",
    "Tiếng Anh",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Lịch sử",
    "Địa lý",
    "Giáo dục công dân",
    "Tin học",
    "Công nghệ",
    "Thể dục",
    "Âm nhạc",
    "Mỹ thuật",
    "Hoạt động trải nghiệm",
    "Giáo dục quốc phòng",
  ];

  const normalizeSpecialty = (s?: string | null): string => {
    if (!s) return "";
    const clean = s.trim();
    if (STANDARD_SPECIALTIES.includes(clean)) return clean;
    const lower = clean.toLowerCase();
    if (lower.includes("toán")) return "Toán học";
    if (lower.includes("văn") || lower.includes("ngữ văn")) return "Ngữ văn";
    if (lower.includes("anh") || lower.includes("tiếng anh")) return "Tiếng Anh";
    if (lower.includes("lý") || lower.includes("vật lý") || lower.includes("vật lí")) return "Vật lý";
    if (lower.includes("hóa") || lower.includes("hóa học") || lower.includes("hoá")) return "Hóa học";
    if (lower.includes("sinh") || lower.includes("sinh học")) return "Sinh học";
    if (lower.includes("sử") || lower.includes("lịch sử")) return "Lịch sử";
    if (lower.includes("địa") || lower.includes("địa lý") || lower.includes("địa lí")) return "Địa lý";
    if (lower.includes("gdcd") || lower.includes("công dân") || lower.includes("pháp luật")) return "Giáo dục công dân";
    if (lower.includes("tin") || lower.includes("tin học")) return "Tin học";
    if (lower.includes("công nghệ")) return "Công nghệ";
    if (lower.includes("thể") || lower.includes("thể dục")) return "Thể dục";
    if (lower.includes("nhạc") || lower.includes("âm nhạc")) return "Âm nhạc";
    if (lower.includes("thuật") || lower.includes("mỹ thuật") || lower.includes("mĩ thuật")) return "Mỹ thuật";
    if (lower.includes("trải nghiệm")) return "Hoạt động trải nghiệm";
    if (lower.includes("quốc phòng") || lower.includes("gdqp")) return "Giáo dục quốc phòng";
    return "OTHER";
  };

  const [customSpecialty, setCustomSpecialty] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", specialty: STANDARD_SPECIALTIES[0], phone: "", degree: "" });
    setCustomSpecialty("");
    setModalOpen(true);
  };

  const openEdit = (t: TeacherData) => {
    setEditing(t);
    const matchedSpec = normalizeSpecialty(t.specialty);
    setForm({
      name: t.user?.name || "",
      email: t.user?.email || "",
      password: "",
      specialty: matchedSpec,
      phone: t.phone || "",
      degree: t.degree || "",
    });
    setCustomSpecialty(matchedSpec === "OTHER" ? (t.specialty || "") : "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { showToast("Vui lòng điền tên và email", "error"); return; }

    const finalSpecialty = form.specialty === "OTHER" ? customSpecialty.trim() : form.specialty;

    setSubmitting(true);

    let result;
    if (editing) {
      result = await updateTeacher(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        specialty: finalSpecialty || undefined,
        phone: form.phone || undefined,
        degree: form.degree || undefined,
      });
    } else {
      result = await createTeacher({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        specialty: finalSpecialty || undefined,
        phone: form.phone || undefined,
        degree: form.degree || undefined,
      });
    }
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm giáo viên thành công");
      setModalOpen(false);
      loadData(true);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeacher(id);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa giáo viên thành công"); loadData(true); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  const openPasswordModal = (t: TeacherData) => {
    setSelectedTeacherForPwd(t);
    setNewPwdInput("abc123");
    setPwdModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedTeacherForPwd) return;
    setResettingPwd(true);
    const res = await resetTeacherPassword(selectedTeacherForPwd.user.id, newPwdInput);
    setResettingPwd(false);
    if (res.success) {
      showToast(`Đã đặt lại mật khẩu cho ${selectedTeacherForPwd.user.name}: ${res.newPassword}`, "success");
      setPwdModalOpen(false);
    } else {
      showToast(res.error || "Không thể đặt lại mật khẩu", "error");
    }
  };

  const handleDriveImportTeachers = async (validData: any[]) => {
    const res = await createBulkTeachers(validData);
    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} giáo viên từ Google Drive!`, "success");
      loadData(true);
    } else {
      showToast(res.error || "Nhập từ Google Drive thất bại", "error");
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Giáo viên</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDriveModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition"
          >
            <span>☁️</span> Google Drive
          </button>
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkInput("");
              setParsedTeachers([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>📥</span> Nhập CSV/Text
          </button>
          <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
            <span>+</span> Thêm giáo viên
          </button>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-52 sm:w-64 bg-white shadow-2xs"
          />

          {/* Lọc theo Trường */}
          {schools.length > 0 && (
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs max-w-[200px]"
            >
              <option value="">🏫 Tất cả các trường</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Lọc theo Chuyên môn */}
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs"
          >
            <option value="">📖 Tất cả chuyên môn</option>
            {uniqueSpecialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Lọc theo Khối */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs"
          >
            <option value="">📚 Tất cả khối dạy</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                Khối {g}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎴 Dạng Thẻ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải danh sách giáo viên...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Không tìm thấy giáo viên phù hợp</div>
          ) : (
            filteredTeachers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors block">
                        {t.user?.name || "Giáo viên"}
                      </span>
                      {t.user?.school?.name && (
                        <span className="text-[10px] text-indigo-700 font-semibold block">
                          🏫 {t.user.school.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {t.user?.role === "ADMIN" ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          👑 Hiệu trưởng
                        </span>
                      ) : t.user?.role === "VICE_PRINCIPAL" ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                          🏛️ Phó Hiệu trưởng
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {t.specialty || "Giáo viên"}
                        </span>
                      )}
                      {t.user?.isApproved === false ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          ⏳ Chờ duyệt
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          🟢 Đang hoạt động
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    <span className="font-semibold text-slate-700">Email:</span> {t.user?.email || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Bằng cấp:</span> {t.degree || "—"} |{" "}
                    <span className="font-semibold text-slate-700">SĐT:</span> {t.phone || "—"}
                  </p>

                  <div className="pt-1 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Chủ nhiệm / Phân công:</span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                      {t.homeroomClasses.map((c) => (
                        <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                          CN: {c.name}
                        </span>
                      ))}
                      {t.teachingAssignments.map((a) => (
                        <span key={a.id} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {a.subject.name} ({a.classRoom.name})
                        </span>
                      ))}
                      {t.homeroomClasses.length === 0 && t.teachingAssignments.length === 0 && (
                        <span className="text-[11px] text-slate-400 italic">Chưa phân công</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(t)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      Chỉnh sửa
                    </button>
                    <button onClick={() => openPasswordModal(t)} className="text-xs font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Đổi MK
                    </button>
                  </div>
                  <button onClick={() => setDeleteConfirm(t.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chuyên môn</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mật khẩu</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bằng cấp</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chủ nhiệm</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phân công</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                      <span>Đang tải danh sách giáo viên...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Không tìm thấy giáo viên phù hợp</td></tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{t.user?.name || "Giáo viên"}</div>
                      {t.user?.school?.name && (
                        <div className="text-[11px] text-indigo-600 font-medium">🏫 {t.user.school.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{t.user?.email || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{t.specialty || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-mono text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 font-semibold">
                        <KeyRound className="w-3 h-3 text-amber-600" /> abc123
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{t.degree || "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{t.phone || "—"}</td>
                    <td className="px-6 py-4">
                      {t.homeroomClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.homeroomClasses.map(c => (
                            <span key={c.id} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{c.name}</span>
                          ))}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {t.teachingAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.teachingAssignments.slice(0, 3).map(a => (
                            <span key={a.id} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                              {a.subject.name} - {a.classRoom.name}
                            </span>
                          ))}
                          {t.teachingAssignments.length > 3 && (
                            <span className="text-gray-500 text-xs">+{t.teachingAssignments.length - 3}</span>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                      <button onClick={() => openPasswordModal(t)} className="text-amber-700 hover:text-amber-900 text-sm font-medium">Đổi MK</button>
                      <button onClick={() => setDeleteConfirm(t.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa giáo viên" : "Thêm giáo viên mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu (mặc định: abc123)</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Để trống sẽ tự đặt là abc123" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên môn / Môn giảng dạy *</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              >
                <option value="">-- Chọn chuyên môn --</option>
                {STANDARD_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="OTHER">Chuyên môn khác (Nhập tay...)</option>
              </select>
              {form.specialty === "OTHER" && (
                <input
                  type="text"
                  value={customSpecialty}
                  onChange={(e) => setCustomSpecialty(e.target.value)}
                  placeholder="Nhập tên chuyên môn..."
                  className="mt-2 w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bằng cấp</label>
              <input type="text" value={form.degree} onChange={(e) => setForm({...form, degree: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Thạc sĩ, Cử nhân..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa giáo viên này? Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={pwdModalOpen}
        onClose={() => setPwdModalOpen(false)}
        title={`Đặt lại mật khẩu - ${selectedTeacherForPwd?.user.name || ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold mb-1">🔑 Quản lý Mật khẩu Giáo viên</p>
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

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách giáo viên hàng loạt"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold mb-1">💡 Hướng dẫn nhập dữ liệu:</p>
            <p>1. Copy hàng loạt từ Excel / Google Sheets hoặc tải file CSV mẫu.</p>
            <p>2. Thứ tự cột: <b>Họ tên | Email | Chuyên môn | Bằng cấp | SĐT</b></p>
            <p>3. Nếu bỏ trống Email, hệ thống sẽ tự tạo email <b>gv.[ten]@school.edu.vn</b> với mật khẩu mặc định là <b>123456</b>.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 font-medium"
            >
              📄 Tải mẫu CSV
            </button>
            <label className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded cursor-pointer hover:bg-indigo-100 font-medium">
              📁 Tải file CSV lên
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dán nội dung từ Excel / CSV vào đây:
            </label>
            <textarea
              rows={4}
              value={bulkInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder={`Nguyễn Văn A\tnguyenvana@school.edu.vn\tToán\tThạc sĩ\t0912345678\nTrần Thị B\t\tNgữ văn\tCử nhân\t0987654321`}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
            />
          </div>

          {parsedTeachers.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Xem trước dữ liệu sẽ nhập ({parsedTeachers.length} giáo viên):
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0 border-b text-gray-700">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Họ tên</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Chuyên môn</th>
                      <th className="p-2">Bằng cấp</th>
                      <th className="p-2">SĐT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedTeachers.map((t, idx) => (
                      <tr key={idx} className="hover:bg-white">
                        <td className="p-2 text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-medium text-gray-900">{t.name}</td>
                        <td className="p-2 text-gray-600">{t.email || "(Tự động tạo)"}</td>
                        <td className="p-2 text-gray-600">{t.specialty || "—"}</td>
                        <td className="p-2 text-gray-600">{t.degree || "—"}</td>
                        <td className="p-2 text-gray-600">{t.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bulkResult && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                bulkResult.count > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="font-semibold">Kết quả: Đã thêm thành công {bulkResult.count} giáo viên.</p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-700 max-h-28 overflow-y-auto space-y-1">
                  <p className="font-semibold">Ghi chú / Cảnh báo:</p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting || parsedTeachers.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {bulkSubmitting ? "Đang tiến hành nhập..." : `Lưu tất cả ${parsedTeachers.length} giáo viên`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        targetType="TEACHERS"
        onConfirmImport={handleDriveImportTeachers}
        title="Nhập danh sách Giáo viên từ Google Drive"
      />
    </div>
  );
}

