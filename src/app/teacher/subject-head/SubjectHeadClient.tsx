"use client";

import { useState, useCallback } from "react";
import { getHeadSubjectsAndRequests, reviewTeacherChangeRequest, getHeadLessonPlans, headReviewLessonPlan } from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Check, X, Shield, BookOpen, Clock, AlertCircle, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

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
    <div className="space-y-6">
      {ToastComponent}

      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-300" />
          <h1 className="text-2xl font-bold">Quản lý Bộ môn (Trưởng bộ môn)</h1>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Duyệt giáo án, phê duyệt thay đổi giáo viên và quản lý bộ môn phụ trách.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button onClick={() => setActiveTab("lesson-plans")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "lesson-plans" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
          <FileText className="inline w-4 h-4 mr-1.5" />
          Giáo án chờ duyệt {pendingLPCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">{pendingLPCount}</span>}
        </button>
        <button onClick={() => setActiveTab("requests")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "requests" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
          <Clock className="inline w-4 h-4 mr-1.5" />
          Đổi giáo viên
        </button>
        <button onClick={() => setActiveTab("subjects")}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === "subjects" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
          <BookOpen className="inline w-4 h-4 mr-1.5" />
          Môn học phụ trách
        </button>
      </div>

      {/* ====== TAB: GIÁO ÁN CHỜ DUYỆT ====== */}
      {activeTab === "lesson-plans" && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Giáo án Chuyên môn chờ Duyệt
            </h2>
          </div>

          {/* Flow */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800 mb-4">
            <strong>Quy trình:</strong> GV nộp → <span className="font-semibold text-indigo-600 underline">Tổ trưởng CM duyệt (Bước này)</span> → Phó HT duyệt → Hiệu trưởng phê duyệt cuối
          </div>

          {loading ? (
            <div className="text-center py-6 text-gray-400">Đang tải...</div>
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-6 text-gray-400">Không có giáo án nào thuộc môn bạn phụ trách</div>
          ) : (
            <div className="space-y-3">
              {lessonPlans.map(p => {
                const isExpanded = expandedLP === p.id;
                const canReview = p.status === "SUBMITTED";
                const statusInfo = LP_STATUS_MAP[p.status] || { label: p.status, color: "bg-gray-100 text-gray-800" };

                return (
                  <div key={p.id} className="border rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedLP(isExpanded ? null : p.id)} className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900">{p.title}</h3>
                        <p className="text-xs text-gray-500">GV: {p.teacherName} • {p.subjectName} • {p.className} • Tuần {p.weekNumber}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t space-y-4">
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-xs text-gray-500 block mb-1">Mục tiêu:</span><p className="text-gray-700 text-xs whitespace-pre-wrap">{p.objectives || "—"}</p></div>
                          <div><span className="text-xs text-gray-500 block mb-1">Nội dung:</span><p className="text-gray-700 text-xs whitespace-pre-wrap">{p.content || "—"}</p></div>
                        </div>

                        {p.reviews.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Lịch sử</h4>
                            {p.reviews.map(r => (
                              <div key={r.id} className="text-xs bg-gray-50 rounded-lg p-2 mb-1">
                                <span className="font-semibold text-gray-700">{r.reviewerName}</span>: {r.comment || "(không có nhận xét)"}
                              </div>
                            ))}
                          </div>
                        )}

                        {canReview && (
                          <div className="pt-3 border-t space-y-3">
                            <textarea value={lpReviewNote} onChange={e => setLpReviewNote(e.target.value)} rows={2}
                              placeholder="Nhận xét chuyên môn của Tổ trưởng..."
                              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
                            <div className="flex gap-3">
                              <button onClick={() => handleLPReview(p.id, true)} disabled={lpReviewing === p.id}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                                <CheckCircle className="w-4 h-4" /> {lpReviewing === p.id ? "Đang xử lý..." : "Duyệt chuyên môn"}
                              </button>
                              <button onClick={() => handleLPReview(p.id, false)} disabled={lpReviewing === p.id}
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
      )}

      {/* ====== TAB: MÔN HỌC PHỤ TRÁCH ====== */}
      {activeTab === "subjects" && (
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Môn học phụ trách ({headSubjects.length})
        </h2>
        {loading ? (
          <p className="text-gray-500 text-sm">Đang tải...</p>
        ) : headSubjects.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Bạn hiện chưa được phân công làm Trưởng bộ môn cho môn học nào.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {headSubjects.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 text-base">{s.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-200 text-indigo-800 font-medium">
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
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Yêu cầu thay đổi Giáo viên cần duyệt
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
            {requests.filter(r => r.status === "PENDING").length} chờ duyệt
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Môn học</th>
                <th className="px-4 py-3">Lớp học</th>
                <th className="px-4 py-3">GV hiện tại</th>
                <th className="px-4 py-3">GV đề xuất</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Quyết định</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Đang tải...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Chưa có yêu cầu</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.classRoom.name}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{r.currentTeacher.user.name}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{r.newTeacher.user.name}</td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Chờ duyệt</span>}
                      {r.status === "APPROVED" && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Đã đồng ý</span>}
                      {r.status === "CANCELLED" && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">Từ chối</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <button onClick={() => { setSelectedReq(r); setReviewNote(""); }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">
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
            <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Môn học:</span>
                <span className="font-semibold text-gray-900">{selectedReq.subject.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GV hiện tại:</span>
                <span className="font-semibold text-red-600">{selectedReq.currentTeacher.user.name}</span>
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
              placeholder="Nhận xét Tổ trưởng..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Đóng</button>
              <button disabled={submitting} onClick={() => handleReview(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                <X className="w-4 h-4" /> Từ chối
              </button>
              <button disabled={submitting} onClick={() => handleReview(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Phê duyệt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
