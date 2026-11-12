# Contrato: Vistas de liquidaciones

**Funcionalidad**: `002-payroll-access-control` · **Fecha**: 2026-11-11
**Relacionado con**: `spec.md`, `data-model.md`, `contracts/access-and-session.md`

## 1. Resolución de la liquidación

La liquidación es una factura de compra a un tercero de tipo personal. No existe una entidad `LiquidacionSueldo` ni una colección propia.

```js
resolveWorkerSettlement({ entityId, purchaseInvoices, entities }): PurchaseInvoice | null
resolveAdminSettlements({ purchaseInvoices, entities, filters }): PurchaseInvoice[]
```

**Regla del trabajador**:
1. Filtrar `purchaseInvoices` por `entity_id === entityId`.
2. Verificar que el tercero tenga `customFields.tipoTercero === 'personal'`.
3. Ordenar por `customFields.periodoLiquidacion` descendente.
4. Desempatar por `startDate` descendente y luego por `createdAt` descendente.
5. Devolver la primera o `null`.

**Regla del administrador**:
1. Incluir todas las facturas de compra cuyo tercero sea personal.
2. Aplicar filtros opcionales por `entity_id`/RUT y por `customFields.periodoLiquidacion`.
3. Ordenar por período descendente y luego por nombre de trabajador.

## 2. Vista del trabajador: "Mi liquidación"

**Elementos requeridos en `index.html`**:

| Elemento | ID | Función |
|---|---|---|
| Vista | `view-payroll-worker` | Única vista de negocio del trabajador. |
| Título | `payroll-worker-title` | "Mi liquidación". |
| Tarjeta | `payroll-worker-card` | Contenedor del documento. |
| Período | `payroll-worker-period` | `YYYY-MM`. |
| Trabajador | `payroll-worker-name` | Nombre del tercero personal. |
| RUT | `payroll-worker-rut` | RUT del trabajador. |
| Monto | `payroll-worker-amount` | `totalAmount` formateado. |
| Estado | `payroll-worker-status` | Borrador, Emitida o Pagada. |
| Fecha de pago | `payroll-worker-paid-at` | `fechaPago` o "Sin pago registrado". |
| Vacío | `payroll-worker-empty` | Estado vacío si no hay liquidación. |
| Advertencia | `payroll-worker-warning` | Control de interfaz, sin datos reales. |

**Comportamiento**:
- Solo se muestra con sesión de rol `trabajador`.
- Es de solo lectura: no hay botones de edición, eliminación ni creación.
- Si no hay liquidación, se muestra `payroll-worker-empty` y no se muestran datos de otros terceros.
- Si la sesión no tiene un `entityId` válido, se cierra la sesión y se vuelve al login con un mensaje.
- No se muestra la navegación administrativa.

## 3. Vista del administrador: "Liquidaciones de sueldo"

**Elementos requeridos en `index.html`**:

| Elemento | ID | Función |
|---|---|---|
| Vista | `view-payroll-admin` | Solo administrador. |
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
- Período (`YYYY-MM`).
- Monto (`totalAmount`).
- Estado.
- Fecha de pago.
- Acción "Editar".

**Comportamiento**:
- Solo se muestra con sesión de rol `administrador`.
- La lista incluye todas las facturas de compra a terceros personales.
- Los filtros se aplican en memoria y no modifican los datos.
- "Editar" carga la factura en el formulario de compra y permite modificar período, monto, estado, fechas y datos de pago.
- El formulario respeta el ciclo de vida y las validaciones de `001`.
- Al guardar, la vista del trabajador correspondiente refleja el cambio en el siguiente refresco.
- No se permite crear una liquidación desde esta vista si no es una factura de compra a un tercero personal; para eso se usa la vista de facturas de compra.

## 4. Asociación RUT ↔ acceso de trabajador

**Contrato**:
- El vínculo se establece por el tercero personal: `AccessRecord.entityId === PurchaseInvoice.entity_id`.
- El RUT del trabajador es `Entity.taxId`; el RUT del acceso es `AccessRecord.accessId`.
- Al crear un acceso de trabajador, el administrador elige un tercero personal; el sistema muestra su RUT y nombre.
- Al editar una liquidación, el formulario muestra el RUT del tercero y el acceso activo asociado, si existe.
- Si el RUT del tercero no coincide con ningún acceso activo, la liquidación no aparece en la vista de ningún trabajador y el administrador ve una advertencia.
- El administrador puede corregir el tercero de la factura desde el formulario de compra o crear el acceso correspondiente desde la administración de accesos.

**Regla de integridad**:
- No se puede asociar un acceso de trabajador a un tercero que no sea personal.
- No se puede tener dos accesos activos para el mismo tercero.
- Si se desactiva el acceso, el trabajador deja de ver la liquidación en el siguiente intento de acceso.

## 5. Guardas de rol

`src/app.js` expone:

```js
canAccess(view, session): boolean
resolveRoute(view, session): string
```

**Matriz de acceso**:

| Vista | Administrador | Trabajador |
|---|---|---|
| `login` | Solo sin sesión | Solo sin sesión |
| `dashboard` | Sí | No |
| `entities` | Sí | No |
| `invoice-sale` | Sí | No |
| `invoice-purchase` | Sí | No |
| `payroll-admin` | Sí | No |
| `access` | Sí | No |
| `dev-notifications` | Sí | No |
| `movements` | Sí | No |
| `tracking` | Sí | No |
| `search` | Sí | No |
| `payroll-worker` | No | Sí |

**Comportamiento**:
- Si un trabajador intenta una vista no permitida, se redirige a `payroll-worker` y se muestra un mensaje claro.
- Si un administrador intenta `payroll-worker`, se redirige a `payroll-admin`.
- Si no hay sesión, cualquier vista distinta de `login` redirige a `login`.
- Las guardas se aplican tanto en la navegación visible como en las funciones que cargan datos.

## 6. Estados vacíos y errores

| Situación | Mensaje | Dónde |
|---|---|---|
| Sin accesos registrados | "No hay accesos registrados. Carga los datos de demostración para comenzar." | Login |
| Credenciales incorrectas | "RUT o contraseña incorrectos." | Login |
| Rol incompatible | "El RUT no corresponde al rol seleccionado." | Login |
| Acceso inactivo | "El acceso está inactivo. Contacta al administrador." | Login |
| Vínculo roto | "El acceso no tiene un trabajador asociado válido. Contacta al administrador." | Login |
| Trabajador sin liquidación | "Aún no tienes una liquidación registrada." | Mi liquidación |
| Administrador sin liquidaciones | "No hay liquidaciones registradas." | Liquidaciones |
| Sin resultados de filtro | "No hay liquidaciones que coincidan con el filtro." | Liquidaciones |
| Error de validación al guardar | Mensaje específico del campo | Formulario |
| Último administrador | "No puedes desactivar el último administrador activo." | Accesos |

## 7. Pruebas de contrato

- `tests/integration/login-roles.test.js`: selección de rol, credenciales válidas, rol incompatible, RUT inválido, inactivo y vínculo roto.
- `tests/integration/payroll-worker.test.js`: liquidación vigente, estado vacío, solo lectura y aislamiento entre dos trabajadores.
- `tests/integration/payroll-admin.test.js`: lista completa, filtros, edición y reflejo en la vista del trabajador.
- `tests/integration/session-lifecycle.test.js`: recarga conserva la sesión, cierre de sesión la elimina y cierre de pestaña la descarta.
- `tests/integration/access-admin.test.js`: creación, duplicado, contraseña inicial, desactivación, reactivación, último administrador y restablecimiento.
- `tests/integration/dev-notifications.test.js`: registro de incidencias y panel del administrador.
