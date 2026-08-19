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
        // Update head teacher and group name
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

  return (
    <div>
      {ToastComponent}
      
      {/* Top Header & Buttons (1:1 with Classes Page) */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tổ chuyên môn</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setAssignSubjectId(unassigned[0]?.id || "");
              setAssignGroupId(groups[0]?.id || "");
              setAssignModalOpen(true);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium transition"
          >
            <span>📥</span> Gán môn vào tổ {unassigned.length > 0 && `(${unassigned.length})`}
          </button>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>+</span> Thêm tổ mới
          </button>
        </div>
      </div>

      {/* Filters & View Switcher (1:1 with Classes Page) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm tên tổ, môn, tổ trưởng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎴 Dạng Thẻ Tổ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View (1:1 with Classes Page Cards) */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải danh sách tổ chuyên môn...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Chưa có tổ chuyên môn nào</div>
          ) : (
            filteredGroups.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base">{g.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      Tổ CM
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Tổ trưởng:</span>{" "}
                    {g.headTeacher?.user.name || "Chưa phân công"}
                  </p>

                  <div className="pt-1 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Môn học ({g.subjects.length}):</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-0.5">
                      {g.subjects.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Chưa có môn học</span>
                      ) : (
                        g.subjects.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                          >
                            {sub.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(sub.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 font-bold"
                              title="Gỡ môn"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(g)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(g.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Xóa tổ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View (1:1 with Classes Page Table) */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-3">Tên Tổ Chuyên Môn</th>
                  <th className="px-4 py-3">Tổ Trưởng CM</th>
                  <th className="px-4 py-3">Môn Trực Thuộc</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Không có dữ liệu</td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{g.name}</td>
                      <td className="px-4 py-3 font-medium">
                        {g.headTeacher?.user.name ? (
                          <span className="text-indigo-700 font-semibold">{g.headTeacher.user.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.subjects.map((sub) => (
                            <span key={sub.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] border border-slate-200">
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button onClick={() => openEditModal(g)} className="font-semibold text-indigo-600 hover:text-indigo-800">
                          Chỉnh sửa
                        </button>
                        <button onClick={() => setDeleteConfirm(g.id)} className="font-semibold text-rose-600 hover:text-rose-800">
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Create / Edit */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingGroup ? "Cập Nhật Tổ Chuyên Môn" : "Thêm Tổ Chuyên Môn Mới"}
        >
          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Tổ Chuyên Môn (*)</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Tổ Toán - Tin"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tổ Trưởng Chuyên Môn</label>
              <select
                value={formHeadTeacherId}
                onChange={(e) => setFormHeadTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : editingGroup ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Assign Subject */}
      {assignModalOpen && (
        <Modal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title="Gán Môn Học Vào Tổ Chuyên Môn"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chọn Môn Học (*)</label>
              {unassigned.length === 0 ? (
                <p className="text-xs text-amber-600 italic">Tất cả các môn học đã được phân vào Tổ chuyên môn.</p>
              ) : (
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Chọn môn học —</option>
                  {unassigned.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tổ Chuyên Môn Tiếp Nhận (*)</label>
              <select
                value={assignGroupId}
                onChange={(e) => setAssignGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Chọn Tổ chuyên môn —</option>
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={assignSubmitting || unassigned.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {assignSubmitting ? "Đang gán..." : "Gán vào tổ"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirm Delete */}
      {deleteConfirm && (
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Xác Nhận Xóa Tổ Chuyên Môn"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa Tổ chuyên môn này? Các môn học trực thuộc sẽ trở thành chưa phân tổ.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!!deletingGroupId}
                onClick={() => handleDeleteGroup(deleteConfirm)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {deletingGroupId ? "Đang xóa..." : "Xóa ngay"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
