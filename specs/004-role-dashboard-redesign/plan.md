# Implementation Plan: Rediseño visual de paneles por rol

**Branch**: `main` | **Date**: 2026-11-24 | **Spec**: [`specs/004-role-dashboard-redesign/spec.md`](spec.md)

**Input**: Feature specification from `/specs/004-role-dashboard-redesign/spec.md`

**Note**: Plan completado por `/speckit.plan`; sus decisiones se detallan en `research.md`, `data-model.md`, `contracts/` y `quickstart.md`. `tasks.md` ya generado por `/speckit.tasks`; verificar si corresponde.

## Summary

Rediseñar los paneles por rol del módulo «Contabilidad y Finanzas» para corregir la exposición financiera al administrador, unificar los indicadores de finanzas, agregar tendencia y alertas, compactar accesos rápidos y hacer legible la vista del trabajador, manteniendo la matriz de permisos de la spec 003 y sin modificar el modelo de datos.

El enfoque técnico es un SPA Vite + JavaScript ESM sin frameworks: IBM Plex Sans local mediante `@fontsource/ibm-plex-sans`, SVG propio para la tendencia de seis meses derivada de `computeCashflow()`, modelos de vista derivados para perfil/indicadores/banner y visibilidad resuelta en la capa del Panel. La secuencia prevista es: permisos y nombre del sistema → identidad visual y tipografía → indicadores y gráfico → accesos/banner → vista del trabajador → cobertura automatizada.

## Technical Context

**Language/Version**: JavaScript ESM, sin TypeScript; Vite 8.2.1.

**Primary Dependencies**: Vite, Vitest 4.1.10, jsdom 30, ESLint 8, Prettier 3 y la nueva dependencia local `@fontsource/ibm-plex-sans`. Sin librerías de UI ni de gráficos.

**Storage**: `localStorage` existente (`erp.session`, `erp.accessRecords`, `erp.payrollSettlements`, documentos, entidades y movimientos) solo lectura de dominio; `sessionStorage['erp.guideDismissed.<role>']` como único estado UI nuevo.

**Testing**: Vitest + jsdom, con `npm run test`, `npm run lint`, `npm run format:check` y `npm run check`.

**Target Platform**: navegadores modernos de escritorio; verificación obligatoria a 1366x768; tipografía disponible sin internet.

**Project Type**: aplicación web de un solo proyecto, SPA local sin backend.

**Performance Goals**: cuatro indicadores visibles sin scroll a 1366x768; serie de seis puntos calculada en memoria; sin animaciones automáticas ni re-rendidos innecesarios.

**Constraints**: no frameworks, no librería de gráficos, no CDN de fuentes; no cambios en specs 001-003 ni en el modelo persistente; respetar `ACCESS_MATRIX` de `src/app.js`; acento `#0f62fe`, color solo semántico, IBM Plex Sans con `tabular-nums`, montos CLP y períodos legibles.

**Scale/Scope**: tres roles, dos Paneles, una vista del trabajador, cuatro indicadores financieros, seis puntos de tendencia, cuatro accesos rápidos de finanzas y un banner por rol.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / sección | Requisito | Resultado | Evidencia |
|---|---|---|---|
| I. Code Quality & Maintainability | Funciones pequeñas, nombres claros y abstracciones solo con necesidad demostrada | PASS | Resolver de perfil y helper de tendencia como funciones puras; contratos definen Entrada/Salida. |
| II. Test-First & Verification | Cobertura unitaria e integración antes de completar | PASS | `research.md` R-006 y `quickstart.md` definen casos nuevos y `npm run check`. |
| III. User Experience Consistency | Identidad única, color semántico, roles limitados, KPIs sin scroll, CLP y períodos legibles, fórmulas en tooltip | PASS | `contracts/dashboard-ui.md`, `contracts/session-display.md` y tokens de `research.md` R-005. |
| IV. Performance & Reliability | Sin trabajo innecesario ni dependencias remotas; datos derivados en lectura | PASS | Serie SVG de seis puntos, sin librería; fuente local; sin persistencia adicional. |
| Quality Standards | Lint, formato, pruebas y documentación actualizada | PASS | Este plan actualiza documentación y conserva `npm run check`. |
| Development Workflow | Incrementos revisables con validación explícita de UX | PASS | Secuencia en Summary y verificaciones manuales por rol en `quickstart.md`. |
| Governance | Sin excepciones que justificar; constitución no se modifica en este feature | PASS | Sin violaciones registradas; `Complexity Tracking` vacío. |

**Resultado del gate inicial**: PASS.

**Revisión posterior a Phase 1**: PASS.

- Las incógnitas técnicas quedaron resueltas en `research.md`: fuente local, SVG propio, perfil derivado, banner por rol y permisos del Panel.
- `data-model.md` confirma ausencia de cambios persistentes y define solo view models derivados.
- Los contratos fijan roles, IDs, colores, formatos, tooltips, navegación, datos del gráfico y accesibilidad.
- `quickstart.md` cubre verificación manual por rol, casos límite y comandos automáticos.
- No aparecen marcadores `NEEDS CLARIFICATION` ni violaciones de constitución.

## Project Structure

### Documentation (this feature)

```text
specs/004-role-dashboard-redesign/
├── plan.md              # Este archivo, salida de /speckit.plan
├── research.md          # Decisiones de Phase 0
├── data-model.md        # View models derivados y reglas de Phase 1
├── quickstart.md        # Verificación de Phase 1
├── contracts/
│   ├── dashboard-ui.md
│   ├── session-display.md
│   └── trend-chart.md
├── checklists/
│   └── requirements.md  # Salida previa de /speckit.checklist
└── tasks.md             # Generado por /speckit.tasks
```

### Source Code (repository root)

```text
index.html
package.json
src/
├── main.js
├── app.js
├── module-config.js
├── session.js
├── styles.css
├── cashflow.js
   ├── summary.js
   ├── finance.js
   ├── tracking.js
├── movements.js
├── format.js
├── utils.js
└── components/
    ├── shell.js
    ├── dashboard.js
    ├── payroll-worker.js
    ├── tutorial.js
    └── login.js
tests/
├── setup/
│   └── domFixture.js
├── unit/
│   ├── session.test.js
│   ├── module-config.test.js
│   ├── tutorial-steps.test.js
│   └── demo-data-ruts.test.js
└── integration/
    ├── us3-dashboard.test.js
    ├── us14-dashboard-summary.test.js
    ├── navigation-menu.test.js
    ├── us13-shell.test.js
    ├── foundation.test.js
    ├── module-config.test.js
    ├── payroll-worker.test.js
    ├── tutorial.test.js
    ├── session-lifecycle.test.js
    ├── demo-from-login.test.js
    ├── payroll-create.test.js
    ├── cashflow-format.test.js
    └── us5-config.test.js
```

**Structure Decision**: se conserva el proyecto único existente. No se crean carpetas `backend/`, `frontend/`, `api/` ni módulos nuevos de dominio. Los cambios se concentran en `src/components/dashboard.js`, `src/components/payroll-worker.js`, `src/components/shell.js`, `src/app.js`, `src/session.js`, `src/cashflow.js`, `src/module-config.js`, `src/main.js`, `index.html`, `src/styles.css` y las pruebas listadas.

## Complexity Tracking

No se requiere: el Constitution Check no tiene violaciones que justificar. La dependencia tipográfica nueva y el resolver de perfil son decisiones directas de requisitos, no excepciones arquitectónicas.
