/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/equipment/page.tsx` Admin Equipment and Facility Hub.
 * 2. Affected APIs: `EquipmentClient` Client Component for Equipment and Transfer logistics.
 * 3. Schemas: `EquipmentItem`, `EquipmentTransferItem`, `EquipmentFilterLookup`, actions `createEquipment`, `updateEquipment`, `deleteEquipment`, `createEquipmentTransfer`, `updateTransferStatus`.
 * 4. Verbatim User Instruction: "tiep tuc" - Xây dựng giao diện Quản lý Thiết bị số & Cơ sở vật chất (/admin/equipment).
 */

"use client";

import { useState, useTransition } from "react";
import {
  Laptop,
  Tv,
  FlaskConical,
  Activity,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { EquipmentCategory, EquipmentCondition, TransferStatus } from "@prisma/client";
import {
  EquipmentItem,
  EquipmentTransferItem,
  EquipmentFilterLookup,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  createEquipmentTransfer,
  updateTransferStatus,
} from "./actions";

interface EquipmentClientProps {
  initialEquipment: EquipmentItem[];
  initialTransfers: EquipmentTransferItem[];
  lookup: EquipmentFilterLookup;
  stats: {
    totalEquipmentTypes: number;
    totalQuantityCount: number;
    itDevicesCount: number;
    labDevicesCount: number;
    brokenDevicesCount: number;
  } | null;
}

export default function EquipmentClient({
  initialEquipment,
  initialTransfers,
  lookup,
  stats,
}: EquipmentClientProps) {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(initialEquipment);
  const [transfersList, setTransfersList] = useState<EquipmentTransferItem[]>(initialTransfers);
  const [activeTab, setActiveTab] = useState<"EQUIPMENT" | "TRANSFERS">("EQUIPMENT");

  // Filters
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCondition, setSelectedCondition] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState<boolean>(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<EquipmentItem | null>(null);

  // Equipment Form State
  const [formSchoolId, setFormSchoolId] = useState<string>("");
  const [formCampusId, setFormCampusId] = useState<string>("");
  const [formSchoolPointId, setFormSchoolPointId] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<EquipmentCategory>(EquipmentCategory.IT_COMPUTER);
  const [formTotalQty, setFormTotalQty] = useState<number>(1);
  const [formCondition, setFormCondition] = useState<EquipmentCondition>(EquipmentCondition.GOOD);
  const [formUnit, setFormUnit] = useState<string>("bộ");
  const [formLocation, setFormLocation] = useState<string>("");

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferEquipmentId, setTransferEquipmentId] = useState<string>("");
  const [transferToPointId, setTransferToPointId] = useState<string>("");
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferReturnDate, setTransferReturnDate] = useState<string>("");

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredEquipment = equipmentList.filter((eq) => {
    const matchSchool = selectedSchool === "ALL" || eq.schoolId === selectedSchool;
    const matchCat = selectedCategory === "ALL" || eq.category === selectedCategory;
    const matchCond = selectedCondition === "ALL" || eq.condition === selectedCondition;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      eq.code.toLowerCase().includes(q) ||
      eq.name.toLowerCase().includes(q) ||
      eq.schoolName.toLowerCase().includes(q) ||
      (eq.locationDetail && eq.locationDetail.toLowerCase().includes(q));
    return matchSchool && matchCat && matchCond && matchSearch;
  });

  const filteredTransfers = transfersList.filter((tr) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      tr.equipmentName.toLowerCase().includes(q) ||
      tr.equipmentCode.toLowerCase().includes(q) ||
      tr.toPointName.toLowerCase().includes(q) ||
      tr.schoolName.toLowerCase().includes(q)
    );
  });

  // Open Create Equipment Modal
  const handleOpenCreateEquipment = () => {
    setEditingEquipment(null);
    const defaultSchool = lookup.schools[0]?.id || "";
    setFormSchoolId(defaultSchool);
    const availableCampuses = lookup.campuses.filter((c) => c.schoolId === defaultSchool);
    setFormCampusId(availableCampuses[0]?.id || "");
    const availablePoints = lookup.schoolPoints.filter((p) => p.campusId === availableCampuses[0]?.id);
    setFormSchoolPointId(availablePoints[0]?.id || "");

    setFormCode(`TB-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormName("");
    setFormCategory(EquipmentCategory.IT_COMPUTER);
    setFormTotalQty(10);
    setFormCondition(EquipmentCondition.GOOD);
    setFormUnit("bộ");
    setFormLocation("Phòng máy vi tính số 1");
    setIsEquipmentModalOpen(true);
  };

  // Open Edit Equipment Modal
  const handleOpenEditEquipment = (eq: EquipmentItem) => {
    setEditingEquipment(eq);
    setFormSchoolId(eq.schoolId);
    setFormCampusId(eq.campusId || "");
    setFormSchoolPointId(eq.schoolPointId || "");
    setFormCode(eq.code);
    setFormName(eq.name);
    setFormCategory(eq.category);
    setFormTotalQty(eq.totalQuantity);
    setFormCondition(eq.condition);
    setFormUnit(eq.unit);
    setFormLocation(eq.locationDetail || "");
    setIsEquipmentModalOpen(true);
  };

  // Open Transfer Modal
  const handleOpenCreateTransfer = (eq?: EquipmentItem) => {
    const targetEq = eq || equipmentList[0];
    setTransferEquipmentId(targetEq?.id || "");
    const availablePoints = lookup.schoolPoints.filter((p) => p.id !== targetEq?.schoolPointId);
    setTransferToPointId(availablePoints[0]?.id || lookup.schoolPoints[0]?.id || "");
    setTransferQty(1);
    setTransferReason("Phục vụ kỳ thi đánh giá năng lực số & bổ sung cho điểm trường vùng cao");
    setTransferReturnDate("");
    setIsTransferModalOpen(true);
  };

  // Handle Equipment Form Submit
  const handleSubmitEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim() || !formSchoolId) {
      showNotification("error", "Vui lòng điền đủ thông tin thiết bị");
      return;
    }

    startTransition(async () => {
      if (editingEquipment) {
        const res = await updateEquipment(editingEquipment.id, {
          name: formName,
          category: formCategory,
          totalQuantity: formTotalQty,
          condition: formCondition,
          unit: formUnit,
          locationDetail: formLocation,
          campusId: formCampusId || undefined,
          schoolPointId: formSchoolPointId || undefined,
        });

        if (res.success && res.data) {
          setEquipmentList((prev) =>
            prev.map((item) =>
              item.id === editingEquipment.id
                ? {
                    ...item,
                    name: res.data.name,
                    category: res.data.category,
                    totalQuantity: res.data.totalQuantity,
                    condition: res.data.condition,
                    unit: res.data.unit,
                    locationDetail: res.data.locationDetail,
                  }
                : item
            )
          );
          setIsEquipmentModalOpen(false);
          showNotification("success", `Cập nhật thiết bị ${res.data.name} thành công`);
        } else {
          showNotification("error", res.error || "Lỗi cập nhật thiết bị");
        }
      } else {
        const res = await createEquipment({
          schoolId: formSchoolId,
          campusId: formCampusId || undefined,
          schoolPointId: formSchoolPointId || undefined,
          code: formCode,
          name: formName,
          category: formCategory,
          totalQuantity: formTotalQty,
          condition: formCondition,
          unit: formUnit,
          locationDetail: formLocation,
        });

        if (res.success && res.data) {
          const schoolObj = lookup.schools.find((s) => s.id === formSchoolId);
          const campusObj = lookup.campuses.find((c) => c.id === formCampusId);
          const pointObj = lookup.schoolPoints.find((p) => p.id === formSchoolPointId);

          const newItem: EquipmentItem = {
            id: res.data.id,
            code: res.data.code,
            name: res.data.name,
            category: res.data.category,
            totalQuantity: res.data.totalQuantity,
            availableQuantity: res.data.availableQuantity,
            inUseQuantity: res.data.inUseQuantity,
            brokenQuantity: res.data.brokenQuantity,
            condition: res.data.condition,
            unit: res.data.unit,
            locationDetail: res.data.locationDetail,
            schoolId: res.data.schoolId,
            schoolName: schoolObj?.name || "Trường học",
            campusId: res.data.campusId,
            campusName: campusObj?.name || null,
            schoolPointId: res.data.schoolPointId,
            schoolPointName: pointObj?.name || null,
            createdAt: new Date().toISOString(),
          };

          setEquipmentList((prev) => [newItem, ...prev]);
          setIsEquipmentModalOpen(false);
          showNotification("success", `Thêm mới thiết bị [${newItem.code}] thành công`);
        } else {
          showNotification("error", res.error || "Lỗi tạo mới thiết bị");
        }
      }
    });
  };

  // Handle Delete Equipment
  const handleDeleteEquipmentConfirm = () => {
    if (!deletingEquipment) return;
    startTransition(async () => {
      const res = await deleteEquipment(deletingEquipment.id);
      if (res.success) {
        setEquipmentList((prev) => prev.filter((item) => item.id !== deletingEquipment.id));
        showNotification("success", `Đã xóa thiết bị [${deletingEquipment.code}]`);
        setDeletingEquipment(null);
      } else {
        showNotification("error", res.error || "Lỗi khi xóa thiết bị");
      }
    });
  };

  // Handle Create Transfer
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEquipmentId || !transferToPointId || !transferReason.trim()) {
      showNotification("error", "Vui lòng nhập đầy đủ thông tin phiếu điều chuyển");
      return;
    }

    startTransition(async () => {
      const eq = equipmentList.find((item) => item.id === transferEquipmentId);
      if (!eq) return;

      const res = await createEquipmentTransfer({
        schoolId: eq.schoolId,
        equipmentId: transferEquipmentId,
        fromSchoolPointId: eq.schoolPointId || undefined,
        toSchoolPointId: transferToPointId,
        quantity: transferQty,
        reason: transferReason,
        returnExpectedDate: transferReturnDate || undefined,
      });

      if (res.success && res.data) {
        const toPointObj = lookup.schoolPoints.find((p) => p.id === transferToPointId);
        const newTransferItem: EquipmentTransferItem = {
          id: res.data.id,
          equipmentId: res.data.equipmentId,
          equipmentName: eq.name,
          equipmentCode: eq.code,
          schoolId: res.data.schoolId,
          schoolName: eq.schoolName,
          fromSchoolPointId: res.data.fromSchoolPointId,
          fromPointName: eq.schoolPointName || "Kho trung tâm",
          toSchoolPointId: res.data.toSchoolPointId,
          toPointName: toPointObj?.name || "Điểm trường tiếp nhận",
          quantity: res.data.quantity,
          transferDate: new Date().toISOString(),
          returnExpectedDate: res.data.returnExpectedDate ? res.data.returnExpectedDate.toISOString() : null,
          actualReturnDate: null,
          reason: res.data.reason,
          status: res.data.status,
          aiRecommendation: res.data.aiRecommendation,
          createdAt: new Date().toISOString(),
        };

        setTransfersList((prev) => [newTransferItem, ...prev]);
        setIsTransferModalOpen(false);
        showNotification("success", `Đã lập lệnh điều chuyển cho [${eq.code}]`);
      } else {
        showNotification("error", res.error || "Lỗi khi tạo lệnh điều chuyển");
      }
    });
  };

  // Handle Transfer Status Change
  const handleUpdateTransferStatus = (transferId: string, nextStatus: TransferStatus) => {
    startTransition(async () => {
      const res = await updateTransferStatus(transferId, nextStatus);
      if (res.success) {
        setTransfersList((prev) =>
          prev.map((tr) => (tr.id === transferId ? { ...tr, status: nextStatus } : tr))
        );
        showNotification("success", `Cập nhật trạng thái điều chuyển thành ${nextStatus}`);
      } else {
        showNotification("error", res.error || "Lỗi cập nhật trạng thái");
      }
    });
  };

  const getCategoryBadge = (cat: EquipmentCategory) => {
    switch (cat) {
      case EquipmentCategory.IT_COMPUTER:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl font-bold text-[11px]">
            <Laptop className="w-3.5 h-3.5 text-sky-600" />
            <span>Máy tính / CNTT</span>
          </span>
        );
      case EquipmentCategory.PROJECTOR_SCREEN:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px]">
            <Tv className="w-3.5 h-3.5 text-indigo-600" />
            <span>Máy chiếu / Smart Board</span>
          </span>
        );
      case EquipmentCategory.LAB_PHYSICS:
      case EquipmentCategory.LAB_CHEMISTRY:
      case EquipmentCategory.LAB_BIOLOGY:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-[11px]">
            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
            <span>Thí nghiệm ({cat.replace("LAB_", "")})</span>
          </span>
        );
      case EquipmentCategory.SPORTS:
      case EquipmentCategory.MUSIC_ARTS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold text-[11px]">
            <Activity className="w-3.5 h-3.5 text-amber-600" />
            <span>Thể dục / Nghệ thuật</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[11px]">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Thiết bị dùng chung</span>
          </span>
        );
    }
  };

  const getConditionBadge = (cond: EquipmentCondition) => {
    switch (cond) {
      case EquipmentCondition.EXCELLENT:
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[10px]">Mới 100%</span>;
      case EquipmentCondition.GOOD:
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg font-bold text-[10px]">Tốt (80-95%)</span>;
      case EquipmentCondition.FAIR:
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg font-bold text-[10px]">Trung bình</span>;
      case EquipmentCondition.POOR:
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-lg font-bold text-[10px]">Xuống cấp</span>;
      case EquipmentCondition.BROKEN:
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-lg font-bold text-[10px]">Hỏng / Chờ sửa</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg font-bold text-[10px]">{cond}</span>;
    }
  };

  const getTransferStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.PENDING:
        return <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-extrabold text-[11px]">Chờ Duyệt</span>;
      case TransferStatus.APPROVED:
        return <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl font-extrabold text-[11px]">Đã Phê Duyệt</span>;
      case TransferStatus.IN_TRANSIT:
        return <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl font-extrabold text-[11px]">Đang Vận Chuyển</span>;
      case TransferStatus.COMPLETED:
        return <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-extrabold text-[11px]">Đã Bàn Giao</span>;
      case TransferStatus.CANCELLED:
        return <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-extrabold text-[11px]">Đã Hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl font-bold text-[11px]">{status}</span>;
    }
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
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Stat Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Tổng Thiết Bị Toàn Trường</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalQuantityCount}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{stats.totalEquipmentTypes} danh mục vật tư</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent bg-white p-5 rounded-3xl border border-sky-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Thiết Bị Số & CNTT</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.itDevicesCount}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Máy tính, Smart Board, Máy chiếu</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md">
                <Laptop className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Phòng Thí Nghiệm & STEM</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.labDevicesCount}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Vật lý, Hóa học, Sinh học</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <FlaskConical className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Cần Bảo Dưỡng / Hỏng</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.brokenDevicesCount}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Đề xuất thay thế & sửa chữa</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("EQUIPMENT")}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-xs border-b-2 transition cursor-pointer ${
            activeTab === "EQUIPMENT"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Mục Thiết Bị & Cơ Sở Vật Chất ({equipmentList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("TRANSFERS")}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-xs border-b-2 transition cursor-pointer ${
            activeTab === "TRANSFERS"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-2xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Lịch Sử & Điều Phối Liên Điểm Trường ({transfersList.length})</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Mã, Tên thiết bị, Vị trí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeTab === "EQUIPMENT" && (
            <>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="ALL">Tất cả nhóm thiết bị</option>
                <option value={EquipmentCategory.IT_COMPUTER}>Máy tính / CNTT</option>
                <option value={EquipmentCategory.PROJECTOR_SCREEN}>Máy chiếu / Smart Board</option>
                <option value={EquipmentCategory.LAB_PHYSICS}>Thí nghiệm Vật lý</option>
                <option value={EquipmentCategory.LAB_CHEMISTRY}>Thí nghiệm Hóa học</option>
                <option value={EquipmentCategory.LAB_BIOLOGY}>Thí nghiệm Sinh học</option>
                <option value={EquipmentCategory.SPORTS}>Thể dục thể thao</option>
                <option value={EquipmentCategory.MUSIC_ARTS}>Nhạc cụ & Mỹ thuật</option>
                <option value={EquipmentCategory.GENERAL}>Dùng chung</option>
              </select>

              {/* Condition Filter */}
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="ALL">Tất cả tình trạng</option>
                <option value={EquipmentCondition.EXCELLENT}>Mới 100%</option>
                <option value={EquipmentCondition.GOOD}>Tốt</option>
                <option value={EquipmentCondition.FAIR}>Trung bình</option>
                <option value={EquipmentCondition.POOR}>Xuống cấp</option>
                <option value={EquipmentCondition.BROKEN}>Hỏng hóc</option>
              </select>
            </>
          )}

          {/* School Filter */}
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition max-w-xs"
          >
            <option value="ALL">Tất cả trường học</option>
            {lookup.schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {activeTab === "EQUIPMENT" ? (
            <button
              onClick={handleOpenCreateEquipment}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Khai Báo Thiết Bị Mới</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenCreateTransfer()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer w-full sm:w-auto"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Lập Lệnh Điều Chuyển</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "EQUIPMENT" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Mã & Tên Thiết Bị</th>
                  <th className="py-3.5 px-5">Nhóm Phân Loại</th>
                  <th className="py-3.5 px-5 text-center">Số Lượng</th>
                  <th className="py-3.5 px-5 text-center">Tình Trạng</th>
                  <th className="py-3.5 px-5">Vị Trí / Điểm Trường</th>
                  <th className="py-3.5 px-5">Trường Quản Lý</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Layers className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">Chưa có thiết bị nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-0.5">Bấm "Khai Báo Thiết Bị Mới" để thêm vào kho.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shrink-0">
                            {eq.category === EquipmentCategory.IT_COMPUTER ? (
                              <Laptop className="w-4 h-4 text-sky-600" />
                            ) : eq.category === EquipmentCategory.PROJECTOR_SCREEN ? (
                              <Tv className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <FlaskConical className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{eq.name}</p>
                            <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                              {eq.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">{getCategoryBadge(eq.category)}</td>

                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-black text-slate-900 text-sm">
                            {eq.totalQuantity} <span className="text-[10px] font-medium text-slate-500">{eq.unit}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">Khả dụng: {eq.availableQuantity}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">{getConditionBadge(eq.condition)}</td>

                      <td className="py-4 px-5">
                        <div className="text-slate-800 font-bold">{eq.schoolPointName || "Kho Điểm Trung Tâm"}</div>
                        <div className="text-[11px] text-slate-500">{eq.locationDetail || "Chưa định vị chi tiết"}</div>
                      </td>

                      <td className="py-4 px-5 text-slate-600 font-medium">{eq.schoolName}</td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenCreateTransfer(eq)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-indigo-600 transition cursor-pointer"
                            title="Điều chuyển thiết bị"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditEquipment(eq)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                            title="Chỉnh sửa thiết bị"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingEquipment(eq)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-600 transition cursor-pointer"
                            title="Xóa thiết bị"
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
      ) : (
        /* Transfers Tab */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-4 rounded-2xl border border-indigo-200/60 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-indigo-900">Tính Năng Tối Ưu Hóa Điều Phối Tự Động (AI-Driven)</h4>
              <p className="text-xs text-indigo-700/90 mt-0.5">
                Hệ thống tự động đề xuất phân bổ thiết bị giữa các điểm trường trung tâm và điểm trường lẻ để tránh lãng phí,
                nâng cao tỷ lệ sử dụng phòng máy và thiết bị thí nghiệm trực quan.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Thiết Bị Điều Chuyển</th>
                    <th className="py-3.5 px-5">Từ Điểm Trường</th>
                    <th className="py-3.5 px-5">Đến Điểm Trường</th>
                    <th className="py-3.5 px-5 text-center">Số Lượng</th>
                    <th className="py-3.5 px-5">Lý Do / Đề Xuất AI</th>
                    <th className="py-3.5 px-5 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-5 text-right">Duyệt & Xử Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <ArrowRightLeft className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-sm">Chưa có lệnh điều chuyển nào</p>
                        <p className="text-xs text-slate-400 mt-0.5">Bấm "Lập Lệnh Điều Chuyển" để khởi tạo lệnh mới.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/70 transition-all">
                        <td className="py-4 px-5">
                          <p className="font-extrabold text-slate-900">{tr.equipmentName}</p>
                          <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            {tr.equipmentCode}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-slate-700 font-bold">{tr.fromPointName}</td>

                        <td className="py-4 px-5 text-indigo-700 font-bold">{tr.toPointName}</td>

                        <td className="py-4 px-5 text-center font-black text-slate-900 text-sm">{tr.quantity}</td>

                        <td className="py-4 px-5 max-w-xs">
                          <p className="text-slate-800 line-clamp-2">{tr.reason}</p>
                          {tr.aiRecommendation && (
                            <p className="text-[10px] text-purple-700 font-medium mt-1 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                              🤖 {tr.aiRecommendation}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">{getTransferStatusBadge(tr.status)}</td>

                        <td className="py-4 px-5 text-right">
                          {tr.status === TransferStatus.PENDING && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateTransferStatus(tr.id, TransferStatus.APPROVED)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] shadow transition cursor-pointer"
                              >
                                Phê Duyệt
                              </button>
                              <button
                                onClick={() => handleUpdateTransferStatus(tr.id, TransferStatus.CANCELLED)}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-[11px] transition cursor-pointer"
                              >
                                Hủy
                              </button>
                            </div>
                          )}

                          {tr.status === TransferStatus.APPROVED && (
                            <button
                              onClick={() => handleUpdateTransferStatus(tr.id, TransferStatus.IN_TRANSIT)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-[11px] shadow transition cursor-pointer"
                            >
                              Xuất Vận Chuyển
                            </button>
                          )}

                          {tr.status === TransferStatus.IN_TRANSIT && (
                            <button
                              onClick={() => handleUpdateTransferStatus(tr.id, TransferStatus.COMPLETED)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow transition cursor-pointer"
                            >
                              Xác Nhận Đã Nhận
                            </button>
                          )}

                          {tr.status === TransferStatus.COMPLETED && (
                            <span className="text-[11px] text-emerald-600 font-bold">Hoàn tất bàn giao</span>
                          )}

                          {tr.status === TransferStatus.CANCELLED && (
                            <span className="text-[11px] text-rose-500 font-bold">Đã hủy bỏ</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Equipment Modal */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingEquipment ? "Cập Nhật Thông Tin Thiết Bị" : "Khai Báo Thiết Bị / Cơ Sở Vật Chất Mới"}
                  </h3>
                  <p className="text-xs text-slate-500">Quản lý theo tiêu chuẩn danh mục vật tư trang thiết bị dạy học</p>
                </div>
              </div>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEquipment} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Mã Thiết Bị (QR / Mã Vạch) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingEquipment}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="VD: TB-1029"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition disabled:opacity-60 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tên Thiết Bị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Màn hình cảm ứng tương tác 75 inch"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nhóm Phân Loại <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EquipmentCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value={EquipmentCategory.IT_COMPUTER}>Máy tính / CNTT</option>
                    <option value={EquipmentCategory.PROJECTOR_SCREEN}>Máy chiếu / Smart Board</option>
                    <option value={EquipmentCategory.LAB_PHYSICS}>Thí nghiệm Vật lý</option>
                    <option value={EquipmentCategory.LAB_CHEMISTRY}>Thí nghiệm Hóa học</option>
                    <option value={EquipmentCategory.LAB_BIOLOGY}>Thí nghiệm Sinh học</option>
                    <option value={EquipmentCategory.SPORTS}>Thể dục thể thao</option>
                    <option value={EquipmentCategory.MUSIC_ARTS}>Nhạc cụ & Mỹ thuật</option>
                    <option value={EquipmentCategory.GENERAL}>Dùng chung</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tình Trạng Thiết Bị <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as EquipmentCondition)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value={EquipmentCondition.EXCELLENT}>Mới 100%</option>
                    <option value={EquipmentCondition.GOOD}>Tốt (80-95%)</option>
                    <option value={EquipmentCondition.FAIR}>Trung bình</option>
                    <option value={EquipmentCondition.POOR}>Xuống cấp</option>
                    <option value={EquipmentCondition.BROKEN}>Hỏng / Cần sửa chữa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tổng Số Lượng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formTotalQty}
                    onChange={(e) => setFormTotalQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Đơn Vị Tính</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="bộ, chiếc, cái, phòng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Trường Học Trực Thuộc <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSchoolId}
                  disabled={!!editingEquipment}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setFormSchoolId(sid);
                    const avCampuses = lookup.campuses.filter((c) => c.schoolId === sid);
                    setFormCampusId(avCampuses[0]?.id || "");
                    const avPoints = lookup.schoolPoints.filter((p) => p.campusId === avCampuses[0]?.id);
                    setFormSchoolPointId(avPoints[0]?.id || "");
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {lookup.schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Cơ Sở / Phân Hiệu</label>
                  <select
                    value={formCampusId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFormCampusId(cid);
                      const avPoints = lookup.schoolPoints.filter((p) => p.campusId === cid);
                      setFormSchoolPointId(avPoints[0]?.id || "");
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value="">-- Kho Trung Tâm Cơ Sở 1 --</option>
                    {lookup.campuses
                      .filter((c) => !formSchoolId || c.schoolId === formSchoolId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Điểm Trường Cụ Thể</label>
                  <select
                    value={formSchoolPointId}
                    onChange={(e) => setFormSchoolPointId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value="">-- Điểm trường Chính --</option>
                    {lookup.schoolPoints
                      .filter((p) => !formCampusId || p.campusId === formCampusId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Vị Trí Lưu Trữ Chi Tiết</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="VD: Phòng Tin học 2, Tầng 3 Nhà A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editingEquipment ? "Cập Nhật" : "Khai Báo Thiết Bị"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Lập Lệnh Điều Chuyển Thiết Bị</h3>
                  <p className="text-xs text-slate-500">Điều phối trang thiết bị giữa các điểm trường theo nhu cầu</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Thiết Bị Cần Điều Chuyển <span className="text-rose-500">*</span>
                </label>
                <select
                  value={transferEquipmentId}
                  onChange={(e) => setTransferEquipmentId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.code}] {eq.name} (Khả dụng: {eq.availableQuantity} {eq.unit}) - {eq.schoolPointName || "Kho trung tâm"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Số Lượng Chuyển <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Điểm Trường Tiếp Nhận <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={transferToPointId}
                    onChange={(e) => setTransferToPointId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {lookup.schoolPoints.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Lý Do & Mục Đích Sử Dụng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="VD: Phục vụ giảng dạy chuyên đề STEM và kỳ thi học sinh giỏi cấp trường..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Hạn Hoàn Trả Dự Kiến (Tùy chọn)</label>
                <input
                  type="date"
                  value={transferReturnDate}
                  onChange={(e) => setTransferReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang lập..." : "Lập Lệnh Điều Chuyển"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEquipment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác Nhận Xóa Thiết Bị</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ loại bỏ thiết bị khỏi hệ thống kho</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa thiết bị <strong className="text-slate-900 font-bold">[{deletingEquipment.code}]</strong> -{" "}
              <strong className="text-slate-900 font-bold">{deletingEquipment.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingEquipment(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteEquipmentConfirm}
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
