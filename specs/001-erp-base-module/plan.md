# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

# Plan de Desarrollo: Módulo de Cuentas por Cobrar

El módulo de Cuentas por Cobrar es fundamental dentro del área de Finanzas para gestionar la cartera de clientes, el seguimiento de facturas emitidas y el control de pagos recibidos. Muchas empresas sufren descontrol en sus flujos de caja debido a la falta de registro centralizado del límite de crédito de sus clientes y al estado de sus facturas (pendientes vs. pagadas).

Este documento define la estrategia de implementación del MVP del módulo de Finanzas utilizando Spec Driven Development.

El alcance es exclusivamente frontend: administrar Clientes y Facturas con los estados Borrador, Emitida y Pagada. Se reutiliza la persistencia local del template, sin backend ni base de datos remota. Esta revisión modifica solamente el plan; las tareas de implementación siguientes no se ejecutan en esta entrega.

## Clientes y Usuarios Objetivos 

Ejecutivo de Cobranzas / Ventas: Registra nuevos clientes, valida RUT/límite de crédito y emite facturas en borrador. 

Encargado de Finanzas / Contador: Revisa las facturas emitidas, valida los pagos recibidos y cambia el estado a "Pagada".

Gerencia: Revisa el total de deuda por cliente y el estado global de la cartera de cobros.

## Compatibilidad con la estructura base

La especialización prevista es `Entity` como Cliente y `Document` como Factura, conforme al modelo base de `specs/001-erp-base-module/data-model.md`. Los nombres técnicos se conservan tal como aparecen en `BASE_FIELDS` de `src/module-config.js` y en los registros de `src/storage.js`. Las etiquetas visibles pueden adaptarse sin duplicar campos.

| Concepto del módulo | Campo de la plantilla | Uso previsto |
|---|---|---|
| Cliente | Entidad: `id`, `entity_id`, `name`, `code` | Reutilizar el registro maestro como Cliente. `Entity.id` es su identificador interno para editar/eliminar; `Entity.entity_id` es un identificador público distinto, generado automáticamente y referenciado por `Document.entity_id`. No son intercambiables. `name` y `code` son obligatorios. |
| RUT | Entidad: `taxId` (identificación fiscal) | Campo base disponible para la identificación fiscal. Pendiente confirmar su uso como RUT chileno y definir formato, obligatoriedad y validación del dígito verificador; la plantilla no implementa esas reglas. No crear `tax_id` como duplicado. |
| Límite de crédito | Entidad: `creditLimit` | Reutilizar el límite existente, opcional y numérico no negativo. No crear `credit_limit`; el nombre usado en `specs/spec.md` no es la clave técnica de la plantilla. No se comprobó una regla que bloquee facturas por superar el límite. |
| Factura | Documento: `id`, `entity_id`, `series`, `folio` | Especializar el documento como Factura. `Document.id` es su identificador propio, generado automáticamente y usado para editar/eliminar; `Document.entity_id` no identifica la Factura, sino que referencia `Entity.entity_id` del Cliente. `series` + `folio` representan la numeración comercial, no sustituyen a `Document.id`. El folio es obligatorio y entero positivo; la serie es opcional. No asumir numeración automática ni unicidad por serie. |
| Emisión | Documento: `startDate`, candidato pendiente | Existe como fecha de inicio obligatoria, no como fecha de emisión explícita. Confirmar la equivalencia de negocio antes de adoptarla en el MER o cambiar su etiqueta; no dar por existente un campo específico de emisión. |
| Vencimiento | Documento: `endDate`, candidato pendiente | Existe como fecha de fin obligatoria y no anterior a `startDate`, no como vencimiento explícito. Confirmar la equivalencia antes de adoptarla. No crear `due_date` sin resolver primero este punto. |
| Monto de la factura | Documento: `totalAmount` | Reutilizar el importe total numérico no negativo. La plantilla lo admite como opcional y no lo calcula automáticamente; también contiene `subtotal`, `discount`, `taxAmount` y `currency`. Pendiente definir obligatoriedad del total y moneda del MVP. |
| Estado de la factura | Documento: `status`; configuración: `statusLifecycle` | Reutilizar `status` y planificar el catálogo Borrador, Emitida y Pagada con transiciones Borrador -> Emitida -> Pagada, siendo Pagada terminal. Actualmente `statusLifecycle` es `null`: estos estados aún no están configurados. |

### Relación y almacenamiento para el MER

- Relación prevista: un Cliente puede tener cero o muchas Facturas; cada Factura debe pertenecer a un Cliente existente.
- Identificadores del Cliente: `addEntity` genera por separado `Entity.id` y `Entity.entity_id`. La edición y eliminación buscan por `Entity.id`; la asociación de facturas utiliza `Entity.entity_id`, conforme al modelo base.
- Identificador de la Factura: `addDocument` genera `Document.id`, usado para editar/eliminar ese documento. No existe un campo base `document_id`; `Document.entity_id` es la referencia al Cliente, no el identificador propio de la Factura.
- Enlace comprobado para el MER: `Document.entity_id` referencia `Entity.entity_id`, no `Entity.id`. En `src/app.js`, el selector `document-entity` contiene valores de `Entity.entity_id`; `collectDocumentData` entrega el seleccionado como `entityId`, `validateDocument` lo compara con `Entity.entity_id` y `addDocument` lo guarda como `Document.entity_id`. `entityId` es el nombre de entrada, no una clave del registro persistido.
- Los controles ocultos `entity-id` y `document-id` se cargan con `Entity.id` y `Document.id`, respectivamente, al editar. Son identificadores HTML, no nombres de campos persistidos: en particular, `entity-id` no representa `Entity.entity_id`.
- `src/storage.js` almacena arreglos JSON en `localStorage`, bajo `erp_entities` y `erp_documents`. El MER describe este modelo lógico, no tablas de un servidor SQL.
- La validación de documentos comprueba la existencia de la entidad; eliminar una entidad elimina sus documentos en cascada. No presentar estas reglas de aplicación como restricciones de una base de datos.
- `createdAt` y `updatedAt` son marcas técnicas de auditoría, no fechas de emisión ni vencimiento. `targetDate` pertenece a la entidad y no acredita el vencimiento de una factura.

### Comprobaciones y decisiones pendientes

- Fuentes de la compatibilidad: `src/module-config.js` (`BASE_FIELDS`, `normalizeConfig`), `src/storage.js` (validación, creación y persistencia), `index.html` (etiquetas de campos) y `specs/001-erp-base-module/data-model.md` (modelo y relaciones).
- Confirmar el significado de `startDate` y `endDate` para emisión y vencimiento. Hasta entonces son candidatos, no equivalencias verificadas ni nuevos campos aprobados.
- Acordar las reglas de RUT, moneda y obligatoriedad del monto indicadas en la tabla, sin ampliar el alcance a otros registros o procesos.
- Resolver la diferencia entre documentación y código antes de implementar la configuración: `README.md` describe un objeto `userConfig`, pero este no existe en el `src/module-config.js` consultado. `src/main.js` arranca con `normalizeConfig(null)` y `loadModuleConfig()` también devuelve los valores predeterminados. Queda pendiente definir cómo se conectará la configuración del módulo al arranque real.
- Asegurar en la futura implementación que toda factura nueva inicie en Borrador: la plantilla no impone ese estado inicial y su validación permite un estado vacío incluso con un ciclo configurado. No agregar un campo de estado alternativo.

## Fase 1: Definición y Diseño (Actual)
- Definir las entidades críticas (Cliente) y los documentos transaccionales (Facturas).
- Diseñar el Modelo Entidad-Relación (MER) compatible con los campos e identificadores anteriores y la relación Cliente 1 a Factura 0..N.
- Resolver y documentar las equivalencias pendientes antes de cerrar el MER, sin inventar campos ni asumir significados no comprobados.
- Mantener la trazabilidad con `specs/spec.md` y el modelo base; esta entrega no crea ni modifica otros documentos.

## Fase 2: Configuración del Template ERP
- Conectar la configuración del módulo al arranque real una vez resuelta la discrepancia indicada; no asumir que existe `userConfig`.
- Configurar `moduleName` a "Contabilidad y Finanzas: Cuentas por Cobrar".
- Configurar `labels` con `entity`: "Cliente", `entities`: "Clientes", `document`: "Factura" y `documents`: "Facturas". La interfaz base ya está en español.

## Fase 3: Reutilización de Campos Base y Ciclo de Vida
- Reutilizar `taxId`, `creditLimit`, `totalAmount` y `status`; no declararlos en `customFields` ni crear duplicados con otros nombres.
- Adaptar las etiquetas y reglas de las fechas solo después de confirmar sus equivalencias. Evaluar campos personalizados únicamente si se demuestra una necesidad no cubierta por los campos base; por ahora no se aprueba ninguno.
- Definir `statusLifecycle.statuses` como Borrador, Emitida y Pagada, y `statusLifecycle.transitions` como Borrador -> Emitida -> Pagada, sin salidas desde Pagada.
- Asegurar el estado inicial Borrador y la imposibilidad de guardar estados vacíos o ajenos al catálogo, reutilizando `status`.

## Fase 4: Pruebas y Despliegue Local
- Ejecutar el entorno de desarrollo local con Vite (`npm run dev`).
- Probar el flujo completo: Crear un Cliente -> Crear Factura en Borrador -> Emitir Factura -> Marcar Factura como Pagada.
- Verificar la asociación por `entity_id`, los campos base reutilizados y la conservación de datos al recargar con `localStorage`.
- Agregar o ajustar pruebas de las reglas implementadas y ejecutar `npx vitest run`: campos obligatorios de la base, importes no negativos, fechas según la decisión aprobada, estado inicial y rechazo de estados/transiciones no permitidos.
- Comprobar el borrado en cascada con datos de demostración y confirmar que no se introducen tipos de registro ni estados fuera del alcance.
- Preparar la demostración funcional (demo) para la presentación final.


## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: búsqueda y renderizado de listas <= 100 ms para 500 registros; actualizaciones de lista sin re-render completo del documento  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- **I. Base modular y configuración única**: PASA. Todo punto de adaptación (nombre, etiquetas, campos personalizados, ciclo de vida, color de acento) vive en `src/module-config.js`; el código central no contiene términos de dominio.
- **II. Test-First (NO NEGOCIABLE)**: PASA CON CONDICIÓN. Los flujos centrales requieren pruebas Vitest escritas antes de la implementación; las tareas T001–T081 deben marcarse completas solo cuando existan sus pruebas y pasen.
- **III. UX de workspace consistente**: PASA. `shell.js` posee barra superior y barra lateral; todas las etiquetas derivan de la configuración; se exige accesibilidad (`aria-current`, foco, etiquetas).
- **IV. Rendimiento medible**: PASA. Objetivo numérico <= 100 ms para 500 registros con actualizaciones dirigidas del DOM (FR-027, SC-004).
- **V. Simplicidad y local-first**: PASA. Sin backend, sin framework pesado, persistencia en localStorage, dependencias mínimas.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── contracts/
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
src/
├── main.js
├── styles.css
├── storage.js
├── app.js
├── module-config.js
└── components/
    ├── shell.js         (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js     (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js   (formulario de creación/edición de entidades con campos personalizados)
    ├── entity-list.js   (lista de entidades con controles de edición/eliminación y validación)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida)
    ├── document-list.js (lista de documentos asociados a una entidad)
    └── search-bar.js    (interfaz de búsqueda de entidades)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución.

