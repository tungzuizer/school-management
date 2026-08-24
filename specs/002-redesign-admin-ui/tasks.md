# Tasks: Redesign Admin & Principal Portal UI

**Input**: Design documents from `/specs/002-redesign-admin-ui/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize spec task structure in `specs/002-redesign-admin-ui/tasks.md`
- [x] T002 Verify anti-pattern detector configuration in `.claude/skills/impeccable/scripts/detect.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Ensure NextAuth JWT callback synchronization in `src/lib/auth.ts` (`trigger === "update"`)
- [x] T004 Verify role permissions guard logic in `src/middleware.ts` for ADMIN and DEPARTMENT_ADMIN roles

---

## Phase 3: User Story 1 - Admin Dashboard & Navigation Continuity (Priority: P1) ⭐ MVP

**Goal**: Seamless, high-contrast navigation across Admin executive pages without layout switches or broken redirects.

**Independent Test**: Log in as Admin/Super Admin, navigate across `/admin/dashboard`, `/admin/strategy`, `/admin/kpi`, `/admin/principals`. Verify sidebar and layout context persist without redirecting out of Admin.

- [x] T005 [P] [US1] Fix mobile menu toggle and accessibility props in `src/app/admin/layout.tsx`
- [x] T006 [P] [US1] Update navigation cards and quick actions in `src/app/admin/dashboard/page.tsx`
- [x] T007 [US1] Refine profile loader and Super Admin flag evaluation in `src/app/admin/actions.ts`
- [x] T008 [US1] Ensure school and ward context filters update cleanly in `src/app/admin/dashboard/actions.ts`

**Checkpoint**: User Story 1 complete and fully functional.

---

## Phase 4: User Story 2 - Account & Password Management (Priority: P2)

**Goal**: Atomic password updates and session synchronization for Admin users.

**Independent Test**: Submit new password via password change form, verify NextAuth session token refreshes immediately and user is not prompted again.

- [x] T009 [P] [US2] Enhance password update server action in `src/app/actions/user-password.ts`
- [x] T010 [US2] Integrate password change state reset in `src/app/admin/principals/page.tsx`

**Checkpoint**: User Story 2 complete and independently verified.

---

## Phase 5: User Story 3 - Visual Craft & Accessibility Refinement (Priority: P3)

**Goal**: Resolve AI anti-patterns and ensure WCAG AA contrast across all Admin sub-pages.

**Independent Test**: Run `detect.mjs` on `src/app/admin` and confirm 0 contrast or thick-border anti-patterns remain.

- [x] T011 [P] [US3] Replace gray-on-color text classes in `src/app/admin/approvals/page.tsx`
- [x] T012 [P] [US3] Remove `border-l-4` side accents on cards in `src/app/admin/strategy/page.tsx`
- [x] T013 [P] [US3] Remove `border-l-4` side accents in `src/app/admin/strategy/reports/ReportsClient.tsx`
- [x] T014 [P] [US3] Replace `animate-bounce` with smooth transitions in `src/app/admin/ai-config/page.tsx`
- [x] T015 [P] [US3] Fix text contrast on gradient backgrounds in `src/app/admin/schedule/page.tsx`

**Checkpoint**: All user stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 Run `npx next build` to verify zero TypeScript/Turbopack errors
- [x] T017 Execute anti-pattern scan: `node .claude/skills/impeccable/scripts/detect.mjs --target src/app/admin`
- [x] T018 Run `quickstart.md` validation scenarios

---

## Dependencies & Execution Order

- **Phase 1 & 2 (Setup & Foundational)**: Must complete first.
- **Phase 3 (US1 - MVP)**: Can start after Phase 2.
- **Phase 4 & 5 (US2 & US3)**: Depend on Phase 2, can proceed in parallel or after US1.
- **Phase 6 (Polish)**: Final verification step.
