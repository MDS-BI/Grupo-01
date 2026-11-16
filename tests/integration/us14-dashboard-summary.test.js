import { beforeEach, describe, expect, it } from 'vitest';
import { initApp } from '../../src/app.js';
import { getConfig } from '../../src/module-config.js';
import { addDocument, addEntity, updateDocument } from '../../src/storage.js';
import { loadAppMarkup } from '../setup/domFixture.js';

const config = getConfig();

function createInvoice({
  entity,
  tipoFactura,
  folio,
  total,
  extra = {},
  pay = false,
}) {
  const customFields = { tipoFactura, ...extra };
  const document = addDocument(
    {
      entity_id: entity.entity_id,
      series: 'A',
      folio,
      startDate: '2026-01-10',
      endDate: '2026-02-10',
      totalAmount: total,
      customFields,
    },
    config
  );

  const emissionFields = {
    ...customFields,
    ...(tipoFactura === 'compra' ? { centroCosto: 'Consumible' } : {}),
  };

  updateDocument(
    document.document_id,
    { status: 'Emitida', customFields: emissionFields },
    config
  );

  if (pay) {
    updateDocument(
      document.document_id,
      {
        status: 'Pagada',
        customFields: {
          ...emissionFields,
          montoPagado: total,
          fechaPago: '2026-02-05',
        },
      },
      config
    );
  }

  return document;
}

function text(id) {
  return document.getElementById(id).textContent;
}

beforeEach(() => {
  loadAppMarkup();
  localStorage.clear();
});

describe('Panel - resumen financiero y accesos rapidos', () => {
  it('calcula saldo, deuda y caja desde entidades, facturas y movimientos reales', () => {
    const cliente = addEntity(
      {
        name: 'Cliente Uno',
        code: 'CL-1',
        customFields: { tipoTercero: 'cliente' },
      },
      config
    );
    const proveedor = addEntity(
      {
        name: 'Proveedor Uno',
        code: 'PV-1',
        customFields: { tipoTercero: 'proveedor' },
      },
      config
    );
    const personal = addEntity(
      {
        name: 'Trabajador Uno',
        code: 'PE-1',
        customFields: { tipoTercero: 'personal' },
      },
      config
    );

    createInvoice({
      entity: cliente,
      tipoFactura: 'venta',
      folio: 1,
      total: 1000,
      pay: true,
    });
    createInvoice({
      entity: proveedor,
      tipoFactura: 'compra',
      folio: 2,
      total: 300,
      pay: true,
    });
    createInvoice({
      entity: personal,
      tipoFactura: 'compra',
      folio: 3,
      total: 200,
      pay: true,
      extra: { periodoLiquidacion: '2026-01' },
    });
    createInvoice({
      entity: cliente,
      tipoFactura: 'venta',
      folio: 4,
      total: 500,
    });
    createInvoice({
      entity: proveedor,
      tipoFactura: 'compra',
      folio: 5,
      total: 100,
    });

    initApp(config);

    expect(text('summary-saldo')).toBe('400');
    expect(text('summary-deuda')).toBe('600');
    expect(text('summary-caja')).toBe('500');
  });

  it('redirige los botones de accion rapida a sus vistas y formularios', () => {
    initApp(config);

    const accesos = [
      ['qa-new-entity', 'entities'],
      ['qa-new-invoice-sale', 'invoice-sale'],
      ['qa-new-invoice-purchase', 'invoice-purchase'],
      ['qa-new-payroll', 'invoice-purchase'],
      ['qa-cashflow', 'cashflow'],
      ['qa-movements', 'movements'],
      ['qa-tracking', 'tracking'],
    ];

    for (const [buttonId, view] of accesos) {
      document.getElementById(buttonId).click();
      expect(document.getElementById(`view-${view}`).hidden).toBe(false);
    }

    document.getElementById('qa-new-entity').click();
    expect(document.getElementById('entity-form')).toBeTruthy();
    document.getElementById('qa-new-invoice-sale').click();
    expect(document.getElementById('invoice-sale-form')).toBeTruthy();
    document.getElementById('qa-new-invoice-purchase').click();
    expect(document.getElementById('invoice-purchase-form')).toBeTruthy();
  });
});
