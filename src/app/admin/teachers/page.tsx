"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, createBulkTeachers, BulkTeacherInput } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Loader2 } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "", phone: "", degree: "" });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

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
            placeholder="Tìm theo tên giáo viên..."
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
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải danh sách giáo viên...</div>
          ) : teachers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Chưa có giáo viên nào</div>
          ) : (
            teachers.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {t.user.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      {t.specialty || "Giáo viên"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    <span className="font-semibold text-slate-700">Email:</span> {t.user.email}
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
                  <button onClick={() => openEdit(t)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Chỉnh sửa
                  </button>
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

