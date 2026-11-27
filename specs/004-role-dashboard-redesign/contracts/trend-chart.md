# Contract: Gráfico de tendencia ingresos vs gastos

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Aplica a**: `src/cashflow.js`, `src/components/dashboard.js`, `src/styles.css`, pruebas de flujo de caja y Panel.

## Requisito

El Panel de finanzas muestra un gráfico SVG propio con ingresos y gastos de los últimos seis meses calendario consecutivos que terminan en el mes actual. No se usa ninguna librería de gráficos.

## Contrato de datos

Helper puro en `src/cashflow.js`:

```text
computeMonthlyIncomeExpense(
  documents,
  entities,
  movements,
  { months = 6, now = new Date() } = {}
) => TrendPoint[]
```

`TrendPoint`:

| Campo | Tipo | Regla |
|---|---|---|
| `monthKey` | `string` | `YYYY-MM` calculado en hora local. |
| `label` | `string` | Etiqueta corta legible para el eje, p. ej. `jun`, `jul`, `ago`. |
| `income` | `number` | Suma de montos de filas `Ingreso`. |
| `expense` | `number` | Suma de montos de filas `Egreso`. |
| `net` | `number` | `income - expense`. |

Reglas de agregación:

1. Usar las filas ya producidas por `computeCashflow(documents, entities, movements)`.
2. Considerar solo documentos con `status === 'Pagada'`.
3. Usar la fecha efectiva de pago de `computeCashflow`: movimiento `tipo === 'pago'`, luego `customFields.fechaPago`, luego `endDate`/`startDate`.
4. Agrupar por `YYYY-MM` de esa fecha.
5. Generar exactamente `months` puntos consecutivos, ordenados de antiguo a reciente.
6. Los meses sin filas quedan con `income`, `expense` y `net` en `0`.
7. El mes actual se calcula desde `now`; las pruebas inyectan una fecha fija.
8. No se persisten los puntos; son un view model derivado.

## Contrato de render

El componente se monta dentro de `#dashboard-trend-section` y debe cumplir:

- Un `<svg>` con `viewBox`, `width`/`height` relativos y `preserveAspectRatio` que evite deformación.
- `role="img"`, `<title>` con `Tendencia de ingresos y gastos de los últimos seis meses` y `<desc>` con resumen de los seis meses.
- Eje mensual con seis etiquetas, una por punto.
- Serie de ingresos en `#219EBC` y serie de gastos en `#A84F00`, con leyenda visible `Ingresos` y `Gastos`.
- Barras o líneas con `<title>` o `aria-label` por punto con mes, ingreso y gasto formateados en CLP.
- Montos en `$`, separador de miles y `tabular-nums`.
- Sin animación automática, sin dependencias externas y sin canvas.
- Si todos los puntos son cero: estado visual «Sin movimientos en los últimos seis meses», conservando el SVG accesible o reemplazándolo por texto accesible equivalente.

## Diseño visual

- El gráfico es el acento visual principal del Panel de finanzas; las tarjetas de indicadores permanecen sobrias.
- Usar `#023047` como acento general; las series financieras usan `#219EBC` para ingresos y `#A84F00` para gastos, con `#FB8500` reservado a bordes críticos.
- `#219EBC`/`#ffffff` cumple `3.14:1` y `#A84F00`/`#ffffff` cumple `5.55:1`; la leyenda y los `<title>` conservan el significado sin depender solo del color.
- Fondo blanco de tarjeta, sin degradados ni sombras decorativas.
- Espaciado generoso entre eje, leyenda y título; etiquetas legibles a 1366x768.

## Roles

| Rol | Gráfico |
|---|---|
| Finanzas | Visible en `#dashboard-trend-section`. |
| Administrador | Ausente; no se calcula ni se renderiza. |
| Trabajador | Ausente; no se calcula ni se renderiza. |

## Casos límite

| Caso | Resultado esperado |
|---|---|
| Menos de seis meses de datos | Se rellenan meses anteriores con ceros. |
| Mes sin pagos | Punto con ceros, sin hueco en el eje. |
| Pago con movimiento posterior a `fechaPago` | Predomina la fecha del movimiento de pago, igual que en `computeCashflow`. |
| Documento `Emitida` | No entra al gráfico. |
| Factura sin `tipoFactura` válido | No entra al gráfico. |
| Montos negativos en datos | Se respeta el cálculo existente de flujo de caja; no se inventa normalización. |
| `now` inyectado en prueba | La serie termina en ese mes, con independencia de la fecha real. |

## Verificación

- Prueba unitaria del helper con seis meses exactos, ceros rellenos y fecha inyectada.
- Prueba de integración del Panel de finanzas con `<svg role="img">`, título, leyenda y seis etiquetas.
- Prueba de integración con administrador y trabajador sin nodo `#dashboard-trend-section` visible.
- `npm run check` sin errores de lint, formato ni pruebas.
