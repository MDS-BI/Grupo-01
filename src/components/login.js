import { authenticate, normalizeRut } from '../auth.js';
import { appendDevNotification, loadAccessRecords } from '../access-storage.js';
import { loadEntities } from '../storage.js';
import { saveSession } from '../session.js';

const LOGIN_MARKUP = `
  <h1 id="login-title">Acceso</h1>
  <form id="login-form" novalidate>
    <div class="form-field">
      <label for="login-role">Rol</label>
      <select id="login-role" name="role">
        <option value="trabajador">Trabajador</option>
        <option value="administrador">Administrador</option>
      </select>
      <div data-error="role" class="error"></div>
    </div>
    <div class="form-field">
      <label for="login-rut">RUT</label>
      <input id="login-rut" name="rut" autocomplete="off" />
      <div data-error="rut" class="error"></div>
    </div>
    <div class="form-field">
      <label for="login-password">Contraseña</label>
      <input id="login-password" name="password" type="password" autocomplete="new-password" />
      <div data-error="password" class="error"></div>
    </div>
    <button type="submit" id="login-submit">Ingresar</button>
    <p id="login-error" class="error" role="alert" hidden></p>
    <p id="login-no-accesses" role="status" hidden>
      No hay accesos registrados. Carga los datos de demostración para comenzar.
    </p>
    <p id="login-hint" role="status">
      El ingreso es opcional: puedes continuar sin rol para usar la facturación.
      Solo con acceso de trabajador o administrador se muestran las liquidaciones
      de sueldo.
    </p>
    <p id="login-warning">
      El control de acceso es una restricción de interfaz sobre datos que viven en el
      navegador. No es seguridad real, no está cifrada y no debe usarse con datos reales.
    </p>
    <div class="login-actions">
      <button type="button" id="login-guest">Continuar sin iniciar sesión</button>
      <button type="button" id="login-load-demo" hidden>Cargar datos de demostración</button>
    </div>
  </form>
`;

export function renderLogin(root) {
  if (!root) return;
  root.innerHTML = LOGIN_MARKUP;
}

function errorMessageByReason(reason) {
  switch (reason) {
    case 'INVALID_RUT':
      return 'El RUT ingresado no es válido.';
    case 'NOT_FOUND':
      return 'El RUT no está registrado.';
    case 'INACTIVE':
      return 'El acceso está inactivo. Contacta al administrador.';
    case 'DUPLICATE':
      return 'El RUT ya está registrado en más de un acceso.';
    case 'BROKEN_ENTITY_LINK':
      return 'El acceso no tiene un trabajador asociado válido. Contacta al administrador.';
    case 'WRONG_PASSWORD':
    case 'ROLE_MISMATCH':
      return 'RUT o contraseña incorrectos.';
    default:
      return 'No se pudo iniciar sesión. Intente nuevamente.';
  }
}

export function initLogin({
  config: _config,
  onAuthenticated,
  onGuest,
  onLoadDemoData,
}) {
  const root = document.getElementById('view-login');
  renderLogin(root);

  const form = document.getElementById('login-form');
  const errorElement = document.getElementById('login-error');
  const guestButton = document.getElementById('login-guest');
  const loadDemoButton = document.getElementById('login-load-demo');

  function showError(message) {
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.hidden = !message;
  }

  function reset() {
    if (form) form.reset();
    const rutInput = document.getElementById('login-rut');
    if (rutInput) rutInput.focus();
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    const role = document.getElementById('login-role')?.value || 'trabajador';
    const rut = document.getElementById('login-rut')?.value || '';
    const password = document.getElementById('login-password')?.value || '';

    const result = authenticate({
      rut,
      password,
      role,
      records: loadAccessRecords(),
      entities: loadEntities(),
    });

    if (result.ok) {
      const access = result.access;
      const session = {
        accessId: access.accessId,
        role: access.role,
        entityId: access.entityId,
        startedAt: new Date().toISOString(),
      };
      saveSession(session);
      onAuthenticated?.(session);
      return;
    }

    if (result.notifyDeveloper) {
      appendDevNotification({
        accessId: normalizeRut(rut) || rut,
        role,
        reason:
          result.reason === 'INVALID_RUT'
            ? 'INVALID_RUT'
            : result.reason === 'NOT_FOUND'
              ? 'NOT_FOUND'
              : result.reason === 'INACTIVE'
                ? 'INACTIVE'
                : result.reason === 'DUPLICATE'
                  ? 'DUPLICATE'
                  : 'BROKEN_ENTITY_LINK',
        origin: 'login',
      });
    }

    showError(errorMessageByReason(result.reason));
    reset();
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (guestButton) guestButton.onclick = () => onGuest?.();

  if (loadDemoButton) {
    const hasAccesses = loadAccessRecords().length > 0;
    loadDemoButton.hidden = hasAccesses;
    const noAccesses = document.getElementById('login-no-accesses');
    if (noAccesses) noAccesses.hidden = hasAccesses;
    loadDemoButton.onclick = () => onLoadDemoData?.();
  }

  return {
    showError,
    reset,
    render: () => renderLogin(root),
  };
}
