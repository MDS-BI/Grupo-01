# Investigación: Acceso a liquidaciones de sueldo por RUT y contraseña

**Rama**: `002-payroll-access-control` · **Fecha**: 2026-11-11 · **Revisado**: 2026-11-17 (seguridad y privacidad) · 2026-11-19 (`LiquidacionSueldo`, desglose e historial)
**Relacionado con**: `spec.md`, `plan.md`, `data-model.md` y `contracts/`

## 1. Normalización y validación del RUT

**Decisión.** Se reutiliza `isValidRutChileno` de `src/validation.js` para validar el dígito verificador y se agrega una función `normalizeRut` en `src/auth.js` que:
- elimina puntos, espacios y guiones;
- pasa la letra K a mayúscula;
- reconstruye la forma canónica `CUERPO-DV` sin puntos (por ejemplo, `12345678-5`);
- rechaza cuerpos de menos de 7 o más de 8 dígitos.

La comparación de accesos se hace siempre con la forma canónica. La visualización puede usar el formato con puntos.

**Justificación.** El módulo ya valida RUT chilenos en `validation.js`; reutilizarlo evita dos reglas distintas. La forma canónica elimina rechazos por puntos, espacios o mayúsculas sin relajar la validación del dígito verificador.

**Alternativas consideradas.**
- Comparar el texto tal como se ingresa: rechaza variantes legítimas del mismo RUT.
- Guardar solo el cuerpo sin dígito verificador: impide validar el RUT y pierde información.
- Usar una librería externa de RUT: agrega una dependencia innecesaria para una regla ya implementada.

## 2. Contraseña inicial

**Decisión.** La contraseña inicial son los primeros 4 dígitos del cuerpo del RUT, sin puntos ni dígito verificador. Ejemplo: `12.345.678-5` → `1234`. La regla se aplica al crear un acceso de trabajador o de administrador y al restablecer la contraseña. El sistema verifica que la contraseña guardada coincida exactamente con esos 4 dígitos al crear el acceso.

**Justificación.** Es la regla explícita del usuario y es fácil de explicar en la demostración. No se exige cambio obligatorio en el primer ingreso porque el usuario no lo pidió y el MVP no tiene backend.

**Alternativas consideradas.**
- Contraseña aleatoria generada por el sistema: más segura en teoría, pero incumple la regla pedida y complica la demostración.
- Contraseña igual al RUT completo: más larga, pero no es lo solicitado.
- Forzar cambio en el primer ingreso: agrega un flujo no pedido y una pantalla adicional.

**Riesgo documentado.** La contraseña se guarda en `localStorage` sin cifrado y el MVP no ofrece cambio de contraseña: cualquier persona que conozca el RUT de otra persona puede iniciar sesión como ella. El control de acceso es solo de interfaz y no debe usarse con datos reales. Se documenta como riesgo conocido en `README.md`, en la sección «Manejo de riesgos de datos y sesgos» de `spec.md` y en la interfaz.

## 3. Entidad persistente `LiquidacionSueldo`

**Decisión.** Se crea la entidad persistente `LiquidacionSueldo`, guardada bajo la clave `erp.payrollSettlements` de `localStorage`; el esquema se mantiene en `2.0.0`. Sus campos son `settlementId`, `documentId` (FK a `PurchaseInvoice.document_id`), `entityId` del tercero personal, `periodo` (`YYYY-MM`), `sueldoBase`, `descuentos`, `bonos`, `monto`, `estado` (`Borrador` | `Emitida` | `Pagada`), `fechaPago`, `createdAt` y `updatedAt`.

La factura de compra vinculada sigue siendo el comprobante de pago. Los campos `estado`, `fechaPago` y `monto` de la liquidación son un espejo de la factura y se sincronizan al editarla; el desglose (`sueldoBase`, `descuentos` y `bonos`) se registra en la entidad. No se calculan haberes, descuentos legales, AFP, salud ni imponibilidad: los valores del desglose son los registrados por remuneraciones o por el administrador (rol absorbente del finanzas).

**Justificación.** El desglose necesita valores registrados explícitamente y el historial necesita liquidaciones identificables, no solo una proyección del estado actual de la factura. El vínculo por `documentId` conserva la trazabilidad con movimientos, seguimiento y la colección `erp.purchaseInvoices`, sin convertir la factura en el lugar donde se inventan los componentes del sueldo.

**Alternativas consideradas.**
- Reutilizar `customFields` de la factura de compra para el desglose: mezcla el comprobante de pago con datos de remuneraciones, pierde `settlementId` y hace ambiguo el historial cuando la factura cambia de estado; rechazada.
- No almacenar nada y proyectar la liquidación desde las facturas: el desglose no tendría valores registrados y el historial no existiría como conjunto explícito de liquidaciones; rechazada.
- Entidad independiente sin `documentId`: rompe la trazabilidad con el comprobante de pago y obliga a conciliar dos registros sin una clave común.
- Guardar la liquidación dentro del acceso de trabajador: mezcla credenciales con datos de negocio y complica edición, historial y backfill.

## 4. Última liquidación, desglose e historial de pagos

**Decisión.** La vista del trabajador muestra primero exactamente una liquidación completa, sin exigir que esté `Pagada`: se filtran las liquidaciones por `entityId` de la sesión, se ordenan por `periodo` descendente, se desempata por el `startDate` de la factura vinculada descendente y luego por `createdAt` descendente, y se toma la primera. Esa liquidación vigente muestra período, sueldo base, descuentos, bonos, monto, estado y fecha de pago; el desglose aparece solo aquí.

Los identificadores de la vista del trabajador son los existentes (`payroll-worker-title`, `payroll-worker-card`, `payroll-worker-period`, `payroll-worker-name`, `payroll-worker-rut`, `payroll-worker-amount`, `payroll-worker-status`, `payroll-worker-paid-at`, `payroll-worker-empty` y `payroll-worker-warning`) más `payroll-worker-base-salary`, `payroll-worker-discounts`, `payroll-worker-bonuses`, `payroll-worker-history` y `payroll-worker-history-empty`.

El historial incluye únicamente las liquidaciones del trabajador con `estado === 'Pagada' && fechaPago`. Se ordena por `fechaPago` descendente, con desempate por `periodo` descendente. Cada fila muestra fecha de pago, período, monto y estado; no repite sueldo base, descuentos ni bonos. No aparecen Borrador, Emitida, pagos parciales ni liquidaciones de otros trabajadores.

**Justificación.** «Una única liquidación» significa una única liquidación vigente en la cabecera de la vista, no la ausencia de historial. El criterio determinista de selección evita ambigüedad entre períodos y facturas emitidas el mismo día. Filtrar el historial por pago efectivo y ordenarlo por fecha de pago responde a la necesidad del trabajador de revisar su evolución sin exponer borradores ni datos ajenos.

**Alternativas consideradas.**
- Mostrar solo la liquidación vigente y dejar el historial para una etapa futura: incumple los escenarios actuales de la vista del trabajador; rechazada.
- Incluir todas las liquidaciones del trabajador en el historial: mostraría períodos aún no pagados como pagos; rechazada.
- Leer el historial directamente desde el estado de las facturas: no permite identificar cada liquidación ni conservar su desglose registrado; rechazada.
- Exigir `Pagada` para la liquidación vigente: ocultaría la liquidación actual mientras está en Borrador o Emitida; rechazada.
- Ordenar el historial por `createdAt` o por período: no refleja cuándo se efectuó el pago; rechazada.
- Repetir el desglose en cada fila: mezcla el detalle de la última liquidación con el resumen de pagos; rechazada.

## 5. Separación física de facturas

**Decisión.** Las facturas de venta y de compra se guardan en colecciones separadas:
- `erp.salesInvoices` para facturas de venta;
- `erp.purchaseInvoices` para facturas de compra, incluidos los comprobantes de pago de las liquidaciones a terceros personales; el desglose y el historial viven en `erp.payrollSettlements`;
- `erp.unclassifiedDocuments` para documentos legados sin `tipoFactura` detectados durante la migración.

Cada registro conserva `customFields.tipoFactura` como invariante y para compatibilidad con búsqueda, movimientos y exportaciones. `storage.js` expone una vista unificada (`loadDocuments`) para los cálculos que necesitan ambos tipos, pero las escrituras se dirigen a la colección correspondiente. La migración desde `erp.documents` se ejecuta una vez, es idempotente y eleva `erp.schemaVersion` a `2.0.0`.

**Justificación.** El usuario exige separación física y lógica/visual. Dos colecciones hacen imposible mezclar tipos por error y permiten que la vista de compra y la liquidación lean solo su colección. Mantener `tipoFactura` dentro del registro preserva compatibilidad y permite validar la invariante.

**Alternativas consideradas.**
- Una sola colección con filtro por `tipoFactura`: es la decisión de `001`, pero incumple el requisito explícito de separación física.
- Dos bases de datos o IndexedDB: sobredimensionado para el MVP y incompatible con el resto del almacenamiento.
- Duplicar todos los campos en dos esquemas: pierde la fábrica compartida y multiplica el mantenimiento.

**Migración.**
1. Si existe `erp.documents` y no existe la marca de migración, leer la colección.
2. Separar por `customFields.tipoFactura`.
3. Escribir en `erp.salesInvoices` y `erp.purchaseInvoices` sin duplicar registros ya presentes (comparar por `document_id`).
4. Enviar los documentos sin tipo a `erp.unclassifiedDocuments`.
5. Eliminar `erp.documents` solo después de escribir correctamente las nuevas colecciones.
6. Registrar `erp.schemaVersion = 2.0.0` y una marca `erp.migration.invoiceSplit = done`.
7. Si la migración falla, conservar la colección original y mostrar un aviso al administrador; no perder datos.

## 6. Sesión por pestaña

**Decisión.** La sesión se guarda en `sessionStorage` bajo `erp.session` con `{ accessId, role, entityId, startedAt }`. Al iniciar la aplicación se intenta recuperar la sesión; si existe y el acceso sigue activo y con el rol correcto, se entra directamente a la vista del rol. Al cerrar sesión se elimina la clave. Al cerrar la pestaña, el navegador limpia `sessionStorage` automáticamente.

**Justificación.** Cumple las dos formas de cierre pedidas: cerrar sesión y cerrar pestaña. `localStorage` haría que la sesión sobreviviera al cierre de pestaña, lo que incumple el requisito.

**Alternativas consideradas.**
- Sesión solo en memoria: se pierde al recargar y obliga a ingresar credenciales en cada recarga.
- `localStorage` con expiración: no distingue el cierre de pestaña y agrega lógica de tiempo no pedida.
- Cookies de sesión: no aportan seguridad real sin backend y complican las pruebas con jsdom.

## 7. Notificaciones al desarrollador

**Decisión.** Los rechazos por RUT inválido, inactivo, duplicado o con vínculo roto se registran en `erp.devNotifications` con `{ id, timestamp, accessId, role, reason, origin }`, y además se emiten con `console.error`. El administrador puede abrir un panel "Avisos para el desarrollador" para revisarlos. Las notificaciones no se muestran al trabajador.

**Justificación.** No hay backend ni servicio de monitoreo. Un registro local persistente y la consola son la forma más simple de "notificar al desarrollador" en un MVP frontend. El panel permite demostrar la funcionalidad sin herramientas externas.

**Alternativas consideradas.**
- Solo `console.error`: se pierde al recargar y no es visible para quien no abre la consola.
- Enviar a un servicio externo: requiere backend, credenciales y conectividad, fuera del alcance.
- Mostrar la notificación al usuario final: expone detalles técnicos y no es el destinatario correcto.

## 8. Guardas de rol y navegación

**Decisión.** `app.js` mantiene una función `resolveRoute(view, session)` que devuelve la vista permitida o la vista de acceso. `shell.js` recibe la sesión y muestra solo los módulos permitidos:
- **Administrador (RRHH)**: panel, terceros, facturas de venta, facturas de compra, liquidaciones, accesos, avisos, movimientos, seguimiento y búsqueda; absorbe en su función las operaciones que antes correspondían al rol `finanzas`.
- **Trabajador**: solo "Mi liquidación" y "Cerrar sesión". No ve datos de otros trabajadores ni de terceros.

No existe rol invitado ni sesión sin credenciales: cualquier vista distinta de `login` sin sesión válida redirige al acceso. Toda acción de edición, eliminación o administración verifica el rol antes de ejecutarse. Las vistas no permitidas se ocultan y, si se intenta navegar por código o por URL, se redirige a la vista permitida con un mensaje.

**Justificación.** Centralizar las guardas evita que cada componente repita la lógica y facilita las pruebas. La navegación por rol es parte de la experiencia de usuario y del requisito de no exponer datos.

**Alternativas consideradas.**
- Ocultar solo los botones: insuficiente, porque una llamada directa a la vista podría seguir mostrando datos.
- Duplicar guardas en cada componente: más código y más riesgo de inconsistencia.
- Un único rol con permisos amplios: incumple el feedback de privacidad, porque el trabajador no debe ver datos ajenos.

## 9. Datos de demostración

**Decisión.** La demostración incluye:
- Un administrador (RRHH): RUT `88.888.888-8`, contraseña `8888`.
- Dos trabajadores: RUT `22.222.222-2` / `2222` y `45.000.000-0` / `4500`.
- Terceros personales asociados y, para cada trabajador, una liquidación vigente con `sueldoBase`, `descuentos` y `bonos` registrados, además de al menos dos liquidaciones `Pagadas` con `fechaPago` distinta. Cada liquidación tiene su `documentId` vinculado a una factura de compra de ejemplo.
- Facturas de venta y de compra de ejemplo para demostrar la separación.

El RUT del administrador no coincide con el RUT de ningún tercero: se descarta `11.111.111-1` porque pertenece a un tercero proveedor. La carga se inicia desde el botón «Cargar demostración» de la pantalla de acceso, sin abrir vistas del módulo ni iniciar sesión. Es idempotente: si ya existen accesos, facturas o liquidaciones con el mismo `documentId`, no duplica y conserva lo existente. Siembra en `erp.payrollSettlements` y registra la marca de backfill cuando corresponda. Los RUT y contraseñas se documentan en `README.md`.

**Justificación.** Permite demostrar los dos roles, el desglose de la última liquidación y un historial con más de un pago ordenado por fecha. Los RUT son ficticios y válidos según el módulo 11; mantener el RUT del administrador distinto de los terceros evita confundir al personal de RRHH con un trabajador o proveedor.

**Alternativas consideradas.**
- Generar RUT aleatorios: dificulta la repetición de la demostración.
- Usar datos reales: prohibido por el alcance.
- Sembrar solo un administrador o una sola liquidación por trabajador: no permite demostrar la vista del trabajador, el desglose ni el historial; rechazada.
- Sembrar liquidaciones sin factura vinculada: rompe la trazabilidad por `documentId` y la sincronización de estado, monto y fecha de pago; rechazada.
- Cargar la demostración desde un panel sin sesión: reintroduce el modo invitado que el feedback de privacidad pide eliminar.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de facturas al migrar | Migración idempotente, respaldo en memoria y conservación de `erp.documents` si falla. Pruebas de migración con datos mixtos. |
| Contraseñas visibles en el navegador | Advertencia explícita en la interfaz y en `README.md`; prohibición de datos reales. |
| Sesión que sobrevive al cierre de pestaña | Uso de `sessionStorage`; prueba de integración que simula el cierre. |
| Acceso de trabajador a datos ajenos | Guardas centralizadas, filtrado por `entityId` y pruebas con dos trabajadores. |
| Documentos legados sin `tipoFactura` | Bandeja `erp.unclassifiedDocuments` y aviso al administrador; no se muestran como liquidación. |
| Duplicación de lógica entre vistas de factura | Fábricas compartidas `invoice-form.js` e `invoice-list.js` con configuración por tipo. |
| Desincronización entre factura y liquidación | `estado`, `fechaPago` y `monto` se sincronizan desde la factura vinculada al editar; se comprueba por `documentId` en las pruebas. |
| Backfill duplicado o con desglose inventado | Idempotencia por `documentId`, desglose predeterminado en `0` y marca `erp.migration.payrollSettlements`. |
| Historial incompleto o desordenado | Filtro `Pagada` con `fechaPago`, orden por fecha de pago y período descendentes, y verificación manual con dos trabajadores. |
| Rol incompatible | Validación explícita en el login y mensaje claro; no se registra como incidencia del desarrollador. |
| Riesgo conocido: contraseña inicial sin cambio | RUT y contraseña documentados como riesgo del MVP en `spec.md`, `README.md` y la interfaz; solo datos ficticios. |
| Riesgo conocido: control solo de interfaz | Guardas centralizadas y aviso explícito; no se promete seguridad real ni se usan datos reales. |
| RUT del administrador igual al de un tercero | RUT de demostración `88.888.888-8`, validado como distinto de todos los terceros en la carga idempotente. |

## 11. Acceso obligatorio y carga de demostración

**Decisión.** No existe modo invitado. La pantalla de acceso ofrece «Ingresar» y «Cargar demostración»; esta última siembra los datos ficticios y permanece en el acceso, sin crear sesión ni mostrar vistas de negocio. Toda vista del módulo exige una sesión válida de `administrador` o `trabajador`.

**Justificación.** Responde al feedback de privacidad: eliminar la puerta de entrada sin credenciales evita que cualquier persona vea información de terceros o trabajadores, y permite arrancar en un navegador vacío sin reintroducir el invitado por otro nombre.

**Alternativas consideradas.**
- Conservar «Continuar sin iniciar sesión»: permite ver datos sin autenticar y contradice la decisión del grupo.
- Crear un registro de arranque documentado: agrega una credencial fija adicional y más pasos para la demostración.
- Auto-cargar la demostración al abrir: oculta la acción al usuario y dificulta explicar el origen de los datos.

## 12. Backfill de liquidaciones desde facturas de compra

**Decisión.** Al abrir una versión con facturas de compra ya almacenadas, se ejecuta un backfill desde esas facturas hacia `erp.payrollSettlements`. Se consideran las facturas dirigidas a terceros de tipo personal; por cada `document_id` sin liquidación se crea un registro con `settlementId` propio, `entityId`, `periodo` desde `customFields.periodoLiquidacion`, `monto`, `estado` y `fechaPago` espejo de la factura. El desglose (`sueldoBase`, `descuentos`, `bonos`) se inicializa en `0` cuando no hay valores registrados. El proceso es idempotente por `documentId`: si ya existe liquidación para esa factura, se conserva y no se duplica. La marca de migración es `erp.migration.payrollSettlements` y `clearAll()` también la elimina, junto con las colecciones y el resto de marcas, para que un arranque posterior pueda repetir el backfill desde cero. El esquema sigue siendo `2.0.0`.

**Justificación.** El backfill permite que las facturas históricas sigan siendo visibles como liquidaciones sin perder la edición ya realizada en la entidad propia. Los valores `0` son explícitos y no inventan remuneraciones; la marca evita repetir el trabajo en cada carga, y limpiarla con `clearAll()` deja un estado coherente en navegadores vacíos y pruebas.

**Alternativas consideradas.**
- Reconstruir todas las liquidaciones en cada arranque: sobrescribiría el desglose registrado y los `updatedAt`; rechazada.
- Usar `settlementId` como única clave de idempotencia: no evita duplicados cuando el backfill se ejecuta dos veces sobre la misma factura; rechazada.
- Derivar `sueldoBase`, `descuentos` y `bonos` desde el total de la factura: inventaría datos de remuneración; rechazada.
- No registrar marca de migración: repetiría el backfill y dificultaría diagnosticar el estado del navegador; rechazada.

La verificación automatizada de estas decisiones se ejecuta con `npm run check` (ESLint, comprobación de formato con Prettier y `vitest run`).

## 13. Absorción del rol finanzas y alta de liquidaciones con RUT + nombre completo

**Decisión.** Se elimina el rol `finanzas` por completo del sistema y se absorbe en el rol `administrador`, que pasa a operar todas las vistas y funciones que antes correspondían a finanzas (panel, terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda), sin crear un rol nuevo paralelo. La creación de una liquidación de sueldo con RUT nuevo se registra directamente como settlement vinculado al RUT del trabajador: el sistema crea la entidad personal (Tercero) asociada, el acceso con rol `trabajador` y la contraseña inicial de los primeros 4 dígitos del cuerpo del RUT, y registra la liquidación con ese RUT.

**Justificación.** Las decisiones del usuario (clarificación Session 2026-11-23 del spec) unifican el rol operativo en `administrador` (RRHH) y simplifican el alta de remuneraciones a un solo flujo: el RUT identifica al trabajador/persona y el settlement se crea directamente, sin paso intermedio de factura de compra.

**Alternativas consideradas.**
- Mantener `finanzas` como valor reservado: no elimina la duplicidad operativa y deja ramas muertas en validación y navegación.
- Exigir factura de compra previa para el alta del settlement: complica el flujo y no fue aceptado por el usuario.
- Crear el acceso sin entidad personal: rompe la restricción de rol trabajador existente (entidad personal obligatoria).
- Mantener dos roles operativos (finanzas y administrador): contradice la decisión de absorción entregada por el usuario.
