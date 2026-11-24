# Contract: Pestaña «Crear liquidación de sueldo» (flujo de creación)

**Feature**: [spec.md](../spec.md) | **Date**: 2026-11-24

Contrato de la vista nueva `payroll-create` (solo `administrador`).

## 1. Contrato de UI

- Sección `#view-payroll-create` en `index.html`, clase `view` oculta por defecto.
- Contenido: título «Crear liquidación de sueldo» + formulario instanciado con **`createPurchaseForm`** (reutilizado, sin duplicar) sobre `<template id="invoice-fields">`, **más** dos campos obligatorios añadidos por la opción `extraFields` de `createInvoiceForm`:
  - `RUT` (text, requerido, se normaliza con `normalizeRut` al enviar)
  - `Nombre completo` (text, requerido)
- Feedback con el patrón existente `[data-invoice-feedback]`; errores con `showErrors()` junto a cada campo; confirmación de «cambios sin guardar» existente al cambiar de pestaña/cerrar sesión.

## 2. Contrato de comportamiento (onSubmit)

Entrada: `values` del form de compra + `{ rut, nombreCompleto }`.

```
handlePayrollCreateSubmit(values, { rut, nombreCompleto }):
  1. normalizeRut(rut) + validar DV → inválido: ValidationFailure (campo rut), NADA persistido
  2. nombreCompleto vacío          → ValidationFailure (campo nombre), NADA persistido
  3. entidad = entities.find(e => e.customFields.rut === rutNormalizado)
     - si existe && tipoTercero === 'personal'  → reusar entity_id (NO addEntity)
     - si existe && NO personal                 → rechazo (mensaje claro), NADA persistido
     - si no existe                            → addEntity({ name: nombreCompleto,
                                              customFields: { tipoTercero: 'personal', rut } })
  4. acceso = accessRecords.find(a => a.accessId === rutNormalizado || a.entityId === entity_id)
     - si acceso activo existe                  → NO crear (sin duplicados, FR-004)
     - si no existe                            → createAccessRecord({
                                              accessId: rut, role: 'trabajador',
                                              entityId: entity_id,
                                              password: initialPassword(rut) })
     - si acceso existe INACTIVO / vínculo incompatible → rechazo, NADA persistido
  5. addDocument({ ...values, entity_id, customFields: { tipoFactura: 'compra', ... } })
     → backfill/sync crea (o actualiza) la liquidación vinculada (FR-004)
  6. form.reset(); refresh(); setFeedback('Liquidación guardada…')
```

Invariante: **nunca** hay registros parciales (si falla cualquier paso previo a la persistencia, no se escribe nada); **nunca** se duplica entidad/acceso si el RUT ya existe.

## 3. Efectos observables

| Escenario | Entidad | Acceso `trabajador` | Liquidación |
|---|---|---|---|
| RUT nuevo, campos válidos | creada (`personal`) | creada, `password = initialPassword(rut)` | creada/vinculada |
| RUT ya existe como personal con acceso activo | sin cambios | sin cambios | creada/actualizada |
| RUT inválido / campos vacíos | — | — | — (rechazo) |
| RUT existe pero no es personal o acceso inactivo | sin cambios | sin cambios | — (rechazo) |

## 4. Permisos

- Solo `administrador` ve la pestaña y puede enviar el form; `finanzas`/`trabajador` son redirigidos (ver [role-module-matrix.md](./role-module-matrix.md)).
- El trabajador creado queda sujeto a las restricciones existentes del rol `trabajador` (FR-006): solo su última liquidación e historial, sin edición.

## 5. Dependencias reutilizadas (sin duplicados)

`createPurchaseForm` / `createInvoiceForm` · `normalizeRut`/`initialPassword` (`auth.js`) · `createAccessRecord` (`access-storage.js`) · `addEntity`/`addDocument`/backfill (`storage.js`) · `handleInvoiceSubmit`-style refresh (`app.js`).
