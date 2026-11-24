# Implementation Plan: Pestañas de liquidación de sueldo y permisos por rol

**Branch**: `main` (trabajo local, sin rama nueva, sin push) | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-payroll-tabs-roles/spec.md`

## Summary

Separar la gestión de nómina del resto del ERP mediante dos pestañas exclusivas del administrador —«Crear liquidación de sueldo» (formulario existente de factura de compra + campos obligatorios RUT y nombre completo, con alta automática de tercero personal y acceso `trabajador` cuya contraseña inicial son los primeros 4 dígitos del RUT) y «Gestionar liquidaciones de sueldo» (listado con búsqueda por RUT en vivo y edición seleccionable)—, dejar el listado en modo solo lectura para `finanzas`, y recortar el alcance del administrador a las liquidaciones (más «Control de accesos»), ocultando los avisos al desarrollador para todos los roles.

**Enfoque técnico (de research.md)**: ampliaciones quirúrgicas sobre el flujo de compra ya existente —reutilizar `createPurchaseForm` sobre el DOM de la nueva pestaña, añadir `canEdit` al `payroll-list`, extender `resolveAdminSettlements` con filtro `rut` en vivo, y añadir los nuevos módulos/vistas a `VIEWS`, `ACCESS_MATRIX` y las listas de módulos del shell— sin duplicar componentes ni reescribir archivos completos; con pruebas (TDD) antes que la implementación en cada incremento.

## Technical Context

**Language/Version**: JavaScript ESM moderno (ES2022+), sin framework, sin transpilación propia (Vite sirve y transforma).

**Primary Dependencies**: Vite 8 (dev/build), Vitest 4 + jsdom 30 (testing), ESLint 8 + Prettier 3 (lint/format); `globals` para ESLint.

**Storage**: `localStorage` con claves prefijadas `erp.*` (`erp.payrollSettlements`, `erp.entities`, `erp.accessRecords`, `erp.compra`/`erp.venta`, etc.); sin backend ni red.

**Testing**: Vitest (`npm test -- --run`) con `jsdom`; tests unitarios en `tests/unit/`, integración (DOM real vía fixture `tests/setup/dom.js`) en `tests/integration/`. Gate de calidad: `npm run check` (lint + format:check + tests).

**Target Platform**: Navegador desktop/moderno (MVP solo navegador, sin SSR); ejecución local con `npm run dev`.

**Project Type**: Web application SPA de un solo proyecto (frontend-only, vanilla JS).

**Performance Goals**: Búsqueda por RUT filtrando en vivo en < 1 s con el volumen del MVP (SC-003); sin re-renders innecesarios del listado (render completo del componente por cada `input`, aceptable por tamaño del MVP).

**Constraints**: Cambios mínimos y quirúrgicos (FR-019); reutilizar `invoice-purchase-form`, `payroll-list`, `access-storage` sin duplicados; TDD (Constitución II); trabajo en `main` local sin ramas ni push.

**Scale/Scope**: ~50 archivos fuente, ~70 archivos de prueba; 3 roles, 10+ módulos; MVP con decenas de registros en `localStorage`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Code Quality & Maintainability** ✅ — Se reutilizan componentes existentes (`createPurchaseForm`, `payroll-list`, `createAccessRecord`); los cambios se limitan a extensiones puntuales (`canEdit`, filtro `rut`, nuevos módulos) con nombres y patrones ya acordados en el código. Abstracciones solo donde resuelven una necesidad clara (p. ej., el wrapper de formulario de creación).
- **II. Test-First & Verification** ✅ — Plan organizado en incrementos TDD: primero tests unitarios/integración que fallan (matriz de permisos, alta automática, búsqueda RUT, solo-lectura finanzas), luego implementación. `npm run check` como gate final (SC-006).
- **III. User Experience Consistency** ✅ — Se reutilizan los patrones existentes de formulario, feedback, estados vacíos, confirmación de «cambios sin guardar» y mensajes de redirección; la navegación del shell conserva su estilo actual; etiquetas en español coherentes con las existentes.
- **IV. Performance & Reliability** ✅ — Filtrado local sincrónico sobre arrays pequeños; sin round-trips ni trabajo bloqueante añadido; la búsqueda en vivo re-renderiza solo el listado.
- **Quality Standards** ✅ — `npm run check` (ESLint + Prettier + Vitest) sin errores; documentación de la feature actualizada (spec, plan, contratos); justificación de decisiones en `research.md`.
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
├── #view-payroll-create (nueva sección) # Pestaña «Crear liquidación de sueldo»
├── #view-payroll-admin (existente)      # Pestaña «Gestionar liquidaciones» (+ búsqueda RUT)
└── <template id="invoice-fields">       # Campos compartidos del formulario de factura

src/
├── app.js                              # VIEWS, ACCESS_MATRIX, resolveRoute, refreshPayrollAdmin,
│                                       # handleInvoiceSubmit, initInvoiceForms, handleQuickAction
├── payroll.js                          # resolveAdminSettlements (filtro rut en vivo)
├── auth.js                             # normalizeRut, initialPassword (sin cambios)
├── access-storage.js                   # createAccessRecord (alta automática trabajador)
├── storage.js                          # addEntity, load/savePayrollSettlements (sin cambios de forma)
├── module-config.js                    # labels/módulos (añadir etiqueta payrollCreate si aplica)
└── components/
    ├── shell.js                        # ADMIN_MODULES, FINANCE_MODULES, navLabel (alcance por rol)
    ├── invoice-purchase-form.js        # createPurchaseForm (reutilizado, sin cambios)
    ├── invoice-form.js                 # createInvoiceForm (posible extensión mínima para campos RUT/nombre)
    ├── payroll-list.js                 # + flag canEdit (ocultar «Editar» para finanzas)
    ├── payroll-form.js                 # edición existente (sin cambios)
    └── dev-notifications.js            # panel que deja de renderizarse para todo rol

tests/
├── setup/dom.js + domFixture.js        # Fixture jsdom existente
├── unit/
│   ├── payroll.test.js                 # + filtro RUT de resolveAdminSettlements
│   ├── access-storage.test.js          # + sin duplicados al reusar RUT existente
│   └── (nuevo) creation-flow.test.js   # Reglas de alta (entity+access+settlement atómicos)
└── integration/
    ├── payroll-admin.test.js           # + búsqueda en vivo, edición admin
    ├── finanzas-permissions.test.js    # + solo lectura en liquidaciones
    ├── navigation-menu.test.js         # + módulos por rol actualizados
    └── (nuevo) payroll-create.test.js  # Pestaña de creación end-to-end
```

**Structure Decision**: Un solo proyecto SPA (opción «Single project / Web application» combinada): frontend-only con `src/` para código de producción y `tests/` dividido en `unit/`, `integration/` y `setup/`. No hay backend ni paquetes múltiples; toda la feature se resuelve dentro de esta estructura existente sin crear directorios nuevos salvo los archivos de prueba y de contratos indicados.

## Complexity Tracking

> Sin violaciones de la Constitución: no se rellena esta tabla.
