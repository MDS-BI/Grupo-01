import { describe, expect, it } from 'vitest';
import {
  resolveAdminSettlements,
  resolveWorkerPaymentHistory,
  resolveWorkerSettlement,
} from '../../src/payroll.js';
import { validateSettlement } from '../../src/validation.js';

const worker = {
  entity_id: 'ent_worker',
  name: 'Ana Pérez Soto',
  taxId: '22222222-2',
  customFields: { tipoTercero: 'personal' },
};
const otherWorker = {
  entity_id: 'ent_other',
  name: 'Bruno Soto Vega',
  taxId: '45000000-0',
  customFields: { tipoTercero: 'personal' },
};
const supplier = {
  entity_id: 'ent_supplier',
  name: 'Proveedores del Sur',
  customFields: { tipoTercero: 'proveedor' },
};
const entities = [worker, otherWorker, supplier];

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

function invoice(overrides = {}) {
  return {
    document_id: 'doc_1',
    entity_id: 'ent_worker',
    startDate: '2026-10-01',
    customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-10' },
    ...overrides,
  };
}

describe('resolvers de payrollSettlements', () => {
  it('resuelve la última liquidación sin exigir Pagada', () => {
    const draft = settlement({
      settlementId: 'set_draft',
      documentId: 'doc_draft',
      periodo: '2026-11',
      estado: 'Borrador',
      fechaPago: null,
    });
    const paid = settlement();
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        settlements: [paid, draft],
        purchaseInvoices: [
          invoice(),
          invoice({ document_id: 'doc_draft', startDate: '2026-11-01' }),
        ],
        entities,
      }).settlementId
    ).toBe('set_draft');
  });

  it('desempata por startDate y luego por createdAt de la factura', () => {
    const earlier = settlement({ settlementId: 'set_a', documentId: 'doc_a' });
    const newerStart = settlement({
      settlementId: 'set_b',
      documentId: 'doc_b',
    });
    const newestCreated = settlement({
      settlementId: 'set_c',
      documentId: 'doc_c',
      createdAt: '2026-10-09T12:00:00.000Z',
    });
    const invoices = [
      invoice({ document_id: 'doc_a', startDate: '2026-10-01' }),
      invoice({ document_id: 'doc_b', startDate: '2026-10-05' }),
      invoice({ document_id: 'doc_c', startDate: '2026-10-05' }),
    ];
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        settlements: [earlier, newerStart],
        purchaseInvoices: invoices,
        entities,
      }).settlementId
    ).toBe('set_b');
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        settlements: [newerStart, newestCreated],
        purchaseInvoices: invoices,
        entities,
      }).settlementId
    ).toBe('set_c');
  });

  it('devuelve null para terceros no personales o sin liquidación', () => {
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        settlements: [],
        purchaseInvoices: [],
        entities,
      })
    ).toBeNull();
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_supplier',
        settlements: [settlement({ entityId: 'ent_supplier' })],
        purchaseInvoices: [invoice({ entity_id: 'ent_supplier' })],
        entities,
      })
    ).toBeNull();
  });

  it('filtra y ordena el historial pagado con desempate por período', () => {
    const october = settlement();
    const novemberEarlier = settlement({
      settlementId: 'set_nov_early',
      documentId: 'doc_nov_early',
      periodo: '2026-11',
      fechaPago: '2026-11-05',
    });
    const novemberLater = settlement({
      settlementId: 'set_nov_later',
      documentId: 'doc_nov_later',
      periodo: '2026-12',
      fechaPago: '2026-11-05',
    });
    const draft = settlement({
      settlementId: 'set_draft',
      documentId: 'doc_draft',
      estado: 'Borrador',
      fechaPago: null,
    });
    const emitted = settlement({
      settlementId: 'set_emitted',
      documentId: 'doc_emitted',
      estado: 'Emitida',
      fechaPago: '2026-10-09',
    });
    const other = settlement({
      settlementId: 'set_other',
      documentId: 'doc_other',
      entityId: 'ent_other',
    });

    expect(
      resolveWorkerPaymentHistory({
        entityId: 'ent_worker',
        settlements: [
          october,
          novemberEarlier,
          novemberLater,
          draft,
          emitted,
          other,
        ],
      }).map((item) => item.settlementId)
    ).toEqual(['set_nov_later', 'set_nov_early', 'set_1']);
  });

  it('lista y filtra liquidaciones para administrador y finanzas', () => {
    const other = settlement({
      settlementId: 'set_other',
      documentId: 'doc_other',
      entityId: 'ent_other',
      periodo: '2026-09',
      monto: 620000,
    });
    const supplierSettlement = settlement({
      settlementId: 'set_supplier',
      documentId: 'doc_supplier',
      entityId: 'ent_supplier',
    });
    const all = [settlement(), other, supplierSettlement];

    expect(
      resolveAdminSettlements({
        settlements: all,
        purchaseInvoices: [],
        entities,
      }).map((item) => item.settlementId)
    ).toEqual(['set_1', 'set_other']);
    expect(
      resolveAdminSettlements({
        settlements: all,
        purchaseInvoices: [],
        entities,
        filters: { worker: '45000000-0' },
      }).map((item) => item.settlementId)
    ).toEqual(['set_other']);
    expect(
      resolveAdminSettlements({
        settlements: all,
        purchaseInvoices: [],
        entities,
        filters: { period: '2026-10' },
      }).map((item) => item.settlementId)
    ).toEqual(['set_1']);
    expect(
      resolveAdminSettlements({
        settlements: all,
        purchaseInvoices: [],
        entities,
        filters: { entityId: 'ent_worker' },
      }).map((item) => item.settlementId)
    ).toEqual(['set_1']);
  });
});

describe('validación de LiquidacionSueldo', () => {
  const documents = [
    {
      document_id: 'doc_1',
      entity_id: 'ent_worker',
      totalAmount: 900000,
      status: 'Pagada',
      customFields: {
        tipoFactura: 'compra',
        fechaPago: '2026-10-10',
        periodoLiquidacion: '2026-10',
      },
    },
  ];

  it('acepta una liquidación válida', () => {
    expect(
      validateSettlement(settlement(), { entities, documents, settlements: [] })
    ).toEqual([]);
  });

  it('rechaza duplicados, desglose negativo y fecha de pago inválida', () => {
    const errors = validateSettlement(settlement(), {
      entities,
      documents,
      settlements: [settlement()],
    });
    expect(errors.map((error) => error.code)).toContain('DUPLICATE');
    expect(
      validateSettlement(settlement({ sueldoBase: -1 }), {
        entities,
        documents,
        settlements: [],
      }).map((error) => error.code)
    ).toContain('NEGATIVE_NOT_ALLOWED');
    expect(
      validateSettlement(settlement({ fechaPago: '10-10-2026' }), {
        entities,
        documents,
        settlements: [],
      }).map((error) => error.code)
    ).toContain('INVALID_DATE');
  });
});
