import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { loadMovements } from '../../src/movements.js';
import {
  addEntity,
  loadDocuments,
  updateDocument,
  ValidationFailure,
} from '../../src/storage.js';
import {
  invoiceField as field,
  loadAppMarkup,
  setupAdminSession,
  submit,
} from '../setup/domFixture.js';

const sale = 'invoice-sale';
const purchase = 'invoice-purchase';
const byId = (id) => document.getElementById(id);

function createThirdParty(tipoTercero, taxId) {
  return addEntity({
    name: tipoTercero,
    code: tipoTercero,
    taxId,
    customFields: { tipoTercero },
  });
}

function fill(view, values) {
  for (const [key, value] of Object.entries(values)) {
    field(view, key).value = value;
    field(view, key).dispatchEvent(new Event('change'));
  }
}

function draft(view, entity, values = {}) {
  fill(view, {
    entity_id: entity.entity_id,
    folio: '21',
    startDate: '2026-01-03',
    endDate: '2026-01-30',
    totalAmount: '1500',
    ...values,
  });
  submit(`${view}-form`);
  return loadDocuments().at(-1);
}

function edit(view) {
  byId(`${view}-list`).querySelector('[data-action="edit"]').click();
}

describe('Punto 5 - facturas de venta y compra', () => {
  let client;
  let supplier;

  beforeEach(() => {
    loadAppMarkup();
    setupAdminSession();
    client = createThirdParty('cliente', '76.000.001-9');
    supplier = createThirdParty('proveedor', '76.000.002-7');
    initApp();
  });

  it('separa navegación, terceros, campos, edición y tablas', () => {
    expect(byId('nav-documents')).toBeNull();
    expect(byId('view-documents')).toBeNull();
    expect(byId('qa-new-document')).toBeNull();

    byId('qa-new-invoice-sale').click();
    expect(byId('view-invoice-sale').hidden).toBe(false);
    expect(byId('view-invoice-purchase').hidden).toBe(true);
    expect(field(sale, 'centroCosto')).toBeNull();
    expect(field(sale, 'tipoFactura')).toBeNull();
    expect(
      Array.from(field(sale, 'entity_id').options, ({ value }) => value)
    ).toEqual(['', client.entity_id]);

    const sold = draft(sale, client, { salesOrderId: 'OV-33' });
    edit(sale);
    expect(field(sale, 'folio').readOnly).toBe(true);
    expect(field(sale, 'startDate').readOnly).toBe(true);
    expect(field(sale, 'endDate').readOnly).toBe(true);
    field(sale, 'notes').value = 'Nota de venta';

    byId('qa-new-invoice-purchase').click();
    expect(byId('view-invoice-sale').hidden).toBe(true);
    expect(byId('view-invoice-purchase').hidden).toBe(false);
    expect(field(purchase, 'salesOrderId')).toBeNull();
    expect(field(purchase, 'tipoFactura')).toBeNull();
    expect(
      Array.from(field(purchase, 'entity_id').options, ({ value }) => value)
    ).toEqual(['', supplier.entity_id]);
    const bought = draft(purchase, supplier, { centroCosto: 'Activo' });

    byId('nav-invoice-sale').click();
    expect(field(sale, 'notes').value).toBe('Nota de venta');
    submit(`${sale}-form`);
    expect(loadDocuments()).toHaveLength(2);
    expect(loadDocuments()[0]).toMatchObject({
      document_id: sold.document_id,
      notes: 'Nota de venta',
      customFields: { tipoFactura: 'venta', salesOrderId: 'OV-33' },
    });
    expect(bought.customFields).toMatchObject({
      tipoFactura: 'compra',
      centroCosto: 'Activo',
    });

    initApp();
    const sales = byId('invoice-sale-list');
    const purchases = byId('invoice-purchase-list');
    expect(
      sales.querySelector('[data-id="' + sold.document_id + '"]')
    ).not.toBeNull();
    expect(
      sales.querySelector('[data-id="' + bought.document_id + '"]')
    ).toBeNull();
    expect(
      purchases.querySelector('[data-id="' + bought.document_id + '"]')
    ).not.toBeNull();
    expect(
      purchases.querySelector('[data-id="' + sold.document_id + '"]')
    ).toBeNull();
    expect(
      Array.from(sales.querySelectorAll('thead th'), (th) => th.textContent)
    ).toEqual([
      'Folio',
      'Estado',
      'Emisión',
      'Vencimiento',
      'Total',
      'Orden de venta',
      'Acciones',
    ]);
    expect(
      Array.from(purchases.querySelectorAll('thead th'), (th) => th.textContent)
    ).toEqual([
      'Folio',
      'Estado',
      'Emisión',
      'Vencimiento',
      'Total',
      'Centro de costo',
      'Período de liquidación',
      'Acciones',
    ]);
    expect(() =>
      updateDocument(sold.document_id, {
        entity_id: supplier.entity_id,
        customFields: { tipoFactura: 'compra', centroCosto: 'Activo' },
      })
    ).toThrow(ValidationFailure);
  });

  it('conserva folio y fechas y propaga la orden de venta al movimiento', () => {
    byId('nav-invoice-sale').click();
    const sold = draft(sale, client, { salesOrderId: 'OV-58' });
    updateDocument(sold.document_id, {
      folio: 99,
      startDate: '2025-01-04',
      endDate: '2025-01-11',
    });
    expect(loadDocuments()[0]).toMatchObject({
      folio: 21,
      startDate: '2026-01-03',
      endDate: '2026-01-30',
    });

    edit(sale);
    fill(sale, { status: 'Emitida' });
    submit(`${sale}-form`);
    expect(loadMovements()).toMatchObject([
      {
        tipo: 'cargo',
        document_id: sold.document_id,
        entity_id: client.entity_id,
        salesOrderId: 'OV-58',
      },
    ]);
  });

  it('exige un período de liquidación para personal y lo mantiene fuera de las compras a proveedor', () => {
    const staff = createThirdParty('personal', '76.000.003-5');
    byId('nav-invoice-purchase').click();
    fill(purchase, { entity_id: supplier.entity_id });
    expect(
      field(purchase, 'periodoLiquidacion').closest('.form-field').hidden
    ).toBe(true);
    draft(purchase, staff, { centroCosto: 'Consumible' });
    expect(
      field(purchase, 'periodoLiquidacion').closest('.form-field').hidden
    ).toBe(false);
    expect(
      field(purchase, 'periodoLiquidacion').getAttribute('aria-invalid')
    ).toBe('true');
    expect(loadDocuments()).toEqual([]);

    fill(purchase, { periodoLiquidacion: '2026-01' });
    submit(`${purchase}-form`);
    expect(loadDocuments()[0]).toMatchObject({
      entity_id: staff.entity_id,
      status: 'Borrador',
      customFields: { tipoFactura: 'compra', periodoLiquidacion: '2026-01' },
    });
    expect(byId('invoice-purchase-list').textContent).toContain('2026-01');
  });

  it('valida y conserva los datos de compra al emitir y pagar', () => {
    byId('nav-invoice-purchase').click();
    const bought = draft(purchase, supplier, {
      referenciaOtroModulo: 'REF-56',
    });
    edit(purchase);
    fill(purchase, { status: 'Emitida' });
    submit(`${purchase}-form`);
    expect(field(purchase, 'centroCosto').getAttribute('aria-invalid')).toBe(
      'true'
    );
    expect(loadDocuments()[0].status).toBe('Borrador');
    expect(loadMovements()).toHaveLength(0);

    fill(purchase, { centroCosto: 'Consumible' });
    submit(`${purchase}-form`);
    edit(purchase);
    fill(purchase, {
      status: 'Pagada',
      montoPagado: '1500',
      fechaPago: '2026-01-20',
    });
    submit(`${purchase}-form`);
    expect(loadDocuments()[0]).toMatchObject({
      status: 'Pagada',
      customFields: {
        tipoFactura: 'compra',
        centroCosto: 'Consumible',
        referenciaOtroModulo: 'REF-56',
      },
    });
    expect(loadMovements()).toMatchObject([
      {
        tipo: 'abono',
        document_id: bought.document_id,
        entity_id: supplier.entity_id,
        centroCosto: 'Consumible',
      },
      {
        tipo: 'pago',
        document_id: bought.document_id,
        entity_id: supplier.entity_id,
        centroCosto: 'Consumible',
        fecha: '2026-01-20',
      },
    ]);
  });
});
