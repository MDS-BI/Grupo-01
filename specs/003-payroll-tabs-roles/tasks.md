# Tasks: Pestañas de liquidación de sueldo y permisos por rol

**Input**: Design documents from `/specs/003-payroll-tabs-roles/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: SÍ — el usuario solicitó TDD explícitamente («pruebas primero») y la Constitución (II) lo exige. Cada historia escribe sus tests ANTES de la implementación.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Restrictions**: Cambios mínimos y quirúrgicos; reutilizar `invoice-purchase-form`, `payroll-list`, `access-storage` sin duplicados; trabajo en `main` local, sin ramas ni push.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (web SPA)**: `src/`, `tests/` at repository root; `index.html` en la raíz.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar la base de calidad antes de tocar nada (repositorio ya inicializado; sin scaffolding nuevo).

- [X] T001 Ejecutar `npm run check` (script en `package.json`) y registrar el estado base en verde como referencia de regresión (SC-006)
- [X] T002 [P] Verificar que los documentos de diseño existen en `specs/003-payroll-tabs-roles/` (`plan.md`, `research.md`, `data-model.md`, `contracts/role-module-matrix.md`, `contracts/creation-flow.md`, `contracts/settlement-list.md`, `quickstart.md`)

**Checkpoint**: Base de calidad registrada; sin cambios en código aún.

---

## Phase 2: Foundational — Matriz de permisos y vista nueva (Blocking)

**Purpose**: Esqueleto de la nueva vista + matriz de permisos por rol actualizada. Bloquea TODAS las historias.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Tests primero** ⚠️ (escribir y ver FALLAR antes de implementar):

- [X] T003 [P] Añadir tests de navegación por rol en `tests/integration/navigation-menu.test.js`: administrador ve exactamente `dashboard` (Panel con accesos rápidos solo a crear y gestionar liquidaciones), `payroll-create`, `payroll-admin` y `access`; finanzas conserva entidades/facturas/movimientos/cashflow/tracking/search + `payroll-admin`; ningún rol ve `dev-notifications` (FR-013, FR-014, FR-020)
- [X] T004 [P] Añadir tests de redirección en `tests/integration/no-guest-access.test.js`: `payroll-create` denegado a `finanzas` y `trabajador` ⇒ redirigido a su vista permitida con mensaje (FR-016, US1 esc. 7)

**Implementation**:

- [X] T005 [P] Añadir la sección `#view-payroll-create` (vacía, `class="view" hidden`) en `index.html`, junto a `#view-payroll-admin` (~línea 606)
- [X] T006 [P] Añadir el botón de navegación `data-module="payroll-create"` («Crear liquidación de sueldo») en el nav de `index.html` (~línea 117, junto a `#nav-payroll-admin`)
- [X] T007 Registrar el módulo `payroll-create` en `VIEWS`, en `ACCESS_MATRIX` (`payroll-create: { administrador: true, finanzas: false, trabajador: false }`) y en `resolveRoute` de `src/app.js`
- [X] T008 Actualizar `ADMIN_MODULES` a `['dashboard', 'payroll-create', 'payroll-admin', 'access']` (el administrador conserva el Panel y el Control de accesos); añadir la etiqueta `payrollCreate` y renombrar `labels.payrollAdmin` a «Gestionar liquidaciones de sueldo» en `src/module-config.js`, y verificar que `navLabel` en `src/components/shell.js` y el acceso rápido en `src/components/dashboard.js` usan esa etiqueta
- [X] T009 Quitar `dev-notifications` de la navegación para todos los roles en `index.html` (botones `data-module="dev-notifications"`, ~líneas 57 y 127) y ocultar `menuDevNotifications` para **todos los roles** ajustando `menuSeparator` en `src/components/shell.js` (hoy `hidden = !isAdmin`), manteniendo `appendDevNotification` en `src/access-storage.js` intacto (FR-020)
- [X] T037 En `ACCESS_MATRIX` de `src/app.js`, poner `administrador: false` en `entities`, `invoice-sale`, `invoice-purchase`, `movements`, `cashflow`, `tracking`, `search` y `dev-notifications` según `contracts/role-module-matrix.md` §1; test escrito primero (debe fallar) en `tests/integration/navigation-menu.test.js` que verifique `canAccess(vista, sesiónDeAdministrador) === false` para cada una de esas vistas (FR-012, US3 esc. 1)
- [X] T038 En `resolveRoute` de `src/app.js`, si el `administrador` intenta abrir una vista no permitida, redirigir a `payroll-admin` con mensaje claro (hoy cae en `login`); test de integración en `tests/integration/no-guest-access.test.js` para el escenario 4 de la US3 (FR-016, SC-004)
- [X] T039 En `src/components/dashboard.js`, limitar el Panel del administrador a los accesos rápidos «Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo»; test escrito primero (debe fallar) en `tests/integration/us3-dashboard.test.js` (FR-013, US3 esc. 1)
- [X] T010 Ejecutar `npm test -- --run tests/integration/navigation-menu.test.js tests/integration/no-guest-access.test.js tests/integration/us3-dashboard.test.js` y llevar a verde corrigiendo solo lo marcado en T003/T004/T037/T038/T039

**Checkpoint**: Fundacional listo — las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 — Crear liquidación con alta automática de trabajador (Priority: P1) 🎯 MVP

**Goal**: Pestaña «Crear liquidación de sueldo» (solo admin) que reutiliza el formulario de factura de compra + campos RUT/nombre, y al guardar un RUT nuevo crea tercero personal + acceso `trabajador` (`password = initialPassword(rut)`); RUT existente ⇒ solo la liquidación, sin duplicados (FR-001…FR-006).

**Independent Test**: Desde sesión admin se completa el form con RUT nuevo y nombre; existen a la vez liquidación, tercero personal y acceso activo; ese trabajador entra con los primeros 4 dígitos del RUT y ve solo su liquidación; repetir con el mismo RUT no duplica nada; finanzas/trabajador son redirigidos.

**Tests primero** ⚠️ (deben FALLAR antes de la implementación):

- [ ] T011 [P] [US1] Test unitario de flujo de creación en `tests/unit/creation-flow.test.js` (archivo nuevo): RUT nuevo ⇒ `addEntity` + `createAccessRecord` llamados; RUT ya existente personal ⇒ NO se llama `addEntity` ni `createAccessRecord`; RUT con DV inválido o campos vacíos ⇒ `ValidationFailure` sin registros persistidos; RUT existente pero no personal o con acceso inactivo ⇒ rechazo sin registros persistidos y la incidencia registrada con `appendDevNotification` (FR-003, FR-004, FR-005)
- [ ] T012 [P] [US1] Test de integración end-to-end en `tests/integration/payroll-create.test.js` (archivo nuevo): admin abre la pestaña, ve form de compra + «RUT» + «Nombre completo», guarda con RUT nuevo y comprueba liquidación + tercero `personal` + acceso `trabajador` activo con `initialPassword(rut)`; login del nuevo trabajador muestra solo su liquidación (US1 esc. 1, 2, 6)

**Implementation**:

- [ ] T013 [US1] Añadir la opción opt-in `extraFields` a `createInvoiceForm` en `src/components/invoice-form.js` (inserta RUT y nombre completo requeridos antes del envío; por defecto sin cambios para las vistas de factura existentes, FR-019)
- [ ] T014 [US1] Completar el marcado de `#view-payroll-create` en `index.html`: título «Crear liquidación de sueldo» (`data-form-title`), `<form>` destino, `data-invoice-feedback` y listado de respaldo, siguiendo el patrón de `#view-invoice-purchase` (líneas 521–560)
- [ ] T015 [US1] Implementar `handlePayrollCreateSubmit` en `src/app.js` con el orden atómico de `contracts/creation-flow.md`: validar RUT (`normalizeRut`) y nombre → resolver entidad por `customFields.rut` (reusar si `personal`, rechazar si no) → `createAccessRecord` solo si no hay acceso activo → `addDocument` de compra → `refresh()` + feedback; sin registros parciales
- [ ] T016 [US1] Instanciar `createPurchaseForm` (reutilizado de `src/components/invoice-purchase-form.js`) sobre `#view-payroll-create` con `extraFields: [rut, nombreCompleto]` en `initApp`/`initInvoiceForms` de `src/app.js`, y hacer que `handleQuickAction('new-payroll')` lleve a la nueva pestaña (`src/app.js` ~línea 732)
- [ ] T017 [US1] Ejecutar `npm test -- --run tests/unit/creation-flow.test.js tests/integration/payroll-create.test.js` y llevar a verde sin tocar los componentes reutilizados más allá de lo marcado

**Checkpoint**: User Story 1 funcional y verificable de forma independiente (MVP).

---

## Phase 4: User Story 2 — Listado con búsqueda por RUT (Priority: P1)

**Goal**: Pestaña «Gestionar liquidaciones de sueldo» con cuadro de búsqueda por RUT que filtra en vivo (sin botón) y estado vacío claro; admin puede seleccionar y editar cualquier liquidación (FR-007…FR-010).

**Independent Test**: Con liquidaciones de ≥ 2 trabajadores, escribir un RUT parcial reduce el listado mientras se escribe; sin coincidencias muestra «sin resultados» conservando el texto; vacío muestra todo; admin edita una liquidación y el cambio persiste.

**Tests primero** ⚠️:

- [ ] T018 [P] [US2] Añadir tests del filtro RUT en `tests/unit/payroll.test.js`: `resolveAdminSettlements` con `filters.rut` (parcial, completo, vacío ⇒ todo, sin coincidencias ⇒ `[]`, RUT con puntos/guion normalizado) — extiende `src/payroll.js` (FR-008, FR-009)
- [ ] T019 [P] [US2] Añadir tests de búsqueda en vivo en `tests/integration/payroll-admin.test.js`: `input` en `#payroll-filter-rut` filtra sin botón; estado vacío «sin resultados» conserva el texto; admin ve «Editar» y la edición persiste (US2 esc. 2–5)

**Implementation**:

- [ ] T020 [US2] Añadir el filtro `rut` a `resolveAdminSettlements` en `src/payroll.js` (coincidencia parcial sobre el RUT normalizado del tercero vía `entityId`, en AND con los filtros existentes)
- [ ] T021 [US2] Añadir el cuadro `#payroll-filter-rut` («Buscar por RUT») en `#view-payroll-admin` dentro de `index.html` (~línea 608, en `.invoice-controls`)
- [ ] T022 [US2] Leer `#payroll-filter-rut` en `refreshPayrollAdmin` y enganchar el listener `input` (mismo patrón que `payroll-filter-worker`) en `src/app.js` (~línea 840)
- [ ] T023 [US2] Ejecutar `npm test -- --run tests/unit/payroll.test.js tests/integration/payroll-admin.test.js` y llevar a verde

**Checkpoint**: US1 + US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 — Permisos: finanzas solo lectura en liquidaciones (Priority: P2)

**Goal**: `finanzas` ve el listado con búsqueda RUT pero sin ninguna acción de edición/creación (FR-011, FR-014, SC-005); completa la matriz de permisos de la US3.

**Independent Test**: Sesión finanzas ⇒ en «Gestionar liquidaciones de sueldo» el botón «Editar» (y «Asociar») no existe en el DOM y no hay forma de invocar la edición; su nav conserva sus módulos sin control de accesos.

**Tests primero** ⚠️:

- [ ] T024 [P] [US3] Añadir tests de solo lectura en `tests/integration/finanzas-permissions.test.js`: finanzas busca por RUT en el listado pero NO hay acción «Editar»/«Asociar» invocable; no llega a `payroll-create` ni a `access` (FR-011, SC-005)
- [ ] T025 [P] [US3] Añadir test de integración en `tests/integration/payroll-admin.test.js`: `renderPayrollList` con `canEdit: false` no renderiza el botón «Editar»; con `canEdit: true` lo renderiza (default actual)

**Implementation**:

- [ ] T026 [US3] Añadir la opción `canEdit = true` a `renderPayrollList` en `src/components/payroll-list.js` y condicionar la creación del botón «Editar» (~línea 72) a ella
- [ ] T027 [US3] Pasar `canEdit: state.session?.role === 'administrador'` y `canAssociate` solo admin en `refreshPayrollAdmin` de `src/app.js` (~línea 445)
- [ ] T028 [US3] Ejecutar `npm test -- --run tests/integration/finanzas-permissions.test.js tests/integration/payroll-admin.test.js` y llevar a verde

**Checkpoint**: La matriz completa de la US3 queda verificable (admin limitado + finanzas lectura + trabajador sin cambios).

---

## Phase 6: Actualización de 002 con notas de superseded (US3 / FR-018)

**Purpose**: Marcar en 002 lo que esta feature contradice, sin reescribir el documento.

- [ ] T029 [US3] Añadir notas puntuales «Superseded by 003-payroll-tabs-roles» en `specs/002-payroll-access-control/spec.md` sobre: alcance del administrador (pierde facturas/entidades/movimientos/flujo de caja/seguimiento/búsqueda y avisos), tabla/matriz de permisos y la vista única de liquidaciones (FR-012, FR-013)
- [ ] T030 [US3] Añadir la misma nota en `specs/002-payroll-access-control/contracts/payroll-views.md` para la interfaz de la vista `payroll-admin` (una sola vista ⇒ dos pestañas + lectura finanzas)
- [ ] T031 [US3] Verificar en `specs/002-payroll-access-control/spec.md` que 002 sigue legible como histórico (sin reescritura; solo notas agregadas)

**Checkpoint**: FR-018 cumplido; 002 coherente con 003.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación transversal y cierre.

- [ ] T032 [P] Revisar `tests/integration/dev-notifications.test.js` en `tests/integration/dev-notifications.test.js`: el registro local/consola sigue funcionando pero el panel no es visible para ningún rol (FR-020)
- [ ] T033 [P] Revisar `tests/integration/access-admin-finanzas.test.js` y `tests/integration/login-roles.test.js` en `tests/integration/`: ajustar solo lo que esta funcionalidad cambia explícitamente (matriz de admin/finanzas); verificar además que `tests/integration/payroll-worker.test.js` sigue en verde **sin cambios** (FR-015)
- [ ] T040 [P] Extender `tests/integration/performance.test.js` con una prueba del filtro por RUT: con los datos de demostración como volumen de referencia, el listado se filtra en menos de 1 s (SC-003, FR-008)
- [ ] T034 Ejecutar los escenarios A–D de `specs/003-payroll-tabs-roles/quickstart.md` manualmente contra `npm run dev` y confirmar SC-001…SC-005
- [ ] T035 Ejecutar `npm run check` (lint + format + `npm test -- --run`) y corregir cualquier regresión hasta dejarlo en verde (SC-006)
- [ ] T036 Confirmar que ningún archivo fue reescrito completo: revisar `git diff --stat` y comprobar que los cambios en `src/app.js`, `src/components/*.js`, `index.html` son aditivos/quirúrgicos (FR-019)

**Checkpoint**: Feature completa y verificada.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) → US2 (P1) → US3 (P2) en orden de prioridad; US1 y US2 comparten `src/app.js` ⇒ secuenciales para evitar conflictos
  - US3 depende de US2 (el listado con búsqueda debe existir antes de ocultar «Editar»)
- **Phase 6 (002 superseded)**: Depende de US3 (la matriz final está definida)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - shares `src/app.js` con US1 ⇒ en la práctica, después de US1
- **User Story 3 (P2)**: Depende de US2 (flag `canEdit` sobre el listado ya con búsqueda RUT)

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- Tests before implementation (`[P]` tests en paralelo entre sí)
- Implementation tasks in order (modelo → servicio → UI → wiring)
- Story complete before moving to next priority

### Parallel Opportunities

- T001 ∥ T002 (Setup)
- T003 ∥ T004 ∥ T005 ∥ T006 (archivos distintos: tests vs `index.html`)
- T011 ∥ T012 (dos archivos de test nuevos en US1)
- T018 ∥ T019 (tests de US2 en paralelo)
- T024 ∥ T025 (tests de US3 en paralelo)
- T032 ∥ T033 ∥ T040 (Polish, tests distintos)

---

## Parallel Example: User Story 1

```text
# Primero los tests (deben fallar):
Task T011: "Test unitario de flujo de creación en tests/unit/creation-flow.test.js"
Task T012: "Test de integración end-to-end en tests/integration/payroll-create.test.js"

# Luego la implementación (secuencial por dependencias):
Task T013: "extraFields opt-in en src/components/invoice-form.js"
Task T014: "Marcado de #view-payroll-create en index.html"
Task T015: "handlePayrollCreateSubmit en src/app.js"
Task T016: "Instanciar createPurchaseForm en src/app.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (`tests/integration/payroll-create.test.js` en verde)
5. Demo: admin crea liquidación con alta automática de trabajador

### Incremental Delivery

1. Setup + Foundational → matriz de permisos y vista nueva listas
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test independently → Demo (búsqueda RUT en vivo)
4. Add User Story 3 → Test independently → Demo (finanzas solo lectura)
5. Phase 6 (002 superseded) + Phase 7 (Polish, `npm run check`)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Cada historia es independientemente testeable; verificar que los tests fallen antes de implementar
- Reutilizar `createPurchaseForm`/`createInvoiceForm`, `renderPayrollList` y `createAccessRecord` — NO duplicar componentes (FR-019)
- Commit tras cada fase o grupo lógico (hook opcional `/speckit-git-commit`, local en `main`, sin push)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
