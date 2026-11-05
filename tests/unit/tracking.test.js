import { describe, it, expect } from 'vitest';
import { computeDebtSummary, isOverdue, todayISO } from '../../src/tracking.js';

const cliente = {
  entity_id: 'ent_1',
  name: 'Cliente',
  customFields: { tipoTercero: 'cliente' },
};
const proveedor = {
  entity_id: 'ent_2',
  name: 'Proveedor',
  customFields: { tipoTercero: 'proveedor' },
};

function ventaVenta(status, endDate, total = 100) {
  return {
    document_id: `v_${status}_${endDate}`,
    entity_id: 'ent_1',
    startDate: '2026-01-01',
    endDate,
    totalAmount: total,
    status,
    customFields: { tipoFactura: 'venta' },
  };
}

function compraEmitida(endDate, total = 200) {
  return {
    document_id: `c_${endDate}`,
    entity_id: 'ent_2',
    startDate: '2026-01-01',
    endDate,
    totalAmount: total,
    status: 'Emitida',
    customFields: { tipoFactura: 'compra' },
  };
}

describe('tracking (FR-023 a FR-025)', () => {
  const hoy = '2026-11-05';

  it('calcula el total por cobrar del cliente con facturas Emitidas', () => {
    const resumen = computeDebtSummary(
      [cliente],
      [ventaVenta('Emitida', '2026-12-01', 150)],
      { today: hoy }
    );
    expect(resumen.totalPorCobrar).toBe(150);
    expect(
      resumen.summary.find((entry) => entry.entity_id === 'ent_1').porCobrar
    ).toBe(150);
  });

  it('calcula el total por pagar al proveedor con facturas Emitidas', () => {
    const resumen = computeDebtSummary(
      [proveedor],
      [compraEmitida('2026-12-01', 250)],
      { today: hoy }
    );
    expect(resumen.totalPorPagar).toBe(250);
    expect(
      resumen.summary.find((entry) => entry.entity_id === 'ent_2').porPagar
    ).toBe(250);
  });

  it('excluye Borrador, Pagada y no vencidas del cálculo de deuda', () => {
    const resumen = computeDebtSummary(
      [cliente, proveedor],
      [
        ventaVenta('Borrador', '2026-01-01', 999),
        ventaVenta('Pagada', '2026-01-01', 888),
      ],
      { today: hoy }
    );
    expect(resumen.totalPorCobrar).toBe(0);
    expect(resumen.totalPorPagar).toBe(0);
  });

  it('marca como vencida solo una Emitida con endDate estrictamente anterior a hoy', () => {
    const conAyer = [
      ventaVenta('Emitida', '2026-11-04'),
      ventaVenta('Emitida', '2026-11-05'),
    ];
    const resumen = computeDebtSummary([cliente], conAyer, { today: hoy });
    expect(resumen.vencidas).toHaveLength(1);
    expect(
      resumen.summary.find((entry) => entry.entity_id === 'ent_1').vencidas
    ).toBe(1);
    expect(isOverdue(conAyer[0], hoy)).toBe(true);
    expect(isOverdue(conAyer[1], hoy)).toBe(false);
  });

  it('no cuenta una Pagada como vencida aunque su endDate haya pasado', () => {
    const pagada = ventaVenta('Pagada', '2026-01-01');
    expect(isOverdue(pagada, hoy)).toBe(false);
  });

  it('usa la fecha actual por defecto cuando no se entrega explicitamente', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
