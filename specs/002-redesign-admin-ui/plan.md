# Technical Architecture Plan: Redesign Admin & Principal Portal UI

**Feature Directory**: `specs/002-redesign-admin-ui`
**Feature Branch**: `002-redesign-admin-ui`
**Created**: 2026-08-24
**Status**: In Progress

## Technical Context

- **Framework**: Next.js 16 (App Router with Turbopack), React 19
- **Authentication**: NextAuth.js v4 (JWT Session strategy, `trigger === "update"` callback)
- **Database & ORM**: PostgreSQL, Prisma ORM v6
- **Styling & UI**: Tailwind CSS v4, Lucide Icons, Recharts
- **Key Modules**:
  - `src/app/admin/layout.tsx` (Admin Portal Layout, Navigation groups, Mobile drawer)
  - `src/app/admin/dashboard/page.tsx` (Executive Dashboard, Toolbar, Quick actions)
  - `src/app/admin/strategy/page.tsx` & sub-pages (Strategy Overview, Action items)
  - `src/app/admin/kpi/page.tsx` (KPI Metrics & Catalog)
  - `src/app/admin/principals/page.tsx` (Principals & Management Accounts)
  - `src/middleware.ts` (Role & Route Guards)

## Constitution Check

- [x] **Principle I (RBAC & Security)**: Role-based permissions enforced server-side for ADMIN, DEPARTMENT_ADMIN, WARD_ADMIN, and VICE_PRINCIPAL roles.
- [x] **Principle II (Type Safety & Zod)**: Strict TypeScript interfaces and Server Action Zod validation.
- [x] **Principle III (Multi-Tier Governance)**: Smooth support for Department, Ward, High School (THPT), and Primary/Secondary tiers.
- [x] **Principle IV (Data Integrity)**: Relational integrity maintained across user sessions and school models.
- [x] **Principle V (Server-First & Simplicity)**: Leverages Next.js Server Components and minimal client state.

## Phase 0: Research & Architecture Decisions

See [research.md](./research.md) for full rationale on:
- Admin layout state persistence vs. module navigation context.
- High-contrast color palette replacing AI anti-patterns.
- Atomic session update lifecycle for credential updates.

## Phase 1: Design & Contracts

See generated artifacts:
- [data-model.md](./data-model.md) — Session & User model interfaces
- [quickstart.md](./quickstart.md) — Verification & testing scenarios
