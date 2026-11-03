# Módulo de Contabilidad y Finanzas — Grupo 1

Modelación de Sistemas 2026-2 · Departamento de Ingeniería Industrial · Universidad de Concepción

Módulo de facturación y pagos (por cobrar y por pagar) de un sistema ERP, construido sobre el template `Speckit_Template` con Spec Driven Development (Plan → Spec → Tasks → Implement). Es una aplicación solo frontend: los datos se guardan en el `localStorage` del navegador y no hay backend ni base de datos remota.

## Equipo

| Integrante | Rol | Historia de usuario |
|---|---|---|
| Rivera Benavente, Jaime Alberto | Por definir | HU1 Registrar terceros |
| Zavala Campos, Elías Ignacio | Por definir | HU5 Ver la deuda por tercero y las facturas vencidas |
| Vásquez Mera, Carolina Andrea | Por definir | HU2 Emitir facturas de venta |
| Espinoza Muñoz, Matías Ignacio | Por definir | HU3 Registrar facturas de compra |
| Ulloa Troncoso, Javier Ignacio | Por definir | HU4 Registrar el pago y marcar Pagada |
| Aguayo Puentes, Mauro Alejandro | Por definir | HU6 Datos de demostración y otros módulos |

Líder del grupo: por definir.

## Visión de producto

**Problema.** Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Eso les hace perder de vista cuánto les deben, cuánto deben y qué está vencido, y su flujo de caja se resiente.

**Usuarios.** Encargado de cobranzas, encargado de pagos a proveedores, contador y gerencia. Para la demostración, también el equipo del proyecto, que carga los datos de ejemplo.

**Qué incluye el MVP.**

- Terceros, que pueden ser clientes o proveedores (campo `tipoTercero`).
- Facturas de venta (por cobrar) y de compra (por pagar), con campo `tipoFactura`.
- Ciclo de la factura: Borrador → Emitida → Pagada.
- Pagos como campos de la factura (monto pagado y fecha de pago), no como registro aparte.
- Vista de seguimiento: deuda por tercero y facturas vencidas, hasta donde lo permita el template.

**Qué no incluye el MVP (desarrollo futuro).** Pagos como registro propio, plan de cuentas y asientos contables, activos fijos, presupuestos y conciliación bancaria.

## Escalabilidad y desarrollo futuro

- **Etapa 2: pagos como registro propio.** Hoy el pago va como campos de la factura. Más adelante se separaría en un registro ligado a la factura, para permitir pagos parciales y varios pagos por factura.
- **Etapa 3: contabilidad general.** Plan de cuentas y asientos contables alimentados por las facturas emitidas y pagadas, además de activos fijos y presupuestos.
- **Etapa 4: sistema completo.** Backend y base de datos reales, roles y permisos, e integración con el resto de los módulos del ERP.

**Integración con otros módulos.** Los terceros se relacionan con `customers` (CRM) y `vendors` (Compras). Las facturas de venta, con `sales_orders` (Ventas), y las de compra, con `purchase_orders` (Compras). Los productos vendrían de `products` (Logística). Estas llaves salen del modelo ERP base del curso (`ar_invoices` y `ap_invoices`).

## Riesgos de datos

- El RUT es un dato personal: hay que definir quién puede verlo y cómo se muestra.
- El límite de crédito es una decisión que puede discriminar a algunos clientes. Hay que documentar con qué criterios se fija y cómo se revisa, considerando los sesgos que señala el profesor (O'Neil, 2016).
- `localStorage` no es un almacenamiento seguro: el MVP no debe usarse con datos reales.

## Pendiente de confirmar (consultar con el profesor)

1. Usar un solo tipo de Entidad (Tercero, con `tipoTercero`) y un solo tipo de Documento (Factura, con `tipoFactura`), o documentos separados (cuenta por cobrar y cuenta por pagar), como recomendó el ayudante.
2. Modelar los pagos como campos de la factura.
3. Usar `startDate` y `endDate` del template como fecha de emisión y de vencimiento.
4. Si las líneas de detalle de la factura (ítems) son necesarias en el MVP, o basta con subtotal y total.
5. A qué se refiere la "nomenclatura que dejó el profesor": los nombres del template (Entity, Document) o los del modelo ERP base (`ar_invoices`, `ap_invoices`).
6. Cómo se coordina con los grupos de CRM, Ventas y Compras el identificador que se comparte para relacionar terceros y facturas. Por ahora se deja de forma universal, enfocados en este departamento, y el ayudante lo confirmará con el profesor.
7. Si `plan.md` puede incluir las puertas de calidad (`npm run check`) y la tabla de cobertura que surgieron de `speckit.analyze`, o si solo debe editarse el resumen, como indicó la clase.
8. Si `src/` e `index.html`, que el template actual sí incluye, se copian al repositorio o se generan con `speckit.implement`.
9. Si se acepta que el MVP no tenga pruebas e2e (excepción al principio II de la Constitución), porque el template solo trae Vitest con jsdom.

## Estado del proyecto

- Las especificaciones están en `specs/001-erp-base-module/`.
- `spec.md` y `data-model.md` están rehechos con este alcance, y en `plan.md` se editó el resumen; después se agregaron las puertas de calidad y una tabla de cobertura a partir de `speckit.analyze` (por confirmar con el profesor). `mer.png` es el diagrama entidad-relación. `tasks.md` tiene las tareas por historia de usuario, armadas siguiendo las reglas de `speckit.tasks`. `quickstart.md` y `research.md` son los del template.
- Al 30-10-2026 el repositorio no incluye las carpetas `src/` ni `index.html`, por lo que las instrucciones de *Setup* del template todavía no se pueden ejecutar. El template actual sí las trae, junto con `tests/setup/`. Según el ayudante, el código se genera con `speckit.implement`, fuera de las carpetas de Speckit. Eliminar esta línea cuando estén.
- El 02-11-2026 Mauro ejecutó `speckit.analyze` desde OpenCode. El informe identificó decisiones pendientes y diferencias entre los documentos, además de mejoras en pruebas, calidad, accesibilidad y rendimiento. Se solicitaron propuestas de corrección para revisarlas antes de aplicarlas. Sigue pendiente resolver las aclaraciones y validar los ajustes con el grupo.
- El 03-11-2026 se corrigió la configuración de ESLint y Prettier: `npm run lint` y `npm run format:check` pasan. `npm run check` completo todavía falla en las pruebas, porque falta `src/`. Prettier no revisa `specs/` ni los `.md` (ver `.prettierignore`).

## Registro de decisiones

| Fecha | Decisión | Quién |
|---|---|---|
| 28-10-2026 | Mover los specs a `specs/001-erp-base-module/`, según el feedback del profesor | Jaime Rivera |
| 29-10-2026 | Alcance del MVP: facturación y pagos, por cobrar y por pagar (pendiente de validar con el grupo) | Jaime Rivera |
| 29-10-2026 | Modelo de datos: un solo Tercero y una sola Factura, con los campos `tipoTercero` y `tipoFactura`; el pago va como campos de la factura (el ayudante recomendó documentos separados; pendiente de confirmar con el profesor) | Jaime Rivera |
| 29-10-2026 | `plan.md`: se edita solo el resumen y se mantienen las partes técnicas del template, como indican las clases | Jaime Rivera |
| 29-10-2026 | `tasks.md`: tareas por historia de usuario, armadas siguiendo las reglas de `speckit.tasks` porque OpenCode aún no está configurado | Jaime Rivera |
| 30-10-2026 | Respuestas del ayudante (Matías Arriagada): el MVP solo necesita lo esencial del departamento y no tiene que estar completo; el MER muestra solo lo que tendrá el proyecto y se puede cambiar después; basta con el README y los specs, sin informe aparte | Jaime Rivera |
| 30-10-2026 | Respuestas del ayudante: los comandos de Speckit se ejecutan desde OpenCode (`/speckit-...`); el código se genera con `speckit.implement`; cada integrante escribe su historia de usuario en el mismo `spec.md`, editándolo a mano | Jaime Rivera |
| 30-10-2026 | Integración con otros módulos: se deja de forma universal y se enfoca en este departamento; el ayudante lo confirmará con el profesor | Jaime Rivera |
| 01-11-2026 | Se fusionó el PR #2 a `main` y se borró la rama `docs/actualizar-readme`. Desde ahora el grupo trabaja solo en `main` y hace Fetch/Pull antes de editar, como indicó el profesor en su video | Jaime Rivera |
| 01-11-2026 | Reparto de historias: HU1 Jaime, HU2 Carolina, HU3 Matías, HU4 Javier y HU6 Mauro. Quedan por definir la HU5 y el líder del grupo. Se retira la HU7 (consultar facturas por número y fecha) y se mantiene la HU3 de Matías, para dejar seis historias | Grupo |
| 01-11-2026 | Se eliminó la copia duplicada de `spec.md` en la raíz (`001-erp-base-module/`), que reapareció por una edición hecha sobre la ruta antigua | Jaime Rivera |
| 01-11-2026 | Se precisó la HU6 para cargar clientes, proveedores y facturas ficticias, probar los procesos de cobro y pago y guardar referencias manuales a otros módulos. Se mantiene el alcance genérico indicado por el ayudante, pendiente de confirmación con el profesor y de alinear los demás documentos. | Mauro Aguayo |
| 01-11-2026 | Para la carga de demostración se definió que el módulo debe estar vacío. Repetir la carga no debe generar duplicados y, si existen registros propios, deben conservarse sin agregar los ejemplos. Estas condiciones quedaron incorporadas en los escenarios de aceptación de HU6. | Mauro Aguayo |
| 01-11-2026 | Se detallaron las tareas T040–T044 para cubrir pruebas, datos ficticios, botón de carga y referencias a otros módulos. Se conservaron sus identificadores y las tareas de los demás integrantes. La implementación sigue pendiente; tener la historia redactada no implica marcar estas tareas como terminadas. | Mauro Aguayo |
| 03-11-2026 | Feedback del profesor del 02-11: hacer la primera implementación, registrar lo modificado y lo incremental y volver al spec; dividir al grupo entre ajustes previos y funcionalidad nueva; integrar la nueva versión en 2 semanas | Grupo |
| 03-11-2026 | Revisión de coherencia entre documentos: se corrigió el conteo de aclaraciones pendientes, se alinearon `plan.md` y `tasks.md` (estructura de archivos y número de tareas), se retiraron del `spec.md` las menciones a personas y se unificó el formato de la HU6 | Jaime Rivera |
| 03-11-2026 | Elías Zavala asumió la HU5 (ver la deuda por tercero y las facturas vencidas), según sus commits del 02 y 03-11-2026. Con esto las seis historias tienen responsable; queda por definir el líder del grupo | Elías Zavala |
| 03-11-2026 | Se corrigió la configuración de ESLint y Prettier (error de arranque de ESLint, globales del navegador, `.prettierignore` para documentos y formato de los archivos de `tests/`) y se actualizó `package-lock.json` | Jaime Rivera |

## Uso de IA (anexo)

Según la política del curso, cada consulta a un modelo de IA generativa se registra con modelo, fecha y secuencia de prompts.

| Fecha | Integrante | Modelo (versión) | Para qué | Prompts |
|---|---|---|---|---|
| Antes del 26-10-2026 (fecha exacta no registrada) | Jaime Rivera | Gemini (Google), versión no registrada | Primer avance: versión anterior de los specs | No se conservan: el chat fue borrado |
| 28-10-2026 al 03-11-2026 | Jaime Rivera | Claude (Anthropic); modelo configurado en la sesión: claude-sonnet-5-5 (el modelo que respondió puede variar) | Organización del repositorio, definición del alcance, README, spec, data-model, MER, plan y tasks; resolución de conflictos del PR; revisión del repositorio contra el enunciado, la rúbrica y el feedback; corrección de incoherencias entre documentos; preparación del computador para el taller y corrección de ESLint y Prettier | Secuencia resumida: (1) reorganizar el repositorio según el feedback del profesor; (2) definir el alcance del módulo (facturación y pagos, por cobrar y por pagar); (3) rehacer `spec.md` y `data-model.md` y generar el MER; (4) editar solo el resumen de `plan.md` y armar `tasks.md`; (5) resolver los conflictos del PR y repartir las historias; (6) revisar el repositorio contra el enunciado, la rúbrica y el feedback; (7) corregir incoherencias entre documentos; (8) preparar el computador para el taller de OpenCode y Speckit; (9) probar y corregir la configuración de ESLint y Prettier |
| 03-11-2026 | Jaime Rivera | Big Pickle (modelo por defecto de OpenCode 1.19.5) | Pruebas de la instalación de OpenCode en el repositorio: lectura de archivos y `/speckit.analyze`, con el agente Plan, sin editar archivos | (1) "Responde solo con la palabra OK"; (2) "Lee specs/001-erp-base-module/tasks.md y spec.md. Dime cuántas tareas con identificador T### hay en tasks.md, cuántas historias de usuario tiene spec.md y cuántos marcadores [NEEDS CLARIFICATION] hay en spec.md."; (3) `/speckit.analyze` |
| 01-11-2026 | Mauro Aguayo | GPT-6.1 Sol (ChatGPT Work) | Apoyo para comprender y redactar la HU6, definir sus escenarios de aceptación y ajustar sus tareas al resto del proyecto. También se recibió orientación para resolver problemas de Git y mantener el trabajo en main. | Completar |
| 02-11-2026 | Mauro Aguayo | GPT-6.1 Sol (OpenCode) | Revisión de la coherencia entre especificaciones, plan y tareas mediante speckit.analyze. Se analizaron los hallazgos y las propuestas de mejora para identificar ajustes pendientes antes de implementar el módulo. | Completar |

## Referencias

- O'Neil, C. (2016). *Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy*. Crown.
- Template `MDS-BI/Speckit_Template` y modelo de datos ERP base del curso.
- Enunciado del trabajo grupal y diapositivas de Modelación de Sistemas 2026-2, Universidad de Concepción.

---

## Base técnica del template (original, no modificar)

### ERP Software Base Module (Vite + Vanilla JS)

Minimal single-page app serving as an Enterprise Resource Planning (ERP) software base module. It provides the common foundation for building custom ERP modules: master data management (Entities) and linked transactional documents (Documents) with create/edit/delete/search, validation, and browser localStorage persistence — using Vite and vanilla HTML, CSS, and JavaScript.

The user interface is fully in **Spanish** (default terms: Entidad / Documento; module name: Módulo Base ERP), including labels, validation messages, empty states, and dialogs.

Entities carry standard ERP master-data fields (name, code, tax ID, email, phone, address, category, target date, credit limit, payment terms). Documents use series + folio numbering and carry a monetary breakdown (subtotal, discount, tax, total), currency, payment terms, notes, quantity, dates, and status.

The app presents itself as a coherent ERP workspace:

- **Workspace shell** — every screen lives inside a branded chrome: a top bar with a logo (an SVG monogram derived from the module name) and module name, plus a persistent sidebar of module buttons (Panel, Entidades, Documentos, Búsqueda). The active module is highlighted (`aria-current="page"`), and the sidebar collapses to an icon rail on narrow viewports.
- **Home dashboard** — the entry screen offers quick-action buttons for key ERP tasks (new entity, new document, open management areas, find records) and live statistic cards showing record counts.
- **Design tokens** — styling is driven by CSS custom properties in `src/styles.css`, so branding changes apply globally.

### Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

### Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

### Building Custom Modules

Custom ERP modules built on this base define:

- What an **Entity** represents (e.g., customer, product, asset) plus domain-specific fields.
- What a **Document** represents (e.g., order, invoice, contract).
- Module-specific labels and validation rules.

The base module handles identity generation, timestamps, referential integrity between entities and documents, cascade deletion, navigation, and search. See `specs/001-erp-base-module/` for the full specification.

### Tailoring via Configuration

All tailoring lives in one place: the `userConfig` object at the top of `src/module-config.js`. Developers edit this single export; no core code changes are required. Available knobs:

- `moduleName` — display name shown in the top bar, dashboard, and document title; also derives the logo monogram.
- `labels` — rename Entity/Document terms across every screen, including sidebar buttons, quick actions, forms, and messages. Spanish articles and agreements (el/la, seleccionado/a) are derived from the first word of each configured term.
- `customFields` — declare extra fields per record type with `target` (`entity` or `document`), `key`, `label`, `type` (`text`, `number`, `date`, or `select`), optional `required`, and `options` for selects. Keys must not collide with base field names (see `specs/001-erp-base-module/data-model.md`). Values persist alongside records and appear in search results.
- `statusLifecycle` — restrict document statuses to a configured list of `statuses` with permitted `transitions` between them. Without it, status stays a free-form field.
- `theme.accentColor` — a hex color (e.g., `"#0f62fe"`) applied across the shell as highlights and primary controls. Invalid values fall back to the default.

If the configuration is invalid (unknown types, bad keys, transitions referencing unknown statuses, non-hex accent colors), the app shows the problems in a banner and falls back to defaults instead of breaking.

### Notes

- Data is persisted to `localStorage` under the keys `erp_base_module:entities` and `erp_base_module:documents`.
- Deleting an entity also deletes its documents (cascade).
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.
