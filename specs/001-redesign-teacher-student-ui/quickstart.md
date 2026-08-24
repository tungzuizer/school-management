# Quickstart Validation Guide: Teacher & Student UI Redesign

**Feature**: `001-redesign-teacher-student-ui`
**Date**: 2026-08-24

This guide documents runnable validation scenarios to prove the teacher & student UI redesign works end-to-end and meets all accessibility, performance, and constitutional standards.

---

## 1. Prerequisites & Environment Setup

1. Node.js environment installed.
2. Dependencies installed: `npm install`.
3. Development server running: `npm run dev`.

---

## 2. Automated Detector Scan Validation

Run the bundled Impeccable detector to verify zero high-severity anti-patterns:

```bash
node .claude/skills/impeccable/scripts/detect.mjs src/app/teacher src/app/student
```

### Expected Outcome:
- 0 `border-accent-on-rounded` warnings on rounded cards.
- 0 `gray-on-color` contrast warnings on tinted card backgrounds.
- 0 `ai-color-palette` hardcoded Indigo gradient alerts.
- 0 `bounce-easing` warnings.

---

## 3. Manual Scenario Validation

### Scenario A: Mobile Drawer Accessibility & Body Scroll Lock
1. Open Chrome DevTools and switch to Mobile Device Emulation (e.g. iPhone 14, 390px width).
2. Navigate to `http://localhost:3000/teacher/dashboard`.
3. Click the "Mục lục" button to open the mobile drawer.
4. **Validation Check**:
   - Verify page background underneath CANNOT be scrolled by touch or wheel.
   - Press `Tab` repeatedly: verify focus cycles exclusively inside the drawer panel (Focus Trap).
   - Verify Screen Reader announces `dialog` with `aria-label="Mục lục điều hướng"`.
   - Click backdrop or press `Escape`: verify drawer closes and page scrolling is restored.

### Scenario B: Touch Target Inspection (≥44px)
1. Inspect bottom navigation bar (`bottomTabs`) on `http://localhost:3000/student/dashboard`.
2. Inspect filter tab buttons on `http://localhost:3000/student/grades`.
3. **Validation Check**:
   - Measured computed width & height for all clickable elements is ≥ 44px × 44px.

### Scenario C: WCAG AA Text Contrast Audit
1. Open Lighthouse / Chrome DevTools Accessibility Audit on `http://localhost:3000/teacher/homeroom` and `http://localhost:3000/student/dashboard`.
2. Run contrast audit.
3. **Validation Check**:
   - 0 contrast ratio failures reported across text labels, status badges, and secondary text.

### Scenario D: Motion Reduction Verification
1. Turn on system `prefers-reduced-motion: reduce` in OS settings or DevTools Rendering drawer (Emulate CSS media feature `prefers-reduced-motion: reduce`).
2. Reload `http://localhost:3000/student/dashboard`.
3. **Validation Check**:
   - Floating elements, bell swing, and glowing pulses remain static without jarring movement.

---

## 4. Re-run Audit Score Benchmark

Run the full audit command after implementation:

```bash
/impeccable audit
```

### Target Benchmark:
- Accessibility Score: **4/4**
- Performance Score: **4/4**
- Responsive Design Score: **4/4**
- Theming Score: **3/4** or **4/4**
- Implementation Integrity Score: **4/4**
- **Total Audit Score**: **18-20/20** (Rating Band: **Excellent**)
EOF