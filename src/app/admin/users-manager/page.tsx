/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/layout.tsx` (Menu Item: Quản lý Tài khoản & Phân quyền `/admin/users-manager`).
 * 2. Affected APIs: `getUsersManagerData`, `toggleUserApproval`, `resetUserPassword`, `createUserAccount`, `deleteUserAccount`.
 * 3. Schemas: `ManagedUserItem`, `LookupOption`, `UserStatsSummary`, `Role`.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu và hiển thị phân hiệu cho Tổng kho tài khoản.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Users,
  ShieldCheck,
  Building2,
  School,
  GraduationCap,
  KeyRound,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  Crown,
  BookOpen,
  Scale,
  LogIn,
  ChevronRight,
  ChevronLeft,
  X,
  Mail,
  User,
  MapPin,
} from "lucide-react";
import {
  getUsersManagerData,
  toggleUserApproval,
  resetUserPassword,
  createUserAccount,
  deleteUserAccount,
  ManagedUserItem,
  LookupOption,
  UserStatsSummary,
} from "./actions";
import { Role } from "@prisma/client";
import { signIn } from "next-auth/react";
import SystemAccountsModal from "@/components/admin/SystemAccountsModal";

const ROLE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  SUPER_ADMIN: { label: "Quản Trị Tối Cao", color: "bg-amber-100 border-amber-300 text-amber-900", icon: Crown },
  DEPARTMENT_ADMIN: { label: "Lãnh đạo Sở GD", color: "bg-slate-100 border-slate-300 text-slate-900", icon: Building2 },
  DISTRICT_ADMIN: { label: "Phòng GD&ĐT", color: "bg-rose-100 border-rose-300 text-rose-900", icon: Building2 },
  WARD_ADMIN: { label: "Cán bộ Khu vực", color: "bg-rose-100 border-rose-300 text-rose-900", icon: Building2 },
  ADMIN: { label: "Hiệu Trưởng", color: "bg-blue-100 border-blue-300 text-blue-900", icon: ShieldCheck },
  VICE_PRINCIPAL: { label: "Phó Hiệu Trưởng", color: "bg-teal-100 border-teal-300 text-teal-900", icon: Building2 },
  SUBJECT_HEAD: { label: "Tổ Trưởng CM", color: "bg-teal-100 border-teal-300 text-teal-900", icon: Users },
  TEACHER: { label: "Giáo Viên", color: "bg-emerald-100 border-emerald-300 text-emerald-900", icon: BookOpen },
  STUDENT: { label: "Học Sinh", color: "bg-sky-100 border-sky-300 text-sky-900", icon: GraduationCap },
};

export default function UsersManagerPage() {
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [users, setUsers] = useState<ManagedUserItem[]>([]);
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [districtWards, setDistrictWards] = useState<LookupOption[]>([]);
  const [schools, setSchools] = useState<LookupOption[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string; schoolId: string }[]>([]);

  // Filter states
  const [selectedWardId, setSelectedWardId] = useState("ALL");
  const [selectedSchoolId, setSelectedSchoolId] = useState("ALL");
  const [selectedCampusId, setSelectedCampusId] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "APPROVED" | "PENDING">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [showAccountsGuideModal, setShowAccountsGuideModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<ManagedUserItem | null>(null);
  const [customResetPass, setCustomResetPass] = useState("123456");

  // Create Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>(Role.TEACHER);
  const [newSchoolId, setNewSchoolId] = useState("");
  const [newCampusId, setNewCampusId] = useState("");
  const [newWardId, setNewWardId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("123456");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await getUsersManagerData({
        districtWardId: selectedWardId,
        schoolId: selectedSchoolId,
        campusId: selectedCampusId,
        role: selectedRole,
        status: selectedStatus,
        search: searchTerm,
        page,
        pageSize,
      });

      if (res.success) {
        setUsers(res.data);
        setStats(res.stats);
        setDistrictWards(res.districtWards);
        setSchools(res.schools);
        setCampuses(res.campuses || []);
        setTotalPages(res.totalPages);
        setTotalRecords(res.total);
      } else {
        setErrorMsg(res.error || "Không thể tải danh sách tài khoản");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWardId, selectedSchoolId, selectedCampusId, selectedRole, selectedStatus, page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleToggleApproval = async (user: ManagedUserItem) => {
    startTransition(async () => {
      const res = await toggleUserApproval(user.id);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isApproved: res.isApproved ?? !u.isApproved } : u))
        );
        setSuccessMsg(`Đã cập nhật trạng thái phê duyệt cho ${user.email}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Cập nhật trạng thái thất bại");
      }
    });
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedUserForReset) return;
    setIsSubmitting(true);
    try {
      const res = await resetUserPassword(selectedUserForReset.id, customResetPass);
      if (res.success) {
        setSuccessMsg(res.message || "Đã đặt lại mật khẩu thành công!");
        setShowResetModal(false);
        setSelectedUserForReset(null);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res.error || "Đặt lại mật khẩu thất bại");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi reset mật khẩu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim().toLowerCase().endsWith("@gmail.com")) {
      setErrorMsg("Email bắt buộc phải có đuôi @gmail.com theo quy định hệ thống");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await createUserAccount({
        name: newName,
        email: newEmail,
        role: newRole,
        password: newPassword,
        schoolId: newSchoolId || undefined,
        campusId: newCampusId || undefined,
        districtWardId: newWardId || undefined,
        phone: newPhone || undefined,
      });

      if (res.success) {
        setSuccessMsg(`Đã tạo thành công tài khoản: ${newEmail}`);
        setShowCreateModal(false);
        // Reset form
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setNewCampusId("");
        setNewPassword("123456");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(res.error || "Không thể tạo tài khoản mới");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: ManagedUserItem) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.name} (${user.email})?`)) {
      startTransition(async () => {
        const res = await deleteUserAccount(user.id);
        if (res.success) {
          setSuccessMsg(`Đã xóa tài khoản ${user.email}`);
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setTimeout(() => setSuccessMsg(""), 3000);
        } else {
          setErrorMsg(res.error || "Không thể xóa tài khoản");
        }
      });
    }
  };

  const copyCredentials = (user: ManagedUserItem) => {
    const text = `Họ tên: ${user.name}\nEmail: ${user.email}\nMật khẩu: 123456\nVai trò: ${user.role}\nTrường/Đơn vị: ${user.schoolName}\nPhân hiệu: ${user.campusName || "Điểm Trung tâm"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickImpersonate = async (user: ManagedUserItem) => {
    if (confirm(`Chuyển phiên làm việc sang tài khoản: ${user.name} (${user.email})?`)) {
      await signIn("credentials", {
        email: user.email,
        password: "123456",
        callbackUrl: "/admin/dashboard",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Quản Trị Tối Cao (SuperAdmin Hub)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trung Tâm Quản Lý Tài Khoản & Phân Quyền
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tra cứu, cấp quyền, kiểm soát mật khẩu và giám sát 100% tài khoản chuẩn hóa đuôi <strong className="text-amber-300 font-mono">@gmail.com</strong> thuộc 3 Khu vực (TP. Ninh Bình, TP. Tam Điệp, Huyện Hoa Lư) và 6 Trường THPT độc lập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAccountsGuideModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Sổ Tay Tài Khoản Demo</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tài Khoản Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Overview Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Tổng Tài Khoản</span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-1">100% @gmail.com</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-300/70 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Sở & Phòng GD</span>
              <Building2 className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{stats.deptAdmins + stats.wardAdmins + stats.superAdmins}</p>
            <p className="text-[11px] text-slate-600 mt-1">3 Khu vực điều hành</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase">Ban Giám Hiệu</span>
              <ShieldCheck className="w-4 h-4 text-blue-700" />
            </div>
            <p className="text-2xl font-extrabold text-blue-950 mt-2">{stats.principals + stats.vicePrincipals}</p>
            <p className="text-[11px] text-blue-700 mt-1">6 Trường THPT</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase">Đội ngũ Giáo viên</span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-900 mt-2">{stats.teachers}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Tổ trưởng & Bộ môn</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/70 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase">Học Sinh</span>
              <GraduationCap className="w-4 h-4 text-sky-700" />
            </div>
            <p className="text-2xl font-extrabold text-sky-950 mt-2">{stats.students}</p>
            <p className="text-[11px] text-sky-700 mt-1">Khối 10, 11, 12</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase">Nhân sự NQ 37</span>
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-900 mt-2">18</p>
            <p className="text-[11px] text-amber-600 mt-1">Kế toán, Y tế, CNTT</p>
          </div>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo Tên, Email (@gmail.com), Số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value={15}>15 dòng/trang</option>
              <option value={25}>25 dòng/trang</option>
              <option value={50}>50 dòng/trang</option>
              <option value={100}>100 dòng/trang</option>
            </select>
          </div>
        </div>

        {/* Multi-tier Dropdown filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Phân hiệu / Điểm trường
            </label>
            <select
              value={selectedCampusId}
              onChange={(e) => {
                setSelectedCampusId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả Phân hiệu / Điểm</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Trường Trực Thuộc
            </label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả các Trường</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Khu Vực Quản Lý
            </label>
            <select
              value={selectedWardId}
              onChange={(e) => {
                setSelectedWardId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả Khu vực</option>
              {districtWards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Vai Trò & Cấp Bậc
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="SUPER_ADMIN">Quản Trị Tối Cao (SuperAdmin)</option>
              <option value="DEPARTMENT_ADMIN">Lãnh đạo Sở GD&ĐT</option>
              <option value="WARD_ADMIN">Trưởng phòng GD Khu vực</option>
              <option value="ADMIN">Hiệu Trưởng</option>
              <option value="VICE_PRINCIPAL">Phó Hiệu Trưởng</option>
              <option value="SUBJECT_HEAD">Tổ Trưởng Chuyên Môn</option>
              <option value="TEACHER">Giáo Viên Bộ Môn</option>
              <option value="STUDENT">Học Sinh</option>
              <option value="SUPPORT_STAFF">Nhân sự NQ 37 (Kế toán/Y tế/CNTT)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Trạng Thái Phê Duyệt
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="APPROVED">Đã phê duyệt (Hoạt động)</option>
              <option value="PENDING">Chưa phê duyệt (Chờ kích hoạt)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Campus Filter Pills */}
      {campuses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCampusId("ALL");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
              selectedCampusId === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Toàn Trường ({campuses.length} Phân hiệu/Điểm)</span>
          </button>
          {campuses.map((c) => {
            const isSelected = selectedCampusId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCampusId(c.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Users Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs">
              {totalRecords}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Danh Mục Tài Khoản Hệ Thống</h2>
              <p className="text-[11px] text-slate-500">Hiển thị {users.length} tài khoản trên tổng số {totalRecords}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Đang tải danh sách tài khoản...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản phù hợp</p>
            <p className="text-xs text-slate-400">Hãy thử xóa bớt bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Người Dùng & Email @gmail.com</th>
                  <th className="py-3 px-4">Vai Trò & Cấp Bậc</th>
                  <th className="py-3 px-4">Khu Vực & Đơn Vị</th>
                  <th className="py-3 px-4">Mật Khẩu & Tiện Ích</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác Quản Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {users.map((u) => {
                  const badge = ROLE_BADGES[u.role] || {
                    label: u.role,
                    color: "bg-slate-100 border-slate-200 text-slate-700",
                    icon: User,
                  };
                  const BadgeIcon = badge.icon;
                  const isCopied = copiedId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-all group">
                      {/* Name and Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              {u.name}
                              {u.role === Role.SUPER_ADMIN && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-700 font-semibold">{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold border uppercase tracking-wider ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* School, Campus & DistrictWard */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.schoolName}</span>
                          </p>
                          {u.campusName && (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{u.campusName}</span>
                              </span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.districtWardName}</span>
                          </p>
                        </div>
                      </td>

                      {/* Password & Copy Tool */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[11px] font-bold text-slate-700">
                            123456
                          </div>
                          <button
                            onClick={() => copyCredentials(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition cursor-pointer"
                            title="Sao chép toàn bộ thông tin tài khoản"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleQuickImpersonate(u)}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                            title="Chuyển quyền đăng nhập nhanh sang tài khoản này"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Đăng nhập</span>
                          </button>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleApproval(u)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${
                            u.isApproved
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                          }`}
                          title="Bấm để chuyển trạng thái"
                        >
                          {u.isApproved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Hoạt động</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Chờ duyệt</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUserForReset(u);
                              setCustomResetPass("123456");
                              setShowResetModal(true);
                            }}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition cursor-pointer"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {u.role !== Role.SUPER_ADMIN && !u.email.startsWith("superadmin") && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 transition cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold">
          <span>
            Trang {page} / {totalPages} (Tổng số {totalRecords} tài khoản)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Thêm Tài Khoản Hệ Thống Mới</h3>
                  <p className="text-xs text-slate-500">Chuẩn hóa địa chỉ email với đuôi @gmail.com</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thầy Trần Quang Hải"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email chuẩn hóa (@gmail.com) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: gv.toan.hai.tp@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vai trò hệ thống <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={Role.ADMIN}>Hiệu Trưởng</option>
                    <option value={Role.VICE_PRINCIPAL}>Phó Hiệu Trưởng</option>
                    <option value={Role.SUBJECT_HEAD}>Tổ Trưởng Chuyên Môn</option>
                    <option value={Role.TEACHER}>Giáo Viên Bộ Môn</option>
                    <option value={Role.STUDENT}>Học Sinh</option>
                    <option value={Role.WARD_ADMIN}>Trưởng phòng GD Khu vực</option>
                    <option value={Role.DEPARTMENT_ADMIN}>Lãnh đạo Sở GD&ĐT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912xxxxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gắn Trường Trực Thuộc</label>
                  <select
                    value={newSchoolId}
                    onChange={(e) => setNewSchoolId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Không gắn (Cấp tỉnh/Sở)</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân hiệu / Điểm trường</label>
                  <select
                    value={newCampusId}
                    onChange={(e) => setNewCampusId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Mặc định (Điểm Trung tâm)</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gắn Khu Vực Quản Lý</label>
                <select
                  value={newWardId}
                  onChange={(e) => setNewWardId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Theo trường hoặc Toàn tỉnh</option>
                  {districtWards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tạo Tài Khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && selectedUserForReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Đặt Lại Mật Khẩu</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600">
                Đặt lại mật khẩu cho tài khoản <strong className="text-slate-900">{selectedUserForReset.name}</strong> (
                <span className="font-mono text-blue-600 font-semibold">{selectedUserForReset.email}</span>)
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  value={customResetPass}
                  onChange={(e) => setCustomResetPass(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetPasswordSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác Nhận Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick System Accounts Guide Modal */}
      <SystemAccountsModal
        isOpen={showAccountsGuideModal}
        onClose={() => setShowAccountsGuideModal(false)}
      />
    </div>
  );
}
