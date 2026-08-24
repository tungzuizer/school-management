# Research & Architectural Decisions: Redesign Admin & Principal Portal UI

## Decision 1: Unified Layout & Navigation Boundary
- **Decision**: Keep Admin navigation within the `AdminLayout` context while allowing seamless switching between global Executive views and specific School/Ward metrics.
- **Rationale**: Switching out of `AdminLayout` to `WardLayout` or `DepartmentLayout` causes a jarring visual context shift for top-level administrators. Preserving the unified dark-slate header/sidebar keeps the executive context intact.
- **Alternatives Considered**: Opening sub-modules in new browser tabs (rejected: disrupts user flow).

## Decision 2: WCAG AA Color Palette & Anti-Pattern Cleanup
- **Decision**: Replace decorative text gradients (`bg-clip-text`), 4px left border accents on rounded cards (`border-l-4`), and low-contrast text (`text-slate-400` on light backgrounds) with solid high-contrast tokens.
- **Rationale**: Complies with Constitution v1.0.0 and eliminates recognizable AI design smells.
- **Alternatives Considered**: Pure monochrome theme (rejected: lacks visual hierarchy for executive metrics).

## Decision 3: Atomic Session State Synchronization
- **Decision**: Handle NextAuth `jwt` callback `trigger === "update"` to allow client-side `updateSession()` to modify `mustChangePassword` and role properties in the JWT cookie without requiring re-authentication.
- **Rationale**: Fixes infinite password prompt loop cleanly.
