# Contrato de Vistas de Factura (venta y compra)

**Rama**: `001-erp-base-module` · **Fecha**: 2026-11-11 · **Relacionado con**: `spec.md` (FR-006, FR-020, FR-022), `data-model.md` (sección 4a) y `contracts/entity-storage.md`

## Propósito

Definir el contrato de interfaz de las dos vistas independientes de factura. El almacenamiento sigue siendo un único `Document` con `customFields.tipoFactura`; este contrato garantiza que la separación visual y funcional no dependa de cómo se guardan los datos.

## Rutas y vistas

| Módulo | Vista | Formulario | Listado | Tipo fijo |
|---|---|---|---|---|
| `invoice-sale` | `#view-invoice-sale` | `#invoice-sale-form` | `#invoice-sale-list` | `venta` |
| `invoice-purchase` | `#view-invoice-purchase` | `#invoice-purchase-form` | `#invoice-purchase-list` | `compra` |

Reglas:

- El menú no expone una vista genérica de documentos. Las facturas se abren solo desde `#nav-invoice-sale` o `#nav-invoice-purchase`.
- `#view-invoice-sale` y `#view-invoice-purchase` son mutuamente excluyentes: solo una está visible a la vez.
- Cada vista conserva su propio estado de edición; cambiar de vista no mezcla formularios ni listados.
- Las acciones rápidas del home navegan a la vista correspondiente (`new-invoice-sale` → `invoice-sale`; `new-invoice-purchase` → `invoice-purchase`).

## Contrato del formulario

Cada formulario se crea con `createInvoiceForm({ tipoFactura, root, config, onSubmit })` y expone:

- `reset()`: limpia el formulario y el estado de edición.
- `setDocument(documentRecord)`: carga una factura existente; solo acepta documentos del mismo `tipoFactura`.
- `setEntities(entities)`: actualiza el selector de terceros y lo filtra por tipo.
- `setOptions(documents, entities)`: actualiza el selector de edición con los documentos del tipo.
- `focus()`: enfoca el primer control relevante.
- `showErrors(errors)`: muestra errores por campo.
- `getEditingId()`: devuelve el `document_id` en edición o `null`.

Campos comunes: entidad, serie, folio, fecha de emisión, fecha de vencimiento, cantidad, subtotal, descuento, impuesto, total, moneda, condiciones de pago, notas y estado.

Campos propios:

| Tipo | Campos visibles | Terceros admitidos |
|---|---|---|
| `venta` | `salesOrderId` | `cliente` |
| `compra` | `centroCosto`, `periodoLiquidacion` (solo si el tercero es `personal`) | `proveedor` o `personal` |

Reglas de aislamiento:

- El formulario no muestra el campo `tipoFactura`.
- Al leer los valores, el formulario inyecta `customFields.tipoFactura = tipoFactura`; cualquier valor previo distinto se sobrescribe.
- Al editar, si el documento cargado no coincide con el tipo de la vista, la operación se rechaza y no se muestra el formulario.
- Los controles usan `data-field`, `data-error` y `data-custom-fields` dentro del `root`; no se usan IDs globales que colisionen entre vistas.

## Contrato del listado

Cada listado se renderiza con `renderInvoiceList(container, documents, entities, { tipoFactura, columns, onEdit, onDelete })`.

Filtro obligatorio: `document.customFields.tipoFactura === tipoFactura`.

Columnas:

| Tipo | Columnas |
|---|---|
| `venta` | Folio, Estado, Emisión, Vencimiento, Total, Orden de venta (`salesOrderId`) |
| `compra` | Folio, Estado, Emisión, Vencimiento, Total, Centro de costo, Período de liquidación |

Reglas:

- Un documento del otro tipo no se muestra, ni siquiera si comparte tercero.
- El listado se agrupa por tercero y muestra un estado vacío claro cuando no hay documentos del tipo.
- Las acciones `Editar` y `Eliminar` envían el `document_id`; la aplicación resuelve el tipo del documento y navega a su vista antes de operar.
- El contenedor expone `data-tipo-factura` con el valor `venta` o `compra` para pruebas y estilos.

## Contrato de navegación

- `VIEW_ELEMENTS` mapea `invoice-sale` → `invoice-sale` y `invoice-purchase` → `invoice-purchase`; no existe un mapeo a `documents`.
- `showModule(name)` oculta todas las vistas y muestra solo la activa, sin recargar la página.
- `editDocument(id)` y `requestDeleteDocument(id)` determinan el tipo del documento y operan sobre la vista correspondiente.
- `handleInvoiceSubmit(tipoFactura, values, editingId)` fuerza el tipo antes de llamar a `addDocument`/`updateDocument`.

## Invariantes verificables

1. No existe `#nav-documents` visible ni `#view-documents` en el HTML.
2. Un documento de venta no aparece en `#invoice-purchase-list` y uno de compra no aparece en `#invoice-sale-list`.
3. El formulario de venta no muestra `centroCosto` ni `periodoLiquidacion`; el de compra no muestra `salesOrderId`.
4. El `tipoFactura` guardado coincide siempre con la vista de origen, incluso si se intenta manipular el formulario.
5. `erp.documents` sigue siendo la única clave de almacenamiento de facturas.
6. Las columnas de cada listado coinciden con la tabla anterior.

## Pruebas asociadas

- `tests/integration/invoice-separation.test.js` (nueva).
- `tests/integration/us10-documents.test.js` (migrada a las vistas de venta/compra).
- `tests/integration/us12-lifecycle.test.js` (navegación por las dos vistas).
- `tests/integration/us13-shell.test.js` (vistas separadas y menú sin documentos).
- `tests/integration/foundation.test.js`, `us4-management.test.js`, `us5-config.test.js` y `us6-labels.test.js` (dejan de usar la vista genérica).
