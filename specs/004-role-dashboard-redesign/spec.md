# Feature Specification: Rediseño visual de paneles por rol

**Feature Branch**: `main` (sin rama; trabajo local en `main`)

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Rediseño visual de los paneles por rol del módulo Contabilidad y Finanzas, según el feedback del profesor (hacerlo más atractivo e intuitivo y mejorar el panel de inicio). Depende de la spec 003-payroll-tabs-roles, ya implementada: respeta su matriz de permisos. HU1 a HU6: panel del administrador sin datos financieros; indicadores de finanzas con estado; tendencia y alertas; accesos rápidos compactos; vista del trabajador clara; identidad visual común."

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

**Independent Test**: con datos de demostración que incluyan caja negativa y facturas vencidas, se entra como finanzas y se verifica que solo hay una fila de cuatro tarjetas, que «Deuda pendiente» no aparece, que los colores de estado son correctos y que cada tarjeta abre su lista filtrada.

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre el Panel, **entonces** ve una sola fila de cuatro tarjetas: «Caja neta», «Por cobrar», «Por pagar» y «Facturas vencidas».
2. **Dado** el Panel anterior, **cuando** se comparan sus secciones, **entonces** «Resumen financiero» e «Indicadores financieros» aparecen fusionados en una sola sección, sin duplicar tarjetas.
3. **Dado** el conjunto de tarjetas, **cuando** se busca el indicador «Deuda pendiente (por cobrar + por pagar)», **entonces** no aparece en el Panel ni en ninguna otra vista derivada de esta funcionalidad.
4. **Dado** un valor de caja neta negativo, **cuando** se muestra la tarjeta, **entonces** el número y el borde de la tarjeta usan rojo.
5. **Dado** un número de facturas vencidas mayor que cero, **cuando** se muestra la tarjeta, **entonces** la tarjeta usa ámbar para comunicar que requiere acción.
6. **Dado** cada tarjeta, **cuando** se visualiza, **entonces** muestra la variación respecto al mes anterior con ▲ o ▼ y un porcentaje; el color indica si el cambio es favorable o desfavorable según el indicador, no el signo: en «Caja neta», sube = verde y baja = rojo; en «Por pagar» y «Facturas vencidas», sube = rojo y baja = verde; en «Por cobrar», neutro en ambos sentidos; sin cambio = neutro.
7. **Dado** cada tarjeta, **cuando** se lee su etiqueta, **entonces** la etiqueta contiene solo el nombre del indicador; la fórmula de cálculo está disponible en un tooltip señalado con el ícono ⓘ y no aparece como texto visible.
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
2. **Dado** cualquier vista, **cuando** se revisa el color de acento, **entonces** se mantiene `#0f62fe` en toda la aplicación, con fondo gris muy claro y tarjetas blancas.
3. **Dado** cualquier vista, **cuando** se revisa la tipografía, **entonces** toda la aplicación usa IBM Plex Sans incluida dentro del proyecto, sin depender de internet para cargarla.
4. **Dado** cualquier monto o tabla, **cuando** se visualizan cifras, **entonces** usan cifras de ancho fijo para que las columnas numéricas queden alineadas.
5. **Dado** un usuario con nombre y apellido, **cuando** se muestra el círculo de la esquina superior derecha, **entonces** muestra sus iniciales, no las iniciales del título del sistema ni del módulo.
6. **Dado** un usuario sin nombre, **cuando** se muestra el círculo de la esquina superior derecha, **entonces** muestra la inicial de su rol.
7. **Dado** cualquier Panel, **cuando** se muestra su encabezado, **entonces** incluye un saludo y el mes actual.

---

### User Story 4 - Tendencia y alertas para finanzas (HU3) (Priority: P2)

Como usuario de finanzas, quiero ver la tendencia de ingresos y gastos junto con las alertas principales, para detectar problemas sin recorrer varias vistas.

**Why this priority**: es P2 porque mejora la comprensión del estado financiero, pero depende de que primero existan los indicadores corregidos de HU2.

**Independent Test**: con al menos seis meses de datos de demostración, se entra como finanzas y se verifica la presencia del gráfico, el bloque de alertas a su lado, los enlaces de cada alerta y la tabla de los últimos cinco movimientos con «Ver todos».

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre su Panel, **entonces** ve un gráfico de ingresos versus gastos de los últimos seis meses.
2. **Dado** el gráfico, **cuando** se revisa su ubicación, **entonces** el bloque de alertas aparece a su lado, no debajo ni en otra vista.
3. **Dado** un valor de caja negativo, **cuando** se muestra el bloque de alertas, **entonces** aparece una alerta de caja negativa con enlace a su detalle.
4. **Dado** uno o más facturas vencidas, **cuando** se muestra el bloque de alertas, **entonces** aparece una alerta de facturas vencidas con enlace a su detalle.
5. **Dado** la tabla de movimientos del Panel, **cuando** hay más de cinco movimientos, **entonces** muestra solo los cinco más recientes y ofrece el enlace «Ver todos».
6. **Dado** un usuario que no es de finanzas, **cuando** abre su Panel, **entonces** no ve el gráfico, las alertas financieras ni los movimientos restringidos por su rol.

---

### User Story 5 - Accesos rápidos compactos y guía inicial (HU4) (Priority: P2)

Como usuario del módulo, quiero accesos rápidos compactos y una guía descartable, para llegar a las acciones habituales sin que el Panel se sienta recargado.

**Why this priority**: es P2 porque reduce fricción y ruido visual, pero no bloquea la corrección de permisos ni de indicadores.

**Independent Test**: con sesiones de los tres roles, se abre el Panel, se descarta la guía y se comprueba que el banner desaparece; con sesión de finanzas se cuentan los accesos rápidos y se verifica que caben en una fila sin cortes de texto.

**Acceptance Scenarios**:

1. **Dado** un usuario de finanzas, **cuando** abre el Panel, **entonces** ve como máximo cuatro accesos rápidos: «Nueva factura de venta», «Nueva factura de compra», «Flujo de caja» y «Buscar».
2. **Dado** los accesos rápidos de finanzas, **cuando** se revisa su presentación, **entonces** son botones con borde, están en una sola fila al final del Panel y ninguna etiqueta se corta en dos líneas.
3. **Dado** el resto de acciones operativas de finanzas, **cuando** se abre el menú, **entonces** siguen disponibles allí y no se agregan como accesos rápidos adicionales.
4. **Dado** cualquier rol con sesión iniciada, **cuando** abre el Panel, **entonces** ve arriba del Panel un banner descartable «¿Primera vez?» con acceso a la guía.
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

---

### Edge Cases

- ¿Qué pasa si el administrador tiene datos financieros guardados en el navegador? No se muestran en su Panel: la ausencia de acceso prevalece sobre la existencia de datos.
- ¿Qué pasa si no hay trabajadores con acceso, liquidaciones del mes actual ni liquidaciones en borrador? El resumen de nómina muestra tres estados vacíos claros, sin sustituirlos por indicadores financieros.
- ¿Qué pasa si la caja neta es cero? Se muestra en neutro, sin rojo de valor negativo.
- ¿Qué pasa si no hay facturas vencidas? La tarjeta de «Facturas vencidas» se muestra en neutro y no genera alerta ámbar.
- ¿Qué pasa si falta el mes anterior para calcular una variación? Se muestra «sin dato anterior»; no se muestra `0 %` ni se oculta la tarjeta.
- ¿Qué pasa si una tarjeta abre una lista filtrada vacía? Se muestra el estado vacío ya definido para esa lista, conservando el filtro aplicado.
- ¿Qué pasa si no hay movimientos recientes? La tabla muestra un estado vacío y el enlace «Ver todos» sigue llevando al listado completo.
- ¿Qué pasa si el usuario tiene un solo nombre? El círculo de perfil muestra la inicial de ese nombre.
- ¿Qué pasa si el usuario no tiene nombre cargado? El círculo de perfil muestra la inicial de su rol.
- ¿Qué pasa si una etiqueta de acceso rápido es extensa? Se conserva en una sola línea sin corte; no se reduce a dos líneas.
- ¿Qué pasa si la guía ya fue descartada y se recarga la vista dentro de la misma sesión? Sigue oculta durante esa sesión.
- ¿Qué pasa si el desglose de la liquidación del trabajador está vacío? Se omite la tabla y se mantiene solo el monto líquido destacado.
- ¿Qué pasa si un monto es negativo? Se muestra con signo `$`, separador de miles y el color rojo definido para valor negativo o crítico.

## Requirements *(mandatory)*

### Functional Requirements

**Alcance y matriz de permisos**

- **FR-001**: La funcionalidad DEBE respetar la matriz de permisos vigente de `003-payroll-tabs-roles` para los roles administrador, finanzas y trabajador.
- **FR-002**: Ningún panel DEBE mostrar datos ni accesos de un módulo al que el rol no tenga acceso; en particular, el trabajador NO DEBE ver indicadores, gráfico ni alertas, y el administrador NO DEBE ver datos financieros.
- **FR-003**: Esta funcionalidad NO DEBE modificar las especificaciones 001, 002 ni 003, ni el modelo de datos existente.
- **FR-004**: Los cambios DEBEN limitarse a contenido del Panel, presentación visual, identidad del sistema y cobertura automatizada derivada de esta especificación.
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
- **FR-014**: Cuando la caja neta sea negativa, el número y el borde de su tarjeta DEBEN usar rojo.
- **FR-015**: Cuando el número de facturas vencidas sea mayor que cero, su tarjeta DEBE usar ámbar para comunicar que requiere acción.
- **FR-016**: Cada tarjeta DEBE mostrar la variación respecto al mes anterior con ▲ o ▼ y un porcentaje; el color DEBE indicar si el cambio es favorable o desfavorable según el indicador, no el signo: «Caja neta» DEBE usar verde cuando sube y rojo cuando baja; «Por pagar» y «Facturas vencidas» DEBEN usar rojo cuando suben y verde cuando bajan; «Por cobrar» DEBE usar neutro en ambos sentidos; sin cambio DEBE usar neutro.
- **FR-017**: Cuando no exista información del mes anterior, la tarjeta DEBE indicar «sin dato anterior» en lugar de mostrar una variación calculada.
- **FR-018**: Las etiquetas visibles de las tarjetas DEBEN contener solo el nombre del indicador; la fórmula de cálculo DEBE mostrarse únicamente en un tooltip señalado con el ícono ⓘ.
- **FR-019**: Los totales generales de «Terceros» y «Facturas» DEBEN mostrarse como texto secundario dentro de la sección de indicadores.
- **FR-020**: Cada tarjeta DEBE ser clicable y llevar a su lista filtrada: caja neta al Flujo de caja, por cobrar a facturas de venta, por pagar a facturas de compra y facturas vencidas al seguimiento de vencidas.

**Tendencia, alertas y movimientos**

- **FR-021**: El Panel de finanzas DEBE incluir un gráfico de ingresos versus gastos de los últimos seis meses.
- **FR-022**: El bloque de alertas DEBE ubicarse al lado del gráfico, en la misma fila visual cuando el ancho lo permita.
- **FR-023**: El bloque de alertas DEBE incluir alertas de caja negativa y de facturas vencidas cuando sus condiciones se cumplan.
- **FR-024**: Cada alerta DEBE incluir un enlace a su detalle correspondiente.
- **FR-025**: El Panel de finanzas DEBE mostrar una tabla con los últimos cinco movimientos y un enlace «Ver todos» hacia el listado completo.

**Accesos rápidos y guía inicial**

- **FR-026**: El Panel de finanzas DEBE mostrar como máximo cuatro accesos rápidos: «Nueva factura de venta», «Nueva factura de compra», «Flujo de caja» y «Buscar».
- **FR-027**: Los accesos rápidos de finanzas DEBEN presentarse como botones con borde, en una sola fila al final del Panel, sin que ninguna etiqueta se corte en dos líneas.
- **FR-028**: El resto de acciones operativas DEBEN permanecer en el menú correspondiente y NO DEBEN agregarse como accesos rápidos adicionales.
- **FR-029**: Para todos los roles con sesión iniciada, el Panel DEBE mostrar arriba un banner descartable «¿Primera vez?» que dé acceso a la guía de uso.
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
- **FR-038**: El color de acento `#0f62fe` DEBE mantenerse en toda la aplicación, con fondo gris muy claro y tarjetas blancas.
- **FR-039**: IBM Plex Sans DEBE usarse en toda la aplicación y DEBE estar incluida dentro del proyecto, sin depender de internet para cargarse.
- **FR-040**: Todos los montos y las columnas numéricas de tablas DEBEN usar cifras de ancho fijo.
- **FR-041**: El círculo de la esquina superior derecha DEBE mostrar las iniciales del nombre de la persona que inició sesión; si no tiene nombre, DEBE mostrar la inicial de su rol.
- **FR-042**: El círculo de la esquina superior derecha NO DEBE mostrar las iniciales del título del sistema ni del módulo.
- **FR-043**: Todos los montos DEBEN mostrarse en pesos chilenos con signo `$` y separador de miles; en tablas, los montos DEBEN alinearse a la derecha.
- **FR-044**: Los períodos DEBEN mostrarse en texto legible en todos los Paneles donde aparezcan.
- **FR-045**: Las fórmulas de cálculo DEBEN mostrarse en tooltips y NO DEBEN aparecer en las etiquetas visibles.

**Verificación automatizada**

- **FR-046**: La cobertura automatizada afectada DEBE actualizarse para reflejar el nuevo contenido de los Paneles por rol, la navegación y la configuración del módulo.
- **FR-047**: DEBEN agregarse pruebas automatizadas para: panel del administrador sin datos financieros, colores por estado, eliminación de «Deuda pendiente», nombre del sistema e iniciales del usuario.

### Key Entities

- **Perfil de sesión**: rol vigente, nombre opcional de la persona e iniciales derivadas que se muestran en el círculo de usuario. No se crea ni modifica un registro persistente nuevo.
- **Panel por rol**: conjunto de secciones, indicadores, acciones y textos que se muestran según la matriz de permisos de la spec 003. Es una vista derivada; no agrega almacenamiento.
- **Indicador financiero**: valor calculado en lectura para caja neta, por cobrar, por pagar y facturas vencidas, con variación mensual, tooltip de fórmula y estado de color.
- **Liquidación de sueldo**: entidad ya existente con período, monto líquido y desglose de sueldo base, descuentos y bonos; esta funcionalidad solo cambia su presentación.
- **Movimiento financiero y factura**: entidades ya existentes que alimentan la tabla de últimos movimientos, el gráfico de tendencia y las listas filtradas de las tarjetas.
- **Acceso rápido y guía inicial**: elementos de navegación del Panel, gobernados por el rol y por el estado de descarte de la sesión; no modifican el modelo de datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las sesiones de prueba por rol muestra únicamente los datos y accesos permitidos por la matriz de la spec 003, con cero apariciones de módulos restringidos en capturas y recorridos de verificación.
- **SC-002**: El Panel del administrador contiene exactamente dos tarjetas destacadas de liquidación, tres métricas de nómina y cero indicadores financieros.
- **SC-003**: En una ventana de 1366x768, las cuatro tarjetas de indicadores de finanzas son visibles sin scroll en el 100 % de las verificaciones.
- **SC-004**: El 100 % de los montos visibles usa signo `$`, separador de miles y cifras de ancho fijo; el 100 % de las columnas de montos en tablas está alineada a la derecha.
- **SC-005**: El 100 % de los períodos visibles aparece en texto legible, con cero ocurrencias del formato `AAAA-MM` en los Paneles incluidos en esta funcionalidad.
- **SC-006**: No aparece ninguna etiqueta «Deuda pendiente» en el Panel de finanzas ni en las pruebas asociadas, y las cuatro fórmulas de los indicadores están disponibles en tooltip con ícono ⓘ.
- **SC-007**: En la vista del trabajador, el monto líquido es el elemento de mayor tamaño tipográfico y el período aparece en texto legible junto a él, verificado en el 100 % de los trabajadores de demostración.
- **SC-008**: Los cuatro accesos rápidos de finanzas caben en una sola fila sin cortes de texto en una ventana de 1366x768, con cero etiquetas partidas en dos líneas.
- **SC-009**: El nombre «Contabilidad y Finanzas» aparece en la barra superior y en el título de la pestaña en el 100 % de las vistas, y las iniciales del círculo de perfil son correctas en el 100 % de los usuarios de demostración probados.
- **SC-010**: Todas las pruebas automatizadas del módulo pasan, incluidas las coberturas nuevas y actualizadas derivadas de esta especificación.

## Assumptions

- La spec `003-payroll-tabs-roles` está implementada y su matriz de permisos es la fuente vigente; esta funcionalidad no la reescribe.
- El trabajo se realiza localmente en la rama `main`, sin crear ramas nuevas ni publicar cambios, según la convención ya registrada en el repositorio.
- «Mes actual» significa el mes calendario de la sesión; «últimos seis meses» significa los seis meses calendario consecutivos que terminan en el mes actual.
- «Mes anterior» significa el mes calendario inmediatamente anterior al mes de la sesión; si no hay datos para ese mes, se usa el texto «sin dato anterior».
- Las iniciales del usuario se derivan de la primera letra de su primer nombre y de la primera letra de su primer apellido; si solo tiene un nombre, se usa su inicial; si no tiene nombre, se usa la inicial de su rol.
- La tarjeta «Caja neta» lleva al Flujo de caja, sin alternativa de movimientos financieros; el filtro se conserva al abrirla.
- «Texto secundario» significa jerarquía visual inferior dentro de la sección de indicadores, sin eliminar la información de totales de «Terceros» y «Facturas».
- El banner «¿Primera vez?» se descarta guardando el estado en `sessionStorage` del navegador: dura solo la sesión, se conserva al recargar la vista dentro de esa sesión y no modifica el modelo de datos.
- Los nombres concretos de pruebas automatizadas y la dependencia exacta que incorpora la tipografía al proyecto son detalles de implementación; se registrarán en las fases de planificación y tareas, no en esta especificación.
- Los espaciados, pesos tipográficos y estilo visual se definen aplicando la skill `frontend-design`, respetando la identidad y las reglas de color ya fijadas en la constitución del proyecto.
- Los datos de demostración existentes se conservan; solo se ajustan si una prueba automatizada necesita un caso límite explícito.
