---

description: "Lista de tareas para el módulo de Contabilidad y Finanzas: Facturación y Pagos"
---

# Tareas: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Entrada**: Documentos de diseño en `/specs/001-erp-base-module/`

**Requisitos previos**: `plan.md`, `spec.md`, `data-model.md`, `contracts/entity-storage.md`

**Pruebas**: Se incluyen tareas de prueba porque la constitución del proyecto exige cubrir con pruebas automatizadas el comportamiento visible y la lógica de negocio.

**Organización**: Las tareas están agrupadas por historia de usuario (HU1 a HU6 del `spec.md`) para poder implementar y probar cada una de forma independiente.

> **Nota sobre cómo se generó.** Este archivo se armó siguiendo las reglas de `speckit.tasks` (formato, fases y orden), a partir del `spec.md`, el `plan.md` y el `data-model.md` actuales. Debe revisarse con `speckit.clarify` y `speckit.analyze` cuando se puedan ejecutar. Las tareas marcadas con **(depende de aclaración)** quedan provisionales hasta resolver los `[NEEDS CLARIFICATION]` del spec.

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
| HU1 Registrar terceros | P1 | Por asignar |
| HU2 Emitir facturas de venta | P1 | Por asignar |
| HU3 Registrar facturas de compra | P1 | Por asignar |
| HU4 Registrar el pago y marcar Pagada | P2 | Por asignar |
| HU5 Ver deuda por tercero y vencidas | P2 | Por asignar |
| HU6 Datos de demostración y otros módulos | P3 | Por asignar |

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: dejar el módulo base funcionando antes de modificarlo.

- [ ] T001 Verificar que `src/`, `index.html` y `package.json` del módulo base estén en el repositorio; si faltan, obtenerlos desde el template `MDS-BI/Speckit_Template` (hoy `src/` e `index.html` no están en este repositorio)
- [ ] T002 Ejecutar `npm install` y `npm run dev` en la raíz del repositorio, y comprobar que el módulo base abre en http://localhost:5173
- [ ] T003 [P] Ejecutar `npx vitest run` y confirmar que las pruebas existentes de `tests/unit/` y `tests/integration/` pasan antes de modificar nada

---

## Fase 2: Fundacional (requisitos que bloquean todas las historias)

**Propósito**: configuración del módulo que todas las historias necesitan.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [ ] T004 Conectar la configuración del módulo al arranque de la aplicación en `src/module-config.js` y `src/main.js` (el README del template describe `userConfig`; confirmar cómo se carga)
- [ ] T005 Configurar `moduleName` ("Contabilidad y Finanzas: Facturación y Pagos") y `labels` (Tercero, Terceros, Factura, Facturas) en `src/module-config.js`
- [ ] T006 Declarar el campo personalizado `tipoTercero` (entidad, selección, obligatorio, opciones `cliente` y `proveedor`) en `src/module-config.js`
- [ ] T007 Declarar los campos personalizados `tipoFactura` (selección, obligatorio, opciones `venta` y `compra`), `montoPagado` (número) y `fechaPago` (fecha) para documentos en `src/module-config.js`
- [ ] T008 Configurar `statusLifecycle` con los estados Borrador, Emitida y Pagada, y las transiciones Borrador → Emitida → Pagada, sin salidas desde Pagada, en `src/module-config.js`
- [ ] T009 [P] Escribir pruebas de la configuración (sin colisión de claves con los campos base, estados y transiciones válidos) en `tests/unit/module-config.test.js`
- [ ] T010 Asegurar que toda factura nueva inicie en Borrador (FR-009) en `src/components/document-form.js` y `src/storage.js`
- [ ] T011 Validar que una factura de venta solo se asocie a un tercero cliente, y una de compra a un proveedor, en `src/storage.js`

**Punto de control**: la configuración carga sin errores y la base está lista; ya se pueden empezar las historias.

---

## Fase 3: HU1 - Registrar terceros: clientes y proveedores (Prioridad: P1) 🎯 MVP

**Objetivo**: registrar, editar, buscar y eliminar clientes y proveedores.

**Prueba independiente**: registrar un cliente y un proveedor, y comprobar que aparecen en el listado y que se pueden buscar.

### Pruebas de HU1

- [ ] T012 [P] [HU1] Prueba de validación de terceros (nombre y código obligatorios, límite de crédito no negativo, `tipoTercero` obligatorio) en `tests/unit/storage.test.js`
- [ ] T013 [P] [HU1] Prueba de integración: registrar cliente y proveedor, buscarlos y eliminar uno con facturas (borrado en cascada) en `tests/integration/create-entity.test.js`

### Implementación de HU1

- [ ] T014 [HU1] Adaptar el formulario de terceros para mostrar nombre, código, RUT, límite de crédito y tipo de tercero en `src/components/entity-form.js`
- [ ] T015 [HU1] Aplicar el límite de crédito solo a terceros de tipo cliente en `src/components/entity-form.js` y `src/storage.js`
- [ ] T016 [HU1] Pedir confirmación antes de eliminar un tercero que tiene facturas (FR-005) en `src/app.js`
- [ ] T017 [HU1] Validar formato y dígito verificador del RUT en `src/storage.js` **(depende de aclaración, FR-017)**
- [ ] T018 [HU1] Evitar códigos de tercero duplicados en `src/storage.js` **(depende de aclaración, FR-019)**

**Punto de control**: la HU1 funciona y se puede probar sola.

---

## Fase 4: HU2 - Emitir facturas de venta (Prioridad: P1)

**Objetivo**: crear una factura de venta a un cliente y pasarla de Borrador a Emitida.

**Prueba independiente**: con un cliente registrado, crear una factura en Borrador, emitirla y ver que aparece como Emitida.

### Pruebas de HU2

- [ ] T019 [P] [HU2] Prueba de validación de facturas (folio entero positivo, vencimiento igual o posterior a la emisión, descuento no mayor al subtotal, tercero existente) en `tests/unit/storage.test.js`
- [ ] T020 [P] [HU2] Prueba de integración: crear factura de venta en Borrador, emitirla y comprobar que no se puede volver a Borrador en `tests/integration/manage-document.test.js`

### Implementación de HU2

- [ ] T021 [HU2] Adaptar el formulario de facturas para mostrar tipo de factura, serie, folio, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`), subtotal, descuento, impuesto, total y moneda en `src/components/document-form.js`
- [ ] T022 [HU2] Rotular `startDate` como "Fecha de emisión" y `endDate` como "Fecha de vencimiento" en `src/module-config.js` **(depende de confirmar la equivalencia con el ayudante)**
- [ ] T023 [HU2] Permitir la transición Borrador → Emitida y bloquear el retroceso en `src/components/document-form.js`
- [ ] T024 [HU2] Exigir el monto total al emitir en `src/storage.js` **(depende de aclaración)**
- [ ] T025 [HU2] Avisar o bloquear cuando las facturas Emitidas de un cliente superan su límite de crédito en `src/components/document-form.js` **(depende de aclaración, FR-018)**

**Punto de control**: las HU1 y HU2 funcionan juntas y por separado.

---

## Fase 5: HU3 - Registrar facturas de compra (Prioridad: P1)

**Objetivo**: crear una factura de compra a un proveedor y emitirla.

**Prueba independiente**: con un proveedor registrado, crear una factura de compra, emitirla y ver que aparece como deuda por pagar.

### Pruebas de HU3

- [ ] T026 [P] [HU3] Prueba de integración: crear factura de compra, emitirla, rechazar un monto negativo y distinguirla de las de venta en `tests/integration/add-document.test.js`

### Implementación de HU3

- [ ] T027 [HU3] Mostrar en el selector de tercero solo proveedores cuando el tipo de factura es compra, y solo clientes cuando es venta, en `src/components/document-form.js`
- [ ] T028 [HU3] Mostrar el tipo de factura (venta o compra) en el listado de facturas en `src/components/document-form.js`

**Punto de control**: las HU1, HU2 y HU3 funcionan de forma independiente.

---

## Fase 6: HU4 - Registrar el pago y marcar la factura como Pagada (Prioridad: P2)

**Objetivo**: registrar el monto y la fecha de pago de una factura Emitida y marcarla como Pagada.

**Prueba independiente**: con una factura Emitida, registrar el pago y comprobar que pasa a Pagada.

### Pruebas de HU4

- [ ] T029 [P] [HU4] Prueba de validación del pago (monto pagado igual al total, fecha de pago obligatoria, factura en Borrador no se puede pagar, Pagada no admite cambios) en `tests/unit/storage.test.js`
- [ ] T030 [P] [HU4] Prueba de integración: emitir, registrar el pago y marcar Pagada en `tests/integration/manage-document.test.js`

### Implementación de HU4

- [ ] T031 [HU4] Mostrar los campos de monto pagado y fecha de pago al marcar una factura como Pagada en `src/components/document-form.js`
- [ ] T032 [HU4] Rechazar el paso a Pagada si `montoPagado` es distinto de `totalAmount` o falta `fechaPago` (FR-011) en `src/storage.js`

**Punto de control**: el ciclo completo de la factura funciona (Borrador → Emitida → Pagada).

---

## Fase 7: HU5 - Ver la deuda por tercero y las facturas vencidas (Prioridad: P2)

**Objetivo**: mostrar cuánto se debe cobrar y pagar por tercero, y qué facturas están vencidas.

**Prueba independiente**: con varias facturas en distintos estados y fechas, abrir el seguimiento y comprobar los totales y las vencidas.

### Pruebas de HU5

- [ ] T033 [P] [HU5] Prueba unitaria de los cálculos (total por cobrar, total por pagar, vencidas, exclusión de Borrador y Pagada) en `tests/unit/tracking.test.js`
- [ ] T034 [P] [HU5] Prueba de integración de la vista de seguimiento en `tests/integration/tracking.test.js`

### Implementación de HU5

- [ ] T035 [P] [HU5] Crear las funciones de cálculo de deuda por tercero y facturas vencidas (FR-012 a FR-014) en `src/tracking.js`
- [ ] T036 [HU5] Crear la vista de seguimiento en `src/components/tracking.js`
- [ ] T037 [HU5] Agregar el botón "Seguimiento" a la barra lateral y a las acciones rápidas en `src/components/shell.js` y `src/components/dashboard.js`

**Punto de control**: las HU1 a HU5 funcionan de forma independiente.

---

## Fase 8: HU6 - Datos de demostración y relación con otros módulos (Prioridad: P3)

**Objetivo**: cargar datos de ejemplo y registrar referencias a otros módulos.

**Prueba independiente**: cargar los datos de ejemplo y comprobar que aparecen terceros y facturas en distintos estados, también después de recargar.

### Pruebas de HU6

- [ ] T038 [P] [HU6] Prueba de integración: cargar datos de demostración y comprobar que persisten al recargar en `tests/integration/demo-data.test.js`

### Implementación de HU6

- [ ] T039 [P] [HU6] Crear los datos de demostración, solo ficticios (terceros y facturas en estados Borrador, Emitida y Pagada, con y sin vencimiento) en `src/demo-data.js`
- [ ] T040 [HU6] Agregar el botón "Cargar datos de demostración" al panel de inicio en `src/components/dashboard.js`
- [ ] T041 [HU6] Registrar la referencia a otros módulos (CRM, Ventas, Compras) en terceros y facturas en `src/components/entity-form.js` y `src/components/document-form.js` **(depende de aclaración, FR-016)**

**Punto de control**: todas las historias funcionan y la demo se puede mostrar.

---

## Fase 9: Cierre y aspectos transversales

**Propósito**: mejoras que afectan a varias historias.

- [ ] T042 [P] Actualizar las instrucciones de uso (instalación, ejecución y pruebas) en `README.md`
- [ ] T043 [P] Completar el anexo de uso de IA (modelo, fecha y prompts) en `README.md`
- [ ] T044 Ejecutar `npx vitest run` y corregir las pruebas que fallen
- [ ] T045 Recorrer el flujo completo con los datos de demostración (tercero, factura, emisión, pago y seguimiento) en la aplicación local (`npm run dev`) y confirmar que se hace en menos de 5 minutos (SC-005)
- [ ] T046 Comprobar que la interfaz solo usa datos ficticios y que `README.md` advierte que `localStorage` no es seguro (riesgos de datos)
- [ ] T047 Ejecutar `speckit.analyze` para verificar la consistencia entre `specs/001-erp-base-module/spec.md`, `plan.md`, `data-model.md` y `tasks.md`
- [ ] T048 Preparar la demostración funcional para la presentación final, usando `src/demo-data.js`

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
- Primero las reglas de `src/storage.js`, luego los formularios y vistas.
- La historia se completa antes de pasar a la siguiente prioridad.

### Oportunidades de paralelismo

- Las tareas de Preparación marcadas [P] (T003).
- Las pruebas de una misma historia marcadas [P].
- Después de la fase Fundacional, cada integrante puede trabajar una historia distinta.

---

## Ejemplo de paralelismo: HU1

```text
# Pruebas de la HU1 juntas:
Tarea: "Prueba de validación de terceros en tests/unit/storage.test.js"
Tarea: "Prueba de integración de terceros en tests/integration/create-entity.test.js"
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
- Hacer un commit después de cada tarea o grupo lógico de tareas.
- Las tareas marcadas **(depende de aclaración)** deben revisarse al resolver los `[NEEDS CLARIFICATION]` del `spec.md`.
- Evitar tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan su independencia.
