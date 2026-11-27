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

## Phase 13: Clarificación 2026-11-26 - pruebas que fallan (US3/US6/US7)

**Prueba independiente**: las vistas afectadas muestran fechas `DD-MM-AAAA`, montos `$250.000`, etiquetas legibles sin identificadores internos, RUT con puntos, rol «Recursos Humanos», leyenda del ciclo de liquidaciones y cero desbordamiento horizontal a 390 px.

- [X] T045 [P] [US6] Add failing integration test in `tests/integration/clarification-2026-11-26-dates.test.js` asserting visible dates render as `DD-MM-AAAA` in: sale and purchase invoice lists through `renderSaleList`/`renderPurchaseList` (`startDate`/`endDate`), Movimientos financieros through `renderMovementsList` (`fecha`), Flujo de caja through `initApp` + `#qa-cashflow` (`#cashflow-table` column «Fecha»), Mi liquidación through `renderPayrollSettlement` (`#payroll-worker-paid-at` and `#payroll-worker-history` column «Fecha de pago»), and Gestionar liquidaciones through `renderPayrollList` (column «Fecha de pago»); seed fixed `2026-11-25` dates, assert `25-11-2026` and zero `2026-11-25` in visible text; run `npx vitest run tests/integration/clarification-2026-11-26-dates.test.js` and confirm failure.
- [X] T046 [P] [US3] Add failing integration test in `tests/integration/clarification-2026-11-26-amounts.test.js` asserting `renderSaleList` and `renderPurchaseList` render `totalAmount: 250000, currency: 'CLP'` as `$250.000` through `formatCurrencyCLP`, that neither list contains `250000 CLP`, and that amount cells keep `.invoice-total` with right alignment; run `npx vitest run tests/integration/clarification-2026-11-26-amounts.test.js` and confirm failure.
- [X] T047 [P] [US3] Add failing integration test in `tests/integration/clarification-2026-11-26-labels.test.js` rendering facturas, movimientos, flujo de caja, liquidaciones y Control de accesos and asserting no visible `textContent` contains `doc_`, `ent_`, `set_` or `salesOrderId`; assert Movimientos shows `Venta emitida`/`Pago`, `Venta A #1`/`Compra B #2`, `Orden de venta: PED-036` and the third-party name, and Control de accesos shows `Tercero: <entity.name>` instead of `ent_...`; run `npx vitest run tests/integration/clarification-2026-11-26-labels.test.js` and confirm failure.
- [X] T048 [P] [US3] Add failing unit/integration test in `tests/integration/clarification-2026-11-26-role-rut.test.js` asserting `resolveSessionProfile({ role: 'administrador' })` returns `roleLabel`/`displayName` `Recursos Humanos` and `initials` `R` while `role` stays `administrador`; `createShell` sets `#session-role` to `Rol: Recursos Humanos`; the admin Panel greeting contains `Hola, Recursos Humanos`; the `#access-role` option text is `Recursos Humanos` with value `administrador`; and Access list shows `12.345.678-5` for stored RUTs with or without dots plus capitalized role labels; run `npx vitest run tests/integration/clarification-2026-11-26-role-rut.test.js` and confirm failure.
- [X] T049 [P] [US7] Add failing integration test in `tests/integration/clarification-2026-11-26-payroll-legend.test.js` asserting `renderPayrollList` shows the exact legend entries `Borrador (RRHH la prepara)`, `Emitida (aprobada por RRHH)` and `Pagada (finanzas registró el pago)` and that a stored RUT `15432876-9` appears as `15.432.876-9` in payroll rows without changing storage; run `npx vitest run tests/integration/clarification-2026-11-26-payroll-legend.test.js` and confirm failure.
- [X] T050 [P] [US3] Add failing regression test in `tests/integration/clarification-2026-11-26-responsive.test.js` setting `window.innerWidth = 390`, loading app markup for each role and asserting `src/styles.css` defines a `max-width: 390px` block that prevents page horizontal overflow on `body`/`#app`, fits `.topbar-left`, `.topbar-right` and `.brand-logo` within 390 px using `min-width: 0` where needed, and keeps `.invoice-table-scroll` scrollable with `overflow-x: auto`; assert no rendered topbar element declares a fixed width greater than 390 px; run `npx vitest run tests/integration/clarification-2026-11-26-responsive.test.js` and confirm failure.
- [X] T051 [P] [US3] Update existing expectations in `tests/unit/session.test.js`, `tests/integration/login-roles.test.js`, `tests/integration/session-lifecycle.test.js`, `tests/integration/us3-dashboard.test.js`, `tests/integration/demo-from-login.test.js` and any other test found with `rg "Rol: Administrador|Hola, Administrador|CLP"` to expect `Recursos Humanos`, `R` and `formatCurrencyCLP`/`$250.000` while preserving internal `administrador` keys; run the updated test files and confirm they fail until implementation.

## Phase 14: Clarificación 2026-11-26 - implementación (US3/US6/US7)

- [X] T052 [US3] Add `formatDateDDMMYYYY(value)` and `formatRut(value)` display helpers in `src/format.js` and change `ROLE_LABELS.administrador` to `Recursos Humanos` in `src/module-config.js`; keep `erp.*` keys, `ACCESS_MATRIX`, stored RUT normalization, palette and typography unchanged.
- [X] T053 [P] [US3] Use `formatDateDDMMYYYY` in `src/components/invoice-list.js` for `startDate`/`endDate` and `formatCurrencyCLP` for `totalAmount`, and in `src/components/cashflow.js` for the «Fecha» column; keep stored values and the existing `.invoice-table-scroll` wrapper unchanged.
- [X] T054 [P] [US3] Rework `src/components/movements-list.js` to show movement types with the Panel labels (`Venta emitida`, `Pago`), document references as `Venta <serie> #<folio>` or `Compra <serie> #<folio>`, order reference as `Orden de venta: PED-036`, third-party name, `Fecha: DD-MM-AAAA`, and no internal identifiers or field names; accept the documents needed to resolve references without touching storage.
- [X] T055 [P] [US3] Update `src/components/access-admin.js` so the list and role selector show `Recursos Humanos`, capitalized role labels, `Tercero: <entity.name>` and dotted RUTs while form values and stored `accessId`/`role` remain normalized/internal; use `ROLE_LABELS` and `formatRut`.
- [X] T056 [P] [US3] Update `src/session.js`, `src/components/shell.js` and `src/components/dashboard.js` so `displayName`, `#session-role`, avatar initial and admin greeting derive from `ROLE_LABELS` (`Recursos Humanos`, initial `R`) without changing `session.role === 'administrador'`.
- [X] T057 [P] [US7] Update `src/components/payroll-worker.js` and `src/components/payroll-list.js` to show `DD-MM-AAAA` in payment date/history, dotted RUTs through `formatRut`, `formatCurrencyCLP` amounts already used and the payroll cycle legend in `payroll-list.js`; keep status names `Borrador`, `Emitida` and `Pagada` unchanged.
- [X] T058 [P] [US3] Adjust `src/styles.css` for widths ≤390 px so the page has no horizontal overflow, the topbar logo and role fit, and wide tables stay inside `.invoice-table-scroll` with horizontal scrolling; reuse existing colors, spacing scale and IBM Plex Sans, adding no new palette or font.
- [X] T059 Update `specs/004-role-dashboard-redesign/contracts/session-display.md`, `specs/004-role-dashboard-redesign/contracts/dashboard-ui.md` and the manual expectations in `specs/004-role-dashboard-redesign/quickstart.md` to reflect `Recursos Humanos`/`R`, visible `DD-MM-AAAA` dates, dotted RUTs and the canonical CLP amount format without changing the data model, `erp.*` keys, role permissions, palette or typography.

## Phase 15: Verificación final de la clarificación

- [X] T060 Ejecutar `npm run check` desde la raíz del repositorio definida en `package.json` después de T045 a T059, y corregir cualquier fallo de lint, formato o pruebas sin desmarcar T001 a T044 ni renumerar tareas.

## Phase 16: Paleta v1.2.0 - pruebas que fallan (SC-017/SC-018)

**Prueba independiente**: la cadena `#0f62fe` no aparece en estilos ni configuración; barra superior, etiqueta de rol, círculo de perfil, indicadores, alertas, etiquetas de estado y gráfico usan solo la paleta v1.2.0, con contraste medido por luminancia WCAG y señales no cromáticas conservadas.

- [X] T061 [P] [US1] Agregar prueba que falle en `tests/integration/palette-v1.2.0-legacy.test.js` comprobando que la cadena exacta `#0f62fe` está ausente de `src/styles.css`, `src/module-config.js` y `src/components/shell.js`, y que las constantes de color nuevas `#023047`, `#219EBC`, `#8ECAE6`, `#FFB703`, `#FB8500`, `#126782` y `#A84F00` aparecen en `src/styles.css`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-legacy.test.js` y confirmar el fallo.
- [X] T062 [P] [US3] Agregar prueba que falle en `tests/integration/palette-v1.2.0-shell.test.js` cargando la barra superior con `createShell` para administrador, finanzas y trabajador, y comprobando que `.topbar` usa fondo `#023047` con texto/iconos `#ffffff`, `#session-role` usa fondo `#8ECAE6` con texto `#023047`, y el `<circle>` de `#brand-logo` usa relleno `#FFB703` con iniciales `#023047`, sin cambiar `#brand-name`, `#session-role` ni las iniciales; ejecutar `npx vitest run tests/integration/palette-v1.2.0-shell.test.js` y confirmar el fallo.
- [X] T063 [P] [US2] Agregar prueba que falle en `tests/integration/palette-v1.2.0-indicators.test.js` renderizando `#finance-indicators-section` con caja negativa y vencidas mayores que cero, y comprobando que el número de caja negativa es `#A84F00` con borde `#FB8500`, que la tarjeta de facturas vencidas usa texto `#A84F00` y borde `#FB8500` o un tinte claro de `#FB8500` sin fondo `#FFB703` (FR-015), que la variación favorable es `#219EBC` o texto `#126782`, la desfavorable es `#A84F00`, y permanecen `▲`, `▼` y `sin dato anterior`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-indicators.test.js` y confirmar el fallo.
- [X] T064 [P] [US4] Agregar prueba que falle en `tests/integration/palette-v1.2.0-alerts.test.js` comprobando en `src/components/dashboard.js` y `src/styles.css` que la alerta de caja negativa usa texto `#A84F00` y borde `#FB8500` con enlace a `cashflow`, que la alerta de facturas vencidas usa texto `#A84F00` y borde `#FB8500` o un tinte claro de `#FB8500`, sin fondo `#FFB703` (FR-023), con enlace a `tracking`, y que los estados «Caja 0» y «sin vencidas» siguen neutros y sin alerta; ejecutar `npx vitest run tests/integration/palette-v1.2.0-alerts.test.js` y confirmar el fallo.
- [X] T065 [P] [US7] Agregar prueba que falle en `tests/integration/palette-v1.2.0-status-labels.test.js` renderizando `renderSaleList`, `renderPurchaseList`, `initApp` con `#qa-cashflow`, `renderPayrollList` y `renderPayrollSettlement`, y comprobando que los estados favorables usan relleno `#219EBC` o texto `#126782`, los desfavorables/críticos usan texto `#A84F00` con borde `#FB8500`, los informativos usan fondo `#8ECAE6` con texto `#023047`, la etiqueta «Emitida» usa fondo `#FFB703` con texto `#023047`, «Pagada» usa texto `#126782` con borde `#219EBC` y «Vencida» usa texto `#A84F00` con borde `#FB8500` (FR-048), y todo estado conserva texto, icono o `▲`/`▼`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-status-labels.test.js` y confirmar el fallo.
- [X] T066 [P] [US4] Agregar prueba que falle en `tests/integration/palette-v1.2.0-trend.test.js` comprobando en `src/components/dashboard.js` y `src/styles.css` que las barras y leyenda de ingresos son `#219EBC`, las de gastos son `#A84F00`, no aparecen `#1b7f4b`, `#c62828`, `green` ni `red`, y se conservan `<title>`, `<desc>`, leyenda `Ingresos`/`Gastos` y etiquetas de los seis meses; ejecutar `npx vitest run tests/integration/palette-v1.2.0-trend.test.js` y confirmar el fallo.
- [X] T067 [P] [US2] Agregar prueba que falle en `tests/integration/palette-v1.2.0-contrast.test.js` calculando luminancia WCAG desde los valores hexadecimales de `src/styles.css` y exigiendo contraste mínimo `4.5:1` para `#ffffff`/`#023047`, `#023047`/`#8ECAE6`, `#023047`/`#FFB703`, `#126782`/`#ffffff` y `#A84F00`/`#ffffff`, y mínimo `3:1` para `#219EBC`/`#ffffff` y `#FB8500`/`#ffffff` cuando se usen como gráficos o bordes; ejecutar `npx vitest run tests/integration/palette-v1.2.0-contrast.test.js` y confirmar el fallo.
- [X] T068 [P] [US3] Actualizar las expectativas de color que fallan en `tests/unit/module-config.test.js`, `tests/integration/us3-dashboard.test.js`, `tests/integration/us13-shell.test.js`, `tests/integration/cashflow-dashboard-trend.test.js` y en todo archivo localizado con `rg "#0f62fe|#c62828|#b26a00|#1b7f4b|#0f7a3d|#103a8a" tests` para esperar la paleta v1.2.0 y conservar las aserciones de texto accesible, ejecutar los archivos actualizados y confirmar que fallan hasta la implementación.

## Phase 17: Paleta v1.2.0 - implementación (US1/US2/US3/US4/US7)

- [X] T069 [US1] Reemplazar en `src/styles.css` los antiguos acento y estados semánticos por los tokens de la constitución v1.2.0: `#023047` para banner, navegación activa y botones primarios con texto `#ffffff`; `#219EBC` para gráficos y estados favorables; `#126782` para texto favorable; `#8ECAE6` para información; `#FFB703` para fondos de acción con texto `#023047`; `#A84F00` para texto desfavorable/crítico y `#FB8500` para bordes críticos; en `.invoice-view--sale`, `--invoice-accent` `#125b86` y `--invoice-tint` `#e7f3fb` por `#126782` y un tinte claro de `#219EBC`; en `.invoice-view--purchase`, `#6b4084` y `#f3eafa` por `#A84F00` y un tinte claro de `#FB8500`; en `.config-banner`, `#fff4e5`, `#f3c98b` y `#7a4b00` por un tinte de `#FFB703`, borde `#FFB703` y texto `#023047`; en `.route-message`, `#e8f1ff`, `#a6c3ff` y `#103a8a` por un tinte de `#8ECAE6`, borde `#8ECAE6` y texto `#023047`; en `.cashflow-table tr[data-tipo='ingreso'] td:last-child`, `#0f7a3d` por `#126782`; y en `.quick-action:hover`/`.quick-action:focus-visible`, la sombra `rgb(15 98 254 / 22%)` por una sombra con `#023047`, sin modificar grises neutros, tipografía ni geometría.
- [X] T070 [P] [US3] Cambiar `DEFAULT_ACCENT_COLOR` y `accentColor` en `src/module-config.js`, y el `<circle>` y las iniciales renderizadas por `renderLogo` en `src/components/shell.js`, para usar `#023047`, `#FFB703` y `#023047` respectivamente, manteniendo claves `erp.*`, textos, roles y `resolveSessionProfile` intactos.
- [X] T071 [P] [US3] Ajustar `src/styles.css` para que `.topbar` tenga fondo `#023047` y texto/iconos `#ffffff`, `.session-role` tenga fondo `#8ECAE6` y texto `#023047`, y `#brand-logo` conserve `max-width: 100%` a 390 px con el círculo `#FFB703`, sin cambiar textos ni anchos fijos mayores que 390 px.
- [X] T072 [P] [US2] Actualizar `src/components/dashboard.js` y `src/styles.css` para que los indicadores de caja negativa y facturas vencidas usen texto `#A84F00` con borde `#FB8500` o un tinte claro de `#FB8500`, sin fondo `#FFB703` (FR-015), y las variaciones favorables usen `#219EBC` o texto `#126782` y las desfavorables `#A84F00`, según la prueba T063, conservando etiquetas, tooltips, `▲`/`▼` y `sin dato anterior`.
- [X] T073 [P] [US4] Actualizar `src/components/dashboard.js` y `src/styles.css` para que la alerta de caja negativa use texto `#A84F00` y borde `#FB8500`, y la alerta de facturas vencidas use texto `#A84F00` con borde `#FB8500` o tinte claro de `#FB8500`, sin fondo `#FFB703` (FR-023), conservando sus enlaces y textos, y dejando los estados cero y sin vencidas neutros.
- [X] T074 [P] [US7] Actualizar las clases y estilos de estado en `src/components/invoice-list.js`, `src/components/cashflow.js`, `src/components/payroll-list.js`, `src/components/payroll-worker.js`, `src/components/dashboard.js` y `src/styles.css` para cumplir T065 y FR-048, aplicando «Emitida» con fondo `#FFB703` y texto `#023047`, «Pagada» con texto `#126782` y borde `#219EBC`, y «Vencida» con texto `#A84F00` y borde `#FB8500`, sin renombrar estados, cambiar textos ni tocar almacenamiento.
- [X] T075 [P] [US4] Actualizar `src/components/dashboard.js` y `src/styles.css` para que el gráfico de tendencia use `#219EBC` en ingresos y `#A84F00` en gastos, elimine `#1b7f4b`, `#c62828`, `green` y `red`, y mantenga el SVG accesible, la leyenda y los seis meses.
- [X] T076 Actualizar `specs/004-role-dashboard-redesign/contracts/dashboard-ui.md`, `specs/004-role-dashboard-redesign/contracts/session-display.md`, `specs/004-role-dashboard-redesign/contracts/trend-chart.md` y `specs/004-role-dashboard-redesign/quickstart.md` para reemplazar las referencias a `#0f62fe`, verde/rojo y ámbar anteriores por la paleta v1.2.0, los contrastes SC-017/SC-018 y las señales no cromáticas, sin alterar roles, permisos, textos ni formatos de datos.

## Phase 18: Verificación final de la paleta v1.2.0

- [X] T077 Ejecutar `npm run check` desde la raíz del repositorio definida en `package.json` después de T061 a T076, verificar con `rg "#0f62fe|#c62828|#b26a00|#1b7f4b|#125b86|#e7f3fb|#6b4084|#f3eafa|#fff4e5|#f3c98b|#7a4b00|#e8f1ff|#a6c3ff|#103a8a|#0f7a3d|rgb\(15 98 254 / 22%\)" src specs/004-role-dashboard-redesign` que no queden colores heredados salvo en texto de documentación histórica, y corregir cualquier fallo sin desmarcar T001 a T060 ni renumerar tareas.

## Phase 19: Correcciones visuales verificadas en navegador tras T061-T077 (US3/US5/US6/US7)

- [X] T078 [US5] Agregar en `tests/integration/palette-v1.2.0-guide-banner.test.js` una prueba que falle comprobando en `src/styles.css` que `.guide-banner` usa texto `#023047`, borde `#8ECAE6` y fondo tinte de `#8ECAE6` con `#ffffff`, que `.guide-banner .guide-shortcut` conserva texto `#023047`, y que no persiste el tinte gris de `var(--accent-color)`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-guide-banner.test.js` y confirmar el fallo antes de ajustar `src/styles.css` según FR-029, sin cambiar textos, IDs ni persistencia `sessionStorage`.
- [X] T079 [US7] Agregar en `tests/integration/palette-v1.2.0-paid-status.test.js` una prueba que falle renderizando `renderPayrollList` y `renderPayrollSettlement` con una liquidación `Pagada`, comprobando que la etiqueta conserva el texto `Pagada` y que la regla efectiva de `.status-badge--paid` aplica texto `#126782` con borde `#219EBC` tanto en `Gestionar liquidaciones de sueldo` como en `Mi liquidación`, con precedencia sobre `.worker-status`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-paid-status.test.js` y confirmar el fallo antes de ajustar `src/components/payroll-list.js`, `src/components/payroll-worker.js` y `src/styles.css` según FR-048, sin renombrar estados ni tocar almacenamiento.
- [X] T080 [US6] Agregar en `tests/integration/palette-v1.2.0-worker-history-badge.test.js` una prueba que falle renderizando `renderPayrollSettlement` con historial de pagos, comprobando que cada celda de estado de `#payroll-worker-history` no lleva clase `status-badge`, contiene un `<span class="status-badge ...">` con el mismo texto y que `src/styles.css` no aplica `display: block` ni `width: 100%` a esa etiqueta dentro de `@media (max-width: 640px)`; ejecutar `npx vitest run tests/integration/palette-v1.2.0-worker-history-badge.test.js` y confirmar el fallo antes de mover la clase desde el `<td>` al `<span>` en `src/components/payroll-worker.js` y ajustar `src/styles.css` para que la etiqueta mantenga alto de una línea y no estire la fila.
- [X] T081 [US3] Agregar en `tests/integration/palette-v1.2.0-responsive-logo.test.js` una prueba que falle con `window.innerWidth = 390` y `createShell` para administrador, finanzas y trabajador, comprobando que `#brand-logo` y su `<circle>` existen, que el bloque `@media (max-width: 390px)` de `src/styles.css` define `.topbar-right` y `.session-role` con `min-width: 0`, `.session-role` con `overflow: hidden`, `text-overflow: ellipsis` y `white-space: nowrap`, y que `.brand-logo` conserva `flex-shrink: 0`, `width: 40px` y `height: 40px` dentro de 390 px; ejecutar `npx vitest run tests/integration/palette-v1.2.0-responsive-logo.test.js` y confirmar el fallo antes de ajustar `src/styles.css` según FR-061, sin cambiar textos, iniciales ni roles.
- [X] T082 Ejecutar `npm run check` desde la raíz del repositorio definida en `package.json` después de T078 a T081 y corregir cualquier fallo de lint, formato o pruebas sin desmarcar T001 a T077 ni renumerar tareas.
