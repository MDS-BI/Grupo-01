import { ACCESS_STORAGE_KEYS } from './module-config.js';

export const SESSION_STORAGE_KEY = ACCESS_STORAGE_KEYS.session;

// El ingreso con rol (administrador o trabajador) es opcional. Quien no
// inicia sesión navega como invitado: ve el módulo de facturación, pero no
// las vistas de liquidaciones ni de administración de accesos.
export const GUEST_ROLE = 'invitado';

export function createGuestSession() {
  return {
    accessId: null,
    role: GUEST_ROLE,
    entityId: null,
    startedAt: new Date().toISOString(),
  };
}

export function isGuestSession(session) {
  return session?.role === GUEST_ROLE;
}

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
  if (!session) return false;
  if (isGuestSession(session)) return true;
  const access = (records || []).find(
    (item) => item?.accessId === session.accessId
  );
  if (!access) return false;
  if (!access.active) return false;
  if (access.role !== session.role) return false;
  if (access.role === 'trabajador') {
    const entity = (entities || []).find(
      (item) => item?.entity_id === session.entityId
    );
    const tipoTercero = entity?.customFields?.tipoTercero;
    if (!entity || tipoTercero !== 'personal') return false;
  }
  return true;
}
