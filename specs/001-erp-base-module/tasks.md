# Lista de Tareas (Tasks)

Para lograr el MVP del Módulo de Finanzas, el equipo debe completar las siguientes tareas prácticas sobre el repositorio:

- [x] **Tarea 1:** Subir diagrama MER generado al repositorio. (Responsable: Jaime).
- [x] **Tarea 2:** Crear y subir set de archivos Speckit iniciales (spec, data-model, plan, tasks). (Responsable: Jaime).
- [ ] **Tarea 3:** Editar `module-config.js` - Cambiar nombres base a "Finanzas", "Cliente" y "Factura".
- [ ] **Tarea 4:** Editar `module-config.js` - Reutilizar los campos base de Entidad `taxId` (texto, RUT) y `creditLimit` (número no negativo, límite de crédito), sin crear campos personalizados duplicados.
- [ ] **Tarea 5:** Editar `module-config.js` - Reutilizar `startDate` como fecha de emisión y `endDate` como fecha de vencimiento en el Documento, sin crear el campo `due_date`.
- [ ] **Tarea 6:** Editar `module-config.js` - Modificar `statusLifecycle` para facturas (Borrador, Emitida, Pagada).
- [ ] **Tarea 7:** Descargar repositorio, instalar Node.js localmente y ejecutar npm install.
- [ ] **Tarea 8:** Levantar servidor local (npm run dev) y realizar prueba general de funcionalidad.

## Tareas de Implementación - HU2: Emisión y Registro de Facturas a Clientes

Depende de las Tareas 3 y 6 (etiquetas Cliente/Factura y ciclo de vida Borrador, Emitida, Pagada). Reutilizar los campos base definidos en `data-model.md`: `entity_id`, `series`, `folio`, `startDate` (emisión), `endDate` (vencimiento), `totalAmount` y `status`; no crear campos duplicados.

- [ ] **Tarea 9:** Escribir pruebas unitarias en `tests/unit/storage.test.js` para la validación de facturas: cliente existente obligatorio, `folio` entero positivo, `totalAmount` no negativo, `endDate` igual o posterior a `startDate` y estado inicial Borrador.
- [ ] **Tarea 10:** Escribir pruebas de integración en `tests/integration/add-document.test.js` que cubran el registro de una factura desde el formulario, su asociación al `entity_id` del cliente y el rechazo de monto negativo, vencimiento anterior a la emisión y cliente inexistente.
- [ ] **Tarea 11:** Ajustar `index.html` y `src/components/document-form.js` para capturar cliente, `series` opcional, `folio`, fecha de emisión (`startDate`), fecha de vencimiento (`endDate`) y monto total (`totalAmount`), mostrando mensajes de error por campo.
- [ ] **Tarea 12:** Implementar en `src/storage.js` la validación de factura: `entity_id` debe coincidir con un `Entity.entity_id` existente, `folio` entero positivo, `totalAmount` requerido y no negativo, `startDate`/`endDate` requeridas y `endDate >= startDate`.
- [ ] **Tarea 13:** Implementar en `src/storage.js` el alta de facturas mediante `addDocument`, persistiendo `entity_id`, `folio`, `series`, fechas, `totalAmount`, estado inicial Borrador e identificadores/timestamps automáticos; aplicar las mismas validaciones en `updateDocument`.
- [ ] **Tarea 14:** Implementar en `src/components/document-form.js` la emisión de la factura, permitiendo la transición Borrador -> Emitida y bloqueando estados no permitidos o salidas desde Pagada.
- [ ] **Tarea 15:** Mostrar en `src/components/document-list.js` el monto total, la fecha de vencimiento y el estado de cada factura asociada al cliente.
- [ ] **Tarea 16:** Verificar la integridad referencial y el borrado en cascada: impedir facturas sin cliente válido y eliminar las facturas asociadas al eliminar un cliente.
- [ ] **Tarea 17:** Ejecutar `npx vitest run`, corregir los fallos y validar con `npm run dev` el flujo completo: crear cliente -> registrar factura en Borrador -> emitir factura -> visualizar la deuda del cliente.
