---

description: "Lista de tareas para el mÃ³dulo de Contabilidad y Finanzas: FacturaciÃ³n y Pagos"
---

# Tareas: FacturaciÃ³n y Pagos (MÃ³dulo de Contabilidad y Finanzas)

**Entrada**: Documentos de diseÃ±o en `/specs/001-erp-base-module/`

**Requisitos previos**: `plan.md`, `spec.md`, `data-model.md`, `contracts/entity-storage.md`

**Pruebas**: Se incluyen tareas de prueba porque la constituciÃ³n del proyecto exige cubrir con pruebas automatizadas el comportamiento visible y la lÃ³gica de negocio.

**OrganizaciÃ³n**: Las tareas estÃ¡n agrupadas por historia de usuario (HU1 a HU7 del `spec.md`) para poder implementar y probar cada una de forma independiente.

> **Nota sobre la consolidaciÃ³n de la RevisiÃ³n 3 (2026-11-05).** Esta corrida de `speckit.tasks` consolida los requisitos de la RevisiÃ³n 3 del spec sin eliminar las tareas existentes ni renumerarlas (T001 a T052 conservan su ID porque estÃ¡n referenciados desde `plan.md` y tienen estado registrado). Las tareas nuevas se numeran T053 a T070 y se insertan en su fase correspondiente, aunque su nÃºmero sea mayor que el de tareas posteriores. Lo incorporado: `personal` en `tipoTercero`; facturas de venta y de compra como documentos separados con listados propios (FR-006); `salesOrderId` (FR-009); centro de costo (FR-014); perÃ­odo de liquidaciÃ³n (FR-015); movimientos financieros auto-generados de solo lectura con granularidad de un movimiento por evento (FR-017 a FR-019, SC-006); y la HU7 de arquitectura de UI (FR-020 a FR-022). AdemÃ¡s, el anÃ¡lisis `/speckit.analyze` del 05-11-2026 remediÃ³ sus hallazgos: T068 (tabla de cobertura de plan.md, hallazgo I1), T070 (mediciÃ³n del presupuesto de rendimiento, hallazgo C2) y el registro de la desviaciÃ³n e2e en plan.md (hallazgo C1); el total es 70 tareas (T001 a T070).

> **Nota sobre cÃ³mo se generÃ³.** Este archivo se armÃ³ siguiendo las reglas de `speckit.tasks` (formato, fases y orden), a partir del `spec.md`, el `plan.md` y el `data-model.md` actuales. `speckit.analyze` se ejecutÃ³ el 02-11-2026 (Mauro) y otra vez el 03-11-2026 (Jaime). Sus propuestas siguen pendientes de revisar; el `speckit.clarify` se completÃ³ el 05-11-2026 (ver nota de RevisiÃ³n 3 mÃ¡s abajo). Las tareas marcadas **(depende de aclaraciÃ³n)** restantes quedan provisionales hasta su revisiÃ³n.

## Formato: `[ID] [P?] [Historia] DescripciÃ³n`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias)
- **[HUn]**: historia de usuario a la que pertenece la tarea (HU1 a HU7)
- Cada tarea incluye la ruta exacta del archivo

## ConvenciÃ³n de rutas

Proyecto Ãºnico (Vite + JavaScript vanilla), segÃºn `plan.md`: `src/` y `tests/` en la raÃ­z del repositorio.

## AsignaciÃ³n de historias de usuario

Cada integrante se hace cargo de una historia: sube su historia al `spec.md`, la refina y lidera sus tareas.

| Historia | Prioridad | Responsable |
|---|---|---|
| HU1 Registrar terceros | P1 | Jaime |
| HU2 Emitir facturas de venta | P1 | Carolina |
| HU3 Registrar facturas de compra | P1 | MatÃ­as |
| HU4 Registrar el pago y marcar Pagada | P2 | Javier |
| HU5 Ver deuda por tercero y vencidas | P2 | ElÃ­as |
| HU6 Datos de demostraciÃ³n y otros mÃ³dulos | P3 | Mauro |
| HU7 Arquitectura de UI: home con KPIs y menÃº desacoplado | P1 (transversal) | Por asignar (coordinaciÃ³n: equipo) |

---

## Fase 1: PreparaciÃ³n (infraestructura compartida)

**PropÃ³sito**: dejar el mÃ³dulo base funcionando antes de modificarlo.

- [x] T001 Verificar que `src/` e `index.html` del mÃ³dulo base estÃ©n en el repositorio; si faltan, obtenerlos desde el template `MDS-BI/Speckit_Template` (hecho el 03-11-2026: se copiaron `src/`, `index.html`, `tests/setup/` y las pruebas actuales del template, en un commit aparte)
- [x] T002 Ejecutar `npm install` y `npm run dev` en la raÃ­z del repositorio, y comprobar que el mÃ³dulo base abre en http://localhost:5173 (comprobado el 03-11-2026)
- [x] T003 [P] Ejecutar `npx vitest run` y confirmar que las pruebas existentes de `tests/unit/` y `tests/integration/` pasan antes de modificar nada (03-11-2026: 24 archivos y 73 pruebas pasan)
- [ ] T004 Ejecutar `speckit.clarify` sobre `specs/001-erp-base-module/spec.md` para resolver los `[NEEDS CLARIFICATION]` (o resolverlos con el ayudante) y actualizar aquÃ­ las tareas marcadas "depende de aclaraciÃ³n" *(parcialmente hecho el 05-11-2026: el clarify se ejecutÃ³ con decisiones sobre granularidad de movimientos, fuente de KPIs, centro de costo, perÃ­odo de liquidaciÃ³n y alcance del menÃº; los `[NEEDS CLARIFICATION]` se resolvieron en la RevisiÃ³n 3 de la spec â€” falta registrar aquÃ­ el cierre formal)*

---

## Fase 2: Fundacional (requisitos que bloquean todas las historias)

**PropÃ³sito**: configuraciÃ³n del mÃ³dulo que todas las historias necesitan.

**CRÃTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T005 Conectar la configuraciÃ³n del mÃ³dulo al arranque de la aplicaciÃ³n en `src/module-config.js` y `src/main.js` (ya implementada: `main.js` llama `initApp(userConfig)`; comprobado con prueba de arranque el 03-11-2026)
- [X] T006 Configurar `moduleName` ("Contabilidad y Finanzas: FacturaciÃ³n y Pagos") y `labels` (Tercero, Terceros, Factura, Facturas) en `src/module-config.js`
- [X] T007 Declarar el campo personalizado `tipoTercero` (entidad, selecciÃ³n, obligatorio, opciones `cliente`, `proveedor` y `personal`) en `src/module-config.js` *(la opciÃ³n `personal` faltÃ³ en la implementaciÃ³n actual; se completa en T053)*
- [X] T008 Declarar los campos personalizados `tipoFactura` (selecciÃ³n, obligatorio, opciones `venta` y `compra`), `montoPagado` (nÃºmero) y `fechaPago` (fecha) para documentos en `src/module-config.js` *(faltan `centroCosto`, `periodoLiquidacion` y `salesOrderId`; se completan en T053)*
- [X] T009 Configurar `statusLifecycle` con los estados Borrador, Emitida y Pagada, y las transiciones Borrador â†’ Emitida â†’ Pagada, sin salidas desde Pagada, en `src/module-config.js`
- [X] T010 [P] Escribir pruebas de la configuraciÃ³n (sin colisiÃ³n de claves con los campos base, estados y transiciones vÃ¡lidos) en `tests/unit/module-config.test.js`
- [X] T011 Asegurar que toda factura nueva inicie en Borrador (FR-011) en `src/components/document-form.js` y `src/storage.js`
- [X] T012 Validar que una factura de venta solo se asocie a un tercero cliente, y una de compra a un proveedor o personal, en `src/validation.js`
- [X] T053 Completar la configuraciÃ³n pendiente en `src/module-config.js`: agregar la opciÃ³n `personal` a `tipoTercero` (FR-001/FR-012) y declarar los campos personalizados `centroCosto` (select, opciones `Activo` y `Consumible`, FR-014), `periodoLiquidacion` (text, FR-015) y `salesOrderId` (text, FR-009/FR-027) para documentos
- [X] T054 [P] Ampliar las pruebas de configuraciÃ³n en `tests/unit/module-config.test.js`: las tres opciones de `tipoTercero`, los campos nuevos sin colisiÃ³n con claves base y sus opciones de select vÃ¡lidas (depende de T053)

**VerificaciÃ³n del bloque (03-11-2026)**: se reutilizaron las 73 pruebas del template, haciendo explÃ­cita la configuraciÃ³n base en las pruebas genÃ©ricas. Se agregaron 21 casos para configuraciÃ³n financiera, arranque real desde `main.js`, creaciÃ³n en Borrador, persistencia y asociaciÃ³n venta/cliente y compra/proveedor en alta y ediciÃ³n, incluido el error en formulario. `npm run check` pasa con 25 archivos y 94 pruebas; `npm run build` pasa. La interacciÃ³n se comprobÃ³ con Vitest/jsdom, no mediante un recorrido manual en navegador. Este cierre solo comprende T005â€“T012: T004, las confirmaciones documentales, las historias completas y las tareas nuevas T053â€“T054 continÃºan pendientes. No se modificaron la constituciÃ³n ni `plan.md`.

**Punto de control**: la configuraciÃ³n carga sin errores y la base estÃ¡ lista; ya se pueden empezar las historias.

---

## Fase 3: HU1 - Registrar terceros: clientes, proveedores y personal (Prioridad: P1)

**Objetivo**: registrar, editar, buscar y eliminar clientes, proveedores y personal.

**Prueba independiente**: registrar un cliente, un proveedor y un trabajador, y comprobar que aparecen en el listado y que se pueden buscar.

### Pruebas de HU1

- [X] T013 [P] [HU1] Prueba de validaciÃ³n de terceros (nombre y cÃ³digo obligatorios, lÃ­mite de crÃ©dito no negativo, `tipoTercero` obligatorio) en `tests/unit/validation.test.js`
- [X] T014 [P] [HU1] Prueba de integraciÃ³n: registrar cliente, proveedor y personal, buscarlos y eliminar uno con facturas (borrado en cascada de facturas y de movimientos financieros; los movimientos se prueban a fondo en T061) en `tests/integration/us1-create-entity.test.js`

### ImplementaciÃ³n de HU1

- [X] T015 [HU1] Adaptar el formulario de terceros para mostrar nombre, cÃ³digo, RUT, lÃ­mite de crÃ©dito y tipo de tercero en `src/components/entity-form.js`
- [X] T016 [HU1] Aplicar el lÃ­mite de crÃ©dito solo a terceros de tipo cliente en `src/components/entity-form.js` y `src/validation.js`
- [X] T017 [HU1] Pedir confirmaciÃ³n antes de eliminar un tercero que tiene facturas (FR-005) en `src/app.js`
- [X] T018 [HU1] Validar formato y dÃ­gito verificador del RUT, y definir si puede repetirse, en `src/validation.js` **(resuelto: formato chileno con mÃ³dulo 11, sin unicidad; ver FR-028)**
- [X] T019 [HU1] Confirmar que el mÃ³dulo base ya rechaza cÃ³digos de tercero duplicados sin distinguir mayÃºsculas (`DUPLICATE_CODE` en `src/validation.js`, con prueba en `tests/unit/validation.test.js`). No requiere cambios en el cÃ³digo; el par serie-folio de las facturas se trata en T027

**Punto de control**: la HU1 funciona y se puede probar sola.

---

## Fase 4: HU2 - Emitir facturas de venta (Prioridad: P1)

**Objetivo**: crear una factura de venta a un cliente y pasarla de Borrador a Emitida, con la trazabilidad `salesOrderId`.

**Prueba independiente**: con un cliente registrado, crear una factura en Borrador, emitirla y ver que aparece como Emitida.

### Pruebas de HU2

- [X] T020 [P] [HU2] Prueba de validaciÃ³n de facturas (folio entero positivo, vencimiento igual o posterior a la emisiÃ³n, descuento no mayor al subtotal, tercero existente) en `tests/unit/document-validation.test.js`
- [X] T021 [P] [HU2] Prueba de integraciÃ³n: crear factura de venta en Borrador, emitirla y comprobar que no se puede volver a Borrador en `tests/integration/us12-lifecycle.test.js`
- [X] T055 [P] [HU2] Prueba del campo `salesOrderId`: opcional, texto libre no vacÃ­o cuando se ingresa (vacÃ­o se admite), se persiste y se muestra en el detalle de la factura en `tests/unit/document-validation.test.js` y `tests/integration/us12-lifecycle.test.js` (FR-009)

### ImplementaciÃ³n de HU2

- [X] T022 [HU2] Adaptar el formulario de facturas para mostrar tipo de factura, serie, folio, fecha de emisiÃ³n (`startDate`), fecha de vencimiento (`endDate`), subtotal, descuento, impuesto, total y moneda (una sola en el MVP, por definir) en `src/components/document-form.js`
- [X] T023 [HU2] Rotular `startDate` como "Fecha de emisiÃ³n" y `endDate` como "Fecha de vencimiento" en `src/module-config.js` **(depende de confirmar la equivalencia con el ayudante)**
- [X] T024 [HU2] Permitir la transiciÃ³n Borrador â†’ Emitida y bloquear el retroceso en `src/components/document-form.js`
- [X] T025 [HU2] Exigir el monto total al emitir en `src/validation.js` **(resuelto: obligatorio al emitir; cero solo en Borrador)**
- [ ] T026 [HU2] Avisar o bloquear cuando las facturas Emitidas de un cliente superan su lÃ­mite de crÃ©dito en `src/components/document-form.js` **(resuelto: aviso con confirmaciÃ³n explÃ­cita, sin bloqueo; FR-029)**
- [X] T027 [HU2] Evitar facturas duplicadas con la misma serie y folio en `src/validation.js` **(resuelto: Ãºnica por (tipo de documento, serie, folio) dentro de su tipo; FR-030)**
- [X] T056 [HU2] Agregar el campo `salesOrderId` al formulario de facturas de venta (visible solo cuando `tipoFactura` es `venta`) y validar que, si se ingresa, no estÃ© vacÃ­o, en `src/components/document-form.js` y `src/validation.js` (FR-009)

**Punto de control**: las HU1 y HU2 funcionan juntas y por separado.

---

## Fase 5: HU3 - Registrar facturas de compra (Prioridad: P1)

**Objetivo**: crear una factura de compra a un proveedor (o a personal) y emitirla, con centro de costo y perÃ­odo de liquidaciÃ³n cuando corresponde.

**Prueba independiente**: con un proveedor registrado, crear una factura de compra con centro de costo, emitirla y ver que aparece como deuda por pagar.

### Pruebas de HU3

- [X] T028 [P] [HU3] Prueba de integraciÃ³n: crear factura de compra, emitirla, rechazar un monto negativo y distinguirla de las de venta en `tests/integration/us10-documents.test.js`
- [X] T057 [P] [HU3] Prueba de `centroCosto` (obligatorio al emitir, indefinido solo en Borrador, Activo o Consumible) y de `periodoLiquidacion` (obligatorio y formato `YYYY-MM` vÃ¡lido, no posterior a la emisiÃ³n, solo cuando el tercero es personal; no aplica a proveedores) en `tests/unit/document-validation.test.js` y `tests/integration/us10-documents.test.js` (FR-014, FR-015)

### ImplementaciÃ³n de HU3

- [X] T029 [HU3] Mostrar en el selector de tercero solo proveedores cuando el tipo de factura es compra, y solo clientes cuando es venta, en `src/components/document-form.js`
- [X] T030 [HU3] Mostrar el tipo de factura (venta o compra), el monto total y la fecha de vencimiento en el listado de facturas en `src/components/document-list.js`
- [X] T058 [HU3] Agregar el campo `centroCosto` (select Activo/Consumible) al formulario de compra, exigirlo al emitir en `src/validation.js` y mostrarlo en el listado en `src/components/document-form.js` y `src/components/document-list.js` (FR-014)
- [X] T059 [HU3] Agregar el campo `periodoLiquidacion` visible solo cuando el tercero es de tipo personal, con validaciÃ³n `YYYY-MM` no posterior a la fecha de emisiÃ³n, en `src/components/document-form.js` y `src/validation.js` (FR-015)
- [X] T069 [HU3] Presentar facturas de venta y de compra como listados separados: dos entradas de menÃº que abren `src/components/document-list.js` filtrado por `tipoFactura`, con sus columnas propias (venta: `salesOrderId`; compra: `centroCosto`), en `src/components/shell.js` y `src/components/document-list.js` (FR-006; depende de T065)

**Punto de control**: las HU1, HU2 y HU3 funcionan de forma independiente.

---

## Fase 6: HU4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

**Objetivo**: registrar el monto y la fecha de pago de una factura Emitida y marcarla como Pagada.

**Prueba independiente**: con una factura Emitida, registrar el pago y comprobar que pasa a Pagada.

### Pruebas de HU4

- [X] T031 [P] [HU4] Prueba de validaciÃ³n del pago (monto pagado igual al total, fecha de pago obligatoria, factura en Borrador no se puede pagar, Pagada no admite cambios) en `tests/unit/document-validation.test.js`
- [X] T032 [P] [HU4] Prueba de integraciÃ³n: emitir, registrar el pago y marcar Pagada en `tests/integration/us12-lifecycle.test.js`

### ImplementaciÃ³n de HU4

- [X] T033 [HU4] Mostrar los campos de monto pagado y fecha de pago al marcar una factura como Pagada en `src/components/document-form.js`
- [X] T034 [HU4] Rechazar el paso a Pagada si `montoPagado` es distinto de `totalAmount` o falta `fechaPago` (FR-016) en `src/validation.js`

**Punto de control**: el ciclo completo de la factura funciona (Borrador â†’ Emitida â†’ Pagada).

---

## Fase 6b: Movimientos financieros (FR-017 a FR-019, SC-006; transversal a HU2, HU3 y HU4)

**Objetivo**: generar automÃ¡ticamente un movimiento financiero de solo lectura por cada emisiÃ³n y cada pago, y listarlos sin permitir ediciÃ³n.

**Prueba independiente**: emitir una factura de venta y una de compra, pagar una de ellas, y comprobar que hay un movimiento por evento con el monto, el tercero y los campos correspondientes; eliminar la factura y comprobar que sus movimientos desaparecen.

**Requisitos previos**: Fase 2 completa (T053) y el ciclo de vida de HU4.

### Pruebas de movimientos

- [X] T060 [P] Prueba unitaria de la generaciÃ³n de movimientos: un cargo por emisiÃ³n de venta, un abono por emisiÃ³n de compra, una contrapartida `pago` por el pago (venta: abono; compra: cargo), con `monto` igual a `totalAmount`, `fecha` del evento, `entity_id` y `document_id` correctos, y copia de `centroCosto` (compra) o `salesOrderId` (venta) cuando corresponden, en `tests/unit/movements.test.js` (FR-017, FR-018, SC-006)
- [X] T061 [P] Prueba de integraciÃ³n: los movimientos se generan al emitir y pagar vÃ­a `addDocument`/`updateDocument`, se eliminan en cascada con `deleteDocument` y `deleteDocumentsForEntity` (FR-005), no existen operaciones para editarlos o eliminarlos manualmente y no estÃ¡n expuestos a mutaciÃ³n en la capa de almacenamiento en `tests/integration/movements.test.js` (FR-019)

### ImplementaciÃ³n de movimientos

- [X] T062 Implementar la generaciÃ³n y el registro de movimientos en `src/movements.js`, guardÃ¡ndolos en `erp.movements`, y conectar los ganchos en `src/storage.js` (`addDocument` y `updateDocument` al transicionar a Emitida o Pagada; `deleteDocument` y `deleteDocumentsForEntity` eliminan los movimientos vinculados; no expone funciones de ediciÃ³n) (FR-017 a FR-019; depende de las Fases 2, 4 y 6)
- [X] T063 Crear el listado de movimientos financieros de solo lectura (fecha, documento, tercero, tipo, monto, centro de costo o `salesOrderId` segÃºn corresponda) en un componente nuevo `src/components/movements-list.js`, y registrar la vista en `src/app.js` (FR-019; depende de T062 y T065)

**Punto de control**: cada emisiÃ³n y pago del ciclo completo deja su movimiento trazable y conciliado en monto (SC-006); la tabla es solo lectura.

---

## Fase 7: HU5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

**Objetivo**: mostrar cuÃ¡nto se debe cobrar y pagar por tercero, y quÃ© facturas estÃ¡n vencidas.

**Prueba independiente**: con varias facturas en distintos estados y fechas, abrir el seguimiento y comprobar los totales y las vencidas.

### Pruebas de HU5

- [X] T035 [P] [HU5] Prueba unitaria de los cÃ¡lculos (total por cobrar, total por pagar, vencidas, exclusiÃ³n de Borrador y Pagada) en `tests/unit/tracking.test.js`
- [X] T036 [P] [HU5] Prueba de integraciÃ³n de la vista de seguimiento en `tests/integration/tracking.test.js`

### ImplementaciÃ³n de HU5

- [X] T037 [P] [HU5] Crear las funciones de cÃ¡lculo de deuda por tercero y facturas vencidas (FR-023 a FR-025; sobre las facturas, no sobre los movimientos) en `src/tracking.js`
- [X] T038 [HU5] Crear la vista de seguimiento en `src/components/tracking.js`
- [X] T039 [HU5] Agregar el botÃ³n "Seguimiento" a la barra lateral y a las acciones rÃ¡pidas en `src/components/shell.js` y `src/components/dashboard.js`

**Punto de control**: las HU1 a HU5 funcionan de forma independiente.

---

## Fase 8: HU6 - Datos de demostraciÃ³n y referencias genÃ©ricas a otros mÃ³dulos (Prioridad: P3)

**Objetivo**: cargar ejemplos ficticios para probar cobros y pagos, y permitir guardar una referencia manual a otro mÃ³dulo.

**Avance confirmado**: la redacciÃ³n de HU6 y sus cinco escenarios de aceptaciÃ³n estÃ¡n incorporados en `spec.md` mediante el commit [5d72123](https://github.com/MDS-BI/Grupo-01/commit/5d721239f3da3af443de44f4c292bdfcb7839fae). Este avance es documental; no significa que el cargador, el botÃ³n o las pruebas ya estÃ©n implementados.

**Requisitos previos**: completar las Fases 1 y 2 (incluido T053) y usar las reglas compartidas de HU1 a HU4. Antes de preparar los ejemplos definitivos, resolver las decisiones pendientes sobre moneda y monto total *(resueltas: CLP Ãºnica y total > 0 al emitir, 2026-11-03)*. Los ejemplos no deben saltarse las validaciones ni introducir campos duplicados, y deben incluir terceros de tipo personal con perÃ­odos de liquidaciÃ³n vÃ¡lidos (`YYYY-MM`).

**Alcance de las referencias**: por ahora se usa un campo de texto genÃ©rico, siguiendo la orientaciÃ³n del ayudante comunicada por Jaime. Se puede anotar, por ejemplo, "Ventas: pedido PED-035". No hay conexiÃ³n en vivo ni validaciÃ³n contra los sistemas de otros grupos. El formato definitivo se confirmarÃ¡ con el profesor; coordinar identificadores con otros grupos no bloquea esta versiÃ³n.

**Prueba independiente**: con el mÃ³dulo vacÃ­o, cargar los ejemplos, revisar sus relaciones y recargar la pÃ¡gina. Repetir la carga y comprobar que no hay duplicados. Probar tambiÃ©n con registros ingresados previamente y verificar que se conservan. Guardar y volver a consultar una referencia en un tercero y en una factura.

### Pruebas de HU6

- [X] T040 [HU6] Escribir primero los escenarios de prueba en `tests/integration/demo-data.test.js`: carga inicial con clientes, proveedores y facturas de venta y compra; casos Borrador, Emitida y Pagada; facturas Emitidas vencidas y vigentes; conservaciÃ³n de registros y relaciones al iniciar de nuevo la aplicaciÃ³n con el mismo almacenamiento; segundo intento sin duplicados; rechazo de carga cuando ya exista algÃºn tercero o factura, sin modificar los datos previos. Incluir la conservaciÃ³n de la referencia de un tercero y de una factura al guardar, cerrar y volver a abrir. Comprobar que las pruebas detectan la funcionalidad faltante y, despuÃ©s de implementar T041 a T044, ejecutarlas hasta que pasen.

### ImplementaciÃ³n de HU6

- [X] T041 [HU6] Crear los ejemplos y su funciÃ³n de carga en `src/demo-data.js`, usando solo datos ficticios y la moneda acordada (CLP). Incluir clientes, proveedores y personal con facturas del tipo correspondiente; estados Borrador, Emitida y Pagada; y facturas Emitidas con vencimiento pasado y futuro al cargar. Todas las facturas deben tener fechas vÃ¡lidas. Las Pagadas deben tener monto pagado igual al total y fecha de pago. Usar las operaciones y transiciones compartidas del mÃ³dulo, vinculando cada factura al `entity_id` de su tercero. Cargar Ãºnicamente si no existen terceros ni facturas; repetir la operaciÃ³n o encontrar datos previos debe conservar el contenido sin agregar ejemplos ni borrar registros.

- [X] T042 [HU6] Agregar "Cargar datos de demostraciÃ³n" al panel en `src/components/dashboard.js` y conectar su acciÃ³n con la funciÃ³n de `src/demo-data.js`. Mostrar un aviso de carga completada o de mÃ³dulo con datos, mantener los registros existentes y actualizar la vista y sus estadÃ­sticas despuÃ©s de una carga exitosa. Si falla el almacenamiento, mostrar el error sin informar que la carga terminÃ³ correctamente.

- [X] T043 [HU6] Definir la clave del campo opcional "Referencia a otro mÃ³dulo" para terceros y facturas, sin colisionar con campos base, y declararlo en `src/module-config.js`. Documentar su nombre, tipo texto, carÃ¡cter opcional y conservaciÃ³n en `specs/001-erp-base-module/data-model.md` y `specs/001-erp-base-module/contracts/entity-storage.md`; reflejarlo en `specs/001-erp-base-module/mer.png` cuando se actualice el diagrama. Registrar el alcance genÃ©rico de esta versiÃ³n y separar la confirmaciÃ³n futura del formato de identificadores. Esta tarea reemplaza la coordinaciÃ³n inmediata con otros grupos planteada en el borrador anterior.

- [X] T044 [HU6] Mostrar y permitir guardar y consultar la referencia genÃ©rica en `src/components/entity-form.js` y `src/components/document-form.js`, respetando las reglas de ediciÃ³n y pago de HU4. Utilizar el mecanismo de campos personalizados y la persistencia de `src/storage.js`; verificar que la referencia no se descarte ni reemplace el vÃ­nculo `entity_id` entre factura y tercero. Completar en `tests/integration/demo-data.test.js` los casos de referencia en ambos registros, incluidos su conservaciÃ³n despuÃ©s de recargar y el guardado con el campo vacÃ­o.

### Seguimiento y coherencia

- T040 a T044 siguen pendientes: se marcan con `[x]` solo cuando su resultado estÃ© implementado y comprobado. Tener la historia escrita, una prueba redactada o un archivo creado no basta para afirmar que la funciÃ³n ya estÃ¡ terminada.
- Se conservan los identificadores de las tareas para no alterar referencias del resto del trabajo. Se retiran las marcas `[P]` de este bloque: el cargador depende de las reglas comunes, y las pruebas deben revisarse junto con la implementaciÃ³n.
- Antes de implementar, alinear la referencia genÃ©rica (FR-027) descrita aquÃ­ con el campo opcional "Referencia a otro mÃ³dulo". Esta ediciÃ³n no cambia los requisitos ni el modelo de datos: T043 deja explÃ­cita la actualizaciÃ³n que falta.
- El borrador anterior pedÃ­a ejemplos "con y sin vencimiento". Se corrige a facturas vencidas y vigentes, todas con fechas vÃ¡lidas, para respetar FR-007.
- Coordinar con los responsables de HU1, HU2 y HU3 la ediciÃ³n de `src/module-config.js`, `src/components/entity-form.js` y `src/components/document-form.js`, porque son archivos compartidos.
- Al terminar, ejecutar las pruebas de HU6 y las del mÃ³dulo base. Revisar tambiÃ©n T049 (recorrido completo), T051 (consistencia documental) y T052 (demostraciÃ³n final); son tareas de cierre del grupo y no se consideran completadas por actualizar esta secciÃ³n.

**Punto de control**: los cinco escenarios de aceptaciÃ³n de HU6 se pueden demostrar; los datos y referencias se conservan, la carga repetida no duplica registros y la demostraciÃ³n no altera datos existentes.

---

## Fase 9: HU7 - Arquitectura de UI: marco general, home con KPIs y menÃº desacoplado (Prioridad: P1, transversal)

**Objetivo**: consolidar el marco de navegaciÃ³n: menÃº desacoplado con vistas fijas, home con KPIs calculados sobre las facturas y navegaciÃ³n sin recarga.

**Prueba independiente**: con datos de demostraciÃ³n cargados, navegar por el menÃº entre home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento, y comprobar que el marco y el menÃº se mantienen estables sin importar la vista activa y sin recargar la pÃ¡gina.

**Requisitos previos**: Fase 2 completa (T053â€“T054). La vista de movimientos usa T063 y los KPIs usan T037.

### Pruebas de HU7

- [X] T064 [P] [HU7] Prueba de integraciÃ³n de navegaciÃ³n: el menÃº es constante entre vistas (home, terceros, facturas de venta, facturas de compra, movimientos financieros, seguimiento), el contenido central se reemplaza sin recargar la pÃ¡gina completa y el home muestra los KPIs (o estado vacÃ­o con acceso a la carga de demostraciÃ³n) en `tests/integration/us13-shell.test.js` y `tests/integration/us3-dashboard.test.js` (FR-020 a FR-022; amplÃ­a las pruebas existentes del template)

### ImplementaciÃ³n de HU7

- [X] T065 [HU7] Consolidar el menÃº desacoplado con vistas fijas del mÃ³dulo (home, terceros, facturas de venta, facturas de compra, movimientos financieros y seguimiento), componente estÃ¡tico independiente del contenido, en `src/components/shell.js` (FR-020; las entradas de venta y compra dependen de T069 y la de movimientos de T063)
- [X] T066 [HU7] Completar el home con los KPIs (total por cobrar, total por pagar y facturas vencidas, calculados sobre las facturas vÃ­a `src/tracking.js`), accesos directos a crear tercero, crear factura de venta, crear factura de compra, abrir seguimiento y, con el mÃ³dulo vacÃ­o, cargar datos de demostraciÃ³n, en `src/components/dashboard.js` (FR-021; depende de T037 y dialoga con T042)
- [X] T067 [HU7] Verificar y ajustar que el cambio de vista reemplaza el contenido central sin recargar la pÃ¡gina completa ni perder el marco general, en `src/app.js` (FR-022)

**Punto de control**: el marco, el menÃº, el home y sus KPIs se comportan igual en todas las vistas, con y sin datos.

---

## Fase 10: Cierre y aspectos transversales

**PropÃ³sito**: mejoras que afectan a varias historias.

- [ ] T045 Actualizar las instrucciones de uso (instalaciÃ³n, ejecuciÃ³n y pruebas) en `README.md`
- [ ] T046 Completar el anexo de uso de IA (modelo, fecha y prompts) en `README.md`
- [ ] T047 Mantener el registro de decisiones en `README.md` (o en issues de GitHub), como sugiere el enunciado
- [X] T048 Ejecutar `npm run check` (lint, formato y pruebas) y corregir lo que falle
- [ ] T068 Actualizar `specs/001-erp-base-module/plan.md`: corregir la tabla de cobertura (FR-008/FR-010 y FR-011 con referencias desactualizadas; FR-020/021/022 apuntando a las tareas reales T064â€“T067; FR-009 â†’ T055/T056; FR-014 â†’ T057/T058; FR-015 â†’ T057/T059; FR-017â€“FR-019 y SC-006 â†’ T060â€“T063) y agregar `src/components/movements-list.js` a la estructura de cÃ³digo *(la tabla de cobertura se corrigiÃ³ el 05-11-2026 como remediaciÃ³n del hallazgo I1 del anÃ¡lisis; falta agregar `movements-list.js` a la estructura del plan cuando se implemente la vista)*
- [ ] T070 Comprobar el presupuesto de rendimiento de `plan.md` (<100 ms en bÃºsqueda y render; 500 registros): crear ~500 terceros y facturas (o extender `src/demo-data.js` con un lote opcional de estrÃ©s), medir bÃºsqueda con `src/search.js` y render con `src/components/entity-list.js` y `src/components/document-list.js` en Vitest/jsdom o en la aplicaciÃ³n local (`npm run dev`), y registrar los resultados y cualquier justificaciÃ³n de trade-off en `specs/001-erp-base-module/quickstart.md` (ConstituciÃ³n, principio IV)
- [ ] T049 Recorrer el flujo completo con los datos de demostraciÃ³n (tercero, factura, emisiÃ³n, pago y seguimiento) en la aplicaciÃ³n local (`npm run dev`), y confirmar que se hace en menos de 5 minutos (SC-005) y que una persona nueva registra un tercero y emite su primera factura en menos de 3 minutos (SC-001), siguiendo tambiÃ©n las verificaciones de `specs/001-erp-base-module/quickstart.md`
- [ ] T050 Comprobar que la interfaz solo usa datos ficticios y que `README.md` advierte que `localStorage` no es seguro (riesgos de datos)
- [ ] T051 Ejecutar `speckit.analyze` para verificar la consistencia entre `specs/001-erp-base-module/spec.md`, `plan.md`, `data-model.md` y `tasks.md`
- [ ] T052 Preparar la demostraciÃ³n funcional para la presentaciÃ³n final, usando `src/demo-data.js`

---

## Dependencias y orden de ejecuciÃ³n

### Dependencias entre fases

- **PreparaciÃ³n (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundacional (Fase 2)**: depende de la PreparaciÃ³n y **bloquea todas las historias**. T053â€“T054 completan la configuraciÃ³n de la RevisiÃ³n 3 y deben resolverse antes de las historias (T015, T022, T029 y T041 dependen de la opciÃ³n `personal` y de los campos nuevos).
- **Historias (Fases 3 a 9)**: dependen de la fase Fundacional. Pueden avanzar en paralelo si hay personas disponibles, o en orden de prioridad (P1 â†’ P2 â†’ P3).
- **Movimientos financieros (Fase 6b)**: depende de Fases 2, 4 y 6 (se genera al emitir y al pagar); habilita la vista de movimientos de HU7 y completa SC-006.
- **HU7 (Fase 9)**: transversal; su prueba (T064) implica las vistas de T063 y T069 para el menÃº completo, pero el menÃº con las vistas base puede probarse antes.
- **Cierre (Fase 10)**: depende de las historias que se quieran entregar.

### Dependencias entre historias

- **HU1 (P1)**: puede empezar tras la fase Fundacional; no depende de otras historias.
- **HU2 (P1)**: puede empezar tras la fase Fundacional; necesita clientes para probarse, pero se puede probar con datos creados en la prueba.
- **HU3 (P1)**: puede empezar tras la fase Fundacional; reutiliza el formulario de facturas de la HU2.
- **HU4 (P2)**: necesita facturas Emitidas (HU2 o HU3).
- **Movimientos (6b)**: necesita emisiones (HU2/HU3) y pagos (HU4) para probar los tres tipos de movimiento.
- **HU5 (P2)**: necesita facturas en distintos estados (HU2, HU3 y HU4).
- **HU6 (P3)**: puede empezar tras la fase Fundacional; los datos de demostraciÃ³n usan los campos de las demÃ¡s historias (incluido `personal` y `periodoLiquidacion` de T053).
- **HU7 (P1)**: puede empezar tras la fase Fundacional; las vistas que navega llegan de las demÃ¡s historias (KPIs de T037, movimientos de T063, listados separados de T069).

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de implementar.
- Primero las reglas de `src/validation.js` (y `src/storage.js` si hace falta), luego los formularios y vistas.
- La historia se completa antes de pasar a la siguiente prioridad.

### Oportunidades de paralelismo

- Las tareas de PreparaciÃ³n marcadas [P].
- Las pruebas de una misma historia marcadas [P].
- T054, T055, T057, T060 y T061 son pruebas [P] en archivos nuevos o distintos entre sÃ­.
- DespuÃ©s de la fase Fundacional, cada integrante puede trabajar una historia distinta; HU7 (T064â€“T067) se puede asignar en paralelo porque toca `shell.js`/`dashboard.js`/`app.js`, distintos de los archivos de HU1â€“HU4.

---

## Ejemplo de paralelismo: HU1

```text
# Pruebas de la HU1 juntas:
Tarea: "Prueba de validaciÃ³n de terceros en tests/unit/validation.test.js"
Tarea: "Prueba de integraciÃ³n de terceros en tests/integration/us1-create-entity.test.js"
```

---

## Estrategia de implementaciÃ³n

### Primero el MVP (HU1, HU2 y HU3)

1. Completar la Fase 1: PreparaciÃ³n.
2. Completar la Fase 2: Fundacional (bloquea todo, incluidas T053â€“T054).
3. Completar la Fase 3: HU1.
4. Completar las Fases 4 y 5: HU2 y HU3 (con T055 y T057â€“T059, T069).
5. **Detenerse y validar**: probar cada historia de forma independiente.
6. Mostrar la demo si estÃ¡ lista.

### Entrega incremental

1. PreparaciÃ³n + Fundacional â†’ base lista.
2. Agregar HU1, HU2 y HU3 â†’ probar â†’ demo (MVP).
3. Agregar HU4 y movimientos (Fase 6b) â†’ probar â†’ demo (cada evento deja su movimiento).
4. Agregar HU5 â†’ probar â†’ demo.
5. Agregar HU6 â†’ probar â†’ demo final.
6. HU7 va en paralelo desde el Fundacional y se demuestra junto con el flujo completo.
7. Cada entrega suma valor sin romper las anteriores.

### Estrategia con varios integrantes

1. El grupo completa juntos la PreparaciÃ³n y la fase Fundacional (incluido T053).
2. Luego cada integrante toma una historia (ver la tabla de asignaciÃ³n) y se asigna HU7.
3. Las historias se integran y se prueban de forma independiente.

---

## Notas

- [P] = archivos distintos, sin dependencias.
- [Story] = [HUn], historia del spec (HU1 a HU7) para trazabilidad.
- Cada historia debe poder completarse y probarse de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Antes de dar por terminada cada historia, ejecutar `npm run check` (puertas de calidad de `plan.md`). Con el mÃ³dulo base, `npm run check` ya pasa completo (lint, formato y 73 pruebas).
- La bÃºsqueda de terceros (FR-004) y los listados de terceros y facturas ya vienen en el mÃ³dulo base (`src/search.js`, `src/components/entity-list.js` y `src/components/document-list.js`): T013, T014 y T030 comprueban o adaptan lo que ya existe.
- `src/movements.js`, `src/components/movements-list.js`, `src/tracking.js`, `src/components/tracking.js` y `src/demo-data.js` son archivos nuevos, extensiones del mÃ³dulo base segÃºn la estructura de `plan.md`; T068 deja el plan al dÃ­a.
- Hacer un commit despuÃ©s de cada tarea o grupo lÃ³gico de tareas. Los commits los hace cada integrante a mano, no la IA, como pide el curso. Si un comando de Speckit ofrece hacer un commit automÃ¡tico, responder que no.
- Varias historias toman los mismos archivos (`src/storage.js`, `src/components/document-form.js` y `tests/unit/document-validation.test.js`). Si dos integrantes los editan a la vez puede haber conflictos al subir los cambios a `main`: conviene avisar al grupo antes de editarlos y hacer Fetch y Pull antes de empezar.
- Las tareas marcadas **(depende de aclaraciÃ³n)** deben revisarse al resolver los `[NEEDS CLARIFICATION]` del `spec.md`.
- Evitar tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan su independencia.

---

## Anexo: tareas propuestas por Caro para la HU2

Caro agregÃ³ estas tareas en `main` para la HU2 (EmisiÃ³n y Registro de Facturas a Clientes). Se conservan como referencia: cubren lo mismo que T020 a T027 de la Fase 4, pero con mÃ¡s detalle en las validaciones. Al regenerar este archivo con `speckit.tasks`, hay que compararlas y consolidarlas en una sola lista. Las Tareas 1 a 8 de esa versiÃ³n anterior (cambios en `module-config.js`, instalaciÃ³n y prueba local) corresponden a las Fases 1 y 2 de este archivo, y las Tareas 1 y 2 (MER y archivos iniciales de Speckit) ya estÃ¡n hechas.

> **ResoluciÃ³n de la consolidaciÃ³n (2026-11-05).** Esta corrida de `speckit.tasks` ya consolidÃ³ el anexo: las Tareas 9 y 10 estÃ¡n cubiertas por T020 y T028 (ampliadas con T055/T057); la Tarea 11 por T022; las Tareas 12 y 13 por T012, T025 y las validaciones base del template (ya comprobadas); la Tarea 14 por T024; la Tarea 15 por T030 y T069; la Tarea 16 por el borrado en cascada del template, comprobado en T014 y T061 (con movimientos); y la Tarea 17 por T048/T049. El anexo queda solo como referencia histÃ³rica y ya no requiere comparaciÃ³n en futuras regeneraciones.

Depende de las Tareas 3 y 6 de esa versiÃ³n (etiquetas Cliente/Factura y ciclo de vida Borrador, Emitida, Pagada), que aquÃ­ son T006 y T009. Reutilizar los campos base definidos en `data-model.md`: `entity_id`, `series`, `folio`, `startDate` (emisiÃ³n), `endDate` (vencimiento), `totalAmount` y `status`; no crear campos duplicados. Varias de estas validaciones (tercero existente, folio entero positivo, fechas, descuento y monto no negativo) ya las hace el mÃ³dulo base en `src/validation.js` y se cubren en `tests/unit/document-validation.test.js`; en las tareas 12 y 13 solo falta lo propio del mÃ³dulo (total obligatorio al emitir y estado inicial Borrador).

- [ ] **Tarea 9:** Escribir pruebas unitarias en `tests/unit/document-validation.test.js` para la validaciÃ³n de facturas: cliente existente obligatorio, `folio` entero positivo, `totalAmount` no negativo, `endDate` igual o posterior a `startDate` y estado inicial Borrador.
- [ ] **Tarea 10:** Escribir pruebas de integraciÃ³n en `tests/integration/us10-documents.test.js` que cubran el registro de una factura desde el formulario, su asociaciÃ³n al `entity_id` del cliente y el rechazo de monto negativo, vencimiento anterior a la emisiÃ³n y cliente inexistente.
- [ ] **Tarea 11:** Ajustar `index.html` y `src/components/document-form.js` para capturar cliente, `series` opcional, `folio`, fecha de emisiÃ³n (`startDate`), fecha de vencimiento (`endDate`) y monto total (`totalAmount`), mostrando mensajes de error por campo.
- [ ] **Tarea 12:** Implementar en `src/storage.js` la validaciÃ³n de factura: `entity_id` debe coincidir con un `Entity.entity_id` existente, `folio` entero positivo, `totalAmount` requerido y no negativo, `startDate`/`endDate` requeridas y `endDate >= startDate`.
- [ ] **Tarea 13:** Implementar en `src/storage.js` el alta de facturas mediante `addDocument`, persistiendo `entity_id`, `folio`, `series`, fechas, `totalAmount`, estado inicial Borrador e identificadores/timestamps automÃ¡ticos; aplicar las mismas validaciones en `updateDocument`.
- [ ] **Tarea 14:** Implementar en `src/components/document-form.js` la emisiÃ³n de la factura, permitiendo la transiciÃ³n Borrador -> Emitida y bloqueando estados no permitidos o salidas desde Pagada.
- [ ] **Tarea 15:** Mostrar en `src/components/document-list.js` el monto total, la fecha de vencimiento y el estado de cada factura asociada al cliente.
- [ ] **Tarea 16:** Verificar la integridad referencial y el borrado en cascada: impedir facturas sin cliente vÃ¡lido y eliminar las facturas asociadas al eliminar un cliente.
- [ ] **Tarea 17:** Ejecutar `npx vitest run`, corregir los fallos y validar con `npm run dev` el flujo completo: crear cliente -> registrar factura en Borrador -> emitir factura -> visualizar la deuda del cliente.
































































































