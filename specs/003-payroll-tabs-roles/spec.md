# Feature Specification: Pestañas de liquidación de sueldo y permisos por rol

**Feature Branch**: `main` (sin rama; trabajo local en `main`)

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Nueva funcionalidad: permisos por rol y creación de liquidaciones de sueldo. Contexto: existe 002-payroll-access-control con tres roles (administrador, finanzas, trabajador), una vista única 'Liquidaciones de sueldo' (payroll-admin) con lista y edición, y facturas de venta y compra separadas. Esta funcionalidad modifica 002; debe registrar qué partes de 002 quedan superseded, sin reescribir 002 completo. Requisitos: (1) Rol administrador: su acceso a datos de negocio queda LIMITADO exclusivamente a las liquidaciones de sueldo (pestañas de creación y de listado). Pierde acceso a entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento y búsqueda. Conserva el control de accesos y los avisos al desarrollador. El Panel queda solo con las dos pestañas de liquidaciones. (2) Nueva pestaña 'Crear liquidación de sueldo' (solo administrador): usa el mismo formulario ya existente de facturas de compra, con dos campos obligatorios adicionales: RUT y nombre completo del trabajador. Al guardar, si el RUT es nuevo, se crea automáticamente un tercero de tipo personal y un acceso con rol 'trabajador' cuya contraseña inicial son los primeros 4 dígitos del RUT; si el RUT ya existe, se reutiliza el tercero y el acceso existentes. El trabajador resultante queda sujeto a las mismas restricciones del rol trabajador ya establecidas. (3) La pestaña existente 'Liquidaciones de sueldo' pasa a listado con cuadro de búsqueda por RUT que filtra el listado en vivo mientras se escribe, y acción de seleccionar y editar cualquier liquidación (solo administrador). (4) Rol finanzas: puede crear y ver facturas de venta y de compra; en la pestaña de liquidaciones solo ve el listado en modo lectura, con búsqueda y filtrado por RUT, sin poder editar ni crear liquidaciones. (5) Rol trabajador: sin cambios en sus restricciones. (6) Actualizar las historias de usuario y los requisitos para que queden coherentes con estos permisos. (7) Mantener todo lo demás sin cambios: no reescribir archivos completos, solo modificar lo estrictamente necesario."

## Clarifications

### Session 2026-11-23

- Q: ¿Conserva el administrador el control de accesos y los avisos al desarrollador? → A: Conserva el **control de accesos**, pero **NO** los avisos al desarrollador.
- Q: ¿Qué módulos conserva el rol finanzas? → A: Conserva **entidades, movimientos, flujo de caja, seguimiento y búsqueda**, además de crear y ver facturas y ver las liquidaciones en solo lectura con búsqueda por RUT.
- Q: ¿Qué ocurre si el RUT ingresado en el formulario de creación ya existe? → A: **Solo se actualiza (o registra) la liquidación de sueldo**; no se genera ninguna entidad duplicada.
- Q: ¿Qué ve el administrador en su navegación? → A: **Solo** las opciones de **crear liquidación de sueldo** y **gestionar liquidaciones de sueldo**.

## User Scenarios & Testing *(mandatory)*

<!-- Los roles y permisos se validan como recorridos independientes. Cada historia
     puede desarrollarse, probarse y demostrarse por separado. -->

### User Story 1 - Crear una liquidación de sueldo desde su pestaña propia con alta automática de trabajador (Priority: P1)

Como administrador, quiero una pestaña aparte «Crear liquidación de sueldo» que use el mismo formulario ya existente de facturas de compra —más los campos obligatorios RUT y nombre completo del trabajador— para que al guardar un RUT nuevo el sistema registre automáticamente ese tercero de tipo personal y su acceso con rol «trabajador» (contraseña inicial: primeros 4 dígitos del RUT), quedando el trabajador sujeto a sus mismas restricciones.

**Why this priority**: es el valor central del pedido: sin esta pestaña el administrador no puede crear liquidaciones ni dar de alta trabajadores desde el flujo de nómina; además desbloquea las demás historias porque genera los datos que ellas consumen.

**Independent Test**: desde una sesión de administrador se abre la pestaña, se completa el formulario de factura de compra con un RUT nuevo y nombre completo, se guarda y se comprueba que existen la liquidación, el tercero personal, el acceso `trabajador` activo con contraseña igual a los primeros 4 dígitos del RUT, y que ese trabajador entra y ve únicamente su liquidación.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** abre la pestaña «Crear liquidación de sueldo», **entonces** ve el formulario existente de factura de compra más los campos obligatorios «RUT» y «Nombre completo», y ningún otro módulo de negocio en su navegación.
2. **Dado** el formulario completo con un RUT nuevo, **cuando** guardo, **entonces** se crea la liquidación, se crea el tercero de tipo personal, se crea un acceso activo con rol `trabajador` y contraseña igual a los primeros 4 dígitos del cuerpo del RUT.
3. **Dado** un RUT ya registrado como tercero personal con acceso, **cuando** guardo con ese mismo RUT, **entonces** solo se crea o actualiza la liquidación de sueldo asociada a ese tercero, sin generar ninguna entidad, tercero ni acceso duplicado.
4. **Dado** un RUT con puntos, guion, mayúsculas o espacios exteriores, **cuando** guardo, **entonces** se normaliza según la regla ya establecida y se compara en forma canónica.
5. **Dado** un RUT con dígito verificador inválido o campos obligatorios vacíos, **cuando** intento guardar, **entonces** el sistema rechaza el guardado con un mensaje claro y no crea ni liquidación, ni tercero, ni acceso.
6. **Dado** el alta exitosa, **cuando** ingreso con el RUT y la contraseña inicial del nuevo trabajador, **entonces** el sistema reconoce el rol `trabajador` y el usuario queda sujeto a las mismas restricciones existentes del rol (solo su última liquidación y su historial, sin edición).
7. **Dado** una sesión de finanzas o de trabajador, **cuando** intenta abrir la pestaña de creación, **entonces** el sistema se lo impide y redirige a su vista permitida.

---

### User Story 2 - Gestionar las liquidaciones desde su pestaña de listado con búsqueda por RUT (Priority: P1)

Como administrador, quiero una pestaña aparte «Liquidaciones de sueldo» con el listado de todas las liquidaciones, un cuadro de búsqueda por RUT que filtra el listado a medida que escribo, y la acción de seleccionar y editar cualquier liquidación, para mantener al día los períodos y montos sin recorrer todo el listado.

**Why this priority**: completa la operación de nómina junto con la US1 y es el segundo entregable central del pedido; es independiente porque puede probarse con liquidaciones ya existentes.

**Independent Test**: con liquidaciones de al menos dos trabajadores, se entra como administrador, se escribe un RUT parcial en el cuadro de búsqueda y el listado se reduce en vivo a ese trabajador; se selecciona una liquidación, se edita, se guarda y el cambio queda reflejado en la vista del trabajador correspondiente.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** abre la pestaña «Liquidaciones de sueldo», **entonces** ve el listado con trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada y acción «Editar».
2. **Dado** el listado completo, **cuando** escribo un RUT (total o parcial) en el cuadro de búsqueda, **entonces** el listado se filtra en vivo mientras escribo, sin necesidad de botón, mostrando solo las liquidaciones cuyo RUT coincida.
3. **Dado** un RUT que no coincide con ninguna liquidación, **cuando** lo escribo, **entonces** veo un estado vacío claro de «sin resultados».
4. **Dado** una liquidación seleccionada, **cuando** la edito con valores válidos y guardo, **entonces** los cambios se persisten, se respetan las validaciones y el ciclo de vida existentes, y la vista del trabajador refleja el cambio en el siguiente refresco.
5. **Dado** una edición que incumple las reglas del módulo, **cuando** intento guardar, **entonces** el sistema la rechaza con un mensaje claro y no guarda el cambio.
6. **Dado** una sesión de finanzas, **cuando** abre la misma pestaña, **entonces** ve el listado y puede buscar y filtrar por RUT, pero no existe la acción «Editar» ni ninguna forma de crear o modificar liquidaciones.

---

### User Story 3 - Aplicar la matriz de permisos por rol actualizada (Priority: P2)

Como usuario del módulo, quiero que cada rol vea exactamente los módulos que le corresponden —administrador: solo las dos pestañas de liquidaciones más control de accesos; finanzas: entidades, facturas de venta y compra, movimientos, flujo de caja, seguimiento, búsqueda y liquidaciones en solo lectura; trabajador: sin cambios— para que la información de nómina y de facturación quede separada según el rol.

**Why this priority**: es el candado que hace coherentes las historias anteriores; depende de que existan las dos pestañas (US1 y US2) para poder verificar la matriz completa.

**Independent Test**: con una sesión por cada rol se recorre la navegación y se comprueba que cada rol solo ve y puede abrir sus módulos permitidos, y que los intentos de acceso directo a una vista no permitida se redirigen con un mensaje claro.

**Acceptance Scenarios**:

1. **Dado** una sesión de administrador, **cuando** revisa su navegación y su Panel, **entonces** sus únicas opciones son «Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo» (más «Control de accesos» como utilidad de sesión), y no ve entidades, facturas, movimientos, flujo de caja, seguimiento, búsqueda ni avisos al desarrollador.
2. **Dado** una sesión de finanzas, **cuando** revisa su navegación, **entonces** ve entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento, búsqueda y liquidaciones en solo lectura, sin control de accesos ni avisos al desarrollador, y sin capacidad de edición en liquidaciones.
3. **Dado** una sesión de trabajador, **cuando** ingresa, **entonces** su experiencia no cambia: sigue viendo solo su última liquidación y su historial de pagos, en modo solo lectura.
4. **Dado** cualquier rol, **cuando** intenta abrir por navegación directa una vista que no le corresponde, **entonces** el sistema redirige a su vista permitida y muestra un mensaje claro, sin exponer datos.
5. **Dado** el módulo actualizado, **cuando** se comparan sus requisitos con los de `002-payroll-access-control`, **entonces** las partes contradictorias quedan marcadas como superseded en 002 sin reescribir ese documento completo.

---

### Edge Cases

- ¿Qué pasa si el RUT ingresado en el formulario de creación ya existe como tercero personal? Solo se crea o actualiza la liquidación de sueldo de ese tercero; no se genera ninguna entidad, tercero ni acceso duplicado.
- ¿Qué pasa si el RUT ya existe pero no es de tipo personal o su acceso está inactivo? Se rechaza el guardado con un mensaje claro y se registra la incidencia según las reglas ya establecidas.
- ¿Qué pasa si el RUT tiene dígito verificador inválido? Se rechaza con mensaje claro, sin crear liquidación, tercero ni acceso.
- ¿Qué pasa si el RUT se ingresa con puntos, guion, mayúsculas o espacios exteriores? Se normaliza y se compara en forma canónica.
- ¿Qué pasa si dos personas ingresan el mismo RUT normalizado en momentos distintos? Solo existe un tercero y un acceso; el segundo guardado únicamente crea o actualiza la liquidación de sueldo, sin duplicar entidades.
- ¿Qué pasa si los campos obligatorios del formulario (incluidos RUT y nombre completo) están vacíos? Se bloquea el guardado con mensajes junto a cada campo.
- ¿Qué pasa si la búsqueda por RUT está vacía? Se muestra el listado completo.
- ¿Qué pasa si la búsqueda por RUT no coincide con ningún registro? Se muestra un estado vacío de «sin resultados», sin perder el texto escrito.
- ¿Qué pasa si finanzas manipula la navegación para llegar a la edición de liquidaciones? La acción se bloquea y no se muestra el formulario de edición.
- ¿Qué pasa si el administrador intenta abrir facturas, entidades u otros módulos ya no asignados? Se redirige a una vista permitida con un mensaje claro.
- ¿Qué pasa si no hay liquidaciones registradas? Se muestra un estado vacío claro en la pestaña de listado.
- ¿Qué pasa si el formulario tiene cambios sin guardar y el usuario cambia de pestaña o cierra sesión? Se aplica la confirmación de «cambios sin guardar» ya existente.
- ¿Qué pasa si el acceso creado queda con contraseña inicial y la persona conoce el RUT de un compañero? Es el riesgo conocido ya documentado del MVP; no cambia con esta funcionalidad.

## Requirements *(mandatory)*

### Functional Requirements

**Pestaña de creación (administrador)**

- **FR-001**: El sistema DEBE ofrecer una pestaña «Crear liquidación de sueldo» visible únicamente para el rol `administrador`, que reutiliza el formulario existente de factura de compra.
- **FR-002**: Ese formulario DEBE incluir, además de los campos existentes, los campos obligatorios «RUT» y «Nombre completo» del trabajador.
- **FR-003**: Al guardar con un RUT nuevo, el sistema DEBE crear automáticamente un tercero de tipo personal y un acceso activo con rol `trabajador`, cuya contraseña inicial serán los primeros 4 dígitos del cuerpo del RUT, según la regla ya existente.
- **FR-004**: Al guardar con un RUT ya registrado, el sistema DEBE crear o actualizar únicamente la liquidación de sueldo asociada a ese tercero, sin generar ninguna entidad, tercero ni acceso duplicado.
- **FR-005**: El RUT DEBE validarse y normalizarse con las reglas ya establecidas; un RUT inválido, campos vacíos o vínculos incompatibles DEBEN bloquear el guardado con un mensaje claro y sin crear registros parciales.
- **FR-006**: El trabajador dado de alta desde esta pestaña DEBE quedar sujeto a todas las restricciones ya existentes del rol `trabajador`.

**Pestaña de listado (administrador y finanzas)**

- **FR-007**: El sistema DEBE ofrecer una pestaña «Liquidaciones de sueldo» con el listado de todas las liquidaciones y sus columnas actuales (trabajador, RUT, período, monto, estado, fecha de pago, factura vinculada y acción).
- **FR-008**: La pestaña DEBE incluir un cuadro de búsqueda por RUT que filtre el listado en vivo a medida que se escribe, sin botón de envío.
- **FR-009**: La búsqueda vacía DEBE mostrar el listado completo y una búsqueda sin coincidencias DEBE mostrar un estado vacío claro conservando el texto escrito.
- **FR-010**: Solo el rol `administrador` DEBE poder seleccionar y editar cualquier liquidación desde esta pestaña, con las validaciones y el ciclo de vida ya existentes.
- **FR-011**: El rol `finanzas` DEBE ver el listado en modo solo lectura y DEBE poder buscar y filtrar por RUT, sin acción de edición ni de creación de liquidaciones.

**Matriz de permisos por rol**

- **FR-012**: El rol `administrador` DEBE tener acceso, como únicos módulos de negocio, a las dos pestañas de liquidaciones; DEBE perder el acceso a entidades, facturas de venta, facturas de compra, movimientos, flujo de caja, seguimiento y búsqueda; DEBE conservar el control de accesos; y DEBE perder el acceso a los avisos al desarrollador.
- **FR-013**: El Panel y el menú del rol `administrador` DEBEn mostrar únicamente las dos pestañas de liquidaciones («Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo») más «Control de accesos» como utilidad de sesión; NO DEBEN mostrar avisos al desarrollador ni ningún otro módulo de negocio.
- **FR-014**: El rol `finanzas` DEBE conservar entidades, movimientos, flujo de caja, seguimiento y búsqueda, además de la creación y consulta de facturas de venta y de compra; DEBE ver las liquidaciones en solo lectura con búsqueda por RUT; y NO DEBE tener control de accesos ni avisos al desarrollador.
- **FR-015**: El rol `trabajador` NO DEBE verse afectado: conserva su vista exclusiva de última liquidación e historial en modo solo lectura.
- **FR-016**: Toda vista DEBE exigir sesión iniciada y toda navegación a una vista no permitida DEBE redirigir a la vista permitida del rol con un mensaje claro, sin exponer datos.

**Coherencia con la especificación existente**

- **FR-017**: Los requisitos e historias de usuario de esta funcionalidad DEBEN quedar redactados de forma coherente con los permisos descritos aquí.
- **FR-018**: Las partes de `specs/002-payroll-access-control/spec.md` y de sus contratos que resulten contradictorias con esta especificación DEBEN quedar marcadas como superseded mediante notas puntuales, sin reescribir esos documentos completos.
- **FR-019**: Todo lo no mencionado en esta especificación DEBE permanecer sin cambios; las modificaciones sobre archivos existentes DEBEN ser quirúrgicas y no reescribir archivos completos.
- **FR-020**: La vista de avisos al desarrollador NO DEBE ser visible para ningún rol; los avisos seguirán registrándose localmente y en la consola según el comportamiento ya existente, pero sin panel de consulta en la interfaz.

### Key Entities

- **LiquidacionSueldo**: liquidación de sueldo ya existente (período, desglose, monto, estado, fecha de pago, vínculo `documentId` con la factura de compra y `entityId` con el tercero personal). Esta funcionalidad no cambia su estructura, solo quién puede crearla y editarla.
- **Tercero personal**: persona física con RUT y nombre completo; creado automáticamente desde la pestaña de creación cuando el RUT es nuevo.
- **Acceso (AccessRecord)**: registro de acceso por RUT con rol y estado; el acceso `trabajador` creado automáticamente tiene como contraseña inicial los primeros 4 dígitos del RUT.
- **Factura de compra**: comprobante de pago con el que se vincula la liquidación; su formulario existente es la base del formulario de creación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El administrador crea una liquidación con RUT nuevo en una sola pasada por el formulario y, al terminar, existen a la vez la liquidación, el tercero personal y el acceso `trabajador` activo.
- **SC-002**: La contraseña del acceso recién creado permite ingresar como `trabajador` en el primer intento y muestra únicamente la liquidación de ese trabajador.
- **SC-003**: Escribir un RUT en el cuadro de búsqueda reduce el listado visible mientras se escribe, sin botón adicional, en menos de un segundo con el volumen del MVP.
- **SC-004**: Ningún rol puede abrir una vista que no le corresponde: el 100 % de los intentos de navegación no permitida termina en la vista permitida del rol con mensaje claro.
- **SC-005**: El rol `finanzas` no dispone de ninguna acción de creación o edición de liquidaciones en la interfaz (0 acciones visibles o invocables).
- **SC-006**: El 100 % de las pruebas automatizadas existentes sigue en verde después de los cambios (`npm run check` sin fallos), salvo las que esta funcionalidad actualiza de forma explícita.

## Assumptions

- El administrador **conserva** el control de accesos, pero **pierde** los avisos al desarrollador; su limitación a liquidaciones aplica a los módulos de negocio (entidades, facturas, movimientos, flujo de caja, seguimiento y búsqueda).
- El rol `finanzas` **conserva** entidades, movimientos, flujo de caja, seguimiento y búsqueda, además de facturas; el único cambio en su alcance es que pasa a solo lectura en liquidaciones.
- «Mismo formulario ya existente de facturas» significa reutilizar el formulario de factura de compra actual, extendido con RUT y nombre completo; no se crea un formulario paralelo desde cero.
- El Panel del administrador queda limitado a las dos pestañas de liquidaciones, manteniendo «Control de accesos» como utilidad de sesión y sin avisos al desarrollador.
- Los datos de demostración existentes siguen siendo válidos; no se pide regenerarlos, salvo que las pruebas lo requieran.
- El control de acceso sigue siendo una restricción de interfaz sobre datos del navegador, con la contraseña inicial de los primeros 4 dígitos del RUT documentada como riesgo conocido del MVP, tal como ya está establecido.
- El trabajo se realiza en la rama `main` de forma local, sin crear ramas nuevas y sin realizar push a ningún remoto.
