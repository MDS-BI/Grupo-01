# Módulo de Contabilidad y Finanzas — Grupo 1

Modelación de Sistemas 2026-2 · Departamento de Ingeniería Industrial · Universidad de Concepción

Módulo de facturación y pagos (por cobrar y por pagar) de un sistema ERP, construido sobre el template `Speckit_Template` con Spec Driven Development (Plan → Spec → Tasks → Implement). Es una aplicación solo frontend: los datos se guardan en el `localStorage` del navegador y no hay backend ni base de datos remota.

## Equipo

| Integrante | Rol | Historia de usuario |
|---|---|---|
| Rivera Benavente, Jaime Alberto | Por definir | Por asignar |
| Zavala Campos, Elías Ignacio | Por definir | Por asignar |
| Vásquez Mera, Carolina Andrea | Por definir | Por asignar |
| Espinoza Muñoz, Matías Ignacio | Por definir | Por asignar |
| Ulloa Troncoso, Javier Ignacio | Por definir | Por asignar |
| Aguayo Puentes, Mauro Alejandro | Por definir | Por asignar |

Líder del grupo: por definir.

## Visión de producto

**Problema.** Muchas pequeñas y medianas empresas llevan sus facturas en planillas sueltas. Eso les hace perder de vista cuánto les deben, cuánto deben y qué está vencido, y su flujo de caja se resiente.

**Usuarios.** Encargado de cobranzas, encargado de pagos a proveedores, contador y gerencia.

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

## No confirmado (consultar con ayudante o profesor)

1. Usar un solo tipo de Entidad (Tercero, con `tipoTercero`) y un solo tipo de Documento (Factura, con `tipoFactura`) con campos adicionales, en vez de registros separados.
2. Modelar los pagos como campos de la factura.
3. Usar `startDate` y `endDate` del template como fecha de emisión y de vencimiento.
4. Que `src/` e `index.html` se generen con Speckit: no están en este repositorio ni en el template.
5. Si el MER debe mostrar solo lo que implementa el MVP o también las etapas futuras.
6. Si basta con el README y los specs, o se espera un informe aparte.
7. Cómo se coordina con los grupos de CRM, Ventas y Compras el identificador que se comparte para relacionar terceros y facturas.

## Estado del proyecto

- Las especificaciones están en `specs/001-erp-base-module/`.
- `spec.md` y `data-model.md` están rehechos con este alcance, y en `plan.md` se editó solo el resumen, como pide el curso. `mer.png` es el diagrama entidad-relación. `tasks.md` tiene las tareas por historia de usuario, armadas siguiendo las reglas de `speckit.tasks`, y se validará con `speckit.clarify` y `speckit.analyze` cuando se puedan ejecutar. `quickstart.md` y `research.md` son los del template.
- Al 29-10-2026 el repositorio no incluye las carpetas `src/` ni `index.html`, por lo que las instrucciones de *Setup* del template todavía no se pueden ejecutar. Eliminar esta línea cuando estén.

## Registro de decisiones

| Fecha | Decisión | Quién |
|---|---|---|
| 28-10-2026 | Mover los specs a `specs/001-erp-base-module/`, según el feedback del profesor | Jaime Rivera |
| 29-10-2026 | Alcance del MVP: facturación y pagos, por cobrar y por pagar (pendiente de validar con el grupo) | Jaime Rivera |
| 29-10-2026 | Modelo de datos: un solo Tercero y una sola Factura, con los campos `tipoTercero` y `tipoFactura`; el pago va como campos de la factura (pendiente de confirmar con el ayudante) | Jaime Rivera |
| 29-10-2026 | `plan.md`: se edita solo el resumen y se mantienen las partes técnicas del template, como indican las clases | Jaime Rivera |
| 29-10-2026 | `tasks.md`: tareas por historia de usuario, armadas siguiendo las reglas de `speckit.tasks` porque OpenCode aún no está configurado | Jaime Rivera |

## Uso de IA (anexo)

Según la política del curso, cada consulta a un modelo de IA generativa se registra con modelo, fecha y secuencia de prompts.

| Fecha | Integrante | Modelo (versión) | Para qué | Prompts |
|---|---|---|---|---|
| Completar | Jaime Rivera | Gemini (Google), completar versión | Primer avance: versión anterior de los specs | Completar |
| 28-10-2026 y 29-10-2026 | Jaime Rivera | Claude (Anthropic); modelo configurado en la sesión: claude-sonnet-5-5 (el modelo que respondió puede variar, verificar) | Organización del repositorio, definición del alcance, README, spec, data-model, MER, plan y tasks | Completar |

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
