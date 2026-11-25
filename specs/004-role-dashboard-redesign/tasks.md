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

## Phase 8b: User Story 7 - Gestión de liquidaciones (P2)

**Independent test**: Admin sees readable table; edit form appears only on Edit; net amount auto-calculated and saved; Cancel closes.

- [X] T033 [US7] Add failing tests: readable period and invoice reference in table, form hidden until Edit, status select, removed fields, auto net amount, Pagada sets payment (`tests/integration/payroll-admin.test.js`).
- [X] T034 [US7] Render readable table: `formatPeriod`, right-aligned amount, status badge, `Compra <serie>-<folio>` (`src/format.js`, `src/components/payroll-list.js`, `src/app.js`).
- [X] T035 [US7] Rebuild edit form: hidden until Edit, Cancel, status select, conditional payment date, computed net amount (`index.html`, `src/components/payroll-form.js`).
- [X] T036 [US7] Style table and edit card consistently with the constitution (`src/styles.css`).

## Phase 9: Polish

- [X] T029 Ejecutar `npm run check` completo.
- [X] T030 Verificar con `git diff` que no cambian `specs/001`, `specs/002`, `specs/003` ni `data-model.md` (FR-003).
- [X] T031 Verificación manual en el navegador según `quickstart.md` con roles administrador, finanzas y trabajador a 1366x768.
- [X] T032 Actualizar `README.md`: estado del proyecto, registro de decisiones para 004, nota de ejecutar `npm install` por la nueva dependencia.

## Format validation

- All tasks follow `- [ ] T### [P?] [Story]` with exact file paths.
- User story tasks have `[US1]`–`[US6]` labels; setup/polish use no story labels.
- `[P]` used only where files differ.

## Phase 10: Clarificación 2026-11-25 - navegación del menú ☰ de finanzas (US5)

**Independent test**: El menú ☰ de finanzas muestra las ocho opciones en el orden indicado antes de «Guía de uso», cada una abre su vista, y los menús de administrador y trabajador siguen iguales.

- [X] T037 [P] [US5] Add failing integration test in `tests/integration/finance-hamburger-menu.test.js` asserting that the finance ☰ menu renders, before `#menu-guide`, exactly this ordered section: Terceros (`entities`), Facturas de venta (`invoice-sale`), Facturas de compra (`invoice-purchase`), Movimientos financieros (`movements`), Flujo de caja (`cashflow`), Seguimiento (`tracking`), Liquidaciones de sueldo (`payroll-admin`) and Buscar (`search`), and that each option calls `onNavigate` and opens its existing view, with «Registrar pago» reachable from «Liquidaciones de sueldo».
- [X] T038 [P] [US5] Add regression test in `tests/integration/navigation-menu.test.js` asserting that the admin menu remains `menu-guide`, `menu-access`, `menu-logout` and the worker menu remains `menu-guide`, `menu-logout` after the finance navigation section is introduced.
- [X] T039 [US5] Implement the finance-only navigation section in `index.html` and `src/components/shell.js`: add a placeholder before `#menu-guide`, render the eight items in the required order through existing `navLabel()`/`onNavigate` wiring and existing menu classes, and leave admin/worker menu branches and `ACCESS_MATRIX` untouched.

## Phase 11: Verificación final

- [X] T040 Run `npm run check` from repository root `package.json` after T039 and fix any lint, format or test failures caused by the new menu tasks.

## Phase 12: Ajuste visual del menú ☰ de finanzas (US5)

**Prueba independiente**: con sesión de finanzas, el menú ☰ muestra «Navegación» antes de las ocho opciones, un separador después de «Buscar» y luego «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión»; con sesiones de administrador y trabajador, el menú conserva su título, opciones y separador actuales sin mostrar «Navegación».

- [X] T041 [P] [US5] Agregar en `tests/integration/finance-hamburger-menu.test.js` una prueba que falle antes de la implementación: con sesión de finanzas, `#finance-menu-title` existe, contiene «Navegación», usa la clase `utilities-menu-title` y precede a `#finance-menu-navigation`; `#finance-menu-separator` existe, usa la clase `menu-separator` y aparece después de las ocho opciones y antes de `#utilities-menu-title`; `#utilities-menu-title` contiene «Utilidades & Sesión», precede a `#menu-guide` y todos estos elementos están visibles; ejecutar `npx vitest run tests/integration/finance-hamburger-menu.test.js` y confirmar el fallo por elementos ausentes.
- [X] T042 [P] [US5] Agregar en `tests/integration/navigation-menu.test.js` una prueba de regresión con sesiones de administrador y trabajador: `#finance-menu-title`, `#finance-menu-navigation` y `#finance-menu-separator` permanecen ocultos; `#utilities-menu-title` sigue visible con «Utilidades & Sesión» y delante de `#menu-guide`; `#menu-separator` sigue visible para administrador y oculto para trabajador; `visibleMenuIds()` conserva los valores actuales; ejecutar `npx vitest run tests/integration/navigation-menu.test.js` y confirmar que la prueba falla hasta que existan los nuevos elementos.
- [X] T043 [US5] Implementar el ajuste visual en `index.html` y `src/components/shell.js`: insertar `#finance-menu-title` con la clase existente `utilities-menu-title` y texto «Navegación» antes de `#finance-menu-navigation`, insertar `#finance-menu-separator` con la clase existente `menu-separator` después de `#finance-menu-navigation`, mover `#utilities-menu-title` («Utilidades & Sesión»), `#menu-guide`, `#menu-access`, `#menu-separator` y `#menu-logout` detrás del separador nuevo, y mostrar el título y separador nuevos solo cuando `session.role === 'finanzas'`; conservar `aria-labelledby="utilities-menu-title"`, `FINANCE_MENU_MODULES`, `ACCESS_MATRIX`, el orden de los ocho botones y la lógica de enfoque; no modificar `src/styles.css` ni introducir colores nuevos.
- [X] T044 Ejecutar `npm run check` desde la raíz del repositorio definida en `package.json` después de T041, T042 y T043, y corregir cualquier fallo de lint, formato o pruebas causado por este ajuste visual sin desmarcar T001 a T040.
