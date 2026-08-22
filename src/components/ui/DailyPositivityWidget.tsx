"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, Heart } from "lucide-react";

const QUOTES_TEACHER = [
  { text: "Mỗi bài giảng hôm nay là một hạt mầm cho tương lai mai sau.", author: "Thông điệp sư phạm" },
  { text: "Sự kiên nhẫn và tận tụy của thầy cô thay đổi từng cuộc đời nhỏ.", author: "Tri thức kiến tạo" },
  { text: "Hãy mỉm cười trước khi bước vào lớp, năng lượng tích cực sẽ lan tỏa rực rỡ!", author: "Cảm hứng học đường" },
  { text: "Người thầy giỏi không chỉ dạy học, người thầy tuyệt vời chạm đến tâm hồn.", author: "William Arthur Ward" },
  { text: "Hôm nay là một ngày tuyệt vời để khám phá góc nhìn mới cùng học sinh!", author: "Sáng tạo giảng dạy" }
];

const QUOTES_STUDENT = [
  { text: "Hành trình vạn dặm bắt đầu từ một tiết học tập trung hôm nay!", author: "Động lực học tập" },
  { text: "Mỗi câu hỏi hỏi lớp là một bước tiến gần hơn tới ước mơ của bạn.", author: "Chăm chỉ mỗi ngày" },
  { text: "Không có sai lầm nào là vô ích, đó chỉ là bài học giúp bạn thông minh hơn!", author: "Tự tin vươn lên" },
  { text: "Học tập không phải là lấp đầy một hũ rỗng, mà là thắp sáng một ngọn lửa.", author: "Socrates" },
  { text: "Hãy tự hào về sự tiến bộ nhỏ bé của bạn từng ngày!", author: "Lời khuyên yêu thương" }
];

type Props = {
  role?: "teacher" | "student";
  className?: string;
};

export function DailyPositivityWidget({ role = "student", className = "" }: Props) {
  const quotes = role === "teacher" ? QUOTES_TEACHER : QUOTES_STUDENT;
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const nextQuote = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
      setIsSpinning(false);
    }, 200);
  };

  const toggleLike = () => {
    if (isLiked) {
      setLikes((l) => l - 1);
      setIsLiked(false);
    } else {
      setLikes((l) => l + 1);
      setIsLiked(true);
    }
  };

  const current = quotes[currentIndex];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-200/60 p-4 md:p-5 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {role === "teacher" ? "Cảm hứng giảng dạy" : "Góc động lực mỗi ngày"}
          </span>
        </div>
        <button
          onClick={nextQuote}
          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-white/80 transition"
          title="Đổi câu truyền cảm hứng"
        >
          <RefreshCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
        </button>
      </div>

      <p className="text-gray-800 font-medium text-sm md:text-base italic leading-relaxed my-2">
        "{current.text}"
      </p>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50 text-xs">
        <span className="text-gray-500 font-semibold">— {current.author}</span>
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
            isLiked ? "bg-rose-100 text-rose-600 scale-105" : "bg-white/80 text-gray-600 hover:bg-rose-50 hover:text-rose-500"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
}
