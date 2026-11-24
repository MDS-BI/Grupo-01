# Data Model: Pestañas de liquidación de sueldo y permisos por rol

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-24

Esta funcionalidad **no cambia la estructura** de las entidades existentes: solo agrega un filtro de lectura, un par de campos de formulario (no persistidos como estructura nueva) y reglas de creación derivadas. Los modelos siguientes documentan el estado actual y los puntos que esta feature toca.

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
- **Regla de negocio tocada**: quién puede **crear/editar** (solo admin) y **ver** (admin + finanzas solo lectura). Estructura intacta (FR: Key Entities).
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

- Misma estructura; la liquidación se vincula por `document_id`. El formulario existente es la base de la pestaña de creación.

## Campos añadidos (formulario, no estructura persistida)

En la pestaña «Crear liquidación de sueldo», el form instanciado por `createPurchaseForm` recibe además, vía opción `extraFields`:

| Campo | Tipo | Obligatorio | Persistencia |
|---|---|---|---|
| RUT del trabajador | text (normalizado con `normalizeRut`) | Sí | → `entity.customFields.rut` y `access.accessId` (si es nuevo) |
| Nombre completo | text | Sí | → `entity.name` (si el RUT es nuevo) |

- Si el RUT ya existe: estos dos campos **no** sobrescriben la entidad existente (solo se crea/actualiza la liquidación) — FR-004.
- Validación: RUT con dígito verificador inválido o campos vacíos → `ValidationFailure` sin registros parciales — FR-005.

## Modelo de permisos (matriz rol ↔ módulo)

| Módulo / vista | administrador | finanzas | trabajador |
|---|---|---|---|
| `payroll-create` (nueva) | ✅ | ❌ → redirección | ❌ → redirección |
| `payroll-admin` (edición) | ✅ (editar) | ✅ (solo lectura, sin «Editar») | ❌ → redirección |
| `payroll-worker` | ❌ | ❌ | ✅ (sin cambios) |
| entidades, factura venta, factura compra, movimientos, cashflow, tracking, search | ❌ | ✅ | ❌ |
| `access` (control de accesos) | ✅ (utilidad de sesión) | ❌ | ❌ |
| `dev-notifications` (avisos) | ❌ (FR-020) | ❌ (FR-020) | ❌ (FR-020) |
| `dashboard` | Panel con solo las 2 pestañas de liquidaciones | Panel con sus módulos | Panel con su liquidación |

- Fuentes de verdad: `ACCESS_MATRIX` + `VIEWS` (`src/app.js`), `ADMIN_MODULES`/`FINANCE_MODULES` (`src/components/shell.js`), `resolveRoute()` para redirecciones (FR-016).

## Transiciones de estado

- **Liquidación**: sin cambios en el ciclo de vida existente (statusLifecycle de config).
- **Alta desde pestaña de creación** (orden atómico):
  1. Validar form + RUT (`normalizeRut`, DV) → si falla: nada persistido.
  2. Resolver entidad por RUT → existe personal: reusar `entity_id`; no existe: `addEntity`.
  3. Resolver acceso por RUT/`entityId` → existe activo: no crear; no existe: `createAccessRecord(role: 'trabajador', password: initialPassword(rut))`.
  4. `addDocument` (factura de compra) → backfill/sync crea la liquidación vinculada.
  5. Feedback de éxito + `reset()` del form.
- **Edición de liquidación** (admin, desde listado): idéntica al flujo `payroll-form` actual; finanzas no tiene ruta de entrada (acción oculta + `ACCESS_MATRIX`).
