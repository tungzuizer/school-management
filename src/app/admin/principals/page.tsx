"use client";

import { useEffect, useState } from "react";
import {
  Landmark,
  Building2,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  ArrowRightLeft,
  Users,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import {
  getPrincipalsAndAdmins,
  togglePrincipalApproval,
  updatePrincipalAssignment,
  createPrincipalAccount,
  deletePrincipalAccount,
  resetUserPassword,
  PrincipalUserItem,
} from "./actions";

interface OptionItem {
  id: string;
  name: string;
  departmentId?: string | null;
  districtWardId?: string | null;
}

export default function AdminPrincipalsPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [users, setUsers] = useState<PrincipalUserItem[]>([]);
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [districtWards, setDistrictWards] = useState<OptionItem[]>([]);
  const [schools, setSchools] = useState<OptionItem[]>([]);

  // Filter states
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDistrictWardId, setSelectedDistrictWardId] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeUser, setActiveUser] = useState<PrincipalUserItem | null>(null);

  // Form states for Create
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "VICE_PRINCIPAL" | "DEPARTMENT_ADMIN" | "WARD_ADMIN">("ADMIN");
  const [newSchoolId, setNewSchoolId] = useState("");
  const [newDeptId, setNewDeptId] = useState("");
  const [newWardId, setNewWardId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Transfer
  const [transferRole, setTransferRole] = useState<"ADMIN" | "VICE_PRINCIPAL" | "DEPARTMENT_ADMIN" | "WARD_ADMIN">("ADMIN");
  const [transferSchoolId, setTransferSchoolId] = useState("");
  const [transferDeptId, setTransferDeptId] = useState("");
  const [transferWardId, setTransferWardId] = useState("");

  // Form states for Password Reset
  const [resetUser, setResetUser] = useState<PrincipalUserItem | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [resetSuccessInfo, setResetSuccessInfo] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    const res = await getPrincipalsAndAdmins({
      departmentId: selectedDeptId || undefined,
      districtWardId: selectedDistrictWardId || undefined,
      schoolId: selectedSchoolId || undefined,
      role: selectedRole !== "ALL" ? selectedRole : undefined,
      status: selectedStatus,
      search: searchTerm || undefined,
    });

    if (res.success) {
      setUsers(res.data);
      setDepartments(res.departments);
      setDistrictWards(res.districtWards);
      setSchools(res.schools);
    } else {
      setErrorMsg(res.error || "Không thể tải danh sách tài khoản.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, selectedDistrictWardId, selectedSchoolId, selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleApproval = async (userId: string, currentApproved: boolean) => {
    const nextApproved = !currentApproved;
    const res = await togglePrincipalApproval(userId, nextApproved);
    if (res.success) {
      setSuccessMsg(nextApproved ? "Đã phê duyệt cấp quyền tài khoản!" : "Đã hủy quyền tài khoản!");
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.error || "Không thể cập nhật trạng thái.");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản Hiệu trưởng/Cán bộ: "${userName}"?`)) return;
    const res = await deletePrincipalAccount(userId);
    if (res.success) {
      setSuccessMsg("Đã xóa tài khoản thành công!");
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.error || "Không thể xóa tài khoản.");
    }
  };

  const openTransferModal = (u: PrincipalUserItem) => {
    setActiveUser(u);
    setTransferRole(u.role as any);
    setTransferSchoolId(u.schoolId || "");
    setTransferDeptId(u.departmentId || "");
    setTransferWardId(u.districtWardId || "");
    setShowTransferModal(true);
  };

  const openPasswordModal = (u: PrincipalUserItem) => {
    setResetUser(u);
    setCustomPasswordInput("123456");
    setShowPasswordText(true);
    setResetSuccessInfo("");
    setShowPasswordModal(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setIsSubmitting(true);
    const pwdToSet = customPasswordInput.trim() || "123456";
    const res = await resetUserPassword(resetUser.id, pwdToSet);
    setIsSubmitting(false);

    if (res.success) {
      setResetSuccessInfo(`Đã đặt lại mật khẩu thành công cho ${resetUser.name}: "${pwdToSet}"`);
      setSuccessMsg(`Đã đổi mật khẩu tài khoản ${resetUser.email} thành "${pwdToSet}"`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      setErrorMsg(res.error || "Đặt lại mật khẩu thất bại.");
    }
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    setIsSubmitting(true);
    const res = await updatePrincipalAssignment({
      userId: activeUser.id,
      role: transferRole as any,
      schoolId: transferSchoolId || null,
      departmentId: transferDeptId || null,
      districtWardId: transferWardId || null,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Đã cập nhật công tác / chuyển quyền cho Hiệu trưởng!");
      setShowTransferModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.error || "Cập nhật thất bại.");
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createPrincipalAccount({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      schoolId: newSchoolId || undefined,
      departmentId: newDeptId || undefined,
      districtWardId: newWardId || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Tạo mới tài khoản Hiệu trưởng / Cán bộ thành công!");
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.error || "Tạo tài khoản thất bại.");
    }
  };

  // Stats calculation
  const totalPrincipals = users.filter((u) => u.role === "ADMIN").length;
  const totalVicePrincipals = users.filter((u) => u.role === "VICE_PRINCIPAL").length;
  const totalDeptAdmins = users.filter((u) => u.role === "DEPARTMENT_ADMIN" || u.role === "WARD_ADMIN").length;
  const pendingCount = users.filter((u) => !u.isApproved).length;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Hiệu trưởng", color: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "VICE_PRINCIPAL":
        return { label: "Phó Hiệu trưởng", color: "bg-teal-100 text-teal-800 border-teal-200" };
      case "DEPARTMENT_ADMIN":
        return { label: "Cán bộ Sở GD&ĐT", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "WARD_ADMIN":
        return { label: "Cán bộ Phòng GD&ĐT", color: "bg-amber-100 text-amber-800 border-amber-200" };
      default:
        return { label: role, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getKnownPassword = (email: string) => {
    if (email === "superadmin@school.com") return "SuperAdmin@2026!";
    if (email.includes("admin")) return "123456";
    if (email.includes("vp")) return "123456";
    if (email.includes("teacher")) return "123456";
    if (email.includes("student")) return "123456";
    return "123456 (hoặc mật khẩu khởi tạo)";
  };

  const filteredWards = selectedDeptId
    ? districtWards.filter((w) => w.departmentId === selectedDeptId)
    : districtWards;

  const filteredSchools = schools.filter((s) => {
    if (selectedDistrictWardId && s.districtWardId !== selectedDistrictWardId) return false;
    if (selectedDeptId && s.departmentId !== selectedDeptId) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a237e] via-indigo-900 to-[#283593] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/20">
            <Landmark className="w-3.5 h-3.5 text-teal-300" /> Cấu trúc Phân cấp Bộ & Sở GD&ĐT Việt Nam
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Quản lý Tài khoản Hiệu trưởng & Ban Giám Hiệu
          </h1>
          <p className="text-blue-100 text-sm md:text-base mt-2 max-w-2xl">
            Quản lý toàn bộ danh sách Hiệu trưởng, Phó Hiệu trưởng và Cán bộ Quản lý giáo dục thuộc tất cả các Trường học, Phòng GD&ĐT và Sở GD&ĐT trên hệ thống.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
        >
          <UserPlus className="w-5 h-5" /> Thêm Hiệu trưởng / Cán bộ Mới
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-500 hover:text-red-700 text-xs font-bold">
            Đóng
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Stats overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hiệu trưởng</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalPrincipals}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phó Hiệu trưởng</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalVicePrincipals}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cán bộ Sở / Phòng</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalDeptAdmins}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Chờ phê duyệt</p>
            <p className="text-2xl font-bold text-amber-900 mt-0.5">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-600" /> Bộ Lọc Phân Cấp Hành Chính Giáo Dục
          </h3>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới danh sách
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sở GD&ĐT</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedDistrictWardId("");
                setSelectedSchoolId("");
              }}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">-- Tất cả các Sở GD&ĐT --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* District Ward Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phòng GD&ĐT / Khu vực</label>
            <select
              value={selectedDistrictWardId}
              onChange={(e) => {
                setSelectedDistrictWardId(e.target.value);
                setSelectedSchoolId("");
              }}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">-- Tất cả các Phòng GD&ĐT --</option>
              {filteredWards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Trường học</label>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value="">-- Tất cả các Trường --</option>
              {filteredSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Chức vụ / Vai trò</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">-- Tất cả chức vụ --</option>
              <option value="ADMIN">Hiệu trưởng (ADMIN)</option>
              <option value="VICE_PRINCIPAL">Phó Hiệu trưởng (VICE_PRINCIPAL)</option>
              <option value="DEPARTMENT_ADMIN">Cán bộ Sở GD&ĐT</option>
              <option value="WARD_ADMIN">Cán bộ Phòng GD&ĐT</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Trạng thái Phê duyệt</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="APPROVED">Đã phê duyệt (Đang hoạt động)</option>
              <option value="PENDING">Chờ phê duyệt (Mới đăng ký)</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Họ tên hoặc Email Hiệu trưởng / Cán bộ..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="font-semibold text-sm">Đang tải danh sách Hiệu trưởng & Cán bộ...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-base text-gray-700">Không tìm thấy tài khoản Hiệu trưởng phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc thêm tài khoản mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  <th className="py-3.5 px-4">Họ và tên / Email</th>
                  <th className="py-3.5 px-4">Chức vụ / Vai trò</th>
                  <th className="py-3.5 px-4">Trường công tác</th>
                  <th className="py-3.5 px-4">Đơn vị Quản lý (Phòng / Sở)</th>
                  <th className="py-3.5 px-4">Mật khẩu khởi tạo</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái Duyệt</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users.map((u) => {
                  const roleStyle = getRoleLabel(u.role);
                  const defaultPwd = getKnownPassword(u.email);
                  return (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-sm">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${roleStyle.color}`}
                        >
                          {roleStyle.label}
                        </span>
                      </td>

                      {/* School */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-800 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{u.schoolName}</span>
                        </div>
                      </td>

                      {/* Department / Ward */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="text-gray-700 font-medium flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" /> {u.districtWardName}
                          </p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-purple-500 shrink-0" /> {u.departmentName}
                          </p>
                        </div>
                      </td>

                      {/* Password Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold inline-flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-600" />
                          {defaultPwd}
                        </span>
                      </td>

                      {/* Status Approval */}
                      <td className="py-3.5 px-4 text-center">
                        {u.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã phê duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Chờ phê duyệt
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {/* Password Reset */}
                        <button
                          onClick={() => openPasswordModal(u)}
                          title="Xem / Đổi mật khẩu tài khoản"
                          className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        {/* Approval Toggle */}
                        <button
                          onClick={() => handleToggleApproval(u.id, u.isApproved)}
                          title={u.isApproved ? "Hủy quyền duyệt" : "Duyệt cấp quyền quản lý"}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            u.isApproved
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                          }`}
                        >
                          {u.isApproved ? "Khóa/Hủy" : "Duyệt ngay"}
                        </button>

                        {/* Transfer/Reassign */}
                        <button
                          onClick={() => openTransferModal(u)}
                          title="Điều chuyển công tác / Chức vụ"
                          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          title="Xóa tài khoản"
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: View & Reset Password */}
      {showPasswordModal && resetUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600" /> Quyền Quản Trị: Xem & Đổi Mật Khẩu
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Tài khoản: <span className="font-semibold text-gray-800">{resetUser.name}</span></p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {resetSuccessInfo ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{resetSuccessInfo}</span>
                </div>
                <p className="text-xs text-emerald-600">Bạn có thể cung cấp mật khẩu mới này cho người dùng để đăng nhập.</p>
              </div>
            ) : null}

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" /> Thông tin tài khoản
              </div>
              <p>• <strong>Email:</strong> <span className="font-mono">{resetUser.email}</span></p>
              <p>• <strong>Chức vụ:</strong> {resetUser.role}</p>
              <p>• <strong>Mật khẩu mặc định hệ thống:</strong> <span className="font-mono font-bold text-amber-800">{getKnownPassword(resetUser.email)}</span></p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nhập mật khẩu mới (hoặc bấm Đặt về 123456)
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    required
                    minLength={6}
                    className="w-full text-sm p-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomPasswordInput("123456")}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg"
                >
                  Đặt 123456
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPasswordInput("SuperAdmin@2026!")}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg"
                >
                  Đặt SuperAdmin@2026!
                </button>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Đặt Lại Mật Khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer / Reassign Principal */}
      {showTransferModal && activeUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Điều chuyển Công tác Hiệu trưởng
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Tài khoản: {activeUser.name} ({activeUser.email})</p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chức vụ / Vai trò</label>
                <select
                  value={transferRole}
                  onChange={(e) => setTransferRole(e.target.value as any)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="ADMIN">Hiệu trưởng (ADMIN)</option>
                  <option value="VICE_PRINCIPAL">Phó Hiệu trưởng (VICE_PRINCIPAL)</option>
                  <option value="DEPARTMENT_ADMIN">Cán bộ Sở GD&ĐT</option>
                  <option value="WARD_ADMIN">Cán bộ Phòng GD&ĐT</option>
                </select>
              </div>

              {/* School */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trường học phụ trách</label>
                <select
                  value={transferSchoolId}
                  onChange={(e) => setTransferSchoolId(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="">-- Chưa gán trường --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sở GD&ĐT trực thuộc</label>
                <select
                  value={transferDeptId}
                  onChange={(e) => setTransferDeptId(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chưa chọn Sở --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Ward */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phòng GD&ĐT trực thuộc</label>
                <select
                  value={transferWardId}
                  onChange={(e) => setTransferWardId(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chưa chọn Phòng --</option>
                  {districtWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Principal / Admin */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" /> Thêm Mới Tài Khoản Hiệu Trưởng / Cán Bộ
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Cấp tài khoản có quyền truy cập trực tiếp hệ thống</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Họ và tên cán bộ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Trần Văn Bình"
                  required
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="hieutruong@school.edu.vn"
                  required
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  minLength={6}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vai trò / Chức vụ</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ADMIN">Hiệu trưởng (ADMIN)</option>
                  <option value="VICE_PRINCIPAL">Phó Hiệu trưởng (VICE_PRINCIPAL)</option>
                  <option value="DEPARTMENT_ADMIN">Cán bộ Sở GD&ĐT</option>
                  <option value="WARD_ADMIN">Cán bộ Phòng GD&ĐT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Trường học công tác</label>
                <select
                  value={newSchoolId}
                  onChange={(e) => setNewSchoolId(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                >
                  <option value="">-- Chọn trường học --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
