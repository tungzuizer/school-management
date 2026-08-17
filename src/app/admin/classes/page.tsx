"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import { getClasses, getSchoolsForSelect, getTeachersForSelect, createClass, updateClass, deleteClass, createBulkClasses, BulkClassInput } from "./actions";
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

  // Bulk import state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSchoolId, setBulkSchoolId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedClasses, setParsedClasses] = useState<BulkClassInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

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
      "\uFEFF" +
      "Tên lớp,Khối,Trường,Cơ sở,GV Chủ nhiệm\n" +
      "10A1,10,Trường THPT Chuyên,Cơ sở 1,Nguyễn Văn A\n" +
      "11B2,11,Trường THPT Chuyên,,Trần Thị B";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_nhap_lop_hoc.csv";
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
      loadData();
    } else {
      showToast(res.error || "Nhập hàng loạt thất bại", "error");
      if (res.errors && res.errors.length > 0) {
        setBulkResult({ count: res.count || 0, errors: res.errors });
      }
    }
  };

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

  const handleDriveImportClasses = async (validData: any[]) => {
    const res = await createBulkClasses(validData);
    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} lớp học từ Google Drive!`, "success");
      loadData();
    } else {
      showToast(res.error || "Nhập từ Google Drive thất bại", "error");
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
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
              setParsedClasses([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>📥</span> Nhập CSV/Text
          </button>
          <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
            <span>+</span> Thêm lớp
          </button>
        </div>
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

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách lớp học hàng loạt"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold mb-1">💡 Hướng dẫn nhập dữ liệu:</p>
            <p>1. Copy hàng loạt từ Excel / Google Sheets hoặc tải file CSV mẫu.</p>
            <p>2. Thứ tự cột: <b>Tên lớp | Khối | Trường | Cơ sở | GV Chủ nhiệm</b></p>
            <p>3. Nếu bỏ trống Khối, hệ thống tự tách từ tên lớp (vd: 10A1 ➔ Khối 10).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trường học mặc định (dùng nếu không ghi rõ trong CSV/Excel):
            </label>
            <select
              value={bulkSchoolId}
              onChange={(e) => setBulkSchoolId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">-- Chọn trường mặc định --</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
              placeholder={`10A1\t10\tTrường THPT Chuyên\tCơ sở 1\tNguyễn Văn A\n11B2\t11\t\t\tTrần Thị B`}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
            />
          </div>

          {parsedClasses.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Xem trước dữ liệu sẽ nhập ({parsedClasses.length} lớp):
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0 border-b text-gray-700">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Tên lớp</th>
                      <th className="p-2">Khối</th>
                      <th className="p-2">Trường</th>
                      <th className="p-2">Cơ sở</th>
                      <th className="p-2">GV Chủ nhiệm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedClasses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white">
                        <td className="p-2 text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-medium text-gray-900">{c.name}</td>
                        <td className="p-2 text-gray-600">{c.gradeLevel ? `Khối ${c.gradeLevel}` : "(Tự động)"}</td>
                        <td className="p-2 text-gray-600">{c.schoolName || "(Mặc định)"}</td>
                        <td className="p-2 text-gray-600">{c.campusName || "—"}</td>
                        <td className="p-2 text-gray-600">{c.homeroomTeacherName || "—"}</td>
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
              <p className="font-semibold">Kết quả: Đã thêm thành công {bulkResult.count} lớp học.</p>
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
              disabled={bulkSubmitting || parsedClasses.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {bulkSubmitting ? "Đang tiến hành nhập..." : `Lưu tất cả ${parsedClasses.length} lớp học`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        targetType="CLASSES"
        onConfirmImport={handleDriveImportClasses}
        title="Nhập danh sách Lớp học từ Google Drive"
      />
    </div>
  );
}
