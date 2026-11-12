# Contrato: Separación física y visual de facturas

**Funcionalidad**: `002-payroll-access-control` · **Fecha**: 2026-11-11
**Relacionado con**: `spec.md`, `data-model.md`, `research.md`

## 1. Decisión

La separación de facturas es **física** y **lógica/visual**:

- **Física**: cada tipo vive en su propia colección de `localStorage`.
- **Lógica**: cada registro conserva `customFields.tipoFactura` y se valida contra su colección.
- **Visual**: cada tipo tiene su propia vista, formulario y listado, con columnas y estilos distintivos.

## 2. Colecciones

| Clave | Tipo de factura | Contenido |
|---|---|---|
| `erp.salesInvoices` | `venta` | Facturas de venta. |
| `erp.purchaseInvoices` | `compra` | Facturas de compra, incluidas las liquidaciones a personal. |
| `erp.unclassifiedDocuments` | — | Documentos legados sin tipo o con tipo desconocido. |

**Invariantes**:
- `erp.salesInvoices` solo contiene registros con `customFields.tipoFactura === 'venta'`.
- `erp.purchaseInvoices` solo contiene registros con `customFields.tipoFactura === 'compra'`.
- Un `document_id` no puede existir en ambas colecciones.
- Un registro de venta nunca se muestra en la vista de compra, en la liquidación del trabajador ni en la lista del administrador.
- Un registro de compra nunca se muestra en la vista de venta.

## 3. API de `src/storage.js`

```js
STORAGE_KEYS.salesInvoices    // 'erp.salesInvoices'
STORAGE_KEYS.purchaseInvoices // 'erp.purchaseInvoices'
STORAGE_KEYS.unclassifiedDocuments // 'erp.unclassifiedDocuments'

loadSaleInvoices(): Document[]
saveSaleInvoices(documents: Document[]): void
loadPurchaseInvoices(): Document[]
savePurchaseInvoices(documents: Document[]): void
loadUnclassifiedDocuments(): Document[]
saveUnclassifiedDocuments(documents: Document[]): void

loadDocuments(): Document[]
// Vista unificada de solo lectura: venta + compra.
// No incluye documentos no clasificados.

addDocument(document, config): Document
// Decide la colección por customFields.tipoFactura.
// Rechaza si el tipo no es 'venta' o 'compra'.

updateDocument(id, updates, config): Document
// Busca el documento en su colección, valida y guarda en la misma colección.
// No permite cambiar tipoFactura.

deleteDocument(id): Document[]
// Elimina de la colección correspondiente y de los movimientos.

deleteDocumentsForEntity(entityId): Document[]
// Elimina de ambas colecciones y de los movimientos.
```

**Compatibilidad**:
- `loadDocuments()` se mantiene para búsqueda, seguimiento, movimientos y pruebas existentes.
- `saveDocuments()` se mantiene como función de compatibilidad que separa por tipo antes de escribir; no debe usarse para mezclar tipos.
- `clearAll()` elimina las colecciones nuevas, la marca de migración y la colección legada.

## 4. Migración desde `001`

**Disparador**: al inicializar `storage.js` o al llamar a `migrateLegacyDocuments()`.

**Algoritmo**:
1. Si `erp.migration.invoiceSplit === 'done'`, no hacer nada.
2. Leer `erp.documents`.
3. Si no existe o está vacío, marcar la migración como completada y salir.
4. Para cada documento:
   - Si `customFields.tipoFactura === 'venta'`, agregarlo a `erp.salesInvoices` si no existe por `document_id`.
   - Si `customFields.tipoFactura === 'compra'`, agregarlo a `erp.purchaseInvoices` si no existe por `document_id`.
   - Si falta el tipo o es distinto, agregarlo a `erp.unclassifiedDocuments` si no existe por `document_id`.
5. Verificar que `sales + purchase + unclassified === total leído` (sin contar duplicados ya presentes).
6. Si la verificación es correcta:
   - eliminar `erp.documents`;
   - escribir `erp.migration.invoiceSplit = 'done'`;
   - escribir `erp.schemaVersion = '2.0.0'`.
7. Si la verificación falla:
   - conservar `erp.documents`;
   - no marcar la migración;
   - devolver `{ ok: false, reason: 'MIGRATION_FAILED', message }`.

**Resultado**:

```js
{
  ok: true,
  migrated: { sales: 3, purchases: 4, unclassified: 0 },
  legacyRemoved: true
}
```

**Requisitos**:
- La migración debe ser idempotente: ejecutarla dos veces no duplica documentos.
- No debe perder documentos.
- No debe mezclar tipos.
- Debe poder ejecutarse en pruebas con `localStorage` simulado.

## 5. Vistas y elementos

### 5.1 Facturas de venta

| Elemento | ID |
|---|---|
| Vista | `view-invoice-sale` |
| Formulario | `invoice-sale-form` |
| Selector de edición | `invoice-sale-edit` |
| Lista | `invoice-sale-list` |
| Vacío | `invoice-sale-empty` |

- Terceros admitidos: `cliente`.
- Columnas: Folio, Estado, Emisión, Vencimiento, Total, Orden de venta.
- Clase visual: `invoice-view--sale`, `invoice-badge--sale`.

### 5.2 Facturas de compra

| Elemento | ID |
|---|---|
| Vista | `view-invoice-purchase` |
| Formulario | `invoice-purchase-form` |
| Selector de edición | `invoice-purchase-edit` |
| Lista | `invoice-purchase-list` |
| Vacío | `invoice-purchase-empty` |

- Terceros admitidos: `proveedor` o `personal`.
- Columnas: Folio, Estado, Emisión, Vencimiento, Total, Centro de costo, Período de liquidación.
- Clase visual: `invoice-view--purchase`, `invoice-badge--purchase`.

### 5.3 Sin vista genérica

- No debe existir `#view-documents` ni `#nav-documents` en el menú.
- No debe existir `#qa-new-document` en las acciones rápidas.
- Las facturas se abren solo desde `invoice-sale` o `invoice-purchase`.

## 6. Comportamiento de los formularios

- El tipo de factura no es un campo editable; lo fija la vista.
- El formulario inyecta `customFields.tipoFactura` al guardar.
- Al editar, se valida que el documento pertenezca al tipo de la vista; si no, se rechaza y se redirige a la vista correcta.
- El selector de tercero se filtra por tipo:
  - venta → `cliente`;
  - compra → `proveedor` o `personal`.
- Los campos propios se muestran según el tipo:
  - venta → `salesOrderId`;
  - compra → `centroCosto` y `periodoLiquidacion` (este último solo si el tercero es `personal`).
- Las validaciones existentes de `001` se mantienen sin cambios.

## 7. Estilos y accesibilidad

- Cada vista usa un color de acento y un borde distintos, sin depender solo del color: incluye un texto de tipo ("Factura de venta" / "Factura de compra").
- Las tablas usan `thead`/`tbody` y encabezados accesibles.
- En pantallas pequeñas, la tabla permite desplazamiento horizontal.
- Los mensajes de error usan `role="alert"` y se asocian al campo correspondiente.
- La liquidación del trabajador usa un estilo de tarjeta y no muestra acciones de edición.

## 8. Pruebas de contrato

- `tests/unit/invoice-storage-separation.test.js`:
  - `addDocument` escribe en la colección correcta;
  - `loadSaleInvoices` y `loadPurchaseInvoices` no se mezclan;
  - `updateDocument` no cambia de colección;
  - `deleteDocument` elimina de la colección correcta;
  - `loadDocuments` devuelve la unión sin documentos no clasificados.
- `tests/integration/invoice-migration.test.js`:
  - migra una colección única con ventas y compras;
  - no duplica al ejecutar dos veces;
  - envía documentos sin tipo a `unclassified`;
  - conserva la colección legada si falla.
- `tests/integration/invoice-separation.test.js`:
  - existen las dos vistas y no la genérica;
  - cada listado muestra solo su tipo;
  - el formulario fija el tipo;
  - la liquidación del trabajador no muestra facturas de venta.
