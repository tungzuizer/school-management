"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSubjectGroups,
  createSubjectGroup,
  deleteSubjectGroup,
  assignSubjectToGroup,
  getUnassignedSubjects,
  getAllTeachersList,
  updateGroupHead,
} from "../drive-config/actions";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Trash2, BookOpen, ArrowRight, Loader2, UserCheck } from "lucide-react";

interface SubjectGroupRow {
  id: string;
  name: string;
  headTeacherId?: string | null;
  headTeacher: { id: string; user: { name: string } } | null;
  subjects: { id: string; name: string }[];
}

interface TeacherOption {
  id: string;
  user: { name: string };
}

export default function SubjectGroupsPage() {
  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
  const [unassigned, setUnassigned] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [removingSubjectId, setRemovingSubjectId] = useState<string | null>(null);
  const [updatingHeadGroupId, setUpdatingHeadGroupId] = useState<string | null>(null);

  const isSubmittingRef = useRef(false);
  const { showToast, ToastComponent } = useToast();

  // New group form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHead, setNewHead] = useState("");

  // Assign subject
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [g, u, t] = await Promise.all([
        getSubjectGroups(),
        getUnassignedSubjects(),
        getAllTeachersList(),
      ]);
      setGroups(g as unknown as SubjectGroupRow[]);
      setUnassigned(u as { id: string; name: string }[]);
      setTeachers(t as unknown as TeacherOption[]);
    } catch (err) {
      console.error("Failed to load subject groups data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // STRICT DOUBLE-LOCK to prevent duplicate creation
    if (isSubmittingRef.current || submitting) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      showToast("Tên tổ không được trống", "error");
      return;
    }

    const isDuplicate = groups.some(
      (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Tổ chuyên môn "${trimmedName}" đã tồn tại. Vui lòng nhập tên khác!`, "error");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const res = await createSubjectGroup({ name: trimmedName, headTeacherId: newHead || undefined });
      if (res.success) {
        showToast("Đã tạo tổ chuyên môn thành công", "success");
        setShowForm(false);
        setNewName("");
        setNewHead("");
        await loadData(true);
      } else {
        showToast(res.error || "Lỗi khi tạo tổ chuyên môn", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống: " + (err.message || "Không thể kết nối"), "error");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleAssign = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingRef.current || submitting) return;
    if (!assignSubjectId || !assignGroupId) {
      showToast("Vui lòng chọn cả môn học và tổ chuyên môn", "error");
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await assignSubjectToGroup(assignSubjectId, assignGroupId);
      showToast("Đã gán môn vào tổ thành công", "success");
      setAssignSubjectId("");
      setAssignGroupId("");
      await loadData(true);
    } catch (err: any) {
      showToast("Lỗi khi gán môn vào tổ", "error");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (removingSubjectId) return;
    setRemovingSubjectId(subjectId);
    try {
      await assignSubjectToGroup(subjectId, null as any);
      showToast("Đã gỡ môn khỏi tổ", "success");
      await loadData(true);
    } catch (err: any) {
      showToast("Lỗi khi gỡ môn khỏi tổ", "error");
    } finally {
      setRemovingSubjectId(null);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (deletingGroupId) return;
    setDeletingGroupId(groupId);
    try {
      await deleteSubjectGroup(groupId);
      showToast("Đã xóa tổ chuyên môn", "success");
      await loadData(true);
    } catch (err: any) {
      showToast("Lỗi khi xóa tổ", "error");
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleHeadTeacherChange = async (groupId: string, newTeacherId: string) => {
    setUpdatingHeadGroupId(groupId);
    try {
      const res = await updateGroupHead(groupId, newTeacherId || null);
      if (res.success) {
        showToast(
          newTeacherId
            ? "Đã phân công Tổ trưởng chuyên môn mới"
            : "Đã gỡ quyền Tổ trưởng chuyên môn",
          "success"
        );
        await loadData(true);
      } else {
        showToast(res.error || "Không thể đổi Tổ trưởng", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setUpdatingHeadGroupId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl relative">
      {ToastComponent}

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Tổ Chuyên Môn</h1>
            <p className="text-xs text-gray-500">
              Tổ chuyên môn gom các môn học lại. Mỗi tổ được phân công 1 Tổ trưởng chuyên môn (có quyền duyệt giáo án).
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={submitting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Tổ mới
        </button>
      </div>

      {/* ===== CREATE FORM ===== */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-indigo-50/80 rounded-xl border border-indigo-200 p-4 space-y-3 shadow-sm transition"
        >
          <h3 className="text-sm font-semibold text-gray-800">Tạo Tổ Chuyên Môn Mới</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Tên Tổ</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Tổ Tự nhiên"
                disabled={submitting}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Tổ trưởng</label>
              <select
                value={newHead}
                onChange={(e) => setNewHead(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
              >
                <option value="">— Chưa chỉ định —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Đang tạo..." : "Tạo Tổ"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===== ASSIGN SUBJECT ===== */}
      <form onSubmit={handleAssign} className="bg-amber-50/80 rounded-xl border border-amber-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-amber-900 mb-2">Gán môn học vào tổ</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <select
            value={assignSubjectId}
            onChange={(e) => setAssignSubjectId(e.target.value)}
            disabled={submitting || loading}
            className="px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
          >
            <option value="">— Chọn môn —</option>
            {unassigned.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ArrowRight className="w-4 h-4 text-amber-500 self-center" />
          <select
            value={assignGroupId}
            onChange={(e) => setAssignGroupId(e.target.value)}
            disabled={submitting || loading}
            className="px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
          >
            <option value="">— Chọn tổ —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting || loading || !assignSubjectId || !assignGroupId}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 transition"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Gán vào Tổ</span>
          </button>
        </div>
      </form>

      {/* ===== GROUPS TABLE ===== */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên Tổ Chuyên Môn</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tổ trưởng (Quyền duyệt)</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Các môn thuộc tổ</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    <span>Đang tải danh sách tổ chuyên môn...</span>
                  </div>
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Chưa có tổ chuyên môn nào. Bấm &quot;Tạo Tổ mới&quot; để bắt đầu.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{g.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={g.headTeacherId || g.headTeacher?.id || ""}
                        onChange={(e) => handleHeadTeacherChange(g.id, e.target.value)}
                        disabled={updatingHeadGroupId === g.id || submitting}
                        className="px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 font-medium"
                      >
                        <option value="">— Gỡ quyền Tổ trưởng —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.user.name}
                          </option>
                        ))}
                      </select>
                      {updatingHeadGroupId === g.id && (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {g.subjects.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Chưa có môn nào</span>
                      ) : (
                        g.subjects.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs font-medium border border-indigo-100"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-600" /> {s.name}
                            <button
                              onClick={() => handleRemoveSubject(s.id)}
                              disabled={removingSubjectId === s.id || submitting}
                              className="hover:bg-indigo-200 hover:text-red-600 rounded-full w-4 h-4 inline-flex items-center justify-center ml-0.5 transition disabled:opacity-50"
                              title="Gỡ khỏi tổ"
                            >
                              {removingSubjectId === s.id ? (
                                <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
                              ) : (
                                "×"
                              )}
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      disabled={deletingGroupId === g.id || submitting}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition disabled:opacity-50"
                      title="Xóa tổ"
                    >
                      {deletingGroupId === g.id ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
