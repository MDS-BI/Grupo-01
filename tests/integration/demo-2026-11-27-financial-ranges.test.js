import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  computeCashflow,
  computeMonthlyIncomeExpense,
} from '../../src/cashflow.js';
import { loadDemoData } from '../../src/demo-data.js';
import { computeFinanceIndicators } from '../../src/finance.js';
import { userConfig } from '../../src/module-config.js';
import { loadMovements } from '../../src/movements.js';
import { loadDocuments, loadEntities } from '../../src/storage.js';

const TODAY = new Date('2026-11-27T12:00:00-03:00');
const TODAY_ISO = '2026-11-27';
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
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('HU6 - rangos financieros de la demostración 2026-11-27', () => {
  it('deja caja positiva con variaciones moderadas y ambos sentidos', () => {
    expect(loadDemoData(userConfig).ok).toBe(true);

    const documents = loadDocuments();
    const entities = loadEntities();
    const movements = loadMovements();
    const cashflow = computeCashflow(documents, entities, movements);
    const points = computeMonthlyIncomeExpense(documents, entities, movements, {
      now: TODAY,
    });
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
    expect(points).toHaveLength(6);
    for (const point of points) {
      expect(point.income).toBeGreaterThan(0);
      expect(point.expense).toBeGreaterThan(0);
    }

    const previous = points[points.length - 2];
    const current = points[points.length - 1];
    expect(previous.net).toBeLessThan(current.net);

    const cash = indicators.find((item) => item.id === 'cash');
    expect(cash.variationDirection).toBe('up');
    expect(cash.variationPercent).toBeGreaterThanOrEqual(10);
    expect(cash.variationPercent).toBeLessThanOrEqual(60);

    for (const indicator of indicators) {
      if (typeof indicator.variationPercent === 'number') {
        expect(indicator.variationPercent).toBeLessThanOrEqual(100);
      }
    }
    expect(indicators.some((item) => item.variationText.includes('▲'))).toBe(
      true
    );
    expect(indicators.some((item) => item.variationText.includes('▼'))).toBe(
      true
    );
  });
});
