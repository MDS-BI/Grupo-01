import { ACCESS_STORAGE_KEYS } from './module-config.js';
import { initialPassword, normalizeRut, validateAccessRecord } from './auth.js';
import { generateId } from './utils.js';
import { ValidationFailure } from './storage.js';

export function loadAccessRecords() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCESS_STORAGE_KEYS.accessRecords);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAccessRecords(records) {
  if (!Array.isArray(records)) {
    throw new ValidationFailure([
      {
        field: 'accessRecords',
        code: 'INVALID_FORMAT',
        message: 'La lista de accesos debe ser un array.',
      },
    ]);
  }
  localStorage.setItem(
    ACCESS_STORAGE_KEYS.accessRecords,
    JSON.stringify(records)
  );
}

export function loadDevNotifications() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCESS_STORAGE_KEYS.devNotifications);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDevNotifications(notifications) {
  if (!Array.isArray(notifications)) return;
  localStorage.setItem(
    ACCESS_STORAGE_KEYS.devNotifications,
    JSON.stringify(notifications)
  );
}

export function appendDevNotification(notification) {
  const created = {
    ...notification,
    id: notification?.id || generateId('dev'),
    timestamp: notification?.timestamp || new Date().toISOString(),
  };
  const notifications = [...loadDevNotifications(), created];
  saveDevNotifications(notifications);
  console.error(
    `Notificación al desarrollador [${created.reason}]: ${created.accessId} (origen: ${created.origin})`
  );
  return created;
}

export function clearDevNotifications() {
  saveDevNotifications([]);
}

export function countActiveAdmins(records) {
  return (records || []).filter(
    (item) => item?.role === 'administrador' && item?.active
  ).length;
}

export function createAccessRecord(
  input,
  { entities = [], records = [] } = {}
) {
  const existingList = records || [];
  const accessId = normalizeRut(input.accessId) || input.accessId;

  if (existingList.some((item) => item?.accessId === accessId)) {
    appendDevNotification({
      accessId,
      role: input.role,
      reason: 'DUPLICATE',
      origin: 'access',
    });
  }

  const errors = validateAccessRecord(input, { entities, existing: records });
  if (errors.length > 0) {
    throw new ValidationFailure(errors);
  }

  if (input.role === 'trabajador') {
    const entityId = input.entityId;
    const linked = (existingList || []).some(
      (item) => item?.entityId === entityId && item?.active
    );
    if (linked) {
      throw new ValidationFailure([
        {
          field: 'entityId',
          code: 'ENTITY_ALREADY_LINKED',
          message: 'Ya existe un acceso activo para ese tercero personal.',
        },
      ]);
    }
  }

  const record = {
    accessId,
    role: input.role,
    entityId: input.role === 'trabajador' ? input.entityId : null,
    password: input.password,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const next = [...existingList, record];
  saveAccessRecords(next);
  return record;
}

export function updateAccessRecord(
  accessId,
  updates,
  { entities = [], records = [] } = {}
) {
  const list = records || loadAccessRecords();
  const index = list.findIndex((item) => item?.accessId === accessId);
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'accessId',
        code: 'NOT_FOUND',
        message: 'El acceso no existe.',
      },
    ]);
  }

  const previous = list[index];
  const merged = {
    ...previous,
    ...(updates || {}),
    accessId: previous.accessId,
    createdAt: previous.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const errors = validateAccessRecord(merged, {
    entities,
    existing: list.filter((item) => item?.accessId !== accessId),
  });
  if (errors.length > 0) {
    throw new ValidationFailure(errors);
  }

  const next = [...list];
  next[index] = merged;
  saveAccessRecords(next);
  return merged;
}

export function deactivateAccessRecord(accessId, { records = [] } = {}) {
  const list = records || loadAccessRecords();
  const index = list.findIndex((item) => item?.accessId === accessId);
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'accessId',
        code: 'NOT_FOUND',
        message: 'El acceso no existe.',
      },
    ]);
  }

  const access = list[index];
  if (access.role === 'administrador' && countActiveAdmins(list) <= 1) {
    throw new ValidationFailure([
      {
        field: 'accessId',
        code: 'LAST_ADMIN',
        message: 'No puedes desactivar el último administrador activo.',
      },
    ]);
  }

  const next = [...list];
  next[index] = {
    ...access,
    active: false,
    updatedAt: new Date().toISOString(),
  };
  saveAccessRecords(next);
  return next[index];
}

export function reactivateAccessRecord(accessId, { records = [] } = {}) {
  const list = records || loadAccessRecords();
  const index = list.findIndex((item) => item?.accessId === accessId);
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'accessId',
        code: 'NOT_FOUND',
        message: 'El acceso no existe.',
      },
    ]);
  }
  const next = [...list];
  next[index] = {
    ...next[index],
    active: true,
    updatedAt: new Date().toISOString(),
  };
  saveAccessRecords(next);
  return next[index];
}

export function resetPassword(accessId, { records = [] } = {}) {
  const list = records || loadAccessRecords();
  const index = list.findIndex((item) => item?.accessId === accessId);
  if (index === -1) {
    throw new ValidationFailure([
      {
        field: 'accessId',
        code: 'NOT_FOUND',
        message: 'El acceso no existe.',
      },
    ]);
  }
  const access = list[index];
  const password = initialPassword(accessId);
  const next = [...list];
  next[index] = { ...access, password, updatedAt: new Date().toISOString() };
  saveAccessRecords(next);
  return next[index];
}
