# Interface Contract: Design Tokens & Accessibility Guidelines

**Feature**: `001-redesign-teacher-student-ui`
**Date**: 2026-08-24

## 1. CSS Utility & Token Contract

All teacher and student pages MUST adhere to the following token interface contract:

### A. Touch Target Standard
- **Class Requirement**: All interactive targets (`<button>`, `<a>`, `<input>`, `<select>`, tab triggers) MUST have a rendered bounding box of at least **44px × 44px**.
- **Implementation**:
  ```html
  <!-- BAD: Touch area only ~32px high -->
  <button className="px-3 py-1 text-xs">Filter</button>

  <!-- GOOD: Min touch area guaranteed 44px -->
  <button className="px-3.5 py-2.5 min-h-[44px] min-w-[44px] text-xs font-bold flex items-center justify-center">Filter</button>
  ```

### B. High Contrast Text Baseline (WCAG AA 4.5:1)
- **Rules**:
  - `text-slate-400` / `text-gray-400` on light backgrounds (`bg-white`, `bg-slate-50`, `bg-blue-50`, `bg-indigo-50`) is STRICTLY PROHIBITED.
  - Subtitles and secondary captions MUST use `text-slate-600` or `text-slate-700` on light surfaces, or `text-slate-300` on dark surfaces.
  - Text on colored badges MUST use a darker shade of that color family (e.g. `bg-emerald-50 text-emerald-800 border-emerald-200`).

### C. Mobile Drawer Accessibility Contract
```html
<div
  role="dialog"
  aria-modal="true"
  aria-label="Mục lục điều hướng"
  className="lg:hidden fixed inset-0 z-50"
>
  <!-- Backdrop -->
  <div
    className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
    onClick={closeDrawer}
    aria-hidden="true"
  />

  <!-- Drawer Body -->
  <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white flex flex-col focus-trap">
    <button
      onClick={closeDrawer}
      aria-label="Đóng mục lục điều hướng"
      className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center"
    >
      <X className="w-5 h-5" aria-hidden="true" />
    </button>
    ...
  </div>
</div>
```

### D. Motion Reduction Contract
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up,
  .animate-float,
  .animate-float-slow,
  .animate-pulse-glow,
  .animate-shimmer,
  .bell-swing,
  .animate-modal-pop,
  .animate-slide-in {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
```

### E. Focus Ring Contract
```css
:focus-visible {
  outline: 3px solid #4f46e5 !important;
  outline-offset: 2px !important;
  border-radius: 8px !important;
}
```
EOF