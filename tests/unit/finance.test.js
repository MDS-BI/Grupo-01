import { describe, expect, it } from 'vitest';
import {
  computeFinanceIndicators,
  describeVariation,
  previousMonthEnd,
} from '../../src/finance.js';

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

const today = '2026-11-24';

function byId(indicators) {
  return Object.fromEntries(indicators.map((item) => [item.id, item]));
}

describe('finance - valor del mes anterior y variación (spec 004, HU2)', () => {
  it('calcula el último día del mes anterior', () => {
    expect(previousMonthEnd('2026-11-24')).toBe('2026-10-31');
    expect(previousMonthEnd('2026-03-05')).toBe('2026-02-28');
    expect(previousMonthEnd('2026-01-15')).toBe('2025-12-31');
  });

  it('describe la variación: sin dato anterior, nuevo, sin cambio y porcentaje', () => {
    expect(describeVariation(10, null).text).toBe('sin dato anterior');
    expect(describeVariation(10, null).direction).toBe('unknown');
    expect(describeVariation(10, 0).text).toBe('▲ nuevo');
    expect(describeVariation(-5, 0).text).toBe('▼ nuevo');
    expect(describeVariation(7, 7).text).toBe('sin cambio');
    expect(describeVariation(150, 100).text).toBe('▲ 50 % vs mes anterior');
    expect(describeVariation(0, 400).text).toBe('▼ 100 % vs mes anterior');
  });

  it('reconstruye el estado al cierre del mes anterior y aplica los tonos por indicador', () => {
    const documents = [
      {
        document_id: 'd1',
        entity_id: 'c1',
        status: 'Emitida',
        startDate: '2026-10-05',
        endDate: '2026-10-20',
        totalAmount: 1000,
        customFields: { tipoFactura: 'venta' },
      },
      {
        document_id: 'd2',
        entity_id: 'p1',
        status: 'Pagada',
        startDate: '2026-10-01',
        endDate: '2026-11-30',
        totalAmount: 400,
        customFields: {
          tipoFactura: 'compra',
          montoPagado: 400,
          fechaPago: '2026-11-10',
        },
      },
    ];

    const result = byId(
      computeFinanceIndicators(documents, entities, [], { today })
    );

    expect(result.cash.value).toBe(-400);
    expect(result.cash.previousValue).toBe(0);
    expect(result.cash.variationText).toBe('▼ nuevo');
    expect(result.cash.variationTone).toBe('unfavorable');
    expect(result.cash.stateTone).toBe('negative');
    expect(result.cash.display).toBe('-$400');

    expect(result.receivable.value).toBe(1000);
    expect(result.receivable.previousValue).toBe(1000);
    expect(result.receivable.variationText).toBe('sin cambio');
    expect(result.receivable.variationTone).toBe('neutral');

    expect(result.payable.value).toBe(0);
    expect(result.payable.previousValue).toBe(400);
    expect(result.payable.variationText).toBe('▼ 100 % vs mes anterior');
    expect(result.payable.variationTone).toBe('favorable');

    expect(result.overdue.value).toBe(1);
    expect(result.overdue.previousValue).toBe(1);
    expect(result.overdue.stateTone).toBe('action');
  });

  it('por pagar que sube es desfavorable y por cobrar que sube es neutro', () => {
    const documents = [
      {
        document_id: 'a',
        entity_id: 'p1',
        status: 'Emitida',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra' },
      },
      {
        document_id: 'b',
        entity_id: 'p1',
        status: 'Emitida',
        startDate: '2026-11-02',
        endDate: '2026-12-31',
        totalAmount: 100,
        customFields: { tipoFactura: 'compra' },
      },
      {
        document_id: 'c',
        entity_id: 'c1',
        status: 'Emitida',
        startDate: '2026-11-03',
        endDate: '2026-12-31',
        totalAmount: 50,
        customFields: { tipoFactura: 'venta' },
      },
    ];
    const result = byId(
      computeFinanceIndicators(documents, entities, [], { today })
    );

    expect(result.payable.variationText).toBe('▲ 100 % vs mes anterior');
    expect(result.payable.variationTone).toBe('unfavorable');
    expect(result.receivable.variationText).toBe('▲ nuevo');
    expect(result.receivable.variationTone).toBe('neutral');
    expect(result.overdue.stateTone).toBe('neutral');
  });

  it('sin documentos anteriores al mes actual muestra «sin dato anterior»', () => {
    const documents = [
      {
        document_id: 'x',
        entity_id: 'c1',
        status: 'Emitida',
        startDate: '2026-11-05',
        endDate: '2026-12-05',
        totalAmount: 300,
        customFields: { tipoFactura: 'venta' },
      },
    ];
    const indicators = computeFinanceIndicators(documents, entities, [], {
      today,
    });

    for (const indicator of indicators) {
      expect(indicator.previousValue).toBeNull();
      expect(indicator.variationText).toBe('sin dato anterior');
      expect(indicator.variationTone).toBe('neutral');
    }
  });

  it('expone las cuatro tarjetas en orden y sin «Deuda pendiente»', () => {
    const indicators = computeFinanceIndicators([], entities, [], { today });
    expect(indicators.map((item) => item.label)).toEqual([
      'Caja neta',
      'Por cobrar',
      'Por pagar',
      'Facturas vencidas',
    ]);
    expect(indicators.every((item) => item.formula.length > 0)).toBe(true);
    expect(JSON.stringify(indicators)).not.toContain('Deuda');
  });
});
