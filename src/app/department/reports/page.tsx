"use client";

import { useEffect, useState } from "react";
import { getDepartmentDashboard } from "../dashboard/actions";
import {
  FileText, Download, Printer, Filter, Building2, School, Users, GraduationCap,
  TrendingUp, CheckCircle, BarChart3
} from "lucide-react";

export default function DepartmentReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [reportType, setReportType] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      const res = await getDepartmentDashboard();
      setData(res);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900">Báo Cáo Tổng Hợp Sở Giáo Dục & Đào Tạo</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tổng hợp dữ liệu toàn bộ các Phòng GD&ĐT, Trường THPT và cơ sở giáo dục trực thuộc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo</span>
          </button>
          <button
            onClick={() => alert("Đã xuất báo cáo tổng hợp dạng Excel/PDF!")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Bộ lọc:
        </span>
        {[
          { id: "ALL", label: "Tất cả đơn vị" },
          { id: "THPT", label: "Khối THPT Trực thuộc" },
          { id: "WARD", label: "Khối Phòng GD&ĐT" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              reportType === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Phòng GD&ĐT</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{data?.totalWards || 0}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 100% Đang hoạt động
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Trường THPT</span>
            <School className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{data?.totalThptSchools || 0}</p>
          <p className="text-[11px] text-purple-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Chuẩn quốc gia
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tổng Giáo Viên</span>
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{data?.totalTeachers || 0}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">Đã cập nhật hồ sơ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tổng Học Sinh</span>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{data?.totalStudents || 0}</p>
          <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Toàn vùng quản lý
          </p>
        </div>
      </div>

      {/* Main Report Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm">Bảng Thống Kê Chi Tiết Theo Đơn Vị Quản Lý</h3>
          </div>
          <span className="text-xs text-gray-500 font-mono">Năm học 2025 - 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/80 text-gray-600 uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Tên Đơn Vị / Khối</th>
                <th className="py-3 px-4">Phân Loại</th>
                <th className="py-3 px-4 text-center">Số Trường</th>
                <th className="py-3 px-4 text-center">Trạng Thái Đồng Bộ</th>
                <th className="py-3 px-4 text-right">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {data?.wards?.map((ward: any) => (
                <tr key={ward.id} className="hover:bg-indigo-50/30 transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span>{ward.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Phòng GD&ĐT
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-900">{ward.schoolCount}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 100% Đầy đủ
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Xuất sắc
                    </span>
                  </td>
                </tr>
              ))}

              <tr className="hover:bg-indigo-50/30 transition bg-purple-50/20">
                <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-purple-600" />
                  <span>Khối Các Trường THPT Trực Thuộc Sở</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Sở Quản Lý Trực Tiếp
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-gray-900">{data?.totalThptSchools || 0}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 100% Đầy đủ
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Tốt
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
