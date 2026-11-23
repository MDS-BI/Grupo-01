# Tareas: Absorción del rol finanzas en el rol administrador y creación de liquidaciones de sueldo

**Entrada**: Documentos de diseño en `specs/002-payroll-access-control/`

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Fecha de esta lista**: 2026-11-23 (reemplaza la lista histórica de `002`, ya completada y conservada en el historial de Git)

**Pruebas**: La Constitución (principio II) y `plan.md` exigen pruebas unitarias y de integración para roles, guardas, creación de liquidaciones y búsqueda por RUT; las tareas de prueba se escriben antes o junto con la implementación de cada fase.

**Restricción del cambio**: no se crean ramas ni archivos nuevos; todas las tareas modifican archivos existentes sobre `main`, dentro de la funcionalidad `002-payroll-access-control`.

**Organización**: las tareas se agrupan por historia de usuario (`[US1]`, `[US2]`, `[US3]` de `spec.md`). El orden de fases es P1 → P2: US2 (absorción) se ejecuta primero porque Foundational elimina `finanzas` de la configuración y la autenticación, y sus pruebas de integración deben actualizarse para mantener la suite en verde; US1 es la capacidad nueva principal (🎯 MVP); US3 complementa el listado.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia de usuario a la que pertenece la tarea.
- Todas las descripciones incluyen la ruta de archivo exacta.

## Convenciones de rutas

- Aplicación de un solo proyecto: `src/`, `tests/` e `index.html` en la raíz del repositorio.
- Claves de almacenamiento: `erp.salesInvoices`, `erp.purchaseInvoices`, `erp.unclassifiedDocuments`, `erp.payrollSettlements`, `erp.accessRecords`, `erp.devNotifications`, `erp.migration.payrollSettlements`, `sessionStorage: erp.session`.
- Roles canónicos tras este cambio: `administrador` y `trabajador`; el rol `finanzas` se elimina por completo (FR-001).
- Credenciales de demostración: administrador `88.888.888-8` / `8888`; trabajadores `22.222.222-2` / `2222` y `45.000.000-0` / `4500`. Se elimina el acceso `55.555.555-5` / `5555`.

---

## Phase 1: Setup (Infraestructura compartida)

**Propósito**: registrar la línea base y fijar los artefactos de diseño antes de tocar código.

- [ ] T001 Ejecutar `npm run check` en la raíz del repositorio para registrar la línea base (ESLint, formato Prettier y `vitest run`) antes del cambio.
- [ ] T002 [P] Revisar `specs/002-payroll-access-control/contracts/payroll-views.md` y `specs/002-payroll-access-control/data-model.md` para fijar la matriz de dos roles (`administrador`, `trabajador`) y las entidades `AccessRecord`, `Entity` y `LiquidacionSueldo` antes de implementar.

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Propósito**: dejar el núcleo de roles con solo `administrador` y `trabajador`; TODAS las historias dependen de esta fase.

**⚠️ CRÍTICO**: ninguna historia puede completarse hasta terminar esta fase.

**Orden TDD**: las pruebas T003–T005 se escriben primero y deben fallar; luego se implementan T006–T008.

### Pruebas fundacionales

- [ ] T003 [P] Actualizar `tests/unit/finanzas-role.test.js` para verificar que `ROLES` ya no incluye `finanzas`, que `validateAccessRecord` lo rechaza con `ROLE_INVALID` y que `authenticate` no lo reconoce como rol válido (debe fallar hasta completar T006 y T007).
- [ ] T004 [P] Actualizar `tests/unit/auth.test.js` y `tests/unit/session.test.js` para esperar solo los roles `administrador` y `trabajador`, incluido el rechazo de un registro o una sesión con rol `finanzas`.
- [ ] T005 [P] Actualizar `tests/unit/module-config.test.js` para las constantes de roles y las credenciales de demostración sin `finanzas` ni el par `55.555.555-5` / `5555`.

### Implementación fundacional

- [ ] T006 Actualizar `src/module-config.js`: eliminar `finanzas` de `ROLES` y de `demoAccess`, dejando `administrador` (`88.888.888-8` / `8888`) y los trabajadores `22.222.222-2` / `2222` y `45.000.000-0` / `4500`.
- [ ] T007 Actualizar `src/auth.js`: restringir `validateAccessRecord` y el mensaje `ROLE_INVALID` a `administrador` y `trabajador`, exigir `entityId` personal únicamente a `trabajador`, y rechazar en `authenticate` cualquier registro almacenado con rol `finanzas`.
- [ ] T008 Actualizar `src/session.js`: aplicar `isSessionValid` a los dos roles vigentes y rechazar las sesiones con rol `finanzas`.

**Checkpoint**: configuración, autenticación y sesión sin `finanzas`, cubiertas por las pruebas fundacionales. Las historias pueden comenzar.

---

## Phase 3: User Story 2 - Absorber el rol finanzas en el rol administrador (Priority: P1)

**Goal**: eliminar el rol `finanzas` de accesos, sesiones, matriz de acceso, datos de demostración y navegación, dejando al administrador con todas las funciones operativas y las gestiones de accesos y avisos (FR-001).

**Independent Test**: con la demostración cargada, el administrador ingresa con su RUT y accede a panel, terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda; no existe sesión, vista ni opción de menú para el rol `finanzas`.

### Pruebas para User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US2] Actualizar `tests/integration/finanzas-permissions.test.js` para verificar que el administrador opera panel, terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda, y que no existe acceso ni sesión de `finanzas`.
- [ ] T010 [P] [US2] Actualizar `tests/integration/access-admin-finanzas.test.js` para verificar que `#access-role` solo ofrece `trabajador` y `administrador`, sin la opción `finanzas`, y que el acceso de administrador se crea sin `#access-entity`.
- [ ] T011 [P] [US2] Actualizar `tests/integration/login-roles.test.js` para cubrir los dos roles vigentes y el rechazo del RUT `55.555.555-5` como acceso inexistente con notificación al desarrollador.
- [ ] T012 [P] [US2] Actualizar `tests/integration/navigation-menu.test.js` y `tests/integration/us3-dashboard.test.js` para la navegación del menú ☰ y la grilla del Panel sin la columna `finanzas`, con `#menu-access` y `#menu-dev-notifications` solo para administrador.
- [ ] T013 [P] [US2] Actualizar `tests/unit/demo-data-ruts.test.js` y `tests/integration/demo-data.test.js` para la demostración sin el acceso de `finanzas`, conservando la idempotencia y el RUT del administrador distinto de los terceros.

### Implementación para User Story 2

- [ ] T014 [US2] Actualizar `src/app.js`: eliminar la columna `finanzas` de `ACCESS_MATRIX` y la rama `session.role === 'finanzas'` de `resolveRoute`, dejando al administrador con acceso a todas las vistas operativas y a `access` / `dev-notifications`, y al trabajador solo con `payroll-worker`.
- [ ] T015 [US2] Actualizar `src/components/shell.js`: eliminar `FINANCE_MODULES` y la etiqueta `Rol: Finanzas` de `roleNames`, manteniendo `ADMIN_MODULES` para el administrador y «Cerrar sesión» como última opción.
- [ ] T016 [P] [US2] Actualizar `src/components/dashboard.js` para mostrar `qa-new-payroll` solo a la sesión de administrador.
- [ ] T017 [US2] Actualizar `src/demo-data.js` para quitar el acceso de finanzas `55.555.555-5` / `5555` conservando la idempotencia de la carga.
- [ ] T018 [P] [US2] Actualizar `index.html` para eliminar la opción `finanzas` del selector estático `#access-role`.
- [ ] T019 [US2] Actualizar `src/components/access-admin.js` para ofrecer solo `trabajador` y `administrador` en `#access-role`, ocultar y limpiar `#access-entity` cuando el rol no requiera tercero personal, y mostrar el rol vigente en `#access-list`.
- [ ] T020 [US2] Actualizar `src/components/payroll-list.js` para quitar las ramas de finanzas y dejar la edición de liquidaciones exclusiva del administrador.
- [ ] T021 [P] [US2] Verificar en `src/components/invoice-status-notice.js` que el aviso de migración fallida y de documentos no clasificados se muestra solo al administrador, retirando cualquier referencia a `finanzas`.
- [ ] T022 [US2] Actualizar `README.md` con los roles vigentes, las credenciales de demostración sin `finanzas` y la nota de que el rol fue absorbido por el administrador.

**Checkpoint**: la absorción está completa; la suite no contiene sesiones, vistas ni datos de `finanzas`.

---

## Phase 4: User Story 1 - Crear liquidaciones de sueldo con alta automática de trabajador (Priority: P1) 🎯 MVP

**Goal**: pestaña aparte de creación de liquidaciones que reutiliza el formulario de facturas con «RUT» y «Nombre completo» en lugar de «Tercero»; con RUT nuevo se crean la entidad personal, el acceso `trabajador` con contraseña inicial y el settlement vinculado (FR-002, FR-003, FR-004, FR-006).

**Independent Test**: con la demostración cargada, el administrador ingresa un RUT nuevo y un nombre completo en la pestaña de creación; el sistema crea el trabajador con su contraseña inicial, el trabajador nuevo ingresa con esos datos y ve su liquidación; un RUT inválido o duplicado se rechaza sin crear nada.

### Pruebas para User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [P] [US1] Actualizar `tests/unit/payroll-settlements-storage.test.js` con la creación de un settlement directo por RUT nuevo sin factura de compra previa, sus campos (`settlementId`, `entityId`, `periodo`, desglose, `monto`, `estado`, `fechaPago`) y su idempotencia.
- [ ] T024 [US1] Actualizar `tests/integration/payroll-admin.test.js` con los escenarios de creación: formulario con «RUT» y «Nombre completo» en lugar de «Tercero», alta de entidad personal + acceso `trabajador` + settlement en un solo guardado, rechazo de RUT inválido o con conflicto de acceso sin crear registros parciales y vínculo al trabajador existente cuando el RUT ya tiene acceso activo.
- [ ] T025 [US1] Actualizar `tests/integration/login-roles.test.js` (después de T011, mismo archivo) para que el trabajador nuevo ingrese con la contraseña inicial de los primeros 4 dígitos del cuerpo del RUT y vea su liquidación en `payroll-worker`.

### Implementación para User Story 1

- [ ] T026 [US1] Actualizar `index.html` con la pestaña/vista de creación de liquidaciones (contenedor, campos «RUT» y «Nombre completo», botones de guardar y cancelar, y mensaje de error con `role="alert"`) reutilizando las clases del formulario de facturas.
- [ ] T027 [P] [US1] Actualizar `src/validation.js` con la validación de nombre completo y la comprobación de RUT del alta, reutilizando `isValidRutChileno` y `makeError` existentes.
- [ ] T028 [P] [US1] Actualizar `src/components/invoice-form.js` con un modo de `createInvoiceForm` que sustituya el campo «Tercero» por «RUT» y «Nombre completo», conservando el resto del formulario, sus validaciones y su feedback.
- [ ] T029 [US1] Actualizar `src/payroll.js` con la función de alta que crea la entidad personal (`addEntity` de `src/storage.js`), el acceso `trabajador` con contraseña inicial (`createAccessRecord` de `src/access-storage.js`) y la `LiquidacionSueldo` vinculada al RUT nuevo (`savePayrollSettlements` de `src/storage.js`), sin dejar registros parciales si alguna validación falla y registrando la incidencia con `appendDevNotification` cuando corresponda.
- [ ] T030 [US1] Actualizar `src/app.js` con la ruta de la pestaña de creación, la guarda de administrador según `ACCESS_MATRIX` y el flujo de guardado que refresca el listado y mantiene la bandera `dirty`.
- [ ] T031 [US1] Actualizar `src/components/shell.js` con la entrada de navegación «Nueva liquidación» visible solo para el administrador.

**Checkpoint**: el administrador crea liquidaciones por RUT y el trabajador nuevo accede con su contraseña inicial.

---

## Phase 5: User Story 3 - Ver y editar liquidaciones con búsqueda por RUT (Priority: P2)

**Goal**: pestaña aparte de listado de liquidaciones con selección, edición de cualquiera y cuadro de búsqueda por RUT que filtra mientras se escribe (FR-005).

**Independent Test**: con dos trabajadores con liquidaciones distintas, el administrador escribe un RUT en el buscador y el listado se filtra mientras escribe; edita una liquidación y comprueba el reflejo en la vista del trabajador correspondiente.

### Pruebas para User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T032 [US3] Actualizar `tests/integration/payroll-admin.test.js` (después de T024, mismo archivo) con el escenario de búsqueda por RUT que filtra el listado mientras se escribe, el estado vacío «No hay liquidaciones que coincidan con el filtro.» y la edición de cualquier liquidación reflejada en el trabajador.

### Implementación para User Story 3

- [ ] T033 [US3] Actualizar `index.html` con el cuadro de búsqueda por RUT en la pestaña de liquidaciones, con etiqueta asociada y `role="search"`.
- [ ] T034 [US3] Actualizar `src/components/payroll-list.js` con el filtro por RUT mientras se escribe, conservando el filtro por período y el orden existentes.
- [ ] T035 [US3] Actualizar `src/app.js` con la suscripción del evento `input` del buscador al refresco del listado (`refreshPayrollAdmin`) sin recargar la vista.

**Checkpoint**: las tres historias funcionan de forma independiente y verificable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: verificación automatizada y manual, y coherencia de la documentación.

- [ ] T036 [P] Ejecutar `npm run check` en la raíz del repositorio y corregir cualquier error de ESLint, formato o pruebas.
- [ ] T037 Ejecutar `npm run build` y verificar la compilación de producción con Vite.
- [ ] T038 Ejecutar los escenarios de `specs/002-payroll-access-control/quickstart.md` en el navegador: acceso, creación con RUT nuevo, buscador por RUT, vista del trabajador y riesgos conocidos.
- [ ] T039 [P] Actualizar `specs/002-payroll-access-control/quickstart.md` con la fecha y los resultados de la validación de esta revisión.
- [ ] T040 [P] Revisar la coherencia de `specs/002-payroll-access-control/contracts/`, `specs/002-payroll-access-control/data-model.md` y `README.md` con lo implementado.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; puede iniciar de inmediato.
- **Foundational (Phase 2)**: depende de Setup; **BLOQUEA** todas las historias.
- **US2 (Phase 3)**: depende de Foundational; se ejecuta primero entre las historias porque Foundational elimina `finanzas` de la configuración y la autenticación y sus pruebas de integración deben actualizarse para mantener la suite en verde.
- **US1 (Phase 4)**: depende de Foundational; comparte `src/app.js`, `src/components/shell.js` e `index.html` con US2, por lo que se ejecuta después de US2.
- **US3 (Phase 5)**: depende de US1; comparte `tests/integration/payroll-admin.test.js`, `src/components/payroll-list.js` y `src/app.js` con las historias anteriores.
- **Polish (Phase 6)**: depende de todas las historias deseadas.

### User Story Dependencies

- **US2 (P1)**: puede iniciar tras Foundational; sin dependencias de otras historias más allá de las fases fundacionales.
- **US1 (P1, MVP)**: puede iniciar tras Foundational; requiere US2 para trabajar sobre una navegación y una matriz ya limpias de `finanzas`.
- **US3 (P2)**: requiere US1 (creación) para tener liquidaciones nuevas que listar y editar.

### Within Each User Story

- Las pruebas se escriben primero y deben fallar antes de la implementación.
- Configuración y autenticación antes que guardas y navegación.
- Formulario y validación antes que el flujo de guardado.
- Historia completa antes de pasar a la siguiente prioridad.

### Parallel Opportunities

- Todas las tareas de Setup marcadas `[P]` pueden ejecutarse en paralelo.
- Dentro de Foundational, T003–T005 (archivos de prueba distintos) en paralelo.
- Dentro de US2, T009–T013 (archivos de prueba distintos) en paralelo; T016, T018 y T021 (archivos fuente distintos) en paralelo.
- Dentro de US1, T027 y T028 (archivos distintos) en paralelo; T023 en paralelo con T024.
- Dentro de Polish, T036, T039 y T040 pueden prepararse en paralelo (la ejecución de `npm run check` es el cierre).
- Las historias comparten `src/app.js`, `src/components/shell.js`, `index.html` e `tests/integration/payroll-admin.test.js`: ejecutarlas en secuencia US2 → US1 → US3 para evitar conflictos en esos archivos.

---

## Parallel Example: User Story 2

```text
# Launch all tests for User Story 2 together (different files):
Task: "Actualizar tests/integration/finanzas-permissions.test.js"
Task: "Actualizar tests/integration/access-admin-finanzas.test.js"
Task: "Actualizar tests/integration/login-roles.test.js"
Task: "Actualizar tests/integration/navigation-menu.test.js y tests/integration/us3-dashboard.test.js"
Task: "Actualizar tests/unit/demo-data-ruts.test.js y tests/integration/demo-data.test.js"

# Then implementation (independent files):
Task: "Actualizar src/components/dashboard.js"
Task: "Actualizar index.html"
Task: "Actualizar src/components/invoice-status-notice.js"
```

---

## Parallel Example: User Story 1

```text
# Launch tests for User Story 1 together:
Task: "Actualizar tests/unit/payroll-settlements-storage.test.js"
Task: "Actualizar tests/integration/payroll-admin.test.js"
Task: "Actualizar tests/integration/login-roles.test.js"

# Then implementation (independent files first):
Task: "Actualizar src/validation.js"
Task: "Actualizar src/components/invoice-form.js"
# Then dependent flow:
Task: "Actualizar src/payroll.js"
Task: "Actualizar src/app.js"
Task: "Actualizar src/components/shell.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 como capacidad principal)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (CRÍTICO - bloquea todas las historias).
3. Completar Phase 3: US2 (absorción, para dejar la matriz y la navegación en dos roles).
4. Completar Phase 4: US1 (creación con RUT + nombre completo) → 🎯 MVP del cambio.
5. **PARAR y VALIDAR**: probar US1 de forma independiente con `quickstart.md`.
6. Completar Phase 5: US3 (listado con buscador por RUT).

### Incremental Delivery

1. Setup + Foundational → núcleo de roles listo.
2. US2 → la suite y la interfaz ya no conocen `finanzas`.
3. US1 → el administrador crea liquidaciones con alta automática del trabajador (MVP).
4. US3 → el listado se busca y edita por RUT.
5. Polish → `npm run check`, `npm run build` y escenarios manuales.

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Foundational juntos.
2. Una vez finalizada Foundational:
   - Desarrollador A: US2 (absorción).
   - Desarrollador B: US1 (creación) tras la limpieza de US2, o en paralelo sobre archivos distintos (`src/validation.js`, `src/components/invoice-form.js`, `tests/unit/payroll-settlements-storage.test.js`).
3. US3 se ejecuta al final sobre los archivos compartidos.

---

## Notes

- `[P]` = archivos distintos, sin dependencias pendientes.
- `[Story]` vincula la tarea con la historia de usuario para trazabilidad.
- Cada historia debe poder completarse y verificarse de forma independiente.
- Verificar que las pruebas fallan antes de implementar.
- Confirmar después de cada tarea o grupo lógico con `npm run check`.
- Detenerse en cada checkpoint para validar la historia de forma independiente.
- Evitar: tareas vagas, conflictos en el mismo archivo y dependencias entre historias que rompan la independencia.
