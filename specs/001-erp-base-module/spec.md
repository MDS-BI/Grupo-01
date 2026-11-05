# Especificación de Funcionalidad: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Rama de la funcionalidad**: `001-erp-base-module`

**Creada**: 2026-10-29

**Estado**: Borrador (Revisión 3 — 2026-11-05, clarify aplicado)

**Entrada**: Módulo de facturación y pagos, por cobrar y por pagar, para un sistema ERP (solo frontend), construido sobre el template `Speckit_Template`.

## Problema y solución

**Problema.** Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Eso genera errores en los montos, pérdida de información y falta de seguimiento de los vencimientos, lo que afecta su flujo de caja.

**Solución (MVP).** Un módulo de facturación y pagos con una base de terceros (clientes, proveedores y personal), que emite facturas de venta y facturas de compra como documentos separados, con un ciclo de estados (Borrador, Emitida y Pagada), centro de costo en las compras (Activos/Consumible), trazabilidad hacia las órdenes de venta, una tabla de movimientos financieros generada automáticamente, la factura de compra como instrumento para liquidaciones de sueldo, registro del pago y una vista de home con KPIs para ver cuánto se debe y qué está vencido.

## Usuarios

**Cliente de la plataforma:** la empresa, a través de su área de finanzas.

**Usuarios:**

- **Encargado de cobranzas:** registra clientes y emite facturas de venta.
- **Encargado de pagos a proveedores:** registra facturas de compra.
- **Contador:** registra los pagos, revisa los movimientos financieros y cierra las facturas.
- **Gerencia:** revisa el home con KPIs, la deuda por tercero y las facturas vencidas.
- **Responsable de remuneraciones:** registra facturas de compra dirigidas al personal, como instrumento de las liquidaciones de sueldo.
- **Integrante del equipo (demostración):** carga los datos de ejemplo y guarda referencias a otros módulos (HU6).

## Manejo de riesgos de datos y sesgos

- **RUT:** es un dato personal. El MVP no tiene perfiles de usuario, pero una versión futura debería limitar su visualización al personal de finanzas. Esto aplica también a los terceros de tipo personal (trabajadores), cuyo RUT es siempre un dato personal.
- **Límite de crédito:** si se fija con criterios subjetivos, puede discriminar a ciertos clientes. Los criterios deben documentarse y, en el futuro, el límite debería calcularse con una fórmula estandarizada y transparente. El límite de crédito solo aplica a terceros de tipo cliente.
- **Datos de remuneraciones:** las liquidaciones de sueldo asocian montos a trabajadores. En el MVP la factura de compra es solo el instrumento o comprobante del pago (con un período obligatorio en formato `YYYY-MM` cuando el tercero es de tipo personal); no se calculan ni se exponen haberes, descuentos legales (AFP, salud) ni imponibilidad, que quedan fuera del alcance.
- **Datos de demostración:** deben ser ficticios.
- **Almacenamiento:** `localStorage` no es seguro, por lo que el MVP no debe usarse con datos reales.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Registrar terceros: clientes, proveedores y personal (Prioridad: P1)

Como encargado de cobranzas, de pagos o de remuneraciones, quiero registrar terceros de tipo cliente, proveedor o personal, con su nombre, código, RUT y, en el caso de los clientes, su límite de crédito, para poder asociarles facturas de venta o de compra.

**Por qué esta prioridad**: sin terceros registrados no se puede emitir ninguna factura. Es la base de todo el módulo.

**Prueba independiente**: se puede probar registrando un cliente, un proveedor y un trabajador, y comprobando que aparecen en el listado y que se pueden buscar.

**Escenarios de aceptación**:

1. **Dado** que no hay terceros registrados, **cuando** registro un tercero con nombre, código, RUT y tipo (cliente, proveedor o personal), **entonces** aparece en el listado de terceros con su tipo.
2. **Dado** que registro un tercero sin nombre o sin código, **cuando** intento guardarlo, **entonces** el sistema lo rechaza e indica qué campo falta.
3. **Dado** que ingreso un límite de crédito negativo en un cliente, **cuando** intento guardar, **entonces** el sistema lo rechaza.
4. **Dado** que registro un tercero de tipo proveedor o personal, **cuando** intento asignarle un límite de crédito, **entonces** el sistema no lo permite, porque el límite de crédito solo aplica a clientes.
5. **Dado** un tercero que tiene facturas, **cuando** lo elimino, **entonces** el sistema elimina también sus facturas.

---

### Historia de Usuario 2 - Emitir facturas de venta (Prioridad: P1)

Como encargado de cobranzas, quiero registrar una factura de venta a un cliente, con su número, fecha de emisión, fecha de vencimiento, monto total y, si corresponde, su referencia a la orden de venta (`sales_order_id`), y pasarla de Borrador a Emitida, para tener registrada la deuda que me debe.

**Por qué esta prioridad**: es el núcleo de las cuentas por cobrar y la funcionalidad que más se usa en el día a día.

**Prueba independiente**: con un cliente ya registrado, se crea una factura de venta en Borrador, se emite y se comprueba que aparece en el listado de facturas de venta con estado Emitida y que generó un movimiento financiero de cargo.

**Escenarios de aceptación**:

1. **Dado** un cliente registrado, **cuando** creo una factura de venta con número, fechas y monto total, **entonces** queda guardada en estado Borrador como documento de tipo venta.
2. **Dada** una factura de venta en Borrador, **cuando** la emito, **entonces** pasa a estado Emitida, cuenta como deuda por cobrar y el sistema registra un movimiento financiero de cargo.
3. **Dada** una fecha de vencimiento anterior a la de emisión, **cuando** intento guardar la factura, **entonces** el sistema la rechaza.
4. **Dado** que intento crear una factura de venta asociada a un tercero que no es de tipo cliente, **cuando** intento guardarla, **entonces** el sistema la rechaza.
5. **Dada** una factura de venta Emitida, **cuando** intento devolverla a Borrador, **entonces** el sistema lo impide.
6. **Dada** una factura de venta Emitida, **cuando** consulto al cliente, **entonces** veo la factura con su monto total, su fecha de vencimiento y, si se ingresó, su `sales_order_id`.
7. **Dado** que la factura de venta tiene una referencia de orden de venta ingresada, **cuando** reviso el documento o sus movimientos, **entonces** puedo rastrear la trazabilidad entre la factura y la orden de venta.

---

### Historia de Usuario 3 - Registrar facturas de compra (Prioridad: P1)

Como encargado de pagos a proveedores, quiero registrar una factura de compra dirigida a un proveedor o a un trabajador, con su número, fechas, monto total y centro de costo (Activo o Consumible), y pasarla de Borrador a Emitida, para tener registrada la deuda que tengo con cada tercero.

**Por qué esta prioridad**: es la otra mitad del módulo (cuentas por pagar). Es un documento separado de la factura de venta y agrega el centro de costo, que clasifica el gasto entre Activos y Consumible.

**Prueba independiente**: con un proveedor ya registrado, se crea una factura de compra con centro de costo, se emite y se comprueba que aparece como deuda por pagar con su centro de costo y que generó un movimiento financiero de abono.

**Escenarios de aceptación**:

1. **Dado** un proveedor registrado, **cuando** creo una factura de compra con número, fechas, monto total y centro de costo (Activo o Consumible), **entonces** queda guardada en estado Borrador como documento de tipo compra.
2. **Dada** una factura de compra en Borrador sin centro de costo definido, **cuando** intento emitirla, **entonces** el sistema lo rechaza y exige elegir Activo o Consumible.
3. **Dada** una factura de compra en Borrador, **cuando** la emito, **entonces** pasa a estado Emitida, cuenta como deuda por pagar y el sistema registra un movimiento financiero de abono con su centro de costo.
4. **Dado** que intento crear una factura de compra asociada a un tercero de tipo cliente, **cuando** intento guardarla, **entonces** el sistema la rechaza.
5. **Dado** un monto total negativo, **cuando** intento guardar la factura de compra, **entonces** el sistema la rechaza.
6. **Dadas** facturas de venta y de compra registradas, **cuando** reviso los listados, **entonces** son documentos separados: la venta aparece en su listado de facturas de venta y la compra en el de facturas de compra, cada una con su centro de costo cuando corresponde.

---

### Historia de Usuario 4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

Como contador, quiero registrar el monto pagado y la fecha de pago de una factura emitida (de venta o de compra), y marcarla como Pagada, para mantener actualizado el flujo de caja.

**Por qué esta prioridad**: cierra el ciclo de la factura, pero solo tiene sentido cuando ya existen facturas emitidas.

**Prueba independiente**: con una factura Emitida, se registra el pago y se comprueba que su estado cambia a Pagada y que se generó el movimiento financiero de contrapartida.

**Escenarios de aceptación**:

1. **Dada** una factura Emitida, **cuando** registro el monto pagado y la fecha de pago y la marco como Pagada, **entonces** su estado cambia a Pagada, deja de contar como deuda y el sistema registra un movimiento financiero de pago (abono si es venta, cargo si es compra).
2. **Dada** una factura en Borrador, **cuando** intento marcarla como Pagada, **entonces** el sistema lo impide, porque primero debe emitirse.
3. **Dada** una factura Pagada, **cuando** intento cambiar su estado, **entonces** el sistema lo impide, porque Pagada es el estado final.
4. **Dado** un monto pagado distinto del monto total, **cuando** intento marcarla como Pagada, **entonces** el sistema lo rechaza, porque los pagos parciales son desarrollo futuro.

---

### Historia de Usuario 5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

Como gerente, quiero ver cuánto me deben mis clientes, cuánto debo a mis proveedores y qué facturas están vencidas, para decidir a quién cobrar o pagar primero.

**Por qué esta prioridad**: da valor a gerencia, pero necesita que ya existan facturas registradas. La vista detallada de seguimiento convive con el home (HU7): el home muestra los KPIs resumidos y esta historia permite abrir el detalle por tercero y por factura.

**Prueba independiente**: con varias facturas en distintos estados y fechas, se abre la vista de seguimiento y se comprueban los totales y las facturas vencidas.

**Escenarios de aceptación**:

1. **Dadas** facturas de venta Emitidas de un cliente, **cuando** abro el seguimiento, **entonces** veo el total por cobrar de ese cliente.
2. **Dadas** facturas de compra Emitidas de un proveedor, **cuando** abro el seguimiento, **entonces** veo el total por pagar a ese proveedor.
3. **Dada** una factura Emitida cuya fecha de vencimiento ya pasó, **cuando** reviso el seguimiento, **entonces** aparece marcada como vencida.
4. **Dada** una factura Pagada, **cuando** reviso el seguimiento, **entonces** no cuenta como deuda ni como vencida.

---

### Historia de Usuario 6 - Cargar datos de demostración y relacionar con otros módulos (Prioridad: P3)

Como integrante del equipo, quiero cargar ejemplos ficticios de terceros (clientes, proveedores y personal) y de facturas de venta y compra, y guardar sus referencias a otros módulos del ERP, para probar los procesos de cobro y pago y mostrar cómo se relacionan los registros.

**Por qué esta prioridad**: para presentar el módulo necesitamos ejemplos que permitan recorrer sus funciones sin ingresar todos los datos a mano. Estos ejemplos también nos servirán para comprobar que las facturas se asocian al tercero correcto, que los pagos actualizan las deudas, que se generan los movimientos financieros y que se identifican las facturas vencidas.

**Prueba independiente**: abrir el módulo sin datos, cargar los ejemplos y comprobar que aparecen terceros de los tres tipos y facturas de venta y compra en distintos estados, con sus movimientos financieros. Recargar la página y verificar que los registros y sus relaciones se mantienen.

**Escenarios de aceptación**:

1. **Dado** que el módulo está vacío, **cuando** cargo los datos de demostración, **entonces** aparecen terceros ficticios de los tres tipos y facturas ficticias de venta y compra, incluyendo casos pendientes, pagados y vencidos, y sus movimientos financieros asociados.
2. **Dados** los ejemplos cargados, **cuando** recargo la página, **entonces** los registros conservan sus datos, estados y relaciones.
3. **Dados** los ejemplos ya cargados, **cuando** intento cargarlos nuevamente, **entonces** el sistema informa que ya existen datos y no genera duplicados.
4. **Dado** que ya ingresé mis propios registros, **cuando** intento cargar la demostración, **entonces** el sistema informa que la carga requiere un módulo vacío y conserva mis registros.
5. **Dado** un tercero o una factura, **cuando** guardo una referencia a otro módulo, **entonces** puedo volver a consultarla después de cerrar y abrir el registro.

---

### Historia de Usuario 7 - Arquitectura de UI y navegación: marco general, home con KPIs y menú desacoplado (Prioridad: P1)

Como usuario del módulo (cobranzas, pagos, contabilidad o gerencia), quiero una arquitectura de interfaz con un marco general de navegación, un home con KPIs y accesos directos, y un menú desacoplado del contenido de los módulos, para moverme entre las funciones de forma consistente y sin depender de la vista que esté usando.

**Por qué esta prioridad**: el marco de navegación es el contenedor donde vive todo lo demás. Definirlo al inicio evita reconstruir la navegación cuando crezcan los listados y vistas.

**Prueba independiente**: con datos de demostración cargados, se navega por el menú entre home, terceros, facturas de venta, facturas de compra, movimientos y seguimiento, y se comprueba que el marco y el menú se mantienen estables sin importar la vista activa.

**Escenarios de aceptación**:

1. **Dado** el módulo abierto, **cuando** reviso la interfaz, **entonces** veo un marco general (layout) con un menú de navegación propio del módulo, desacoplado del contenido: el menú no cambia según el módulo o la vista activa.
2. **Dado** que abro el home, **cuando** hay facturas registradas, **entonces** veo los KPIs principales: total por cobrar, total por pagar y facturas vencidas.
3. **Dado** el home, **cuando** reviso sus accesos directos, **entonces** puedo ir directamente a crear un tercero, crear una factura de venta, crear una factura de compra y abrir el seguimiento.
4. **Dado** el módulo sin datos, **cuando** abro el home, **entonces** los KPIs muestran cero o un estado vacío claro, con un acceso directo a la carga de datos de demostración.
5. **Dada** cualquier vista del módulo, **cuando** uso el menú, **entonces** puedo navegar entre home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento, sin perder el contexto del marco general.
6. **Dado** que cambio de vista por el menú o por un acceso directo, **cuando** la vista destino termina de cargar, **entonces** el contenido central se reemplaza sin recargar la página completa.

---

### Casos Límite

- ¿Qué pasa si se registran dos terceros con el mismo código? El módulo base del template lo rechaza, sin distinguir mayúsculas.
- ¿Qué pasa si se registran dos facturas con la misma serie y el mismo folio? El sistema lo rechaza: la combinación (tipo, serie y folio) debe ser única dentro de cada tipo de documento (venta o compra).
- ¿Qué pasa si el RUT está mal escrito o repetido? El sistema valida el formato y el dígito verificador (módulo 11) y rechaza los RUT inválidos; no exige que el RUT sea único entre terceros.
- ¿Qué pasa si una factura se emite sin monto total? El sistema lo rechaza: el monto total debe ser mayor que cero al emitir.
- ¿Qué pasa si las facturas de venta Emitidas de un cliente superan su límite de crédito? El sistema avisa y exige una confirmación explícita, pero no bloquea la emisión.
- ¿Qué pasa si se intenta emitir una factura de compra sin centro de costo? El sistema lo rechaza y exige elegir Activo o Consumible.
- ¿Qué pasa si se intenta asignar centro de costo a una factura de venta? El centro de costo es propio de las compras; el sistema no lo ofrece ni lo almacena en las ventas.
- ¿Qué pasa si se intenta editar o eliminar un movimiento financiero? El sistema lo impide: los movimientos se generan automáticamente por las emisiones y los pagos, y son de solo lectura.
- ¿Qué pasa si se elimina una factura que tiene movimientos financieros? Se eliminan también sus movimientos asociados, manteniendo la consistencia de la tabla.
- ¿Qué pasa si se ingresa un `sales_order_id` que no sigue la referencia del módulo de Ventas? El MVP valida solo que no esté vacío cuando se ingresa; la validación contra la entidad de Ventas llega cuando ese módulo defina su identificador compartido.
- ¿Qué pasa si se intenta registrar una factura de venta para un proveedor, o una de compra para un cliente? El sistema lo rechaza: el tipo de documento define qué tipos de tercero puede usar.
- ¿Qué pasa si se requiere liquidar el sueldo de un trabajador? Se registra una factura de compra dirigida a ese tercero de tipo personal, que actúa como instrumento o comprobante de la liquidación, con su período obligatorio en formato `YYYY-MM`; los cálculos de haberes y descuentos legales quedan fuera del MVP.
- ¿Qué pasa si se ingresa un período de liquidación con formato incorrecto o posterior a la fecha de emisión? El sistema lo rechaza: el período debe ser un mes válido (`YYYY-MM`) igual o anterior a la fecha de emisión.
- ¿Qué pasa si el monto total es cero? Se admite solo en Borrador, como valor no negativo que no representa una deuda activa; al emitir, el sistema exige un monto mayor que cero.
- ¿Qué pasa si el cliente se elimina antes de emitir la factura de venta? La factura no puede registrarse, porque debe asociarse a un tercero existente.
- ¿Qué pasa si la fecha de vencimiento es igual a la de emisión? Se acepta, porque la regla exige que sea igual o posterior.
- ¿Qué pasa al eliminar un tercero con facturas pendientes de pago? Se eliminan también sus facturas, por lo que el sistema debería pedir confirmación antes.
- ¿Qué pasa si el usuario borra los datos del navegador? Se pierden todos los registros, porque se guardan en `localStorage`.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Terceros**

- **FR-001**: El sistema DEBE permitir registrar, editar y eliminar terceros, con nombre, código, RUT y tipo (cliente, proveedor o personal).
- **FR-002**: El sistema DEBE rechazar un tercero sin nombre o sin código.
- **FR-003**: El sistema DEBE permitir indicar un límite de crédito opcional, que no puede ser negativo, solo en terceros de tipo cliente.
- **FR-004**: El sistema DEBE permitir buscar terceros, filtrando también por tipo.
- **FR-005**: Al eliminar un tercero, el sistema DEBE eliminar también sus facturas (y los movimientos financieros asociados a ellas), pidiendo confirmación antes.

**Facturas de venta**

- **FR-006**: El sistema DEBE manejar la factura de venta y la factura de compra como documentos separados, cada uno con su listado y sus reglas propias.
- **FR-007**: Una factura de venta solo puede asociarse a un tercero de tipo cliente.
- **FR-008**: Cada factura de venta DEBE tener folio (entero positivo), serie opcional, moneda (única en el MVP: CLP), fecha de emisión, fecha de vencimiento (igual o posterior a la de emisión), monto total y campo `sales_order_id` opcional para trazabilidad hacia el módulo de Ventas. El monto total puede ser cero en Borrador; para emitir DEBE ser mayor que cero.
- **FR-009**: El `sales_order_id` es texto libre no vacío cuando se ingresa; toda factura de venta que lo lleve DEBE poder rastrear esa referencia desde el documento y desde sus movimientos financieros.
- **FR-010**: El sistema DEBE rechazar una factura de venta cuyo descuento sea mayor que su subtotal.
- **FR-011**: Toda factura nueva DEBE iniciar en estado Borrador. El sistema DEBE permitir solo las transiciones Borrador → Emitida → Pagada. No se puede retroceder y Pagada es el estado final. Estas transiciones aplican a ambos tipos de documento.

**Facturas de compra**

- **FR-012**: Una factura de compra solo puede asociarse a un tercero de tipo proveedor o personal.
- **FR-013**: Cada factura de compra DEBE tener folio, serie opcional, moneda (CLP), fecha de emisión, fecha de vencimiento y monto total, con las mismas reglas de montos y fechas que la venta.
- **FR-014**: La factura de compra DEBE tener un centro de costo con valores Activo o Consumible, obligatorio al emitir (se puede dejar indefinido solo en Borrador). El centro de costo es solo un atributo de la factura y de sus movimientos, disponible para filtros y reportes futuros: el total por pagar es único y NO se desglosa por centro de costo en los KPIs ni en el seguimiento.
- **FR-015**: La factura de compra dirigida a un tercero de tipo personal DEBE servir como instrumento o comprobante de la liquidación de sueldo, con un período obligatorio en formato `YYYY-MM` (validado y no posterior a la fecha de emisión); en facturas de compra dirigidas a proveedores el período no aplica. El sistema NO calcula haberes ni descuentos legales.

**Pagos**

- **FR-016**: El sistema DEBE permitir registrar el monto pagado y la fecha de pago de una factura Emitida (de venta o de compra), y marcarla como Pagada solo si el monto pagado es igual al monto total (que, al estar Emitida, es mayor que cero).

**Movimientos financieros**

- **FR-017**: El sistema DEBE mantener una tabla de movimientos financieros, generada automáticamente y de solo lectura, con granularidad de **un movimiento por evento**: cada emisión de factura de venta crea un movimiento de cargo, cada emisión de compra un movimiento de abono, y cada pago un movimiento de contrapartida correspondiente. NO se generan movimientos por líneas de detalle ni movimientos acumulativos por factura.
- **FR-018**: Cada movimiento DEBE registrar al menos: fecha, tipo de documento, referencia al documento, tercero, monto, centro de costo (compras), `sales_order_id` (ventas, si se ingresó) y la factura que lo originó.
- **FR-019**: El sistema DEBE mostrar un listado de movimientos financieros y NO DEBE permitir editarlos ni eliminarlos de forma manual.

**UI y navegación**

- **FR-020**: El sistema DEBE tener un marco general de UI (layout) con un menú de navegación desacoplado del contenido de los módulos, que no cambie según la vista activa. El "desacoplado" significa que el menú es un componente constante e independiente del contenido: sus vistas son fijas del módulo (home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento). Un upgrade a menú configurable por módulo queda fuera del MVP.
- **FR-021**: El sistema DEBE tener un home con KPIs (total por cobrar, total por pagar, facturas vencidas) y accesos directos a crear tercero, crear factura de venta, crear factura de compra y abrir el seguimiento. Los KPIs se calculan sobre las facturas (ver FR-023), no sobre la tabla de movimientos.
- **FR-022**: El menú DEBE permitir navegar entre home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento, reemplazando el contenido central sin recargar la página completa.

**Seguimiento**

- **FR-023**: El sistema DEBE mostrar el total por cobrar de cada cliente y el total por pagar a cada proveedor, contando solo las facturas Emitidas. La fuente de cálculo de estos totales y de los KPIs del home son las facturas; la tabla de movimientos financieros es un registro trazable, no el libro de cálculo.
- **FR-024**: El sistema DEBE identificar como vencidas las facturas Emitidas cuya fecha de vencimiento es estrictamente anterior al día actual (una factura que vence hoy no está vencida).
- **FR-025**: El sistema NO DEBE contar las facturas Pagadas como deuda ni como vencidas.

**Datos**

- **FR-026**: El sistema DEBE conservar los datos al recargar la página y ofrecer una carga de datos de demostración.
- **FR-027**: El sistema DEBE permitir registrar en terceros y facturas una referencia a otros módulos del ERP (mientras CRM, Ventas y Compras no definan un identificador compartido, la referencia es un campo de texto libre obligatorio solo cuando se ingresa; nada obligatorio por defecto). El `sales_order_id` sigue esta misma regla.
- **FR-028**: El sistema DEBE validar el RUT: debe cumplir el formato chileno (partes numéricas + dígito verificador, posible K) con dígito verificador correcto según módulo 11. No se exige unicidad del RUT entre terceros.
- **FR-029**: Al emitir una factura de venta que supera el límite de crédito del cliente, el sistema DEBE avisar y exigir una confirmación explícita antes de emitir; no bloquea la emisión.
- **FR-030**: El sistema DEBE evitar duplicados: el código de tercero ya es único en el módulo base, y la combinación (tipo de documento, serie, folio) DEBE ser única dentro de su tipo.

### Entidades Clave

- **Tercero**: cliente, proveedor o personal. Tiene nombre, código, RUT, tipo y, si es cliente, límite de crédito. Un tercero tiene cero o muchas facturas.
- **Factura de venta**: documento separado de cuentas por cobrar. Tiene serie, folio, fecha de emisión, fecha de vencimiento, montos, moneda, estado, monto pagado, fecha de pago y `sales_order_id` opcional. Pertenece a un solo tercero de tipo cliente.
- **Factura de compra**: documento separado de cuentas por pagar. Tiene serie, folio, fecha de emisión, fecha de vencimiento, montos, moneda, estado, monto pagado, fecha de pago, centro de costo (Activo/Consumible, solo atributo de reporte) y, si el tercero es de tipo personal, un período obligatorio de liquidación en formato `YYYY-MM`. Pertenece a un solo tercero de tipo proveedor o personal. Ambos tipos de factura comparten el ciclo Borrador → Emitida → Pagada.
- **Movimiento financiero**: registro de solo lectura, generado automáticamente por emisiones y pagos. Tiene fecha, tipo (cargo/abono/pago), referencia al documento y al tercero, monto, centro de costo o `sales_order_id` según corresponda. Pertenece a una sola factura.
- **Vistas del marco de UI**: home (KPIs y accesos directos), terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento, todas viviendo en un layout común con menú desacoplado.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Una persona nueva puede registrar un tercero y emitir su primera factura (de venta o de compra) en menos de 3 minutos, sin ayuda.
- **SC-002**: El 100% de las facturas Pagadas deja de aparecer como deuda en el seguimiento y genera su movimiento financiero de contrapartida.
- **SC-003**: El 100% de los datos inválidos (sin nombre, monto negativo, vencimiento anterior a la emisión, compra sin centro de costo al emitir) se rechaza con un mensaje claro.
- **SC-004**: Los datos siguen disponibles después de recargar la página.
- **SC-005**: Con los datos de demostración, el flujo completo (tercero, factura, emisión, pago, movimiento financiero y seguimiento) se puede mostrar en menos de 5 minutos, navegando desde el home y el menú.
- **SC-006**: El 100% de las emisiones y pagos registrados tiene su movimiento financiero correspondiente, conciliado en monto.

## Supuestos

- El MVP es solo frontend: los datos se guardan en el navegador, hay un solo usuario por navegador y no hay inicio de sesión ni perfiles.
- Hay un solo tipo de entidad base (Tercero, con tipo cliente/proveedor/personal) y dos tipos de documento separados: Factura de Venta y Factura de Compra, cada uno con su listado y reglas propias. Decidido 2026-11-05: la separación formal de documentos reemplaza el debate "documento único con tipo" (el ayudante lo había recomendado).
- Las facturas de compra llevan centro de costo con valores Activos/Consumible, obligatorio al emitir y usado solo como atributo de reporte (sin desglose en KPIs). Decidido 2026-11-05 y reafirmado en el clarify del mismo día.
- La trazabilidad de las facturas de venta hacia Ventas se implementa con el campo `sales_order_id` (texto libre no vacío cuando se ingresa, consistente con FR-027). Decidido 2026-11-05.
- La tabla de movimientos financieros es de solo lectura, se genera automáticamente por emisiones y pagos con granularidad de un movimiento por evento, y es un registro trazable: los KPIs del home y el seguimiento se calculan sobre las facturas, no sobre la tabla. Decidido 2026-11-05 (clarify).
- La factura de compra dirigida al personal es el instrumento/comprobante de la liquidación de sueldo, con un período obligatorio en formato `YYYY-MM` (no posterior a la fecha de emisión); el cálculo de haberes, AFP, salud e imponibilidad queda fuera del MVP. Decidido 2026-11-05 y precisado en el clarify del mismo día.
- La arquitectura de UI (marco general, home con KPIs y accesos directos, menú desacoplado) es transversal al módulo y se especifica como HU7. El menú desacoplado es un componente estático con vistas fijas del módulo; un menú configurable por módulo queda fuera del MVP. Decidido 2026-11-05 y precisado en el clarify del mismo día.
- Una factura Emitida se considera vencida cuando su fecha de vencimiento es estrictamente anterior al día actual (una factura que vence hoy no está vencida). Decidido 2026-11-05 (clarify).
- Los pagos son campos de la factura. Los pagos parciales quedan fuera del MVP.
- La fecha de inicio y la de fin del template se usan como fecha de emisión y de vencimiento. *(Por confirmar.)*
- El MVP usa una sola moneda (CLP), y el monto total debe ser mayor que cero al emitir una factura (cero se admite solo en Borrador). Decidido 2026-11-03 (Q1).
- La interfaz está en español.
- No se usan datos reales, porque el almacenamiento del navegador no es seguro.
- La integración con otros módulos es solo por referencias, sin conexión en vivo. Se acordó usar una referencia de texto libre hasta que CRM, Ventas y Compras definan un identificador compartido.
- El RUT se valida con formato chileno y dígito verificador módulo 11 (decidido 2026-11-03, Q2). No se exige unicidad del RUT.
- El límite de crédito genera un aviso con confirmación explícita al emitir, sin bloqueo (decidido 2026-11-03, Q3).
- La unicidad de factura se define por (tipo de documento, serie, folio), dentro de cada tipo.
- Quedan fuera del MVP: pagos como registro propio, plan de cuentas y asientos, activos fijos, presupuestos, conciliación bancaria y cálculo de remuneraciones (haberes y descuentos legales).
