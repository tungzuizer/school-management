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
import FileUploader, { UploadedFileResult } from "@/components/storage/FileUploader";
import FileViewerModal from "@/components/storage/FileViewerModal";
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
  Download,
  Eye,
  File,
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
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
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

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function TeacherLessonPlansPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
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

  // File upload states
  const [formFileUrl, setFormFileUrl] = useState<string>("");
  const [formFileName, setFormFileName] = useState<string>("");
  const [formFileSize, setFormFileSize] = useState<number>(0);
  const [formFileType, setFormFileType] = useState<string>("");
  const [formSaving, setFormSaving] = useState(false);

  // In-app Document Viewer Modal State
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{
    url: string;
    name: string;
    title: string;
  } | null>(null);

  // Detail viewer states
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const fetchMetadataAndPlans = useCallback(async () => {
    setLoading(true);
    try {
      const meta = await getLessonPlanMetadata();
      setClasses(meta.classes || []);
      setSubjects(meta.subjects || []);
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
  }, [showToast]);

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
    setFormFileUrl("");
    setFormFileName("");
    setFormFileSize(0);
    setFormFileType("");
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
    setFormFileUrl(plan.fileUrl || "");
    setFormFileName(plan.fileName || "");
    setFormFileSize(plan.fileSize || 0);
    setFormFileType(plan.fileType || "");
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
        fileUrl: formFileUrl || undefined,
        fileName: formFileName || undefined,
        fileSize: formFileSize || undefined,
        fileType: formFileType || undefined,
      });

      if (res.success) {
        showToast(editingPlan?.id ? "Đã cập nhật giáo án" : "Đã tạo giáo án mới", "success");
        setIsModalOpen(false);
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

  const handleOpenFileViewer = (p: LessonPlanItem) => {
    if (!p.fileUrl) return;
    setViewingFile({
      url: p.fileUrl,
      name: p.fileName || "Tài liệu giáo án",
      title: p.title,
    });
    setViewerModalOpen(true);
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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-slate-800">Bản nháp</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {ToastComponent}

      {/* In-App Document Viewer Modal */}
      <FileViewerModal
        isOpen={viewerModalOpen}
        onClose={() => setViewerModalOpen(false)}
        fileUrl={viewingFile?.url || null}
        fileName={viewingFile?.name}
        title={viewingFile?.title}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Kế Hoạch Bài Dạy (Giáo Án)</h1>
          <p className="text-xs text-slate-600 mt-1">Soạn thảo giáo án và tải lên file trực tiếp để Ban Giám Hiệu phê duyệt</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 min-h-[44px] rounded-xl flex items-center justify-center font-bold text-xs shadow-xs active-press cursor-pointer gap-1.5"
          title="Tạo giáo án mới"
        >
          <Plus className="w-5 h-5" />
          <span>Soạn giáo án</span>
        </button>
      </div>

      {/* Easy mode tips */}
      {isEasyMode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-emerald-600" />
          <div className="space-y-1">
            <p className="font-semibold">Trợ giúp Soạn Giáo Án:</p>
            <p>1. Chọn nút "Soạn giáo án" phía trên để tạo bài giảng mới hoặc đính kèm tệp PDF/Word.</p>
            <p>2. Viết xong hãy nhấn "Gửi phê duyệt" để BGH nhà trường kiểm tra trực tiếp.</p>
            <p>3. Nhấn vào giáo án để xem chi tiết hoặc mở xem trước tệp tài liệu PDF trực tuyến.</p>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-600">Đang tải giáo án...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Chưa có giáo án nào được soạn</p>
            <p className="text-xs text-slate-500 mt-1">Hãy bấm nút "Soạn giáo án" ở trên để bắt đầu.</p>
          </div>
        ) : (
          plans.map((p) => {
            const isExpanded = expandedPlanId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-xs hover:border-slate-300"
              >
                {/* Header card info */}
                <div
                  onClick={() => toggleExpand(p.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Tuần {p.weekNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Lớp {p.className} • Tiết {p.periodStart === p.periodEnd ? p.periodStart : `${p.periodStart}-${p.periodEnd}`}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span>Môn: {p.subjectName}</span>
                      {p.fileName && (
                        <span className="text-indigo-600 flex items-center gap-1 font-semibold">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">{p.fileName}</span>
                          {p.fileSize ? `(${formatBytes(p.fileSize)})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(p.status)}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4 text-xs text-slate-800">
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

                    {/* Attached File Banner & Viewer Button */}
                    {p.fileUrl && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            {p.fileName?.endsWith(".pdf") ? (
                              <FileText className="w-4 h-4 text-rose-500" />
                            ) : (
                              <File className="w-4 h-4 text-indigo-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate max-w-xs sm:max-w-md">
                              {p.fileName || "Tệp giáo án đính kèm"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {p.fileSize ? formatBytes(p.fileSize) : "Tệp tài liệu"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenFileViewer(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem trực tuyến</span>
                          </button>
                          <a
                            href={p.fileUrl}
                            download={p.fileName || "giao-an"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải về</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <span className="font-bold text-slate-600 block mb-1">Mục tiêu bài dạy (Objectives):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.objectives || "Chưa nhập mục tiêu"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block mb-1">Nội dung bài học (Content):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.content || "Chưa nhập nội dung"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block mb-1">Hoạt động dạy học (Activities):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.activities || "Chưa nhập hoạt động"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block mb-1">Thiết bị dạy học (Materials):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.materials || "Chưa có danh sách thiết bị"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block mb-1">Đánh giá (Assessment):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.assessment || "Chưa nhập tiêu chí đánh giá"}
                        </p>
                      </div>

                      {p.notes && (
                        <div>
                          <span className="font-bold text-slate-600 block mb-1">Ghi chú thêm:</span>
                          <p className="bg-white rounded-lg p-2.5 border border-slate-200 whitespace-pre-line leading-relaxed">
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
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Gửi phê duyệt
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold p-2 rounded-lg transition-colors cursor-pointer"
                          title="Sửa giáo án"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold p-2 rounded-lg transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingPlan ? "Cập Nhật Giáo Án" : "Soạn Giáo Án Mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 flex-1 text-xs text-slate-800 leading-relaxed">
              {activePeriods.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kỳ nộp giáo án *</label>
                  <select
                    value={formPeriodId}
                    onChange={(e) => setFormPeriodId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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

              {/* Direct File Uploader Component */}
              <div className="space-y-1">
                <FileUploader
                  folder="lesson-plans"
                  value={formFileUrl}
                  fileName={formFileName}
                  onUploadComplete={(res: UploadedFileResult) => {
                    setFormFileUrl(res.fileUrl);
                    setFormFileName(res.fileName);
                    setFormFileSize(res.fileSize);
                    setFormFileType(res.fileType);
                  }}
                  onRemove={() => {
                    setFormFileUrl("");
                    setFormFileName("");
                    setFormFileSize(0);
                    setFormFileType("");
                  }}
                  label="Đính kèm tệp bài dạy (PDF, Word, Excel)"
                  hint="Kéo thả hoặc chọn tệp từ máy tính để lưu trực tiếp vào cơ sở dữ liệu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lớp học *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="font-bold text-slate-700">Môn học *</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                  <label className="font-bold text-slate-700">Tuần dạy học *</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={formWeekNumber}
                    onChange={(e) => setFormWeekNumber(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tiết bắt đầu *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPeriodStart}
                    onChange={(e) => setFormPeriodStart(Math.max(1, Math.min(10, Number(e.target.value))))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tiết kết thúc *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPeriodEnd}
                    onChange={(e) => setFormPeriodEnd(Math.max(formPeriodStart, Math.min(10, Number(e.target.value))))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tên bài học / Chủ đề học *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 10: Dao động điều hòa"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mục tiêu bài dạy (Kiến thức, kĩ năng)</label>
                <textarea
                  rows={2}
                  placeholder="Nhập mục tiêu học tập..."
                  value={formObjectives}
                  onChange={(e) => setFormObjectives(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nội dung bài học (Kiến thức cốt lõi)</label>
                <textarea
                  rows={2}
                  placeholder="Nhập tóm tắt kiến thức lý thuyết..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hoạt động dạy học (Khởi động, luyện tập...)</label>
                <textarea
                  rows={3}
                  placeholder="Ghi quy trình tổ chức bài học..."
                  value={formActivities}
                  onChange={(e) => setFormActivities(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Đồ dùng, thiết bị dùng cho bài dạy</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Máy chiếu, bảng nhóm, phiếu học tập số 1..."
                  value={formMaterials}
                  onChange={(e) => setFormMaterials(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Đánh giá kết quả (Bài tập về nhà, tiêu chí)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận xét và phương pháp đo lường..."
                  value={formAssessment}
                  onChange={(e) => setFormAssessment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Ghi chú bổ sung</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  {formSaving ? "Đang lưu..." : "Lưu giáo án"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
