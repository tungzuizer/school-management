/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/teachers/page.tsx`
 * 2. Affected APIs: `getTeacherCredentialsOverview`, `resetTeacherPasswordSecure`, `getTeacherCredentialSlips` in `src/app/admin/teachers/actions.ts`.
 * 3. Schemas: `TeacherCredentialItem` (`id`, `userId`, `name`, `email`, `specialty`, `phone`, `degree`, `schoolName`, `schoolId`, `role`, `isApproved`, `mustChangePassword`, `createdAt`, `defaultPasswordHint`), `School` (`id`, `name`).
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
  Lock,
  Sparkles,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { TeacherCredentialItem } from "../actions";

interface TeacherCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: TeacherCredentialItem[];
  schools: { id: string; name: string }[];
  onResetPassword: (teacher: TeacherCredentialItem) => void;
  onOpenSlips: () => void;
  loading?: boolean;
}

export default function TeacherCredentialsModal({
  isOpen,
  onClose,
  credentials,
  schools,
  onResetPassword,
  onOpenSlips,
  loading = false,
}: TeacherCredentialsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("ALL");
  const [selectedSpecialty, setSelectedSpecialty] = useState("ALL");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Extract unique specialties
  const specialties = Array.from(
    new Set(credentials.map((c) => c.specialty).filter(Boolean))
  ) as string[];

  // Filter credentials
  const filtered = credentials.filter((c) => {
    if (selectedSchool !== "ALL" && c.schoolId !== selectedSchool) return false;
    if (selectedSpecialty !== "ALL" && c.specialty !== selectedSpecialty) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q) ?? false;
      const matchSpec = c.specialty?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchEmail && !matchPhone && !matchSpec) return false;
    }
    return true;
  });

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySingle = async (item: TeacherCredentialItem) => {
    const text = `Tài khoản Giáo viên: ${item.name}\nEmail: ${item.email}\nMật khẩu: ${item.defaultPasswordHint}\nĐơn vị: ${item.schoolName}`;
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
    const header = "Họ và tên\tChuyên môn\tEmail/Tài khoản\tMật khẩu khởi tạo\tTrường\n";
    const body = filtered
      .map(
        (c) =>
          `${c.name}\t${c.specialty || "GV"}\t${c.email}\t${c.defaultPasswordHint}\t${c.schoolName}`
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
      title="Quản lý Tài khoản & Mật khẩu Giáo viên"
      size="xl"
    >
      <div className="space-y-4">
        {/* Security Notice Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-indigo-950">
                Phân hệ Quản trị Mật khẩu Độc quyền cho Ban Giám Hiệu
              </h4>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Bảo mật BGH
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Danh sách tài khoản đăng nhập của toàn bộ Giáo viên. Hiệu trưởng có thể xem mật khẩu khởi tạo, sao chép để gửi thông báo hoặc đặt lại mật khẩu nhanh khi giáo viên quên mật khẩu.
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
                placeholder="Tìm tên, email, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 w-48 sm:w-56 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            {schools.length > 1 && (
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
              >
                <option value="ALL">Tất cả các trường</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {specialties.length > 0 && (
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium"
              >
                <option value="ALL">Tất cả môn học</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active-press"
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
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active-press"
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
                  <th className="py-2.5 px-3">Giáo viên</th>
                  <th className="py-2.5 px-3">Tài khoản (Email)</th>
                  <th className="py-2.5 px-3">Mật khẩu khởi tạo</th>
                  <th className="py-2.5 px-3">Trường</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>Đang tải thông tin tài khoản...</span>
                        </div>
                      ) : (
                        "Không tìm thấy giáo viên nào phù hợp với bộ lọc."
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
                          <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{item.specialty || "Chưa phân môn"}</span>
                            {item.degree && <span className="text-slate-400">({item.degree})</span>}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-lg border border-slate-200 inline-block text-[11px]">
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
                          <div className="flex items-center gap-1">
                            <School className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[140px]" title={item.schoolName}>
                              {item.schoolName}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopySingle(item)}
                              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isCopied
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
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

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 px-4">
            <span>
              Tổng số giáo viên: <strong>{filtered.length}</strong> / {credentials.length}
            </span>
            <span className="text-[11px] text-slate-400">
              Mật khẩu mặc định hệ thống: <strong className="text-slate-700">abc123</strong>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
