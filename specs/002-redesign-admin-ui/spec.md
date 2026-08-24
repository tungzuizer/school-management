# Feature Specification: Redesign Admin & Principal Portal UI

**Feature Directory**: `specs/002-redesign-admin-ui`
**Created**: 2026-08-24
**Status**: Draft
**Input**: "bạn chỉnh nhầm file rồi phải ở bên acc adimin chứ vẫn lỗi như cũ và giao diên quá tệ"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Dashboard & Multi-School Executive View (Priority: P1)

As a Super Admin / Education Department Admin, I want an executive-level dashboard and navigation interface in the Admin portal that cleanly handles multi-school and multi-ward data without switching out of the Admin layout or causing confusing tab redirects.

**Why this priority**: Core user journey for top-level administrators to monitor and manage all connected educational units effortlessly from a single, cohesive interface.

**Independent Test**: Log in as `admin@school.com` (or Super Admin), navigate across Admin dashboard tabs, school list, and multi-school metrics. The UI remains inside the Admin layout without unintended navigation loss or broken state.

**Acceptance Scenarios**:
1. **Given** an logged-in Admin user on `/admin/dashboard`, **When** clicking on executive navigation cards (Phân hệ Sở GD&ĐT, Phân hệ Phòng GD&ĐT, Quản lý Trường, Quản lý Học sinh), **Then** the page transitions cleanly within the Admin management context without broken redirects or session loops.
2. **Given** an Admin reviewing KPI and strategy metrics, **When** switching between filters and status tabs, **Then** data filters update dynamically with clear loading indicators and accessible contrast.

---

### User Story 2 - Account & Password Management for Admin & Leadership (Priority: P2)

As a School Principal / Admin, I need password change and profile update operations to work reliably without getting stuck in an infinite password change prompt or login loop.

**Why this priority**: Eliminates authentication frustration and ensures administrators can manage their credentials safely and update passwords smoothly.

**Independent Test**: Perform a password change operation as an Admin or demo user, then log out and log back in. The new password is required, and the user is NOT repeatedly prompted to change password again.

**Acceptance Scenarios**:
1. **Given** an Admin user with default credentials, **When** submitting a new valid password, **Then** the session state updates immediately in JWT cookies and the database, clearing the password change prompt.

---

### User Story 3 - Visual Craft & WCAG AA Accessibility Refinement (Priority: P3)

As an Administrator, I want a clean, professional, high-contrast visual design across all Admin pages (`/admin/*`) adhering to Constitution v1.0.0 and eliminating tacky AI anti-patterns.

**Why this priority**: Ensures the Admin UI looks executive, premium, legible, and responsive on all devices.

**Independent Test**: Audit all Admin sub-pages using the anti-pattern detector script and verify zero high-contrast or layout thrashing defects remain.

**Acceptance Scenarios**:
1. **Given** any Admin page (`/admin/dashboard`, `/admin/strategy`, `/admin/kpi`, `/admin/principals`), **When** viewed on mobile or desktop viewports, **Then** all text meets WCAG AA contrast (≥4.5:1), cards use refined borders instead of thick side accents, and interactive elements have ≥44px touch targets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain seamless layout continuity when navigating between Admin executive views and multi-school management options.
- **FR-002**: Password change Server Actions MUST update the database record and refresh NextAuth session tokens atomically without persistent lockouts.
- **FR-003**: UI components MUST replace AI anti-patterns (thick accent borders on rounded cards, text gradients, bounce animations) with clean, high-contrast Tailwind CSS v4 styling.
- **FR-004**: All mobile navigation menus and drawer toggles MUST respond reliably to click and touch events with proper ARIA accessibility roles.

### Key Entities

- **Admin User**: Represents a Super Admin, Department Admin, Ward Admin, or School Principal with full role-based access rights.
- **School & Ward Context**: Institutional scope data attached to the admin session for filtering multi-tier metrics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Admin routes (`/admin/*`) pass Next.js build compilation without TypeScript or Turbopack syntax errors.
- **SC-002**: Anti-pattern detector score improves, resolving gray-on-color contrast issues and thick side-borders across Admin pages.
- **SC-003**: Password change flow completes in 1 step without infinite loop redirects.

## Assumptions

- NextAuth JWT session update callback is supported and configured for `trigger === "update"`.
- Primary school, secondary school, high school, and multi-school roles operate within the defined RBAC rules in Constitution v1.0.0.
