"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Target,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Upload,
  Download,
  History,
  FileCheck,
  TrendingUp,
  Building2,
  Calendar,
  User,
  Edit,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  RefreshCw,
  Eye,
} from "lucide-react";
import {
  getQualityObjectives,
  createQualityObjective,
  updateQualityObjective,
  deleteQualityObjective,
  addObjectiveEvidence,
  getObjectiveHistory,
  importQualityObjectivesFromExcel,
  QualityObjectiveInput,
} from "./actions";

const CATEGORY_NAME_MAP: Record<string, string> = {
  ACADEMIC: "ACADEMIC",
  "Chất lượng học tập": "ACADEMIC",
  CONDUCT: "CONDUCT",
  "Phẩm chất & Năng lực": "CONDUCT",
  "Phẩm chất": "CONDUCT",
  ATTENDANCE: "ATTENDANCE",
  "Chuyên cần": "ATTENDANCE",
  PROGRAM_COMPLETION: "PROGRAM_COMPLETION",
  "Hoàn thành chương trình": "PROGRAM_COMPLETION",
  EXCELLENT_STUDENTS: "EXCELLENT_STUDENTS",
  "Học sinh giỏi": "EXCELLENT_STUDENTS",
  SUPPORT_STUDENTS: "SUPPORT_STUDENTS",
  "Học sinh cần hỗ trợ": "SUPPORT_STUDENTS",
  TEACHER_QUALITY: "TEACHER_QUALITY",
  "Chất lượng đội ngũ": "TEACHER_QUALITY",
  DIGITAL_TRANSFORMATION: "DIGITAL_TRANSFORMATION",
  "Chuyển đổi số": "DIGITAL_TRANSFORMATION",
  FACILITIES: "FACILITIES",
  "Cơ sở vật chất": "FACILITIES",
  SCHOOL_SAFETY: "SCHOOL_SAFETY",
  "An toàn trường học": "SCHOOL_SAFETY",
  PARENT_SATISFACTION: "PARENT_SATISFACTION",
  "Sự hài lòng của PHHS": "PARENT_SATISFACTION",
  OTHER: "OTHER",
  "Mục tiêu khác": "OTHER",
};

const CATEGORY_LABELS: Record<string, { name: string; bg: string; text: string }> = {
  ACADEMIC: { name: "Chất lượng học tập", bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700 border-blue-200" },
  CONDUCT: { name: "Phẩm chất & Năng lực", bg: "bg-indigo-50 hover:bg-indigo-100", text: "text-indigo-700 border-indigo-200" },
  ATTENDANCE: { name: "Chuyên cần", bg: "bg-teal-50 hover:bg-teal-100", text: "text-teal-700 border-teal-200" },
  PROGRAM_COMPLETION: { name: "Hoàn thành chương trình", bg: "bg-cyan-50 hover:bg-cyan-100", text: "text-cyan-700 border-cyan-200" },
  EXCELLENT_STUDENTS: { name: "Học sinh giỏi", bg: "bg-amber-50 hover:bg-amber-100", text: "text-amber-700 border-amber-200" },
  SUPPORT_STUDENTS: { name: "Học sinh cần hỗ trợ", bg: "bg-purple-50 hover:bg-purple-100", text: "text-purple-700 border-purple-200" },
  TEACHER_QUALITY: { name: "Chất lượng đội ngũ", bg: "bg-emerald-50 hover:bg-emerald-100", text: "text-emerald-700 border-emerald-200" },
  DIGITAL_TRANSFORMATION: { name: "Chuyển đổi số", bg: "bg-violet-50 hover:bg-violet-100", text: "text-violet-700 border-violet-200" },
  FACILITIES: { name: "Cơ sở vật chất", bg: "bg-stone-50 hover:bg-stone-100", text: "text-stone-700 border-stone-200" },
  SCHOOL_SAFETY: { name: "An toàn trường học", bg: "bg-rose-50 hover:bg-rose-100", text: "text-rose-700 border-rose-200" },
  PARENT_SATISFACTION: { name: "Sự hài lòng của PHHS", bg: "bg-pink-50 hover:bg-pink-100", text: "text-pink-700 border-pink-200" },
  OTHER: { name: "Mục tiêu khác", bg: "bg-gray-50 hover:bg-gray-100", text: "text-gray-700 border-gray-200" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  EXCEEDED: { label: "Vượt mục tiêu", bg: "bg-emerald-100 text-emerald-800 border-emerald-300", text: "text-emerald-600", icon: Sparkles },
  ACHIEVED: { label: "Đạt mục tiêu", bg: "bg-green-100 text-green-800 border-green-300", text: "text-green-600", icon: CheckCircle2 },
  NEAR_TARGET: { label: "Gần đạt (80-99%)", bg: "bg-yellow-100 text-yellow-800 border-yellow-300", text: "text-yellow-600", icon: TrendingUp },
  AT_RISK: { label: "Có nguy cơ (60-79%)", bg: "bg-orange-100 text-orange-800 border-orange-300", text: "text-orange-600", icon: AlertTriangle },
  FAILED: { label: "Không đạt (<60%)", bg: "bg-red-100 text-red-800 border-red-300", text: "text-red-600", icon: XCircle },
  NO_DATA: { label: "Chưa có dữ liệu", bg: "bg-slate-100 text-slate-700 border-slate-300", text: "text-slate-500", icon: Info },
};

export default function QualityGoalsPage() {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Drawers
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState<any | null>(null);

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedObjForEvidence, setSelectedObjForEvidence] = useState<any | null>(null);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceDesc, setEvidenceDesc] = useState("");

  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyObjTitle, setHistoryObjTitle] = useState("");

  const [showQuickUpdateModal, setShowQuickUpdateModal] = useState(false);
  const [quickUpdateObj, setQuickUpdateObj] = useState<any | null>(null);
  const [quickActualVal, setQuickActualVal] = useState<number | string>("");

  const [showCampusModal, setShowCampusModal] = useState(false);
  const [campusBreakdownObj, setCampusBreakdownObj] = useState<any | null>(null);

  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [parsedImportData, setParsedImportData] = useState<QualityObjectiveInput[]>([]);
  const [activeImportTab, setActiveImportTab] = useState<"FILE" | "JSON">("FILE");
  const [importFileName, setImportFileName] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const parsed: QualityObjectiveInput[] = rawRows
          .map((row, index) => {
            const findVal = (...keys: string[]) => {
              for (const key of keys) {
                const foundKey = Object.keys(row).find(
                  (k) => k.trim().toLowerCase() === key.toLowerCase()
                );
                if (foundKey && row[foundKey] !== undefined && row[foundKey] !== "") {
                  return row[foundKey];
                }
              }
              return null;
            };

            const codeVal = findVal("code", "mã", "mã mục tiêu", "ma") || `MTC-2026-IMP${index + 1}`;
            const titleVal = findVal("title", "tên mục tiêu", "tên", "mục tiêu", "ten muc tieu") || "";
            const catValRaw = String(findVal("category", "nhóm", "nhóm mục tiêu", "nhóm cốt lõi") || "ACADEMIC").trim();
            const catVal = CATEGORY_NAME_MAP[catValRaw] || (CATEGORY_LABELS[catValRaw] ? catValRaw : "ACADEMIC");
            const metricVal = findVal("metricName", "chỉ số", "chỉ số đo lường", "kpi") || titleVal;
            const unitVal = String(findVal("unit", "đơn vị", "đơn vị tính") || "%");
            const baseVal = findVal("baselineValue", "giá trị nền", "nền", "baseline");
            const targetVal = findVal("targetValue", "mục tiêu", "chỉ tiêu", "target");
            const actualVal = findVal("actualValue", "thực tế", "kết quả", "actual");
            const respVal = findVal("responsiblePerson", "người chịu trách nhiệm", "phụ trách", "bộ phận");
            const planVal = findVal("actionPlan", "kế hoạch", "giải pháp", "kế hoạch hành động");

            return {
              code: String(codeVal),
              title: String(titleVal),
              category: catVal as any,
              metricName: String(metricVal),
              unit: unitVal,
              baselineValue: baseVal !== null ? Number(baseVal) : 0,
              targetValue: targetVal !== null ? Number(targetVal) : 100,
              actualValue: actualVal !== null && actualVal !== "" ? Number(actualVal) : null,
              responsiblePerson: respVal ? String(respVal) : null,
              actionPlan: planVal ? String(planVal) : null,
            };
          })
          .filter((item) => item.title.trim() !== "");

        setParsedImportData(parsed);
        setImportJsonText(JSON.stringify(parsed, null, 2));
      } catch (err) {
        alert("Lỗi đọc tập tin Excel/CSV: " + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        "Mã": "MTC-2026-001",
        "Tên mục tiêu": "Nâng tỷ lệ học sinh giỏi toàn trường lên 35%",
        "Nhóm mục tiêu": "Chất lượng học tập",
        "Chỉ số đo lường": "% Học sinh giỏi cuối năm",
        "Đơn vị": "%",
        "Giá trị nền": 30,
        "Mục tiêu": 35,
        "Thực tế": 32,
        "Người chịu trách nhiệm": "Phòng BGH / Ban Chuyên Môn",
        "Kế hoạch": "Tăng cường bồi dưỡng học sinh giỏi và phụ đạo học sinh yếu"
      },
      {
        "Mã": "MTC-2026-002",
        "Tên mục tiêu": "Tỷ lệ giáo viên ứng dụng CNTT và giáo án điện tử",
        "Nhóm mục tiêu": "Chuyển đổi số",
        "Chỉ số đo lường": "% Giáo viên đạt chuyển đổi số",
        "Đơn vị": "%",
        "Giá trị nền": 80,
        "Mục tiêu": 100,
        "Thực tế": 95,
        "Người chịu trách nhiệm": "Tổ Công nghệ thông tin",
        "Kế hoạch": "Tổ chức 2 buổi tập huấn phần mềm dạy học tích cực"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KeHoachMucTieu");
    XLSX.writeFile(wb, "KeHoachMucTieu_NamHoc_Mau.xlsx");
  };

  // SMART Form State
  const [formData, setFormData] = useState<QualityObjectiveInput>({
    code: "",
    title: "",
    category: "ACADEMIC",
    metricName: "",
    unit: "%",
    baselineValue: 0,
    targetValue: 100,
    actualValue: null,
    direction: "HIGHER_BETTER",
    minRange: null,
    maxRange: null,
    deadline: "",
    period: "SEMESTER",
    responsiblePerson: "",
    dataSource: "",
    reportingFrequency: "MONTHLY",
    campusScope: "ALL",
    academicYear: "2026-2027",
    actionPlan: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getQualityObjectives({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });
      if (res.success && res.data) {
        setObjectives(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi tải dữ liệu mục tiêu chất lượng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus, searchQuery]);

  const openCreateModal = () => {
    setEditingObjective(null);
    setFormData({
      code: `MTC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: "",
      category: "ACADEMIC",
      metricName: "",
      unit: "%",
      baselineValue: 0,
      targetValue: 100,
      actualValue: null,
      direction: "HIGHER_BETTER",
      minRange: null,
      maxRange: null,
      deadline: "",
      period: "SEMESTER",
      responsiblePerson: "",
      dataSource: "",
      reportingFrequency: "MONTHLY",
      campusScope: "ALL",
      academicYear: "2026-2027",
      actionPlan: "",
      notes: "",
    });
    setShowSmartModal(true);
  };

  const openEditModal = (obj: any) => {
    setEditingObjective(obj);
    setFormData({
      code: obj.code,
      title: obj.title,
      category: obj.category,
      metricName: obj.metricName,
      unit: obj.unit,
      baselineValue: obj.baselineValue,
      targetValue: obj.targetValue,
      actualValue: obj.actualValue,
      direction: obj.direction,
      minRange: obj.minRange,
      maxRange: obj.maxRange,
      deadline: obj.deadline ? new Date(obj.deadline).toISOString().split("T")[0] : "",
      period: obj.period,
      responsiblePerson: obj.responsiblePerson || "",
      dataSource: obj.dataSource || "",
      reportingFrequency: obj.reportingFrequency,
      campusScope: obj.campusScope,
      academicYear: obj.academicYear,
      actionPlan: obj.actionPlan || "",
      notes: obj.notes || "",
    });
    setShowSmartModal(true);
  };

  const handleSaveObjective = () => {
    if (isSubmittingRef.current || submitting) return;
    if (!formData.code || !formData.title || !formData.metricName || !formData.targetValue) {
      alert("Vui lòng điền đầy đủ các thông tin SMART bắt buộc (Mã, Tên, Chỉ số đo lường, Giá trị mục tiêu)");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    startTransition(async () => {
      try {
        if (editingObjective) {
          const res = await updateQualityObjective(editingObjective.id, formData);
          if (res.success) {
            setShowSmartModal(false);
            await loadData();
          } else {
            alert(res.error || "Không thể cập nhật mục tiêu");
          }
        } else {
          const res = await createQualityObjective(formData);
          if (res.success) {
            setShowSmartModal(false);
            await loadData();
          } else {
            alert(res.error || "Không thể tạo mục tiêu");
          }
        }
      } catch (err: any) {
        alert("Đã xảy ra lỗi khi lưu mục tiêu.");
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (isSubmittingRef.current || submitting) return;
    if (confirm("Bạn có chắc chắn muốn xóa mục tiêu chất lượng này không?")) {
      isSubmittingRef.current = true;
      setSubmitting(true);
      startTransition(async () => {
        try {
          const res = await deleteQualityObjective(id);
          if (res.success) {
            await loadData();
          } else {
            alert(res.error || "Không thể xóa mục tiêu");
          }
        } catch (err: any) {
          alert("Lỗi khi xóa mục tiêu.");
        } finally {
          isSubmittingRef.current = false;
          setSubmitting(false);
        }
      });
    }
  };

  const handleQuickUpdate = async () => {
    if (!quickUpdateObj) return;
    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    const val = quickActualVal === "" ? null : Number(quickActualVal);
    startTransition(async () => {
      try {
        const res = await updateQualityObjective(quickUpdateObj.id, { actualValue: val });
        if (res.success) {
          setShowQuickUpdateModal(false);
          await loadData();
        } else {
          alert(res.error || "Cập nhật thất bại");
        }
      } catch (err: any) {
        alert("Lỗi khi cập nhật kết quả.");
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    });
  };

  const handleAddEvidence = async () => {
    if (!selectedObjForEvidence || !evidenceTitle) {
      alert("Vui lòng nhập tên minh chứng");
      return;
    }
    if (isSubmittingRef.current || submitting) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    startTransition(async () => {
      try {
        const res = await addObjectiveEvidence(selectedObjForEvidence.id, {
          title: evidenceTitle,
          fileUrl: evidenceUrl,
          description: evidenceDesc,
        });
        if (res.success) {
          setEvidenceTitle("");
          setEvidenceUrl("");
          setEvidenceDesc("");
          setShowEvidenceModal(false);
          await loadData();
        } else {
          alert(res.error || "Thêm minh chứng thất bại");
        }
      } catch (err: any) {
        alert("Lỗi khi thêm minh chứng.");
      } finally {
        isSubmittingRef.current = false;
        setSubmitting(false);
      }
    });
  };

  const openHistory = async (obj: any) => {
    setHistoryObjTitle(obj.title);
    setShowHistoryDrawer(true);
    try {
      const res = await getObjectiveHistory(obj.id);
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi lấy lịch sử mục tiêu:", err);
    }
  };

  const handleImportExcelJson = async () => {
    if (isSubmittingRef.current || submitting) return;
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        alert("Dữ liệu phải là danh sách (array)");
        return;
      }
      isSubmittingRef.current = true;
      setSubmitting(true);
      startTransition(async () => {
        try {
          const res = await importQualityObjectivesFromExcel(parsed);
          if (res.success) {
            alert(`Đã nhập thành công! Tạo mới: ${res.createdCount}, Cập nhật: ${res.updatedCount}`);
            setShowExcelImportModal(false);
            setImportJsonText("");
            await loadData();
          } else {
            alert(res.error || "Lỗi nhập dữ liệu Excel");
          }
        } catch (e: any) {
          alert("Lỗi nhập dữ liệu Excel: " + (e?.message || e));
        } finally {
          isSubmittingRef.current = false;
          setSubmitting(false);
        }
      });
    } catch (e) {
      alert("Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại cấu trúc!");
    }
  };

  // Metrics summary
  const totalCount = objectives.length;
  const achievedCount = objectives.filter((o) => o.status === "EXCEEDED" || o.status === "ACHIEVED").length;
  const nearOrRiskCount = objectives.filter((o) => o.status === "NEAR_TARGET" || o.status === "AT_RISK").length;
  const failedCount = objectives.filter((o) => o.status === "FAILED").length;
  const avgCompletion =
    totalCount > 0
      ? (objectives.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / totalCount).toFixed(1)
      : "0";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Mục Tiêu Chất Lượng Nhà Trường</h1>
              <p className="text-slate-500 text-sm">
                Quản lý chiến lược theo mô hình SMART & Theo dõi 12 nhóm mục tiêu chất lượng cốt lõi
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Nhập Excel
          </button>

          <button
            onClick={openCreateModal}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm text-sm transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Thêm Mục Tiêu SMART
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng Số Mục Tiêu</div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Trong năm học 2026-2027</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-emerald-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Đạt / Vượt
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{achievedCount}</div>
          <div className="text-xs text-slate-400 mt-1">
            {totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0}% trên tổng mục tiêu
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-amber-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Gần Đạt / Cảnh Báo
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{nearOrRiskCount}</div>
          <div className="text-xs text-slate-400 mt-1">Tỷ lệ 60% - 99%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-red-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> Không Đạt ({"<60%"})
          </div>
          <div className="text-3xl font-extrabold text-red-600 mt-2">{failedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Cần có biện pháp khắc phục</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-blue-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Tỷ Lệ Hoàn Thành TB
          </div>
          <div className="text-3xl font-extrabold text-blue-600 mt-2">{avgCompletion}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Number(avgCompletion), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên mục tiêu, mã, chỉ số, người chịu trách nhiệm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="EXCEEDED">Vượt mục tiêu</option>
              <option value="ACHIEVED">Đạt mục tiêu</option>
              <option value="NEAR_TARGET">Gần đạt (80-99%)</option>
              <option value="AT_RISK">Có nguy cơ (60-79%)</option>
              <option value="FAILED">Không đạt ({"<60%"})</option>
              <option value="NO_DATA">Chưa có dữ liệu</option>
            </select>
          </div>
        </div>

        {/* 12 Objective Categories Filter Chips */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">12 Nhóm mục tiêu chất lượng:</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selectedCategory === "ALL"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tất cả (12 Nhóm)
            </button>

            {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : `${catInfo.bg} ${catInfo.text}`
                  }`}
                >
                  {catInfo.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Objectives List / Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <div>Đang tải dữ liệu mục tiêu chất lượng...</div>
          </div>
        ) : objectives.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-base font-semibold text-slate-700">Chưa tìm thấy mục tiêu chất lượng phù hợp</div>
            <p className="text-sm text-slate-400 mt-1">Hãy thêm mục tiêu SMART mới hoặc điều kiện lọc của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-5">Mã & Mục Tiêu SMART</th>
                  <th className="py-4 px-4">Nhóm Cốt Lõi</th>
                  <th className="py-4 px-4">Chỉ Số & Đơn Vị</th>
                  <th className="py-4 px-4">Chỉ Tiêu vs Thực Tế</th>
                  <th className="py-4 px-4 text-center">Tiến Độ & Trạng Thái</th>
                  <th className="py-4 px-4">Trách Nhiệm & Hạn</th>
                  <th className="py-4 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {objectives.map((obj) => {
                  const cat = CATEGORY_LABELS[obj.category] || CATEGORY_LABELS.OTHER;
                  const st = STATUS_CONFIG[obj.status] || STATUS_CONFIG.NO_DATA;
                  const StatusIcon = st.icon;

                  return (
                    <tr key={obj.id} className="hover:bg-slate-50 transition">
                      {/* Code & Title */}
                      <td className="py-4 px-5">
                        <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mb-1">
                          {obj.code}
                        </div>
                        <div className="font-semibold text-slate-800 text-base">{obj.title}</div>
                        {obj.actionPlan && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                            <span className="font-medium text-slate-600">Kế hoạch:</span> {obj.actionPlan}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${cat.bg} ${cat.text}`}>
                          {cat.name}
                        </span>
                      </td>

                      {/* Metric Name */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-700">{obj.metricName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Đơn vị: <span className="font-semibold text-slate-600">{obj.unit}</span>
                          {obj.direction === "HIGHER_BETTER" && " (Càng cao càng tốt)"}
                          {obj.direction === "LOWER_BETTER" && " (Càng thấp càng tốt)"}
                          {obj.direction === "RANGE" && " (Trong khoảng)"}
                        </div>
                      </td>

                      {/* Baseline, Target, Actual */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Nền:</span>
                          <span className="text-xs font-medium text-slate-600">{obj.baselineValue ?? 0}{obj.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Mục tiêu:</span>
                          <span className="text-sm font-bold text-slate-800">{obj.targetValue}{obj.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Thực tế:</span>
                          <span className={`text-sm font-bold ${obj.actualValue !== null ? "text-blue-700" : "text-slate-400"}`}>
                            {obj.actualValue !== null ? `${obj.actualValue}${obj.unit}` : "--"}
                          </span>
                        </div>
                      </td>

                      {/* Progress & Alert Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border mb-1.5 shadow-2xs ${st.bg}">
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{st.label}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                obj.status === "EXCEEDED" || obj.status === "ACHIEVED"
                                  ? "bg-emerald-500"
                                  : obj.status === "NEAR_TARGET"
                                  ? "bg-yellow-500"
                                  : obj.status === "AT_RISK"
                                  ? "bg-orange-500"
                                  : obj.status === "FAILED"
                                  ? "bg-red-500"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${Math.min(obj.completionRate || 0, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{obj.completionRate}%</span>
                        </div>
                      </td>

                      {/* Responsible Person & Deadline */}
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {obj.responsiblePerson || "Chưa giao"}
                        </div>
                        {obj.deadline && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(obj.deadline).toLocaleDateString("vi-VN")}
                          </div>
                        )}
                        {obj.campusScope && obj.campusScope !== "ALL" && (
                          <div className="flex items-center gap-1 text-purple-600 font-medium mt-1">
                            <Building2 className="w-3 h-3" />
                            {obj.campusScope}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-1">
                        {/* Quick update actual value */}
                        <button
                          title="Cập nhật kết quả thực tế"
                          onClick={() => {
                            setQuickUpdateObj(obj);
                            setQuickActualVal(obj.actualValue ?? "");
                            setShowQuickUpdateModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>

                        {/* Evidences */}
                        <button
                          title="Minh chứng"
                          onClick={() => {
                            setSelectedObjForEvidence(obj);
                            setShowEvidenceModal(true);
                          }}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition relative"
                        >
                          <FileCheck className="w-4 h-4" />
                          {obj.evidences && obj.evidences.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {obj.evidences.length}
                            </span>
                          )}
                        </button>

                        {/* History Log */}
                        <button
                          title="Lịch sử cập nhật"
                          onClick={() => openHistory(obj)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          title="Sửa mục tiêu SMART"
                          onClick={() => openEditModal(obj)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Xóa mục tiêu"
                          onClick={() => handleDelete(obj.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SMART Objective Modal */}
      {showSmartModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-lg">
                  {editingObjective ? "Chỉnh Sửa Mục Tiêu SMART" : "Tạo Mục Tiêu Chất Lượng Theo Tiêu Chuẩn SMART"}
                </h3>
              </div>
              <button
                onClick={() => setShowSmartModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* SMART Guide banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mô hình SMART:</strong> S (Cụ thể) - M (Đo lường được) - A (Khả thi & Hành động) - R (Thực tế & Liên quan) - T (Thời hạn rõ ràng).
                </div>
              </div>

              {/* Specific (Cụ thể) */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 border-b pb-1">
                  1. Specific (Cụ thể)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã mục tiêu *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: MTC-2026-001"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nhóm 12 Mục Tiêu Cốt Lõi *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên mục tiêu chất lượng *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Nâng tỷ lệ học sinh giỏi toàn trường lên 35%"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Measurable (Đo lường được) */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 border-b pb-1">
                  2. Measurable (Đo lường được)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chỉ số đo lường (KPI/Metric) *</label>
                    <input
                      type="text"
                      value={formData.metricName}
                      onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                      placeholder="VD: % Học sinh giỏi cuối năm"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                    <input
                      type="text"
                      value={formData.unit || "%"}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="%, Điểm, Học sinh, Vụ..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Giá trị nền (Baseline)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.baselineValue ?? 0}
                      onChange={(e) => setFormData({ ...formData, baselineValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mục tiêu (Target) *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Thực tế hiện tại</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.actualValue ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualValue: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="Chưa có"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chiều so sánh</label>
                    <select
                      value={formData.direction || "HIGHER_BETTER"}
                      onChange={(e) => setFormData({ ...formData, direction: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="HIGHER_BETTER">Càng cao càng tốt</option>
                      <option value="LOWER_BETTER">Càng thấp càng tốt</option>
                      <option value="RANGE">Trong khoảng dải</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Achievable (Khả thi & Kế hoạch hành động) */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 border-b pb-1">
                  3. Achievable (Khả thi & Kế hoạch hành động)
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kế hoạch hành động trọng tâm (Action Plan)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.actionPlan || ""}
                    onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                    placeholder="Mô tả các giải pháp cốt lõi để đạt mục tiêu này..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </div>
              </div>

              {/* Relevant (Liên quan & Trách nhiệm) */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 border-b pb-1">
                  4. Relevant (Phân công & Dữ liệu)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người / Bộ phận chịu trách nhiệm</label>
                    <input
                      type="text"
                      value={formData.responsiblePerson || ""}
                      onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                      placeholder="VD: Phòng BGH / Tổ Chuyên môn"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nguồn dữ liệu kiểm chứng</label>
                    <input
                      type="text"
                      value={formData.dataSource || ""}
                      onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                      placeholder="VD: Phần mềm quản lý điểm / Báo cáo tổng kết"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Time-bound (Thời hạn) */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 border-b pb-1">
                  5. Time-bound (Hạn hoàn thành & Chu kỳ)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn hoàn thành (Deadline)</label>
                    <input
                      type="date"
                      value={formData.deadline || ""}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tần suất báo cáo</label>
                    <select
                      value={formData.reportingFrequency || "MONTHLY"}
                      onChange={(e) => setFormData({ ...formData, reportingFrequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="MONTHLY">Hàng tháng</option>
                      <option value="QUARTERLY">Hàng quý</option>
                      <option value="SEMESTER">Theo học kỳ</option>
                      <option value="YEARLY">Hàng năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phạm vi cơ sở</label>
                    <select
                      value={formData.campusScope || "ALL"}
                      onChange={(e) => setFormData({ ...formData, campusScope: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="ALL">Tất cả các cơ sở (Toàn hệ thống)</option>
                      <option value="CS1">Cơ sở 1 (Trung tâm)</option>
                      <option value="CS2">Cơ sở 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSmartModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveObjective}
                disabled={isPending || submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {isPending || submitting ? "Đang lưu..." : editingObjective ? "Cập Nhật Mục Tiêu" : "Lưu Mục Tiêu SMART"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Update Actual Value Modal */}
      {showQuickUpdateModal && quickUpdateObj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Cập Nhật Kết Quả Thực Tế</h3>
              <button onClick={() => setShowQuickUpdateModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-800">{quickUpdateObj.title}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Chỉ số: <span className="font-medium text-slate-700">{quickUpdateObj.metricName}</span> | Mục tiêu:{" "}
                  <span className="font-bold text-blue-600">
                    {quickUpdateObj.targetValue}
                    {quickUpdateObj.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá trị thực tế mới ({quickUpdateObj.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={quickActualVal}
                  onChange={(e) => setQuickActualVal(e.target.value)}
                  placeholder="Nhập giá trị đo lường..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-base font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowQuickUpdateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleQuickUpdate}
                disabled={isPending || submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
              >
                {isPending || submitting ? "Đang lưu..." : "Cập Nhật Ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      {showEvidenceModal && selectedObjForEvidence && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-800">Minh Chứng Kết Quả Mục Tiêu</h3>
              </div>
              <button onClick={() => setShowEvidenceModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="text-sm font-semibold text-slate-800 bg-teal-50 p-3 rounded-xl border border-teal-200 text-teal-900">
                Mục tiêu: {selectedObjForEvidence.title}
              </div>

              {/* Add Evidence Form */}
              <div className="space-y-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Thêm Minh Chứng Mới</h4>
                <div>
                  <input
                    type="text"
                    placeholder="Tên tài liệu / minh chứng *"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Đường dẫn file URL (nếu có)"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    placeholder="Ghi chú minh chứng..."
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  ></textarea>
                </div>
                <button
                  onClick={handleAddEvidence}
                  disabled={isPending || submitting}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {isPending || submitting ? "Đang lưu..." : "Lưu Minh Chứng"}
                </button>
              </div>

              {/* List of existing evidences */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Danh sách minh chứng đã nộp</h4>
                {!selectedObjForEvidence.evidences || selectedObjForEvidence.evidences.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Chưa có minh chứng nào được nộp.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedObjForEvidence.evidences.map((ev: any) => (
                      <div key={ev.id} className="p-3 border border-slate-200 rounded-lg bg-white flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{ev.title}</div>
                          {ev.description && <div className="text-xs text-slate-500">{ev.description}</div>}
                          <div className="text-[11px] text-slate-400 mt-1">
                            Đăng bởi {ev.uploadedBy || "Hệ thống"} - {new Date(ev.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </div>
                        {ev.fileUrl && (
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Xem file <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Lịch Sử Điều Chỉnh Audit Log</h3>
              </div>
              <button onClick={() => setShowHistoryDrawer(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="text-sm font-semibold text-slate-800 bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900">
                Mục tiêu: {historyObjTitle}
              </div>

              {historyList.length === 0 ? (
                <div className="text-sm text-slate-400 italic text-center py-8">Chưa có nhật ký ghi nhận.</div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 py-2">
                  {historyList.map((item) => (
                    <div key={item.id} className="ml-4 relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
                      <div className="text-xs text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        Thực tế: {item.previousActual !== null ? item.previousActual : "--"} &rarr;{" "}
                        <span className="text-blue-600 font-bold">{item.newActual}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Tỷ lệ hoàn thành: <span className="font-bold text-slate-700">{item.completionRate}%</span> ({item.status})
                      </div>
                      {item.note && <div className="text-xs italic text-slate-500 bg-slate-50 p-2 rounded mt-1">{item.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Nhập Kế Hoạch Năm Học / Mục Tiêu Từ Excel & CSV</h3>
              </div>
              <button onClick={() => setShowExcelImportModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 gap-4">
                <button
                  onClick={() => setActiveImportTab("FILE")}
                  className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
                    activeImportTab === "FILE"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tải lên File Excel / CSV (.xlsx, .xls, .csv)
                </button>
                <button
                  onClick={() => setActiveImportTab("JSON")}
                  className={`pb-2.5 text-sm font-semibold border-b-2 transition ${
                    activeImportTab === "JSON"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Nhập mã JSON trực tiếp
                </button>
              </div>

              {activeImportTab === "FILE" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Hỗ trợ các định dạng file: <strong>.xlsx, .xls, .csv</strong></span>
                    <button
                      onClick={downloadSampleTemplate}
                      className="flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải File Excel Mẫu
                    </button>
                  </div>

                  {/* File Upload Zone */}
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-emerald-50/30 cursor-pointer transition">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="text-sm font-semibold text-slate-700">
                      {importFileName ? `File đã chọn: ${importFileName}` : "Nhấp hoặc kéo thả file Excel / CSV vào đây"}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">Các cột chuẩn: Mã, Tên mục tiêu, Nhóm mục tiêu, Chỉ số, Đơn vị, Mục tiêu, Thực tế, Người chịu trách nhiệm...</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Preview Parsed Items */}
                  {parsedImportData.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Danh Sách Đã Trích Xuất ({parsedImportData.length} mục tiêu)</span>
                        <span className="text-emerald-600">Sẵn sàng nhập vào cơ sở dữ liệu</span>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                        {parsedImportData.map((item, idx) => (
                          <div key={idx} className="p-2.5 text-xs flex justify-between items-center hover:bg-slate-50">
                            <div>
                              <span className="font-mono font-bold text-blue-600 mr-2">{item.code}</span>
                              <span className="font-semibold text-slate-800">{item.title}</span>
                              {item.metricName && <span className="text-slate-400 ml-2">({item.metricName})</span>}
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-700">{item.targetValue}{item.unit}</span>
                              {item.responsiblePerson && <div className="text-[11px] text-slate-400">{item.responsiblePerson}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">
                    Dán danh sách các mục tiêu theo mảng JSON:
                  </p>
                  <textarea
                    rows={8}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder={`[
  {
    "code": "MTC-2026-EX1",
    "title": "Chỉ số hoàn thành chương trình môn học",
    "category": "PROGRAM_COMPLETION",
    "metricName": "Tỷ lệ lớp hoàn thành đúng tiến độ",
    "unit": "%",
    "targetValue": 98,
    "actualValue": 95,
    "responsiblePerson": "Phòng Đào Tạo"
  }
]`}
                    className="w-full font-mono text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                  ></textarea>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowExcelImportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleImportExcelJson}
                disabled={isPending || submitting || (activeImportTab === "FILE" && parsedImportData.length === 0)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
              >
                {isPending || submitting ? "Đang xử lý..." : "Bắt Đầu Nhập Dữ Liệu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
