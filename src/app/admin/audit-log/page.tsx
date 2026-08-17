"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "./actions";
import { FileText, ChevronLeft, ChevronRight, Search } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  LOGIN: "Đăng nhập",
  LOGOUT: "Đăng xuất",
  EXPORT: "Xuất dữ liệu",
  IMPORT: "Nhập dữ liệu",
  APPROVE: "Phê duyệt",
  REJECT: "Từ chối",
  LOCK: "Khóa sổ",
  UNLOCK: "Mở khóa",
  PASSWORD_CHANGE: "Đổi mật khẩu",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-indigo-100 text-indigo-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  EXPORT: "bg-purple-100 text-purple-800",
  IMPORT: "bg-cyan-100 text-cyan-800",
  APPROVE: "bg-green-100 text-green-800",
  REJECT: "bg-orange-100 text-orange-800",
  LOCK: "bg-red-100 text-red-700",
  UNLOCK: "bg-yellow-100 text-yellow-800",
  PASSWORD_CHANGE: "bg-amber-100 text-amber-800",
};

interface AuditLogRow {
  id: string;
  userName: string | null;
  userRole: string | null;
  action: string;
  entityName: string;
  entityId: string | null;
  description: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const filters: any = {};
    if (filterAction) filters.action = filterAction;
    if (filterEntity) filters.entityName = filterEntity;
    if (filterUser) filters.userName = filterUser;
    if (filterDateFrom) filters.dateFrom = filterDateFrom;
    if (filterDateTo) filters.dateTo = filterDateTo;

    const res = await getAuditLogs(filters, page, pageSize);
    setLogs(res.logs as unknown as AuditLogRow[]);
    setTotal(res.total);
    setLoading(false);
  }, [page, filterAction, filterEntity, filterUser, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-7 h-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Nhật ký Kiểm toán Hệ thống</h1>
      </div>

      {/* Filters */}
      <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hành động</label>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="">Tất cả</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đối tượng</label>
            <input type="text" value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
              placeholder="VD: Student, Grade..."
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-40" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Người thao tác</label>
            <input type="text" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Tên người dùng..."
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-44" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" /> Lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Người thao tác</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Hành động</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Đối tượng</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Mô tả</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Đang tải...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Chưa có bản ghi nhật ký nào</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{l.userName || "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{l.userRole || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_COLORS[l.action] || "bg-gray-100 text-gray-800"}`}>
                      {ACTION_LABELS[l.action] || l.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{l.entityName}{l.entityId ? ` #${l.entityId.substring(0, 8)}` : ""}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-xs truncate">{l.description || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 text-xs text-gray-600">
            <span>Tổng: <strong>{total}</strong> bản ghi | Trang {page}/{totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-white disabled:opacity-40 flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-white disabled:opacity-40 flex items-center gap-1">
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
