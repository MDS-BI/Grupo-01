import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import { loadEntities, loadPayrollSettlements } from '../../src/storage.js';

const CODES = ['PE-001', 'PE-002', 'PE-003'];
let originalTZ;

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

beforeEach(() => {
  originalTZ = process.env.TZ;
  process.env.TZ = 'America/Santiago';
  clearErpStorage();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-27T12:00:00-03:00'));
});

afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - sueldos líquidos de la demostración 2026-11-27', () => {
  it('mantiene todos los sueldos líquidos entre 600000 y 900000', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const settlements = loadPayrollSettlements();
    const byId = new Map(entities.map((entity) => [entity.entity_id, entity]));
    const codes = new Set();

    expect(settlements.length).toBeGreaterThan(0);
    for (const settlement of settlements) {
      const entity = byId.get(settlement.entityId);
      const code = entity?.code;
      expect(CODES).toContain(code);
      codes.add(code);

      const neto =
        settlement.sueldoBase - settlement.descuentos + settlement.bonos;
      expect(settlement.sueldoBase).toBeGreaterThan(0);
      expect(settlement.descuentos).toBeGreaterThan(0);
      expect(settlement.bonos).toBeGreaterThan(0);
      expect(neto).toBe(settlement.monto);
      expect(settlement.monto).toBeGreaterThanOrEqual(600000);
      expect(settlement.monto).toBeLessThanOrEqual(900000);
      expect(neto).toBeGreaterThanOrEqual(600000);
      expect(neto).toBeLessThanOrEqual(900000);
    }

    for (const code of CODES) expect(codes.has(code)).toBe(true);
  });
});
