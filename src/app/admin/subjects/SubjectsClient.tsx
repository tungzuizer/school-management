"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

interface TeacherData {
  id: string;
  user: { name: string };
}

interface SubjectData {
  id: string;
  name: string;
  gradeLevel: number | null;
  headTeacherId?: string | null;
  headTeacher?: TeacherData | null;
  _count: { teachingAssignments: number; grades: number };
}

interface SubjectsClientProps {
  initialSubjects: SubjectData[];
  initialTeachers: TeacherData[];
}

export default function SubjectsClient({ initialSubjects, initialTeachers }: SubjectsClientProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>(initialSubjects);
  const [teachers] = useState<TeacherData[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", gradeLevel: "", headTeacherId: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const data = await getSubjects(debouncedSearch || undefined);
      setSubjects(data as SubjectData[]);
    } catch (e) {
      console.error("Failed to load subjects:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    loadData();
  }, [loadData, isInitialMount]);

  const openCreate = () => { setEditing(null); setForm({ name: "", gradeLevel: "", headTeacherId: "" }); setModalOpen(true); };
  const openEdit = (s: SubjectData) => {
    setEditing(s);
    setForm({
      name: s.name,
      gradeLevel: s.gradeLevel?.toString() || "",
      headTeacherId: s.headTeacherId || ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Vui lòng nhập tên môn học", "error"); return; }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      gradeLevel: form.gradeLevel ? parseInt(form.gradeLevel) : undefined,
      headTeacherId: form.headTeacherId || null,
    };
    const result = editing ? await updateSubject(editing.id, payload) : await createSubject(payload);
    setSubmitting(false);
    if (result.success) { showToast(editing ? "Cập nhật thành công" : "Thêm môn học thành công"); setModalOpen(false); loadData(true); }
    else showToast(result.error || "Có lỗi xảy ra", "error");
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteSubject(id);
    setDeletingId(null);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa thành công"); loadData(true); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Quản lý Môn học
          {(loading || isRefreshing) && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
        </h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm môn học
        </button>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên môn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs"
          />
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
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải môn học...</div>
          ) : subjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Chưa có môn học nào</div>
          ) : (
            subjects.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {s.gradeLevel ? `Khối ${s.gradeLevel}` : "Tất cả khối"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Trưởng bộ môn:</span>{" "}
                    {s.headTeacher?.user?.name ? `👑 ${s.headTeacher.user.name}` : "Chưa phân công"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="text-slate-400 block font-semibold">Phân công</span>
                      <span className="font-extrabold text-slate-800">{s._count.teachingAssignments}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="text-slate-400 block font-semibold">Số điểm</span>
                      <span className="font-extrabold text-indigo-600">{s._count.grades}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button onClick={() => openEdit(s)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Chỉnh sửa
                  </button>
                  <button onClick={() => setDeleteConfirm(s.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên môn học</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Khối lớp</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trưởng bộ môn</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Số phân công</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Số điểm đã nhập</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subjects.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có môn học nào</td></tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.gradeLevel ? `Khối ${s.gradeLevel}` : "Tất cả"}</td>
                    <td className="px-6 py-4 text-indigo-700 font-medium">
                      {s.headTeacher?.user?.name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          👑 {s.headTeacher.user.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s._count.teachingAssignments}</td>
                    <td className="px-6 py-4 text-gray-600">{s._count.grades}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                      <button onClick={() => setDeleteConfirm(s.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa môn học" : "Thêm môn học mới"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp áp dụng</label>
            <select value={form.gradeLevel} onChange={(e) => setForm({...form, gradeLevel: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Tất cả khối</option>
              {[6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng bộ môn</label>
            <select value={form.headTeacherId} onChange={(e) => setForm({...form, headTeacherId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Chưa chỉ định --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.user.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => !deletingId && setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa môn học này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} disabled={!!deletingId} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={!!deletingId} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
            {deletingId && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{deletingId ? "Đang xóa..." : "Xóa"}</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
