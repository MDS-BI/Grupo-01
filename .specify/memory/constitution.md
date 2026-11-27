<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0
- Modified principles: III. User Experience Consistency → III. User Experience Consistency (expanded only: official «Refreshing Summer Fun» palette, semantic color rules, and colorblind accessibility)
- Added sections: None
- Removed sections: None
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md (read at runtime; not modified in this amendment)
- Prior history: Template → 1.0.0 added four principles for code quality, testing standards, user experience consistency, and performance requirements, plus Quality Standards and Development Workflow sections; 1.1.0 expanded Principle III visual identity guidance.
- Follow-up TODOs: spec 004 and its implementation MUST be updated to use the new «Refreshing Summer Fun» palette.
-->

# My Project Constitution

## Core Principles

### I. Code Quality & Maintainability
All production code MUST be readable, modular, and consistent with the project's agreed style and architecture. Changes MUST prefer clear naming, small focused functions, and straightforward control flow over clever shortcuts. When abstractions are introduced, they MUST solve a clear need and be documented where the intent is non-obvious.

### II. Test-First & Verification
User-visible behavior and any change to business logic MUST be covered by automated tests before or alongside implementation. The default expectation is unit tests for logic, integration tests for workflow boundaries, and end-to-end coverage for critical user journeys. Features MUST NOT be considered complete until relevant tests pass and regressions are explicitly checked.

### III. User Experience Consistency
Product changes MUST preserve a consistent experience across screens, states, and interactions. Interfaces MUST follow established patterns for layout, terminology, feedback, loading states, empty states, validation, and error handling. Accessibility and clarity are mandatory; users MUST be able to understand, navigate, and recover from errors without ambiguity.

- A single visual identity MUST be used: system name «Contabilidad y Finanzas», the official «Refreshing Summer Fun» palette, unchanged neutral grays for background, cards, text, secondary text, and borders, and locally bundled IBM Plex Sans (no internet dependency) with `font-variant-numeric: tabular-nums` for every amount. Spacing and styling details MUST be defined with the `frontend-design` skill and applied identically across the entire module.
- The official palette MUST be applied as follows: navy `#023047` for accents, the top banner, and primary buttons with white text; blue `#219EBC` for favorable states and charts; light blue `#8ECAE6` for support and information; yellow `#FFB703` for requires-action states, always as a background with navy `#023047` text; orange `#FB8500` for unfavorable or critical states. Text on light backgrounds MUST use `#126782` for favorable states and `#A84F00` for unfavorable or critical states.
- Color MUST communicate state and NEVER be decorative: blue = favorable or positive, yellow = requires action, orange = unfavorable or critical, neutral = normal. Red/green pairs MUST NOT be used.
- Color MUST NOT be the sole carrier of information; every state MUST also be conveyed through text, an icon, or a `▲`/`▼` arrow. Normal text MUST meet a minimum contrast ratio of 4.5:1, and large text and graphical elements MUST meet 3:1 (WCAG 2.1 AA). The palette MUST be verified under protanopia, deuteranopia, and tritanopia simulations.
- Each role's dashboard MUST show only the information authorized by the current permission matrix; a dashboard MUST NOT display data from a module the role cannot access.
- Primary indicators MUST be visible without scrolling at 1366x768.
- All amounts MUST be displayed in Chilean pesos with the `$` sign and thousands separators; amount columns in tables MUST be right-aligned. Periods MUST be rendered as readable text (e.g., «noviembre 2026»).
- Calculation formulas MUST appear in tooltips, never in visible labels.

Rationale: A single visual identity, colorblind-safe semantic color, role-scoped information, and predictable formatting reduce cognitive load and prevent misinterpretation of financial data.

### IV. Performance & Reliability
Features MUST meet the performance budgets defined for the project and remain responsive under expected usage. Critical paths MUST avoid unnecessary round-trips, blocking work, and avoidable re-rendering or computation. When trade-offs are required, they MUST be justified with evidence from profiling, load expectations, or user impact.

## Quality Standards
The team MUST use linting, formatting, and static analysis tooling for the codebase, and unresolved warnings that affect correctness or maintainability MUST be addressed before release. Documentation MUST be updated when behavior, configuration, or public contracts change. Complex or risky changes MUST include a brief rationale in the implementation plan or pull request.

## Development Workflow
Every change MUST follow a small, reviewable increment with clear acceptance criteria, and each pull request MUST verify the relevant tests, quality checks, and user-facing behavior. Features that affect user experience or performance MUST include explicit validation steps in the plan and review notes. Work that introduces technical debt or exception handling MUST be documented so future contributors can reason about the trade-off.

## Governance
This constitution supersedes ad-hoc quality expectations for this project. Amendments require a documented rationale, updates to affected templates and plans, and review by the maintainers before adoption. Compliance is reviewed during planning, implementation review, and release readiness; deviations MUST be explicitly justified and tracked.

**Version**: 1.2.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-11-26
