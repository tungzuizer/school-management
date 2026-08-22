"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getLessonPlanMetadata,
  getLessonPlans,
  saveLessonPlan,
  submitLessonPlan,
  deleteLessonPlan,
} from "./actions";
import { useToast } from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  Plus,
  Edit2,
  Trash2,
  Send,
  Check,
  X,
  FileText,
  Clock,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface LessonPlanItem {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  periodId?: string;
  weekNumber: number;
  periodStart: number;
  periodEnd: number;
  title: string;
  objectives: string;
  content: string;
  activities: string;
  materials: string;
  assessment: string;
  notes: string;
  driveFileUrl?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "HEAD_APPROVED" | "HEAD_REJECTED" | "VP_APPROVED" | "VP_REJECTED";
  reviewNote: string;
  reviewedAt: Date | null;
  createdAt: Date;
}

interface ActivePeriod {
  id: string;
  label: string;
  deadline: string;
}

export default function TeacherLessonPlansPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [sharedDriveUrl, setSharedDriveUrl] = useState<string | null>(null);
  const [activePeriods, setActivePeriods] = useState<ActivePeriod[]>([]);
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<LessonPlanItem> | null>(null);
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formPeriodId, setFormPeriodId] = useState("");
  const [formWeekNumber, setFormWeekNumber] = useState<number>(1);
  const [formPeriodStart, setFormPeriodStart] = useState<number>(1);
  const [formPeriodEnd, setFormPeriodEnd] = useState<number>(1);
  const [formTitle, setFormTitle] = useState("");
  const [formObjectives, setFormObjectives] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formActivities, setFormActivities] = useState("");
  const [formMaterials, setFormMaterials] = useState("");
  const [formAssessment, setFormAssessment] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDriveFileUrl, setFormDriveFileUrl] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Detail viewer states
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const fetchMetadataAndPlans = useCallback(async () => {
    setLoading(true);
    try {
      const meta = await getLessonPlanMetadata();
      setClasses(meta.classes || []);
      setSubjects(meta.subjects || []);
      setSharedDriveUrl(meta.sharedDriveUrl || null);
      setActivePeriods(meta.activePeriods || []);

      if (meta.classes && meta.classes.length > 0) setFormClassId(meta.classes[0].id);
      if (meta.subjects && meta.subjects.length > 0) setFormSubjectId(meta.subjects[0].id);
      if (meta.activePeriods && meta.activePeriods.length > 0) setFormPeriodId(meta.activePeriods[0].id);

      const items = await getLessonPlans();
      setPlans((items as any) || []);
    } catch (e: any) {
      showToast("Lỗi khi tải thông tin giáo án", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadataAndPlans();
  }, [fetchMetadataAndPlans]);

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    if (classes.length > 0) setFormClassId(classes[0].id);
    if (subjects.length > 0) setFormSubjectId(subjects[0].id);
    if (activePeriods.length > 0) setFormPeriodId(activePeriods[0].id);
    setFormWeekNumber(1);
    setFormPeriodStart(1);
    setFormPeriodEnd(1);
    setFormTitle("");
    setFormObjectives("");
    setFormContent("");
    setFormActivities("");
    setFormMaterials("");
    setFormAssessment("");
    setFormNotes("");
    setFormDriveFileUrl("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: LessonPlanItem) => {
    setEditingPlan(plan);
    setFormSubjectId(plan.subjectId);
    setFormClassId(plan.classId);
    setFormPeriodId(plan.periodId || (activePeriods[0]?.id || ""));
    setFormWeekNumber(plan.weekNumber);
    setFormPeriodStart(plan.periodStart);
    setFormPeriodEnd(plan.periodEnd);
    setFormTitle(plan.title);
    setFormObjectives(plan.objectives);
    setFormContent(plan.content);
    setFormActivities(plan.activities);
    setFormMaterials(plan.materials);
    setFormAssessment(plan.assessment);
    setFormNotes(plan.notes);
    setFormDriveFileUrl(plan.driveFileUrl || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectId || !formClassId || !formTitle.trim()) {
      showToast("Vui lòng điền các thông tin bắt buộc (Bài học, Môn học, Lớp)", "error");
      return;
    }

    if (formPeriodStart > formPeriodEnd) {
      showToast("Tiết bắt đầu không thể lớn hơn tiết kết thúc", "error");
      return;
    }

    setFormSaving(true);
    try {
      const res = await saveLessonPlan({
        id: editingPlan?.id,
        subjectId: formSubjectId,
        classId: formClassId,
        periodId: formPeriodId || undefined,
        weekNumber: formWeekNumber,
        periodStart: formPeriodStart,
        periodEnd: formPeriodEnd,
        title: formTitle,
        objectives: formObjectives,
        content: formContent,
        activities: formActivities,
        materials: formMaterials,
        assessment: formAssessment,
        notes: formNotes,
        driveFileUrl: formDriveFileUrl,
      });

      if (res.success) {
        showToast(editingPlan?.id ? "Đã cập nhật giáo án" : "Đã tạo giáo án mới", "success");
        setIsModalOpen(false);
        // Refresh plans
        const items = await getLessonPlans();
        setPlans(items as any);
      } else {
        showToast(res.error || "Không thể lưu giáo án", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi hệ thống", "error");
    } finally {
      setFormSaving(false);
    }
  };

  const handleSubmit = async (planId: string) => {
    if (!confirm("Sau khi gửi phê duyệt, giáo án sẽ không thể sửa đổi cho đến khi được duyệt hoặc từ chối. Bạn chắc chắn muốn gửi?")) return;
    try {
      const res = await submitLessonPlan(planId);
      if (res.success) {
        showToast("Đã gửi giáo án phê duyệt thành công", "success");
        const items = await getLessonPlans();
        setPlans(items as any);
      } else {
        showToast(res.error || "Gửi phê duyệt thất bại", "error");
      }
    } catch (e) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa giáo án này?")) return;
    try {
      const res = await deleteLessonPlan(planId);
      if (res.success) {
        showToast("Đã xóa giáo án thành công", "success");
        const items = await getLessonPlans();
        setPlans(items as any);
      } else {
        showToast(res.error || "Xóa giáo án thất bại", "error");
      }
    } catch (e) {
      showToast("Lỗi hệ thống", "error");
    }
  };

  const toggleExpand = (planId: string) => {
    if (expandedPlanId === planId) {
      setExpandedPlanId(null);
    } else {
      setExpandedPlanId(planId);
    }
  };

  const getStatusBadge = (status: LessonPlanItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1"><Check className="w-3 h-3" /> Đã duyệt</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1"><X className="w-3 h-3" />Từ chối</span>;
      case "SUBMITTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><Clock className="w-3 h-3" />Chờ duyệt</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Bản nháp</span>;
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {ToastComponent}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Kế Hoạch Bài Dạy (Giáo Án)</h1>
          <p className="text-xs text-gray-500 mt-1">Soạn thảo giáo án và nộp qua Google Drive để Ban Giám Hiệu phê duyệt</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm transition-colors"
          title="Tạo giáo án mới"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Shared Google Drive Link Banner */}
      {sharedDriveUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Thư mục Google Drive trường:</strong> Hãy tải file bài dạy lên Drive trường trước khi nộp.
            </span>
          </div>
          <a
            href={sharedDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shrink-0"
          >
            Mở Drive Trường ↗
          </a>
        </div>
      )}

      {/* Easy mode tips */}
      {isEasyMode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-emerald-600" />
          <div className="space-y-1">
            <p className="font-semibold">Trợ giúp Soạn Giáo Án:</p>
            <p>1. Chọn nút dấu "+" phía trên để soạn giáo án mới.</p>
            <p>2. Viết xong hãy nhấn "Gửi duyệt" để BGH nhà trường kiểm tra.</p>
            <p>3. Ấn vào từng dòng giáo án ở dưới để xem chi tiết học, mục tiêu, hoạt động hoặc lý do từ chối (nếu có).</p>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Đang tải giáo án...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl p-6">
            <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Chưa có giáo án nào được soạn</p>
            <p className="text-xs text-gray-400 mt-1">Hãy bấm nút dấu "+" ở trên để bắt đầu soạn bài.</p>
          </div>
        ) : (
          plans.map((p) => {
            const isExpanded = expandedPlanId === p.id;
            return (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl overflow-hidden transition-all duration-200"
              >
                {/* Header card info */}
                <div
                  onClick={() => toggleExpand(p.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-950/80 transition-colors"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Tuần {p.weekNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        Lớp {p.className} • Tiết {p.periodStart === p.periodEnd ? p.periodStart : `${p.periodStart}-${p.periodEnd}`}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                      {p.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Môn: {p.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(p.status)}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-slate-950/80 p-4 space-y-4 text-xs text-gray-700">
                    {p.status === "REJECTED" && p.reviewNote && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800">
                        <p className="font-semibold">Nhận xét từ BGH (Không duyệt):</p>
                        <p className="mt-1">{p.reviewNote}</p>
                      </div>
                    )}
                    
                    {p.status === "APPROVED" && p.reviewNote && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-800">
                        <p className="font-semibold">Ghi nhận từ BGH:</p>
                        <p className="mt-1">{p.reviewNote}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Mục tiêu bài dạy (Objectives):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.objectives || "Chưa nhập mục tiêu"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Nội dung bài học (Content):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.content || "Chưa nhập nội dung"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Hoạt động dạy học (Activities):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.activities || "Chưa nhập hoạt động"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Thiết bị dạy học (Materials):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.materials || "Chưa có danh sách thiết bị"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Đánh giá (Assessment):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.assessment || "Chưa nhập tiêu chí đánh giá"}
                        </p>
                      </div>

                      {p.notes && (
                        <div>
                          <span className="font-bold text-gray-500 block mb-1">Ghi chú thêm:</span>
                          <p className="bg-white rounded-lg p-2.5 border border-gray-100 whitespace-pre-line leading-relaxed">
                            {p.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (only displayed/enabled if editable) */}
                    {(p.status === "DRAFT" || p.status === "REJECTED") && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleSubmit(p.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi phê duyệt
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold p-2 rounded-lg transition-colors"
                          title="Sửa giáo án"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 font-semibold p-2 rounded-lg transition-colors"
                          title="Xóa giáo án"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Write/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {editingPlan ? "Cập Nhật Giáo Án" : "Soạn Giáo Án Mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 flex-1 text-xs text-gray-700 leading-relaxed">
              {activePeriods.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Kỳ nộp giáo án *</label>
                  <select
                    value={formPeriodId}
                    onChange={(e) => setFormPeriodId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    {activePeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.label} (Hạn nộp: {new Date(period.deadline).toLocaleDateString("vi-VN")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Link Google Drive file giáo án (Word / Docs / PDF)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={formDriveFileUrl}
                  onChange={(e) => setFormDriveFileUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-400">Dán đường dẫn chia sẻ file trên Google Drive trường để BGH kiểm tra trực tiếp.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Lớp học *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Môn học *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Tuần dạy học *</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={formWeekNumber}
                    onChange={(e) => setFormWeekNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Tiết bắt đầu *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPeriodStart}
                    onChange={(e) => setFormPeriodStart(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Tiết kết thúc *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPeriodEnd}
                    onChange={(e) => setFormPeriodEnd(Math.max(formPeriodStart, Math.min(10, Number(e.target.value))))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Tên bài học / Chủ đề học *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 10: Dao động điều hòa"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Mục tiêu bài dạy (Kiến thức, kĩ năng)</label>
                <textarea
                  rows={2}
                  placeholder="Nhập mục tiêu học tập..."
                  value={formObjectives}
                  onChange={(e) => setFormObjectives(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Nội dung bài học (Kiến thức cốt lõi)</label>
                <textarea
                  rows={2}
                  placeholder="Nhập tóm tắt kiến thức lý thuyết..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Hoạt động dạy học (Khởi động, luyện tập...)</label>
                <textarea
                  rows={3}
                  placeholder="Ghi quy trình tổ chức bài học..."
                  value={formActivities}
                  onChange={(e) => setFormActivities(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Đồ dùng, thiết bị dùng cho bài dạy</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Máy chiếu, bảng nhóm, phiếu học tập số 1..."
                  value={formMaterials}
                  onChange={(e) => setFormMaterials(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Đánh giá kết quả (Bài tập về nhà, tiêu chí)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận xét và phương pháp đo lường..."
                  value={formAssessment}
                  onChange={(e) => setFormAssessment(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  {formSaving ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
