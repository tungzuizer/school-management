"use client";

import { useState, useCallback } from "react";
import { getHeadSubjectsAndRequests, reviewTeacherChangeRequest, getHeadLessonPlans, headReviewLessonPlan } from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Check, X, Shield, BookOpen, Clock, AlertCircle, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, MessageSquare, ExternalLink } from "lucide-react";

interface RequestData {
  id: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "CANCELLED";
  reviewNote?: string | null;
  createdAt: any;
  subject: { id: string; name: string };
  classRoom: { id: string; name: string; gradeLevel: number };
  currentTeacher: { id: string; user: { name: string } };
  newTeacher: { id: string; user: { name: string } };
  requestedBy: { id: string; user: { name: string } };
  approvedBy?: { id: string; user: { name: string } } | null;
}

interface HeadSubject {
  id: string;
  name: string;
  gradeLevel: number | null;
  _count: { teachingAssignments: number };
}

interface SubjectHeadClientProps {
  initialHeadSubjects: HeadSubject[];
  initialRequests: RequestData[];
  initialLessonPlans: LessonPlanData[];
}

interface LessonPlanData {
  id: string;
  teacherName: string;
  subjectName: string;
  className: string;
  weekNumber: number;
  title: string;
  objectives: string;
  content: string;
  status: string;
  driveFileUrl?: string | null;
  reviews: { id: string; reviewerName: string; reviewerRole: string; action: string; comment: string; createdAt: string }[];
}

const LP_STATUS_MAP: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Chờ Tổ trưởng duyệt", color: "bg-amber-100 text-amber-800" },
  HEAD_APPROVED: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
  HEAD_REJECTED: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
};

export default function SubjectHeadClient({ initialHeadSubjects, initialRequests, initialLessonPlans }: SubjectHeadClientProps) {
  const [headSubjects, setHeadSubjects] = useState<HeadSubject[]>(initialHeadSubjects);
  const [requests, setRequests] = useState<RequestData[]>(initialRequests);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanData[]>(initialLessonPlans);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestData | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"subjects" | "requests" | "lesson-plans">("lesson-plans");
  const [expandedLP, setExpandedLP] = useState<string | null>(null);
  const [lpReviewNote, setLpReviewNote] = useState("");
  const [lpReviewing, setLpReviewing] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [res, lp] = await Promise.all([getHeadSubjectsAndRequests(), getHeadLessonPlans()]);
    setHeadSubjects(res.headSubjects as any);
    setRequests(res.requests as any);
    setLessonPlans(lp as any);
    setLoading(false);
  }, []);

  const handleReview = async (approved: boolean) => {
    if (!selectedReq) return;
    setSubmitting(true);
    const res = await reviewTeacherChangeRequest({
      requestId: selectedReq.id,
      approved,
      reviewNote: reviewNote.trim() || undefined,
    });
    setSubmitting(false);
    if (res.success) {
      showToast(approved ? "Đã duyệt đổi giáo viên thành công!" : "Đã từ chối yêu cầu đổi giáo viên");
      setSelectedReq(null);
      setReviewNote("");
      loadData();
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleLPReview = async (planId: string, approved: boolean) => {
    setLpReviewing(planId);
    const res = await headReviewLessonPlan({ planId, approved, reviewNote: lpReviewNote });
    setLpReviewing(null);
    if (res.success) {
      showToast(approved ? "Đã duyệt giáo án" : "Đã từ chối giáo án", "success");
      setLpReviewNote("");
      setExpandedLP(null);
      loadData();
    } else {
      showToast(res.error || "Có lỗi xảy ra", "error");
    }
  };

  const pendingLPCount = lessonPlans.filter(p => p.status === "SUBMITTED").length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {ToastComponent}

      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300 shrink-0" />
          <h1 className="text-lg sm:text-2xl font-bold">Quản lý Bộ môn (Tổ Trưởng Chuyên Môn)</h1>
        </div>
        <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl">
          Duyệt giáo án chuyên môn, thẩm định đề xuất thay đổi giáo viên và quản lý bộ môn phụ trách.
        </p>
      </div>

      {/* Tabs with scroll for mobile */}
      <div className="flex overflow-x-auto whitespace-nowrap gap-1 bg-gray-100 rounded-xl p-1 no-scrollbar">
        <button onClick={() => setActiveTab("lesson-plans")}
          className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${activeTab === "lesson-plans" ? "bg-white text-indigo-700 shadow-2xs" : "text-gray-600 hover:bg-gray-200"}`}>
          <FileText className="inline w-4 h-4 mr-1.5" />
          Giáo án chờ duyệt {pendingLPCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">{pendingLPCount}</span>}
        </button>
        <button onClick={() => setActiveTab("requests")}
          className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${activeTab === "requests" ? "bg-white text-indigo-700 shadow-2xs" : "text-gray-600 hover:bg-gray-200"}`}>
          <Clock className="inline w-4 h-4 mr-1.5" />
          Đổi giáo viên
        </button>
        <button onClick={() => setActiveTab("subjects")}
          className={`flex-1 min-w-[130px] px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition shrink-0 ${activeTab === "subjects" ? "bg-white text-indigo-700 shadow-2xs" : "text-gray-600 hover:bg-gray-200"}`}>
          <BookOpen className="inline w-4 h-4 mr-1.5" />
          Môn học phụ trách
        </button>
      </div>

      {/* ====== TAB: GIÁO ÁN CHỜ DUYỆT ====== */}
      {activeTab === "lesson-plans" && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xs border p-3.5 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Giáo án Chuyên môn chờ Duyệt
            </h2>
          </div>

          {/* Flow */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 mb-4 leading-relaxed">
            <strong>Quy trình:</strong> GV nộp → <span className="font-semibold text-indigo-600 underline">Tổ trưởng CM duyệt (Bước này)</span> → Phó HT duyệt → Hiệu trưởng phê duyệt cuối
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2 font-semibold">Đang tải danh sách giáo án...</p>
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border text-gray-400 text-xs sm:text-sm">Không có giáo án nào thuộc môn bạn phụ trách</div>
          ) : (
            <div className="space-y-3">
              {lessonPlans.map(p => {
                const isExpanded = expandedLP === p.id;
                const canReview = p.status === "SUBMITTED";
                const statusInfo = LP_STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-800" };

                return (
                  <div key={p.id} className="border rounded-xl overflow-hidden bg-white">
                    <button onClick={() => setExpandedLP(isExpanded ? null : p.id)} className="w-full text-left p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50/80 transition-colors">
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{p.title}</h3>
                        <p className="text-xs text-gray-500">GV: <strong>{p.teacherName}</strong> • {p.subjectName} • Lớp {p.className} • Tuần {p.weekNumber}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 sm:p-5 border-t space-y-4 bg-slate-50/60">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-xs font-bold text-gray-500 block mb-1">Mục tiêu bài dạy:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 min-h-[40px]">{p.objectives || "—"}</p></div>
                          <div><span className="text-xs font-bold text-gray-500 block mb-1">Nội dung học tập:</span><p className="text-gray-700 text-xs whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-200 min-h-[40px]">{p.content || "—"}</p></div>
                        </div>

                        {p.reviews && p.reviews.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Lịch sử duyệt</h4>
                            {p.reviews.map(r => (
                              <div key={r.id} className="text-xs bg-white rounded-xl p-3 border border-slate-200 mb-1.5">
                                <span className="font-bold text-gray-700">{r.reviewerName}</span>: {r.comment || "(không có nhận xét)"}
                              </div>
                            ))}
                          </div>
                        )}

                        {canReview && (
                          <div className="pt-3 border-t space-y-3">
                            <textarea value={lpReviewNote} onChange={e => setLpReviewNote(e.target.value)} rows={2}
                              placeholder="Nhận xét chuyên môn của Tổ trưởng..."
                              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white outline-none" />
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <button onClick={() => handleLPReview(p.id, true)} disabled={lpReviewing === p.id}
                                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]">
                                <CheckCircle className="w-4 h-4" /> {lpReviewing === p.id ? "Đang xử lý..." : "Duyệt chuyên môn"}
                              </button>
                              <button onClick={() => handleLPReview(p.id, false)} disabled={lpReviewing === p.id}
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
      )}

      {/* ====== TAB: MÔN HỌC PHỤ TRÁCH ====== */}
      {activeTab === "subjects" && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xs border p-3.5 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Môn học phụ trách ({headSubjects.length})
        </h2>
        {loading ? (
          <p className="text-gray-500 text-xs">Đang tải...</p>
        ) : headSubjects.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Bạn hiện chưa được phân công làm Trưởng bộ môn cho môn học nào.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {headSubjects.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-sm sm:text-base">{s.name}</span>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 font-bold">
                      {s.gradeLevel ? `Khối ${s.gradeLevel}` : "Tất cả khối"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">👑 Trưởng bộ môn: Phụ trách chuyên môn & phân công</p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-100 text-xs text-indigo-700 font-medium">
                  {s._count.teachingAssignments} phân công dạy
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ====== TAB: YÊU CẦU ĐỔI GIÁO VIÊN ====== */}
      {activeTab === "requests" && (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xs border p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Yêu cầu thay đổi Giáo viên
          </h2>
          <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
            {requests.filter(r => r.status === "PENDING").length} chờ duyệt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b text-[10px] sm:text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 sm:px-4 py-2.5">Môn học</th>
                <th className="px-3 sm:px-4 py-2.5">Lớp học</th>
                <th className="px-3 sm:px-4 py-2.5">GV hiện tại</th>
                <th className="px-3 sm:px-4 py-2.5">GV đề xuất</th>
                <th className="px-3 sm:px-4 py-2.5">Trạng thái</th>
                <th className="px-3 sm:px-4 py-2.5 text-right">Quyết định</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs sm:text-sm">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chưa có yêu cầu</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 font-semibold text-gray-900">{r.subject.name}</td>
                    <td className="px-3 sm:px-4 py-3 text-gray-600">{r.classRoom.name}</td>
                    <td className="px-3 sm:px-4 py-3 text-rose-600 font-semibold">{r.currentTeacher.user.name}</td>
                    <td className="px-3 sm:px-4 py-3 text-emerald-600 font-semibold">{r.newTeacher.user.name}</td>
                    <td className="px-3 sm:px-4 py-3">
                      {r.status === "PENDING" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Chờ duyệt</span>}
                      {r.status === "APPROVED" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã đồng ý</span>}
                      {r.status === "CANCELLED" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Từ chối</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <button onClick={() => { setSelectedReq(r); setReviewNote(""); }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-2xs">
                          Xem xét
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Review */}
      <Modal isOpen={!!selectedReq} onClose={() => setSelectedReq(null)} title="Quyết định đổi giáo viên" size="md">
        {selectedReq && (
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Môn học:</span>
                <span className="font-semibold text-gray-900">{selectedReq.subject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GV hiện tại:</span>
                <span className="font-semibold text-rose-600">{selectedReq.currentTeacher.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GV mới:</span>
                <span className="font-semibold text-emerald-600">{selectedReq.newTeacher.user.name}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-500">Lý do:</span>
                <span className="text-gray-800 italic">{selectedReq.reason || "Không có"}</span>
              </div>
            </div>
            <textarea rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Nhận xét Tổ trưởng..." className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t">
              <button onClick={() => setSelectedReq(null)} className="w-full sm:w-auto px-4 py-2 border rounded-xl text-xs font-bold hover:bg-gray-50">Đóng</button>
              <button disabled={submitting} onClick={() => handleReview(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                <X className="w-4 h-4" /> Từ chối
              </button>
              <button disabled={submitting} onClick={() => handleReview(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Phê duyệt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
