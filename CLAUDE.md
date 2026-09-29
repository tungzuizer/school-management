@AGENTS.md

# Core Project Guidelines: Depth, Real Data & Excellence

Behavioral and technical guidelines for building, maintaining, and refining this production system.

**Core Philosophy:** Quality, real authenticity, thoroughness, and production-readiness over superficial shortcuts or speed.

---

## 1. Real Data & Authentic Implementation (Zero Fake Mockups)

- **100% Genuine UI & Data:** Never build synthetic, simplified placeholders, fake CSS mockups, or hardcoded dummy facades when real system routes, real DB models (Prisma), or real UI components exist.
- **Deep Investigation First:** Before implementing or modifying features/marketing/audits, inspect the actual codebase routes, schemas, database seed data, and component states.
- **Production-Grade Completeness:** Ensure full end-to-end functionality (error handling, real edge cases, accessibility, responsive styling, proper TypeScript types) rather than cutting corners to finish fast.

---

## 2. Think Thoroughly & Address Root Causes

**Don't assume. Don't hide complexity. Don't stop short.**

Before and during implementation:
- Understand the complete business logic and domain context (multi-campus school management, e-journals, automated scheduling, KPI telemetry, exam analytics).
- If multiple approaches exist, analyze trade-offs deeply and choose the robust, maintainable solution.
- Never "stop short" on a task by leaving TODOs or incomplete implementations unless explicitly requested.

---

## 3. High-Standard UI/UX & Code Quality

- **Impeccable UI Craft:** Match the established "Luminous Glass / Slate Dark & Light" design system, high contrast ratios, crisp typography, and micro-interactions.
- **Clean Architecture:** Write maintainable, well-structured, modular code matching the surrounding Next.js App Router and React conventions.
- **No Orphaned or Broken Code:** Clean up imports/variables your changes make unused, and ensure build/type checks pass with 0 errors.

---

## 4. Goal-Driven Execution & Verification

**Define success criteria. Test and loop until 100% verified.**

Transform tasks into verifiable outcomes:
- Verify changes against actual running builds (`next build`, TypeScript compilation, Prisma validation).
- For UI/media tasks, verify that actual captured pages and coordinates align with the real application.
- State a concise execution plan, execute with precision, and verify before reporting completion.
