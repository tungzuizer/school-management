"use client";

import React, { useRef } from "react";
import { Printer, Lock, FileText, AlertCircle } from "lucide-react";

interface PrintableTranscriptProps {
  transcript: any;
  studentName?: string;
  studentCode?: string;
  dob?: string;
  gender?: string;
}

export default function PrintableTranscript({
  transcript,
  studentName,
  studentCode,
  dob,
  gender,
}: PrintableTranscriptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!transcript) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Chưa có dữ liệu học bạ cho năm học này</p>
      </div>
    );
  }

  const getConductLabel = (rating?: string | null) => {
    switch (rating) {
      case "GOOD":
        return "Tốt";
      case "FAIR":
        return "Khá";
      case "AVERAGE":
        return "Đạt";
      case "POOR":
        return "Chưa đạt";
      default:
        return "Chưa đánh giá";
    }
  };

  const getAcademicLabel = (rating?: string | null) => {
    switch (rating) {
      case "EXCELLENT":
        return "Tốt / Xuất sắc";
      case "GOOD":
        return "Khá";
      case "AVERAGE":
        return "Đạt";
      case "POOR":
        return "Chưa đạt";
      default:
        return "Chưa đánh giá";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED_LOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Đã Phê Duyệt & Khóa Sổ Pháp Lý
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
            <ClockIcon className="w-3.5 h-3.5 text-blue-600" />
            Đang Chờ BGH Duyệt
          </span>
        );
      case "UNLOCK_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Chờ Duyệt Xin Mở Khóa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-300">
            Bản Nháp (Đang Chỉnh Sửa)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          {getStatusBadge(transcript.status)}
          <span className="text-xs text-gray-500 font-medium">
            Năm học: <strong className="text-gray-800">{transcript.schoolYear}</strong>
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          In Học Bạ (Chuẩn Bộ GD&ĐT)
        </button>
      </div>

      {/* Printable Sheet Content */}
      <div
        ref={printRef}
        className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-md text-gray-900 print:shadow-none print:border-none print:p-0 font-serif"
      >
        {/* Header - Ministry & School Info */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-gray-600">
              BỘ GIÁO DỤC VÀ ĐÀO TẠO
            </h4>
            <h3 className="text-sm font-bold uppercase text-gray-800">
              {transcript.classRoom?.school?.name || "TRƯỜNG THCS & THPT CHUẨN QUỐC GIA"}
            </h3>
            <p className="text-xs text-gray-500 font-sans">Mã trường: SCH-2026-BD</p>
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-xs font-sans font-bold uppercase text-gray-800">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </h4>
            <p className="text-xs italic text-gray-700">Độc lập - Tự do - Hạnh phúc</p>
            <div className="w-24 h-0.5 bg-gray-800 mx-auto mt-1" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center my-6 space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900 font-sans">
            HỌC BẠ HỌC SINH
          </h1>
          <p className="text-sm italic text-gray-600">
            (Theo Thông tư Bộ Giáo dục và Đào tạo - Năm học {transcript.schoolYear})
          </p>
        </div>

        {/* Student & Class Info Section */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200 mb-6 text-sm font-sans">
          <div>
            <p>
              <span className="font-semibold text-gray-600">Họ và tên học sinh:</span>{" "}
              <strong className="text-gray-900 uppercase">{studentName || transcript.student?.user?.name || "---"}</strong>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-600">Mã học sinh:</span>{" "}
              <span className="font-mono font-medium text-indigo-700">{studentCode || transcript.student?.studentCode || transcript.studentId}</span>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-600">Lớp học:</span>{" "}
              <strong className="text-gray-800">{transcript.classRoom?.name || "---"}</strong> (Khối {transcript.gradeLevel})
            </p>
          </div>
          <div>
            <p>
              <span className="font-semibold text-gray-600">Ngày sinh:</span>{" "}
              <span>{dob || "01/01/2010"}</span>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-600">Giới tính:</span>{" "}
              <span>{gender || "Nam"}</span>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-gray-600">Trạng thái khóa học bạ:</span>{" "}
              <span className="font-bold text-emerald-700">
                {transcript.status === "APPROVED_LOCKED" ? "Đã Khóa Phê Duyệt" : "Chưa Khóa (Đang xử lý)"}
              </span>
            </p>
          </div>
        </div>

        {/* Grades Table */}
        <div className="mb-6 overflow-hidden border border-gray-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-gray-100 text-gray-900 uppercase font-bold border-b border-gray-800 text-center">
                <th className="p-2.5 border-r border-gray-800 w-10">STT</th>
                <th className="p-2.5 border-r border-gray-800 text-left">Môn học</th>
                <th className="p-2.5 border-r border-gray-800 w-24">ĐTB Học kỳ I</th>
                <th className="p-2.5 border-r border-gray-800 w-24">ĐTB Học kỳ II</th>
                <th className="p-2.5 border-r border-gray-800 w-24 bg-indigo-50/50">ĐTB Cả Năm</th>
                <th className="p-2.5">Nhận xét của Giáo viên bộ môn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {transcript.subjectGrades && transcript.subjectGrades.length > 0 ? (
                transcript.subjectGrades.map((sg: any, idx: number) => (
                  <tr key={sg.id || idx} className="hover:bg-gray-50/50">
                    <td className="p-2 border-r border-gray-800 text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border-r border-gray-800 font-semibold text-gray-900">
                      {sg.subjectName || sg.subject?.name}
                    </td>
                    <td className="p-2 border-r border-gray-800 text-center font-mono text-sm">
                      {sg.term1AvgScore !== null ? sg.term1AvgScore : "---"}
                    </td>
                    <td className="p-2 border-r border-gray-800 text-center font-mono text-sm">
                      {sg.term2AvgScore !== null ? sg.term2AvgScore : "---"}
                    </td>
                    <td className="p-2 border-r border-gray-800 text-center font-mono text-sm font-bold text-indigo-900 bg-indigo-50/30">
                      {sg.fullYearAvgScore !== null ? sg.fullYearAvgScore : "---"}
                    </td>
                    <td className="p-2 italic text-gray-700">{sg.evaluationComment || "Hoàn thành tốt nhiệm vụ học tập."}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500 italic">
                    Chưa có bảng điểm môn học
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Overall Evaluation Section */}
        <div className="border border-gray-800 rounded-lg p-5 mb-6 space-y-3 font-sans text-sm bg-gray-50/40">
          <h3 className="font-bold text-gray-900 uppercase border-b border-gray-300 pb-2 text-xs tracking-wider">
            KẾT QUẢ ĐÁNH GIÁ VÀ XẾP LOẠI CẢ NĂM HỌC
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">Điểm TB Các Môn (GPA)</p>
              <p className="text-xl font-bold text-indigo-700 font-mono mt-1">
                {transcript.fullYearGPA !== null ? transcript.fullYearGPA : "---"}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">Kết quả Rèn luyện (Hạnh kiểm)</p>
              <p className="text-base font-bold text-emerald-700 mt-1">
                {getConductLabel(transcript.fullYearConduct)}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
              <p className="text-xs text-gray-500 font-medium">Kết quả Học tập (Học lực)</p>
              <p className="text-base font-bold text-blue-700 mt-1">
                {getAcademicLabel(transcript.fullYearAcademic)}
              </p>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-4 text-sm">
            <p>
              <strong className="text-gray-700">Kết quả lên lớp / hoàn thành chương trình:</strong>{" "}
              <span className="font-bold text-emerald-800">{transcript.promotionStatus || "Được lên lớp"}</span>
            </p>
            <p>
              <strong className="text-gray-700">Khen thưởng cấp trường / ngành:</strong>{" "}
              <span className="font-medium text-amber-800">{transcript.rewardsAwarded || "Học sinh Tiên tiến"}</span>
            </p>
          </div>

          <div className="pt-2">
            <strong className="text-gray-800 block mb-1">Ý kiến nhận xét của Giáo viên Chủ nhiệm:</strong>
            <div className="p-3 bg-white border border-gray-300 rounded-lg italic text-gray-800">
              "{transcript.homeroomTeacherComment || "Học sinh ngoan ngoãn, có ý thức vươn lên trong học tập, chấp hành tốt nội quy nhà trường."}"
            </div>
          </div>
        </div>

        {/* Signatures & Seal Section */}
        <div className="grid grid-cols-2 gap-8 pt-6 text-center font-sans">
          <div>
            <p className="text-xs italic text-gray-500">..., ngày ... tháng ... năm 2026</p>
            <p className="font-bold text-sm text-gray-900 mt-1 uppercase">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="text-xs italic text-gray-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold text-gray-800 text-sm">Nguyễn Thị Hoa</p>
          </div>

          <div>
            <p className="text-xs italic text-gray-500">..., ngày ... tháng ... năm 2026</p>
            <p className="font-bold text-sm text-gray-900 mt-1 uppercase">HIỆU TRƯỞNG / BGH PHÊ DUYỆT</p>
            <p className="text-xs italic text-gray-500">(Ký tên, đóng dấu xác nhận học bạ)</p>
            <div className="h-20 flex items-center justify-center">
              {transcript.status === "APPROVED_LOCKED" && (
                <div className="border-2 border-red-600 text-red-600 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider transform -rotate-6 shadow-2xs">
                  ★ ĐÃ ĐÓNG DẤU KHÓA SỔ ★
                </div>
              )}
            </div>
            <p className="font-bold text-gray-800 text-sm">TS. Nguyễn Văn Hùng</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
