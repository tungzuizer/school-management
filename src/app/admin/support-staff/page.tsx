/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router route `/admin/support-staff`, referenced in `src/app/admin/layout.tsx`.
 * 2. Affected APIs: `src/app/admin/support-staff/page.tsx`.
 * 3. Schemas: Prisma ORM models (`School`, `Campus`, `User`, `Teacher`).
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  Calculator,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Edit,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  getSupportStaffAction,
  updateSupportStaffAssignmentAction,
  type SupportStaffRecord,
  type SupportStaffPageData,
} from "./actions";
import { type SupportStaffRole } from "@/lib/nq37-engine";

export default function SupportStaffPage() {
  const [data, setData] = useState<SupportStaffPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [selectedGroup, setSelectedGroup] = useState<"ALL" | "SHARED" | "CAMPUS_SPECIFIC">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State
  const [editingStaff, setEditingStaff] = useState<SupportStaffRecord | null>(null);
  const [modalRole, setModalRole] = useState<SupportStaffRole>("EQUIPMENT_LAB");
  const [modalCampusId, setModalCampusId] = useState<string>("");
  const [modalDegree, setModalDegree] = useState("");
  const [modalHasMed, setModalHasMed] = useState(false);
  const [modalHasAcc, setModalHasAcc] = useState(false);
  const [modalDualNotes, setModalDualNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const res = await getSupportStaffAction();
      setData(res);
    } catch (err) {
      console.error("Failed to load support staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const openEditModal = (staff: SupportStaffRecord) => {
    setEditingStaff(staff);
    setModalRole(staff.role);
    setModalCampusId(staff.campusId || "");
    setModalDegree(staff.degreeName);
    setModalHasMed(staff.hasMedicalCertificate);
    setModalHasAcc(staff.hasAccountingCertificate);
    setModalDualNotes(staff.dualRoleNotes || "");
    setModalError(null);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    // Client-side rule blocker (Điều 5.3.b & Điều 5.3.c)
    if (modalRole === "MEDICAL_HEALTH" && !modalHasMed) {
      setModalError(
        "CẢNH BÁO ĐỎ (Điều 5.3.b NQ 37): Tuyệt đối không được phân công vào vị trí Y tế trường học nếu chưa có văn bằng/chứng chỉ y tế."
      );
      return;
    }

    if (modalRole === "ACCOUNTANT" && !modalHasAcc) {
      setModalError(
        "CẢNH BÁO ĐỎ (Điều 5.3.c NQ 37): Tuyệt đối không được phân công vào vị trí Kế toán nếu chưa có chứng chỉ/văn bằng chuyên ngành tài chính kế toán."
      );
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      await updateSupportStaffAssignmentAction({
        userId: editingStaff.id,
        role: modalRole,
        campusId: modalCampusId || null,
        degree: modalDegree,
        hasMedicalCertificate: modalHasMed,
        hasAccountingCertificate: modalHasAcc,
        dualRoleNotes: modalDualNotes,
      });
      setEditingStaff(null);
      await loadStaffData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError("Đã xảy ra lỗi khi lưu.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Đang tải danh sách nhân sự hỗ trợ giáo dục...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800">Không thể tải dữ liệu nhân sự</h3>
      </div>
    );
  }

  // Filter staff
  const filteredStaff = data.staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roleLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCampus =
      selectedCampus === "ALL" ||
      (selectedCampus === "SHARED" && s.isShared) ||
      s.campusId === selectedCampus;

    const matchesGroup =
      selectedGroup === "ALL" ||
      (selectedGroup === "SHARED" && s.isShared) ||
      (selectedGroup === "CAMPUS_SPECIFIC" && !s.isShared);

    const matchesStatus =
      selectedStatus === "ALL" || s.qualificationStatus === selectedStatus;

    return matchesSearch && matchesCampus && matchesGroup && matchesStatus;
  });

  const sharedCount = data.staffList.filter((s) => s.isShared).length;
  const campusSpecificCount = data.staffList.filter((s) => !s.isShared).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Điều 5 Nghị quyết 37/2026/NQ-CP
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Trường: {data.schoolName} ({data.totalClasses} lớp học)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản Lý & Phân Công Nhân Sự Hỗ Trợ Giáo Dục
          </h1>
          <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
            Phân định rõ ràng giữa <strong>Nhóm Dùng Chung Toàn Trường</strong> (Kế toán, Văn thư, Thủ quỹ) và{" "}
            <strong>Nhóm Bố Trí Theo Từng Phân Hiệu</strong> (7 vị trí chuyên môn), kiểm soát chặt chẽ tiêu chuẩn chứng chỉ y tế và kế toán.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
            <span className="text-xs text-indigo-700/80 font-medium block">Tổng Nhân Sự</span>
            <strong className="text-xl font-bold text-indigo-900">{data.staffList.length} người</strong>
          </div>
        </div>
      </div>

      {/* 2. Overview Classification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Nhóm dùng chung */}
        <div className="p-5 bg-gradient-to-br from-blue-50/60 to-white rounded-2xl border border-blue-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Nhóm Dùng Chung Toàn Trường (Điều 5.1.a)
            </span>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
              {sharedCount} nhân sự
            </span>
          </div>
          <p className="text-xs text-blue-950/80 leading-relaxed">
            Bao gồm <strong>Kế toán</strong> (1-2 người), <strong>Văn thư</strong> (1 người), <strong>Thủ quỹ</strong> (1 người). Phục vụ công tác hành chính, tài chính chung cho cả trường chính và các phân hiệu.
          </p>
          <div className="pt-2 border-t border-blue-100 flex items-center gap-4 text-xs font-medium text-blue-900">
            <span>• Kế toán: {data.staffList.filter((s) => s.role === "ACCOUNTANT").length}</span>
            <span>• Văn thư: {data.staffList.filter((s) => s.role === "CLERK").length}</span>
            <span>• Thủ quỹ: {data.staffList.filter((s) => s.role === "TREASURER").length}</span>
          </div>
        </div>

        {/* Card 2: Nhóm theo phân hiệu */}
        <div className="p-5 bg-gradient-to-br from-teal-50/60 to-white rounded-2xl border border-teal-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Nhóm Bố Trí Theo Phân Hiệu (Điều 5.1.b)
            </span>
            <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">
              {campusSpecificCount} nhân sự
            </span>
          </div>
          <p className="text-xs text-teal-950/80 leading-relaxed">
            Mỗi cơ sở bố trí 01 người cho từng vị trí: <strong>Thiết bị/TN, Thư viện, Giáo vụ, Tâm lý học đường, Hỗ trợ khuyết tật, CNTT, Y tế</strong> (Có thể kiêm nhiệm theo Điều 5.1.c).
          </p>
          <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-xs font-medium text-teal-950">
            <span>Định mức: 7 vị trí / cơ sở</span>
            <span className="text-emerald-700 font-bold">Lộ trình 36 tháng áp dụng</span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, chức danh, chuyên môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value as "ALL" | "SHARED" | "CAMPUS_SPECIFIC")}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="ALL">Tất cả nhóm vị trí</option>
          <option value="SHARED">Nhóm dùng chung (Điều 5.1.a)</option>
          <option value="CAMPUS_SPECIFIC">Nhóm theo phân hiệu (Điều 5.1.b)</option>
        </select>

        {/* Campus Filter */}
        <select
          value={selectedCampus}
          onChange={(e) => setSelectedCampus(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="ALL">Tất cả cơ sở</option>
          {data.campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.isMainCampus ? "(Trường chính)" : "(Phân hiệu)"}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái chuẩn hóa</option>
          <option value="QUALIFIED">Đã đạt chuẩn</option>
          <option value="IN_TRAINING_36M">Đang trong thời hạn 36 tháng</option>
          <option value="UNQUALIFIED_BLOCKED">Cảnh báo chưa đạt chuẩn</option>
        </select>
      </div>

      {/* 4. Staff Data Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4">Nhân Sự Hỗ Trợ</th>
                <th className="py-3.5 px-4">Vị Trí Phân Công (NQ 37)</th>
                <th className="py-3.5 px-4">Phân Loại Nhóm</th>
                <th className="py-3.5 px-4">Cơ Sở Trực Thuộc</th>
                <th className="py-3.5 px-4">Văn Bằng & Chứng Chỉ</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Chuẩn Hóa</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                    Không tìm thấy nhân sự phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-xs">{staff.name}</div>
                      <div className="text-[11px] text-gray-500">{staff.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-indigo-900 text-xs block">
                        {staff.roleLabel}
                      </span>
                      {staff.isDualRole && (
                        <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                          {staff.dualRoleNotes || "Kiêm nhiệm"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {staff.isShared ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                          Dùng chung (5.1.a)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold text-[11px]">
                          Phân hiệu (5.1.b)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-700 font-medium">
                      {staff.campusName}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-600">
                      <span className="block truncate max-w-[180px]">{staff.degreeName}</span>
                      {staff.role === "MEDICAL_HEALTH" && (
                        <span
                          className={`text-[10px] font-bold ${
                            staff.hasMedicalCertificate ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {staff.hasMedicalCertificate ? "✓ Đủ chuẩn Y tế" : "✗ Thiếu chứng chỉ Y tế"}
                        </span>
                      )}
                      {staff.role === "ACCOUNTANT" && (
                        <span
                          className={`text-[10px] font-bold ${
                            staff.hasAccountingCertificate ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {staff.hasAccountingCertificate ? "✓ Đủ chuẩn Kế toán" : "✗ Thiếu chứng chỉ Kế toán"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {staff.qualificationStatus === "QUALIFIED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Đạt chuẩn
                        </span>
                      )}
                      {staff.qualificationStatus === "IN_TRAINING_36M" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 mr-1" /> 36 tháng đào tạo
                        </span>
                      )}
                      {staff.qualificationStatus === "UNQUALIFIED_BLOCKED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Cảnh báo đỏ
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(staff)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Phân Công
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Edit Staff Assignment Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Phân Công & Chuẩn Hóa Hồ Sơ Nhân Sự
                </h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 text-xs space-y-1">
                <div className="font-bold text-indigo-950">{editingStaff.name}</div>
                <div className="text-indigo-800/80 font-medium">{editingStaff.email}</div>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{modalError}</div>
                </div>
              )}

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Vị trí việc làm hỗ trợ (NQ 37)</label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as SupportStaffRole)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <optgroup label="Nhóm Dùng Chung Toàn Trường (Điều 5.1.a)">
                    <option value="ACCOUNTANT">Kế toán dùng chung</option>
                    <option value="CLERK">Văn thư dùng chung</option>
                    <option value="TREASURER">Thủ quỹ dùng chung</option>
                  </optgroup>
                  <optgroup label="Nhóm Bố Trí Theo Phân Hiệu (Điều 5.1.b)">
                    <option value="EQUIPMENT_LAB">Thiết bị, thí nghiệm</option>
                    <option value="LIBRARY">Thư viện</option>
                    <option value="ACADEMIC_AFFAIRS">Giáo vụ</option>
                    <option value="STUDENT_COUNSELING">Tư vấn tâm lý học sinh</option>
                    <option value="DISABILITY_SUPPORT">Hỗ trợ giáo dục khuyết tật</option>
                    <option value="IT_OFFICE_ADMIN">CNTT / Quản trị công sở</option>
                    <option value="MEDICAL_HEALTH">Y tế trường học</option>
                  </optgroup>
                </select>
              </div>

              {/* Campus Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Cơ sở / Phân hiệu phụ trách</label>
                <select
                  value={modalCampusId}
                  onChange={(e) => setModalCampusId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Toàn trường (Dùng chung cho cả trường chính & phân hiệu)</option>
                  {data.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isMainCampus ? "(Trường chính)" : "(Phân hiệu)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree / Qualification */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Văn bằng / Trình độ đào tạo hiện có</label>
                <input
                  type="text"
                  value={modalDegree}
                  onChange={(e) => setModalDegree(e.target.value)}
                  placeholder="Ví dụ: Cử nhân Kế toán, Y sĩ đa khoa, Cử nhân CNTT..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Mandatory Certification Checks */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={modalHasMed}
                    onChange={(e) => setModalHasMed(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Đã có bằng cấp / chứng chỉ chuyên ngành Y tế (Điều 5.3.b)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={modalHasAcc}
                    onChange={(e) => setModalHasAcc(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Đã có văn bằng / chứng chỉ chuyên ngành Tài chính - Kế toán (Điều 5.3.c)</span>
                </label>
              </div>

              {/* Dual role notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Ghi chú kiêm nhiệm liên cơ sở (Điều 5.1.c)
                </label>
                <input
                  type="text"
                  value={modalDualNotes}
                  onChange={(e) => setModalDualNotes(e.target.value)}
                  placeholder="Ví dụ: Kiêm nhiệm quản lý thiết bị phòng Lab tại Phân hiệu 2..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {isSaving ? "Đang lưu..." : "Cập Nhật Hồ Sơ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
