# Tareas: Acceso a liquidaciones de sueldo por RUT y contraseña

**Entrada**: Documentos de diseño en `specs/002-payroll-access-control/`

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Pruebas**: La Constitución (principio II) y la especificación exigen pruebas unitarias y de integración para autenticación, roles y aislamiento. Las tareas de prueba se escriben antes o junto con la implementación.

**Organización**: Las tareas se agrupan por historia de usuario. Los identificadores `[US1]`…`[US7]` mapean a `spec.md`. El orden de fases sigue la prioridad: P1 (US1, US2, US5, US7) → P2 (US3, US4) → P3 (US6). US5 se ejecuta antes de US3/US4 porque provee el formulario de factura de compra que reutiliza la edición de liquidaciones. Phase 10 agrupa las correcciones de la revisión de seguridad y privacidad sin modificar T001–T078.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes).
- **[Story]**: historia de usuario a la que pertenece la tarea.
- Todas las descripciones incluyen la ruta de archivo exacta.

## Convenciones de rutas

- Aplicación de un solo proyecto: `src/`, `tests/` e `index.html` en la raíz del repositorio.
- Claves de almacenamiento: `erp.salesInvoices`, `erp.purchaseInvoices`, `erp.unclassifiedDocuments`, `erp.accessRecords`, `erp.devNotifications`, `sessionStorage: erp.session`.
- Roles canónicos tras la revisión: `administrador`, `finanzas` y `trabajador`; `invitado` queda eliminado. Las tareas históricas que mencionan `invitado` se conservan y se corrigen en Phase 10.

---

## Phase 1: Setup (Infraestructura compartida)

**Propósito**: preparar constantes, contenedores, estilos y bootstrap de pruebas sin alterar aún el comportamiento actual.

- [X] T001 [P] Agregar en `src/module-config.js` las constantes de roles (`ROLES`, `administrador`, `trabajador`), etiquetas de las vistas nuevas, claves de almacenamiento de accesos/sesión y las credenciales ficticias de demostración (`DEMO_ACCESS`).
- [X] T002 [P] Agregar en `index.html` los contenedores vacíos y ocultos `#view-login`, `#view-payroll-worker`, `#view-payroll-admin`, `#view-access`, `#view-dev-notifications`, `#view-invoice-sale` y `#view-invoice-purchase`, y sus botones de navegación; conservar temporalmente `#view-documents` hasta completar US5.
- [X] T003 [P] Agregar en `src/styles.css` los estilos de pantalla de acceso, tarjeta de liquidación, tablas de accesos/avisos, estados vacíos y clases de separación visual `invoice-view--sale` / `invoice-view--purchase`.
- [X] T004 [P] Extender `tests/setup/dom.js` para limpiar también `sessionStorage` y las marcas `erp.migration.invoiceSplit` y `erp.schemaVersion` entre pruebas.

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Propósito**: núcleo de almacenamiento separado, autenticación, sesión y guardas que TODAS las historias necesitan.

**⚠️ CRÍTICO**: ninguna historia puede completarse hasta terminar esta fase.

**Orden TDD**: las pruebas T005–T009 se escriben primero y deben fallar; luego se implementan T010–T017.

### Pruebas fundacionales

- [X] T005 [P] Crear `tests/unit/auth.test.js` con normalización de RUT (puntos, guion, K minúscula, espacios), derivación de contraseña inicial, RUT inválido, no registrado, duplicado, inactivo, vínculo roto, contraseña incorrecta y reconocimiento automático del rol registrado.
- [X] T006 [P] Crear `tests/unit/session.test.js` con guardado/lectura/limpieza en `sessionStorage`, sesión inválida por acceso inactivo, por cambio de rol y por `entityId` roto.
- [X] T007 [P] Crear `tests/unit/access-storage.test.js` con creación de accesos de trabajador y administrador, contraseña inicial, RUT duplicado, tercero ya vinculado, desactivación, reactivación, restablecimiento y protección del último administrador.
- [X] T008 [P] Crear `tests/unit/invoice-storage-separation.test.js` con escritura en la colección correcta, lecturas sin mezcla, actualización sin cambio de colección, eliminación y `loadDocuments()` como unión sin no clasificados; incluir el caso de mismo folio permitido entre venta y compra.
- [X] T009 [P] Crear `tests/integration/invoice-migration.test.js` con migración de una colección única, ejecución doble sin duplicados, documentos sin tipo a `erp.unclassifiedDocuments` y conservación de la colección legada si falla.

### Implementación fundacional

- [X] T010 Actualizar `src/storage.js`: agregar `STORAGE_KEYS.salesInvoices`, `purchaseInvoices`, `unclassifiedDocuments`, `accessRecords`, `devNotifications`, `migration.invoiceSplit`; elevar `SCHEMA_VERSION` a `2.0.0` y crear los helpers `loadSaleInvoices`, `saveSaleInvoices`, `loadPurchaseInvoices`, `savePurchaseInvoices`, `loadUnclassifiedDocuments` y `saveUnclassifiedDocuments`.
- [X] T011 Implementar `migrateLegacyDocuments()` en `src/storage.js`: separar `erp.documents` por `customFields.tipoFactura`, enviar los documentos sin tipo a `erp.unclassifiedDocuments`, evitar duplicados por `document_id`, verificar el total migrado, conservar la colección legada si falla y marcar `erp.migration.invoiceSplit = 'done'`.
- [X] T012 Redirigir en `src/storage.js` `addDocument`, `updateDocument`, `deleteDocument`, `deleteDocumentsForEntity`, `saveDocuments` y `clearAll` a las colecciones separadas, manteniendo `loadDocuments()` como vista unificada de solo lectura (venta + compra, sin no clasificados), conservando la limpieza de movimientos y rechazando tipos distintos de `venta`/`compra`.
- [X] T013 [P] Crear `src/auth.js` con `normalizeRut(input)`, `initialPassword(rut)`, `validateAccessRecord(record, { entities, existing })` y `authenticate({ rut, password, records, entities })`, reutilizando `isValidRutChileno` de `src/validation.js`.
- [X] T014 [P] Crear `src/session.js` con `loadSession`, `saveSession`, `clearSession` e `isSessionValid(session, { records, entities })`, usando `sessionStorage` bajo `erp.session` y degradando a memoria si no está disponible.
- [X] T015 [P] Crear `src/access-storage.js` con `loadAccessRecords`, `saveAccessRecords`, `createAccessRecord`, `updateAccessRecord`, `deactivateAccessRecord`, `reactivateAccessRecord`, `resetPassword`, `countActiveAdmins`, `loadDevNotifications`, `appendDevNotification` y `clearDevNotifications`; usar `generateId` de `src/utils.js` para las notificaciones y `accessId` canónico como clave de acceso; emitir `console.error` al registrar una notificación.
- [X] T016 Agregar en `src/app.js` `canAccess(view, session)` y `resolveRoute(view, session)` con la matriz de `contracts/payroll-views.md`, y aplicar la guarda al inicio de `showModule` redirigiendo a la vista permitida con un mensaje.
- [X] T017 Actualizar `src/components/shell.js` para recibir la sesión y mostrar solo los módulos permitidos: administrador con toda la navegación y trabajador solo con “Mi liquidación” y “Cerrar sesión”.
- [X] T018 Actualizar las pruebas existentes que dependen del almacenamiento único (`tests/integration/foundation.test.js`, `tests/integration/demo-data.test.js`, `tests/integration/movements.test.js`) para que usen las colecciones separadas; no tocar aún las pruebas de vistas genéricas.

**Checkpoint**: almacenamiento separado, autenticación, sesión y guardas listos y cubiertos por pruebas. Las historias pueden comenzar.

---

## Phase 3: User Story 1 - Acceder con RUT y contraseña o como invitado (Priority: P1) 🎯 MVP

**Goal**: tarjeta centrada con RUT y contraseña, rol detectado desde el acceso, entrada como invitado, rol en la cabecera y acción de sesión al final del lateral.

**Independent Test**: con un acceso de administrador y otro de trabajador registrados, ingresar las credenciales correctas lleva a la vista del rol registrado; el modo invitado conserva sus funciones y las credenciales incorrectas se rechazan.

### Pruebas de User Story 1

- [X] T019 [P] [US1] Crear `tests/integration/login-roles.test.js` que cubra los escenarios revisados de US1, incluida la recuperación de sesión al recargar.

### Implementación de User Story 1

- [X] T020 [P] [US1] Crear `src/components/login.js` con el formulario de acceso (RUT, contraseña, Ingresar, Continuar sin iniciar sesión, mensaje `role="alert"` y aviso académico al pie).
- [X] T021 [US1] Reemplazar el contenido de `#view-login` en `index.html` con el marcado de `src/components/login.js` (`login-rut`, `login-password`, `login-submit`, `login-guest`, `login-error`, `login-warning`, `login-no-accesses`).
- [X] T022 [US1] Integrar el login en `src/app.js`: al iniciar sin sesión válida ocultar el espacio de trabajo y mostrar `#view-login`; al enviar, llamar a `authenticate`, guardar la sesión con `saveSession` y navegar con `resolveRoute`.
- [X] T023 [US1] Implementar en `src/app.js` la recuperación de sesión al recargar con `loadSession` + `isSessionValid`, y descartar la sesión cuando el acceso ya no existe, está inactivo o cambió de rol.
- [X] T024 [US1] Mostrar en `src/components/login.js` los mensajes diferenciados para credenciales incorrectas, acceso inactivo, RUT inválido, RUT no registrado y vínculo roto, sin revelar si el RUT existe cuando la causa es la contraseña.

**Checkpoint**: US1 funciona sola y es la base de autenticación para el resto.

---

## Phase 4: User Story 2 - Administrar accesos de trabajadores y administradores (Priority: P1)

**Goal**: el administrador crea, activa, desactiva y restablece accesos por RUT, con contraseña inicial derivada del RUT y protección del último administrador.

**Independent Test**: desde una sesión de administrador se crea un acceso de trabajador, se entra con su RUT y contraseña inicial, se desactiva y se verifica que ya no permite entrar.

### Pruebas de User Story 2

- [X] T025 [P] [US2] Crear `tests/integration/access-admin.test.js` que cubra los diez escenarios de US2, el bloqueo a trabajadores y la prueba de que un cambio de estado o contraseña aplica en el siguiente intento de acceso sin reiniciar.

### Implementación de User Story 2

- [X] T026 [P] [US2] Crear `src/components/access-admin.js` con el formulario de creación (rol, RUT, tercero personal, contraseña inicial de solo lectura) y la lista de accesos con RUT, rol, tercero, estado y fecha de creación.
- [X] T027 [US2] Reemplazar el contenido de `#view-access` en `index.html` con el marcado de `src/components/access-admin.js` (`access-form`, `access-role`, `access-rut`, `access-entity`, `access-password`, `access-list`, `access-actions`).
- [X] T028 [US2] Integrar `#view-access` en `src/app.js`: renderizar la lista, filtrar terceros personales sin acceso activo, conectar crear/activar/desactivar/restablecer y refrescar tras cada cambio.
- [X] T029 [US2] Registrar en `src/access-storage.js` una notificación al desarrollador cuando se rechaza un RUT duplicado o se desactiva un acceso, y mostrar el error correspondiente en `src/components/access-admin.js`.
- [X] T030 [US2] Implementar en `src/components/access-admin.js` la bandera `dirty` del formulario y exponerla para que el cierre de sesión pueda pedir confirmación.

**Checkpoint**: US1 y US2 funcionan juntas; el administrador ya puede gobernar los accesos.

---

## Phase 5: User Story 5 - Separar facturas de venta y de compra (Priority: P1)

**Goal**: facturas de venta y de compra separadas física y visualmente, con migración idempotente, aviso de incidencias y sin vista genérica de documentos.

**Independent Test**: una factura de venta y una de compra viven en colecciones distintas y solo aparecen en su vista, formulario y listado; la liquidación nunca muestra una factura de venta.

### Pruebas de User Story 5

- [X] T031 [P] [US5] Crear `tests/integration/invoice-separation.test.js` que verifique las dos vistas, la ausencia de la vista genérica, el filtrado por tipo en cada listado, el tipo fijado por el formulario y la ausencia de facturas de venta en la liquidación.

### Implementación de User Story 5

- [X] T032 [P] [US5] Crear `src/components/invoice-form.js` como fábrica compartida de formularios de factura con configuración por tipo, inyección de `customFields.tipoFactura` y filtrado de terceros (`cliente` para venta; `proveedor` o `personal` para compra).
- [X] T033 [P] [US5] Crear `src/components/invoice-list.js` como fábrica compartida de listados con columnas configurables por tipo y acciones de editar/eliminar.
- [X] T034 [P] [US5] Crear `src/components/invoice-sale-form.js` e `src/components/invoice-sale-list.js` con las columnas y campos propios de venta (`salesOrderId`) y la clase visual `invoice-view--sale`.
- [X] T035 [P] [US5] Crear `src/components/invoice-purchase-form.js` e `src/components/invoice-purchase-list.js` con las columnas y campos propios de compra (`centroCosto`, `periodoLiquidacion`) y la clase visual `invoice-view--purchase`.
- [X] T036 [P] [US5] Crear `src/components/invoice-status-notice.js` para mostrar el aviso de migración fallida y la cantidad de documentos no clasificados, indicando que no se muestran como liquidaciones.
- [X] T037 [US5] Reemplazar `#view-documents` en `index.html` por `#view-invoice-sale` y `#view-invoice-purchase` con sus formularios, selectores de edición, listados, estados vacíos y el contenedor `#invoice-status-notice` (`invoice-sale-form`, `invoice-sale-edit`, `invoice-sale-list`, `invoice-sale-empty`, `invoice-purchase-form`, `invoice-purchase-edit`, `invoice-purchase-list`, `invoice-purchase-empty`).
- [X] T038 [US5] Reescribir en `src/app.js` los manejadores de documentos para usar las fábricas de venta/compra, fijar el tipo por vista, eliminar `documents` de `VIEWS`/`VIEW_ELEMENTS`, actualizar las acciones rápidas y renderizar `#invoice-status-notice` con el resultado de la migración.
- [X] T039 [US5] Actualizar `src/components/dashboard.js` e `index.html` para que las acciones rápidas y los contadores usen las vistas de factura de venta/compra y no `#qa-new-document` ni `#nav-documents`.
- [X] T040 [US5] Eliminar `src/components/document-form.js` y `src/components/document-list.js`, y actualizar o retirar las pruebas que dependen de la vista genérica (`tests/integration/us10-documents.test.js`, `tests/integration/us13-shell.test.js`).

**Checkpoint**: separación física y visual completa; la liquidación solo puede apoyarse en compras.

---

## Phase 6: User Story 3 - Consultar mi única liquidación (Priority: P2)

**Goal**: el trabajador ve en modo solo lectura únicamente su liquidación vigente, sin navegación administrativa ni datos de otros.

**Independent Test**: con dos trabajadores con liquidaciones distintas, cada uno ve solo la suya; no hay acciones de edición y no se expone nada del otro.

### Pruebas de User Story 3

- [X] T041 [P] [US3] Crear `tests/unit/payroll.test.js` con `resolveWorkerSettlement` (período más reciente, desempate por `startDate` y `createdAt`, tercero no personal, sin liquidación) y `resolveAdminSettlements` (filtros por tercero/RUT y período).
- [X] T042 [P] [US3] Crear `tests/integration/payroll-worker.test.js` que cubra los cinco escenarios de US3, el aislamiento entre dos trabajadores y el bloqueo de vistas administrativas.

### Implementación de User Story 3

- [X] T043 [P] [US3] Crear `src/payroll.js` con `resolveWorkerSettlement({ entityId, purchaseInvoices, entities })` y `resolveAdminSettlements({ purchaseInvoices, entities, filters })` según `contracts/payroll-views.md`.
- [X] T044 [P] [US3] Crear `src/components/payroll-worker.js` que renderice la tarjeta de solo lectura con período, trabajador, RUT, monto, estado, fecha de pago y estado vacío.
- [X] T045 [US3] Reemplazar el contenido de `#view-payroll-worker` en `index.html` con el marcado de `src/components/payroll-worker.js` (`payroll-worker-card`, `payroll-worker-period`, `payroll-worker-name`, `payroll-worker-rut`, `payroll-worker-amount`, `payroll-worker-status`, `payroll-worker-paid-at`, `payroll-worker-empty`, `payroll-worker-warning`).
- [X] T046 [US3] Integrar `#view-payroll-worker` en `src/app.js`: mostrar solo con rol `trabajador`, resolver la liquidación por `session.entityId` y no renderizar botones de edición, eliminación ni creación.
- [X] T047 [US3] Manejar en `src/app.js` y `src/components/payroll-worker.js` el vínculo roto o el `entityId` inválido: cerrar la sesión, volver al login, mostrar un mensaje claro y registrar la notificación al desarrollador.

**Checkpoint**: el trabajador tiene su apartado exclusivo y aislado.

---

## Phase 7: User Story 4 - Ver y editar las liquidaciones de todos (Priority: P2)

**Goal**: el administrador lista, filtra y edita las liquidaciones de todos los trabajadores con el formulario de factura de compra y asocia cada RUT con su acceso.

**Independent Test**: con liquidaciones de dos trabajadores, el administrador las ve, filtra, edita una, asocia un acceso y el cambio se refleja en la vista del trabajador correspondiente.

### Pruebas de User Story 4

- [X] T048 [P] [US4] Crear `tests/integration/payroll-admin.test.js` que cubra los seis escenarios de US4, los filtros, la edición válida, el rechazo de una edición inválida, la asociación RUT↔acceso y la reflexión del cambio en la vista del trabajador.

### Implementación de User Story 4

- [X] T049 [P] [US4] Crear `src/components/payroll-list.js` con la tabla de liquidaciones (trabajador, RUT, período, monto, estado, fecha de pago, acción Editar) y los filtros `payroll-filter-worker` y `payroll-filter-period`.
- [X] T050 [P] [US4] Crear `src/components/payroll-form.js` que reutilice `src/components/invoice-purchase-form.js` para editar período, monto, estado, fechas y datos de pago, respetando las validaciones y el ciclo de vida de `001`.
- [X] T051 [US4] Reemplazar el contenido de `#view-payroll-admin` en `index.html` con el marcado de `src/components/payroll-list.js` y `src/components/payroll-form.js` (`payroll-admin-list`, `payroll-admin-empty`, `payroll-form`, `payroll-form-submit`, `payroll-form-errors`).
- [X] T052 [US4] Integrar `#view-payroll-admin` en `src/app.js`: renderizar la lista completa, aplicar filtros en memoria, cargar la liquidación en el formulario y guardar con `updateDocument` sobre `erp.purchaseInvoices`.
- [X] T053 [US4] Implementar en `src/components/payroll-list.js` la acción para asociar la liquidación con un acceso de trabajador activo cuyo RUT coincida, o para crear el acceso desde la vista de liquidaciones; reflejar la asociación en `AccessRecord.entityId` y mostrar el error cuando el RUT no coincida.
- [X] T054 [US4] Mostrar en `src/components/payroll-list.js` una advertencia cuando el RUT del tercero no tenga un acceso de trabajador activo asociado, y explicar cómo corregirlo desde Acciones o desde la factura de compra.
- [X] T055 [US4] Verificar en `src/app.js` que, tras guardar una edición, el refresco de `#view-payroll-worker` del trabajador correspondiente refleje el cambio sin reiniciar la aplicación.
- [X] T056 [US4] Implementar en `src/components/payroll-form.js` la bandera `dirty` y exponerla para que el cierre de sesión pueda pedir confirmación.

**Checkpoint**: administrador y trabajador ven la misma fuente de verdad con permisos distintos.

---

## Phase 8: User Story 6 - Cerrar sesión, notificar incidencias y usar datos de demostración (Priority: P3)

**Goal**: cierre de sesión seguro, registro visible de incidencias para el desarrollador y datos ficticios idempotentes con credenciales documentadas.

**Independent Test**: iniciar sesión, cerrar sesión y comprobar que se vuelve al login; cerrar la pestaña y comprobar que no se recupera la sesión; cargar la demostración y entrar con los RUT ficticios.

### Pruebas de User Story 6

- [X] T057 [P] [US6] Crear `tests/integration/session-lifecycle.test.js` con recarga que conserva la sesión, cierre de sesión que la elimina, cierre de pestaña simulado que la descarta y confirmación por cambios sin guardar.
- [X] T058 [P] [US6] Crear `tests/integration/dev-notifications.test.js` con registro de RUT inválido, no registrado, inactivo, duplicado y vínculo roto, ausencia de registro por contraseña incorrecta, emisión de `console.error`, panel solo para administrador y limpieza con confirmación.
- [X] T059 [P] [US6] Extender `tests/integration/demo-data.test.js` para verificar un administrador, dos trabajadores, terceros personales, liquidaciones, credenciales documentadas y carga idempotente sin duplicados.

### Implementación de User Story 6

- [X] T060 [P] [US6] Crear `src/components/dev-notifications.js` con el panel de avisos (fecha, RUT intentado, rol, motivo, origen) y el botón `dev-notifications-clear` con confirmación.
- [X] T061 [US6] Reemplazar el contenido de `#view-dev-notifications` en `index.html` y agregar su botón de navegación en `src/components/shell.js`, visible solo para administradores.
- [X] T062 [US6] Agregar en `src/components/shell.js` y `src/app.js` el botón y el flujo de cierre de sesión: consultar las banderas `dirty` de los formularios, confirmar si hay cambios sin guardar, llamar a `clearSession`, ocultar el espacio de trabajo y volver a `#view-login`.
- [X] T063 [US6] Extender `src/demo-data.js` con los accesos de demostración (`11.111.111-1` / `1111`, `22.222.222-2` / `2222`, `45.000.000-5` / `4500`), sus terceros personales y una liquidación por trabajador, manteniendo la carga idempotente y conservando lo existente.
- [X] T064 [US6] Conectar en `src/components/login.js` y `src/app.js` el botón “Cargar datos de demostración” del login, el mensaje de “no hay accesos registrados” y el estado de carga (`demo-status`).
- [X] T065 [US6] Mostrar en `src/components/login.js`, `src/components/payroll-worker.js`, `src/components/access-admin.js` y `src/components/invoice-status-notice.js` la advertencia de que el control es una restricción de interfaz, que los datos viven en el navegador y que no deben usarse datos reales.

**Checkpoint**: todas las historias funcionan y la demostración es reproducible sin datos reales.

---

## Phase 9: Polish y preocupaciones transversales

**Propósito**: documentación, limpieza y verificación final.

- [X] T066 [P] Actualizar `README.md` con los RUT y contraseñas de demostración, la advertencia de que el control de acceso es solo de interfaz y la prohibición de usar datos reales.
- [X] T067 [P] Actualizar `specs/001-erp-base-module/plan.md` y `specs/001-erp-base-module/data-model.md` con una nota de que `002` supersede el almacenamiento único por las colecciones separadas.
- [X] T068 [P] Revisar `src/app.js`, `src/storage.js`, `src/components/shell.js` e `index.html` para eliminar referencias muertas a `erp.documents`, `#view-documents`, `#nav-documents` y `#qa-new-document`, y confirmar que no quedan escrituras a la colección legada después de la migración.
- [X] T069 [P] Revisar accesibilidad y consistencia en `index.html` y `src/styles.css`: `role="alert"` en errores, etiquetas asociadas, estados vacíos, tablas con `thead`/`tbody` y navegación por teclado.
- [X] T070 Verificar en `src/app.js` y `src/payroll.js` que la pantalla de acceso aparece en menos de 1 segundo, la autenticación y resolución de liquidación responden en menos de 100 ms y los listados se renderizan en menos de 200 ms con los volúmenes del MVP; registrar la medición.
- [X] T071 Ejecutar `npm run check` (lint + formato + pruebas) sobre `src/` y `tests/` y corregir cualquier fallo en `src/app.js`, `src/storage.js`, `src/payroll.js`, `src/components/` o `tests/unit/` y `tests/integration/`.
- [X] T072 Ejecutar los nueve escenarios manuales de `specs/002-payroll-access-control/quickstart.md` y registrar el resultado de cada uno.
- [X] T073 Verificar que la demostración no contiene datos reales y que `README.md`, la pantalla de acceso y las vistas de liquidación muestran la advertencia de seguridad.

---

## Dependencies & Execution Order

### Dependencias por fase

- **Setup (Phase 1)**: sin dependencias; puede comenzar de inmediato.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias. Las pruebas T005–T009 se escriben antes que T010–T017.
- **User Stories (Phase 3+)**: dependen de Foundational.
- **Polish (Phase 9)**: depende de las historias que se quieran entregar.
- **Revisión (Phase 10)**: depende de Foundational y de las historias US1/US2/US4/US5/US6 que se estén corrigiendo; agrupa pruebas primero y luego las correcciones de implementación y documentación.

### Dependencias entre historias

- **US1 (P1)**: depende de Foundational. Es la puerta de entrada del resto.
- **US2 (P1)**: depende de US1 para existir una sesión de administrador; reutiliza `access-storage.js` y `auth.js`.
- **US5 (P1)**: depende solo de Foundational; puede ejecutarse en paralelo con US2 y es requisito de US4 por `invoice-purchase-form.js`.
- **US3 (P2)**: depende de US1 y de la separación física de Foundational; puede probarse con accesos y compras creados por API.
- **US4 (P2)**: depende de US3 por `src/payroll.js` y de US5 por `src/components/invoice-purchase-form.js`.
- **US6 (P3)**: depende de US1 (cierre de sesión), de US2/US4 (banderas `dirty`) y de `access-storage.js` (notificaciones y demostración).
- **US7 (P1)**: depende de US1 y US2 para la sesión y la creación del acceso de finanzas; puede ejecutarse en paralelo con US5 tras Foundational. Corrige la matriz de permisos y la visibilidad de módulos.

### Orden recomendado

```text
Setup → Foundational → US1 → US2 → US5 → US3 → US4 → US6 → Polish → Revisión (Phase 10)
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
- Revisión (Phase 10): T079–T088 en paralelo por archivos distintos; T089–T090, T098–T101 y T102–T105 son secuenciales por solapamiento de archivos; T106–T109 se ejecutan después de las correcciones de US1/US2/US7.

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
- Phase 10 conserva T001–T078 tal cual; cuando una tarea antigua contradice la revisión, la nueva tarea incluye una nota `corrige T0xx`.
- El MVP corregido exige US1 sin invitado y US7 con el rol finanzas antes de dar por terminada la revisión.



## Revisión de HU1 del 2026-11-17

- [X] T074 [US1] Adaptar `src/auth.js` y sus pruebas para reconocer el rol del acceso registrado a partir de RUT y contraseña, conservando los rechazos y notificaciones existentes.
- [X] T075 [US1] Rediseñar `src/components/login.js`, `index.html` y `src/styles.css` con tarjeta centrada, dos campos, dos acciones, aviso académico y lateral oculto sin columna reservada.
- [X] T076 [US1] Mostrar el rol en la cabecera y colocar `nav-login` / `nav-logout` al final del lateral; conservar destinos, funciones y permisos por rol en `src/components/shell.js` y `src/app.js`.
- [X] T077 [US1] Conservar la carga de demostración en el panel de invitado, documentar sus credenciales y actualizar los contratos e instrucciones de uso.
- [X] T078 [US1] Ejecutar pruebas de acceso y sesión, verificaciones completas y build; registrar cualquier limitación de verificación visual.

---

## Phase 10: Revisión de seguridad y privacidad (correcciones pendientes)

**Propósito**: eliminar el modo invitado, incorporar el rol `finanzas`, mover la carga de demostración a la pantalla de acceso, corregir los RUT de demostración y documentar los riesgos conocidos.

**⚠️ Conservación**: T001–T078 se mantienen con su ID y estado. Las tareas antiguas que contradicen la revisión se corrigen con nuevas tareas T079 en adelante; no se renumera ni se desmarca ninguna.

### Pruebas de la revisión (TDD — escribir primero; deben fallar)

> **NOTA**: ejecutar estas pruebas antes de las correcciones de implementación y confirmar que fallan por las condiciones nuevas.

- [ ] T079 [P] [US1] Crear `tests/integration/no-guest-access.test.js` para verificar que no existen `login-guest`, `nav-login`, `dashboard-guest-note` ni `Rol: Invitado`, que `canAccess`/`resolveRoute` no aceptan `invitado`, y que toda vista distinta de `login` sin sesión redirige a `login` sin exponer datos; retirar `tests/integration/optional-login.test.js`. Nota: corrige T019, T020, T021, T074 y T077, que conservan el modo invitado.
- [ ] T080 [P] [US1] Actualizar `tests/integration/login-roles.test.js` para esperar `login-submit` y `login-demo-load` en lugar de `login-guest`, cubrir administrador, finanzas y trabajador, y comprobar que no hay selector de rol. Nota: corrige T019 y T075.
- [ ] T081 [P] [US6] Crear `tests/unit/demo-data-ruts.test.js` con administrador `88.888.888-8`/`8888`, finanzas `55.555.555-5`/`5555`, trabajadores `22.222.222-2`/`2222` y `45.000.000-0`/`4500`, administrador distinto de todo `taxId` de entidades, ausencia de `11.111.111-1` y `45.000.000-5`, e idempotencia. Nota: corrige T059 y T063.
- [ ] T082 [P] [US6] Crear `tests/integration/demo-from-login.test.js` para pulsar `login-demo-load` desde `view-login`, comprobar que se permanece en el acceso, que `loadSession()` es `null`, que el lateral sigue oculto y que no se muestran datos de negocio; después probar los cuatro RUT. Nota: corrige T064 y T077, que cargaban la demostración desde el panel de invitado.
- [ ] T083 [P] [US2] Crear `tests/unit/finanzas-role.test.js` para verificar que `ROLES` incluye `finanzas`, que `validateAccessRecord` lo acepta sin `entityId` y lo rechaza con `entityId`, que `initialPassword('55.555.555-5')` es `5555`, y que `authenticate` e `isSessionValid` lo reconocen. Nota: corrige T001, T007, T013 y T014.
- [ ] T084 [P] [US7] Crear `tests/integration/finanzas-permissions.test.js` para entrar con `55.555.555-5`, comprobar exactamente los módulos permitidos y denegados de `contracts/payroll-views.md`, editar terceros, facturas, liquidaciones, movimientos y flujo de caja, y bloquear `access`, `dev-notifications` y `payroll-worker`. Nota: nuevo US7 derivado de FR-036 y FR-037.
- [ ] T085 [P] [US7] Actualizar `tests/integration/payroll-admin.test.js` para ejecutar lista, filtros y edición también con sesión de finanzas, y verificar que la acción de asociar un acceso con el RUT quede restringida a administrador. Nota: corrige T048 y T053, que solo consideraban al administrador.
- [ ] T086 [P] [US2] Crear `tests/integration/access-admin-finanzas.test.js` para que el administrador cree un acceso de finanzas desde `#access-role` sin `#access-entity`, verificar la lista con el rol y comprobar que finanzas no puede abrir `view-access`. Nota: corrige T025, T026 y T027, cuyo selector solo ofrecía trabajador y administrador.
- [ ] T087 [P] [US6] Crear `tests/integration/security-warnings.test.js` para verificar en `login-warning`, `access-warning`, `payroll-worker` y `README.md` los textos sobre control solo de interfaz, contraseña inicial sin cambio y prohibición de datos reales. Nota: corrige T065, T066 y T073, que no documentaban el riesgo de contraseña inmutable.
- [ ] T088 [P] [US6] Actualizar `tests/integration/demo-data.test.js` con los cuatro accesos, las credenciales revisadas, la carga desde `login-demo-load`, la idempotencia y la comprobación de que el RUT del administrador no coincide con terceros. Nota: corrige T059 y T063.
- [ ] T089 [US1] Actualizar `tests/setup/domFixture.js`, `tests/unit/auth.test.js`, `tests/unit/access-storage.test.js`, `tests/unit/session.test.js`, `tests/unit/payroll.test.js` y `tests/integration/session-lifecycle.test.js` para sustituir `11.111.111-1`/`1111` por `88.888.888-8`/`8888`, `45.000.000-5` por `45.000.000-0` y agregar una fixture de sesión de finanzas. Nota: corrige T063 y las fixtures derivadas de T006/T014.
- [ ] T090 [US7] Actualizar `tests/integration/us3-dashboard.test.js` para retirar expectativas sobre `qa-load-demo` y `dashboard-guest-note`, y verificar que `qa-new-payroll` aparece para administrador y finanzas. Nota: corrige T039, T064 y T077.

### Correcciones de US1: acceso obligatorio y demostración en el acceso

- [ ] T091 [US1] Eliminar `GUEST_ROLE`, `createGuestSession` e `isGuestSession` de `src/session.js` y hacer que `isSessionValid` rechace cualquier sesión sin un acceso registrado válido. Nota: corrige T006, T014 y T074.
- [ ] T092 [US1] Reescribir `src/components/login.js` para eliminar `login-guest`, agregar `login-demo-load` y `demo-status`, actualizar `login-no-accesses` con «Cargar demostración» y ampliar `login-warning` con el riesgo de contraseña inicial sin cambio. Nota: corrige T020, T021 y T077.
- [ ] T093 [US1] Actualizar `index.html` para eliminar `nav-login` y `dashboard-guest-note`, dejando `#view-login` como única vista sin sesión y `#nav-logout` como acción de sesión. Nota: corrige T021, T061 y T075.
- [ ] T094 [US1] Actualizar `src/app.js` para eliminar importaciones y ramas de invitado, quitar la columna `invitado` de `ACCESS_MATRIX`, devolver `login` desde `canAccess`/`resolveRoute` sin sesión válida y limpiar la sesión en `showLogin`. Nota: corrige T016, T022 y T074.
- [ ] T095 [US1] Actualizar `src/components/shell.js` para eliminar `GUEST_MODULES`, `onLogin`, `isGuestSession`, la etiqueta `Rol: Invitado` y `nav-login`, dejando `nav-logout` como última opción para las tres sesiones válidas. Nota: corrige T017, T061 y T076.
- [ ] T096 [US1] Actualizar `src/components/dashboard.js` para eliminar `isGuestSession`, `dashboard-guest-note`, `qa-load-demo` y `onLoadDemoData`, y condicionar `qa-new-payroll` a las sesiones de administrador y finanzas. Nota: corrige T039, T064 y T077.
- [ ] T097 [US1] Actualizar `src/styles.css` para retirar los estilos de `#login-guest` y `dashboard-guest-note`, y agregar los estilos de `login-demo-load`, `demo-status` y `session-role`. Nota: corrige T003 y T075.

### Correcciones de US2: rol finanzas en la administración de accesos

- [ ] T098 [US2] Extender `src/module-config.js` con `finanzas` en `ROLES`, las credenciales de demostración `88.888.888-8`/`8888` y `55.555.555-5`/`5555`, y el RUT de trabajador canónico `45000000-0`. Nota: corrige T001 y T063.
- [ ] T099 [US2] Actualizar `src/auth.js` para aceptar `finanzas` en `validateAccessRecord`, exigir ausencia de `entityId` para administrador y finanzas, y ajustar el mensaje `ROLE_INVALID` a los tres roles. Nota: corrige T013 y T026.
- [ ] T100 [US2] Actualizar `src/components/access-admin.js` para ofrecer `finanzas` en `#access-role`, ocultar y limpiar `#access-entity` para roles sin tercero personal, y mostrar el rol en `#access-list`; conservar notificaciones y protección del último administrador. Nota: corrige T026 y T027.
- [ ] T101 [US2] Actualizar `index.html` para incluir la opción `finanzas` en el selector estático `#access-role`. Nota: corrige T027.

### Correcciones de US7: permisos de finanzas

- [ ] T102 [US7] Ampliar `ACCESS_MATRIX` y `resolveRoute` en `src/app.js` con la columna `finanzas` según `contracts/payroll-views.md`: facturación sí, `access`/`dev-notifications`/`payroll-worker` no, con redirección a `dashboard` o `payroll-admin` según el caso. Nota: nuevo US7; depende de T094.
- [ ] T103 [US7] Agregar `FINANCE_MODULES` en `src/components/shell.js` y la etiqueta `Rol: Finanzas`, sin `access`, `dev-notifications`, `payroll-worker` ni `nav-login`. Nota: nuevo US7; depende de T095.
- [ ] T104 [US7] Ajustar `src/components/payroll-list.js` y `src/app.js` para que finanzas vea, filtre y edite liquidaciones, mientras la acción de asociar un acceso por RUT quede restringida a administrador. Nota: corrige T053 y T055; nuevo US7.
- [ ] T105 [US7] Ajustar `src/components/invoice-status-notice.js` y `src/app.js` para que el aviso de migración y documentos no clasificados se muestre solo al administrador, no a finanzas. Nota: nuevo US7; cubre FR-028.

### Correcciones de US6: demostración y riesgos conocidos

- [ ] T106 [US6] Extender `src/demo-data.js` con el acceso de finanzas `55.555.555-5`/`5555`, actualizar el administrador a `88.888.888-8`/`8888`, mantener los trabajadores con `45.000.000-0` y hacer que `hasStoredRecords()` también revise `erp.accessRecords`. Nota: corrige T059 y T063.
- [ ] T107 [US6] Conectar en `src/components/login.js` y `src/app.js` el botón `login-demo-load` con `loadDemoData`, actualizar `demo-status`, permanecer en `#view-login`, no crear sesión ni abrir vistas y conservar la carga idempotente. Nota: corrige T064 y T077; depende de T092 y T094.
- [ ] T108 [US6] Actualizar `src/components/login.js`, `src/components/access-admin.js`, `src/components/payroll-worker.js` y `README.md` para documentar como riesgos conocidos la contraseña inicial inmutable y el control de acceso solo de interfaz, además de la prohibición de datos reales. Nota: corrige T065, T066 y T073.
- [ ] T109 [US6] Actualizar `README.md` con los cuatro RUT y contraseñas, la carga de demostración desde la pantalla de acceso, los permisos de finanzas y la nota de que T077 queda superada. Nota: corrige T066 y T077.

### Polish de la revisión

- [ ] T110 [P] Actualizar `specs/001-erp-base-module/contracts/navigation-and-access.md` para registrar que `002` reemplaza el ingreso opcional por acceso obligatorio con tres roles. Nota: corrige T067, que solo cubría el almacenamiento.
- [ ] T111 Ejecutar `npm run check`, `npm test -- --run` y `npm run build`; corregir fallos en `src/`, `tests/` y documentación derivados de T079–T110, y verificar los diez escenarios de `specs/002-payroll-access-control/quickstart.md` sin modo invitado. Nota: corrige T071, T072 y T078.

**Checkpoint de la revisión**: sin modo invitado, con demo cargable desde el acceso, tres roles con la matriz de `contracts/payroll-views.md`, riesgos documentados y pruebas T079–T090 ejecutadas antes de las correcciones.
