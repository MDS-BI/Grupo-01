import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEYS,
  backfillPayrollSettlements,
  loadPayrollSettlements,
  saveEntities,
  savePayrollSettlements,
  savePurchaseInvoices,
  saveSaleInvoices,
} from '../../src/storage.js';

const worker = {
  entity_id: 'ent_worker',
  name: 'Ana Pérez',
  taxId: '22222222-2',
  customFields: { tipoTercero: 'personal' },
};
const supplier = {
  entity_id: 'ent_supplier',
  name: 'Proveedores del Sur',
  customFields: { tipoTercero: 'proveedor' },
};

function purchase(overrides = {}) {
  return {
    document_id: 'doc_1',
    entity_id: 'ent_worker',
    folio: 1,
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    totalAmount: 700000,
    status: 'Pagada',
    createdAt: '2026-10-01T12:00:00.000Z',
    customFields: {
      tipoFactura: 'compra',
      periodoLiquidacion: '2026-10',
      fechaPago: '2026-10-10',
      montoPagado: 700000,
    },
    ...overrides,
  };
}

function seed(invoices = [purchase()]) {
  localStorage.clear();
  saveEntities([worker, supplier]);
  savePurchaseInvoices(invoices);
  saveSaleInvoices([
    {
      document_id: 'sale_1',
      entity_id: 'ent_supplier',
      folio: 9,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalAmount: 100,
      status: 'Borrador',
      customFields: { tipoFactura: 'venta' },
    },
  ]);
}

describe('backfill de payrollSettlements', () => {
  it('crea liquidaciones solo para compras a terceros personales', () => {
    seed([
      purchase(),
      purchase({
        document_id: 'doc_supplier',
        entity_id: 'ent_supplier',
        customFields: { tipoFactura: 'compra' },
      }),
    ]);

    const result = backfillPayrollSettlements();

    expect(result.ok).toBe(true);
    expect(result.created).toBe(1);
    const settlements = loadPayrollSettlements();
    expect(settlements).toHaveLength(1);
    expect(settlements[0]).toMatchObject({
      documentId: 'doc_1',
      entityId: 'ent_worker',
      periodo: '2026-10',
      sueldoBase: 0,
      descuentos: 0,
      bonos: 0,
      monto: 700000,
      estado: 'Pagada',
      fechaPago: '2026-10-10',
    });
    expect(settlements[0].settlementId).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.migrationPayrollSettlements)).toBe(
      'done'
    );
    expect(localStorage.getItem(STORAGE_KEYS.schemaVersion)).toBe('2.0.0');
  });

  it('es idempotente por documentId y conserva desgloses existentes', () => {
    seed();
    savePayrollSettlements([
      {
        settlementId: 'set_existing',
        documentId: 'doc_1',
        entityId: 'ent_worker',
        periodo: '2026-10',
        sueldoBase: 123,
        descuentos: 45,
        bonos: 6,
        monto: 700000,
        estado: 'Pagada',
        fechaPago: '2026-10-10',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-10T12:00:00.000Z',
      },
    ]);
    localStorage.removeItem(STORAGE_KEYS.migrationPayrollSettlements);

    const first = backfillPayrollSettlements();
    const second = backfillPayrollSettlements();

    expect(first.created).toBe(0);
    expect(second.created).toBe(0);
    expect(loadPayrollSettlements()).toHaveLength(1);
    expect(loadPayrollSettlements()[0].sueldoBase).toBe(123);
    expect(localStorage.getItem(STORAGE_KEYS.migrationPayrollSettlements)).toBe(
      'done'
    );
  });
});
