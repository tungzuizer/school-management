"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileText,
  History,
  Building2,
  TrendingUp,
  BookmarkPlus,
  BrainCircuit,
  ArrowRight,
  Scale,
  RefreshCw,
  MapPin,
  Navigation,
  Loader2,
} from "lucide-react";
import {
  askPrincipalAI,
  saveDecision,
  getDecisionLogs,
  getSchoolPointsContext,
} from "./actions";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  recommendation?: {
    summary: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    options: Array<{
      title: string;
      pros: string[];
      cons: string[];
      score: number;
    }>;
    policyNote?: string;
    actionSteps: string[];
  };
}

interface SavedDecision {
  id: string;
  query: string;
  aiRecommendation: string;
  decisionTaken: string;
  createdAt: string;
}

interface SchoolPointInfo {
  name: string;
  distanceKm: number;
  studentsCount: number;
  teacherCount: number;
  campusName: string;
}

export default function PrincipalAIPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [inputQuery, setInputQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào Thầy/Cô Hiệu trưởng! Tôi là Trợ lý AI Tư vấn Ra Quyết định Ban Giám hiệu Đa Điểm Trường. Thầy/Cô cần tham vấn phương án chỉ đạo nào hôm nay?",
      timestamp: "08:00",
    },
  ]);

  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [schoolPoints, setSchoolPoints] = useState<SchoolPointInfo[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(true);

  // Fetch decision logs on mount
  const fetchDecisions = useCallback(async () => {
    try {
      setLoadingDecisions(true);
      const data = await getDecisionLogs();
      setSavedDecisions(data);
    } catch {
      console.error("Lỗi khi tải nhật ký quyết định");
    } finally {
      setLoadingDecisions(false);
    }
  }, []);

  // Fetch school points context on mount
  const fetchSchoolPoints = useCallback(async () => {
    try {
      setLoadingPoints(true);
      const data = await getSchoolPointsContext();
      setSchoolPoints(data);
    } catch {
      console.error("Lỗi khi tải dữ liệu điểm trường");
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
    fetchSchoolPoints();
  }, [fetchDecisions, fetchSchoolPoints]);

  const presetQueries = [
    "Điều chuyển giáo viên Tiếng Anh từ Điểm Trung Tâm lên điểm trường xa nhất",
    "Phương án xử lý rủi ro học sinh nguy cơ bỏ học nhiều ngày liên tiếp",
    "Phân bổ ngân sách đầu tư phòng máy di động cho các điểm trường",
    "Kế hoạch đảm bảo an toàn giao thông & phòng chống thiên tai cho điểm trường vùng cao",
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isAnalyzing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsAnalyzing(true);

    try {
      const result = await askPrincipalAI(query);

      if (result.success && result.data) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: result.data.text || result.data.recommendation?.summary || "Đã phân tích xong.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          recommendation: result.data.recommendation,
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `⚠️ Không thể phân tích yêu cầu: ${result.error || "Lỗi không xác định"}. Vui lòng thử lại.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "⚠️ Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDecision = async (msg: Message) => {
    if (!msg.recommendation) return;

    try {
      const result = await saveDecision({
        query: msg.text,
        aiRecommendation: msg.recommendation.summary,
        decisionTaken: msg.recommendation.options
          .sort((a, b) => b.score - a.score)[0]?.title || "Đang xem xét",
      });

      if (result.success && result.data) {
        setSavedDecisions((prev) => [result.data!, ...prev]);
        alert("✅ Đã lưu quyết định vào Nhật ký chỉ đạo thành công!");
      } else {
        alert(`❌ Lỗi khi lưu: ${result.error}`);
      }
    } catch {
      alert("❌ Đã xảy ra lỗi khi lưu quyết định.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <Bot className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Trợ Lý AI Tư Vấn Ra Quyết Định Hiệu Trưởng</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {schoolPoints.length > 0 ? `${schoolPoints.length} Điểm Trường` : "Đa Điểm Trường"}
                </span>
              </div>
              <p className="text-blue-100/80 text-sm mt-1">
                Hệ thống tham vấn đa phương án cho Hiệu trưởng: Phân tích dữ liệu thực tế, khoảng cách địa lý, pháp lý và tối ưu nguồn lực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/10 backdrop-blur-md shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "chat"
                  ? "bg-white text-blue-900 shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Tham vấn Trực tiếp
              </span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-white text-blue-900 shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Nhật ký Quyết định ({savedDecisions.length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main Content ===== */}
      {activeTab === "chat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Preset Prompts Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-gray-800 font-semibold">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2>Gợi ý tình huống quản lý điểm lẻ</h2>
              </div>
              <p className="text-xs text-gray-500">
                Chọn tình huống mẫu để AI phân tích dữ liệu thực tế từ hệ thống:
              </p>
              <div className="space-y-2">
                {presetQueries.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(query)}
                    disabled={isAnalyzing}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition group"
                  >
                    <p className="text-xs font-medium text-gray-700 group-hover:text-blue-900 line-clamp-3">
                      {query}
                    </p>
                    <div className="flex items-center justify-end mt-2 text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                      Gửi tham vấn <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Satellite school points context badge - REAL DATA */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <Building2 className="w-4 h-4 text-blue-600" />
                Tọa độ & Sĩ số các điểm trường
              </div>
              {loadingPoints ? (
                <div className="flex items-center gap-2 text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : schoolPoints.length > 0 ? (
                <ul className="space-y-1 text-gray-600 list-disc list-inside">
                  {schoolPoints.map((sp, idx) => (
                    <li key={idx}>
                      {sp.name} ({sp.distanceKm}km): {sp.studentsCount} HS
                      {sp.teacherCount > 0 ? ` - ${sp.teacherCount} GV` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Chưa có dữ liệu điểm trường.</p>
              )}
            </div>
          </div>

          {/* Chat Stream & Output Area */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[700px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">
                  AI Decision Engine - Dữ liệu thời gian thực
                </span>
              </div>
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "1",
                      sender: "ai",
                      text: "Xin chào Thầy/Cô Hiệu trưởng! Tôi là Trợ lý AI Tư vấn Ra Quyết định Ban Giám hiệu Đa Điểm Trường.",
                      timestamp: "08:00",
                    },
                  ])
                }
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới phiên
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-6 h-6" />
                    </div>
                  )}

                  <div className={`max-w-3xl space-y-4 ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    {/* User Text / AI Intro text */}
                    <div
                      className={`p-4 rounded-2xl text-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-sm"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span
                        className={`text-[10px] block mt-1 ${
                          msg.sender === "user" ? "text-blue-100 text-right" : "text-gray-400"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* AI Structured Recommendation Card */}
                    {msg.recommendation && (msg.recommendation.options.length > 0 || msg.recommendation.actionSteps.length > 0) && (
                      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-lg space-y-5">
                        {/* Summary & Risk Badge */}
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-amber-500" />
                              <h3 className="font-bold text-gray-900 text-base">Tóm tắt khuyến nghị tối ưu</h3>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                              {msg.recommendation.summary}
                            </p>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 ${
                              msg.recommendation.riskLevel === "HIGH"
                                ? "bg-red-100 text-red-700"
                                : msg.recommendation.riskLevel === "MEDIUM"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                            Mức rủi ro: {msg.recommendation.riskLevel}
                          </div>
                        </div>

                        {/* Options Comparison */}
                        {msg.recommendation.options && msg.recommendation.options.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Scale className="w-4 h-4 text-blue-600" /> So sánh các phương án chỉ đạo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {msg.recommendation.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`p-4 rounded-xl border ${
                                  opt.score >= 90
                                    ? "border-emerald-200 bg-emerald-50/40"
                                    : "border-gray-200 bg-gray-50/50"
                                } space-y-3`}
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-sm text-gray-800">{opt.title}</h5>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                                    Đánh giá: {opt.score}/100
                                  </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div>
                                    <p className="font-semibold text-emerald-700 mb-1">Ưu điểm:</p>
                                    <ul className="space-y-1">
                                      {opt.pros.map((p, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5 text-gray-700">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                          {p}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <p className="font-semibold text-red-600 mb-1">Nhược điểm / Thách thức:</p>
                                    <ul className="space-y-1">
                                      {opt.cons.map((c, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5 text-gray-700">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                          {c}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        )}

                        {/* Legal & Policy Note */}
                        {msg.recommendation.policyNote && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-900">Cơ sở pháp lý & Quy chế: </span>
                              {msg.recommendation.policyNote}
                            </div>
                          </div>
                        )}

                        {/* Action Steps & Save Button */}
                        <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-700">Các bước triển khai khuyến nghị:</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.recommendation.actionSteps.map((step, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                                >
                                  {sIdx + 1}. {step}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handleSaveDecision(msg)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition"
                          >
                            <BookmarkPlus className="w-4 h-4" />
                            Phê duyệt & Lưu vào Nhật ký
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white shrink-0 font-bold text-sm">
                      HT
                    </div>
                  )}
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex items-center gap-3 text-gray-500 text-sm italic">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span>AI đang phân tích dữ liệu thực tế từ hệ thống & tổng hợp khuyến nghị...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Nhập vấn đề quản lý, tranh chấp hoặc phương án điều hành điểm trường..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isAnalyzing}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                  Gửi tham vấn
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Saved Decision Logs Tab - REAL DATA */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Nhật ký Chỉ đạo & Quyết định Ban Giám hiệu</h2>
              <p className="text-xs text-gray-500 mt-1">
                Lịch sử các quyết định chỉ đạo được tham vấn từ Trợ lý AI.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              Tổng số: {savedDecisions.length} quyết định
            </span>
          </div>

          {loadingDecisions ? (
            <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Đang tải nhật ký quyết định...</span>
            </div>
          ) : savedDecisions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có quyết định nào được ghi nhận</p>
              <p className="text-xs mt-1">Hãy tham vấn AI và lưu quyết định để bắt đầu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition space-y-3 bg-gray-50/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg">
                        #{dec.id.substring(0, 8)}
                      </span>
                      <h3 className="font-bold text-gray-800 text-base line-clamp-1">
                        {dec.query.length > 80 ? dec.query.substring(0, 80) + "..." : dec.query}
                      </h3>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto bg-blue-100 text-blue-800">
                      Đã ghi nhận
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 font-medium">
                    <strong>Khuyến nghị AI:</strong> {dec.aiRecommendation}
                  </p>

                  {dec.decisionTaken && (
                    <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium">
                      <strong>Quyết định:</strong> {dec.decisionTaken}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                    <span>Ngày: <strong className="text-gray-600">{dec.createdAt}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
