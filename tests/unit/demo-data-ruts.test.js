import { beforeEach, describe, expect, it } from 'vitest';
import { initialPassword, normalizeRut } from '../../src/auth.js';
import { loadAccessRecords } from '../../src/access-storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';

const DEMO_ACCESSES = [
  { accessId: '88.888.888-8', password: '8888', role: 'administrador' },
  { accessId: '55.555.555-5', password: '5555', role: 'finanzas' },
  { accessId: '22.222.222-2', password: '2222', role: 'trabajador' },
  { accessId: '45.000.000-0', password: '4500', role: 'trabajador' },
];

function canonical(value) {
  return String(value ?? '')
    .trim()
    .replace(/[.\s]/g, '')
    .toUpperCase();
}

function accessFor(rut) {
  return loadAccessRecords().find(
    (record) => canonical(record.accessId) === canonical(rut)
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('US6 - RUT y credenciales de la demostración', () => {
  it('carga los cuatro accesos con las credenciales revisadas', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const records = loadAccessRecords();
    expect(records).toHaveLength(4);

    for (const expected of DEMO_ACCESSES) {
      expect(normalizeRut(expected.accessId)).toBe(
        canonical(expected.accessId)
      );
      expect(initialPassword(expected.accessId)).toBe(expected.password);
      expect(accessFor(expected.accessId)).toMatchObject({
        role: expected.role,
        password: expected.password,
        active: true,
      });
    }

    expect(accessFor('88.888.888-8').entityId).toBeNull();
    expect(accessFor('55.555.555-5').entityId).toBeNull();
    expect(accessFor('22.222.222-2').entityId).toBeTruthy();
    expect(accessFor('45.000.000-0').entityId).toBeTruthy();
  });

  it('el RUT del administrador no coincide con ningún taxId de terceros', () => {
    loadDemoData(userConfig);

    const taxIds = loadEntities().map((entity) => canonical(entity.taxId));
    expect(taxIds.length).toBeGreaterThan(0);
    expect(taxIds).not.toContain(canonical('88.888.888-8'));
    expect(accessFor('88.888.888-8')).toBeTruthy();
  });

  it('no incluye los RUT descartados 11.111.111-1 ni 45.000.000-5', () => {
    loadDemoData(userConfig);

    const accessIds = loadAccessRecords().map((record) =>
      canonical(record.accessId)
    );
    const taxIds = loadEntities().map((entity) => canonical(entity.taxId));
    const descartados = ['11.111.111-1', '45.000.000-5'].map(canonical);

    for (const descartado of descartados) {
      expect(accessIds).not.toContain(descartado);
      expect(taxIds).not.toContain(descartado);
    }
  });

  it('la segunda carga no duplica accesos ni terceros', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);
    const accesosPrevios = loadAccessRecords().length;
    const tercerosPrevios = loadEntities().length;
    const accesosPreviosIds = loadAccessRecords().map(
      (record) => record.accessId
    );

    const result = loadDemoData(userConfig);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('EXISTS');
    expect(loadAccessRecords()).toHaveLength(accesosPrevios);
    expect(loadEntities()).toHaveLength(tercerosPrevios);
    expect(loadAccessRecords().map((record) => record.accessId)).toEqual(
      accesosPreviosIds
    );
  });
});
