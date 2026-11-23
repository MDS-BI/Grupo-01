# Contrato: Vistas de liquidaciones

**Funcionalidad**: `002-payroll-access-control` · **Fecha**: 2026-11-11 · **Revisado**: 2026-11-17
**Relacionado con**: `spec.md`, `data-model.md`, `contracts/access-and-session.md`

## 1. Resolución de la liquidación

La liquidación se registra en la entidad persistida `LiquidacionSueldo`, almacenada en `localStorage` bajo la clave `erp.payrollSettlements` (versión de esquema `2.0.0`). Cada registro se vincula por `documentId` a una factura de compra a un tercero de tipo personal; la factura sigue siendo el comprobante de pago y la entidad guarda el desglose. El trabajador ve la última liquidación con su desglose y, debajo, el historial de sus pagos.

```js
{
  settlementId: "set_abc123",        // único
  documentId: "doc_abc123",          // FK a PurchaseInvoice.document_id
  entityId: "ent_abc123",            // tercero personal
  periodo: "2026-11",                // YYYY-MM
  sueldoBase: 1000000,
  descuentos: 150000,
  bonos: 50000,
  monto: 900000,                     // espejo de totalAmount de la factura
  estado: "Pagada",                  // Borrador | Emitida | Pagada; espejo de status
  fechaPago: "2026-11-10",           // espejo de customFields.fechaPago
  createdAt: "2026-11-11T12:00:00.000Z",
  updatedAt: "2026-11-17T12:00:00.000Z"
}
```

`estado`, `fechaPago` y `monto` reflejan la factura de compra vinculada y se sincronizan al editarla.

```js
resolveWorkerSettlement({ entityId, settlements, purchaseInvoices }): LiquidacionSueldo | null
resolveWorkerPaymentHistory({ entityId, settlements }): LiquidacionSueldo[]
resolveAdminSettlements({ settlements, purchaseInvoices, entities, filters }): LiquidacionSueldo[]
// También se usa con sesión de rol `finanzas`; el trabajador nunca la invoca.
```

**Regla de la última liquidación del trabajador**:
1. Filtrar `settlements` por `entityId === session.entityId`.
2. Ordenar por `periodo` descendente.
3. Desempatar por el `startDate` de la factura vinculada (`documentId === document_id`) descendente y luego por `createdAt` descendente.
4. Devolver la primera o `null`; no se exige que `estado === 'Pagada'`.

**Regla del historial de pagos del trabajador**:
1. Filtrar las liquidaciones del `entityId` de la sesión con `estado === 'Pagada' && fechaPago`.
2. Ordenar por `fechaPago` descendente y desempatar por `periodo` descendente.
3. Cada fila muestra fecha de pago, período, monto y estado; el desglose solo aparece en la última liquidación.

**Regla del administrador y de finanzas**:
1. Incluir todas las `LiquidacionSueldo`, cada una con su factura de compra vinculada.
2. Aplicar filtros opcionales por `entityId`/RUT y por `periodo`.
3. Ordenar por período descendente y luego por nombre de trabajador.

## 2. Vista del trabajador: "Mi liquidación"

**Elementos requeridos en `index.html`**:

| Elemento | ID | Función |
|---|---|---|
| Vista | `view-payroll-worker` | Única vista de negocio del trabajador. |
| Título | `payroll-worker-title` | "Mi liquidación". |
| Tarjeta | `payroll-worker-card` | Contenedor de la última `LiquidacionSueldo`. |
| Período | `payroll-worker-period` | `periodo` (`YYYY-MM`). |
| Trabajador | `payroll-worker-name` | Nombre del tercero personal. |
| RUT | `payroll-worker-rut` | RUT del trabajador. |
| Sueldo base | `payroll-worker-base-salary` | `sueldoBase` formateado. |
| Descuentos | `payroll-worker-discounts` | `descuentos` formateados. |
| Bonos | `payroll-worker-bonuses` | `bonos` formateados. |
| Monto | `payroll-worker-amount` | `monto` formateado (espejo de `totalAmount`). |
| Estado | `payroll-worker-status` | `estado`: Borrador, Emitida o Pagada. |
| Fecha de pago | `payroll-worker-paid-at` | `fechaPago` o "Sin pago registrado". |
| Historial | `payroll-worker-history` | Tabla de pagos: fecha de pago, período, monto y estado. |
| Historial vacío | `payroll-worker-history-empty` | Estado vacío si no hay pagos registrados. |
| Vacío | `payroll-worker-empty` | Estado vacío si no hay liquidación. |
| Advertencia | `payroll-worker-warning` | Control de interfaz, sin datos reales. |

**Comportamiento**:
- Solo se muestra con sesión de rol `trabajador`.
- Muestra la última liquidación propia con su desglose (`sueldoBase`, `descuentos`, `bonos`) y el historial de pagos debajo de la tarjeta.
- El historial solo incluye liquidaciones propias con `estado === 'Pagada' && fechaPago`; el desglose no se repite en cada fila.
- Es de solo lectura: no hay botones de edición, eliminación ni creación, y no se muestran datos de otros trabajadores.
- Si no hay liquidación, se muestra `payroll-worker-empty` y no se muestran datos de otros terceros.
- Si la sesión no tiene un `entityId` válido, se cierra la sesión y se vuelve al login con un mensaje.
- No se muestra la navegación administrativa.

## 3. Vista del administrador y de finanzas: "Liquidaciones de sueldo"

**Elementos requeridos en `index.html`**:

| Elemento | ID | Función |
|---|---|---|
| Vista | `view-payroll-admin` | Solo administrador y finanzas. |
| Filtro por trabajador/RUT | `payroll-filter-worker` | Selector o texto. |
| Filtro por período | `payroll-filter-period` | `YYYY-MM` o selector. |
| Lista | `payroll-admin-list` | Tabla de liquidaciones. |
| Vacío | `payroll-admin-empty` | Estado vacío. |
| Formulario | `payroll-form` | Edición de la liquidación seleccionada. |
| Botón guardar | `payroll-form-submit` | Guarda los cambios. |
| Errores | `payroll-form-errors` | Errores de validación. |

**Columnas de la lista**:
- Trabajador.
- RUT.
- Período (`periodo`, `YYYY-MM`).
- Monto (`monto`).
- Estado (`estado`).
- Fecha de pago (`fechaPago`).
- Factura vinculada (`documentId`).
- Acción "Editar".

**Comportamiento**:
- Solo se muestra con sesión de rol `administrador` o `finanzas`.
- La lista incluye todas las `LiquidacionSueldo` y su factura de compra vinculada por `documentId`.
- Los filtros se aplican en memoria y no modifican los datos.
- "Editar" carga la liquidación y su factura vinculada: permite modificar el desglose (`periodo`, `sueldoBase`, `descuentos`, `bonos`) y, en el formulario de compra, período, monto, estado, fechas y datos de pago.
- Al guardar se sincronizan `estado`, `fechaPago` y `monto` con la factura y se actualiza `updatedAt`.
- El formulario respeta el ciclo de vida y las validaciones de `001`.
- Al guardar, la vista del trabajador correspondiente refleja el cambio en el siguiente refresco.
- No se permite crear una liquidación desde esta vista sin su factura de compra a un tercero personal; para eso se usa la vista de facturas de compra.

## 4. Asociación RUT ↔ acceso de trabajador

**Contrato**:
- El vínculo se establece por el tercero personal: `AccessRecord.entityId === LiquidacionSueldo.entityId`.
- El RUT del trabajador es `Entity.taxId`; el RUT del acceso es `AccessRecord.accessId`.
- Al crear un acceso de trabajador, el administrador elige un tercero personal; el sistema muestra su RUT y nombre.
- Al editar una liquidación, el formulario muestra el RUT del tercero y el acceso activo asociado, si existe.
- Si el RUT del tercero no coincide con ningún acceso activo, la liquidación no aparece en la vista de ningún trabajador y el administrador ve una advertencia.
- El administrador puede corregir el tercero de la liquidación y de su factura desde el formulario de compra o crear el acceso correspondiente desde la administración de accesos.

**Regla de integridad**:
- No se puede asociar un acceso de trabajador a un tercero que no sea personal.
- No se puede tener dos accesos activos para el mismo tercero.
- Si se desactiva el acceso, el trabajador deja de ver sus liquidaciones y su historial en el siguiente intento de acceso.

## 5. Guardas de rol

`src/app.js` expone:

```js
canAccess(view, session): boolean
resolveRoute(view, session): string
```

**Matriz de acceso**:

| Vista | Administrador | Finanzas | Trabajador |
|---|---|---|---|
| `login` | Solo sin sesión | Solo sin sesión | Solo sin sesión |
| `dashboard` | Sí | Sí | No |
| `entities` | Sí | Sí | No |
| `invoice-sale` | Sí | Sí | No |
| `invoice-purchase` | Sí | Sí | No |
| `payroll-admin` | Sí | Sí | No |
| `access` | Sí | No | No |
| `dev-notifications` | Sí | No | No |
| `movements` | Sí | Sí | No |
| `cashflow` | Sí | Sí | No |
| `tracking` | Sí | Sí | No |
| `search` | Sí | Sí | No |
| `payroll-worker` | No | No | Sí |

**Comportamiento**:
- Si un trabajador intenta una vista no permitida, se redirige a `payroll-worker` y se muestra un mensaje claro.
- Si un administrador o finanzas intenta `payroll-worker`, se redirige a `payroll-admin`.
- Si finanzas intenta `access` o `dev-notifications`, se redirige a `dashboard` y se muestra un mensaje claro.
- Si no hay sesión, cualquier vista distinta de `login` redirige a `login`; no existe modo invitado ni navegación sin autenticar.
- Las guardas se aplican tanto en la navegación visible como en las funciones que cargan datos.

## 6. Estados vacíos y errores

| Situación | Mensaje | Dónde |
|---|---|---|
| Sin accesos registrados | "No hay accesos registrados. Usa «Cargar demostración» y luego ingresa con el RUT y la contraseña correspondientes." | Login |
| Credenciales incorrectas | "RUT o contraseña incorrectos." | Login |
| Acceso inactivo | "El acceso está inactivo. Contacta al administrador." | Login |
| Vínculo roto | "El acceso no tiene un trabajador asociado válido. Contacta al administrador." | Login |
| Trabajador sin liquidación | "Aún no tienes una liquidación registrada." | Mi liquidación |
| Trabajador sin pagos en el historial | "Aún no hay pagos registrados." | Mi liquidación (historial) |
| Administrador sin liquidaciones | "No hay liquidaciones registradas." | Liquidaciones |
| Sin resultados de filtro | "No hay liquidaciones que coincidan con el filtro." | Liquidaciones |
| Error de validación al guardar | Mensaje específico del campo | Formulario |
| Último administrador | "No puedes desactivar el último administrador activo." | Accesos |

## 7. Pruebas de contrato

- `tests/integration/login-roles.test.js`: roles registrados, credenciales válidas, RUT inválido, inactivo y vínculo roto; sin modo invitado.
- `tests/integration/demo-data.test.js`: carga desde el acceso, credenciales de administrador, finanzas y trabajadores, idempotencia y RUT del administrador distinto de los terceros.
- `tests/integration/payroll-worker.test.js`: última liquidación con desglose, historial filtrado y ordenado sin exigir `Pagada` para la última, estado vacío, solo lectura y aislamiento entre dos trabajadores.
- `tests/integration/payroll-admin.test.js`: lista completa de `LiquidacionSueldo` con su factura vinculada, filtros, edición del desglose, sincronización de `estado`/`fechaPago`/`monto` y reflejo en la vista del trabajador, tanto con administrador como con finanzas; bloqueo de accesos y avisos para finanzas.
- `tests/integration/session-lifecycle.test.js`: recarga conserva la sesión, cierre de sesión la elimina y cierre de pestaña la descarta.
- `tests/integration/access-admin.test.js`: creación, duplicado, contraseña inicial, desactivación, reactivación, último administrador y restablecimiento.
- `tests/integration/dev-notifications.test.js`: registro de incidencias y panel del administrador.
