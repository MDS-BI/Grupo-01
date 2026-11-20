import { beforeEach, describe, expect, it } from 'vitest';
import {
  addDocument,
  addEntity,
  savePayrollSettlements,
} from '../../src/storage.js';
import {
  resolveWorkerPaymentHistory,
  resolveWorkerSettlement,
} from '../../src/payroll.js';
import { validateSettlement } from '../../src/validation.js';
import { userConfig } from '../../src/module-config.js';

function worker() {
  return addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22222222-2',
      customFields: { tipoTercero: 'personal' },
    },
    userConfig
  );
}

function documentFor(entity, data = {}) {
  return addDocument(
    {
      entity_id: entity.entity_id,
      folio: 1,
      series: 'LIQ',
      startDate: '2026-10-01',
      endDate: '2026-10-28',
      totalAmount: 700000,
      status: 'Borrador',
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        periodoLiquidacion: '2026-10',
        fechaPago: '2026-10-15',
        ...data.customFields,
      },
      ...data,
    },
    userConfig
  );
}

function settlement(entity, overrides = {}) {
  return {
    settlementId: 'set_1',
    documentId: 'doc_1',
    entityId: entity.entity_id,
    periodo: '2026-10',
    sueldoBase: 500000,
    descuentos: 20000,
    bonos: 220000,
    monto: 700000,
    estado: 'Pagada',
    fechaPago: '2026-10-15',
    ...overrides,
  };
}

describe('separación factura de compra / LiquidacionSueldo', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('valida que documentId apunte solo a una factura de compra', () => {
    const ana = worker();
    const sale = {
      document_id: 'doc_sale',
      entity_id: ana.entity_id,
      customFields: { tipoFactura: 'venta' },
    };
    const purchase = documentFor(ana);
    const record = settlement(ana, { documentId: sale.document_id });

    expect(
      validateSettlement(record, {
        entities: [ana],
        documents: [sale, purchase],
        settlements: [],
      })
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_DOCUMENT_TYPE' }),
      ])
    );
  });

  it('impide duplicar documentId en la colección persistida', () => {
    const ana = worker();
    const purchase = documentFor(ana);
    savePayrollSettlements([
      settlement(ana, { documentId: purchase.document_id }),
    ]);

    expect(() =>
      savePayrollSettlements([
        settlement(ana, {
          settlementId: 'set_2',
          documentId: purchase.document_id,
        }),
      ])
    ).toThrow();
  });

  it('excluye del historial las liquidaciones no pagadas', () => {
    const ana = worker();
    const paid = settlement(ana, { settlementId: 'set_paid' });
    const emitted = settlement(ana, {
      settlementId: 'set_emitted',
      documentId: 'doc_emitted',
      estado: 'Emitida',
      fechaPago: '2026-10-15',
    });

    expect(
      resolveWorkerPaymentHistory({
        entityId: ana.entity_id,
        settlements: [paid, emitted],
        entities: [ana],
      }).map((item) => item.settlementId)
    ).toEqual(['set_paid']);
  });

  it('permite que la última liquidación no esté pagada', () => {
    const ana = worker();
    const draft = settlement(ana, {
      estado: 'Borrador',
      fechaPago: null,
    });

    expect(
      resolveWorkerSettlement({
        entityId: ana.entity_id,
        settlements: [draft],
        entities: [ana],
      })
    ).toEqual(draft);
  });
});
