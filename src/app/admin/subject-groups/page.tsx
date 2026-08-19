"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSubjectGroups,
  createSubjectGroup,
  deleteSubjectGroup,
  assignSubjectToGroup,
  getUnassignedSubjects,
  getAllTeachersList,
  updateGroupHead,
} from "../drive-config/actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Trash2, BookOpen, ArrowRight, Loader2, Search, Edit2, ShieldCheck, Check, AlertCircle, Sparkles } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);

  // Modal Create/Edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroupRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formHeadTeacherId, setFormHeadTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal Assign Subject state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Action states
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [removingSubjectId, setRemovingSubjectId] = useState<string | null>(null);
  const [updatingHeadGroupId, setUpdatingHeadGroupId] = useState<string | null>(null);

  const { showToast, ToastComponent } = useToast();

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
      console.error("Lỗi khi tải danh sách tổ chuyên môn:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingGroup(null);
    setFormName("");
    setFormHeadTeacherId("");
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (g: SubjectGroupRow) => {
    setEditingGroup(g);
    setFormName(g.name);
    setFormHeadTeacherId(g.headTeacherId || g.headTeacher?.id || "");
    setModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      showToast("Vui lòng nhập tên Tổ chuyên môn", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingGroup) {
        // Update head teacher
        const resHead = await updateGroupHead(editingGroup.id, formHeadTeacherId || null);
        if (resHead.success) {
          showToast("Cập nhật thông tin Tổ thành công", "success");
          setModalOpen(false);
          loadData(true);
        } else {
          showToast(resHead.error || "Không thể cập nhật Tổ", "error");
        }
      } else {
        // Create new group
        const res = await createSubjectGroup({ name: trimmedName, headTeacherId: formHeadTeacherId || undefined });
        if (res.success) {
          showToast("Thêm Tổ chuyên môn thành công", "success");
          setModalOpen(false);
          loadData(true);
        } else {
          showToast(res.error || "Lỗi khi tạo Tổ chuyên môn", "error");
        }
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống: " + (err.message || ""), "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Assign Subject
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectId || !assignGroupId) {
      showToast("Vui lòng chọn cả môn học và tổ chuyên môn tiếp nhận", "error");
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await assignSubjectToGroup(assignSubjectId, assignGroupId);
      if (res.success) {
        showToast("Gán môn vào tổ thành công", "success");
        setAssignModalOpen(false);
        setAssignSubjectId("");
        setAssignGroupId("");
        loadData(true);
      } else {
        showToast(res.error || "Không thể gán môn vào tổ", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Quick Remove Subject from Group
  const handleRemoveSubject = async (subjectId: string) => {
    if (removingSubjectId) return;
    setRemovingSubjectId(subjectId);
    try {
      const res = await assignSubjectToGroup(subjectId, null);
      if (res.success) {
        showToast("Đã gỡ môn khỏi tổ", "success");
        loadData(true);
      } else {
        showToast(res.error || "Không thể gỡ môn", "error");
      }
    } catch (err: any) {
      showToast("Lỗi khi gỡ môn", "error");
    } finally {
      setRemovingSubjectId(null);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string) => {
    setDeletingGroupId(groupId);
    try {
      const res = await deleteSubjectGroup(groupId);
      setDeleteConfirm(null);
      if (res.success) {
        showToast("Đã xóa tổ chuyên môn thành công", "success");
        loadData(true);
      } else {
        showToast(res.error || "Không thể xóa tổ chuyên môn", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống khi xóa tổ", "error");
    } finally {
      setDeletingGroupId(null);
    }
  };

  // Quick Head Teacher Select Change
  const handleHeadTeacherChange = async (groupId: string, newTeacherId: string) => {
    setUpdatingHeadGroupId(groupId);
    try {
      const res = await updateGroupHead(groupId, newTeacherId || null);
      if (res.success) {
        showToast(
          newTeacherId ? "Đã chỉ định Tổ trưởng chuyên môn" : "Đã gỡ quyền Tổ trưởng chuyên môn",
          "success"
        );
        loadData(true);
      } else {
        showToast(res.error || "Không thể cập nhật Tổ trưởng", "error");
      }
    } catch (err: any) {
      showToast("Lỗi hệ thống", "error");
    } finally {
      setUpdatingHeadGroupId(null);
    }
  };

  // Filter groups by search
  const filteredGroups = groups.filter((g) => {
    if (!search.trim()) return true;
    const sLower = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(sLower) ||
      (g.headTeacher?.user?.name && g.headTeacher.user.name.toLowerCase().includes(sLower)) ||
      g.subjects.some((sub) => sub.name.toLowerCase().includes(sLower))
    );
  });

  const totalAssignedSubjects = groups.reduce((acc, g) => acc + g.subjects.length, 0);
  const totalHeadAppointed = groups.filter((g) => g.headTeacherId || g.headTeacher?.id).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {ToastComponent}

      {/* ===== TOP HEADER & ACTION BUTTONS (Y HỆT QUẢN LÝ LỚP HỌC) ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Quản Lý Tổ Chuyên Môn
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý danh sách Tổ chuyên môn, phân công Tổ trưởng và các môn học trực thuộc
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setAssignSubjectId(unassigned[0]?.id || "");
              setAssignGroupId(groups[0]?.id || "");
              setAssignModalOpen(true);
            }}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 flex items-center gap-2 text-xs font-bold transition shadow-2xs active-press min-h-[40px]"
          >
            <span>📥</span> Gán Môn Vào Tổ {unassigned.length > 0 && `(${unassigned.length})`}
          </button>

          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center gap-2 text-xs font-bold transition shadow-2xs active-press min-h-[40px]"
          >
            <Plus className="w-4 h-4" /> Thêm Tổ Mới
          </button>
        </div>
      </div>

      {/* ===== STATS SUMMARY BOARD (BẢNG CHỈ SỐ TỔNG QUAN) ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover-lift">
          <p className="text-xs text-slate-500 font-bold">Tổng số Tổ CM</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{groups.length}</p>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Hoạt động ổn định</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover-lift">
          <p className="text-xs text-indigo-600 font-bold">Tổ Trưởng CM Đã Bổ Nhiệm</p>
          <p className="text-2xl font-extrabold text-indigo-700 mt-1">{totalHeadAppointed} / {groups.length}</p>
          <p className="text-[10px] text-indigo-500 font-semibold mt-1">Quyền duyệt giáo án</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover-lift">
          <p className="text-xs text-emerald-600 font-bold">Môn Đã Thuộc Tổ</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{totalAssignedSubjects}</p>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1">Đã phân công tổ</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover-lift">
          <p className="text-xs text-amber-600 font-bold">Môn Chưa Thuộc Tổ</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{unassigned.length}</p>
          <p className="text-[10px] text-amber-500 font-semibold mt-1">Cần gán vào tổ</p>
        </div>
      </div>

      {/* ===== FILTERS & VIEW SWITCHER (Y HỆT QUẢN LÝ LỚP HỌC) ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên tổ, tên môn, tên tổ trưởng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* View Switcher: GRID vs TABLE */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🎴 Dạng Thẻ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 Dạng Bảng
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT: GRID OR TABLE ===== */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách tổ chuyên môn...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Chưa tìm thấy Tổ chuyên môn nào</p>
          <p className="text-xs text-slate-400 mt-1">Bấm &quot;Thêm Tổ Mới&quot; ở trên để bắt đầu khởi tạo.</p>
        </div>
      ) : viewMode === "GRID" ? (
        /* ===== GRID VIEW (Cards Y Hệt Lớp Học) ===== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between hover-lift group"
            >
              <div className="space-y-3">
                {/* Header Card: Title & Count Badge */}
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
                        {g.subjects.length} môn học phụ trách
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Tổ CM
                  </span>
                </div>

                {/* Head Teacher Selection */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>👑 Tổ Trưởng Chuyên Môn (Quyền duyệt)</span>
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

                {/* Subjects Badges */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Danh sách môn thuộc tổ:
                  </span>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    {g.subjects.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Chưa gán môn nào</span>
                    ) : (
                      g.subjects.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-900 rounded-full text-xs font-bold border border-indigo-100 shadow-2xs"
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

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(g)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  onClick={() => setDeleteConfirm(g.id)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ===== TABLE VIEW (Y Hệt Bảng Lớp Học) ===== */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b text-slate-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Tên Tổ Chuyên Môn</th>
                <th className="px-5 py-3.5">Tổ Trưởng (Quyền duyệt)</th>
                <th className="px-5 py-3.5">Các Môn Trực Thuộc</th>
                <th className="px-5 py-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredGroups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>{g.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={g.headTeacherId || g.headTeacher?.id || ""}
                      onChange={(e) => handleHeadTeacherChange(g.id, e.target.value)}
                      disabled={updatingHeadGroupId === g.id || submitting}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
                    >
                      <option value="">— Gỡ quyền Tổ trưởng —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.user.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {g.subjects.map((s) => (
                        <span key={s.id} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 font-bold text-[11px] rounded-full border border-indigo-100">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(g)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== MODAL CREATE / EDIT GROUP ===== */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGroup ? "Cập Nhật Tổ Chuyên Môn" : "Thêm Tổ Chuyên Môn Mới"}
        size="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tổ Chuyên Môn (*)</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Tổ Tự Nhiên, Tổ Xã Hội, Tổ Ngoại Ngữ..."
              disabled={submitting || !!editingGroup}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chỉ Định Tổ Trưởng Chuyên Môn</label>
            <select
              value={formHeadTeacherId}
              onChange={(e) => setFormHeadTeacherId(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">— Chưa phân công Tổ trưởng —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !formName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingGroup ? "Lưu Cập Nhật" : "Tạo Tổ"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== MODAL ASSIGN SUBJECT ===== */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Gán Môn Học Vào Tổ Chuyên Môn"
        size="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Môn Học (*)</label>
            <select
              value={assignSubjectId}
              onChange={(e) => setAssignSubjectId(e.target.value)}
              disabled={assignSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            >
              <option value="">— Chọn môn chưa thuộc tổ —</option>
              {unassigned.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tổ Chuyên Môn Tiếp Nhận (*)</label>
            <select
              value={assignGroupId}
              onChange={(e) => setAssignGroupId(e.target.value)}
              disabled={assignSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none bg-white"
            >
              <option value="">— Chọn tổ tiếp nhận —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={assignSubmitting || !assignSubjectId || !assignGroupId}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {assignSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Gán Vào Tổ</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== CONFIRM DELETE MODAL ===== */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác Nhận Xóa Tổ Chuyên Môn"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn xóa Tổ chuyên môn này? Các môn học thuộc tổ sẽ tự động được gỡ khỏi tổ.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={() => deleteConfirm && handleDeleteGroup(deleteConfirm)}
              disabled={!!deletingGroupId}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {deletingGroupId && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Xóa Tổ</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
