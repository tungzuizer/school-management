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

  const presetQueries = userRole === "STUDENT"
    ? [
        "💡 Phương pháp ôn thi hiệu quả và nhớ lâu?",
        "🎯 Cách quản lý thời gian học tập cân bằng?",
        "⭐ Làm sao để giữ động lực học tập tốt hơn?",
      ]
    : [
        "🌟 Gợi ý cách tuyên dương động viên học sinh?",
        "📖 Phương pháp quản lý lớp học tích cực?",
        "⚡ Mẹo soạn giáo án nhanh và sáng tạo?",
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
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
            <Bot className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="text-xs font-extrabold tracking-wide hidden sm:inline-block pr-1">
            Trợ lý AI Smart 💬
          </span>
        </button>
      )}

      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] md:w-[420px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-yellow-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  Trợ Lý AI Giáo Dục
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                </h3>
                <p className="text-[11px] text-blue-100/90 font-medium">Sẵn sàng hỗ trợ 24/7</p>
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
                className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-xl transition cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-full whitespace-nowrap transition shadow-2xs shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`text-[10px] block mt-1 ${
                      msg.sender === "user" ? "text-blue-100 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs italic py-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập thắc mắc hoặc yêu cầu..."
              className="flex-1 px-3.5 py-2 bg-slate-100 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
