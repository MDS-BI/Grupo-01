---

description: "Lista de tareas para el módulo de Contabilidad y Finanzas: Facturación y Pagos"
---

# Tareas: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Entrada**: Documentos de diseño en `/specs/001-erp-base-module/`

**Requisitos previos**: `plan.md`, `spec.md`, `data-model.md`, `contracts/entity-storage.md`

**Pruebas**: Se incluyen tareas de prueba porque la constitución del proyecto exige cubrir con pruebas automatizadas el comportamiento visible y la lógica de negocio.

**Organización**: Las tareas están agrupadas por historia de usuario (HU1 a HU8 del `spec.md`) para poder implementar y probar cada una de forma independiente. La Fase 11 agrupa la separación visual y funcional de facturas de la Revisión 4, transversal a HU2, HU3 y HU7.

> **Nota sobre la consolidación de la Revisión 3 (2026-11-05).** Esta corrida de `speckit.tasks` consolida los requisitos de la Revisión 3 del spec sin eliminar las tareas existentes ni renumerarlas (T001 a T052 conservan su ID porque están referenciados desde `plan.md` y tienen estado registrado). Las tareas nuevas se numeran T053 a T070 y se insertan en su fase correspondiente, aunque su número sea mayor que el de tareas posteriores. Lo incorporado: `personal` en `tipoTercero`; facturas de venta y de compra como documentos separados con listados propios (FR-006); `salesOrderId` (FR-009); centro de costo (FR-014); período de liquidación (FR-015); movimientos financieros auto-generados de solo lectura con granularidad de un movimiento por evento (FR-017 a FR-019, SC-006); y la HU7 de arquitectura de UI (FR-020 a FR-022). Además, el análisis `/speckit.analyze` del 05-11-2026 remedió sus hallazgos: T068 (tabla de cobertura de plan.md, hallazgo I1), T070 (medición del presupuesto de rendimiento, hallazgo C2) y el registro de la desviación e2e en plan.md (hallazgo C1); el total es 70 tareas (T001 a T070).

> **Nota sobre la separación de facturas de la Revisión 4 (2026-11-11).** Esta corrida de `speckit.tasks` agrega la separación visual y funcional de facturas decidida en el clarify del 2026-11-11 (`spec.md`, FR-006 y FR-020) sin renumerar las tareas existentes. Las tareas nuevas se numeran T071 a T078; T071–T077 forman la Fase 11 (transversal a HU2, HU3 y HU7) y T078 se suma al cierre documental de la Fase 10. Lo incorporado: dos vistas independientes (`#view-invoice-sale` y `#view-invoice-purchase`), dos formularios y dos listados con columnas propias, tipo de factura fijo por vista, menú sin la vista genérica de documentos y estilos distintivos. El almacenamiento no cambia: sigue siendo `erp.documents` con `customFields.tipoFactura`. El total pasa a 78 tareas (T001 a T078).

> **Nota sobre cómo se generó.** Este archivo se armó siguiendo las reglas de `speckit.tasks` (formato, fases y orden), a partir del `spec.md`, el `plan.md` y el `data-model.md` actuales. `speckit.analyze` se ejecutó el 02-11-2026 (Mauro) y otra vez el 03-11-2026 (Jaime). Sus propuestas siguen pendientes de revisar; el `speckit.clarify` se completó el 05-11-2026 (ver nota de Revisión 3 más abajo). Las tareas marcadas **(depende de aclaración)** restantes quedan provisionales hasta su revisión.

> **Nota sobre la guía de uso de la Revisión 5 (2026-11-16).** Se agrega la HU8 (guía de uso y tutorial, tarea 6 de la minuta de cambios) como Fase 12, sin renumerar las tareas existentes. Las tareas nuevas se numeran T079 a T088. T081 y T087 son de documentación y ya están hechas; el resto está pendiente de implementar.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias)
- **[HUn]**: historia de usuario a la que pertenece la tarea (HU1 a HU8)
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
| HU8 Guía de uso y tutorial: navegación y accesos | P2 (transversal) | Jaime |

**Revisión 4 (separación de facturas)**: transversal a HU2 (formulario y listado de venta), HU3 (formulario y listado de compra) y HU7 (vistas, menú y estilos). Responsable por asignar entre Carolina, Matías y quien coordine HU7; conviene que una sola persona ejecute T071–T077 para evitar conflictos en `index.html`, `src/app.js` y `src/module-config.js`.

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: dejar el módulo base funcionando antes de modificarlo.

- [x] T001 Verificar que `src/` e `index.html` del módulo base estén en el repositorio; si faltan, obtenerlos desde el template `MDS-BI/Speckit_Template` (hecho el 03-11-2026: se copiaron `src/`, `index.html`, `tests/setup/` y las pruebas actuales del template, en un commit aparte)
- [x] T002 Ejecutar `npm install` y `npm run dev` en la raíz del repositorio, y comprobar que el módulo base abre en http://localhost:5173 (comprobado el 03-11-2026)
- [x] T003 [P] Ejecutar `npx vitest run` y confirmar que las pruebas existentes de `tests/unit/` y `tests/integration/` pasan antes de modificar nada (03-11-2026: 24 archivos y 73 pruebas pasan)
- [X] T004 Ejecutar `speckit.clarify` sobre `specs/001-erp-base-module/spec.md` para resolver los `[NEEDS CLARIFICATION]` (o resolverlos con el ayudante) y actualizar aquí las tareas marcadas "depende de aclaración" *(parcialmente hecho el 05-11-2026: el clarify se ejecutó con decisiones sobre granularidad de movimientos, fuente de KPIs, centro de costo, período de liquidación y alcance del menú; los `[NEEDS CLARIFICATION]` se resolvieron en la Revisión 3 de la spec — cierre formal registrado el 25-11-2026)*

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
- [X] T026 [HU2] Avisar o bloquear cuando las facturas Emitidas de un cliente superan su límite de crédito en `src/components/document-form.js` **(resuelto: aviso con confirmación explícita, sin bloqueo; FR-029)** **(superada por T121–T125)**
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

- [X] T045 Actualizar las instrucciones de uso (instalación, ejecución y pruebas) en `README.md`
- [X] T046 Completar el anexo de uso de IA (modelo, fecha y prompts) en `README.md`
- [X] T047 Mantener el registro de decisiones en `README.md` (o en issues de GitHub), como sugiere el enunciado
- [X] T048 Ejecutar `npm run check` (lint, formato y pruebas) y corregir lo que falle
- [X] T068 Actualizar `specs/001-erp-base-module/plan.md`: corregir la tabla de cobertura (FR-008/FR-010 y FR-011 con referencias desactualizadas; FR-020/021/022 apuntando a las tareas reales T064–T067; FR-009 → T055/T056; FR-014 → T057/T058; FR-015 → T057/T059; FR-017–FR-019 y SC-006 → T060–T063) y agregar `src/components/movements-list.js` a la estructura de código *(la tabla de cobertura se corrigió el 05-11-2026 como remediación del hallazgo I1 del análisis; `movements-list.js` se agregó a la estructura del plan el 25-11-2026)*
- [X] T070 Comprobar el presupuesto de rendimiento de `plan.md` (<100 ms en búsqueda y render; 500 registros): crear ~500 terceros y facturas (o extender `src/demo-data.js` con un lote opcional de estrés), medir búsqueda con `src/search.js` y render con `src/components/entity-list.js` y `src/components/document-list.js` (o los listados de factura de T073, si ya existen) en Vitest/jsdom o en la aplicación local (`npm run dev`), y registrar los resultados y cualquier justificación de trade-off en `specs/001-erp-base-module/quickstart.md` (Constitución, principio IV)
- [X] T078 Actualizar `specs/001-erp-base-module/data-model.md`, `specs/001-erp-base-module/contracts/invoice-views.md`, `specs/001-erp-base-module/contracts/entity-storage.md` y `specs/001-erp-base-module/plan.md` para dejar explícito que la separación de la Revisión 4 es lógica y de interfaz, no de almacenamiento: `erp.documents` sigue siendo la única colección y `customFields.tipoFactura` es el discriminante; documentar también las vistas, columnas e invariantes de `contracts/invoice-views.md` (FR-006)
- [X] T049 Recorrer el flujo completo con los datos de demostración (tercero, factura, emisión, pago y seguimiento) en la aplicación local (`npm run dev`), y confirmar que se hace en menos de 5 minutos (SC-005) y que una persona nueva registra un tercero y emite su primera factura en menos de 3 minutos (SC-001), siguiendo también las verificaciones de `specs/001-erp-base-module/quickstart.md`
- [X] T050 Comprobar que la interfaz solo usa datos ficticios y que `README.md` advierte que `localStorage` no es seguro (riesgos de datos)
- [X] T051 Ejecutar `speckit.analyze` para verificar la consistencia entre `specs/001-erp-base-module/spec.md`, `plan.md`, `data-model.md` y `tasks.md`
- [X] T052 Preparar la demostración funcional para la presentación final, usando `src/demo-data.js`

---

## Fase 11: Separación visual y funcional de facturas (Revisión 4, 2026-11-11; transversal a HU2, HU3 y HU7)

**Objetivo**: convertir la separación venta/compra en dos vistas, dos formularios y dos listados independientes con columnas propias, sin cambiar el almacenamiento único de `Document`.

**Prueba independiente**: abrir "Facturas de venta" y "Facturas de compra" desde el menú, crear una factura en cada una, comprobar que cada listado muestra solo su tipo y sus columnas (venta: Orden de venta; compra: Centro de costo y Período de liquidación), y que el formulario no permite cambiar el tipo.

**Requisitos previos**: Fases 1 y 2 completas y el ciclo de vida de facturas de HU2/HU3/HU4 implementado (T020–T034, T053–T059). T071 define los contenedores del DOM y bloquea a T072, T073 y T074.

**Diseño de referencia**: `specs/001-erp-base-module/contracts/invoice-views.md`, `specs/001-erp-base-module/data-model.md` (sección 4a) y `specs/001-erp-base-module/plan.md` (separación visual y funcional).

**Nota sobre tareas anteriores**: las tareas de interfaz que hoy nombran `src/components/document-form.js` y `src/components/document-list.js` (T011, T022, T024, T026, T029, T030, T033, T044, T056, T058, T059, T069 y la medición de T070) se implementan sobre `invoice-form.js` e `invoice-list.js` después de T072/T073. Se conservan las reglas de validación (`src/validation.js`), la colección de facturas y la generación de movimientos. `src/storage.js` protege el tipo, el folio y las fechas al editar una factura clasificada.

### Pruebas de la separación

- [X] T076 [P] [HU2] Escribir primero `tests/integration/invoice-separation.test.js`: dos vistas mutuamente excluyentes, dos formularios y dos listados, columnas por tipo, aislamiento venta/compra, tipo fijo e inyección de `customFields.tipoFactura`, y menú sin "Documentos"; actualizar `tests/integration/us10-documents.test.js`, `tests/integration/us12-lifecycle.test.js`, `tests/integration/us13-shell.test.js`, `tests/integration/foundation.test.js`, `tests/integration/us4-management.test.js`, `tests/integration/us5-config.test.js` y `tests/integration/us6-labels.test.js` para usar las vistas de venta y compra en lugar de `document-form`, `document-list`, `view-documents` y `nav-documents`; comprobar que fallan antes de implementar y que pasan con `npm run check` (Constitución, principio II)

### Vistas, formularios y listados

- [X] T071 [HU7] Crear las dos vistas independientes de factura en `index.html`: reemplazar `#view-documents` por `#view-invoice-sale` y `#view-invoice-purchase`, cada una con su formulario, su selector de edición y su contenedor de listado; retirar `#nav-documents` y `#qa-new-document`; conservar `#qa-new-invoice-sale` y `#qa-new-invoice-purchase` (FR-006, FR-020)
- [X] T072 [HU2] Crear la fábrica `createInvoiceForm({ tipoFactura, root, config, onSubmit })` en `src/components/invoice-form.js`, con estado por instancia (`editingId`, entidades, opciones) y consultas acotadas al `root` mediante `data-field`, `data-error` y `data-custom-fields`; crear `src/components/invoice-sale-form.js` (`tipoFactura: 'venta'`, campo `salesOrderId`, terceros `cliente`) y `src/components/invoice-purchase-form.js` (`tipoFactura: 'compra'`, campos `centroCosto` y `periodoLiquidacion`, terceros `proveedor`/`personal`); el formulario no muestra el tipo y lo inyecta al leer los valores; retirar los IDs globales de `src/components/document-form.js` (FR-006, FR-009, FR-014, FR-015)
- [X] T073 [P] [HU3] Crear el renderizador `renderInvoiceList(container, documents, entities, { tipoFactura, columns, onEdit, onDelete })` en `src/components/invoice-list.js`, con filtro obligatorio por `customFields.tipoFactura`, agrupación por tercero, estado vacío y atributo `data-tipo-factura`; definir en `src/components/invoice-sale-list.js` las columnas Folio, Estado, Emisión, Vencimiento, Total y Orden de venta (`salesOrderId`), y en `src/components/invoice-purchase-list.js` las columnas Folio, Estado, Emisión, Vencimiento, Total, Centro de costo y Período de liquidación (FR-006, FR-009, FR-014, FR-015)

### Navegación, configuración y estilos

- [X] T074 [HU7] Quitar `documents` de `NAV_MODULES` y agrupar las dos entradas de factura bajo "Facturación" en `src/components/shell.js`; vincular los módulos `invoice-sale` e `invoice-purchase` a sus secciones en el layout, ocultar y mostrar las dos vistas en `showModule`, y separar los manejadores de envío, edición y eliminación por tipo en `src/app.js` (FR-006, FR-020, FR-022)
- [X] T075 [P] [HU7] Agregar estilos distintivos en `src/styles.css`: `.invoice-view--sale` y `.invoice-view--purchase` (borde y acento), `.invoice-badge--sale` y `.invoice-badge--purchase`, y la tabla de listado con `thead`/`tbody`, columnas alineadas y desplazamiento horizontal en móvil (FR-006)
- [X] T077 [P] [HU3] Declarar `INVOICE_VIEWS` en `src/module-config.js` con el módulo y la vista, el `tipoFactura` fijo, los terceros admitidos, los campos propios visibles y las columnas del listado para cada tipo, y exponer un helper de preset por tipo para que formularios y listados no dupliquen etiquetas ni columnas (FR-006, FR-009, FR-014, FR-015)

**Punto de control**: cada factura se crea, lista y edita solo desde la vista de su tipo, con sus columnas propias, y `erp.documents` sigue siendo la única clave de almacenamiento de facturas.

---

## Fase 12: HU8 - Guía de uso y tutorial: navegación, accesos y primer recorrido (Prioridad: P2, transversal)

**Objetivo**: documentar la navegación y los accesos del módulo y ofrecer una guía paso a paso (panel no modal) que enseñe el primer flujo completo, sin guardar datos ni agregar entradas al menú.

**Prueba independiente**: con el módulo vacío y luego con los datos de demostración, abrir la guía desde el botón del marco y desde el home, recorrer sus 8 pasos con "Siguiente", "Anterior" e "Ir a", cerrar con el botón y con Esc, y comprobar que `erp.entities`, `erp.documents` y `erp.movements` no cambian.

**Requisitos previos**: Fases 9 y 11 completas (menú, home y vistas de factura separadas). No cambia el modelo de datos ni `src/storage.js`. El diseño de referencia es `specs/001-erp-base-module/contracts/navigation-and-access.md`.

### Pruebas de HU8

- [X] T079 [P] [HU8] Escribir primero `tests/integration/tutorial.test.js`: el botón "Guía de uso" está en todas las vistas y abre el primer paso; el acceso del home abre lo mismo; "Siguiente", "Anterior" y "Finalizar" funcionan con el indicador "Paso n de 8"; "Ir a" navega a la vista correcta sin recargar y la guía sigue abierta; Esc y "Cerrar" cierran y devuelven el foco a `#open-guide`; con el módulo vacío y con datos de demostración, `erp.entities`, `erp.documents` y `erp.movements` quedan idénticos antes y después (FR-031 a FR-035, SC-007) (superada por T112)
- [X] T080 [P] [HU8] Escribir `tests/unit/tutorial-steps.test.js`: cada paso de `GUIDE_STEPS` apunta a un módulo que existe en el menú (`NAV_MODULES` de `src/components/shell.js`), los textos usan los términos de `config.labels` y los módulos del mapa de `contracts/navigation-and-access.md` coinciden con los del menú (FR-032, FR-036, SC-008) (superada por T113)

### Implementación de HU8

- [X] T081 [HU8] Documentar la navegación y los accesos en `specs/001-erp-base-module/contracts/navigation-and-access.md`: mapa de vistas, accesos rápidos del home, reglas de acceso del MVP y contrato de la guía de uso con sus 8 pasos (FR-036)
- [X] T082 [HU8] Agregar en `index.html` el botón "Guía de uso" (`#open-guide`) en el marco general, el acceso "¿Primera vez? Ver la guía" (`#qa-guide`) en el home y el contenedor del panel de la guía (`#guide-panel`, `role="dialog"`, `aria-modal="false"`, título asociado con `aria-labelledby`), sin agregar ninguna entrada al menú (FR-031, FR-035) (superada por T114)
- [X] T083 [HU8] Crear `src/components/tutorial.js` con `GUIDE_STEPS` (8 pasos: panel, terceros, facturas de venta, facturas de compra, emitir y pagar, movimientos, seguimiento y datos de demostración) y la fábrica `createTutorial({ config, root, openButton, onNavigate })` con `open`, `close`, `next`, `prev`, `goTo` e `isOpen`; los términos Tercero y Factura salen de `config.labels` y los nombres de las vistas de `navLabel` (FR-032, FR-033, FR-034) (superada por T115)
- [X] T084 [HU8] Conectar la guía en `src/app.js` y `src/components/shell.js`: exportar `NAV_MODULES` y `navLabel` (hoy son privados, y los usan la guía y la prueba T080), abrirla desde `#open-guide` y `#qa-guide`, usar la navegación existente para "Ir a", cerrar con Esc y devolver el foco; la guía no llama a `src/storage.js` ni crea claves `erp.*` (FR-033, FR-034, FR-035) (superada por T116)
- [X] T085 [P] [HU8] Agregar estilos del panel en `src/styles.css`: tarjeta fija no modal, foco visible, contraste suficiente y adaptación a pantallas pequeñas sin tapar el menú (FR-035) (superada por T117)
- [X] T086 [HU8] Actualizar `specs/001-erp-base-module/quickstart.md` (paso inicial: abrir la guía de uso) y `README.md` (sección "Guía de uso", coordinada con T045) para que las instrucciones mencionen la guía (FR-031) (superada por T118)
- [X] T087 [HU8] Actualizar `specs/001-erp-base-module/plan.md`: agregar `tutorial.js` y `navigation-and-access.md` a la estructura del proyecto y las filas FR-031 a FR-036, SC-007 y SC-008 a la tabla de cobertura
- [X] T088 [HU8] Ejecutar `npm run check` y recorrer la guía en `npm run dev` con el módulo vacío y con la demostración; medir que una persona nueva la completa en menos de 5 minutos y registra su primer tercero y factura en menos de 3 (SC-007) (superada por T119)

**Punto de control**: la guía se abre, avanza, navega y se cierra igual en todas las vistas, no modifica datos, y el mapa de accesos coincide con el menú real.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundacional (Fase 2)**: depende de la Preparación y **bloquea todas las historias**. T053–T054 completan la configuración de la Revisión 3 y deben resolverse antes de las historias (T015, T022, T029 y T041 dependen de la opción `personal` y de los campos nuevos).
- **Historias (Fases 3 a 9)**: dependen de la fase Fundacional. Pueden avanzar en paralelo si hay personas disponibles, o en orden de prioridad (P1 → P2 → P3).
- **Movimientos financieros (Fase 6b)**: depende de Fases 2, 4 y 6 (se genera al emitir y al pagar); habilita la vista de movimientos de HU7 y completa SC-006.
- **HU7 (Fase 9)**: transversal; su prueba (T064) implica las vistas de T063 y T069 para el menú completo, pero el menú con las vistas base puede probarse antes.
- **Separación de facturas (Fase 11)**: depende de las Fases 1 y 2 y del ciclo de vida de facturas de HU2–HU4. T071 bloquea a T072, T073 y T074; T076 se escribe primero y se cierra al final; T078 (Fase 10) documenta el resultado.
- **Guía de uso (Fase 12)**: depende de las Fases 9 y 11 (menú, home y vistas de factura). T079 y T080 se escriben primero; T082, T083 y T085 pueden avanzar en paralelo y T084 las conecta. Toca `index.html`, `src/app.js` y `src/components/shell.js`: avisar al grupo antes de editarlos. T081 y T087 (documentación) ya están hechas.
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
- **HU8 (P2)**: puede empezar cuando existen el menú y las vistas (HU7 y Revisión 4); no depende de la lógica de facturas, terceros ni movimientos y no cambia el modelo de datos.

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
- [Story] = [HUn], historia del spec (HU1 a HU8) para trazabilidad.
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

- [X] **Tarea 9:** Escribir pruebas unitarias en `tests/unit/document-validation.test.js` para la validación de facturas: cliente existente obligatorio, `folio` entero positivo, `totalAmount` no negativo, `endDate` igual o posterior a `startDate` y estado inicial Borrador.
- [X] **Tarea 10:** Escribir pruebas de integración en `tests/integration/us10-documents.test.js` que cubran el registro de una factura desde el formulario, su asociación al `entity_id` del cliente y el rechazo de monto negativo, vencimiento anterior a la emisión y cliente inexistente.
- [X] **Tarea 11:** Ajustar `index.html` y `src/components/document-form.js` para capturar cliente, `series` opcional, `folio`, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`) y monto total (`totalAmount`), mostrando mensajes de error por campo.
- [X] **Tarea 12:** Implementar en `src/storage.js` la validación de factura: `entity_id` debe coincidir con un `Entity.entity_id` existente, `folio` entero positivo, `totalAmount` requerido y no negativo, `startDate`/`endDate` requeridas y `endDate >= startDate`.
- [X] **Tarea 13:** Implementar en `src/storage.js` el alta de facturas mediante `addDocument`, persistiendo `entity_id`, `folio`, `series`, fechas, `totalAmount`, estado inicial Borrador e identificadores/timestamps automáticos; aplicar las mismas validaciones en `updateDocument`.
- [X] **Tarea 14:** Implementar en `src/components/document-form.js` la emisión de la factura, permitiendo la transición Borrador -> Emitida y bloqueando estados no permitidos o salidas desde Pagada.
- [X] **Tarea 15:** Mostrar en `src/components/document-list.js` el monto total, la fecha de vencimiento y el estado de cada factura asociada al cliente.
- [X] **Tarea 16:** Verificar la integridad referencial y el borrado en cascada: impedir facturas sin cliente válido y eliminar las facturas asociadas al eliminar un cliente.
- [X] **Tarea 17:** Ejecutar `npx vitest run`, corregir los fallos y validar con `npm run dev` el flujo completo: crear cliente -> registrar factura en Borrador -> emitir factura -> visualizar la deuda del cliente.

---

## Fase 13: US9 (HU9) - Flujo de caja (Revisión 6, 2026-11-23; Prioridad: P2)

**Propósito**: registrar retroactivamente el Flujo de caja implementado en `ec14932` y dejar explícitas las verificaciones pendientes de formato y acceso por rol. La etiqueta `US9` equivale a la HU9 del `spec.md`.

**Prueba independiente**: con facturas de venta y compra en estado Pagada, incluida una de personal, se abre Flujo de caja y se comprueban filas, orden por fecha de pago, etiquetas, totales y ausencia de facturas Borrador o Emitida.

### Pruebas de US9 implementadas

- [X] T089 [P] [US9] Actualizar `tests/integration/us14-dashboard-summary.test.js` para abrir `#qa-cashflow`, comprobar que `#view-cashflow` queda visible y validar que la Caja neta del Panel coincide con el neto calculado desde facturas Pagadas, entidades y movimientos reales (FR-039, FR-044, SC-010; implementada en ec14932 por Matías Espinoza)

### Implementación de US9 implementada

- [X] T090 [US9] Crear `src/cashflow.js` con `computeCashflow(documents, entities, movements)`: filtrar solo facturas `Pagada`, clasificar venta como Ingreso «Cobro factura de venta», compra como Egreso «Factura de compra» y compra de `personal` como «Liquidación de sueldo», ordenar por fecha de pago ascendente y calcular `ingresos`, `egresos` y `neto` sin exponer haberes, descuentos ni bonos (FR-037 a FR-039, SC-009; implementada en ec14932 por Matías Espinoza)
- [X] T091 [US9] Crear `src/components/cashflow.js` con `renderCashflowView(container)`: tabla de solo lectura con columnas Fecha, Tipo, Categoría, Tercero, Documento (serie-folio) y Monto, tarjetas de Ingresos, Egresos y Neto, y estado vacío `#cashflow-empty` cuando no hay facturas Pagadas (FR-037, FR-039, FR-040; implementada en ec14932 por Matías Espinoza)
- [X] T092 [US9] Agregar en `index.html` la vista `#view-cashflow`, el acceso `#nav-cashflow` y el acceso rápido `#qa-cashflow`, y conectarlos en `src/app.js` (`VIEWS`, `ACCESS_MATRIX`, navegación y render de la vista) y en `src/components/shell.js` (`ADMIN_MODULES`, `FINANCE_MODULES` y `navLabel`) sin mostrar la entrada al rol `trabajador` (FR-037, FR-045, SC-011; implementada en ec14932 por Matías Espinoza)
- [X] T093 [P] [US9] Agregar en `src/styles.css` los estilos de la tabla `#cashflow-table`, las tarjetas `.cashflow-summary` y el estado vacío del Flujo de caja, manteniendo el marco visual de HU7 (FR-037, FR-039; implementada en ec14932 por Matías Espinoza)
- [X] T094 [P] [US9] Actualizar `README.md` para mencionar el acceso al Flujo de caja desde el menú y el Panel (FR-037; implementada en ec14932 por Matías Espinoza)

---

## Fase 14: US10 (HU10) - Resumen financiero del Panel (Revisión 6, 2026-11-23; Prioridad: P2)

**Propósito**: registrar retroactivamente los tres indicadores financieros del Panel implementados en `ec14932`, complementando los KPIs de HU7 sin reemplazarlos. La etiqueta `US10` equivale a la HU10 del `spec.md`.

**Prueba independiente**: con facturas Emitidas y Pagadas, se abre el Panel y se comprueban Saldo neto, Deuda pendiente y Caja neta junto a los KPIs existentes, sus fórmulas y la actualización tras registrar pagos.

### Pruebas de US10 implementadas

- [X] T095 [P] [US10] Ampliar `tests/integration/us14-dashboard-summary.test.js` con entidades, facturas de venta/compra/personal en estado Pagada y facturas Emitidas, y comprobar que `#summary-saldo` es `400`, `#summary-deuda` es `600` y `#summary-caja` es `500`, además de los accesos rápidos del Panel (FR-041 a FR-044, SC-010; implementada en ec14932 por Matías Espinoza)

### Implementación de US10 implementada

- [X] T096 [US10] Crear `src/summary.js` con `computeDashboardSummary(entities, documents, movements)`: reutilizar `computeDebtSummary` y `computeCashflow` para devolver `saldo = por cobrar - por pagar`, `deuda = por cobrar + por pagar` y `caja = neto`, junto a `ingresos`, `egresos`, totales y vencidas (FR-042 a FR-044, SC-010; implementada en ec14932 por Matías Espinoza)
- [X] T097 [US10] Actualizar `src/components/dashboard.js` para llamar a `computeDashboardSummary` desde `refreshDashboard()` y escribir `#summary-saldo`, `#summary-deuda` y `#summary-caja` sin sustituir `#kpi-por-cobrar`, `#kpi-por-pagar` ni `#kpi-vencidas` (FR-041 a FR-044; implementada en ec14932 por Matías Espinoza)
- [X] T098 [US10] Agregar en `index.html` el marcado del Resumen financiero con `#summary-saldo`, `#summary-deuda` y `#summary-caja`, y completar `src/styles.css` con sus tarjetas para que el Panel muestre cero o estado vacío claro sin datos (FR-041, FR-044, FR-045; implementada en ec14932 por Matías Espinoza)

---

## Fase 15: Formato CLP y verificación de roles (Revisión 6, 2026-11-23; FR-045 y FR-046)

**Propósito**: cerrar la mejora pendiente de formato de montos en pesos chilenos y verificar la excepción de acceso de las HU9/HU10 frente al rol `trabajador`. Estas tareas quedan sin marcar; las de prueba se ejecutan antes que sus implementaciones o verificaciones correspondientes.

**Dependencias**: T099–T102 pueden avanzar en paralelo; T103 crea el formateador compartido; T104–T107 dependen de T103 y tocan archivos distintos; T108–T109 preceden a T110; T111 puede avanzar en paralelo con las pruebas.

### Pruebas primero: formato CLP

- [X] T099 [P] [US10] Escribir primero las pruebas de formato CLP del Panel en `tests/integration/us14-dashboard-summary.test.js`: `#summary-saldo`, `#summary-deuda`, `#summary-caja`, `#kpi-por-cobrar` y `#kpi-por-pagar` deben mostrar separador de miles y conservar el signo negativo delante de `$`, con ejemplos normativos `$1.240.000` y `-$2.430.000` (FR-046, SC-012)
- [X] T100 [P] [US9] Escribir primero las pruebas de formato CLP del Flujo de caja en `tests/integration/cashflow-format.test.js`: `#cashflow-ingresos`, `#cashflow-egresos`, `#cashflow-neto` y la columna Monto de `#cashflow-table` deben usar `$1.240.000` y conservar el signo en `-$2.430.000` (FR-046, SC-012)
- [X] T101 [P] [US9] Escribir primero las pruebas de formato CLP de Movimientos financieros en `tests/integration/movements-format.test.js`: el monto renderizado por `src/components/movements-list.js` debe usar separador de miles y signo delante de `$` para valores negativos (FR-046, SC-012)
- [X] T102 [P] [US10] Escribir primero las pruebas de formato CLP de Seguimiento en `tests/integration/tracking-format.test.js`: los totales por cobrar y por pagar renderizados por `src/components/tracking.js` deben usar `$1.240.000` y `-$2.430.000` cuando corresponda (FR-046, SC-012)

### Implementación pendiente: formato CLP

- [X] T103 [US10] Crear `src/format.js` con `formatCurrencyCLP(value)` usando `Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })` o equivalente que produzca exactamente `$1.240.000` y `-$2.430.000`, y reutilizarlo también desde `src/components/payroll-list.js` para alinear Mi liquidación (FR-046, SC-012; depende de T099–T102)
- [X] T104 [US10] Actualizar `src/components/dashboard.js` para formatear con `formatCurrencyCLP` los valores escritos en `#summary-saldo`, `#summary-deuda`, `#summary-caja`, `#kpi-por-cobrar` y `#kpi-por-pagar`, dejando `#kpi-vencidas` como recuento (FR-046, SC-012; depende de T103)
- [X] T105 [US9] Actualizar `src/components/cashflow.js` para formatear con `formatCurrencyCLP` las tarjetas `#cashflow-ingresos`, `#cashflow-egresos`, `#cashflow-neto` y cada celda de la columna Monto de `#cashflow-table` (FR-046, SC-012; depende de T103)
- [X] T106 [US9] Actualizar `src/components/movements-list.js` para formatear con `formatCurrencyCLP` el monto de cada movimiento financiero (FR-046, SC-012; depende de T103)
- [X] T107 [US10] Actualizar `src/components/tracking.js` para formatear con `formatCurrencyCLP` los textos «Total por cobrar» y «Total por pagar» del Seguimiento (FR-046, SC-012; depende de T103)

### Pruebas primero: acceso por rol

- [X] T108 [P] [US9] Escribir primero pruebas en `tests/integration/navigation-menu.test.js` con sesión de `trabajador`: `#nav-cashflow` y `#qa-cashflow` deben estar ocultos, `#view-cashflow` no debe hacerse visible, `canAccess('cashflow', session)` debe ser `false` y `resolveRoute('cashflow', session)` debe devolver `payroll-worker` sin datos del módulo (FR-045, SC-011)
- [X] T109 [P] [US10] Escribir primero pruebas en `tests/integration/navigation-menu.test.js` con sesión de `trabajador`: `#view-dashboard` debe permanecer oculto y `#summary-saldo`, `#summary-deuda`, `#summary-caja` y sus tarjetas no deben mostrarse ni contener valores del Resumen financiero (FR-045, SC-011)

### Verificación y documentación pendiente

- [X] T110 [P] [US9] Verificar en `src/app.js` y `src/components/shell.js` que `ACCESS_MATRIX` y los listados de menú mantengan `cashflow` y `dashboard` vedados al rol `trabajador`, ejecutar `npm run check` y comprobar en `npm run dev` que un acceso directo a Flujo de caja o Panel redirige a `payroll-worker` sin exponer datos (FR-045, SC-011; depende de T108 y T109)
- [X] T111 [P] [US10] Actualizar `specs/001-erp-base-module/contracts/navigation-and-access.md` para documentar `#view-cashflow`, el acceso `#nav-cashflow`, el acceso rápido `#qa-cashflow`, el Resumen financiero del Panel y la excepción de roles: solo `administrador` y `finanzas`, nunca `trabajador` (FR-036, FR-045)

---

## Fase 16: HU8 revisada - Guía de uso por rol (Revisión 7, 2026-11-23; Prioridad: P2, transversal)

**Propósito**: reemplazar la HU8 original con la guía descrita en la sesión de Clarifications más reciente y en `specs/001-erp-base-module/contracts/navigation-and-access.md`: acceso solo con sesión, entrada desde el menú ☰ para los tres roles, entrada del Panel solo para administrador y finanzas, pasos filtrados por rol y sin efectos sobre datos o sesión. Estas tareas quedan sin marcar; las pruebas se escriben antes que la implementación.

**Prueba independiente**: iniciar sesión como administrador, finanzas y trabajador; abrir la guía desde `#menu-guide` en los tres casos y desde `#qa-guide` solo en los dos primeros; recorrer los pasos correspondientes, usar "Anterior", "Siguiente"/"Finalizar", "Ir a", "Cerrar" y Escape, comprobar el foco y verificar que no cambian `erp.entities`, `erp.documents`, `erp.movements`, `erp.accesses` ni `erp.session`.

**Dependencias**: T112 y T113 pueden ejecutarse en paralelo y deben escribirse primero. T114 define el marcado; T115 depende del contrato y del control de acceso existente; T116 depende de T114 y T115; T117 y T118 pueden avanzar en paralelo con T115; T119 cierra la fase después de T116–T118.

### Pruebas primero: HU8 revisada

- [X] T112 [P] [HU8] Escribir primero pruebas de integración en `tests/integration/tutorial.test.js` y, si hace falta, casos adicionales en `tests/integration/navigation-menu.test.js`: con sesión iniciada, `#menu-guide` está visible en el menú desplegable ☰ «Utilidades & Sesión» para `administrador`, `finanzas` y `trabajador` y abre la guía; `#qa-guide` del Panel solo está visible para `administrador` y `finanzas`; sin sesión no aparece ninguna entrada de guía; el recorrido por rol coincide con `specs/001-erp-base-module/contracts/navigation-and-access.md` (administrador y finanzas: `panel`, `entities`, `invoice-sale`, `invoice-purchase`, `issue-pay`, `payroll-admin`, `movements`, `cashflow`, `tracking`, `menu`, `cuidados`; trabajador: `payroll-worker`, `cuidados`), "Accesos" y "Avisos al desarrollador" solo se mencionan al administrador, y el paso `payroll-worker` indica que el trabajador ve su última liquidación con el desglose (sueldo base, descuentos y bonos) y el historial de sus propios pagos, en solo lectura, según la HU3 de la spec 002 (FR-031, FR-032, SC-007, SC-008)
- [X] T113 [P] [HU8] Escribir primero `tests/unit/tutorial-steps.test.js`: el catálogo y la selección por rol en `src/components/tutorial.js` usan los IDs, títulos y orden del contrato, calculan "Paso n de m" según el total del rol, filtran con `canAccess`/`ACCESS_MATRIX` de `src/app.js`, no ofrecen "Ir a" en los pasos `menu` y `cuidados`, toman términos de `config.labels` y `navLabel`, y no escriben ninguna clave `erp.*` (FR-032, FR-033, FR-036, SC-008)

### Implementación de HU8 revisada

- [X] T114 [HU8] Agregar en `index.html` la opción "Guía de uso" (`#menu-guide`) dentro de `#utilities-menu` del menú ☰ para los tres roles, el acceso "¿Primera vez? Ver la guía" (`#qa-guide`) en `#view-dashboard` solo para administrador y finanzas, y el contenedor `#guide-panel` con `role="dialog"`, `aria-modal="false"`, `aria-labelledby`, título, cuerpo, indicador de paso y controles `#guide-prev`, `#guide-next`, `#guide-go` y `#guide-close`, inicialmente oculto y sin crear una vista nueva de FR-020 (FR-031, FR-035)
- [X] T115 [HU8] Crear `src/components/tutorial.js` con `GUIDE_STEPS` y `getGuideSteps({ role, session, canAccess })` usando el catálogo de pasos del contrato (`panel`, `entities`, `invoice-sale`, `invoice-purchase`, `issue-pay`, `payroll-admin`, `movements`, `cashflow`, `tracking`, `menu`, `payroll-worker`, `cuidados`) filtrado por el control de acceso existente `canAccess`/`ACCESS_MATRIX` inyectado desde `src/app.js` para evitar ciclos; implementar `createTutorial({ config, root, session, canAccess, onNavigate })` con `open`, `close`, `next`, `prev`, `goTo` e `isOpen`, "Finalizar" en el último paso, "Ir a" solo para módulos permitidos por el rol, contenido de Cuidados con datos ficticios/contraseña inicial de 4 dígitos del RUT/control solo de interfaz, y sin importar ni llamar a `src/storage.js` ni crear claves `erp.*` (FR-032 a FR-035)
- [X] T116 [HU8] Conectar la guía en `src/app.js` y `src/components/shell.js`: exportar `navLabel` y, si hace falta, `NAV_MODULES`, abrir desde `#menu-guide` para los tres roles y desde `#qa-guide` solo para administrador y finanzas, pasar `canAccess` y la sesión a `createTutorial`, usar `showModule` para "Ir a", cerrar con "Cerrar" y Escape, devolver el foco al control que abrió el panel, actualizar la visibilidad al iniciar y cerrar sesión, y no escribir datos ni crear claves de almacenamiento (FR-031, FR-033 a FR-035)
- [X] T117 [P] [HU8] Agregar estilos del panel en `src/styles.css`: tarjeta no modal sobre el contenido, foco visible, contraste suficiente, botones de Anterior/Siguiente/Finalizar/Ir a/Cerrar, adaptación a pantallas pequeñas y compatibilidad con el menú ☰ abierto (FR-035)
- [X] T118 [P] [HU8] Actualizar `specs/001-erp-base-module/quickstart.md` y `README.md` para describir login obligatorio con roles, demostración cargada desde la pantalla de acceso, menú desplegable ☰, entrada a la guía por rol, pasos filtrados por rol con Cuidados al final y ninguna modificación de datos por la guía (FR-031, FR-036)
- [X] T119 [HU8] Ejecutar `npm run check` al final y recorrer la guía en `npm run dev` con administrador, finanzas y trabajador, con módulo vacío y con demostración cargada desde el acceso: verificar entradas, pasos por rol, controles, foco, redirecciones y ausencia de cambios en datos o sesión, y comprobar SC-007 y SC-008 (FR-031 a FR-036)
- [X] T120 [HU8] Corregir FR-035: si al cerrar la guía el control que la abrió ya no está visible (opción «Guía de uso» con el menú ☰ cerrado o acceso del Panel tras «Ir a»), devolver el foco al botón ☰ (`#menu-toggle`); actualizar `spec.md`, `src/components/tutorial.js` y dos casos en `tests/integration/tutorial.test.js`, y verificar con `npm run check`

---

## Fase 17: FR-029 - Aviso por límite de crédito al emitir factura de venta (Revisión 8, 2026-11-25; Prioridad: P1, HU2)

**Propósito**: implementar las decisiones de la sesión de Clarifications del 2026-11-25 sobre FR-029, sin regenerar ni renumerar tareas. T026 queda superada por T121–T125, sin marcarla ni borrarla.

**Prueba independiente**: con un cliente con límite, facturas de venta Emitidas no pagadas y una factura en Borrador, emitir desde `#invoice-sale-form` debe mostrar un aviso con límite, deuda y exceso; confirmar emite la factura y cancelar la deja en Borrador sin cambiar el almacenamiento. Sin límite o sin exceso no debe aparecer el aviso.

**Dependencias**: T121–T123 se escriben primero en el mismo archivo y deben fallar antes de la implementación; T124 depende de esas pruebas; T125 cierra la fase. No se cambian el modelo de datos, las claves `erp.*`, las specs 002, 003 y 004 ni la identidad visual.

### Pruebas primero: FR-029

- [X] T121 [HU2] Escribir primero en `tests/integration/invoice-credit-limit.test.js` la prueba de que, al emitir desde `#invoice-sale-form` una factura de venta en Borrador para un cliente con límite cuya deuda pendiente (suma de sus facturas de venta Emitidas no pagadas, excluida la factura en edición) más el total supera el límite, se invoca `window.confirm` con un mensaje que contiene el límite, la deuda actual y el exceso calculado como `deuda + total − límite`; usar las ayudas de `tests/setup/domFixture.js` y comprobar que la prueba falla antes de T124
- [X] T122 [HU2] Ampliar `tests/integration/invoice-credit-limit.test.js` con los dos desenlaces del aviso: al confirmar (`window.confirm` devuelve `true`) la factura pasa a Emitida y genera su movimiento de cargo; al cancelar (`false`) permanece en Borrador y las colecciones `erp.salesInvoices`, `erp.entities` y `erp.movements` quedan idénticas a su estado inicial
- [X] T123 [HU2] Ampliar `tests/integration/invoice-credit-limit.test.js` con los casos sin aviso: un cliente sin `creditLimit` no invoca `window.confirm`, y un cliente con límite cuya deuda más el total es igual o menor al límite tampoco lo invoca y la emisión continúa sin bloqueo

### Implementación: FR-029

- [X] T124 [HU2] Implementar en `src/components/invoice-sale-form.js` (con los ajustes mínimos que hagan falta en `src/components/invoice-form.js` para propagar el envío, sin tocar `src/storage.js`) la comprobación previa a la emisión: cuando `values.status === 'Emitida'`, calcular la deuda del cliente desde sus facturas de venta Emitidas no pagadas, leer `creditLimit` del tercero y, si existe y `deuda + total > límite`, pedir confirmación explícita reutilizando `window.confirm` o el mecanismo ya existente en `src/app.js` con un mensaje con límite, deuda y exceso; al cancelar NO llamar a `onSubmit` ni escribir almacenamiento, y al confirmar continuar con `onSubmit`. No agregar campos, claves `erp.*` ni cambios de identidad visual

### Cierre de la fase

- [X] T125 [HU2] Ejecutar `npm run check` (definido en `package.json`) al terminar T124: lint, `format:check` y `npm test -- --run`; verificar que `tests/integration/invoice-credit-limit.test.js` y las pruebas existentes de facturas pasen, y corregir lo que falle sin desmarcar ni renumerar tareas ajenas

**Punto de control**: FR-029 queda cubierto por pruebas primero y por la implementación en el formulario de facturas de venta, con emisión confirmada, cancelación sin cambios y ausencia de aviso cuando no aplica.
































































































