"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Loader2,
  User,
  Phone,
  Building2,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { getRegistrationFormData, registerTeacher } from "./actions";

interface OptionItem {
  id: string;
  name: string;
}

interface SchoolOption {
  id: string;
  name: string;
  departmentId?: string | null;
  districtWardId?: string | null;
  districtWard?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

const COMMON_SPECIALTIES = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Giáo dục công dân",
  "Tin học",
  "Công nghệ",
  "Thể dục",
  "Âm nhạc",
  "Mỹ thuật",
];

const ROLES = [
  {
    value: "TEACHER" as const,
    label: "Giáo viên Trường",
    sub: "Thuộc Trường",
    Icon: User,
    activeColor: "#0d9488",
    activeBg: "#f0fdfa",
    activeBorder: "#0d9488",
  },
  {
    value: "INDEPENDENT_TEACHER" as const,
    label: "Giáo viên Tự do",
    sub: "Dạy độc lập",
    Icon: Sparkles,
    activeColor: "#ea580c",
    activeBg: "#fff7ed",
    activeBorder: "#ea580c",
  },
  {
    value: "ADMIN" as const,
    label: "Hiệu trưởng",
    sub: "ADMIN",
    Icon: Building2,
    activeColor: "#4f46e5",
    activeBg: "#eef2ff",
    activeBorder: "#4f46e5",
  },
  {
    value: "VICE_PRINCIPAL" as const,
    label: "Phó HT",
    sub: "VP",
    Icon: Briefcase,
    activeColor: "#7c3aed",
    activeBg: "#f5f3ff",
    activeBorder: "#7c3aed",
  },
];

export default function RegisterTeacherPage() {
  const router = useRouter();

  const [selectedRoleType, setSelectedRoleType] = useState<
    "TEACHER" | "INDEPENDENT_TEACHER" | "ADMIN" | "VICE_PRINCIPAL"
  >("TEACHER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDistrictWardId, setSelectedDistrictWardId] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [specialty, setSpecialty] = useState("Toán");
  const [customSpecialty, setCustomSpecialty] = useState("");

  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [districtWards, setDistrictWards] = useState<
    { id: string; name: string; departmentId: string }[]
  >([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      const res = await getRegistrationFormData();
      if (res.success) {
        setDepartments(res.departments || []);
        setDistrictWards(res.districtWards || []);
        setSchools(res.schools || []);
        setSubjects(res.subjects || []);

        if (res.schools && res.schools.length > 0) {
          setSelectedSchoolId(res.schools[0].id);
          if (res.schools[0].districtWardId) {
            setSelectedDistrictWardId(res.schools[0].districtWardId);
          }
          if (res.schools[0].departmentId) {
            setSelectedDeptId(res.schools[0].departmentId);
          }
        }
      } else {
        setErrorMsg(res.error || "Không thể tải dữ liệu hình thức trường học.");
      }
      setLoadingData(false);
    }
    loadData();
  }, []);

  const filteredDistrictWards = selectedDeptId
    ? districtWards.filter((dw) => dw.departmentId === selectedDeptId)
    : districtWards;

  const filteredSchools = schools.filter((s) => {
    if (selectedDistrictWardId && s.districtWardId !== selectedDistrictWardId) return false;
    if (selectedDeptId && s.departmentId !== selectedDeptId) return false;
    return true;
  });

  const handleDistrictWardChange = (dwId: string) => {
    setSelectedDistrictWardId(dwId);
    const matching = schools.filter((s) => !dwId || s.districtWardId === dwId);
    setSelectedSchoolId(matching.length > 0 ? matching[0].id : "");
  };

  const handleSchoolChange = (schId: string) => {
    setSelectedSchoolId(schId);
    const sch = schools.find((s) => s.id === schId);
    if (sch) {
      if (sch.districtWardId) setSelectedDistrictWardId(sch.districtWardId);
      if (sch.departmentId) setSelectedDeptId(sch.departmentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const isIndep = selectedRoleType === "INDEPENDENT_TEACHER";
    if (!name.trim()) { setErrorMsg("Vui lòng nhập Họ và tên."); return; }
    if (!email.trim()) { setErrorMsg("Vui lòng nhập Địa chỉ Email."); return; }
    if (!phone.trim()) { setErrorMsg("Vui lòng nhập Số điện thoại liên hệ."); return; }
    if (!isIndep && !selectedSchoolId) { setErrorMsg("Vui lòng chọn Trường học nơi bạn đang công tác."); return; }
    if (password.length < 6) { setErrorMsg("Mật khẩu phải có độ dài từ 6 ký tự trở lên."); return; }
    if (password !== confirmPassword) { setErrorMsg("Xác nhận mật khẩu không trùng khớp."); return; }

    const finalSpecialty = specialty === "OTHER" ? customSpecialty : specialty;
    const isTeacherRole = selectedRoleType === "TEACHER" || selectedRoleType === "INDEPENDENT_TEACHER";

    setIsSubmitting(true);
    try {
      const res = await registerTeacher({
        name,
        email,
        phone,
        password,
        role: isIndep ? "TEACHER" : (selectedRoleType as any),
        isIndependentTeacher: isIndep,
        schoolId: isIndep ? undefined : selectedSchoolId,
        districtWardId: isIndep ? undefined : (selectedDistrictWardId || undefined),
        departmentId: isIndep ? undefined : (selectedDeptId || undefined),
        specialty: isTeacherRole ? finalSpecialty : undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(res.message || "Đăng ký tài khoản thành công!");
      setIsSubmitting(false);
      setTimeout(() => {
        router.push("/login?registered=1&email=" + encodeURIComponent(email));
      }, 2000);
    } catch {
      setErrorMsg("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      setIsSubmitting(false);
    }
  };

  const activeRole = ROLES.find((r) => r.value === selectedRoleType)!;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #ecfdf5 0%, #f0fdfa 35%, #eef2ff 100%)" }}
    >
      {/* ── COMPACT MOBILE HEADER ────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 50%, #4f46e5 100%)" }}
      >
        {/* back button */}
        <Link
          href="/login"
          className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white z-10"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            padding: "6px 12px",
            borderRadius: "999px",
            minHeight: "36px",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Link>

        <div className="flex items-center gap-4 px-5 pt-4 pb-5 sm:px-10 sm:py-8 sm:flex-col sm:text-center">
          {/* logo + title row on mobile, stacked on sm+ */}
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ring-2 ring-white/30 shadow-lg sm:mx-auto"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
          <div className="pt-8 sm:pt-0 sm:mt-2">
            <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
              Đăng ký Tài khoản
            </h1>
            <p className="text-xs sm:text-sm mt-0.5 sm:mt-1.5 sm:max-w-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
              Hệ thống Quản lý Giáo dục liên thông
            </p>
          </div>
        </div>
      </div>

      {/* ── FORM CARD ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex justify-center px-0 sm:px-6 py-0 sm:py-8">
        <div
          className="w-full sm:max-w-2xl sm:rounded-3xl bg-white sm:shadow-2xl overflow-hidden"
          style={{ borderTop: "none" }}
        >
          <div className="px-5 pt-6 pb-8 sm:px-10 sm:pt-8 sm:pb-10">

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-4 rounded-2xl flex items-start gap-3 text-sm" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-bold text-base">{successMsg}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Đang chuyển hướng đến trang đăng nhập...</p>
                </div>
              </div>
            )}

            {loadingData ? (
              <div className="py-16 text-center text-gray-500">
                <Loader2 className="w-9 h-9 animate-spin text-teal-600 mx-auto mb-3" />
                <p className="font-medium text-base">Đang tải danh sách trường học...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── ROLE SELECTOR: horizontal pill tabs ─────────────────── */}
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-3">
                    Loại tài khoản <span className="text-red-500">*</span>
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                    {ROLES.map(({ value, label, sub, Icon, activeColor, activeBg, activeBorder }) => {
                      const active = selectedRoleType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSelectedRoleType(value)}
                          className="flex items-center gap-2 flex-shrink-0 rounded-2xl px-4 font-semibold text-sm transition-all"
                          style={{
                            minHeight: "48px",
                            paddingTop: "10px",
                            paddingBottom: "10px",
                            background: active ? activeBg : "#f8fafc",
                            border: `1.5px solid ${active ? activeBorder : "#e2e8f0"}`,
                            color: active ? activeColor : "#64748b",
                            boxShadow: active ? `0 2px 8px ${activeColor}22` : "none",
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {label}
                            <span className="hidden sm:inline" style={{ opacity: 0.65 }}>{" "}({sub})</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 italic mt-2 leading-snug">
                    {selectedRoleType === "INDEPENDENT_TEACHER"
                      ? "* Giáo viên tự do: Có không gian dạy học riêng, tự thêm học sinh & quản lý lớp học độc lập."
                      : "* Giáo viên trường: Hiệu trưởng phê duyệt. Tài khoản HT/PHT: Admin hệ thống phê duyệt."}
                  </p>
                </div>

                {/* ── PERSONAL INFO ────────────────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <User className="w-4 h-4" style={{ color: activeRole.activeColor }} />
                    Thông tin cá nhân & Liên hệ
                  </h3>
                  <div className="space-y-4">
                    {/* Full name — always full width */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn An"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                          style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                        />
                      </div>
                    </div>

                    {/* Email + Phone: side by side on sm, stacked on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="giaovien@school.edu.vn"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                            style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0912 345 678"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                            style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ORGANIZATION ─────────────────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Building2 className="w-4 h-4" style={{ color: activeRole.activeColor }} />
                    Đơn vị công tác & Chuyên môn
                  </h3>
                  <div className="space-y-4">
                    {selectedRoleType === "INDEPENDENT_TEACHER" ? (
                      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 text-xs leading-relaxed space-y-1.5 shadow-2xs">
                        <div className="font-extrabold text-sm text-orange-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-orange-600" />
                          <span>Chế độ Giáo viên Tự do (Dạy độc lập)</span>
                        </div>
                        <p className="text-orange-900/90">
                          Tài khoản của bạn sẽ tự động sở hữu <strong>không gian dạy học cá nhân riêng biệt</strong>. Bạn có toàn quyền tự thêm học sinh, phân vị trí Lớp trưởng/Lớp phó, chia Tổ và đánh giá điểm thưởng tích cực mà không chịu phụ thuộc nhà trường.
                        </p>
                      </div>
                    ) : (
                      /* Area + School: stacked on mobile, side-by-side on sm */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Khu vực / Phòng GD&ĐT
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={selectedDistrictWardId}
                              onChange={(e) => handleDistrictWardChange(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white transition-all appearance-none"
                              style={{ border: "1.5px solid #e2e8f0", outline: "none", color: "#0f172a" }}
                            >
                              <option value="">-- Tất cả --</option>
                              {filteredDistrictWards.map((dw) => (
                                <option key={dw.id} value={dw.id}>{dw.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Trường học <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                              value={selectedSchoolId}
                              onChange={(e) => handleSchoolChange(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white font-medium transition-all appearance-none"
                              style={{ border: "1.5px solid #e2e8f0", outline: "none", color: "#0f172a" }}
                            >
                              {filteredSchools.length === 0 ? (
                                <option value="">Không có trường phù hợp</option>
                              ) : (
                                filteredSchools.map((sch) => (
                                  <option key={sch.id} value={sch.id}>
                                    {sch.name}{sch.districtWard?.name ? " (" + sch.districtWard.name + ")" : ""}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specialty — full width, for TEACHER or INDEPENDENT_TEACHER */}
                    {(selectedRoleType === "TEACHER" || selectedRoleType === "INDEPENDENT_TEACHER") && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Chuyên môn <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <select
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white transition-all appearance-none"
                            style={{ border: "1.5px solid #e2e8f0", outline: "none", color: "#0f172a" }}
                          >
                            {COMMON_SPECIALTIES.map((spec) => (
                              <option key={spec} value={spec}>Môn {spec}</option>
                            ))}
                            <option value="OTHER">Môn khác (Tự nhập...)</option>
                          </select>
                        </div>
                        {specialty === "OTHER" && (
                          <input
                            type="text"
                            value={customSpecialty}
                            onChange={(e) => setCustomSpecialty(e.target.value)}
                            placeholder="Nhập tên môn học chuyên môn..."
                            required
                            className="mt-2.5 w-full px-4 py-3 rounded-xl text-sm"
                            style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── PASSWORD ─────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Lock className="w-4 h-4" style={{ color: activeRole.activeColor }} />
                    Mật khẩu đăng nhập
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          minLength={6}
                          className="w-full pl-10 pr-11 py-3 rounded-xl text-sm transition-all"
                          style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          style={{ padding: "4px", minHeight: "auto" }}
                          aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all"
                          style={{ border: "1.5px solid #e2e8f0", outline: "none", background: "#f8fafc", color: "#0f172a" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SUBMIT ───────────────────────────────────────────────── */}
                <button
                  type="submit"
                  disabled={isSubmitting || !!successMsg}
                  className="w-full flex items-center justify-center gap-2 font-bold text-base text-white rounded-2xl"
                  style={{
                    paddingTop: "14px",
                    paddingBottom: "14px",
                    background: isSubmitting || !!successMsg
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #059669 0%, #0d9488 50%, #4f46e5 100%)",
                    boxShadow: isSubmitting || !!successMsg ? "none" : "0 6px 20px rgba(13,148,136,0.35)",
                    cursor: isSubmitting || !!successMsg ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang tạo tài khoản...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Hoàn tất Đăng ký
                    </>
                  )}
                </button>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 pt-2">
                  Đã có tài khoản?{" "}
                  <Link href="/login" className="font-bold hover:underline" style={{ color: "#0d9488" }}>
                    Đăng nhập ngay
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
