"use client";

import React, { useState, useEffect } from "react";
import { X, Award, Star, Trophy, Heart, Zap, Palette, Send, CheckCircle2 } from "lucide-react";
import { ConfettiEffect } from "./ConfettiEffect";
import { getTeacherClassesAndStudents, createStudentCommendation } from "@/app/teacher/commendations/actions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teacherUserId: string;
  onSuccess?: () => void;
};

const PRAISE_BADGES = [
  {
    category: "Thành tích học tập",
    title: "Thành tích xuất sắc 🌟",
    icon: Star,
  },
  {
    category: "Tiến bộ",
    title: "Tiến bộ vượt bậc 🥇",
    icon: Trophy,
  },
  {
    category: "Đạo đức & Tử tế",
    title: "Hành động tử tế & Giúp đỡ 🤝",
    icon: Heart,
  },
  {
    category: "Giải thưởng",
    title: "Giải thưởng & Cuộc thi 🏆",
    icon: Award,
  },
  {
    category: "Chuyên cần",
    title: "Chuyên cần & Đúng giờ 100% ⚡",
    icon: Zap,
  },
  {
    category: "Sáng tạo",
    title: "Sáng tạo & Đóng góp 🎨",
    icon: Palette,
  },
];

export function StudentPraiseModal({ isOpen, onClose, teacherUserId, onSuccess }: Props) {
  const [classes, setClasses] = useState<{ id: string; name: string; students: { id: string; name: string; studentCode: string | null }[] }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedBadge, setSelectedBadge] = useState(PRAISE_BADGES[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && teacherUserId) {
      getTeacherClassesAndStudents(teacherUserId).then((res) => {
        setClasses(res.classes);
        if (res.classes.length > 0) {
          setSelectedClassId(res.classes[0].id);
          if (res.classes[0].students.length > 0) {
            setSelectedStudentId(res.classes[0].students[0].id);
          }
        }
      });
    }
  }, [isOpen, teacherUserId]);

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !description.trim()) return;

    setLoading(true);
    const res = await createStudentCommendation({
      teacherUserId,
      studentId: selectedStudentId,
      category: selectedBadge.category,
      badgeTitle: selectedBadge.title,
      description: description.trim(),
    });

    setLoading(false);
    if (res.success) {
      setShowConfetti(true);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setDescription("");
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div role="dialog" aria-modal="true" aria-label="Tuyên dương và khen thưởng học sinh" className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-yellow-300 backdrop-blur-md">
              <Award className="w-6 h-6 fill-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg flex items-center gap-1.5">
                Tuyên Dương & Khen Thưởng Học Sinh 🎉
              </h3>
              <p className="text-xs text-orange-100 font-medium">Tuyên dương những nỗ lực rạng rỡ của các em học sinh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ tuyên dương" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/20 text-white transition cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto hide-scrollbar">
          {successMsg ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Tuyên Dương Thành Công! 🎉</h4>
              <p className="text-sm text-slate-500">Lời khen đã được gửi trực tiếp tới học sinh và lưu vào sổ tuyên dương trường.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chọn Lớp Học
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      const cls = classes.find((c) => c.id === e.target.value);
                      if (cls && cls.students.length > 0) {
                        setSelectedStudentId(cls.students[0].id);
                      } else {
                        setSelectedStudentId("");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chọn Học Sinh
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {currentClass?.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.studentCode ? `(${s.studentCode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Danh Hiệu / Huy Hiệu Khen Thưởng 🎖️
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRAISE_BADGES.map((b, idx) => {
                    const IconComponent = b.icon;
                    const isSelected = selectedBadge.title === b.title;
                    return (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setSelectedBadge(b)}
                        className={`p-3 min-h-[52px] rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-400 bg-amber-50/50 shadow-xs scale-102"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr flex items-center justify-center mb-2 shadow-xs text-slate-700 font-bold">
                          <IconComponent className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 leading-tight">
                          {b.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội dung tuyên dương & Lời nhắn nhủ ✨
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Em đã luôn chủ động giúp đỡ các bạn trong giờ thực hành Toán và đạt điểm 10 rực rỡ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center justify-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedStudentId || !description.trim()}
                  className="px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {loading ? "Đang gửi..." : "Gửi Tuyên Dương 🎉"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}