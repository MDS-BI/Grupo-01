# Data Model: Rediseño visual de paneles por rol

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Fecha**: 2026-11-24

**Estado**: Modelo de vista derivado; sin cambios de persistencia de dominio.

## Persistencia

- No se crean entidades, campos, tablas ni claves `localStorage` nuevas de dominio.
- No se modifica la forma de `erp.session`, `erp.accessRecords`, `erp.payrollSettlements` ni de facturas/terceros/movimientos.
- No se modifica la forma de las specs `001-erp-base-module`, `002-payroll-access-control` ni `003-payroll-tabs-roles`.
- Único estado nuevo: `sessionStorage['erp.guideDismissed.<role>']`, de uso exclusivo de UI. No forma parte del modelo de datos y no altera la sesión.

## Entidades existentes involucradas

| Entidad | Origen de datos | Uso en esta funcionalidad |
|---|---|---|
| `Session` | `erp.session` | Determina rol y perfil visible derivado. Forma inalterada. |
| `AccessRecord` | `erp.accessRecords` | Cuenta trabajadores con acceso para el resumen de nómina. Solo lectura. |
| `Entity` | `erp.entities` / `loadEntities()` | Aporta `name` para iniciales personales; `customFields.tipoTercero` distingue personal para flujo de caja. |
| `PayrollSettlement` | `erp.payrollSettlements` | Liquidaciones del mes actual y en borrador; monto líquido, período y desglose del trabajador. |
| `Document` / factura | almacén de documentos | Caja neta, por cobrar, por pagar, vencidas, tendencia y listas filtradas. Solo lectura. |
| `Movement` | `erp.movements` / `loadMovements()` | Fecha efectiva y monto de pagos para flujo de caja y últimos movimientos. Solo lectura. |
| `View access matrix` | `src/app.js` | Define qué secciones y acciones puede ver cada rol. No se reescribe. |

## View Models derivados

### `SessionProfile`

| Campo | Tipo | Regla |
|---|---|---|
| `role` | `'administrador' \| 'finanzas' \| 'trabajador'` | Copiado de la sesión vigente. |
| `roleLabel` | `string` | `Administrador`, `Finanzas` o `Trabajador`. Mapa compartido. |
| `displayName` | `string` | Trabajador con entidad personal: `entity.name`. Sin nombre: `roleLabel`. Administración y finanzas: `roleLabel`. |
| `initials` | `string` | Primera letra del primer nombre y del primer apellido; un nombre → una inicial; sin nombre → inicial del rol. |
| `source` | `'person' \| 'role'` | Origen usado para `displayName` e `initials`. |

- No se persiste. Se calcula al aplicar la sesión y al renderizar encabezados.
- Nunca usa el nombre del sistema ni del módulo para el círculo de perfil.

### `DashboardHeader`

| Campo | Tipo | Regla |
|---|---|---|
| `greeting` | `string` | Saludo centrado en la persona/rol derivada de `SessionProfile`. |
| `monthLabel` | `string` | Mes calendario actual en texto legible, p. ej. `noviembre 2026`. |
| `landingView` | `'dashboard' \| 'payroll-worker'` | Panel para administración y finanzas; «Mi liquidación» para trabajador. |

### `AdminPayrollSummary`

| Campo | Tipo | Regla |
|---|---|---|
| `workersWithAccess` | `number` | Cantidad de accesos con rol trabajador. |
| `settlementsCurrentMonth` | `number` | Liquidaciones cuyo período corresponde al mes actual. |
| `draftSettlements` | `number` | Liquidaciones en estado borrador. |
| `emptyStateByMetric` | `Record<string, string>` | Texto claro por métrica sin datos; nunca cero engañoso. |

- Solo se calcula/expone en el Panel del administrador.
- No incluye ningún campo financiero.

### `FinanceIndicator`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `'cash' \| 'receivable' \| 'payable' \| 'overdue'` | Identificador estable. |
| `label` | `string` | `Caja neta`, `Por cobrar`, `Por pagar`, `Facturas vencidas`. |
| `value` | `number \| string` | Monto CLP o cantidad de facturas vencidas. |
| `previousValue` | `number \| string \| null` | Estado reconstruido al último día del mes anterior con los datos existentes; `null` si no hay documentos anteriores al mes actual. |
| `variationPercent` | `number \| null` | Porcentaje calculado solo si `previousValue` no es `null`, es distinto de `0` y `value` difiere de él. |
| `variationDirection` | `'up' \| 'down' \| 'flat' \| 'unknown'` | Dirección de la variación. |
| `variationText` | `string` | `sin dato anterior`, `<flecha> nuevo`, `<flecha> <porcentaje> %` o `sin cambio`. |
| `variationTone` | `'favorable' \| 'unfavorable' \| 'neutral'` | Ver tabla de semántica por indicador. |
| `stateTone` | `'negative' \| 'action' \| 'neutral'` | Caja negativa → rojo; vencidas > 0 → ámbar; resto neutro. |
| `formulaTooltip` | `string` | Fórmula visible solo en tooltip con ⓘ. |
| `targetRoute` | `string` | `cashflow`, `invoice-sale`, `invoice-purchase`, `tracking`. |

#### Reconstrucción de `previousValue`

- No se consulta un snapshot histórico ni se agrega almacenamiento: se reconstruye con documentos, entidades y movimientos ya existentes.
- `cutoff` es el último día del mes calendario inmediatamente anterior al mes de la sesión; `inicioMesActual` es el primer día del mes actual.
- `fechaEmision` es `startDate`, o `createdAt` si `startDate` no existe.
- `fechaPagoEfectiva` sigue la precedencia de flujo de caja: movimiento `tipo === 'pago'` con la fecha más reciente, luego `customFields.fechaPago`, luego `endDate` y finalmente `startDate`.
- `emitidaHastaCutoff` significa `fechaEmision <= cutoff`.
- `noPagadaACutoff` significa que no existe `fechaPagoEfectiva <= cutoff`; un documento pagado después del cutoff se considera no pagado a esa fecha.

| Indicador | Cálculo de `previousValue` |
|---|---|
| `cash` | `ingresos - egresos` de documentos pagados cuya `fechaPagoEfectiva <= cutoff`; la dirección de cada fila es la ya usada por `computeCashflow`. |
| `receivable` | Suma de `totalAmount` de facturas de venta con `emitidaHastaCutoff` y `noPagadaACutoff`. |
| `payable` | Suma de `totalAmount` de facturas de compra con `emitidaHastaCutoff` y `noPagadaACutoff`. |
| `overdue` | Cantidad de facturas con `emitidaHastaCutoff`, `noPagadaACutoff` y `endDate < cutoff`. |

- Si no existe ningún documento con `fechaEmision`, `endDate` o `fechaPagoEfectiva` anterior a `inicioMesActual`, `previousValue` es `null` y la tarjeta muestra `sin dato anterior`.
- Si `previousValue` es `0` y `value` no es `0`, no se calcula porcentaje: `variationPercent` es `null` y `variationText` es `<flecha> nuevo`.
- La flecha de `nuevo` es ▲ cuando `value > 0` y ▼ cuando `value < 0`; el color sigue la semántica del indicador, no el signo.

Semántica de variación:

| Indicador | Sube | Baja | Sin cambio / sin dato |
|---|---|---|---|
| `cash` | favorable (verde) | desfavorable (rojo) | neutro |
| `receivable` | neutro | neutro | neutro |
| `payable` | desfavorable (rojo) | favorable (verde) | neutro |
| `overdue` | desfavorable (rojo) | favorable (verde) | neutro |

Fórmulas del valor actual:

- `cash`: `ingresos - egresos` de documentos pagados, con pago de movimientos cuando existe.
- `receivable`: suma de `totalAmount` de facturas de venta en estado `Emitida`.
- `payable`: suma de `totalAmount` de facturas de compra en estado `Emitida`.
- `overdue`: cantidad de facturas `Emitida` con `endDate` anterior a la fecha actual.
- Texto secundario: totales de `Terceros` y `Facturas`, sin indicador `Deuda pendiente`.

### `TrendPoint`

| Campo | Tipo | Regla |
|---|---|---|
| `monthKey` | `string` | `YYYY-MM`. Clave interna, no texto visible en Panel. |
| `label` | `string` | Mes en texto corto legible para el gráfico. |
| `income` | `number` | Suma de filas `Ingreso` de flujo de caja en ese mes. |
| `expense` | `number` | Suma de filas `Egreso` de flujo de caja en ese mes. |
| `net` | `number` | `income - expense`. |

- Serie exacta: seis meses consecutivos que terminan en el mes actual, de antiguo a reciente.
- Mes sin datos: valores `0`; no se omite el punto.

### `FinanceAlert`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `'negative-cash' \| 'overdue-invoices'` | Identificador estable. |
| `message` | `string` | Texto breve con el estado detectado. |
| `tone` | `'negative' \| 'action'` | Rojo para caja negativa, ámbar para vencidas. |
| `targetRoute` | `string` | Detalle correspondiente. |

- Se genera solo cuando `cash < 0` o `overdue > 0`.
- No se genera para caja `0`, sin vencidas o para otros roles.

### `RecentMovement`

| Campo | Tipo | Regla |
|---|---|---|
| `dateLabel` | `string` | Fecha legible. |
| `description` | `string` | Categoría, documento o tercero. |
| `amount` | `number` | Monto con signo de flujo. |
| `displayAmount` | `string` | CLP con `$`, separador de miles y ancho fijo. |
| `targetRoute` | `string` | Listado completo de movimientos. |

- Máximo cinco registros, ordenados por fecha descendente.
- Si no hay registros: estado vacío y enlace «Ver todos».

### `QuickAction`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `string` | ID estable del botón existente. |
| `label` | `string` | Etiqueta visible en una línea. |
| `roles` | `Role[]` | Roles autorizados por la matriz vigente. |
| `target` | `string` | Acción de navegación existente. |

Conjuntos de esta funcionalidad:

| Panel | Acciones |
|---|---|
| Administrador | `qa-create-payroll`, `qa-new-payroll` |
| Finanzas | `qa-new-invoice-sale`, `qa-new-invoice-purchase`, `qa-cashflow`, `qa-search` |
| Trabajador | Ninguna en Panel; acceso directo a «Mi liquidación» en la navegación |

### `GuideBannerState`

| Campo | Tipo | Regla |
|---|---|---|
| `role` | `Role` | Rol de la sesión actual. |
| `dismissed` | `boolean` | `true` cuando la clave de sesión existe. |
| `storageKey` | `string` | `erp.guideDismissed.<role>`. |
| `location` | `'dashboard' \| 'payroll-worker'` | Ubicación del banner según el rol. |

- Estado efímero por pestaña/sesión; se conserva al recargar dentro de la misma sesión.
- No afecta navegación, datos ni a otros roles.

### `WorkerPayrollView`

| Campo | Tipo | Regla |
|---|---|---|
| `displayName` | `string` | Nombre derivado de `SessionProfile`. |
| `periodLabel` | `string` | Período en texto legible; nunca `YYYY-MM`. |
| `netAmount` | `number` | Monto líquido de la liquidación vigente. |
| `netAmountDisplay` | `string` | CLP con `$` y separador de miles; elemento tipográfico principal. |
| `breakdown` | `{ base, discounts, bonuses } \| null` | `null` cuando los tres valores faltan o son cero. |
| `history` | `Array<{ periodLabel, amountDisplay }>` | Pagos anteriores con montos en `$`. |

## Invariantes

- `SessionProfile.source === 'role'` para administrador y finanzas.
- `initials` nunca es `ERP`, `CF` ni otra inicial del sistema/módulo.
- `FinanceIndicator.formulaTooltip` nunca aparece como texto visible en la etiqueta.
- `AdminPayrollSummary` y `FinanceIndicator[]` son mutuamente excluyentes en un mismo Panel.
- `TrendPoint[]`, `FinanceAlert[]` y `RecentMovement[]` solo existen en el Panel de finanzas.
- `Guía` existe para los tres roles, pero en `payroll-worker` para el trabajador.
- Toda cifra monetaria visible usa CLP, `$`, separador de miles y `tabular-nums`.
