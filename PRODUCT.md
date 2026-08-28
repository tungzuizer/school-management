# PRODUCT.md

## What this is

**Hệ thống Quản lý Trường học** — a Vietnamese school management platform connecting teachers, students, parents, school principals, vice-principals, department administrators, and ward/district education offices. The system handles: daily reports, attendance, lesson plans, grade transcripts, KPI reporting, class management, substitute dispatch, journals, finance, strategy tracking, and early-warnings.

## Audience

Vietnamese school staff and administrators. Primary daily users: teachers and school principals. Secondary: vice-principals, department heads, ward/district education officers. Tertiary: students and parents. Age range 22–60. Context: accessed at a school desk or on a personal phone, in a Vietnamese institutional setting.

## Mechanism

One login gates eight distinct role dashboards — each role sees its own operational world. The mechanism is **access to the right tools for the right person**, not a consumer experience.

## Brand commitments

- **Typeface:** Be Vietnam Pro (committed, self-hosted via Google Fonts). Latin + Vietnamese subsets. Weights 300–800.
- **Language:** Vietnamese throughout.
- **Logo:** `/logo.png` — institution owns it; treat as opaque asset.
- **Primary color identity:** has been blue/indigo range historically, though not pinned as a brand commitment — the redesign may revise it.

## What must remain

- All functional JS logic in `src/app/login/page.tsx`: `signIn`, `redirectByRole`, `useSession`, `getSession`, error/success banners, show/hide password toggle, `?registered=1&email=` query param handling, `<Suspense>` wrapper.
- Link to `/register`.
- `next-auth` integration.

## What the product is NOT

Not a consumer app. Not a SaaS product page. Not a student portal by default (students rarely log in). The primary user is a professional arriving to start their workday.

## Build platform

Next.js 16 + Tailwind v4 + React 19. No CDN assets — all styles inline or Tailwind classes.
