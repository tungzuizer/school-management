/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/wards/page.tsx` Admin Regional Administrative Management.
 * 2. Affected APIs: `WardsClient` client component rendering wards, statistics, and CRUD modals.
 * 3. Schemas: `WardDetailItem`, `DepartmentOption`, `createDistrictWard`, `updateDistrictWard`, `deleteDistrictWard`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Giao diện quản lý Tỉnh & Khu vực (63 Tỉnh/Thành phố & Quận/Huyện) cho SuperAdmin.
 */

"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  School,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Layers,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { WardDetailItem, DepartmentOption, createDistrictWard, updateDistrictWard, deleteDistrictWard } from "./actions";
import Link from "next/link";

interface WardsClientProps {
  initialWards: WardDetailItem[];
  departments: DepartmentOption[];
  stats: {
    totalDepartments: number;
    totalWards: number;
    totalSchools: number;
    totalManagers: number;
  } | null;
}

export default function WardsClient({ initialWards, departments, stats }: WardsClientProps) {
  const [wards, setWards] = useState<WardDetailItem[]>(initialWards);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWard, setEditingWard] = useState<WardDetailItem | null>(null);
  const [formData, setFormData] = useState({
    departmentId: "",
    name: "",
    code: "",
    address: "",
    phone: "",
  });

  // Delete State
  const [deletingWard, setDeletingWard] = useState<WardDetailItem | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredWards = wards.filter((w) => {
    const matchDept = selectedDept === "ALL" || w.departmentId === selectedDept;
    const matchSearch =
      !searchTerm.trim() ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.code && w.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      w.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.address && w.address.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDept && matchSearch;
  });

  const handleOpenCreate = () => {
    setEditingWard(null);
    setFormData({
      departmentId: departments[0]?.id || "",
      name: "",
      code: "",
      address: "",
      phone: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ward: WardDetailItem) => {
    setEditingWard(ward);
    setFormData({
      departmentId: ward.departmentId,
      name: ward.name,
      code: ward.code || "",
      address: ward.address || "",
      phone: ward.phone || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification("error", "Vui lòng nhập tên Phòng GD&ĐT / Quận Huyện");
      return;
    }
    if (!formData.departmentId) {
      showNotification("error", "Vui lòng chọn Sở GD&ĐT trực thuộc");
      return;
    }

    startTransition(async () => {
      if (editingWard) {
        const res = await updateDistrictWard(editingWard.id, formData);
        if (res.success) {
          const deptName = departments.find((d) => d.id === formData.departmentId)?.name || "Chưa gắn Sở";
          setWards((prev) =>
            prev.map((w) =>
              w.id === editingWard.id
                ? {
                    ...w,
                    name: formData.name.trim(),
                    code: formData.code.trim() || null,
                    address: formData.address.trim() || null,
                    phone: formData.phone.trim() || null,
                    departmentId: formData.departmentId,
                    departmentName: deptName,
                  }
                : w
            )
          );
          setIsModalOpen(false);
          showNotification("success", `Đã cập nhật đơn vị: ${formData.name}`);
        } else {
          showNotification("error", res.error || "Lỗi cập nhật đơn vị");
        }
      } else {
        const res = await createDistrictWard(formData);
        if (res.success && res.data) {
          const deptName = departments.find((d) => d.id === formData.departmentId)?.name || "Chưa gắn Sở";
          const newItem: WardDetailItem = {
            id: res.data.id,
            name: res.data.name,
            code: res.data.code,
            address: res.data.address,
            phone: res.data.phone,
            departmentId: res.data.departmentId,
            departmentName: deptName,
            schoolsCount: 0,
            usersCount: 0,
            createdAt: new Date().toISOString(),
          };
          setWards((prev) => [newItem, ...prev]);
          setIsModalOpen(false);
          showNotification("success", `Đã tạo mới đơn vị: ${formData.name}`);
        } else {
          showNotification("error", res.error || "Lỗi tạo mới đơn vị");
        }
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingWard) return;
    startTransition(async () => {
      const res = await deleteDistrictWard(deletingWard.id);
      if (res.success) {
        setWards((prev) => prev.filter((w) => w.id !== deletingWard.id));
        showNotification("success", `Đã xóa đơn vị: ${deletingWard.name}`);
        setDeletingWard(null);
      } else {
        showNotification("error", res.error || "Lỗi xóa đơn vị");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-bold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Sở Giáo Dục & Đào Tạo</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalDepartments}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tỉnh / Thành phố trực thuộc</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Phòng GD&ĐT / Quận Huyện</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{wards.length}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Khu vực điều phối giáo dục</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trường Học Trực Thuộc</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalSchools}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mạng lưới cơ sở GD</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <School className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cán Bộ Sở & Phòng</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalManagers}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Lãnh đạo & chuyên viên</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm Quận/Huyện, Mã, Tỉnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Sở GD:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Tất cả Tỉnh / Sở GD&ĐT ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.wardsCount} phòng, {d.schoolsCount} trường)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phòng GD&ĐT Mới</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-900">Danh Sách Phòng GD&ĐT & Khu Vực Quản Lý</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredWards.length} đơn vị
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Đơn Vị & Mã Số</th>
                <th className="py-3.5 px-5">Sở GD&ĐT Trực Thuộc</th>
                <th className="py-3.5 px-5">Địa Chỉ & Liên Hệ</th>
                <th className="py-3.5 px-5 text-center">Trường Học</th>
                <th className="py-3.5 px-5 text-center">Cán Bộ</th>
                <th className="py-3.5 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredWards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Không tìm thấy đơn vị khu vực nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-0.5">Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc Sở GD&ĐT</p>
                  </td>
                </tr>
              ) : (
                filteredWards.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{w.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {w.code ? (
                              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {w.code}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Chưa có mã</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-800">{w.departmentName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-slate-700 line-clamp-1">{w.address || "Chưa cập nhật địa chỉ"}</p>
                      {w.phone && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{w.phone}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <Link
                        href={`/admin/schools?districtWardId=${w.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl border border-blue-200 transition"
                      >
                        <School className="w-3.5 h-3.5" />
                        <span>{w.schoolsCount} trường</span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </Link>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200">
                        <Users className="w-3.5 h-3.5" />
                        <span>{w.usersCount} cán bộ</span>
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition cursor-pointer"
                          title="Chỉnh sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingWard(w)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-700 hover:text-rose-700 transition cursor-pointer"
                          title="Xóa khu vực"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingWard ? "Chỉnh Sửa Phòng GD&ĐT / Quận Huyện" : "Khởi Tạo Phòng GD&ĐT Mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Quản lý mạng lưới khu vực thuộc hệ thống Giáo dục</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Sở Giáo Dục & Đào Tạo Trực Thuộc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">-- Chọn Sở Giáo Dục & Đào Tạo --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tên Phòng GD&ĐT / Quận Huyện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng GD&ĐT Quận Cầu Giấy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Mã Khu Vực / Định Danh</label>
                  <input
                    type="text"
                    placeholder="VD: PGD-CAUGIAY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Số Điện Thoại Trụ Sở</label>
                  <input
                    type="text"
                    placeholder="VD: 024.3833.xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Địa Chỉ Trụ Sở</label>
                <input
                  type="text"
                  placeholder="VD: Số 123 Đường Trần Thái Tông, Cầu Giấy, Hà Nội"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : editingWard ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingWard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác Nhận Xóa Khu Vực</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa đơn vị <strong className="text-slate-900 font-bold">{deletingWard.name}</strong> thuộc{" "}
              <strong className="text-slate-900 font-bold">{deletingWard.departmentName}</strong>?
            </p>

            {deletingWard.schoolsCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Đơn vị này đang có <strong>{deletingWard.schoolsCount} trường học</strong> trực thuộc. Bạn cần chuyển hoặc xóa
                  các trường học trước khi xóa khu vực.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingWard(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending || deletingWard.schoolsCount > 0}
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
