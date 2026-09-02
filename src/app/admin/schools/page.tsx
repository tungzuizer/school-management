"use client";

import { useEffect, useState, useCallback } from "react";
import { getSchools, createSchool, updateSchool, deleteSchool, getWardsAndDepartmentsForSelect } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface SelectItem { id: string; name: string }

interface SchoolData {
  id: string;
  name: string;
  schoolType?: "TIEU_HOC" | "THCS" | "THPT" | "LIEN_CAP";
  branchType?: string;
  districtWardId?: string | null;
  departmentId?: string | null;
  districtWard?: SelectItem | null;
  department?: SelectItem | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  _count: { classRooms: number; campuses: number; users: number };
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [wards, setWards] = useState<SelectItem[]>([]);
  const [departments, setDepartments] = useState<SelectItem[]>([]);
  const [form, setForm] = useState({
    name: "",
    schoolType: "THCS" as "TIEU_HOC" | "THCS" | "THPT" | "LIEN_CAP",
    districtWardId: "",
    departmentId: "",
    address: "",
    phone: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadSchools = useCallback(async () => {
    setLoading(true);
    const data = await getSchools(search || undefined, filterType);
    setSchools(data as SchoolData[]);
    setLoading(false);
  }, [search, filterType]);

  const loadSelectData = useCallback(async () => {
    const res = await getWardsAndDepartmentsForSelect();
    setWards(res.wards);
    setDepartments(res.departments);
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    loadSelectData();
  }, [loadSelectData]);

  const openCreate = () => {
    setEditingSchool(null);
    setForm({
      name: "",
      schoolType: "THCS",
      districtWardId: wards[0]?.id || "",
      departmentId: departments[0]?.id || "",
      address: "",
      phone: "",
      email: "",
    });
    setModalOpen(true);
  };

  const openEdit = (school: SchoolData) => {
    setEditingSchool(school);
    setForm({
      name: school.name,
      schoolType: school.schoolType || "THCS",
      districtWardId: school.districtWardId || "",
      departmentId: school.departmentId || "",
      address: school.address || "",
      phone: school.phone || "",
      email: school.email || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Tên trường không được trống", "error");
      return;
    }
    setSubmitting(true);
    const data = {
      name: form.name.trim(),
      schoolType: form.schoolType,
      districtWardId: form.districtWardId || undefined,
      departmentId: form.departmentId || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
    };
    const result = editingSchool
      ? await updateSchool(editingSchool.id, data)
      : await createSchool(data);
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

  const renderSchoolTypeBadge = (type?: string) => {
    switch (type) {
      case "TIEU_HOC":
        return (
          <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-teal-200">
            🏫 Tiểu học (Cấp 1)
          </span>
        );
      case "THCS":
        return (
          <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-200">
            🏛️ THCS (Cấp 2)
          </span>
        );
      case "THPT":
        return (
          <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-200">
            🎓 THPT (Cấp 3)
          </span>
        );
      case "LIEN_CAP":
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">
            🌟 Liên cấp
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            Trường học
          </span>
        );
    }
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Trường học</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quản lý các cấp trường (Tiểu học, THCS, THPT, Liên cấp) trên toàn hệ thống
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold text-sm flex items-center gap-2 shadow-xs transition"
        >
          <span>+</span> Thêm trường mới
        </button>
      </div>

      {/* Search & School Type Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên trường..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white shadow-2xs"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả Cấp" },
            { id: "TIEU_HOC", label: "🏫 Tiểu học" },
            { id: "THCS", label: "🏛️ THCS" },
            { id: "THPT", label: "🎓 THPT" },
            { id: "LIEN_CAP", label: "🌟 Liên cấp" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                filterType === t.id
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-6 py-3.5">Tên trường</th>
              <th className="px-6 py-3.5">Loại trường / Cấp</th>
              <th className="px-6 py-3.5">Đơn vị quản lý</th>
              <th className="px-6 py-3.5">Địa chỉ</th>
              <th className="px-6 py-3.5 text-center">Cơ sở</th>
              <th className="px-6 py-3.5 text-center">Lớp học</th>
              <th className="px-6 py-3.5 text-center">Nhân sự</th>
              <th className="px-6 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Đang tải danh sách trường...
                </td>
              </tr>
            ) : schools.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Không tìm thấy trường học phù hợp
                </td>
              </tr>
            ) : (
              schools.map((school) => (
                <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                    {school.name}
                  </td>
                  <td className="px-6 py-4">{renderSchoolTypeBadge(school.schoolType)}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {school.districtWard?.name ? (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                        📍 {school.districtWard.name}
                      </span>
                    ) : school.department?.name ? (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-semibold">
                        🏛️ {school.department.name}
                      </span>
                    ) : (
                      "Trực thuộc"
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{school.address || "—"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                      {school._count.campuses}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                      {school._count.classRooms}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                      {school._count.users}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openEdit(school)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(school.id)}
                      className="text-rose-600 hover:text-rose-800 font-semibold"
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSchool ? "Chỉnh sửa Trường học" : "Thêm Trường học Mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên trường *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Trường THPT Chuyên Trần Phú hoặc THPT Lương Khánh Thiện..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phân loại Cấp học *
              </label>
              <select
                value={form.schoolType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schoolType: e.target.value as "TIEU_HOC" | "THCS" | "THPT" | "LIEN_CAP",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              >
                <option value="TIEU_HOC">🏫 Trường Tiểu học (Cấp 1)</option>
                <option value="THCS">🏛️ Trường THCS (Cấp 2)</option>
                <option value="THPT">🎓 Trường THPT (Cấp 3)</option>
                <option value="LIEN_CAP">🌟 Trường Liên cấp (1-2-3)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng GD&ĐT Quản lý
              </label>
              <select
                value={form.districtWardId}
                onChange={(e) => setForm({ ...form, districtWardId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="">-- Không chọn / Trực thuộc Sở --</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ trường
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="VD: Số 10 Lê Hồng Phong, Phường Đằng Hải, Quận Hải An, TP. Hải Phòng"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email liên hệ
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting
                ? "Đang lưu..."
                : editingSchool
                ? "Cập nhật"
                : "Thêm trường mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa trường học"
        size="sm"
      >
        <p className="text-gray-600 text-sm mb-6">
          Bạn có chắc muốn xóa trường này? Tất cả dữ liệu liên quan (lớp học, học sinh, giáo
          viên...) sẽ bị xóa khỏi cơ sở dữ liệu.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </Modal>
    </div>
  );
}
