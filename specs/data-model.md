# Modelo de Datos - Módulo de Cuentas por Cobrar (Clientes y Facturas)

## Visión General
El módulo de **Cuentas por Cobrar** permite gestionar el registro maestro de **Clientes** (Entidades) y el seguimiento de las **Facturas** (Documentos transaccionales) asociadas. La arquitectura reutiliza la estructura Entidad–Documento de la plantilla Speckit, garantizando la integridad referencial mediante `entity_id`, el borrado en cascada y la persistencia local en `localStorage`.

## Entidad Principal: Cliente (`Entity`)
Representa el registro maestro de clientes sobre los cuales se emiten las facturas y se administra el límite de crédito comercial.

### Campos Estándar de la Plantilla Base

* `id` (String): Identificador único interno (UUID) para la gestión y edición/eliminación del registro.
* `entity_id` (String): Identificador público del cliente generado automáticamente y referenciado por las facturas.
* `name` (String, Requerido): Nombre o razón social del cliente.
* `code` (String, Requerido): Código único identificador del cliente (ej. *"CLI-001"*).
* `createdAt` (Date): Marca de tiempo de creación del registro.
* `updatedAt` (Date): Marca de tiempo de última actualización.

### Campos Base Reutilizados

* `taxId` (String, Opcional): Identificación fiscal del cliente (RUT / Tax ID).
* `creditLimit` (Number, Opcional): Límite de crédito asignado en valor numérico no negativo.

## Documento Transaccional: Factura (`Document`)

Representa las facturas y comprobantes de cobro emitidos a un cliente específico.

### Campos Estándar y Base Reutilizados

* `id` (String): Identificador único interno del documento para edición y eliminación.
* `entity_id` (String, Requerido): Clave foránea que referencia exactamente al `Entity.entity_id` del Cliente asociado.
* `series` (String, Opcional): Serie comercial del documento (ej. *"F001"*).
* `folio` (Number, Requerido): Número correlativo de la factura (entero positivo).
* `startDate` (Date, Requerido): Fecha de emisión de la factura.
* `endDate` (Date, Requerido): Fecha de vencimiento de la factura (debe ser mayor o igual a `startDate`).
* `totalAmount` (Number, Requerido): Monto total de la factura (monto numérico no negativo).
* `subtotal` / `taxAmount` / `discount` (Number, Opcionales): Desglose de montos netos, impuestos y descuentos.
* `currency` (String, Opcional): Moneda de la transacción (ej. *"CLP"*, *"USD"*).
* `status` (String, Requerido): Estado actual en el ciclo de vida de cobro.

## Ciclo de Vida de la Factura (`statusLifecycle`)

Establece el flujo comercial para el control de la cartera de cobros:

1. **`Borrador`**: Factura ingresada en el sistema, pendiente de emisión formal. Estado inicial obligatorio.
2. **`Emitida`**: Factura enviada al cliente; representa la deuda activa por cobrar.
3. **`Pagada`**: Estado terminal que indica el pago completo de la factura.

### Transiciones Permitidas
* `Borrador` -> `Emitida`
* `Emitida` -> `Pagada`

*Nota: No se permiten modificaciones ni salidas desde el estado terminal `Pagada`.*

## Reglas de Integridad y Almacenamiento

1. **Relación Cliente a Facturas (1:N):** Un Cliente puede tener 0 o muchas Facturas. Cada Factura pertenece obligatoriamente a un Cliente mediante la referencia `Document.entity_id` -> `Entity.entity_id`.
2. **Eliminación en Cascada:** Al eliminar un Cliente, el sistema elimina automáticamente todas sus Facturas asociadas.
3. **Persistencia Local:** Los datos se almacenan en el navegador mediante `localStorage` bajo las claves `erp_entities` y `erp_documents`. 