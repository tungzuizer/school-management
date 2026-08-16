"use client";

import { useState, useCallback } from "react";
import { getHeadSubjectsAndRequests, reviewTeacherChangeRequest } from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Check, X, Shield, BookOpen, Clock, AlertCircle } from "lucide-react";

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
}

export default function SubjectHeadClient({ initialHeadSubjects, initialRequests }: SubjectHeadClientProps) {
  const [headSubjects, setHeadSubjects] = useState<HeadSubject[]>(initialHeadSubjects);
  const [requests, setRequests] = useState<RequestData[]>(initialRequests);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestData | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await getHeadSubjectsAndRequests();
    setHeadSubjects(res.headSubjects as any);
    setRequests(res.requests as any);
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

  return (
    <div className="space-y-6">
      {ToastComponent}

      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-indigo-300" />
          <h1 className="text-2xl font-bold">Quản lý Bộ môn (Trưởng bộ môn)</h1>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Nơi Trưởng bộ môn theo dõi các môn học phụ trách và quyết định phê duyệt/từ chối đề xuất thay đổi giáo viên giảng dạy từ các giáo viên.
        </p>
      </div>

      {/* List of Head Subjects */}
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
            <span>Bạn hiện chưa được phân công làm Trưởng bộ môn cho môn học nào. Ban Giám Hiệu có thể gán quyền trong mục Quản lý Môn học.</span>
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

      {/* Yêu cầu đổi giáo viên */}
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
                <th className="px-4 py-3">Giáo viên hiện tại</th>
                <th className="px-4 py-3">Giáo viên đề xuất</th>
                <th className="px-4 py-3">Người yêu cầu</th>
                <th className="px-4 py-3">Lý do</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Quyết định</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Đang tải yêu cầu...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Chưa có yêu cầu thay đổi giáo viên nào</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.classRoom.name}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{r.currentTeacher.user.name}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{r.newTeacher.user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.requestedBy.user.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason || "—"}</td>
                    <td className="px-4 py-3">
                      {r.status === "PENDING" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Chờ duyệt</span>
                      )}
                      {r.status === "APPROVED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Đã đồng ý</span>
                      )}
                      {r.status === "CANCELLED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">Từ chối</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" ? (
                        <button
                          onClick={() => { setSelectedReq(r); setReviewNote(""); }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                        >
                          Xem xét & Quyết định
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <span className="text-gray-500">Lớp:</span>
                <span className="font-semibold text-gray-900">{selectedReq.classRoom.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giáo viên hiện tại:</span>
                <span className="font-semibold text-red-600">{selectedReq.currentTeacher.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giáo viên mới thay thế:</span>
                <span className="font-semibold text-emerald-600">{selectedReq.newTeacher.user.name}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-500">Lý do yêu cầu:</span>
                <span className="text-gray-800 italic">{selectedReq.reason || "Không có ghi chú"}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú / Nhận xét của Trưởng bộ môn</label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập ghi chú ý kiến nếu có..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Từ chối
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReview(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Phê duyệt & Đổi giáo viên
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
