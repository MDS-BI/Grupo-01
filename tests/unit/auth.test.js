import { describe, expect, it } from 'vitest';
import {
  authenticate,
  initialPassword,
  normalizeRut,
  validateAccessRecord,
} from '../../src/auth.js';

describe('auth: normalización de RUT', () => {
  it('normaliza puntos, guiones y K mayúscula a la forma canónica', () => {
    expect(normalizeRut('12.345.678-5')).toBe('12345678-5');
    expect(normalizeRut('12345678-5')).toBe('12345678-5');
  });

  it('rechaza RUT con dígito verificador inválido', () => {
    expect(normalizeRut('12345678-1')).toBeNull();
  });
});

describe('auth: contraseña inicial', () => {
  it('deriva los primeros 4 dígitos del cuerpo del RUT', () => {
    expect(initialPassword('12.345.678-5')).toBe('1234');
    expect(initialPassword('11111111-1')).toBe('1111');
    expect(initialPassword('12345678-5')).toBe('1234');
  });

  it('rechaza RUT inválidos', () => {
    expect(initialPassword('12345678-1')).toBeNull();
  });
});

describe('auth: validateAccessRecord', () => {
  const entities = [
    {
      entity_id: 'ent_worker',
      name: 'Ana Pérez Soto',
      customFields: { tipoTercero: 'personal' },
    },
    {
      entity_id: 'ent_admin',
      name: 'Empresa',
      customFields: { tipoTercero: 'cliente' },
    },
  ];

  it('acepta un acceso de trabajador válido con contraseña inicial derivada del RUT', () => {
    const errors = validateAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: 'ent_worker',
        password: '2222',
        active: true,
        createdAt: '2026-11-11T12:00:00.000Z',
        updatedAt: '2026-11-11T12:00:00.000Z',
      },
      { entities, existing: [] }
    );
    expect(errors).toEqual([]);
  });

  it('rechaza un RUT inválido', () => {
    const errors = validateAccessRecord(
      {
        accessId: '12345678-1',
        role: 'trabajador',
        entityId: 'ent_worker',
        password: '1234',
        active: true,
      },
      { entities, existing: [] }
    );
    expect(errors.some((error) => error.code === 'RUT_INVALID')).toBe(true);
  });

  it('rechaza un rol inválido', () => {
    const errors = validateAccessRecord(
      {
        accessId: '22222222-2',
        role: 'auditor',
        entityId: null,
        password: '2222',
        active: true,
      },
      { entities, existing: [] }
    );
    expect(errors.some((error) => error.code === 'ROLE_INVALID')).toBe(true);
  });

  it('exige el vínculo con un tercero personal para trabajadores', () => {
    const errors = validateAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: null,
        password: '2222',
        active: true,
      },
      { entities, existing: [] }
    );
    expect(errors.some((error) => error.code === 'ENTITY_REQUIRED')).toBe(true);
  });

  it('rechaza la contraseña cuando no es la inicial derivada del RUT', () => {
    const errors = validateAccessRecord(
      {
        accessId: '22222222-2',
        role: 'trabajador',
        entityId: 'ent_worker',
        password: '9999',
        active: true,
      },
      { entities, existing: [] }
    );
    expect(errors.some((error) => error.code === 'PASSWORD_INVALID')).toBe(
      true
    );
  });

  it('rechaza un acceso de administrador con tercero asociado', () => {
    const errors = validateAccessRecord(
      {
        accessId: '11111111-1',
        role: 'administrador',
        entityId: 'ent_worker',
        password: '1111',
        active: true,
      },
      { entities, existing: [] }
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('auth: authenticate', () => {
  const entities = [
    {
      entity_id: 'ent_worker',
      name: 'Ana Pérez Soto',
      customFields: { tipoTercero: 'personal' },
    },
  ];

  const baseAccess = {
    accessId: '22222222-2',
    role: 'trabajador',
    entityId: 'ent_worker',
    password: '2222',
    active: true,
    createdAt: '2026-11-11T12:00:00.000Z',
    updatedAt: '2026-11-11T12:00:00.000Z',
  };

  function authenticateAccess(overrides = {}) {
    const options = {
      rut: '22222222-2',
      password: '2222',
      role: 'trabajador',
      records: [baseAccess],
      entities,
      ...overrides,
    };
    return authenticate(options);
  }

  it('retorna el acceso cuando las credenciales son correctas', () => {
    const result = authenticateAccess();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.access.accessId).toBe('22222222-2');
  });

  it('rechaza el RUT inválido y avisa al desarrollador', () => {
    const result = authenticateAccess({ rut: '12345678-1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('INVALID_RUT');
      expect(result.notifyDeveloper).toBe(true);
    }
  });

  it('rechaza el RUT no registrado y avisa al desarrollador', () => {
    const result = authenticateAccess({ rut: '12345678-5' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('NOT_FOUND');
      expect(result.notifyDeveloper).toBe(true);
    }
  });

  it('rechaza la contraseña incorrecta sin avisar al desarrollador', () => {
    const result = authenticateAccess({ password: '0000' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('WRONG_PASSWORD');
      expect(result.notifyDeveloper).toBe(false);
    }
  });

  it('rechaza el rol incompatible sin avisar al desarrollador', () => {
    const result = authenticateAccess({ role: 'administrador' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('ROLE_MISMATCH');
      expect(result.notifyDeveloper).toBe(false);
    }
  });

  it('rechaza el acceso inactivo y avisa al desarrollador', () => {
    const result = authenticateAccess({
      records: [{ ...baseAccess, accessId: '22222222-2', active: false }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('INACTIVE');
      expect(result.notifyDeveloper).toBe(true);
    }
  });

  it('rechaza un vínculo roto con un tercero personal y avisa al desarrollador', () => {
    const result = authenticateAccess({
      records: [
        {
          ...baseAccess,
          entityId: 'ent_missing',
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('BROKEN_ENTITY_LINK');
      expect(result.notifyDeveloper).toBe(true);
    }
  });

  it('rechaza accesos duplicados por RUT y avisa al desarrollador', () => {
    const result = authenticateAccess({
      records: [baseAccess, { ...baseAccess, accessId: '22222222-2' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('DUPLICATE');
      expect(result.notifyDeveloper).toBe(true);
    }
  });
});
