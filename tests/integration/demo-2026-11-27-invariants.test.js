import { beforeEach, describe, expect, it } from 'vitest';
import { loadAccessRecords } from '../../src/access-storage.js';
import { normalizeRut } from '../../src/auth.js';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import {
  addEntity,
  loadEntities,
  loadPayrollSettlements,
} from '../../src/storage.js';

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

function erpKeys() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) keys.push(key);
  }
  return keys.sort();
}

function canonical(value) {
  return normalizeRut(value);
}

function expectedAccesses(entities) {
  const demoAccess = userConfig.demoAccess;
  const entries = [
    demoAccess.administrador,
    demoAccess.finanzas,
    ...demoAccess.trabajadores,
  ];
  return entries.map((entry) => {
    const personal = entry.personalCode
      ? entities.find((entity) => entity.code === entry.personalCode)
      : null;
    return {
      ...entry,
      entityId: personal ? personal.entity_id : entry.entityId,
    };
  });
}

beforeEach(clearErpStorage);

describe('HU6 - invariantes de la demostración 2026-11-27', () => {
  it('conserva los cuatro accesos y credenciales de userConfig', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const records = loadAccessRecords();
    const expected = expectedAccesses(loadEntities());
    expect(records).toHaveLength(4);
    for (const access of expected) {
      const record = records.find(
        (item) => canonical(item.accessId) === canonical(access.accessId)
      );
      expect(record).toMatchObject({
        accessId: canonical(access.accessId),
        password: access.password,
        role: access.role,
        entityId: access.entityId,
        active: true,
      });
    }
  });

  it('Ana y Bruno conservan vigente con desglose y pagos en fechas distintas', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const settlements = loadPayrollSettlements();
    for (const code of ['PE-001', 'PE-002']) {
      const worker = entities.find((entity) => entity.code === code);
      const propias = settlements.filter(
        (item) => item.entityId === worker.entity_id
      );
      const vigente = propias.find(
        (item) =>
          item.estado === 'Emitida' &&
          item.sueldoBase > 0 &&
          item.descuentos > 0 &&
          item.bonos > 0
      );
      const pagadas = propias.filter(
        (item) => item.estado === 'Pagada' && item.fechaPago
      );
      expect(vigente).toBeTruthy();
      expect(pagadas.length).toBeGreaterThanOrEqual(2);
      expect(new Set(pagadas.map((item) => item.fechaPago)).size).toBe(
        pagadas.length
      );
    }
  });

  it('la segunda carga no duplica registros y una carga con datos propios los conserva', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);
    const entitiesBefore = loadEntities().length;
    const documentsBefore = erpKeys();
    const settlementIdsBefore = loadPayrollSettlements().map(
      (item) => item.settlementId
    );

    const second = loadDemoData(userConfig);
    expect(second).toMatchObject({ ok: false, reason: 'EXISTS' });
    expect(loadEntities()).toHaveLength(entitiesBefore);
    expect(loadPayrollSettlements().map((item) => item.settlementId)).toEqual(
      settlementIdsBefore
    );
    expect(erpKeys()).toEqual(documentsBefore);

    clearErpStorage();
    const own = addEntity(
      {
        name: 'Registro propio',
        code: 'PROPIO-1',
        customFields: { tipoTercero: 'cliente' },
      },
      userConfig
    );
    const before = localStorage.getItem('erp.entities');
    const rejected = loadDemoData(userConfig);

    expect(rejected).toMatchObject({ ok: false, reason: 'EXISTS' });
    expect(localStorage.getItem('erp.entities')).toBe(before);
    expect(loadEntities()).toEqual([own]);
  });
});
