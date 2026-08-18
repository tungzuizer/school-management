"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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
  const [loading, setLoading] = useState(false);
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
  const [form, setForm] = useState({ name: "", gradeLevel: "", headTeacherId: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getSubjects(debouncedSearch || undefined);
    setSubjects(data as SubjectData[]);
    setLoading(false);
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
    const result = await deleteSubject(id);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa thành công"); loadData(true); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Môn học</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm môn học
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Tìm theo tên môn..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-80" />
      </div>

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
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : subjects.length === 0 ? (
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
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa môn học này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </Modal>
    </div>
  );
}
