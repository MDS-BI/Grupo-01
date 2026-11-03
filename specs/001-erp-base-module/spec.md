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
- **Integrante del equipo (demostración):** carga los datos de ejemplo y guarda referencias a otros módulos (HU6).

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
6. **Dada** una factura Emitida, **cuando** consulto al cliente, **entonces** veo la factura con su monto total y su fecha de vencimiento.
7. **Dado** un monto total negativo, **cuando** intento guardar la factura, **entonces** el sistema la rechaza e informa el error.

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

Como integrante del equipo, quiero cargar ejemplos ficticios de clientes, proveedores y facturas, y guardar sus referencias a otros módulos del ERP, para probar los procesos de cobro y pago y mostrar cómo se relacionan los registros.

**Por qué esta prioridad**: para presentar el módulo necesitamos ejemplos que permitan recorrer sus funciones sin ingresar todos los datos a mano. Estos ejemplos también nos servirán para comprobar que las facturas se asocian al tercero correcto, que los pagos actualizan las deudas y que se identifican las facturas vencidas.

**Prueba independiente**: abrir el módulo sin datos, cargar los ejemplos y comprobar que aparecen clientes, proveedores y facturas en distintos estados. Recargar la página y verificar que los registros y sus relaciones se mantienen.

**Escenarios de aceptación**:

1. **Dado** que el módulo está vacío, **cuando** cargo los datos de demostración, **entonces** aparecen clientes, proveedores y facturas ficticias de venta y compra, incluyendo casos pendientes, pagados y vencidos.
2. **Dados** los ejemplos cargados, **cuando** recargo la página, **entonces** los registros conservan sus datos, estados y relaciones.
3. **Dados** los ejemplos ya cargados, **cuando** intento cargarlos nuevamente, **entonces** el sistema informa que ya existen datos y no genera duplicados.
4. **Dado** que ya ingresé mis propios registros, **cuando** intento cargar la demostración, **entonces** el sistema informa que la carga requiere un módulo vacío y conserva mis registros.
5. **Dado** un tercero o una factura, **cuando** guardo una referencia a otro módulo, **entonces** puedo volver a consultarla después de cerrar y abrir el registro.

---

### Casos Límite

- ¿Qué pasa si se registran dos terceros con el mismo código? El módulo base del template lo rechaza, sin distinguir mayúsculas.
- ¿Qué pasa si se registran dos facturas con la misma serie y el mismo folio? El sistema lo rechaza: la combinación (tipo, serie y folio) debe ser única.
- ¿Qué pasa si el RUT está mal escrito o repetido? El sistema valida el formato y el dígito verificador (módulo 11) y rechaza los RUT inválidos; no exige que el RUT sea único entre terceros.
- ¿Qué pasa si una factura se emite sin monto total? El sistema lo rechaza: el monto total debe ser mayor que cero al emitir.
- ¿Qué pasa si las facturas Emitidas de un cliente superan su límite de crédito? El sistema avisa y exige una confirmación explícita, pero no bloquea la emisión.
- ¿Qué pasa si se mezclan facturas en pesos y en dólares en un mismo total? No puede ocurrir: el MVP usa una única moneda (Chile: CLP).
- ¿Qué pasa si el descuento es mayor que el subtotal? El sistema rechaza la factura.
- ¿Qué pasa si el monto total es cero? Se admite solo en Borrador, como valor no negativo que no representa una deuda activa; al emitir, el sistema exige un monto mayor que cero.
- ¿Qué pasa si el cliente se elimina antes de emitir la factura? La factura no puede registrarse, porque debe asociarse a un tercero existente.
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
- **FR-007**: Cada factura DEBE tener folio (entero positivo), serie opcional, moneda (única en el MVP: CLP), fecha de emisión, fecha de vencimiento (igual o posterior a la de emisión) y monto total. El monto total puede ser cero en Borrador; para emitir DEBE ser mayor que cero.
- **FR-008**: El sistema DEBE rechazar una factura cuyo descuento sea mayor que su subtotal.
- **FR-009**: Toda factura nueva DEBE iniciar en estado Borrador.
- **FR-010**: El sistema DEBE permitir solo las transiciones Borrador → Emitida → Pagada. No se puede retroceder y Pagada es el estado final.

**Pagos**

- **FR-011**: El sistema DEBE permitir registrar el monto pagado y la fecha de pago de una factura Emitida, y marcarla como Pagada solo si el monto pagado es igual al monto total (que, al estar Emitida, es mayor que cero).

**Seguimiento**

- **FR-012**: El sistema DEBE mostrar el total por cobrar de cada cliente y el total por pagar a cada proveedor, contando solo las facturas Emitidas.
- **FR-013**: El sistema DEBE identificar como vencidas las facturas Emitidas cuya fecha de vencimiento ya pasó.
- **FR-014**: El sistema NO DEBE contar las facturas Pagadas como deuda ni como vencidas.

**Datos**

- **FR-015**: El sistema DEBE conservar los datos al recargar la página y ofrecer una carga de datos de demostración.
- **FR-016**: El sistema DEBE permitir registrar en terceros y facturas una referencia a otros módulos del ERP (mientras CRM, Ventas y Compras no definan un identificador compartido, la referencia es un campo de texto libre obligatorio solo cuando se ingresa; nada obligatorio por defecto).
- **FR-017**: El sistema DEBE validar el RUT: debe cumplir el formato chileno (partes numéricas + dígito verificador, posible K) con dígito verificador correcto según módulo 11. No se exige unicidad del RUT entre terceros.
- **FR-018**: Al emitir una factura que supera el límite de crédito del cliente, el sistema DEBE avisar y exigir una confirmación explícita antes de emitir; no bloquea la emisión.
- **FR-019**: El sistema DEBE evitar duplicados: el código de tercero ya es único en el módulo base, y la combinación (tipo de factura, serie, folio) DEBE ser única.

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
- Hay un solo tipo de entidad (Tercero, con tipo) y un solo tipo de documento (Factura, con tipo). *(Por confirmar con el profesor; el ayudante recomendó documentos separados.)*
- Los pagos son campos de la factura. Los pagos parciales quedan fuera del MVP.
- La fecha de inicio y la de fin del template se usan como fecha de emisión y de vencimiento. *(Por confirmar.)*
- El MVP usa una sola moneda (CLP), y el monto total debe ser mayor que cero al emitir una factura (cero se admite solo en Borrador). Decidido 2026-11-03 (Q1).
- La interfaz está en español.
- No se usan datos reales, porque el almacenamiento del navegador no es seguro.
- La integración con otros módulos es solo por referencias, sin conexión en vivo. Se acordó usar una referencia de texto libre hasta que CRM, Ventas y Compras definan un identificador compartido.
- El RUT se valida con formato chileno y dígito verificador módulo 11 (decidido 2026-11-03, Q2). No se exige unicidad del RUT.
- El límite de crédito genera un aviso con confirmación explícita al emitir, sin bloqueo (decidido 2026-11-03, Q3).
- La unicidad de factura se define por (tipo, serie, folio).
- Quedan fuera del MVP: pagos como registro propio, plan de cuentas y asientos, activos fijos, presupuestos y conciliación bancaria.
