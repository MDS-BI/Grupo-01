---

description: "Lista de tareas para el módulo de Contabilidad y Finanzas: Facturación y Pagos"
---

# Tareas: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Entrada**: Documentos de diseño en `/specs/001-erp-base-module/`

**Requisitos previos**: `plan.md`, `spec.md`, `data-model.md`, `contracts/entity-storage.md`

**Pruebas**: Se incluyen tareas de prueba porque la constitución del proyecto exige cubrir con pruebas automatizadas el comportamiento visible y la lógica de negocio.

**Organización**: Las tareas están agrupadas por historia de usuario (HU1 a HU7 del `spec.md`) para poder implementar y probar cada una de forma independiente. La Fase 11 agrupa la separación visual y funcional de facturas de la Revisión 4, transversal a HU2, HU3 y HU7.

> **Nota sobre la consolidación de la Revisión 3 (2026-11-05).** Esta corrida de `speckit.tasks` consolida los requisitos de la Revisión 3 del spec sin eliminar las tareas existentes ni renumerarlas (T001 a T052 conservan su ID porque están referenciados desde `plan.md` y tienen estado registrado). Las tareas nuevas se numeran T053 a T070 y se insertan en su fase correspondiente, aunque su número sea mayor que el de tareas posteriores. Lo incorporado: `personal` en `tipoTercero`; facturas de venta y de compra como documentos separados con listados propios (FR-006); `salesOrderId` (FR-009); centro de costo (FR-014); período de liquidación (FR-015); movimientos financieros auto-generados de solo lectura con granularidad de un movimiento por evento (FR-017 a FR-019, SC-006); y la HU7 de arquitectura de UI (FR-020 a FR-022). Además, el análisis `/speckit.analyze` del 05-11-2026 remedió sus hallazgos: T068 (tabla de cobertura de plan.md, hallazgo I1), T070 (medición del presupuesto de rendimiento, hallazgo C2) y el registro de la desviación e2e en plan.md (hallazgo C1); el total es 70 tareas (T001 a T070).

> **Nota sobre la separación de facturas de la Revisión 4 (2026-11-11).** Esta corrida de `speckit.tasks` agrega la separación visual y funcional de facturas decidida en el clarify del 2026-11-11 (`spec.md`, FR-006 y FR-020) sin renumerar las tareas existentes. Las tareas nuevas se numeran T071 a T078; T071–T077 forman la Fase 11 (transversal a HU2, HU3 y HU7) y T078 se suma al cierre documental de la Fase 10. Lo incorporado: dos vistas independientes (`#view-invoice-sale` y `#view-invoice-purchase`), dos formularios y dos listados con columnas propias, tipo de factura fijo por vista, menú sin la vista genérica de documentos y estilos distintivos. El almacenamiento no cambia: sigue siendo `erp.documents` con `customFields.tipoFactura`. El total pasa a 78 tareas (T001 a T078).

> **Nota sobre cómo se generó.** Este archivo se armó siguiendo las reglas de `speckit.tasks` (formato, fases y orden), a partir del `spec.md`, el `plan.md` y el `data-model.md` actuales. `speckit.analyze` se ejecutó el 02-11-2026 (Mauro) y otra vez el 03-11-2026 (Jaime). Sus propuestas siguen pendientes de revisar; el `speckit.clarify` se completó el 05-11-2026 (ver nota de Revisión 3 más abajo). Las tareas marcadas **(depende de aclaración)** restantes quedan provisionales hasta su revisión.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias)
- **[HUn]**: historia de usuario a la que pertenece la tarea (HU1 a HU7)
- Cada tarea incluye la ruta exacta del archivo

## Convención de rutas

Proyecto único (Vite + JavaScript vanilla), según `plan.md`: `src/` y `tests/` en la raíz del repositorio.

## Asignación de historias de usuario

Cada integrante se hace cargo de una historia: sube su historia al `spec.md`, la refina y lidera sus tareas.

| Historia | Prioridad | Responsable |
|---|---|---|
| HU1 Registrar terceros | P1 | Jaime |
| HU2 Emitir facturas de venta | P1 | Carolina |
| HU3 Registrar facturas de compra | P1 | Matías |
| HU4 Registrar el pago y marcar Pagada | P2 | Javier |
| HU5 Ver deuda por tercero y vencidas | P2 | Elías |
| HU6 Datos de demostración y otros módulos | P3 | Mauro |
| HU7 Arquitectura de UI: home con KPIs y menú desacoplado | P1 (transversal) | Por asignar (coordinación: equipo) |

**Revisión 4 (separación de facturas)**: transversal a HU2 (formulario y listado de venta), HU3 (formulario y listado de compra) y HU7 (vistas, menú y estilos). Responsable por asignar entre Carolina, Matías y quien coordine HU7; conviene que una sola persona ejecute T071–T077 para evitar conflictos en `index.html`, `src/app.js` y `src/module-config.js`.

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: dejar el módulo base funcionando antes de modificarlo.

- [x] T001 Verificar que `src/` e `index.html` del módulo base estén en el repositorio; si faltan, obtenerlos desde el template `MDS-BI/Speckit_Template` (hecho el 03-11-2026: se copiaron `src/`, `index.html`, `tests/setup/` y las pruebas actuales del template, en un commit aparte)
- [x] T002 Ejecutar `npm install` y `npm run dev` en la raíz del repositorio, y comprobar que el módulo base abre en http://localhost:5173 (comprobado el 03-11-2026)
- [x] T003 [P] Ejecutar `npx vitest run` y confirmar que las pruebas existentes de `tests/unit/` y `tests/integration/` pasan antes de modificar nada (03-11-2026: 24 archivos y 73 pruebas pasan)
- [ ] T004 Ejecutar `speckit.clarify` sobre `specs/001-erp-base-module/spec.md` para resolver los `[NEEDS CLARIFICATION]` (o resolverlos con el ayudante) y actualizar aquí las tareas marcadas "depende de aclaración" *(parcialmente hecho el 05-11-2026: el clarify se ejecutó con decisiones sobre granularidad de movimientos, fuente de KPIs, centro de costo, período de liquidación y alcance del menú; los `[NEEDS CLARIFICATION]` se resolvieron en la Revisión 3 de la spec — falta registrar aquí el cierre formal)*

---

## Fase 2: Fundacional (requisitos que bloquean todas las historias)

**Propósito**: configuración del módulo que todas las historias necesitan.

**CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T005 Conectar la configuración del módulo al arranque de la aplicación en `src/module-config.js` y `src/main.js` (ya implementada: `main.js` llama `initApp(userConfig)`; comprobado con prueba de arranque el 03-11-2026)
- [X] T006 Configurar `moduleName` ("Contabilidad y Finanzas: Facturación y Pagos") y `labels` (Tercero, Terceros, Factura, Facturas) en `src/module-config.js`
- [X] T007 Declarar el campo personalizado `tipoTercero` (entidad, selección, obligatorio, opciones `cliente`, `proveedor` y `personal`) en `src/module-config.js` *(la opción `personal` faltó en la implementación actual; se completa en T053)*
- [X] T008 Declarar los campos personalizados `tipoFactura` (selección, obligatorio, opciones `venta` y `compra`), `montoPagado` (número) y `fechaPago` (fecha) para documentos en `src/module-config.js` *(faltan `centroCosto`, `periodoLiquidacion` y `salesOrderId`; se completan en T053)*
- [X] T009 Configurar `statusLifecycle` con los estados Borrador, Emitida y Pagada, y las transiciones Borrador → Emitida → Pagada, sin salidas desde Pagada, en `src/module-config.js`
- [X] T010 [P] Escribir pruebas de la configuración (sin colisión de claves con los campos base, estados y transiciones válidos) en `tests/unit/module-config.test.js`
- [X] T011 Asegurar que toda factura nueva inicie en Borrador (FR-011) en `src/components/document-form.js` y `src/storage.js`
- [X] T012 Validar que una factura de venta solo se asocie a un tercero cliente, y una de compra a un proveedor o personal, en `src/validation.js`
- [X] T053 Completar la configuración pendiente en `src/module-config.js`: agregar la opción `personal` a `tipoTercero` (FR-001/FR-012) y declarar los campos personalizados `centroCosto` (select, opciones `Activo` y `Consumible`, FR-014), `periodoLiquidacion` (text, FR-015) y `salesOrderId` (text, FR-009/FR-027) para documentos
- [X] T054 [P] Ampliar las pruebas de configuración en `tests/unit/module-config.test.js`: las tres opciones de `tipoTercero`, los campos nuevos sin colisión con claves base y sus opciones de select válidas (depende de T053)

**Verificación del bloque (03-11-2026)**: se reutilizaron las 73 pruebas del template, haciendo explícita la configuración base en las pruebas genéricas. Se agregaron 21 casos para configuración financiera, arranque real desde `main.js`, creación en Borrador, persistencia y asociación venta/cliente y compra/proveedor en alta y edición, incluido el error en formulario. `npm run check` pasa con 25 archivos y 94 pruebas; `npm run build` pasa. La interacción se comprobó con Vitest/jsdom, no mediante un recorrido manual en navegador. Este cierre solo comprende T005–T012: T004, las confirmaciones documentales, las historias completas y las tareas nuevas T053–T054 continúan pendientes. No se modificaron la constitución ni `plan.md`.

**Punto de control**: la configuración carga sin errores y la base está lista; ya se pueden empezar las historias.

---

## Fase 3: HU1 - Registrar terceros: clientes, proveedores y personal (Prioridad: P1)

**Objetivo**: registrar, editar, buscar y eliminar clientes, proveedores y personal.

**Prueba independiente**: registrar un cliente, un proveedor y un trabajador, y comprobar que aparecen en el listado y que se pueden buscar.

### Pruebas de HU1

- [X] T013 [P] [HU1] Prueba de validación de terceros (nombre y código obligatorios, límite de crédito no negativo, `tipoTercero` obligatorio) en `tests/unit/validation.test.js`
- [X] T014 [P] [HU1] Prueba de integración: registrar cliente, proveedor y personal, buscarlos y eliminar uno con facturas (borrado en cascada de facturas y de movimientos financieros; los movimientos se prueban a fondo en T061) en `tests/integration/us1-create-entity.test.js`

### Implementación de HU1

- [X] T015 [HU1] Adaptar el formulario de terceros para mostrar nombre, código, RUT, límite de crédito y tipo de tercero en `src/components/entity-form.js`
- [X] T016 [HU1] Aplicar el límite de crédito solo a terceros de tipo cliente en `src/components/entity-form.js` y `src/validation.js`
- [X] T017 [HU1] Pedir confirmación antes de eliminar un tercero que tiene facturas (FR-005) en `src/app.js`
- [X] T018 [HU1] Validar formato y dígito verificador del RUT, y definir si puede repetirse, en `src/validation.js` **(resuelto: formato chileno con módulo 11, sin unicidad; ver FR-028)**
- [X] T019 [HU1] Confirmar que el módulo base ya rechaza códigos de tercero duplicados sin distinguir mayúsculas (`DUPLICATE_CODE` en `src/validation.js`, con prueba en `tests/unit/validation.test.js`). No requiere cambios en el código; el par serie-folio de las facturas se trata en T027

**Punto de control**: la HU1 funciona y se puede probar sola.

---

## Fase 4: HU2 - Emitir facturas de venta (Prioridad: P1)

**Objetivo**: crear una factura de venta a un cliente y pasarla de Borrador a Emitida, con la trazabilidad `salesOrderId`.

**Prueba independiente**: con un cliente registrado, crear una factura en Borrador, emitirla y ver que aparece como Emitida.

### Pruebas de HU2

- [X] T020 [P] [HU2] Prueba de validación de facturas (folio entero positivo, vencimiento igual o posterior a la emisión, descuento no mayor al subtotal, tercero existente) en `tests/unit/document-validation.test.js`
- [X] T021 [P] [HU2] Prueba de integración: crear factura de venta en Borrador, emitirla y comprobar que no se puede volver a Borrador en `tests/integration/us12-lifecycle.test.js`
- [X] T055 [P] [HU2] Prueba del campo `salesOrderId`: opcional, texto libre no vacío cuando se ingresa (vacío se admite), se persiste y se muestra en el detalle de la factura en `tests/unit/document-validation.test.js` y `tests/integration/us12-lifecycle.test.js` (FR-009)

### Implementación de HU2

- [X] T022 [HU2] Adaptar el formulario de facturas para mostrar tipo de factura, serie, folio, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`), subtotal, descuento, impuesto, total y moneda (una sola en el MVP, por definir) en `src/components/document-form.js`
- [X] T023 [HU2] Rotular `startDate` como "Fecha de emisión" y `endDate` como "Fecha de vencimiento" en `src/module-config.js` **(depende de confirmar la equivalencia con el ayudante)**
- [X] T024 [HU2] Permitir la transición Borrador → Emitida y bloquear el retroceso en `src/components/document-form.js`
- [X] T025 [HU2] Exigir el monto total al emitir en `src/validation.js` **(resuelto: obligatorio al emitir; cero solo en Borrador)**
- [ ] T026 [HU2] Avisar o bloquear cuando las facturas Emitidas de un cliente superan su límite de crédito en `src/components/document-form.js` **(resuelto: aviso con confirmación explícita, sin bloqueo; FR-029)**
- [X] T027 [HU2] Evitar facturas duplicadas con la misma serie y folio en `src/validation.js` **(resuelto: única por (tipo de documento, serie, folio) dentro de su tipo; FR-030)**
- [X] T056 [HU2] Agregar el campo `salesOrderId` al formulario de facturas de venta (visible solo cuando `tipoFactura` es `venta`) y validar que, si se ingresa, no esté vacío, en `src/components/document-form.js` y `src/validation.js` (FR-009)

**Punto de control**: las HU1 y HU2 funcionan juntas y por separado.

---

## Fase 5: HU3 - Registrar facturas de compra (Prioridad: P1)

**Objetivo**: crear una factura de compra a un proveedor (o a personal) y emitirla, con centro de costo y período de liquidación cuando corresponde.

**Prueba independiente**: con un proveedor registrado, crear una factura de compra con centro de costo, emitirla y ver que aparece como deuda por pagar.

### Pruebas de HU3

- [X] T028 [P] [HU3] Prueba de integración: crear factura de compra, emitirla, rechazar un monto negativo y distinguirla de las de venta en `tests/integration/us10-documents.test.js`
- [X] T057 [P] [HU3] Prueba de `centroCosto` (obligatorio al emitir, indefinido solo en Borrador, Activo o Consumible) y de `periodoLiquidacion` (obligatorio y formato `YYYY-MM` válido, no posterior a la emisión, solo cuando el tercero es personal; no aplica a proveedores) en `tests/unit/document-validation.test.js` y `tests/integration/us10-documents.test.js` (FR-014, FR-015)

### Implementación de HU3

- [X] T029 [HU3] Mostrar en el selector de tercero solo proveedores cuando el tipo de factura es compra, y solo clientes cuando es venta, en `src/components/document-form.js`
- [X] T030 [HU3] Mostrar el tipo de factura (venta o compra), el monto total y la fecha de vencimiento en el listado de facturas en `src/components/document-list.js`
- [X] T058 [HU3] Agregar el campo `centroCosto` (select Activo/Consumible) al formulario de compra, exigirlo al emitir en `src/validation.js` y mostrarlo en el listado en `src/components/document-form.js` y `src/components/document-list.js` (FR-014)
- [X] T059 [HU3] Agregar el campo `periodoLiquidacion` visible solo cuando el tercero es de tipo personal, con validación `YYYY-MM` no posterior a la fecha de emisión, en `src/components/document-form.js` y `src/validation.js` (FR-015)
- [X] T069 [HU3] Presentar facturas de venta y de compra como listados separados: dos entradas de menú que abren `src/components/document-list.js` filtrado por `tipoFactura`, con sus columnas propias (venta: `salesOrderId`; compra: `centroCosto`), en `src/components/shell.js` y `src/components/document-list.js` (FR-006; depende de T065) *(superada por T071–T074: la Revisión 4 reemplaza el listado genérico filtrado por dos vistas independientes con listados propios)*

**Punto de control**: las HU1, HU2 y HU3 funcionan de forma independiente.

---

## Fase 6: HU4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

**Objetivo**: registrar el monto y la fecha de pago de una factura Emitida y marcarla como Pagada.

**Prueba independiente**: con una factura Emitida, registrar el pago y comprobar que pasa a Pagada.

### Pruebas de HU4

- [X] T031 [P] [HU4] Prueba de validación del pago (monto pagado igual al total, fecha de pago obligatoria, factura en Borrador no se puede pagar, Pagada no admite cambios) en `tests/unit/document-validation.test.js`
- [X] T032 [P] [HU4] Prueba de integración: emitir, registrar el pago y marcar Pagada en `tests/integration/us12-lifecycle.test.js`

### Implementación de HU4

- [X] T033 [HU4] Mostrar los campos de monto pagado y fecha de pago al marcar una factura como Pagada en `src/components/document-form.js`
- [X] T034 [HU4] Rechazar el paso a Pagada si `montoPagado` es distinto de `totalAmount` o falta `fechaPago` (FR-016) en `src/validation.js`

**Punto de control**: el ciclo completo de la factura funciona (Borrador → Emitida → Pagada).

---

## Fase 6b: Movimientos financieros (FR-017 a FR-019, SC-006; transversal a HU2, HU3 y HU4)

**Objetivo**: generar automáticamente un movimiento financiero de solo lectura por cada emisión y cada pago, y listarlos sin permitir edición.

**Prueba independiente**: emitir una factura de venta y una de compra, pagar una de ellas, y comprobar que hay un movimiento por evento con el monto, el tercero y los campos correspondientes; eliminar la factura y comprobar que sus movimientos desaparecen.

**Requisitos previos**: Fase 2 completa (T053) y el ciclo de vida de HU4.

### Pruebas de movimientos

- [X] T060 [P] Prueba unitaria de la generación de movimientos: un cargo por emisión de venta, un abono por emisión de compra, una contrapartida `pago` por el pago (venta: abono; compra: cargo), con `monto` igual a `totalAmount`, `fecha` del evento, `entity_id` y `document_id` correctos, y copia de `centroCosto` (compra) o `salesOrderId` (venta) cuando corresponden, en `tests/unit/movements.test.js` (FR-017, FR-018, SC-006)
- [X] T061 [P] Prueba de integración: los movimientos se generan al emitir y pagar vía `addDocument`/`updateDocument`, se eliminan en cascada con `deleteDocument` y `deleteDocumentsForEntity` (FR-005), no existen operaciones para editarlos o eliminarlos manualmente y no están expuestos a mutación en la capa de almacenamiento en `tests/integration/movements.test.js` (FR-019)

### Implementación de movimientos

- [X] T062 Implementar la generación y el registro de movimientos en `src/movements.js`, guardándolos en `erp.movements`, y conectar los ganchos en `src/storage.js` (`addDocument` y `updateDocument` al transicionar a Emitida o Pagada; `deleteDocument` y `deleteDocumentsForEntity` eliminan los movimientos vinculados; no expone funciones de edición) (FR-017 a FR-019; depende de las Fases 2, 4 y 6)
- [X] T063 Crear el listado de movimientos financieros de solo lectura (fecha, documento, tercero, tipo, monto, centro de costo o `salesOrderId` según corresponda) en un componente nuevo `src/components/movements-list.js`, y registrar la vista en `src/app.js` (FR-019; depende de T062 y T065)

**Punto de control**: cada emisión y pago del ciclo completo deja su movimiento trazable y conciliado en monto (SC-006); la tabla es solo lectura.

---

## Fase 7: HU5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

**Objetivo**: mostrar cuánto se debe cobrar y pagar por tercero, y qué facturas están vencidas.

**Prueba independiente**: con varias facturas en distintos estados y fechas, abrir el seguimiento y comprobar los totales y las vencidas.

### Pruebas de HU5

- [X] T035 [P] [HU5] Prueba unitaria de los cálculos (total por cobrar, total por pagar, vencidas, exclusión de Borrador y Pagada) en `tests/unit/tracking.test.js`
- [X] T036 [P] [HU5] Prueba de integración de la vista de seguimiento en `tests/integration/tracking.test.js`

### Implementación de HU5

- [X] T037 [P] [HU5] Crear las funciones de cálculo de deuda por tercero y facturas vencidas (FR-023 a FR-025; sobre las facturas, no sobre los movimientos) en `src/tracking.js`
- [X] T038 [HU5] Crear la vista de seguimiento en `src/components/tracking.js`
- [X] T039 [HU5] Agregar el botón "Seguimiento" a la barra lateral y a las acciones rápidas en `src/components/shell.js` y `src/components/dashboard.js`

**Punto de control**: las HU1 a HU5 funcionan de forma independiente.

---

## Fase 8: HU6 - Datos de demostración y referencias genéricas a otros módulos (Prioridad: P3)

**Objetivo**: cargar ejemplos ficticios para probar cobros y pagos, y permitir guardar una referencia manual a otro módulo.

**Avance confirmado**: la redacción de HU6 y sus cinco escenarios de aceptación están incorporados en `spec.md` mediante el commit [5d72123](https://github.com/MDS-BI/Grupo-01/commit/5d721239f3da3af443de44f4c292bdfcb7839fae). Este avance es documental; no significa que el cargador, el botón o las pruebas ya estén implementados.

**Requisitos previos**: completar las Fases 1 y 2 (incluido T053) y usar las reglas compartidas de HU1 a HU4. Antes de preparar los ejemplos definitivos, resolver las decisiones pendientes sobre moneda y monto total *(resueltas: CLP única y total > 0 al emitir, 2026-11-03)*. Los ejemplos no deben saltarse las validaciones ni introducir campos duplicados, y deben incluir terceros de tipo personal con períodos de liquidación válidos (`YYYY-MM`).

**Alcance de las referencias**: por ahora se usa un campo de texto genérico, siguiendo la orientación del ayudante comunicada por Jaime. Se puede anotar, por ejemplo, "Ventas: pedido PED-035". No hay conexión en vivo ni validación contra los sistemas de otros grupos. El formato definitivo se confirmará con el profesor; coordinar identificadores con otros grupos no bloquea esta versión.

**Prueba independiente**: con el módulo vacío, cargar los ejemplos, revisar sus relaciones y recargar la página. Repetir la carga y comprobar que no hay duplicados. Probar también con registros ingresados previamente y verificar que se conservan. Guardar y volver a consultar una referencia en un tercero y en una factura.

### Pruebas de HU6

- [X] T040 [HU6] Escribir primero los escenarios de prueba en `tests/integration/demo-data.test.js`: carga inicial con clientes, proveedores y facturas de venta y compra; casos Borrador, Emitida y Pagada; facturas Emitidas vencidas y vigentes; conservación de registros y relaciones al iniciar de nuevo la aplicación con el mismo almacenamiento; segundo intento sin duplicados; rechazo de carga cuando ya exista algún tercero o factura, sin modificar los datos previos. Incluir la conservación de la referencia de un tercero y de una factura al guardar, cerrar y volver a abrir. Comprobar que las pruebas detectan la funcionalidad faltante y, después de implementar T041 a T044, ejecutarlas hasta que pasen.

### Implementación de HU6

- [X] T041 [HU6] Crear los ejemplos y su función de carga en `src/demo-data.js`, usando solo datos ficticios y la moneda acordada (CLP). Incluir clientes, proveedores y personal con facturas del tipo correspondiente; estados Borrador, Emitida y Pagada; y facturas Emitidas con vencimiento pasado y futuro al cargar. Todas las facturas deben tener fechas válidas. Las Pagadas deben tener monto pagado igual al total y fecha de pago. Usar las operaciones y transiciones compartidas del módulo, vinculando cada factura al `entity_id` de su tercero. Cargar únicamente si no existen terceros ni facturas; repetir la operación o encontrar datos previos debe conservar el contenido sin agregar ejemplos ni borrar registros.

- [X] T042 [HU6] Agregar "Cargar datos de demostración" al panel en `src/components/dashboard.js` y conectar su acción con la función de `src/demo-data.js`. Mostrar un aviso de carga completada o de módulo con datos, mantener los registros existentes y actualizar la vista y sus estadísticas después de una carga exitosa. Si falla el almacenamiento, mostrar el error sin informar que la carga terminó correctamente.

- [X] T043 [HU6] Definir la clave del campo opcional "Referencia a otro módulo" para terceros y facturas, sin colisionar con campos base, y declararlo en `src/module-config.js`. Documentar su nombre, tipo texto, carácter opcional y conservación en `specs/001-erp-base-module/data-model.md` y `specs/001-erp-base-module/contracts/entity-storage.md`; reflejarlo en `specs/001-erp-base-module/mer.png` cuando se actualice el diagrama. Registrar el alcance genérico de esta versión y separar la confirmación futura del formato de identificadores. Esta tarea reemplaza la coordinación inmediata con otros grupos planteada en el borrador anterior.

- [X] T044 [HU6] Mostrar y permitir guardar y consultar la referencia genérica en `src/components/entity-form.js` y `src/components/document-form.js`, respetando las reglas de edición y pago de HU4. Utilizar el mecanismo de campos personalizados y la persistencia de `src/storage.js`; verificar que la referencia no se descarte ni reemplace el vínculo `entity_id` entre factura y tercero. Completar en `tests/integration/demo-data.test.js` los casos de referencia en ambos registros, incluidos su conservación después de recargar y el guardado con el campo vacío.

### Seguimiento y coherencia

- T040 a T044 siguen pendientes: se marcan con `[x]` solo cuando su resultado esté implementado y comprobado. Tener la historia escrita, una prueba redactada o un archivo creado no basta para afirmar que la función ya está terminada.
- Se conservan los identificadores de las tareas para no alterar referencias del resto del trabajo. Se retiran las marcas `[P]` de este bloque: el cargador depende de las reglas comunes, y las pruebas deben revisarse junto con la implementación.
- Antes de implementar, alinear la referencia genérica (FR-027) descrita aquí con el campo opcional "Referencia a otro módulo". Esta edición no cambia los requisitos ni el modelo de datos: T043 deja explícita la actualización que falta.
- El borrador anterior pedía ejemplos "con y sin vencimiento". Se corrige a facturas vencidas y vigentes, todas con fechas válidas, para respetar FR-007.
- Coordinar con los responsables de HU1, HU2 y HU3 la edición de `src/module-config.js`, `src/components/entity-form.js` y `src/components/document-form.js`, porque son archivos compartidos.
- Al terminar, ejecutar las pruebas de HU6 y las del módulo base. Revisar también T049 (recorrido completo), T051 (consistencia documental) y T052 (demostración final); son tareas de cierre del grupo y no se consideran completadas por actualizar esta sección.

**Punto de control**: los cinco escenarios de aceptación de HU6 se pueden demostrar; los datos y referencias se conservan, la carga repetida no duplica registros y la demostración no altera datos existentes.

---

## Fase 9: HU7 - Arquitectura de UI: marco general, home con KPIs y menú desacoplado (Prioridad: P1, transversal)

**Objetivo**: consolidar el marco de navegación: menú desacoplado con vistas fijas, home con KPIs calculados sobre las facturas y navegación sin recarga.

**Prueba independiente**: con datos de demostración cargados, navegar por el menú entre home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento, y comprobar que el marco y el menú se mantienen estables sin importar la vista activa y sin recargar la página.

**Requisitos previos**: Fase 2 completa (T053–T054). La vista de movimientos usa T063 y los KPIs usan T037.

### Pruebas de HU7

- [X] T064 [P] [HU7] Prueba de integración de navegación: el menú es constante entre vistas (home, terceros, facturas de venta, facturas de compra, movimientos financieros, seguimiento), el contenido central se reemplaza sin recargar la página completa y el home muestra los KPIs (o estado vacío con acceso a la carga de demostración) en `tests/integration/us13-shell.test.js` y `tests/integration/us3-dashboard.test.js` (FR-020 a FR-022; amplía las pruebas existentes del template)

### Implementación de HU7

- [X] T065 [HU7] Consolidar el menú desacoplado con vistas fijas del módulo (home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento), componente estático independiente del contenido, en `src/components/shell.js` (FR-020; las entradas de venta y compra dependen de T069 y la de movimientos de T063)
- [X] T066 [HU7] Completar el home con los KPIs (total por cobrar, total por pagar y facturas vencidas, calculados sobre las facturas vía `src/tracking.js`), accesos directos a crear tercero, crear factura de venta, crear factura de compra, abrir seguimiento y, con el módulo vacío, cargar datos de demostración, en `src/components/dashboard.js` (FR-021; depende de T037 y dialoga con T042)
- [X] T067 [HU7] Verificar y ajustar que el cambio de vista reemplaza el contenido central sin recargar la página completa ni perder el marco general, en `src/app.js` (FR-022)

**Punto de control**: el marco, el menú, el home y sus KPIs se comportan igual en todas las vistas, con y sin datos.

---

## Fase 10: Cierre y aspectos transversales

**Propósito**: mejoras que afectan a varias historias.

- [ ] T045 Actualizar las instrucciones de uso (instalación, ejecución y pruebas) en `README.md`
- [ ] T046 Completar el anexo de uso de IA (modelo, fecha y prompts) en `README.md`
- [ ] T047 Mantener el registro de decisiones en `README.md` (o en issues de GitHub), como sugiere el enunciado
- [X] T048 Ejecutar `npm run check` (lint, formato y pruebas) y corregir lo que falle
- [ ] T068 Actualizar `specs/001-erp-base-module/plan.md`: corregir la tabla de cobertura (FR-008/FR-010 y FR-011 con referencias desactualizadas; FR-020/021/022 apuntando a las tareas reales T064–T067; FR-009 → T055/T056; FR-014 → T057/T058; FR-015 → T057/T059; FR-017–FR-019 y SC-006 → T060–T063) y agregar `src/components/movements-list.js` a la estructura de código *(la tabla de cobertura se corrigió el 05-11-2026 como remediación del hallazgo I1 del análisis; falta agregar `movements-list.js` a la estructura del plan cuando se implemente la vista)*
- [ ] T070 Comprobar el presupuesto de rendimiento de `plan.md` (<100 ms en búsqueda y render; 500 registros): crear ~500 terceros y facturas (o extender `src/demo-data.js` con un lote opcional de estrés), medir búsqueda con `src/search.js` y render con `src/components/entity-list.js` y `src/components/document-list.js` (o los listados de factura de T073, si ya existen) en Vitest/jsdom o en la aplicación local (`npm run dev`), y registrar los resultados y cualquier justificación de trade-off en `specs/001-erp-base-module/quickstart.md` (Constitución, principio IV)
- [ ] T078 Actualizar `specs/001-erp-base-module/data-model.md`, `specs/001-erp-base-module/contracts/invoice-views.md`, `specs/001-erp-base-module/contracts/entity-storage.md` y `specs/001-erp-base-module/plan.md` para dejar explícito que la separación de la Revisión 4 es lógica y de interfaz, no de almacenamiento: `erp.documents` sigue siendo la única colección y `customFields.tipoFactura` es el discriminante; documentar también las vistas, columnas e invariantes de `contracts/invoice-views.md` (FR-006)
- [ ] T049 Recorrer el flujo completo con los datos de demostración (tercero, factura, emisión, pago y seguimiento) en la aplicación local (`npm run dev`), y confirmar que se hace en menos de 5 minutos (SC-005) y que una persona nueva registra un tercero y emite su primera factura en menos de 3 minutos (SC-001), siguiendo también las verificaciones de `specs/001-erp-base-module/quickstart.md`
- [ ] T050 Comprobar que la interfaz solo usa datos ficticios y que `README.md` advierte que `localStorage` no es seguro (riesgos de datos)
- [ ] T051 Ejecutar `speckit.analyze` para verificar la consistencia entre `specs/001-erp-base-module/spec.md`, `plan.md`, `data-model.md` y `tasks.md`
- [ ] T052 Preparar la demostración funcional para la presentación final, usando `src/demo-data.js`

---

## Fase 11: Separación visual y funcional de facturas (Revisión 4, 2026-11-11; transversal a HU2, HU3 y HU7)

**Objetivo**: convertir la separación venta/compra en dos vistas, dos formularios y dos listados independientes con columnas propias, sin cambiar el almacenamiento único de `Document`.

**Prueba independiente**: abrir "Facturas de venta" y "Facturas de compra" desde el menú, crear una factura en cada una, comprobar que cada listado muestra solo su tipo y sus columnas (venta: Orden de venta; compra: Centro de costo y Período de liquidación), y que el formulario no permite cambiar el tipo.

**Requisitos previos**: Fases 1 y 2 completas y el ciclo de vida de facturas de HU2/HU3/HU4 implementado (T020–T034, T053–T059). T071 define los contenedores del DOM y bloquea a T072, T073 y T074.

**Diseño de referencia**: `specs/001-erp-base-module/contracts/invoice-views.md`, `specs/001-erp-base-module/data-model.md` (sección 4a) y `specs/001-erp-base-module/plan.md` (separación visual y funcional).

**Nota sobre tareas anteriores**: las tareas de interfaz que hoy nombran `src/components/document-form.js` y `src/components/document-list.js` (T011, T022, T024, T026, T029, T030, T033, T044, T056, T058, T059, T069 y la medición de T070) se implementan sobre `invoice-form.js` e `invoice-list.js` después de T072/T073. La lógica de validación (`src/validation.js`), el almacenamiento (`src/storage.js`) y la generación de movimientos no cambian.

### Pruebas de la separación

- [ ] T076 [P] [HU2] Escribir primero `tests/integration/invoice-separation.test.js`: dos vistas mutuamente excluyentes, dos formularios y dos listados, columnas por tipo, aislamiento venta/compra, tipo fijo e inyección de `customFields.tipoFactura`, y menú sin "Documentos"; actualizar `tests/integration/us10-documents.test.js`, `tests/integration/us12-lifecycle.test.js`, `tests/integration/us13-shell.test.js`, `tests/integration/foundation.test.js`, `tests/integration/us4-management.test.js`, `tests/integration/us5-config.test.js` y `tests/integration/us6-labels.test.js` para usar las vistas de venta y compra en lugar de `document-form`, `document-list`, `view-documents` y `nav-documents`; comprobar que fallan antes de implementar y que pasan con `npm run check` (Constitución, principio II)

### Vistas, formularios y listados

- [ ] T071 [HU7] Crear las dos vistas independientes de factura en `index.html`: reemplazar `#view-documents` por `#view-invoice-sale` y `#view-invoice-purchase`, cada una con su formulario, su selector de edición y su contenedor de listado; retirar `#nav-documents` y `#qa-new-document`; conservar `#qa-new-invoice-sale` y `#qa-new-invoice-purchase` (FR-006, FR-020)
- [ ] T072 [HU2] Crear la fábrica `createInvoiceForm({ tipoFactura, root, config, onSubmit })` en `src/components/invoice-form.js`, con estado por instancia (`editingId`, entidades, opciones) y consultas acotadas al `root` mediante `data-field`, `data-error` y `data-custom-fields`; crear `src/components/invoice-sale-form.js` (`tipoFactura: 'venta'`, campo `salesOrderId`, terceros `cliente`) y `src/components/invoice-purchase-form.js` (`tipoFactura: 'compra'`, campos `centroCosto` y `periodoLiquidacion`, terceros `proveedor`/`personal`); el formulario no muestra el tipo y lo inyecta al leer los valores; retirar los IDs globales de `src/components/document-form.js` (FR-006, FR-009, FR-014, FR-015)
- [ ] T073 [P] [HU3] Crear el renderizador `renderInvoiceList(container, documents, entities, { tipoFactura, columns, onEdit, onDelete })` en `src/components/invoice-list.js`, con filtro obligatorio por `customFields.tipoFactura`, agrupación por tercero, estado vacío y atributo `data-tipo-factura`; definir en `src/components/invoice-sale-list.js` las columnas Folio, Estado, Emisión, Vencimiento, Total y Orden de venta (`salesOrderId`), y en `src/components/invoice-purchase-list.js` las columnas Folio, Estado, Emisión, Vencimiento, Total, Centro de costo y Período de liquidación (FR-006, FR-009, FR-014, FR-015)

### Navegación, configuración y estilos

- [ ] T074 [HU7] Quitar `documents` de `NAV_MODULES` y agrupar las dos entradas de factura bajo "Facturación" en `src/components/shell.js`; mapear `invoice-sale → invoice-sale` e `invoice-purchase → invoice-purchase` en `VIEW_ELEMENTS`, ocultar y mostrar las dos vistas en `showModule`, y separar los manejadores de envío, edición y eliminación por tipo en `src/app.js` (FR-006, FR-020, FR-022)
- [ ] T075 [P] [HU7] Agregar estilos distintivos en `src/styles.css`: `.invoice-view--sale` y `.invoice-view--purchase` (borde y acento), `.invoice-badge--sale` y `.invoice-badge--purchase`, y la tabla de listado con `thead`/`tbody`, columnas alineadas y desplazamiento horizontal en móvil (FR-006)
- [ ] T077 [P] [HU3] Declarar `INVOICE_VIEWS` en `src/module-config.js` con el módulo y la vista, el `tipoFactura` fijo, los terceros admitidos, los campos propios visibles y las columnas del listado para cada tipo, y exponer un helper de preset por tipo para que formularios y listados no dupliquen etiquetas ni columnas (FR-006, FR-009, FR-014, FR-015)

**Punto de control**: cada factura se crea, lista y edita solo desde la vista de su tipo, con sus columnas propias, y `erp.documents` sigue siendo la única clave de almacenamiento de facturas.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundacional (Fase 2)**: depende de la Preparación y **bloquea todas las historias**. T053–T054 completan la configuración de la Revisión 3 y deben resolverse antes de las historias (T015, T022, T029 y T041 dependen de la opción `personal` y de los campos nuevos).
- **Historias (Fases 3 a 9)**: dependen de la fase Fundacional. Pueden avanzar en paralelo si hay personas disponibles, o en orden de prioridad (P1 → P2 → P3).
- **Movimientos financieros (Fase 6b)**: depende de Fases 2, 4 y 6 (se genera al emitir y al pagar); habilita la vista de movimientos de HU7 y completa SC-006.
- **HU7 (Fase 9)**: transversal; su prueba (T064) implica las vistas de T063 y T069 para el menú completo, pero el menú con las vistas base puede probarse antes.
- **Separación de facturas (Fase 11)**: depende de las Fases 1 y 2 y del ciclo de vida de facturas de HU2–HU4. T071 bloquea a T072, T073 y T074; T076 se escribe primero y se cierra al final; T078 (Fase 10) documenta el resultado.
- **Cierre (Fase 10)**: depende de las historias que se quieran entregar.

### Dependencias entre historias

- **HU1 (P1)**: puede empezar tras la fase Fundacional; no depende de otras historias.
- **HU2 (P1)**: puede empezar tras la fase Fundacional; necesita clientes para probarse, pero se puede probar con datos creados en la prueba.
- **HU3 (P1)**: puede empezar tras la fase Fundacional; reutiliza el formulario de facturas de la HU2.
- **HU4 (P2)**: necesita facturas Emitidas (HU2 o HU3).
- **Movimientos (6b)**: necesita emisiones (HU2/HU3) y pagos (HU4) para probar los tres tipos de movimiento.
- **HU5 (P2)**: necesita facturas en distintos estados (HU2, HU3 y HU4).
- **HU6 (P3)**: puede empezar tras la fase Fundacional; los datos de demostración usan los campos de las demás historias (incluido `personal` y `periodoLiquidacion` de T053).
- **HU7 (P1)**: puede empezar tras la fase Fundacional; las vistas que navega llegan de las demás historias (KPIs de T037, movimientos de T063, listados separados de T069).
- **Revisión 4 (Fase 11)**: transversal a HU2, HU3 y HU7; no agrega una historia nueva ni cambia el modelo de datos, y reemplaza la presentación de T069 por dos vistas independientes.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de implementar.
- Primero las reglas de `src/validation.js` (y `src/storage.js` si hace falta), luego los formularios y vistas.
- La historia se completa antes de pasar a la siguiente prioridad.

### Oportunidades de paralelismo

- Las tareas de Preparación marcadas [P].
- Las pruebas de una misma historia marcadas [P].
- T054, T055, T057, T060 y T061 son pruebas [P] en archivos nuevos o distintos entre sí.
- Después de la fase Fundacional, cada integrante puede trabajar una historia distinta; HU7 (T064–T067) se puede asignar en paralelo porque toca `shell.js`/`dashboard.js`/`app.js`, distintos de los archivos de HU1–HU4.
- En la Fase 11, T073, T075, T076 y T077 son [P] entre sí (archivos distintos); T072, T073 y T074 dependen de T071 porque necesitan los contenedores del DOM. T074 es el único que edita `src/app.js` y `src/components/shell.js`; conviene que no se solape con otra persona que toque esos archivos.

---

## Ejemplo de paralelismo: HU1

```text
# Pruebas de la HU1 juntas:
Tarea: "Prueba de validación de terceros en tests/unit/validation.test.js"
Tarea: "Prueba de integración de terceros en tests/integration/us1-create-entity.test.js"
```

---

## Estrategia de implementación

### Primero el MVP (HU1, HU2 y HU3)

1. Completar la Fase 1: Preparación.
2. Completar la Fase 2: Fundacional (bloquea todo, incluidas T053–T054).
3. Completar la Fase 3: HU1.
4. Completar las Fases 4 y 5: HU2 y HU3 (con T055 y T057–T059, T069).
5. Completar la Fase 11: separación visual y funcional de facturas (T071–T077), con T076 escrito primero.
6. **Detenerse y validar**: probar cada historia de forma independiente y comprobar que cada factura solo aparece en su vista.
7. Mostrar la demo si está lista.

### Entrega incremental

1. Preparación + Fundacional → base lista.
2. Agregar HU1, HU2 y HU3 → probar → demo (MVP).
3. Agregar la Fase 11 (separación de facturas) → probar → demo con dos vistas independientes.
4. Agregar HU4 y movimientos (Fase 6b) → probar → demo (cada evento deja su movimiento).
5. Agregar HU5 → probar → demo.
6. Agregar HU6 → probar → demo final.
7. HU7 va en paralelo desde el Fundacional y se demuestra junto con el flujo completo.
8. Cada entrega suma valor sin romper las anteriores.

### Estrategia con varios integrantes

1. El grupo completa juntos la Preparación y la fase Fundacional (incluido T053).
2. Luego cada integrante toma una historia (ver la tabla de asignación) y se asigna HU7.
3. Las historias se integran y se prueban de forma independiente.

---

## Notas

- [P] = archivos distintos, sin dependencias.
- [Story] = [HUn], historia del spec (HU1 a HU7) para trazabilidad.
- Cada historia debe poder completarse y probarse de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Antes de dar por terminada cada historia, ejecutar `npm run check` (puertas de calidad de `plan.md`). Con el módulo base, `npm run check` ya pasa completo (lint, formato y 73 pruebas).
- La búsqueda de terceros (FR-004) y los listados de terceros y facturas ya vienen en el módulo base (`src/search.js`, `src/components/entity-list.js` y `src/components/document-list.js`): T013, T014 y T030 comprueban o adaptan lo que ya existe.
- `src/movements.js`, `src/components/movements-list.js`, `src/tracking.js`, `src/components/tracking.js` y `src/demo-data.js` son archivos nuevos, extensiones del módulo base según la estructura de `plan.md`; T068 deja el plan al día.
- `src/components/invoice-form.js`, `invoice-sale-form.js`, `invoice-purchase-form.js`, `invoice-list.js`, `invoice-sale-list.js` e `invoice-purchase-list.js` son archivos nuevos de la Revisión 4; `src/components/document-form.js` y `src/components/document-list.js` se retiran al completar T071–T074, junto con `#view-documents` y `#nav-documents`.
- La separación de la Revisión 4 no cambia `src/storage.js`, `src/validation.js` ni `src/movements.js`: el tipo de factura se sigue guardando en `customFields.tipoFactura` y las reglas de negocio no se duplican.
- Hacer un commit después de cada tarea o grupo lógico de tareas. Los commits los hace cada integrante a mano, no la IA, como pide el curso. Si un comando de Speckit ofrece hacer un commit automático, responder que no.
- Varias historias toman los mismos archivos (`src/storage.js`, `src/module-config.js`, `index.html`, `src/app.js` y `tests/unit/document-validation.test.js`). Si dos integrantes los editan a la vez puede haber conflictos al subir los cambios a `main`: conviene avisar al grupo antes de editarlos y hacer Fetch y Pull antes de empezar.
- Las tareas marcadas **(depende de aclaración)** deben revisarse al resolver los `[NEEDS CLARIFICATION]` del `spec.md`.
- Evitar tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan su independencia.

---

## Anexo: tareas propuestas por Caro para la HU2

Caro agregó estas tareas en `main` para la HU2 (Emisión y Registro de Facturas a Clientes). Se conservan como referencia: cubren lo mismo que T020 a T027 de la Fase 4, pero con más detalle en las validaciones. Al regenerar este archivo con `speckit.tasks`, hay que compararlas y consolidarlas en una sola lista. Las Tareas 1 a 8 de esa versión anterior (cambios en `module-config.js`, instalación y prueba local) corresponden a las Fases 1 y 2 de este archivo, y las Tareas 1 y 2 (MER y archivos iniciales de Speckit) ya están hechas.

> **Resolución de la consolidación (2026-11-05).** Esta corrida de `speckit.tasks` ya consolidó el anexo: las Tareas 9 y 10 están cubiertas por T020 y T028 (ampliadas con T055/T057); la Tarea 11 por T022; las Tareas 12 y 13 por T012, T025 y las validaciones base del template (ya comprobadas); la Tarea 14 por T024; la Tarea 15 por T030 y T069; la Tarea 16 por el borrado en cascada del template, comprobado en T014 y T061 (con movimientos); y la Tarea 17 por T048/T049. El anexo queda solo como referencia histórica y ya no requiere comparación en futuras regeneraciones.

Depende de las Tareas 3 y 6 de esa versión (etiquetas Cliente/Factura y ciclo de vida Borrador, Emitida, Pagada), que aquí son T006 y T009. Reutilizar los campos base definidos en `data-model.md`: `entity_id`, `series`, `folio`, `startDate` (emisión), `endDate` (vencimiento), `totalAmount` y `status`; no crear campos duplicados. Varias de estas validaciones (tercero existente, folio entero positivo, fechas, descuento y monto no negativo) ya las hace el módulo base en `src/validation.js` y se cubren en `tests/unit/document-validation.test.js`; en las tareas 12 y 13 solo falta lo propio del módulo (total obligatorio al emitir y estado inicial Borrador).

- [ ] **Tarea 9:** Escribir pruebas unitarias en `tests/unit/document-validation.test.js` para la validación de facturas: cliente existente obligatorio, `folio` entero positivo, `totalAmount` no negativo, `endDate` igual o posterior a `startDate` y estado inicial Borrador.
- [ ] **Tarea 10:** Escribir pruebas de integración en `tests/integration/us10-documents.test.js` que cubran el registro de una factura desde el formulario, su asociación al `entity_id` del cliente y el rechazo de monto negativo, vencimiento anterior a la emisión y cliente inexistente.
- [ ] **Tarea 11:** Ajustar `index.html` y `src/components/document-form.js` para capturar cliente, `series` opcional, `folio`, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`) y monto total (`totalAmount`), mostrando mensajes de error por campo.
- [ ] **Tarea 12:** Implementar en `src/storage.js` la validación de factura: `entity_id` debe coincidir con un `Entity.entity_id` existente, `folio` entero positivo, `totalAmount` requerido y no negativo, `startDate`/`endDate` requeridas y `endDate >= startDate`.
- [ ] **Tarea 13:** Implementar en `src/storage.js` el alta de facturas mediante `addDocument`, persistiendo `entity_id`, `folio`, `series`, fechas, `totalAmount`, estado inicial Borrador e identificadores/timestamps automáticos; aplicar las mismas validaciones en `updateDocument`.
- [ ] **Tarea 14:** Implementar en `src/components/document-form.js` la emisión de la factura, permitiendo la transición Borrador -> Emitida y bloqueando estados no permitidos o salidas desde Pagada.
- [ ] **Tarea 15:** Mostrar en `src/components/document-list.js` el monto total, la fecha de vencimiento y el estado de cada factura asociada al cliente.
- [ ] **Tarea 16:** Verificar la integridad referencial y el borrado en cascada: impedir facturas sin cliente válido y eliminar las facturas asociadas al eliminar un cliente.
- [ ] **Tarea 17:** Ejecutar `npx vitest run`, corregir los fallos y validar con `npm run dev` el flujo completo: crear cliente -> registrar factura en Borrador -> emitir factura -> visualizar la deuda del cliente.
































































































