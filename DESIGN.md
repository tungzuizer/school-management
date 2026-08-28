# DESIGN.md — System Visual Architecture

## Product Identity

**Hệ thống Quản lý Trường học** (School Management System) — Modern EdTech educational platform connecting school staff, teachers, vice-principals, principals, subject heads, ward/district education offices, and department admins.

- **Mode:** Operate
- **Audience:** School staff & administrators (age 22–60) in Vietnamese institutional settings
- **Typeface:** Be Vietnam Pro (Google Fonts — Latin + Vietnamese, weights 300–800)
- **Language:** Vietnamese throughout

---

## Active Direction: Pristine Luminous Glassmorphic (Bright & Modern Light Edition)

Used on surface: `/login`

### Thesis
A bright, clean, porcelain-pearl workspace ("Sáng sủa & Hiện đại") designed for high clarity and daytime comfort. It combines modern glassmorphism (`backdrop-filter: blur(20px)`) with subtle ambient light flares, interactive light particles, and soft cursor spotlight tracking.

### Own-World Properties
- **Bright Porcelain Background:** Clean light background (`#F8FAFC` → `#F1F5F9` → `#E2E8F0` gradient) with interactive HTML5 Canvas light particles.
- **Cursor Spotlight Glow:** Soft ambient radial light spotlight (`rgba(16, 185, 129, 0.08)`) following mouse movement in real time.
- **Pure White Glassmorphic Card:** `rgba(255, 255, 255, 0.88)` with subtle translucent border (`rgba(226, 232, 240, 0.8)`) and multi-layer soft drop shadow (`box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08)`).
- **Interactive 3D Tilt:** Smooth cursor-following card tilt (perspective 1000px, max ±3deg) with localized specular highlight overlay (`--mouse-x`, `--mouse-y`).
- **Left Panel (Brand Highlight):** Subtle soft mint/sky glass gradient (`linear-gradient(145deg, #F0FDF4 0%, #EFF6FF 50%, #F8FAFC 100%)`) featuring feature badges and crisp branding.
- **Form Focus State:** Input fields use white fill with Emerald border (`#10B981`) and soft 3.5px halo shadow (`rgba(16, 185, 129, 0.15)`).
- **Primary CTA:** Vibrant Emerald linear gradient (`linear-gradient(135deg, #10B981 0%, #059669 100%)`) with elevated soft shadow.

---

## Color Palette

| Token | Hex / Value | Role |
|---|---|---|
| `porcelain-50` | `#F8FAFC` | Main light background base |
| `porcelain-100` | `#F1F5F9` | Canvas gradient transition |
| `emerald-600` | `#10B981` | Primary brand accent & active focus border |
| `emerald-700` | `#059669` | Primary CTA button gradient end |
| `emerald-50` | `#F0FDF4` | Soft badge & panel fill |
| `indigo-500` | `#6366F1` | Secondary light particle connections |
| `slate-900` | `#0F172A` | Primary headings, dark body text |
| `slate-700` | `#334155` | Input labels |
| `slate-500` | `#64748B` | Subtitles, muted text |
| `slate-200` | `#E2E8F0` | Input borders & card divider |

---

## Layout & Responsive Strategy

- **Responsive Split Grid:** 12-column glass container on desktop (5 cols Brand/Features + 7 cols Form).
- **Interactive Canvas System:** React `useEffect` + `requestAnimationFrame` loop with resize handler and cursor collision detection.
- **Accessibility & Contrast:** High contrast text on light backgrounds (WCAG AAA compliant for labels and input text).

---

## Preserved Functional Logic
- `next-auth/react` (`signIn`, `getSession`, `useSession`)
- `redirectByRole()` — routing to 9 distinct role dashboards:
  `SUPER_ADMIN`, `DEPARTMENT_ADMIN`, `DISTRICT_ADMIN`, `WARD_ADMIN`, `ADMIN`, `VICE_PRINCIPAL`, `SUBJECT_HEAD`, `TEACHER`, `STUDENT`
- URL param detection (`?registered=1&email=...`) with success notice banner
- Show/hide password visibility toggle
- `<Suspense>` boundary wrapper
