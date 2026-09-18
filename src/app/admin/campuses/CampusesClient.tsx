/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/campuses/page.tsx` Admin Campuses & School Points Directory.
 * 2. Affected APIs: `CampusesClient` Client Component for Campuses & School Points management.
 * 3. Schemas: `CampusItem`, `SchoolPointItem`, `SchoolOption`, CRUD actions from `actions.ts`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Giao diện Quản lý Cơ sở, Phân hiệu & Điểm trường trực thuộc (/admin/campuses).
 */

"use client";

import { useState, useTransition } from "react";
import {
  Building,
  MapPin,
  School,
  DoorOpen,
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
  ChevronDown,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";
import Link from "next/link";
import {
  CampusItem,
  SchoolPointItem,
  SchoolOption,
  createCampus,
  updateCampus,
  deleteCampus,
  createSchoolPoint,
  updateSchoolPoint,
  deleteSchoolPoint,
} from "./actions";

interface CampusesClientProps {
  initialCampuses: CampusItem[];
  schools: SchoolOption[];
  stats: {
    totalCampuses: number;
    totalSchools: number;
    totalSchoolPoints: number;
    totalClassRooms: number;
  } | null;
}

export default function CampusesClient({ initialCampuses, schools, stats }: CampusesClientProps) {
  const [campuses, setCampuses] = useState<CampusItem[]>(initialCampuses);
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("" );
  const [expandedCampuses, setExpandedCampuses] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    initialCampuses.forEach((c) => {
      init[c.id] = true;
    });
    return init;
  });

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Campus Modal State
  const [isCampusModalOpen, setIsCampusModalOpen] = useState<boolean>(false);
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [campusForm, setCampusForm] = useState({
    schoolId: "",
    name: "",
    address: "",
  });

  // SchoolPoint Modal State
  const [isPointModalOpen, setIsPointModalOpen] = useState<boolean>(false);
  const [targetCampusForPoint, setTargetCampusForPoint] = useState<CampusItem | null>(null);
  const [editingPoint, setEditingPoint] = useState<SchoolPointItem | null>(null);
  const [pointForm, setPointForm] = useState({
    name: "",
    address: "",
    distanceKm: 0,
    managerName: "",
    phone: "",
  });

  // Delete State
  const [deletingCampus, setDeletingCampus] = useState<CampusItem | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<{ point: SchoolPointItem; campusId: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const toggleExpand = (id: string) => {
    setExpandedCampuses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCampuses = campuses.filter((c) => {
    const matchSchool = selectedSchool === "ALL" || c.schoolId === selectedSchool;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      c.schoolName.toLowerCase().includes(q) ||
      c.schoolPoints.some(
        (sp) =>
          sp.name.toLowerCase().includes(q) ||
          (sp.address && sp.address.toLowerCase().includes(q)) ||
          (sp.managerName && sp.managerName.toLowerCase().includes(q))
      );
    return matchSchool && matchSearch;
  });

  // Campus Handlers
  const handleOpenCreateCampus = () => {
    setEditingCampus(null);
    setCampusForm({
      schoolId: schools[0]?.id || "",
      name: "",
      address: "",
    });
    setIsCampusModalOpen(true);
  };

  const handleOpenEditCampus = (campus: CampusItem) => {
    setEditingCampus(campus);
    setCampusForm({
      schoolId: campus.schoolId,
      name: campus.name,
      address: campus.address || "",
    });
    setIsCampusModalOpen(true);
  };

  const handleSubmitCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name.trim()) {
      showNotification("error", "Vui lòng nhập tên Cơ sở / Phân hiệu");
      return;
    }
    if (!campusForm.schoolId) {
      showNotification("error", "Vui lòng chọn Trường học trực thuộc");
      return;
    }

    startTransition(async () => {
      if (editingCampus) {
        const res = await updateCampus(editingCampus.id, campusForm);
        if (res.success) {
          const schName = schools.find((s) => s.id === campusForm.schoolId)?.name || "Chưa gắn trường";
          setCampuses((prev) =>
            prev.map((c) =>
              c.id === editingCampus.id
                ? {
                    ...c,
                    name: campusForm.name.trim(),
                    address: campusForm.address.trim() || null,
                    schoolId: campusForm.schoolId,
                    schoolName: schName,
                  }
                : c
            )
          );
          setIsCampusModalOpen(false);
          showNotification("success", `Đã cập nhật cơ sở: ${campusForm.name}`);
        } else {
          showNotification("error", res.error || "Lỗi cập nhật cơ sở");
        }
      } else {
        const res = await createCampus(campusForm);
        if (res.success && res.data) {
          const sch = schools.find((s) => s.id === campusForm.schoolId);
          const newCampusItem: CampusItem = {
            id: res.data.id,
            name: res.data.name,
            address: res.data.address,
            schoolId: res.data.schoolId,
            schoolName: sch?.name || "Chưa gắn trường",
            departmentName: sch?.departmentName || "Bộ/Sở GD&ĐT",
            districtWardName: sch?.districtWardName || "Toàn quốc",
            schoolPoints: [
              {
                id: "sp-temp",
                name: "Điểm trường Trung tâm",
                address: res.data.address,
                distanceKm: 0,
                managerName: null,
                phone: null,
                classRoomsCount: 0,
                createdAt: new Date().toISOString(),
              },
            ],
            classRoomsCount: 0,
            usersCount: 0,
            createdAt: new Date().toISOString(),
          };
          setCampuses((prev) => [newCampusItem, ...prev]);
          setExpandedCampuses((prev) => ({ ...prev, [newCampusItem.id]: true }));
          setIsCampusModalOpen(false);
          showNotification("success", `Đã tạo mới cơ sở: ${campusForm.name}`);
        } else {
          showNotification("error", res.error || "Lỗi tạo mới cơ sở");
        }
      }
    });
  };

  const handleDeleteCampusConfirm = () => {
    if (!deletingCampus) return;
    startTransition(async () => {
      const res = await deleteCampus(deletingCampus.id);
      if (res.success) {
        setCampuses((prev) => prev.filter((c) => c.id !== deletingCampus.id));
        showNotification("success", `Đã xóa cơ sở: ${deletingCampus.name}`);
        setDeletingCampus(null);
      } else {
        showNotification("error", res.error || "Lỗi xóa cơ sở");
      }
    });
  };

  // SchoolPoint Handlers
  const handleOpenAddPoint = (campus: CampusItem) => {
    setTargetCampusForPoint(campus);
    setEditingPoint(null);
    setPointForm({
      name: "",
      address: campus.address || "",
      distanceKm: 0,
      managerName: "",
      phone: "",
    });
    setIsPointModalOpen(true);
  };

  const handleOpenEditPoint = (campus: CampusItem, point: SchoolPointItem) => {
    setTargetCampusForPoint(campus);
    setEditingPoint(point);
    setPointForm({
      name: point.name,
      address: point.address || "",
      distanceKm: point.distanceKm || 0,
      managerName: point.managerName || "",
      phone: point.phone || "",
    });
    setIsPointModalOpen(true);
  };

  const handleSubmitPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCampusForPoint) return;
    if (!pointForm.name.trim()) {
      showNotification("error", "Vui lòng nhập tên Điểm trường");
      return;
    }

    startTransition(async () => {
      if (editingPoint) {
        const res = await updateSchoolPoint(editingPoint.id, pointForm);
        if (res.success) {
          setCampuses((prev) =>
            prev.map((c) =>
              c.id === targetCampusForPoint.id
                ? {
                    ...c,
                    schoolPoints: c.schoolPoints.map((sp) =>
                      sp.id === editingPoint.id
                        ? {
                            ...sp,
                            name: pointForm.name.trim(),
                            address: pointForm.address.trim() || null,
                            distanceKm: Number(pointForm.distanceKm) || 0,
                            managerName: pointForm.managerName.trim() || null,
                            phone: pointForm.phone.trim() || null,
                          }
                        : sp
                    ),
                  }
                : c
            )
          );
          setIsPointModalOpen(false);
          showNotification("success", `Đã cập nhật điểm trường: ${pointForm.name}`);
        } else {
          showNotification("error", res.error || "Lỗi cập nhật điểm trường");
        }
      } else {
        const res = await createSchoolPoint({
          campusId: targetCampusForPoint.id,
          ...pointForm,
        });
        if (res.success && res.data) {
          const newPt: SchoolPointItem = {
            id: res.data.id,
            name: res.data.name,
            address: res.data.address,
            distanceKm: res.data.distanceKm,
            managerName: res.data.managerName,
            phone: res.data.phone,
            classRoomsCount: 0,
            createdAt: new Date().toISOString(),
          };
          setCampuses((prev) =>
            prev.map((c) =>
              c.id === targetCampusForPoint.id
                ? {
                    ...c,
                    schoolPoints: [...c.schoolPoints, newPt],
                  }
                : c
            )
          );
          setIsPointModalOpen(false);
          showNotification("success", `Đã thêm điểm trường: ${pointForm.name}`);
        } else {
          showNotification("error", res.error || "Lỗi thêm điểm trường");
        }
      }
    });
  };

  const handleDeletePointConfirm = () => {
    if (!deletingPoint) return;
    startTransition(async () => {
      const res = await deleteSchoolPoint(deletingPoint.point.id);
      if (res.success) {
        setCampuses((prev) =>
          prev.map((c) =>
            c.id === deletingPoint.campusId
              ? {
                  ...c,
                  schoolPoints: c.schoolPoints.filter((sp) => sp.id !== deletingPoint.point.id),
                }
              : c
          )
        );
        showNotification("success", `Đã xóa điểm trường: ${deletingPoint.point.name}`);
        setDeletingPoint(null);
      } else {
        showNotification("error", res.error || "Lỗi xóa điểm trường");
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
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Cơ Sở / Phân Hiệu</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{campuses.length}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tổng số phân hiệu trường học</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Điểm Trường Vệ Tinh</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalSchoolPoints}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mô hình Thông tư 15</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Trường Học Quản Lý</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalSchools}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Đơn vị chủ quản</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <School className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Phòng Học / Lớp Học</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalClassRooms}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Không gian giảng dạy</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <DoorOpen className="w-6 h-6" />
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
              placeholder="Tìm kiếm Cơ sở, Điểm trường, Địa chỉ..."
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

          {/* School Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Trường:</span>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Tất cả Trường học ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.campusesCount} cơ sở)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenCreateCampus}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Cơ Sở / Phân Hiệu Mới</span>
          </button>
        </div>
      </div>

      {/* Main Campuses List */}
      <div className="space-y-4">
        {filteredCampuses.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
            <Building className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 text-sm">Không tìm thấy cơ sở hoặc phân hiệu nào</p>
            <p className="text-xs text-slate-400 mt-0.5">Hãy thử thay đổi điều kiện tìm kiếm hoặc chọn trường khác</p>
          </div>
        ) : (
          filteredCampuses.map((campus) => {
            const isExpanded = expandedCampuses[campus.id] ?? true;
            return (
              <div
                key={campus.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-indigo-200"
              >
                {/* Campus Header Bar */}
                <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <button
                      onClick={() => toggleExpand(campus.id)}
                      className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500 transition cursor-pointer mt-0.5 sm:mt-0"
                    >
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">{campus.name}</h3>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-extrabold uppercase">
                          {campus.schoolPoints.length} Điểm trường
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold">
                          {campus.classRoomsCount} Phòng học
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <School className="w-3.5 h-3.5 text-indigo-500" />
                          {campus.schoolName}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {campus.address || "Chưa cập nhật địa chỉ cơ sở"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campus Action Buttons */}
                  <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <Link
                      href={`/admin/tt15-evaluation?campusId=${campus.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-extrabold transition"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Đánh giá TT15</span>
                    </Link>

                    <button
                      onClick={() => handleOpenAddPoint(campus)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Điểm trường</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditCampus(campus)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-100 hover:border-indigo-300 text-slate-700 hover:text-indigo-900 transition cursor-pointer"
                      title="Chỉnh sửa cơ sở"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingCampus(campus)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-100 hover:border-rose-300 text-slate-700 hover:text-rose-900 transition cursor-pointer"
                      title="Xóa cơ sở"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-table of School Points */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/40">
                    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-4">Tên Điểm Trường</th>
                            <th className="py-2.5 px-4">Khoảng Cách</th>
                            <th className="py-2.5 px-4">Phụ Trách & Điện Thoại</th>
                            <th className="py-2.5 px-4">Địa Chỉ Cụ Thể</th>
                            <th className="py-2.5 px-4 text-center">Phòng Học</th>
                            <th className="py-2.5 px-4 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {campus.schoolPoints.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">
                                Chưa có điểm trường nào thuộc phân hiệu này. Hãy bấm "Thêm Điểm trường".
                              </td>
                            </tr>
                          ) : (
                            campus.schoolPoints.map((sp) => (
                              <tr key={sp.id} className="hover:bg-slate-50/80 transition-all">
                                <td className="py-3 px-4 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                                      <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <span>{sp.name}</span>
                                    {sp.distanceKm === 0 && (
                                      <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-extrabold">
                                        Trung tâm
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 text-slate-600 font-semibold">
                                  {sp.distanceKm ? `${sp.distanceKm} km` : "Tại trụ sở (0 km)"}
                                </td>

                                <td className="py-3 px-4">
                                  <p className="font-bold text-slate-800">{sp.managerName || "Chưa phân công"}</p>
                                  {sp.phone && (
                                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {sp.phone}
                                    </p>
                                  )}
                                </td>

                                <td className="py-3 px-4 max-w-xs text-slate-600 line-clamp-1">
                                  {sp.address || "Theo địa chỉ cơ sở"}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
                                    <DoorOpen className="w-3 h-3" />
                                    <span>{sp.classRoomsCount} lớp</span>
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditPoint(campus, sp)}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-100 hover:border-indigo-300 text-slate-700 hover:text-indigo-900 transition cursor-pointer"
                                      title="Chỉnh sửa điểm trường"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingPoint({ point: sp, campusId: campus.id })}
                                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-100 hover:border-rose-300 text-slate-700 hover:text-rose-900 transition cursor-pointer"
                                      title="Xóa điểm trường"
                                    >
                                      <Trash2 className="w-3 h-3" />
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Campus Modal */}
      {isCampusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingCampus ? "Chỉnh Sửa Cơ Sở / Phân Hiệu" : "Thêm Cơ Sở / Phân Hiệu Mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Quản lý mạng lưới trường học đa cơ sở</p>
                </div>
              </div>
              <button
                onClick={() => setIsCampusModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCampus} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Trường Học Chủ Quản <span className="text-rose-500">*</span>
                </label>
                <select
                  value={campusForm.schoolId}
                  onChange={(e) => setCampusForm({ ...campusForm, schoolId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">-- Chọn Trường Học --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tên Cơ Sở / Phân Hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cơ sở 1 - Trụ sở chính, hoặc Phân hiệu Bản Mó"
                  value={campusForm.name}
                  onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Địa Chỉ Cơ Sở</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số 24 Thụy Khuê, Tây Hồ, Hà Nội"
                  value={campusForm.address}
                  onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : editingCampus ? "Lưu Thay Đổi" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SchoolPoint Modal */}
      {isPointModalOpen && targetCampusForPoint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingPoint ? "Chỉnh Sửa Điểm Trường Vệ Tinh" : "Thêm Điểm Trường Vệ Tinh"}
                  </h3>
                  <p className="text-xs text-slate-500">Trực thuộc: {targetCampusForPoint.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPointModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPoint} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tên Điểm Trường <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điểm Bản Mó, Điểm Phia Xam, Điểm Bản Pún..."
                  value={pointForm.name}
                  onChange={(e) => setPointForm({ ...pointForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Khoảng cách tới trung tâm (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="VD: 5.5"
                    value={pointForm.distanceKm}
                    onChange={(e) => setPointForm({ ...pointForm, distanceKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Cán bộ / GV phụ trách điểm</label>
                  <input
                    type="text"
                    placeholder="VD: Thầy Đinh Văn A"
                    value={pointForm.managerName}
                    onChange={(e) => setPointForm({ ...pointForm, managerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Số Điện Thoại Liên Hệ</label>
                  <input
                    type="text"
                    placeholder="VD: 0912.345.xxx"
                    value={pointForm.phone}
                    onChange={(e) => setPointForm({ ...pointForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Địa Chỉ Cụ Thể</label>
                  <input
                    type="text"
                    placeholder="VD: Bản Mó, Xã Mường Chanh"
                    value={pointForm.address}
                    onChange={(e) => setPointForm({ ...pointForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editingPoint ? "Lưu Thay Đổi" : "Thêm Điểm Trường"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Campus Confirmation Modal */}
      {deletingCampus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác Nhận Xóa Cơ Sở</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa cơ sở <strong className="text-slate-900 font-bold">{deletingCampus.name}</strong> thuộc{" "}
              <strong className="text-slate-900 font-bold">{deletingCampus.schoolName}</strong>?
            </p>

            {deletingCampus.classRoomsCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Cơ sở này đang có <strong>{deletingCampus.classRoomsCount} lớp học</strong> đang hoạt động. Bạn cần chuyển hoặc xóa
                  các lớp học trước khi xóa cơ sở.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCampus(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending || deletingCampus.classRoomsCount > 0}
                onClick={handleDeleteCampusConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Point Confirmation Modal */}
      {deletingPoint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác Nhận Xóa Điểm Trường</h3>
                <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa điểm trường{" "}
              <strong className="text-slate-900 font-bold">{deletingPoint.point.name}</strong>?
            </p>

            {deletingPoint.point.classRoomsCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Điểm trường này đang có <strong>{deletingPoint.point.classRoomsCount} lớp học</strong>. Bạn cần chuyển các lớp
                  học trước khi xóa điểm trường.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPoint(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending || deletingPoint.point.classRoomsCount > 0}
                onClick={handleDeletePointConfirm}
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
