"use client";

import { useEffect, useState, useCallback } from "react";
import { getVPLessonPlans, vpReviewLessonPlan } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Mới nộp (Chờ duyệt)", color: "badge-glowing-amber font-extrabold" },
  HEAD_APPROVED: { label: "Tổ trưởng đã duyệt", color: "bg-cyan-100 text-cyan-800 border border-cyan-300 font-extrabold" },
  VP_APPROVED: { label: "Phó HT đã duyệt", color: "badge-glowing-sky font-extrabold" },
  VP_REJECTED: { label: "Phó HT từ chối", color: "badge-glowing-rose font-extrabold" },
  APPROVED: { label: "Đã duyệt hoàn tất", color: "badge-glowing-emerald font-extrabold" },
  REJECTED: { label: "Bị từ chối", color: "badge-glowing-rose font-extrabold" },
};

interface Review {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  action: string;
  comment: string;
  createdAt: string;
}

interface Plan {
  id: string;
  teacherName: string;
  subjectName: string;
  className: string;
  weekNumber: number;
  title: string;
  objectives: string;
  content: string;
  status: string;
  driveFileUrl: string | null;
  reviews: Review[];
}

const ROLE_LABEL: Record<string, string> = {
  SUBJECT_HEAD: "Tổ trưởng CM",
  VICE_PRINCIPAL: "Phó Hiệu trưởng",
  ADMIN: "Hiệu trưởng",
};

export default function VPLessonPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getVPLessonPlans();
    setPlans(res as unknown as Plan[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const handleReview = async (planId: string, approved: boolean) => {
    setReviewing(planId);
    const res = await vpReviewLessonPlan({ planId, approved, reviewNote });
    setReviewing(null);
    if (res.success) {
      showToast(approved ? "Đã duyệt giáo án" : "Đã từ chối giáo án", "success");
      setReviewNote("");
      setExpanded(null);
      loadData();
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
  };

  const pendingCount = plans.filter(p => p.status === "HEAD_APPROVED" || p.status === "SUBMITTED").length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {ToastComponent}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Phê duyệt Giáo án (Phó Hiệu trưởng)</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Duyệt giáo án của các môn học phụ trách • {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} giáo án chờ duyệt</span>}
        </p>
      </div>

      {/* Flow Indicator */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed">
        <strong>Quy trình:</strong> GV nộp → <span className="font-semibold">Tổ trưởng CM duyệt</span> → <span className="font-semibold text-indigo-600 underline">Phó HT duyệt (Bước này)</span> → Hiệu trưởng phê duyệt cuối
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-xs text-slate-400 mt-2 font-semibold">Đang tải danh sách giáo án...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border text-gray-400 text-xs sm:text-sm">Chưa có giáo án nào cần duyệt</div>
      ) : (
        <div className="space-y-3">
          {plans.map(p => {
            const isExpanded = expanded === p.id;
            const canReview = p.status === "HEAD_APPROVED" || p.status === "SUBMITTED";
            const statusInfo = STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-800" };

            return (
              <div key={p.id} className="bg-white rounded-xl sm:rounded-2xl border shadow-2xs overflow-hidden interactive-card">
                {/* Header */}
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="w-full text-left p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50/80 transition-colors">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{p.title}</h3>
                    <p className="text-xs text-gray-500">
                      GV: <strong>{p.teacherName}</strong> • {p.subjectName} • Lớp {p.className} • Tuần {p.weekNumber}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-5 border-t space-y-4 pt-3 bg-slate-50/60">
                    {/* Google Drive Link if present */}
                    {p.driveFileUrl && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <span className="font-semibold text-blue-900 text-xs">File giáo án đính kèm Google Drive:</span>
                        <a
                          href={p.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở File Drive ↗</span>
                        </a>
                      </div>
                    )}

                    {/* Content preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-xs font-bold text-gray-500 block mb-1">Mục tiêu:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 min-h-[40px]">{p.objectives || "—"}</p></div>
                      <div><span className="text-xs font-bold text-gray-500 block mb-1">Nội dung:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 min-h-[40px]">{p.content || "—"}</p></div>
                    </div>

                    {/* Review history */}
                    {p.reviews.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Lịch sử duyệt</h4>
                        <div className="space-y-2">
                          {p.reviews.map(r => (
                            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs bg-white rounded-xl p-3 border border-slate-200">
                              <div>
                                <span className="font-bold text-slate-800">{ROLE_LABEL[r.reviewerRole] || r.reviewerRole}: </span>
                                <span className="text-slate-700">{r.reviewerName}</span>
                                {r.comment && <p className="text-slate-500 italic mt-0.5">&quot;{r.comment}&quot;</p>}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review form */}
                    {canReview && (
                      <div className="pt-3 border-t space-y-3">
                        <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2}
                          placeholder="Nhận xét của Phó Hiệu trưởng..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <button onClick={() => handleReview(p.id, true)} disabled={reviewing === p.id}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]">
                            <CheckCircle className="w-4 h-4" /> {reviewing === p.id ? "Đang xử lý..." : "Duyệt Giáo Án"}
                          </button>
                          <button onClick={() => handleReview(p.id, false)} disabled={reviewing === p.id}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 min-h-[44px]">
                            <XCircle className="w-4 h-4" /> Từ chối
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
