# Feature Specification: Teacher & Student UI Redesign (Chẩn Đoán & Thiết Kế Lại Giao Diện Giáo Viên - Học Sinh)

**Feature Branch**: `001-redesign-teacher-student-ui`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "thiết kế lại giao diện phần giáo viên và học sinh theo các điểm audit vừa tìm được, độc đáo và chuyên nghiệp hơn, tuân theo constitution đã ratify"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accessible & Responsive Teacher Command Center (Priority: P1)

As a Teacher (Giáo viên bộ môn & Chủ nhiệm), I need an accessible, mobile-friendly, high-contrast command center where I can view daily schedules, manage homeroom attendance, enter grades, and submit daily reports seamlessly on any device.

**Why this priority**: Teachers are the primary administrative users who need fast, zero-friction access to daily operational tools on desktop and mobile without small touch targets or text contrast fatigue.

**Independent Test**: Can be fully tested by logging in as a Teacher on mobile and desktop viewports, navigating through Homeroom, Journal, Attendance, and Grades pages, verifying touch targets (≥44px), high contrast readability (WCAG AA 4.5:1), and mobile drawer accessibility (focus lock, body scroll lock).

**Acceptance Scenarios**:

1. **Given** a teacher accessing the application on a mobile device, **When** they open the mobile navigation drawer ("Mục lục"), **Then** background page scrolling is completely locked, focus is trapped inside the drawer, full ARIA attributes (`role="dialog"`, `aria-modal="true"`) are present, and tapping backdrop closes the menu.
2. **Given** a teacher reviewing student lists or attendance tables, **When** viewing text labels on colored badges or card backgrounds, **Then** contrast ratios meet or exceed 4.5:1 for standard text, preventing washed-out gray text.
3. **Given** a teacher interacting with action buttons, filter chips, or bottom navigation tabs, **When** touched or focused, **Then** all interactive hit areas meet a minimum of 44x44px and present clear, high-contrast focus rings.

---

### User Story 2 - Student 360° Learning Portal & Gamification Hub (Priority: P2)

As a Student (Học sinh), I want a visually inspiring, accessible, and responsive personal dashboard to view my timetable, academic performance, attendance record, commendation badges, and positive encouragement without visual clutter or flashing animations.

**Why this priority**: Students benefit from an engaging, modern portal that motivates learning, but must be protected from overstimulating animations and hard-to-read small fonts.

**Independent Test**: Can be fully tested by logging in as a Student, reviewing grades, schedules, commendation gold boards, and toggling system dark mode or reduced motion preferences to verify adaptive visual scaling.

**Acceptance Scenarios**:

1. **Given** a student with motion sensitivity or system `prefers-reduced-motion` enabled, **When** navigating the dashboard, **Then** non-essential animations (floating cards, pulsing glows, bounce effects) are disabled or replaced with smooth, static state indicators.
2. **Given** a student checking subject grades or weekly schedules on a smartphone, **When** viewing data tables, **Then** content scrolls smoothly in an horizontal overflow container without distorting layout or clipping column headings.
3. **Given** a student viewing praise badges or academic summary cards, **When** switching to dark mode, **Then** all card backgrounds, text, and icons adapt smoothly to high-contrast dark theme tokens without hardcoded white background flashes.

---

### User Story 3 - Cohesive Design System Tokens & Dark Mode Theme Engine (Priority: P3)

As a System User (Teacher, Student, Administrator), I want a unified design token system that eliminates hardcoded color strings, removes visual artifacts (such as sharp bottom border cutoffs on rounded cards), and supports seamless light/dark mode transitions.

**Why this priority**: Establishes long-term visual authority, brand identity, and maintainability across all educational management portals.

**Independent Test**: Can be fully tested by applying theme toggles and inspecting visual component libraries to verify zero hardcoded color utility leaks and consistent design token usage.

**Acceptance Scenarios**:

1. **Given** any card element with rounded corners (`rounded-2xl` or `rounded-3xl`), **When** rendered on screen, **Then** no thick accent bottom borders (`border-b-2`) conflict with corner radii, maintaining clean border curvature.
2. **Given** any page in the teacher or student section, **When** system theme preferences change to dark, **Then** all background colors, surface cards, text colors, and state badges update dynamically based on standardized semantic CSS variables.

---

### Edge Cases

- **Extreme Mobile Viewports (320px width)**: How does the system handle multi-column grade tables and schedule matrices without breaking page boundaries? (Handled via dedicated horizontal scroll containers and collapsible mobile card views).
- **Reduced Motion System Setting**: How does the system handle active celebratory confetti effects or live status indicators when `prefers-reduced-motion: reduce` is active? (Confetti and floating keyframes are suppressed, falling back to static badge notifications).
- **Dark Mode Contrast Boundary**: How are badge status colors (Emerald for Present, Amber for Late, Rose for Absent) rendered in dark mode? (Semantic dark token variants ensure background opacity is lowered and text brightness is raised to maintain ≥4.5:1 contrast).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce minimum touch target sizes of 44x44px for all interactive buttons, links, navigation tabs, and form controls across mobile and tablet viewports.
- **FR-002**: System MUST ensure all text elements achieve WCAG AA contrast compliance (minimum 4.5:1 contrast ratio for normal text, 3.0:1 for large text) by eliminating low-contrast gray text on tinted backgrounds.
- **FR-003**: System MUST implement accessibility standards for mobile navigation drawers, including body scroll locking when open, ARIA dialog roles (`role="dialog"`, `aria-modal="true"`), accessible close button labels, and keyboard focus trap management.
- **FR-004**: System MUST respect user motion preferences by disabling decorative continuous animations (`animate-float`, `animate-pulse-glow`, `bell-swing`, `animate-bounce`) when `prefers-reduced-motion` is detected.
- **FR-005**: System MUST provide visible, high-contrast keyboard focus indicators (`:focus-visible`) for all interactive elements and inputs without suppressing native focus rings without alternatives.
- **FR-006**: System MUST replace hardcoded utility color strings across teacher and student components with semantic Design Tokens supporting light and dark theme modes.
- **FR-007**: System MUST optimize visual graphics by eliminating unconstrained multi-layer backdrop blurs and heavy ambient glows on low-power devices.
- **FR-008**: System MUST enforce strict Role-Based Access Control (RBAC) in accordance with the project Constitution, ensuring teachers only access assigned classes/subjects and students only access their personal academic records.
- **FR-009**: System MUST support multi-tier educational governance displays (Primary, Secondary, High School) with role-appropriate terminology and metric cards.

### Key Entities *(include if feature involves data)*

- **User Context**: Represents authenticated user attributes (ID, Role, Name, Assigned School/Class, Theme Preference).
- **Design Token Palette**: Represents semantic color definitions (Background, Surface, Text Primary/Secondary, Brand Accent, Status Emerald/Amber/Rose/Sky).
- **Navigation Workspace**: Represents structured menu items for role-specific portals (Teacher Workspaces vs. Student Study Center).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interactive elements on mobile viewports pass the 44x44px minimum touch target size standard.
- **SC-002**: 100% of text elements across Teacher and Student portals meet WCAG AA contrast ratios (≥ 4.5:1).
- **SC-003**: Audit Health Score improves from 10/20 to at least 18/20 (Rating: Excellent) on follow-up `/impeccable audit`.
- **SC-004**: 0 accessibility focus traps or unhandled mobile drawer body scroll leaks detected during automated and manual testing.
- **SC-005**: 100% compliance with `prefers-reduced-motion` standards, with zero persistent layout thrashing or frame drops reported on mid-range mobile devices.

## Assumptions

- **Target Viewports**: Primary mobile viewports range from 360px to 430px width; desktop viewports range from 1024px to 1920px width.
- **Authentication**: NextAuth session context provides validated user role and identity; scope restrictions are verified at server boundary per Constitution Principle I.
- **Styling Architecture**: Tailwind CSS v4 utility architecture combined with CSS custom properties (`:root` and `[data-theme="dark"]`) is utilized for semantic token definition.
- **Iconography**: Lucide React icons are used exclusively; decorative icons include `aria-hidden="true"` while action icons carry explicit `aria-label` tags.
