"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-emerald-950/90 border-emerald-500/40 text-emerald-100",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />,
      badge: "badge-glowing-emerald",
    },
    error: {
      bg: "bg-rose-950/90 border-rose-500/40 text-rose-100",
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />,
      badge: "badge-glowing-rose",
    },
    info: {
      bg: "bg-indigo-950/90 border-indigo-500/40 text-indigo-100",
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />,
      badge: "badge-glowing-indigo",
    },
  };

  const currentStyle = styles[type];

  return (
    <div className={`fixed top-5 right-5 z-50 backdrop-blur-xl ${currentStyle.bg} border px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in transition-all duration-300 hover:scale-102`}>
      {currentStyle.icon}
      <span className="text-sm font-semibold tracking-wide">{message}</span>
      <button
        onClick={onClose}
        className="ml-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors active-press cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Hook for toast
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  }, []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
