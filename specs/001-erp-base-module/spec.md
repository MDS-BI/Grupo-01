# Especificación de Funcionalidad: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Rama de la funcionalidad**: `001-erp-base-module`

**Creada**: 2026-10-29

**Estado**: Borrador

**Entrada**: Módulo de facturación y pagos, por cobrar y por pagar, para un sistema ERP (solo frontend), construido sobre el template `Speckit_Template`.

## Problema y solución

**Problema.** Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Eso genera errores en los montos, pérdida de información y falta de seguimiento de los vencimientos, lo que afecta su flujo de caja.

**Solución (MVP).** Un módulo de facturación y pagos que permite registrar clientes y proveedores, emitir facturas de venta y de compra con un ciclo de estados (Borrador, Emitida y Pagada), registrar su pago y ver cuánto se debe y qué está vencido.

## Usuarios

**Cliente de la plataforma:** la empresa, a través de su área de finanzas.

**Usuarios:**

- **Encargado de cobranzas:** registra clientes y emite facturas de venta.
- **Encargado de pagos a proveedores:** registra facturas de compra.
- **Contador:** registra los pagos y cierra las facturas.
- **Gerencia:** revisa la deuda por tercero y las facturas vencidas.

## Manejo de riesgos de datos y sesgos

- **RUT:** es un dato personal. El MVP no tiene perfiles de usuario, pero una versión futura debería limitar su visualización al personal de finanzas.
- **Límite de crédito:** si se fija con criterios subjetivos, puede discriminar a ciertos clientes. Los criterios deben documentarse y, en el futuro, el límite debería calcularse con una fórmula estandarizada y transparente.
- **Datos de demostración:** deben ser ficticios.
- **Almacenamiento:** `localStorage` no es seguro, por lo que el MVP no debe usarse con datos reales.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Registrar terceros: clientes y proveedores (Prioridad: P1)

Como encargado de cobranzas o de pagos, quiero registrar clientes y proveedores con su nombre, código, RUT y, en el caso de los clientes, su límite de crédito, para poder asociarles facturas.

**Por qué esta prioridad**: sin terceros registrados no se puede emitir ninguna factura. Es la base de todo el módulo.

**Prueba independiente**: se puede probar registrando un cliente y un proveedor, y comprobando que aparecen en el listado y que se pueden buscar.

**Escenarios de aceptación**:

1. **Dado** que no hay terceros registrados, **cuando** registro un cliente con nombre, código y RUT, **entonces** aparece en el listado de terceros como cliente.
2. **Dado** que registro un tercero sin nombre o sin código, **cuando** intento guardarlo, **entonces** el sistema lo rechaza e indica qué campo falta.
3. **Dado** que ingreso un límite de crédito negativo, **cuando** intento guardar, **entonces** el sistema lo rechaza.
4. **Dado** un tercero que tiene facturas, **cuando** lo elimino, **entonces** el sistema elimina también sus facturas.

---

### Historia de Usuario 2 - Emitir facturas de venta (Prioridad: P1)

Como encargado de cobranzas, quiero registrar una factura de venta a un cliente, con su número, fecha de emisión, fecha de vencimiento y monto total, y pasarla de Borrador a Emitida, para tener registrada la deuda que me debe.

**Por qué esta prioridad**: es el núcleo de las cuentas por cobrar y la funcionalidad que más se usa en el día a día.

**Prueba independiente**: con un cliente ya registrado, se crea una factura en Borrador, se emite y se comprueba que aparece en el listado con estado Emitida.

**Escenarios de aceptación**:

1. **Dado** un cliente registrado, **cuando** creo una factura de venta con número, fechas y monto total, **entonces** queda guardada en estado Borrador.
2. **Dada** una factura en Borrador, **cuando** la emito, **entonces** pasa a estado Emitida y cuenta como deuda por cobrar.
3. **Dada** una fecha de vencimiento anterior a la de emisión, **cuando** intento guardar la factura, **entonces** el sistema la rechaza.
4. **Dado** que intento crear una factura sin elegir un tercero existente, **cuando** intento guardarla, **entonces** el sistema la rechaza.
5. **Dada** una factura Emitida, **cuando** intento devolverla a Borrador, **entonces** el sistema lo impide.

---

### Historia de Usuario 3 - Registrar facturas de compra (Prioridad: P1)

Como encargado de pagos a proveedores, quiero registrar una factura de compra con su número, fechas y monto total, y pasarla de Borrador a Emitida, para tener registrada la deuda que tengo con cada proveedor.

**Por qué esta prioridad**: es la otra mitad del módulo (cuentas por pagar). Usa el mismo ciclo que las facturas de venta, por lo que se construye sobre la misma base.

**Prueba independiente**: con un proveedor ya registrado, se crea una factura de compra, se emite y se comprueba que aparece como deuda por pagar.

**Escenarios de aceptación**:

1. **Dado** un proveedor registrado, **cuando** creo una factura de compra con número, fechas y monto total, **entonces** queda guardada en estado Borrador y marcada como factura de compra.
2. **Dada** una factura de compra en Borrador, **cuando** la emito, **entonces** pasa a estado Emitida y cuenta como deuda por pagar.
3. **Dado** un monto total negativo, **cuando** intento guardar la factura, **entonces** el sistema la rechaza.
4. **Dadas** facturas de venta y de compra registradas, **cuando** reviso el listado, **entonces** puedo distinguirlas por su tipo.

---

### Historia de Usuario 4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

Como contador, quiero registrar el monto pagado y la fecha de pago de una factura emitida, y marcarla como Pagada, para mantener actualizado el flujo de caja.

**Por qué esta prioridad**: cierra el ciclo de la factura, pero solo tiene sentido cuando ya existen facturas emitidas.

**Prueba independiente**: con una factura Emitida, se registra el pago y se comprueba que su estado cambia a Pagada.

**Escenarios de aceptación**:

1. **Dada** una factura Emitida, **cuando** registro el monto pagado y la fecha de pago y la marco como Pagada, **entonces** su estado cambia a Pagada y deja de contar como deuda.
2. **Dada** una factura en Borrador, **cuando** intento marcarla como Pagada, **entonces** el sistema lo impide, porque primero debe emitirse.
3. **Dada** una factura Pagada, **cuando** intento cambiar su estado, **entonces** el sistema lo impide, porque Pagada es el estado final.
4. **Dado** un monto pagado distinto del monto total, **cuando** intento marcarla como Pagada, **entonces** el sistema lo rechaza, porque los pagos parciales son desarrollo futuro.

---

### Historia de Usuario 5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

Como gerente, quiero ver cuánto me deben mis clientes, cuánto debo a mis proveedores y qué facturas están vencidas, para decidir a quién cobrar o pagar primero.

**Por qué esta prioridad**: da valor a gerencia, pero necesita que ya existan facturas registradas. El alcance exacto de la vista depende de lo que permita el template (por confirmar).

**Prueba independiente**: con varias facturas en distintos estados y fechas, se abre la vista de seguimiento y se comprueban los totales y las facturas vencidas.

**Escenarios de aceptación**:

1. **Dadas** facturas de venta Emitidas de un cliente, **cuando** abro el seguimiento, **entonces** veo el total por cobrar de ese cliente.
2. **Dadas** facturas de compra Emitidas de un proveedor, **cuando** abro el seguimiento, **entonces** veo el total por pagar a ese proveedor.
3. **Dada** una factura Emitida cuya fecha de vencimiento ya pasó, **cuando** reviso el seguimiento, **entonces** aparece marcada como vencida.
4. **Dada** una factura Pagada, **cuando** reviso el seguimiento, **entonces** no cuenta como deuda ni como vencida.

---

### Historia de Usuario 6 - Cargar datos de demostración y relacionar con otros módulos (Prioridad: P3)

Como integrante del equipo, quiero cargar datos de ejemplo y registrar en cada tercero y factura su referencia a los otros módulos del ERP, para demostrar el módulo funcionando e integrado.

**Por qué esta prioridad**: no cambia el funcionamiento del módulo, pero es lo que permite mostrarlo en la demo y conectarlo con los demás grupos.

**Prueba independiente**: se cargan los datos de ejemplo y se comprueba que aparecen terceros y facturas en distintos estados, también después de recargar la página.

**Escenarios de aceptación**:

1. **Dado** un sistema sin datos, **cuando** cargo los datos de demostración, **entonces** aparecen terceros y facturas de ejemplo en distintos estados.
2. **Dados** datos de demostración cargados, **cuando** recargo la página, **entonces** los datos siguen ahí.
3. **Dado** un tercero o una factura, **cuando** registro su referencia a otro módulo (cliente de CRM, proveedor de Compras, pedido de Ventas u orden de Compras), **entonces** queda guardada junto al registro. **[NEEDS CLARIFICATION: falta acordar con los grupos de CRM, Ventas y Compras qué identificador se comparte.]**

---

### Casos Límite

- ¿Qué pasa si se registran dos terceros con el mismo código? **[NEEDS CLARIFICATION: el template solo exige que el código no esté vacío; definir si debe ser único.]**
- ¿Qué pasa si se registran dos facturas con la misma serie y el mismo folio? **[NEEDS CLARIFICATION: definir si el número de factura debe ser único.]**
- ¿Qué pasa si el RUT está mal escrito o repetido? **[NEEDS CLARIFICATION: el template no valida el formato ni el dígito verificador; definir las reglas.]**
- ¿Qué pasa si una factura se emite sin monto total? **[NEEDS CLARIFICATION: definir si el monto es obligatorio.]**
- ¿Qué pasa si las facturas Emitidas de un cliente superan su límite de crédito? **[NEEDS CLARIFICATION: definir si el sistema solo avisa o también bloquea la emisión.]**
- ¿Qué pasa si se mezclan facturas en pesos y en dólares en un mismo total? **[NEEDS CLARIFICATION: definir la moneda del MVP.]**
- ¿Qué pasa si el descuento es mayor que el subtotal? El sistema rechaza la factura.
- ¿Qué pasa si la fecha de vencimiento es igual a la de emisión? Se acepta, porque la regla exige que sea igual o posterior.
- ¿Qué pasa al eliminar un tercero con facturas pendientes de pago? Se eliminan también sus facturas, por lo que el sistema debería pedir confirmación antes.
- ¿Qué pasa si el usuario borra los datos del navegador? Se pierden todos los registros, porque se guardan en `localStorage`.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Terceros**

- **FR-001**: El sistema DEBE permitir registrar, editar y eliminar terceros, con nombre, código, RUT y tipo (cliente o proveedor).
- **FR-002**: El sistema DEBE rechazar un tercero sin nombre o sin código.
- **FR-003**: El sistema DEBE permitir indicar un límite de crédito opcional, que no puede ser negativo.
- **FR-004**: El sistema DEBE permitir buscar terceros.
- **FR-005**: Al eliminar un tercero, el sistema DEBE eliminar también sus facturas, pidiendo confirmación antes.

**Facturas**

- **FR-006**: El sistema DEBE permitir registrar facturas de venta y de compra, cada una asociada a un tercero existente, indicando su tipo. Una factura de venta solo puede asociarse a un cliente, y una de compra a un proveedor.
- **FR-007**: Cada factura DEBE tener folio (entero positivo), serie opcional, fecha de emisión, fecha de vencimiento (igual o posterior a la de emisión) y monto total no negativo.
- **FR-008**: El sistema DEBE rechazar una factura cuyo descuento sea mayor que su subtotal.
- **FR-009**: Toda factura nueva DEBE iniciar en estado Borrador.
- **FR-010**: El sistema DEBE permitir solo las transiciones Borrador → Emitida → Pagada. No se puede retroceder y Pagada es el estado final.

**Pagos**

- **FR-011**: El sistema DEBE permitir registrar el monto pagado y la fecha de pago de una factura Emitida, y marcarla como Pagada solo si el monto pagado es igual al monto total.

**Seguimiento**

- **FR-012**: El sistema DEBE mostrar el total por cobrar de cada cliente y el total por pagar a cada proveedor, contando solo las facturas Emitidas.
- **FR-013**: El sistema DEBE identificar como vencidas las facturas Emitidas cuya fecha de vencimiento ya pasó.
- **FR-014**: El sistema NO DEBE contar las facturas Pagadas como deuda ni como vencidas.

**Datos**

- **FR-015**: El sistema DEBE conservar los datos al recargar la página y ofrecer una carga de datos de demostración.
- **FR-016**: El sistema DEBE permitir registrar en terceros y facturas su referencia a otros módulos del ERP **[NEEDS CLARIFICATION: falta acordar con los grupos de CRM, Ventas y Compras qué identificador se comparte.]**
- **FR-017**: El sistema DEBE validar el RUT **[NEEDS CLARIFICATION: definir formato y dígito verificador.]**
- **FR-018**: El sistema DEBE controlar el límite de crédito al emitir facturas **[NEEDS CLARIFICATION: definir si solo avisa o también bloquea.]**
- **FR-019**: El sistema DEBE evitar duplicados **[NEEDS CLARIFICATION: definir si el código de tercero y el par serie-folio deben ser únicos.]**

### Entidades Clave

- **Tercero**: cliente o proveedor. Tiene nombre, código, RUT, tipo y, si es cliente, límite de crédito. Un tercero tiene cero o muchas facturas.
- **Factura**: de venta o de compra. Tiene serie, folio, fecha de emisión, fecha de vencimiento, montos, moneda, estado, monto pagado y fecha de pago. Pertenece a un solo tercero.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Una persona nueva puede registrar un tercero y emitir su primera factura en menos de 3 minutos, sin ayuda.
- **SC-002**: El 100% de las facturas Pagadas deja de aparecer como deuda en el seguimiento.
- **SC-003**: El 100% de los datos inválidos (sin nombre, monto negativo, vencimiento anterior a la emisión) se rechaza con un mensaje claro.
- **SC-004**: Los datos siguen disponibles después de recargar la página.
- **SC-005**: Con los datos de demostración, el flujo completo (tercero, factura, emisión, pago y seguimiento) se puede mostrar en menos de 5 minutos.

## Supuestos

- El MVP es solo frontend: los datos se guardan en el navegador, hay un solo usuario por navegador y no hay inicio de sesión ni perfiles.
- Hay un solo tipo de entidad (Tercero, con tipo) y un solo tipo de documento (Factura, con tipo). *(Por confirmar con el ayudante.)*
- Los pagos son campos de la factura. Los pagos parciales quedan fuera del MVP.
- La fecha de inicio y la de fin del template se usan como fecha de emisión y de vencimiento. *(Por confirmar.)*
- El MVP usa una sola moneda, y el monto total es obligatorio al emitir una factura. *(Por confirmar.)*
- La interfaz está en español.
- No se usan datos reales, porque el almacenamiento del navegador no es seguro.
- La integración con otros módulos es solo por referencias, sin conexión en vivo.
- Quedan fuera del MVP: pagos como registro propio, plan de cuentas y asientos, activos fijos, presupuestos y conciliación bancaria.
