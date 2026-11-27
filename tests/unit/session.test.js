import { describe, expect, it } from 'vitest';
import {
  clearSession,
  isSessionValid,
  loadSession,
  resolveSessionProfile,
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
    name: 'Ana P�rez Soto',
    customFields: { tipoTercero },
  };
}

describe('session: ciclo de vida en sessionStorage', () => {
  it('guarda y lee la sesi�n en sessionStorage bajo la clave erp.session', () => {
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

  it('limpia la sesi�n', () => {
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

  it('degrada a null cuando no hay sesi�n guardada', () => {
    expect(loadSession()).toBeNull();
  });
});

describe('session: isSessionValid', () => {
  it('acepta una sesi�n de trabajador con acceso y tercero personal activos', () => {
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

  it('rechaza una sesi�n de trabajador con acceso inactivo', () => {
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

  it('rechaza una sesi�n cuyo rol cambi� respecto al acceso', () => {
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

  it('rechaza una sesi�n de trabajador con tercero personal roto', () => {
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

  it('acepta una sesi�n de administrador sin entidad', () => {
    const session = {
      accessId: '88.888.888-8',
      role: 'administrador',
      entityId: null,
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [
          {
            ...access(),
            accessId: '88.888.888-8',
            role: 'administrador',
            entityId: null,
          },
        ],
        entities: [],
      })
    ).toBe(true);
  });

  it('acepta una sesi�n de finanzas sin entidad', () => {
    const session = {
      accessId: '55.555.555-5',
      role: 'finanzas',
      entityId: null,
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [
          {
            ...access(),
            accessId: '55.555.555-5',
            role: 'finanzas',
            entityId: null,
          },
        ],
        entities: [],
      })
    ).toBe(true);
  });

  it('rechaza una sesi�n de finanzas con entidad personal', () => {
    const session = {
      accessId: '55.555.555-5',
      role: 'finanzas',
      entityId: 'ent_worker',
      startedAt: '2026-11-11T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, {
        records: [
          {
            ...access(),
            accessId: '55.555.555-5',
            role: 'finanzas',
            entityId: 'ent_worker',
          },
        ],
        entities: [entity()],
      })
    ).toBe(false);
  });
});

describe('session: resolveSessionProfile (T013)', () => {
  it('deriva el perfil del administrador', () => {
    expect(
      resolveSessionProfile({ role: 'administrador' }, { entities: [] })
    ).toEqual({
      role: 'administrador',
      roleLabel: 'Recursos Humanos',
      displayName: 'Recursos Humanos',
      initials: 'R',
      source: 'role',
    });
  });

  it('deriva el perfil de finanzas', () => {
    expect(
      resolveSessionProfile({ role: 'finanzas' }, { entities: [] })
    ).toEqual({
      role: 'finanzas',
      roleLabel: 'Finanzas',
      displayName: 'Finanzas',
      initials: 'F',
      source: 'role',
    });
  });

  it('deriva iniciales de la persona del trabajador con nombre y apellido', () => {
    const profile = resolveSessionProfile(
      { role: 'trabajador', entityId: 'ent_worker' },
      { entities: [entity()] }
    );
    expect(profile).toEqual({
      role: 'trabajador',
      roleLabel: 'Trabajador',
      displayName: 'Ana P�rez Soto',
      initials: 'AP',
      source: 'person',
    });
  });

  it('usa la inicial del nombre �nico de un trabajador', () => {
    const profile = resolveSessionProfile(
      { role: 'trabajador', entityId: 'ent_worker' },
      { entities: [{ entity_id: 'ent_worker', name: 'Ana' }] }
    );
    expect(profile.displayName).toBe('Ana');
    expect(profile.initials).toBe('A');
    expect(profile.source).toBe('person');
  });

  it('usa la inicial del rol cuando el trabajador no tiene nombre utilizable', () => {
    expect(
      resolveSessionProfile({ role: 'trabajador' }, { entities: [] })
    ).toEqual({
      role: 'trabajador',
      roleLabel: 'Trabajador',
      displayName: 'Trabajador',
      initials: 'T',
      source: 'role',
    });
  });
});
