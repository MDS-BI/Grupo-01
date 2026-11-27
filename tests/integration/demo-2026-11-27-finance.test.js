import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeCashflow,
  computeMonthlyIncomeExpense,
} from '../../src/cashflow.js';
import { loadDemoData } from '../../src/demo-data.js';
import { computeFinanceIndicators } from '../../src/finance.js';
import { userConfig } from '../../src/module-config.js';
import { loadMovements } from '../../src/movements.js';
import {
  loadDocuments,
  loadEntities,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  loadSaleInvoices,
} from '../../src/storage.js';

const TODAY = new Date(2026, 10, 27, 12, 0, 0);
const TODAY_ISO = '2026-11-27';
let originalTZ;

function clearErpStorage() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith('erp.')) localStorage.removeItem(key);
  }
}

function monthOf(document) {
  return String(
    document.customFields?.fechaPago ?? document.endDate ?? ''
  ).slice(0, 7);
}

beforeEach(() => {
  originalTZ = process.env.TZ;
  process.env.TZ = 'America/Santiago';
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
  clearErpStorage();
});

afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - finanzas de la demostración 2026-11-27', () => {
  it('llena los seis meses con ingresos, gastos y pagos por tipo de tercero', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const entities = loadEntities();
    const documents = loadDocuments();
    const movements = loadMovements();
    const settlements = loadPayrollSettlements();
    const entityById = new Map(
      entities.map((entity) => [entity.entity_id, entity])
    );
    const clienteIds = new Set(
      entities
        .filter((entity) => entity.customFields.tipoTercero === 'cliente')
        .map((entity) => entity.entity_id)
    );
    const proveedorIds = new Set(
      entities
        .filter((entity) => entity.customFields.tipoTercero === 'proveedor')
        .map((entity) => entity.entity_id)
    );
    const points = computeMonthlyIncomeExpense(documents, entities, movements, {
      now: TODAY,
    });
    const ana = entities.find((entity) => entity.code === 'PE-001');
    const bruno = entities.find((entity) => entity.code === 'PE-002');

    expect(points).toHaveLength(6);
    for (const [index, point] of points.entries()) {
      expect(point.income).toBeGreaterThan(0);
      expect(point.expense).toBeGreaterThan(0);

      const ventasPagadas = loadSaleInvoices().filter(
        (document) =>
          document.status === 'Pagada' &&
          clienteIds.has(document.entity_id) &&
          monthOf(document) === point.monthKey
      );
      const comprasPagadas = loadPurchaseInvoices().filter(
        (document) =>
          document.status === 'Pagada' &&
          proveedorIds.has(document.entity_id) &&
          monthOf(document) === point.monthKey
      );
      expect(ventasPagadas.length).toBeGreaterThanOrEqual(2);
      expect(ventasPagadas.length).toBeLessThanOrEqual(3);
      expect(comprasPagadas.length).toBeGreaterThanOrEqual(1);
      expect(comprasPagadas.length).toBeLessThanOrEqual(2);

      for (const worker of [ana, bruno]) {
        const propias = settlements.filter(
          (item) => item.entityId === worker.entity_id
        );
        if (index < points.length - 1) {
          expect(
            propias.some(
              (item) =>
                item.estado === 'Pagada' && item.periodo === point.monthKey
            )
          ).toBe(true);
        } else {
          const vigente = propias.find(
            (item) =>
              item.estado === 'Emitida' && item.periodo === point.monthKey
          );
          expect(vigente).toBeTruthy();
          expect(vigente.fechaPago).toBeFalsy();
          expect(
            propias.some(
              (item) =>
                item.estado === 'Pagada' && item.periodo === point.monthKey
            )
          ).toBe(false);
        }
      }
    }

    expect(entityById.size).toBe(entities.length);
  });

  it('deja ingresos mayores que egresos, caja positiva y variaciones ▲ y ▼', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const documents = loadDocuments();
    const entities = loadEntities();
    const movements = loadMovements();
    const cashflow = computeCashflow(documents, entities, movements);
    const points = computeMonthlyIncomeExpense(documents, entities, movements, {
      now: TODAY,
    });
    const previous = points[points.length - 2];
    const current = points[points.length - 1];
    const indicators = computeFinanceIndicators(
      documents,
      entities,
      movements,
      {
        today: TODAY_ISO,
      }
    );

    expect(cashflow.ingresos).toBeGreaterThan(cashflow.egresos);
    expect(cashflow.neto).toBeGreaterThan(0);
    expect(current.income + current.expense).toBeGreaterThan(
      previous.income + previous.expense
    );
    expect(current.net).toBeGreaterThan(previous.net);
    expect(indicators.some((item) => item.variationText.includes('▲'))).toBe(
      true
    );
    expect(indicators.some((item) => item.variationText.includes('▼'))).toBe(
      true
    );
  });
});
