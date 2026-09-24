"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  sendNotificationToRole,
  deleteNotification,
} from "./actions";
import Toast from "@/components/ui/Toast";
import {
  Bell,
  Send,
  Trash2,
  Plus,
  Users,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Megaphone,
  Radio,
} from "lucide-react";

type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: "Quản Trị Tối Cao", color: "bg-amber-50 text-amber-800 border-amber-200" },
  DEPARTMENT_ADMIN: { label: "Sở GD&ĐT", color: "bg-slate-50 text-slate-800 border-slate-200" },
  DISTRICT_ADMIN: { label: "Phòng GD&ĐT", color: "bg-rose-50 text-rose-800 border-rose-200" },
  WARD_ADMIN: { label: "Cán bộ Khu vực", color: "bg-rose-50 text-rose-800 border-rose-200" },
  ADMIN: { label: "Hiệu Trưởng", color: "bg-blue-50 text-blue-800 border-blue-200" },
  VICE_PRINCIPAL: { label: "Phó Hiệu Trưởng", color: "bg-teal-50 text-teal-800 border-teal-200" },
  SUBJECT_HEAD: { label: "Tổ Trưởng CM", color: "bg-teal-50 text-teal-800 border-teal-200" },
  TEACHER: { label: "Giáo Viên", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  STUDENT: { label: "Học Sinh", color: "bg-sky-50 text-sky-800 border-sky-200" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<"ALL" | "TEACHER" | "STUDENT">("ALL");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetRole: "ALL" as "ALL" | "TEACHER" | "STUDENT",
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!formData.title.trim() || !formData.content.trim()) {
      setToast({ message: "Vui lòng nhập tiêu đề và nội dung", type: "error" });
      return;
    }

    setSending(true);
    try {
      const result = await sendNotificationToRole({
        title: formData.title,
        content: formData.content,
        targetRole: formData.targetRole,
      });

      if (result.error) {
        setToast({ message: result.error, type: "error" });
      } else {
        setToast({
          message: `Đã phát thông báo thành công tới ${result.count} người dùng`,
          type: "success",
        });
        setFormData({ title: "", content: "", targetRole: "ALL" });
        setShowForm(false);
        await loadNotifications();
      }
    } catch {
      setToast({ message: "Lỗi khi gửi thông báo", type: "error" });
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này khỏi hệ thống?")) return;
    try {
      await deleteNotification(id);
      setToast({ message: "Đã xóa thông báo thành công", type: "success" });
      await loadNotifications();
    } catch {
      setToast({ message: "Lỗi khi xóa", type: "error" });
    }
  }

  const filteredNotifications = notifications.filter((item) => {
    const matchSearch =
      !searchTerm ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole =
      targetFilter === "ALL" ||
      item.receiverRole === targetFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              Trung tâm Điều hành Truyền thông
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Quản lý Phát Thông Báo
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Gửi thông báo chỉ đạo điều hành khẩn cấp tới toàn trường, ban cán sự lớp, đội ngũ giáo viên và học sinh
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" /> Đóng Biểu Mẫu
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Tạo Thông Báo Mới
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form tạo thông báo mới */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Soạn Bản Tin Phát Đi Toàn Trường
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Bảo mật đa cấp chuẩn NQ 37</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Đối tượng nhận tin <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetRole: e.target.value as "ALL" | "TEACHER" | "STUDENT",
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">📢 Toàn trường (Giáo viên & Học sinh)</option>
                <option value="TEACHER">👨‍🏫 Toàn thể Giáo viên bộ môn & Chủ nhiệm</option>
                <option value="STUDENT">🎓 Toàn bộ Học sinh các khối</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Tiêu đề bản tin <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="VD: [KHẨN] Kế hoạch kiểm tra định kỳ & điều chỉnh lịch sinh hoạt..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nội dung chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={5}
                placeholder="Nhập chi tiết nội dung chỉ đạo, lưu ý, thời gian biểu, tệp đính kèm hướng dẫn..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {sending ? (
                <>Đang phát sóng...</>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Phát Thông Báo Ngay
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề, người nhận, nội dung..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-64 sm:w-80"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTargetFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                targetFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTargetFilter("TEACHER")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                targetFilter === "TEACHER"
                  ? "bg-white text-emerald-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Giáo viên
            </button>
            <button
              onClick={() => setTargetFilter("STUDENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                targetFilter === "STUDENT"
                  ? "bg-white text-sky-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Học sinh
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-semibold">
          Tổng cộng: <strong className="text-slate-900">{filteredNotifications.length}</strong> bản tin
        </span>
      </div>

      {/* Danh sách thông báo đã phát */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600 mb-2"></div>
            <p className="text-xs font-medium">Đang tải lịch sử thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Bell className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
            <p className="text-sm font-bold text-slate-700">Chưa có thông báo nào</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Không tìm thấy bản tin phát sóng nào khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
            {filteredNotifications.map((notif) => {
              const roleBadge = ROLE_LABELS[notif.receiverRole] || {
                label: notif.receiverRole,
                color: "bg-slate-50 text-slate-700 border-slate-200",
              };
              return (
                <div
                  key={notif.id}
                  className="p-5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4 group"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleBadge.color}`}
                      >
                        {roleBadge.label}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {notif.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {notif.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1 text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Người gửi: <strong className="text-slate-800">{notif.senderName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        Tới: <strong className="text-slate-800">{notif.receiverName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(notif.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
