/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: UI components and Layouts needing sidebar controls (`src/components/layout/Header.tsx`, layouts).
 * 2. Uniqueness: Convenient hook re-export for sidebar state access.
 * 3. Schema: Re-exports `useSidebar` and `LayoutContextType` from `src/context/LayoutContext`.
 * 4. Verbatim User Instruction: "tôi muố menu có thể thu gọn và tách menu và giao diện chính độc lập giao diện khác nhau".
 */

export { useSidebar } from "@/context/LayoutContext";
export type { LayoutContextType } from "@/context/LayoutContext";
