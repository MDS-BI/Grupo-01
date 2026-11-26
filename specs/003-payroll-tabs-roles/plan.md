# Implementation Plan: Pestañas de liquidación de sueldo y permisos por rol

**Branch**: `main` (trabajo local, sin rama nueva, sin push) | **Date**: 2026-11-23 (actualizado 2026-11-26) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-payroll-tabs-roles/spec.md`

## Summary

Separar la gestión de nómina del resto del ERP mediante dos pestañas de nómina —la de creación, exclusiva del administrador; la de gestión, compartida con `finanzas` en solo lectura—: «Crear liquidación de sueldo» (formulario propio de liquidación con diez campos —RUT, nombre completo, período, sueldo base, bonos, descuentos, fechas de emisión y vencimiento, serie y folio— y total calculado como sueldo base + bonos − descuentos; con confirmación previa y alta automática de tercero personal y acceso `trabajador` cuya contraseña inicial son los primeros 4 dígitos del RUT) y «Gestionar liquidaciones de sueldo» (listado con búsqueda por RUT en vivo y edición seleccionable); dejar el listado en modo solo lectura para `finanzas` —con la única excepción de registrar el pago de liquidaciones `Emitidas` y con las facturas de compra vinculadas en solo lectura desde cualquier vista—, y recortar el alcance del administrador a las liquidaciones (más «Control de accesos»), ocultando los avisos al desarrollador para todos los roles.

**Enfoque técnico (de research.md)**: ampliaciones quirúrgicas sobre el código existente —un componente propio `initPayrollCreateForm` (`src/components/payroll-create-form.js`) para la pestaña de creación, que reutiliza `handlePayrollCreateSubmit`, `createAccessRecord` y la creación de la factura de compra por detrás; flags `canEdit`, `canAssociate` y `canRegisterPayment` en `payroll-list`; `registerPayrollPayment` para el pago de `finanzas`; `isLinkedPayrollDocument` para bloquear la edición y eliminación de facturas vinculadas; filtro `rut` en vivo en `resolveAdminSettlements`; y los nuevos módulos/vistas en `VIEWS`, `ACCESS_MATRIX` y las listas de módulos del shell— sin reescribir archivos completos y con pruebas (TDD) antes que la implementación en cada incremento.

> **Actualización 2026-11-26 (tras `/speckit.analyze`).** El enfoque original de este plan —reutilizar `createPurchaseForm` con la opción `extraFields` para añadir RUT y nombre (research R2)— quedó reemplazado por las clarificaciones de la `Session 2026-11-25` de la spec: la pestaña usa un formulario propio con ids `payroll-create-field-*` (tareas T053–T064). Las clarificaciones de la `Session 2026-11-24` agregan el registro de pago por `finanzas` y la solo lectura de facturas vinculadas (T043–T050).

## Technical Context

**Language/Version**: JavaScript ESM moderno (ES2022+), sin framework, sin transpilación propia (Vite sirve y transforma).

**Primary Dependencies**: Vite 8 (dev/build), Vitest 4 + jsdom 30 (testing), ESLint 8 + Prettier 3 (lint/format); `globals` para ESLint.

**Storage**: `localStorage` con claves prefijadas `erp.*` (`erp.payrollSettlements`, `erp.entities`, `erp.accessRecords`, `erp.compra`/`erp.venta`, etc.); sin backend ni red.

**Testing**: Vitest (`npm test -- --run`) con `jsdom`; tests unitarios en `tests/unit/`, integración (DOM real vía fixture `tests/setup/dom.js`) en `tests/integration/`. Gate de calidad: `npm run check` (lint + format:check + tests).

**Target Platform**: Navegador desktop/moderno (MVP solo navegador, sin SSR); ejecución local con `npm run dev`.

**Project Type**: Web application SPA de un solo proyecto (frontend-only, vanilla JS).

**Performance Goals**: Búsqueda por RUT filtrando en vivo en < 1 s con el volumen del MVP (SC-003); sin re-renders innecesarios del listado (render completo del componente por cada `input`, aceptable por tamaño del MVP).

**Constraints**: Cambios mínimos y quirúrgicos (FR-019); reutilizar `payroll-list`, `access-storage` y la lógica de alta (`handlePayrollCreateSubmit`) sin duplicados; el formulario de creación es propio y NO reutiliza `invoice-purchase-form` (Session 2026-11-25); sin cambios en el modelo de datos ni en las claves `erp.*`; TDD (Constitución II); trabajo en `main` local sin ramas ni push.

**Scale/Scope**: ~50 archivos fuente, ~70 archivos de prueba; 3 roles, 10+ módulos; MVP con decenas de registros en `localStorage`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality & Maintainability** ✅ — Se reutilizan componentes existentes (`payroll-list`, `createAccessRecord`, `handlePayrollCreateSubmit`); el único componente nuevo es `payroll-create-form.js`, justificado porque el formulario de compra mostraba campos que no aplican a una liquidación (Session 2026-11-25); el resto son extensiones puntuales (`canEdit`, `canRegisterPayment`, filtro `rut`, nuevos módulos) con nombres y patrones ya acordados en el código. Abstracciones solo donde resuelven una necesidad clara.
- **II. Test-First & Verification** ✅ — Plan organizado en incrementos TDD: primero tests unitarios/integración que fallan (matriz de permisos, alta automática, búsqueda RUT, solo-lectura finanzas), luego implementación. `npm run check` como gate final (SC-006).
- **III. User Experience Consistency** ✅ — Indicadores visibles sin scroll a 1366 × 768 verificados en el Escenario E de `quickstart.md`. Se reutilizan los patrones existentes de formulario, feedback, estados vacíos, confirmación de «cambios sin guardar» y mensajes de redirección; la navegación del shell conserva su estilo actual; etiquetas en español coherentes con las existentes.
- **IV. Performance & Reliability** ✅ — Filtrado local sincrónico sobre arrays pequeños; sin round-trips ni trabajo bloqueante añadido; la búsqueda en vivo re-renderiza solo el listado.
- **Quality Standards** ✅ — `npm run check` (ESLint + Prettier + Vitest) sin errores; documentación de la feature actualizada (spec, plan, data-model, contratos y quickstart, sincronizados el 2026-11-26 con las sesiones de clarificación del 24 y 25-11); justificación de decisiones en `research.md`.
- **Development Workflow** ✅ — Incrementos pequeños con criterios de aceptación (historias US1/US2/US3 verificables por separado); validación explícita en `quickstart.md`; sin deuda técnica nueva (los cambios quirúrgicos minimizan el riesgo).

**Gate pre-Phase 0: PASS** (sin violaciones; no se requiere `Complexity Tracking`).

**Gate post-Phase 1: PASS** — `data-model.md`, `contracts/` y `quickstart.md` no introducen dependencias, tecnologías ni patrones nuevos; todo se apoya en estructuras ya existentes y en los mismos gates de calidad.

## Project Structure

### Documentation (this feature)

```text
specs/003-payroll-tabs-roles/
├── plan.md              # Este archivo (/speckit-plan)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/           # Phase 1 output (/speckit-plan)
│   ├── role-module-matrix.md   # Matriz rol↔módulos/vistas y reglas de redirección
│   ├── creation-flow.md        # Contrato del formulario de creación y alta automática
│   └── settlement-list.md      # Contrato del listado (búsqueda RUT, edición/lectura)
├── checklists/
│   └── requirements.md  # Checklist de requirements (16/16)
└── tasks.md             # Phase 2 output (/speckit-tasks — NO creado por /speckit-plan)
```

### Source Code (repository root)

```text
index.html
├── #nav-* / [data-module]              # Botones de navegación (añadir payroll-create)
├── #view-payroll-create (nueva sección) # Pestaña «Crear liquidación de sueldo»: formulario propio
│                                       # #payroll-create-form (ids payroll-create-field-*) + #payroll-create-list
├── #view-payroll-admin (existente)      # Pestaña «Gestionar liquidaciones» (+ búsqueda RUT, #payroll-payment-form)
└── <template id="invoice-fields">       # Campos de factura (solo facturas de venta y compra)

src/
├── app.js                              # VIEWS, ACCESS_MATRIX, resolveRoute, refreshPayrollAdmin,
│                                       # refreshPayrollCreateList, handlePayrollCreateSubmit,
│                                       # ensurePayrollSettlement, registerPayrollPayment,
│                                       # isLinkedPayrollDocument, initInvoiceForms, handleQuickAction
├── payroll.js                          # resolveAdminSettlements (filtro rut en vivo)
├── auth.js                             # normalizeRut, initialPassword (sin cambios)
├── access-storage.js                   # createAccessRecord (alta automática trabajador)
├── storage.js                          # addEntity, load/savePayrollSettlements (sin cambios de forma)
├── module-config.js                    # labels/módulos (etiqueta payrollCreate)
├── styles.css                          # reglas puntuales de #payroll-create-form y #payroll-create-list
└── components/
    ├── shell.js                        # ADMIN_MODULES, FINANCE_MODULES, navLabel (alcance por rol)
    ├── payroll-create-form.js          # NUEVO: formulario propio, total = sueldo base + bonos − descuentos
    ├── invoice-form.js                 # opción opt-in extraFields (T013); ya no la usa la pestaña de creación
    ├── invoice-list.js                 # readOnlyIds: aviso de solo lectura en facturas vinculadas
    ├── payroll-list.js                 # flags canEdit, canAssociate, canRegisterPayment
    ├── payroll-form.js                 # edición existente (sin cambios)
    └── dev-notifications.js            # panel que deja de renderizarse para todo rol

tests/                                  # Árbol representativo: suites que esta funcionalidad crea o cambia
├── setup/dom.js + domFixture.js        # Fixture jsdom existente
├── unit/
│   ├── payroll.test.js                 # + filtro RUT de resolveAdminSettlements
│   ├── access-storage.test.js          # + sin duplicados al reusar RUT existente
│   ├── finanzas-role.test.js           # alcance del rol finanzas
│   └── creation-flow.test.js           # reglas de alta (entity + access + settlement atómicos)
└── integration/
    ├── payroll-admin.test.js           # búsqueda en vivo, edición admin
    ├── finanzas-permissions.test.js    # solo lectura en liquidaciones
    ├── finance-linked-invoice.test.js  # facturas vinculadas en solo lectura (T043)
    ├── finance-settlement-payment.test.js # «Registrar pago» de Emitidas (T044)
    ├── navigation-menu.test.js         # módulos por rol actualizados
    ├── payroll-create.test.js          # pestaña de creación end-to-end
    ├── payroll-create-dedicated-form.test.js # diez campos acordados (T053)
    ├── payroll-create-amount.test.js   # total calculado y desglose persistido (T054)
    ├── payroll-create-ids.test.js      # ids únicos payroll-create-field-* (T055)
    ├── payroll-create-list.test.js     # listado solo de liquidaciones (T057)
    └── payroll-create-list-on-navigation.test.js # listado al abrir la pestaña (T064)
```

**Structure Decision**: Un solo proyecto SPA (opción «Single project / Web application» combinada): frontend-only con `src/` para código de producción y `tests/` dividido en `unit/`, `integration/` y `setup/`. No hay backend ni paquetes múltiples; toda la feature se resuelve dentro de esta estructura existente sin crear directorios nuevos salvo los archivos de prueba y de contratos indicados.

## Complexity Tracking

> Sin violaciones de la Constitución: no se rellena esta tabla.
