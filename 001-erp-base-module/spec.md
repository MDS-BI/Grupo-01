# Módulo de Contabilidad y Finanzas: Cuentas por Cobrar (Facturación)

## 1. Problema a resolver
Las pequeñas y medianas empresas suelen llevar el registro de sus clientes y las facturas por cobrar en planillas de cálculo (Excel) desordenadas. Esto genera pérdida de información, errores manuales en los montos de facturación, y falta de seguimiento en las fechas de vencimiento, lo que impacta negativamente en la liquidez de la empresa.

## 2. Solución Propuesta (MVP)
Se propone implementar un Módulo de Cuentas por Cobrar (Accounts Receivable) basado en el template ERP. 
El MVP permitirá:
- Registrar y administrar la base de datos de **Clientes** (Entidad Maestra).
- Emitir y hacer seguimiento de **Facturas** (Documentos Transaccionales) asociadas a cada cliente, controlando sus estados (Borrador, Emitida, Pagada).

## 3. Usuarios Potenciales
- **Usuario Principal:** Analista de Cuentas por Cobrar o Asistente de Finanzas. Su rol es ingresar los datos de nuevos clientes, generar facturas según las ventas realizadas y actualizar el estado de pago.
- **Usuario Secundario:** Jefe de Finanzas. Su rol es visualizar de forma general la cantidad de facturas emitidas y pendientes de pago en el Dashboard.

## 4. Historias de Usuario
- **HU1:** Como Asistente de Finanzas, quiero registrar un nuevo cliente con su RUT y datos de contacto, para poder asociarle facturas en el futuro.
- **HU2:** Como Asistente de Finanzas, quiero emitir una factura ingresando el monto total y la fecha de vencimiento, para tener registro de la deuda del cliente.
- **HU3:** Como Jefe de Finanzas, quiero poder cambiar el estado de una factura de "Emitida" a "Pagada", para mantener el flujo de caja actualizado.

## 5. Manejo de Riesgos de Datos y Sesgos
- **Privacidad y Datos Sensibles:** El sistema almacena información confidencial (RUT, teléfonos, correos y límites de crédito). Se debe asegurar que estos datos no sean de acceso público y estén limitados solo al personal de finanzas.
- **Sesgos Algorítmicos / Humanos:** Existe un riesgo de sesgo al momento de definir manualmente el campo `Límite de Crédito` (credit_limit) para los clientes. Si un usuario asigna estos límites basándose en criterios subjetivos, se podría discriminar injustamente a ciertos clientes. Para un desarrollo futuro, el límite de crédito debería calcularse mediante una fórmula estandarizada y transparente.
