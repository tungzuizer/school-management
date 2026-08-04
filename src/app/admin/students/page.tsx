"use client";

import { useEffect, useState, useCallback } from "react";
import { getStudents, getClassesForSelect, createStudent, updateStudent, deleteStudent } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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
  classRoom: { id: string; name: string; gradeLevel: number } | null;
  group: { id: string; name: string } | null;
}

interface ClassOption {
  id: string;
  name: string;
  gradeLevel: number;
}

const defaultForm = {
  name: "", email: "", password: "", studentCode: "", classId: "",
  dob: "", gender: "", phone: "", ethnicity: "", addressCurrent: "",
  fatherName: "", fatherJob: "", motherName: "", motherJob: "", status: "STUDYING",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [studentsData, classesData] = await Promise.all([
      getStudents(search || undefined, filterClass || undefined),
      getClassesForSelect(),
    ]);
    setStudents(studentsData as unknown as StudentData[]);
    setClasses(classesData);
    setLoading(false);
  }, [search, filterClass]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (s: StudentData) => {
    setEditing(s);
    setForm({
      name: s.user.name,
      email: s.user.email,
      password: "",
      studentCode: s.studentCode || "",
      classId: s.classRoom?.id || "",
      dob: s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
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
    if (!form.name.trim() || !form.email.trim()) { showToast("Vui lòng điền tên và email", "error"); return; }
    if (!editing && !form.password) { showToast("Vui lòng nhập mật khẩu", "error"); return; }
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
      loadData();
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStudent(id);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa học sinh thành công"); loadData(); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  const statusLabel: Record<string, string> = { STUDYING: "Đang học", TRANSFERRED: "Chuyển trường", DROPPED_OUT: "Nghỉ học" };
  const statusColor: Record<string, string> = { STUDYING: "bg-green-100 text-green-800", TRANSFERRED: "bg-yellow-100 text-yellow-800", DROPPED_OUT: "bg-red-100 text-red-800" };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Học sinh</h1>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <span>+</span> Thêm học sinh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input type="text" placeholder="Tìm theo tên..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-64" />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả lớp</option>
          {classes.map(c => <option key={c.id} value={c.id}>Lớp {c.name} (Khối {c.gradeLevel})</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mã HS</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lớp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày sinh</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Giới tính</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SĐT</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chưa có học sinh nào</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{s.studentCode || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.user.name}</td>
                    <td className="px-4 py-3 text-sm">{s.classRoom ? <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{s.classRoom.name}</span> : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${statusColor[s.status] || ""}`}>{statusLabel[s.status] || s.status}</span></td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                      <button onClick={() => setDeleteConfirm(s.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa thông tin học sinh" : "Thêm học sinh mới"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Thông tin tài khoản */}
          <h3 className="font-semibold text-gray-800 border-b pb-1">Thông tin tài khoản</h3>
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

          {/* Thông tin học sinh */}
          <h3 className="font-semibold text-gray-800 border-b pb-1 pt-2">Thông tin học sinh</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
              <input type="text" value={form.studentCode} onChange={(e) => setForm({...form, studentCode: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
              <select value={form.classId} onChange={(e) => setForm({...form, classId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Chưa xếp lớp</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} (Khối {c.gradeLevel})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="">Chọn</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dân tộc</label>
              <input type="text" value={form.ethnicity} onChange={(e) => setForm({...form, ethnicity: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="VD: Kinh" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ hiện tại</label>
            <input type="text" value={form.addressCurrent} onChange={(e) => setForm({...form, addressCurrent: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
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
              <input type="text" value={form.fatherName} onChange={(e) => setForm({...form, fatherName: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp cha</label>
              <input type="text" value={form.fatherJob} onChange={(e) => setForm({...form, fatherJob: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên mẹ</label>
              <input type="text" value={form.motherName} onChange={(e) => setForm({...form, motherName: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp mẹ</label>
              <input type="text" value={form.motherJob} onChange={(e) => setForm({...form, motherJob: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
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
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa học sinh này? Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Xóa</button>
        </div>
      </Modal>
    </div>
  );
}
