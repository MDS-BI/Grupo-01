# Contract: Pestaña «Crear liquidación de sueldo» (flujo de creación)

**Feature**: [spec.md](../spec.md) | **Date**: 2026-11-24 (actualizado 2026-11-26)

Contrato de la vista nueva `payroll-create` (solo `administrador`).

> **Actualización 2026-11-26 (tras `/speckit.analyze`).** Este contrato se reescribió para el formulario propio de la `Session 2026-11-25` de la spec (T053–T064). La versión anterior describía `createPurchaseForm` con la opción `extraFields`, enfoque que quedó reemplazado.

## 1. Contrato de UI

- Sección `#view-payroll-create` en `index.html`, clase `view` oculta por defecto, con título «Crear liquidación de sueldo» (`#payroll-create-form-title`).
- Formulario propio `#payroll-create-form`, enlazado por `initPayrollCreateForm` (`src/components/payroll-create-form.js`). NO usa `<template id="invoice-fields">` ni `createPurchaseForm`.
- Contiene exactamente diez campos, en este orden, todos con id `payroll-create-field-<campo>` y `data-field="<campo>"`:

| Campo (`data-field`) | Etiqueta | Tipo | Obligatorio |
|---|---|---|---|
| `rut` | RUT | text | Sí |
| `nombreCompleto` | Nombre completo | text | Sí |
| `periodoLiquidacion` | Período (AAAA-MM) | text, formato `AAAA-MM` con mes 01–12 | Sí (si llega vacío se toma de la fecha de emisión) |
| `sueldoBase` | Sueldo base | number ≥ 0 | Sí |
| `bonos` | Bonos | number ≥ 0 | No (vacío = 0) |
| `descuentos` | Descuentos | number ≥ 0 | No (vacío = 0) |
| `startDate` | Fecha de emisión | date | Sí |
| `endDate` | Fecha de vencimiento | date, igual o posterior a la emisión | Sí |
| `series` | Serie | text | No |
| `folio` | Folio | text | Sí |

- **Total**: salida de solo lectura `#payroll-create-field-totalAmount` (no es un campo de entrada) que se recalcula en cada `input` como `sueldo base + bonos − descuentos` y se muestra con `formatCurrencyCLP`.
- **No se muestran**: selector de tercero (`entity_id`), Cantidad, Impuesto, Moneda, Condiciones de pago, Centro de costo, Monto pagado, Fecha de pago ni Estado (FR-002).
- **Ids**: ningún id de la página se repite; dentro de `#view-payroll-create` no hay ids `invoice-purchase-field-*` (FR-002, SC-007).
- **Errores**: junto a cada campo (`#payroll-create-field-<campo>-error`) y en `[data-form-error]` para los errores generales; **feedback** de éxito en `[data-invoice-feedback]`.
- **Cambios sin guardar**: el formulario informa `onDirtyChange`; al cerrar sesión con cambios se pide confirmación.
- **Listado de respaldo** `#payroll-create-list`: solo liquidaciones de terceros `personal`, en solo lectura y sin columna de acciones; sin registros muestra exactamente «No hay liquidaciones registradas» (FR-001). Se refresca al abrir la pestaña (T064) y después de cada guardado.

## 2. Contrato de comportamiento (onSubmit)

Entrada: `values` del formulario propio (`startDate`, `endDate`, `series`, `folio`, `totalAmount` calculado, `status: 'Borrador'`, `customFields: { tipoFactura: 'compra', periodoLiquidacion }`) + `extras = { rut, nombreCompleto }` + `breakdown = { sueldoBase, bonos, descuentos }`.

```
initPayrollCreateForm → submit:
  0. sueldo base vacío, o sueldo base / bonos / descuentos negativos
     → errores junto al campo, NADA persistido
  → submitPayrollCreate(values, null, extras, breakdown)

handlePayrollCreateSubmit(values, { rut, nombreCompleto }):
  1. normalizeRut(rut) + validar DV → inválido: ValidationFailure (campo rut), NADA persistido
  2. nombreCompleto vacío          → ValidationFailure (campo nombreCompleto), NADA persistido
  3. entidad = entities.find(e => e.customFields.rut === rutNormalizado)
     - existe && NO personal                  → rechazo (mensaje claro), NADA persistido
  4. acceso por RUT o entityId
     - existe inactivo / vínculo incompatible → rechazo, NADA persistido
  5. validar el documento (folio, fechas, período AAAA-MM, total ≥ 0) → errores: NADA persistido
  6. RUT nuevo (sin entidad) → confirmAction('Se creará el trabajador … La contraseña inicial será XXXX.')
     - cancelado                              → NADA persistido (FR-003)
  7. entidad nueva → addEntity({ name: nombreCompleto, customFields: { tipoTercero: 'personal', rut } })
     acceso nuevo  → createAccessRecord({ accessId: rut, role: 'trabajador',
                                          entityId, password: initialPassword(rut) })
     RUT existente → se reutilizan entidad y acceso (FR-004)
  8. addDocument({ ...values, entity_id })  (factura de compra por detrás, estado Borrador)
  9. ensurePayrollSettlement(document, breakdown)
     → la liquidación guarda periodo, sueldoBase, bonos, descuentos y monto = total
  10. form.reset(); refresh(); setFeedback('Liquidación guardada…')
```

Invariante: **nunca** hay registros parciales (si falla o se cancela cualquier paso previo a la persistencia, no se escribe nada); **nunca** se duplica entidad ni acceso si el RUT ya existe; el total **nunca** se escribe a mano.

## 3. Efectos observables

| Escenario | Entidad | Acceso `trabajador` | Liquidación |
|---|---|---|---|
| RUT nuevo, campos válidos | creada (`personal`) | creada, `password = initialPassword(rut)` | creada/vinculada |
| RUT ya existe como personal con acceso activo | sin cambios | sin cambios | creada/actualizada |
| RUT nuevo, confirmación cancelada | — | — | — (nada persistido) |
| RUT inválido / campos vacíos / montos negativos | — | — | — (rechazo) |
| RUT existe pero no es personal o acceso inactivo | sin cambios | sin cambios | — (rechazo) |

## 4. Permisos

- Solo `administrador` ve la pestaña y puede enviar el form; `finanzas`/`trabajador` son redirigidos (ver [role-module-matrix.md](./role-module-matrix.md)).
- El trabajador creado queda sujeto a las restricciones existentes del rol `trabajador` (FR-006): solo su última liquidación e historial, sin edición.

## 5. Dependencias

- **Nueva**: `initPayrollCreateForm` (`src/components/payroll-create-form.js`).
- **Reutilizadas (sin duplicados)**: `handlePayrollCreateSubmit`, `ensurePayrollSettlement`, `confirmAction` (`src/app.js`) · `normalizeRut` / `initialPassword` (`auth.js`) · `createAccessRecord` (`access-storage.js`) · `addEntity` / `addDocument` (`storage.js`) · `renderPayrollList` (`payroll-list.js`) · `formatCurrencyCLP` (`format.js`).
- **Ya no se usan en esta pestaña**: `createPurchaseForm` y la opción `extraFields` de `createInvoiceForm` (T013 y T016, reemplazadas por T058–T062).
