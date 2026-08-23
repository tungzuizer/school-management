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

export default function RegisterTeacherPage() {
  const router = useRouter();

  // Form states
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

  // Metadata
  const [departments, setDepartments] = useState<OptionItem[]>([]);
  const [districtWards, setDistrictWards] = useState<
    { id: string; name: string; departmentId: string }[]
  >([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);

  // UI status
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

  // Filter district wards based on selected department
  const filteredDistrictWards = selectedDeptId
    ? districtWards.filter((dw) => dw.departmentId === selectedDeptId)
    : districtWards;

  // Filter schools based on selected department / district ward
  const filteredSchools = schools.filter((s) => {
    if (selectedDistrictWardId && s.districtWardId !== selectedDistrictWardId) {
      return false;
    }
    if (selectedDeptId && s.departmentId !== selectedDeptId) {
      return false;
    }
    return true;
  });

  const handleDistrictWardChange = (dwId: string) => {
    setSelectedDistrictWardId(dwId);
    const matching = schools.filter((s) => !dwId || s.districtWardId === dwId);
    if (matching.length > 0) {
      setSelectedSchoolId(matching[0].id);
    } else {
      setSelectedSchoolId("");
    }
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

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập Họ và tên.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập Địa chỉ Email.");
      return;
    }

    if (!phone.trim()) {
      setErrorMsg("Vui lòng nhập Số điện thoại liên hệ.");
      return;
    }

    if (!selectedSchoolId) {
      setErrorMsg("Vui lòng chọn Trường học nơi bạn đang công tác.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải có độ dài từ 6 ký tự trở lên.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Xác nhận mật khẩu không trùng khớp.");
      return;
    }

    const finalSpecialty = specialty === "OTHER" ? customSpecialty : specialty;

    setIsSubmitting(true);
    try {
      const res = await registerTeacher({
        name,
        email,
        phone,
        password,
        schoolId: selectedSchoolId,
        districtWardId: selectedDistrictWardId || undefined,
        departmentId: selectedDeptId || undefined,
        specialty: finalSpecialty,
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
    } catch (err: any) {
      setErrorMsg("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-100 p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-6 py-8 sm:px-10 sm:py-10 text-center relative">
            <Link
              href="/login"
              className="absolute left-4 top-4 text-white/80 hover:text-white flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>

            <div className="mx-auto w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center mb-3 ring-4 ring-white/30 shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Đăng ký Tài khoản Giáo viên
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base mt-2 max-w-md mx-auto">
              Hệ thống Quản lý Giáo dục liên thông Trường - Phòng - Sở GD&ĐT
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {/* Status alerts */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold text-base">{successMsg}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Đang tự động chuyển hướng đến trang đăng nhập trong giây lát...
                  </p>
                </div>
              </div>
            )}

            {loadingData ? (
              <div className="py-16 text-center text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-3" />
                <p className="font-medium text-base">Đang tải danh sách Trường học & Khu vực...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal & Contact Section */}
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <User className="w-5 h-5 text-teal-600" /> Thông tin cá nhân & Liên hệ
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Họ và tên giáo viên <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn An"
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-colors"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email làm việc <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="giaovien@school.edu.vn"
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Số điện thoại liên hệ <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization & Specialty Section */}
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Building2 className="w-5 h-5 text-teal-600" /> Đơn vị công tác & Chuyên môn
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Area / District Ward */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Khu vực / Phòng GD&ĐT
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={selectedDistrictWardId}
                          onChange={(e) => handleDistrictWardChange(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base bg-white transition-colors"
                        >
                          <option value="">-- Tất cả các khu vực --</option>
                          {filteredDistrictWards.map((dw) => (
                            <option key={dw.id} value={dw.id}>
                              {dw.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* School selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Trường học công tác <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={selectedSchoolId}
                          onChange={(e) => handleSchoolChange(e.target.value)}
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base bg-white font-medium transition-colors text-gray-900"
                        >
                          {filteredSchools.length === 0 ? (
                            <option value="">Không có trường phù hợp</option>
                          ) : (
                            filteredSchools.map((sch) => (
                              <option key={sch.id} value={sch.id}>
                                {sch.name}{" "}
                                {sch.districtWard?.name ? "(" + sch.districtWard.name + ")" : ""}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Specialty selection */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Chuyên môn giảng dạy chính <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base bg-white transition-colors"
                        >
                          {COMMON_SPECIALTIES.map((spec) => (
                            <option key={spec} value={spec}>
                              Môn {spec}
                            </option>
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
                          className="mt-2.5 w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-base"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div>
                  <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Lock className="w-5 h-5 text-teal-600" /> Mật khẩu đăng nhập
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Tối thiểu 6 ký tự"
                          required
                          minLength={6}
                          className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu"
                          required
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-base transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !!successMsg}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:via-teal-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Đang tạo tài khoản...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" /> Hoàn tất Đăng ký Tài khoản
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Footer link to Login */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600 text-base">
                Đã có tài khoản Giáo viên?{" "}
                <Link
                  href="/login"
                  className="font-bold text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
