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
- ### Historia de Usuario 2 - Emisión y Registro de Facturas a Clientes (prioridad: p1)
  **Como** Asistente de Finanzas, **quiero** emitir una factura asociada a un cliente existente ingresando el monto total y la fecha de vencimiento, **para** tener un registro confiable y ordenado de la deuda del cliente.
  **porque esta prioridad**: la emisión de facturas es el núcleo del módulo de Cuentas por Cobrar; sin facturas registradas no existe cartera por cobrar, seguimiento de vencimientos ni base para controlar la liquidez de la empresa.
  **prueba independiente**: el usuario puede seleccionar un cliente registrado, ingresar los datos de la factura (monto total y fecha de vencimiento) y verla guardada y asociada a ese cliente con su estado correspondiente.
  **escenario de aceptación**:
  1. **dado** un cliente registrado **cuando** el usuario ingresa el monto total, la fecha de vencimiento y los datos obligatorios de la factura **entonces** la factura queda registrada y asociada al cliente en estado **Borrador**.
  2. **dado** una factura en estado Borrador **cuando** el usuario confirma su emisión **entonces** la factura pasa a estado **Emitida** y representa una deuda activa del cliente.
  3. **dado** una factura emitida **cuando** el usuario consulta al cliente **entonces** visualiza la factura con su monto total y fecha de vencimiento.
  4. **dado** un monto total negativo o una fecha de vencimiento anterior a la fecha de emisión **cuando** el usuario intenta guardar la factura **entonces** el sistema rechaza el registro e informa el error.
  5. **dado** que no existe un cliente seleccionado o válido **cuando** el usuario intenta emitir la factura **entonces** el sistema impide el registro e indica que la factura debe asociarse a un cliente existente.
  **casos límite**:
  - Monto total igual a cero: se acepta por ser un valor no negativo, aunque no representa una deuda activa para la cartera.
  - Fecha de vencimiento igual a la fecha de emisión: se acepta como vencimiento el mismo día.
  - Cliente eliminado antes de emitir la factura: la factura no puede registrarse.
  - Factura sin folio entero positivo: se rechaza el registro.
- **HU3:** Como Jefe de Finanzas, quiero poder cambiar el estado de una factura de "Emitida" a "Pagada", para mantener el flujo de caja actualizado.
- ### Historia de Usuario 4 (prioridad: p1)-
  como analista de finanzas, quiero tener la capacidad de consultar los registros de facturas por numero y fecha para tener un seguimiento preciso. 
  **porque esta prioridad**:tener un registro actualizado es vital para la toma de desiciones de una empresa.
  **prueba independiente**: el usuario puede filtrar y buscar una factura especifica en cualquier momento.
  **escenario de aceptacion**:
  1. **dado** una factura valida **cuando** busca nro de facura **entonces** aparece la factura con datos del cliente.
  2. **dado** una fecha especifica **cuando** se busca esa fecha **entonces** se muestran todas las facturas emitidas en esa fecha.
## 5. Manejo de Riesgos de Datos y Sesgos
- **Privacidad y Datos Sensibles:** El sistema almacena información confidencial (RUT, teléfonos, correos y límites de crédito). Se debe asegurar que estos datos no sean de acceso público y estén limitados solo al personal de finanzas.
- **Sesgos Algorítmicos / Humanos:** Existe un riesgo de sesgo al momento de definir manualmente el campo `Límite de Crédito` (credit_limit) para los clientes. Si un usuario asigna estos límites basándose en criterios subjetivos, se podría discriminar injustamente a ciertos clientes. Para un desarrollo futuro, el límite de crédito debería calcularse mediante una fórmula estandarizada y transparente.
