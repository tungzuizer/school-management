"use client";

import { useEffect, useState, useCallback } from "react";
import { getClasses, getSchoolsForSelect, getTeachersForSelect, createClass, updateClass, deleteClass } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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

interface SelectOption { id: string; name: string }
interface TeacherOption { id: string; user: { name: string } }

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [schools, setSchools] = useState<SelectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", gradeLevel: "6", schoolId: "", campusId: "", homeroomTeacherId: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [classData, schoolData, teacherData] = await Promise.all([
      getClasses(search || undefined, filterSchool || undefined, filterGrade ? parseInt(filterGrade) : undefined),
      getSchoolsForSelect(),
      getTeachersForSelect(),
    ]);
    setClasses(classData as ClassData[]);
    setSchools(schoolData);
    setTeachers(teacherData);
    setLoading(false);
  }, [search, filterSchool, filterGrade]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", gradeLevel: "6", schoolId: schools[0]?.id || "", campusId: "", homeroomTeacherId: "" });
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
    if (!form.name.trim() || !form.schoolId) { showToast("Vui lòng điền đủ thông tin", "error"); return; }
    setSubmitting(true);
    const data = {
      name: form.name.trim(),
      gradeLevel: parseInt(form.gradeLevel),
      schoolId: form.schoolId,
      campusId: form.campusId || undefined,
      homeroomTeacherId: form.homeroomTeacherId || undefined,
    };
    const result = editing ? await updateClass(editing.id, data) : await createClass(data);
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm lớp thành công");
      setModalOpen(false);
      loadData();
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteClass(id);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa lớp thành công"); loadData(); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm lớp
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Tìm tên lớp..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-64" />
        <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả trường</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả khối</option>
          {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Khối {g}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lớp</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Khối</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trường</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">GVCN</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sĩ số</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có lớp nào</td></tr>
            ) : (
              classes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4"><span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">Khối {c.gradeLevel}</span></td>
                  <td className="px-6 py-4 text-gray-600">{c.school.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.homeroomTeacher?.user.name || "—"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{c._count.students}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                    <button onClick={() => setDeleteConfirm(c.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa lớp" : "Thêm lớp mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khối *</label>
              <select value={form.gradeLevel} onChange={(e) => setForm({...form, gradeLevel: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={g}>Khối {g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trường *</label>
            <select value={form.schoolId} onChange={(e) => setForm({...form, schoolId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required>
              <option value="">-- Chọn trường --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giáo viên chủ nhiệm</label>
            <select value={form.homeroomTeacherId} onChange={(e) => setForm({...form, homeroomTeacherId: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">-- Không chọn --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
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

      {/* Delete Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa lớp này? Tất cả dữ liệu liên quan sẽ bị xóa.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </Modal>
    </div>
  );
}
