# Research: Rediseño visual de paneles por rol

**Feature**: `specs/004-role-dashboard-redesign/spec.md`

**Fecha**: 2026-11-24

**Estado**: Decisiones técnicas resueltas; sin marcadores `NEEDS CLARIFICATION` pendientes.

## Resumen

La investigación confirma que el rediseño puede hacerse sin cambiar el stack, sin librería de gráficos, sin tocar el modelo de datos y sin modificar las specs 001-003. La tipografía se incorpora como dependencia local; la tendencia se deriva de flujo de caja existente y se dibuja con SVG propio; el nombre visible y las iniciales se derivan de la sesión y del tercero personal, con fallback al rol.

## Decisiones

### R-001: Stack y dependencia de tipografía

- **Decisión**: mantener Vite + JavaScript ESM sin frameworks. Agregar `@fontsource/ibm-plex-sans` como dependencia de ejecución e importar los estilos `latin-400.css`, `latin-500.css`, `latin-600.css` y `latin-700.css` desde `src/main.js`, antes de `initApp`.
- **Justificación**: la spec exige IBM Plex Sans en toda la aplicación y sin internet (`spec.md:66`, `spec.md:208`); la constitución repite el requisito (`.specify/memory/constitution.md:25`). Fontsource resuelve las URL de fuentes como recursos locales hashed en `dist/assets`, sin CDN. El subconjunto `latin` cubre español, acentos, `ñ`, signos `$`, `¿` y `¡`.
- **Alternativas consideradas**: Google Fonts o `@import` remoto (rechazado: dependencia de internet); `@fontsource-variable/ibm-plex-sans` (rechazado: el usuario pidió `@fontsource/ibm-plex-sans`); copiar `.woff2` manualmente a `public/` (rechazado: sin control de versión ni hashing Vite); mantener fuente del sistema con Plex como fallback (rechazado: no garantiza la tipografía).
- **Implicaciones de estilo**: definir `--font-sans: 'IBM Plex Sans', ...` en `:root` y aplicar `font-variant-numeric: tabular-nums` en `body`, heredando a botones, entradas y tablas. Los glifos `▲`, `▼` y `ⓘ` pueden quedar con fallback del sistema; si se exige identidad estricta, sustituirlos por SVG/Accesible name en la implementación.

### R-002: Gráfico de ingresos vs gastos con SVG propio

- **Decisión**: derivar seis buckets mensuales desde `computeCashflow()` en `src/cashflow.js`, con un helper puro con inyección de `now` para pruebas. Dibujar el gráfico en un componente SVG propio del Panel de finanzas, sin librerías de gráficos.
- **Justificación**: `computeCashflow()` ya define la semántica de negocio: facturas de venta pagadas como «Ingreso», facturas de compra y liquidaciones pagadas como «Egreso», con fecha efectiva de pago (`src/cashflow.js:28-89`). `computeDashboardSummary()` solo entrega totales agregados (`src/summary.js:4-24`), por lo que no sirve como serie temporal. Los movimientos genéricos (`src/movements.js`) no codifican la misma distinción de negocio.
- **Alternativas consideradas**: Chart.js/Recharts u otra librería (rechazado: el usuario prohíbe librerías de gráficos); canvas (rechazado: peor inspeccionabilidad y accesibilidad); agregar series al modelo de datos (rechazado: FR-003); usar `createdAt`/`startDate` en lugar de la fecha efectiva de flujo de caja (rechazado: tergiversa el momento del pago).
- **Contrato de datos**: exactamente seis meses consecutivos que terminan en el mes actual, ordenados de antiguo a reciente; clave `YYYY-MM`; meses sin actividad con `income: 0`, `expense: 0`, `net: 0`; solo documentos pagados.
- **Contrato visual**: SVG con `viewBox`, `role="img"`, `<title>` y `<desc>`, etiquetas de los seis meses, leyenda «Ingresos»/«Gastos», barras o líneas con etiquetas accesibles y texto alternativo con montos formateados. Sin animaciones automáticas; el gráfico es el único acento visual fuerte del Panel.

### R-003: Nombre del sistema, saludo e iniciales sin modelo nuevo

- **Decisión**: cambiar `userConfig.moduleName` a «Contabilidad y Finanzas» y el `<title>` estático de `index.html`. Derivar el perfil visible con un resolver puro desde sesión + entidad vinculada: administrador → «Administrador» / `A`, finanzas → «Finanzas» / `F`, trabajador con nombre → nombre de la persona y sus iniciales, trabajador sin nombre → «Trabajador» / `T`.
- **Justificación**: las sesiones de administrador y finanzas no tienen nombre asociado, según el usuario; los accesos de demostración tampoco lo tienen (`src/demo-data.js:383-416`, `src/module-config.js:204-216`). Los trabajadores sí tienen un tercero personal vinculado (`src/demo-data.js:127-151`, `:417-437`). FR-041/FR-042 prohíben mostrar iniciales del título del sistema, por lo que no se reutiliza `monogram(moduleName)` (`src/utils.js:61-69`, `src/components/shell.js:33-61`).
- **Alternativas consideradas**: agregar `name`/`displayName` a `Session` o `AccessRecord` (rechazado: cambia el modelo y contradice FR-003); usar el monograma del sistema (rechazado: contradice FR-042); mostrar el rol también al trabajador (rechazado: hay nombre disponible).
- **Implicaciones**: crear un mapa compartido de etiquetas de rol para no duplicar `shell.js:134-143`; el avatar se actualiza desde `applySession()` (`src/app.js:366-392`); el saludo y el mes se renderizan en el encabezado del Panel desde `setDashboardSession()` (`src/components/dashboard.js:63-87`).

### R-004: Permisos, banner y sesión

- **Decisión**: la visibilidad por rol se resuelve en la capa del Panel, no solo en `clearRestrictedViews()`. El administrador no recibe ningún valor financiero aunque los datos existan. El banner «¿Primera vez?» se muestra en la vista de inicio de cada rol (Panel para administrador y finanzas; «Mi liquidación» para trabajador) y su descarte se guarda en `sessionStorage` con clave por rol, por ejemplo `erp.guideDismissed.<role>`.
- **Justificación**: hoy `clearRestrictedViews()` (`src/app.js:338-364`) solo limpia cuando el rol no puede abrir el Panel; el administrador sí puede abrirlo y por eso ve valores financieros (HU1). La matriz vigente niega el Panel al trabajador (`src/app.js:93-120`), por lo que exigir literalmente «Panel» a ese rol rompería FR-002/FR-036.
- **Alternativas consideradas**: ocultar el banner al trabajador por no tener Panel (rechazado: contradice FR-029); dar Panel al trabajador (rechazado: rompe la matriz 003); guardar el descarte en `localStorage` o dentro de `erp.session` (rechazado: la spec pide duración de sesión y no modificar el modelo); una única clave global de descarte (rechazado: FR-030 exige que no afecte a otros roles).
- **Implicaciones**: el nuevo estado es solo UI; no se agrega a `data-model.md`; no se toca la forma de `erp.session`.

### R-005: Sistema de diseño aplicado con `frontend-design`

- **Decisión**: usar tokens existentes y agregar los semánticos que faltan. Paleta base: fondo `#f4f6fb`, superficie `#ffffff`, acento `#0f62fe`, rojo `#c62828`, ámbar `#b26a00`, verde `#1b7f4b`, texto primario `#1a1f2c`. Tipografía única IBM Plex Sans con escala 400/500/600/700. Layout: greeting y mes arriba; una sola fila de cuatro indicadores; gráfico y alertas lado a lado; últimos movimientos debajo; accesos rápidos en una fila al final.
- **Justificación**: la constitución fija identidad, color semántico y legibilidad; `frontend-design` pide intención, no kit genérico de tarjetas. La información financiera es el sujeto: se gasta el rasgo distintivo en la tendencia SVG y en la jerarquía del monto del trabajador; el resto permanece sobrio.
- **Alternativas consideradas**: tarjetas con sombras suaves y gradientes decorativos (rechazado: estilo genérico y el color deja de comunicar estado); varias tipografías (rechazado: rompe identidad única); numeración artificial de secuencias (rechazado: el contenido no es una secuencia).
- **Reglas de color aplicadas**: rojo para valor negativo/crítico y para variación desfavorable; ámbar para acción requerida; verde para variación favorable; neutro para normal. Por cobrar siempre neutro en su variación. Sin cambio siempre neutro.

### R-006: Alcance de pruebas y documentación

- **Decisión**: actualizar `us14-dashboard-summary`, `us3-dashboard`, `navigation-menu`, `module-config`, `payroll-worker`, `us13-shell`, `foundation`, `tutorial` y pruebas de sesión/demo según los contratos nuevos. Agregar cobertura específica para panel del administrador sin datos financieros, colores por estado, ausencia de «Deuda pendiente», nombre del sistema, iniciales por rol/persona, bucket mensual y SVG accesible.
- **Justificación**: FR-046/FR-047 y el principio II de la constitución exigen verificación antes de considerar terminada la funcionalidad.
- **Alternativas consideradas**: cambiar solo pruebas que fallen (rechazado: dejaría sin cobertura SC-001 a SC-010); introducir e2e (rechazado: el proyecto usa Vitest/jsdom y no tiene e2e).
- **Verificación**: `npm run check` debe pasar con cero fallos; se conservan las convenciones de IDs existentes siempre que no contradigan la spec.

## Clarificaciones resueltas

| Tema | Resolución |
|---|---|
| ¿Se agrega una librería de gráficos? | No; SVG propio desde buckets derivados de flujo de caja. |
| ¿Cómo se carga IBM Plex Sans? | Paquete local `@fontsource/ibm-plex-sans`, importado desde `src/main.js`. |
| ¿Qué nombre e iniciales se muestran para administrador y finanzas? | Rol, porque no tienen nombre asociado. |
| ¿Dónde aparece el banner para el trabajador? | En su vista de inicio «Mi liquidación», sin darle acceso al Panel. |
| ¿Cambia el modelo de datos? | No; solo modelos de vista derivados y una clave UI en `sessionStorage`. |
| ¿Se modifican specs 001-003? | No. |
