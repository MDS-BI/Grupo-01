import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEYS,
  clearAll,
  loadPayrollSettlements,
  savePayrollSettlements,
} from '../../src/storage.js';
import { hasStoredRecords } from '../../src/demo-data.js';

function settlement(overrides = {}) {
  return {
    settlementId: 'set_1',
    documentId: 'doc_1',
    entityId: 'ent_worker',
    periodo: '2026-10',
    sueldoBase: 1000000,
    descuentos: 150000,
    bonos: 50000,
    monto: 900000,
    estado: 'Pagada',
    fechaPago: '2026-10-10',
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('almacenamiento de payrollSettlements', () => {
  it('guarda y lee la colección con la clave canónica', () => {
    localStorage.clear();
    const record = settlement();
    savePayrollSettlements([record]);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.payrollSettlements))
    ).toEqual([record]);
    expect(loadPayrollSettlements()).toEqual([record]);
    expect(localStorage.getItem(STORAGE_KEYS.schemaVersion)).toBe('2.0.0');
  });

  it('rechaza settlementId y documentId duplicados', () => {
    localStorage.clear();
    savePayrollSettlements([settlement()]);
    expect(() =>
      savePayrollSettlements([settlement(), settlement()])
    ).toThrow();
    expect(() =>
      savePayrollSettlements([
        settlement(),
        settlement({ settlementId: 'set_2' }),
      ])
    ).toThrow();
    expect(loadPayrollSettlements()).toHaveLength(1);
  });

  it('se limpia con clearAll y es detectada por hasStoredRecords', () => {
    localStorage.clear();
    savePayrollSettlements([settlement()]);
    expect(hasStoredRecords()).toBe(true);
    clearAll();
    expect(localStorage.getItem(STORAGE_KEYS.payrollSettlements)).toBeNull();
    expect(
      localStorage.getItem(STORAGE_KEYS.migrationPayrollSettlements)
    ).toBeNull();
    expect(loadPayrollSettlements()).toEqual([]);
    expect(hasStoredRecords()).toBe(false);
  });
});
