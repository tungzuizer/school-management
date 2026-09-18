/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/role-scopes/page.tsx` Admin RBAC Role Scopes Matrix.
 * 2. Affected APIs: `RoleScopesClient` Client Component for UserRoleScope management.
 * 3. Schemas: `UserScopeItem`, `ScopeLookupUser`, `ScopeLookupCampus`, `ScopeLookupWard`, `ScopeLookupSubjectGroup`, actions `createUserRoleScope`, `deleteUserRoleScope`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Giao diện Ma trận Phân quyền & Quản trị Scope (/admin/role-scopes).
 */

"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  Key,
  Users,
  Building,
  MapPin,
  BookOpen,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Filter,
  Lock,
} from "lucide-react";
import { Role, ScopeType } from "@prisma/client";
import {
  UserScopeItem,
  ScopeLookupUser,
  ScopeLookupCampus,
  ScopeLookupWard,
  ScopeLookupSubjectGroup,
  createUserRoleScope,
  deleteUserRoleScope,
} from "./actions";

interface RoleScopesClientProps {
  initialScopes: UserScopeItem[];
  users: ScopeLookupUser[];
  campuses: ScopeLookupCampus[];
  wards: ScopeLookupWard[];
  subjectGroups: ScopeLookupSubjectGroup[];
  stats: {
    totalScopes: number;
    campusScopes: number;
    subjectGroupScopes: number;
    wardScopes: number;
    globalScopes: number;
  } | null;
}

export default function RoleScopesClient({
  initialScopes,
  users,
  campuses,
  wards,
  subjectGroups,
  stats,
}: RoleScopesClientProps) {
  const [scopes, setScopes] = useState<UserScopeItem[]>(initialScopes);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedScopeType, setSelectedScopeType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [modalRole, setModalRole] = useState<Role>(Role.VICE_PRINCIPAL);
  const [modalScopeType, setModalScopeType] = useState<ScopeType>(ScopeType.CAMPUS);
  const [modalScopeId, setModalScopeId] = useState<string>("");
  const [modalSubjectGroupId, setModalSubjectGroupId] = useState<string>("");

  // Delete State
  const [deletingScope, setDeletingScope] = useState<UserScopeItem | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const filteredScopes = scopes.filter((s) => {
    const matchRole = selectedRole === "ALL" || s.role === selectedRole;
    const matchType = selectedScopeType === "ALL" || s.scopeType === selectedScopeType;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.userName.toLowerCase().includes(q) ||
      s.userEmail.toLowerCase().includes(q) ||
      s.scopeTargetName.toLowerCase().includes(q) ||
      s.schoolName.toLowerCase().includes(q);
    return matchRole && matchType && matchSearch;
  });

  const handleOpenCreateModal = () => {
    const firstUser = users[0];
    setSelectedUserId(firstUser?.id || "");
    setModalRole(firstUser?.role || Role.VICE_PRINCIPAL);

    // Auto select appropriate ScopeType according to user role
    if (firstUser?.role === Role.VICE_PRINCIPAL) {
      setModalScopeType(ScopeType.CAMPUS);
      setModalScopeId(campuses[0]?.id || "");
    } else if (firstUser?.role === Role.SUBJECT_HEAD) {
      setModalScopeType(ScopeType.SUBJECT_GROUP);
      setModalScopeId(subjectGroups[0]?.id || "");
    } else if (firstUser?.role === Role.WARD_ADMIN || firstUser?.role === Role.DISTRICT_ADMIN) {
      setModalScopeType(ScopeType.WARD);
      setModalScopeId(wards[0]?.id || "");
    } else {
      setModalScopeType(ScopeType.GLOBAL);
      setModalScopeId("");
    }

    setModalSubjectGroupId("");
    setIsModalOpen(true);
  };

  const handleUserSelectChange = (uid: string) => {
    setSelectedUserId(uid);
    const u = users.find((item) => item.id === uid);
    if (!u) return;

    setModalRole(u.role);
    if (u.role === Role.VICE_PRINCIPAL) {
      setModalScopeType(ScopeType.CAMPUS);
      setModalScopeId(campuses[0]?.id || "");
    } else if (u.role === Role.SUBJECT_HEAD) {
      setModalScopeType(ScopeType.SUBJECT_GROUP);
      setModalScopeId(subjectGroups[0]?.id || "");
    } else if (u.role === Role.WARD_ADMIN || u.role === Role.DISTRICT_ADMIN) {
      setModalScopeType(ScopeType.WARD);
      setModalScopeId(wards[0]?.id || "");
    } else {
      setModalScopeType(ScopeType.GLOBAL);
      setModalScopeId("");
    }
  };

  const handleSubmitScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showNotification("error", "Vui lòng chọn nhân sự");
      return;
    }

    startTransition(async () => {
      const res = await createUserRoleScope({
        userId: selectedUserId,
        role: modalRole,
        scopeType: modalScopeType,
        scopeId: modalScopeType !== ScopeType.GLOBAL ? modalScopeId : undefined,
        subjectGroupId: modalScopeType === ScopeType.SUBJECT_GROUP ? modalScopeId : undefined,
      });

      if (res.success && res.data) {
        const targetUser = users.find((u) => u.id === selectedUserId);
        let targetName = "Toàn cục (Global)";
        if (modalScopeType === ScopeType.CAMPUS) {
          const camp = campuses.find((c) => c.id === modalScopeId);
          targetName = camp ? `${camp.name} (${camp.schoolName})` : modalScopeId;
        } else if (modalScopeType === ScopeType.WARD) {
          const w = wards.find((wd) => wd.id === modalScopeId);
          targetName = w ? `${w.name} - ${w.departmentName}` : modalScopeId;
        } else if (modalScopeType === ScopeType.SUBJECT_GROUP) {
          const sg = subjectGroups.find((g) => g.id === modalScopeId);
          targetName = sg ? `Tổ: ${sg.name} (${sg.schoolName})` : modalScopeId;
        }

        const newScopeItem: UserScopeItem = {
          id: res.data.id,
          userId: res.data.userId,
          userName: targetUser?.name || "Không rõ",
          userEmail: targetUser?.email || "Chưa có email",
          role: res.data.role,
          scopeType: res.data.scopeType,
          scopeId: res.data.scopeId,
          scopeTargetName: targetName,
          subjectGroupId: res.data.subjectGroupId,
          subjectGroupName: null,
          schoolName: targetUser?.schoolName || "Toàn quốc",
          createdAt: new Date().toISOString(),
        };

        setScopes((prev) => [newScopeItem, ...prev]);
        setIsModalOpen(false);
        showNotification("success", `Đã gán phạm vi quyền cho ${targetUser?.email}`);
      } else {
        showNotification("error", res.error || "Lỗi khi gán phạm vi quyền");
      }
    });
  };

  const handleDeleteScopeConfirm = () => {
    if (!deletingScope) return;
    startTransition(async () => {
      const res = await deleteUserRoleScope(deletingScope.id);
      if (res.success) {
        setScopes((prev) => prev.filter((s) => s.id !== deletingScope.id));
        showNotification("success", `Đã hủy phạm vi quyền của ${deletingScope.userEmail}`);
        setDeletingScope(null);
      } else {
        showNotification("error", res.error || "Lỗi khi hủy phạm vi quyền");
      }
    });
  };

  const getScopeBadge = (scopeType: ScopeType) => {
    switch (scopeType) {
      case ScopeType.CAMPUS:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px]">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>Phân hiệu / Cơ sở (Campus)</span>
          </span>
        );
      case ScopeType.SUBJECT_GROUP:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            <span>Tổ Chuyên Môn (Liên Cơ Sở)</span>
          </span>
        );
      case ScopeType.WARD:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px]">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Địa Bàn / Khu Vực (Ward)</span>
          </span>
        );
      case ScopeType.GLOBAL:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px]">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Toàn Cục Toàn Trường (Global)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-rose-50 border-rose-300 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-bold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:bg-black/5 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Scope Cơ Sở / Phân Hiệu</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.campusScopes}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Phó Hiệu trưởng phụ trách</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Building className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Scope Tổ Chuyên Môn</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.subjectGroupScopes}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tổ trưởng liên cơ sở</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent bg-white p-5 rounded-3xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Scope Khu Vực Địa Bàn</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.wardScopes}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cán bộ Quận / Huyện / Xã</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tổng Thiết Lập Phân Quyền</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{scopes.length}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ma trận RBAC toàn hệ thống</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Tên, Email, Phạm vi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Vai trò:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value={Role.VICE_PRINCIPAL}>Phó Hiệu Trưởng</option>
              <option value={Role.SUBJECT_HEAD}>Tổ Trưởng Chuyên Môn</option>
              <option value={Role.WARD_ADMIN}>Cán bộ UBND Xã</option>
              <option value={Role.DISTRICT_ADMIN}>Cán bộ Phòng GD&ĐT</option>
              <option value={Role.ADMIN}>Hiệu Trưởng</option>
            </select>
          </div>

          {/* ScopeType Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">Phạm vi:</span>
            <select
              value={selectedScopeType}
              onChange={(e) => setSelectedScopeType(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="ALL">Tất cả loại Scope</option>
              <option value={ScopeType.CAMPUS}>Cơ Sở / Phân Hiệu (Campus)</option>
              <option value={ScopeType.SUBJECT_GROUP}>Tổ Chuyên Môn (SubjectGroup)</option>
              <option value={ScopeType.WARD}>Địa bàn Khu vực (Ward)</option>
              <option value={ScopeType.GLOBAL}>Toàn cục (Global)</option>
            </select>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Gán Phân Quyền Phạm Vi Mới</span>
          </button>
        </div>
      </div>

      {/* Main Scopes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Cán Bộ / Nhân Sự</th>
                <th className="py-3.5 px-5">Vai Trò Được Gán</th>
                <th className="py-3.5 px-5">Loại Phạm Vi (Scope)</th>
                <th className="py-3.5 px-5">Đối Tượng Áp Dụng</th>
                <th className="py-3.5 px-5">Trường Đơn Vị</th>
                <th className="py-3.5 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredScopes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-sm">Chưa có thiết lập phân quyền phạm vi nào</p>
                    <p className="text-xs text-slate-400 mt-0.5">Hãy bấm "Gán Phân Quyền Phạm Vi Mới" để thiết lập.</p>
                  </td>
                </tr>
              ) : (
                filteredScopes.map((scope) => (
                  <tr key={scope.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shrink-0">
                          {scope.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{scope.userName}</p>
                          <p className="text-[11px] text-slate-500">{scope.userEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-xl font-extrabold border border-slate-200 text-[11px]">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{scope.role}</span>
                      </span>
                    </td>

                    <td className="py-4 px-5">{getScopeBadge(scope.scopeType)}</td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-slate-900">{scope.scopeTargetName}</span>
                    </td>

                    <td className="py-4 px-5 text-slate-600 font-medium">{scope.schoolName}</td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setDeletingScope(scope)}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-600 transition cursor-pointer"
                        title="Hủy phân quyền phạm vi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Thiết Lập Phân Quyền Phạm Vi (RBAC)</h3>
                  <p className="text-xs text-slate-500">Giới hạn không gian dữ liệu hoạt động của nhân sự</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitScope} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tài Khoản Cán Bộ / Nhân Sự <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleUserSelectChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="">-- Chọn Cán Bộ --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role} [{u.schoolName}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Vai Trò Phân Quyền <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value={Role.VICE_PRINCIPAL}>Phó Hiệu Trưởng</option>
                    <option value={Role.SUBJECT_HEAD}>Tổ Trưởng Chuyên Môn</option>
                    <option value={Role.WARD_ADMIN}>Cán bộ UBND Xã</option>
                    <option value={Role.DISTRICT_ADMIN}>Cán bộ Phòng GD&ĐT</option>
                    <option value={Role.ADMIN}>Hiệu Trưởng</option>
                    <option value={Role.TEACHER}>Giáo Viên</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Loại Phạm Vi (Scope) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalScopeType}
                    onChange={(e) => {
                      const newType = e.target.value as ScopeType;
                      setModalScopeType(newType);
                      if (newType === ScopeType.CAMPUS) setModalScopeId(campuses[0]?.id || "");
                      else if (newType === ScopeType.SUBJECT_GROUP) setModalScopeId(subjectGroups[0]?.id || "");
                      else if (newType === ScopeType.WARD) setModalScopeId(wards[0]?.id || "");
                      else setModalScopeId("");
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    <option value={ScopeType.CAMPUS}>Cơ Sở / Phân Hiệu (Campus)</option>
                    <option value={ScopeType.SUBJECT_GROUP}>Tổ Chuyên Môn (SubjectGroup)</option>
                    <option value={ScopeType.WARD}>Khu Vực / Địa Bàn (Ward)</option>
                    <option value={ScopeType.GLOBAL}>Toàn Cục (Global)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Target Selector depending on ScopeType */}
              {modalScopeType === ScopeType.CAMPUS && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Chọn Cơ Sở / Phân Hiệu Quản Lý <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalScopeId}
                    onChange={(e) => setModalScopeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - [{c.schoolName}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalScopeType === ScopeType.SUBJECT_GROUP && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Chọn Tổ Chuyên Môn Quản Lý <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalScopeId}
                    onChange={(e) => setModalScopeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {subjectGroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name} - [{sg.schoolName}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalScopeType === ScopeType.WARD && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Chọn Quận Huyện / Xã Quản Lý <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={modalScopeId}
                    onChange={(e) => setModalScopeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} - [{w.departmentName}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalScopeType === ScopeType.GLOBAL && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-start gap-2">
                  <Globe className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Phạm vi <strong>Toàn Cục (Global)</strong> cho phép tài khoản có quyền truy cập toàn bộ các cơ sở, điểm trường
                    và lớp học thuộc quyền của đơn vị.
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang gán..." : "Gán Phân Quyền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingScope && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác Nhận Hủy Phân Quyền</h3>
                <p className="text-xs text-slate-500">Hành động này sẽ thu hồi quyền truy cập tương ứng</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn hủy phân quyền <strong className="text-slate-900 font-bold">{deletingScope.role}</strong> (
              {deletingScope.scopeTargetName}) của tài khoản{" "}
              <strong className="text-slate-900 font-bold">{deletingScope.userEmail}</strong>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingScope(null)}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeleteScopeConfirm}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Đang hủy..." : "Xác Nhận Hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
