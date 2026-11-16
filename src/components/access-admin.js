import {
  createAccessRecord,
  deactivateAccessRecord,
  loadAccessRecords,
  reactivateAccessRecord,
  resetPassword,
  appendDevNotification,
} from '../access-storage.js';
import { initialPassword, normalizeRut } from '../auth.js';
import { loadEntities } from '../storage.js';
import { ValidationFailure } from '../storage.js';

const ACCESS_MARKUP = `
  <h1 id="access-title">Accesos</h1>
  <p id="access-warning" class="login-warning">
    El control de acceso es una restricción de interfaz sobre datos que viven en el
    navegador. No es seguridad real y no deben usarse datos reales.
  </p>
  <form id="access-form" novalidate>
    <h2 id="access-form-title">Crear acceso</h2>
    <div class="form-field">
      <label for="access-role">Rol</label>
      <select id="access-role" name="role">
        <option value="trabajador">Trabajador</option>
        <option value="administrador">Administrador</option>
      </select>
      <div data-error="role" class="error"></div>
    </div>
    <div class="form-field">
      <label for="access-rut">RUT</label>
      <input id="access-rut" name="accessId" autocomplete="off" />
      <div data-error="accessId" class="error"></div>
    </div>
    <div class="form-field">
      <label for="access-entity">Tercero personal</label>
      <select id="access-entity" name="entityId"></select>
      <div data-error="entityId" class="error"></div>
    </div>
    <div class="form-field">
      <label for="access-password">Contraseña inicial</label>
      <input id="access-password" name="password" readonly />
      <div data-error="password" class="error"></div>
    </div>
    <button type="submit" id="access-submit">Crear acceso</button>
    <p id="access-form-error" class="error" role="alert"></p>
  </form>
  <div id="access-list"></div>
  <p id="access-feedback" class="invoice-feedback" role="status"></p>
`;

export function renderAccessAdmin(root) {
  if (root) root.innerHTML = ACCESS_MARKUP;
}

function errorText(errors) {
  if (!errors || errors.length === 0) return '';
  return errors.map((error) => error.message).join(' ');
}

export function initAccessAdmin({
  config: _config,
  onAccessChange,
  onDirtyChange,
}) {
  const root = document.getElementById('view-access');
  renderAccessAdmin(root);

  const form = document.getElementById('access-form');
  const errorElement = document.getElementById('access-form-error');
  const feedbackElement = document.getElementById('access-feedback');
  const listElement = document.getElementById('access-list');
  const entitySelect = document.getElementById('access-entity');
  const passwordInput = document.getElementById('access-password');

  let dirty = false;

  function setDirty(value) {
    dirty = Boolean(value);
    onDirtyChange?.(dirty);
  }

  function showFeedback(message) {
    if (feedbackElement) feedbackElement.textContent = message;
  }

  function showError(errors) {
    if (!errorElement) return;
    errorElement.textContent = errorText(errors);
  }

  function resetForm() {
    if (form) form.reset();
    setDirty(false);
    if (entitySelect) {
      entitySelect.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Seleccione...';
      entitySelect.append(placeholder);
      const records = loadAccessRecords();
      const availableEntities = loadEntities().filter(
        (entity) =>
          entity.customFields?.tipoTercero === 'personal' &&
          !records.some(
            (record) => record.active && record.entityId === entity.entity_id
          )
      );
      for (const entity of availableEntities) {
        const option = document.createElement('option');
        option.value = entity.entity_id;
        option.textContent = `${entity.name} (${entity.taxId ?? ''})`;
        entitySelect.append(option);
      }
    }
    if (passwordInput) passwordInput.value = '';
  }

  function refreshAccessList() {
    if (!listElement) return;
    const records = loadAccessRecords();
    listElement.innerHTML = '';
    if (records.length === 0) {
      listElement.innerHTML =
        '<p class="empty-state">No hay accesos registrados.</p>';
      return;
    }
    const list = document.createElement('ul');
    list.className = 'record-list';
    for (const record of records) {
      const item = document.createElement('li');
      item.className = 'record-card';
      const label = document.createElement('p');
      label.className = 'record-title';
      label.textContent = `${record.accessId} · ${record.role}`;
      const details = document.createElement('p');
      details.textContent = `Tercero: ${record.entityId ?? '—'} · Estado: ${record.active ? 'Activo' : 'Inactivo'}`;
      item.append(label, details);

      const actions = document.createElement('div');
      actions.className = 'record-actions';
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.textContent = 'Restablecer contraseña';
      resetButton.addEventListener('click', () => {
        try {
          resetPassword(record.accessId, { records: loadAccessRecords() });
          showFeedback('Contraseña restablecida.');
        } catch (error) {
          if (error instanceof ValidationFailure) showError(error.errors);
        }
      });
      actions.append(resetButton);

      if (record.role === 'trabajador' && !record.active) {
        const activateButton = document.createElement('button');
        activateButton.type = 'button';
        activateButton.textContent = 'Activar';
        activateButton.addEventListener('click', () => {
          try {
            reactivateAccessRecord(record.accessId, {
              records: loadAccessRecords(),
            });
            showFeedback('Acceso activado.');
          } catch (error) {
            if (error instanceof ValidationFailure) showError(error.errors);
          }
        });
        actions.append(activateButton);
      }

      if (record.role !== 'administrador') {
        const deactivateButton = document.createElement('button');
        deactivateButton.type = 'button';
        deactivateButton.textContent = 'Desactivar';
        deactivateButton.addEventListener('click', () => {
          try {
            const updated = deactivateAccessRecord(record.accessId, {
              records: loadAccessRecords(),
            });
            appendDevNotification({
              accessId: record.accessId,
              role: record.role,
              reason: 'INACTIVE',
              origin: 'access',
            });
            showFeedback(
              updated.active ? 'Acceso desactivado.' : 'Acceso activo.'
            );
          } catch (error) {
            if (error instanceof ValidationFailure) showError(error.errors);
          }
        });
        actions.append(deactivateButton);
      }

      item.append(actions);
      list.append(item);
    }
    listElement.append(list);
  }

  function handleCreate(event) {
    event?.preventDefault?.();
    const role = document.getElementById('access-role')?.value || 'trabajador';
    const accessId = document.getElementById('access-rut')?.value || '';
    const entityId = document.getElementById('access-entity')?.value || null;
    const password =
      document.getElementById('access-password')?.value ||
      (entityId
        ? String(document.getElementById('access-rut')?.value || '').slice(0, 4)
        : '');

    try {
      const record = createAccessRecord(
        {
          accessId,
          role,
          entityId: role === 'trabajador' ? entityId : null,
          password,
        },
        { entities: loadEntities(), records: loadAccessRecords() }
      );
      resetForm();
      refreshAccessList();
      showFeedback(`Acceso creado para ${record.accessId}.`);
      onAccessChange?.();
    } catch (error) {
      if (error instanceof ValidationFailure) {
        showError(error.errors);
      }
    }
  }

  if (form) {
    form.addEventListener('submit', handleCreate);
  }

  const rutInput = document.getElementById('access-rut');
  if (rutInput && passwordInput) {
    rutInput.addEventListener('input', () => {
      passwordInput.value = initialPassword(normalizeRut(rutInput.value)) || '';
      setDirty(true);
    });
  }

  resetForm();
  refreshAccessList();
  return { refresh: refreshAccessList, setDirty, getDirty: () => dirty };
}
