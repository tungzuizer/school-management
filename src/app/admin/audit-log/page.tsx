/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App router route `/admin/audit-log` accessed via SuperAdmin sidebar navigation (`src/components/layout/AdminSidebar.tsx`).
 * 2. Affected APIs: `getAuditLogs` from `src/app/admin/audit-log/actions.ts`.
 * 3. Schema: Prisma `AuditLog` (`id`, `userId`, `userName`, `userRole`, `action`, `entityName`, `entityId`, `description`, `createdAt`).
 * 4. Verbatim User Instruction: "bạn đã sửa toàn bộ giao diện cho phù hợp với admin chưa" - Chuẩn hóa toàn bộ giao diện các trang Quản trị cho SuperAdmin.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "./actions";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldAlert,
  Clock,
  User,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";

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
  CREATE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  UPDATE: "bg-blue-50 text-blue-800 border-blue-200",
  DELETE: "bg-rose-50 text-rose-800 border-rose-200",
  LOGIN: "bg-indigo-50 text-indigo-800 border-indigo-200",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-200",
  EXPORT: "bg-purple-50 text-purple-800 border-purple-200",
  IMPORT: "bg-cyan-50 text-cyan-800 border-cyan-200",
  APPROVE: "bg-emerald-100 text-emerald-900 border-emerald-300",
  REJECT: "bg-amber-50 text-amber-800 border-amber-200",
  LOCK: "bg-rose-100 text-rose-900 border-rose-300",
  UNLOCK: "bg-amber-100 text-amber-900 border-amber-300",
  PASSWORD_CHANGE: "bg-violet-50 text-violet-800 border-violet-200",
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

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const filters: any = {};
    if (filterAction) filters.action = filterAction;
    if (filterEntity) filters.entityName = filterEntity;
    if (filterUser) filters.userName = filterUser;
    if (filterDateFrom) filters.dateFrom = filterDateFrom;
    if (filterDateTo) filters.dateTo = filterDateTo;

    try {
      const res = await getAuditLogs(filters, page, pageSize);
      setLogs(res.logs as unknown as AuditLogRow[]);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity, filterUser, filterDateFrom, filterDateTo]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleSearch = () => {
    setPage(1);
    loadData(true);
  };

  const handleResetFilters = () => {
    setFilterAction("");
    setFilterEntity("");
    setFilterUser("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            Nhật Ký Kiểm Toán Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ghi nhận toàn bộ thao tác bảo mật, thay đổi dữ liệu, đăng nhập và phê duyệt trong toàn hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Bộ lọc kiểm toán
          </span>
          {(filterAction || filterEntity || filterUser || filterDateFrom || filterDateTo) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Hành động</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Tất cả hành động</option>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({k})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Đối tượng</label>
            <input
              type="text"
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              placeholder="VD: LessonPlan, User..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Người thao tác</label>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Tên người dùng..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Từ ngày</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Đến ngày</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Người thao tác</th>
                <th className="px-5 py-3.5">Vai trò</th>
                <th className="px-5 py-3.5">Hành động</th>
                <th className="px-5 py-3.5">Đối tượng</th>
                <th className="px-5 py-3.5">Mô tả chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Đang tải dữ liệu kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-medium">
                    Không tìm thấy bản ghi nhật ký kiểm toán phù hợp
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(l.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-slate-900 font-bold whitespace-nowrap">
                      {l.userName || "Hệ thống"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-medium whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                        {l.userRole || "SYSTEM"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ACTION_COLORS[l.action] || "bg-slate-100 text-slate-800 border-slate-200"
                        }`}
                      >
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-semibold whitespace-nowrap">
                      {l.entityName}
                      {l.entityId ? (
                        <span className="text-slate-400 text-[10px] font-normal ml-1">
                          #{l.entityId.substring(0, 8)}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-sm truncate" title={l.description || ""}>
                      {l.description || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/75 text-xs text-slate-600">
            <span>
              Tổng số: <strong className="text-slate-900 font-bold">{total}</strong> bản ghi | Trang{" "}
              <strong className="text-indigo-600">{page}</strong>/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold cursor-pointer transition shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-bold cursor-pointer transition shadow-2xs"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
