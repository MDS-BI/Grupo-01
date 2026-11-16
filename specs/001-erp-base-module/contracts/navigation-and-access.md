# Contrato de Navegación y Accesos (mapa de uso y guía de uso)

**Rama**: `001-erp-base-module` · **Fecha**: 2026-11-16 · **Relacionado con**: `spec.md` (HU8, FR-020 a FR-022 y FR-031 a FR-036), `contracts/invoice-views.md` y `tasks.md` (Fase 12)

## Propósito

Documentar por dónde se navega el módulo y cómo se llega a cada función, y definir el contrato de la guía de uso (tutorial) de la HU8. Describe el MVP de la 001: un solo usuario por navegador, sin inicio de sesión ni perfiles, por lo que todas las vistas están disponibles. Este mapa refleja el menú real de la aplicación al 2026-11-16.

## Mapa de navegación

| Vista | Módulo (`data-module`) | Botón del menú | Sección | Qué se puede hacer | Usuario principal (spec) |
|---|---|---|---|---|---|
| Panel (home) | `dashboard` | `#nav-dashboard` | `#view-dashboard` | Ver los KPIs (total por cobrar, total por pagar y facturas vencidas), usar los accesos rápidos y cargar los datos de demostración cuando el módulo está vacío | Gerencia |
| Terceros | `entities` | `#nav-entities` | `#view-entities` | Crear, editar y eliminar terceros (cliente, proveedor o personal); fijar el límite de crédito de un cliente | Encargado de cobranzas, encargado de pagos, responsable de remuneraciones |
| Facturas de venta | `invoice-sale` | `#nav-invoice-sale` | `#view-invoice-sale` | Crear, editar y eliminar facturas de venta; emitirlas y registrar su pago; indicar la orden de venta | Encargado de cobranzas, contador |
| Facturas de compra | `invoice-purchase` | `#nav-invoice-purchase` | `#view-invoice-purchase` | Crear, editar y eliminar facturas de compra; elegir el centro de costo al emitir; indicar el período de liquidación si el tercero es personal; registrar el pago | Encargado de pagos, responsable de remuneraciones, contador |
| Movimientos financieros | `movements` | `#nav-movements` | `#view-movements` | Consultar los movimientos generados por emisiones y pagos (solo lectura) | Contador |
| Seguimiento | `tracking` | `#nav-tracking` | `#view-tracking` | Ver la deuda por tercero y las facturas vencidas | Gerencia |
| Buscar | `search` | `#nav-search` | `#view-search` | Buscar registros | Todos |

Notas:

- Las facturas se abren solo desde "Facturas de venta" o "Facturas de compra". No existe una vista genérica de documentos (FR-020).
- "Buscar" existe en el menú desde el template, pero FR-020 y FR-022 listan seis vistas y no la incluyen. Queda pendiente que el grupo decida si se agrega a esos requisitos o se retira del menú. Mientras tanto, este mapa la lista porque existe en la aplicación.
- La guía de uso no aparece en esta tabla: no es una vista, es un panel del marco general (ver más abajo).

## Accesos rápidos del home

| Acceso | Id | Lleva a |
|---|---|---|
| Nuevo tercero | `#qa-new-entity` | Terceros |
| Nueva factura de venta | `#qa-new-invoice-sale` | Facturas de venta |
| Nueva factura de compra | `#qa-new-invoice-purchase` | Facturas de compra |
| Gestión de terceros | `#qa-manage-entities` | Terceros |
| Abrir seguimiento | `#qa-tracking` | Seguimiento |
| Buscar registros | `#qa-search` | Buscar |
| Cargar datos de demostración | `#qa-load-demo` | Acción (no cambia de vista); solo visible con el módulo vacío |
| ¿Primera vez? Ver la guía | `#qa-guide` | Abre la guía de uso (HU8, pendiente de implementar) |

## Reglas de acceso del MVP

- No hay inicio de sesión ni perfiles: cualquier persona que abra la aplicación en ese navegador ve todas las vistas y puede usar todas las acciones.
- Los datos viven en `localStorage` del navegador (`erp.entities`, `erp.documents`, `erp.movements`). Cada navegador tiene sus propios datos y no deben usarse datos reales.
- Las restricciones que sí aplican son de negocio, no de perfil: los movimientos son de solo lectura, una factura Pagada no cambia de estado, el folio y las fechas de emisión son de solo lectura al editar, la venta solo admite clientes y la compra solo proveedores o personal.
- Futuro: `specs/002-payroll-access-control` propone inicio de sesión por rol (trabajador y administrador). Si el grupo lo integra, este mapa debe sumar una columna "Roles con acceso" y la HU8 debe revisarse. Hoy no aplica.

## Contrato de la guía de uso (HU8)

**Punto de entrada.** Botón "Guía de uso" (`#open-guide`) en el marco general, visible en todas las vistas, y acceso "¿Primera vez? Ver la guía" (`#qa-guide`) en el home. No es una entrada del menú (FR-020 no cambia).

**Contenedor.** `#guide-panel`: panel no modal (`role="dialog"`, `aria-modal="false"`, título asociado con `aria-labelledby`). Como no es modal, la persona puede usar el menú y las vistas mientras la guía está abierta.

**Pasos.** La guía tiene 8 pasos, definidos en `GUIDE_STEPS` (`src/components/tutorial.js`):

| Paso | Título | Lleva a | Qué explica |
|---|---|---|---|
| 1 | Panel y menú | `dashboard` | El menú, los KPIs, los accesos rápidos y la búsqueda |
| 2 | Terceros | `entities` | Crear un cliente, proveedor o personal; el RUT se valida; el límite de crédito es solo de clientes |
| 3 | Facturas de venta | `invoice-sale` | La factura nace en Borrador, solo para clientes, con orden de venta opcional |
| 4 | Facturas de compra | `invoice-purchase` | Solo para proveedores o personal; el centro de costo se exige al emitir; el período `YYYY-MM` se exige si el tercero es personal (liquidación de sueldo) |
| 5 | Emitir y pagar | `invoice-sale` | Borrador → Emitida → Pagada; el monto pagado debe ser igual al total |
| 6 | Movimientos financieros | `movements` | Un movimiento por emisión y por pago; son de solo lectura |
| 7 | Seguimiento | `tracking` | Deuda por tercero y facturas vencidas (vencimiento anterior a hoy) |
| 8 | Datos de demostración y cuidados | `dashboard` | Cargar la demostración (solo con el módulo vacío); los datos son ficticios; `localStorage` no es seguro |

**Nota sobre el paso 5.** El aviso por límite de crédito al emitir una venta (FR-029) todavía no está implementado (T026 sigue pendiente). La guía no lo menciona hasta que exista, para no describir algo que la aplicación no hace; cuando se implemente, se suma a este paso.

**Controles.** "Anterior" (no aparece en el primer paso), "Siguiente" (en el último paso, "Finalizar"), "Ir a" la vista del paso y "Cerrar". Indicador "Paso n de 8". La tecla Esc cierra la guía y el foco vuelve a `#open-guide`.

**Textos.** Los términos del módulo (Tercero, Factura) salen de `config.labels` y los nombres de las vistas de `navLabel` en `src/components/shell.js`. No se repiten escritos a mano.

**Sin efectos sobre los datos.** La guía no llama a `src/storage.js`, no crea claves `erp.*` y no recuerda si ya fue vista.

**Interfaz de `src/components/tutorial.js`.**

- `GUIDE_STEPS`: lista de pasos (`id`, `module`, título y texto).
- `createTutorial({ config, root, openButton, onNavigate })`: devuelve `open(index = 0)`, `close()`, `next()`, `prev()`, `goTo(index)` e `isOpen()`.
- Requiere exportar `NAV_MODULES` y `navLabel` desde `src/components/shell.js`, que hoy son privados (T084).

## Pruebas asociadas

- `tests/integration/tutorial.test.js` (T079): apertura, pasos, "Ir a", cierre, foco y datos intactos.
- `tests/unit/tutorial-steps.test.js` (T080): cada paso apunta a un módulo del menú y el mapa coincide con `NAV_MODULES`.
