# Plan de Implementación: Facturación y Pagos (Módulo de Contabilidad y Finanzas)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-11-02 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Así pierden de vista cuánto les deben, cuánto deben y qué está vencido, y su flujo de caja se resiente. Este plan define la estrategia para construir el MVP del módulo de Contabilidad y Finanzas del ERP con Spec Driven Development, sobre el módulo base del template (Vite, JavaScript vanilla y `localStorage`), adaptado mediante el archivo de configuración `src/module-config.js`.

**Alcance:** solo frontend. El módulo administra Terceros (clientes, proveedores o personal) y dos documentos separados, Factura de Venta y Factura de Compra, con los estados Borrador, Emitida y Pagada. La compra lleva centro de costo (Activo/Consumible) y, si el tercero es personal, el período de liquidación (`YYYY-MM`); la venta lleva la trazabilidad `salesOrderId`. Cada emisión y pago genera un movimiento financiero de solo lectura (un movimiento por evento); los KPIs se calculan sobre las facturas. La HU7 define el marco de UI: home con KPIs y accesos directos y menú desacoplado (componente estático con vistas fijas). El pago se registra como campos de la factura. Los datos se guardan en el navegador (`localStorage`), sin backend ni base de datos remota. Las historias de usuario están en `spec.md` y el modelo de datos en `data-model.md`.

**Usuarios objetivo:**

- **Encargado de cobranzas:** registra clientes y emite facturas de venta.
- **Encargado de pagos a proveedores:** registra facturas de compra.
- **Contador:** registra los pagos y cierra las facturas.
- **Gerencia:** revisa la deuda por tercero y las facturas vencidas.
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

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

- Calidad: La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
- **Puertas de Calidad**: Se ejecutará `npm run check` (lint + format + tests) antes de considerar completada cada historia. El cumplimiento de estos gates es obligatorio (Constitución, Quality Standards).
- Pruebas: Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas **antes o junto con** la implementación (Constitución, Test-First). Las pruebas e2e quedan fuera del MVP: el template solo trae Vitest con jsdom, y las pruebas de integración cubren los recorridos críticos. Es una excepción a la Constitución (principio II), por confirmar con el profesor.
- Experiencia de Usuario: La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
- **Rendimiento**: La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM, con presupuesto < 100 ms.

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
├── movements.js        (generación de movimientos financieros por evento, FR-017 a FR-019, sin tareas aún)
└── components/
    ├── shell.js        (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral, estado de módulo activo)
    ├── dashboard.js    (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-form.js  (formulario de creación/edición de entidades con campos personalizados)
    ├── entity-list.js  (listado de entidades)
    ├── document-form.js (formulario de creación/edición de documentos con campos personalizados y ciclo de vida de estados)
    ├── document-list.js (listado de documentos)
    ├── search-bar.js   (barra de búsqueda)
    └── tracking.js     (vista de seguimiento de deuda y vencimientos)

tests/
├── unit/
├── integration/
└── setup/
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (`styles.css`) para que el color de acento configurado se aplique globalmente. Los archivos `tracking.js` y `demo-data.js` son nuevos en esta versión y quedan sujetos a la tarea T037/T041 respectivamente.

## Seguimiento de Complejidad

Este plan no introdujo violaciones de la constitución.

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
| FR-006 | Sí | T012, T021, T028, T029 | Asociación factura-tercero |
| FR-007 | Sí | T020, T022, T025 | Campos/validación |
| FR-008 | Sí | T020 | Descuento > subtotal |
| FR-009 | No | — | `salesOrderId` (HU2, sin tarea aún; ver nota) |
| FR-010 | Sí | T020 | Descuento > subtotal |
| FR-011 | Sí | T011 | Estado inicial Borrador y transiciones (antes FR-009/FR-010) |
| FR-012 | Sí | T020, T022, T029 | Compra → proveedor/personal |
| FR-013 | Sí | T020, T022 | Reglas compartidas con venta |
| FR-014 | No | — | Centro de costo (HU3, sin tarea aún) |
| FR-015 | No | — | Período liquidación YYYY-MM (HU3, sin tarea aún) |
| FR-016 | Sí | T031, T032, T033, T034 | Pago y Pagada |
| FR-017 | No | — | Movimientos financieros (FUENTE de verdad: facturas; sin tarea aún) |
| FR-018 | No | — | Contenido de movimientos (sin tarea aún) |
| FR-019 | No | — | Listado y solo-lectura de movimientos (sin tarea aún) |
| FR-020 | Parcial | T039 | Menú desacoplado: `shell.js` ya lo es; falta precisión de vistas |
| FR-021 | Parcial | T039 | Home con KPIs: `dashboard.js` existe; KPIs por facturas |
| FR-022 | Parcial | T039 | Navegación sin recarga: base en el template |
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
| SC-006 | No | — | Movimientos conciliados (sin tarea aún) |

**Total de requisitos**: 36 (30 FR + 6 SC) tras la Revisión 3 del spec (2026-11-05)
**Total de tareas**: 52 (T001 a T052)
**Cobertura**: 78 % (28/36 requisitos con tareas o parciales; SC-003 implícita). Los FR-009, FR-014, FR-015, FR-017, FR-018, FR-019 y SC-006 provienen de la separación de documentos, los movimientos financieros, los campos nuevos y la HU7 de la Revisión 2/3 del spec y **no tienen tareas aún**: requieren una nueva corrida de `speckit.tasks` sin eliminarse. Los FR-020/021/022 se cubren parcialmente con el marco `shell.js`/`dashboard.js` ya planificado.
**Críticos**: 1 en el análisis del 03-11-2026 (C1: puertas de calidad ausentes en las tareas). Se atendió en T048 y en las Notas de `tasks.md`; falta volver a ejecutar `speckit.analyze` para confirmarlo.