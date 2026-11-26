# Feature Specification: Pestañas de liquidación de sueldo y permisos por rol

**Feature Branch**: `main` (sin rama; trabajo local en `main`)

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Nueva funcionalidad: permisos por rol y creación de liquidaciones de sueldo. Contexto: existe 002-payroll-access-control con tres roles (administrador, finanzas, trabajador), una vista única 'Liquidaciones de sueldo' (payroll-admin) con lista y edición, y facturas de venta y compra separadas. Esta funcionalidad modifica 002; debe registrar qué partes de 002 quedan superseded, sin reescribir 002 completo. Requisitos: (1) Rol administrador: su acceso a datos de negocio queda LIMITADO exclusivamente a las liquidaciones de sueldo (pestañas de creación y de listado). Pierde acceso a entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento y búsqueda. Conserva el control de accesos y los avisos al desarrollador. El Panel queda solo con las dos pestañas de liquidaciones. (2) Nueva pestaña 'Crear liquidación de sueldo' (solo administrador): usa un formulario propio de liquidación con RUT, nombre completo, período (AAAA-MM), sueldo base, bonos, descuentos, fecha de emisión, fecha de vencimiento, serie y folio; el total se calcula como sueldo base + bonos − descuentos y no se escribe a mano. Al guardar, si el RUT es nuevo, se crea automáticamente un tercero de tipo personal y un acceso con rol 'trabajador' cuya contraseña inicial son los primeros 4 dígitos del RUT; si el RUT ya existe, se reutiliza el tercero y el acceso existentes. El trabajador resultante queda sujeto a las mismas restricciones del rol trabajador ya establecidas. (3) La pestaña existente 'Liquidaciones de sueldo' pasa a listado con cuadro de búsqueda por RUT que filtra el listado en vivo mientras se escribe, y acción de seleccionar y editar cualquier liquidación (solo administrador). (4) Rol finanzas: puede crear y ver facturas de venta y de compra; en la pestaña de liquidaciones solo ve el listado en modo lectura, con búsqueda y filtrado por RUT, sin poder editar ni crear liquidaciones. (5) Rol trabajador: sin cambios en sus restricciones. (6) Actualizar las historias de usuario y los requisitos para que queden coherentes con estos permisos. (7) Mantener todo lo demás sin cambios: no reescribir archivos completos, solo modificar lo estrictamente necesario."

## Clarifications

### Session 2026-11-23

- Q: ¿Conserva el administrador el control de accesos y los avisos al desarrollador? → A: Conserva el **control de accesos**, pero **NO** los avisos al desarrollador.
- Q: ¿Qué módulos conserva el rol finanzas? → A: Conserva **entidades, movimientos, flujo de caja, seguimiento y búsqueda**, además de crear y ver facturas y ver las liquidaciones en solo lectura con búsqueda por RUT.
- Q: ¿Qué ocurre si el RUT ingresado en el formulario de creación ya existe? → A: **Solo se actualiza (o registra) la liquidación de sueldo**; no se genera ninguna entidad duplicada.
- Q: ¿Qué ve el administrador en su navegación? → A: **Solo** las opciones de **crear liquidación de sueldo** y **gestionar liquidaciones de sueldo**.

### Session 2026-11-24

- Q: ¿Puede el rol `finanzas` editar o eliminar facturas de compra vinculadas a una liquidación? → A: **No, desde ninguna vista.** Si el `documentId` de la factura aparece en `erp.payrollSettlements`, la factura es de solo lectura para `finanzas`, se muestra un aviso claro y no se pueden cambiar montos ni otros campos.
- Q: ¿Qué operación de escritura se permite a `finanzas` sobre una liquidación `Emitida`? → A: **Solo registrar el pago**: la liquidación pasa a `Pagada`, con monto pagado igual al total y fecha de pago; no se modifica el total ni otros campos, y la factura vinculada sigue sin edición manual (su estado y datos de pago se actualizan según la Session 2026-11-26). Quien fija el sueldo sigue siendo `administrador`; quien paga es `finanzas`.
- Q: ¿Qué ocurre antes de guardar una liquidación con un RUT nuevo? → A: El sistema **pide confirmación**, indicando que se creará el trabajador y su acceso con contraseña inicial igual a los primeros 4 dígitos del RUT; si se cancela, no se crea ningún registro.

### Session 2026-11-25

- Q: ¿Qué campos muestra el formulario de «Crear liquidación de sueldo» y cómo se obtiene el total? → A: Muestra solo RUT, nombre completo, período `AAAA-MM`, sueldo base, bonos, descuentos, fecha de emisión, fecha de vencimiento, serie y folio. El total se calcula como `sueldo base + bonos − descuentos` y no se escribe a mano. No muestra Cantidad, Impuesto, Moneda ni Condiciones de pago.
- Q: ¿Qué identificadores usan los campos del formulario de creación de liquidación? → A: Usan ids propios con el prefijo `payroll-create-field-` y no repiten ningún id de la página, en particular los `invoice-purchase-field-*` del formulario de facturas de compra.
- Q: ¿Qué muestra el listado de la vista «Crear liquidación de sueldo» cuando no hay registros? → A: Muestra solo liquidaciones y, si no hay ninguna, el mensaje exacto «No hay liquidaciones registradas»; no muestra «No hay facturas de compra registradas».
- Q: ¿Se mantiene el alta automática del trabajador al crear una liquidación? → A: Sí. Se mantiene la confirmación previa y la creación automática del tercero personal y del acceso `trabajador` con contraseña inicial igual a los primeros 4 dígitos del RUT, sin cambios en el modelo de datos ni en las claves `erp.*`.

### Session 2026-11-26

- Q: ¿Qué campos del formulario «Crear liquidación de sueldo» deben ser obligatorios para permitir guardar? → A: Son obligatorios RUT, nombre completo, período, sueldo base, fecha de emisión, fecha de vencimiento y folio. Bonos y descuentos vacíos valen 0; serie es opcional; si el período llega vacío se deriva de la fecha de emisión.
- Q: Al registrar el pago de una liquidación `Emitida`, ¿qué debe cambiar en la factura de compra vinculada? → A: La liquidación pasa a `Pagada` con `fechaPago`; la factura vinculada pasa a `Pagada` con `montoPagado` igual al total y la misma `fechaPago`. No cambian montos, desglose, RUT ni período.
- Q: ¿Qué mensaje exacto debe mostrarse cuando un rol intenta abrir una vista que no le corresponde y se le redirige? → A: Se usa el texto actual de `src/app.js`: «No tienes acceso a esta vista; se muestra tu vista permitida.», mostrado en `#route-message` (`role="status"`).
- Q: ¿Qué formato y reglas de validación deben tener las fechas de emisión y vencimiento del formulario de creación? → A: Formato `AAAA-MM-DD`; ambas obligatorias; una fecha inválida o un vencimiento anterior a la emisión bloquea el guardado.

## User Scenarios & Testing *(mandatory)*

<!-- Los roles y permisos se validan como recorridos independientes. Cada historia
     puede desarrollarse, probarse y demostrarse por separado. -->

### User Story 1 - Crear una liquidación de sueldo con formulario propio y alta automática de trabajador (Priority: P1)

Como administrador, quiero una pestaña aparte «Crear liquidación de sueldo» con un formulario propio —RUT, nombre completo, período (AAAA-MM), sueldo base, bonos, descuentos, fecha de emisión, fecha de vencimiento, serie y folio; con el total calculado como sueldo base + bonos − descuentos y nunca escrito a mano— para que, antes de guardar un RUT nuevo, el sistema me confirme que creará el tercero personal y su acceso con rol «trabajador» (contraseña inicial: primeros 4 dígitos del RUT), quedando el trabajador sujeto a sus mismas restricciones.

**Why this priority**: es el valor central del pedido: sin esta pestaña el administrador no puede crear liquidaciones ni dar de alta trabajadores desde el flujo de nómina; además desbloquea las demás historias porque genera los datos que ellas consumen.

**Independent Test**: desde una sesión de administrador se abre la pestaña, se completa el formulario propio de liquidación con un RUT nuevo y nombre completo y se verifica que el total se deriva del desglose, se acepta la confirmación de alta y se comprueba que existen la liquidación, el tercero personal, el acceso `trabajador` activo con contraseña igual a los primeros 4 dígitos del RUT, y que ese trabajador entra y ve únicamente su liquidación.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** abre la pestaña «Crear liquidación de sueldo», **entonces** ve un formulario propio con los campos «RUT», «Nombre completo», «Período (AAAA-MM)», «Sueldo base», «Bonos», «Descuentos», «Fecha de emisión», «Fecha de vencimiento», «Serie» y «Folio»; no ve «Cantidad», «Impuesto», «Moneda» ni «Condiciones de pago»; los ids de sus campos usan el prefijo `payroll-create-field-` sin repetir ningún id de la página; y no ve ningún otro módulo de negocio en su navegación.
2. **Dado** el formulario completo con un RUT nuevo, **cuando** acepto la confirmación previa que indica que se creará el trabajador y su acceso con contraseña inicial de 4 dígitos, **entonces** se guarda la liquidación, se crea el tercero de tipo personal, se crea un acceso activo con rol `trabajador` y contraseña igual a los primeros 4 dígitos del cuerpo del RUT.
3. **Dado** un RUT ya registrado como tercero personal con acceso, **cuando** guardo con ese mismo RUT, **entonces** solo se crea o actualiza la liquidación de sueldo asociada a ese tercero, sin generar ninguna entidad, tercero ni acceso duplicado.
4. **Dado** un RUT con puntos, guion, mayúsculas o espacios exteriores, **cuando** guardo, **entonces** se normaliza según la regla ya establecida y se compara en forma canónica.
5. **Dado** un RUT con dígito verificador inválido, campos obligatorios vacíos o fechas inválidas (formato incorrecto o vencimiento anterior a la emisión), **cuando** intento guardar, **entonces** el sistema rechaza el guardado con un mensaje claro y no crea ni liquidación, ni tercero, ni acceso.
6. **Dado** el alta exitosa, **cuando** ingreso con el RUT y la contraseña inicial del nuevo trabajador, **entonces** el sistema reconoce el rol `trabajador` y el usuario queda sujeto a las mismas restricciones existentes del rol (solo su última liquidación y su historial, sin edición).
7. **Dado** una sesión de finanzas o de trabajador, **cuando** intenta abrir la pestaña de creación, **entonces** el sistema se lo impide y redirige a su vista permitida.
8. **Dado** el formulario completo con un RUT nuevo, **cuando** aparece la confirmación previa, **entonces** el mensaje indica explícitamente que se creará el trabajador y su acceso con contraseña inicial igual a los primeros 4 dígitos del RUT; si cancelo, no se crea liquidación, tercero ni acceso.
9. **Dado** valores de sueldo base, bonos y descuentos en el formulario, **cuando** se completa el alta, **entonces** el total mostrado y guardado es `sueldo base + bonos − descuentos`, sin campo editable para escribirlo manualmente y sin campos de factura de compra no aplicables.
10. **Dado** el listado de respaldo de la pestaña de creación, **cuando** abre la pestaña, **entonces** ve solo liquidaciones; si no hay ninguna, ve el mensaje exacto «No hay liquidaciones registradas» y nunca «No hay facturas de compra registradas».

---

### User Story 2 - Gestionar las liquidaciones desde su pestaña de listado con búsqueda por RUT (Priority: P1)

Como administrador, quiero una pestaña aparte «Gestionar liquidaciones de sueldo» con el listado de todas las liquidaciones, un cuadro de búsqueda por RUT que filtra el listado a medida que escribo, y la acción de seleccionar y editar cualquier liquidación, para mantener al día los períodos y montos sin recorrer todo el listado.

**Why this priority**: completa la operación de nómina junto con la US1 y es el segundo entregable central del pedido; es independiente porque puede probarse con liquidaciones ya existentes.

**Independent Test**: con liquidaciones de al menos dos trabajadores, se entra como administrador, se escribe un RUT parcial en el cuadro de búsqueda y el listado se reduce en vivo a ese trabajador; se selecciona una liquidación, se edita, se guarda y el cambio queda reflejado en la vista del trabajador correspondiente.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** abre la pestaña «Gestionar liquidaciones de sueldo», **entonces** ve el listado exclusivo de liquidaciones con trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada y acción «Editar».
2. **Dado** el listado completo, **cuando** escribo un RUT (total o parcial) en el cuadro de búsqueda, **entonces** el listado se filtra en vivo mientras escribo, sin necesidad de botón, mostrando solo las liquidaciones cuyo RUT coincida.
3. **Dado** un RUT que no coincide con ninguna liquidación, **cuando** lo escribo, **entonces** veo un estado vacío claro de «sin resultados».
4. **Dado** una liquidación seleccionada, **cuando** la edito con valores válidos y guardo, **entonces** los cambios se persisten, se respetan las validaciones y el ciclo de vida existentes, y la vista del trabajador refleja el cambio en el siguiente refresco.
5. **Dado** una edición que incumple las reglas del módulo, **cuando** intento guardar, **entonces** el sistema la rechaza con un mensaje claro y no guarda el cambio.
6. **Dado** una sesión de finanzas, **cuando** abre la misma pestaña, **entonces** ve el listado y puede buscar y filtrar por RUT, pero no existe la acción «Editar» ni ninguna forma de crear o editar liquidaciones; la única escritura permitida es «Registrar pago» sobre liquidaciones `Emitidas`, sin cambiar el total ni otros campos.
7. **Dado** una liquidación `Emitida` y una sesión de finanzas, **cuando** registra el pago con monto pagado igual al total y fecha de pago válida, **entonces** se actualizan el estado a `Pagada`, el monto pagado y la fecha de pago; el total y los demás campos no cambian, y la factura de compra vinculada permanece de solo lectura.
8. **Dado** el listado sin liquidaciones guardadas, **cuando** abre la pestaña, **entonces** ve el mensaje exacto «No hay liquidaciones registradas» y no ve «No hay facturas de compra registradas» ni ningún registro de facturas de compra.

---

### User Story 3 - Aplicar la matriz de permisos por rol actualizada (Priority: P2)

Como usuario del módulo, quiero que cada rol vea exactamente los módulos que le corresponden —administrador: solo las dos pestañas de liquidaciones más control de accesos; finanzas: entidades, facturas de venta y compra —con las facturas vinculadas a liquidaciones en solo lectura—, movimientos, flujo de caja, seguimiento, búsqueda y liquidaciones en solo lectura salvo el registro de pago de `Emitidas`; trabajador: sin cambios— para que la información de nómina y de facturación quede separada según el rol.

**Why this priority**: es el candado que hace coherentes las historias anteriores; depende de que existan las dos pestañas (US1 y US2) para poder verificar la matriz completa.

**Independent Test**: con una sesión por cada rol se recorre la navegación y se comprueba que cada rol solo ve y puede abrir sus módulos permitidos, y que los intentos de acceso directo a una vista no permitida se redirigen con un mensaje claro.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** revisa su navegación y su Panel, **entonces** sus opciones son el Panel (que solo muestra los accesos rápidos a «Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo»), las dos pestañas de liquidaciones y «Control de accesos» como utilidad de sesión, y no ve entidades, facturas, movimientos, flujo de caja, seguimiento, búsqueda ni avisos al desarrollador.
2. **Dado** una sesión de finanzas, **cuando** revisa su navegación, **entonces** ve entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento, búsqueda y liquidaciones en solo lectura —excepto la acción separada de registrar pago de liquidaciones `Emitidas`—, sin control de accesos ni avisos al desarrollador, y sin capacidad de edición en liquidaciones ni en facturas de compra vinculadas por `documentId` en `erp.payrollSettlements`.
3. **Dado** una sesión de trabajador, **cuando** ingresa, **entonces** su experiencia no cambia: sigue viendo solo su última liquidación y su historial de pagos, en modo solo lectura.
4. **Dado** cualquier rol, **cuando** intenta abrir por navegación directa una vista que no le corresponde, **entonces** el sistema redirige a su vista permitida y muestra el mensaje exacto «No tienes acceso a esta vista; se muestra tu vista permitida.» en `#route-message` (`role="status"`), sin exponer datos.
5. **Dado** el módulo actualizado, **cuando** se comparan sus requisitos con los de `002-payroll-access-control`, **entonces** las partes contradictorias quedan marcadas como superseded en 002 sin reescribir ese documento completo.
6. **Dado** un intento de finanzas de editar o eliminar desde cualquier vista una factura de compra cuyo `documentId` está en `erp.payrollSettlements`, **cuando** abre esa factura, **entonces** la ve en modo solo lectura con un aviso claro, la acción se bloquea y la liquidación vinculada no cambia.
7. **Dado** una liquidación `Emitida`, **cuando** finanzas registra su pago, **entonces** el cambio se limita a estado `Pagada`, monto pagado igual al total y fecha de pago en la liquidación; la factura vinculada pasa a `Pagada` con `montoPagado` igual al total y la misma fecha de pago, mientras el desglose, el RUT y los montos de ambos registros permanecen iguales, de modo que quien fija el sueldo no es quien lo paga.

---

### Edge Cases

- ¿Qué pasa si el RUT ingresado en el formulario de creación ya existe como tercero personal? Solo se crea o actualiza la liquidación de sueldo de ese tercero; no se genera ninguna entidad, tercero ni acceso duplicado.
- ¿Qué pasa si el RUT ya existe pero no es de tipo personal o su acceso está inactivo? Se rechaza el guardado con un mensaje claro y se registra la incidencia según las reglas ya establecidas.
- ¿Qué pasa si el RUT tiene dígito verificador inválido? Se rechaza con mensaje claro, sin crear liquidación, tercero ni acceso.
- ¿Qué pasa si el RUT se ingresa con puntos, guion, mayúsculas o espacios exteriores? Se normaliza y se compara en forma canónica.
- ¿Qué pasa si dos personas ingresan el mismo RUT normalizado en momentos distintos? Solo existe un tercero y un acceso; el segundo guardado únicamente crea o actualiza la liquidación de sueldo, sin duplicar entidades.
- ¿Qué pasa si falta un campo obligatorio del formulario de creación (RUT, nombre completo, período, sueldo base, fecha de emisión, fecha de vencimiento o folio)? Se bloquea el guardado con mensajes junto a cada campo. Bonos y descuentos vacíos se interpretan como 0, la serie es opcional y, si el período llega vacío, se deriva de la fecha de emisión; el total no se valida como entrada porque se calcula automáticamente.
- ¿Qué pasa si la fecha de emisión o la de vencimiento tiene un formato inválido o el vencimiento es anterior a la emisión? Se bloquea el guardado con un mensaje junto al campo correspondiente, sin crear liquidación, tercero ni acceso.
- ¿Qué pasa si la búsqueda por RUT está vacía? Se muestra el listado completo.
- ¿Qué pasa si la búsqueda por RUT no coincide con ningún registro? Se muestra un estado vacío de «sin resultados», sin perder el texto escrito.
- ¿Qué pasa si finanzas manipula la navegación para llegar a la edición de liquidaciones? La acción se bloquea y no se muestra el formulario de edición.
- ¿Qué pasa si finanzas intenta editar o eliminar una factura de compra vinculada por `documentId` en `erp.payrollSettlements` desde Facturas de compra o cualquier otra vista? La acción se bloquea, la factura se muestra de solo lectura con un aviso claro y la liquidación vinculada conserva su monto.
- ¿Qué pasa si finanzas intenta registrar el pago de una liquidación que no está `Emitida`? La acción se bloquea con un mensaje claro; solo las liquidaciones `Emitidas` admiten este registro.
- ¿Qué pasa si finanzas intenta registrar un pago con monto distinto al total, fecha ausente o inválida? Se rechaza sin cambios; el monto pagado debe ser igual al total y la fecha de pago debe ser válida.
- ¿Qué pasa si se cancela la confirmación de creación por RUT nuevo? No se persiste ninguna liquidación, tercero ni acceso.
- ¿Qué pasa si el administrador intenta abrir facturas, entidades u otros módulos ya no asignados? Se redirige a una vista permitida mostrando «No tienes acceso a esta vista; se muestra tu vista permitida.» en `#route-message` (`role="status"`).
- ¿Qué pasa si no hay liquidaciones registradas? Se muestra exactamente «No hay liquidaciones registradas» en la pestaña de listado, nunca «No hay facturas de compra registradas».
- ¿Qué pasa si el formulario tiene cambios sin guardar y el usuario cambia de pestaña o cierra sesión? Se aplica la confirmación de «cambios sin guardar» ya existente.
- ¿Qué pasa si el acceso creado queda con contraseña inicial y la persona conoce el RUT de un compañero? Es el riesgo conocido ya documentado del MVP; no cambia con esta funcionalidad.

## Requirements *(mandatory)*

### Functional Requirements

**Pestaña de creación (administrador)**

- **FR-001**: El sistema DEBE ofrecer una pestaña «Crear liquidación de sueldo» visible únicamente para el rol `administrador`, con un formulario propio de liquidación que NO reutiliza el formulario de factura de compra. El listado de esa pestaña DEBE mostrar solo liquidaciones y, sin registros, el mensaje exacto «No hay liquidaciones registradas», nunca «No hay facturas de compra registradas».
- **FR-002**: El formulario de creación DEBE mostrar únicamente RUT, nombre completo, período en formato `AAAA-MM`, sueldo base, bonos, descuentos, fecha de emisión, fecha de vencimiento, serie y folio. DEBEN ser obligatorios RUT, nombre completo, período, sueldo base, fecha de emisión, fecha de vencimiento y folio; bonos y descuentos vacíos DEBEN interpretarse como 0 y la serie es opcional. Si el usuario no informa el período, el sistema DEBE derivarlo de la fecha de emisión (el período guardado es obligatorio). Las fechas de emisión y vencimiento DEBEN usar el formato `AAAA-MM-DD`, ser obligatorias y cumplir que el vencimiento sea igual o posterior a la emisión. NO DEBE mostrar Cantidad, Impuesto, Moneda ni Condiciones de pago, ni el selector de tercero existente: el trabajador se define solo mediante RUT y nombre completo. El total DEBE calcularse automáticamente como sueldo base + bonos − descuentos y NO DEBE escribirse a mano. Todos los campos DEBEN usar ids únicos con el prefijo `payroll-create-field-` y NO DEBE repetirse ningún id ya presente en la página, en particular los del formulario de facturas de compra (`invoice-purchase-field-*`).
- **FR-003**: Al guardar con un RUT nuevo, el sistema DEBE pedir confirmación previa indicando que se creará el trabajador y su acceso con rol `trabajador` y contraseña inicial igual a los primeros 4 dígitos del cuerpo del RUT; solo al aceptarla DEBE crear automáticamente el tercero de tipo personal y el acceso activo, según la regla ya existente. Si se cancela la confirmación, NO DEBE persistir ningún registro.
- **FR-004**: Al guardar con un RUT ya registrado, el sistema DEBE crear o actualizar únicamente la liquidación de sueldo asociada a ese tercero, sin generar ninguna entidad, tercero ni acceso duplicado.
- **FR-005**: El RUT DEBE validarse y normalizarse con las reglas ya establecidas; un RUT inválido, campos obligatorios vacíos, una fecha con formato inválido, un vencimiento anterior a la emisión o vínculos incompatibles DEBEN bloquear el guardado con un mensaje claro y sin crear registros parciales.
- **FR-006**: El trabajador dado de alta desde esta pestaña DEBE quedar sujeto a todas las restricciones ya existentes del rol `trabajador`.

**Pestaña de listado (administrador y finanzas)**

- **FR-007**: El sistema DEBE ofrecer una pestaña «Gestionar liquidaciones de sueldo» con el listado exclusivo de todas las liquidaciones y sus columnas actuales (trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada y acción); cuando no haya liquidaciones, DEBE mostrar el mensaje exacto «No hay liquidaciones registradas» y NO «No hay facturas de compra registradas»; la acción «Asociar acceso» DEBE estar disponible únicamente para el rol `administrador`.
- **FR-008**: La pestaña DEBE incluir un cuadro de búsqueda por RUT que filtre el listado en vivo a medida que se escribe, sin botón de envío.
- **FR-009**: La búsqueda vacía DEBE mostrar el listado completo de liquidaciones; una búsqueda sin coincidencias sobre un listado no vacío DEBE mostrar un estado vacío claro conservando el texto escrito; sin liquidaciones registradas DEBE aplicarse el mensaje exacto de FR-007, no el correspondiente a facturas de compra.
- **FR-010**: Solo el rol `administrador` DEBE poder seleccionar y editar cualquier liquidación desde esta pestaña, con las validaciones y el ciclo de vida ya existentes.
- **FR-011**: El rol `finanzas` DEBE ver el listado en modo solo lectura y DEBE poder buscar y filtrar por RUT, sin acción de edición, de creación de liquidaciones ni de «Asociar acceso» (esta última es exclusiva del rol `administrador`). Toda factura de compra cuyo `documentId` figure en `erp.payrollSettlements` DEBE ser de solo lectura para `finanzas` desde cualquier vista: NO DEBE poder editarse ni eliminarse y DEBE mostrarse un aviso claro. Como única excepción de escritura sobre liquidaciones y facturas vinculadas, `finanzas` DEBE poder registrar el pago de una liquidación `Emitida`: el sistema DEBE cambiar el estado de la liquidación a `Pagada`, fijar el monto pagado igual al total y guardar la fecha de pago; la factura de compra vinculada DEBE pasar a `Pagada` con `montoPagado` igual al total y la misma `fechaPago`, sin modificar el total, el desglose, el RUT, el período ni los montos de ninguno de los dos registros.

**Matriz de permisos por rol**

- **FR-012**: El rol `administrador` DEBE tener acceso, como únicos módulos de negocio, a las dos pestañas de liquidaciones; DEBE perder el acceso a entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento y búsqueda; DEBE conservar el control de accesos; y DEBE perder el acceso a los avisos al desarrollador.
- **FR-013**: El menú del rol `administrador` DEBE mostrar el Panel, las dos pestañas de liquidaciones («Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo») y «Control de accesos» como utilidad de sesión, y ningún otro módulo de negocio; el Panel DEBE mostrar únicamente los accesos rápidos a las dos pestañas de liquidaciones; NO DEBE mostrar avisos al desarrollador.
- **FR-014**: El rol `finanzas` DEBE conservar entidades, movimientos, flujo de caja, seguimiento y búsqueda, además de la creación y consulta de facturas de venta y de compra —excepto las facturas de compra vinculadas por `documentId` en `erp.payrollSettlements`, que DEBE ver en solo lectura con aviso claro—; DEBE ver las liquidaciones en solo lectura con búsqueda por RUT, salvo la acción de registrar pago de liquidaciones `Emitidas` descrita en FR-011; y NO DEBE tener control de accesos ni avisos al desarrollador.
- **FR-015**: El rol `trabajador` NO DEBE verse afectado: conserva su vista exclusiva de última liquidación e historial en modo solo lectura.
- **FR-016**: Toda vista DEBE exigir sesión iniciada y toda navegación a una vista no permitida DEBE redirigir a la vista permitida del rol mostrando el mensaje exacto «No tienes acceso a esta vista; se muestra tu vista permitida.» en un elemento `role="status"` visible (`#route-message`), sin exponer datos.

**Coherencia con la especificación existente**

- **FR-017**: Los requisitos e historias de usuario de esta funcionalidad DEBEN quedar redactados de forma coherente con los permisos descritos aquí.
- **FR-018**: Las partes de `specs/002-payroll-access-control/spec.md` y de sus contratos que resulten contradictorias con esta especificación DEBEN quedar marcadas como superseded mediante notas puntuales, sin reescribir esos documentos completos.
- **FR-019**: Todo lo no mencionado en esta especificación DEBE permanecer sin cambios; las modificaciones sobre archivos existentes DEBEN ser quirúrgicas y no reescribir archivos completos. Esta corrección NO DEBE cambiar el modelo de datos ni las claves `erp.*`, NO DEBE afectar la spec `004` ni su identidad visual, y DEBE conservar todas las tareas ya completadas de esta funcionalidad sin renumerarlas ni regenerar esta spec.
- **FR-020**: La vista de avisos al desarrollador NO DEBE ser visible para ningún rol; los avisos seguirán registrándose localmente y en la consola según el comportamiento ya existente, pero sin panel de consulta en la interfaz.

### Key Entities

- **LiquidacionSueldo**: liquidación de sueldo ya existente (período, desglose, monto, estado, fecha de pago, vínculo `documentId` con la factura de compra y `entityId` con el tercero personal). La vista de creación DEBE usar únicamente los campos ya existentes de la liquidación y de su documento vinculado, sin ampliar la estructura ni cambiar las claves `erp.*`; el total se deriva del desglose. Esta funcionalidad no cambia su estructura, solo quién puede crearla y editarla; `finanzas` únicamente puede registrar el pago de liquidaciones `Emitidas` sin alterar otros campos.
- **Tercero personal**: persona física con RUT y nombre completo; creado automáticamente desde la pestaña de creación cuando el RUT es nuevo.
- **Acceso (AccessRecord)**: registro de acceso por RUT con rol y estado; el acceso `trabajador` creado automáticamente tiene como contraseña inicial los primeros 4 dígitos del RUT. Su creación se confirma previamente cuando el RUT es nuevo.
- **Factura de compra**: comprobante de pago con el que se vincula la liquidación; su formulario existente NO es la base del formulario de creación de liquidaciones, que es propio y usa ids `payroll-create-field-*`. Si su `documentId` figura en `erp.payrollSettlements`, es de solo lectura para `finanzas` en cualquier vista y muestra un aviso claro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El administrador crea una liquidación con RUT nuevo en una sola pasada por el formulario propio de liquidación, con el total calculado automáticamente y sin campos de factura de compra no aplicables; al terminar, existen a la vez la liquidación, el tercero personal y el acceso `trabajador` activo; la confirmación previa aparece en el 100 % de los RUT nuevos y describe el trabajador, el acceso y la contraseña inicial de 4 dígitos.
- **SC-002**: La contraseña del acceso recién creado permite ingresar como `trabajador` en el primer intento y muestra únicamente la liquidación de ese trabajador.
- **SC-003**: Escribir un RUT en el cuadro de búsqueda reduce el listado visible mientras se escribe, sin botón adicional, en menos de un segundo con los datos de demostración como volumen de referencia.
- **SC-004**: Ningún rol puede abrir una vista que no le corresponde: el 100 % de los intentos de navegación no permitida termina en la vista permitida del rol mostrando «No tienes acceso a esta vista; se muestra tu vista permitida.».
- **SC-005**: El rol `finanzas` no dispone de ninguna acción de creación o edición de liquidaciones y no puede editar ni eliminar facturas de compra vinculadas por `documentId` en `erp.payrollSettlements` desde ninguna vista (0 acciones de edición o eliminación visibles o invocables); los intentos muestran un aviso claro. Sobre liquidaciones y facturas vinculadas, la única escritura permitida es registrar el pago de liquidaciones `Emitidas`, y en el 100 % de los casos la liquidación y su factura vinculada quedan `Pagada` con monto pagado igual al total y fecha de pago, sin cambiar el total ni los montos o el desglose de ninguno de los dos registros.
- **SC-006**: El 100 % de las pruebas automatizadas existentes sigue en verde después de los cambios (`npm run check` sin fallos), salvo las que esta funcionalidad actualiza de forma explícita.
- **SC-007**: En la vista «Crear liquidación de sueldo», el 100 % de los campos visibles pertenece a la lista acordada, el 100 % de sus ids usa el prefijo `payroll-create-field-` y hay 0 ids repetidos en la página; su listado contiene 0 facturas de compra y, sin registros, muestra exactamente «No hay liquidaciones registradas».

## Assumptions

- El administrador **conserva** el control de accesos, pero **pierde** los avisos al desarrollador; su limitación a liquidaciones aplica a los módulos de negocio (entidades, facturas, movimientos, flujo de caja, seguimiento y búsqueda).
- El rol `finanzas` **conserva** entidades, movimientos, flujo de caja, seguimiento y búsqueda, además de facturas; sus cambios de alcance son el paso a solo lectura en liquidaciones, la lectura sin edición ni eliminación de facturas de compra vinculadas por `documentId` en `erp.payrollSettlements`, y la excepción de registrar el pago de liquidaciones `Emitidas`.
- La vista «Crear liquidación de sueldo» usa un formulario propio con los campos de nómina definidos en Clarificaciones (2026-11-25); no reutiliza el formulario de factura de compra ni muestra sus campos no aplicables. Esta decisión sustituye el supuesto original de reutilización.
- El menú del administrador conserva el Panel, el cual queda limitado a los accesos rápidos de las dos pestañas de liquidaciones, junto con «Control de accesos» como utilidad de sesión y sin avisos al desarrollador.
- Los datos de demostración existentes siguen siendo válidos; no se pide regenerarlos, salvo que las pruebas lo requieran.
- El control de acceso sigue siendo una restricción de interfaz sobre datos del navegador, con la contraseña inicial de los primeros 4 dígitos del RUT documentada como riesgo conocido del MVP, tal como ya está establecido.
- El registro de pago permitido a `finanzas` se presenta como una acción separada de «Editar» en la pestaña de liquidaciones; no habilita la edición de la factura de compra vinculada.
- No se agrega un rol `RRHH`: quien fija el sueldo en esta funcionalidad es el `administrador`; `finanzas` solo registra el pago de la liquidación `Emitida`.
- Esta corrección no cambia el modelo de datos ni las claves `erp.*` y no afecta la spec `004` ni su identidad visual.
- El trabajo se realiza en la rama `main` de forma local, sin crear ramas nuevas y sin realizar push a ningún remoto.
