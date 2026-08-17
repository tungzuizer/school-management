"use client";

import { useEffect, useState, useCallback } from "react";
import { getVPLessonPlans, vpReviewLessonPlan } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { BookOpen, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Mới nộp (Chờ duyệt)", color: "bg-amber-100 text-amber-800" },
  HEAD_APPROVED: { label: "Tổ trưởng đã duyệt", color: "bg-cyan-100 text-cyan-800" },
  VP_APPROVED: { label: "Phó HT đã duyệt", color: "bg-emerald-100 text-emerald-800" },
  VP_REJECTED: { label: "Phó HT từ chối", color: "bg-rose-100 text-rose-800" },
  APPROVED: { label: "Đã duyệt hoàn tất", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Bị từ chối", color: "bg-rose-100 text-rose-700" },
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

  useEffect(() => { loadData(); }, [loadData]);

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
    <div className="space-y-6 max-w-5xl">
      {ToastComponent}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Phê duyệt Giáo án (Phó Hiệu trưởng)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Duyệt giáo án của các môn học phụ trách • {pendingCount > 0 && <span className="text-amber-600 font-semibold">{pendingCount} giáo án chờ duyệt</span>}
        </p>
      </div>

      {/* Flow Indicator */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800">
        <strong>Quy trình:</strong> GV nộp → <span className="font-semibold">Tổ trưởng CM duyệt</span> → <span className="font-semibold text-indigo-600 underline">Phó HT duyệt (Bước này)</span> → Hiệu trưởng phê duyệt cuối
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Chưa có giáo án nào cần duyệt</div>
      ) : (
        <div className="space-y-3">
          {plans.map(p => {
            const isExpanded = expanded === p.id;
            const canReview = p.status === "HEAD_APPROVED" || p.status === "SUBMITTED";
            const statusInfo = STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-800" };

            return (
              <div key={p.id} className="bg-white rounded-xl border shadow-2xs overflow-hidden">
                {/* Header */}
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <p className="text-xs text-gray-500">
                      GV: {p.teacherName} • {p.subjectName} • {p.className} • Tuần {p.weekNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t space-y-4 pt-3">
                    {/* Google Drive Link if present */}
                    {p.driveFileUrl && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                        <span className="font-semibold text-blue-900 text-xs">File giáo án đính kèm Google Drive:</span>
                        <a
                          href={p.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở File Drive ↗</span>
                        </a>
                      </div>
                    )}

                    {/* Content preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-xs text-gray-500 block mb-1">Mục tiêu:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-100">{p.objectives || "—"}</p></div>
                      <div><span className="text-xs text-gray-500 block mb-1">Nội dung:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-slate-50 p-2.5 rounded-lg border border-slate-100">{p.content || "—"}</p></div>
                    </div>

                    {/* Review history */}
                    {p.reviews.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Lịch sử duyệt</h4>
                        <div className="space-y-1.5">
                          {p.reviews.map(r => (
                            <div key={r.id} className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg p-2">
                              <span className="font-semibold text-gray-700">{ROLE_LABEL[r.reviewerRole] || r.reviewerRole}:</span>
                              <span className="text-gray-600">{r.reviewerName} — {r.comment || "(không có nhận xét)"}</span>
                              <span className="ml-auto text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
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
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        <div className="flex gap-3">
                          <button onClick={() => handleReview(p.id, true)} disabled={reviewing === p.id}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                            <CheckCircle className="w-4 h-4" /> {reviewing === p.id ? "Đang xử lý..." : "Duyệt"}
                          </button>
                          <button onClick={() => handleReview(p.id, false)} disabled={reviewing === p.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
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
