/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin navigation (`src/app/admin/classes/page.tsx`), admin layout.
 * 2. Affected APIs: Server actions `getClasses`, `getCampusesForSelect`, `getSchoolsForSelect`, `getTeachersForSelect`, `createClass`, `updateClass`, `deleteClass`, `createBulkClasses`.
 * 3. Schema: Prisma `ClassRoom`, `School`, `Campus`, `Teacher`, `User`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Chuẩn hóa giao diện quản lý Lớp học lọc theo Phân hiệu / Điểm trường trực thuộc (62 lớp học, Khối 1-5).
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getClasses,
  getSchoolsForSelect,
  getCampusesForSelect,
  getTeachersForSelect,
  createClass,
  updateClass,
  deleteClass,
  createBulkClasses,
  BulkClassInput,
} from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  FileSpreadsheet,
  Plus,
  School,
  Building2,
  LayoutGrid,
  Table,
  MapPin,
  GraduationCap,
  Users,
  Search,
  Filter,
} from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  gradeLevel: number;
  schoolId: string;
  campusId?: string | null;
  homeroomTeacherId: string | null;
  school: { id: string; name: string };
  campus?: { id: string; name: string } | null;
  homeroomTeacher: { id: string; user: { name: string } } | null;
  _count: { students: number };
}

interface SelectOption {
  id: string;
  name: string;
}
interface TeacherOption {
  id: string;
  user: { name: string };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [schools, setSchools] = useState<SelectOption[]>([]);
  const [campuses, setCampuses] = useState<SelectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [search, setSearch] = useState("");
  const [filterCampus, setFilterCampus] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    gradeLevel: "1",
    schoolId: "",
    campusId: "",
    homeroomTeacherId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Bulk import state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSchoolId, setBulkSchoolId] = useState("");
  const [bulkCampusId, setBulkCampusId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedClasses, setParsedClasses] = useState<BulkClassInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

  const getCampusBadgeStyle = (campusName?: string | null) => {
    if (!campusName) return "bg-slate-100 text-slate-700 border-slate-200";
    const name = campusName.toLowerCase();
    if (name.includes("trung tâm")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (name.includes("sơn hà 1")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (name.includes("sơn hà 2")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (name.includes("sơn hải")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (name.includes("phố lu 3")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (name.includes("an tiến")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const parseBulkText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedClasses([]);
      return;
    }

    const results: BulkClassInput[] = [];
    let startIndex = 0;

    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes("lớp") || firstLineLower.includes("tên") || firstLineLower.includes("khối")) {
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
        const name = cols[0];
        const gradeVal = cols[1] ? parseInt(cols[1]) : undefined;

        results.push({
          name,
          gradeLevel: gradeVal && !isNaN(gradeVal) ? gradeVal : undefined,
          schoolName: cols[2] || undefined,
          campusName: cols[3] || undefined,
          homeroomTeacherName: cols[4] || undefined,
        });
      }
    }
    setParsedClasses(results);
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
      "﻿" +
      "Tên lớp,Khối,Trường,Phân hiệu,GV Chủ nhiệm\n" +
      "1A1,1,Trường Tiểu học Phố Lu,Điểm trường Trung tâm (Phố Lu),Cô Nguyễn Thu Hằng\n" +
      "1A_SH1,1,Trường Tiểu học Phố Lu,Phân hiệu Sơn Hà 1,Cô Lương Thị Mai\n" +
      "1A_AT,1,Trường Tiểu học Phố Lu,Điểm trường An Tiến,Thầy Đặng Văn Nam";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_nhap_lop_hoc_pholu.csv";
    link.click();
  };

  const handleBulkSubmit = async () => {
    if (parsedClasses.length === 0) {
      showToast("Chưa có dữ liệu hợp lệ để nhập", "error");
      return;
    }
    setBulkSubmitting(true);
    const res = await createBulkClasses(parsedClasses, bulkSchoolId || undefined);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} lớp học!`);
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
    const [classData, campusData, schoolData, teacherData] = await Promise.all([
      getClasses(
        search || undefined,
        filterCampus || undefined,
        filterGrade ? parseInt(filterGrade) : undefined
      ),
      getCampusesForSelect(),
      getSchoolsForSelect(),
      getTeachersForSelect(),
    ]);
    setClasses(classData as ClassData[]);
    setCampuses(campusData);
    setSchools(schoolData);
    setTeachers(teacherData);
    setLoading(false);
  }, [search, filterCampus, filterGrade]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      gradeLevel: "1",
      schoolId: schools[0]?.id || "",
      campusId: filterCampus !== "ALL" ? filterCampus : campuses[0]?.id || "",
      homeroomTeacherId: "",
    });
    setModalOpen(true);
  };

  const openEdit = (c: ClassData) => {
    setEditing(c);
    setForm({
      name: c.name,
      gradeLevel: String(c.gradeLevel),
      schoolId: c.schoolId,
      campusId: c.campusId || "",
      homeroomTeacherId: c.homeroomTeacherId || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Vui lòng nhập tên lớp", "error");
      return;
    }
    setSubmitting(true);
    const selectedSchoolId = form.schoolId || schools[0]?.id || "";
    const data = {
      name: form.name.trim(),
      gradeLevel: parseInt(form.gradeLevel) || 1,
      schoolId: selectedSchoolId,
      campusId: form.campusId || undefined,
      homeroomTeacherId: form.homeroomTeacherId || undefined,
    };
    const result = editing ? await updateClass(editing.id, data) : await createClass(data);
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm lớp thành công");
      setModalOpen(false);
      loadData(true);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteClass(id);
    setDeleteConfirm(null);
    if (result.success) {
      showToast("Xóa lớp thành công");
      loadData();
    } else {
      showToast(result.error || "Không thể xóa", "error");
    }
  };

  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);

  return (
    <div className="space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <School className="w-7 h-7 text-indigo-600" /> Quản lý Lớp học Phân hiệu
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống 62 lớp học Tiểu học (Khối 1 - Khối 5) phân bổ trên Điểm Trung tâm và 5 Phân hiệu trực thuộc
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkInput("");
              setParsedClasses([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-3.5 py-2 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-xs font-bold shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" /> Nhập CSV/Excel
          </button>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" /> Thêm Lớp Mới
          </button>
        </div>
      </div>

      {/* Campus Selector Bar (Thanh chọn Phân hiệu & Điểm trường) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
          <span className="flex items-center gap-2 text-slate-800">
            <MapPin className="w-4 h-4 text-indigo-600" /> Chọn Phân hiệu / Điểm trường trực thuộc để lọc:
          </span>
          <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
            Tổng: {classes.length} Lớp | {totalStudents} Học sinh
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCampus("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              filterCampus === "ALL"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Tất cả 6 Phân hiệu & Điểm trường
          </button>

          {campuses.map((c) => {
            const isSelected = filterCampus === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setFilterCampus(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên lớp học (1A1, 2A_SH1...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-xl shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="px-2 py-1 text-xs font-bold text-slate-700 bg-transparent focus:outline-hidden"
            >
              <option value="">Tất cả khối lớp (1 - 5)</option>
              {[1, 2, 3, 4, 5].map((g) => (
                <option key={g} value={g}>
                  Khối {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Dạng Thẻ Lớp
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="w-3.5 h-3.5" /> Dạng Bảng Chi Tiết
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-medium">
              Đang tải danh sách lớp học theo phân hiệu...
            </div>
          ) : classes.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Không tìm thấy lớp học nào phù hợp với bộ lọc phân hiệu hiện tại.
            </div>
          ) : (
            classes.map((c) => {
              const count = c._count.students;
              const maxCap = 35;
              const percent = Math.min(100, Math.round((count / maxCap) * 100));
              const campusName = c.campus?.name || "Điểm trường Trung tâm";

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-lg tracking-tight">{c.name}</span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                        Khối {c.gradeLevel}
                      </span>
                    </div>

                    {/* Campus Badge */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 truncate ${getCampusBadgeStyle(
                          campusName
                        )}`}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{campusName}</span>
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      <p className="flex items-center justify-between">
                        <span className="font-medium text-slate-500">GVCN:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[140px]">
                          {c.homeroomTeacher?.user.name || "Chưa phân công"}
                        </span>
                      </p>
                      <p className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Trực thuộc:</span>
                        <span className="text-slate-600 font-medium truncate max-w-[140px]">{c.school.name}</span>
                      </p>
                    </div>

                    {/* Progress Capacity Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> Sĩ số:
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {count} <span className="text-slate-400 font-normal">/ {maxCap} HS</span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent >= 100 ? "bg-rose-500" : percent >= 85 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openEdit(c)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                    >
                      Xóa lớp
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
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold">
              <tr>
                <th className="px-6 py-3.5">Lớp</th>
                <th className="px-6 py-3.5">Khối</th>
                <th className="px-6 py-3.5">Phân hiệu / Điểm trường</th>
                <th className="px-6 py-3.5">GV Chủ nhiệm</th>
                <th className="px-6 py-3.5 text-center">Sĩ số</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Đang tải danh sách lớp học...
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Chưa có lớp nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                classes.map((c) => {
                  const campusName = c.campus?.name || "Điểm trường Trung tâm";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-black text-slate-900 text-sm">{c.name}</td>
                      <td className="px-6 py-3.5">
                        <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md font-bold">
                          Khối {c.gradeLevel}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs ${getCampusBadgeStyle(
                            campusName
                          )}`}
                        >
                          <MapPin className="w-3 h-3 shrink-0" /> {campusName}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-700 font-semibold">
                        {c.homeroomTeacher?.user.name || "— Chưa phân công"}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black text-xs">
                          {c._count.students} HS
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-3">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(c.id)}
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
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa thông tin Lớp" : "Thêm Lớp học Mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp học *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs font-bold"
                placeholder="VD: 1A1, 2A_SH1..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp (Tiểu học) *</label>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-bold"
              >
                {[1, 2, 3, 4, 5].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campus Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phân hiệu / Điểm trường trực thuộc *
            </label>
            <select
              value={form.campusId}
              onChange={(e) => setForm({ ...form, campusId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-bold"
            >
              <option value="">-- Điểm trường Trung tâm (Phố Lu) --</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Giáo viên chủ nhiệm</label>
            <select
              value={form.homeroomTeacherId}
              onChange={(e) => setForm({ ...form, homeroomTeacherId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
            >
              <option value="">-- Chưa phân công GVCN --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold shadow-xs"
            >
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Lưu Lớp Học"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa lớp" size="sm">
        <p className="text-slate-600 text-xs mb-6">
          Bạn có chắc muốn xóa lớp này? Tất cả dữ liệu học sinh và sổ sách học vụ liên quan sẽ bị xóa.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 text-xs font-bold shadow-xs"
          >
            Xác nhận xóa
          </button>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách lớp học hàng loạt cho các phân hiệu"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 space-y-1.5">
            <p className="font-black flex items-center gap-1.5 text-indigo-950">
              💡 Hướng dẫn nhập dữ liệu theo Phân hiệu:
            </p>
            <p>1. Copy từ Excel / Google Sheets hoặc tải file CSV mẫu.</p>
            <p>
              2. Thứ tự cột: <b>Tên lớp | Khối (1-5) | Trường | Phân hiệu | GV Chủ nhiệm</b>
            </p>
            <p>3. Hệ thống sẽ tự động ghép lớp vào đúng Phân hiệu tương ứng.</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 font-bold shadow-2xs"
            >
              📄 Tải mẫu CSV Tiểu học Phố Lu
            </button>
            <label className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-indigo-100 font-bold">
              📁 Chọn file CSV từ máy tính
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dán nội dung từ Excel / CSV vào đây:
            </label>
            <textarea
              rows={4}
              value={bulkInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder={`1A1\t1\tTrường Tiểu học Phố Lu\tĐiểm trường Trung tâm (Phố Lu)\tCô Nguyễn Thu Hằng\n1A_SH1\t1\tTrường Tiểu học Phố Lu\tPhân hiệu Sơn Hà 1\tCô Lương Thị Mai`}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
            />
          </div>

          {parsedClasses.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-700">
                  Xem trước dữ liệu sẽ nhập ({parsedClasses.length} lớp):
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Tên lớp</th>
                      <th className="p-2">Khối</th>
                      <th className="p-2">Phân hiệu</th>
                      <th className="p-2">GV Chủ nhiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {parsedClasses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white">
                        <td className="p-2 text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{c.name}</td>
                        <td className="p-2 text-slate-600">{c.gradeLevel ? `Khối ${c.gradeLevel}` : "(Tự động)"}</td>
                        <td className="p-2 text-slate-600">{c.campusName || "(Trung tâm)"}</td>
                        <td className="p-2 text-slate-600">{c.homeroomTeacherName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bulkResult && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                bulkResult.count > 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <p className="font-bold">Kết quả: Đã nhập thành công {bulkResult.count} lớp học.</p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-rose-700 max-h-28 overflow-y-auto space-y-1">
                  <p className="font-bold">Cảnh báo / Lỗi:</p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting || parsedClasses.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-bold disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {bulkSubmitting ? "Đang tiến hành nhập..." : `Lưu tất cả ${parsedClasses.length} lớp học`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
