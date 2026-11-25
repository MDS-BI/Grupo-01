import { ACCESS_STORAGE_KEYS, ROLE_LABELS } from './module-config.js';

export const SESSION_STORAGE_KEY = ACCESS_STORAGE_KEYS.session;

const SESSION_ROLES = ['administrador', 'finanzas', 'trabajador'];

export function resolveSessionProfile(session, { entities = [] } = {}) {
  const role = session?.role;

  if (role === 'trabajador') {
    const entity = (entities || []).find(
      (item) => item?.entity_id === session?.entityId
    );
    const name = String(entity?.name ?? '').trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      const first = parts[0] ?? '';
      const last = parts.length > 1 ? parts[1] : '';
      const initials = `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || 'T';
      return {
        role,
        roleLabel: ROLE_LABELS.trabajador,
        displayName: name,
        initials,
        source: 'person',
      };
    }
    return {
      role,
      roleLabel: ROLE_LABELS.trabajador,
      displayName: ROLE_LABELS.trabajador,
      initials: 'T',
      source: 'role',
    };
  }

  return {
    role,
    roleLabel: ROLE_LABELS[role] ?? ROLE_LABELS.trabajador,
    displayName: ROLE_LABELS[role] ?? ROLE_LABELS.trabajador,
    initials: role === 'administrador' ? 'A' : 'F',
    source: 'role',
  };
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

// Banner «¿Primera vez?» (spec 004, HU5): el descarte dura la sesión del
// navegador y es independiente por rol. No forma parte del modelo de datos.
const GUIDE_DISMISSED_PREFIX = 'erp.guideDismissed.';

export function isGuideDismissed(role) {
  if (typeof sessionStorage === 'undefined' || !role) return false;
  return sessionStorage.getItem(`${GUIDE_DISMISSED_PREFIX}${role}`) === '1';
}

export function dismissGuide(role) {
  if (typeof sessionStorage === 'undefined' || !role) return;
  sessionStorage.setItem(`${GUIDE_DISMISSED_PREFIX}${role}`, '1');
}
