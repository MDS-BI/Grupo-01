import { beforeEach, describe, expect, it } from 'vitest';
import { editDocument, initApp, requestDeleteDocument } from '../../src/app.js';
import { userConfig } from '../../src/module-config.js';
import {
  addDocument,
  addEntity,
  loadPayrollSettlements,
  loadPurchaseInvoices,
  savePayrollSettlements,
} from '../../src/storage.js';
import { loadAppMarkup, setupFinanzasSession } from '../setup/domFixture.js';

const byId = (id) => document.getElementById(id);

function seedLinkedInvoice() {
  const worker = addEntity(
    {
      name: 'Ana Pérez Soto',
      code: 'PE-001',
      taxId: '22.222.222-2',
      customFields: { tipoTercero: 'personal', rut: '22222222-2' },
    },
    userConfig
  );
  const invoice = addDocument(
    {
      entity_id: worker.entity_id,
      folio: 11,
      series: 'LIQ',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      totalAmount: 700000,
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        periodoLiquidacion: '2026-10',
      },
    },
    userConfig
  );
  savePayrollSettlements([
    {
      settlementId: 'set_linked',
      documentId: invoice.document_id,
      entityId: worker.entity_id,
      periodo: '2026-10',
      sueldoBase: 490000,
      descuentos: 0,
      bonos: 210000,
      monto: 700000,
      estado: 'Emitida',
      fechaPago: null,
    },
  ]);
  return invoice;
}

describe('finanzas - facturas vinculadas a liquidaciones', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    loadAppMarkup();
  });

  it('muestra la factura vinculada en solo lectura y bloquea edición/eliminación directa', () => {
    const invoice = seedLinkedInvoice();
    setupFinanzasSession();
    initApp(userConfig);

    byId('nav-invoice-purchase').click();
    const row = byId('invoice-purchase-list').querySelector(
      `tr[data-id="${invoice.document_id}"]`
    );
    expect(row).not.toBeNull();
    expect(row.querySelector('[data-action="edit"]')).toBeNull();
    expect(row.querySelector('[data-action="delete"]')).toBeNull();
    expect(row.textContent.toLowerCase()).toContain('solo lectura');

    const invoicesBefore = loadPurchaseInvoices();
    const settlementsBefore = loadPayrollSettlements();
    window.confirm = () => true;

    editDocument(invoice.document_id);
    requestDeleteDocument(invoice.document_id);

    expect(loadPurchaseInvoices()).toEqual(invoicesBefore);
    expect(loadPayrollSettlements()).toEqual(settlementsBefore);
    expect(
      byId('view-invoice-purchase').querySelector('[data-invoice-feedback]')
        .textContent
    ).toContain('solo lectura para finanzas');
  });
});
