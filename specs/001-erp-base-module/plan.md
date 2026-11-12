# Plan de Implementación: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-11-02 | **Actualizado**: 2026-11-11 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md` (Revisión 4, 2026-11-11)

## Resumen

Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Así pierden de vista cuánto les deben, cuánto deben y qué está vencido, y su flujo de caja se resiente. Este plan define la estrategia para construir el MVP del módulo de Contabilidad y Finanzas del ERP con Spec Driven Development, sobre el módulo base del template (Vite, JavaScript vanilla y `localStorage`), adaptado mediante el archivo de configuración `src/module-config.js`.

**Revisión 4 (2026-11-11).** La separación entre facturas de venta y de compra deja de ser solo un filtro y pasa a ser visual y funcional: dos vistas, dos formularios y dos listados independientes con columnas propias. El almacenamiento sigue siendo un único `Document` con `tipoFactura`; la UI no reutiliza la vista genérica de documentos. La venta muestra `salesOrderId`; la compra muestra `centroCosto` y `periodoLiquidacion`.

**Alcance:** solo frontend. El módulo administra Terceros (clientes, proveedores o personal) y dos documentos separados, Factura de Venta y Factura de Compra, con los estados Borrador, Emitida y Pagada. La compra lleva centro de costo (Activo/Consumible) y, si el tercero es personal, el período de liquidación (`YYYY-MM`); la venta lleva la trazabilidad `salesOrderId`. Cada emisión y pago genera un movimiento financiero de solo lectura (un movimiento por evento); los KPIs se calculan sobre las facturas. La HU7 define el marco de UI: home con KPIs y accesos directos y menú desacoplado (componente estático con vistas fijas). El pago se registra como campos de la factura. Los datos se guardan en el navegador (`localStorage`), sin backend ni base de datos remota. Las historias de usuario están en `spec.md` y el modelo de datos en `data-model.md`.

**Usuarios objetivo:**

- **Encargado de cobranzas:** registra clientes y emite facturas de venta.
- **Encargado de pagos a proveedores:** registra facturas de compra.
- **Contador:** registra los pagos y cierra las facturas.
- **Gerencia:** revisa la deuda por tercero y las facturas vencidas.
- **Responsable de remuneraciones:** registra facturas de compra dirigidas al personal como instrumento de las liquidaciones de sueldo.
- **Integrante del equipo (demostración):** carga los datos de ejemplo y guarda referencias a otros módulos.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022), HTML, CSS  
**Dependencias Principales**: Vite, sin framework de interfaz pesado  
**Almacenamiento**: localStorage del navegador para una instancia del módulo de espacio único  
**Pruebas**: Vitest con jsdom para pruebas unitarias y de interacción  
**Plataforma Objetivo**: Navegadores modernos de escritorio y móviles  
**Tipo de Proyecto**: Aplicación web  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; presupuesto: búsqueda y render < 100 ms en hardware objetivo; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación  
**Arquitectura de UI**: dos vistas de factura independientes (`invoice-sale`, `invoice-purchase`) construidas sobre fábricas compartidas de formulario y listado, con el tipo de factura fijado por la vista y un único almacenamiento `Document` con `tipoFactura`

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- **Puertas de Calidad**: Se ejecutará `npm run check` (lint + format + tests) antes de considerar completada cada historia. El cumplimiento de estos gates es obligatorio (Constitución, Quality Standards).
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas **antes o junto con** la implementación (Constitución, Test-First). Las pruebas e2e quedan fuera del MVP: el template solo trae Vitest con jsdom, y las pruebas de integración cubren los recorridos críticos. Es una excepción a la Constitución (principio II), por confirmar con el profesor. **Estado del seguimiento**: registrada como desviación explícita el 05-11-2026 (análisis `/speckit.analyze`, hallazgo C1): confirmación del profesor pendiente en T004; la cobertura crítica de recorridos recae en 25 archivos de pruebas de integración Vitest/jsdom (94+ casos). La separación de facturas (Revisión 4) se implementa con pruebas primero: `tests/integration/invoice-separation.test.js` y la actualización de `us10`, `us12` y `us13`.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- **Rendimiento**: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM, con presupuesto < 100 ms.

**Reverificación post-diseño (Fase 1, Revisión 4)**: la separación de vistas no cambia el modelo de datos ni las claves de almacenamiento; las fábricas compartidas reducen la duplicación y las pruebas de separación cubren los recorridos críticos. Se mantiene la única desviación registrada (pruebas e2e fuera del MVP).

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── mer.png
├── contracts/
│   └── entity-storage.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Código Fuente (raíz del repositorio)

```text
index.html
src/
├── main.js
├── styles.css
├── storage.js
├── validation.js
├── search.js
├── utils.js
├── app.js
├── module-config.js
├── tracking.js         (cálculos de deuda y vencimiento, FR-023 a FR-025, sobre las facturas)
├── demo-data.js        (cargador de datos de demostración, HU6/FR-026)
├── movements.js        (generación de movimientos financieros por evento, FR-017 a FR-019, T060–T063)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── entity-list.js  (listado de entidades)
    ├── invoice-form.js (fábrica compartida: createInvoiceForm({ tipoFactura, root }), estado por instancia)
    ├── invoice-sale-form.js (instancia de formulario de factura de venta)
    ├── invoice-purchase-form.js (instancia de formulario de factura de compra)
    ├── invoice-list.js (renderizador compartido de listados con columnas por tipo)
    ├── invoice-sale-list.js (listado de factura de venta y sus columnas)
    ├── invoice-purchase-list.js (listado de factura de compra y sus columnas)
    ├── search-bar.js   (barra de búsqueda)
    └── tracking.js     (vista de seguimiento de deuda y vencimientos)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (`styles.css`) para que el color de acento configurado se aplique globalmente. Los archivos `tracking.js` y `demo-data.js` son nuevos en esta versión y quedan sujetos a la tarea T037/T041 respectivamente.

### Separación visual y funcional de facturas (Revisión 4)

**Decisión.** La separación es de interfaz y de flujo, no de almacenamiento. `erp.documents` sigue siendo una sola colección y cada factura conserva `customFields.tipoFactura`. Lo que cambia es que el tipo se fija por la vista y deja de ser un selector del formulario.

**Vistas (`index.html`).**
- `#view-invoice-sale` y `#view-invoice-purchase` reemplazan a `#view-documents`.
- Cada vista contiene su propio formulario, su propio selector de edición y su propio contenedor de listado.
- Se retira `#nav-documents` del menú; las facturas se abren solo desde `#nav-invoice-sale` o `#nav-invoice-purchase`.
- Se conservan `#qa-new-invoice-sale` y `#qa-new-invoice-purchase`; se retira `#qa-new-document`.

**Formularios.**
- `src/components/invoice-form.js` exporta `createInvoiceForm({ tipoFactura, root, config, onSubmit })` y devuelve una instancia con estado propio (`editingId`, entidades cacheadas, funciones `reset`, `setDocument`, `setEntities`, `setOptions`, `focus`, `showErrors`, `getEditingId`).
- `invoice-sale-form.js` e `invoice-purchase-form.js` son envoltorios finos que crean la instancia con `tipoFactura: 'venta'` y `'compra'`.
- El formulario no muestra el campo `tipoFactura`; lo inyecta al leer los valores (`customFields.tipoFactura = tipoFactura`) y lo valida como invariante al editar.
- Los campos comunes son los de la factura (folio, serie, fechas, montos, moneda, estado, pago). Los campos propios se filtran por tipo: venta → `salesOrderId`; compra → `centroCosto` y `periodoLiquidacion` (este último solo si el tercero es `personal`).
- El selector de tercero se filtra por tipo: venta → `cliente`; compra → `proveedor` o `personal`.
- Cada formulario usa un `root` con atributos `data-field`, `data-error` y `data-custom-fields` en lugar de IDs globales, para que ambos puedan coexistir sin colisiones.

**Listados y columnas.**
- `src/components/invoice-list.js` exporta `renderInvoiceList(container, documents, entities, { tipoFactura, columns, onEdit, onDelete })`.
- `invoice-sale-list.js` define las columnas: Folio, Estado, Emisión, Vencimiento, Total, Orden de venta (`salesOrderId`).
- `invoice-purchase-list.js` define las columnas: Folio, Estado, Emisión, Vencimiento, Total, Centro de costo, Período de liquidación.
- Ambos listados filtran por `customFields.tipoFactura === tipoFactura`; un documento del otro tipo no se muestra ni se puede editar desde esa vista.
- Las columnas y etiquetas se declaran en `INVOICE_VIEWS` dentro de `src/module-config.js` para mantener un único punto de adaptación.

**Navegación (`src/app.js`).**
- `VIEW_ELEMENTS` mapea `invoice-sale → invoice-sale` y `invoice-purchase → invoice-purchase`; ninguna ruta apunta a `documents`.
- `showModule` oculta y muestra las dos vistas nuevas.
- `editDocument(id)` busca el documento, lee su `tipoFactura` y navega a la vista correspondiente antes de cargar el formulario.
- `requestDeleteDocument(id)` refresca el listado de la vista del tipo.
- `handleInvoiceSubmit(tipoFactura, values, editingId)` fuerza el tipo y llama a `addDocument`/`updateDocument` sin cambios en `storage.js`.

**Menú (`src/components/shell.js`).**
- `NAV_MODULES` elimina `documents`.
- Las dos entradas de factura se agrupan visualmente bajo un encabezado "Facturación" (`<div class="nav-group" aria-labelledby="nav-invoicing-label">`), sin cambiar el contrato de `createShell`.

**Estilos (`src/styles.css`).**
- `.invoice-view--sale` y `.invoice-view--purchase` con borde y acento distintos.
- `.invoice-badge--sale` y `.invoice-badge--purchase` para identificar el tipo en el listado.
- Tabla de listado con `thead`/`tbody` y columnas alineadas; en móvil se permite desplazamiento horizontal.

**Invariantes.**
- Un documento no puede cambiar de `tipoFactura` desde la UI.
- Una factura de venta nunca aparece en el listado de compra, ni viceversa.
- El almacenamiento, las validaciones de negocio, la generación de movimientos y los KPIs no cambian.
- La vista genérica de documentos deja de ser accesible desde el menú y se retira del HTML.

**Pruebas.**
- Nueva `tests/integration/invoice-separation.test.js`: dos vistas, dos formularios, dos listados, columnas por tipo, aislamiento de tipo, tipo fijo y menú sin "Documentos".
- Actualizar `us10-documents` (usar los formularios de venta/compra), `us12-lifecycle` (navegar por `nav-invoice-sale`/`nav-invoice-purchase`) y `us13-shell` (esperar `view-invoice-sale`/`view-invoice-purchase`).
- Actualizar también las pruebas que usan la vista genérica: `foundation`, `us4-management`, `us5-config` y `us6-labels`.

## Seguimiento de Complejidad

Se mantiene una desviación explícita y registrada: las pruebas e2e quedan fuera del MVP (Constitución, principio II), con la cobertura de recorridos críticos en Vitest/jsdom y la confirmación del profesor pendiente en T004. La separación de facturas no introduce nuevas violaciones: la fábrica compartida evita duplicación y las dos vistas se prueban por separado.

## Puertas de Calidad

Antes de finalizar cualquier historia:

1. Ejecutar `npm run lint` y corregir todos los warnings.
2. Ejecutar `npm run format:check` y aplicar `npm run format` si es necesario.
3. Ejecutar `npm run check` que ejecuta lint + format:check + tests `--run`.
4. Verificar que las pruebas correspondientes pasen y la cobertura de requisitos (FR/SC) esté cumplida.

---

# Tabla de cobertura (requisitos → tareas)

| Clave | ¿Tiene tarea? | Tareas | Notas |
|-------|----------------|--------|-------|
| FR-001 | Sí | T013, T014, T015 | Registrar terceros |
| FR-002 | Sí | T013 | Validación nombre/código |
| FR-003 | Sí | T013, T016 | Límite de crédito solo clientes |
| FR-004 | Débil | T013, T014 | Búsqueda no es foco |
| FR-005 | Sí | T014, T017 | Cascada con confirmación (incluye movimientos) |
| FR-006 | Sí | T071–T078 | Dos vistas, dos formularios y dos listados con columnas propias (Revisión 4) |
| FR-007 | Sí | T020, T022, T025, T029 | Venta solo a cliente |
| FR-008 | Sí | T020, T022, T025 | Fechas, folio, total > 0 al emitir |
| FR-009 | Sí | T053, T055, T056, T062, T071–T078 | `salesOrderId` (Revisión 3, consolidado 05-11; columna de venta en Revisión 4) |
| FR-010 | Sí | T020 | Descuento > subtotal |
| FR-011 | Sí | T009, T011, T021, T024 | Borrador inicial y transiciones únicas |
| FR-012 | Sí | T020, T022, T029 | Compra → proveedor/personal |
| FR-013 | Sí | T020, T022 | Reglas compartidas con venta |
| FR-014 | Sí | T053, T057, T058, T071–T078 | Centro de costo (Revisión 3, consolidado 05-11; columna de compra en Revisión 4) |
| FR-015 | Sí | T053, T057, T059, T041, T071–T078 | Período liquidación YYYY-MM (Revisión 3; columna de compra en Revisión 4) |
| FR-016 | Sí | T031, T032, T033, T034 | Pago y Pagada |
| FR-017 | Sí | T060, T061, T062 | Movimientos por evento (Revisión 3, consolidado 05-11) |
| FR-018 | Sí | T060, T062 | Contenido de movimientos |
| FR-019 | Sí | T061, T063 | Listado y solo-lectura de movimientos |
| FR-020 | Sí | T064, T065, T071, T074 | Menú desacoplado con vistas fijas; sin vista genérica de documentos (Revisión 4) |
| FR-021 | Sí | T064, T066 | Home con KPIs sobre las facturas |
| FR-022 | Sí | T064, T067, T074 | Navegación sin recarga entre las dos vistas de factura |
| FR-023 | Sí | T035-T039 | Deuda por cobrar/pagar |
| FR-024 | Sí | T035-T039 | Vencidas (estrictamente anterior a hoy) |
| FR-025 | Sí | T035-T039 | Excluir Pagadas |
| FR-026 | Sí | T040, T041, T042, T049 | Demo y persistencia |
| FR-027 | Débil | T043, T044 | `sales_order_id` sigue la regla de referencias |
| FR-028 | Sí | T018 | Validar RUT |
| FR-029 | Sí | T016, T026 | Aviso con confirmación explícita |
| FR-030 | Sí | T019, T027 | Código ya único en el template; serie-folio dentro de cada tipo |
| SC-001 | Sí | T049 | < 3 min |
| SC-002 | Sí | T035, T036 | Pagadas no cuentan |
| SC-003 | Implícita | Pruebas | Rechazo con mensaje |
| SC-004 | Sí | T040, T041 | Persistencia |
| SC-005 | Sí | T049 | Flujo < 5 min |
| SC-006 | Sí | T060–T063 | Movimientos conciliados (cubierto en la corrida del 05-11) |

**Total de requisitos**: 36 (30 FR + 6 SC) tras la Revisión 4 del spec (2026-11-11)
**Total de tareas**: 78 (T001 a T078): 70 existentes (T001 a T070) + 8 de la separación de facturas (T071 a T078)
**Cobertura**: ~97 % (35/36 con tarea directa; FR-004 débil: búsqueda viene del template y falta el filtro por tipo; SC-003 implícita en las pruebas de validación). Los FR-009, FR-014, FR-015, FR-017 a FR-019 y SC-006 quedaron cubiertos en la corrida de `speckit.tasks` del 05-11-2026 (T053–T063). Los FR-020/021/022 de la HU7 quedaron cubiertos con T064–T067. La Revisión 4 agrega la separación visual y funcional de facturas: FR-006 y las columnas de FR-009/FR-014/FR-015 se cubren con T071–T078, ya generadas en `tasks.md`.
**Críticos**: 0. El crítico C1 del análisis del 03-11 (puertas de calidad ausentes en las tareas) se atendió en T048 y en las Notas de `tasks.md`. Los dos MEDIUM del análisis del 05-11 (excepción e2e sin confirmar, hallazgo C1; presupuesto de rendimiento sin tarea, hallazgo C2) se atienden en el registro de desviación de esta sección y en la tarea T070.