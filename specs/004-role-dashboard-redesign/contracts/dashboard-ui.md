# Contract: Dashboard UI por rol

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Aplica a**: `index.html`, `src/components/dashboard.js`, `src/components/payroll-worker.js`, `src/app.js`, `src/styles.css`.

## Principio

El contenido del Panel es una función del rol vigente y de la matriz de permisos de la spec 003. La existencia de datos financieros en el navegador no autoriza su visualización.

## Estructura contractual del Panel

La vista activa es `#view-dashboard` para administrador y finanzas. Debe contener, en este orden visual:

1. Encabezado con saludo y mes.
2. Banner de guía descartable.
3. Contenido exclusivo por rol.
4. Accesos rápidos al final, en una sola fila.

IDs contractuales:

| ID | Contenido | Visibilidad |
|---|---|---|
| `#dashboard-title` | Título «Panel» | Administrador, finanzas |
| `#dashboard-greeting` | Saludo derivado del perfil | Administrador, finanzas |
| `#dashboard-month` | Mes legible actual | Administrador, finanzas |
| `#guide-banner-dashboard` | Banner «¿Primera vez?» | Administrador, finanzas |
| `#guide-open-dashboard` | Abre tutorial | Administrador, finanzas |
| `#guide-dismiss-dashboard` | Descarta banner | Administrador, finanzas |
| `#admin-payroll-summary` | Tres métricas de nómina | Solo administrador |
| `#finance-indicators-section` | Una fila de cuatro indicadores | Solo finanzas |
| `#dashboard-trend-section` | Gráfico SVG | Solo finanzas |
| `#dashboard-alerts-section` | Alertas al lado del gráfico | Solo finanzas |
| `#dashboard-movements-section` | Últimos cinco movimientos | Solo finanzas |
| `.quick-actions` | Contenedor de accesos rápidos | Administrador, finanzas |

El ID heredado `#qa-guide` deja de ser el banner. Si permanece en el DOM por compatibilidad, debe quedar oculto y sin usos.

## Matriz de visibilidad

| Contenido | Administrador | Finanzas | Trabajador |
|---|---:|---:|---:|
| `#view-dashboard` | Sí | Sí | No |
| `#view-payroll-worker` | No | No | Sí |
| `#admin-payroll-summary` | Sí | No | No |
| `#finance-indicators-section` | No | Sí | No |
| `#dashboard-trend-section` | No | Sí | No |
| `#dashboard-alerts-section` | No | Sí | No |
| `#dashboard-movements-section` | No | Sí | No |
| `#summary-saldo`, `#summary-deuda`, `#summary-caja` | No | No | No |
| `#kpi-por-cobrar`, `#kpi-por-pagar`, `#kpi-vencidas` | No | Se sustituyen por tarjetas nuevas | No |
| Etiqueta «Deuda pendiente» | No | No | No |

La ocultación se aplica en la capa del Panel, no únicamente en `clearRestrictedViews()`.

## Panel del administrador

- `#dashboard-greeting` usa `Recursos Humanos` como nombre visible; la clave interna `administrador` no cambia.
- `#dashboard-month` usa texto legible, p. ej. `noviembre 2026`.
- `#admin-payroll-summary` contiene exactamente tres métricas:
  - Trabajadores con acceso.
  - Liquidaciones del mes actual.
  - Liquidaciones en borrador.
- Cada métrica sin datos usa texto de estado vacío; no muestra `0` como dato válido.
- Accesos rápidos visibles: `qa-create-payroll` y `qa-new-payroll`, con etiquetas definidas en `config.labels`.
- No se calculan ni se escriben resúmenes financieros en el DOM del administrador.

## Panel de finanzas

- `#finance-indicators-section` fusiona los antiguos bloques «Resumen financiero» e «Indicadores».
- Orden y etiquetas exactas de las cuatro tarjetas:

| Orden | Etiqueta | Valor | Tooltip | Destino |
|---|---|---|---|---|
| 1 | `Caja neta` | CLP | Fórmula de flujo de caja | `cashflow` |
| 2 | `Por cobrar` | CLP | Fórmula de facturas de venta emitidas | `invoice-sale` |
| 3 | `Por pagar` | CLP | Fórmula de facturas de compra emitidas | `invoice-purchase` |
| 4 | `Facturas vencidas` | Entero | Fórmula de vencimiento | `tracking` |

- `Terceros` y `Facturas` aparecen solo como texto secundario dentro de `#finance-indicators-section`.
- Estado visual:
  - Caja negativa: número en `#A84F00`, borde y tinte claro en `#FB8500`, sin fondo `#FFB703`.
  - Vencidas > 0: texto en `#A84F00`, borde y tinte claro en `#FB8500`, sin fondo `#FFB703`.
  - Cero y valores normales: neutro.
  - Sin documento anterior al mes actual: `sin dato anterior`, nunca `0 %`.
- Variación:
  - Caja: ▲ favorable en `#126782` / ▼ desfavorable en `#A84F00`.
  - Por pagar y vencidas: ▲ desfavorable en `#A84F00` / ▼ favorable en `#126782`.
  - Por cobrar: neutro en ambos sentidos.
- `previousValue` se reconstruye al último día del mes anterior con los datos existentes, sin snapshot ni cambio de modelo:
  - `cash`: ingresos menos egresos de documentos con `fechaPagoEfectiva <= cutoff`.
  - `receivable`: suma de facturas de venta emitidas hasta `cutoff` y no pagadas a esa fecha.
  - `payable`: suma de facturas de compra emitidas hasta `cutoff` y no pagadas a esa fecha.
  - `overdue`: cantidad de facturas emitidas y no pagadas a `cutoff` con vencimiento anterior a `cutoff`.
- Reglas de texto de variación:
  - Si no existe ningún documento con fecha anterior al mes actual, `previousValue` es `null` y se muestra `sin dato anterior`.
  - Si `previousValue` es `0` y el valor actual no es `0`, no se calcula porcentaje: se muestra solo la flecha con el texto `nuevo`.
  - La flecha de `nuevo` es ▲ cuando el valor actual es positivo y ▼ cuando es negativo; el color conserva la semántica del indicador.
- Fórmulas solo en tooltip accesible señalado con un ícono CSS de 16 px, sin usar el carácter «ⓘ»: borde `1px solid #8ECAE6`, fondo tinte claro `color-mix(in srgb, #8ECAE6 18%, #ffffff)` y letra «i» en IBM Plex Sans peso 600 y color `#023047`, centrada y alineada verticalmente con el título; en hover o foco el fondo pasa a `#8ECAE6`. El ícono conserva `role="img"`, `aria-label`, `tabindex="0"` y la fórmula; la etiqueta visible contiene únicamente el nombre del indicador.
- Las cuatro tarjetas deben ser visibles sin scroll en 1366x768.

### Accesos rápidos de finanzas

Exactamente cuatro, en una sola fila al final del Panel:

| ID | Etiqueta |
|---|---|
| `qa-new-invoice-sale` | `Nueva factura de venta` |
| `qa-new-invoice-purchase` | `Nueva factura de compra` |
| `qa-cashflow` | `Flujo de caja` |
| `qa-search` | `Buscar` |

- Botones con borde, etiqueta en una sola línea y sin truncamiento.
- `qa-manage-entities`, `qa-tracking`, `qa-movements` y `qa-new-payroll` no son accesos rápidos de finanzas; permanecen en el menú correspondiente cuando el rol lo permite.

### Tendencia, alertas y movimientos

- `#dashboard-trend-section` contiene el SVG contractual definido en `contracts/trend-chart.md`.
- `#dashboard-alerts-section` ocupa la misma fila visual que el gráfico cuando el ancho lo permite.
- Alertas:
  - Caja negativa: texto `#A84F00` con borde `#FB8500`, enlace a `cashflow`.
  - Facturas vencidas > 0: texto `#A84F00` con borde o tinte claro `#FB8500`, enlace a `tracking`.
  - Ninguna alerta usa fondo `#FFB703`.
  - Caja `0` o sin vencidas: no genera alerta.
- `#dashboard-movements-section` muestra máximo cinco movimientos y enlace `Ver todos`. Sin movimientos: estado vacío + enlace.

## Banner de guía

| Elemento | Administrador/finanzas | Trabajador |
|---|---|---|
| Contenedor | `#guide-banner-dashboard` | `#guide-banner-worker` |
| Abre guía | `#guide-open-dashboard` | `#guide-open-worker` |
| Descarta | `#guide-dismiss-dashboard` | `#guide-dismiss-worker` |
| Ubicación | Arriba de `#view-dashboard` | Arriba de `#view-payroll-worker` |
| Persistencia | `erp.guideDismissed.administrador` / `erp.guideDismissed.finanzas` | `erp.guideDismissed.trabajador` |

- El banner aparece para toda sesión iniciada.
- Al descartar: se oculta, se escribe la clave `sessionStorage`, no cambia la navegación ni `erp.session`.
- Al recargar dentro de la misma sesión permanece oculto.
- El descarte de un rol no afecta a los otros.

## Vista del trabajador

- `#view-payroll-worker` muestra el banner de guía y el encabezado con `#payroll-worker-name` legible.
- `#payroll-worker-period` usa texto legible, nunca `YYYY-MM`.
- `#payroll-worker-paid-at` y la columna «Fecha de pago» de `#payroll-worker-history` usan `DD-MM-AAAA`.
- `#payroll-worker-amount` es el elemento de mayor tamaño tipográfico de la vista, con `$` y separador de miles.
- `.payroll-breakdown` se muestra solo si sueldo base, descuentos o bonos tiene valor; si los tres están vacíos/cero, se oculta.
- `#payroll-worker-history` muestra montos con `$` mediante `formatCurrencyCLP` y fechas en `DD-MM-AAAA`.
- No se incluyen indicadores financieros, gráfico ni alertas financieras.

## Formatos visibles (clarificación 2026-11-26)

- Toda fecha visible como texto usa `DD-MM-AAAA`, incluidas las listas de Facturas de venta y compra, Movimientos financieros, Flujo de caja, Mi liquidación y Gestionar liquidaciones de sueldo; los campos de entrada y el almacenamiento conservan `AAAA-MM-DD`.
- Todos los montos visibles usan `formatCurrencyCLP`, p. ej. `$250.000`, nunca `250000 CLP`; las celdas `.invoice-total` y las columnas numéricas quedan alineadas a la derecha.
- Todo RUT visible usa puntos y guion, p. ej. `12.345.678-5`, en Control de accesos y en los listados de liquidaciones, sin cambiar el valor normalizado guardado.
- Ninguna lista visible muestra `doc_`, `ent_`, `set_`, `salesOrderId` ni nombres internos de campos.
- Movimientos financieros usa `Venta emitida`, `Pago` y `Compra emitida`; las referencias legibles son `Venta A #1`, `Compra B #2` y `Orden de venta: PED-036`.
- La tabla de liquidaciones incluye la leyenda exacta `Borrador (RRHH la prepara)`, `Emitida (aprobada por RRHH)` y `Pagada (finanzas registró el pago)`.
- A 390 px, `body`/`#app` no desbordan horizontalmente: `.topbar-left` y `.topbar-right` admiten `min-width: 0`, `.brand-logo` respeta `max-width: 100%` y `.invoice-table-scroll` conserva `overflow-x: auto`.

## Estilos y accesibilidad

- Paleta v1.2.0: `#023047` como acento y texto sobre fondos `#FFB703`/`#8ECAE6`; `#219EBC` para gráficos y estados favorables; `#126782` para texto favorable; `#A84F00` para texto crítico; `#FB8500` para bordes críticos.
- Fondo gris muy claro, tarjetas blancas, IBM Plex Sans incluida localmente.
- Contraste verificado: `#023047`/`#ffffff` `13.85:1`, `#023047`/`#8ECAE6` `7.74:1`, `#023047`/`#FFB703` `7.93:1`, `#126782`/`#ffffff` `6.39:1`, `#A84F00`/`#ffffff` `5.55:1`; `#219EBC`/`#ffffff` `3.14:1` y `#FB8500`/`#ffffff` `2.48:1` solo en gráficos o bordes.
- Montos y columnas numéricas usan `tabular-nums`; columnas de montos alineadas a la derecha.
- Cambios de estado no dependen solo del color: incluyen ▲/▼, texto `sin dato anterior` o etiqueta de alerta.
- Los botones y tarjetas clicables conservan foco visible y nombre accesible.

## Verificación

- Administrador: saludo `Recursos Humanos`, exactamente dos acciones de liquidación, tres métricas de nómina, cero nodos financieros visibles.
- Finanzas: cuatro indicadores, cuatro accesos rápidos, gráfico, alertas y cinco movimientos como máximo.
- Trabajador: sin Panel, con vista de liquidación legible y banner propio.
- Los tres roles: nombre del sistema correcto, tipografía local, colores semánticos y saludo/mes legibles donde aplica.
