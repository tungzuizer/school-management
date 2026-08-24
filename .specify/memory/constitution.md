<!--
### Sync Impact Report
- Version change: 1.0.0 -> 1.0.0
- Ratification status: Validated existing project constitution v1.0.0.
- Principles defined:
  - Principle I: Role-Based Access Control & Security (RBAC)
  - Principle II: Type Safety & Schema Validation
  - Principle III: Multi-Tier Educational Management
  - Principle IV: Data Integrity & Auditability
  - Principle V: Server-First Performance & Simplicity
- Sections added: Technical Constraints & Security Standards, Development & Review Workflow
- Follow-up TODOs: None
-->

# School Management System Constitution

## Core Principles

### I. Role-Based Access Control & Security (RBAC)
All features, API endpoints, server actions, and database queries MUST enforce strict hierarchical authorization guards based on defined roles (DEPARTMENT_ADMIN, WARD_ADMIN, ADMIN, VICE_PRINCIPAL, TEACHER, STUDENT). Data access must be tightly scoped to authorized management branches (WARD, THPT) and school scopes. Security checks must fail securely at the server boundary before executing business logic.

### II. Type Safety & Schema Validation
Full-stack strict type safety MUST be maintained across the application. All user inputs, API request payloads, and form submissions MUST be validated at runtime using Zod schemas matching TypeScript definitions. Database interactions must leverage strongly typed Prisma Client models without untyped `any` fallbacks.

### III. Multi-Tier Educational Management
The user interface and workflows MUST cleanly support multi-tier Vietnamese educational governance across primary, secondary, high school, and multi-level institutions (TIEU_HOC, THCS, THPT, LIEN_CAP). UI components MUST provide accessible, intuitive, and responsive experiences tailored specifically to the operational needs of each user role.

### IV. Data Integrity & Auditability
System-critical domain entities—including student grades, attendance logs, teacher assignments, and institutional records—MUST maintain strict relational integrity. Operations modifying academic or organizational records MUST be idempotent, deterministic, and validate business constraint boundaries (e.g., valid grade types, school year transitions) before committing.

### V. Server-First Performance & Simplicity
Architectural solutions MUST prioritize Next.js App Router server components, efficient Prisma query selection, and minimal client-side state. Complex client abstractions or external libraries MUST NOT be introduced when native platform or framework capabilities suffice. Keep dependencies lean and performant.

## Technical Constraints & Security Standards

The platform is built on Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, NextAuth, and Tailwind CSS.
- **Database Access**: All data persistence MUST route through Prisma ORM using standard migrations. Raw query execution is prohibited unless authorized for performance-critical analytics.
- **Authentication & Sessions**: NextAuth v4 handles session management. Session data must be validated server-side for sensitive operations; client-side session state must never be trusted for access control decisions.
- **Styling & UI Components**: Tailwind CSS v4 and standard Lucide icons MUST be used for UI layout and visual styling. Custom CSS rules must be kept minimal and isolated.

## Development & Review Workflow

All code contributions MUST adhere to a spec-driven development cycle:
1. **Spec & Task Alignment**: Features and bug fixes MUST align with documented specification artifacts (`spec.md`, `plan.md`, `tasks.md`).
2. **Quality Gates**: Code MUST pass TypeScript compilation (`tsc`), ESLint checks, and Prisma validation prior to merge.
3. **Code Review Expectations**: Code reviews MUST verify role-based authorization enforcement, input validation completeness, and adherence to project architecture guidelines before approving pull requests.

## Governance

This Constitution is the supreme policy document for the School Management System codebase.
- **Supremacy**: Constitution guidelines supersede informal conventions or ad-hoc practices.
- **Amendments**: Amendments require explicit documentation of rationale, a proposed version bump according to SemVer rules, and review of downstream architectural impact.
- **Versioning Policy**:
  - MAJOR version bumps indicate breaking changes to governance principles or major architectural policy shifts.
  - MINOR version bumps indicate new principles, added sections, or materially expanded operational guidelines.
  - PATCH version bumps indicate wording refinements, clarifications, or non-semantic updates.
- **Compliance**: All proposed code changes, specifications, and architecture decisions MUST comply with the active version of this Constitution.

**Version**: 1.0.0 | **Ratified**: 2026-08-24 | **Last Amended**: 2026-08-24
