# Plan de Implementación: Acceso a liquidaciones de sueldo por RUT y contraseña

**Rama**: `002-payroll-access-control` | **Fecha**: 2026-11-11 | **Revisado**: 2026-11-17 (seguridad y privacidad) | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de funcionalidad desde `specs/002-payroll-access-control/spec.md`

## Resumen

La funcionalidad agrega una capa de acceso por rol sobre el módulo de facturación y pagos. Al abrir la aplicación se muestra una tarjeta centrada con RUT y contraseña; no existe modo invitado y toda vista del módulo exige sesión iniciada. La autenticación reconoce el rol del acceso registrado: `administrador` (RRHH), `finanzas` o `trabajador`. El lateral se oculta en el acceso; dentro del ERP, la cabecera muestra el rol y «Cerrar sesión» es la última opción del lateral para los tres roles. Los accesos los administra el administrador, que puede crear accesos de rol finanzas; todo acceso nuevo usa como contraseña inicial los primeros 4 dígitos del RUT. El trabajador ve solo su propia liquidación vigente, en modo solo lectura. Finanzas ve y edita toda la facturación (terceros, facturas de venta y compra, liquidaciones, movimientos, flujo de caja, seguimiento y búsqueda), sin gestionar accesos ni ver avisos del desarrollador. El administrador conserva todas las funciones, accesos y avisos incluidos, y asocia cada RUT con su acceso de trabajador. En un navegador vacío se usa «Cargar demostración» desde la pantalla de acceso, sin abrir vistas ni iniciar sesión.

La liquidación no se almacena como entidad nueva: se reutiliza la factura de compra dirigida a un tercero de tipo personal (`tipoFactura = compra`, `tipoTercero = personal`, `entity_id`). Las facturas de venta y de compra se separan físicamente en colecciones distintas del almacenamiento del navegador y visualmente en vistas, formularios y listados independientes. La sesión vive en `sessionStorage`, por lo que se conserva al recargar la pestaña y termina al cerrarla o al cerrar sesión. Los intentos inválidos, duplicados, inactivos o con vínculo roto se registran como notificaciones para el desarrollador, visibles solo para el administrador. La contraseña inicial sin cambio y el control de acceso solo de interfaz se documentan como riesgos conocidos del MVP; el RUT de demostración del administrador (`88.888.888-8`) no coincide con ningún tercero y el de finanzas es `55.555.555-5`.

**Enfoque técnico**: se mantiene el stack actual: Vite, JavaScript ES modules, `localStorage`/`sessionStorage` y Vitest, sin backend ni ramas nuevas. Se agregan módulos de autenticación, sesión, almacenamiento de accesos, guardas de rol y componentes de acceso, administración de accesos y liquidaciones. La pantalla de acceso incorpora «Cargar demostración» como acción previa a la autenticación. Se modifica `storage.js` para separar las facturas en dos colecciones y migrar los datos previos. Se conserva el ciclo de vida, las validaciones y los movimientos financieros existentes.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES modules), HTML5 y CSS. Tooling sobre Node.js; Vite 8.

**Dependencias principales**: Vite 8.2.1, Vitest 4.1.10, jsdom 30, ESLint 8.57 y Prettier 3.2.5. Sin dependencias de runtime ni backend.

**Almacenamiento**: `localStorage` para datos de dominio y `sessionStorage` para la sesión. Claves nuevas propuestas:
- `erp.entities` (existente)
- `erp.salesInvoices` (facturas de venta)
- `erp.purchaseInvoices` (facturas de compra y liquidaciones)
- `erp.unclassifiedDocuments` (documentos legados sin `tipoFactura`, solo migración)
- `erp.accessRecords` (accesos por RUT)
- `erp.devNotifications` (incidencias para el desarrollador)
- `erp.movements` (existente)
- `erp.schemaVersion` (se eleva a `2.0.0`)
- `sessionStorage: erp.session` (sesión activa)

**Pruebas**: Vitest con jsdom. Pruebas unitarias para normalización de RUT, contraseña inicial, autenticación, sesión, almacenamiento de accesos, resolución de liquidaciones y separación de colecciones. Pruebas de integración para login por rol, administración de accesos, vista del trabajador, edición por administrador y finanzas, cierre de sesión, notificaciones al desarrollador, migración y separación visual/física. Se agregan casos explícitos para: ausencia de modo invitado y redirección de vistas sin sesión, carga de demostración desde el acceso con los RUT `88.888.888-8` y `55.555.555-5`, administrador con RUT distinto de los terceros, bloqueo de accesos y avisos para finanzas, efecto inmediato de cambios de estado/contraseña en el siguiente login, mismo folio permitido entre venta y compra, y emisión de `console.error` en las notificaciones al desarrollador. Las pruebas e2e siguen fuera del MVP, como desviación ya registrada en `001`.

**Plataforma objetivo**: navegadores modernos de escritorio y móvil; aplicación estática servida por Vite en desarrollo y `vite preview` para validación.

**Tipo de proyecto**: aplicación web frontend de un solo proyecto.

**Objetivos de rendimiento**: la pantalla de acceso aparece en menos de 1 segundo; la validación de credenciales y la resolución de la liquidación responden en menos de 100 ms con los volúmenes del MVP; los listados se renderizan en menos de 200 ms.

**Restricciones**: solo frontend, sin backend ni cifrado; se mantiene el stack Vite/JavaScript/`localStorage`/`sessionStorage`/Vitest y la rama `002-payroll-access-control`, sin crear ramas nuevas. El control de acceso es una restricción de interfaz, no seguridad real; la contraseña inicial derivada del RUT no se cambia en el MVP: ambos son riesgos conocidos documentados. Datos solo en el navegador; interfaz en español; no se usan datos reales; la sesión debe terminar al cerrar la pestaña.

**Escala/Alcance**: un módulo, tres roles (`administrador`, `finanzas`, `trabajador`), dos tipos de factura, un administrador o unos pocos accesos de RRHH y finanzas, decenas de trabajadores y cientos de facturas. Cada trabajador ve una sola liquidación vigente.

## Verificación de la Constitución

*PUERTA: debe pasar antes de la Fase 0 y revalidarse después del diseño de la Fase 1.*

| Principio | Evaluación | Evidencia del plan |
|---|---|---|
| **I. Calidad y mantenibilidad del código** | Cumple | La lógica de RUT, contraseña y autenticación se aísla en `src/auth.js`; la sesión en `src/session.js`; la persistencia de accesos en `src/access-storage.js`; las guardas por rol en `src/app.js`; la UI se divide en componentes pequeños (`login`, `access-admin`, `payroll-list`, `payroll-form`, `payroll-worker`). La carga de demostración se concentra en `demo-data.js`. No se introducen abstracciones sin necesidad. |
| **II. Pruebas primero y verificación** | Cumple con desviación heredada | Se agregan pruebas unitarias y de integración para cada flujo crítico, incluidos los tres roles, la ausencia de invitado, la carga de demostración y los riesgos documentados. Las pruebas e2e siguen fuera del MVP por limitación del template (solo Vitest/jsdom); la desviación ya está registrada en `001` y se mantiene explícita. |
| **III. Consistencia de la experiencia de usuario** | Cumple | Se reutilizan los patrones existentes de formularios, listados, estados vacíos, mensajes de validación y navegación. El acceso, los estados vacíos y los errores tienen mensajes claros en español. «Cargar demostración» mantiene al usuario en el acceso; la navegación se adapta a administrador, finanzas o trabajador sin romper el marco visual. |
| **IV. Rendimiento y confiabilidad** | Cumple | Todo el acceso a datos es local y síncrono; no hay viajes de red. Las colecciones se leen una vez por refresco y los volúmenes del MVP son acotados. La migración y la carga de demostración son idempotentes y no bloquean la interfaz. |

**Resultado de la puerta**: PASA. No hay violaciones nuevas. La única desviación es la ausencia de pruebas e2e, ya registrada y justificada en `001`.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-payroll-access-control/
├── plan.md              # Este archivo
├── spec.md              # Especificación funcional
├── research.md          # Fase 0: decisiones e incógnitas resueltas
├── data-model.md        # Fase 1: entidades, campos y relaciones
├── quickstart.md        # Fase 1: guía de validación ejecutable
├── contracts/           # Fase 1: contratos de almacenamiento y UI
│   ├── access-and-session.md
│   ├── payroll-views.md
│   └── invoice-separation.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit.tasks; no se crea aquí)
```

### Código fuente (raíz del repositorio)

```text
index.html                         # login, mi liquidación, accesos, avisos, vistas de factura
src/
├── main.js                        # punto de entrada
├── app.js                         # rutas, guardas de rol y coordinación de vistas
├── auth.js                        # normalización de RUT, contraseña inicial, autenticación
├── access-storage.js              # CRUD de accesos y notificaciones al desarrollador
├── payroll.js                     # resolución de liquidación vigente y listado del administrador
├── session.js                     # sesión en sessionStorage
├── storage.js                     # colecciones separadas de facturas + migración
├── validation.js                  # validaciones existentes (RUT, factura, tercero)
├── module-config.js               # roles, etiquetas, reglas y credenciales de demostración
├── demo-data.js                   # accesos de RRHH, finanzas y trabajadores; terceros y liquidaciones ficticias
├── movements.js                   # movimientos financieros (sin cambios de contrato)
├── tracking.js                    # seguimiento (sin cambios de contrato)
├── search.js                      # búsqueda sobre las colecciones unificadas
├── utils.js                       # utilidades existentes
├── styles.css                     # estilos de login, roles, avisos y separación visual
└── components/
    ├── shell.js                   # navegación por rol
    ├── login.js                   # pantalla de acceso con RUT, contraseña y «Cargar demostración»; sin invitado
    ├── access-admin.js            # creación, activación, desactivación y lista de accesos
    ├── dev-notifications.js       # registro local de incidencias para el desarrollador
    ├── payroll-list.js            # listado de liquidaciones para el administrador
    ├── payroll-form.js            # edición de liquidación sobre el formulario de compra
    ├── payroll-worker.js          # apartado exclusivo del trabajador
    ├── invoice-status-notice.js   # aviso de migración fallida y documentos no clasificados
    ├── invoice-form.js            # fábrica compartida de formularios de factura
    ├── invoice-sale-form.js       # formulario de factura de venta
    ├── invoice-purchase-form.js   # formulario de factura de compra
    ├── invoice-list.js            # listado compartido de facturas
    ├── invoice-sale-list.js       # listado de factura de venta
    ├── invoice-purchase-list.js   # listado de factura de compra
    ├── dashboard.js               # panel del administrador
    ├── entity-form.js             # formulario de terceros
    ├── entity-list.js             # listado de terceros
    ├── search-bar.js              # búsqueda
    └── tracking.js                # seguimiento

tests/
├── unit/
│   ├── auth.test.js
│   ├── session.test.js
│   ├── access-storage.test.js
│   ├── payroll.test.js
│   ├── invoice-storage-separation.test.js
│   └── ... (pruebas existentes)
├── integration/
│   ├── login-roles.test.js
│   ├── access-admin.test.js
│   ├── payroll-worker.test.js
│   ├── payroll-admin.test.js
│   ├── session-lifecycle.test.js
│   ├── dev-notifications.test.js
│   ├── invoice-separation.test.js
│   ├── invoice-migration.test.js
│   └── ... (pruebas existentes)
└── setup/
```

**Decisión de estructura**: se mantiene la aplicación Vite de un solo proyecto y la separación por responsabilidades ya usada en `001`. La lógica de autenticación y sesión se mantiene fuera de los componentes para poder probarla sin DOM. Los componentes de liquidación reutilizan las fábricas de formulario y listado de facturas para no duplicar validaciones ni columnas. La separación física se concentra en `storage.js` para que el resto de la aplicación siga leyendo una vista unificada cuando necesite buscar, calcular seguimiento o generar movimientos.

**Dependencia con `001`.** La revisión 4 de `001` definió dos vistas de factura, pero el código actual todavía usa `#view-documents` y `src/components/document-form.js`/`document-list.js`. Esta funcionalidad absorbe esa separación visual pendiente y la completa con la separación física; por eso el plan incluye `invoice-form.js`, `invoice-sale-form.js`, `invoice-purchase-form.js`, `invoice-list.js`, `invoice-sale-list.js` e `invoice-purchase-list.js` como archivos nuevos que reemplazan los componentes genéricos. También actualiza `index.html`, `src/app.js`, `src/components/shell.js` y las pruebas que hoy dependen de la vista genérica.

## Fases de Diseño

### Fase 0: Investigación

Se resuelven en `research.md`:
- Cómo normalizar y comparar RUT chilenos con el validador existente.
- Cómo derivar la contraseña inicial y qué hacer con el dígito verificador.
- Cómo modelar el acceso sin crear una entidad de liquidación.
- Cómo garantizar una única liquidación por trabajador sin una tabla nueva.
- Cómo implementar la separación física de facturas y la migración desde `erp.documents`.
- Cómo aislar la sesión para que termine al cerrar la pestaña.
- Cómo registrar notificaciones al desarrollador sin backend.
- Cómo aplicar guardas de tres roles sin duplicar la navegación y sin permitir vistas sin sesión.
- Cómo cargar la demostración desde el acceso sin reintroducir el modo invitado.
- Cómo mantener el RUT de demostración del administrador distinto de los terceros y documentar los riesgos conocidos.

### Fase 1: Diseño y contratos

- `data-model.md`: `AccessRecord`, `Session`, `DevNotification`, proyección `PayrollSettlement`, `SaleInvoice`, `PurchaseInvoice`, `Entity`, `Movement` y reglas de migración.
- `contracts/access-and-session.md`: contrato de almacenamiento de accesos, contraseña inicial, sesión, acceso obligatorio, carga de demostración y notificaciones solo para administrador.
- `contracts/payroll-views.md`: contrato de las vistas del trabajador, administrador y finanzas, matriz de guardas, filtros, acciones permitidas y asociación RUT↔acceso.
- `contracts/invoice-separation.md`: contrato de colecciones separadas, migración, proyección visual y aviso de migración fallida/documentos no clasificados.
- `quickstart.md`: pasos para ejecutar la aplicación, cargar la demostración y validar cada historia.

**Estado sucio**: el formulario de liquidación y el de accesos exponen una bandera `dirty` que el cierre de sesión consulta para pedir confirmación.

## Seguimiento de Complejidad

| Desviación | Por qué es necesaria | Alternativa simple rechazada |
|---|---|---|
| Pruebas e2e fuera del MVP | El template solo incluye Vitest con jsdom; no hay infraestructura de navegador ni presupuesto para agregarla. La cobertura crítica se concentra en pruebas de integración con DOM simulado. | Agregar Playwright/Cypress: aumenta dependencias, tiempo de ejecución y mantenimiento sin cambiar el valor del MVP. Desviación ya registrada en `001` y confirmación del profesor pendiente. |
| Migración de `erp.documents` a dos colecciones | El requisito del usuario exige separación física; los datos previos de la aplicación usan una colección única. Sin migración se perderían facturas o se mezclarían tipos. | Mantener una sola colección y separar solo por filtro: incumple el requisito explícito de separación física. |
| Contraseña inicial sin cambio y sin cifrado | El MVP es solo frontend y el control es de interfaz; no hay backend ni gestión de secretos. La regla de los primeros 4 dígitos del RUT es pedida para la demostración. Se documenta como riesgo conocido y se prohíbe el uso con datos reales. | Forzar cambio de contraseña o implementar hash: agrega flujo e infraestructura fuera del alcance y daría una falsa sensación de seguridad sin backend. |
| Sin modo invitado, con demostración desde el acceso | El feedback de privacidad exige sesión para toda vista, pero el navegador vacío necesita datos para probar los roles. «Cargar demostración» siembra datos sin abrir vistas ni crear sesión. | Conservar el invitado o auto-sembrar datos: reintroduce acceso sin credenciales u oculta el origen de los datos. |
| Rol `finanzas` sin permisos de administración | Finanzas necesita toda la facturación, pero no accesos ni avisos del desarrollador; el administrador conserva esas funciones. | Un único rol administrativo: viola la separación pedida y expondría gestión de accesos a finanzas. |

## Puertas de Calidad

Antes de cerrar cualquier historia:

1. Ejecutar `npm run lint` y corregir los errores.
2. Ejecutar `npm run format:check` o `npm run format`.
3. Ejecutar `npm test -- --run` y verificar que las pruebas nuevas y existentes pasan.
4. Verificar manualmente el flujo de acceso, carga de demostración desde el login, cierre de sesión, cierre de pestaña, vista del trabajador, edición del administrador y de finanzas, bloqueo de accesos y avisos para finanzas, y migración.
5. Confirmar que ninguna vista es accesible sin sesión y que no queda ninguna opción de invitado.
6. Confirmar que el RUT de demostración del administrador (`88.888.888-8`) no coincide con terceros y que finanzas usa `55.555.555-5`.
7. Confirmar que ningún dato real ni credencial real se usa en la demostración.
8. Actualizar `README.md` con los RUT y contraseñas de demostración, la advertencia de seguridad, la contraseña inicial sin cambio y el control de acceso solo de interfaz como riesgos conocidos.

## Reverificación post-diseño (Fase 1)

Tras completar `data-model.md`, `contracts/` y `quickstart.md`:

- La separación física no cambia las reglas de validación ni el ciclo de vida de las facturas; solo cambia la ubicación de almacenamiento y la migración.
- La liquidación sigue siendo una proyección de la factura de compra a personal; no se duplica el modelo.
- La sesión en `sessionStorage` cumple el cierre por pestaña sin afectar la recarga.
- Las guardas de rol se concentran en `app.js` y en la navegación de `shell.js`, con pruebas de integración para administrador, finanzas y trabajador, y sin vistas accesibles sin sesión.
- La carga de demostración no crea sesión ni expone datos de negocio antes del login; el RUT del administrador es distinto de los terceros.
- Los riesgos conocidos (contraseña inicial sin cambio y control solo de interfaz) quedan documentados en `spec.md`, `research.md`, contratos y `README.md`.
- No aparecen violaciones nuevas a la Constitución. Se mantiene la desviación de pruebas e2e.
