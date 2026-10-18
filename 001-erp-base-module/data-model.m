# Modelo de Datos: Cuentas por Cobrar

Para la construcción del MVP, la base de datos relacional se ha abstraído para encajar con el template de `Entity` y `Document` proporcionado.

## Esquema de Tablas Críticas

### 1. Entidad: Clientes (`CUSTOMERS`)
Actúa como la "Entity" maestra del sistema. Almacena los datos fijos del cliente.
- `customer_id` (PK): Identificador único (autogenerado).
- `customer_name`: Nombre o Razón Social.
- `tax_id`: RUT del cliente (requerido para facturación legal).
- `email` y `phone`: Datos de contacto.
- `credit_limit`: Monto máximo de crédito permitido (campo crítico financiero).

### 2. Documento: Facturas (`AR_INVOICES`)
Actúa como el "Document" transaccional del sistema. Representa la deuda de un cliente.
- `ar_invoice_id` (PK): Folio autogenerado de la factura.
- `customer_id` (FK): Relación directa con la entidad Cliente.
- `invoice_date`: Fecha de emisión.
- `due_date`: Fecha de vencimiento del pago.
- `total_amount`: Monto total a cobrar.
- `status`: Ciclo de vida del documento (`Borrador`, `Emitida`, `Pagada`).

### 3. Detalle de Factura (`AR_INVOICE_LINES`)
En esta etapa del MVP, el detalle de productos (`quantity`, `unit_price`, `product_id`) se manejará de forma simplificada a través de los campos genéricos de montos totales en el documento principal, asegurando la escalabilidad futura hacia un módulo de inventario cruzado.

**Nota:** El diagrama Entidad-Relación (MER) completo se encuentra adjunto en la raíz del repositorio como `diagrama de flujo finanzas.png`.
