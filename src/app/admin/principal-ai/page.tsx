/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router (`/admin/principal-ai`).
 * 2. Affected APIs: `src/app/admin/principal-ai/page.tsx`.
 * 3. Schemas: `Message`, `SavedDecision`, `SchoolPointInfo`, `AIGroundedResponse`.
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
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
  ShieldCheck,
  X,
} from "lucide-react";
import {
  askPrincipalAI,
  saveDecision,
  getDecisionLogs,
  getSchoolPointsContext,
} from "./actions";
import { GroundedResponseCard } from "@/components/ai/grounded-response-card";
import type { AIGroundedResponse } from "@/lib/ai/data-integrity";

// ─── BUG-03 FIX: Simple Markdown Renderer ───────────────────────────────────
function FormattedMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading lines (### ## #)
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={key++} className="font-bold text-gray-900 text-sm mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="font-bold text-gray-900 text-base mt-3 mb-1">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h2 key={key++} className="font-bold text-gray-900 text-lg mt-3 mb-1">
          {renderInline(line.slice(2))}
        </h2>
      );
    }
    // Numbered list items
    else if (/^\d+[\.\)]\s/.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-blue-600 font-semibold shrink-0">
            {line.match(/^\d+[\.\)]/)?.[0]}
          </span>
          <span>{renderInline(line.replace(/^\d+[\.\)]\s*/, ""))}</span>
        </div>
      );
    }
    // Bullet points (-, *, +)
    else if (/^[\-\*\+]\s/.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-emerald-600 mt-1.5 shrink-0">•</span>
          <span>{renderInline(line.replace(/^[\-\*\+]\s*/, ""))}</span>
        </div>
      );
    }
    // Indented sub-items
    else if (/^\s{2,}[\-\*\+]\s/.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-6 my-0.5">
          <span className="text-gray-400 mt-1.5 shrink-0">◦</span>
          <span>{renderInline(line.replace(/^\s+[\-\*\+]\s*/, ""))}</span>
        </div>
      );
    }
    // Empty line → spacer
    else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={key++} className="my-0.5 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="text-sm text-gray-800 space-y-0.5">{elements}</div>;
}

/** Render inline markdown: **bold**, *italic*, `code` */
function renderInline(text: string): React.ReactNode {
  // Process **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  // Use regex to split by **bold**, *italic*, and `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let inlineKey = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b${inlineKey++}`} className="font-bold text-gray-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`c${inlineKey++}`}
          className="px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`i${inlineKey++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

// ─── BUG-08 FIX: Toast Notification Component ───────────────────────────────
interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border backdrop-blur-md text-sm font-medium animate-slideInRight ${
            t.type === "success"
              ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
              : t.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-800"
              : "bg-blue-50/95 border-blue-200 text-blue-800"
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {t.type === "error" && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          {t.type === "info" && <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── BUG-09 FIX: Confirmation Modal ─────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition"
          >
            Xác nhận làm mới
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  grounded?: AIGroundedResponse;
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
  } | null;
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PrincipalAIPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [inputQuery, setInputQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào Thầy/Cô Hiệu trưởng! Tôi là Trợ lý AI Cố vấn Ban Giám hiệu & Thẩm định Nghị quyết 37/2026/NQ-CP. Thầy/Cô cần tham vấn phương án sắp xếp bộ máy BGH, bảo lưu phụ cấp NĐ 178, lộ trình chuẩn hóa nhân sự 36 tháng hay điều phối hoạt động nào hôm nay?",
      timestamp: "08:00",
    },
  ]);

  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [schoolPoints, setSchoolPoints] = useState<SchoolPointInfo[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(true);

  // BUG-08: Toast state
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // BUG-09: Modal state
  const [showResetModal, setShowResetModal] = useState(false);

  // Auto-scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast helpers
  const showToast = useCallback((message: string, type: ToastData["type"] = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

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

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  const presetQueries = [
    "⚖️ Phương án sắp xếp Phó Hiệu trưởng dôi dư và bảo lưu phụ cấp theo NQ 37/2026 và NĐ 178/2024",
    "🎓 Lộ trình bồi dưỡng chuẩn hóa 36 tháng (đến 05/08/2029) cho nhân sự hỗ trợ chưa đạt chuẩn",
    "🛡️ Thẩm định tính hợp pháp vị trí Y tế học đường và Kế toán toàn trường theo Điều 5 NQ 37",
    "📍 Điều chuyển giáo viên dạy liên phân hiệu tối ưu khoảng cách di chuyển giữa các cơ sở",
    "📈 Phương án xử lý nguy cơ học sinh vắng học & sa sút chuyên cần theo Thông tư 32/2020",
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
      // BUG-10: Build conversation history from existing messages
      const historyMessages = messages
        .filter((m) => m.id !== "1") // skip initial greeting
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

      const result = await askPrincipalAI(query, historyMessages);

      if (result.success && result.data) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: result.data.text || result.data.recommendation?.summary || "Đã phân tích xong.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          grounded: result.data.grounded,
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

  // BUG-02 FIX: handleSaveDecision now works for any AI message (with or without recommendation)
  const handleSaveDecision = async (msg: Message) => {
    try {
      const recSummary = msg.recommendation?.summary || msg.text;
      const decisionTitle =
        msg.recommendation?.options
          ?.sort((a, b) => b.score - a.score)?.[0]?.title || "Đang xem xét";

      const result = await saveDecision({
        query: messages.find(
          (m) => m.sender === "user" && parseInt(m.id) < parseInt(msg.id)
        )?.text || msg.text,
        aiRecommendation: recSummary,
        decisionTaken: decisionTitle,
      });

      if (result.success && result.data) {
        setSavedDecisions((prev) => [result.data!, ...prev]);
        showToast("Đã lưu quyết định vào Nhật ký chỉ đạo thành công!", "success");
      } else {
        showToast(`Lỗi khi lưu: ${result.error}`, "error");
      }
    } catch {
      showToast("Đã xảy ra lỗi khi lưu quyết định.", "error");
    }
  };

  // BUG-09 FIX: Reset session handler with confirmation
  const handleResetSession = () => {
    setShowResetModal(true);
  };

  const confirmResetSession = () => {
    setMessages([
      {
        id: "1",
        sender: "ai",
        text: "Xin chào Thầy/Cô Hiệu trưởng! Tôi là Trợ lý AI Tư vấn Ra Quyết định Ban Giám hiệu Đa Điểm Trường.",
        timestamp: "08:00",
      },
    ]);
    setShowResetModal(false);
    showToast("Đã làm mới phiên tham vấn.", "info");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notifications (BUG-08) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Modal (BUG-09) */}
      <ConfirmModal
        open={showResetModal}
        title="Xác nhận làm mới phiên"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử tham vấn hiện tại? Hành động này không thể hoàn tác. Các quyết định đã lưu vào Nhật ký sẽ không bị ảnh hưởng."
        onConfirm={confirmResetSession}
        onCancel={() => setShowResetModal(false)}
      />

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
          {/* Sidebar: School Points (BUG-05 FIX: moved UP) + Preset Prompts */}
          <div className="lg:col-span-1 space-y-4">
            {/* BUG-05 FIX: School Points Context — now at TOP of sidebar for easy visibility */}
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
                <ul className="space-y-1.5 text-gray-700">
                  {schoolPoints.map((sp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-blue-900">{sp.name}</strong> ({sp.distanceKm}km):{" "}
                        {sp.studentsCount} HS
                        {sp.teacherCount > 0 && (
                          <span className="text-emerald-700 font-semibold"> · {sp.teacherCount} GV</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Chưa có dữ liệu điểm trường.</p>
              )}
            </div>

            {/* Preset Prompts */}
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
          </div>

          {/* Chat Stream & Output Area */}
          {/* BUG-05 FIX: flex-1 with min-h to prevent dual scrollbars */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[650px] max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">
                  AI Decision Engine - Dữ liệu thời gian thực
                </span>
              </div>
              {/* BUG-09 FIX: onClick now opens confirmation modal */}
              <button
                onClick={handleResetSession}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới phiên
              </button>
            </div>

            {/* Message Area — single scrollable container */}
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
                    {msg.sender === "user" ? (
                      <div className="p-4 rounded-2xl text-sm bg-blue-600 text-white font-medium rounded-tr-none shadow-sm">
                        <p className="whitespace-pre-line">{msg.text}</p>
                        <span className="text-[10px] block mt-1 text-blue-100 text-right">
                          {msg.timestamp}
                        </span>
                      </div>
                    ) : msg.grounded ? (
                      <div className="space-y-3 w-full">
                        <GroundedResponseCard grounded={msg.grounded} />
                        <span className="text-[10px] block text-gray-400">
                          {msg.timestamp}
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl text-sm bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100">
                        {/* BUG-03 FIX: Use FormattedMarkdown instead of raw whitespace-pre-line */}
                        <FormattedMarkdown text={msg.text} />
                        <span className="text-[10px] block mt-1 text-gray-400">
                          {msg.timestamp}
                        </span>
                      </div>
                    )}

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

                    {/* BUG-02 FIX: Show save button on AI messages without structured recommendation */}
                    {msg.sender === "ai" && msg.id !== "1" && !msg.recommendation && (
                      <button
                        onClick={() => handleSaveDecision(msg)}
                        className="mt-1 px-3 py-1.5 text-xs text-emerald-700 hover:text-white border border-emerald-200 hover:bg-emerald-600 font-medium rounded-lg flex items-center gap-1.5 transition"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        Lưu vào Nhật ký chỉ đạo
                      </button>
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

              {/* Auto-scroll anchor */}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl shrink-0">
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

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
