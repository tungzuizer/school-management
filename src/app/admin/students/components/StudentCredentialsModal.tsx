/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/students/page.tsx`
 * 2. Affected APIs: `getStudentCredentialsOverview`, `resetStudentPasswordSecure`, `getStudentCredentialSlips` in `src/app/admin/students/actions.ts`.
 * 3. Data Schemas: `StudentCredentialItem` (`id`, `userId`, `studentCode`, `name`, `email`, `className`, `classId`, `gradeLevel`, `schoolName`, `schoolId`, `phone`, `parentPhone`, `parentName`, `status`, `mustChangePassword`, `createdAt`, `defaultPasswordHint`), `ClassRoom`, `School`.
 * 4. Verbatim User Instruction: "tôi muốn mỗi giáo viên mỗi học sinh sẽ có tài khoản mà mật khẩu và có thể hiện thị chỉ cho hiệu trưởng hoặc admin nhìn thấy được".
 */

"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Printer,
  Search,
  School,
  GraduationCap,
  Users,
  Phone,
  BookOpen,
} from "lucide-react";
import type { StudentCredentialItem } from "../actions";

interface StudentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: StudentCredentialItem[];
  classes: { id: string; name: string; gradeLevel?: number }[];
  schools?: { id: string; name: string }[];
  onResetPassword: (student: StudentCredentialItem) => void;
  onOpenSlips: () => void;
  loading?: boolean;
}

export default function StudentCredentialsModal({
  isOpen,
  onClose,
  credentials,
  classes,
  schools = [],
  onResetPassword,
  onOpenSlips,
  loading = false,
}: StudentCredentialsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedSchool, setSelectedSchool] = useState("ALL");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Extract unique grades
  const grades = Array.from(
    new Set(
      credentials
        .map((c) => c.gradeLevel)
        .filter((g): g is number => typeof g === "number" && !isNaN(g))
    )
  ).sort((a, b) => a - b);

  // Filter credentials
  const filtered = credentials.filter((c) => {
    if (selectedSchool !== "ALL" && c.schoolId !== selectedSchool) return false;
    if (selectedClass !== "ALL" && c.classId !== selectedClass) return false;
    if (selectedGrade !== "ALL" && c.gradeLevel?.toString() !== selectedGrade) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchCode = c.studentCode?.toLowerCase().includes(q) ?? false;
      const matchClass = c.className.toLowerCase().includes(q);
      const matchParent = c.parentName?.toLowerCase().includes(q) ?? false;
      const matchParentPhone = c.parentPhone?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchEmail && !matchCode && !matchClass && !matchParent && !matchParentPhone) {
        return false;
      }
    }
    return true;
  });

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySingle = async (item: StudentCredentialItem) => {
    const text = `Tài khoản Học sinh: ${item.name} (${item.studentCode || "Chưa có mã"})\nLớp: ${item.className}\nEmail: ${item.email}\nMật khẩu: ${item.defaultPasswordHint}\nTrường: ${item.schoolName}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyAll = async () => {
    if (filtered.length === 0) return;
    const header = "Mã HS\tHọ và tên\tLớp\tTài khoản Email\tMật khẩu khởi tạo\tPhụ huynh\tSĐT Phụ huynh\n";
    const body = filtered
      .map(
        (c) =>
          `${c.studentCode || ""}\t${c.name}\t${c.className}\t${c.email}\t${c.defaultPasswordHint}\t${c.parentName || ""}\t${c.parentPhone || ""}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(header + body);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản lý Tài khoản & Mật khẩu Học sinh"
      size="xl"
    >
      <div className="space-y-4">
        {/* Security Notice Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-emerald-950">
                Phân hệ Quản trị Mật khẩu Học sinh Độc quyền cho Ban Giám Hiệu
              </h4>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Bảo mật BGH
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Toàn bộ danh sách tài khoản học sinh theo Lớp và Khối. BGH có thể xem mật khẩu khởi tạo, sao chép hoặc in phiếu bàn giao tài khoản gửi đến Giáo viên chủ nhiệm và Phụ huynh.
            </p>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, mã HS, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {classes.length > 0 && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
              >
                <option value="ALL">Tất cả các lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}

            {grades.length > 0 && (
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
              >
                <option value="ALL">Tất cả các khối</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade.toString()}>
                    Khối {grade}
                  </option>
                ))}
              </select>
            )}

            {schools.length > 1 && (
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium"
              >
                <option value="ALL">Tất cả các trường</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active-press cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép ({filtered.length})</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép bảng</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenSlips}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active-press cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu tài khoản</span>
            </button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
          <div className="overflow-x-auto max-h-[50vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Học sinh</th>
                  <th className="py-2.5 px-3">Lớp</th>
                  <th className="py-2.5 px-3">Tài khoản (Email)</th>
                  <th className="py-2.5 px-3">Mật khẩu khởi tạo</th>
                  <th className="py-2.5 px-3">Phụ huynh</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Đang tải thông tin tài khoản học sinh...</span>
                        </div>
                      ) : (
                        "Không tìm thấy học sinh nào phù hợp với bộ lọc."
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isRevealed = !!revealedPasswords[item.id];
                    const isCopied = copiedId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 font-mono">
                            <span>Mã HS: {item.studentCode || "Chưa có"}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold inline-block">
                            {item.className}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 inline-block text-[11px]">
                            {item.email}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                isRevealed
                                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              {isRevealed ? item.defaultPasswordHint : "••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                              title={isRevealed ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.parentName ? (
                            <div>
                              <div className="font-semibold text-slate-800">{item.parentName}</div>
                              {item.parentPhone && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{item.parentPhone}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có thông tin</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopySingle(item)}
                              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-emerald-600"
                              }`}
                              title="Sao chép thông tin đăng nhập"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => onResetPassword(item)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 px-4">
            <span>
              Tổng số học sinh: <strong className="text-slate-900">{filtered.length}</strong> / {credentials.length}
            </span>
            <span className="text-[11px] text-slate-600">
              Mật khẩu mặc định hệ thống: <strong className="text-slate-800">abc123</strong>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
