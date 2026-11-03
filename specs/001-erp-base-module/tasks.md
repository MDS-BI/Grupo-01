---

description: "Lista de tareas para el módulo de Contabilidad y Finanzas: Facturación y Pagos"
---

# Tareas: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Entrada**: Documentos de diseño en `/specs/001-erp-base-module/`

**Requisitos previos**: `plan.md`, `spec.md`, `data-model.md`, `contracts/entity-storage.md`

**Pruebas**: Se incluyen tareas de prueba porque la constitución del proyecto exige cubrir con pruebas automatizadas el comportamiento visible y la lógica de negocio.

**Organización**: Las tareas están agrupadas por historia de usuario (HU1 a HU6 del `spec.md`) para poder implementar y probar cada una de forma independiente.

> **Nota sobre cómo se generó.** Este archivo se armó siguiendo las reglas de `speckit.tasks` (formato, fases y orden), a partir del `spec.md`, el `plan.md` y el `data-model.md` actuales. `speckit.analyze` se ejecutó el 02-11-2026 (Mauro) y otra vez el 03-11-2026 (Jaime). Sus propuestas siguen pendientes de revisar y falta revisarlo con `speckit.clarify`. Las tareas marcadas con **(depende de aclaración)** quedan provisionales hasta resolver los `[NEEDS CLARIFICATION]` del spec.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias)
- **[HUn]**: historia de usuario a la que pertenece la tarea (HU1 a HU6)
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

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: dejar el módulo base funcionando antes de modificarlo.

- [x] T001 Verificar que `src/` e `index.html` del módulo base estén en el repositorio; si faltan, obtenerlos desde el template `MDS-BI/Speckit_Template` (hecho el 03-11-2026: se copiaron `src/`, `index.html`, `tests/setup/` y las pruebas actuales del template, en un commit aparte)
- [x] T002 Ejecutar `npm install` y `npm run dev` en la raíz del repositorio, y comprobar que el módulo base abre en http://localhost:5173 (comprobado el 03-11-2026)
- [x] T003 [P] Ejecutar `npx vitest run` y confirmar que las pruebas existentes de `tests/unit/` y `tests/integration/` pasan antes de modificar nada (03-11-2026: 24 archivos y 73 pruebas pasan)
- [ ] T004 Ejecutar `speckit.clarify` sobre `specs/001-erp-base-module/spec.md` para resolver los `[NEEDS CLARIFICATION]` (o resolverlos con el ayudante) y actualizar aquí las tareas marcadas "depende de aclaración"

---

## Fase 2: Fundacional (requisitos que bloquean todas las historias)

**Propósito**: configuración del módulo que todas las historias necesitan.

**CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [ ] T005 Conectar la configuración del módulo al arranque de la aplicación en `src/module-config.js` y `src/main.js` (el README del template describe `userConfig`; confirmar cómo se carga)
- [ ] T006 Configurar `moduleName` ("Contabilidad y Finanzas: Facturación y Pagos") y `labels` (Tercero, Terceros, Factura, Facturas) en `src/module-config.js`
- [ ] T007 Declarar el campo personalizado `tipoTercero` (entidad, selección, obligatorio, opciones `cliente` y `proveedor`) en `src/module-config.js`
- [ ] T008 Declarar los campos personalizados `tipoFactura` (selección, obligatorio, opciones `venta` y `compra`), `montoPagado` (número) y `fechaPago` (fecha) para documentos en `src/module-config.js`
- [ ] T009 Configurar `statusLifecycle` con los estados Borrador, Emitida y Pagada, y las transiciones Borrador → Emitida → Pagada, sin salidas desde Pagada, en `src/module-config.js`
- [ ] T010 [P] Escribir pruebas de la configuración (sin colisión de claves con los campos base, estados y transiciones válidos) en `tests/unit/module-config.test.js`
- [ ] T011 Asegurar que toda factura nueva inicie en Borrador (FR-009) en `src/components/document-form.js` y `src/storage.js`
- [ ] T012 Validar que una factura de venta solo se asocie a un tercero cliente, y una de compra a un proveedor, en `src/validation.js`

**Punto de control**: la configuración carga sin errores y la base está lista; ya se pueden empezar las historias.

---

## Fase 3: HU1 - Registrar terceros: clientes y proveedores (Prioridad: P1)

**Objetivo**: registrar, editar, buscar y eliminar clientes y proveedores.

**Prueba independiente**: registrar un cliente y un proveedor, y comprobar que aparecen en el listado y que se pueden buscar.

### Pruebas de HU1

- [ ] T013 [P] [HU1] Prueba de validación de terceros (nombre y código obligatorios, límite de crédito no negativo, `tipoTercero` obligatorio) en `tests/unit/validation.test.js`
- [ ] T014 [P] [HU1] Prueba de integración: registrar cliente y proveedor, buscarlos y eliminar uno con facturas (borrado en cascada) en `tests/integration/us1-create-entity.test.js`

### Implementación de HU1

- [ ] T015 [HU1] Adaptar el formulario de terceros para mostrar nombre, código, RUT, límite de crédito y tipo de tercero en `src/components/entity-form.js`
- [ ] T016 [HU1] Aplicar el límite de crédito solo a terceros de tipo cliente en `src/components/entity-form.js` y `src/validation.js`
- [ ] T017 [HU1] Pedir confirmación antes de eliminar un tercero que tiene facturas (FR-005) en `src/app.js`
- [ ] T018 [HU1] Validar formato y dígito verificador del RUT, y definir si puede repetirse, en `src/validation.js` **(depende de aclaración, FR-017)**
- [ ] T019 [HU1] Confirmar que el módulo base ya rechaza códigos de tercero duplicados sin distinguir mayúsculas (`DUPLICATE_CODE` en `src/validation.js`, con prueba en `tests/unit/validation.test.js`). No requiere cambios en el código; el par serie-folio de las facturas se trata en T027

**Punto de control**: la HU1 funciona y se puede probar sola.

---

## Fase 4: HU2 - Emitir facturas de venta (Prioridad: P1)

**Objetivo**: crear una factura de venta a un cliente y pasarla de Borrador a Emitida.

**Prueba independiente**: con un cliente registrado, crear una factura en Borrador, emitirla y ver que aparece como Emitida.

### Pruebas de HU2

- [ ] T020 [P] [HU2] Prueba de validación de facturas (folio entero positivo, vencimiento igual o posterior a la emisión, descuento no mayor al subtotal, tercero existente) en `tests/unit/document-validation.test.js`
- [ ] T021 [P] [HU2] Prueba de integración: crear factura de venta en Borrador, emitirla y comprobar que no se puede volver a Borrador en `tests/integration/us12-lifecycle.test.js`

### Implementación de HU2

- [ ] T022 [HU2] Adaptar el formulario de facturas para mostrar tipo de factura, serie, folio, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`), subtotal, descuento, impuesto, total y moneda (una sola en el MVP, por definir) en `src/components/document-form.js`
- [ ] T023 [HU2] Rotular `startDate` como "Fecha de emisión" y `endDate` como "Fecha de vencimiento" en `src/module-config.js` **(depende de confirmar la equivalencia con el ayudante)**
- [ ] T024 [HU2] Permitir la transición Borrador → Emitida y bloquear el retroceso en `src/components/document-form.js`
- [ ] T025 [HU2] Exigir el monto total al emitir en `src/validation.js` **(depende de aclaración)**
- [ ] T026 [HU2] Avisar o bloquear cuando las facturas Emitidas de un cliente superan su límite de crédito en `src/components/document-form.js` **(depende de aclaración, FR-018)**
- [ ] T027 [HU2] Evitar facturas duplicadas con la misma serie y folio en `src/validation.js` **(depende de aclaración, FR-019)**

**Punto de control**: las HU1 y HU2 funcionan juntas y por separado.

---

## Fase 5: HU3 - Registrar facturas de compra (Prioridad: P1)

**Objetivo**: crear una factura de compra a un proveedor y emitirla.

**Prueba independiente**: con un proveedor registrado, crear una factura de compra, emitirla y ver que aparece como deuda por pagar.

### Pruebas de HU3

- [ ] T028 [P] [HU3] Prueba de integración: crear factura de compra, emitirla, rechazar un monto negativo y distinguirla de las de venta en `tests/integration/us10-documents.test.js`

### Implementación de HU3

- [ ] T029 [HU3] Mostrar en el selector de tercero solo proveedores cuando el tipo de factura es compra, y solo clientes cuando es venta, en `src/components/document-form.js`
- [ ] T030 [HU3] Mostrar el tipo de factura (venta o compra), el monto total y la fecha de vencimiento en el listado de facturas en `src/components/document-list.js`

**Punto de control**: las HU1, HU2 y HU3 funcionan de forma independiente.

---

## Fase 6: HU4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

**Objetivo**: registrar el monto y la fecha de pago de una factura Emitida y marcarla como Pagada.

**Prueba independiente**: con una factura Emitida, registrar el pago y comprobar que pasa a Pagada.

### Pruebas de HU4

- [ ] T031 [P] [HU4] Prueba de validación del pago (monto pagado igual al total, fecha de pago obligatoria, factura en Borrador no se puede pagar, Pagada no admite cambios) en `tests/unit/document-validation.test.js`
- [ ] T032 [P] [HU4] Prueba de integración: emitir, registrar el pago y marcar Pagada en `tests/integration/us12-lifecycle.test.js`

### Implementación de HU4

- [ ] T033 [HU4] Mostrar los campos de monto pagado y fecha de pago al marcar una factura como Pagada en `src/components/document-form.js`
- [ ] T034 [HU4] Rechazar el paso a Pagada si `montoPagado` es distinto de `totalAmount` o falta `fechaPago` (FR-011) en `src/validation.js`

**Punto de control**: el ciclo completo de la factura funciona (Borrador → Emitida → Pagada).

---

## Fase 7: HU5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

**Objetivo**: mostrar cuánto se debe cobrar y pagar por tercero, y qué facturas están vencidas.

**Prueba independiente**: con varias facturas en distintos estados y fechas, abrir el seguimiento y comprobar los totales y las vencidas.

### Pruebas de HU5

- [ ] T035 [P] [HU5] Prueba unitaria de los cálculos (total por cobrar, total por pagar, vencidas, exclusión de Borrador y Pagada) en `tests/unit/tracking.test.js`
- [ ] T036 [P] [HU5] Prueba de integración de la vista de seguimiento en `tests/integration/tracking.test.js`

### Implementación de HU5

- [ ] T037 [P] [HU5] Crear las funciones de cálculo de deuda por tercero y facturas vencidas (FR-012 a FR-014) en `src/tracking.js`
- [ ] T038 [HU5] Crear la vista de seguimiento en `src/components/tracking.js`
- [ ] T039 [HU5] Agregar el botón "Seguimiento" a la barra lateral y a las acciones rápidas en `src/components/shell.js` y `src/components/dashboard.js`

**Punto de control**: las HU1 a HU5 funcionan de forma independiente.

---

## Fase 8: HU6 - Datos de demostración y referencias genéricas a otros módulos (Prioridad: P3)

**Objetivo**: cargar ejemplos ficticios para probar cobros y pagos, y permitir guardar una referencia manual a otro módulo.

**Avance confirmado**: la redacción de HU6 y sus cinco escenarios de aceptación están incorporados en `spec.md` mediante el commit [5d72123](https://github.com/MDS-BI/Grupo-01/commit/5d721239f3da3af443de44f4c292bdfcb7839fae). Este avance es documental; no significa que el cargador, el botón o las pruebas ya estén implementados.

**Requisitos previos**: completar las Fases 1 y 2 y usar las reglas compartidas de HU1 a HU4. Antes de preparar los ejemplos definitivos, resolver las decisiones pendientes sobre moneda y monto total. Los ejemplos no deben saltarse las validaciones ni introducir campos duplicados.

**Alcance de las referencias**: por ahora se usa un campo de texto genérico, siguiendo la orientación del ayudante comunicada por Jaime. Se puede anotar, por ejemplo, "Ventas: pedido PED-035". No hay conexión en vivo ni validación contra los sistemas de otros grupos. El formato definitivo se confirmará con el profesor; coordinar identificadores con otros grupos no bloquea esta versión.

**Prueba independiente**: con el módulo vacío, cargar los ejemplos, revisar sus relaciones y recargar la página. Repetir la carga y comprobar que no hay duplicados. Probar también con registros ingresados previamente y verificar que se conservan. Guardar y volver a consultar una referencia en un tercero y en una factura.

### Pruebas de HU6

- [ ] T040 [HU6] Escribir primero los escenarios de prueba en `tests/integration/demo-data.test.js`: carga inicial con clientes, proveedores y facturas de venta y compra; casos Borrador, Emitida y Pagada; facturas Emitidas vencidas y vigentes; conservación de registros y relaciones al iniciar de nuevo la aplicación con el mismo almacenamiento; segundo intento sin duplicados; rechazo de carga cuando ya exista algún tercero o factura, sin modificar los datos previos. Incluir la conservación de la referencia de un tercero y de una factura al guardar, cerrar y volver a abrir. Comprobar que las pruebas detectan la funcionalidad faltante y, después de implementar T041 a T044, ejecutarlas hasta que pasen.

### Implementación de HU6

- [ ] T041 [HU6] Crear los ejemplos y su función de carga en `src/demo-data.js`, usando solo datos ficticios y la moneda acordada. Incluir clientes y proveedores con facturas del tipo correspondiente; estados Borrador, Emitida y Pagada; y facturas Emitidas con vencimiento pasado y futuro al cargar. Todas las facturas deben tener fechas válidas. Las Pagadas deben tener monto pagado igual al total y fecha de pago. Usar las operaciones y transiciones compartidas del módulo, vinculando cada factura al `entity_id` de su tercero. Cargar únicamente si no existen terceros ni facturas; repetir la operación o encontrar datos previos debe conservar el contenido sin agregar ejemplos ni borrar registros.

- [ ] T042 [HU6] Agregar "Cargar datos de demostración" al panel en `src/components/dashboard.js` y conectar su acción con la función de `src/demo-data.js`. Mostrar un aviso de carga completada o de módulo con datos, mantener los registros existentes y actualizar la vista y sus estadísticas después de una carga exitosa. Si falla el almacenamiento, mostrar el error sin informar que la carga terminó correctamente.

- [ ] T043 [HU6] Definir la clave del campo opcional "Referencia a otro módulo" para terceros y facturas, sin colisionar con campos base, y declararlo en `src/module-config.js`. Documentar su nombre, tipo texto, carácter opcional y conservación en `specs/001-erp-base-module/data-model.md` y `specs/001-erp-base-module/contracts/entity-storage.md`; reflejarlo en `specs/001-erp-base-module/mer.png` cuando se actualice el diagrama. Registrar el alcance genérico de esta versión y separar la confirmación futura del formato de identificadores. Esta tarea reemplaza la coordinación inmediata con otros grupos planteada en el borrador anterior.

- [ ] T044 [HU6] Mostrar y permitir guardar y consultar la referencia genérica en `src/components/entity-form.js` y `src/components/document-form.js`, respetando las reglas de edición y pago de HU4. Utilizar el mecanismo de campos personalizados y la persistencia de `src/storage.js`; verificar que la referencia no se descarte ni reemplace el vínculo `entity_id` entre factura y tercero. Completar en `tests/integration/demo-data.test.js` los casos de referencia en ambos registros, incluidos su conservación después de recargar y el guardado con el campo vacío.

### Seguimiento y coherencia

- T040 a T044 siguen pendientes: se marcan con `[x]` solo cuando su resultado esté implementado y comprobado. Tener la historia escrita, una prueba redactada o un archivo creado no basta para afirmar que la función ya está terminada.
- Se conservan los identificadores de las tareas para no alterar referencias del resto del trabajo. Se retiran las marcas `[P]` de este bloque: el cargador depende de las reglas comunes, y las pruebas deben revisarse junto con la implementación.
- Antes de implementar, alinear la aclaración pendiente de FR-016 en `spec.md` con la referencia genérica descrita aquí. Esta edición no cambia los requisitos ni el modelo de datos: T043 deja explícita la actualización que falta.
- El borrador anterior pedía ejemplos "con y sin vencimiento". Se corrige a facturas vencidas y vigentes, todas con fechas válidas, para respetar FR-007.
- Coordinar con los responsables de HU1, HU2 y HU3 la edición de `src/module-config.js`, `src/components/entity-form.js` y `src/components/document-form.js`, porque son archivos compartidos.
- Al terminar, ejecutar las pruebas de HU6 y las del módulo base. Revisar también T049 (recorrido completo), T051 (consistencia documental) y T052 (demostración final); son tareas de cierre del grupo y no se consideran completadas por actualizar esta sección.

**Punto de control**: los cinco escenarios de aceptación de HU6 se pueden demostrar; los datos y referencias se conservan, la carga repetida no duplica registros y la demostración no altera datos existentes.

---

## Fase 9: Cierre y aspectos transversales

**Propósito**: mejoras que afectan a varias historias.

- [ ] T045 Actualizar las instrucciones de uso (instalación, ejecución y pruebas) en `README.md`
- [ ] T046 Completar el anexo de uso de IA (modelo, fecha y prompts) en `README.md`
- [ ] T047 Mantener el registro de decisiones en `README.md` (o en issues de GitHub), como sugiere el enunciado
- [ ] T048 Ejecutar `npm run check` (lint, formato y pruebas) y corregir lo que falle
- [ ] T049 Recorrer el flujo completo con los datos de demostración (tercero, factura, emisión, pago y seguimiento) en la aplicación local (`npm run dev`), y confirmar que se hace en menos de 5 minutos (SC-005) y que una persona nueva registra un tercero y emite su primera factura en menos de 3 minutos (SC-001), siguiendo también las verificaciones de `specs/001-erp-base-module/quickstart.md`
- [ ] T050 Comprobar que la interfaz solo usa datos ficticios y que `README.md` advierte que `localStorage` no es seguro (riesgos de datos)
- [ ] T051 Ejecutar `speckit.analyze` para verificar la consistencia entre `specs/001-erp-base-module/spec.md`, `plan.md`, `data-model.md` y `tasks.md`
- [ ] T052 Preparar la demostración funcional para la presentación final, usando `src/demo-data.js`

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundacional (Fase 2)**: depende de la Preparación y **bloquea todas las historias**.
- **Historias (Fases 3 a 8)**: dependen de la fase Fundacional. Pueden avanzar en paralelo si hay personas disponibles, o en orden de prioridad (P1 → P2 → P3).
- **Cierre (Fase 9)**: depende de las historias que se quieran entregar.

### Dependencias entre historias

- **HU1 (P1)**: puede empezar tras la fase Fundacional; no depende de otras historias.
- **HU2 (P1)**: puede empezar tras la fase Fundacional; necesita clientes para probarse, pero se puede probar con datos creados en la prueba.
- **HU3 (P1)**: puede empezar tras la fase Fundacional; reutiliza el formulario de facturas de la HU2.
- **HU4 (P2)**: necesita facturas Emitidas (HU2 o HU3).
- **HU5 (P2)**: necesita facturas en distintos estados (HU2, HU3 y HU4).
- **HU6 (P3)**: puede empezar tras la fase Fundacional; los datos de demostración usan los campos de las demás historias.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de implementar.
- Primero las reglas de `src/validation.js` (y `src/storage.js` si hace falta), luego los formularios y vistas.
- La historia se completa antes de pasar a la siguiente prioridad.

### Oportunidades de paralelismo

- Las tareas de Preparación marcadas [P].
- Las pruebas de una misma historia marcadas [P].
- Después de la fase Fundacional, cada integrante puede trabajar una historia distinta.

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
2. Completar la Fase 2: Fundacional (bloquea todo).
3. Completar la Fase 3: HU1.
4. Completar las Fases 4 y 5: HU2 y HU3.
5. **Detenerse y validar**: probar cada historia de forma independiente.
6. Mostrar la demo si está lista.

### Entrega incremental

1. Preparación + Fundacional → base lista.
2. Agregar HU1, HU2 y HU3 → probar → demo (MVP).
3. Agregar HU4 → probar → demo.
4. Agregar HU5 → probar → demo.
5. Agregar HU6 → probar → demo final.
6. Cada historia suma valor sin romper las anteriores.

### Estrategia con varios integrantes

1. El grupo completa juntos la Preparación y la fase Fundacional.
2. Luego cada integrante toma una historia (ver la tabla de asignación).
3. Las historias se integran y se prueban de forma independiente.

---

## Notas

- [P] = archivos distintos, sin dependencias.
- La etiqueta [HUn] relaciona cada tarea con su historia, para tener trazabilidad.
- Cada historia debe poder completarse y probarse de forma independiente.
- Verificar que las pruebas fallen antes de implementar.
- Antes de dar por terminada cada historia, ejecutar `npm run check` (puertas de calidad de `plan.md`). Con el módulo base, `npm run check` ya pasa completo (lint, formato y 73 pruebas).
- La búsqueda de terceros (FR-004) y los listados de terceros y facturas ya vienen en el módulo base (`src/search.js`, `src/components/entity-list.js` y `src/components/document-list.js`): T013, T014 y T030 comprueban o adaptan lo que ya existe.
- Este archivo agrega tres archivos nuevos (`src/tracking.js`, `src/components/tracking.js` y `src/demo-data.js`). Figuran en la estructura de `plan.md` y son extensiones del módulo base.
- Hacer un commit después de cada tarea o grupo lógico de tareas. Los commits los hace cada integrante a mano, no la IA, como pide el curso. Si un comando de Speckit ofrece hacer un commit automático, responder que no.
- Varias historias tocan los mismos archivos (`src/storage.js`, `src/components/document-form.js` y `tests/unit/document-validation.test.js`). Si dos integrantes los editan a la vez puede haber conflictos al subir los cambios a `main`: conviene avisar al grupo antes de editarlos y hacer Fetch y Pull antes de empezar.
- Las tareas marcadas **(depende de aclaración)** deben revisarse al resolver los `[NEEDS CLARIFICATION]` del `spec.md`.
- Evitar tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan su independencia.


---

## Anexo: tareas propuestas por Caro para la HU2

Caro agregó estas tareas en `main` para la HU2 (Emisión y Registro de Facturas a Clientes). Se conservan como referencia: cubren lo mismo que T020 a T027 de la Fase 4, pero con más detalle en las validaciones. Al regenerar este archivo con `speckit.tasks`, hay que compararlas y consolidarlas en una sola lista. Las Tareas 1 a 8 de esa versión anterior (cambios en `module-config.js`, instalación y prueba local) corresponden a las Fases 1 y 2 de este archivo, y las Tareas 1 y 2 (MER y archivos iniciales de Speckit) ya están hechas.

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
