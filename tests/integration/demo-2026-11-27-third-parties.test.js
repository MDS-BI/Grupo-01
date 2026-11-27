import { beforeEach, describe, expect, it } from 'vitest';
import { loadAccessRecords } from '../../src/access-storage.js';
import { loadDemoData } from '../../src/demo-data.js';
import { getConfig, userConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';
import { isValidRutChileno } from '../../src/validation.js';

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

function byCode(entities, code) {
  return entities.find((entity) => entity.code === code);
}

beforeEach(clearErpStorage);

describe('HU6 - terceros ficticios de la demostración 2026-11-27', () => {
  it('carga al menos 4 clientes y 3 proveedores con RUT válido', () => {
    expect(loadDemoData(getConfig()).ok).toBe(true);

    const entities = loadEntities();
    const clientes = entities.filter(
      (entity) => entity.customFields.tipoTercero === 'cliente'
    );
    const proveedores = entities.filter(
      (entity) => entity.customFields.tipoTercero === 'proveedor'
    );

    expect(clientes.length).toBeGreaterThanOrEqual(4);
    expect(proveedores.length).toBeGreaterThanOrEqual(3);
    for (const entity of [...clientes, ...proveedores]) {
      expect(isValidRutChileno(entity.taxId)).toBe(true);
    }
  });

  it('incluye a Ana, Bruno y un tercer trabajador sin acceso', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const ana = byCode(entities, 'PE-001');
    const bruno = byCode(entities, 'PE-002');
    const tercero = byCode(entities, 'PE-003');

    expect(ana).toMatchObject({ name: 'Ana Pérez Soto' });
    expect(bruno).toMatchObject({ name: 'Bruno Soto Vega' });
    expect(tercero).toBeTruthy();
    expect(tercero.customFields.tipoTercero).toBe('personal');
    expect(isValidRutChileno(tercero.taxId)).toBe(true);

    const accessIds = loadAccessRecords().map((record) =>
      String(record.accessId)
        .replace(/[.\s-]/g, '')
        .toUpperCase()
    );
    const terceroRut = String(tercero.taxId)
      .replace(/[.\s-]/g, '')
      .toUpperCase();
    expect(accessIds).not.toContain(terceroRut);
  });
});
