"use client";

import { useEffect, useState, useCallback } from "react";
import GoogleDriveImportModal from "@/components/ui/GoogleDriveImportModal";
import {
  getSubjectGroups,
  getSchoolsForSelect,
  getTeachersForSelect,
  getAllSubjectsForSelect,
  getUnassignedSubjects,
  createSubjectGroup,
  updateSubjectGroup,
  deleteSubjectGroup,
  assignSubjectToGroup,
  assignBulkSubjectsToGroup,
  createBulkSubjectGroups,
  BulkSubjectGroupInput,
} from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface SubjectItem {
  id: string;
  name: string;
  gradeLevel?: number | null;
}

interface SubjectGroupData {
  id: string;
  name: string;
  schoolId: string;
  headTeacherId?: string | null;
  description?: string | null;
  school: { id: string; name: string };
  headTeacher: { id: string; user: { name: string; email: string } } | null;
  subjects: SubjectItem[];
}

interface SelectOption {
  id: string;
  name: string;
}

interface TeacherOption {
  id: string;
  user: { name: string; email: string };
  specialty?: string | null;
}

interface SubjectOption {
  id: string;
  name: string;
  gradeLevel?: number | null;
  subjectGroupId?: string | null;
  subjectGroup?: { id: string; name: string } | null;
}

export default function SubjectGroupsPage() {
  const [groups, setGroups] = useState<SubjectGroupData[]>([]);
  const [schools, setSchools] = useState<SelectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [unassignedSubjects, setUnassignedSubjects] = useState<SubjectItem[]>([]);

  // Search and Filters
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterHead, setFilterHead] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(true);

  // Single Create / Edit state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectGroupData | null>(null);
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    headTeacherId: "",
    description: "",
    selectedSubjectIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Assign Subject Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetGroupForAssign, setTargetGroupForAssign] = useState<SubjectGroupData | null>(null);
  const [selectedAssignSubjectIds, setSelectedAssignSubjectIds] = useState<string[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [subjectSearchInModal, setSubjectSearchInModal] = useState("");

  // Delete Confirm Modal state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [removingSubjectId, setRemovingSubjectId] = useState<string | null>(null);

  // Bulk import state
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSchoolId, setBulkSchoolId] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [parsedGroups, setParsedGroups] = useState<BulkSubjectGroupInput[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; errors: string[] } | null>(null);

  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [groupData, schoolData, teacherData, subData, unassignedData] = await Promise.all([
          getSubjectGroups(search || undefined, filterSchool || undefined, filterHead || undefined),
          getSchoolsForSelect(),
          getTeachersForSelect(),
          getAllSubjectsForSelect(),
          getUnassignedSubjects(),
        ]);
        setGroups(groupData as unknown as SubjectGroupData[]);
        setSchools(schoolData);
        setTeachers(teacherData);
        setAllSubjects(subData as unknown as SubjectOption[]);
        setUnassignedSubjects(unassignedData as SubjectItem[]);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu tổ chuyên môn:", err);
      } finally {
        setLoading(false);
      }
    },
    [search, filterSchool, filterHead]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Single Create Modal
  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      schoolId: schools[0]?.id || "",
      headTeacherId: "",
      description: "",
      selectedSubjectIds: [],
    });
    setModalOpen(true);
  };

  // Open Single Edit Modal
  const openEdit = (g: SubjectGroupData) => {
    setEditing(g);
    setForm({
      name: g.name,
      schoolId: g.schoolId || g.school?.id || "",
      headTeacherId: g.headTeacherId || g.headTeacher?.id || "",
      description: g.description || "",
      selectedSubjectIds: g.subjects.map((s) => s.id),
    });
    setModalOpen(true);
  };

  // Open Assign Subject Modal for a specific group
  const openAssignModal = (g?: SubjectGroupData) => {
    const target = g || groups[0] || null;
    setTargetGroupForAssign(target);
    setSelectedAssignSubjectIds(target ? target.subjects.map((s) => s.id) : []);
    setSubjectSearchInModal("");
    setAssignModalOpen(true);
  };

  // Submit Create / Edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Vui lòng điền tên tổ chuyên môn", "error");
      return;
    }
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        schoolId: form.schoolId || undefined,
        headTeacherId: form.headTeacherId || null,
        description: form.description.trim() || null,
        subjectIds: form.selectedSubjectIds,
      };

      const result = editing
        ? await updateSubjectGroup(editing.id, payload)
        : await createSubjectGroup(payload);

      setSubmitting(false);
      if (result.success) {
        showToast(editing ? "Cập nhật tổ chuyên môn thành công" : "Thêm tổ chuyên môn thành công", "success");
        setModalOpen(false);
        await loadData(true);
      } else {
        showToast(result.error || "Có lỗi xảy ra", "error");
      }
    } catch (err: any) {
      setSubmitting(false);
      showToast(err?.message || "Lỗi hệ thống", "error");
    }
  };

  // Submit Assign Modal
  const handleAssignSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGroupForAssign) {
      showToast("Vui lòng chọn Tổ chuyên môn", "error");
      return;
    }
    setAssignSubmitting(true);
    const result = await updateSubjectGroup(targetGroupForAssign.id, {
      name: targetGroupForAssign.name,
      schoolId: targetGroupForAssign.schoolId,
      headTeacherId: targetGroupForAssign.headTeacherId,
      description: targetGroupForAssign.description,
      subjectIds: selectedAssignSubjectIds,
    });
    setAssignSubmitting(false);

    if (result.success) {
      showToast("Cập nhật phân bổ môn học thành công");
      setAssignModalOpen(false);
      loadData(true);
    } else {
      showToast(result.error || "Không thể gán môn học", "error");
    }
  };

  // Quick Remove Subject from Group (inline button)
  const handleRemoveSubject = async (subjectId: string) => {
    if (removingSubjectId) return;
    setRemovingSubjectId(subjectId);
    const res = await assignSubjectToGroup(subjectId, null);
    setRemovingSubjectId(null);
    if (res.success) {
      showToast("Đã gỡ môn khỏi tổ chuyên môn");
      loadData(true);
    } else {
      showToast(res.error || "Không thể gỡ môn", "error");
    }
  };

  // Delete Subject Group
  const handleDelete = async (id: string) => {
    const result = await deleteSubjectGroup(id);
    setDeleteConfirm(null);
    if (result.success) {
      showToast("Xóa tổ chuyên môn thành công");
      loadData(true);
    } else {
      showToast(result.error || "Không thể xóa", "error");
    }
  };

  // Bulk import parser
  const parseBulkText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedGroups([]);
      return;
    }

    const results: BulkSubjectGroupInput[] = [];
    let startIndex = 0;

    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes("tên tổ") ||
      firstLineLower.includes("tổ chuyên môn") ||
      firstLineLower.includes("tổ trưởng") ||
      firstLineLower.includes("môn")
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cols: string[] = [];
      if (line.includes("\t")) {
        cols = line.split("\t").map((c) => c.trim());
      } else if (line.includes(",")) {
        cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      } else {
        cols = [line];
      }

      if (cols.length > 0 && cols[0]) {
        results.push({
          name: cols[0],
          headTeacherName: cols[1] || undefined,
          subjects: cols[2] || undefined,
          schoolName: cols[3] || undefined,
          description: cols[4] || undefined,
        });
      }
    }
    setParsedGroups(results);
  };

  const handleBulkTextChange = (text: string) => {
    setBulkInput(text);
    parseBulkText(text);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setBulkInput(content);
        parseBulkText(content);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent =
      "\uFEFF" +
      "Tên tổ,Tổ trưởng,Danh sách môn học (cách nhau bởi dấu chấm phẩy),Trường,Ghi chú\n" +
      "Tổ Toán - Tin,Nguyễn Văn A,Toán;Tin học,Trường THPT Chuyên,Tổ chuyên môn Toán và Tin học\n" +
      "Tổ Ngữ Văn,Trần Thị B,Ngữ văn,Trường THPT Chuyên,Tổ chuyên môn khối Xã hội\n" +
      "Tổ Ngoại Ngữ,,Tiếng Anh;Tiếng Pháp,,Tổ ngoại ngữ quốc tế";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_nhap_to_chuyen_mon.csv";
    link.click();
  };

  const handleBulkSubmit = async () => {
    if (parsedGroups.length === 0) {
      showToast("Chưa có dữ liệu hợp lệ để nhập", "error");
      return;
    }
    setBulkSubmitting(true);
    const res = await createBulkSubjectGroups(parsedGroups, bulkSchoolId || undefined);
    setBulkSubmitting(false);

    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} tổ chuyên môn!`);
      setBulkResult({ count: res.count, errors: res.errors || [] });
      loadData(true);
    } else {
      showToast(res.error || "Nhập hàng loạt thất bại", "error");
      if (res.errors && res.errors.length > 0) {
        setBulkResult({ count: res.count || 0, errors: res.errors });
      }
    }
  };

  const handleDriveImportSubjectGroups = async (validData: any[]) => {
    const formattedData: BulkSubjectGroupInput[] = validData.map((r) => ({
      name: r.name,
      headTeacherName: r.headTeacherName || undefined,
      subjects: r.subjects || undefined,
      schoolName: r.schoolName || undefined,
      description: r.description || undefined,
    }));

    const res = await createBulkSubjectGroups(formattedData);
    if (res.success) {
      showToast(`Đã nhập thành công ${res.count} tổ chuyên môn từ Google Drive!`, "success");
      loadData(true);
    } else {
      showToast(res.error || "Nhập từ Google Drive thất bại", "error");
    }
  };

  return (
    <div>
      {ToastComponent}

      {/* Top Header & Buttons (1:1 with Classes page) */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Tổ chuyên môn</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setDriveModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition"
          >
            <span>☁️</span> Google Drive
          </button>
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setBulkInput("");
              setParsedGroups([]);
              setBulkResult(null);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>📥</span> Nhập CSV/Text
          </button>
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium"
          >
            <span>+</span> Thêm tổ mới
          </button>
        </div>
      </div>

      {/* Filters & View Switcher (1:1 with Classes page) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm tên tổ, môn, tổ trưởng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs"
          />
          <select
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs"
          >
            <option value="">Tất cả trường</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs bg-white shadow-2xs"
          >
            <option value="">Tất cả tình trạng</option>
            <option value="YES">Đã có tổ trưởng</option>
            <option value="NO">Chưa có tổ trưởng</option>
          </select>

          {unassignedSubjects.length > 0 && (
            <button
              onClick={() => openAssignModal()}
              className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1.5"
            >
              <span>⚠️</span> {unassignedSubjects.length} môn chưa phân tổ
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "GRID"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎴 Dạng Thẻ Tổ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "TABLE"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View (1:1 with Classes Card design) */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Đang tải danh sách tổ chuyên môn...
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Chưa có tổ chuyên môn nào
            </div>
          ) : (
            groups.map((g) => {
              const subjectCount = g.subjects.length;
              const maxSubjectsExpected = 8;
              const percent = Math.min(100, Math.round((subjectCount / maxSubjectsExpected) * 100));

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-base">{g.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                        {subjectCount > 0 ? `${subjectCount} Môn` : "Tổ CM"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Tổ trưởng:</span>{" "}
                      {g.headTeacher ? (
                        <span className="text-indigo-700 font-semibold">{g.headTeacher.user.name}</span>
                      ) : (
                        <span className="text-amber-600 italic">Chưa phân công</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate">
                      {g.school?.name || "Trường trực thuộc"}
                    </p>

                    {/* Progress Distribution Bar (1:1 with Classes Progress Capacity Bar) */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Môn học trực thuộc:</span>
                        <span className="font-bold text-slate-900">{subjectCount} môn</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            subjectCount === 0
                              ? "bg-slate-300"
                              : subjectCount >= 5
                              ? "bg-emerald-500"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${Math.max(15, percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Chips for Subjects */}
                    <div className="pt-1">
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-0.5">
                        {g.subjects.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">Chưa gán môn nào</span>
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
                                disabled={removingSubjectId === sub.id}
                                className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 font-bold"
                                title="Gỡ môn khỏi tổ"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openAssignModal(g)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>+</span> Gán môn
                    </button>
                    <div className="space-x-3">
                      <button
                        onClick={() => openEdit(g)}
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
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View (1:1 with Classes Table design) */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Tổ Chuyên Môn</th>
                <th className="px-6 py-3">Tổ Trưởng</th>
                <th className="px-6 py-3">Trường</th>
                <th className="px-6 py-3">Môn Trực Thuộc</th>
                <th className="px-6 py-3 text-center">Số lượng môn</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Chưa có tổ chuyên môn nào
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{g.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {g.headTeacher ? (
                        <span className="text-indigo-700 font-semibold">{g.headTeacher.user.name}</span>
                      ) : (
                        <span className="text-amber-600 italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{g.school?.name || "—"}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {g.subjects.length === 0 ? (
                          <span className="text-slate-400 italic">Chưa gán</span>
                        ) : (
                          g.subjects.map((sub) => (
                            <span
                              key={sub.id}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] border border-slate-200"
                            >
                              {sub.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                        {g.subjects.length}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-3">
                      <button
                        onClick={() => openAssignModal(g)}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold"
                      >
                        Gán môn
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(g.id)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Sửa tổ chuyên môn" : "Thêm tổ chuyên môn mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tổ chuyên môn *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Tổ Toán - Tin"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trường</label>
            <select
              value={form.schoolId}
              onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">-- Mặc định (Trường hiện tại) --</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổ trưởng chuyên môn
            </label>
            <select
              value={form.headTeacherId}
              onChange={(e) => setForm({ ...form, headTeacherId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">-- Chưa phân công --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name} {t.specialty ? `(${t.specialty})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả / Ghi chú</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả phạm vi quản lý của tổ chuyên môn..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Subjects Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Phân bổ môn học vào Tổ: ${targetGroupForAssign?.name || ""}`}
        size="lg"
      >
        <form onSubmit={handleAssignSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn Tổ chuyên môn tiếp nhận:
            </label>
            <select
              value={targetGroupForAssign?.id || ""}
              onChange={(e) => {
                const found = groups.find((g) => g.id === e.target.value);
                setTargetGroupForAssign(found || null);
                if (found) {
                  setSelectedAssignSubjectIds(found.subjects.map((s) => s.id));
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.subjects.length} môn)
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Chọn danh sách các môn trực thuộc tổ ({selectedAssignSubjectIds.length} môn đã chọn):
              </label>
              <input
                type="text"
                placeholder="Tìm môn..."
                value={subjectSearchInModal}
                onChange={(e) => setSubjectSearchInModal(e.target.value)}
                className="px-3 py-1 border rounded-lg text-xs w-44"
              />
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-xl p-3 bg-slate-50 space-y-2 text-xs">
              {allSubjects.filter((s) =>
                s.name.toLowerCase().includes(subjectSearchInModal.toLowerCase())
              ).length === 0 ? (
                <div className="py-6 text-center text-slate-400">Không tìm thấy môn học nào</div>
              ) : (
                allSubjects
                  .filter((s) => s.name.toLowerCase().includes(subjectSearchInModal.toLowerCase()))
                  .map((sub) => {
                    const isChecked = selectedAssignSubjectIds.includes(sub.id);
                    const isAssignedToOther =
                      sub.subjectGroupId &&
                      targetGroupForAssign &&
                      sub.subjectGroupId !== targetGroupForAssign.id;

                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 font-semibold"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssignSubjectIds([...selectedAssignSubjectIds, sub.id]);
                              } else {
                                setSelectedAssignSubjectIds(
                                  selectedAssignSubjectIds.filter((id) => id !== sub.id)
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{sub.name}</span>
                          {sub.gradeLevel && (
                            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                              Khối {sub.gradeLevel}
                            </span>
                          )}
                        </div>

                        <div>
                          {isAssignedToOther ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Thuộc: {sub.subjectGroup?.name}
                            </span>
                          ) : isChecked ? (
                            <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                              Đã chọn
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chưa gán</span>
                          )}
                        </div>
                      </label>
                    );
                  })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={assignSubmitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
            >
              {assignSubmitting ? "Đang lưu..." : "Lưu phân bổ môn"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal (1:1 with Classes Delete Modal) */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <p className="text-gray-600 mb-6 text-sm">
          Bạn có chắc muốn xóa tổ chuyên môn này? Các môn học trực thuộc sẽ trở thành chưa phân tổ.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Xóa
          </button>
        </div>
      </Modal>

      {/* Bulk Import Modal (1:1 with Classes Bulk Import Modal) */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Nhập danh sách tổ chuyên môn hàng loạt"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold mb-1">💡 Hướng dẫn nhập dữ liệu:</p>
            <p>1. Copy hàng loạt từ Excel / Google Sheets hoặc tải file CSV mẫu.</p>
            <p>
              2. Thứ tự cột:{" "}
              <b>Tên tổ | Tổ trưởng | Danh sách môn (cách nhau bởi dấu chấm phẩy) | Trường | Ghi chú</b>
            </p>
            <p>3. Ví dụ: Tổ Toán - Tin [TAB] Nguyễn Văn A [TAB] Toán;Tin học [TAB] THPT Chuyên</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trường học mặc định (dùng nếu không ghi rõ trong CSV/Excel):
            </label>
            <select
              value={bulkSchoolId}
              onChange={(e) => setBulkSchoolId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="">-- Chọn trường mặc định --</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-1 font-medium"
            >
              📄 Tải mẫu CSV
            </button>
            <label className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded cursor-pointer hover:bg-indigo-100 font-medium">
              📁 Tải file CSV lên
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dán nội dung từ Excel / CSV vào đây:
            </label>
            <textarea
              rows={4}
              value={bulkInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder={`Tổ Toán - Tin\tNguyễn Văn A\tToán;Tin học\tTrường THPT Chuyên\tTổ chuyên môn Toán Tin\nTổ Ngữ Văn\tTrần Thị B\tNgữ văn\t\t`}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
            />
          </div>

          {parsedGroups.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Xem trước dữ liệu sẽ nhập ({parsedGroups.length} tổ):
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg bg-gray-50 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 sticky top-0 border-b text-gray-700">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">Tên tổ</th>
                      <th className="p-2">Tổ trưởng</th>
                      <th className="p-2">Môn học</th>
                      <th className="p-2">Trường</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedGroups.map((g, idx) => (
                      <tr key={idx} className="hover:bg-white">
                        <td className="p-2 text-gray-400">{idx + 1}</td>
                        <td className="p-2 font-medium text-gray-900">{g.name}</td>
                        <td className="p-2 text-gray-600">{g.headTeacherName || "—"}</td>
                        <td className="p-2 text-gray-600">{g.subjects || "—"}</td>
                        <td className="p-2 text-gray-600">{g.schoolName || "(Mặc định)"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {bulkResult && (
            <div
              className={`p-3 rounded-lg text-sm border ${
                bulkResult.count > 0
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <p className="font-semibold">
                Kết quả: Đã thêm thành công {bulkResult.count} tổ chuyên môn.
              </p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-700 max-h-28 overflow-y-auto space-y-1">
                  <p className="font-semibold">Ghi chú / Cảnh báo:</p>
                  {bulkResult.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={bulkSubmitting || parsedGroups.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {bulkSubmitting
                ? "Đang tiến hành nhập..."
                : `Lưu tất cả ${parsedGroups.length} tổ chuyên môn`}
            </button>
          </div>
        </div>
      </Modal>

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        targetType="SUBJECT_GROUPS"
        onConfirmImport={handleDriveImportSubjectGroups}
        title="Nhập danh sách Tổ Chuyên Môn từ Google Drive"
      />
    </div>
  );
}
