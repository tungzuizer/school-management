"use client";

import { useEffect, useState, useCallback } from "react";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface TeacherData {
  id: string;
  userId: string;
  specialty: string | null;
  phone: string | null;
  degree: string | null;
  user: { id: string; name: string; email: string };
  homeroomClasses: { id: string; name: string; gradeLevel: number }[];
  teachingAssignments: { id: string; subject: { name: string }; classRoom: { name: string } }[];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "", phone: "", degree: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getTeachers(search || undefined);
    setTeachers(data as TeacherData[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", email: "", password: "", specialty: "", phone: "", degree: "" });
    setModalOpen(true);
  };

  const openEdit = (t: TeacherData) => {
    setEditing(t);
    setForm({
      name: t.user.name,
      email: t.user.email,
      password: "",
      specialty: t.specialty || "",
      phone: t.phone || "",
      degree: t.degree || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { showToast("Vui lòng điền tên và email", "error"); return; }
    if (!editing && !form.password) { showToast("Vui lòng nhập mật khẩu", "error"); return; }
    setSubmitting(true);

    let result;
    if (editing) {
      result = await updateTeacher(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        specialty: form.specialty || undefined,
        phone: form.phone || undefined,
        degree: form.degree || undefined,
      });
    } else {
      result = await createTeacher({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        specialty: form.specialty || undefined,
        phone: form.phone || undefined,
        degree: form.degree || undefined,
      });
    }
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm giáo viên thành công");
      setModalOpen(false);
      loadData();
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeacher(id);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa giáo viên thành công"); loadData(); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Giáo viên</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm giáo viên
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Tìm theo tên giáo viên..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-80" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chuyên môn</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bằng cấp</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Chủ nhiệm</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phân công</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Chưa có giáo viên nào</td></tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{t.user.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{t.user.email}</td>
                  <td className="px-6 py-4 text-gray-600">{t.specialty || "—"}</td>
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
                    <button onClick={() => setDeleteConfirm(t.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên môn</label>
              <input type="text" value={form.specialty} onChange={(e) => setForm({...form, specialty: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Toán, Văn..." />
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
    </div>
  );
}
