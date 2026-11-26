# Contrato de Navegación y Accesos (mapa de uso y guía de uso)

**Rama**: `001-erp-base-module` · **Fecha**: 2026-11-16 · **Revisado**: 2026-11-23 (acceso obligatorio, menú ☰, vistas nuevas y HU8); 2026-11-26 (cierre de pendientes de la spec 001, según 003) · **Relacionado con**: `spec.md` (HU8 a HU10, FR-020 a FR-022, FR-031 a FR-036, FR-037 a FR-046), `contracts/invoice-views.md`, `tasks.md` (Fases 12 a 15) y `002-payroll-access-control/contracts/access-and-session.md`

## Propósito

Documentar por dónde se navega el módulo y cómo se llega a cada función, y definir el contrato de la guía de uso (tutorial) de la HU8. El contrato refleja el estado actual de la app: acceso obligatorio con tres roles (`administrador`, `finanzas` y `trabajador`), datos de demostración cargados desde la pantalla de acceso, menú desplegable ☰ «Utilidades & Sesión» como mecanismo de utilidades y sesión, y las vistas incorporadas por las HU9, HU10 y la spec 002.

## Mapa de navegación

| Vista | Módulo (`data-module`) | Acceso visible | Sección | Qué se puede hacer | Roles con acceso |
|---|---|---|---|---|---|
| Panel (home) | `dashboard` | Vista inicial tras ingresar; acceso "¿Primera vez? Ver la guía" (los tres roles) | `#view-dashboard` | Ver los KPIs y el Resumen financiero (Saldo neto, Deuda pendiente y Caja neta), y usar los accesos rápidos; en el administrador queda limitado a las dos pestañas de liquidaciones | Administrador, finanzas |
| Terceros | `entities` | Acceso rápido `#qa-manage-entities`; paso "Terceros" de la guía | `#view-entities` | Crear, editar y eliminar terceros (cliente, proveedor o personal); fijar el límite de crédito de un cliente | Finanzas |
| Facturas de venta | `invoice-sale` | Acceso rápido `#qa-new-invoice-sale`; pasos "Facturas de venta" y "Emitir y pagar" de la guía | `#view-invoice-sale` | Crear, editar y eliminar facturas de venta; emitirlas y registrar su pago; indicar la orden de venta | Finanzas |
| Facturas de compra | `invoice-purchase` | Acceso rápido `#qa-new-invoice-purchase`; paso "Facturas de compra" de la guía | `#view-invoice-purchase` | Crear, editar y eliminar facturas de compra; elegir el centro de costo al emitir; indicar el período de liquidación si el tercero es personal; registrar el pago | Finanzas |
| Liquidaciones de sueldo | `payroll-admin` | Paso "Liquidaciones de sueldo" de la guía | `#view-payroll-admin` | Registrar y editar liquidaciones de sueldo de todos los trabajadores, usando la factura de compra como comprobante | Administrador (edición), finanzas (solo lectura) |
| Crear liquidación de sueldo | `payroll-create` | Acceso rápido del Panel del administrador; paso "Crear liquidación de sueldo" de la guía | `#view-payroll-create` | Crear una liquidación con formulario propio y dar de alta al trabajador | Administrador |
| Movimientos financieros | `movements` | Paso "Movimientos financieros" de la guía | `#view-movements` | Consultar los movimientos generados por emisiones y pagos (solo lectura) | Finanzas |
| Flujo de caja | `cashflow` | Acceso rápido `#qa-cashflow`; paso "Flujo de caja" de la guía | `#view-cashflow` | Consultar las facturas Pagadas como ingresos y egresos, con su fecha de pago, tercero, documento, monto, totales y estado vacío; es de solo lectura | Finanzas |
| Seguimiento | `tracking` | Acceso rápido `#qa-tracking`; paso "Seguimiento" de la guía | `#view-tracking` | Ver la deuda por tercero y las facturas vencidas | Finanzas |
| Buscar | `search` | Acceso rápido `#qa-search` | `#view-search` | Buscar registros | Finanzas |
| Accesos | `access` | Opción "Control de accesos" (`#menu-access`) del menú ☰ | `#view-access` | Crear y editar accesos, incluidos los del rol `finanzas` | Administrador |
| Avisos al desarrollador | `dev-notifications` | Opción "Avisos al desarrollador" (`#menu-dev-notifications`) del menú ☰ | `#view-dev-notifications` | Consultar los avisos para el desarrollador | Ningún rol (superseded por 003) |
| Mi liquidación | `payroll-worker` | Vista inicial del trabajador; paso "Mi liquidación" de la guía | `#view-payroll-worker` | Ver su última liquidación con el desglose (sueldo base, descuentos y bonos) y el historial de sus propios pagos, en solo lectura, según la HU3 de la spec 002 | Trabajador |

Notas:

- Las facturas se abren solo desde "Facturas de venta" o "Facturas de compra". No existe una vista genérica de documentos (FR-020).
- "Buscar" existe desde el template, se mantiene y ahora está incluida en FR-020 y FR-022 como vista de finanzas (decidido 2026-11-26). **Nota (superseded por 003): desde la spec 003 el administrador ya no la ve.**
- La guía de uso no aparece como vista: es un panel del marco general (ver más abajo).
- "Cerrar sesión" (`#menu-logout`) es la última opción del menú desplegable ☰ «Utilidades & Sesión», separada visualmente de las utilidades.

## Accesos rápidos del Panel

| Acceso | Id | Lleva a | Roles con acceso |
|---|---|---|---|
| Nueva factura de venta | `#qa-new-invoice-sale` | Facturas de venta | Finanzas |
| Nueva factura de compra | `#qa-new-invoice-purchase` | Facturas de compra | Finanzas |
| Gestión de terceros | `#qa-manage-entities` | Terceros | Finanzas |
| Abrir seguimiento | `#qa-tracking` | Seguimiento | Finanzas |
| Abrir flujo de caja | `#qa-cashflow` | Flujo de caja | Finanzas |
| Buscar registros | `#qa-search` | Buscar | Finanzas |
| Crear liquidación de sueldo | — | Crear liquidación de sueldo | Administrador |
| Gestionar liquidaciones de sueldo | — | Gestionar liquidaciones de sueldo | Administrador |
| ¿Primera vez? Ver la guía | `#qa-guide` | Guía de uso (HU8) | Los tres roles (superseded por 003) |

La carga de demostración se ejecuta solo desde la pantalla de acceso (`login-demo-load`): precarga datos ficticios sin abrir vistas del módulo ni crear sesión (`erp.session`). No existe la carga de demostración desde el Panel.

## Acceso obligatorio por rol

- No existe "Continuar sin iniciar sesión" ni el rol `invitado`. Sin sesión válida no se muestra ninguna vista de negocio: los enlaces directos y las recargas vuelven a la pantalla de acceso (`view-login`) sin exponer datos.
- El acceso reconoce tres roles desde el registro de acceso: `administrador` (RRHH), `finanzas` y `trabajador`. El formulario solo pide RUT y contraseña, sin selector de rol; el rol se obtiene del registro tras validar las credenciales y se muestra en la cabecera (`session-role`). El administrador y finanzas abren Panel; el trabajador abre Mi liquidación.
- El `administrador` conserva todas las funciones, incluidos administrar accesos (también los de rol `finanzas`) y los Avisos al desarrollador. `finanzas` ve y edita toda la facturación (terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda), sin gestionar accesos ni ver avisos. El `trabajador` ve solo su propia liquidación vigente, en modo de solo lectura. **Nota (superseded por 003): el administrador (RRHH) ve solo Panel, Crear liquidación de sueldo, Gestionar liquidaciones de sueldo y Control de accesos; no ve Avisos al desarrollador ni las vistas financieras. Ningún rol ve los avisos al desarrollador.**
- Flujo de caja (`cashflow`) y Resumen financiero del Panel (`#summary-saldo`, `#summary-deuda` y `#summary-caja`) son exclusivos de `administrador` y `finanzas`. El rol `trabajador` no ve `#nav-cashflow`, `#qa-cashflow` ni los indicadores; un enlace directo o acceso rápido se resuelve a `payroll-worker` y no carga datos de estas vistas en el DOM (FR-045, SC-011). **Nota (superseded por 003): son exclusivos de `finanzas`; el administrador ya no los ve.**
- "Cargar demostración" (`login-demo-load`) se ejecuta desde la pantalla de acceso y no inicia sesión.
- `nav-logout` ("Cerrar sesión") se presenta como opción del menú desplegable ☰ para los tres roles. Al usarlo se elimina `erp.session` (`sessionStorage`), vuelve al acceso y se ocultan el menú y la indicación del rol anterior; la sesión termina también al cerrar la pestaña.
- Toda vista de negocio del mapa exige sesión iniciada con credenciales válidas. Las vistas no permitidas por rol se ocultan y se bloquean también si se intenta navegar directamente.
- La guía de uso (HU8) es un panel del marco general sin efectos sobre los datos; solo existe con sesión iniciada y sus pasos se filtran por los permisos del rol.

## Contrato de la guía de uso (HU8)

**Punto de entrada.** Con sesión iniciada, la opción "Guía de uso" del menú desplegable ☰ «Utilidades & Sesión» abre la guía para `administrador`, `finanzas` y `trabajador`. El acceso "¿Primera vez? Ver la guía" (`#qa-guide`) del Panel hace lo mismo solo para `administrador` y `finanzas`. La guía no está disponible en la pantalla de acceso y no es una entrada del menú de vistas (FR-020 no cambia). **Nota (superseded por 003): "¿Primera vez? Ver la guía" aparece para los tres roles.**

**Contenedor.** `#guide-panel`: panel no modal (`role="dialog"`, `aria-modal="false"`, título asociado con `aria-labelledby`). Como no es modal, la persona puede usar el menú y las vistas mientras la guía está abierta.

**Pasos.** La guía usa pasos con ID estable, definidos en `GUIDE_STEPS` (`src/components/tutorial.js`). El orden depende del rol; el indicador muestra "Paso n de m", donde `m` es el total de pasos del recorrido del rol. Todos los recorridos terminan en "Cuidados".

| ID del paso | Título | Lleva a | Qué explica | Orden administrador/finanzas | Orden trabajador |
|---|---|---|---|---:|---:|
| `panel` | Panel | `dashboard` | Los KPIs, el Resumen financiero, el menú ☰ y los accesos rápidos | 1 | — |
| `entities` | Terceros | `entities` | Crear un cliente, proveedor o personal; el RUT se valida; el límite de crédito es solo de clientes | 2 | — |
| `invoice-sale` | Facturas de venta | `invoice-sale` | La factura nace en Borrador, solo para clientes, con orden de venta opcional | 3 | — |
| `invoice-purchase` | Facturas de compra | `invoice-purchase` | Solo para proveedores o personal; el centro de costo se exige al emitir; el período `YYYY-MM` se exige si el tercero es personal (liquidación de sueldo) | 4 | — |
| `issue-pay` | Emitir y pagar | `invoice-sale` | Borrador → Emitida → Pagada; el monto pagado debe ser igual al total | 5 | — |
| `payroll-admin` | Liquidaciones de sueldo | `payroll-admin` | La factura de compra dirigida a personal es el comprobante de la liquidación; no se calculan haberes ni descuentos | 6 | — |
| `movements` | Movimientos financieros | `movements` | Un movimiento por emisión y por pago; son de solo lectura | 7 | — |
| `cashflow` | Flujo de caja | `cashflow` | Ingresos y egresos de facturas Pagadas, con totales y estado vacío; solo lectura | 8 | — |
| `tracking` | Seguimiento | `tracking` | Deuda por tercero y facturas vencidas (vencimiento anterior a hoy) | 9 | — |
| `menu` | Menú ☰ «Utilidades & Sesión» | Menú ☰ | Cerrar sesión está disponible para los tres roles; "Control de accesos" y "Avisos al desarrollador" se mencionan solo al administrador | 10 | — |
| `payroll-worker` | Mi liquidación | `payroll-worker` | El trabajador ve su última liquidación con el desglose (sueldo base, descuentos y bonos) y el historial de sus propios pagos, en solo lectura, según la HU3 de la spec 002 | — | 1 |
| `cuidados` | Cuidados | — | Los datos son ficticios; la contraseña inicial son los primeros 4 dígitos del RUT; el control de acceso es solo de interfaz | 11 | 2 |

**Nota (superseded por 003): la tabla histórica agrupa a administrador y finanzas, pero el recorrido real tiene 11 pasos para finanzas, 6 para el administrador (`panel`, `payroll-create`, `payroll-admin`, `access`, `menu` y `cuidados`) y 2 para el trabajador (`payroll-worker` y `cuidados`). Ningún rol ve los avisos al desarrollador.**

**Nota sobre "Emitir y pagar".** El aviso por límite de crédito al emitir una venta (FR-029) todavía no está implementado (T026 sigue pendiente). La guía no lo menciona hasta que exista, para no describir algo que la aplicación no hace; cuando se implemente, se suma a este paso.

**Controles.** "Anterior" (no aparece en el primer paso), "Siguiente" (en el último paso, "Finalizar"), "Ir a" la vista del paso cuando el rol puede abrirla y "Cerrar". La tecla Esc cierra la guía y el foco vuelve al control que la abrió: la opción del menú ☰ o el acceso del Panel.

**Textos.** Los términos del módulo (Tercero, Factura) salen de `config.labels` y los nombres de las vistas de `navLabel` en `src/components/shell.js`. No se repiten escritos a mano.

**Sin efectos sobre los datos.** La guía no llama a `src/storage.js`, no crea claves `erp.*`, no inicia ni cierra sesión, no carga la demostración y no recuerda si ya fue vista.

**Interfaz de `src/components/tutorial.js`.**

- `GUIDE_STEPS`: catálogo de pasos con ID estable, título, texto y módulo asociado.
- La selección de pasos se obtiene de la matriz de accesos del rol, preservando el orden descrito arriba.
- `createTutorial({ config, root, openButton, onNavigate })`: devuelve `open(index = 0)`, `close()`, `next()`, `prev()`, `goTo(index)` e `isOpen()`.
- Requiere exportar `NAV_MODULES` y `navLabel` desde `src/components/shell.js` (T084).

## Pruebas asociadas

- `tests/integration/tutorial.test.js` (T079): apertura desde el menú ☰ y desde el Panel, pasos por rol, "Ir a", cierre, foco y datos intactos.
- `tests/unit/tutorial-steps.test.js` (T080): cada paso apunta a un módulo que el rol puede abrir y el mapa coincide con la matriz de accesos.
