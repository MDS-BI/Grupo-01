import { describe, expect, it } from 'vitest';
import {
  clearSession,
  isSessionValid,
  loadSession,
  saveSession,
} from '../../src/session.js';
import { ACCESS_STORAGE_KEYS } from '../../src/module-config.js';

const SESSION_KEY = ACCESS_STORAGE_KEYS.session;

function access(overrides = {}) {
  return {
    accessId: '22.222.222-2',
    role: 'trabajador',
    entityId: 'ent_worker',
    password: '2222',
    active: true,
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
    ...overrides,
  };
}

function entity(tipoTercero = 'personal', entityId = 'ent_worker') {
  return {
    entity_id: entityId,
    name: 'Ana Pérez Soto',
    customFields: { tipoTercero },
  };
}

describe('session: ciclo de vida en sessionStorage', () => {
  it('guarda y lee la sesión en sessionStorage bajo la clave erp.session', () => {
    saveSession({
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: 'ent_worker',
      startedAt: '2026-11-11T12:00:00.000Z',
    });
    expect(sessionStorage.getItem(SESSION_KEY)).toBeTruthy();
    expect(loadSession()).toMatchObject({
      accessId: '22.222.222-2',
      role: 'trabajador',
    });
  });

  it('limpia la sesión', () => {
    saveSession({
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: 'ent_worker',
      startedAt: '2026-11-11T12:00:00.000Z',
    });
    clearSession();
    expect(loadSession()).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('degrada a null cuando no hay sesión guardada', () => {
    expect(loadSession()).toBeNull();
  });
});

describe('session: isSessionValid', () => {
  it('acepta una sesión de trabajador con acceso y tercero personal activos', () => {
    const session = {
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: 'ent_worker',
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [access()],
        entities: [entity()],
      })
    ).toBe(true);
  });

  it('rechaza una sesión de trabajador con acceso inactivo', () => {
    const session = {
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: 'ent_worker',
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [access({ active: false })],
        entities: [entity()],
      })
    ).toBe(false);
  });

  it('rechaza una sesión cuyo rol cambió respecto al acceso', () => {
    const session = {
      accessId: '22.222.222-2',
      role: 'administrador',
      entityId: null,
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [access()],
        entities: [entity()],
      })
    ).toBe(false);
  });

  it('rechaza una sesión de trabajador con tercero personal roto', () => {
    const session = {
      accessId: '22.222.222-2',
      role: 'trabajador',
      entityId: 'ent_missing',
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [access()],
        entities: [entity()],
      })
    ).toBe(false);
  });

  it('acepta una sesión de administrador sin entidad', () => {
    const session = {
      accessId: '11.111.111-1',
      role: 'administrador',
      entityId: null,
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [
          {
            ...access(),
            accessId: '11.111.111-1',
            role: 'administrador',
            entityId: null,
          },
        ],
        entities: [],
      })
    ).toBe(true);
  });
});
