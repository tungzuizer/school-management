"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Sparkles, X, Send, RefreshCw, Loader2, Minimize2 } from "lucide-react";
import { askGeneralAI } from "@/lib/ai-actions";

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
};

type Props = {
  userRole?: "TEACHER" | "STUDENT" | "ADMIN" | "VICE_PRINCIPAL";
};

export function FloatingAIChatWidget({ userRole = "TEACHER" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: userRole === "STUDENT"
        ? "Xin chào bạn! Mình là Trợ lý Học tập AI 🌟. Bạn cần hỗ trợ mẹo học tập, ôn thi hay thắc mắc bài học nào hôm nay?"
        : "Xin chào Thầy/Cô! Tôi là Trợ lý AI Giáo dục 📚. Thầy/Cô cần hỗ trợ phương pháp giảng dạy, quản lý học sinh hay tư vấn chuyên môn gì ạ?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (isDismissed) return null;

  const presetQueries = userRole === "STUDENT"
    ? [
        "💡 Phương pháp ôn thi hiệu quả?",
        "🎯 Quản lý thời gian học tập?",
        "⭐ Giữ động lực học tập tốt?",
      ]
    : [
        "🌟 Cách tuyên dương học sinh?",
        "📖 Quản lý lớp học tích cực?",
        "⚡ Soạn giáo án nhanh & sáng tạo?",
      ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await askGeneralAI(query, userRole);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.success ? res.text : `⚠️ ${res.error || "Đã xảy ra lỗi kết nối AI."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Không thể kết nối với Trợ lý AI. Vui lòng thử lại sau.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-3.5 lg:bottom-6 lg:right-6 z-40">
      {/* Compact Trigger Button */}
      {!isOpen && (
        <div className="relative flex items-center gap-1 group">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 p-2.5 lg:px-4 lg:py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Mở Trợ lý AI Smart 💬"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
            </div>
            <span className="text-xs font-extrabold tracking-wide hidden lg:inline-block pr-0.5">
              Trợ lý AI 💬
            </span>
          </button>

          {/* Quick Dismiss Button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="w-5 h-5 rounded-full bg-slate-200/90 text-slate-500 hover:bg-slate-300 hover:text-slate-800 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
            title="Ẩn bong bóng AI"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Expanded Modal Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[360px] md:w-[400px] h-[480px] sm:h-[500px] bg-white/95 rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-modal-pop backdrop-blur-xl">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-4 h-4 text-yellow-300" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm flex items-center gap-1">
                  Trợ Lý AI Giáo Dục
                  <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                </h3>
                <p className="text-[10px] text-blue-100/90 font-medium">Đồng hành học tập 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: "init",
                      sender: "ai",
                      text: "Đã làm mới cuộc trò chuyện. Mình có thể giúp gì thêm cho bạn?",
                      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                title="Làm mới trò chuyện"
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer active-press"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer active-press"
                title="Thu nhỏ"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDismissed(true);
                }}
                className="p-1.5 hover:bg-rose-500/20 text-rose-200 hover:text-white rounded-xl transition-colors cursor-pointer active-press"
                title="Đóng hoàn toàn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[10px] sm:text-[11px] font-semibold rounded-full whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 animate-slide-up ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`text-[9px] block mt-1 ${
                      msg.sender === "user" ? "text-blue-100 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic py-1 animate-pulse">
                <div className="w-5 h-5 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
                <span>Trợ lý AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập thắc mắc hoặc yêu cầu..."
              className="flex-1 px-3 py-1.5 bg-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-all shadow-xs cursor-pointer active-press shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
