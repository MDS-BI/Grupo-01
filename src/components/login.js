import { authenticate, normalizeRut } from '../auth.js';
import { appendDevNotification, loadAccessRecords } from '../access-storage.js';
import { loadEntities } from '../storage.js';
import { saveSession } from '../session.js';

const LOGIN_MARKUP = `
  <form id="login-form" class="login-form" aria-labelledby="login-title" novalidate>
    <h1 id="login-title">Ingresar al ERP</h1>
    <div class="form-field">
      <label for="login-rut">RUT</label>
      <input id="login-rut" name="rut" autocomplete="username" placeholder="Ej. 12.345.678-5" spellcheck="false" autocapitalize="characters" aria-describedby="login-error" />
    </div>
    <div class="form-field">
      <label for="login-password">Contraseña</label>
      <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Ingresa tu contraseña" aria-describedby="login-error" />
    </div>
    <p id="login-error" class="error" role="alert" hidden></p>
    <button type="submit" id="login-submit">Ingresar</button>
    <button type="button" id="login-guest">Continuar sin iniciar sesión</button>
    <p id="login-no-accesses" role="status" hidden>
      No hay accesos registrados. Continúa como invitado para cargar los datos de demostración desde el panel y vuelve a iniciar sesión.
    </p>
  </form>
  <footer class="login-footer">
    <p>Prototipo académico · Usa solo datos ficticios</p>
    <p id="login-warning">Acceso de demostración y datos locales al navegador. El control es solo de interfaz.</p>
  </footer>
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
      return 'RUT o contraseña incorrectos.';
    default:
      return 'No se pudo iniciar sesión. Intente nuevamente.';
  }
}

export function initLogin({ onAuthenticated, onGuest }) {
  const root = document.getElementById('view-login');
  renderLogin(root);

  const form = document.getElementById('login-form');
  const errorElement = document.getElementById('login-error');
  const rutInput = document.getElementById('login-rut');
  const passwordInput = document.getElementById('login-password');
  const noAccesses = document.getElementById('login-no-accesses');

  function showError(message) {
    errorElement.textContent = message;
    errorElement.hidden = !message;
  }

  function reset() {
    form.reset();
    showError('');
    rutInput.removeAttribute('aria-invalid');
    passwordInput.removeAttribute('aria-invalid');
    noAccesses.hidden = loadAccessRecords().length > 0;
    rutInput.focus();
  }

  form.onsubmit = (event) => {
    event.preventDefault();
    const rut = rutInput.value;
    const records = loadAccessRecords();
    const result = authenticate({
      rut,
      password: passwordInput.value,
      records,
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
      reset();
      onAuthenticated?.(session);
      return;
    }

    if (result.notifyDeveloper) {
      const matching = records.filter(
        (record) => record.accessId === normalizeRut(rut)
      );
      appendDevNotification({
        accessId: normalizeRut(rut) || rut,
        role: matching.length === 1 ? matching[0].role : 'no identificado',
        reason: result.reason,
        origin: 'login',
      });
    }

    showError(errorMessageByReason(result.reason));
    passwordInput.value = '';
    const invalidInput =
      result.reason === 'WRONG_PASSWORD' ? passwordInput : rutInput;
    rutInput.removeAttribute('aria-invalid');
    passwordInput.removeAttribute('aria-invalid');
    invalidInput.setAttribute('aria-invalid', 'true');
    invalidInput.focus();
  };

  document.getElementById('login-guest').onclick = () => {
    reset();
    onGuest?.();
  };
  noAccesses.hidden = loadAccessRecords().length > 0;

  return { showError, reset };
}
