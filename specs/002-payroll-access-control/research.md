# Investigación: Acceso a liquidaciones de sueldo por RUT y contraseña

**Rama**: `002-payroll-access-control` · **Fecha**: 2026-11-11
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

**Riesgo documentado.** La contraseña se guarda en `localStorage` sin cifrado. El control es de interfaz y no debe usarse con datos reales. Se documenta en `README.md` y en la interfaz.

## 3. Modelo de acceso sin entidad de liquidación

**Decisión.** No se crea una entidad `LiquidacionSueldo`. La liquidación es una proyección de una factura de compra a un tercero de tipo personal. El acceso de trabajador guarda `entityId` y el vínculo con la liquidación se resuelve por `entity_id`, `tipoFactura = compra` y `tipoTercero = personal`.

**Justificación.** Es la recomendación más reciente del usuario: crear otra entidad duplica el modelo, obliga a conciliar dos registros del mismo pago y rompe la trazabilidad con movimientos financieros y seguimiento. La factura de compra ya contiene período, monto, estado y fecha de pago.

**Alternativas consideradas.**
- Entidad `LiquidacionSueldo` independiente: duplica datos y requiere sincronización con la factura.
- Entidad que referencia una factura: agrega una tabla puente sin valor en el MVP.
- Guardar la liquidación dentro del acceso: mezcla credenciales con datos de negocio y complica la edición.

## 4. Una única liquidación por trabajador

**Decisión.** La vista del trabajador muestra exactamente una liquidación: la del período más reciente (`periodoLiquidacion` en formato `YYYY-MM`) de su tercero personal. Si hay empate, se usa la fecha de emisión (`startDate`) más reciente y, si persiste, la fecha de creación (`createdAt`) más reciente. El administrador puede editar cualquier liquidación; el trabajador siempre ve la vigente.

**Justificación.** El usuario pidió "una única liquidación". Un criterio determinista evita ambigüedad sin agregar un campo de vínculo ni una tabla nueva. El período es el criterio natural del dominio de remuneraciones.

**Alternativas consideradas.**
- Mostrar todas las liquidaciones del trabajador: incumple "una única".
- Agregar `settlementId` al acceso: permite un vínculo explícito, pero complica la creación cuando la liquidación aún no existe y duplica la fuente de verdad.
- Usar solo `createdAt`: no refleja el período de remuneración.

## 5. Separación física de facturas

**Decisión.** Las facturas de venta y de compra se guardan en colecciones separadas:
- `erp.salesInvoices` para facturas de venta;
- `erp.purchaseInvoices` para facturas de compra (incluidas las liquidaciones);
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
- **Administrador**: panel, terceros, facturas de venta, facturas de compra, liquidaciones, accesos, avisos, movimientos, seguimiento y búsqueda.
- **Trabajador**: solo "Mi liquidación" y "Cerrar sesión".

Toda acción de edición, eliminación o administración verifica el rol antes de ejecutarse. Las vistas no permitidas se ocultan y, si se intenta navegar por código o por URL, se redirige a la vista permitida con un mensaje.

**Justificación.** Centralizar las guardas evita que cada componente repita la lógica y facilita las pruebas. La navegación por rol es parte de la experiencia de usuario y del requisito de no exponer datos.

**Alternativas consideradas.**
- Ocultar solo los botones: insuficiente, porque una llamada directa a la vista podría seguir mostrando datos.
- Duplicar guardas en cada componente: más código y más riesgo de inconsistencia.

## 9. Datos de demostración

**Decisión.** La demostración incluye:
- Un administrador: RUT `11.111.111-1`, contraseña `1111`.
- Dos trabajadores: RUT `22.222.222-2` / `2222` y `45.000.000-5` / `4500`.
- Terceros personales asociados y una liquidación por trabajador, con períodos `2026-09` y `2026-10`.
- Facturas de venta y de compra de ejemplo para demostrar la separación.

La carga es idempotente: si ya existen accesos o facturas, no duplica y conserva lo existente. Los RUT y contraseñas se documentan en `README.md`.

**Justificación.** Permite demostrar los dos roles y la separación sin datos reales. Los RUT son ficticios y válidos según el algoritmo chileno.

**Alternativas consideradas.**
- Generar RUT aleatorios: dificulta la repetición de la demostración.
- Usar datos reales: prohibido por el alcance.
- Sembrar solo un administrador: no permite demostrar la vista del trabajador.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de facturas al migrar | Migración idempotente, respaldo en memoria y conservación de `erp.documents` si falla. Pruebas de migración con datos mixtos. |
| Contraseñas visibles en el navegador | Advertencia explícita en la interfaz y en `README.md`; prohibición de datos reales. |
| Sesión que sobrevive al cierre de pestaña | Uso de `sessionStorage`; prueba de integración que simula el cierre. |
| Acceso de trabajador a datos ajenos | Guardas centralizadas, filtrado por `entityId` y pruebas con dos trabajadores. |
| Documentos legados sin `tipoFactura` | Bandeja `erp.unclassifiedDocuments` y aviso al administrador; no se muestran como liquidación. |
| Duplicación de lógica entre vistas de factura | Fábricas compartidas `invoice-form.js` e `invoice-list.js` con configuración por tipo. |
| Rol incompatible | Validación explícita en el login y mensaje claro; no se registra como incidencia del desarrollador. |
