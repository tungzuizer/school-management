import { useEffect, useState } from "react";

export function useEasyMode() {
  const [isEasyMode, setIsEasyMode] = useState(false);

  useEffect(() => {
    // Check initial state from localStorage (only in browser)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("easy-mode") === "true";
      setIsEasyMode(saved);
      if (saved) {
        document.documentElement.classList.add("easy-mode");
      } else {
        document.documentElement.classList.remove("easy-mode");
      }
    }

    const handleClassChange = () => {
      if (typeof window !== "undefined") {
        const current = localStorage.getItem("easy-mode") === "true";
        setIsEasyMode(current);
      }
    };

    window.addEventListener("easy-mode-change", handleClassChange);
    return () => {
      window.removeEventListener("easy-mode-change", handleClassChange);
    };
  }, []);

  const toggleEasyMode = () => {
    const newVal = !isEasyMode;
    if (typeof window !== "undefined") {
      localStorage.setItem("easy-mode", String(newVal));
      if (newVal) {
        document.documentElement.classList.add("easy-mode");
      } else {
        document.documentElement.classList.remove("easy-mode");
      }
      setIsEasyMode(newVal);
      window.dispatchEvent(new Event("easy-mode-change"));
    }
  };

  return { isEasyMode, toggleEasyMode };
}
