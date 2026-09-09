/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Root Role Layouts (`src/app/admin/layout.tsx`, `src/app/teacher/layout.tsx`, `src/app/student/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/department/layout.tsx`, `src/app/ward/layout.tsx`).
 * 2. Uniqueness: Modern Luminous Crystal Glass Mobile Drawer with instant search filter, single-active collapsible accordion, touch swipe dismiss, and role-based optical themes (Sky, Emerald, Indigo).
 * 3. Schema: `MobileDrawerProps` (`isOpen`: boolean, `onClose`: () => void, `menuGroups`: MobileMenuGroup[], `role`?: string, `userName`?: string, `userEmail`?: string).
 * 4. Verbatim User Instruction: "cải thiện giao diện của điện thoại cả adroi và iphone vần giao diện menu phải hiện đại mượt mà" and "tôi muốn màu nó như phần đăng nhập và mỗi tài khoản sẽ 1 sắc thái khác nhua hiệu trưởng giáo viên học sinh".
 */

"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { handleClientSignOut } from "@/lib/client-auth";
import {
  X,
  Search,
  ChevronDown,
  LogOut,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import SystemAccountsModal from "@/components/admin/SystemAccountsModal";

export interface MobileMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface MobileMenuGroup {
  id: string;
  code?: string;
  title: string;
  tag?: string;
  items: MobileMenuItem[];
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuGroups: MobileMenuGroup[];
  role?: string;
  userName?: string;
  userEmail?: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Hiệu trưởng",
  SUPER_ADMIN: "Quản trị viên Hệ thống",
  DEPARTMENT_ADMIN: "Sở GD&ĐT",
  WARD_ADMIN: "Phòng GD&ĐT",
  VICE_PRINCIPAL: "Phó Hiệu trưởng",
  TEACHER: "Giáo viên",
  STUDENT: "Học sinh",
};

const roleDrawerThemes: Record<
  string,
  {
    drawerBg: string;
    headerBg: string;
    avatarBg: string;
    roleBadge: string;
    searchFocus: string;
    searchInputBg: string;
    activeLink: string;
    inactiveLink: string;
    accordionGroupBg: string;
    activeAccordionHeader: string;
    inactiveAccordionHeader: string;
    activeCodeBadge: string;
    inactiveCodeBadge: string;
    activeDot: string;
    activeChevron: string;
    activeSearchBadge: string;
    subItemBg: string;
    footerBg: string;
  }
> = {
  TEACHER: {
    drawerBg: "bg-gradient-to-b from-teal-100/95 via-emerald-50/90 to-teal-100/85 backdrop-blur-2xl text-emerald-950 border-r border-teal-200/90 shadow-2xl",
    headerBg: "bg-gradient-to-r from-teal-100/90 via-emerald-50/80 to-teal-100/70 border-b border-teal-200/80",
    avatarBg: "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white ring-2 ring-emerald-300/50 shadow-md shadow-emerald-500/30",
    roleBadge: "text-teal-800 bg-teal-200/80 border-teal-300/80 font-bold",
    searchFocus: "focus:border-emerald-500 focus:ring-emerald-500",
    searchInputBg: "bg-white/90 border-teal-200 text-emerald-950 placeholder-teal-700/60",
    activeLink: "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-1 ring-white/40",
    inactiveLink: "text-emerald-950 hover:bg-gradient-to-r hover:from-teal-200/80 hover:to-emerald-100/80 hover:text-emerald-950 font-semibold",
    accordionGroupBg: "rounded-2xl bg-gradient-to-r from-teal-100/70 via-emerald-50/60 to-cyan-50/60 border border-teal-300/60 shadow-xs shadow-teal-500/5",
    activeAccordionHeader: "bg-gradient-to-r from-teal-200/80 to-emerald-100/80 text-emerald-950 font-bold",
    inactiveAccordionHeader: "text-emerald-950 hover:bg-white/70",
    activeCodeBadge: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-teal-400/40 font-black",
    inactiveCodeBadge: "bg-teal-200 text-teal-800 font-black border border-teal-300",
    activeDot: "bg-emerald-500",
    activeChevron: "text-emerald-700",
    activeSearchBadge: "bg-teal-200/80 text-teal-800 border-teal-300/80",
    subItemBg: "bg-white/80 border-t border-teal-200/80",
    footerBg: "border-t border-teal-200/80 bg-gradient-to-r from-teal-100/90 via-emerald-100/70 to-teal-50/80",
  },
  STUDENT: {
    drawerBg: "bg-gradient-to-b from-blue-100/95 via-sky-50/90 to-indigo-100/85 backdrop-blur-2xl text-blue-950 border-r border-blue-200/90 shadow-2xl",
    headerBg: "bg-gradient-to-r from-blue-100/90 via-sky-50/70 to-indigo-100/60 border-b border-blue-200/80",
    avatarBg: "bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 text-white ring-2 ring-blue-300/50 shadow-md shadow-blue-500/30",
    roleBadge: "text-blue-800 bg-blue-200/80 border-blue-300/80 font-bold",
    searchFocus: "focus:border-blue-500 focus:ring-blue-500",
    searchInputBg: "bg-white/90 border-blue-200 text-blue-950 placeholder-blue-700/60",
    activeLink: "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-white/40",
    inactiveLink: "text-blue-950 hover:bg-gradient-to-r hover:from-blue-200/80 hover:to-sky-100/80 hover:text-blue-950 font-semibold",
    accordionGroupBg: "rounded-2xl bg-gradient-to-r from-blue-100/70 via-sky-50/60 to-cyan-50/60 border border-blue-300/60 shadow-xs shadow-blue-500/5",
    activeAccordionHeader: "bg-gradient-to-r from-blue-200/80 to-sky-100/80 text-blue-950 font-bold",
    inactiveAccordionHeader: "text-blue-950 hover:bg-white/70",
    activeCodeBadge: "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border border-blue-400/40 font-black",
    inactiveCodeBadge: "bg-blue-200 text-blue-800 font-black border border-blue-300",
    activeDot: "bg-blue-500",
    activeChevron: "text-blue-700",
    activeSearchBadge: "bg-blue-200/80 text-blue-800 border-blue-300/80",
    subItemBg: "bg-white/80 border-t border-blue-200/80",
    footerBg: "border-t border-blue-200/80 bg-gradient-to-r from-blue-100/90 via-sky-100/70 to-indigo-50/80",
  },
  DEFAULT: {
    drawerBg: "bg-gradient-to-b from-sky-100/95 via-sky-50/90 to-blue-100/85 backdrop-blur-2xl text-sky-950 border-r border-sky-200/90 shadow-2xl",
    headerBg: "bg-gradient-to-r from-sky-100/90 via-blue-50/80 to-cyan-100/70 border-b border-sky-200/80",
    avatarBg: "bg-gradient-to-br from-sky-500 via-blue-600 to-sky-700 text-white ring-2 ring-sky-300/50 shadow-md shadow-sky-500/30",
    roleBadge: "text-sky-800 bg-sky-200/80 border-sky-300/80 font-bold",
    searchFocus: "focus:border-sky-500 focus:ring-sky-500",
    searchInputBg: "bg-white/90 border-sky-200 text-sky-950 placeholder-sky-700/60",
    activeLink: "bg-gradient-to-r from-sky-500 via-blue-600 to-sky-700 text-white font-bold shadow-md shadow-sky-600/30 ring-1 ring-white/40",
    inactiveLink: "text-sky-950 hover:bg-gradient-to-r hover:from-sky-200/80 hover:to-blue-100/80 hover:text-sky-950 font-semibold",
    accordionGroupBg: "rounded-2xl bg-gradient-to-r from-sky-100/70 via-blue-50/60 to-cyan-50/60 border border-sky-300/60 shadow-xs shadow-sky-500/5",
    activeAccordionHeader: "bg-gradient-to-r from-sky-200/80 to-blue-100/80 text-sky-950 font-bold",
    inactiveAccordionHeader: "text-sky-950 hover:bg-white/70",
    activeCodeBadge: "bg-gradient-to-r from-sky-500 to-blue-600 text-white border border-sky-400/40 font-black",
    inactiveCodeBadge: "bg-sky-200 text-sky-800 font-black border border-sky-300",
    activeDot: "bg-sky-500",
    activeChevron: "text-sky-700",
    activeSearchBadge: "bg-sky-200/80 text-sky-800 border-sky-300/80",
    subItemBg: "bg-white/80 border-t border-sky-200/80",
    footerBg: "border-t border-sky-200/80 bg-gradient-to-r from-sky-100/90 via-blue-100/70 to-sky-50/80",
  },
};

export default function MobileDrawer({
  isOpen,
  onClose,
  menuGroups,
  role = "ADMIN",
  userName = "Người dùng",
  userEmail = "user@school.edu.vn",
}: MobileDrawerProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [systemAccountsModalOpen, setSystemAccountsModalOpen] = useState(false);

  const theme = roleDrawerThemes[role] || roleDrawerThemes.DEFAULT;

  // Swipe-to-close gesture handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Auto-expand group containing active route on mount / route change
  useEffect(() => {
    if (!isOpen) return;
    const matchedGroup = menuGroups.find((g) =>
      g.items.some((item) => pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/")))
    );
    if (matchedGroup) {
      setActiveAccordion(matchedGroup.id);
    } else if (menuGroups.length > 0) {
      setActiveAccordion(menuGroups[0].id);
    }
    setSearchQuery("");
  }, [isOpen, pathname, menuGroups]);

  // Lock body scroll when drawer is open
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

  // Filtered menu items for instant search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results: { groupTitle: string; item: MobileMenuItem }[] = [];

    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(query) ||
          group.title.toLowerCase().includes(query) ||
          (item.badge && item.badge.toLowerCase().includes(query))
        ) {
          results.push({ groupTitle: group.title, item });
        }
      });
    });

    return results;
  }, [searchQuery, menuGroups]);

  // Escape key handler for accessible dialog dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; // Synchronize start coordinate to avoid tap false-swipe
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 70) {
      // Swiped left > 70px -> close
      onClose();
    }
  };

  if (!isOpen && !changePasswordModalOpen && !systemAccountsModalOpen) return null;

  const displayRole = roleLabels[role] || role;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden select-none animate-fade-in" role="dialog" aria-modal="true" aria-label="Menu điều hướng di động">
          {/* Backdrop overlay */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* Drawer Panel (Luminous Multi-Tone Crystal Glass) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`fixed inset-y-0 left-0 w-[80vw] max-w-[300px] ${theme.drawerBg} flex flex-col z-50 overflow-hidden transform transition-transform duration-300 ease-out`}
          >
            {/* Header Bar */}
            <div className={`pt-[max(env(safe-area-inset-top),0.75rem)] px-3 pb-2.5 ${theme.headerBg} backdrop-blur-md flex items-center justify-between gap-2 shrink-0`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 shrink-0 ${theme.avatarBg}`}>
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-extrabold truncate leading-tight">{userName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate ${theme.roleBadge}`}>
                      {displayRole}
                    </span>
                    <span className="text-[9px] opacity-80 flex items-center gap-0.5 shrink-0 font-medium">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Online</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng menu"
                className="p-1.5 min-h-[34px] min-w-[34px] rounded-lg bg-white/70 hover:bg-white border border-white/60 transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="p-2.5 border-b border-black/5 bg-black/[0.02] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 opacity-50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh tính năng..."
                  className={`w-full pl-8 pr-7 py-1.5 ${theme.searchInputBg} rounded-xl text-[11px] focus:outline-hidden focus:ring-1 transition-all shadow-2xs ${theme.searchFocus}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 p-0.5"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 custom-scrollbar">
              {searchQuery.trim() !== "" ? (
                /* Search Results List */
                <div className="space-y-1">
                  <div className="px-1.5 py-0.5 text-[10px] font-bold opacity-70 uppercase tracking-wider flex items-center justify-between">
                    <span>Kết quả tìm kiếm ({searchResults.length})</span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="py-6 text-center opacity-60 text-[11px]">
                      Không tìm thấy mục nào khớp với &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    searchResults.map(({ groupTitle, item }) => {
                      const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
                      const Icon = item.icon;

                      return (
                        <Link
                          key={`${groupTitle}-${item.href}`}
                          href={item.href}
                          onClick={onClose}
                          prefetch={true}
                          className={`flex items-center justify-between p-2 rounded-xl text-[11px] transition-all ${
                            isActive
                              ? theme.activeLink
                              : "bg-white/70 hover:bg-white border border-white/60 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "opacity-70"}`} />
                            <div className="min-w-0 text-left">
                              <p className="truncate font-semibold">{item.label}</p>
                              <p className={`text-[9.5px] truncate ${isActive ? "text-white/80" : "opacity-60"}`}>{groupTitle}</p>
                            </div>
                          </div>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              isActive ? "bg-white/20 text-white" : theme.activeSearchBadge
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              ) : (
                /* Grouped Accordion List */
                menuGroups.map((group) => {
                  const isExpanded = activeAccordion === group.id;
                  const hasActiveChild = group.items.some((item) =>
                    pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"))
                  );

                  return (
                    <div
                      key={group.id}
                      className={`overflow-hidden transition-all duration-200 ${theme.accordionGroupBg}`}
                    >
                      {/* Accordion Group Header */}
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(isExpanded ? null : group.id)}
                        className={`w-full px-2.5 py-2 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          hasActiveChild ? theme.activeAccordionHeader : theme.inactiveAccordionHeader
                        }`}
                        aria-expanded={isExpanded}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {group.code ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] tracking-tight ${
                              hasActiveChild
                                ? theme.activeCodeBadge
                                : theme.inactiveCodeBadge
                            }`}>
                              {group.code}
                            </span>
                          ) : (
                            <span className={`w-1 h-1 rounded-full ${hasActiveChild ? theme.activeDot : "bg-black/30"}`} />
                          )}
                          <span className="text-[11px] font-bold truncate uppercase tracking-wider">
                            {group.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {group.tag && (
                            <span className={`hidden sm:inline-block text-[8.5px] font-bold px-1 py-0.5 rounded border ${theme.roleBadge}`}>
                              {group.tag}
                            </span>
                          )}
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? `rotate-180 ${theme.activeChevron}` : hasActiveChild ? theme.activeChevron : "opacity-50"
                            }`}
                          />
                        </div>
                      </button>

                      {/* Accordion Items Body */}
                      {isExpanded && (
                        <div className={`px-1.5 py-1 space-y-0.5 animate-fade-in ${theme.subItemBg}`}>
                          {group.items.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"));
                            const Icon = item.icon;

                            return (
                              <Link
                                key={`${group.id}-${item.href}`}
                                href={item.href}
                                onClick={onClose}
                                prefetch={true}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-all ${
                                  isActive
                                    ? theme.activeLink
                                    : theme.inactiveLink
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "opacity-70"}`} />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {item.badge && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : theme.activeSearchBadge
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer User Quick Actions */}
            <div className={`p-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] shrink-0 space-y-1.5 backdrop-blur-md ${theme.footerBg}`}>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setSystemAccountsModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 min-h-[34px] rounded-xl bg-white/80 hover:bg-white border border-black/10 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5 opacity-70" />
                  <span>Danh sách TK</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setChangePasswordModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 min-h-[34px] rounded-xl bg-white/80 hover:bg-white border border-black/10 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                  <span>Đổi MK</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleClientSignOut("/login")}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-xl bg-rose-500/10 border border-rose-400/40 text-rose-700 hover:bg-rose-500/20 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordModalOpen && <ChangePasswordModal onClose={() => setChangePasswordModalOpen(false)} />}
      {/* System Accounts & Passwords Modal */}
      <SystemAccountsModal isOpen={systemAccountsModalOpen} onClose={() => setSystemAccountsModalOpen(false)} />
    </>
  );
}
