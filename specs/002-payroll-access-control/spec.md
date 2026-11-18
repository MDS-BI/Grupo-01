# Especificación de Funcionalidad: Acceso a liquidaciones de sueldo por RUT y contraseña

**Rama de la funcionalidad**: `002-payroll-access-control`

**Creada**: 2026-11-11

**Estado**: Borrador · Revisión de HU1 del 2026-11-17 implementada, pendiente de revisión del usuario

**Entrada inicial**: Descripción del usuario: "Generar un apartado dentro de la página web donde se seleccione ingresar como trabajador o administrador. Al ingresar se pedirá RUT y contraseña; cuando se ingrese un RUT nuevo se pedirá como contraseña inicial sus primeros 4 dígitos. Estos datos quedarán vinculados a una única liquidación de sueldo y, una vez ingresado como trabajador, verá un apartado exclusivo con ese documento. También agregar un ID de administrador, con RUT y contraseña bajo la misma regla inicial; el administrador podrá ver y editar las liquidaciones de sueldo de cada trabajador rellenando el formulario correspondiente y asociar cada RUT de las liquidaciones a su ID de trabajador. La sesión se cierra al cerrar sesión o al cerrar la pestaña. Si se ingresa un ID inválido, duplicado o inactivo, se notifica al desarrollador. La separación de facturas debe ser física y lógica/visual. El MVP es solo frontend y usa almacenamiento del navegador; el control de acceso es una restricción de interfaz, no seguridad real. No se usan datos reales."

**Revisión solicitada el 2026-11-17.** La HU1 define una pantalla de acceso con tarjeta centrada, RUT y contraseña, detección automática del rol registrado y las acciones «Ingresar» y «Continuar sin iniciar sesión». Dentro del ERP, el rol aparece en la cabecera y la acción de sesión ocupa el último lugar del lateral. Esta revisión documenta el acceso y su presentación, conservando las funciones y permisos actuales de administrador, trabajador e invitado. La implementación, las tareas y los contratos asociados se actualizan en esta revisión.

## Problema y solución

**Problema.** Hoy cualquier persona que abra el módulo puede ver las liquidaciones de sueldo de todos los trabajadores. Eso expone montos y períodos de remuneraciones que deberían quedar reservados al área de remuneraciones y, como máximo, a cada trabajador sobre su propio documento. Además, las facturas de venta y de compra conviven en un mismo conjunto de datos, lo que facilita mezclarlas por error.

**Solución (MVP).** Una pantalla de acceso con RUT y contraseña que reconoce automáticamente el rol del acceso registrado. También permite continuar como invitado. Después del ingreso, la cabecera identifica el rol y la última opción del lateral permite cerrar sesión o iniciar sesión, según corresponda. Los accesos los administra un administrador; al crear un acceso nuevo, la contraseña inicial son los primeros 4 dígitos del RUT. El trabajador ve un apartado exclusivo con su única liquidación, en modo solo lectura. El administrador ve y edita las liquidaciones de todos los trabajadores y asocia cada RUT de la liquidación con su acceso de trabajador. La liquidación se reutiliza como la factura de compra dirigida a un tercero de tipo personal: no se crea una entidad de almacenamiento separada. Las facturas de venta y de compra se separan físicamente en colecciones distintas y visualmente en vistas, formularios y listados independientes. La sesión vive en el almacenamiento de la pestaña y termina al cerrar sesión o al cerrar la pestaña. Todo el control es una restricción de interfaz sobre datos del navegador: no es seguridad real y no debe usarse con datos reales.

## Clarifications

### Session 2026-11-11

- Q: ¿La liquidación debe ser una entidad propia o reutilizar la factura de compra a personal? → A: Reutilizar la factura de compra a un tercero personal; no se crea una entidad `LiquidacionSueldo`.
- Q: ¿Cómo se cierra la sesión? → A: Al cerrar sesión o al cerrar la pestaña; la sesión se guarda en el almacenamiento de la pestaña.
- Q: ¿Qué pasa con un RUT inválido, duplicado o inactivo? → A: Se notifica al desarrollador mediante un registro local y la consola.
- Q: ¿La separación de facturas es solo visual? → A: Debe ser física (colecciones separadas) y lógica/visual (vistas, formularios y listados separados).

### Session 2026-11-17

- Q: ¿Cómo se reconoce el rol al ingresar? → A: Se valida el RUT y la contraseña y se usa el rol del acceso registrado; el login solo solicita las credenciales.
- Q: ¿Qué cambia después del ingreso? → A: Se muestra el rol en la parte superior y se coloca «Cerrar sesión» al final del lateral para administrador y trabajador, o «Iniciar sesión» para invitado. Cada rol conserva sus funciones y permisos actuales.
- Q: ¿Qué contraseña se usa en la demostración? → A: Los primeros cuatro dígitos del cuerpo del RUT, omitiendo puntos, guion y dígito verificador. Las credenciales están en la tabla de HU1.

## Usuarios

- **Administrador de remuneraciones:** administra los accesos, revisa y corrige las liquidaciones de todos los trabajadores y asocia cada RUT con su acceso.
- **Trabajador:** inicia sesión con su RUT y contraseña y consulta únicamente su propia liquidación, sin poder modificarla ni ver la de otros.
- **Invitado:** entra mediante «Continuar sin iniciar sesión» y usa las funciones que actualmente tiene habilitadas; puede volver al acceso desde la última opción del lateral.
- **Integrante del equipo (demostración):** carga accesos y liquidaciones ficticias para mostrar el flujo completo.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Acceder al ERP con RUT y contraseña o como invitado (Prioridad: P1)

Como usuario del módulo, quiero ingresar con mi RUT y contraseña desde una pantalla de acceso simple, que el sistema reconozca mi rol registrado y que este quede visible en la parte superior del ERP, para acceder a las funciones que me corresponden y reconocer con qué rol estoy usando el sistema. También quiero poder continuar como invitado y encontrar la acción de iniciar o cerrar sesión al final del menú lateral.

**Por qué esta prioridad**: es el acceso a las funciones existentes del ERP y permite identificar la sesión de administrador, trabajador o invitado.

**Alcance de la revisión**: adaptar la presentación del acceso, reconocer el rol mediante las credenciales y mostrar la información y las acciones de sesión. La administración de accesos sigue asignando el rol de cada RUT. Los módulos, datos, operaciones y permisos existentes de cada rol se conservan.

**Presentación del acceso**:

- Cabecera blanca con la marca del módulo y fondo gris claro, siguiendo la imagen de referencia del login aprobada el 2026-11-17.
- Tarjeta blanca centrada, con bordes redondeados, sombra discreta y título «Ingresar al ERP». En pantallas pequeñas se adapta al ancho disponible.
- Campos «RUT» y «Contraseña» dispuestos verticalmente, con etiquetas visibles. El campo de contraseña oculta sus caracteres.
- Botón azul principal «Ingresar» y botón secundario «Continuar sin iniciar sesión», debajo de los campos.
- La pantalla de acceso ocupa todo el espacio disponible bajo la cabecera; el menú lateral está oculto y no reserva una columna vacía. El formulario no incluye un selector de rol.
- Al pie aparece «Prototipo académico · Usa solo datos ficticios», acompañado de una aclaración breve de que el acceso y los datos son locales al navegador, según FR-033.

**Presentación dentro del ERP**:

| Forma de ingreso | Rol visible en la cabecera, a la derecha | Última opción del lateral | Pantalla de entrada |
|---|---|---|---|
| Credenciales de administrador | Rol: Administrador | Cerrar sesión | Panel |
| Credenciales de trabajador | Rol: Trabajador | Cerrar sesión | Mi liquidación |
| Continuar sin iniciar sesión | Rol: Invitado | Iniciar sesión | Panel |

La indicación de rol es informativa y permanece visible al navegar y recargar dentro de una sesión válida. La acción de sesión se coloca debajo de todas las entradas del menú, separada visualmente y situada al pie del lateral cuando la altura disponible lo permite; en pantallas pequeñas sigue siendo la última opción y permanece accesible. La cabecera de acceso muestra la marca, sin indicar una sesión autenticada.

**Credenciales ficticias de demostración**:

| Acceso | RUT | Contraseña |
|---|---|---|
| Administrador | `11.111.111-1` | `1111` |
| Trabajadora — Ana Pérez Soto | `22.222.222-2` | `2222` |
| Trabajador — Bruno Soto Vega | `45.000.000-0` | `4500` |
| Invitado | Seleccionar «Continuar sin iniciar sesión» | No requiere credenciales |

Estas credenciales corresponden a los datos de demostración cargados. La contraseña de los accesos del MVP son los primeros cuatro dígitos del cuerpo del RUT, omitiendo puntos, guion y dígito verificador; por ejemplo, `45.000.000-0` usa `4500`. El RUT debe tener un acceso registrado y activo. Escribir un RUT nuevo en el login no crea un usuario. La carga de demostración se conserva disponible desde el panel; en un navegador vacío se puede entrar como invitado, cargar los ejemplos y volver al acceso para probar las credenciales.

**Prueba independiente**: con los datos de demostración cargados, abrir el módulo sin sesión y comprobar el diseño del acceso. Entrar con cada RUT y contraseña, verificar el destino, el rol de la cabecera y la última acción del lateral, y recorrer las funciones existentes de ese rol. Repetir con «Continuar sin iniciar sesión», recargar y volver al acceso. Probar también credenciales incorrectas y accesos inválidos.

**Escenarios de aceptación**:

1. **Dado** el módulo sin sesión activa, **cuando** lo abro, **entonces** veo la tarjeta de acceso centrada con RUT, contraseña, «Ingresar» y «Continuar sin iniciar sesión», sin selector de rol, sin menú lateral ni espacio reservado para él, y sin datos de negocio visibles.
2. **Dado** un acceso de administrador válido, **cuando** ingreso su RUT y contraseña, **entonces** el sistema reconoce el rol registrado, abre el Panel, muestra «Rol: Administrador» en la cabecera y mantiene disponibles sus funciones actuales.
3. **Dado** un acceso de trabajador válido, **cuando** ingreso su RUT y contraseña, **entonces** el sistema reconoce el rol registrado, abre Mi liquidación, muestra «Rol: Trabajador» en la cabecera y mantiene sus funciones y restricciones actuales.
4. **Dado** el formulario de acceso, **cuando** selecciono «Continuar sin iniciar sesión», **entonces** entro al Panel como invitado, veo «Rol: Invitado» en la cabecera y dispongo de las mismas funciones y permisos que tiene actualmente ese modo de ingreso.
5. **Dado** un RUT con contraseña incorrecta, **cuando** intento entrar, **entonces** el sistema rechaza el acceso, muestra un mensaje claro junto al formulario y me permite intentarlo de nuevo sin mostrar datos de negocio ni un rol autenticado.
6. **Dado** un RUT registrado, **cuando** ingreso las credenciales correctas, **entonces** el rol de la sesión corresponde al acceso registrado y no puede elegirse ni modificarse desde el formulario de login o la indicación de la cabecera.
7. **Dado** un RUT escrito con puntos, guion, mayúsculas o espacios exteriores distintos, **cuando** ingreso la contraseña correcta, **entonces** el sistema lo reconoce según FR-004 y aplica el rol registrado.
8. **Dado** que ingresé como administrador, trabajador o invitado, **cuando** navego o recargo dentro de una sesión válida, **entonces** se conserva la sesión, el rol visible y el acceso a las funciones actuales de ese rol.
9. **Dado** que estoy autenticado como administrador o trabajador, **cuando** reviso el menú lateral, **entonces** «Cerrar sesión» es su última opción; al utilizarla se aplica el cierre de FR-007, se vuelve al acceso y desaparece la indicación del rol anterior.
10. **Dado** que ingresé como invitado, **cuando** reviso el menú lateral, **entonces** «Iniciar sesión» es su última opción; al utilizarla se vuelve al formulario de acceso, se termina la sesión de invitado y se oculta el lateral.
11. **Dado** un RUT inválido, no registrado, duplicado, inactivo o con vínculo roto, **cuando** intento ingresar, **entonces** se aplican los rechazos y notificaciones existentes de FR-002, FR-008 y FR-009, sin asignar arbitrariamente un rol.
12. **Dado** un computador o un teléfono, **cuando** utilizo el acceso con teclado o controles táctiles, **entonces** los campos, mensajes y botones son legibles, tienen etiquetas y foco visibles y permiten enviar el formulario con Enter.

---

### Historia de Usuario 2 - Administrar accesos de trabajadores y administradores (Prioridad: P1)

Como administrador de remuneraciones, quiero crear y administrar los accesos por RUT, para controlar quién puede entrar y qué puede ver.

**Por qué esta prioridad**: sin accesos administrables no se puede incorporar ni retirar trabajadores; es la base para que la separación por rol sea sostenible.

**Prueba independiente**: desde una sesión de administrador se crea un acceso para un tercero de tipo personal, se comprueba que ese RUT abre la vista de trabajador con la contraseña inicial, se desactiva y se verifica que ya no permite entrar.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **cuando** crea un acceso de trabajador con un RUT nuevo y un tercero de tipo personal, **entonces** el acceso queda registrado, activo y con contraseña inicial igual a los primeros 4 dígitos del RUT.
2. **Dado** un administrador autenticado, **cuando** crea un acceso de administrador con un RUT nuevo, **entonces** el acceso queda registrado, activo y con contraseña inicial igual a los primeros 4 dígitos del RUT.
3. **Dado** un RUT ya registrado, **cuando** intento crear otro acceso con el mismo RUT, **entonces** el sistema lo impide, explica que ya existe y registra una notificación para el desarrollador.
4. **Dado** un tercero personal con un acceso activo, **cuando** intento crear otro acceso activo para el mismo tercero, **entonces** el sistema lo impide y explica que ya existe uno.
5. **Dado** un acceso activo, **cuando** el administrador lo desactiva, **entonces** ese RUT deja de permitir el acceso en el siguiente intento y se registra una notificación para el desarrollador.
6. **Dado** un acceso inactivo, **cuando** el administrador lo reactiva, **entonces** vuelve a permitir el acceso según su rol.
7. **Dado** un acceso de trabajador, **cuando** el administrador restablece su contraseña, **entonces** vuelve a ser los primeros 4 dígitos de su RUT.
8. **Dado** el último administrador activo, **cuando** intento desactivarlo o eliminarlo, **entonces** el sistema lo impide para no dejar el módulo sin administración.
9. **Dado** un trabajador autenticado, **cuando** intenta abrir la administración de accesos, **entonces** el sistema se lo impide.
10. **Dado** un administrador autenticado, **cuando** abre la administración de accesos, **entonces** ve la lista con RUT, rol, tercero asociado cuando corresponde, estado y fecha de creación.

---

### Historia de Usuario 3 - Consultar mi única liquidación (Prioridad: P2)

Como trabajador, quiero ver mi liquidación de sueldo en un apartado exclusivo y en modo solo lectura, para conocer mi pago sin poder ver el de mis compañeros.

**Por qué esta prioridad**: entrega el valor directo al trabajador y demuestra la separación de datos; depende de que existan accesos y liquidaciones.

**Prueba independiente**: con dos trabajadores con liquidaciones distintas, se entra con el RUT de uno y se comprueba que solo aparece su liquidación vigente, sin acciones de edición ni datos del otro.

**Escenarios de aceptación**:

1. **Dado** un trabajador con una liquidación registrada, **cuando** entra con su RUT y contraseña, **entonces** ve un apartado exclusivo con período, monto, estado y fecha de pago de su liquidación.
2. **Dado** un trabajador con varias liquidaciones de distintos períodos, **cuando** entra, **entonces** ve únicamente la liquidación vigente: la del período más reciente.
3. **Dado** un trabajador sin liquidación, **cuando** entra, **entonces** ve un estado vacío claro y ningún dato de otro trabajador.
4. **Dado** un trabajador autenticado, **cuando** intenta editar su liquidación o abrir la de otro trabajador, **entonces** el sistema bloquea la acción y muestra un mensaje claro.
5. **Dado** un trabajador autenticado, **cuando** intenta abrir la vista global de facturas, la administración de accesos o cualquier módulo de administración, **entonces** el sistema se lo impide.

---

### Historia de Usuario 4 - Ver y editar las liquidaciones de todos (Prioridad: P2)

Como administrador de remuneraciones, quiero ver y corregir la liquidación de cualquier trabajador mediante el formulario correspondiente, para mantener al día los períodos y montos sin pedir acceso a cada cuenta.

**Por qué esta prioridad**: completa la operación del área de remuneraciones; depende de que existan accesos de administrador y liquidaciones.

**Prueba independiente**: con liquidaciones de al menos dos trabajadores, se entra como administrador, se filtra por trabajador y período, se edita una liquidación y se comprueba que el cambio se refleja en la vista del trabajador correspondiente.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **cuando** abre la vista de liquidaciones, **entonces** ve las de todos los trabajadores con trabajador, RUT, período, monto y estado.
2. **Dado** un administrador autenticado, **cuando** filtra por un trabajador o por un período, **entonces** la lista muestra solo las liquidaciones que cumplen el filtro.
3. **Dado** un administrador autenticado, **cuando** edita una liquidación, **entonces** el cambio se guarda y se refleja en el apartado del trabajador correspondiente.
4. **Dado** un administrador autenticado, **cuando** intenta guardar una edición que incumple las reglas del módulo, **entonces** el sistema la rechaza con un mensaje claro y no guarda el cambio.
5. **Dado** un administrador autenticado, **cuando** asocia el RUT de una liquidación con un acceso de trabajador existente o crea el acceso desde la vista de liquidaciones, **entonces** la liquidación queda vinculada a ese acceso y el trabajador la ve en su apartado.
6. **Dado** un administrador autenticado, **cuando** no hay liquidaciones, **entonces** ve un estado vacío claro.

---

### Historia de Usuario 5 - Separar facturas de venta y de compra (Prioridad: P1)

Como usuario del módulo, quiero que las facturas de venta y de compra estén separadas física y visualmente, para que no se mezclen los datos ni las acciones de cada tipo.

**Por qué esta prioridad**: la liquidación se apoya en la factura de compra a personal; si venta y compra comparten datos y vistas, el riesgo de mostrar o editar el documento equivocado es alto.

**Prueba independiente**: se crea una factura de venta y una de compra, se comprueba que cada una vive en su propia colección de datos y que solo aparece en su vista, formulario y listado; la liquidación del trabajador nunca muestra la factura de venta.

**Escenarios de aceptación**:

1. **Dado** el módulo con facturas de venta y de compra, **cuando** reviso el almacenamiento del navegador, **entonces** cada tipo está en su propia colección y ninguna colección mezcla ambos tipos.
2. **Dado** un módulo con datos previos en una colección única, **cuando** se abre la nueva versión, **entonces** los datos se migran a las colecciones separadas sin perder facturas ni duplicarlas.
3. **Dado** un administrador autenticado, **cuando** abre la vista de facturas de venta, **entonces** ve solo facturas de venta, con su formulario y su listado.
4. **Dado** un administrador autenticado, **cuando** abre la vista de facturas de compra, **entonces** ve solo facturas de compra, con su formulario y su listado.
5. **Dado** una factura de venta, **cuando** intento verla o editarla desde la vista de compra o desde la liquidación de un trabajador, **entonces** el sistema no la muestra.
6. **Dado** el menú principal, **cuando** lo reviso, **entonces** no existe una vista genérica de documentos que mezcle ambos tipos.

---

### Historia de Usuario 6 - Cerrar sesión, notificar incidencias y usar datos de demostración (Prioridad: P3)

Como usuario del módulo, quiero cerrar sesión de forma segura, que las incidencias de acceso queden registradas y contar con datos ficticios para demostrar el flujo, para probar el módulo sin datos reales y sin dejar la sesión abierta.

**Por qué esta prioridad**: cierra el ciclo de uso y facilita la presentación; no bloquea las historias anteriores.

**Prueba independiente**: se inicia sesión, se cierra, se comprueba que se vuelve a pedir el RUT y que no se ven datos; se cierra la pestaña y se comprueba que la sesión no se recupera; luego se carga la demostración y se entra con los RUT ficticios.

**Escenarios de aceptación**:

1. **Dado** un usuario autenticado, **cuando** cierra sesión, **entonces** vuelve a la pantalla de acceso y no puede ver datos sin ingresar nuevamente.
2. **Dado** un usuario autenticado, **cuando** cierra la pestaña del navegador, **entonces** la sesión termina y al volver a abrir el módulo se pide el RUT nuevamente.
3. **Dado** un administrador con cambios sin guardar, **cuando** intenta cerrar sesión, **entonces** el sistema pide confirmación antes de descartar los cambios.
4. **Dado** un intento de acceso con RUT inválido, no registrado, inactivo, duplicado o con un vínculo roto a un tercero personal, **cuando** el sistema lo rechaza, **entonces** registra una notificación para el desarrollador con fecha, RUT intentado, rol y motivo.
5. **Dado** el módulo vacío, **cuando** cargo los datos de demostración, **entonces** aparecen al menos un acceso de administrador y dos accesos de trabajadores ficticios, con sus terceros personales y liquidaciones de ejemplo.
6. **Dados** los datos de demostración ya cargados, **cuando** intento cargarlos de nuevo, **entonces** el sistema no duplica accesos ni liquidaciones y conserva lo existente.
7. **Dado** un navegador sin datos, **cuando** abro el módulo, **entonces** veo un mensaje que explica que no hay accesos registrados y que puedo continuar como invitado para cargar la demostración desde el panel y luego volver al acceso.
8. **Dado** el módulo abierto, **cuando** reviso la pantalla de acceso o la vista de liquidaciones, **entonces** veo una advertencia de que el control de acceso es una restricción de interfaz y que no deben usarse datos reales.

---

### Casos Límite

- ¿Qué pasa si el RUT se ingresa con puntos, guion, letra K minúscula o espacios exteriores? El sistema lo normaliza y lo compara con el RUT canónico registrado.
- ¿Qué pasa si el RUT tiene un dígito verificador inválido? Se rechaza con un mensaje claro y se registra una notificación para el desarrollador.
- ¿Qué pasa si el RUT es válido pero no está registrado? Se rechaza el acceso con un mensaje claro y se registra una notificación `NOT_FOUND` para el desarrollador.
- ¿Qué pasa si el RUT existe pero está inactivo? Se rechaza el acceso con un mensaje claro y se registra una notificación para el desarrollador.
- ¿Qué pasa si alguien intenta atribuirse otro rol desde el acceso? El sistema obtiene el rol del acceso registrado después de validar las credenciales; ni el formulario ni la indicación de la cabecera permiten elegir otro rol.
- ¿Qué pasa si el acceso de trabajador apunta a un tercero que fue eliminado o que dejó de ser de tipo personal? El acceso se considera inválido, no muestra datos y se registra una notificación para el desarrollador.
- ¿Qué pasa si dos accesos tienen el mismo RUT normalizado? El sistema impide el segundo y registra una notificación para el desarrollador.
- ¿Qué pasa si el administrador intenta desactivar el último acceso de administrador activo? El sistema lo impide para evitar el bloqueo total.
- ¿Qué pasa si un trabajador intenta abrir una liquidación de otro trabajador manipulando la navegación o la vista? La acción se bloquea y no se muestran datos del otro trabajador.
- ¿Qué pasa si un trabajador intenta acceder a la administración de accesos, a la vista global de facturas o a otro módulo administrativo? La acción se bloquea.
- ¿Qué pasa si no hay liquidación para el trabajador? Se muestra un estado vacío claro.
- ¿Qué pasa si se borran los datos del navegador? Se pierden accesos, sesión y liquidaciones; el sistema vuelve al acceso y explica cómo cargar la demostración desde el panel de invitado.
- ¿Qué pasa si se carga la demostración dos veces? No se duplican accesos ni liquidaciones; se informa que ya hay datos.
- ¿Qué pasa si el administrador cierra sesión con una edición a medio terminar? Se pide confirmación y, si acepta, se descarta el cambio.
- ¿Qué pasa si se ingresa un período con formato distinto de `YYYY-MM`? Se rechaza con un mensaje claro, según las reglas existentes de la factura de compra a personal.
- ¿Qué pasa si una factura de venta y una de compra tienen el mismo folio? Cada tipo mantiene su propia unicidad; no colisionan entre colecciones separadas.
- ¿Qué pasa si la migración desde la colección única encuentra un documento sin `tipoFactura`? Se conserva en una bandeja de datos no clasificados y se avisa al administrador; no se muestra como liquidación.

## Requisitos *(obligatorio)*

### Requisitos Funcionales

**Acceso y sesión**

- **FR-001**: Al abrir el módulo sin una sesión activa, el sistema DEBE mostrar el acceso descrito en HU1: cabecera de marca, tarjeta centrada con RUT y contraseña, botón «Ingresar» y opción «Continuar sin iniciar sesión». El menú lateral y su espacio reservado DEBEN permanecer ocultos, y el formulario NO DEBE incluir selección de rol. Los datos de negocio permanecen ocultos hasta acceder con credenciales válidas o continuar como invitado.
- **FR-002**: El sistema DEBE validar el RUT y la contraseña contra los accesos registrados y DEBE rechazar credenciales vacías, inválidas, inactivas o con vínculo roto con un mensaje claro, sin exponer datos.
- **FR-003**: Después de validar las credenciales, el sistema DEBE obtener el rol del acceso único y activo asociado al RUT normalizado y abrir la pantalla correspondiente: Panel para administrador y Mi liquidación para trabajador. El rol se asigna desde la administración de accesos y NO DEBE elegirse en el login. «Continuar sin iniciar sesión» abre el Panel con la sesión de invitado existente. Las funciones y permisos actuales de cada rol se conservan.
- **FR-004**: El sistema DEBE normalizar el RUT para compararlo y almacenarlo en una forma canónica, sin distinguir puntos, mayúsculas, espacios exteriores ni el formato del guion.
- **FR-005**: Todo acceso nuevo, de trabajador o de administrador, DEBE tener como contraseña inicial los primeros 4 dígitos del cuerpo del RUT; el sistema DEBE aplicar y verificar esta regla al crear el acceso.
- **FR-006**: La sesión DEBE conservar el RUT, el rol y el tercero personal asociado cuando corresponda, y DEBE sobrevivir a una recarga de página. Dentro del ERP, la parte superior derecha de la cabecera DEBE mostrar «Rol: Administrador», «Rol: Trabajador» o «Rol: Invitado» según la sesión vigente. La indicación es informativa y se actualiza al ingresar, navegar, recargar o terminar la sesión.
- **FR-007**: La sesión DEBE terminar al cerrar sesión o al cerrar la pestaña. El cierre de sesión DEBE eliminar la sesión activa, volver a la pantalla de acceso y, si hay cambios sin guardar, pedir confirmación antes de descartarlos. El estado "cambios sin guardar" DEBE detectarse comparando el formulario con el registro cargado. «Cerrar sesión» DEBE ser la última opción del lateral para administrador y trabajador. Para invitado, la última opción DEBE ser «Iniciar sesión», que termina la sesión de invitado y vuelve al acceso. En ambos casos, volver al acceso oculta el lateral y la indicación del rol anterior.
- **FR-008**: Un acceso de trabajador DEBE estar asociado a exactamente un tercero de tipo personal; si el tercero no existe, no es de tipo personal o el vínculo es ambiguo, el acceso DEBE considerarse inválido.
- **FR-009**: Todo intento de acceso con RUT inválido, no registrado, inactivo, duplicado o con vínculo roto DEBE registrar una notificación para el desarrollador con fecha, RUT intentado, rol registrado cuando pueda determinarse y motivo; si el acceso no puede resolverse, el rol se registra como no identificado. La notificación DEBE quedar disponible en el registro local y en la consola.

**Administración de accesos**

- **FR-010**: El administrador DEBE poder crear accesos de trabajador con un RUT nuevo y un tercero de tipo personal, con contraseña inicial según FR-005.
- **FR-011**: El administrador DEBE poder crear accesos de administrador con un RUT nuevo, con contraseña inicial según FR-005.
- **FR-012**: Todo RUT DEBE ser único entre todos los accesos, comparado en forma normalizada; el sistema DEBE impedir duplicados y registrar la incidencia.
- **FR-013**: Un tercero personal DEBE tener como máximo un acceso activo; el administrador DEBE poder desactivar y reactivar accesos.
- **FR-014**: El administrador DEBE poder restablecer la contraseña de un acceso a los primeros 4 dígitos de su RUT.
- **FR-015**: El administrador DEBE ver la lista de accesos con RUT, rol, tercero asociado cuando corresponda, estado y fecha de creación, sin exponer datos innecesarios.
- **FR-016**: DEBE existir al menos un acceso de administrador activo y el sistema DEBE impedir desactivar o eliminar el último.
- **FR-017**: El sistema DEBE impedir que un trabajador cree, modifique, desactive o consulte la lista completa de accesos.
- **FR-018**: Los cambios en los accesos DEBEN aplicarse en el siguiente intento de acceso, sin reiniciar la aplicación.

**Liquidaciones de sueldo**

- **FR-019**: Una liquidación de sueldo DEBE ser una factura de compra asociada a un tercero de tipo personal, con un período obligatorio en formato `YYYY-MM`, respetando las reglas existentes del módulo; NO DEBE existir una entidad de almacenamiento separada para la liquidación.
- **FR-020**: El trabajador DEBE ver exactamente una liquidación: la de período más reciente de su tercero personal, con desempate por fecha de emisión y luego por fecha de creación; la vista DEBE ser de solo lectura.
- **FR-021**: Si el trabajador no tiene liquidación, DEBE ver un estado vacío claro, sin datos de otros trabajadores.
- **FR-022**: El administrador DEBE poder ver todas las liquidaciones de todos los trabajadores, con trabajador, RUT, período, monto y estado.
- **FR-023**: El administrador DEBE poder filtrar la lista de liquidaciones por trabajador o RUT y por período.
- **FR-024**: El administrador DEBE poder editar una liquidación existente mediante el formulario de factura de compra, respetando el ciclo de vida y las validaciones del módulo; esta funcionalidad NO DEBE permitir saltarse esas reglas.
- **FR-025**: El administrador DEBE poder asociar el RUT de una liquidación con su acceso de trabajador desde la vista de liquidaciones, seleccionando un acceso activo cuyo RUT coincida o creándolo si no existe. La asociación DEBE usar el tercero personal como vínculo (`AccessRecord.entityId === PurchaseInvoice.entity_id`) y DEBE reflejarse en el apartado del trabajador.
- **FR-026**: El trabajador NO DEBE poder ver, editar, eliminar ni abrir liquidaciones de otros terceros, ni acceder a la administración de accesos, a la vista global de facturas o a otros módulos administrativos; todo intento DEBE bloquearse con un mensaje claro.

**Separación física y visual de facturas**

- **FR-027**: Las facturas de venta y las facturas de compra DEBEN almacenarse en colecciones separadas; ninguna colección DEBE mezclar ambos tipos.
- **FR-028**: El sistema DEBE migrar los datos de una colección única previa a las colecciones separadas, sin perder ni duplicar facturas, y DEBE conservar los documentos sin tipo en una bandeja no clasificada. El administrador DEBE ver un aviso cuando la migración falle o cuando existan documentos no clasificados, con la cantidad y la indicación de que no se muestran como liquidaciones.
- **FR-029**: Las facturas de venta y de compra DEBEN tener vistas, formularios y listados independientes, con columnas y tratamiento visual propios; NO DEBE existir una vista genérica de documentos en el menú.
- **FR-030**: Una factura de venta NO DEBE aparecer ni editarse desde la vista de compra, la liquidación de un trabajador o viceversa; el tipo DEBE quedar fijado por la vista y no poder cambiarse desde el formulario.

**Datos de demostración y transparencia**

- **FR-031**: Los datos de demostración DEBEN incluir al menos un acceso de administrador y dos accesos de trabajadores ficticios, con sus terceros personales y liquidaciones de ejemplo, y sus credenciales DEBEN estar documentadas.
- **FR-032**: La carga de demostración DEBE ser idempotente: si ya existen datos, NO DEBE duplicar accesos ni liquidaciones y DEBE conservar lo existente.
- **FR-033**: La interfaz DEBE advertir que el control de acceso es una restricción de interfaz, que los datos se guardan solo en el navegador y que no deben usarse datos reales.
- **FR-034**: Si no hay datos en el navegador, el sistema DEBE mostrar el acceso sin sesión y explicar que no hay accesos registrados. La demostración DEBE seguir disponible desde el panel al que se llega con «Continuar sin iniciar sesión»; después de cargarla, la persona puede volver al acceso mediante «Iniciar sesión» y probar los RUT y contraseñas de HU1.
- **FR-035**: El README DEBE documentar los RUT y contraseñas de demostración y la advertencia de que el control es solo de interfaz y no seguridad real.

### Entidades Clave

- **Acceso (Usuario)**: credencial de entrada del MVP. Tiene un RUT único normalizado (`accessId`), un rol (`administrador` o `trabajador`), un tercero personal asociado cuando el rol es trabajador (`entityId`), una contraseña, un estado (activo o inactivo) y marcas de creación y actualización. Un tercero personal tiene como máximo un acceso activo; puede haber varios administradores.
- **Sesión**: acceso vigente mientras la pestaña esté abierta y el usuario no cierre sesión. Conserva el RUT, el rol y el tercero personal asociado. Se guarda en el almacenamiento de la pestaña y no otorga permisos distintos de los del rol.
- **Liquidación de sueldo**: proyección de una factura de compra dirigida a un tercero de tipo personal, con período `YYYY-MM`, monto, estado y fecha de pago. Pertenece a un solo tercero personal y se muestra según el rol de la sesión. No tiene almacenamiento propio.
- **Tercero personal**: trabajador al que se asocian el acceso y sus liquidaciones. Es la fuente del vínculo entre una sesión de trabajador y su documento.
- **Notificación al desarrollador**: registro local de una incidencia de acceso (fecha, RUT intentado, rol y motivo) para diagnosticar RUT inválidos, duplicados, inactivos o vínculos rotos.
- **Datos de demostración**: conjunto ficticio de accesos, terceros personales y liquidaciones que permite probar el flujo sin datos reales.

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Un usuario con credenciales válidas llega a la vista correcta de su rol en menos de 30 segundos desde que abre el módulo.
- **SC-002**: El 100% de las sesiones de trabajador muestra exactamente su liquidación vigente y cero liquidaciones de otros terceros, comprobado con al menos dos trabajadores con datos distintos.
- **SC-003**: El 100% de los intentos con RUT inválido, inactivo, duplicado o con vínculo roto se rechaza con un mensaje claro, sin mostrar datos, y queda registrado para el desarrollador.
- **SC-004**: El 100% de los ingresos con credenciales válidas utiliza el rol registrado para ese RUT; la cabecera y la navegación corresponden a la sesión vigente. El formulario y la indicación de rol no permiten elegir ni atribuirse otro rol.
- **SC-005**: El 100% de las sesiones termina al cerrar sesión o al cerrar la pestaña, y se conserva al recargar la página dentro de la misma pestaña.
- **SC-006**: El administrador encuentra y edita una liquidación de un trabajador en menos de 1 minuto usando la lista y sus filtros.
- **SC-007**: La carga de demostración deja al menos un administrador y dos trabajadores con liquidaciones en menos de 1 minuto, con credenciales documentadas.
- **SC-008**: El 100% de las facturas de venta y de compra se verifica en colecciones separadas y en vistas separadas; ninguna aparece en el conjunto o la vista del otro tipo.
- **SC-009**: El 100% de los cambios de estado o contraseña de un acceso surte efecto en el siguiente intento de acceso, sin reiniciar la aplicación.
- **SC-010**: El 100% de los intentos de un trabajador por abrir datos de otro trabajador, la administración de accesos o un módulo administrativo se bloquea y no expone información.

## Supuestos

- Los accesos los crea un administrador; no hay autorregistro. El primer administrador proviene de los datos de demostración o de un registro de arranque documentado.
- La contraseña inicial son los primeros 4 dígitos del cuerpo del RUT, sin puntos ni dígito verificador. Por ejemplo, `12.345.678-5` usa `1234`.
- La contraseña se guarda localmente sin cifrado ni funciones de seguridad reales; el MVP no debe usarse con datos reales.
- La liquidación se define en FR-019; no existe una colección `LiquidacionSueldo`.
- El trabajador ve una sola liquidación, la del período más reciente; el historial completo de períodos queda fuera del alcance del MVP.
- Las facturas de venta y de compra se separan en colecciones distintas del almacenamiento del navegador y en vistas, formularios y listados independientes; los datos previos se migran al abrir la nueva versión.
- La sesión se guarda en el almacenamiento de la pestaña (`sessionStorage`) y termina al cerrarla; una recarga dentro de la misma pestaña la conserva.
- Los RUT se comparan en forma normalizada para evitar rechazos por errores de tipeo.
- Cada tercero personal tiene como máximo un acceso activo; el administrador puede restablecer la contraseña o desactivar el acceso.
- Puede haber varios administradores, pero nunca cero administradores activos.
- La eliminación de liquidaciones queda fuera del alcance; las ediciones del administrador se rigen por las reglas existentes del módulo.
- Los accesos y datos de demostración son ficticios y deben estar documentados; no se usan datos reales.
- La interfaz está en español.

## Fuera de alcance

- Autenticación real, cifrado, backend, control de acceso del lado del servidor, recuperación de contraseña por correo o autoservicio del trabajador.
- Autorregistro de trabajadores o administradores.
- Perfiles genéricos, permisos granulares distintos de administrador y trabajador, o integración con un directorio corporativo.
- Cálculo de haberes, descuentos legales, AFP, salud o imponibilidad: la liquidación sigue siendo el comprobante de pago del módulo de facturación.
- Historial completo de liquidaciones para el trabajador, eliminación de liquidaciones y pagos parciales.
- Auditoría de accesos o de cambios de accesos más allá del registro local de notificaciones para el desarrollador.
