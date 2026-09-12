/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/tt15-evaluation/page.tsx, src/app/vice-principal/tt15-evaluation/page.tsx.
 * 2. Affected APIs: getTT15Indicators, getSchoolPointEvaluation, submitEvaluationToPrincipal, reviewEvaluationByPrincipal, saveEvaluationDraft, addEvidenceFile, getCampusEvaluationSummary.
 * 3. Schema: TT15Indicator, SchoolPointEvaluation, TT15EvidenceFile, SchoolPointEvaluationDetail.
 * 4. Verbatim User Instruction: "không thay đổi gì cả ?? bạn đang làm gì vậy bạn không làm gì cả ?? tôi cần bạn làm thật kỹ" - "theo khuyến nghị".
 */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  getTT15Indicators,
  getSchoolPointEvaluation,
  saveEvaluationDraft,
  submitEvaluationToPrincipal,
  reviewEvaluationByPrincipal,
  addEvidenceFile,
  getCampusEvaluationSummary,
  savePrincipalReviewDetails
} from "./actions";
import { calculateTT15Ranking, STANDARD_TITLES } from "@/lib/tt15-utils";

export default function TT15EvaluationClient({ campuses, role, defaultYear, userId }: { campuses: any[], role: string, defaultYear: number, userId: string }) {
  const [selectedCampus, setSelectedCampus] = useState(campuses[0]?.id || "");
  const [selectedPoint, setSelectedPoint] = useState("");
  const [activeTab, setActiveTab] = useState<"evaluate" | "summary">("evaluate");

  const [indicators, setIndicators] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [campusSummary, setCampusSummary] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Draft Form State
  const [formData, setFormData] = useState<Record<string, { assessment: string, evidenceObj: any[], notes?: string, principalComment?: string, score?: number }>>({});

  useEffect(() => {
    getTT15Indicators().then(data => setIndicators(data));
  }, []);

  const loadSummary = useCallback(async () => {
    if (selectedCampus) {
      try {
        const sum = await getCampusEvaluationSummary(selectedCampus, defaultYear);
        setCampusSummary(sum);
      } catch (err) {
        console.warn("Lỗi tải tổng hợp phân hiệu:", err);
      }
    }
  }, [selectedCampus, defaultYear]);

  useEffect(() => {
    if (selectedCampus) {
      loadSummary();
    }
  }, [selectedCampus, defaultYear, loadSummary]);

  const loadEvaluation = useCallback(async () => {
    if (!selectedPoint) return;
    setLoading(true);
    try {
      const data = await getSchoolPointEvaluation(selectedPoint, defaultYear);
      setEvaluationData(data);
      if (data) {
        let newForm: any = {};
        for(const detail of data.details) {
          newForm[detail.indicatorId] = {
            assessment: detail.selfAssessment,
            evidenceObj: detail.evidenceFiles || [],
            notes: detail.notes || "",
            principalComment: detail.principalComment || "",
            score: detail.score || 0
          };
        }
        setFormData(newForm);
      } else {
        setFormData({});
      }
    } catch(err) {
      console.warn("Lỗi fetch evaluation:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPoint, defaultYear]);

  useEffect(() => {
    if (selectedPoint) {
      loadEvaluation();
    }
  }, [selectedPoint, defaultYear, loadEvaluation]);

  const isVpRole = role === "VICE_PRINCIPAL" || role === "SUPER_ADMIN" || role === "ADMIN";
  const isAdminRole = role === "ADMIN" || role === "SUPER_ADMIN" || role === "DEPARTMENT_ADMIN" || role === "WARD_ADMIN";

  const handleAssessmentChange = (indicatorId: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        assessment: val,
        evidenceObj: prev[indicatorId]?.evidenceObj || [],
      },
    }));
  };

  const handleNotesChange = (indicatorId: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        notes: val,
        evidenceObj: prev[indicatorId]?.evidenceObj || [],
      },
    }));
  };

  const handlePrincipalReviewChange = (indicatorId: string, field: "principalComment" | "score", val: any) => {
    setFormData((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        assessment: prev[indicatorId]?.assessment || "",
        evidenceObj: prev[indicatorId]?.evidenceObj || [],
        [field]: val,
      },
    }));
  };

  const handleRealUpload = (indicatorId: string) => {
    if (!evaluationData) {
      alert("Hệ thống chưa tạo bản nháp đánh giá. Vui lòng thử lại.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "tt15-evidence");

      try {
        setSubmitting(true);
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: fd
        });
        const result = await res.json();

        if (result.success) {
          const evidenceRes = await addEvidenceFile(
            evaluationData.id,
            indicatorId,
            result.fileUrl,
            result.fileName,
            result.fileType,
            result.fileSize
          );

          if (evidenceRes.success) {
            setFormData(prev => ({
              ...prev,
              [indicatorId]: {
                ...prev[indicatorId],
                assessment: prev[indicatorId]?.assessment || "Đạt",
                evidenceObj: [...(prev[indicatorId]?.evidenceObj || []), evidenceRes.evidence]
              }
            }));
            alert("Tải lên minh chứng thành công!");
          }
        } else {
          alert("Lỗi tải file: " + result.error);
        }
      } catch (err: any) {
        alert("Lỗi server khi upload: " + err.message);
      } finally {
        setSubmitting(false);
      }
    };
    input.click();
  };

  const handleSaveDraft = async () => {
    if(!evaluationData) return;
    setSubmitting(true);
    try {
      const detailsArray = Object.keys(formData).map(indId => ({
        indicatorId: indId,
        selfAssessment: formData[indId].assessment,
        notes: formData[indId].notes || ""
      }));
      await saveEvaluationDraft(evaluationData.id, detailsArray);
      alert("Đã lưu nháp thành công!");
      loadEvaluation();
    } catch(err: any) {
      alert("Lỗi lưu nháp: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePrincipalReviews = async () => {
    if(!evaluationData) return;
    setSubmitting(true);
    try {
      const reviews = Object.keys(formData).map(indId => ({
        indicatorId: indId,
        principalComment: formData[indId].principalComment,
        score: formData[indId].score
      }));
      await savePrincipalReviewDetails(evaluationData.id, reviews);
      alert("Đã lưu thẩm định của Hiệu trưởng!");
      loadEvaluation();
    } catch(err: any) {
      alert("Lỗi lưu thẩm định: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgreeAllReviews = () => {
    const newForm = { ...formData };
    for (const ind of indicators) {
      const row = newForm[ind.id] || { assessment: "Đạt", evidenceObj: [] };
      newForm[ind.id] = {
        ...row,
        principalComment: "Đồng thuận với tự đánh giá của Phó HT.",
        score: row.assessment === "Tốt" ? 3 : row.assessment === "Khá" ? 2 : row.assessment === "Đạt" ? 1 : 0
      };
    }
    setFormData(newForm);
  };

  const handleSubmit = async () => {
    if(!evaluationData) {
      alert("System: Chưa có id đánh giá. Vui lòng chọn điểm trường lại.");
      return;
    }
    setSubmitting(true);

    // Tự động lưu form trước khi Submit để đảm bảo DB khớp với giao diện
    try {
      const detailsArray = Object.keys(formData).map(indId => ({
        indicatorId: indId,
        selfAssessment: formData[indId].assessment,
        notes: formData[indId].notes || ""
      }));
      await saveEvaluationDraft(evaluationData.id, detailsArray);
    } catch(err) {
      alert("Không thể lưu dữ liệu form trước khi trình duyệt.");
      setSubmitting(false);
      return;
    }

    const res = await submitEvaluationToPrincipal(evaluationData.id);
    if (!res.success) {
      alert("LỖI (Hệ thống chặn): " + res.error);
    } else {
      alert("Thành công: " + res.message);
      loadEvaluation();
    }
    setSubmitting(false);
  };

  const currentCamp = campuses.find((c: any) => c.id === selectedCampus);
  const points = currentCamp?.schoolPoints || [];
  const currentPointObj = points.find((p: any) => p.id === selectedPoint);

  // Group indicators by standard
  const groupedIndicators = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const ind of indicators) {
      if (!groups[ind.standard]) groups[ind.standard] = [];
      groups[ind.standard].push(ind);
    }
    return groups;
  }, [indicators]);

  // Real-time calculation of TT15 rank based on current formData
  const currentRankInfo = useMemo(() => {
    const details = indicators.map(ind => ({
      selfAssessment: formData[ind.id]?.assessment || null,
      principalAssessment: null,
      score: formData[ind.id]?.score || null
    }));
    return calculateTT15Ranking(details);
  }, [indicators, formData]);

  const handleExportReport = () => {
    if (!evaluationData) {
      alert("Chưa có dữ liệu để xuất báo cáo!");
      return;
    }
    window.print();
  };

  return (
    <>
      {/* ==================== INTERACTIVE WEB VIEW (Hidden on Print) ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 print:hidden">

        {/* Header Tabs */}
      <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("evaluate")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "evaluate"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📋 Chi Tiết Đánh Giá Điểm Trường
          </button>
          <button
            onClick={() => { setActiveTab("summary"); loadSummary(); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "summary"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📊 Tổng Hợp Phân Hiệu (Hiệu Trưởng)
          </button>
        </div>

        {selectedPoint && activeTab === "evaluate" && (
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            🖨️ Xuất Báo Cáo TT15 (In/PDF)
          </button>
        )}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">🏛️ Phân hiệu (Campus)</label>
          <select
            className="w-full border-slate-300 rounded-lg text-sm py-2 px-3 bg-white"
            value={selectedCampus}
            onChange={(e) => { setSelectedCampus(e.target.value); setSelectedPoint(""); }}
          >
            {campuses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">🏫 Điểm trường (School Point)</label>
          <select
            className="w-full border-slate-300 rounded-lg text-sm py-2 px-3 bg-white"
            value={selectedPoint}
            onChange={(e) => setSelectedPoint(e.target.value)}
          >
            <option value="">-- Chọn Điểm trường cần thẩm định/đánh giá --</option>
            {points.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === "summary" ? (
        /* ==================== TAB TỔNG HỢP CẤP PHÂN HIỆU (HIỆU TRƯỞNG) ==================== */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl">
            <h3 className="text-lg font-bold text-blue-900">Bảng Tổng Hợp Đánh Giá Chuẩn TT15 Cấp Phân Hiệu</h3>
            <p className="text-sm text-blue-700 mt-1">
              Hiệu trưởng theo dõi toàn diện các điểm trường trực thuộc phân hiệu, so sánh mức độ đạt chuẩn và tỷ lệ minh chứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {campusSummary.map((item) => (
              <div key={item.schoolPointId} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-base">{item.schoolPointName}</h4>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    item.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                    item.status === "SUBMITTED" ? "bg-indigo-100 text-indigo-800" :
                    item.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {item.status === "APPROVED" ? "Đã duyệt" :
                     item.status === "SUBMITTED" ? "Chờ HT duyệt" :
                     item.status === "REJECTED" ? "Yêu cầu làm lại" :
                     item.status === "DRAFT" ? "Đang nháp" : "Chưa lập"}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 pt-2 border-t">
                  <p>Xếp loại TT15: <strong className="text-indigo-600 font-bold">{item.ranking?.rank || "Chưa có"}</strong></p>
                  <p>Số tiêu chí đã chấm: <strong>{item.detailsCount} / {indicators.length}</strong></p>
                  <p>Số tệp minh chứng: <strong>{item.evidenceCount} tệp</strong></p>
                </div>

                <button
                  onClick={() => {
                    setSelectedPoint(item.schoolPointId);
                    setActiveTab("evaluate");
                  }}
                  className="w-full text-xs font-semibold bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-slate-200 rounded-lg py-2 transition-colors"
                >
                  Xem & Thẩm định chi tiết ➔
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ==================== TAB CHI TIẾT ĐÁNH GIÁ ĐIỂM TRƯỜNG ==================== */
        <div>
          {loading && <p className="text-slate-500 italic">Đang tải hồ sơ đánh giá điểm trường...</p>}

          {!loading && !selectedPoint && (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              🏫 Vui lòng chọn một Điểm trường ở trên để bắt đầu đánh giá hoặc thẩm định hồ sơ.
            </div>
          )}

          {!loading && selectedPoint && (
            <div className="space-y-6">

              {/* Scorecard & Ranking Overview */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Kết Quả Xếp Loại TT15/2026</span>
                    <h2 className="text-2xl font-black mt-1 text-amber-400">{currentRankInfo.rank}</h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Tổng hợp tự động từ {currentRankInfo.stats.total} tiêu chí đánh giá quy định.
                    </p>
                  </div>

                  <div className="flex gap-4 text-center">
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <p className="text-xs text-slate-300">Mức 3 (Tốt)</p>
                      <p className="text-xl font-black text-emerald-400">{currentRankInfo.stats.tot}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <p className="text-xs text-slate-300">Mức 2 (Khá)</p>
                      <p className="text-xl font-black text-blue-400">{currentRankInfo.stats.kha}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <p className="text-xs text-slate-300">Mức 1 (Đạt)</p>
                      <p className="text-xl font-black text-amber-400">{currentRankInfo.stats.dat}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                      <p className="text-xs text-slate-300">Chưa Đạt</p>
                      <p className="text-xl font-black text-rose-400">{currentRankInfo.stats.chuaDat}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Action Toolbar */}
              <div className="flex flex-wrap justify-between items-center bg-indigo-50 p-4 border border-indigo-100 rounded-xl gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-indigo-950">Trạng thái hồ sơ:</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      evaluationData?.status === "APPROVED" ? "bg-emerald-600 text-white" :
                      evaluationData?.status === "SUBMITTED" ? "bg-indigo-600 text-white" :
                      evaluationData?.status === "REJECTED" ? "bg-rose-600 text-white" :
                      "bg-amber-500 text-white"
                    }`}>
                      {evaluationData?.status === "APPROVED" ? "Đã Phê Duyệt" :
                       evaluationData?.status === "SUBMITTED" ? "Đã Trình Hiệu Trưởng" :
                       evaluationData?.status === "REJECTED" ? "Yêu Cầu Làm Lại" : "Bản Nháp"}
                    </span>
                  </div>
                  {evaluationData?.notes && (
                    <div className="mt-2 p-3 bg-white border border-rose-300 rounded-lg text-sm text-rose-800">
                      <strong>⚠️ Ý kiến chỉ đạo từ Hiệu trưởng: </strong>
                      {evaluationData.notes}
                    </div>
                  )}
                </div>

                {/* Actions for Vice Principal */}
                {isVpRole && (!evaluationData || evaluationData.status === "DRAFT" || evaluationData.status === "REJECTED") && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDraft}
                      disabled={submitting}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      💾 Lưu Nháp
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow disabled:opacity-50"
                    >
                      {submitting ? "Đang xử lý..." : "🚀 Trình Hiệu Trưởng Phê Duyệt"}
                    </button>
                  </div>
                )}

                {/* Actions for Principal */}
                {isAdminRole && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleAgreeAllReviews}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-xs font-bold"
                    >
                      ✅ Đồng Thuận Tất Cả
                    </button>
                    <button
                      onClick={handleSavePrincipalReviews}
                      disabled={submitting}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold"
                    >
                      💾 Lưu Thẩm Định
                    </button>
                    {evaluationData?.status === "SUBMITTED" && (
                      <>
                        <button
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                          onClick={async () => {
                            const reason = window.prompt("Nhập lý do từ chối/yêu cầu phúc tra (bắt buộc tối thiểu 20 ký tự):");
                            if (!reason || reason.trim().length < 20) {
                              alert("Bắt buộc phải nhập ý kiến chỉ đạo tối thiểu 20 ký tự khi yêu cầu làm lại!");
                              return;
                            }
                            const res = await reviewEvaluationByPrincipal(evaluationData.id, "REJECT", reason);
                            if (res.success) {
                              alert("Đã trả lại Yêu cầu làm lại cho Phó Hiệu trưởng.");
                              loadEvaluation();
                            } else {
                              alert("Lỗi: " + res.error);
                            }
                          }}
                        >
                          ❌ Yêu Cầu Làm Lại
                        </button>
                        <button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-black shadow-sm"
                          onClick={async () => {
                            const note = window.prompt("Nhập ý kiến kết luận phê duyệt (tối thiểu 20 ký tự):", "Đã thẩm định đầy đủ hồ sơ minh chứng và chấp thuận xếp loại của điểm trường.");
                            if (!note || note.trim().length < 20) {
                              alert("Bắt buộc phải nhập ý kiến kết luận phê duyệt tối thiểu 20 ký tự!");
                              return;
                            }
                            const res = await reviewEvaluationByPrincipal(evaluationData.id, "APPROVE", note);
                            if (res.success) {
                              alert("Đã phê duyệt thành công!");
                              loadEvaluation();
                            } else {
                              alert("Lỗi: " + res.error);
                            }
                          }}
                        >
                          🏆 Phê Duyệt Chính Thức
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* TT15 5 Standards Evaluation Table */}
              <div className="space-y-6">
                {Object.keys(groupedIndicators).map((stdKey) => (
                  <div key={stdKey} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm flex justify-between items-center">
                      <span>{STANDARD_TITLES[stdKey] || stdKey}</span>
                      <span className="text-xs text-slate-300 font-normal">
                        {groupedIndicators[stdKey].length} tiêu chí
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs">
                          <tr>
                            <th className="p-3 border-r w-16 text-center">Mã</th>
                            <th className="p-3 border-r w-1/3">Nội dung Tiêu chí (TT15)</th>
                            <th className="p-3 border-r w-40">Phó HT Tự Đánh Giá</th>
                            <th className="p-3 border-r">Tệp Minh Chứng Bắt Buộc</th>
                            <th className="p-3 w-1/4 bg-blue-50/50">Hiệu Trưởng Thẩm Định</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {groupedIndicators[stdKey].map((ind: any) => {
                            const rowData = formData[ind.id] || {};
                            return (
                              <tr key={ind.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3 border-r font-bold text-slate-700 text-center">{ind.code}</td>
                                <td className="p-3 border-r text-slate-800">
                                  <p className="font-semibold text-slate-900">{ind.name}</p>
                                  {ind.description && (
                                    <p className="text-xs text-slate-500 mt-1">{ind.description}</p>
                                  )}
                                </td>

                                {/* Vice Principal Column */}
                                <td className="p-3 border-r align-top space-y-2">
                                  <select
                                    value={rowData.assessment || ""}
                                    onChange={(e) => handleAssessmentChange(ind.id, e.target.value)}
                                    className={`w-full border rounded-lg text-xs font-semibold p-2 ${
                                      rowData.assessment === "Tốt" ? "border-emerald-500 bg-emerald-50 text-emerald-800" :
                                      rowData.assessment === "Khá" ? "border-blue-500 bg-blue-50 text-blue-800" :
                                      rowData.assessment === "Đạt" ? "border-amber-500 bg-amber-50 text-amber-800" :
                                      rowData.assessment === "Không Đạt" ? "border-rose-500 bg-rose-50 text-rose-800" :
                                      "border-slate-300"
                                    } disabled:bg-slate-100`}
                                    disabled={!isVpRole || evaluationData?.status === "APPROVED"}
                                  >
                                    <option value="">- Chọn Mức -</option>
                                    <option value="Tốt">Tốt (Mức 3)</option>
                                    <option value="Khá">Khá (Mức 2)</option>
                                    <option value="Đạt">Đạt (Mức 1)</option>
                                    <option value="Không Đạt">Không Đạt</option>
                                  </select>

                                  <div className="space-y-1">
                                    <textarea
                                      value={rowData.notes || ""}
                                      placeholder={isVpRole ? "Giải trình thực trạng điểm trường (Tối thiểu 30 ký tự)..." : "Chưa có giải trình."}
                                      onChange={(e) => handleNotesChange(ind.id, e.target.value)}
                                      disabled={!isVpRole || evaluationData?.status === "APPROVED"}
                                      rows={2}
                                      className={`w-full text-xs border rounded-lg p-2 ${
                                        (rowData.notes || "").trim().length >= 30
                                          ? "border-emerald-300 bg-emerald-50/20"
                                          : "border-slate-300 bg-white"
                                      } disabled:bg-slate-50`}
                                    />
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className={(rowData.notes || "").trim().length >= 30 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                                        {(rowData.notes || "").trim().length}/30 ký tự
                                      </span>
                                      {(rowData.notes || "").trim().length < 30 && (
                                        <span className="text-amber-600 font-medium">Cần ≥ 30 ký tự</span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Evidence Files Column */}
                                <td className="p-3 border-r align-top space-y-2">
                                  <div className="flex gap-2 text-xs flex-wrap">
                                    {(rowData.evidenceObj || []).map((file: any, fIdx: number) => (
                                      <a
                                        key={file.id || fIdx}
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 px-2 py-1 rounded font-medium transition-colors"
                                      >
                                        📎 <span className="max-w-[140px] truncate">{file.fileName}</span>
                                        <span className="text-[10px] text-emerald-700">[{ind.code}-{fIdx + 1}]</span>
                                      </a>
                                    ))}
                                    {(!rowData.evidenceObj || rowData.evidenceObj.length === 0) && (
                                      <span className="text-xs text-rose-500 italic">⚠️ Chưa có file minh chứng</span>
                                    )}
                                  </div>

                                  {isVpRole && evaluationData?.status !== "APPROVED" && (
                                    <button
                                      onClick={() => handleRealUpload(ind.id)}
                                      disabled={submitting}
                                      className="text-xs bg-white hover:bg-slate-100 border border-dashed border-indigo-400 text-indigo-700 px-2.5 py-1 rounded-md font-semibold transition-colors disabled:opacity-50"
                                    >
                                      + Tải Tệp Minh Chứng
                                    </button>
                                  )}
                                </td>

                                {/* Principal Column */}
                                <td className="p-3 bg-blue-50/30 align-top space-y-2">
                                  <textarea
                                    value={rowData.principalComment || ""}
                                    placeholder={isAdminRole ? "Nhập nhận xét / chỉ đạo của Hiệu trưởng..." : "Chưa có nhận xét của HT."}
                                    onChange={(e) => handlePrincipalReviewChange(ind.id, "principalComment", e.target.value)}
                                    disabled={!isAdminRole || evaluationData?.status === "APPROVED"}
                                    rows={2}
                                    className="w-full text-xs border border-slate-300 rounded-lg p-2 disabled:bg-slate-50"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      )}

      </div>

      {/* ==================== OFFICIAL PRINTABLE REPORT TEMPLATE (TT15/2026/TT-BGDĐT) ==================== */}
      {selectedPoint && (
        <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto space-y-6 text-sm font-serif leading-relaxed">
          {/* National Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4">
            <div className="text-center font-bold">
              <p className="text-xs uppercase">{currentCamp?.name || "TRƯỜNG PHỔ THÔNG NHIỀU CẤP HỌC"}</p>
              <p className="text-xs uppercase text-slate-800">ĐIỂM TRƯỜNG: {currentPointObj?.name || "TẤT CẢ"}</p>
              <p className="text-[10px] italic font-normal text-slate-600 mt-1">Số: ...... /BC-ĐGTT15</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold text-xs">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[10px] italic text-slate-600 mt-1">......., ngày .... tháng .... năm 202...</p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wide">BÁO CÁO TỰ ĐÁNH GIÁ VÀ THẨM ĐỊNH CHẤT LƯỢNG ĐIỂM TRƯỜNG</h1>
            <p className="text-xs italic font-medium text-slate-700">
              (Căn cứ Thông tư số 15/2026/TT-BGDĐT ngày 10/5/2026 của Bộ trưởng Bộ GD&ĐT ban hành Điều lệ trường phổ thông nhiều cấp học)
            </p>
            <p className="text-xs font-semibold">Năm học / Kỳ đánh giá: {defaultYear}</p>
          </div>

          {/* Part 1: Summary of Assessment */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase border-b border-black pb-1">I. KẾT QUẢ ĐÁNH GIÁ ĐỊNH LƯỢNG</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p>• <strong>Điểm trường:</strong> {currentPointObj?.name || "N/A"}</p>
                <p>• <strong>Phân hiệu trực thuộc:</strong> {currentCamp?.name || "N/A"}</p>
                <p>• <strong>Tổng số tiêu chí quy định:</strong> {currentRankInfo.stats.total} tiêu chí (5 Tiêu chuẩn)</p>
              </div>
              <div>
                <p>• <strong>Kết quả xếp loại TT15:</strong> <span className="font-bold uppercase underline">{currentRankInfo.rank}</span></p>
                <p>• <strong>Trạng thái hồ sơ:</strong> {evaluationData?.status === "APPROVED" ? "Đã được Hiệu trưởng phê duyệt" : "Bản lưu hành nội bộ"}</p>
                <p>• <strong>Cơ cấu mức đạt:</strong> Mức 3 (Tốt): {currentRankInfo.stats.tot} | Mức 2 (Khá): {currentRankInfo.stats.kha} | Mức 1 (Đạt): {currentRankInfo.stats.dat} | Chưa Đạt: {currentRankInfo.stats.chuaDat}</p>
              </div>
            </div>
          </div>

          {/* Part 2: Detailed Criteria Matrix */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase border-b border-black pb-1">II. BẢNG CHI TIẾT 5 TIÊU CHUẨN VÀ 17 TIÊU CHÍ TT15</h2>
            <table className="w-full text-left border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1.5 text-center w-12 font-bold">Mã</th>
                  <th className="border border-black p-1.5 font-bold">Nội dung Tiêu chí</th>
                  <th className="border border-black p-1.5 font-bold text-center w-24">Tự Đánh Giá (Phó HT)</th>
                  <th className="border border-black p-1.5 font-bold w-40">Minh chứng đính kèm</th>
                  <th className="border border-black p-1.5 font-bold w-44">Ý kiến Thẩm định (Hiệu trưởng)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedIndicators).map((stdKey) => (
                  <React.Fragment key={stdKey}>
                    <tr className="bg-slate-200/80 font-bold">
                      <td colSpan={5} className="border border-black p-1.5">
                        {STANDARD_TITLES[stdKey] || stdKey}
                      </td>
                    </tr>
                    {groupedIndicators[stdKey].map((ind: any) => {
                      const rowData = formData[ind.id] || {};
                      return (
                        <tr key={ind.id}>
                          <td className="border border-black p-1.5 text-center font-semibold">{ind.code}</td>
                          <td className="border border-black p-1.5">{ind.name}</td>
                          <td className="border border-black p-1.5 text-center font-bold">
                            {rowData.assessment || "Chưa đạt"}
                          </td>
                          <td className="border border-black p-1.5 text-[10px]">
                            {(rowData.evidenceObj && rowData.evidenceObj.length > 0) ? (
                              <ul className="list-disc pl-3">
                                {rowData.evidenceObj.map((f: any, idx: number) => (
                                  <li key={idx} className="truncate">{f.fileName}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="italic text-slate-500">Chưa có</span>
                            )}
                          </td>
                          <td className="border border-black p-1.5 text-[11px] italic">
                            {rowData.principalComment || "Đồng thuận"}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part 3: Principal Notes & Conclusion */}
          {evaluationData?.notes && (
            <div className="space-y-1 text-xs border border-black p-3 rounded">
              <p className="font-bold uppercase">III. KẾT LUẬN & Ý KIẾN CHỈ ĐẠO CỦA HIỆU TRƯỞNG:</p>
              <p className="italic">{evaluationData.notes}</p>
            </div>
          )}

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 text-center pt-8 text-xs">
            <div className="space-y-16">
              <div>
                <p className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</p>
                <p className="text-[10px] italic">(Phó Hiệu trưởng phụ trách điểm trường)</p>
              </div>
              <p className="font-bold italic">(Ký và ghi rõ họ tên)</p>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-bold uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</p>
                <p className="text-[10px] italic">(Thẩm định, ký duyệt và đóng dấu)</p>
              </div>
              <p className="font-bold italic">(Ký, đóng dấu và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
