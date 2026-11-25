import { describe, expect, it } from 'vitest';
import { computeMonthlyIncomeExpense } from '../../src/cashflow.js';

const entities = [
  {
    entity_id: 'c1',
    name: 'Cliente',
    customFields: { tipoTercero: 'cliente' },
  },
  {
    entity_id: 'p1',
    name: 'Proveedor',
    customFields: { tipoTercero: 'proveedor' },
  },
];

function paid(id, entityId, tipoFactura, total, fechaPago) {
  return {
    document_id: id,
    entity_id: entityId,
    status: 'Pagada',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalAmount: total,
    customFields: { tipoFactura, montoPagado: total, fechaPago },
  };
}

describe('computeMonthlyIncomeExpense (spec 004, gráfico de tendencia)', () => {
  const now = new Date(2026, 10, 24);

  it('devuelve seis meses consecutivos que terminan en el mes actual', () => {
    const points = computeMonthlyIncomeExpense([], entities, [], { now });
    expect(points.map((point) => point.monthKey)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(points.map((point) => point.label)).toEqual([
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
    ]);
  });

  it('deja en 0 los meses sin pagos y cruza el cambio de año', () => {
    const points = computeMonthlyIncomeExpense([], entities, [], {
      now: new Date(2026, 1, 10),
    });
    expect(points[0].monthKey).toBe('2025-09');
    expect(points[5].monthKey).toBe('2026-02');
    for (const point of points) {
      expect(point.income).toBe(0);
      expect(point.expense).toBe(0);
      expect(point.net).toBe(0);
    }
  });

  it('suma solo documentos pagados, por mes de pago', () => {
    const documents = [
      paid('v1', 'c1', 'venta', 1000, '2026-11-05'),
      paid('v2', 'c1', 'venta', 500, '2026-10-20'),
      paid('c1', 'p1', 'compra', 300, '2026-11-15'),
      paid('viejo', 'c1', 'venta', 999, '2026-01-10'),
      {
        document_id: 'e1',
        entity_id: 'c1',
        status: 'Emitida',
        startDate: '2026-11-01',
        endDate: '2026-11-30',
        totalAmount: 700,
        customFields: { tipoFactura: 'venta' },
      },
    ];
    const points = computeMonthlyIncomeExpense(documents, entities, [], {
      now,
    });
    const nov = points[5];
    const oct = points[4];
    expect(nov.income).toBe(1000);
    expect(nov.expense).toBe(300);
    expect(nov.net).toBe(700);
    expect(oct.income).toBe(500);
    expect(points.reduce((total, point) => total + point.income, 0)).toBe(1500);
  });

  it('usa la fecha del movimiento de pago cuando existe', () => {
    const documents = [paid('v1', 'c1', 'venta', 800, '2026-09-30')];
    const movements = [
      { document_id: 'v1', tipo: 'pago', fecha: '2026-10-02', monto: 800 },
    ];
    const points = computeMonthlyIncomeExpense(documents, entities, movements, {
      now,
    });
    expect(points[3].income).toBe(0);
    expect(points[4].income).toBe(800);
  });
});
