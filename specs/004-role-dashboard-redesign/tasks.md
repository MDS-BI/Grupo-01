---
description: "Generated tasks for feature 004-role-dashboard-redesign"
---

# Tasks: Rediseño visual de paneles por rol

**Input**: `specs/004-role-dashboard-redesign/spec.md`

## Format

- `- [ ] [TaskID] [P?] [Story] Description with file path`
- Usa `[P]` solo cuando edits archivos distintos.
- IDs secuenciales T001-TNNN.

## Phase 1: Setup

- [X] T001 Ejecutar `npm run check` como línea base.
- [X] T002 [P] Añadir `@fontsource/ibm-plex-sans` a `package.json` e instalar dependencia (`npm install`).

## Phase 2: Foundational (styles/system identity)

- [X] T003 [P] Añadir tokens tipográficos/de color en `src/styles.css` (`--font-sans`, `font-variant-numeric`, IBM Plex Sans, acento `#0f62fe`).

## Phase 3: User Story 1 - Admin Panel without financial data (P1)

**Independent test**: Admin sees greeting/month, 2 payroll cards, 3 payroll metrics; no financial data/labels/sections.

- [X] T004 [US1] Add failing tests: admin Panel no financial data, shell brand/avatar, navigation (`tests/integration/us3-dashboard.test.js`, `tests/integration/us13-shell.test.js`, `tests/integration/navigation-menu.test.js`).
- [X] T005 [US1] Implement role-aware dashboard gating so admin panel shows payroll only; no ACCESS_MATRIX changes (`src/app.js`).
- [X] T006 [US1] Update `index.html` with `#dashboard-greeting`, `#dashboard-month`, `#admin-payroll-summary` and remove legacy finance visual containers (`index.html`).
- [X] T007 [US1] Implement `computeAdminPayrollSummary(entities, accessRecords, settlements, { today = todayISO() } = {})` in `src/components/dashboard.js`.
- [X] T008 [US1] Render payroll summary + 2 payroll cards with styles; ensure no finance text (`src/components/dashboard.js`, `src/styles.css`).

## Phase 4: User Story 2 - Finance indicators with state (P1)

**Independent test**: Finance sees 4 cards, no “Deuda pendiente”, variation colored by semantics, tooltips with formulas.

- [X] T009 [US2] Add failing tests for four indicators, state colors, variation text, formulas tooltip, FR-047 absence of Deuda (`tests/integration/us3-dashboard.test.js`, `tests/integration/us14-dashboard-summary.test.js`).
- [X] T010 [US2] Implement `computeFinanceIndicators(documents, entities, movements, { now, previousValue })` using existing data-model formulas (`src/finance.js`).
- [X] T011 [US2] Render `#finance-indicators-section` with four exact indicators and labels (`index.html`, `src/components/dashboard.js`).
- [X] T012 [US2] Add failing tests for previousValue: “sin dato anterior”, “nuevo” when previousValue is 0, and favorable/unfavorable colors by indicator; then implement variation semantics/tooltips (`tests/unit/cashflow.test.js`, `tests/integration/us3-dashboard.test.js`, `src/components/dashboard.js`).

## Phase 5: User Story 3 - Identity visual common (P1)

**Independent test**: System name is “Contabilidad y Finanzas” in topbar/title; avatar shows profile initials, not system/module initials.

- [X] T013 [US3] Add failing tests: `moduleName` and `<title>` = “Contabilidad y Finanzas”; `resolveSessionProfile` initials for worker (“RF”) and role initials for admin/finance (“A”, “F”); topbar/document.title + avatar show profile initials (`tests/unit/module-config.test.js`, `tests/unit/session.test.js`, `tests/integration/us13-shell.test.js`).
- [X] T014 [US3] Set `moduleName` in `src/module-config.js` and `<title>` in `index.html`.
- [X] T015 [US3] Implement pure `resolveSessionProfile(session, { entities })` in `src/session.js` per contracts (person/role initial rules).
- [X] T016 [US3] Update `src/components/shell.js` + `src/app.js` so avatar/topbar use derived initials; import `@fontsource/ibm-plex-sans` CSS in `src/main.js` before `initApp`.
- [X] T017 [US3] Add greeting/month header in Panel (`index.html`, `src/components/dashboard.js`).

## Phase 6: User Story 4 - Finance trend and alerts (P2)

**Independent test**: Finance sees SVG trend of last 6 months and alerts beside it; worker/admin do not see trend.

- [X] T018 [US4] Add failing tests for trend SVG (`role=”img”`, six months, ingested labels, alerts) in `tests/integration/us3-dashboard.test.js`.
- [X] T019 [US4] Implement `computeMonthlyIncomeExpense(documents, entities, movements, { months = 6, now = new Date() } = {})` in `src/cashflow.js`.
- [X] T020 [US4] Add unit test in `tests/unit/cashflow.test.js` for six consecutive months, zero-activity months in 0, only paid documents.
- [X] T021 [US4] Render `#dashboard-trend-section` SVG and `#dashboard-alerts-section` with negative cash and overdue alerts (`src/components/dashboard.js`).
- [X] T022 [US4] Render `#dashboard-movements-section` with latest 5 movements + “Ver todos” (`src/components/dashboard.js`).

## Phase 7: User Story 5 - Compact quick actions + guide banner (P2)

**Independent test**: Finance has max 4 quick actions; guide banner works per role and dismissal is session/role scoped.

- [X] T023 [US5] Add failing tests for 4 finance quick actions, guide banner and dismissal (`tests/integration/navigation-menu.test.js`, `tests/integration/tutorial.test.js`).
- [X] T024 [US5] Implement guide banner helpers and DOM IDs for admin/finance/worker (`src/session.js`, `src/app.js`, `index.html`).
- [X] T025 [US5] Update finance quick actions to exactly 4 IDs/labels (`src/components/dashboard.js`, `index.html`).

## Phase 8: User Story 6 - Worker view clarity (P2)

**Independent test**: Worker view shows name, readable period, big `$` amount, conditional breakdown, history amounts.

- [X] T026 [US6] Add failing tests for worker view readability, formatted amounts, period, breakdown conditional (`tests/integration/payroll-worker.test.js`).
- [X] T027 [US6] Update `src/components/payroll-worker.js` to use `formatCurrencyCLP` and readable period (`src/components/payroll-worker.js`).
- [X] T028 [US6] Make breakdown render only when base/discounts/bonuses ≠ 0 (`src/components/payroll-worker.js`).

## Phase 9: Polish

- [ ] T029 Ejecutar `npm run check` completo.
- [ ] T030 Verificar con `git diff` que no cambian `specs/001`, `specs/002`, `specs/003` ni `data-model.md` (FR-003).
- [ ] T031 Verificación manual en el navegador según `quickstart.md` con roles administrador, finanzas y trabajador a 1366x768.
- [ ] T032 Actualizar `README.md`: estado del proyecto, registro de decisiones para 004, nota de ejecutar `npm install` por la nueva dependencia.

## Format validation

- All tasks follow `- [ ] T### [P?] [Story]` with exact file paths.
- User story tasks have `[US1]`–`[US6]` labels; setup/polish use no story labels.
- `[P]` used only where files differ.
