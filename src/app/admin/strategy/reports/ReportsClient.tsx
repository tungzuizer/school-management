"use client";

import React, { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  User,
  ShieldCheck,
  Award,
  Layers,
  FileCheck,
} from "lucide-react";

interface ObjectiveItem {
  id: string;
  code: string;
  title: string;
  category: string;
  targetValue: number;
  actualValue?: number | null;
  unit: string;
  completionRate: number;
  status: string;
}

interface KpiItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  targetValue?: number | null;
}

interface EvidenceItem {
  id: string;
  fileName: string;
  fileType: string;
  uploadedByName: string;
  relatedContent?: string | null;
}

interface ReportDataResponse {
  reportMeta: {
    governingBody: string;
    schoolName: string;
    academicYear: string;
    exportDate: string;
    preparedBy: string;
    checkedBy: string;
    approvedBy: string;
  };
  data: {
    objectives: ObjectiveItem[];
    kpiCatalogs: KpiItem[];
    evidenceFiles: EvidenceItem[];
    reportType: string;
  };
}

export default function ReportsClient({
  initialData,
}: {
  initialData: ReportDataResponse | null;
}) {
  const [selectedReportType, setSelectedReportType] = useState<string>("QUALITY_OBJECTIVE_LIST");
  const [reportTitleInput, setReportTitleInput] = useState("BÁO CÁO DANH SÁCH MỤC TIÊU CHẤT LƯỢNG NĂM HỌC 2026-2027");

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const meta = initialData?.reportMeta || {
    governingBody: "SỞ GIÁO DỤC VÀ ĐÀO TẠO - PHÒNG GD&ĐT",
    schoolName: "TRƯỜNG THCS CHU VĂN AN",
    academicYear: "2026 - 2027",
    exportDate: new Date().toLocaleDateString("vi-VN"),
    preparedBy: "Nguyễn Văn Phú (Phòng ĐBCL)",
    checkedBy: "Trần Thị Minh (Phó Hiệu trưởng)",
    approvedBy: "Phạm Hoàng Anh (Hiệu trưởng)",
  };

  const objectives = initialData?.data?.objectives || [];
  const kpiCatalogs = initialData?.data?.kpiCatalogs || [];
  const evidenceFiles = initialData?.data?.evidenceFiles || [];

  const handleReportTypeChange = (type: string) => {
    setSelectedReportType(type);
    switch (type) {
      case "STRATEGY_5Y":
        setReportTitleInput("BÁO CÁO QY HOẠCH CHIẾN LƯỢC PHÁT TRIỂN TRƯỜNG 5 NĂM GIAI ĐOẠN 2026 - 2030");
        break;
      case "ACADEMIC_YEAR_PLAN":
        setReportTitleInput("BÁO CÁO KẾ HOẠCH VẬN HÀNH NĂM HỌC 2026 - 2027");
        break;
      case "QUALITY_OBJECTIVE_LIST":
        setReportTitleInput("BÁO CÁO DANH SÁCH MỤC TIÊU CHẤT LƯỢNG SMART VÀ KẾT QUẢ THỰC HIỆN");
        break;
      case "KPI_CATALOG":
        setReportTitleInput("BÁO CÁO BỘ CHỈ SỐ KPI TOÀN TRƯỜNG VÀ ĐỊNH HƯỚNG ĐÁNH GIÁ");
        break;
      case "KPI_RESULTS":
        setReportTitleInput("BÁO CÁO KẾT QUẢ ĐÁNH GIÁ THỰC HIỆN KPI THEO HỌC KỲ");
        break;
      case "CAMPUS_ALLOCATION":
        setReportTitleInput("BÁO CÁO PHÂN BỔ CHỈ TIÊU VÀ ĐƠN VỊ THỰC HIỆN THEO PHÂN HIỆU");
        break;
      case "STRATEGY_DASHBOARD":
        setReportTitleInput("BÁO CÁO TỔNG HỢP DASHBOARD ĐIỀU HÀNH CHIẾN LƯỢC");
        break;
      default:
        setReportTitleInput("BÁO CÁO QUẢN TRỊ CHIẾN LƯỢC TRƯỜNG HỌC");
    }
  };

  // Export handlers
  const handleExportPDF = () => {
    window.print();
    showToast("success", "Đã mở giao diện in / xuất PDF chuẩn Unicode tiếng Việt!");
  };

  const handleExportWord = () => {
    const reportHtml = document.getElementById("report-printable-area")?.innerHTML || "";
    const blob = new Blob(
      [
        `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${reportTitleInput}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; }
          table { border-collapse: collapse; width: 100%; margin-top: 12pt; }
          th, td { border: 1px solid #000; padding: 6pt; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header-title { font-size: 16pt; font-weight: bold; text-align: center; }
        </style>
        </head>
        <body>${reportHtml}</body></html>`,
      ],
      { type: "application/msword;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitleInput.replace(/ /g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Xuất báo cáo định dạng Word (.doc) thành công!");
  };

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `${meta.governingBody}\n`;
    csvContent += `${meta.schoolName}\n`;
    csvContent += `${reportTitleInput}\n`;
    csvContent += `Năm học: ${meta.academicYear} | Ngày xuất: ${meta.exportDate}\n\n`;

    csvContent += "Mã chỉ số,Tên chỉ số / Mục tiêu,Danh mục,Chỉ tiêu,Thực hiện,Đơn vị,Tỷ lệ hoàn thành (%),Trạng thái\n";

    objectives.forEach((obj) => {
      csvContent += `"${obj.code}","${obj.title.replace(/"/g, '""')}","${obj.category}",${obj.targetValue},${
        obj.actualValue || 0
      },"${obj.unit}",${obj.completionRate}%,"${obj.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportTitleInput.replace(/ /g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Xuất bảng dữ liệu Excel (.csv) có cố định tiêu đề và định dạng chuẩn thành công!");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-pulse ${
            feedback.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {/* Header Toolbar (Hide during window.print) */}
      <div className="print:hidden bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-blue-200 mb-2">
              <Printer className="w-4 h-4 text-emerald-400" />
              HỆ THỐNG XUẤT BÁO CÁO QUẢN TRỊ HÀNH CHÍNH
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Xuất Báo Cáo & Dữ Liệu Chiến Lược</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Tạo lập báo cáo hành chính chuẩn hóa theo mẫu Bộ GD&ĐT. Hỗ trợ xuất định dạng PDF chuẩn Tiếng Việt, Word dễ dàng chỉnh sửa và Excel định dạng bảng tính.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> Xuất PDF / In
            </button>
            <button
              onClick={handleExportWord}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <FileCode className="w-4 h-4" /> Xuất Word (.doc)
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Xuất Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel (Hide during print) */}
      <div className="print:hidden bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Chọn mẫu báo cáo quản trị:</label>
            <select
              value={selectedReportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2.5 bg-white font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="STRATEGY_5Y">1. Chiến lược phát triển trường 5 năm (2026-2030)</option>
              <option value="ACADEMIC_YEAR_PLAN">2. Kế hoạch năm học (2026-2027)</option>
              <option value="QUALITY_OBJECTIVE_LIST">3. Danh sách Mục tiêu Chất lượng SMART</option>
              <option value="KPI_CATALOG">4. Bộ chỉ số KPI Toàn trường</option>
              <option value="KPI_RESULTS">5. Kết quả thực hiện KPI Học kỳ</option>
              <option value="CAMPUS_ALLOCATION">6. Phân bổ chỉ tiêu cho các Phân hiệu</option>
              <option value="STRATEGY_DASHBOARD">7. Dashboard Quản trị & Điều hành Chiến lược</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Tiêu đề báo cáo tùy chỉnh:</label>
            <input
              type="text"
              value={reportTitleInput}
              onChange={(e) => setReportTitleInput(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Document Card Area */}
      <div
        id="report-printable-area"
        className="bg-white p-8 md:p-12 rounded-xl border border-gray-300 shadow-md text-gray-900 font-serif leading-relaxed max-w-4xl mx-auto space-y-6"
      >
        {/* Document Header (Logo & Governing Body) */}
        <div className="flex justify-between items-start border-b border-gray-800 pb-4 text-xs font-sans">
          <div className="text-center space-y-0.5">
            <p className="uppercase font-semibold tracking-tight">{meta.governingBody}</p>
            <p className="font-bold text-sm uppercase text-blue-900 tracking-wider">{meta.schoolName}</p>
            <p className="text-[10px] text-gray-500">Mã đơn vị: THCS-CVA-2026</p>
          </div>

          <div className="text-center space-y-0.5">
            <p className="font-bold uppercase tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-xs">Độc lập - Tự do - Hạnh phúc</p>
            <p className="text-[10px] text-gray-500 italic mt-1">Hà Nội, ngày {meta.exportDate}</p>
          </div>
        </div>

        {/* Document Main Title */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-lg md:text-xl font-bold text-blue-950 uppercase tracking-wide leading-snug">
            {reportTitleInput}
          </h1>
          <p className="text-xs font-sans text-gray-600 font-medium">Năm học: {meta.academicYear}</p>
        </div>

        {/* Executive Summary Paragraph */}
        <div className="text-xs space-y-2 text-justify font-sans">
          <p>
            Căn cứ Kế hoạch Chiến lược phát triển nhà trường giai đoạn 2026–2030 và Quy trình Phê duyệt & Khóa dữ liệu đã ban hành, Ban Giám hiệu Trường THCS Chu Văn An báo cáo chi tiết các mục tiêu, chỉ số và kết quả theo dõi định kỳ như sau:
          </p>
        </div>

        {/* Data Table Section */}
        <div className="space-y-3 font-sans">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border border-slate-200 shadow-xs border-blue-900 pl-2">
            I. Bảng tổng hợp Mục tiêu & Chỉ số Chất lượng (Data Summary Table)
          </h2>

          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                <th className="p-2.5 border border-gray-300">STT</th>
                <th className="p-2.5 border border-gray-300">Mã chỉ số</th>
                <th className="p-2.5 border border-gray-300">Tên Mục tiêu / Chỉ số</th>
                <th className="p-2.5 border border-gray-300 text-right">Chỉ tiêu</th>
                <th className="p-2.5 border border-gray-300 text-right">Thực hiện</th>
                <th className="p-2.5 border border-gray-300 text-center">Đơn vị</th>
                <th className="p-2.5 border border-gray-300 text-right">Tỷ lệ (%)</th>
                <th className="p-2.5 border border-gray-300 text-center">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {objectives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                    Chưa có dữ liệu chỉ số chiến lược.
                  </td>
                </tr>
              ) : (
                objectives.map((obj, idx) => (
                  <tr key={obj.id} className="border-b border-gray-200">
                    <td className="p-2 border border-gray-200 text-center font-mono">{idx + 1}</td>
                    <td className="p-2 border border-gray-200 font-bold text-blue-900">{obj.code}</td>
                    <td className="p-2 border border-gray-200 font-medium">{obj.title}</td>
                    <td className="p-2 border border-gray-200 text-right font-mono">{obj.targetValue}</td>
                    <td className="p-2 border border-gray-200 text-right font-mono">{obj.actualValue || 0}</td>
                    <td className="p-2 border border-gray-200 text-center">{obj.unit}</td>
                    <td className="p-2 border border-gray-200 text-right font-bold text-blue-800">
                      {obj.completionRate}%
                    </td>
                    <td className="p-2 border border-gray-200 text-center font-semibold">{obj.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Appendices & Related Evidence Files */}
        <div className="space-y-3 font-sans pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 border border-slate-200 shadow-xs border-blue-900 pl-2">
            II. Phụ lục & Danh mục Tệp Minh chứng Đính kèm
          </h2>
          <div className="space-y-1.5 text-xs text-gray-700">
            {evidenceFiles.length > 0 ? (
              evidenceFiles.slice(0, 4).map((f, i) => (
                <div key={f.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="font-medium">
                    Phụ lục {i + 1}: {f.fileName}
                  </span>
                  <span className="text-[10px] text-gray-500">Người nộp: {f.uploadedByName}</span>
                </div>
              ))
            ) : (
              <p className="italic text-gray-400">Không có tệp phụ lục đính kèm.</p>
            )}
          </div>
        </div>

        {/* Official Signature Area */}
        <div className="grid grid-cols-3 gap-4 text-center font-sans text-xs pt-8 border-t border-gray-200">
          <div className="space-y-1">
            <p className="font-bold uppercase text-gray-800">NGƯỜI LẬP BÁO CÁO</p>
            <p className="text-[10px] text-gray-400 italic">(Ký, ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-bold text-gray-900">{meta.preparedBy}</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold uppercase text-gray-800">NGƯỜI KIỂM TRA</p>
            <p className="text-[10px] text-gray-400 italic">(Phó Hiệu trưởng phụ trách)</p>
            <div className="h-16" />
            <p className="font-bold text-gray-900">{meta.checkedBy}</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold uppercase text-blue-950">HIỆU TRƯỞNG PHÊ DUYỆT</p>
            <p className="text-[10px] text-gray-400 italic">(Ký tên và đóng dấu)</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] font-mono px-2 py-1 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                [ĐÃ PHÊ DUYỆT & KHÓA]
              </span>
            </div>
            <p className="font-bold text-gray-900">{meta.approvedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
