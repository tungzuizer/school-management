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
import { Users, Plus, Trash2, BookOpen, ArrowRight, Loader2, UserCheck, ShieldCheck, Sparkles, X } from "lucide-react";

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
    <div className="space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {ToastComponent}

      {/* ===== HERO BANNER ===== */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-indigo-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> Cấu Hình Chuyên Môn Trường
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Quản Lý Tổ Chuyên Môn</h1>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
              Phân loại môn học thành từng Tổ chuyên môn & bổ nhiệm Tổ trưởng (có quyền duyệt giáo án chính thức).
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={submitting}
            className="self-start sm:self-auto px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 transition-all shadow-md active-press shrink-0"
          >
            <Plus className="w-4 h-4 text-indigo-700" />
            <span>Tạo Tổ Mới</span>
          </button>
        </div>
      </div>

      {/* ===== CREATE FORM ===== */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-indigo-50/90 rounded-2xl border border-indigo-200 p-4 sm:p-5 space-y-4 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Tạo Tổ Chuyên Môn Mới
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tổ Chuyên Môn</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Tổ Tự Nhiên, Tổ Xã Hội..."
                disabled={submitting}
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white outline-none font-semibold disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chỉ Định Tổ Trưởng CM</label>
              <select
                value={newHead}
                onChange={(e) => setNewHead(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-indigo-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white outline-none font-semibold disabled:bg-slate-100"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-2xs active-press min-h-[40px]"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Đang tạo..." : "Xác Nhận Tạo Tổ"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ===== ASSIGN SUBJECT ===== */}
      <form onSubmit={handleAssign} className="bg-amber-50/90 rounded-2xl border border-amber-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
          <span>Gán Môn Học Vào Tổ Chuyên Môn</span>
          {unassigned.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold">
              {unassigned.length} môn chưa phân tổ
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 items-center">
          <div className="sm:col-span-3">
            <select
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              disabled={submitting || loading}
              className="w-full px-3 py-2 border border-amber-300/80 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
            >
              <option value="">— Chọn môn chưa thuộc tổ —</option>
              {unassigned.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex justify-center text-amber-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          <div className="sm:col-span-2">
            <select
              value={assignGroupId}
              onChange={(e) => setAssignGroupId(e.target.value)}
              disabled={submitting || loading}
              className="w-full px-3 py-2 border border-amber-300/80 rounded-xl text-xs bg-white font-semibold outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
            >
              <option value="">— Chọn tổ tiếp nhận —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={submitting || loading || !assignSubjectId || !assignGroupId}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold py-2 px-3 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all shadow-2xs active-press min-h-[38px]"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Gán Môn</span>
            </button>
          </div>
        </div>
      </form>

      {/* ===== GROUPS GRID / CARDS ===== */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách tổ chuyên môn...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Chưa có tổ chuyên môn nào</p>
            <p className="text-xs text-slate-400 mt-1">Bấm nút &quot;Tạo Tổ Mới&quot; ở trên để bắt đầu thêm tổ chuyên môn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-3">
                  {/* Title & Delete button */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold shadow-2xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                          {g.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {g.subjects.length} môn học trực thuộc
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(g.id)}
                      disabled={deletingGroupId === g.id || submitting}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50 active-press"
                      title="Xóa tổ chuyên môn"
                    >
                      {deletingGroupId === g.id ? (
                        <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Head Teacher Selection */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-600 flex items-center justify-between">
                      <span>👑 Tổ Trưởng Chuyên Môn (Quyền duyệt giáo án)</span>
                      {updatingHeadGroupId === g.id && (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      )}
                    </label>
                    <select
                      value={g.headTeacherId || g.headTeacher?.id || ""}
                      onChange={(e) => handleHeadTeacherChange(g.id, e.target.value)}
                      disabled={updatingHeadGroupId === g.id || submitting}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                    >
                      <option value="">— Gỡ quyền Tổ trưởng —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subjects Badges List */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Danh sách môn học thuộc tổ:
                    </span>
                    <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                      {g.subjects.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Chưa gán môn nào vào tổ này</span>
                      ) : (
                        g.subjects.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/80 text-indigo-900 rounded-full text-xs font-bold border border-indigo-100 shadow-2xs"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{s.name}</span>
                            <button
                              onClick={() => handleRemoveSubject(s.id)}
                              disabled={removingSubjectId === s.id || submitting}
                              className="hover:bg-indigo-200 hover:text-rose-600 rounded-full w-4 h-4 inline-flex items-center justify-center ml-0.5 transition-colors disabled:opacity-50 font-extrabold"
                              title="Gỡ khỏi tổ"
                            >
                              {removingSubjectId === s.id ? (
                                <Loader2 className="w-3 h-3 text-rose-500 animate-spin" />
                              ) : (
                                "×"
                              )}
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
