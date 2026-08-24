# Research Findings: Teacher & Student UI Redesign

**Feature**: `001-redesign-teacher-student-ui`
**Date**: 2026-08-24

## 1. Design System Tokens & Theme Engine Strategy

### Decision
Implement semantic CSS Custom Properties in `src/app/globals.css` integrated with Tailwind v4 `@theme inline` definitions. Define tokens for background, surface cards, text primary/secondary/muted, brand accent, and status indicators (Emerald for Present, Amber for Late, Rose for Absent, Sky for Info).

### Rationale
- **WCAG AA Contrast Compliance**: Pre-calculated token pairs guarantee text-to-background contrast ratios ≥ 4.5:1 for standard text and ≥ 3.0:1 for large text across light and dark modes.
- **Eliminates Hardcoded Utility Colors**: Replaces scattered `bg-indigo-600`, `text-slate-400`, and `bg-blue-50` with semantic token classes (e.g. `bg-surface-card`, `text-status-emerald-text`, `bg-status-emerald-bg`).
- **Zero Heavy Dependencies**: Leverages native CSS custom properties and Tailwind CSS v4 features without adding external theme management libraries, adhering to Constitution Principle V (Server-First Performance & Simplicity).

### Alternatives Considered
- **Utility-level `dark:` classes scattered across 15+ pages**: Rejected due to high maintenance complexity, missing variant bugs, and audit findings of hardcoded color leaks.
- **External CSS-in-JS UI component libraries (e.g., Styled Components, Emotion)**: Rejected per Constitution Principle V technical constraints.

---

## 2. Mobile Drawer Accessibility & Body Scroll Locking

### Decision
Implement an accessible modal drawer dialog pattern in `TeacherLayout` and `StudentLayout` with:
1. `document.body.style.overflow = 'hidden'` when `mobileMenuOpen === true` (restored on close).
2. ARIA semantics: `role="dialog"`, `aria-modal="true"`, `aria-label="Mục lục điều hướng"`.
3. Keyboard Focus Trap: Traps Tab / Shift+Tab focus inside the drawer while open, and handles Escape key press to close.
4. Accessible Close Buttons: Explicit `aria-label="Đóng mục lục"` on icon buttons.

### Rationale
- Solves the P0 audit finding where page content scrolled under the open drawer sheet.
- Ensures screen readers and keyboard users experience clean, compliant modal behavior matching WCAG 2.1 Guidelines 2.4.3 (Focus Order) and 4.1.2 (Name, Role, Value).

### Alternatives Considered
- **Third-party Dialog Libraries (Radix UI / Headless UI)**: Evaluated; an inline accessible portal hook in Next.js/React 19 achieves the exact WCAG compliance with zero bundle overhead.

---

## 3. Touch Target Ergonomics (≥ 44x44px)

### Decision
Enforce a baseline minimum hit area of 44x44px for all mobile interactive elements across `bottomTabs`, workspace links, modal close buttons, table action triggers, and filter chips using Tailwind `min-h-[44px]` and `min-w-[44px]` utility classes and CSS rule enforcement in `globals.css`.

### Rationale
- Solves the P0 audit finding where mobile bottom navigation tabs (`py-1.5 px-3`, height ~34px) were undersized for finger touches.
- Satisfies WCAG 2.1 SC 2.5.5 Target Size.

---

## 4. Motion Reduction (`prefers-reduced-motion`)

### Decision
Wrap all keyframe animations (`animate-float`, `animate-pulse-glow`, `animate-shimmer`, `bell-swing`, `animate-bounce`) in `@media (prefers-reduced-motion: reduce)` blocks within `src/app/globals.css`. When reduced motion is active, animations fall back to static, clean state indicators.

### Rationale
- Solves P1 accessibility & performance audit findings.
- Prevents disorientation for users with vestibular motion disorders.

---

## 5. Elimination of Card Border Cutoffs (`border-accent-on-rounded`)

### Decision
Audit all rounded cards (`rounded-2xl`, `rounded-3xl`) across Teacher and Student pages to replace thick accent bottom borders (`border-b-2`) with clean, uniform border outlines (`border border-slate-200/80`) or internal divider lines.

### Rationale
- Solves detector scan findings where `border-b-2` cut off rounded corners on cards.
- Restores visual harmony and professional polish.
