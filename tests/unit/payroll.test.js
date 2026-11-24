import { describe, expect, it } from 'vitest';
import {
  resolveAdminSettlements,
  resolveWorkerSettlement,
} from '../../src/payroll.js';

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
    document_id: 'doc_1',
    entity_id: 'ent_worker',
    totalAmount: 700000,
    status: 'Pagada',
    startDate: '2026-10-01',
    createdAt: '2026-10-01T12:00:00.000Z',
    customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-10' },
    ...overrides,
  };
}

describe('payroll: liquidación vigente del trabajador', () => {
  it('elige el período más reciente', () => {
    const old = settlement({
      document_id: 'old',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-09' },
    });
    const recent = settlement();
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        purchaseInvoices: [old, recent],
        entities,
      }).document_id
    ).toBe('doc_1');
  });

  it('desempata por startDate y luego por createdAt', () => {
    const earlier = settlement({
      document_id: 'earlier',
      startDate: '2026-10-01',
      createdAt: '2026-10-05T12:00:00.000Z',
    });
    const newer = settlement({
      document_id: 'newer',
      startDate: '2026-10-05',
      createdAt: '2026-10-01T12:00:00.000Z',
    });
    const newestCreated = settlement({
      document_id: 'newest-created',
      startDate: '2026-10-05',
      createdAt: '2026-10-09T12:00:00.000Z',
    });

    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        purchaseInvoices: [earlier, newer],
        entities,
      }).document_id
    ).toBe('newer');
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        purchaseInvoices: [newer, newestCreated],
        entities,
      }).document_id
    ).toBe('newest-created');
  });

  it('excluye terceros no personales y entidades inexistentes', () => {
    const supplierInvoice = settlement({
      document_id: 'supplier-invoice',
      entity_id: 'ent_supplier',
    });
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        purchaseInvoices: [supplierInvoice],
        entities,
      })
    ).toBeNull();
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_missing',
        purchaseInvoices: [settlement()],
        entities,
      })
    ).toBeNull();
  });

  it('devuelve null sin liquidación', () => {
    expect(
      resolveWorkerSettlement({
        entityId: 'ent_worker',
        purchaseInvoices: [],
        entities,
      })
    ).toBeNull();
  });
});

describe('payroll: listado del administrador', () => {
  const invoices = [
    settlement(),
    settlement({
      document_id: 'doc_2',
      entity_id: 'ent_other',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-09' },
    }),
    settlement({
      document_id: 'doc_3',
      entity_id: 'ent_supplier',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-10' },
    }),
  ];

  it('incluye solo facturas a terceros personales', () => {
    const result = resolveAdminSettlements({
      purchaseInvoices: invoices,
      entities,
    });
    expect(result.map((item) => item.document_id)).toEqual(['doc_1', 'doc_2']);
  });

  it('filtra por trabajador/RUT y por período', () => {
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { worker: 'Bruno' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_2']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { period: '2026-10' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_1']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { worker: '22222222-2' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_1']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { worker: '45000000-0' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_2']);
  });
});

describe('payroll: búsqueda por RUT del administrador', () => {
  const invoices = [
    settlement(),
    settlement({
      document_id: 'doc_2',
      entity_id: 'ent_other',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-09' },
    }),
    settlement({
      document_id: 'doc_3',
      entity_id: 'ent_supplier',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-10' },
    }),
  ];

  it('filtra por RUT parcial con puntos y guion', () => {
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '22.222' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_1']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '45.000.000-' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_2']);
  });

  it('filtra por RUT completo insensible a formato y mayúsculas', () => {
    const kWorker = {
      entity_id: 'ent_k',
      name: 'Clara Ruiz',
      taxId: '12.345.678-k',
      customFields: { tipoTercero: 'personal' },
    };
    const kInvoice = settlement({
      document_id: 'doc_k',
      entity_id: 'ent_k',
    });

    expect(
      resolveAdminSettlements({
        purchaseInvoices: [kInvoice],
        entities: [...entities, kWorker],
        filters: { rut: '12345678K' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_k']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '45.000.000-0' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_2']);
  });

  it('RUT vacío no filtra y sin coincidencias devuelve []', () => {
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '   ' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_1', 'doc_2']);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '99.999.999-9' },
      })
    ).toEqual([]);
  });

  it('combina RUT con los filtros existentes en AND', () => {
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '22222222-2', period: '2026-09' },
      })
    ).toEqual([]);
    expect(
      resolveAdminSettlements({
        purchaseInvoices: invoices,
        entities,
        filters: { rut: '45000000-0', period: '2026-09' },
      }).map((item) => item.document_id)
    ).toEqual(['doc_2']);
  });

  it('aplica el filtro RUT también a liquidaciones estructuradas', () => {
    const structured = [
      {
        settlementId: 'set_1',
        documentId: 'doc_1',
        entityId: 'ent_worker',
        periodo: '2026-10',
        monto: 700000,
        estado: 'Pagada',
      },
      {
        settlementId: 'set_2',
        documentId: 'doc_2',
        entityId: 'ent_other',
        periodo: '2026-09',
        monto: 620000,
        estado: 'Emitida',
      },
    ];

    expect(
      resolveAdminSettlements({
        settlements: structured,
        entities,
        filters: { rut: '45.000.000-0' },
      }).map((item) => item.settlementId)
    ).toEqual(['set_2']);
  });
});
