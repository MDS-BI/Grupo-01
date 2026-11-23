# Contrato de Navegación y Accesos (mapa de uso y guía de uso)

**Rama**: `001-erp-base-module` · **Fecha**: 2026-11-16 · **Revisado**: 2026-11-23 (HU9/HU10 y restricción de roles FR-045) · **Relacionado con**: `spec.md` (HU8 a HU10, FR-020 a FR-022, FR-031 a FR-036, FR-037 a FR-046), `contracts/invoice-views.md`, `tasks.md` (Fases 12 y 13 a 15) y `002-payroll-access-control/contracts/access-and-session.md`

## Propósito

Documentar por dónde se navega el módulo y cómo se llega a cada función, y definir el contrato de la guía de uso (tutorial) de la HU8. Describe el MVP de la 001: un solo usuario por navegador, sin inicio de sesión ni perfiles, por lo que todas las vistas están disponibles. Este mapa refleja el menú real de la aplicación al 2026-11-16. La funcionalidad `002-payroll-access-control` reemplaza el ingreso opcional/invitado por acceso obligatorio con tres roles; el detalle se registra en «Revisión de `002`: acceso obligatorio por rol» y no cambia el mapa de vistas de negocio.

## Mapa de navegación

| Vista | Módulo (`data-module`) | Botón del menú | Sección | Qué se puede hacer | Usuario principal (spec) |
|---|---|---|---|---|---|
| Panel (home) | `dashboard` | `#nav-dashboard` | `#view-dashboard` | Ver los KPIs (total por cobrar, total por pagar y facturas vencidas), el Resumen financiero (Saldo neto, Deuda pendiente y Caja neta), usar los accesos rápidos y cargar los datos de demostración cuando el módulo está vacío | Gerencia, administrador y finanzas |
| Terceros | `entities` | `#nav-entities` | `#view-entities` | Crear, editar y eliminar terceros (cliente, proveedor o personal); fijar el límite de crédito de un cliente | Encargado de cobranzas, encargado de pagos, responsable de remuneraciones |
| Facturas de venta | `invoice-sale` | `#nav-invoice-sale` | `#view-invoice-sale` | Crear, editar y eliminar facturas de venta; emitirlas y registrar su pago; indicar la orden de venta | Encargado de cobranzas, contador |
| Facturas de compra | `invoice-purchase` | `#nav-invoice-purchase` | `#view-invoice-purchase` | Crear, editar y eliminar facturas de compra; elegir el centro de costo al emitir; indicar el período de liquidación si el tercero es personal; registrar el pago | Encargado de pagos, responsable de remuneraciones, contador |
| Movimientos financieros | `movements` | `#nav-movements` | `#view-movements` | Consultar los movimientos generados por emisiones y pagos (solo lectura) | Contador |
| Flujo de caja | `cashflow` | `#nav-cashflow` | `#view-cashflow` | Consultar las facturas Pagadas como ingresos y egresos, con su fecha de pago, tercero, documento, monto, totales y estado vacío; es de solo lectura | Administrador y finanzas |
| Seguimiento | `tracking` | `#nav-tracking` | `#view-tracking` | Ver la deuda por tercero y las facturas vencidas | Gerencia |
| Buscar | `search` | `#nav-search` | `#view-search` | Buscar registros | Todos |

Notas:

- Las facturas se abren solo desde "Facturas de venta" o "Facturas de compra". No existe una vista genérica de documentos (FR-020).
- "Buscar" existe en el menú desde el template, pero FR-020 y FR-022 listan seis vistas y no la incluyen. Queda pendiente que el grupo decida si se agrega a esos requisitos o se retira del menú. Mientras tanto, este mapa la lista porque existe en la aplicación.
- La guía de uso no aparece en esta tabla: no es una vista, es un panel del marco general (ver más abajo).

## Accesos rápidos del home

| Acceso | Id | Lleva a |
|---|---|---|
| Nueva factura de venta | `#qa-new-invoice-sale` | Facturas de venta |
| Nueva factura de compra | `#qa-new-invoice-purchase` | Facturas de compra |
| Gestión de terceros | `#qa-manage-entities` | Terceros |
| Abrir seguimiento | `#qa-tracking` | Seguimiento |
| Abrir flujo de caja | `#qa-cashflow` | Flujo de caja |
| Buscar registros | `#qa-search` | Buscar |
| Cargar datos de demostración | `#qa-load-demo` | Acción (no cambia de vista); solo visible con el módulo vacío |
| ¿Primera vez? Ver la guía | `#qa-guide` | Abre la guía de uso (HU8, pendiente de implementar) |

Nota (`002`): la carga de demostración pasa a ejecutarse desde la pantalla de acceso (`login-demo-load`), sin abrir vistas del módulo ni crear sesión; `#qa-load-demo` queda como acceso rápido heredado de la 001. Ver «Revisión de `002`: acceso obligatorio por rol».

## Reglas de acceso del MVP

> **Revisión de `002`.** Las reglas de ingreso opcional/invitado de esta sección quedan reemplazadas por el acceso obligatorio de `002-payroll-access-control`. Se conservan como descripción histórica de la 001; el contrato vigente está en «Revisión de `002`: acceso obligatorio por rol».

- El inicio de sesión por rol es **opcional**. Desde la pantalla de acceso, "Continuar sin iniciar sesión" entra como invitado (`erp.session` con rol `invitado`) y permite usar Panel, Terceros, Facturas de venta y compra, Movimientos, Seguimiento y Buscar. El invitado no ve Liquidaciones de sueldo, Accesos ni Avisos para el desarrollador.
- Si se inicia sesión como **trabajador**, solo se muestra "Mi liquidación" (`payroll-worker`), con su liquidación vigente en modo de solo lectura.
- Si se inicia sesión como **administrador**, se muestran las vistas de facturación más Liquidaciones de sueldo (`payroll-admin`), Accesos y Avisos para el desarrollador; puede editar las liquidaciones de todos los trabajadores.
- El invitado puede volver a la pantalla de acceso con "Iniciar sesión" (`#nav-login`); el usuario autenticado usa "Cerrar sesión" (`#nav-logout`).
- Los datos viven en `localStorage` del navegador (`erp.entities`, `erp.documents`, `erp.movements`). Cada navegador tiene sus propios datos y no deben usarse datos reales.
- Las restricciones de negocio se mantienen: los movimientos son de solo lectura, una factura Pagada no cambia de estado, el folio y las fechas de emisión son de solo lectura al editar, la venta solo admite clientes y la compra solo proveedores o personal.
- El botón "Nueva entidad"/"Nuevo tercero" (`#qa-new-entity`) se eliminó del panel porque duplicaba a "Abrir gestión de terceros" (`#qa-manage-entities`), que lleva a la misma vista.

## Revisión de `002`: acceso obligatorio por rol

La funcionalidad `002-payroll-access-control` reemplaza el ingreso opcional/invitado de la 001 por acceso obligatorio con credenciales válidas (RUT y contraseña). El almacenamiento de accesos y sesión se detalla en `002-payroll-access-control/contracts/access-and-session.md`; aquí se registra su efecto sobre la navegación y los accesos.

- No existe "Continuar sin iniciar sesión" ni el rol `invitado` (`erp.session` con rol `invitado`). Sin sesión válida no se muestra ninguna vista de negocio: los enlaces directos y las recargas vuelven a la pantalla de acceso (`view-login`) sin exponer datos.
- El acceso reconoce tres roles desde el registro de acceso: `administrador` (RRHH), `finanzas` y `trabajador`. El formulario solo pide RUT y contraseña, sin selector de rol; el rol se obtiene del registro tras validar las credenciales y se muestra en la cabecera (`session-role`). El administrador abre Panel; finanzas abre Panel; el trabajador abre Mi liquidación.
- El `administrador` conserva todas las funciones, incluidos administrar accesos (también los de rol `finanzas`) y los Avisos para el desarrollador. `finanzas` ve y edita toda la facturación (terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda), sin gestionar accesos ni ver avisos. El `trabajador` ve solo su propia liquidación vigente, en modo de solo lectura.
- Flujo de caja (`cashflow`) y Resumen financiero del Panel (`#summary-saldo`, `#summary-deuda` y `#summary-caja`) son exclusivos de `administrador` y `finanzas`. El rol `trabajador` no ve `#nav-cashflow`, `#qa-cashflow` ni los indicadores; un enlace directo o acceso rápido se resuelve a `payroll-worker` y no carga datos de estas vistas en el DOM (FR-045, SC-011).
- "Cargar demostración" (`login-demo-load`) se ejecuta desde la pantalla de acceso: precarga los datos ficticios sin abrir vistas del módulo ni crear sesión (`erp.session`). Sustituye al acceso rápido `#qa-load-demo` del home para cargar la demostración.
- `nav-logout` ("Cerrar sesión") es la acción de sesión: última opción del lateral para los tres roles, separada visualmente del menú. No existe "Iniciar sesión" (`#nav-login`) dentro del ERP. Al usarlo se elimina `erp.session` (`sessionStorage`), vuelve al acceso y se ocultan el lateral y la indicación del rol anterior; la sesión termina también al cerrar la pestaña.
- Toda vista de negocio del mapa exige sesión iniciada con credenciales válidas: Panel, Terceros, Facturas de venta, Facturas de compra, Movimientos, Seguimiento y Buscar, además de Liquidaciones de sueldo, Accesos y Avisos para el desarrollador según el rol. Las vistas no permitidas por rol se ocultan y se bloquean también si se intenta navegar directamente.
- La guía de uso (HU8) sigue siendo un panel del marco general sin efectos sobre los datos; sus pasos apuntan a las mismas vistas, que ahora se alcanzan solo con sesión activa y permisos del rol.

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
