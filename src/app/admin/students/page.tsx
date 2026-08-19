"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import {
  getStudents,
  getClassesForSelect,
  createStudent,
  updateStudent,
  deleteStudent,
  createBulkStudents,
  BulkStudentInput,
} from "./actions";
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
  name: "",
  email: "",
  password: "",
  studentCode: "",
  classId: "",
  dob: "",
  gender: "",
  phone: "",
  ethnicity: "",
  addressCurrent: "",
  fatherName: "",
  fatherJob: "",
  motherName: "",
  motherJob: "",
  status: "STUDYING",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // Bulk import state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedStudents, setParsedStudents] = useState<BulkStudentInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [studentsData, classesData] = await Promise.all([
      getStudents(search || undefined, filterClass || undefined),
      getClassesForSelect(),
    ]);
    setStudents(studentsData as unknown as StudentData[]);
    setClasses(classesData);
    setLoading(false);
  }, [search, filterClass]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

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
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Vui lòng điền tên và email", "error");
      return;
    }
    if (!editing && !form.password) {
      showToast("Vui lòng nhập mật khẩu", "error");
      return;
    }
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
      loadData(true);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStudent(id);
    setDeleteConfirm(null);
    if (result.success) {
      showToast("Xóa học sinh thành công");
      loadData(true);
    } else showToast(result.error || "Không thể xóa", "error");
  };

  const parseBulkText = (text: string, classId: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedStudents([]);
      return;
    }

    const results: BulkStudentInput[] = [];
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes("họ tên") ||
      firstLineLower.includes("mã hs") ||
      firstLineLower.includes("email")
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.includes("\t") ? line.split("\t") : line.split(",");
      const cleanCols = cols.map((c) => c.trim().replace(/^"(.*)"$/, "$1"));

      if (!cleanCols[0] && !cleanCols[1]) continue;

      let studentCode = cleanCols[0] || "";
      let name = cleanCols[1] || "";
      let email = cleanCols[2] || "";
      let rawDob = cleanCols[3] || "";
      let rawGender = cleanCols[4] || "";
      let phone = cleanCols[5] || "";
      let ethnicity = cleanCols[6] || "";
      let addressCurrent = cleanCols[7] || "";

      if (!name && studentCode && !studentCode.match(/^[A-Z0-9_-]+$/i)) {
        name = studentCode;
        studentCode = "";
      }

      let gender = "";
      if (
        rawGender.toLowerCase().startsWith("nam") ||
        rawGender.toUpperCase() === "MALE"
      ) {
        gender = "MALE";
      } else if (
        rawGender.toLowerCase().startsWith("nữ") ||
        rawGender.toLowerCase() === "nu" ||
        rawGender.toUpperCase() === "FEMALE"
      ) {
        gender = "FEMALE";
      }

      let dob = "";
      if (rawDob) {
        if (rawDob.includes("/")) {
          const parts = rawDob.split("/");
          if (parts.length === 3) {
            dob = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          }
        } else if (rawDob.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dob = rawDob;
        }
      }

      results.push({
        studentCode: studentCode || undefined,
        name,
        email: email || undefined,
        classId: classId || undefined,
        dob: dob || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        ethnicity: ethnicity || undefined,
        addressCurrent: addressCurrent || undefined,
      });
    }

    setParsedStudents(results);
  };

  const handleBulkTextChange = (text: string) => {
    setBulkInput(text);
    parseBulkText(text, bulkClassId);
  };

  const handleBulkClassChange = (classId: string) => {
    setBulkClassId(classId);
    parseBulkText(bulkInput, classId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setBulkInput(content);
        parseBulkText(content, bulkClassId);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const headers = "Mã HS,Họ tên,Email,Ngày sinh,Giới tính,SĐT,Dân tộc,Địa chỉ\n";
    const rows = [
      "HS001,Nguyễn Văn A,nguyenvana@school.edu.vn,2008-05-15,Nam,0912345678,Kinh,Hà Nội",
      "HS002,Trần Thị B,tranthib@school.edu.vn,2008-08-20,Nữ,0987654321,Kinh,Hồ Chí Minh",
    ].join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_nhap_hoc_sinh.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkSubmit = async () => {
    if (parsedStudents.length === 0) {
      showToast("Chưa có dữ liệu hợp lệ để nhập", "error");
      return;
    }
    setBulkSubmitting(true);
    const res = await createBulkStudents(parsedStudents);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} học sinh!`);
      setBulkResult({ count: res.count, errors: res.errors || [] });
      loadData(true);
    } else {
      showToast(res.error || "Nhập thất bại", "error");
      if (res.errors && res.errors.length > 0) {
        setBulkResult({ count: res.count || 0, errors: res.errors });
      }
    }
  };

  const statusLabel: Record<string, string> = {
    STUDYING: "Đang học",
    TRANSFERRED: "Chuyển trường",
    DROPPED_OUT: "Nghỉ học",
  };
  const statusColor: Record<string, string> = {
    STUDYING: "bg-green-100 text-green-800",
    TRANSFERRED: "bg-yellow-100 text-yellow-800",
    DROPPED_OUT: "bg-red-100 text-red-800",
  };

  const handleDriveImportStudents = async (validData: any[]) => {
    const res = await createBulkStudents(validData);
    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} học sinh từ Google Drive!`, "success");
      loadData(true);
    } else {
      showToast(res.error || "Nhập từ Google Drive thất bại", "error");
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Học sinh</h1>
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
              setParsedStudents([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>📥</span> Nhập CSV/Text
          </button>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>+</span> Thêm học sinh
          </button>
        </div>
      </div>

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs"
          />
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs"
          >
            <option value="">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.name} (Khối {c.gradeLevel})
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
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải danh sách học sinh...</div>
          ) : students.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Chưa có học sinh nào</div>
          ) : (
            students.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {s.user.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusColor[s.status] || "bg-slate-100 text-slate-700"}`}>
                      {statusLabel[s.status] || s.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Mã HS:</span> {s.studentCode || "—"} |{" "}
                    <span className="font-semibold text-slate-700">Lớp:</span> {s.classRoom?.name || "Chưa xếp lớp"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Ngày sinh:</span> {s.dob || "—"} |{" "}
                    <span className="font-semibold text-slate-700">Giới tính:</span> {s.gender || "—"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    <span className="font-semibold text-slate-700">SĐT:</span> {s.phone || "—"}
                  </p>
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
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Chưa có học sinh nào
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{s.studentCode || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.user.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.classRoom ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            {s.classRoom.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.dob ? new Date(s.dob).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${statusColor[s.status] || ""}`}>
                          {statusLabel[s.status] || s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa thông tin học sinh" : "Thêm học sinh mới"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Thông tin tài khoản */}
          <h3 className="font-semibold text-gray-800 border-b pb-1">Thông tin tài khoản</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          {/* Thông tin học sinh */}
          <h3 className="font-semibold text-gray-800 border-b pb-1 pt-2">Thông tin học sinh</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã học sinh</label>
              <input
                type="text"
                value={form.studentCode}
                onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chưa xếp lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Khối {c.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SĐT</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dân tộc</label>
              <input
                type="text"
                value={form.ethnicity}
                onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="VD: Kinh"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ hiện tại</label>
            <input
              type="text"
              value={form.addressCurrent}
              onChange={(e) => setForm({ ...form, addressCurrent: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
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
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp cha</label>
              <input
                type="text"
                value={form.fatherJob}
                onChange={(e) => setForm({ ...form, fatherJob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên mẹ</label>
              <input
                type="text"
                value={form.motherName}
                onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp mẹ</label>
              <input
                type="text"
                value={form.motherJob}
                onChange={(e) => setForm({ ...form, motherJob: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6">
          Bạn có chắc muốn xóa học sinh này? Tài khoản và tất cả dữ liệu liên quan sẽ bị xóa.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Hủy
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Xóa
          </button>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách học sinh hàng loạt"
        size="xl"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-lg text-sm flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold mb-1">💡 Hướng dẫn nhập dữ liệu:</p>
              <p>1. Copy hàng loạt từ Excel / Google Sheets hoặc tải file CSV mẫu.</p>
              <p>
                2. Mật khẩu mặc định của các học sinh sẽ là:{" "}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">123456</code>
              </p>
              <p>
                3. Thứ tự cột chuẩn:{" "}
                <span className="font-medium">
                  Mã HS, Họ tên, Email, Ngày sinh (YYYY-MM-DD), Giới tính (Nam/Nữ), SĐT, Dân tộc, Địa chỉ
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 shadow-sm transition"
            >
              📄 Tải CSV Mẫu
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gán mặc định vào Lớp</label>
              <select
                value={bulkClassId}
                onChange={(e) => handleBulkClassChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="">Chưa xếp lớp (Không chọn)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} (Khối {c.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hoặc Chọn File CSV</label>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dán dữ liệu từ Excel / CSV vào đây:</label>
            <textarea
              rows={5}
              value={bulkInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder={`HS001\tNguyễn Văn A\tnguyenvana@school.edu.vn\t2008-05-15\tNam\t0912345678\tKinh\tHà Nội\nHS002\tTrần Thị B\ttranthib@school.edu.vn\t2008-08-20\tNữ\t0987654321\tKinh\tHồ Chí Minh`}
              className="w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {bulkResult && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                bulkResult.count > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="font-semibold">Kết quả: Đã thêm thành công {bulkResult.count} học sinh.</p>
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

          {/* Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 text-sm">Xem trước dữ liệu ({parsedStudents.length} học sinh)</h4>
            </div>
            <div className="border rounded-lg overflow-x-auto max-h-60">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="p-2 border-r">STT</th>
                    <th className="p-2 border-r">Mã HS</th>
                    <th className="p-2 border-r">Họ tên *</th>
                    <th className="p-2 border-r">Email (Tự tạo nếu trống)</th>
                    <th className="p-2 border-r">Ngày sinh</th>
                    <th className="p-2 border-r">Giới tính</th>
                    <th className="p-2 border-r">SĐT</th>
                    <th className="p-2 border-r">Địa chỉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-400">
                        Chưa có dữ liệu. Hãy dán nội dung hoặc chọn file CSV ở trên.
                      </td>
                    </tr>
                  ) : (
                    parsedStudents.map((s, idx) => (
                      <tr key={idx} className={!s.name ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="p-2 border-r text-gray-500 text-center">{idx + 1}</td>
                        <td className="p-2 border-r font-mono text-gray-700">
                          {s.studentCode || <span className="text-gray-300">Tự sinh</span>}
                        </td>
                        <td className="p-2 border-r font-medium text-gray-900">
                          {s.name || <span className="text-red-500 font-bold">Thiếu tên!</span>}
                        </td>
                        <td className="p-2 border-r font-mono text-gray-600">
                          {s.email || <span className="text-gray-400 italic">Tự sinh email</span>}
                        </td>
                        <td className="p-2 border-r text-gray-600">{s.dob || "—"}</td>
                        <td className="p-2 border-r text-gray-600">
                          {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}
                        </td>
                        <td className="p-2 border-r text-gray-600">{s.phone || "—"}</td>
                        <td className="p-2 border-r text-gray-600 max-w-xs truncate">{s.addressCurrent || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              disabled={bulkSubmitting || parsedStudents.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {bulkSubmitting ? "Đang tiến hành nhập..." : `Lưu tất cả ${parsedStudents.length} học sinh`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        targetType="STUDENTS"
        onConfirmImport={handleDriveImportStudents}
        title="Nhập danh sách Học sinh từ Google Drive"
      />
    </div>
  );
}

