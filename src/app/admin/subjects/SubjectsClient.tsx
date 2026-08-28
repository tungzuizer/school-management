"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubjects, getSchoolsForSelect, createSubject, updateSubject, deleteSubject } from "./actions";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Users, School, BookOpen, Eye, Crown, Plus, LayoutGrid, Table, Building2 } from "lucide-react";

export const STANDARD_VIETNAMESE_SUBJECTS = [
  "Toán học",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
  "Công nghệ",
  "Thể dục",
  "Âm nhạc",
  "Mỹ thuật",
  "Hoạt động trải nghiệm",
  "GDQP-AN",
];

interface TeacherData {
  id: string;
  user: { name: string };
}

interface TeachingAssignmentInfo {
  id: string;
  teacher: {
    id: string;
    specialty?: string | null;
    user: {
      name: string;
      email?: string | null;
      school?: { id: string; name: string } | null;
    };
  };
  classRoom?: { id: string; name: string; gradeLevel?: number | null } | null;
}

interface SubjectData {
  id: string;
  name: string;
  gradeLevel: number | null;
  headTeacherId?: string | null;
  headTeacher?: { id: string; user: { name: string; school?: { name: string } | null } } | null;
  teachingAssignments?: TeachingAssignmentInfo[];
  _count: { teachingAssignments: number; grades: number };
}

interface SchoolInfo {
  id: string;
  name: string;
  schoolType?: string | null;
}

interface SubjectsClientProps {
  initialSubjects: SubjectData[];
  initialTeachers: TeacherData[];
  schoolInfo?: SchoolInfo;
}

export default function SubjectsClient({ initialSubjects, initialTeachers, schoolInfo }: SubjectsClientProps) {
  const [subjects, setSubjects] = useState<SubjectData[]>(initialSubjects);
  const [teachers] = useState<TeacherData[]>(initialTeachers);
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [filterSchool, setFilterSchool] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  const [detailSubject, setDetailSubject] = useState<SubjectData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: STANDARD_VIETNAMESE_SUBJECTS[0], gradeLevel: "", headTeacherId: "" });
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const [data, schoolsList] = await Promise.all([
        getSubjects(debouncedSearch || undefined, filterSchool || undefined),
        getSchoolsForSelect(),
      ]);
      setSubjects(data as SubjectData[]);
      setSchools(schoolsList);
    } catch (e) {
      console.error("Failed to load subjects:", e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, filterSchool]);

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    loadData();
  }, [loadData, isInitialMount]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: STANDARD_VIETNAMESE_SUBJECTS[0], gradeLevel: "", headTeacherId: "" });
    setCustomSubjectName("");
    setModalOpen(true);
  };

  const openEdit = (s: SubjectData) => {
    setEditing(s);
    const isStandard = STANDARD_VIETNAMESE_SUBJECTS.includes(s.name);
    setForm({
      name: isStandard ? s.name : "OTHER",
      gradeLevel: s.gradeLevel?.toString() || "",
      headTeacherId: s.headTeacherId || ""
    });
    setCustomSubjectName(isStandard ? "" : s.name);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = form.name === "OTHER" ? customSubjectName.trim() : form.name;
    if (!finalName) { showToast("Vui lòng nhập tên môn học", "error"); return; }
    setSubmitting(true);
    const payload = {
      name: finalName,
      gradeLevel: form.gradeLevel ? parseInt(form.gradeLevel) : undefined,
      headTeacherId: form.headTeacherId || null,
    };
    const result = editing ? await updateSubject(editing.id, payload) : await createSubject(payload);
    setSubmitting(false);
    if (result.success) {
      showToast(editing ? "Cập nhật thành công" : "Thêm môn học thành công");
      setModalOpen(false);
      loadData(true);
    } else {
      showToast(result.error || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteSubject(id);
    setDeletingId(null);
    setDeleteConfirm(null);
    if (result.success) { showToast("Xóa thành công"); loadData(true); }
    else showToast(result.error || "Không thể xóa", "error");
  };

  const getSchoolTypeLabel = (type?: string | null) => {
    if (!type) return "THPT";
    if (type === "PRIMARY" || type.toLowerCase().includes("tiểu")) return "Tiểu học";
    if (type === "SECONDARY" || type.toLowerCase().includes("thcs") || type.toLowerCase().includes("trung học cơ sở")) return "THCS";
    if (type === "HIGH_SCHOOL" || type.toLowerCase().includes("thpt") || type.toLowerCase().includes("trung học phổ thông")) return "THPT";
    if (type === "MULTI_LEVEL" || type.toLowerCase().includes("liên cấp")) return "Liên cấp";
    return type;
  };

  // Group teaching assignments by teacher to display unique teachers and their classes
  const getTeacherAssignmentsSummary = (subject: SubjectData) => {
    if (!subject.teachingAssignments || subject.teachingAssignments.length === 0) return [];

    const map = new Map<string, {
      teacherName: string;
      specialty?: string | null;
      schoolName: string;
      classes: string[];
    }>();

    subject.teachingAssignments.forEach(ta => {
      const teacherId = ta.teacher.id;
      const teacherName = ta.teacher.user.name;
      const specialty = ta.teacher.specialty;
      const schoolName = ta.teacher.user.school?.name || schoolInfo?.name || "Trường học";
      const className = ta.classRoom?.name;

      if (!map.has(teacherId)) {
        map.set(teacherId, {
          teacherName,
          specialty,
          schoolName,
          classes: className ? [className] : []
        });
      } else {
        const item = map.get(teacherId)!;
        if (className && !item.classes.includes(className)) {
          item.classes.push(className);
        }
      }
    });

    return Array.from(map.values());
  };

  return (
    <div>
      {ToastComponent}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Quản lý Môn học
              {(loading || isRefreshing) && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
            </h1>
            {schoolInfo && (
              <span className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                <School className="w-3.5 h-3.5" />
                {schoolInfo.name} • {getSchoolTypeLabel(schoolInfo.schoolType)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">Danh sách môn học chuẩn theo chương trình giáo dục Việt Nam</p>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium text-sm shadow-2xs">
          <Plus className="w-4 h-4" /> Thêm môn học
        </button>
      </div>

      {/* School Cards Bar (Thẻ chọn Trường) */}
      {schools.length > 0 && (
        <div className="mb-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1.5"><School className="w-4 h-4 text-indigo-600" /> Chọn trường học để lọc môn học:</span>
            <span>{schools.length} Trường khả dụng</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterSchool("")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                filterSchool === ""
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-4 h-4" /> Tất cả các trường
            </button>
            {schools.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSchool(s.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  filterSchool === s.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <School className="w-4 h-4" /> {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Tìm theo tên môn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs w-64 bg-white shadow-2xs"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Dạng Thẻ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Table className="w-4 h-4" /> Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải môn học...</div>
          ) : subjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Chưa có môn học nào</div>
          ) : (
            subjects.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between hover-lift group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                      {s.gradeLevel ? `Khối ${s.gradeLevel}` : "Tất cả khối"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Trưởng bộ môn:</span>{" "}
                    {s.headTeacher?.user?.name ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-700">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        {s.headTeacher.user.name}
                      </span>
                    ) : (
                      "Chưa phân công"
                    )}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                    <button
                      onClick={() => setDetailSubject(s)}
                      className="bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg border border-indigo-100 text-center transition-colors group/btn"
                    >
                      <span className="text-indigo-600 font-semibold text-[10px] group-hover/btn:underline flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3 text-indigo-600" /> Xem Giáo viên
                      </span>
                      <span className="font-extrabold text-indigo-800">{s._count.teachingAssignments} GV</span>
                    </button>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                      <span className="text-slate-400 block font-semibold">Số điểm</span>
                      <span className="font-extrabold text-indigo-600">{s._count.grades}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button onClick={() => openEdit(s)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Chỉnh sửa
                  </button>
                  <button onClick={() => setDeleteConfirm(s.id)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tên môn học</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Khối lớp</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trưởng bộ môn</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Giáo viên phụ trách</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Số điểm đã nhập</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subjects.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có môn học nào</td></tr>
              ) : (
                subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailSubject(s)}>
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.gradeLevel ? `Khối ${s.gradeLevel}` : "Tất cả"}</td>
                    <td className="px-6 py-4 text-indigo-700 font-medium">
                      {s.headTeacher?.user?.name ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          👑 {s.headTeacher.user.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailSubject(s); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {s._count.teachingAssignments} Giáo viên (Xem chi tiết)
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{s._count.grades}</td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
                      <button onClick={() => setDeleteConfirm(s.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal View Detail Teacher List per Subject */}
      <Modal
        isOpen={!!detailSubject}
        onClose={() => setDetailSubject(null)}
        title={`Chi tiết môn: ${detailSubject?.name || ""}`}
        size="md"
      >
        {detailSubject && (
          <div className="space-y-4">
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex flex-wrap justify-between items-center gap-2">
              <div>
                <h4 className="font-bold text-indigo-950 text-base">{detailSubject.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Khối áp dụng: <span className="font-semibold text-slate-900">{detailSubject.gradeLevel ? `Khối ${detailSubject.gradeLevel}` : "Tất cả các khối"}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Trưởng bộ môn</span>
                <span className="font-bold text-indigo-700 text-sm">
                  {detailSubject.headTeacher?.user?.name ? `👑 ${detailSubject.headTeacher.user.name}` : "Chưa chỉ định"}
                </span>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Danh sách giáo viên giảng dạy ({getTeacherAssignmentsSummary(detailSubject).length})
              </h5>

              {getTeacherAssignmentsSummary(detailSubject).length === 0 ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-6 text-center text-slate-500 text-xs">
                  Chưa có giáo viên nào được phân công giảng dạy môn học này.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {getTeacherAssignmentsSummary(detailSubject).map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs hover:border-indigo-200 transition-colors flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.teacherName}</span>
                          {item.specialty && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              CM: {item.specialty}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <School className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{item.schoolName}</span>
                        </div>
                        {item.classes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            <span className="text-[10px] text-slate-400 font-semibold self-center">Lớp:</span>
                            {item.classes.map((cls, cIdx) => (
                              <span key={cIdx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium border border-indigo-100">
                                {cls}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setDetailSubject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Add / Edit Subject */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Sửa môn học" : "Thêm môn học mới"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
            <select
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              required
            >
              {STANDARD_VIETNAMESE_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="OTHER">-- Môn học khác --</option>
            </select>
          </div>

          {form.name === "OTHER" && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên môn học khác *</label>
              <input
                type="text"
                placeholder="Nhập tên môn học..."
                value={customSubjectName}
                onChange={(e) => setCustomSubjectName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khối lớp áp dụng</label>
            <select value={form.gradeLevel} onChange={(e) => setForm({...form, gradeLevel: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">Tất cả khối</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng bộ môn</label>
            <select value={form.headTeacherId} onChange={(e) => setForm({...form, headTeacherId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="">-- Chưa chỉ định --</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.user.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">Hủy</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => !deletingId && setDeleteConfirm(null)} title="Xác nhận xóa" size="sm">
        <p className="text-gray-600 mb-6 text-sm">Bạn có chắc muốn xóa môn học này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} disabled={!!deletingId} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">Hủy</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={!!deletingId} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium">
            {deletingId && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{deletingId ? "Đang xóa..." : "Xóa"}</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
