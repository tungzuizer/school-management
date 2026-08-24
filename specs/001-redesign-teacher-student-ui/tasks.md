# Tasks: Teacher & Student UI Redesign

**Input**: Design documents from `/specs/001-redesign-teacher-student-ui/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-design-tokens.md`, `quickstart.md`
**Constitution**: Validated against School Management System Constitution v1.0.0

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier ([US1], [US2], [US3])
- File paths are exact repository relative paths

---

## Phase 1: Setup (Shared Infrastructure & Design Tokens)

**Purpose**: Establish core CSS custom properties, accessibility focus rings, and reduced motion overrides in global styling.

- [x] T001 Define semantic CSS Custom Properties (`:root` & `[data-theme="dark"]`) and `@theme inline` palette in `src/app/globals.css`
- [x] T002 [P] Configure baseline touch target sizes (min-h 44px) and focus visible indicators (`:focus-visible`) in `src/app/globals.css`
- [x] T003 [P] Configure `@media (prefers-reduced-motion: reduce)` animation overrides in `src/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI primitives and layout helpers required by all user stories

- [x] T004 Standardize high-contrast status badge utility classes (Emerald, Amber, Rose, Sky) in `src/app/globals.css`
- [x] T005 [P] Audit and update header touch targets and contrast in `src/components/layout/Header.tsx`
- [x] T006 [P] Update stat card accessibility attributes (`tabIndex`, `role`) and border styling in `src/components/ui/InteractiveStatCard.tsx`
- [x] T007 [P] Update timeline text contrast and responsive fit in `src/components/ui/LiveClassTimeline.tsx`

**Checkpoint**: Core design token foundation ready - user story implementation can proceed.

---

## Phase 3: User Story 1 - Accessible & Responsive Teacher Command Center (Priority: P1) 🌟 MVP

**Goal**: Deliver an accessible, high-contrast, mobile-friendly command center for Teachers with body scroll locking, Focus Trap, touch targets ≥44px, and clean card borders.

**Independent Test**: Log in as a Teacher on desktop and mobile viewports. Verify mobile drawer scroll lock, keyboard focus trap, WCAG AA contrast (≥4.5:1), touch targets ≥44px, and 0 `border-b-2` card cutoffs.

- [x] T008 [US1] Redesign Teacher Layout with body scroll lock, Focus Trap, ARIA dialog roles, accessible close button, and 44px touch targets in `src/app/teacher/layout.tsx`
- [x] T009 [P] [US1] Redesign Teacher Dashboard replacing hardcoded Indigo gradients and gray-on-color text with semantic tokens in `src/app/teacher/dashboard/page.tsx`
- [x] T010 [P] [US1] Fix Homeroom page `border-b-2` card cutoffs, text contrast, and badge colors in `src/app/teacher/homeroom/page.tsx`
- [x] T011 [P] [US1] Fix Electronic Journal mobile table overflow container and text contrast in `src/app/teacher/journal/page.tsx`
- [x] T012 [P] [US1] Fix Daily Attendance touch targets and status badge contrast in `src/app/teacher/attendance/page.tsx`
- [x] T013 [P] [US1] Fix Grade Input focus rings, touch targets, and table ergonomics in `src/app/teacher/grades/page.tsx`
- [x] T014 [P] [US1] Fix Daily Report `border-b-2` card cutoffs and heading contrast in `src/app/teacher/daily-report/page.tsx`
- [x] T015 [P] [US1] Fix Subject Head Approval cards `border-b-2` cutoffs and gradient palette in `src/app/teacher/subject-head/SubjectHeadClient.tsx`
- [x] T016 [P] [US1] Update Lesson Plans cards and contrast in `src/app/teacher/lesson-plans/page.tsx`
- [x] T017 [P] [US1] Update Teacher Profile accessibility and touch targets in `src/app/teacher/profile/page.tsx`

**Checkpoint**: User Story 1 (Teacher Portal) fully functional, accessible, and independently testable (MVP!).

---

## Phase 4: User Story 2 - Student 360° Learning Portal & Gamification Hub (Priority: P2)

**Goal**: Deliver a responsive, gamified, accessible student portal with reduced-motion support, high-contrast badges, and smooth data tables.

**Independent Test**: Log in as a Student. Verify mobile drawer accessibility, schedule table overflow, dark mode adaptation, and `prefers-reduced-motion` compliance.

- [x] T018 [US2] Redesign Student Layout with body scroll lock, Focus Trap, ARIA dialog roles, accessible close button, and 44px touch targets in `src/app/student/layout.tsx`
- [x] T019 [P] [US2] Redesign Student Dashboard eliminating `border-b-2` card cutoffs, text contrast issues, and adding reduced-motion fallback in `src/app/student/dashboard/page.tsx`
- [x] T020 [P] [US2] Fix Student Grades summary cards, term filter 44px touch targets, and table overflow in `src/app/student/grades/page.tsx`
- [x] T021 [P] [US2] Fix Student Attendance status badges contrast and month selector touch targets in `src/app/student/attendance/page.tsx`
- [x] T022 [P] [US2] Fix Student Schedule timetable matrix overflow and replace `animate-bounce` with smooth spring easing in `src/app/student/schedule/page.tsx`
- [x] T023 [P] [US2] Update Study Streak Widget and Positivity Widget with reduced-motion fallbacks and high-contrast text in `src/components/ui/StudyStreakWidget.tsx` and `src/components/ui/DailyPositivityWidget.tsx`
- [x] T024 [P] [US2] Update Student Praise Modal and Confetti Effect with accessible focus management and motion guards in `src/components/ui/StudentPraiseModal.tsx` and `src/components/ui/ConfettiEffect.tsx`

**Checkpoint**: User Story 2 (Student Portal) fully functional, accessible, and independently testable.

---

## Phase 5: User Story 3 - Cohesive Design System Tokens & Dark Mode Theme Engine (Priority: P3)

**Goal**: Unify design tokens across all components and verify seamless dark theme transitions.

**Independent Test**: Toggle dark mode and inspect all surfaces for zero hardcoded background/text leaks.

- [x] T025 [P] [US3] Verify and refine dark theme custom properties in `src/app/globals.css` for surface cards, borders, text, and badges
- [x] T026 [US3] Perform visual audit across Teacher and Student pages in dark mode to verify zero hardcoded white background flashes

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality verification and final audit pass

- [x] T027 [P] Run detector script `node .claude/skills/impeccable/scripts/detect.mjs src/app/teacher src/app/student` and verify 0 anti-pattern warnings
- [x] T028 Execute runnable quickstart validation scenarios in `specs/001-redesign-teacher-student-ui/quickstart.md` and verify Audit Health Score ≥ 18/20

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies - starts immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all User Stories
- **Phase 3 (User Story 1 - Teacher Portal)**: Depends on Phase 2 - MVP scope
- **Phase 4 (User Story 2 - Student Portal)**: Depends on Phase 2
- **Phase 5 (User Story 3 - Dark Theme Tokens)**: Depends on Phase 3 & Phase 4
- **Phase 6 (Polish & Verification)**: Depends on all desired User Stories being complete

### Parallel Execution Opportunities
- Tasks T002, T003 in Phase 1 can run in parallel.
- Tasks T005, T006, T007 in Phase 2 can run in parallel.
- Tasks T009 through T017 in Phase 3 (Teacher pages) can run in parallel.
- Tasks T019 through T024 in Phase 4 (Student pages & widgets) can run in parallel.
EOF