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

- `#dashboard-greeting` usa `Administrador` como nombre visible.
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
  - Caja negativa: número y borde en rojo.
  - Vencidas > 0: tarjeta en ámbar.
  - Cero y valores normales: neutro.
  - Sin documento anterior al mes actual: `sin dato anterior`, nunca `0 %`.
- Variación:
  - Caja: ▲ verde / ▼ rojo.
  - Por pagar y vencidas: ▲ rojo / ▼ verde.
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
- Fórmulas solo en tooltip accesible señalado con ⓘ; la etiqueta visible contiene únicamente el nombre del indicador.
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
  - Caja negativa: rojo, enlace a `cashflow`.
  - Facturas vencidas > 0: ámbar, enlace a `tracking`.
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
- `#payroll-worker-amount` es el elemento de mayor tamaño tipográfico de la vista, con `$` y separador de miles.
- `.payroll-breakdown` se muestra solo si sueldo base, descuentos o bonos tiene valor; si los tres están vacíos/cero, se oculta.
- `#payroll-worker-history` muestra montos con `$`.
- No se incluyen indicadores financieros, gráfico ni alertas financieras.

## Estilos y accesibilidad

- `#0f62fe` es el único color de acento.
- Fondo gris muy claro, tarjetas blancas, IBM Plex Sans incluida localmente.
- Montos y columnas numéricas usan `tabular-nums`; columnas de montos alineadas a la derecha.
- Cambios de estado no dependen solo del color: incluyen ▲/▼, texto `sin dato anterior` o etiqueta de alerta.
- Los botones y tarjetas clicables conservan foco visible y nombre accesible.

## Verificación

- Administrador: exactamente dos acciones de liquidación, tres métricas de nómina, cero nodos financieros visibles.
- Finanzas: cuatro indicadores, cuatro accesos rápidos, gráfico, alertas y cinco movimientos como máximo.
- Trabajador: sin Panel, con vista de liquidación legible y banner propio.
- Los tres roles: nombre del sistema correcto, tipografía local, colores semánticos y saludo/mes legibles donde aplica.
