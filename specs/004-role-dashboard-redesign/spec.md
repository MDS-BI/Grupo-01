# Feature Specification: Rediseño visual de paneles por rol

**Feature Branch**: `main` (sin rama; trabajo local en `main`)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Rediseño visual de los paneles por rol del módulo Contabilidad y Finanzas, según el feedback del profesor (hacerlo más atractivo e intuitivo y mejorar el panel de inicio). Depende de la spec 003-payroll-tabs-roles, ya implementada: respeta su matriz de permisos. HU1 a HU6: panel del administrador sin datos financieros; indicadores de finanzas con estado; tendencia y alertas; accesos rápidos compactos; vista del trabajador clara; identidad visual común."

## Clarifications

### Session 2026-11-25

- Q: ¿Qué opciones debe mostrar el menú ☰ del Panel de finanzas para que las acciones operativas sigan disponibles? → A: Agregar antes de «Guía de uso» una sección de navegación con Terceros, Facturas de venta, Facturas de compra, Movimientos financieros, Flujo de caja, Seguimiento, Liquidaciones de sueldo y Buscar; el administrador y el trabajador no cambian; los accesos rápidos del Panel siguen siendo como máximo cuatro; no se cambian la matriz de permisos, el modelo de datos, las claves erp.* ni la identidad visual de la constitución.
- Q: ¿Cómo debe organizarse visualmente el menú ☰ del Panel de finanzas? → A: Mostrar primero el subtítulo «Navegación» con las ocho vistas, luego un separador y después el título «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión», igual que en los otros roles; administrador y trabajador sin cambios; reutilizar los estilos de título y separador existentes sin introducir colores nuevos; sin cambios a permisos, modelo de datos ni claves erp.*.

### Session 2026-11-26

- Q: ¿Qué formato deben usar las fechas y los montos visibles en la interfaz? → A: Toda fecha mostrada como texto usa DD-MM-AAAA; los campos de entrada y el almacenamiento (AAAA-MM-DD) no cambian. Todos los montos visibles usan `formatCurrencyCLP` (por ejemplo «$250.000»), incluidas las listas de Facturas de venta y de compra.
- Q: Cómo deben mostrarse Movimientos financieros y Control de accesos sin exponer datos internos? → A: Ninguna vista muestra identificadores internos (`doc_`, `ent_`, `set_`) ni nombres internos de campos. Movimientos usa las etiquetas del Panel («Venta emitida», «Pago»), la referencia «Venta serie #folio» o «Compra serie #folio» y «Orden de venta: PED-036»; Control de accesos muestra el nombre del tercero.
- Q: ¿Qué formato debe tener el RUT visible? → A: Todo RUT visible usa puntos y guion (12.345.678-5), incluso si se ingresó sin puntos; el almacenamiento sigue normalizado como hoy.
- Q: ¿Cómo debe mostrarse el rol administrador en la interfaz? → A: Se muestra como «Recursos Humanos» en la cabecera («Rol: Recursos Humanos»), el saludo del Panel, la inicial del círculo y el selector de rol de Control de accesos; todos los roles se muestran con mayúscula inicial; la clave interna `administrador` no cambia.
- Q: ¿Qué debe mostrar la gestión de liquidaciones y cómo debe comportarse a 390 px de ancho? → A: La vista «Gestionar liquidaciones de sueldo» muestra la leyenda «Borrador (RRHH la prepara)», «Emitida (aprobada por RRHH)» y «Pagada (finanzas registró el pago)», sin cambiar los nombres de los estados. A 390 px ninguna vista tiene desborde horizontal de la página y las tablas anchas se desplazan dentro de su contenedor.
- Q: ¿Cómo deben cambiar el banner superior y el color de acento con la paleta de la constitución v1.2.0? → A: El banner superior usa fondo `#023047` con texto e ícono ☰ blancos; la etiqueta del rol usa fondo `#8ECAE6` con texto `#023047`; el círculo de iniciales usa fondo `#FFB703` con letra `#023047`. El acento `#0f62fe` en `src/styles.css` y `module-config.js` pasa a `#023047`: botones principales con texto blanco, enlaces, vista activa y tintes de acento; las sombras azules usan `#023047`.
- Q: ¿Qué colores deben usar los estados favorables, los que requieren acción y los desfavorables o críticos? → A: Favorable: texto `#126782` sobre blanco o tinte claro de `#219EBC`, y `#219EBC` en gráficos y bordes; aplica a Pagada, variación favorable, ingresos, totales de ingreso en Flujo de caja y Facturas de venta. Requiere acción: fondo `#FFB703` o su tinte claro con texto `#023047`; aplica a Emitida, alertas y avisos de configuración. Desfavorable o crítico: texto y barras `#A84F00`, bordes `#FB8500` o tinte claro de `#FB8500`; aplica a Vencida, variación desfavorable, gastos, egresos, Facturas de compra, errores de formulario y alertas críticas.
- Q: ¿Cómo deben mostrarse el gráfico «Ingresos vs Gastos» y los mensajes informativos de ruta? → A: Las barras de ingresos usan `#219EBC` y las de gastos `#A84F00`, con leyenda en texto. Los mensajes informativos de ruta usan fondo tinte de `#8ECAE6`, borde `#8ECAE6` y texto `#023047`.
- Q: ¿Qué partes de la identidad y del producto permanecen sin cambios al aplicar la paleta? → A: Los grises neutros de fondo, tarjetas, texto, texto secundario y bordes, y la tipografía IBM Plex Sans incluida localmente. Tampoco cambian el modelo de datos, las claves `erp.*`, los permisos por rol ni los textos de la interfaz.
- Q: ¿Qué reglas de accesibilidad visual deben cumplirse con la nueva paleta? → A: Todo estado sigue acompañado de texto, ícono o flecha `▲`/`▼`; el texto normal cumple contraste mínimo de `4.5:1` y los textos grandes y elementos gráficos `3:1` (WCAG 2.1 AA), con verificación mediante simulación de protanopía, deuteranopía y tritanopía.

### Session 2026-11-27

- Q: ¿Cómo debe dibujarse y comportarse el ícono de información de la fórmula de los indicadores financieros del Panel? → A: El ícono NO DEBE usar el carácter de texto «ⓘ», que IBM Plex Sans no incluye; DEBE dibujarse con CSS como un círculo de 16 px con fondo tinte claro de `#8ECAE6`, borde de 1 px `#8ECAE6` y letra «i» en IBM Plex Sans con peso 600 y color `#023047`, centrada y alineada verticalmente con el título del indicador. Al pasar el mouse o al enfocarlo con el teclado, el fondo DEBE pasar a `#8ECAE6`. Se conserva su función: muestra la fórmula del indicador en un tooltip, mantiene `role="img"` y `aria-label`, y DEBE poder enfocarse con el teclado mediante `tabindex="0"` para que la fórmula también sea accesible sin mouse. NO DEBEN cambiar los textos de los indicadores, las fórmulas, el modelo de datos, las claves `erp.*` ni los permisos, y NO DEBEN renumerarse los requisitos ni las tareas existentes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Panel del administrador sin datos financieros (HU1) (Priority: P1)

Como administrador, quiero que mi panel muestre solo información de nómina, porque no tengo acceso a los datos financieros. Este ajuste corrige el hueco detectado entre FR-012 y FR-013 de la spec 003.

**Why this priority**: es P1 porque corrige una contradicción de permisos: el panel del administrador hoy puede exponer resúmenes financieros que la matriz vigente le prohíbe ver.

**Independent Test**: con una sesión de administrador y datos financieros cargados en el navegador, se abre el Panel y se comprueba que no aparece ningún resumen ni indicador financiero, que aparecen las dos acciones de liquidación y que el resumen de nómina muestra las tres métricas solicitadas.

**Acceptance Scenarios**:

1. **Dado** un administrador con sesión iniciada, **cuando** abre el Panel, **entonces** ve un saludo, el mes actual, dos tarjetas destacadas con ícono («Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo») y un resumen de nómina.
2. **Dado** el Panel del administrador, **cuando** se revisa su contenido, **entonces** no aparece «Resumen financiero» ni «Indicadores financieros», incluidos saldo, deuda, caja, por cobrar, por pagar, facturas, terceros y vencidas.
3. **Dado** el resumen de nómina del administrador, **cuando** hay datos, **entonces** muestra cantidad de trabajadores con acceso, liquidaciones del mes actual y liquidaciones en estado borrador.
4. **Dado** el resumen de nómina del administrador, **cuando** alguna métrica no tiene datos, **entonces** muestra un estado vacío claro sin caer en cero engañoso ni en datos financieros.
5. **Dado** un administrador, **cuando** intenta abrir cualquier módulo financiero desde el Panel o desde la navegación, **entonces** la vista no se muestra y se aplica la redirección ya definida en la spec 003.

---

### User Story 2 - Indicadores de finanzas que comunican su estado (HU2) (Priority: P1)

Como usuario de finanzas, quiero ver de inmediato si hay un problema, con un único conjunto de indicadores que represente correctamente caja, cuentas por cobrar, cuentas por pagar y vencimientos.

**Why this priority**: es P1 porque sustituye indicadores ambiguos por señales claras de estado y evita interpretar erróneamente la deuda como una suma entre lo que nos deben y lo que debemos.

**Independent Test**: con datos de demostración que incluyan caja negativa y facturas vencidas, se entra como finanzas y se verifica que solo hay una fila de cuatro tarjetas, que «Deuda pendiente» no aparece, que los colores de estado siguen la paleta de la constitución v1.2.0 sin pares rojo/verde y que cada tarjeta abre su lista filtrada.

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre el Panel, **entonces** ve una sola fila de cuatro tarjetas: «Caja neta», «Por cobrar», «Por pagar» y «Facturas vencidas».
2. **Dado** el Panel anterior, **cuando** se comparan sus secciones, **entonces** «Resumen financiero» e «Indicadores financieros» aparecen fusionados en una sola sección, sin duplicar tarjetas.
3. **Dado** el conjunto de tarjetas, **cuando** se busca el indicador «Deuda pendiente (por cobrar + por pagar)», **entonces** no aparece en el Panel ni en ninguna otra vista derivada de esta funcionalidad.
4. **Dado** un valor de caja neta negativo, **cuando** se muestra la tarjeta, **entonces** el número usa `#A84F00` y el borde usa `#FB8500` o un tinte claro de `#FB8500`, sin usar rojo heredado.
5. **Dado** un número de facturas vencidas mayor que cero, **cuando** se muestra la tarjeta, **entonces** el número usa `#A84F00` y el borde usa `#FB8500` o un tinte claro de `#FB8500` para comunicar estado desfavorable o crítico, sin usar ámbar heredado.
6. **Dado** cada tarjeta, **cuando** se visualiza, **entonces** muestra la variación respecto al mes anterior con ▲ o ▼ y un porcentaje; el color indica si el cambio es favorable o desfavorable según el indicador, no el signo: en «Caja neta», sube = favorable (`#126782` sobre blanco o tinte claro de `#219EBC`) y baja = desfavorable (`#A84F00`); en «Por pagar» y «Facturas vencidas», sube = desfavorable (`#A84F00`) y baja = favorable (`#126782`); en «Por cobrar», neutro en ambos sentidos; sin cambio = neutro.
7. **Dado** cada tarjeta, **cuando** se lee su etiqueta, **entonces** la etiqueta contiene solo el nombre del indicador; la fórmula de cálculo está disponible en un tooltip señalado con un ícono dibujado con CSS como un círculo de 16 px con fondo tinte claro de `#8ECAE6`, borde de 1 px `#8ECAE6` y letra «i» en IBM Plex Sans con peso 600 y color `#023047`, centrada y alineada verticalmente con el título; al pasar el mouse o al enfocarlo con el teclado, el fondo pasa a `#8ECAE6`; el ícono conserva `role="img"`, `aria-label` y `tabindex="0"`, y no aparece como texto visible ni usa el carácter «ⓘ».
8. **Dado** el texto secundario de la sección, **cuando** se muestran los totales generales, **entonces** «Terceros» y «Facturas» aparecen como texto secundario, sin competir con las cuatro tarjetas.
9. **Dado** una tarjeta, **cuando** se activa, **entonces** abre la lista filtrada correspondiente: caja neta al Flujo de caja, por cobrar a facturas de venta, por pagar a facturas de compra y facturas vencidas al seguimiento de vencidas.
10. **Dado** un indicador sin información del mes anterior, **cuando** se muestra, **entonces** indica «sin dato anterior» en lugar de inventar una variación del 0 %.

---

### User Story 3 - Identidad visual común (HU6) (Priority: P1)

Como usuario del módulo, quiero reconocer siempre el mismo sistema, la misma tipografía y el mismo color de acento, para que el Panel y el resto de la aplicación se lean como un solo producto.

**Why this priority**: es P1 porque la identidad visual es transversal a todos los roles y porque el nombre del sistema y las iniciales del usuario son visibles en cada sesión.

**Independent Test**: con sesiones de administrador, finanzas y trabajador, se revisan barra superior, título de la pestaña, tipografía, colores, montos y círculo de perfil, y se comprueba que las mismas reglas se aplican en todos los roles.

**Acceptance Scenarios**:

1. **Dado** el módulo en cualquier vista, **cuando** se lee el nombre del sistema en la barra superior y en el título de la pestaña del navegador, **entonces** dice «Contabilidad y Finanzas» y no «Contabilidad y Finanzas: Facturación y Pagos».
2. **Dado** cualquier vista, **cuando** se revisa el color de acento, **entonces** se usa `#023047` en toda la aplicación para botones principales con texto blanco, enlaces, vista activa y tintes de acento; las sombras azules usan `#023047`, con fondo gris muy claro y tarjetas blancas, y `#0f62fe` no aparece.
3. **Dado** cualquier vista, **cuando** se revisa la tipografía, **entonces** toda la aplicación usa IBM Plex Sans incluida dentro del proyecto, sin depender de internet para cargarla.
4. **Dado** cualquier monto o tabla, **cuando** se visualizan cifras, **entonces** usan cifras de ancho fijo para que las columnas numéricas queden alineadas.
5. **Dado** un usuario con nombre y apellido, **cuando** se muestra el círculo de la esquina superior derecha, **entonces** muestra sus iniciales con fondo `#FFB703` y letra `#023047`, no las iniciales del título del sistema ni del módulo.
6. **Dado** un usuario sin nombre, **cuando** se muestra el círculo de la esquina superior derecha, **entonces** muestra la inicial de la etiqueta visible de su rol con fondo `#FFB703` y letra `#023047`.
7. **Dado** cualquier Panel, **cuando** se muestra su encabezado, **entonces** incluye un saludo y el mes actual.
8. **Dado** un administrador, **cuando** se revisan cabecera, saludo del Panel, círculo de perfil y selector de rol de Control de accesos, **entonces** el rol se muestra como «Recursos Humanos» con mayúscula inicial, la inicial del círculo es «R» y la clave interna `administrador` no aparece.
9. **Dado** cualquier rol con sesión iniciada, **cuando** se revisa la barra superior, **entonces** su fondo es `#023047` con texto e ícono ☰ en blanco, la etiqueta del rol usa fondo `#8ECAE6` con texto `#023047`, y los textos de la interfaz permanecen sin cambios.

---

### User Story 4 - Tendencia y alertas para finanzas (HU3) (Priority: P2)

Como usuario de finanzas, quiero ver la tendencia de ingresos y gastos junto con las alertas principales, para detectar problemas sin recorrer varias vistas.

**Why this priority**: es P2 porque mejora la comprensión del estado financiero, pero depende de que primero existan los indicadores corregidos de HU2.

**Independent Test**: con al menos seis meses de datos de demostración, se entra como finanzas y se verifica la presencia del gráfico, el bloque de alertas a su lado, los enlaces de cada alerta y la tabla de los últimos cinco movimientos con «Ver todos».

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre su Panel, **entonces** ve un gráfico de ingresos versus gastos de los últimos seis meses con barras de ingresos `#219EBC`, barras de gastos `#A84F00` y leyenda en texto, sin pares rojo/verde.
2. **Dado** el gráfico, **cuando** se revisa su ubicación, **entonces** el bloque de alertas aparece a su lado, no debajo ni en otra vista.
3. **Dado** un valor de caja negativo, **cuando** se muestra el bloque de alertas, **entonces** aparece una alerta crítica de caja negativa con texto `#A84F00`, borde `#FB8500` o tinte claro de `#FB8500` y enlace a su detalle.
4. **Dado** uno o más facturas vencidas, **cuando** se muestra el bloque de alertas, **entonces** aparece una alerta crítica de facturas vencidas con texto `#A84F00`, borde `#FB8500` o tinte claro de `#FB8500` y enlace a su detalle.
5. **Dado** la tabla de movimientos del Panel, **cuando** hay más de cinco movimientos, **entonces** muestra solo los cinco más recientes y ofrece el enlace «Ver todos».
6. **Dado** un usuario que no es de finanzas, **cuando** abre su Panel, **entonces** no ve el gráfico, las alertas financieras ni los movimientos restringidos por su rol.

---

### User Story 5 - Accesos rápidos compactos y guía inicial (HU4) (Priority: P2)

Como usuario del módulo, quiero accesos rápidos compactos y una guía descartable, para llegar a las acciones habituales sin que el Panel se sienta recargado.

**Why this priority**: es P2 porque reduce fricción y ruido visual, pero no bloquea la corrección de permisos ni de indicadores.

**Independent Test**: con sesiones de los tres roles, se abre el Panel, se descarta la guía y se comprueba que el banner desaparece; con sesión de finanzas se cuentan los accesos rápidos y se verifica que caben en una fila sin cortes de texto, y se abre el menú ☰ para comprobar que el subtítulo «Navegación» precede a las ocho opciones, que un separador las separa del título «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión», y que los menús de administrador y trabajador no cambian.

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre el Panel, **entonces** ve como máximo cuatro accesos rápidos: «Nueva factura de venta», «Nueva factura de compra», «Flujo de caja» y «Buscar».
2. **Dado** los accesos rápidos de finanzas, **cuando** se revisa su presentación, **entonces** son botones con borde, están en una sola fila al final del Panel y ninguna etiqueta se corta en dos líneas.
3. **Dado** el resto de acciones operativas de finanzas, **cuando** se abre el menú ☰ del Panel, **entonces** aparece primero el subtítulo «Navegación» con «Terceros», «Facturas de venta», «Facturas de compra», «Movimientos financieros», «Flujo de caja», «Seguimiento», «Liquidaciones de sueldo» y «Buscar» en ese orden; a continuación aparece un separador y el título «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión», igual que en los otros roles. «Registrar pago» se alcanza desde «Liquidaciones de sueldo», no se agregan accesos rápidos adicionales y los menús del administrador y del trabajador no cambian. El subtítulo y el separador reutilizan los estilos existentes del menú, sin introducir colores nuevos.
4. **Dado** cualquier rol con sesión iniciada, **cuando** abre el Panel, **entonces** ve arriba del Panel un banner descartable «¿Primera vez?» con acceso a la guía y estilo de mensaje informativo: fondo tinte de `#8ECAE6`, borde `#8ECAE6` y texto `#023047`.
5. **Dado** el banner «¿Primera vez?», **cuando** el usuario lo descarta, **entonces** deja de mostrarse en esa sesión sin afectar al resto de la navegación ni a otros roles.

---

### User Story 6 - Vista del trabajador clara (HU5) (Priority: P2)

Como trabajador, quiero entender mi liquidación de un vistazo, para reconocer de inmediato cuánto recibo, en qué período y cómo se compone.

**Why this priority**: es P2 porque la vista actual ya existe y la mejora es de claridad, no de acceso o integridad de datos.

**Independent Test**: con un trabajador que tiene una liquidación vigente con desglose e historial, se abre su vista y se comprueba el monto destacado, el período legible, la tabla condicional de desglose y el historial con montos en pesos chilenos.

**Acceptance Scenarios**:

1. **Dado** un trabajador con liquidación vigente, **cuando** abre su vista, **entonces** ve una tarjeta destacada con el monto líquido en grande, con signo `$` y separador de miles.
2. **Dado** el período de la liquidación, **cuando** se muestra en la vista del trabajador, **entonces** aparece en texto legible, por ejemplo «noviembre 2026», y no como `2026-11`.
3. **Dado** una liquidación con valores en sueldo base, descuentos o bonos, **cuando** se muestra el desglose, **entonces** aparece en una tabla con esos conceptos.
4. **Dado** una liquidación sin valores en el desglose, **cuando** se muestra la vista, **entonces** no se muestra la tabla y solo se muestra el monto destacado.
5. **Dado** un trabajador con pagos anteriores, **cuando** abre su vista, **entonces** ve debajo el historial de pagos con montos en `$`.
6. **Dado** un trabajador, **cuando** abre su Panel, **entonces** no ve indicadores financieros, gráfico de ingresos y gastos ni alertas de caja o vencimientos.
7. **Dado** un trabajador con pagos anteriores, **cuando** se muestra la fecha de pago y el historial en «Mi liquidación», **entonces** las fechas aparecen en DD-MM-AAAA y los montos usan el formato canónico de pesos chilenos del proyecto.

---

### User Story 7 - Gestión de liquidaciones clara para el administrador (HU7) (Priority: P2)

Como administrador, quiero que la vista «Gestionar liquidaciones de sueldo» siga la misma identidad visual y me evite errores al editar, para mantener las liquidaciones consistentes. Se agrega el 24-11-2026, tras la verificación manual de la spec, porque era la única vista del administrador con el estilo anterior.

**Why this priority**: es P2 porque no cambia permisos, pero evita datos inconsistentes (monto distinto del desglose) y elimina información interna sin valor para el usuario.

**Independent Test**: con una sesión de administrador y liquidaciones de demostración, se abre la vista, se comprueba la tabla legible, se pulsa «Editar», se cambia el desglose y se verifica que el monto líquido se recalcula y se guarda.

**Acceptance Scenarios**:

1. **Dado** la tabla de liquidaciones, **cuando** se muestra, **entonces** los períodos aparecen en texto legible, el monto líquido alineado a la derecha, el estado como etiqueta de color (Emitida con fondo `#FFB703` y texto `#023047`; Pagada con texto `#126782` y borde `#219EBC`) y la factura de compra como referencia legible («Compra LIQ-1»), nunca como identificador interno.
2. **Dado** la vista recién abierta, **cuando** no se ha pulsado «Editar», **entonces** el formulario de edición no se muestra.
3. **Dado** el formulario abierto, **cuando** se revisan sus campos, **entonces** solo contiene período, estado (lista de estados permitidos), sueldo base, bonos y descuentos; la fecha de pago aparece solo si el estado es «Pagada».
4. **Dado** un cambio en el desglose, **cuando** se edita, **entonces** el monto líquido se calcula como sueldo base + bonos − descuentos, se muestra sin poder editarse y se guarda en la liquidación y en su factura de compra; si el desglose está vacío se conserva el monto registrado.
5. **Dado** el estado «Pagada», **cuando** se guarda, **entonces** el monto pagado se registra igual al monto líquido.
6. **Dado** el formulario abierto, **cuando** se pulsa «Cancelar», **entonces** se cierra sin guardar.
7. **Dado** la vista «Gestionar liquidaciones de sueldo», **cuando** se muestra, **entonces** incluye una leyenda breve del ciclo: «Borrador (RRHH la prepara)», «Emitida (aprobada por RRHH)» y «Pagada (finanzas registró el pago)», sin cambiar los nombres de los estados.
8. **Dado** un trabajador con RUT ingresado sin puntos, **cuando** se muestra en los listados de liquidaciones, **entonces** aparece con puntos y guion, por ejemplo «15.432.876-9», sin cambiar su almacenamiento normalizado.

---

### Edge Cases

- ¿Qué pasa si el administrador tiene datos financieros guardados en el navegador? No se muestran en su Panel: la ausencia de acceso prevalece sobre la existencia de datos.
- ¿Qué pasa si no hay trabajadores con acceso, liquidaciones del mes actual ni liquidaciones en borrador? El resumen de nómina muestra tres estados vacíos claros, sin sustituirlos por indicadores financieros.
- ¿Qué pasa si la caja neta es cero? Se muestra en neutro, sin `#A84F00` ni borde `#FB8500` de valor desfavorable.
- ¿Qué pasa si no hay facturas vencidas? La tarjeta de «Facturas vencidas» se muestra en neutro y no genera alerta crítica con `#A84F00` ni `#FB8500`.
- ¿Qué pasa si falta el mes anterior para calcular una variación? Se muestra «sin dato anterior»; no se muestra `0 %` ni se oculta la tarjeta.
- ¿Qué pasa si una tarjeta abre una lista filtrada vacía? Se muestra el estado vacío ya definido para esa lista, conservando el filtro aplicado.
- ¿Qué pasa si no hay movimientos recientes? La tabla muestra un estado vacío y el enlace «Ver todos» sigue llevando al listado completo.
- ¿Qué pasa si el usuario tiene un solo nombre? El círculo de perfil muestra la inicial de ese nombre.
- ¿Qué pasa si el usuario no tiene nombre cargado? El círculo de perfil muestra la inicial de la etiqueta visible de su rol.
- ¿Qué pasa si una etiqueta de acceso rápido es extensa? Se conserva en una sola línea sin corte; no se reduce a dos líneas.
- ¿Qué pasa si finanzas necesita «Registrar pago»? Se accede desde «Liquidaciones de sueldo» en la sección de navegación del menú ☰, sin cambiar la matriz de permisos ni sumar un acceso rápido.
- ¿Qué pasa si un rol distinto de finanzas abre el menú ☰? El administrador y el trabajador conservan el título «Utilidades & Sesión», sus opciones y el separador actuales; no aparece el subtítulo «Navegación» ni la sección de ocho vistas.
- ¿Qué pasa si la guía ya fue descartada y se recarga la vista dentro de la misma sesión? Sigue oculta durante esa sesión.
- ¿Qué pasa si el desglose de la liquidación del trabajador está vacío? Se omite la tabla y se mantiene solo el monto líquido destacado.
- ¿Qué pasa si un monto es negativo? Se muestra con signo `$`, separador de miles, texto `#A84F00` y borde `#FB8500` o tinte claro de `#FB8500` para valor desfavorable o crítico.
- ¿Qué pasa si una fecha aparece como texto en listas, movimientos, flujo de caja, Mi liquidación o gestión de liquidaciones? Se muestra en DD-MM-AAAA; los campos de entrada y el almacenamiento conservan AAAA-MM-DD.
- ¿Qué pasa si un dato guardado contiene `doc_`, `ent_`, `set_` o un nombre de campo como `salesOrderId`? La vista no lo muestra: usa etiquetas legibles, referencias de documento y el nombre del tercero.
- ¿Qué pasa si el RUT se ingresó sin puntos? Se muestra con puntos y guion en todas las vistas, incluidos Control de accesos y los listados de liquidaciones, sin cambiar el valor normalizado guardado.
- ¿Qué pasa si la vista se abre en un celular de 390 px? La página no tiene desbordamiento horizontal; las tablas anchas se desplazan dentro de su contenedor.

## Requirements *(mandatory)*

### Functional Requirements

**Alcance y matriz de permisos**

- **FR-001**: La funcionalidad DEBE respetar la matriz de permisos vigente de `003-payroll-tabs-roles` para los roles administrador, finanzas y trabajador.
- **FR-002**: Ningún panel DEBE mostrar datos ni accesos de un módulo al que el rol no tenga acceso; en particular, el trabajador NO DEBE ver indicadores, gráfico ni alertas, y el administrador NO DEBE ver datos financieros.
- **FR-003**: Esta funcionalidad NO DEBE modificar las especificaciones 001, 002 ni 003, la matriz de permisos vigente, el modelo de datos existente ni las claves erp.*.
- **FR-004**: Los cambios DEBEN limitarse a contenido del Panel, navegación del menú ☰, presentación visual que aplique la paleta de la constitución v1.2.0 y cobertura automatizada derivada de esta especificación. NO DEBEN cambiar el modelo de datos, las claves `erp.*`, los permisos por rol ni los textos de la interfaz.
- **FR-005**: Los indicadores principales del Panel de finanzas DEBEN ser visibles sin hacer scroll en una ventana de 1366x768.

**Panel del administrador**

- **FR-006**: El Panel del administrador DEBE mostrar un saludo y el mes actual.
- **FR-007**: El Panel del administrador NO DEBE mostrar «Resumen financiero» ni «Indicadores financieros», incluidos saldo, deuda, caja, por cobrar, por pagar, facturas, terceros y vencidas.
- **FR-008**: El Panel del administrador DEBE mostrar dos tarjetas destacadas con ícono: «Crear liquidación de sueldo» y «Gestionar liquidaciones de sueldo».
- **FR-009**: El Panel del administrador DEBE mostrar un resumen de nómina con cantidad de trabajadores con acceso, liquidaciones del mes actual y liquidaciones en estado borrador.
- **FR-010**: El resumen de nómina DEBE mostrar estados vacíos claros cuando no haya datos para alguna de sus tres métricas, sin recurrir a datos financieros.

**Indicadores de finanzas**

- **FR-011**: El Panel de finanzas DEBE presentar en una sola fila cuatro tarjetas: «Caja neta», «Por cobrar», «Por pagar» y «Facturas vencidas».
- **FR-012**: Las secciones «Resumen financiero» e «Indicadores financieros» DEBEN quedar fusionadas en una sola sección, sin duplicar tarjetas.
- **FR-013**: El indicador «Deuda pendiente (por cobrar + por pagar)» DEBE eliminarse del Panel y de cualquier otra vista derivada de esta funcionalidad.
- **FR-014**: Cuando la caja neta sea negativa, el número de su tarjeta DEBE usar `#A84F00` y el borde DEBE usar `#FB8500` o un tinte claro de `#FB8500`, sin usar rojo heredado.
- **FR-015**: Cuando el número de facturas vencidas sea mayor que cero, el número de su tarjeta DEBE usar `#A84F00` y el borde DEBE usar `#FB8500` o un tinte claro de `#FB8500` para comunicar estado desfavorable o crítico, sin usar ámbar heredado.
- **FR-016**: Cada tarjeta DEBE mostrar la variación respecto al mes anterior con ▲ o ▼ y un porcentaje; el color DEBE indicar si el cambio es favorable o desfavorable según el indicador, no el signo: «Caja neta» DEBE usar texto `#126782` sobre blanco o tinte claro de `#219EBC` cuando sube y texto `#A84F00` cuando baja; «Por pagar» y «Facturas vencidas» DEBEN usar texto `#A84F00` cuando suben y texto `#126782` cuando bajan; «Por cobrar» DEBE usar neutro en ambos sentidos; sin cambio DEBE usar neutro.
- **FR-017**: Cuando no exista información del mes anterior, la tarjeta DEBE indicar «sin dato anterior» en lugar de mostrar una variación calculada.
- **FR-018**: Las etiquetas visibles de las tarjetas DEBEN contener solo el nombre del indicador; la fórmula de cálculo DEBE mostrarse únicamente en un tooltip señalado con un ícono dibujado con CSS, no con el carácter de texto «ⓘ». El ícono DEBE ser un círculo de 16 px con fondo tinte claro de `#8ECAE6`, borde de 1 px `#8ECAE6` y letra «i» en IBM Plex Sans con peso 600 y color `#023047`, centrada y alineada verticalmente con el título del indicador; al pasar el mouse o al enfocarlo con el teclado, el fondo DEBE pasar a `#8ECAE6`. El ícono DEBE conservar `role="img"` y `aria-label` y DEBE poder enfocarse con el teclado mediante `tabindex="0"` para que la fórmula también sea accesible sin mouse.
- **FR-019**: Los totales generales de «Terceros» y «Facturas» DEBEN mostrarse como texto secundario dentro de la sección de indicadores.
- **FR-020**: Cada tarjeta DEBE ser clicable y llevar a su lista filtrada: caja neta al Flujo de caja, por cobrar a facturas de venta, por pagar a facturas de compra y facturas vencidas al seguimiento de vencidas.

**Tendencia, alertas y movimientos**

- **FR-021**: El Panel de finanzas DEBE incluir un gráfico de ingresos versus gastos de los últimos seis meses, con barras de ingresos `#219EBC`, barras de gastos `#A84F00` y leyenda en texto; NO DEBE usar el par rojo/verde.
- **FR-022**: El bloque de alertas DEBE ubicarse al lado del gráfico, en la misma fila visual cuando el ancho lo permita.
- **FR-023**: El bloque de alertas DEBE incluir alertas de caja negativa y de facturas vencidas cuando sus condiciones se cumplan; como alertas críticas, DEBEN usar texto `#A84F00` y borde `#FB8500` o tinte claro de `#FB8500`, conservando texto, ícono o flecha de estado.
- **FR-024**: Cada alerta DEBE incluir un enlace a su detalle correspondiente.
- **FR-025**: El Panel de finanzas DEBE mostrar una tabla con los últimos cinco movimientos y un enlace «Ver todos» hacia el listado completo.

**Accesos rápidos y guía inicial**

- **FR-026**: El Panel de finanzas DEBE mostrar como máximo cuatro accesos rápidos: «Nueva factura de venta», «Nueva factura de compra», «Flujo de caja» y «Buscar».
- **FR-027**: Los accesos rápidos de finanzas DEBEN presentarse como botones con borde, en una sola fila al final del Panel, sin que ninguna etiqueta se corte en dos líneas.
- **FR-028**: El menú ☰ del Panel de finanzas DEBE mostrar primero el subtítulo «Navegación» con «Terceros», «Facturas de venta», «Facturas de compra», «Movimientos financieros», «Flujo de caja», «Seguimiento», «Liquidaciones de sueldo» y «Buscar» en ese orden; DEBE incluir a continuación un separador y el título «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión», igual que en los otros roles. «Registrar pago» DEBE alcanzarse desde «Liquidaciones de sueldo». El subtítulo y el separador DEBEN reutilizar los estilos existentes del menú sin introducir colores nuevos. El resto de acciones operativas NO DEBEN agregarse como accesos rápidos adicionales y los menús del administrador y del trabajador NO DEBEN cambiar.
- **FR-029**: Para todos los roles con sesión iniciada, el Panel DEBE mostrar arriba un banner descartable «¿Primera vez?» que dé acceso a la guía de uso, con fondo tinte de `#8ECAE6`, borde `#8ECAE6` y texto `#023047`.
- **FR-030**: Al descartar el banner «¿Primera vez?», este DEBE dejar de mostrarse durante la sesión actual sin afectar la navegación ni a otros roles.

**Vista del trabajador**

- **FR-031**: La vista del trabajador DEBE mostrar una tarjeta destacada con el monto líquido en grande, con signo `$` y separador de miles.
- **FR-032**: El período de la liquidación del trabajador DEBE mostrarse en texto legible, por ejemplo «noviembre 2026», y NO DEBE mostrarse como `2026-11`.
- **FR-033**: El desglose con sueldo base, descuentos y bonos DEBE mostrarse en una tabla solo si al menos uno de esos conceptos tiene valor.
- **FR-034**: Si el desglose no tiene valores, la vista del trabajador DEBE mostrar solo el monto líquido destacado, sin tabla vacía.
- **FR-035**: El historial de pagos DEBE ubicarse debajo del monto destacado y DEBE mostrar cada monto con signo `$`.
- **FR-036**: La vista del trabajador NO DEBE incluir indicadores financieros, gráfico de ingresos y gastos ni alertas de caja o facturas vencidas.

**Identidad visual y formato**

- **FR-037**: El nombre del sistema DEBE ser «Contabilidad y Finanzas» en la barra superior y en el título de la pestaña del navegador.
- **FR-038**: La identidad visual DEBE seguir la paleta «Refreshing Summer Fun» de la constitución v1.2.0: el acento `#0f62fe` en `src/styles.css` y `module-config.js` pasa a `#023047` para botones principales con texto blanco, enlaces, vista activa y tintes de acento, y las sombras azules usan `#023047`; el banner superior DEBE tener fondo `#023047` con texto e ícono ☰ blancos, la etiqueta del rol fondo `#8ECAE6` con texto `#023047` y el círculo de iniciales fondo `#FFB703` con letra `#023047`; los estados favorables DEBEN usar texto `#126782` sobre blanco o tinte claro de `#219EBC` y `#219EBC` en gráficos y bordes (Pagada, variación favorable, ingresos, totales de ingreso en Flujo de caja y Facturas de venta); los estados que requieren acción DEBEN usar fondo `#FFB703` o su tinte claro con texto `#023047` (Emitida, alertas y avisos de configuración); los estados desfavorables o críticos DEBEN usar texto y barras `#A84F00` y bordes `#FB8500` o tinte claro de `#FB8500` (Vencida, variación desfavorable, gastos, egresos, Facturas de compra, errores de formulario y alertas críticas); los mensajes informativos de ruta DEBEN usar fondo tinte de `#8ECAE6`, borde `#8ECAE6` y texto `#023047`; los grises neutros de fondo, tarjetas, texto, texto secundario y bordes y la tipografía IBM Plex Sans incluida localmente NO DEBEN cambiar; todo estado DEBE conservar texto, ícono o flecha `▲`/`▼`, con contraste mínimo de `4.5:1` para texto normal y `3:1` para textos grandes y elementos gráficos (WCAG 2.1 AA), verificado con simulación de protanopía, deuteranopía y tritanopía.
- **FR-039**: IBM Plex Sans DEBE usarse en toda la aplicación y DEBE estar incluida dentro del proyecto, sin depender de internet para cargarse.
- **FR-040**: Todos los montos y las columnas numéricas de tablas DEBEN usar cifras de ancho fijo.
- **FR-041**: El círculo de la esquina superior derecha DEBE mostrar las iniciales del nombre de la persona que inició sesión; si no tiene nombre, DEBE mostrar la inicial de la etiqueta visible de su rol: «R» para «Recursos Humanos». En ambos casos DEBE usar fondo `#FFB703` y letra `#023047`.
- **FR-042**: El círculo de la esquina superior derecha NO DEBE mostrar las iniciales del título del sistema ni del módulo.
- **FR-043**: Todos los montos visibles DEBEN mostrarse con el formato canónico de pesos chilenos del proyecto, con signo `$` y separador de miles; en tablas, los montos DEBEN alinearse a la derecha.
- **FR-044**: Los períodos DEBEN mostrarse en texto legible en todos los Paneles donde aparezcan.
- **FR-045**: Las fórmulas de cálculo DEBEN mostrarse en tooltips y NO DEBEN aparecer en las etiquetas visibles.

**Verificación automatizada**

- **FR-046**: La cobertura automatizada afectada DEBE actualizarse para reflejar el nuevo contenido de los Paneles por rol, la navegación y la configuración del módulo.
- **FR-047**: DEBEN agregarse pruebas automatizadas para: panel del administrador sin datos financieros, colores por estado de la constitución v1.2.0 con ausencia de `#0f62fe`, rojo, ámbar y verde heredados, ausencia del par rojo/verde en el gráfico «Ingresos vs Gastos», contraste de texto `4.5:1` y de gráficos `3:1`, eliminación de «Deuda pendiente», nombre del sistema e iniciales del usuario, y presencia y orden de las ocho opciones del menú ☰ de finanzas bajo «Navegación», con separador y título «Utilidades & Sesión».

**Gestión de liquidaciones (HU7)**

- **FR-048**: La tabla de «Gestionar liquidaciones de sueldo» DEBE mostrar períodos legibles, fechas en DD-MM-AAAA, RUT con puntos y guion, montos alineados a la derecha, el estado como etiqueta de color (Emitida con fondo `#FFB703` y texto `#023047`; Pagada con texto `#126782` y borde `#219EBC`) y la factura de compra como referencia legible, sin identificadores internos visibles; los errores de formulario DEBEN usar texto `#A84F00` y borde `#FB8500` o tinte claro de `#FB8500`.
- **FR-049**: El formulario de edición DEBE mostrarse solo después de pulsar «Editar» y DEBE poder cerrarse con «Cancelar» sin guardar.
- **FR-050**: El formulario DEBE limitarse a período, estado (lista), sueldo base, bonos y descuentos; la fecha de pago DEBE mostrarse solo con estado «Pagada».
- **FR-051**: El monto líquido DEBE calcularse como sueldo base + bonos − descuentos y NO DEBE editarse a mano; si el desglose está vacío se conserva el monto registrado.
- **FR-052**: Con estado «Pagada», el monto pagado DEBE registrarse igual al monto líquido.

**Presentación consistente de datos visibles**

- **FR-053**: Toda fecha que se muestre como texto DEBE usar DD-MM-AAAA, incluidas las listas de Facturas de venta y de compra, Movimientos financieros, Flujo de caja, Mi liquidación y «Gestionar liquidaciones de sueldo»; los campos de entrada y el almacenamiento DEBEN conservar AAAA-MM-DD.
- **FR-054**: Todos los montos visibles DEBEN usar el formato canónico de pesos chilenos del proyecto (por ejemplo «$250.000»), incluidas las listas de Facturas de venta y de compra.
- **FR-055**: Ninguna vista DEBE mostrar identificadores internos con prefijos `doc_`, `ent_` o `set_` ni nombres internos de campos como `salesOrderId`.
- **FR-056**: Movimientos financieros DEBE mostrar el tipo con las mismas etiquetas que «Últimos movimientos» del Panel («Venta emitida», «Pago»), la referencia del documento como «Venta serie #folio» o «Compra serie #folio» y la orden de venta como «Orden de venta: PED-036».
- **FR-057**: Control de accesos DEBE mostrar el nombre del tercero en lugar de identificadores `ent_` y el RUT con puntos y guion.
- **FR-058**: Todo RUT visible DEBE usar puntos y guion (12.345.678-5), incluso si se ingresó sin puntos; el valor guardado DEBE continuar normalizado como hasta ahora.
- **FR-059**: El rol administrador DEBE mostrarse como «Recursos Humanos» en la cabecera («Rol: Recursos Humanos»), el saludo del Panel, la inicial del círculo y el selector de rol de Control de accesos; todos los roles visibles DEBEN usar mayúscula inicial y la clave interna `administrador` NO DEBE cambiar.
- **FR-060**: «Gestionar liquidaciones de sueldo» DEBE mostrar una leyenda breve del ciclo: «Borrador (RRHH la prepara)», «Emitida (aprobada por RRHH)» y «Pagada (finanzas registró el pago)», sin cambiar los nombres de los estados.
- **FR-061**: A 390 px de ancho, ninguna vista DEBE tener desborde horizontal de la página; las tablas anchas DEBEN desplazarse dentro de su contenedor.

### Key Entities

- **Perfil de sesión**: rol vigente, nombre opcional de la persona e iniciales derivadas que se muestran en el círculo de usuario. No se crea ni modifica un registro persistente nuevo.
- **Panel por rol**: conjunto de secciones, indicadores, acciones y textos que se muestran según la matriz de permisos de la spec 003. Es una vista derivada; no agrega almacenamiento.
- **Indicador financiero**: valor calculado en lectura para caja neta, por cobrar, por pagar y facturas vencidas, con variación mensual, tooltip de fórmula y estado de color de la paleta v1.2.0.
- **Liquidación de sueldo**: entidad ya existente con período, monto líquido y desglose de sueldo base, descuentos y bonos; esta funcionalidad solo cambia su presentación.
- **Movimiento financiero y factura**: entidades ya existentes que alimentan la tabla de últimos movimientos, el gráfico de tendencia y las listas filtradas de las tarjetas.
- **Acceso rápido, guía inicial y menú ☰**: elementos de navegación del Panel, gobernados por el rol y por el estado de descarte de la sesión; la sección «Navegación» del menú de finanzas y su separador son derivados de la misma vista; no modifican el modelo de datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las sesiones de prueba por rol muestra únicamente los datos y accesos permitidos por la matriz de la spec 003, con cero apariciones de módulos restringidos en capturas y recorridos de verificación, incluida la navegación del menú ☰.
- **SC-002**: El Panel del administrador contiene exactamente dos tarjetas destacadas de liquidación, tres métricas de nómina y cero indicadores financieros.
- **SC-003**: En una ventana de 1366x768, las cuatro tarjetas de indicadores de finanzas son visibles sin scroll en el 100 % de las verificaciones.
- **SC-004**: El 100 % de los montos visibles usa signo `$`, separador de miles y cifras de ancho fijo; el 100 % de las columnas de montos en tablas está alineada a la derecha.
- **SC-005**: El 100 % de los períodos visibles aparece en texto legible, con cero ocurrencias del formato `AAAA-MM` en los Paneles incluidos en esta funcionalidad.
- **SC-006**: No aparece ninguna etiqueta «Deuda pendiente» en el Panel de finanzas ni en las pruebas asociadas, y las cuatro fórmulas de los indicadores están disponibles en tooltip con el ícono de información accesible definido en FR-018, sin usar el carácter de texto «ⓘ».
- **SC-007**: En la vista del trabajador, el monto líquido es el elemento de mayor tamaño tipográfico y el período aparece en texto legible junto a él, verificado en el 100 % de los trabajadores de demostración.
- **SC-008**: Los cuatro accesos rápidos de finanzas caben en una sola fila sin cortes de texto en una ventana de 1366x768, con cero etiquetas partidas en dos líneas, y el menú ☰ de finanzas muestra el subtítulo «Navegación», exactamente ocho opciones en ese orden, un separador y el título «Utilidades & Sesión» con «Guía de uso» y «Cerrar sesión», sin modificar los menús de los otros roles ni introducir colores nuevos.
- **SC-009**: El nombre «Contabilidad y Finanzas» aparece en la barra superior y en el título de la pestaña en el 100 % de las vistas; el banner superior usa `#023047` con texto e ícono ☰ blancos, la etiqueta del rol usa `#8ECAE6` con texto `#023047`, el círculo de perfil usa `#FFB703` con letra `#023047` y el acento es `#023047` en el 100 % de las vistas, con cero apariciones de `#0f62fe`.
- **SC-010**: Todas las pruebas automatizadas del módulo pasan, incluidas las coberturas nuevas y actualizadas derivadas de esta especificación, con verificaciones explícitas de la paleta v1.2.0, la ausencia del par rojo/verde y los umbrales de contraste.
- **SC-011**: El 100 % de las fechas visibles como texto usa DD-MM-AAAA en las vistas afectadas, con cero cadenas AAAA-MM-DD en texto visible y sin cambios en campos de entrada ni almacenamiento.
- **SC-012**: El 100 % de los montos visibles usa el formato canónico de pesos chilenos del proyecto (por ejemplo «$250.000»), incluidas las listas de Facturas de venta y de compra, con cero valores crudos como «250000 CLP».
- **SC-013**: Ninguna vista muestra identificadores `doc_`, `ent_` o `set_` ni nombres internos de campos; Movimientos financieros muestra las etiquetas, referencias y orden de venta acordados, y Control de accesos muestra el nombre del tercero.
- **SC-014**: El 100 % de los RUT visibles usa puntos y guion, incluidos los ingresados sin puntos, y el 100 % de las apariciones del rol administrador dice «Recursos Humanos» con mayúscula inicial, sin cambios en la clave interna.
- **SC-015**: «Gestionar liquidaciones de sueldo» muestra la leyenda completa de Borrador, Emitida y Pagada en el 100 % de las verificaciones, conservando los nombres de los estados.
- **SC-016**: A 390 px de ancho, el 100 % de las vistas tiene cero desbordamiento horizontal de la página y las tablas anchas conservan el desplazamiento dentro de su contenedor.
- **SC-017**: El 100 % de los estados favorables, que requieren acción y desfavorables o críticos usa los colores definidos en la constitución v1.2.0, con cero usos de rojo, ámbar o verde heredados y cero pares rojo/verde en el gráfico «Ingresos vs Gastos».
- **SC-018**: El 100 % de los estados conserva texto, ícono o flecha `▲`/`▼` además del color; el 100 % del texto normal cumple contraste de `4.5:1` y el 100 % de los textos grandes y elementos gráficos cumple `3:1` (WCAG 2.1 AA), verificado con simulación de protanopía, deuteranopía y tritanopía.

## Assumptions

- La spec `003-payroll-tabs-roles` está implementada y su matriz de permisos es la fuente vigente; esta funcionalidad no la reescribe.
- El trabajo se realiza localmente en la rama `main`, sin crear ramas nuevas ni publicar cambios, según la convención ya registrada en el repositorio.
- «Mes actual» significa el mes calendario de la sesión; «últimos seis meses» significa los seis meses calendario consecutivos que terminan en el mes actual.
- «Mes anterior» significa el mes calendario inmediatamente anterior al mes de la sesión; si no hay datos para ese mes, se usa el texto «sin dato anterior».
- Las iniciales del usuario se derivan de la primera letra de su primer nombre y de la primera letra de su primer apellido; si solo tiene un nombre, se usa su inicial; si no tiene nombre, se usa la inicial de la etiqueta visible de su rol («R» para «Recursos Humanos»).
- La tarjeta «Caja neta» lleva al Flujo de caja, sin alternativa de movimientos financieros; el filtro se conserva al abrirla.
- «Texto secundario» significa jerarquía visual inferior dentro de la sección de indicadores, sin eliminar la información de totales de «Terceros» y «Facturas».
- El banner «¿Primera vez?» se descarta guardando el estado en `sessionStorage` del navegador: dura solo la sesión, se conserva al recargar la vista dentro de esa sesión y no modifica el modelo de datos.
- Los nombres concretos de pruebas automatizadas y la dependencia exacta que incorpora la tipografía al proyecto son detalles de implementación; se registrarán en las fases de planificación y tareas, no en esta especificación.
- Los espaciados, pesos tipográficos y estilo visual se definen aplicando la skill `frontend-design`, respetando la identidad y las reglas de color fijadas en la constitución v1.2.0 del proyecto.
- Los datos de demostración existentes se conservan; solo se ajustan si una prueba automatizada necesita un caso límite explícito.
