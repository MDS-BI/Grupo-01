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
- [X] T041 Actualizar las suites heredadas afectadas por la nueva matriz (tutorial, tutorial-steps, us13-shell, us14-dashboard, invoice-separation, cashflow-format, tracking, us11-search, finanzas-permissions y dev-notifications) para que reflejen FR-012, FR-013 y FR-020

**Checkpoint**: Fundacional listo — las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 — Crear liquidación con alta automática de trabajador (Priority: P1) 🎯 MVP

**Goal**: Pestaña «Crear liquidación de sueldo» (solo admin) que reutiliza el formulario de factura de compra + campos RUT/nombre *(superseded el 2026-11-25: desde T058–T062 la pestaña usa un formulario propio; ver la fase de corrección del 25-11)*, y al guardar un RUT nuevo crea tercero personal + acceso `trabajador` (`password = initialPassword(rut)`); RUT existente ⇒ solo la liquidación, sin duplicados (FR-001…FR-006).

**Independent Test**: Desde sesión admin se completa el form con RUT nuevo y nombre; existen a la vez liquidación, tercero personal y acceso activo; ese trabajador entra con los primeros 4 dígitos del RUT y ve solo su liquidación; repetir con el mismo RUT no duplica nada; finanzas/trabajador son redirigidos.

**Tests primero** ⚠️ (deben FALLAR antes de la implementación):

- [X] T011 [P] [US1] Test unitario de flujo de creación en `tests/unit/creation-flow.test.js` (archivo nuevo): RUT nuevo ⇒ `addEntity` + `createAccessRecord` llamados; RUT ya existente personal ⇒ NO se llama `addEntity` ni `createAccessRecord`; RUT con DV inválido o campos vacíos ⇒ `ValidationFailure` sin registros persistidos; RUT existente pero no personal o con acceso inactivo ⇒ rechazo sin registros persistidos y la incidencia registrada con `appendDevNotification` (FR-003, FR-004, FR-005)
- [X] T012 [P] [US1] Test de integración end-to-end en `tests/integration/payroll-create.test.js` (archivo nuevo): admin abre la pestaña, ve form de compra + «RUT» + «Nombre completo», guarda con RUT nuevo y comprueba liquidación + tercero `personal` + acceso `trabajador` activo con `initialPassword(rut)`; login del nuevo trabajador muestra solo su liquidación (US1 esc. 1, 2, 6) *(superseded en parte por T056: la prueba ya no busca el formulario de compra, sino los ids `payroll-create-field-*`)*

**Implementation**:

- [X] T013 [US1] Añadir la opción opt-in `extraFields` a `createInvoiceForm` en `src/components/invoice-form.js` (inserta RUT y nombre completo requeridos antes del envío; por defecto sin cambios para las vistas de factura existentes, FR-019) *(superseded por T058–T062 el 2026-11-25: la pestaña de creación ya no usa `extraFields`; la opción queda en `invoice-form.js` como opt-in sin uso)*
- [X] T014 [US1] Completar el marcado de `#view-payroll-create` en `index.html`: título «Crear liquidación de sueldo» (`data-form-title`), `<form>` destino, `data-invoice-feedback` y listado de respaldo, siguiendo el patrón de `#view-invoice-purchase` (líneas 521–560)
- [X] T015 [US1] Implementar `handlePayrollCreateSubmit` en `src/app.js` con el orden atómico de `contracts/creation-flow.md`: validar RUT (`normalizeRut`) y nombre → resolver entidad por `customFields.rut` (reusar si `personal`, rechazar si no) → `createAccessRecord` solo si no hay acceso activo → `addDocument` de compra → `refresh()` + feedback; sin registros parciales
- [X] T016 [US1] Instanciar `createPurchaseForm` (reutilizado de `src/components/invoice-purchase-form.js`) sobre `#view-payroll-create` con `extraFields: [rut, nombreCompleto]` en `initApp`/`initInvoiceForms` de `src/app.js`, y hacer que `handleQuickAction('new-payroll')` lleve a la nueva pestaña (`src/app.js` ~línea 732) *(superseded por T059–T060 el 2026-11-25: `createPurchaseForm` se reemplazó por `initPayrollCreateForm`; se mantiene lo de `handleQuickAction`)*
- [X] T017 [US1] Ejecutar `npm test -- --run tests/unit/creation-flow.test.js tests/integration/payroll-create.test.js` y llevar a verde sin tocar los componentes reutilizados más allá de lo marcado

**Checkpoint**: User Story 1 funcional y verificable de forma independiente (MVP).

---

## Phase 4: User Story 2 — Listado con búsqueda por RUT (Priority: P1)

**Goal**: Pestaña «Gestionar liquidaciones de sueldo» con cuadro de búsqueda por RUT que filtra en vivo (sin botón) y estado vacío claro; admin puede seleccionar y editar cualquier liquidación (FR-007…FR-010).

**Independent Test**: Con liquidaciones de ≥ 2 trabajadores, escribir un RUT parcial reduce el listado mientras se escribe; sin coincidencias muestra «sin resultados» conservando el texto; vacío muestra todo; admin edita una liquidación y el cambio persiste.

**Tests primero** ⚠️:

- [X] T018 [P] [US2] Añadir tests del filtro RUT en `tests/unit/payroll.test.js`: `resolveAdminSettlements` con `filters.rut` (parcial, completo, vacío ⇒ todo, sin coincidencias ⇒ `[]`, RUT con puntos/guion normalizado) — extiende `src/payroll.js` (FR-008, FR-009)
- [X] T019 [P] [US2] Añadir tests de búsqueda en vivo en `tests/integration/payroll-admin.test.js`: `input` en `#payroll-filter-rut` filtra sin botón; estado vacío «sin resultados» conserva el texto; admin ve «Editar» y la edición persiste (US2 esc. 2–5)

**Implementation**:

- [X] T020 [US2] Añadir el filtro `rut` a `resolveAdminSettlements` en `src/payroll.js` (coincidencia parcial sobre el RUT normalizado del tercero vía `entityId`, en AND con los filtros existentes)
- [X] T021 [US2] Añadir el cuadro `#payroll-filter-rut` («Buscar por RUT») en `#view-payroll-admin` dentro de `index.html` (~línea 608, en `.invoice-controls`)
- [X] T022 [US2] Leer `#payroll-filter-rut` en `refreshPayrollAdmin` y enganchar el listener `input` (mismo patrón que `payroll-filter-worker`) en `src/app.js` (~línea 840)
- [X] T023 [US2] Ejecutar `npm test -- --run tests/unit/payroll.test.js tests/integration/payroll-admin.test.js` y llevar a verde

**Checkpoint**: US1 + US2 funcionan de forma independiente.

---

## Phase 5: User Story 3 — Permisos: finanzas solo lectura en liquidaciones (Priority: P2)

**Goal**: `finanzas` ve el listado con búsqueda RUT pero sin ninguna acción de edición/creación (FR-011, FR-014, SC-005); completa la matriz de permisos de la US3.

**Independent Test**: Sesión finanzas ⇒ en «Gestionar liquidaciones de sueldo» el botón «Editar» (y «Asociar») no existe en el DOM y no hay forma de invocar la edición; su nav conserva sus módulos sin control de accesos.

**Tests primero** ⚠️:

- [X] T024 [P] [US3] Añadir tests de solo lectura en `tests/integration/finanzas-permissions.test.js`: finanzas busca por RUT en el listado pero NO hay acción «Editar»/«Asociar» invocable; no llega a `payroll-create` ni a `access` (FR-011, SC-005). Nota: la parte de pruebas antiguas se adelantó en T041.
- [X] T025 [P] [US3] Añadir test de integración en `tests/integration/payroll-admin.test.js`: `renderPayrollList` con `canEdit: false` no renderiza el botón «Editar»; con `canEdit: true` lo renderiza (default actual)

**Implementation**:

- [X] T026 [US3] Añadir la opción `canEdit = true` a `renderPayrollList` en `src/components/payroll-list.js` y condicionar la creación del botón «Editar» (~línea 72) a ella
- [X] T027 [US3] Pasar `canEdit: state.session?.role === 'administrador'` y `canAssociate` solo admin en `refreshPayrollAdmin` de `src/app.js` (~línea 445)
- [X] T028 [US3] Ejecutar `npm test -- --run tests/integration/finanzas-permissions.test.js tests/integration/payroll-admin.test.js` y llevar a verde

**Checkpoint**: La matriz completa de la US3 queda verificable (admin limitado + finanzas lectura + trabajador sin cambios).

---

## Phase 6: Actualización de 002 con notas de superseded (US3 / FR-018)

**Purpose**: Marcar en 002 lo que esta feature contradice, sin reescribir el documento.

- [X] T029 [US3] Añadir notas puntuales «Superseded by 003-payroll-tabs-roles» en `specs/002-payroll-access-control/spec.md` sobre: alcance del administrador (pierde facturas/entidades/movimientos/flujo de caja/seguimiento/búsqueda y avisos), tabla/matriz de permisos y la vista única de liquidaciones (FR-012, FR-013)
- [X] T030 [US3] Añadir la misma nota en `specs/002-payroll-access-control/contracts/payroll-views.md` para la interfaz de la vista `payroll-admin` (una sola vista ⇒ dos pestañas + lectura finanzas)
- [X] T031 [US3] Verificar en `specs/002-payroll-access-control/spec.md` que 002 sigue legible como histórico (sin reescritura; solo notas agregadas)

**Checkpoint**: FR-018 cumplido; 002 coherente con 003.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación transversal y cierre.

- [X] T032 [P] Revisar `tests/integration/dev-notifications.test.js` en `tests/integration/dev-notifications.test.js`: el registro local/consola sigue funcionando pero el panel no es visible para ningún rol (FR-020). Nota: la parte de pruebas antiguas se adelantó en T041.
- [X] T033 [P] Revisar `tests/integration/access-admin-finanzas.test.js` y `tests/integration/login-roles.test.js` en `tests/integration/`: ajustar solo lo que esta funcionalidad cambia explícitamente (matriz de admin/finanzas); verificar además que `tests/integration/payroll-worker.test.js` sigue en verde **sin cambios** (FR-015)
- [X] T040 [P] Extender `tests/integration/performance.test.js` con una prueba del filtro por RUT: con los datos de demostración como volumen de referencia, el listado se filtra en menos de 1 s (SC-003, FR-008)
- [X] T034 Ejecutar los escenarios A–D de `specs/003-payroll-tabs-roles/quickstart.md` manualmente contra `npm run dev` y confirmar SC-001…SC-005
- [X] T035 Ejecutar `npm run check` (lint + format + `npm test -- --run`) y corregir cualquier regresión hasta dejarlo en verde (SC-006)
- [X] T036 Confirmar que ningún archivo fue reescrito completo: revisar `git diff --stat` y comprobar que los cambios en `src/app.js`, `src/components/*.js`, `index.html` son aditivos/quirúrgicos (FR-019)
- [X] T042 Vista Crear liquidación de sueldo: ocultar el selector «Tercero» (el trabajador se define solo con RUT y nombre, FR-002/FR-003) y no mostrar facturas de compra a proveedores en la lista de esa vista (FR-012) *(superseded en parte por T058 y T061: el formulario propio ya no tiene selector de tercero y el listado se arma con `renderPayrollList`)*

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
- Reutilizar `renderPayrollList` y `createAccessRecord` — NO duplicar componentes (FR-019). *(La reutilización de `createPurchaseForm`/`createInvoiceForm` en la pestaña de creación quedó superseded el 2026-11-25 por el formulario propio de T058–T062.)*
- Commit tras cada fase o grupo lógico (hook opcional `/speckit-git-commit`, local en `main`, sin push)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Clarificación 2026-11-24 — tareas nuevas (T043+)

**Alcance**: solo las decisiones registradas en `spec.md` → `Clarifications` → `Session 2026-11-24`. No modificar, renumerar ni desmarcar T001–T042; no tocar la spec 004, el modelo de datos ni las claves `erp.*`.

**Orden de ejecución**: primero las pruebas (T043–T046, deben fallar), luego la implementación (T047–T051) y finalmente T052 (`npm run check`).

### US3 — Facturas vinculadas en solo lectura y pago de liquidaciones `Emitidas` (Priority: P2)

**Goal**: `finanzas` no puede editar ni eliminar, desde ninguna vista, facturas de compra cuyo `documentId` figure en `erp.payrollSettlements`; ve un aviso claro y el `monto` de la liquidación no cambia. Como única escritura sobre liquidaciones y facturas vinculadas, puede registrar el pago de una liquidación `Emitida` (`Pagada`, `montoPagado` igual al total, `fechaPago`), sin modificar el total ni otros campos.

**Independent Test**: con sesión `finanzas`, una factura vinculada no ofrece «Editar» ni «Eliminar» y muestra «solo lectura»; un intento directo no altera `erp.compra` ni `erp.payrollSettlements`. En una liquidación `Emitida`, solo aparece «Registrar pago»; al registrarlo cambian únicamente estado, monto pagado y fecha de pago; estados distintos de `Emitida` y montos distintos del total se rechazan.

**Tests primero** ⚠️ (deben FALLAR antes de implementar):

- [X] T043 [P] [US3] Añadir test de integración en `tests/integration/finance-linked-invoice.test.js`: crear un tercero personal, una factura de compra y un registro en `erp.payrollSettlements` con `documentId` apuntando a esa factura; iniciar sesión como `finanzas`, abrir `invoice-purchase` y verificar que la fila vinculada NO tiene botones `[data-action="edit"]` ni `[data-action="delete"]`, que muestra un aviso con el texto «solo lectura», y que invocar directamente `editDocument`/`requestDeleteDocument` importados desde `src/app.js` no modifica `erp.compra` ni el `monto` de `erp.payrollSettlements` (FR-011, SC-005, US3 esc. 6)
- [X] T044 [P] [US3] Añadir test de integración en `tests/integration/finance-settlement-payment.test.js`: con sesión `finanzas` y una liquidación `Emitida`, verificar que solo existe la acción `data-action="register-payment"` (sin «Editar» ni «Asociar»), que al enviar `fechaPago = '2026-11-24'` se guardan `estado: 'Pagada'`, `montoPagado === totalAmount` y `fechaPago`, y que `totalAmount`, `sueldoBase`, `descuentos`, `bonos`, `periodo`, `entityId` y `documentId` permanecen idénticos; añadir casos de rechazo para una liquidación `Borrador`/`Pagada` y para un monto pagado distinto del total (FR-011, US2 esc. 7, US3 esc. 7, SC-005)

### US1 — Confirmación antes de crear con RUT nuevo (Priority: P1)

**Goal**: antes de guardar una liquidación con un RUT nuevo, el sistema pide confirmación indicando que creará el trabajador y su acceso con contraseña inicial igual a los primeros 4 dígitos del RUT; al cancelar no se persiste ningún registro; con un RUT ya existente no aparece la confirmación.

**Independent Test**: con sesión de `administrador`, enviar el formulario de `payroll-create` con un RUT nuevo: aparece la confirmación con el RUT y los 4 dígitos; al aceptar existen liquidación, tercero y acceso; al cancelar no existen en `erp.payrollSettlements`, `erp.entities` ni `erp.accessRecords`. Repetir con un RUT ya registrado como personal: no se muestra confirmación y solo se crea/actualiza la liquidación.

**Tests primero** ⚠️ (deben FALLAR antes de implementar):

- [X] T045 [P] [US1] Añadir tests en `tests/integration/payroll-create.test.js` para la confirmación de alta con RUT nuevo: espiar `window.confirm` y verificar que el mensaje contiene «Se creará», el RUT y `initialPassword(RUT)`; al aceptar se crean los tres registros; al cancelar `loadPayrollSettlements()`, `loadEntities()` y `loadAccessRecords()` siguen sin el RUT nuevo; con un RUT ya registrado como personal el confirm NO se invoca (FR-003, SC-001, US1 esc. 2 y 8)
- [X] T046 [US1] Actualizar `tests/integration/payroll-create.test.js` y `tests/unit/creation-flow.test.js` para fijar `window.confirm = () => true` en los escenarios heredados de alta, preservando el significado de T011, T012 y T017 y sin desmarcar esas tareas (FR-003, SC-006)

### Implementación

- [X] T047 [US3] En `src/app.js`, añadir la helper `isLinkedPayrollDocument(id)` que consulte `erp.payrollSettlements` por `documentId` sin cambiar claves ni estructura; usarla en `editDocument` y `requestDeleteDocument` para bloquear a `finanzas`, mostrar en `#view-invoice-purchase [data-invoice-feedback]` el aviso «Esta factura está vinculada a una liquidación: solo lectura para finanzas» y no llamar a `updateDocument`, `deleteDocument` ni `syncSettlementFromDocument`; en `renderInvoices`, pasar `readOnlyIds` calculado desde `erp.payrollSettlements` cuando el rol sea `finanzas`; exportar ambos handlers para el intento directo de T043 (FR-011, FR-019)
- [X] T048 [P] [US3] Extender `src/components/invoice-list.js` y `src/components/invoice-purchase-list.js` para aceptar `readOnlyIds` y, solo para esos documentos cuando el rol sea `finanzas`, omitir los botones «Editar»/«Eliminar» y añadir el aviso «solo lectura» en la fila, reutilizando las clases existentes sin alterar la identidad visual de la spec 004 (FR-011, FR-019, SC-005)
- [X] T049 [US3] Añadir en `index.html` el bloque oculto `#payroll-payment-form` con `#payroll-payment-fechaPago` (fecha, requerido), `#payroll-payment-submit` («Registrar pago») y `#payroll-payment-cancel`, reutilizando las clases del formulario existente; extender `src/components/payroll-list.js` con `canRegisterPayment` y `onRegisterPayment` y renderizar `data-action="register-payment"` únicamente para liquidaciones `Emitidas` cuando el rol sea `finanzas`, sin renderizar «Editar» ni «Asociar» en ese caso (FR-011, US2 esc. 7, US3 esc. 7)
- [X] T050 [US3] En `src/app.js`, pasar `canRegisterPayment: state.session?.role === 'finanzas'` en `refreshPayrollAdmin`, abrir `#payroll-payment-form` desde `onRegisterPayment` y implementar `registerPayrollPayment(id)`: validar estado `Emitida` y `fechaPago`, fijar `montoPagado` igual a `totalAmount`, actualizar `estado: 'Pagada'`, `customFields.montoPagado`, `customFields.fechaPago` y `updatedAt` mediante `updateDocument`/`savePayrollSettlements`, sin tocar el modelo de datos ni las claves `erp.*` (FR-011, FR-019, SC-005)
- [X] T051 [US1] En `src/app.js`, invocar `confirmAction` desde `handlePayrollCreateSubmit`/`submitPayrollCreate` solo cuando el RUT normalizado no exista como tercero personal, con un mensaje que indique que se creará el trabajador y su acceso con contraseña inicial `initialPassword(rut)`; si se cancela, devolver sin llamar a `addEntity`, `createAccessRecord`, `addDocument` ni a `savePayrollSettlements` (FR-003, SC-001)

### Verificación final

- [X] T052 Ejecutar `npm run check` desde la raíz del repositorio (`package.json`) y corregir únicamente las regresiones introducidas por T043–T051 hasta dejar lint, format y `npm test -- --run` en verde (SC-006)

**Dependencias de esta corrección**: T043 ∥ T044 ∥ T045 → T046 → T047 ∥ T048 → T049 → T050 → T051 → T052. US1 y US3 son independientes salvo por `src/app.js`, por eso T047, T050 y T051 son secuenciales.

**Checkpoint**: con T052 en verde, las decisiones de `Session 2026-11-24` quedan verificadas sin haber reescrito T001–T042, la spec 004, el modelo de datos ni las claves `erp.*`.

---

## Clarificación 2026-11-25 — tareas nuevas (T053+)

**Alcance**: solo las decisiones registradas en `spec.md` → `Clarifications` → `Session 2026-11-25`. No modificar, renumerar ni desmarcar T001–T052; no tocar la spec 004, el modelo de datos ni las claves `erp.*`.

**Orden de ejecución**: primero las pruebas (T053–T057, deben fallar), luego la implementación (T058–T062) y finalmente T063 (`npm run check`).

### US1 — Formulario propio de crear liquidación (Priority: P1)

**Goal**: la pestaña «Crear liquidación de sueldo» deja de reutilizar el formulario de facturas de compra y muestra únicamente RUT, nombre completo, período `AAAA-MM`, sueldo base, bonos, descuentos, fecha de emisión, fecha de vencimiento, serie y folio; el total se calcula como `sueldo base + bonos − descuentos`, no se escribe a mano, y los ids son propios con prefijo `payroll-create-field-` sin repetirse en la página. La alta automática del trabajador con confirmación permanece intacta.

**Independent Test**: con sesión de `administrador`, abrir `payroll-create`: el formulario contiene solo los diez campos acordados, el total se deriva del desglose, todos los ids son únicos y no aparece ningún id `invoice-purchase-field-`; al enviar con RUT nuevo aparece la confirmación, al aceptar se crean liquidación, tercero personal y acceso `trabajador`, y al cancelar no se persiste nada.

**Tests primero** ⚠️ (deben FALLAR antes de implementar):

- [X] T053 [P] [US1] Crear `tests/integration/payroll-create-dedicated-form.test.js`: con sesión de administrador y `byId('nav-payroll-create').click()`, verificar que `#payroll-create-form` contiene solo campos visibles con ids `payroll-create-field-rut`, `payroll-create-field-nombreCompleto`, `payroll-create-field-periodoLiquidacion`, `payroll-create-field-sueldoBase`, `payroll-create-field-bonos`, `payroll-create-field-descuentos`, `payroll-create-field-startDate`, `payroll-create-field-endDate`, `payroll-create-field-series` y `payroll-create-field-folio`; que no existen `[data-field]` para `entity_id`, `quantity`, `taxAmount`, `currency`, `paymentTerms`, `centroCosto`, `montoPagado`, `fechaPago` ni `status`; y que las etiquetas son RUT, Nombre completo, Período, Sueldo base, Bonos, Descuentos, Fecha de emisión, Fecha de vencimiento, Serie y Folio (FR-001, FR-002, US1 esc. 1)
- [X] T054 [P] [US1] Crear `tests/integration/payroll-create-amount.test.js`: completar sueldo base `500000`, bonos `100000` y descuentos `50000`; verificar que la salida de solo lectura `#payroll-create-field-totalAmount` muestra el total en pesos chilenos correspondiente a `550000` y NO es `input`, `select` ni `textarea`; al enviar, comprobar que `loadPayrollSettlements()` guarda `monto === 550000`, `sueldoBase === 500000`, `bonos === 100000` y `descuentos === 50000` sin propiedades nuevas (FR-002, US1 esc. 9, SC-007)
- [X] T055 [P] [US1] Crear `tests/integration/payroll-create-ids.test.js`: recopilar todos los elementos con `id` del documento después de abrir `payroll-create`, afirmar 0 ids duplicados, que cada id con prefijo `payroll-create-field-` está dentro de `#view-payroll-create`, que cada campo visible de `#payroll-create-form` tiene id con ese prefijo y que no existe ningún id `invoice-purchase-field-*` en esa vista (FR-002, SC-007, US1 esc. 1)
- [X] T056 [P] [US1] Actualizar `tests/integration/payroll-create.test.js`: reemplazar el helper `fillInvoiceForm()` y las aserciones de ids por los ids `payroll-create-field-*`, fijando sueldo base, bonos y descuentos con total derivado; conservar sin desmarcar los casos de T045/T046 de confirmación con RUT nuevo aceptada, RUT nuevo cancelada y RUT existente sin confirmación, verificando que con el formulario propio se siguen creando los tres registros y que al cancelar no se persiste nada en `erp.payrollSettlements`, `erp.entities` ni `erp.accessRecords` (FR-002, FR-003, SC-001)

### US2 — Listado exclusivo de liquidaciones (Priority: P1)

**Goal**: el listado de la vista de creación muestra solo liquidaciones; sin registros muestra exactamente «No hay liquidaciones registradas» y nunca el mensaje de facturas de compra.

**Independent Test**: con datos de demostración, el listado de `payroll-create` incluye trabajadores con liquidación y no incluye proveedores ni facturas de compra; con almacenamiento vacío, el mismo listado muestra «No hay liquidaciones registradas».

**Tests primero** ⚠️ (deben FALLAR antes de implementar):

- [X] T057 [P] [US2] Crear `tests/integration/payroll-create-list.test.js`: con datos de demostración verificar que `#payroll-create-list` solo muestra liquidaciones de terceros `personal` (captions «Ana Pérez Soto» y «Bruno Soto Vega», nunca «Proveedores del Sur S.A.»; como el listado pasa a `renderPayrollList`, que no usa `caption`, la prueba revisa el texto de las filas) y no botones de factura `data-action="edit"`/`data-action="delete"`; con `localStorage.clear()` verificar que contiene exactamente «No hay liquidaciones registradas» y no «No hay facturas de compra registradas» (FR-001, FR-007, US1 esc. 10, US2 esc. 8, SC-007)

### Implementación

- [X] T058 [P] [US1] En `index.html`, reemplazar el `<form id="payroll-create-form">` vacío de `#view-payroll-create` por el formulario propio con los diez `data-field` y los ids `payroll-create-field-*` de T053, una salida de solo lectura `#payroll-create-field-totalAmount`, el feedback existente `[data-invoice-feedback]` y las clases visuales actuales; quitar `data-tipo-factura="compra"` de `#payroll-create-list` y no modificar la identidad visual de la spec 004 (FR-001, FR-002, FR-019). *Al implementar se quitó también el bloque oculto `.invoice-controls` (`#payroll-create-filter`, `#payroll-create-edit`), que solo usaba el formulario de facturas, y se agregaron en `src/styles.css` tres reglas para que el total y el botón ocupen su propia fila y el listado no muestre la columna vacía «Acciones».*
- [X] T059 [P] [US1] Crear `src/components/payroll-create-form.js` con `initPayrollCreateForm({ config, root, onSubmit, onDirtyChange })`: enlazar solo los diez campos acordados, calcular `totalAmount = sueldoBase + bonos - descuentos` en tiempo real, exponer `reset`, `setFeedback`, `showErrors`, `focus` y `getDirty`, mantener la confirmación de «cambios sin guardar», y NO importar `createPurchaseForm`/`createInvoiceForm` ni agregar campos de factura (FR-002, US1 esc. 1 y 9)
- [X] T060 [US1] En `src/app.js`, sustituir en `initInvoiceForms` la instancia de `createPurchaseForm` usada por `#view-payroll-create` (alrededor de las líneas 1318–1347) por `initPayrollCreateForm`, pasando `extras: { rut, nombreCompleto }` desde los nuevos campos a `submitPayrollCreate`; dejar intactos `confirmAction` en `handlePayrollCreateSubmit`, la creación automática del tercero personal y del acceso `trabajador`, y el flujo de facturas de compra (FR-001, FR-003, SC-001)
- [X] T061 [US2] En `src/app.js`, reemplazar `renderPurchaseList(...)` en `refreshPayrollCreateList` (alrededor de las líneas 1210–1232) por un render de liquidaciones obtenido de `loadPayrollSettlements()` filtrado por terceros `personal`, usando `renderPayrollList` sin acciones de editar, asociar ni registrar pago en `#payroll-create-list`, y mostrando `<p class="empty-state">No hay liquidaciones registradas</p>` cuando no haya registros, sin invocar nunca el mensaje de facturas de compra (FR-001, FR-007, US1 esc. 10, US2 esc. 8)
- [X] T062 [US1] En `src/app.js`, ajustar `ensurePayrollSettlement` para persistir `sueldoBase`, `bonos`, `descuentos` y el `monto` calculado desde los valores del formulario propio en los campos ya existentes de `erp.payrollSettlements`, sin añadir propiedades, sin cambiar claves `erp.*` ni el modelo de datos y sin afectar la spec 004 (FR-002, FR-019, Key Entities)

### Verificación final

- [X] T063 Ejecutar `npm run check` desde la raíz del repositorio (`package.json`) y corregir únicamente las regresiones introducidas por T053–T062 hasta dejar lint, format y `npm test -- --run` en verde, sin desmarcar T001–T052 (SC-006)

**Dependencias de esta corrección**: T053 ∥ T054 ∥ T055 ∥ T056 ∥ T057 → T058 ∥ T059 → T060 → T061 → T062 → T063. Las pruebas son paralelas entre sí; la implementación es secuencial en `src/app.js`.

> **Nota de implementación (25-11-2026).** T053–T062 se implementaron con ayuda directa de Claude sobre estas mismas tareas, sin cambiar T001–T052, la spec 004, el modelo de datos ni las claves `erp.*`. El formulario valida además que el sueldo base sea obligatorio y que sueldo base, bonos y descuentos no sean negativos. La «confirmación de cambios sin guardar» se mantiene a través de `state.payrollCreateDirty`, que se suma a la advertencia al cerrar sesión. T063 se verificó con `npm run check` en verde antes del commit `431642b` (25-11-2026).

**Checkpoint**: con T063 en verde, las decisiones de `Session 2026-11-25` quedan verificadas sin haber reescrito T001–T052, la spec 004, el modelo de datos ni las claves `erp.*`.

> **Sincronización de documentos (26-11-2026).** Tras `/speckit.analyze` se actualizaron `plan.md`, `research.md` (R2 y R6), `data-model.md`, `quickstart.md` y los tres contratos para reflejar las clarificaciones del 24-11 y 25-11; en este archivo solo se agregaron notas de *superseded*, sin desmarcar ni renumerar tareas.

- [X] T064 [US2] Corregir el listado vacío de `payroll-create` tras «Cargar demostración»: en `src/app.js`, junto a `if (target === 'payroll-admin') refreshPayrollAdmin();` (alrededor de la línea 810), agregar `if (target === 'payroll-create') refreshPayrollCreateList();` en la función de navegación para que `#payroll-create-list` se llene al abrir la vista, sin guardar ni recargar; y crear `tests/integration/payroll-create-list-on-navigation.test.js` que cargue la demostración con `loadDemoData(userConfig)`, inicie sesión con `setupAdminSession()`, llame a `initApp(userConfig)`, haga clic en `nav-payroll-create` y verifique que `#payroll-create-list` muestra «Ana Pérez Soto» y «Bruno Soto Vega» sin enviar el formulario ni recargar la página (FR-007, US2 esc. 8, SC-007). Luego volver a ejecutar `npm run check` desde la raíz del repositorio (`package.json`) sin desmarcar T001–T063.
