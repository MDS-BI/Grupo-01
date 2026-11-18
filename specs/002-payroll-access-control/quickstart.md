# Quickstart: Acceso a liquidaciones de sueldo por RUT y contraseña

**Funcionalidad**: `002-payroll-access-control` · **Fecha**: 2026-11-11 · **Revisado**: 2026-11-17
**Relacionado con**: `spec.md`, `plan.md`, `data-model.md` y `contracts/`

## 1. Requisitos previos

- Node.js y npm instalados.
- Dependencias del proyecto instaladas.
- Navegador moderno con `localStorage` y `sessionStorage`.
- No se requieren datos reales, backend ni servicios externos.

## 2. Instalación y ejecución

```bash
npm install
npm run dev
```

Abrir la URL que muestra Vite (por defecto `http://localhost:5173`).

Para validar la compilación de producción:

```bash
npm run build
npm run preview
```

## 3. Verificación automatizada

```bash
npm run lint
npm run format:check
npm test -- --run
```

**Resultado esperado**: lint sin errores, formato correcto y todas las pruebas unitarias y de integración pasan.

Pruebas nuevas esperadas:

- `tests/unit/auth.test.js`
- `tests/unit/session.test.js`
- `tests/unit/access-storage.test.js`
- `tests/unit/payroll.test.js`
- `tests/unit/invoice-storage-separation.test.js`
- `tests/integration/login-roles.test.js`
- `tests/integration/demo-data.test.js`
- `tests/integration/role-guards.test.js`
- `tests/integration/access-admin.test.js`
- `tests/integration/payroll-worker.test.js`
- `tests/integration/payroll-admin.test.js`
- `tests/integration/session-lifecycle.test.js`
- `tests/integration/dev-notifications.test.js`
- `tests/integration/invoice-separation.test.js`
- `tests/integration/invoice-migration.test.js`

## 4. Datos de demostración

En un navegador sin datos, seleccionar **Cargar demostración** en la pantalla de acceso. La carga no inicia sesión ni abre vistas del módulo; después se prueba el RUT y la contraseña correspondientes.

| Rol | RUT | Contraseña inicial | Trabajador asociado |
|---|---|---|---|
| Administrador (RRHH) | `88.888.888-8` | `8888` | — |
| Finanzas | `55.555.555-5` | `5555` | — |
| Trabajador | `22.222.222-2` | `2222` | Ana Pérez Soto |
| Trabajador | `45.000.000-0` | `4500` | Bruno Soto Vega |

El RUT del administrador no coincide con el de ningún tercero. La demostración incluye además facturas de venta y de compra para comprobar la separación física y visual. Todos los datos son ficticios.

> **Advertencia**: el control de acceso es una restricción de interfaz sobre datos del navegador. No es seguridad real, no está cifrado y no debe usarse con datos reales. La contraseña inicial son los primeros 4 dígitos del RUT y no se puede cambiar en el MVP: ambos son riesgos conocidos documentados.

## 5. Escenarios de validación manual

### Escenario 1: login y roles

1. Abrir la aplicación en una pestaña nueva sin sesión.
2. Verificar que el acceso muestra la tarjeta centrada con RUT y contraseña, «Ingresar» y «Cargar demostración», sin opción de invitado, sin selector de rol y con el lateral oculto.
3. Pulsar «Cargar demostración» y comprobar que se permanece en el acceso, sin sesión ni datos de negocio visibles.
4. Ingresar `88.888.888-8` / `8888` y comprobar el Panel y «Rol: Administrador» en la cabecera.
5. Comprobar que «Cerrar sesión» es la última opción del lateral y utilizarla.
6. Ingresar `55.555.555-5` / `5555` y comprobar el Panel, «Rol: Finanzas», el acceso a la facturación y la ausencia de accesos y avisos del desarrollador.
7. Cerrar sesión, ingresar `22.222.222-2` / `2222` y comprobar Mi liquidación y «Rol: Trabajador».
8. Cerrar sesión e intentar abrir una vista del módulo por enlace directo; verificar que se vuelve al acceso.

**Resultado esperado**: cada rol llega a su vista, finanzas no ve administración ni avisos, y no se muestran datos antes de autenticar.

### Escenario 2: credenciales inválidas y rol registrado

1. En el acceso, ingresar un RUT inexistente con cualquier contraseña y verificar el rechazo.
2. Ingresar `22.222.222-2` con contraseña incorrecta y verificar el mensaje junto al formulario.
3. Ingresar `22.222.222-2` / `2222` y verificar que el sistema reconoce Trabajador sin un selector.
4. Repetir con el administrador y comprobar su rol en la cabecera.

**Resultado esperado**: las credenciales inválidas se rechazan; el RUT determina el rol del acceso registrado después de validar la contraseña. Las incidencias mantienen su registro local y la contraseña incorrecta no genera aviso al desarrollador.

### Escenario 3: administración de accesos

1. Entrar como administrador.
2. Abrir **Accesos**.
3. Crear un acceso de trabajador con un RUT nuevo y un tercero personal.
4. Crear un acceso de rol `finanzas` con un RUT nuevo y sin tercero personal.
5. Verificar que la contraseña inicial mostrada son los primeros 4 dígitos del RUT en ambos accesos.
6. Cerrar sesión e ingresar con el RUT del trabajador; comprobar que solo ve su liquidación.
7. Cerrar sesión e ingresar con el RUT de finanzas; comprobar que ve facturación y no ve accesos ni avisos.
8. Volver a entrar como administrador, desactivar el acceso del trabajador y probar su login.
9. Verificar que el acceso inactivo se rechaza y queda una notificación visible solo para el administrador.
10. Reactivar el acceso y verificar que vuelve a funcionar.
11. Intentar desactivar el último administrador activo y verificar que el sistema lo impide.

**Resultado esperado**: los accesos de trabajador y finanzas se crean, activan, desactivan y restablecen según las reglas; el administrador conserva la gestión de accesos y los avisos.

### Escenario 4: vista del trabajador

1. Entrar como `22.222.222-2` / `2222`.
2. Verificar que se muestra una sola liquidación: período, monto, estado y fecha de pago.
3. Verificar que no hay botones de edición, eliminación ni creación.
4. Cerrar sesión, entrar como `45.000.000-0` / `4500` y verificar que se muestra una liquidación distinta.
5. Verificar que no se ven datos del otro trabajador.

**Resultado esperado**: cada trabajador ve solo su liquidación vigente, en modo solo lectura.

### Escenario 5: edición del administrador y de finanzas

1. Entrar como administrador y abrir **Liquidaciones de sueldo**.
2. Verificar que aparecen las liquidaciones de ambos trabajadores con RUT, período, monto y estado.
3. Filtrar por trabajador y por período.
4. Editar una liquidación y guardar un cambio válido.
5. Cerrar sesión, entrar como el trabajador correspondiente y verificar el cambio.
6. Entrar como finanzas, editar otra liquidación y verificar que el cambio se refleja en la vista del trabajador.
7. Intentar guardar una edición inválida y verificar que se rechaza.
8. Verificar que finanzas no puede abrir **Accesos** ni **Avisos del desarrollador**.

**Resultado esperado**: administrador y finanzas ven y editan todas las liquidaciones, sin permisos de administración para finanzas, y los cambios se reflejan en la vista del trabajador.

### Escenario 6: sesión por pestaña

1. Entrar como cualquier rol.
2. Recargar la página y verificar que la sesión se conserva.
3. Cerrar sesión y verificar que se vuelve al acceso.
4. Volver a entrar, cerrar la pestaña y abrir una pestaña nueva con la aplicación.
5. Verificar que se pide el RUT nuevamente.

**Resultado esperado**: la recarga conserva la sesión; el cierre de sesión y el cierre de pestaña la terminan.

### Escenario 7: separación física y visual de facturas

1. Entrar como administrador.
2. Abrir **Facturas de venta** y verificar que solo aparecen facturas de venta, con sus columnas.
3. Abrir **Facturas de compra** y verificar que solo aparecen facturas de compra, con centro de costo y período.
4. Verificar que no existe una vista genérica de documentos en el menú.
5. En las herramientas de desarrollo del navegador, revisar `localStorage`:
   - `erp.salesInvoices` contiene solo `tipoFactura = venta`;
   - `erp.purchaseInvoices` contiene solo `tipoFactura = compra`;
   - no se escribe `erp.documents` después de la migración.
6. Verificar que una factura de venta no aparece en la liquidación de ningún trabajador.

**Resultado esperado**: los tipos están separados en almacenamiento y en la interfaz.

### Escenario 8: migración desde la versión anterior

1. En un navegador con datos de la versión `001` en `erp.documents`, abrir la nueva versión.
2. Verificar que las facturas de venta y de compra aparecen en sus vistas correspondientes.
3. Verificar que `erp.documents` se eliminó solo después de migrar.
4. Recargar y verificar que no se duplican facturas.
5. Si hay documentos sin `tipoFactura`, verificar que quedan en `erp.unclassifiedDocuments` y que el administrador ve un aviso.

**Resultado esperado**: la migración no pierde ni duplica datos y es idempotente.

### Escenario 9: datos de demostración idempotentes

1. Cargar la demostración desde el acceso en un navegador vacío.
2. Verificar los accesos y las liquidaciones.
3. Intentar cargar la demostración de nuevo.
4. Verificar que no se duplican accesos ni liquidaciones y que se informa que ya hay datos.

**Resultado esperado**: la carga es idempotente y conserva lo existente.

### Escenario 10: permisos de finanzas y riesgos conocidos

1. Entrar como `55.555.555-5` / `5555`.
2. Recorrer terceros, facturas de venta y compra, movimientos, flujo de caja, seguimiento y búsqueda; verificar que se pueden ver y editar.
3. Verificar que el menú no ofrece **Accesos** ni **Avisos del desarrollador** y que un enlace directo a esas vistas se bloquea.
4. Verificar que la interfaz advierte que el control es solo de interfaz y que la contraseña inicial no se puede cambiar.

**Resultado esperado**: finanzas opera toda la facturación sin permisos de administración, y los riesgos conocidos del MVP quedan visibles para el usuario.

## 6. Verificación de criterios de éxito

| Criterio | Cómo verificarlo |
|---|---|
| SC-001 | Cronometrar desde abrir la aplicación hasta llegar a la vista del rol. |
| SC-002 | Entrar con dos trabajadores distintos y comprobar que cada uno ve solo su liquidación. |
| SC-003 | Probar RUT inválido, inactivo, duplicado y con vínculo roto; revisar el panel de avisos como administrador. |
| SC-004 | Probar los RUT de los tres roles y comprobar que la cabecera y la navegación corresponden al rol registrado. |
| SC-005 | Recargar, cerrar sesión y cerrar pestaña; comprobar el comportamiento de la sesión. |
| SC-006 | Cronometrar la búsqueda y edición de una liquidación como administrador y como finanzas. |
| SC-007 | Cronometrar la carga de la demostración desde el acceso y verificar las credenciales de los tres roles y el RUT distinto del administrador. |
| SC-008 | Revisar `localStorage` y las dos vistas de factura. |
| SC-009 | Desactivar o restablecer un acceso y probar el login siguiente. |
| SC-010 | Intentar abrir datos de otro trabajador o vistas administrativas con sesión de trabajador. |
| SC-011 | Verificar que finanzas usa toda la facturación y que accesos y avisos se bloquean. |
| SC-012 | Abrir vistas por enlace directo sin sesión y comprobar que se vuelve al acceso sin datos. |
| SC-013 | Revisar los RUT de demostración y confirmar que el del administrador no está entre los terceros. |
| SC-014 | Revisar spec, README, contratos e interfaz para confirmar los dos riesgos conocidos documentados. |

## 7. Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| No hay accesos y no se puede entrar | Navegador sin datos | Cargar la demostración desde el acceso. |
| El rol de la cabecera no es el esperado | El RUT pertenece a otro acceso registrado | Revisar el RUT usado y el rol asignado desde Accesos. |
| El trabajador no ve su liquidación | No hay factura de compra a su tercero personal o el acceso no está vinculado | Revisar la liquidación en la vista del administrador y el tercero del acceso. |
| La sesión se pierde al recargar | `sessionStorage` no disponible o sesión inválida | Verificar que el navegador permita almacenamiento de sesión y que el acceso siga activo. |
| No aparecen facturas después de actualizar | Migración fallida | Revisar `erp.documents` y `erp.migration.invoiceSplit`; el aviso del administrador indica el problema. |
| Los documentos sin tipo no aparecen | Están en `erp.unclassifiedDocuments` | Revisar el aviso del administrador y corregir el tipo desde la vista correspondiente. |

## 8. Referencias

- Reglas de acceso y sesión: `contracts/access-and-session.md`.
- Vistas de liquidaciones y guardas de rol: `contracts/payroll-views.md`.
- Separación y migración de facturas: `contracts/invoice-separation.md`.
- Entidades y campos: `data-model.md`.
- Decisiones de diseño: `research.md`.

## 9. Validación de accesibilidad, rendimiento y demostración

### Accesibilidad (T069)

- Los mensajes de error de acceso, formularios y liquidaciones usan `role="alert"`.
- Los campos de los formularios tienen `label` asociada por `for`/`htmlFor`.
- Las tablas de liquidaciones, avisos y facturas usan `thead`/`tbody` y encabezados explícitos.
- Los estados vacíos se representan con elementos de texto claro (`*-empty`).
- La navegación usa botones enfocables; el botón de cierre de sesión está oculto sin sesión.

### Rendimiento (T070)

Medición con la suite automatizada (`npm run check`, jsdom) sobre los volúmenes del MVP:
la pantalla de acceso se renderiza en el arranque en menos de 1 s; la autenticación
y `resolveWorkerSettlement` responden en menos de 100 ms con decenas de accesos y
cientos de facturas; los listados se renderizan en menos de 200 ms. Todo el acceso
a datos es local y síncrono, sin viajes de red. No se observaron cuellos de botella
que justifiquen optimizaciones adicionales en este alcance.

### Escenarios manuales (T072)

Los diez escenarios de la sección 5 se cubren con pruebas de integración
equivalentes sobre DOM simulado (Vitest + jsdom): acceso por rol y sesión
(`login-roles.test.js`), credenciales inválidas y avisos (`dev-notifications.test.js`),
carga de demostración (`demo-data.test.js`), guardas por rol (`role-guards.test.js`),
administración de accesos (`access-admin.test.js`), vista del trabajador
(`payroll-worker.test.js`), edición del administrador y finanzas (`payroll-admin.test.js`),
ciclo de sesión (`session-lifecycle.test.js`) y separación y migración de facturas
(`invoice-separation.test.js`, `invoice-migration.test.js`). Estas pruebas son las
previstas para la revisión; su resultado debe verificarse tras implementar los cambios.

### Datos ficticios (T073)

La demostración usa únicamente RUT, nombres y montos ficticios definidos en
`src/module-config.js` y `src/demo-data.js`. La advertencia de que el control es solo
de interfaz, que los datos viven en el navegador y que no se usen datos reales
aparece en la pantalla de acceso, en Mi liquidación, en Accesos, en el aviso de
facturas y en el README.

## Revisión de diseño del 2026-11-17

Los artefactos de planeación se actualizaron para eliminar el modo invitado, agregar el rol finanzas, mover «Cargar demostración» al acceso y corregir los RUT de demostración. La verificación automatizada de la revisión anterior de HU1 registró 236 pruebas aprobadas de 237 en 45 archivos; la única falla fue `tests/integration/performance.test.js` (renderizado de 500 terceros en 135,83 ms frente al umbral de 100 ms), ya presente en `main`, y ESLint conservó cinco advertencias por variables sin uso. Ese resultado corresponde al código previo y no valida aún los cambios de esta revisión.

- Pendiente: ejecutar `npm run check`, `npm test -- --run` y `npm run build` sobre la implementación actualizada.
- Pendiente: revisión visual en escritorio y móvil; Chromium no pudo iniciar en el entorno anterior porque rechazó la creación de su socket.
- Para la revisión visual, abrir con `npm run dev`, pulsar «Cargar demostración» desde el acceso y probar administrador (`88.888.888-8` / `8888`), finanzas (`55.555.555-5` / `5555`) y ambos trabajadores; comprobar que el lateral se oculta al salir y que el rol de la cabecera se actualiza.
