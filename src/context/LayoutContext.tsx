/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Root Layouts across Next.js app (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/ward/layout.tsx`, `src/app/department/layout.tsx`, `src/app/student/layout.tsx`, `src/components/layout/Header.tsx`).
 * 2. Affected APIs: `LayoutProvider`, `useSidebar`, `LayoutContextType`.
 * 3. Schema: `LayoutContextType` with `isCollapsed` (boolean), `isMobileOpen` (boolean), `toggleCollapsed` (fn), `setCollapsed` (fn), `toggleMobile` (fn), `setMobileOpen` (fn), `closeMobile` (fn).
 * 4. Verbatim User Instruction: "tôi muố menu có thể thu gọn và tách menu và giao diện chính độc lập giao diện khác nhau".
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface LayoutContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = "sms_sidebar_collapsed";

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpenState] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Sync state safely with localStorage after client hydration
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setIsCollapsedState(stored === "true");
      }
    } catch {
      // Ignore storage access errors (private mode, SSR)
    }
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage access errors
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpenState((prev) => !prev);
  }, []);

  const setMobileOpen = useCallback((open: boolean) => {
    setIsMobileOpenState(open);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpenState(false);
  }, []);

  // Keyboard shortcut listener: Ctrl + B or Cmd + B to toggle desktop sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCollapsed]);

  return (
    <LayoutContext.Provider
      value={{
        isCollapsed: isMounted ? isCollapsed : false,
        isMobileOpen,
        toggleCollapsed,
        setCollapsed,
        toggleMobile,
        setMobileOpen,
        closeMobile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useSidebar must be used within a LayoutProvider");
  }
  return context;
}
