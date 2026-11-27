# Contract: Identidad de sesión y visual

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Aplica a**: `index.html`, `src/module-config.js`, `src/session.js`, `src/components/shell.js`, `src/components/dashboard.js`, `src/components/payroll-worker.js`, `src/app.js`, `src/main.js`, `src/styles.css`.

## Nombre del sistema

| Ubicación | Valor exacto |
|---|---|
| Barra superior `#brand-name` | `Contabilidad y Finanzas` |
| Título de pestaña `document.title` | `Contabilidad y Finanzas` |

- Se actualizan `DEFAULT_CONFIG.moduleName` y `userConfig.moduleName`.
- Se elimina el texto `Contabilidad y Finanzas: Facturación y Pagos`.
- `ERP Base` permanece solo como configuración base por defecto en pruebas de `DEFAULT_CONFIG`; no aparece en la experiencia del módulo configurado.

## Tipografía y formato

- IBM Plex Sans se incluye localmente con `@fontsource/ibm-plex-sans`, importado desde `src/main.js` antes de `initApp`.
- `--font-sans` apunta a IBM Plex Sans con fallbacks del sistema.
- `body` aplica `font-variant-numeric: tabular-nums` y heredan montos, tablas, botones y entradas.
- Todo monto visible usa `formatCurrencyCLP` con `$`, separador de miles y alineación derecha en columnas; p. ej. `$250.000`, nunca `250000 CLP`.
- Toda fecha visible como texto usa `DD-MM-AAAA`; los campos de entrada y el almacenamiento conservan `AAAA-MM-DD`.
- Todo RUT visible usa puntos y guion, p. ej. `12.345.678-5`, sin normalizar el valor almacenado.
- Todo período visible usa texto legible, p. ej. `noviembre 2026`; el formato `YYYY-MM` queda restringido a claves internas y almacenamiento.

## Paleta y contraste

- La barra superior usa fondo `#023047` con texto e iconos `#ffffff` (`13.85:1`).
- `#session-role` usa fondo `#8ECAE6` con texto `#023047` (`7.74:1`).
- El círculo de perfil usa fondo `#FFB703` con iniciales `#023047` (`7.93:1`).
- `#126782` y `#A84F00` son los textos favorable y crítico sobre `#ffffff` (`6.39:1` y `5.55:1`).
- `#219EBC` y `#FB8500` se reservan para gráficos o bordes con contraste mínimo de `3:1` (`3.14:1` y `2.48:1`); nunca como texto pequeño sobre blanco.
- El color no es la única señal: se conservan flechas ▲/▼, texto `sin dato anterior` y etiquetas de alerta.

## Perfil derivado de sesión

Entradas:

| Entrada | Origen |
|---|---|
| `session` | `loadSession()` |
| `entities` | `loadEntities()` |
| `roleLabels` | mapa compartido exportado desde `module-config.js` |

Salida:

```text
{
  role,
  roleLabel,
  displayName,
  initials,
  source: 'person' | 'role'
}
```

Reglas:

| Caso | `displayName` | `initials` | `source` |
|---|---|---|---|
| Administrador | `Recursos Humanos` | `R` | `role` |
| Finanzas | `Finanzas` | `F` | `role` |
| Trabajador con entidad personal y nombre | `entity.name` | Primera letra del primer nombre + primera letra del primer apellido | `person` |
| Trabajador con un solo nombre | Ese nombre | Una inicial | `person` |
| Trabajador sin nombre utilizable | `Trabajador` | `T` | `role` |

- `erp.session` mantiene su forma: `{ accessId, role, entityId, startedAt }`.
- No se agrega `name`, `displayName` ni `initials` a la sesión ni a los accesos.
- El resolver es puro y se prueba por separado.
- La clave persistida sigue siendo `administrador`; solo cambian `roleLabel`, `displayName` e `initials`.

## Elementos de la barra superior

| ID | Contenido |
|---|---|
| `#brand-name` | Nombre del sistema, sin variaciones por rol. |
| `#session-role` | `Rol: Recursos Humanos`, `Rol: Finanzas` o `Rol: Trabajador`. |
| `#brand-logo` | Círculo de perfil con las iniciales derivadas. |

- `#brand-logo` deja de usar `monogram(moduleName)`.
- No se muestran `ERP`, `CF` ni iniciales del título del módulo en `#brand-logo`.
- Si se mantiene un SVG para el fondo del círculo, el texto visible sigue siendo exclusivamente `initials`.
- `#brand-logo` se actualiza al iniciar sesión, al cambiar de sesión y al cerrar sesión.

## Banner superior contextual

| ID | Contenido |
|---|---|
| `#view-context` | `Contabilidad y Finanzas › <nombre de la vista>` fuera del Panel; oculto en `dashboard` y `login`. |
| `#view-context-separator` | `›`. |
| `#view-context-name` | Etiqueta visible ya existente de la vista activa, p. ej. `Facturas de compra`, `Seguimiento` o `Mi liquidación`. |
| `#banner-notice` | Aviso de acción por rol; oculto sin sesión y cuando el número calculado es cero. |
| `#banner-notice-count` | Número calculado que permanece visible a 390 px. |
| `#banner-notice-text` | Texto completo del aviso; se oculta visualmente a 390 px. |

- `#brand-name` sigue siendo exactamente `Contabilidad y Finanzas` en todas las vistas; el contexto `›` nunca se escribe dentro de él.
- En `dashboard` solo se ve `Contabilidad y Finanzas`. Fuera del Panel, incluida `payroll-worker`, se ve `Contabilidad y Finanzas › <nombre de la vista>`.
- `#back-bar`, `#back-to-dashboard` y `#back-view-name` conservan su contenido y comportamiento anterior; el banner contextual no los reemplaza.
- Para `finanzas`, el aviso es `1 factura vencida` o `N facturas vencidas`, calculado con `computeFinanceIndicators(loadDocuments(), loadEntities(), loadMovements())`, y abre `tracking`.
- Para `administrador`, el aviso es `1 liquidación en borrador` o `N liquidaciones en borrador`, calculado con `computeAdminPayrollSummary(loadEntities(), loadAccessRecords(), loadPayrollSettlements()).draft`, y abre `payroll-admin`.
- No hay aviso para `trabajador`, sin sesión ni con número cero; el mismo texto visible se conserva en `aria-label`.
- El aviso se recalcula al iniciar sesión, al cambiar de vista y al cambiar los datos que alimentan el Panel, sin recargar ni persistir datos nuevos.
- `#banner-notice` usa fondo `#FFB703` y texto `#023047`; a 390 px se ocultan `#view-context` y `#banner-notice-text`, mientras `#banner-notice-count` y el `aria-label` completo permanecen disponibles.

## Encabezados por rol

| Vista | Saludo | Período |
|---|---|---|
| Panel del administrador | `#dashboard-greeting` con `Recursos Humanos` | `#dashboard-month` con mes actual legible |
| Panel de finanzas | `#dashboard-greeting` con `Finanzas` | `#dashboard-month` con mes actual legible |
| Mi liquidación | `#payroll-worker-name` con nombre de la persona | `#payroll-worker-period` con período legible |

- El saludo y el mes se derivan de la fecha de la sesión; no se almacenan.
- Para administrador y finanzas, el saludo nunca usa un nombre personal inexistente.

## Guía descartable

- Claves de `sessionStorage`:
  - `erp.guideDismissed.administrador`
  - `erp.guideDismissed.finanzas`
  - `erp.guideDismissed.trabajador`
- Valor: marcador booleano simple; la ausencia significa «no descartada».
- El descarte no modifica `erp.session`, `erp.accessRecords`, facturas, liquidaciones ni movimientos.
- Cada rol evalúa su propia clave; el descarte no cruza roles.
- La guía existente y sus pasos no cambian.

## Casos límite

| Caso | Resultado |
|---|---|
| Usuario con un solo nombre | Una sola inicial. |
| Usuario sin nombre | Inicial del rol. |
| Administrador con datos financieros en navegador | Sigue mostrando `R`, `Rol: Recursos Humanos` y no ve datos financieros. |
| Cambio de rol sin cerrar pestaña | Se recalcula perfil, encabezado, banner y visibilidad del Panel. |
| Recarga dentro de la misma sesión | El banner descartado permanece oculto. |
| Nueva sesión de otro rol | Banner visible salvo que ese rol ya lo haya descartado. |

## Verificación

- `document.title === 'Contabilidad y Finanzas'` en cualquier vista.
- `#brand-name.textContent === 'Contabilidad y Finanzas'`.
- `#brand-logo` contiene `R`, `F`, `AP` o `BS` según el usuario de demostración, nunca `ERP`.
- No aparece `YYYY-MM` en textos visibles de Paneles ni de la vista del trabajador; las fechas visibles usan `DD-MM-AAAA`.
- Los RUT visibles usan puntos y guion, p. ej. `12.345.678-5`, sin cambiar el valor normalizado guardado.
- Los montos visibles usan `formatCurrencyCLP`, p. ej. `$250.000`; no aparece `250000 CLP`.
