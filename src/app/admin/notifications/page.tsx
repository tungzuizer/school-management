"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  sendNotificationToRole,
  deleteNotification,
} from "./actions";
import Toast from "@/components/ui/Toast";

type NotificationItem = Awaited<ReturnType<typeof getNotifications>>[number];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
          message: `Đã gửi thông báo tới ${result.count} người`,
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
    if (!confirm("Xóa thông báo này?")) return;
    try {
      await deleteNotification(id);
      setToast({ message: "Đã xóa thông báo", type: "success" });
      await loadNotifications();
    } catch {
      setToast({ message: "Lỗi khi xóa", type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800"> Thông báo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Đóng" : "Tạo thông báo mới"}
        </button>
      </div>

      {/* Form tạo thông báo */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Gửi thông báo
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gửi tới
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetRole: e.target.value as "ALL" | "TEACHER" | "STUDENT",
                  })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Toàn trường</option>
                <option value="TEACHER">Tất cả giáo viên</option>
                <option value="STUDENT">Tất cả học sinh</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề thông báo..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={5}
                placeholder="Nhập nội dung thông báo..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Đang gửi..." : " Gửi thông báo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách thông báo đã gửi */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">
            Lịch sử thông báo ({notifications.length})
          </h2>
        </div>
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-4xl mb-2"></p>
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {notif.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap line-clamp-3">
                      {notif.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        Từ: {notif.senderName} ({ROLE_LABELS[notif.senderRole] || notif.senderRole})
                      </span>
                      <span>•</span>
                      <span>
                        Tới: {notif.receiverName} ({ROLE_LABELS[notif.receiverRole] || notif.receiverRole})
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(notif.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(notif.id)}
                    className="text-red-400 hover:text-red-600 text-sm flex-shrink-0"
                    title="Xóa"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
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
