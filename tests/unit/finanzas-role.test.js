import { describe, expect, it } from 'vitest';
import {
  authenticate,
  initialPassword,
  validateAccessRecord,
} from '../../src/auth.js';
import { ROLES } from '../../src/module-config.js';
import { isSessionValid } from '../../src/session.js';

const FINANCE_RUT = '55.555.555-5';

function financeAccess(overrides = {}) {
  return {
    accessId: '55555555-5',
    role: 'finanzas',
    entityId: null,
    password: '5555',
    active: true,
    createdAt: '2026-11-17T12:00:00.000Z',
    updatedAt: '2026-11-17T12:00:00.000Z',
    ...overrides,
  };
}

describe('rol finanzas', () => {
  it('ROLES incluye finanzas', () => {
    expect(ROLES).toContain('finanzas');
  });

  it('validateAccessRecord acepta finanzas sin entityId', () => {
    const errors = validateAccessRecord(financeAccess(), {
      entities: [],
      existing: [],
    });
    expect(errors).toEqual([]);
  });

  it('validateAccessRecord rechaza finanzas con entityId', () => {
    const errors = validateAccessRecord(
      financeAccess({ entityId: 'ent_worker' }),
      {
        entities: [
          {
            entity_id: 'ent_worker',
            name: 'Ana Pérez Soto',
            customFields: { tipoTercero: 'personal' },
          },
        ],
        existing: [],
      }
    );
    expect(errors.some((error) => error.code === 'ENTITY_NOT_ALLOWED')).toBe(
      true
    );
  });

  it('initialPassword deriva 5555 del RUT de finanzas', () => {
    expect(initialPassword(FINANCE_RUT)).toBe('5555');
  });

  it('authenticate reconoce el rol finanzas desde el acceso registrado', () => {
    const result = authenticate({
      rut: FINANCE_RUT,
      password: '5555',
      records: [financeAccess()],
      entities: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.access.role).toBe('finanzas');
  });

  it('isSessionValid reconoce una sesión de finanzas', () => {
    const session = {
      accessId: '55555555-5',
      role: 'finanzas',
      entityId: null,
      startedAt: '2026-11-17T12:00:00.000Z',
    };
    expect(
      isSessionValid(session, { records: [financeAccess()], entities: [] })
    ).toBe(true);
  });
});
