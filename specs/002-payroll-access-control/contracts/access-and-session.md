# Contrato: Acceso y sesión

**Funcionalidad**: `002-payroll-access-control` · **Fecha**: 2026-11-11 · **Revisado**: 2026-11-17
**Relacionado con**: `spec.md`, `data-model.md`, `research.md`

## 1. Claves de almacenamiento

| Clave | Almacén | Contenido |
|---|---|---|
| `erp.accessRecords` | `localStorage` | Lista de `AccessRecord`. |
| `erp.devNotifications` | `localStorage` | Lista de `DevNotification`. |
| `erp.session` | `sessionStorage` | Objeto `Session` o ausente. |
| `erp.schemaVersion` | `localStorage` | `"2.0.0"` para esta versión. |

## 2. Forma de `AccessRecord`

```js
{
  accessId: "12345678-5",   // RUT canónico, único
  role: "trabajador",       // "administrador" | "finanzas" | "trabajador"
  entityId: "ent_abc123",   // string para trabajador, null para administrador y finanzas
  password: "1234",         // 4 dígitos, MVP sin cifrado
  active: true,
  createdAt: "2026-11-11T12:00:00.000Z",
  updatedAt: "2026-11-11T12:00:00.000Z"
}
```

## 3. Forma de `Session`

```js
{
  accessId: "12345678-5",
  role: "trabajador",
  entityId: "ent_abc123",
  startedAt: "2026-11-11T12:00:00.000Z"
}
```

## 4. Forma de `DevNotification`

```js
{
  id: "dev_abc123",
  timestamp: "2026-11-11T12:00:00.000Z",
  accessId: "12345678-5",   // RUT normalizado o texto original si es inválido
  role: "trabajador",       // "administrador" | "finanzas" | "trabajador" | "no identificado"
  reason: "INACTIVE",       // INVALID_RUT | INACTIVE | DUPLICATE | BROKEN_ENTITY_LINK | NOT_FOUND
  origin: "login"
}
```

## 5. API de `src/auth.js`

```js
normalizeRut(input: string): string | null
// Devuelve "CUERPO-DV" sin puntos o null si el RUT es inválido.

initialPassword(rut: string): string | null
// Devuelve los primeros 4 dígitos del cuerpo del RUT o null si el RUT es inválido.

validateAccessRecord(record, { entities, existing }): ValidationError[]
// Valida rol, entityId, contraseña, unicidad y reglas por rol (administrador, finanzas, trabajador).

authenticate({ rut, password, records, entities }): AuthResult
// AuthResult:
// { ok: true, access: AccessRecord }
// { ok: false, reason: "INVALID_RUT" | "NOT_FOUND" | "INACTIVE" | "DUPLICATE" |
//   "BROKEN_ENTITY_LINK" | "WRONG_PASSWORD",
//   message: string, notifyDeveloper: boolean }
```

**Reglas de `authenticate`**:
- Normaliza el RUT antes de buscar.
- `WRONG_PASSWORD` no genera notificación al desarrollador.
- `INVALID_RUT`, `NOT_FOUND`, `INACTIVE`, `DUPLICATE` y `BROKEN_ENTITY_LINK` generan notificación.
- Si hay más de un registro con el mismo `accessId`, se rechaza con `DUPLICATE`.
- Tras validar las credenciales se utiliza `access.role` del registro; el formulario solo envía RUT y contraseña.
- Si el acceso es de trabajador, verifica que `entityId` exista y tenga `tipoTercero = personal`; si no, rechaza con `BROKEN_ENTITY_LINK`.
- Los accesos de `administrador` y `finanzas` no requieren `entityId`; el rol se obtiene del registro y no del formulario.

## 6. API de `src/access-storage.js`

```js
loadAccessRecords(): AccessRecord[]
saveAccessRecords(records: AccessRecord[]): void
createAccessRecord(input, { entities, records }): AccessRecord
updateAccessRecord(accessId, updates, { entities, records }): AccessRecord
deactivateAccessRecord(accessId): AccessRecord
reactivateAccessRecord(accessId, { entities, records }): AccessRecord
resetPassword(accessId): AccessRecord
countActiveAdmins(records): number
loadDevNotifications(): DevNotification[]
appendDevNotification(notification): DevNotification
clearDevNotifications(): void
```

**Errores esperados** (`ValidationFailure` con `errors[]`):
- `RUT_INVALID`
- `RUT_DUPLICATE`
- `ROLE_INVALID`
- `ENTITY_REQUIRED`
- `ENTITY_NOT_PERSONAL`
- `ENTITY_ALREADY_LINKED`
- `PASSWORD_INVALID`
- `LAST_ADMIN`
- `NOT_FOUND`

## 7. API de `src/session.js`

```js
loadSession(): Session | null
saveSession(session: Session): void
clearSession(): void
isSessionValid(session, { records, entities }): boolean
```

**Reglas**:
- Usa `sessionStorage`; si no está disponible, degrada a memoria.
- `isSessionValid` verifica que el acceso exista, esté activo, conserve el rol y, para trabajador, el `entityId` personal.
- Al cerrar sesión se elimina `erp.session`.
- Al cerrar la pestaña, el navegador elimina `sessionStorage`; no se usa `localStorage` para la sesión.

## 8. Contrato de la pantalla de acceso

**Elementos requeridos en `index.html`**:

| Elemento | ID | Función |
|---|---|---|
| Contenedor de login | `view-login` | Vista inicial sin sesión. |
| RUT | `login-rut` | Texto; acepta puntos, guion y K. |
| Contraseña | `login-password` | `type="password"`. |
| Botón | `login-submit` | Envía el formulario. |
| Mensaje de error | `login-error` | `role="alert"`. |
| Aviso de seguridad | `login-warning` | Texto fijo sobre restricción de interfaz y contraseña inicial como riesgo conocido. |
| Cargar demostración | `login-demo-load` | Siembra los datos ficticios desde el acceso, sin crear sesión ni abrir vistas. |
| Estado sin accesos | `login-no-accesses` | Indica que no hay accesos y que se debe usar «Cargar demostración». |
| Rol en la cabecera | `session-role` | Texto informativo según la sesión vigente. |
| Acción de sesión | `nav-logout` | Última opción visible del lateral para todos los roles con sesión. |

**Comportamiento**:
- Al abrir sin sesión válida, se muestra `view-login`, se ocultan las demás vistas y el lateral, y el contenido ocupa una sola columna.
- La tarjeta muestra RUT, contraseña, Ingresar y «Cargar demostración». No existe «Continuar sin iniciar sesión» ni `login-guest`. El rol proviene del registro de acceso.
- El formulario no muestra datos hasta autenticar y no incluye selector de rol.
- Un error muestra un mensaje claro y no revela si el RUT existe cuando la causa es la contraseña.
- Si no hay accesos, se indica que la demostración se carga desde `login-demo-load`; la carga no inicia sesión y vuelve al acceso.
- Al autenticar, se guarda la sesión y se navega a la vista del rol. La cabecera muestra Rol: Administrador, Rol: Finanzas o Rol: Trabajador.
- La última acción del lateral es «Cerrar sesión» para administrador, finanzas y trabajador; no existe «Iniciar sesión» dentro del ERP.
- Cualquier vista distinta de `login` sin sesión válida redirige a `login` sin exponer datos de negocio.
- Al regresar al login, se ocultan el lateral y el rol anterior y se limpian los campos y errores del formulario.

## 9. Contrato de administración de accesos

**Elementos requeridos**:

| Elemento | ID | Función |
|---|---|---|
| Vista | `view-access` | Solo administrador. |
| Formulario | `access-form` | Crear acceso. |
| Rol | `access-role` | `trabajador`, `finanzas` o `administrador`. |
| RUT | `access-rut` | RUT del nuevo acceso. |
| Tercero personal | `access-entity` | Solo visible para trabajador; oculto para administrador y finanzas. |
| Contraseña inicial | `access-password` | Solo lectura; se calcula del RUT. |
| Lista | `access-list` | RUT, rol, tercero, estado, fecha. |
| Acciones | `access-actions` | Activar, desactivar, restablecer contraseña. |

**Comportamiento**:
- Al escribir un RUT válido, `access-password` muestra los primeros 4 dígitos.
- El selector de tercero solo lista entidades con `tipoTercero = personal` y sin acceso activo.
- Crear un acceso duplicado muestra error y agrega una notificación.
- Crear un acceso de `finanzas` genera un registro sin `entityId`, con contraseña inicial derivada del RUT y sin permisos de administración de accesos ni avisos.
- Desactivar el último administrador activo muestra error y no cambia el estado.
- Las acciones se confirman con un diálogo cuando corresponda.

## 10. Contrato de notificaciones al desarrollador

- Se registran en `erp.devNotifications` y se emiten con `console.error`.
- El panel `view-dev-notifications` solo es visible para administradores.
- Muestra fecha, RUT intentado, rol, motivo y origen.
- El botón `dev-notifications-clear` limpia el registro con confirmación.
- No se muestran notificaciones al trabajador.

## 11. Credenciales de demostración

| Rol | RUT | Contraseña inicial |
|---|---|---|
| Administrador (RRHH) | `88.888.888-8` | `8888` |
| Finanzas | `55.555.555-5` | `5555` |
| Trabajador | `22.222.222-2` | `2222` |
| Trabajador | `45.000.000-0` | `4500` |

El RUT del administrador no coincide con el de ningún tercero. Las credenciales se documentan en `README.md` y en la pantalla de acceso de la demostración. Son ficticias y su contraseña inicial sin cambio es un riesgo conocido del MVP.
