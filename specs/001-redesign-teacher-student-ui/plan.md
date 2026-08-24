# Implementation Plan: Teacher & Student UI Redesign

**Branch**: `001-redesign-teacher-student-ui` | **Date**: 2026-08-24 | **Spec**: [specs/001-redesign-teacher-student-ui/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-redesign-teacher-student-ui/spec.md`

## Summary

Redesign and audit-harden the Teacher (`src/app/teacher/*`) and Student (`src/app/student/*`) user interfaces to resolve all 23 audit findings and elevate the system's technical quality score from **10/20** to **18-20/20 (Excellent)**. 

Key technical deliverables include enforcing minimum 44x44px mobile touch targets, establishing accessible ARIA mobile navigation drawers with focus trap and body scroll locking, fixing low-contrast text ratios (WCAG AA ≥4.5:1), integrating semantic Design Tokens for dark theme support, eliminating rounded card border cutoffs (`border-b-2`), and adding `prefers-reduced-motion` compliance. All changes adhere strictly to the ratified School Management System Constitution (v1.0.0).

---

## Technical Context

**Language/Version**: TypeScript 5, Node.js 20+, React 19, Next.js 16 (App Router)
**Primary Dependencies**: Next.js 16, React 19, Tailwind CSS v4, Lucide React, NextAuth v4, Prisma ORM
**Storage**: PostgreSQL via Prisma ORM (Data read/write scopes unchanged; UI presentation layer optimized)
**Testing**: Impeccable Detector (`node .claude/skills/impeccable/scripts/detect.mjs`), Chrome DevTools A11y & Contrast Audits, Impeccable Audit (`/impeccable audit`)
**Target Platform**: Web (Desktop 1024px-1920px & Mobile viewports 320px-430px)
**Project Type**: Next.js App Router Web Application
**Performance Goals**: 100% 44x44px touch target compliance, 100% WCAG AA 4.5:1 text contrast compliance, Audit Health Score ≥18/20, 60fps rendering without GPU blur thrashing
**Constraints**: Zero body scroll leaks when mobile drawer opens, full keyboard focus trap, zero hardcoded color leaks, strict RBAC server boundaries per Constitution Principle I
**Scale/Scope**: 15+ Teacher & Student pages (`src/app/teacher/*`, `src/app/student/*`), layout wrappers (`TeacherLayout`, `StudentLayout`), global styles (`src/app/globals.css`), and shared UI widgets (`src/components/ui/*`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Role-Based Access Control & Security (RBAC)**: PASSED. Server Actions & queries in `src/app/teacher/actions.ts` and `src/app/student/actions.ts` retain server-side session checks. The UI redesign only touches presentation markup and accessible ergonomics.
- **Principle II: Type Safety & Schema Validation**: PASSED. All component props and navigation contracts use strict TypeScript types (`NavItemContract`, `StatCardContract`).
- **Principle III: Multi-Tier Educational Management**: PASSED. Responsive layouts display role-appropriate badge labels for Primary (Tiểu học), Secondary (THCS), and High School (THPT) tiers.
- **Principle IV: Data Integrity & Auditability**: PASSED. UI changes do not alter domain models or database transactions.
- **Principle V: Server-First Performance & Simplicity**: PASSED. Leverages native CSS custom properties and Tailwind v4 without introducing heavy external styling or UI libraries.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-redesign-teacher-student-ui/
├── plan.md              # Implementation Plan (this file)
├── research.md          # Technical research findings & decisions
├── data-model.md        # UI State entities & component state contracts
├── quickstart.md        # Verification & testing scenarios
├── contracts/
│   └── ui-design-tokens.md # Design Token & A11y interface contract
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── globals.css                       # CSS custom properties, tokens, focus rings, reduced motion
│   ├── teacher/
│   │   ├── layout.tsx                    # Teacher mobile drawer A11y, touch targets, sidebar
│   │   ├── dashboard/page.tsx            # Teacher dashboard redesign & token contrast fixes
│   │   ├── homeroom/page.tsx             # Homeroom card border fixes & badge contrast
│   │   ├── journal/page.tsx              # Electronic journal mobile table overflow
│   │   ├── attendance/page.tsx           # Attendance mobile layout & touch target fix
│   │   ├── grades/page.tsx               # Grades input high-contrast focus rings
│   │   ├── lesson-plans/page.tsx         # Lesson plan cards & token alignment
│   │   ├── daily-report/page.tsx         # Daily report card border & contrast fixes
│   │   ├── subject-head/SubjectHeadClient.tsx # Subject head approval card fixes
│   │   └── profile/page.tsx              # Teacher profile A11y cleanup
│   └── student/
│       ├── layout.tsx                    # Student mobile drawer A11y, touch targets, nav
│       ├── dashboard/page.tsx            # Student dashboard redesign & token contrast fixes
│       ├── grades/page.tsx               # Grades summary cards & table overflow
│       ├── attendance/page.tsx           # Attendance status badge high-contrast colors
│       └── schedule/page.tsx             # Timetable matrix overflow & reduced-motion fix
└── components/
    ├── layout/
    │   ├── Header.tsx                    # Top header touch target & contrast audit
    │   └── Sidebar.tsx                   # Sidebar token contrast audit
    └── ui/
        ├── InteractiveStatCard.tsx       # Accessible stat card with tabIndex/aria
        ├── LiveClassTimeline.tsx         # Timeline contrast & responsive fit
        ├── StudentPraiseModal.tsx        # Modal focus trap & dark token support
        ├── StudyStreakWidget.tsx         # Gamification widget reduced-motion fallback
        └── DailyPositivityWidget.tsx     # Positivity widget contrast & motion fix
```

**Structure Decision**: Standardized single Next.js Web Application structure (`src/app/` + `src/components/`).

---

## Complexity Tracking

*No Constitution violations detected or required; table empty.*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | N/A | N/A |
EOF