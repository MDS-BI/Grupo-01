---
description: "Generated tasks for feature 004-role-dashboard-redesign"
---

# Tasks: Rediseño visual de paneles por rol

**Input**: Design documents from `/specs/004-role-dashboard-redesign/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when files differ and no prior task in same phase is incomplete.
- **[Story]**: Required for user story phases. Setup and Foundational use no story label.
- Exact file paths are included in each task description.

## Phase 1: Setup (Shared Infrastructure)

**Goal**: Prepare project skeleton and make current architecture immediately consumable by design artifacts.

**Independent Test**: Project structure matches plan; dev/build/check scripts exist and run from `npm run check`.

- [ ] T001 Create project structure per implementation plan: `index.html`, `package.json`, `src/main.js`, `src/app.js`, `src/styles.css`, `src/module-config.js`, `src/session.js`, `src/components/shell.js`, `src/components/dashboard.js`, `src/components/payroll-worker.js`.
- [ ] T002 Configure Vite 8.2.1 and npm scripts in `package.json`: `dev`, `build`, `preview`, `test`, `lint`, `format`, `format:check`, `check`.
- [ ] T003 [P] Add `@fontsource/ibm-plex-sans` and import `latin-400.css`, `latin-500.css`, `latin-600.css`, `latin-700.css` from `src/main.js` before `initApp`.

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Add shared identity and session foundations required by all dashboard phases.

**Independent Test**: Admin and finance see system name, derivatives profile, and finance access; worker remains on payroll-worker navigation only.

- [ ] T004 [P] Add `ROLE_LABELS` shared map and update `userConfig.moduleName` to `Contabilidad y Finanzas` in `src/module-config.js`.
- [ ] T005 [P] Add pure `resolveSessionProfile(session, { entities })` resolver in `src/session.js`; rules from `contracts/session-display.md` lines 26-73.
- [ ] T006 [P] Update `src/components/shell.js` to set `#brand-name` to `Contabilidad y Finanzas` and render `#brand-logo` with derived `SessionProfile.initials`; remove system monogram use from shell.
- [ ] T007 [P] Set `<title>` to `Contabilidad y Finanzas` in `index.html:6` and use that value in app initialization.
- [ ] T008 Implement integration of `resolveSessionProfile` in `src/app.js` for shell, dashboard header, and worker view, using session + `loadEntities()`.
- [ ] T009 [P] Add visual tokens for `#0f62fe`, light gray background, white cards, IBM Plex Sans, and `font-variant-numeric: tabular-nums` in `src/styles.css`.

## Phase 3: User Story 1 - Panel del Administrador Without Financial Data (P1) 🎯 MVP

**Goal**: Remove financial data/access from administrator Panel and show two payroll cards plus payroll summary.

**Independent Test**: Admin Panel shows `#dashboard-greeting`, `#dashboard-month`, `#admin-payroll-summary` with three metrics and two quick actions; no finance labels/sections/alerts appear.

### Implementation for User Story 1

- [ ] T010 [P] Add role-aware dashboard gating in `src/app.js` so admin sees dashboard, finances see panel, and worker does not.
- [ ] T011 [P] Update `index.html` with `#dashboard-greeting`, `#dashboard-month`, `#admin-payroll-summary`, guide banner IDs, and remove legacy `summary-saldo`, `summary-deuda`, `summary-caja`, `stat-entities`, `stat-documents`, `kpi-*` visual layout from the admin surface where still present.
- [ ] T012 [US1] Implement `computeAdminPayrollSummary(entities, accessRecords, settlements, { today = todayISO() } = {})` in `src/components/dashboard.js`, respecting FR-009 and FR-010.
- [ ] T013 [US1] Render `#admin-payroll-summary` with three metric cards, empty-state text, and styles in `src/styles.css`.

**Checkpoint**: Admin Panel contains exactly two payroll cards, three payroll summary metrics, and zero financial indicators/alerts.

## Phase 4: User Story 2 - Finance Indicators With State (P1) 🎯

**Goal**: Replace vague summary cards with one unified four-indicator row and contract-defined visual state/tooltips.

**Independent Test**: Finances see four indicators, no "Deuda pendiente", variation text follows contracts, tooltips contain formulas.

### Implementation for User Story 2

- [ ] T014 [P] Implement `computeFinanceIndicators(documents, entities, movements, { now = new Date(), previousDate = null } = {})` in `src/finance.js` using `src/summary.js`, `src/tracking.js`, and `src/cashflow.js`.
- [ ] T015 [US2] Render `#finance-indicators-section` with four cards in exact order from `contracts/dashboard-ui.md` lines 71-100; remove old `Deuda pendiente`.
- [ ] T016 [US2] Apply state color logic: negative cash `.is-negative`, overdue `.is-action`, other sections neutral; never show state only by color.
- [ ] T017 [US2] Implement variation display per `contracts/dashboard-ui.md` lines 86-98: `sin dato anterior`, `<flecha> nuevo`, or `<flecha> <porcentaje> %`; colors by indicator semantics.
- [ ] T018 [US2] Implement formula tooltips labeled with ⓘ and values-only visible labels.

**Checkpoint**: Finance Panel has exactly four cards, no duplicate financial sections, and 0 visible-formula text failures.

## Phase 5: User Story 3 - Trend and Alerts for Finance (P2)

**Goal**: Add own-SVG trend and alerts beside the finance metrics.

**Independent Test**: Finances see six-month SVG, alerts beside it, and latest movements table; admins/workers do not see trend/alerts.

### Implementation for User Story 3

- [ ] T019 [P] Add `computeMonthlyIncomeExpense(documents, entities, movements, { months = 6, now = new Date() } = {})` in `src/cashflow.js` per `contracts/trend-chart.md` lines 13-43.
- [ ] T020 [US3] Render `#dashboard-trend-section` SVG chart with `role="img"`, `<title>`, `<desc>`, six month labels, legend, and CLP-formatted labels; hide for admin/worker.
- [ ] T021 [US3] Render `#dashboard-alerts-section` with negative cash alert and overdue invoice alert from `computeFinanceIndicators`; links to `cashflow` and `tracking`.
- [ ] T022 [US3] Render `#dashboard-movements-section` with latest five movements and `Ver todos` link; empty state handled per existing routes.

**Checkpoint**: Trend chart, alerts, and movement table are finance-only and satisfy FR-021 to FR-025.

## Phase 6: User Story 4 - Compact Quick Actions and Initial Guide (P2)

**Goal**: Limit finance quick actions to four, keep guide banner for all roles in one view, and make dismissal session/role scoped.

**Independent Test**: Finance shows exactly four quick actions; admin/finance/worker see guide banner; dismissal persists only for same role/session.

### Implementation for User Story 4

- [ ] T023 [P] Implement guide banner state helpers in `src/session.js`: `isGuideDismissed(role)`, `dismissGuide(role)`, key `erp.guideDismissed.<role>`; pure `canAccessGuideBanner(session)`.
- [ ] T024 [US4] Add `#guide-banner-dashboard` and `#guide-banner-worker` in `index.html` with `#guide-open-*` and `#guide-dismiss-*`; ensure they are visible for admin, finance, and worker.
- [ ] T025 [US4] Update `src/app.js` to show guide for all roles in their active view and connect open/dismiss to tutorial/session state.
- [ ] T026 [US4] Update finance quick actions to four per `contracts/dashboard-ui.md` lines 102-114; verify no duplicate/truncated labels.

**Checkpoint**: Guide banner exists for all roles; dismissal only hides for same role during session; finance quick action count is four.

## Phase 7: User Story 5 - Clear Worker View (P2)

**Goal**: Make worker view legible: visible name, readable period, highlighted net amount, conditional breakdown, and formatted history.

**Independent Test**: Worker sees name, readable period, big `$` amount, breakdown only when values exist, and formatted history; worker has no finance content.

### Implementation for User Story 5

- [ ] T027 [P] Update `src/components/payroll-worker.js` to use `formatCurrencyCLP` for amounts and readable period labels.
- [ ] T028 [US5] Render `#payroll-worker-name`, `#payroll-worker-period`, `#payroll-worker-amount`, and history with readable CLP values.
- [ ] T029 [US5] Make breakdown render only when `sueldoBase`, `descuentos`, or `bonos` are non-zero; hide table when all values are zero.
- [ ] T030 [US5] Integrate guide banner and role-specific header in worker view.
- [ ] T031 [US5] Update `src/app.js` route matrix so worker cannot access `#view-dashboard` or finance modules.

**Checkpoint**: Worker view passes FR-031 to FR-036 and `#payroll-worker-amount` is the largest visible element.

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cross-artifact verification and cleanup after user stories.

- [ ] T032 [P] Update `plan.md` to remove “tasks.md se genera después” note and point to generated `tasks.md`.
- [ ] T033 Run `npm run check` and fix all errors.
- [ ] T034 [P] Run manual or automated validations per `quickstart.md`, updating it only if observations are outdated.
- [ ] T035 Verify `tasks.md` against `spec.md`, `plan.md`, `data-model.md`, and `contracts/` using `/speckit-analyze` in a future step if desired.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. Independent test from US2.
- **User Story 2 (P1)**: May start after Foundational and shares finance indicators; can validate independently.
- **User Story 3 (P2)**: Depends on T014 `computeFinanceIndicators` and works after Foundational.
- **User Story 4 (P2)**: Independent after Foundational; shares session/guide helpers.
- **User Story 5 (P2)**: Independent after Foundational.
- **User Story 6 (visual identity)**: Integrated through Phase 2 (`T004`, `T006`, `T009`, `T029`) and applies to all story phases.

### Parallel Opportunities

- T003, T009 in Setup are parallel.
- T004, T005, T006, T007, T009 in Foundational are mostly parallel after project structure.
- T014 and T019 are parallel once data-model/contracts are stable.
- User Stories 3, 4, 5 can start in parallel after Foundational if stories are independent.

## Parallel Example: User Story 3

```bash
Task: "Add computeMonthlyIncomeExpense helper in src/cashflow.js"
Task: "Render #dashboard-trend-section SVG in src/components/dashboard.js"
Task: "Render #dashboard-alerts-section alerts in src/components/dashboard.js"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (blocking - identity, session, styles).
3. Complete Phase 3: Admin Panel (P1) and Finance indicators (P1).
4. **STOP and VALIDATE**: `npm run check` plus admin/finance manual/automated checks.
5. Continue Phase 5: Finance trend and worker view if P2 scope is approved.
