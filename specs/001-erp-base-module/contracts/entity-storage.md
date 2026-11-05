# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía
- `taxId`: cadena opcional (identificación fiscal)
- `email`: cadena opcional con formato de correo válido cuando está presente
- `phone`: cadena opcional
- `address`: cadena opcional
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `creditLimit`: número opcional no negativo
- `paymentTerms`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada
- `series`: cadena opcional que agrupa folios consecutivos
- `folio`: entero positivo obligatorio; junto con la serie forma el número oficial del documento
- `startDate`: cadena de fecha de calendario válida
- `endDate`: cadena de fecha de calendario válida, igual o posterior a startDate
- `quantity`: entero positivo opcional
- `subtotal`: número no negativo opcional
- `discount`: número no negativo opcional; no puede superar el subtotal
- `taxAmount`: número no negativo opcional
- `totalAmount`: número no negativo opcional
- `currency`: cadena opcional
- `paymentTerms`: cadena opcional
- `notes`: cadena opcional
- `status`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido y un `creditLimit` presente debe ser un número no negativo.
- Un documento sin `folio` entero positivo debe rechazarse; un `discount` mayor que el `subtotal` debe rechazarse.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id, y con ellos sus movimientos financieros.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Campos personalizados de este módulo

Se persisten dentro del objeto `customFields` de cada registro, sin cambios de esquema:

- Tercero: `tipoTercero` (select obligatorio; valores `cliente`, `proveedor` o `personal`). `creditLimit` solo aplica a terceros de tipo `cliente`.
- Documento: `tipoFactura` (select obligatorio; valores `venta` o `compra`), `montoPagado` (number), `fechaPago` (date), y según el tipo:
  - venta: `salesOrderId` (texto opcional, no vacío cuando se ingresa).
  - compra: `centroCosto` (select, valores `Activo` o `Consumible`; obligatorio al emitir, indefinido solo en Borrador) y `periodoLiquidacion` (texto `YYYY-MM`, obligatorio solo cuando el tercero es de tipo `personal`, no posterior a la fecha de emisión).

## Movimientos financieros

Registros derivados de las facturas, generados automáticamente y de **solo lectura** (un movimiento por evento: un cargo por emisión de venta, un abono por emisión de compra, una contrapartida por pago). Se guardan en `erp.movements` y son regenerables desde `erp.documents`.

Cada registro de movimiento debe incluir:

- `id`: cadena única
- `document_id`: el `document_id` de la factura que lo originó
- `entity_id`: el `entity_id` del tercero de la factura
- `fecha`: cadena de fecha de calendario válida (fecha de emisión o de pago)
- `tipo`: cadena; valores `cargo`, `abono` o `pago`
- `monto`: número no negativo, igual al `totalAmount` de la factura
- `centroCosto`: opcional; copia del centro de costo de la factura de compra
- `salesOrderId`: opcional; copia del `sales_order_id` de la factura de venta

Reglas:

- `addDocument` al cambiar el estado a Emitida o Pagada DEBE generar el movimiento correspondiente; `deleteDocument` y `deleteDocumentsForEntity` DEBEN eliminar los movimientos vinculados.
- NO existen operaciones para editar o eliminar movimientos manualmente.
- El almacenamiento de KPIs y seguimiento usa las facturas, no los movimientos.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.
