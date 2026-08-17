"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubjectGroups, createSubjectGroup, deleteSubjectGroup, assignSubjectToGroup, getUnassignedSubjects, getAllTeachersList } from "../drive-config/actions";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Trash2, BookOpen, ArrowRight } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const { showToast, ToastComponent } = useToast();

  // New group form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHead, setNewHead] = useState("");

  // Assign subject
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignGroupId, setAssignGroupId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [g, u, t] = await Promise.all([getSubjectGroups(), getUnassignedSubjects(), getAllTeachersList()]);
    setGroups(g as unknown as SubjectGroupRow[]);
    setUnassigned(u as { id: string; name: string }[]);
    setTeachers(t as unknown as TeacherOption[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!newName.trim()) { showToast("Tên tổ không được trống", "error"); return; }
    const res = await createSubjectGroup({ name: newName, headTeacherId: newHead || undefined });
    if (res.success) { showToast("Đã tạo tổ chuyên môn", "success"); setShowForm(false); setNewName(""); setNewHead(""); loadData(); }
    else showToast(res.error || "Lỗi", "error");
  };

  const handleAssign = async () => {
    if (!assignSubjectId || !assignGroupId) { showToast("Chọn môn và tổ", "error"); return; }
    await assignSubjectToGroup(assignSubjectId, assignGroupId);
    showToast("Đã gán môn vào tổ", "success");
    setAssignSubjectId(""); setAssignGroupId("");
    loadData();
  };

  const handleRemoveSubject = async (subjectId: string) => {
    await assignSubjectToGroup(subjectId, null as any);
    showToast("Đã gỡ môn khỏi tổ", "success");
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tổ Chuyên Môn</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo Tổ mới
        </button>
      </div>

      <p className="text-xs text-gray-500">Tổ chuyên môn gom các môn học lại (VD: Tổ Tự nhiên = Toán, Lý, Hóa, Sinh). Mỗi tổ có 1 Tổ trưởng.</p>

      {/* Create Form */}
      {showForm && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Tạo Tổ Chuyên Môn Mới</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tên Tổ</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="VD: Tổ Tự nhiên" className="px-3 py-2 border rounded-lg text-sm w-56" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tổ trưởng</label>
              <select value={newHead} onChange={e => setNewHead(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm w-56">
                <option value="">— Chọn tổ trưởng —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Tạo</button>
          </div>
        </div>
      )}

      {/* Assign Subject */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Môn học chưa thuộc tổ nào ({unassigned.length})</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <select value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm">
              <option value="">— Chọn môn —</option>
              {unassigned.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ArrowRight className="w-4 h-4 text-gray-400 self-center" />
            <select value={assignGroupId} onChange={e => setAssignGroupId(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm">
              <option value="">— Chọn tổ —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={handleAssign} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium">Gán vào Tổ</button>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Chưa có tổ chuyên môn nào. Bấm "Tạo Tổ mới" để bắt đầu.</div>
        ) : groups.map(g => (
          <div key={g.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{g.name}</h3>
                <p className="text-xs text-gray-500">
                  Tổ trưởng: <span className="font-semibold text-indigo-700">{g.headTeacher?.user?.name || "Chưa phân công"}</span>
                  {" • "}{g.subjects.length} môn
                </p>
              </div>
              <button onClick={async () => { await deleteSubjectGroup(g.id); showToast("Đã xóa tổ", "success"); loadData(); }}
                className="p-2 hover:bg-red-100 rounded-lg" title="Xóa tổ">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.subjects.length === 0 ? (
                <span className="text-xs text-gray-400 italic">Chưa có môn nào trong tổ</span>
              ) : g.subjects.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-full text-xs font-medium">
                  <BookOpen className="w-3 h-3" /> {s.name}
                  <button onClick={() => handleRemoveSubject(s.id)} className="hover:text-red-600 ml-1" title="Gỡ khỏi tổ">×</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
