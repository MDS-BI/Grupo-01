import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDemoData } from '../../src/demo-data.js';
import { userConfig } from '../../src/module-config.js';
import { loadEntities, loadPayrollSettlements } from '../../src/storage.js';

let originalTZ;

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

function byCode(entities, code) {
  return entities.find((entity) => entity.code === code);
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

describe('HU6 - liquidaciones por período de la demostración 2026-11-27', () => {
  it('tiene una sola liquidación por trabajador y período', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const settlements = loadPayrollSettlements();
    expect(settlements).toHaveLength(13);

    const groups = new Map();
    for (const settlement of settlements) {
      const key = `${settlement.entityId}|${settlement.periodo}`;
      groups.set(key, [...(groups.get(key) || []), settlement]);
    }
    for (const [key, items] of groups) expect(items, key).toHaveLength(1);

    for (const code of ['PE-001', 'PE-002']) {
      const worker = byCode(entities, code);
      expect(worker).toBeTruthy();
      const propias = settlements.filter(
        (item) => item.entityId === worker.entity_id
      );
      expect(propias).toHaveLength(6);

      const vigentes = propias.filter(
        (item) => item.estado === 'Emitida' && item.periodo === '2026-11'
      );
      expect(vigentes).toHaveLength(1);
      expect(vigentes[0].fechaPago).toBeFalsy();

      const pagadas = propias.filter((item) => item.estado === 'Pagada');
      expect(pagadas).toHaveLength(5);
      expect(pagadas.map((item) => item.periodo).sort()).toEqual([
        '2026-06',
        '2026-07',
        '2026-08',
        '2026-09',
        '2026-10',
      ]);
      expect(new Set(pagadas.map((item) => item.fechaPago)).size).toBe(5);
      for (const item of pagadas) {
        expect(String(item.fechaPago).slice(0, 7)).toBe(item.periodo);
      }
    }

    const tercero = byCode(entities, 'PE-003');
    expect(tercero).toBeTruthy();
    const drafts = settlements.filter(
      (item) => item.entityId === tercero.entity_id
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ estado: 'Borrador', periodo: '2026-11' });
  });
});
