"use client";

import { useEffect, useState, useCallback } from "react";
import { getSchools, createSchool, updateSchool, deleteSchool } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface SchoolData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  _count: { classRooms: number; campuses: number };
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadSchools = useCallback(async () => {
    setLoading(true);
    const data = await getSchools(search || undefined);
    setSchools(data as SchoolData[]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const openCreate = () => {
    setEditingSchool(null);
    setForm({ name: "", address: "", phone: "", email: "" });
    setModalOpen(true);
  };

  const openEdit = (school: SchoolData) => {
    setEditingSchool(school);
    setForm({ name: school.name, address: school.address || "", phone: school.phone || "", email: school.email || "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast("Tên trường không được trống", "error"); return; }
    setSubmitting(true);
    const data = { name: form.name.trim(), address: form.address || undefined, phone: form.phone || undefined, email: form.email || undefined };
    const result = editingSchool ? await updateSchool(editingSchool.id, data) : await createSchool(data);
    setSubmitting(false);
    if (result.success) {
      showToast(editingSchool ? "Cập nhật thành công" : "Thêm trường thành công");
      setModalOpen(false);
      loadSchools();
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSchool(id);
    setDeleteConfirm(null);
    if (result.success) {
      showToast("Xóa trường thành công");
      loadSchools();
    } else {
      showToast(result.error || "Không thể xóa", "error");
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Trường học</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm trường
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm trường..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên trường</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phân hiệu</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Lớp học</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Chưa có trường nào</td></tr>
            ) : (
              schools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{school.name}</td>
                  <td className="px-6 py-4 text-gray-600">{school.address || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{school.phone || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{school.email || "—"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{school._count.campuses}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">{school._count.classRooms}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEdit(school)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                    <button onClick={() => setDeleteConfirm(school.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingSchool ? "Sửa trường" : "Thêm trường mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên trường *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? "Đang lưu..." : editingSchool ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa trường này? Tất cả dữ liệu liên quan (lớp, học sinh...) sẽ bị xóa theo.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </Modal>
    </div>
  );
}
