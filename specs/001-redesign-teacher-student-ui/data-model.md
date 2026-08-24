# Data Model & UI State Specification: Teacher & Student UI Redesign

**Feature**: `001-redesign-teacher-student-ui`
**Date**: 2026-08-24

## 1. UI State Entities (Client Side)

### MobileDrawerState
Represents the open/closed state and accessibility parameters of the mobile navigation drawer.

| Attribute | Type | Description |
|-----------|------|-------------|
| `isOpen` | `boolean` | Controls visibility of slide-over drawer |
| `activeWorkspaceId` | `string` | Currently highlighted workspace or navigation section |
| `focusTrapRef` | `React.RefObject<HTMLDivElement>` | Container ref for keyboard focus trap |
| `scrollLockActive` | `boolean` | `true` when `document.body.style.overflow = 'hidden'` is applied |

### ThemeTokenConfig
Represents semantic color token definitions applied at root level (`:root` and `[data-theme="dark"]`).

| Semantic Token | Light Mode Value | Dark Mode Value | Usage Context |
|----------------|------------------|-----------------|---------------|
| `--bg-main` | `#f8fafc` (slate-50) | `#0f172a` (slate-900) | Full page background |
| `--surface-card` | `#ffffff` | `#1e293b` (slate-800) | Dashboard & section cards |
| `--surface-card-border` | `rgba(226, 232, 240, 0.8)` | `rgba(51, 65, 85, 0.8)` | Card borders |
| `--text-primary` | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | Main headings & primary text |
| `--text-secondary` | `#475569` (slate-600) | `#94a3b8` (slate-400) | Subtitles & helper text |
| `--text-muted` | `#64748b` (slate-500) | `#cbd5e1` (slate-300) | Badges & timestamps (High Contrast ≥4.5:1) |
| `--status-emerald-bg` | `#ecfdf5` (emerald-50) | `rgba(6, 78, 59, 0.4)` | Present / Excellent badge background |
| `--text-emerald` | `#047857` (emerald-700) | `#34d399` (emerald-300) | Present / Excellent badge text (≥4.5:1) |
| `--status-amber-bg` | `#fffbeb` (amber-50) | `rgba(120, 53, 15, 0.4)` | Late / Warning badge background |
| `--text-amber` | `#b45309` (amber-700) | `#fcd34d` (amber-300) | Late / Warning badge text (≥4.5:1) |
| `--status-rose-bg` | `#fef2f2` (rose-50) | `rgba(153, 27, 27, 0.4)` | Absent / Risk badge background |
| `--text-rose` | `#be123c` (rose-700) | `#fca5a5` (rose-300) | Absent / Risk badge text (≥4.5:1) |

---

## 2. Component Interface State Contracts

### NavItemContract
Represents navigation items displayed in sidebars, bottom navigation bars, and mobile drawers.

```typescript
type NavItemContract = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
  ariaLabel?: string;
  minTouchSize: "44px"; // Enforced by layout
};
```

### StatCardContract
Represents metrics displayed on Teacher and Student dashboards.

```typescript
type StatCardContract = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeText?: string;
  badgeColor?: string; // Must map to semantic token class
  tabIndex?: number;  // Keyboard accessible if interactive
  role?: "button" | "region";
};
```

---

## 3. Data Integrity & Authorization Relationships (Constitution Principle I)

- **Teacher Context Scope**: Teacher queries for Homeroom (`src/app/teacher/homeroom`), Journal (`src/app/teacher/journal`), Attendance (`src/app/teacher/attendance`), and Grades (`src/app/teacher/grades`) MUST strictly validate `session.user.id` against Prisma `Class.homeroomTeacherId` or `TeacherSubject.teacherId` at the server action boundary before returning dataset fields.
- **Student Context Scope**: Student queries for Grades (`src/app/student/grades`), Attendance (`src/app/student/attendance`), and Schedule (`src/app/student/schedule`) MUST strictly constrain results to `session.user.studentId`. Client components NEVER receive unauthorized sibling data.
EOF