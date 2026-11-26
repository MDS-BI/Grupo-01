# Research: Pestañas de liquidación de sueldo y permisos por rol

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-24

Fase 0 del plan. Todos los `NEEDS CLARIFICATION` del contexto técnico quedan resueltos aquí.

## R1. Cómo añadir una vista/pestaña nueva al flujo existente

**Decision**: Añadir una nueva sección `#view-payroll-create` en `index.html`, un módulo `payroll-create` en `VIEWS` y `ACCESS_MATRIX` de `src/app.js`, y el botón de navegación `data-module="payroll-create"` en el nav del shell. La vista se activa con el mecanismo `showModule()` existente.

**Rationale**: El proyecto no tiene router: la navegación es un mapa `VIEWS → allowed roles → sección oculta/mostrada` más `resolveRoute()` para redirecciones. Añadir una entrada sigue exactamente el patrón de las 10 vistas actuales y respeta FR-016 (redirección de vistas no permitidas) sin lógica nueva.

**Alternatives considered**:
- Reusar `payroll-admin` con sub-pestañas internas (tabs DCL): rechazado; el usuario pidió «pestañas» como módulos de navegación distintos y mezclaría permisos de creación/listado en una sola vista.
- Componente de tabs genérico nuevo: rechazado; introduce una abstracción sin necesidad clara (Constitución I).

## R2. Cómo reutilizar el formulario de factura de compra en la pestaña de creación

> **Superseded (2026-11-25).** Esta decisión fue reemplazada por la `Session 2026-11-25` de la spec: el formulario de compra mostraba campos que no aplican a una liquidación (Cantidad, Impuesto, Moneda, Condiciones de pago) y repetía ids `invoice-purchase-field-*`. La pestaña usa ahora un formulario propio, `src/components/payroll-create-form.js` (T058–T062). Se conserva el texto original como registro de la decisión.

**Decision**: Instanciar `createPurchaseForm(...)` (wrapper de `createInvoiceForm` con `tipoFactura: 'compra'`) apuntando al DOM de `#view-payroll-create`, en un nuevo init equivalente a `initInvoiceForms()` pero para la pestaña de creación; y ampliar `createInvoiceForm` de forma **opt-in** con una opción `extraFields: [{ key, label, type, required, dataset }]` que inserte «RUT» y «Nombre completo» antes de enviar.

**Rationale**: `createInvoiceForm` ya construye el form desde `<template id="invoice-fields">` y los `customFields` de config, expone `reset/focus/showErrors/setFeedback`, y `handleInvoiceSubmit('compra', ...)` ya dispara `addDocument` + backfill de liquidación. La opción `extraFields` evita duplicar el componente (requisito explícito) y solo se activa cuando se pasa, por lo que las vistas de factura existentes no cambian de comportamiento (FR-019).

**Alternatives considered**:
- Clonar `invoice-purchase-form.js` a un `payroll-create-form.js`: rechazado; duplicaría lógica de validación/feedback.
- Añadir RUT/nombre como `customFields` de config para todos los formularios de compra: rechazado; contaminaría las facturas de compra normales de finanzas.
- Renderizar el form existente de `view-invoice-purchase` moviendo nodos DOM: rechazado; frágil y rompería la vista de finanzas.

## R3. Alta automática: tercero personal + acceso trabajador + liquidación sin duplicados

**Decision**: En el `onSubmit` de la pestaña de creación (nueva función `handlePayrollCreateSubmit` en `app.js`): (1) normalizar RUT con `normalizeRut`; (2) buscar entidad existente por `customFields.rut` (o el campo donde hoy se guarda el RUT del tercero) → si existe y es `tipoTercero === 'personal'`, reutilizar su `entity_id` **sin** llamar `addEntity`; (3) si no existe, `addEntity({..., customFields: { tipoTercero: 'personal', rut }})`; (4) `createAccessRecord({ accessId: rut, role: 'trabajador', entityId, password: initialPassword(rut) })` solo si no hay acceso activo para ese `entityId`/RUT — si ya existe, no se crea ni se re-crea (FR-004); (5) `addDocument` de la factura de compra con `entity_id` del tercero (el backfill/`syncSettlementFromDocument` ya crea o sincroniza la liquidación). Todo en un solo `try` con `ValidationFailure` para no dejar registros parciales (FR-005).

**Rationale**: Reutiliza `createAccessRecord` (que ya valida RUT, duplicados y vínculo `entityId` con `ENTITY_ALREADY_LINKED`), `addEntity` y el flujo de submit de compra existente. El orden garantiza que, si falla la validación del acceso, aún no se ha persistido nada irreversible; se valida antes de persistir en el orden inverso (validar → crear entidad → crear acceso → crear documento) o se documenta compensación en tests.

**Alternatives considered**:
- Un «servicio de creación» nuevo en archivo aparte: rechazado para MVP; la lógica cabe en una función enfocada en `app.js` siguiendo el patrón de `handleInvoiceSubmit` (se puede extraer después si crece).
- Modificar `createAccessRecord` para aceptar «reusar si existe»: rechazado; su comportamiento actual (error `ENTITY_ALREADY_LINKED`) es correcto y lo que cambia es **quién decide** llamarlo, no la función.

## R4. Búsqueda por RUT en vivo en el listado

**Decision**: Añadir filtro `rut` a `resolveAdminSettlements({ filters })` en `src/payroll.js`: compara el RUT del tercero personal asociado (normalizado, coincidencia por prefijo/contenido para que sirva búsqueda parcial) contra el texto escrito. En `refreshPayrollAdmin`, leer el nuevo input `#payroll-filter-rut` y escuchar `input` (ya hay listeners `data-invoice-filter` en `initApp`) para re-renderizar con `renderPayrollList`.

**Rationale**: `resolveAdminSettlements` ya centraliza filtros `worker`, `period`, `entityId`; añadir `rut` es una extensión natural, testeable en unit tests puros (Constitución II). El listener `input` existente da el filtrado en vivo sin botón (FR-008) y reutiliza el patrón de los filtros actuales (Constitución III).

**Alternatives considered**:
- Filtrar en el componente `payroll-list`: rechazado; el filtrado ya vive en `payroll.js` y debe compartirse entre admin y finanzas.
- Usar la búsqueda global `search-term` del shell: rechazado; su alcance es transversal y podría exponer datos a roles no permitidos.

## R5. Listado solo lectura para finanzas (sin «Editar»)

**Decision**: Añadir flag `canEdit = true` a las opciones de `renderPayrollList`; cuando sea `false` no se crea el botón «Editar» (y no se asocia acceso). `refreshPayrollAdmin` pasa `canEdit: state.session?.role === 'administrador'`. Mantener `canAssociate` actual también solo para admin.

**Rationale**: Cambio de una línea en el render + una opción más; SC-005 (0 acciones de edición invocables para finanzas). La edición además ya está bloqueada en `ACCESS_MATRIX`/`resolveRoute`, pero el flag elimina la acción visible (doble defensa, UX clara).

**Alternatives considered**:
- CSS ocultando el botón: rechazado; la acción seguiría en el DOM y no es bloqueo real.
- Dos componentes de lista distintos: rechazado; duplicaría el componente.

## R6. Recorte de módulos por rol (admin limitado, finanzas conserva los suyos, avisos ocultos)

**Decision**: 
- `ADMIN_MODULES` en `shell.js` → `['dashboard', 'payroll-create', 'payroll-admin', 'access']`: el Panel y «Control de accesos» se conservan (FR-013, T008). *(Corregido el 2026-11-26: la versión inicial de esta decisión omitía `dashboard` y `access`.)*
- `FINANCE_MODULES` → se mantiene: entidades, facturas venta/compra, movimientos, cashflow, tracking, search + `payroll-admin`.
- Ocultar `dev-notifications` del nav para **todos** los roles (quitar de ambas listas y del dashboard/panel), manteniendo `appendDevNotification` en consola/localStorage (FR-020).
- `ACCESS_MATRIX` en `app.js`: `payroll-create: { administrador: true, finanzas: false, trabajador: false }`; `payroll-admin` admin+finanzas; quitar `dev-notifications` de la lista de vistas accesibles (o marcar `false` para todos + `resolveRoute` redirige).

**Rationale**: Es el punto único de verdad de navegación (`renderNav` filtra por `data-module` según rol) y de ruta (`resolveRoute`). Cambios de unas líneas; los tests de `navigation-menu` y `finanzas-permissions` actuales deberán actualizarse de forma explícita (SC-006 lo permite cuando la funcionalidad los cambia).

**Alternatives considered**:
- Eliminar el módulo `dev-notifications` del código: rechazado; FR-020 dice conservar el registro local/consola, solo sin panel visible.
- Función de «ocultamiento» en runtime con sesión: rechazado; ya existe el filtrado por rol, no hace falta capa nueva.

## R7. Estrategia de pruebas (TDD)

**Decision**: Para cada incremento, tests primero:
1. Unit `payroll.test.js`: filtro `rut` (parcial, vacío, sin coincidencias, normalización).
2. Unit `access-storage.test.js`/`creation-flow.test.js`: RUT nuevo → entidad+acceso creados; RUT existente → no duplica; RUT inválido → `ValidationFailure` sin registros.
3. Integration `payroll-create.test.js`: admin crea liquidación end-to-end; trabajador creado entra con `initialPassword`; finanzas/trabajador redirigidos al abrir `payroll-create`.
4. Integration `payroll-admin.test.js`: búsqueda en vivo; admin edita; finanzas no ve «Editar».
5. Integration `navigation-menu.test.js` + `finanzas-permissions.test.js` + `no-guest-access.test.js`: matriz actualizada; avisos ocultos para todos.

**Rationale**: Constitución II; `npm run check` como gate (SC-006).

**Alternatives considered**: N/A (obligatorio por constitución).

## R8. Coherencia con 002 (superseded)

**Decision**: No reescribir `specs/002-payroll-access-control/`; añadir notas puntuales «Superseded by 003-payroll-tabs-roles» en las secciones/FR de 002 y en `contracts/payroll-views.md` que contradigan: alcance del admin (pierde facturas/entidades/movimientos/etc. y avisos), tablas de permisos, y la vista única de liquidaciones. Tarea del plan registrada en `/speckit-tasks`.

**Rationale**: Requisito FR-018 explícito del usuario; mantiene 002 legible como histórico.

**Alternatives considered**: Reescribir 002 completo — rechazado explícitamente por el usuario.

## Resumen de `NEEDS CLARIFICATION`

| Incógnita | Estado |
|---|---|
| Mecanismo de vista/navegación | Resuelto (R1) |
| Reutilización del form de compra | Resuelto (R2); superseded el 2026-11-25 por el formulario propio |
| Alta automática sin duplicados | Resuelto (R3) |
| Búsqueda RUT en vivo | Resuelto (R4) |
| Solo lectura finanzas | Resuelto (R5) |
| Matriz de módulos/avisos | Resuelto (R6) |
| Estrategia TDD | Resuelto (R7) |
| Notas superseded en 002 | Resuelto (R8) |
