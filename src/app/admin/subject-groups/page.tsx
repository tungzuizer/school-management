"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubjectGroups, createSubjectGroup, deleteSubjectGroup, assignSubjectToGroup, getUnassignedSubjects, getAllTeachersList } from "../drive-config/actions";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Trash2, BookOpen, ArrowRight, Loader2 } from "lucide-react";

interface SubjectGroupRow {
  id: string;
  name: string;
  headTeacher: { id: string; user: { name: string } } | null;
  subjects: { id: string; name: string }[];
}

interface TeacherOption { id: string; user: { name: string } }

export default function SubjectGroupsPage() {
  const [groups, setGroups] = useState<SubjectGroupRow[]>([]);
  const [unassigned, setUnassigned] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  // New group form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHead, setNewHead] = useState("");

  // Assign subject
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setInitialLoading(true);
    else setIsRefreshing(true);

    try {
      const g = await getSubjectGroups();
      const u = await getUnassignedSubjects();
      const t = await getAllTeachersList();
      setGroups(g as unknown as SubjectGroupRow[]);
      setUnassigned(u as { id: string; name: string }[]);
      setTeachers(t as unknown as TeacherOption[]);
    } catch (err) {
      console.error("Failed to load subject groups data:", err);
    } finally {
      if (!silent) setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;
    
    const trimmedName = newName.trim();
    if (!trimmedName) { 
      showToast("Tên tổ không được trống", "error"); 
      return; 
    }

    // Kiểm tra trùng tên tổ chuyên môn ở phía client
    const isDuplicate = groups.some(
      (g) => g.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showToast(`Tổ chuyên môn "${trimmedName}" đã tồn tại. Vui lòng nhập tên khác!`, "error");
      return;
    }
    
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
      setSubmitting(false);
    }
  };

  const handleAssign = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;
    if (!assignSubjectId || !assignGroupId) { showToast("Vui lòng chọn cả môn học và tổ chuyên môn", "error"); return; }
    
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
      setSubmitting(false);
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await assignSubjectToGroup(subjectId, null as any);
      showToast("Đã gỡ môn khỏi tổ", "success");
      await loadData(true);
    } catch (err: any) {
      showToast("Lỗi khi gỡ môn khỏi tổ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteSubjectGroup(groupId);
      showToast("Đã xóa tổ chuyên môn", "success");
      await loadData(true);
    } catch (err: any) {
      showToast("Lỗi khi xóa tổ", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex items-center gap-3 text-indigo-600 font-medium text-base">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Đang tải dữ liệu tổ chuyên môn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl relative">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Quản lý Tổ Chuyên Môn
              {isRefreshing && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
            </h1>
            <p className="text-xs text-gray-500">Tổ chuyên môn gom các môn học lại (VD: Tổ Tự nhiên = Toán, Lý, Hóa, Sinh). Mỗi tổ có 1 Tổ trưởng.</p>
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

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-indigo-50/80 rounded-xl border border-indigo-200 p-4 space-y-3 shadow-sm transition">
          <h3 className="text-sm font-semibold text-gray-800">Tạo Tổ Chuyên Môn Mới</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Tên Tổ</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="VD: Tổ Tự nhiên"
                disabled={submitting}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 font-medium">Tổ trưởng</label>
              <select
                value={newHead}
                onChange={e => setNewHead(e.target.value)}
                disabled={submitting}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-gray-100"
              >
                <option value="">— Chọn tổ trưởng —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !newName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Đang xử lý..." : "Tạo Tổ"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Assign Subject */}
      {unassigned.length > 0 && (
        <form onSubmit={handleAssign} className="bg-amber-50/80 rounded-xl border border-amber-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">Môn học chưa thuộc tổ nào ({unassigned.length})</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <select
              value={assignSubjectId}
              onChange={e => setAssignSubjectId(e.target.value)}
              disabled={submitting}
              className="px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
            >
              <option value="">— Chọn môn —</option>
              {unassigned.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ArrowRight className="w-4 h-4 text-amber-500 self-center" />
            <select
              value={assignGroupId}
              onChange={e => setAssignGroupId(e.target.value)}
              disabled={submitting}
              className="px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white disabled:bg-gray-100"
            >
              <option value="">— Chọn tổ —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Gán vào Tổ</span>
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            Chưa có tổ chuyên môn nào. Bấm "Tạo Tổ mới" để bắt đầu.
          </div>
        ) : groups.map(g => (
          <div key={g.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-200 transition">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tổ trưởng: <span className="font-semibold text-indigo-700">{g.headTeacher?.user?.name || "Chưa phân công"}</span>
                  {" • "}{g.subjects.length} môn thuộc tổ
                </p>
              </div>
              <button
                onClick={() => handleDeleteGroup(g.id)}
                disabled={submitting}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition disabled:opacity-50"
                title="Xóa tổ"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.subjects.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Chưa có môn nào trong tổ</span>
              ) : g.subjects.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-full text-xs font-medium border border-indigo-100">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> {s.name}
                  <button
                    onClick={() => handleRemoveSubject(s.id)}
                    disabled={submitting}
                    className="hover:bg-indigo-200 hover:text-red-600 rounded-full w-4 h-4 inline-flex items-center justify-center ml-1 transition disabled:opacity-50"
                    title="Gỡ khỏi tổ"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
