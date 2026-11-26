# Data Model: Pestañas de liquidación de sueldo y permisos por rol

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-24 (actualizado 2026-11-26)

Esta funcionalidad **no cambia la estructura** de las entidades existentes: solo agrega un filtro de lectura, un formulario propio de creación cuyos campos se guardan en propiedades ya existentes, reglas de creación derivadas y el registro de pago por `finanzas`.

> **Actualización 2026-11-26 (tras `/speckit.analyze`).** Las secciones «Campos del formulario de creación», la matriz y las transiciones se alinearon con las clarificaciones de la spec del 24-11 (pago por `finanzas`, facturas vinculadas en solo lectura) y del 25-11 (formulario propio). Los modelos siguientes documentan el estado actual y los puntos que esta feature toca.

## Entidades existentes (sin cambios estructurales)

### LiquidacionSueldo — `erp.payrollSettlements` (storage.js)

| Campo | Tipo | Notas |
|---|---|---|
| `settlementId` | string (`set…`) | PK generada |
| `documentId` | string (`doc…`) | FK → factura de compra (`erp.compra`/documentos) |
| `entityId` | string (`ent…`) | FK → tercero personal |
| `periodo` | string `AAAA-MM` | |
| `sueldoBase`, `descuentos`, `bonos`, `monto` | number | |
| `estado` | enum (ciclo de vida existente) | |
| `fechaPago` | string | |

- **Relación**: N liquidaciones → 1 factura de compra; N → 1 tercero personal.
- **Regla de negocio tocada**: quién puede **crear/editar** (solo admin), **ver** (admin + finanzas en solo lectura) y **registrar el pago** de una liquidación `Emitida` (solo finanzas). Estructura intacta (FR: Key Entities).
- **Búsqueda**: el nuevo filtro `rut` resuelve el RUT del tercero vía `entityId` → `customFields.rut` (o campo equivalente) del registro en `erp.entities`.

### Tercero personal — `erp.entities` (storage.js)

| Campo | Tipo | Notas |
|---|---|---|
| `entity_id` / `id` | string (`ent…`) | PK |
| `name` | string | «Nombre completo» del trabajador |
| `customFields.tipoTercero` | `'personal'` | marca el tipo (usado por backfill) |
| `customFields.rut` | string normalizado | RUT canónico (`normalizeRut`) |

- **Creado por**: pestaña de creación cuando el RUT es nuevo (`addEntity`).
- **Reuso**: si el RUT ya existe como personal → no se crea ni se actualiza entidad (FR-004); solo se vincula la liquidación.
- **Validación**: si el RUT existe pero no es `personal` o su acceso está inactivo → rechazo con mensaje (caso límite de spec).

### Acceso — `erp.accessRecords` (access-storage.js)

| Campo | Tipo | Notas |
|---|---|---|
| `accessId` | string (RUT normalizado) | PK |
| `role` | `'administrador' \| 'finanzas' \| 'trabajador'` | |
| `entityId` | string \| null | FK → tercero personal (solo `trabajador`) |
| `active` | boolean | |
| `password` | string | alta trabajador: `initialPassword(rut)` = primeros 4 dígitos del cuerpo del RUT |

- **Creado por**: pestaña de creación vía `createAccessRecord` (reutilizado, sin duplicados; ya emite `ENTITY_ALREADY_LINKED` y `appendDevNotification` en DUPLICATE).
- **No se modifica** la forma del registro.

### Factura de compra — documentos (`erp.compra` / `erp.documents`)

- Misma estructura; la liquidación se vincula por `document_id`. La pestaña de creación NO usa el formulario de facturas de compra: la factura se crea por detrás con los valores del formulario propio.
- Si su `document_id` figura en `erp.payrollSettlements`, es de solo lectura para `finanzas` desde cualquier vista (`isLinkedPayrollDocument`): no se puede editar ni eliminar y se muestra un aviso (FR-011).

## Campos del formulario de creación (sin estructura nueva)

La pestaña «Crear liquidación de sueldo» usa un formulario propio (`src/components/payroll-create-form.js`). Ninguno de sus campos crea propiedades nuevas: cada uno se guarda en una propiedad que ya existía.

| Campo del formulario | Obligatorio | Se guarda en |
|---|---|---|
| RUT | Sí | `entity.customFields.rut` y `access.accessId` (solo si el RUT es nuevo) |
| Nombre completo | Sí | `entity.name` (solo si el RUT es nuevo) |
| Período (AAAA-MM) | Sí | `document.customFields.periodoLiquidacion` y `settlement.periodo` |
| Sueldo base | Sí | `settlement.sueldoBase` |
| Bonos | No (vacío = 0) | `settlement.bonos` |
| Descuentos | No (vacío = 0) | `settlement.descuentos` |
| Total (calculado, solo lectura) | — | `document.totalAmount` y `settlement.monto` = sueldo base + bonos − descuentos |
| Fecha de emisión | Sí | `document.startDate` |
| Fecha de vencimiento | Sí | `document.endDate` |
| Serie | No | `document.series` |
| Folio | Sí | `document.folio` |

- Si el RUT ya existe: RUT y nombre **no** sobrescriben la entidad existente (solo se crea/actualiza la liquidación) — FR-004.
- Validación: RUT con dígito verificador inválido, campos obligatorios vacíos o montos negativos → errores sin registros parciales — FR-005.

## Modelo de permisos (matriz rol ↔ módulo)

| Módulo / vista | administrador | finanzas | trabajador |
|---|---|---|---|
| `payroll-create` (nueva) | ✅ | ❌ → redirección | ❌ → redirección |
| `payroll-admin` (edición) | ✅ (editar) | ✅ (solo lectura, sin «Editar»; única escritura: «Registrar pago» de liquidaciones `Emitidas`) | ❌ → redirección |
| facturas de compra vinculadas a una liquidación | ❌ (sin acceso a facturas) | ✅ solo lectura con aviso, sin editar ni eliminar | ❌ |
| `payroll-worker` | ❌ | ❌ | ✅ (sin cambios) |
| entidades, factura venta, factura compra, movimientos, cashflow, tracking, search | ❌ | ✅ | ❌ |
| `access` (control de accesos) | ✅ (utilidad de sesión) | ❌ | ❌ |
| `dev-notifications` (avisos) | ❌ (FR-020) | ❌ (FR-020) | ❌ (FR-020) |
| `dashboard` | Panel con solo las 2 pestañas de liquidaciones | Panel con sus módulos | Panel con su liquidación |

- Fuentes de verdad: `ACCESS_MATRIX` + `VIEWS` (`src/app.js`), `ADMIN_MODULES`/`FINANCE_MODULES` (`src/components/shell.js`), `resolveRoute()` para redirecciones (FR-016).

## Transiciones de estado

- **Liquidación**: mismo ciclo de vida existente (statusLifecycle de config), con una regla de quién ejecuta cada paso:
  - Borrador → Emitida, y cualquier edición: solo `administrador` (desde «Gestionar liquidaciones»).
  - **Emitida → Pagada: solo `finanzas`** (`registerPayrollPayment`, Session 2026-11-24). Pone `estado = 'Pagada'` y `fechaPago` en la liquidación, y en la factura vinculada `status = 'Pagada'`, `montoPagado = total` y `fechaPago`. No cambia el total, el desglose, el RUT ni otros campos. Se rechaza si la liquidación no está `Emitida`, si la fecha no es válida o si el monto pagado difiere del total.
- **Alta desde pestaña de creación** (orden atómico):
  1. Validar el formulario (sueldo base obligatorio, montos no negativos) y el RUT (`normalizeRut`, DV) → si falla: nada persistido.
  2. Resolver entidad por RUT → existe personal: reusar `entity_id`; existe y no es personal: rechazo.
  3. Resolver acceso por RUT/`entityId` → inactivo o incompatible: rechazo.
  4. Validar el documento (folio, fechas, período `AAAA-MM`, total ≥ 0) → si falla: nada persistido.
  5. RUT nuevo → confirmación previa (`confirmAction`); si se cancela: nada persistido (FR-003).
  6. Crear entidad y acceso solo si no existían (`addEntity`, `createAccessRecord` con `initialPassword(rut)`).
  7. `addDocument` (factura de compra en `Borrador`) → `ensurePayrollSettlement` guarda periodo, desglose y monto.
  8. Feedback de éxito + `reset()` del formulario + refresco del listado.
- **Edición de liquidación** (admin, desde listado): idéntica al flujo `payroll-form` actual; finanzas no tiene ruta de entrada (acción oculta + `ACCESS_MATRIX`).
