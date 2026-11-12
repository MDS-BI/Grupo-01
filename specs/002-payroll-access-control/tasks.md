# Tareas: Acceso a liquidaciones de sueldo por RUT y contraseña

**Entrada**: Documentos de diseño en `specs/002-payroll-access-control/`

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Pruebas**: La Constitución (principio II) y la especificación exigen pruebas unitarias y de integración para autenticación, roles y aislamiento. Las tareas de prueba se escriben antes o junto con la implementación.

**Organización**: Las tareas se agrupan por historia de usuario. Los identificadores `[US1]`…`[US6]` mapean a `spec.md`. El orden de fases sigue la prioridad: P1 (US1, US2, US5) → P2 (US3, US4) → P3 (US6). US5 se ejecuta antes de US3/US4 porque provee el formulario de factura de compra que reutiliza la edición de liquidaciones.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia de usuario a la que pertenece la tarea.
- Todas las descripciones incluyen la ruta de archivo exacta.

## Convenciones de rutas

- Aplicación de un solo proyecto: `src/`, `tests/` e `index.html` en la raíz del repositorio.
- Claves de almacenamiento: `erp.salesInvoices`, `erp.purchaseInvoices`, `erp.unclassifiedDocuments`, `erp.accessRecords`, `erp.devNotifications`, `sessionStorage: erp.session`.
- Roles canónicos: `administrador` y `trabajador`.

---

## Phase 1: Setup (Infraestructura compartida)

**Propósito**: preparar constantes, contenedores, estilos y bootstrap de pruebas sin alterar aún el comportamiento actual.

- [ ] T001 [P] Agregar en `src/module-config.js` las constantes de roles (`ROLES`, `administrador`, `trabajador`), etiquetas de las vistas nuevas, claves de almacenamiento de accesos/sesión y las credenciales ficticias de demostración (`DEMO_ACCESS`).
- [ ] T002 [P] Agregar en `index.html` los contenedores vacíos y ocultos `#view-login`, `#view-payroll-worker`, `#view-payroll-admin`, `#view-access`, `#view-dev-notifications`, `#view-invoice-sale` y `#view-invoice-purchase`, y sus botones de navegación; conservar temporalmente `#view-documents` hasta completar US5.
- [ ] T003 [P] Agregar en `src/styles.css` los estilos de pantalla de acceso, selector de rol, tarjeta de liquidación, tablas de accesos/avisos, estados vacíos y clases de separación visual `invoice-view--sale` / `invoice-view--purchase`.
- [ ] T004 [P] Extender `tests/setup/dom.js` para limpiar también `sessionStorage` y las marcas `erp.migration.invoiceSplit` y `erp.schemaVersion` entre pruebas.

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Propósito**: núcleo de almacenamiento separado, autenticación, sesión y guardas que TODAS las historias necesitan.

**⚠️ CRÍTICO**: ninguna historia puede completarse hasta terminar esta fase.

**Orden TDD**: las pruebas T005–T009 se escriben primero y deben fallar; luego se implementan T010–T017.

### Pruebas fundacionales

- [ ] T005 [P] Crear `tests/unit/auth.test.js` con normalización de RUT (puntos, guion, K minúscula, espacios), derivación de contraseña inicial, RUT inválido, no registrado, duplicado, inactivo, vínculo roto, contraseña incorrecta y rol incompatible.
- [ ] T006 [P] Crear `tests/unit/session.test.js` con guardado/lectura/limpieza en `sessionStorage`, sesión inválida por acceso inactivo, por cambio de rol y por `entityId` roto.
- [ ] T007 [P] Crear `tests/unit/access-storage.test.js` con creación de accesos de trabajador y administrador, contraseña inicial, RUT duplicado, tercero ya vinculado, desactivación, reactivación, restablecimiento y protección del último administrador.
- [ ] T008 [P] Crear `tests/unit/invoice-storage-separation.test.js` con escritura en la colección correcta, lecturas sin mezcla, actualización sin cambio de colección, eliminación y `loadDocuments()` como unión sin no clasificados; incluir el caso de mismo folio permitido entre venta y compra.
- [ ] T009 [P] Crear `tests/integration/invoice-migration.test.js` con migración de una colección única, ejecución doble sin duplicados, documentos sin tipo a `erp.unclassifiedDocuments` y conservación de la colección legada si falla.

### Implementación fundacional

- [ ] T010 Actualizar `src/storage.js`: agregar `STORAGE_KEYS.salesInvoices`, `purchaseInvoices`, `unclassifiedDocuments`, `accessRecords`, `devNotifications`, `migration.invoiceSplit`; elevar `SCHEMA_VERSION` a `2.0.0` y crear los helpers `loadSaleInvoices`, `saveSaleInvoices`, `loadPurchaseInvoices`, `savePurchaseInvoices`, `loadUnclassifiedDocuments` y `saveUnclassifiedDocuments`.
- [ ] T011 Implementar `migrateLegacyDocuments()` en `src/storage.js`: separar `erp.documents` por `customFields.tipoFactura`, enviar los documentos sin tipo a `erp.unclassifiedDocuments`, evitar duplicados por `document_id`, verificar el total migrado, conservar la colección legada si falla y marcar `erp.migration.invoiceSplit = 'done'`.
- [ ] T012 Redirigir en `src/storage.js` `addDocument`, `updateDocument`, `deleteDocument`, `deleteDocumentsForEntity`, `saveDocuments` y `clearAll` a las colecciones separadas, manteniendo `loadDocuments()` como vista unificada de solo lectura (venta + compra, sin no clasificados), conservando la limpieza de movimientos y rechazando tipos distintos de `venta`/`compra`.
- [ ] T013 [P] Crear `src/auth.js` con `normalizeRut(input)`, `initialPassword(rut)`, `validateAccessRecord(record, { entities, existing })` y `authenticate({ rut, password, role, records, entities })`, reutilizando `isValidRutChileno` de `src/validation.js`.
- [ ] T014 [P] Crear `src/session.js` con `loadSession`, `saveSession`, `clearSession` e `isSessionValid(session, { records, entities })`, usando `sessionStorage` bajo `erp.session` y degradando a memoria si no está disponible.
- [ ] T015 [P] Crear `src/access-storage.js` con `loadAccessRecords`, `saveAccessRecords`, `createAccessRecord`, `updateAccessRecord`, `deactivateAccessRecord`, `reactivateAccessRecord`, `resetPassword`, `countActiveAdmins`, `loadDevNotifications`, `appendDevNotification` y `clearDevNotifications`; usar `generateId` de `src/utils.js` para las notificaciones y `accessId` canónico como clave de acceso; emitir `console.error` al registrar una notificación.
- [ ] T016 Agregar en `src/app.js` `canAccess(view, session)` y `resolveRoute(view, session)` con la matriz de `contracts/payroll-views.md`, y aplicar la guarda al inicio de `showModule` redirigiendo a la vista permitida con un mensaje.
- [ ] T017 Actualizar `src/components/shell.js` para recibir la sesión y mostrar solo los módulos permitidos: administrador con toda la navegación y trabajador solo con “Mi liquidación” y “Cerrar sesión”.
- [ ] T018 Actualizar las pruebas existentes que dependen del almacenamiento único (`tests/integration/foundation.test.js`, `tests/integration/demo-data.test.js`, `tests/integration/movements.test.js`) para que usen las colecciones separadas; no tocar aún las pruebas de vistas genéricas.

**Checkpoint**: almacenamiento separado, autenticación, sesión y guardas listos y cubiertos por pruebas. Las historias pueden comenzar.

---

## Phase 3: User Story 1 - Iniciar sesión con rol, RUT y contraseña (Priority: P1) 🎯 MVP

**Goal**: pantalla de acceso con selección de rol, RUT y contraseña que lleva a la vista correcta y conserva la sesión al recargar.

**Independent Test**: con un acceso de administrador y otro de trabajador registrados, elegir cada rol e ingresar credenciales correctas lleva a vistas distintas; credenciales incorrectas o rol incompatible no muestran datos.

### Pruebas de User Story 1

- [ ] T019 [P] [US1] Crear `tests/integration/login-roles.test.js` que cubra los siete escenarios de aceptación de US1, incluida la recuperación de sesión al recargar.

### Implementación de User Story 1

- [ ] T020 [P] [US1] Crear `src/components/login.js` con el formulario de acceso (selector de rol, RUT, contraseña, mensaje `role="alert"`, advertencia de seguridad y botón de demostración condicional).
- [ ] T021 [US1] Reemplazar el contenido de `#view-login` en `index.html` con el marcado de `src/components/login.js` (`login-role`, `login-rut`, `login-password`, `login-submit`, `login-error`, `login-warning`, `login-load-demo`).
- [ ] T022 [US1] Integrar el login en `src/app.js`: al iniciar sin sesión válida ocultar el espacio de trabajo y mostrar `#view-login`; al enviar, llamar a `authenticate`, guardar la sesión con `saveSession` y navegar con `resolveRoute`.
- [ ] T023 [US1] Implementar en `src/app.js` la recuperación de sesión al recargar con `loadSession` + `isSessionValid`, y el descarte de la sesión cuando el acceso ya no existe, está inactivo o cambió de rol.
- [ ] T024 [US1] Mostrar en `src/components/login.js` los mensajes diferenciados para credenciales incorrectas, rol incompatible, acceso inactivo, RUT inválido, RUT no registrado y vínculo roto, sin revelar si el RUT existe cuando la causa es la contraseña.

**Checkpoint**: US1 funciona sola y es la base de autenticación para el resto.

---

## Phase 4: User Story 2 - Administrar accesos de trabajadores y administradores (Priority: P1)

**Goal**: el administrador crea, activa, desactiva y restablece accesos por RUT, con contraseña inicial derivada del RUT y protección del último administrador.

**Independent Test**: desde una sesión de administrador se crea un acceso de trabajador, se entra con su RUT y contraseña inicial, se desactiva y se verifica que ya no permite entrar.

### Pruebas de User Story 2

- [ ] T025 [P] [US2] Crear `tests/integration/access-admin.test.js` que cubra los diez escenarios de US2, el bloqueo a trabajadores y la prueba de que un cambio de estado o contraseña aplica en el siguiente intento de acceso sin reiniciar.

### Implementación de User Story 2

- [ ] T026 [P] [US2] Crear `src/components/access-admin.js` con el formulario de creación (rol, RUT, tercero personal, contraseña inicial de solo lectura) y la lista de accesos con RUT, rol, tercero, estado y fecha de creación.
- [ ] T027 [US2] Reemplazar el contenido de `#view-access` en `index.html` con el marcado de `src/components/access-admin.js` (`access-form`, `access-role`, `access-rut`, `access-entity`, `access-password`, `access-list`, `access-actions`).
- [ ] T028 [US2] Integrar `#view-access` en `src/app.js`: renderizar la lista, filtrar terceros personales sin acceso activo, conectar crear/activar/desactivar/restablecer y refrescar tras cada cambio.
- [ ] T029 [US2] Registrar en `src/access-storage.js` una notificación al desarrollador cuando se rechaza un RUT duplicado o se desactiva un acceso, y mostrar el error correspondiente en `src/components/access-admin.js`.
- [ ] T030 [US2] Implementar en `src/components/access-admin.js` la bandera `dirty` del formulario y exponerla para que el cierre de sesión pueda pedir confirmación.

**Checkpoint**: US1 y US2 funcionan juntas; el administrador ya puede gobernar los accesos.

---

## Phase 5: User Story 5 - Separar facturas de venta y de compra (Priority: P1)

**Goal**: facturas de venta y de compra separadas física y visualmente, con migración idempotente, aviso de incidencias y sin vista genérica de documentos.

**Independent Test**: una factura de venta y una de compra viven en colecciones distintas y solo aparecen en su vista, formulario y listado; la liquidación nunca muestra una factura de venta.

### Pruebas de User Story 5

- [ ] T031 [P] [US5] Crear `tests/integration/invoice-separation.test.js` que verifique las dos vistas, la ausencia de la vista genérica, el filtrado por tipo en cada listado, el tipo fijado por el formulario y la ausencia de facturas de venta en la liquidación.

### Implementación de User Story 5

- [ ] T032 [P] [US5] Crear `src/components/invoice-form.js` como fábrica compartida de formularios de factura con configuración por tipo, inyección de `customFields.tipoFactura` y filtrado de terceros (`cliente` para venta; `proveedor` o `personal` para compra).
- [ ] T033 [P] [US5] Crear `src/components/invoice-list.js` como fábrica compartida de listados con columnas configurables por tipo y acciones de editar/eliminar.
- [ ] T034 [P] [US5] Crear `src/components/invoice-sale-form.js` e `src/components/invoice-sale-list.js` con las columnas y campos propios de venta (`salesOrderId`) y la clase visual `invoice-view--sale`.
- [ ] T035 [P] [US5] Crear `src/components/invoice-purchase-form.js` e `src/components/invoice-purchase-list.js` con las columnas y campos propios de compra (`centroCosto`, `periodoLiquidacion`) y la clase visual `invoice-view--purchase`.
- [ ] T036 [P] [US5] Crear `src/components/invoice-status-notice.js` para mostrar el aviso de migración fallida y la cantidad de documentos no clasificados, indicando que no se muestran como liquidaciones.
- [ ] T037 [US5] Reemplazar `#view-documents` en `index.html` por `#view-invoice-sale` y `#view-invoice-purchase` con sus formularios, selectores de edición, listados, estados vacíos y el contenedor `#invoice-status-notice` (`invoice-sale-form`, `invoice-sale-edit`, `invoice-sale-list`, `invoice-sale-empty`, `invoice-purchase-form`, `invoice-purchase-edit`, `invoice-purchase-list`, `invoice-purchase-empty`).
- [ ] T038 [US5] Reescribir en `src/app.js` los manejadores de documentos para usar las fábricas de venta/compra, fijar el tipo por vista, eliminar `documents` de `VIEWS`/`VIEW_ELEMENTS`, actualizar las acciones rápidas y renderizar `#invoice-status-notice` con el resultado de la migración.
- [ ] T039 [US5] Actualizar `src/components/dashboard.js` e `index.html` para que las acciones rápidas y los contadores usen las vistas de factura de venta/compra y no `#qa-new-document` ni `#nav-documents`.
- [ ] T040 [US5] Eliminar `src/components/document-form.js` y `src/components/document-list.js`, y actualizar o retirar las pruebas que dependen de la vista genérica (`tests/integration/us10-documents.test.js`, `tests/integration/us13-shell.test.js`).

**Checkpoint**: separación física y visual completa; la liquidación solo puede apoyarse en compras.

---

## Phase 6: User Story 3 - Consultar mi única liquidación (Priority: P2)

**Goal**: el trabajador ve en modo solo lectura únicamente su liquidación vigente, sin navegación administrativa ni datos de otros.

**Independent Test**: con dos trabajadores con liquidaciones distintas, cada uno ve solo la suya; no hay acciones de edición y no se expone nada del otro.

### Pruebas de User Story 3

- [ ] T041 [P] [US3] Crear `tests/unit/payroll.test.js` con `resolveWorkerSettlement` (período más reciente, desempate por `startDate` y `createdAt`, tercero no personal, sin liquidación) y `resolveAdminSettlements` (filtros por tercero/RUT y período).
- [ ] T042 [P] [US3] Crear `tests/integration/payroll-worker.test.js` que cubra los cinco escenarios de US3, el aislamiento entre dos trabajadores y el bloqueo de vistas administrativas.

### Implementación de User Story 3

- [ ] T043 [P] [US3] Crear `src/payroll.js` con `resolveWorkerSettlement({ entityId, purchaseInvoices, entities })` y `resolveAdminSettlements({ purchaseInvoices, entities, filters })` según `contracts/payroll-views.md`.
- [ ] T044 [P] [US3] Crear `src/components/payroll-worker.js` que renderice la tarjeta de solo lectura con período, trabajador, RUT, monto, estado, fecha de pago y estado vacío.
- [ ] T045 [US3] Reemplazar el contenido de `#view-payroll-worker` en `index.html` con el marcado de `src/components/payroll-worker.js` (`payroll-worker-card`, `payroll-worker-period`, `payroll-worker-name`, `payroll-worker-rut`, `payroll-worker-amount`, `payroll-worker-status`, `payroll-worker-paid-at`, `payroll-worker-empty`, `payroll-worker-warning`).
- [ ] T046 [US3] Integrar `#view-payroll-worker` en `src/app.js`: mostrar solo con rol `trabajador`, resolver la liquidación por `session.entityId` y no renderizar botones de edición, eliminación ni creación.
- [ ] T047 [US3] Manejar en `src/app.js` y `src/components/payroll-worker.js` el vínculo roto o el `entityId` inválido: cerrar la sesión, volver al login, mostrar un mensaje claro y registrar la notificación al desarrollador.

**Checkpoint**: el trabajador tiene su apartado exclusivo y aislado.

---

## Phase 7: User Story 4 - Ver y editar las liquidaciones de todos (Priority: P2)

**Goal**: el administrador lista, filtra y edita las liquidaciones de todos los trabajadores con el formulario de factura de compra y asocia cada RUT con su acceso.

**Independent Test**: con liquidaciones de dos trabajadores, el administrador las ve, filtra, edita una, asocia un acceso y el cambio se refleja en la vista del trabajador correspondiente.

### Pruebas de User Story 4

- [ ] T048 [P] [US4] Crear `tests/integration/payroll-admin.test.js` que cubra los seis escenarios de US4, los filtros, la edición válida, el rechazo de una edición inválida, la asociación RUT↔acceso y la reflexión del cambio en la vista del trabajador.

### Implementación de User Story 4

- [ ] T049 [P] [US4] Crear `src/components/payroll-list.js` con la tabla de liquidaciones (trabajador, RUT, período, monto, estado, fecha de pago, acción Editar) y los filtros `payroll-filter-worker` y `payroll-filter-period`.
- [ ] T050 [P] [US4] Crear `src/components/payroll-form.js` que reutilice `src/components/invoice-purchase-form.js` para editar período, monto, estado, fechas y datos de pago, respetando las validaciones y el ciclo de vida de `001`.
- [ ] T051 [US4] Reemplazar el contenido de `#view-payroll-admin` en `index.html` con el marcado de `src/components/payroll-list.js` y `src/components/payroll-form.js` (`payroll-admin-list`, `payroll-admin-empty`, `payroll-form`, `payroll-form-submit`, `payroll-form-errors`).
- [ ] T052 [US4] Integrar `#view-payroll-admin` en `src/app.js`: renderizar la lista completa, aplicar filtros en memoria, cargar la liquidación en el formulario y guardar con `updateDocument` sobre `erp.purchaseInvoices`.
- [ ] T053 [US4] Implementar en `src/components/payroll-list.js` la acción para asociar la liquidación con un acceso de trabajador activo cuyo RUT coincida, o para crear el acceso desde la vista de liquidaciones; reflejar la asociación en `AccessRecord.entityId` y mostrar el error cuando el RUT no coincida.
- [ ] T054 [US4] Mostrar en `src/components/payroll-list.js` una advertencia cuando el RUT del tercero no tenga un acceso de trabajador activo asociado, y explicar cómo corregirlo desde Acciones o desde la factura de compra.
- [ ] T055 [US4] Verificar en `src/app.js` que, tras guardar una edición, el refresco de `#view-payroll-worker` del trabajador correspondiente refleje el cambio sin reiniciar la aplicación.
- [ ] T056 [US4] Implementar en `src/components/payroll-form.js` la bandera `dirty` y exponerla para que el cierre de sesión pueda pedir confirmación.

**Checkpoint**: administrador y trabajador ven la misma fuente de verdad con permisos distintos.

---

## Phase 8: User Story 6 - Cerrar sesión, notificar incidencias y usar datos de demostración (Priority: P3)

**Goal**: cierre de sesión seguro, registro visible de incidencias para el desarrollador y datos ficticios idempotentes con credenciales documentadas.

**Independent Test**: iniciar sesión, cerrar sesión y comprobar que se vuelve al login; cerrar la pestaña y comprobar que no se recupera la sesión; cargar la demostración y entrar con los RUT ficticios.

### Pruebas de User Story 6

- [ ] T057 [P] [US6] Crear `tests/integration/session-lifecycle.test.js` con recarga que conserva la sesión, cierre de sesión que la elimina, cierre de pestaña simulado que la descarta y confirmación por cambios sin guardar.
- [ ] T058 [P] [US6] Crear `tests/integration/dev-notifications.test.js` con registro de RUT inválido, no registrado, inactivo, duplicado y vínculo roto, ausencia de registro por contraseña incorrecta o rol incompatible, emisión de `console.error`, panel solo para administrador y limpieza con confirmación.
- [ ] T059 [P] [US6] Extender `tests/integration/demo-data.test.js` para verificar un administrador, dos trabajadores, terceros personales, liquidaciones, credenciales documentadas y carga idempotente sin duplicados.

### Implementación de User Story 6

- [ ] T060 [P] [US6] Crear `src/components/dev-notifications.js` con el panel de avisos (fecha, RUT intentado, rol, motivo, origen) y el botón `dev-notifications-clear` con confirmación.
- [ ] T061 [US6] Reemplazar el contenido de `#view-dev-notifications` en `index.html` y agregar su botón de navegación en `src/components/shell.js`, visible solo para administradores.
- [ ] T062 [US6] Agregar en `src/components/shell.js` y `src/app.js` el botón y el flujo de cierre de sesión: consultar las banderas `dirty` de los formularios, confirmar si hay cambios sin guardar, llamar a `clearSession`, ocultar el espacio de trabajo y volver a `#view-login`.
- [ ] T063 [US6] Extender `src/demo-data.js` con los accesos de demostración (`11.111.111-1` / `1111`, `22.222.222-2` / `2222`, `45.000.000-5` / `4500`), sus terceros personales y una liquidación por trabajador, manteniendo la carga idempotente y conservando lo existente.
- [ ] T064 [US6] Conectar en `src/components/login.js` y `src/app.js` el botón “Cargar datos de demostración” del login, el mensaje de “no hay accesos registrados” y el estado de carga (`demo-status`).
- [ ] T065 [US6] Mostrar en `src/components/login.js`, `src/components/payroll-worker.js`, `src/components/access-admin.js` y `src/components/invoice-status-notice.js` la advertencia de que el control es una restricción de interfaz, que los datos viven en el navegador y que no deben usarse datos reales.

**Checkpoint**: todas las historias funcionan y la demostración es reproducible sin datos reales.

---

## Phase 9: Polish y preocupaciones transversales

**Propósito**: documentación, limpieza y verificación final.

- [ ] T066 [P] Actualizar `README.md` con los RUT y contraseñas de demostración, la advertencia de que el control de acceso es solo de interfaz y la prohibición de usar datos reales.
- [ ] T067 [P] Actualizar `specs/001-erp-base-module/plan.md` y `specs/001-erp-base-module/data-model.md` con una nota de que `002` supersede el almacenamiento único por las colecciones separadas.
- [ ] T068 [P] Revisar `src/app.js`, `src/storage.js`, `src/components/shell.js` e `index.html` para eliminar referencias muertas a `erp.documents`, `#view-documents`, `#nav-documents` y `#qa-new-document`, y confirmar que no quedan escrituras a la colección legada después de la migración.
- [ ] T069 [P] Revisar accesibilidad y consistencia en `index.html` y `src/styles.css`: `role="alert"` en errores, etiquetas asociadas, estados vacíos, tablas con `thead`/`tbody` y navegación por teclado.
- [ ] T070 Verificar en `src/app.js` y `src/payroll.js` que la pantalla de acceso aparece en menos de 1 segundo, la autenticación y resolución de liquidación responden en menos de 100 ms y los listados se renderizan en menos de 200 ms con los volúmenes del MVP; registrar la medición.
- [ ] T071 Ejecutar `npm run check` (lint + formato + pruebas) sobre `src/` y `tests/` y corregir cualquier fallo en `src/app.js`, `src/storage.js`, `src/payroll.js`, `src/components/` o `tests/unit/` y `tests/integration/`.
- [ ] T072 Ejecutar los nueve escenarios manuales de `specs/002-payroll-access-control/quickstart.md` y registrar el resultado de cada uno.
- [ ] T073 Verificar que la demostración no contiene datos reales y que `README.md`, la pantalla de acceso y las vistas de liquidación muestran la advertencia de seguridad.

---

## Dependencies & Execution Order

### Dependencias por fase

- **Setup (Phase 1)**: sin dependencias; puede comenzar de inmediato.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias. Las pruebas T005–T009 se escriben antes que T010–T017.
- **User Stories (Phase 3+)**: dependen de Foundational.
- **Polish (Phase 9)**: depende de las historias que se quieran entregar.

### Dependencias entre historias

- **US1 (P1)**: depende de Foundational. Es la puerta de entrada del resto.
- **US2 (P1)**: depende de US1 para existir una sesión de administrador; reutiliza `access-storage.js` y `auth.js`.
- **US5 (P1)**: depende solo de Foundational; puede ejecutarse en paralelo con US2 y es requisito de US4 por `invoice-purchase-form.js`.
- **US3 (P2)**: depende de US1 y de la separación física de Foundational; puede probarse con accesos y compras creados por API.
- **US4 (P2)**: depende de US3 por `src/payroll.js` y de US5 por `src/components/invoice-purchase-form.js`.
- **US6 (P3)**: depende de US1 (cierre de sesión), de US2/US4 (banderas `dirty`) y de `access-storage.js` (notificaciones y demostración).

### Orden recomendado

```text
Setup → Foundational → US1 → US2 → US5 → US3 → US4 → US6 → Polish
```

US2 y US5 pueden avanzar en paralelo tras US1. US3 puede avanzar en paralelo con US2/US5 si se crean accesos por API. US4 requiere US3 y US5. US6 cierra el ciclo.

### Dentro de cada historia

- Las pruebas se escriben antes o junto con la implementación y deben fallar antes de implementar.
- Primero el módulo de lógica (`auth.js`, `session.js`, `access-storage.js`, `payroll.js`), luego el componente, luego el marcado en `index.html` y finalmente el cableado en `src/app.js`.
- Cada historia termina con su checkpoint validado de forma independiente.

### Oportunidades de paralelización

- Setup: T001–T004 en paralelo.
- Foundational: T005–T009 en paralelo; T013, T014 y T015 en paralelo; T010–T012 son secuenciales entre sí.
- US1: T019 y T020 en paralelo.
- US2: T025 y T026 en paralelo.
- US5: T031–T036 en paralelo; T037–T040 son secuenciales.
- US3: T041–T044 en paralelo.
- US4: T048–T050 en paralelo.
- US6: T057–T060 en paralelo.
- Polish: T066–T069 en paralelo.

---

## Parallel Example: User Story 5

```text
# Pruebas y componentes en paralelo
Task: "T031 Crear tests/integration/invoice-separation.test.js"
Task: "T032 Crear src/components/invoice-form.js"
Task: "T033 Crear src/components/invoice-list.js"
Task: "T034 Crear src/components/invoice-sale-form.js e invoice-sale-list.js"
Task: "T035 Crear src/components/invoice-purchase-form.js e invoice-purchase-list.js"
Task: "T036 Crear src/components/invoice-status-notice.js"
```

---

## Implementation Strategy

### MVP mínimo (US1)

1. Completar Phase 1: Setup.
2. Completar Phase 2: Foundational (CRÍTICO, con pruebas T005–T009 primero).
3. Completar Phase 3: US1 (login por rol).
4. **DETENERSE y VALIDAR**: probar el login con un acceso creado por API o por prueba.

### MVP demostrable

1. Setup + Foundational.
2. US1 (login) + US2 (administración de accesos) + US5 (separación de facturas).
3. Cargar accesos y compras de prueba y demostrar login, alta de accesos y separación.

### Entrega incremental

1. Setup + Foundational → base lista.
2. US1 → login funcional.
3. US2 → accesos administrables.
4. US5 → facturas separadas y aviso de migración.
5. US3 → vista del trabajador.
6. US4 → edición y asociación desde el administrador.
7. US6 → cierre de sesión, avisos y demostración.
8. Polish → documentación y verificación final.

### Estrategia con varios desarrolladores

1. Todo el equipo completa Setup + Foundational.
2. Tras Foundational:
   - Desarrollador A: US1 y luego US2.
   - Desarrollador B: US5.
   - Desarrollador C: US3 y luego US4.
3. Al terminar US1, integrar y desbloquear US2/US3.
4. Cerrar con US6 y Polish en conjunto.

---

## Notes

- `[P]` indica archivos distintos sin dependencias pendientes.
- `[USn]` permite trazar cada tarea a su historia y validarla por separado.
- Las pruebas son obligatorias por la Constitución (principio II) y por la especificación.
- Verificar que las pruebas fallan antes de implementar cuando sea posible.
- Confirmar en cada checkpoint que un trabajador no puede ver datos ajenos ni vistas administrativas.
- Evitar tareas vagas, conflictos sobre el mismo archivo y dependencias que rompan la independencia de las historias.
