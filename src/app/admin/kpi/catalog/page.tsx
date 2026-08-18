"use client";

import { useEffect, useState, useRef } from "react";
import {
  getKpiCatalogs,
  createKpiCatalog,
  updateKpiCatalog,
  duplicateKpiCatalog,
  toggleKpiStatus,
  seedDefaultKpiCatalog,
} from "../actions";
import { KpiCategory, MeasurementDirection, ReportingFrequency } from "@prisma/client";
import {
  Search,
  Plus,
  Copy,
  Power,
  Edit,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Filter,
} from "lucide-react";

export const CATEGORY_LABELS: Record<KpiCategory, string> = {
  STRATEGIC: "1. Chiến lược phát triển trường",
  EDUCATIONAL_QUALITY: "2. Chất lượng giáo dục & Đào tạo",
  PROFESSIONAL: "3. Công tác chuyên môn & Giảng dạy",
  STAFF_PERSONNEL: "4. Đội ngũ cán bộ & Giáo viên",
  STUDENT: "5. Công tác học sinh & Rèn luyện",
  DIGITAL_TRANSFORMATION: "6. Chuyển đổi số & CNTT",
  FINANCIAL: "7. Tài chính & Ngân sách",
  ASSETS: "8. Quản lý tài sản & Thiết bị",
  FACILITIES: "9. Cơ sở vật chất & Hạ tầng",
  SCHOOL_SAFETY: "10. An toàn & An ninh trường học",
  SCHOOL_RELATIONS: "11. Quan hệ Gia đình - Nhà trường - Xã hội",
  INNOVATION: "12. Đổi mới sáng tạo & Thi đua",
};

export const DIRECTION_LABELS: Record<MeasurementDirection, string> = {
  HIGHER_BETTER: "Càng cao càng tốt (≥)",
  LOWER_BETTER: "Càng thấp càng tốt (≤)",
  PASS_FAIL: "Đạt / Không đạt (Pass/Fail)",
};

export const FREQUENCY_LABELS: Record<ReportingFrequency, string> = {
  MONTHLY: "Hàng tháng",
  QUARTERLY: "Hàng quý",
  SEMESTER: "Theo học kỳ",
  YEARLY: "Hàng năm",
};

export default function KpiCatalogPage() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "STRATEGIC" as KpiCategory,
    purpose: "",
    formula: "",
    unit: "%",
    direction: "HIGHER_BETTER" as MeasurementDirection,
    dataSource: "",
    frequency: "MONTHLY" as ReportingFrequency,
    weight: 5,
    baselineValue: 0,
    targetValue: 100,
    warningThreshold: 0,
    criticalThreshold: 0,
    responsiblePerson: "",
    scope: "ALL",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getKpiCatalogs(search, selectedCategory);
      if (res.success && res.data) {
        setCatalogs(res.data);
      } else if (res.error) {
        setMessage({ type: "error", text: res.error });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Lỗi tải dữ liệu danh mục KPI." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const handleSeedDefaults = async () => {
    if (isSubmittingRef.current || submitting || loading) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setLoading(true);
    try {
      const res = await seedDefaultKpiCatalog();
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Khởi tạo dữ liệu mẫu thành công!" });
        await loadData();
      } else {
        setMessage({ type: "error", text: res.error || "Khởi tạo thất bại." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Khởi tạo dữ liệu mẫu thất bại." });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `KPI-${Date.now().toString().slice(-4)}`,
      name: "",
      category: "STRATEGIC",
      purpose: "",
      formula: "",
      unit: "%",
      direction: "HIGHER_BETTER",
      dataSource: "",
      frequency: "MONTHLY",
      weight: 5,
      baselineValue: 0,
      targetValue: 100,
      warningThreshold: 0,
      criticalThreshold: 0,
      responsiblePerson: "",
      scope: "ALL",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      purpose: item.purpose || "",
      formula: item.formula || "",
      unit: item.unit || "%",
      direction: item.direction,
      dataSource: item.dataSource || "",
      frequency: item.frequency,
      weight: item.weight || 0,
      baselineValue: item.baselineValue ?? 0,
      targetValue: item.targetValue ?? 100,
      warningThreshold: item.warningThreshold ?? 0,
      criticalThreshold: item.criticalThreshold ?? 0,
      responsiblePerson: item.responsiblePerson || "",
      scope: item.scope || "ALL",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || submitting) return;

    if (!formData.code || !formData.name) {
      setMessage({ type: "error", text: "Vui lòng nhập Mã và Tên KPI." });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      if (editingItem) {
        const res = await updateKpiCatalog(editingItem.id, formData);
        if (res.success) {
          setMessage({ type: "success", text: "Cập nhật KPI thành công!" });
          setShowModal(false);
          await loadData();
        } else {
          setMessage({ type: "error", text: res.error || "Lỗi cập nhật." });
        }
      } else {
        const res = await createKpiCatalog(formData);
        if (res.success) {
          setMessage({ type: "success", text: "Thêm chỉ số KPI thành công!" });
          setShowModal(false);
          await loadData();
        } else {
          setMessage({ type: "error", text: res.error || "Lỗi tạo mới." });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Đã xảy ra lỗi khi lưu KPI." });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await duplicateKpiCatalog(id);
      if (res.success) {
        setMessage({ type: "success", text: "Đã sao chép KPI thành công!" });
        await loadData();
      } else {
        setMessage({ type: "error", text: res.error || "Không thể sao chép." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Lỗi sao chép KPI." });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await toggleKpiStatus(id);
      if (res.success) {
        setMessage({ type: "success", text: "Đã thay đổi trạng thái KPI." });
        await loadData();
      } else {
        setMessage({ type: "error", text: res.error || "Lỗi thay đổi trạng thái." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Lỗi khi đổi trạng thái KPI." });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Mã KPI,Tên chỉ số,Nhóm chỉ số,Đơn vị tính,Chiều đo,Trọng số (%),Giá trị chỉ tiêu,Người chịu trách nhiệm,Trạng thái",
    ];
    const rows = catalogs.map((c) =>
      [
        `"${c.code}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${CATEGORY_LABELS[c.category as KpiCategory] || c.category}"`,
        `"${c.unit}"`,
        `"${DIRECTION_LABELS[c.direction as MeasurementDirection] || c.direction}"`,
        c.weight,
        c.targetValue,
        `"${c.responsiblePerson || ""}"`,
        c.isActive ? "Hoạt động" : "Tạm dừng",
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_muc_KPI_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalWeight = catalogs
    .filter((c) => c.isActive)
    .reduce((acc, cur) => acc + (cur.weight || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-800">Danh Mục Chỉ Số KPI Toàn Trường</h1>
          </div>
          <p className="text-sm text-slate-500">
            Quản lý 12 nhóm chỉ số KPI chiến lược, thiết lập trọng số, đơn vị tính và mục tiêu đánh giá.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={submitting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition text-sm disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            {submitting ? "Đang tạo..." : "Tạo KPI mẫu (12 Nhóm)"}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium rounded-xl hover:bg-emerald-100 transition text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Xuất Excel/CSV
          </button>
          <button
            onClick={handleOpenAdd}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm transition text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Thêm KPI Mới
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-semibold">
            Đóng
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số KPI</span>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">{catalogs.length}</div>
          <div className="text-xs text-slate-500 mt-1">Chỉ số trên hệ thống</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đang hoạt động</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {catalogs.filter((c) => c.isActive).length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Sẵn sàng đưa vào đánh giá</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng trọng số KPI</span>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              Math.abs(totalWeight - 100) < 0.1 ? "text-indigo-600" : "text-amber-600"
            }`}
          >
            {totalWeight.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Math.abs(totalWeight - 100) < 0.1
              ? "✓ Đạt tiêu chuẩn 100%"
              : "⚠️ Cần điều chỉnh đạt 100%"}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số nhóm KPI</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1">12 / 12</div>
          <div className="text-xs text-slate-500 mt-1">Danh mục tiêu chuẩn nhà trường</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên KPI, người chịu trách nhiệm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden md:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-72 p-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">-- Tất cả 12 Nhóm Chỉ Số --</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Đang tải danh mục KPI...</div>
        ) : catalogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-500 font-medium">Chưa có chỉ số KPI nào được tìm thấy.</p>
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl text-sm hover:bg-indigo-100 transition"
            >
              Nạp bộ 12 chỉ số KPI mẫu
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã KPI</th>
                  <th className="py-3 px-4">Tên Chỉ Số & Mục Tiêu</th>
                  <th className="py-3 px-4">Nhóm Chỉ Số</th>
                  <th className="py-3 px-4 text-center">Chiều đo</th>
                  <th className="py-3 px-4 text-center">Trọng số</th>
                  <th className="py-3 px-4 text-center">Chỉ tiêu</th>
                  <th className="py-3 px-4">Phụ trách</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {catalogs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 text-xs">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      {item.purpose && (
                        <div className="text-xs text-slate-400 truncate mt-0.5" title={item.purpose}>
                          {item.purpose}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                        {CATEGORY_LABELS[item.category as KpiCategory] || item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded ${
                          item.direction === "HIGHER_BETTER"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.direction === "LOWER_BETTER"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {DIRECTION_LABELS[item.direction as MeasurementDirection]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-indigo-700">
                      {item.weight}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium">
                      {item.targetValue} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {item.responsiblePerson || "---"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {item.isActive ? "Hoạt động" : "Tạm dừng"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDuplicate(item.id)}
                          title="Sao chép"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Chỉnh sửa"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800">
              {editingItem ? "Chỉnh Sửa Chỉ Số KPI" : "Thêm Chỉ Số KPI Mới"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mã KPI <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!!editingItem}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nhóm KPI <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as KpiCategory })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên chỉ số KPI <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Tỷ lệ học sinh đạt học lực Giỏi/Tốt"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mục đích đo lường</label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="VD: Nâng cao chất lượng đào tạo toàn trường"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Công thức tính</label>
                  <input
                    type="text"
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                    placeholder="VD: (Số HS Giỏi / Tổng HS) * 100"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="%, điểm, lượt, vụ..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Chiều đánh giá</label>
                  <select
                    value={formData.direction}
                    onChange={(e) =>
                      setFormData({ ...formData, direction: e.target.value as MeasurementDirection })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Object.entries(DIRECTION_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tần suất báo cáo</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as ReportingFrequency })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Trọng số (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trị cơ sở (Baseline)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.baselineValue}
                    onChange={(e) =>
                      setFormData({ ...formData, baselineValue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giá trị mục tiêu (Target)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.targetValue}
                    onChange={(e) =>
                      setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Người / Chức danh phụ trách</label>
                  <input
                    type="text"
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    placeholder="VD: Phó Hiệu trưởng Chuyên môn"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nguồn dữ liệu kiểm chứng</label>
                  <input
                    type="text"
                    value={formData.dataSource}
                    onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                    placeholder="VD: Sổ điểm điện tử / Phòng CNTT"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : editingItem ? "Lưu Cập Nhật" : "Thêm KPI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
