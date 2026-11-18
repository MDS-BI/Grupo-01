import { ACCESS_STORAGE_KEYS } from './module-config.js';

export const SESSION_STORAGE_KEY = ACCESS_STORAGE_KEYS.session;

const SESSION_ROLES = ['administrador', 'finanzas', 'trabajador'];

export function loadSession() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session !== 'object') return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isSessionValid(session, { records = [], entities = [] } = {}) {
  if (!session || typeof session.accessId !== 'string' || !session.accessId) {
    return false;
  }
  if (!SESSION_ROLES.includes(session.role)) return false;

  const access = (records || []).find(
    (item) => item?.accessId === session.accessId
  );
  if (!access || !access.active) return false;
  if (!SESSION_ROLES.includes(access.role) || access.role !== session.role) {
    return false;
  }

  const accessEntityId = access.entityId || null;
  const sessionEntityId = session.entityId || null;
  if (sessionEntityId !== accessEntityId) return false;

  if (access.role === 'trabajador') {
    const entity = (entities || []).find(
      (item) => item?.entity_id === sessionEntityId
    );
    if (!entity || entity.customFields?.tipoTercero !== 'personal') {
      return false;
    }
  } else if (accessEntityId) {
    return false;
  }

  return true;
}
